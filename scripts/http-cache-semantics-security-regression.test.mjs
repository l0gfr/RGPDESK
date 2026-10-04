import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

// Resolve the production consumer's dependency, not a test-only installation.
const webRequire = createRequire(new URL("../apps/web/package.json", import.meta.url));
const astroManifest = webRequire.resolve("astro/package.json");
const astroRequire = createRequire(astroManifest);
const CachePolicy = astroRequire("http-cache-semantics");
const { loadRemoteImage, revalidateRemoteImage } = await import(
  pathToFileURL(join(dirname(astroManifest), "dist/assets/build/remote.js")).href
);
const url = "https://example.invalid/image.png";
const request = (headers = {}) => ({ url, method: "GET", headers });
const response = (headers) => ({ status: 200, headers });

test("Astro resolves the reviewed official cache policy version", () => {
  const metadata = astroRequire("http-cache-semantics/package.json");
  assert.equal(metadata.version, "4.3.0");
  assert.equal(metadata.license, "BSD-2-Clause");
});

test("The cache policy marks private and no-store responses as not storable", () => {
  for (const control of ["private", "no-store", "no-store, max-age=600"]) {
    const policy = new CachePolicy(request(), response({ "cache-control": control }));
    assert.equal(policy.storable(), false);
    assert.equal(policy.storable() ? policy.timeToLive() : 0, 0);
  }
});

test("Astro image loading preserves public TTL and expires private responses immediately", async () => {
  // All responses are in memory; no network request or real image is involved.
  for (const control of ["private", "no-store", "public, max-age=600"]) {
    const before = Date.now();
    const loaded = await loadRemoteImage(url, async () => new Response("fictional image", {
      headers: { "cache-control": control, etag: "fictional-version" },
    }));
    const after = Date.now();
    assert.equal(loaded.data.toString(), "fictional image");
    assert.equal(loaded.etag, "fictional-version");
    if (control.startsWith("public")) {
      assert.ok(loaded.expires > after && loaded.expires <= after + 600_000);
    } else {
      assert.ok(loaded.expires >= before && loaded.expires <= after);
    }
  }
});

test("Astro's not-modified path preserves a no-store response and prior ETag", async () => {
  const before = Date.now();
  const loaded = await revalidateRemoteImage(url, { etag: "fictional-version" }, async (req) => {
    assert.equal(req.headers.get("If-None-Match"), "fictional-version");
    return new Response(null, { status: 304, headers: { "cache-control": "no-store" } });
  });
  assert.equal(loaded.data, null);
  assert.equal(loaded.etag, "fictional-version");
  assert.ok(loaded.expires >= before && loaded.expires <= Date.now());
});

test("Vary wildcard spellings never reuse a cached response", () => {
  for (const vary of ["*", " * ", "accept, *", "*, accept"]) {
    const policy = new CachePolicy(request({ accept: "image/png" }), response({
      "cache-control": "public, max-age=600", vary,
    }));
    assert.equal(policy.satisfiesWithoutRevalidation(request({ accept: "image/png" })), false);
  }
});

test("Vary matches owned headers and ignores inherited header values", () => {
  const policy = new CachePolicy(request({ accept: "image/png" }), response({
    "cache-control": "public, max-age=600", vary: "accept",
  }));
  assert.equal(policy.satisfiesWithoutRevalidation(request({ accept: "image/png" })), true);
  assert.equal(policy.satisfiesWithoutRevalidation(request({ accept: "image/jpeg" })), false);
  assert.equal(policy.satisfiesWithoutRevalidation(request(Object.create({ accept: "image/png" }))), false);
  assert.equal(policy.satisfiesWithoutRevalidation(request(Object.assign(Object.create(null), { accept: "image/png" }))), true);
});
