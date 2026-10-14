import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import test from "node:test";
import { AuthorizationServerMismatchError, fetchToken } from "@modelcontextprotocol/client";

// Resolve the schemas used by this client, rather than the server's older core.
const require = createRequire(import.meta.url);
const clientRequire = createRequire(require.resolve("@modelcontextprotocol/client"));
const { OAuthTokensSchema, OAuthClientInformationSchema } = await import(
  pathToFileURL(clientRequire.resolve("@modelcontextprotocol/core")).href
);
const issuer = "https://authorization.example.invalid";
const otherIssuer = "https://different-authorization.example.invalid";

function provider() {
  return {
    clientMetadata: {},
    clientInformation: () => ({
      client_id: "synthetic-client", client_secret: "synthetic-secret", issuer,
    }),
    prepareTokenRequest: () => new URLSearchParams({ grant_type: "client_credentials" }),
  };
}

function metadata(value) {
  return {
    issuer: value,
    token_endpoint: `${value}/token`,
    token_endpoint_auth_methods_supported: ["client_secret_post"],
  };
}

test("OAuth credentials are refused for a different server before any request (GHSA-6qxp-vccf-f47h)", async () => {
  // Synthetic inputs and injected fetch only; this never connects to a server.
  for (const server of [otherIssuer, new URL(otherIssuer)]) {
    let requests = 0;
    await assert.rejects(fetchToken(provider(), server, {
      fetchFn: () => { requests += 1; throw new Error("Unexpected request"); },
    }), AuthorizationServerMismatchError);
    assert.equal(requests, 0);
  }
});

test("OAuth metadata cannot redirect bound credentials to a different issuer", async () => {
  let requests = 0;
  await assert.rejects(fetchToken(provider(), issuer, {
    metadata: metadata(otherIssuer),
    fetchFn: () => { requests += 1; throw new Error("Unexpected request"); },
  }), AuthorizationServerMismatchError);
  assert.equal(requests, 0);
});

test("OAuth token requests still work for the matching issuer", async () => {
  for (const server of [issuer, new URL(issuer)]) {
    let requests = 0;
    const tokens = await fetchToken(provider(), server, {
      metadata: metadata(issuer),
      fetchFn: (url, init) => {
        requests += 1;
        assert.equal(String(url), `${issuer}/token`);
        assert.equal(init.method, "POST");
        const body = new URLSearchParams(init.body);
        assert.equal(body.get("client_id"), "synthetic-client");
        assert.equal(body.get("client_secret"), "synthetic-secret");
        return Promise.resolve(Response.json({
          access_token: "synthetic-access-token", token_type: "Bearer",
        }));
      },
    });
    assert.equal(requests, 1);
    assert.equal(tokens.access_token, "synthetic-access-token");
  }
});

test("The client's token schema retains issuer bindings on storage round-trip", () => {
  const stored = { access_token: "synthetic-access-token", token_type: "Bearer", issuer };
  assert.deepEqual(OAuthTokensSchema.parse(JSON.parse(JSON.stringify(stored))), stored);
});

test("The client's registration schema retains issuer bindings on storage round-trip", () => {
  const stored = { client_id: "synthetic-client", client_secret: "synthetic-secret", issuer };
  assert.deepEqual(OAuthClientInformationSchema.parse(JSON.parse(JSON.stringify(stored))), stored);
});
