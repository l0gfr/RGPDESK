import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { Readable, Writable } from "node:stream";
import { pipeline } from "node:stream/promises";
import test from "node:test";

// Exercise the npm dependency used by unifont, not Node's embedded fetch.
const webRequire = createRequire(new URL("../apps/web/package.json", import.meta.url));
const astroRequire = createRequire(webRequire.resolve("astro/package.json"));
const fontRequire = createRequire(astroRequire.resolve("unifont"));
const { fetch, MockAgent } = fontRequire("undici");
const { EventSourceStream } = fontRequire(join(dirname(fontRequire.resolve("undici/package.json")), "lib/web/eventsource/eventsource-stream.js"));

for (const algorithm of ["sha256", "SHA256", "sHa256"]) {
  test(`Undici enforces integrity for ${algorithm} without network access`, async () => {
    const dispatcher = new MockAgent();
    dispatcher.disableNetConnect();
    const body = "synthetic local fixture";
    const hash = createHash("sha256").update(body).digest("base64");
    const otherHash = createHash("sha256").update("different fixture").digest("base64");
    const pool = dispatcher.get("https://example.invalid");
    try {
      for (const digest of [hash, otherHash]) {
        pool.intercept({ path: "/fixture" }).reply(200, body);
        const request = fetch("https://example.invalid/fixture", { dispatcher, integrity: `${algorithm}-${digest}` });
        if (digest === hash) assert.equal(await (await request).text(), body);
        else await assert.rejects(request, /fetch failed/);
      }
      dispatcher.assertNoPendingInterceptors();
    } finally {
      await dispatcher.close();
    }
  });
}

async function parseEvents(chunks, limit) {
  const events = [];
  await pipeline(Readable.from(chunks.map((chunk) => Buffer.from(chunk))), new EventSourceStream({ maxEventSize: limit }), new Writable({ objectMode: true, write(event, _encoding, done) { events.push(event); done(); } }));
  return events;
}

test("Undici bounds incomplete and ignored EventSource lines with tiny limits", async () => {
  for (const chunks of [[":" + "a".repeat(24)], ["unknown: " + "b".repeat(24) + "\n"]]) {
    await assert.rejects(parseEvents(chunks, 16), /message size exceeded/);
  }
});

test("Undici preserves small streamed events and resets the per-event limit", async () => {
  const events = await parseEvents(["data: a\n", "\n", "data: b\n\n"], 16);
  assert.deepEqual(events.map((event) => event.options.data), ["a", "b"]);
});
