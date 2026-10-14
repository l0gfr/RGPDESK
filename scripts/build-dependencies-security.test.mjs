import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import test from "node:test";

const webRequire = createRequire(new URL("../apps/web/package.json", import.meta.url));
const astroRequire = createRequire(webRequire.resolve("astro/package.json"));
const postcssRequire = createRequire(astroRequire.resolve("postcss/package.json"));
const { SourceMapConsumer, SourceNode } = postcssRequire("source-map-js");
const toml = astroRequire("smol-toml");

function atLeast(version, minimum) {
  const parts = (value) => {
    assert.match(value, /^\d+\.\d+\.\d+$/);
    return value.split(".").map(Number);
  };
  const actual = parts(version);
  const expected = parts(minimum);
  for (let index = 0; index < 3; index += 1) {
    if (actual[index] !== expected[index]) return actual[index] > expected[index];
  }
  return true;
}

function indexed(line, column = 0, map = {
  version: 3, sources: ["synthetic.js"], sourcesContent: ["const x = 1;\n"], names: [], mappings: "AAAA",
}) {
  return { version: 3, sections: [{ offset: { line, column }, map }] };
}

test("PostCSS resolves the patched source-map-js dependency", () => {
  assert.ok(atLeast(postcssRequire("source-map-js/package.json").version, "1.2.2"));
});

test("Indexed source maps reject invalid offsets before constructing output", () => {
  // Tiny metadata only: never serialize or allocate the described line gaps.
  for (const offset of [-1, 1.5, "1", null, Infinity, NaN]) {
    assert.throws(() => new SourceMapConsumer(indexed(offset)));
    assert.throws(() => new SourceMapConsumer(indexed(0, offset)));
  }
  assert.throws(() => new SourceMapConsumer(indexed(10_000_001)), /must not exceed/);
  assert.throws(() => new SourceMapConsumer(indexed(5_000_001, 0, indexed(5_000_001))), /nested sections/);
});

test("Ordinary indexed source maps retain their positions and generated content", () => {
  const consumer = new SourceMapConsumer(indexed(2));
  assert.deepEqual(consumer.originalPositionFor({ line: 3, column: 1 }), {
    source: "synthetic.js", line: 1, column: 0, name: null,
  });
  assert.equal(SourceNode.fromStringWithSourceMap("\n\nconst x = 1;\n", consumer).toString(), "\n\nconst x = 1;\n");
});

test("Astro resolves a TOML parser with the upstream linear-key parsing fix", () => {
  const manifest = JSON.parse(readFileSync(join(dirname(astroRequire.resolve("smol-toml")), "../package.json"), "utf8"));
  assert.ok(atLeast(manifest.version, "1.9.0"));
});

test("Astro's TOML parser preserves ordinary keys, tables and error handling", () => {
  const source = 'title = "Démo"\n[organisation]\nactive = true\n"nom complet" = "Exemple"\nservices = ["DPO", "Direction"]\n';
  // The updated parser returns tables without an inherited object prototype.
  assert.deepEqual(toml.parse(source), Object.assign(Object.create(null), {
    title: "Démo", organisation: Object.assign(Object.create(null), {
      active: true, "nom complet": "Exemple", services: ["DPO", "Direction"],
    }),
  }));
  assert.deepEqual(toml.parse(toml.stringify(toml.parse(source))), toml.parse(source));
  assert.throws(() => toml.parse("duplicate = 1\nduplicate = 2\n"));
  assert.throws(() => toml.parse('name = "unterminated\n'));
});

test("Sharp loads the corrected SVG decoder and renders controlled geometry", async () => {
  for (const require of [webRequire, astroRequire]) {
    const sharp = require("sharp");
    assert.ok(atLeast(sharp.versions.sharp, "0.35.5"));
    assert.ok(atLeast(sharp.versions.rsvg, "2.63.2"));
    const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect width="8" height="8" fill="#334e68"/></svg>');
    const rendered = await sharp(svg).png().toBuffer({ resolveWithObject: true });
    assert.equal(rendered.info.width, 8);
    assert.equal(rendered.info.height, 8);
    assert.equal(rendered.info.format, "png");
    assert.ok(rendered.data.length > 0 && rendered.data.length < 4096);
  }
});
