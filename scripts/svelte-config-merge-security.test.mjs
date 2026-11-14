import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import test from "node:test";
import { readBoundedRegularFile } from "./shared/bounded-file-read.mjs";

const webRequire = createRequire(new URL("../apps/web/package.json", import.meta.url));
const integrationRequire = createRequire(webRequire.resolve("@astrojs/svelte"));
const pluginEntry = integrationRequire.resolve("@sveltejs/vite-plugin-svelte");
const pluginRequire = createRequire(pluginEntry);
const utils = join(dirname(pluginEntry), "utils");
const merge = pluginRequire(join(utils, "safe-merge.cjs"));

function ownPrototype(prototype = Object.prototype) {
  return Object.defineProperty(Object.create(prototype), "__proto__", {
    value: { localMarker: true }, enumerable: true, writable: true, configurable: true,
  });
}

function assertOwnData(result) {
  assert.equal(Object.getPrototypeOf(result), Object.prototype);
  assert.equal(Object.hasOwn(result, "localMarker"), false);
  assert.equal(result.localMarker, undefined);
  assert.deepEqual(Object.getOwnPropertyDescriptor(result, "__proto__"), {
    value: { localMarker: true }, writable: true, enumerable: true, configurable: true,
  });
  assert.equal(Object.hasOwn(Object.prototype, "localMarker"), false);
}

test("Svelte plugin uses the reviewed helper and removes the vulnerable package edge", () => {
  const source = readBoundedRegularFile(join(utils, "options.js"), 100_000).toString("utf8");
  assert.ok(source.includes("import deepmerge from './safe-merge.cjs';"));
  assert.ok(!source.includes("from 'deepmerge'"));
  assert.throws(() => pluginRequire.resolve("deepmerge"), { code: "MODULE_NOT_FOUND" });
  const metadata = JSON.parse(readBoundedRegularFile(join(dirname(pluginEntry), "../package.json"), 100_000));
  assert.equal(metadata.dependencies.deepmerge, undefined);
  const lock = readBoundedRegularFile(new URL("../pnpm-lock.yaml", import.meta.url), 1_000_000).toString("utf8");
  assert.ok(!/^  deepmerge@/m.test(lock));
  const license = readBoundedRegularFile(join(dirname(pluginEntry), "../LICENSE.deepmerge"), 10_000).toString("utf8");
  assert.match(license, /James Halliday, Josh Duff, and other contributors/);
  assert.match(license, /The MIT License/);
});

test("Svelte config merge protects null-prototype source and target", () => {
  assertOwnData(merge(Object.create(null), ownPrototype(null)));
});

test("Svelte config merge protects target cloning", () => {
  assertOwnData(merge(ownPrototype(), {}));
});

test("Svelte config merge protects nested and array-contained objects", () => {
  assertOwnData(merge({ nested: Object.create(null) }, { nested: ownPrototype(null) }).nested);
  const cloned = merge([], [ownPrototype()])[0];
  assert.equal(Object.getPrototypeOf(cloned), Object.prototype);
  assert.equal(cloned.localMarker, undefined);
  assert.equal(Object.hasOwn(cloned, "__proto__"), false);
});

test("Svelte config merge protects custom merge assignment", () => {
  const returned = { localMarker: true };
  const result = merge(ownPrototype(), ownPrototype(), { customMerge: () => () => returned });
  assertOwnData(result);
  assert.equal(result.__proto__, returned);
});

test("Svelte config merge preserves symbols, ordinary data keys and cloning", () => {
  const symbol = Symbol("__proto__");
  const input = { nested: { value: 1 }, list: [{ value: 2 }], [symbol]: "local" };
  const result = merge(input, { nested: { other: 3 }, list: [4] });
  assert.deepEqual(result, { nested: { value: 1, other: 3 }, list: [{ value: 2 }, 4], [symbol]: "local" });
  assert.notEqual(result.nested, input.nested);
  assert.notEqual(result.list[0], input.list[0]);
  const ownKeys = Object.assign(Object.create(null), { constructor: "local", prototype: "data" });
  assert.deepEqual(merge(ownKeys, {}), { constructor: "local", prototype: "data" });
});

test("Svelte config merge preserves replacement arrays, special values and explicit hooks", () => {
  const arrays = [".custom"];
  assert.equal(merge({ extensions: [".svelte"] }, { extensions: arrays }, { arrayMerge: (_target, source) => source }).extensions, arrays);
  const date = new Date("2026-01-01T00:00:00Z");
  const expression = /local/;
  const fn = () => "local";
  const nested = { value: 1 };
  const result = merge({}, { date, expression, fn, nested }, { clone: false });
  assert.equal(result.date, date);
  assert.equal(result.expression, expression);
  assert.equal(result.fn, fn);
  assert.equal(result.nested, nested);
  assert.deepEqual(merge.all([{ a: 1 }, { b: 2 }]), { a: 1, b: 2 });
  assert.throws(() => merge.all({}), /first argument should be an array/);
});

test("Actual Svelte option preparation retains array overrides and compiler options", async () => {
  const { preResolveOptions } = await import(pathToFileURL(join(utils, "options.js")).href);
  const result = await preResolveOptions({ configFile: false, extensions: [".custom"], compilerOptions: { dev: false } }, { root: process.cwd() }, { command: "build", mode: "production" });
  assert.deepEqual(result.extensions, [".custom"]);
  assert.equal(result.compilerOptions.dev, false);
  assert.equal(result.emitCss, true);
  assert.equal(result.isBuild, true);
});
