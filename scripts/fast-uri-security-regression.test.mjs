import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";

// Exercise Ajv's real transitive resolver, never an extra test-only installation.
for (const [consumer, manifest] of [
  ["schema generators", "../package.json"],
  ["core", "../packages/core/package.json"],
  ["verifier", "../packages/verifier/package.json"],
]) {
  const consumerRequire = createRequire(new URL(manifest, import.meta.url));
  const ajvRequire = createRequire(consumerRequire.resolve("ajv/package.json"));
  const uri = ajvRequire("fast-uri");

  test(`${consumer}: malformed authority brackets fail closed (GHSA-58mr-gqgx-xq4g)`, () => {
    // Reserved documentation names only; these inputs never cause a request.
    for (const input of [
      "https://[example.invalid/",
      "https://example.invalid]/",
      "https://[not-an-ip]/",
      "https://[fe80/",
      "https://user@[@example.invalid/",
    ]) {
      assert.equal(uri.parse(input).error, "URI host is malformed.");
      assert.equal(uri.normalize(input), input);
      assert.equal(uri.equal(input, input), false);
      assert.throws(() => uri.resolve(input, "child"), /malformed/);
      assert.throws(() => uri.resolve("https://example.invalid/", input), /malformed/);
    }
  });

  test(`${consumer}: valid URI and schema reference behavior is preserved`, () => {
    for (const input of ["https://example.invalid/", "https://[2001:db8::1]/", "urn:example:rgpdesk"]) {
      assert.equal(uri.parse(input).error, undefined);
      assert.equal(uri.equal(input, input), true);
    }
    assert.equal(uri.parse("https://[2001:db8::1]/").host, "2001:db8::1");
    assert.equal(uri.normalize("HTTPS://EXAMPLE.INVALID:443/a"), "https://example.invalid/a");
    assert.equal(uri.resolve("https://example.invalid/schemas/master.json", "types.json#/$defs/name"), "https://example.invalid/schemas/types.json#/$defs/name");

    const { default: Ajv2020 } = consumerRequire("ajv/dist/2020.js");
    const ajv = new Ajv2020({ strict: true });
    ajv.addSchema({ $id: "https://example.invalid/schemas/types.json", $defs: { name: { type: "string", minLength: 1 } } });
    const validate = ajv.compile({ $id: "https://example.invalid/schemas/master.json", $ref: "types.json#/$defs/name" });
    assert.equal(validate("Exemple fictif"), true);
    assert.equal(validate(42), false);
    assert.equal(validate(""), false);
  });
}
