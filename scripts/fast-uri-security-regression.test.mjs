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

  test(`${consumer}: encoded schemes and ambiguous hosts fail closed`, () => {
    for (const input of ["ht%74ps://example.invalid/", "%u0068ttps://example.invalid/"]) {
      assert.equal(uri.parse(input).error, "URI scheme is malformed.");
      assert.equal(uri.normalize(input), input);
      assert.equal(uri.equal(input, "https://example.invalid/"), false);
      assert.throws(() => uri.resolve("https://example.invalid/base/", input), /malformed/);
    }
    for (const input of ["https://a@b@example.invalid/", "https://exa\tmple.invalid/"]) {
      assert.equal(uri.parse(input).error, "URI host is malformed.");
      assert.equal(uri.equal(input, input), false);
      assert.throws(() => uri.resolve("https://example.invalid/", input), /malformed/);
    }
  });

  test(`${consumer}: relative and suffix normalization preserves reference meaning`, () => {
    for (const input of ["../x", "a/../b", "x/..", "a/..//x", "./local:value"]) {
      const normalized = uri.normalize(input);
      assert.equal(uri.normalize(normalized), normalized);
      assert.equal(uri.resolve("https://example.invalid/a/b/", normalized), uri.resolve("https://example.invalid/a/b/", input));
    }
    assert.equal(uri.equal("../x", "x"), false);
    const suffix = uri.serialize({ scheme: "example", path: "local:value" }, { reference: "suffix" });
    assert.equal(uri.parse(suffix).scheme, undefined);
    assert.match(suffix, /local%3Avalue/i);
  });

  test(`${consumer}: equivalent host spellings normalize consistently (GHSA-hrr3-gc8f-f4qj)`, () => {
    // Reserved documentation names only; normalization never causes a request.
    for (const input of ["//EXAMPLE.INVALID", "//%45XAMPLE.INVALID", "//example.invalid"]) {
      assert.equal(uri.parse(input).host, "example.invalid");
      assert.equal(uri.normalize(input), "//example.invalid");
      assert.equal(uri.equal(input, "//example.invalid"), true);
    }
  });

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
