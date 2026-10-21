import assert from "node:assert/strict";
import test from "node:test";
import { Client, fetchToken, StreamableHTTPClientTransport } from "@modelcontextprotocol/client";
import { InMemoryTransport, McpServer, requireBearerAuth, Server } from "@modelcontextprotocol/server";
import * as z from "zod/v4";

// SDK-only regressions: the product stays stdio-only. Every HTTP response is
// synthetic and injected; these tests never listen, connect or launch a process.
const issuer = "https://authorization.example.invalid";
const endpoint = "https://mcp.example.invalid/mcp";
const foreignOrigin = "https://foreign.example.invalid";
const notification = { jsonrpc: "2.0", method: "notifications/synthetic", params: { value: "synthetic-body" } };

function provider() {
  return {
    clientMetadata: {},
    clientInformation: () => ({ client_id: "synthetic-client", client_secret: "synthetic-secret", issuer }),
    prepareTokenRequest: () => new URLSearchParams({ grant_type: "client_credentials" }),
  };
}

const metadata = {
  issuer,
  token_endpoint: `${issuer}/token`,
  token_endpoint_auth_methods_supported: ["client_secret_post"],
};

function redirectingFetch(initial, destination, status, terminalResponse) {
  const requests = [];
  async function fetchFn(input, init) {
    assert.ok(requests.length < 2, "Only one redirect is needed for this bounded fixture");
    const request = new Request(input, init);
    const body = await request.clone().text();
    requests.push({ url: request.url, method: request.method, headers: request.headers, body });
    if (request.url === destination) return terminalResponse();
    assert.equal(request.url, initial);
    // Emulate native fetch, including its default automatic following of a
    // 307/308 POST. An injected fetch that always returned the raw 3xx would
    // conceal the old SDK's actual cross-origin body/header disclosure.
    if (request.redirect === "error") throw new TypeError("Synthetic redirect refused");
    if (request.redirect === "manual") return new Response(null, { status, headers: { location: destination } });
    const headers = new Headers(request.headers);
    if (new URL(destination).origin !== new URL(initial).origin) {
      headers.delete("authorization");
      headers.delete("cookie");
    }
    return fetchFn(destination, { method: request.method, headers, body, redirect: request.redirect });
  }
  return { fetchFn, requests };
}

function tokenResponse() {
  return Response.json({ access_token: "synthetic-access-token", token_type: "Bearer" });
}

function httpTransport(fetchFn) {
  return new StreamableHTTPClientTransport(new URL(endpoint), {
    fetch: fetchFn,
    requestInit: { headers: { "X-API-Key": "synthetic-api-key" } },
    sessionId: "synthetic-session",
  });
}

for (const status of [307, 308]) {
  test(`OAuth refuses a cross-origin ${status} before forwarding credentials (GHSA-6prh-2h8m-c8cw)`, async () => {
    const { fetchFn, requests } = redirectingFetch(metadata.token_endpoint, `${foreignOrigin}/token`, status, tokenResponse);
    const [outcome] = await Promise.allSettled([fetchToken(provider(), issuer, { metadata, fetchFn })]);
    assert.equal(requests.filter(request => new URL(request.url).origin === foreignOrigin).length, 0,
      "No credential-bearing token body may reach the redirect destination");
    assert.equal(outcome.status, "rejected");
    assert.equal(requests.length, 1);
    assert.equal(new URLSearchParams(requests[0].body).get("client_secret"), "synthetic-secret");
  });

  test(`Streamable HTTP refuses a cross-origin ${status} before forwarding data (GHSA-6prh-2h8m-c8cw)`, async t => {
    const { fetchFn, requests } = redirectingFetch(endpoint, `${foreignOrigin}/mcp`, status,
      () => new Response(null, { status: 202 }));
    const transport = httpTransport(fetchFn);
    t.after(() => transport.close());
    await transport.start();
    const [outcome] = await Promise.allSettled([transport.send(notification)]);
    assert.equal(requests.filter(request => new URL(request.url).origin === foreignOrigin).length, 0,
      "No MCP body, API key or session may reach the redirect destination");
    assert.equal(outcome.status, "rejected");
    assert.equal(requests.length, 1);
    assert.equal(requests[0].headers.get("x-api-key"), "synthetic-api-key");
    assert.equal(requests[0].headers.get("mcp-session-id"), "synthetic-session");
  });

  test(`OAuth retains the POST body and headers across a same-origin ${status}`, async () => {
    const destination = `${issuer}/canonical-token`;
    const { fetchFn, requests } = redirectingFetch(metadata.token_endpoint, destination, status, tokenResponse);
    const tokens = await fetchToken(provider(), issuer, { metadata, fetchFn });
    assert.equal(tokens.access_token, "synthetic-access-token");
    assert.deepEqual(requests.map(request => request.url), [metadata.token_endpoint, destination]);
    for (const request of requests) {
      assert.equal(request.method, "POST");
      assert.equal(request.headers.get("content-type"), "application/x-www-form-urlencoded");
      const body = new URLSearchParams(request.body);
      assert.equal(body.get("client_id"), "synthetic-client");
      assert.equal(body.get("client_secret"), "synthetic-secret");
    }
    assert.equal(requests[1].body, requests[0].body);
  });

  test(`Streamable HTTP retains the POST body and headers across a same-origin ${status}`, async t => {
    const destination = `${endpoint}/canonical`;
    const { fetchFn, requests } = redirectingFetch(endpoint, destination, status,
      () => new Response(null, { status: 202 }));
    const transport = httpTransport(fetchFn);
    t.after(() => transport.close());
    await transport.start();
    await transport.send(notification);
    assert.deepEqual(requests.map(request => request.url), [endpoint, destination]);
    for (const request of requests) {
      assert.equal(request.method, "POST");
      assert.equal(request.headers.get("x-api-key"), "synthetic-api-key");
      assert.equal(request.headers.get("mcp-session-id"), "synthetic-session");
      assert.deepEqual(JSON.parse(request.body), notification);
    }
  });
}

test("Server refuses a concurrent connection, preserves the first and reconnects after close (GHSA-jm63-cq47-j5jp)", { timeout: 5000 }, async t => {
  const server = new Server({ name: "synthetic-connection-test", version: "1.0.0" }, { capabilities: {} });
  const [firstClientTransport, firstServerTransport] = InMemoryTransport.createLinkedPair();
  const [unusedClientTransport, secondServerTransport] = InMemoryTransport.createLinkedPair();
  const firstClient = new Client({ name: "synthetic-first-client", version: "1.0.0" });
  const reconnectedClient = new Client({ name: "synthetic-reconnected-client", version: "1.0.0" });
  t.after(async () => {
    await firstClient.close();
    await reconnectedClient.close();
    await server.close();
    await firstClientTransport.close();
    await unusedClientTransport.close();
  });
  let releaseStart;
  const startGate = new Promise(resolve => { releaseStart = resolve; });
  const originalStart = firstServerTransport.start.bind(firstServerTransport);
  firstServerTransport.start = async () => { await startGate; await originalStart(); };
  const firstConnection = server.connect(firstServerTransport);
  const originalMessageHandler = firstServerTransport.onmessage;
  try {
    await assert.rejects(server.connect(secondServerTransport), error => error.code === "ALREADY_CONNECTED");
    assert.equal(server.transport, firstServerTransport);
    assert.equal(firstServerTransport.onmessage, originalMessageHandler);
    assert.equal(secondServerTransport.onmessage, undefined);
  } finally {
    releaseStart();
    await firstConnection;
  }
  await firstClient.connect(firstClientTransport, { timeout: 1000 });
  assert.deepEqual(await firstClient.ping({ timeout: 1000 }), {});
  await firstClient.close();
  const [newClientTransport, newServerTransport] = InMemoryTransport.createLinkedPair();
  await server.connect(newServerTransport);
  assert.equal(server.transport, newServerTransport);
  await reconnectedClient.connect(newClientTransport, { timeout: 1000 });
  assert.deepEqual(await reconnectedClient.ping({ timeout: 1000 }), {});
});

function audienceGate(resource) {
  return requireBearerAuth({
    expectedResource: new URL(endpoint),
    requiredScopes: ["mcp"],
    verifier: {
      verifyAccessToken: async token => {
        assert.equal(token, "synthetic-token");
        return {
          token, clientId: "synthetic-client", scopes: ["mcp"],
          expiresAt: Math.floor(Date.now() / 1000) + 3600,
          ...(resource === undefined ? {} : { resource: new URL(resource) }),
        };
      },
    },
  });
}

function bearerRequest() {
  return new Request(endpoint, { headers: { authorization: "Bearer synthetic-token" } });
}

for (const [label, resource] of [["foreign", `${foreignOrigin}/mcp`], ["missing", undefined]]) {
  test(`Bearer middleware refuses a token with ${label} audience (GHSA-rvq5-wwqv-78pq)`, async () => {
    const result = await audienceGate(resource)(bearerRequest());
    assert.ok(result instanceof Response, "An unbound token must produce an authentication challenge");
    assert.equal(result.status, 401);
    assert.match(result.headers.get("www-authenticate"), /Bearer .*invalid_token/);
    assert.equal((await result.json()).error, "invalid_token");
  });
}

test("Bearer middleware accepts a verified token for the matching audience", async () => {
  const result = await audienceGate(endpoint)(bearerRequest());
  assert.ok(!(result instanceof Response));
  assert.equal(String(result.resource), endpoint);
  assert.equal(result.clientId, "synthetic-client");
});

test("McpServer enforces the configured tool-input element boundary before execution (GHSA-46jr-4wx8-v453)", { timeout: 5000 }, async t => {
  const server = new McpServer({ name: "synthetic-input-limit", version: "1.0.0" }, { maxToolInputElements: 2 });
  let handlerCalls = 0;
  server.registerTool("synthetic_count", { inputSchema: z.strictObject({ items: z.array(z.string()) }) }, ({ items }) => {
    handlerCalls += 1;
    return { content: [{ type: "text", text: String(items.length) }] };
  });
  const client = new Client({ name: "synthetic-input-client", version: "1.0.0" });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  t.after(async () => { await client.close(); await server.close(); });
  await server.connect(serverTransport);
  await client.connect(clientTransport, { timeout: 1000 });
  const call = items => client.callTool({ name: "synthetic_count", arguments: { items } }, { timeout: 1000 });
  // One object member plus one array entry is exactly two elements.
  const boundary = await call(["a"]);
  assert.notEqual(boundary.isError, true);
  assert.equal(boundary.content[0].text, "1");
  assert.equal(handlerCalls, 1);
  const refused = await call(["a", "b"]);
  assert.equal(refused.isError, true);
  assert.match(refused.content[0].text, /maximum of 2 elements/);
  assert.equal(handlerCalls, 1, "Over-budget inputs must never reach the tool handler");
  const recovered = await call(["c"]);
  assert.notEqual(recovered.isError, true);
  assert.equal(recovered.content[0].text, "1");
  assert.equal(handlerCalls, 2);
});
