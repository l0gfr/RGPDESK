import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { posix, win32 } from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

// Use Vitest's actual dependency and Vite's actual allowlist. These tests only
// register synthetic paths in memory: no socket, server or file-loading hook.
const rootRequire = createRequire(new URL("../package.json", import.meta.url));
const vitestManifest = rootRequire("vitest/package.json");
const vitestRequire = createRequire(rootRequire.resolve("vitest/package.json"));
const mockerManifest = vitestRequire("@vitest/mocker/package.json");
const { interceptorPlugin } = await import(pathToFileURL(vitestRequire.resolve("@vitest/mocker/node")).href);
const { MockerRegistry } = await import(pathToFileURL(vitestRequire.resolve("@vitest/mocker")).href);
const root = "/synthetic/allowlisted-root";

function registration(options = {}) {
  const registry = new MockerRegistry();
  const callbacks = new Map();
  const acknowledgements = [];
  const plugin = interceptorPlugin({ registry, ...options });
  plugin.configureServer({
    config: {
      root,
      server: { fs: { strict: true, allow: [root] } },
      safeModulePaths: new Set(),
      fsDenyGlob: () => false,
    },
    ws: {
      on: (name, callback) => callbacks.set(name, callback),
      send: (name) => acknowledgements.push(name),
    },
  });
  return { registry, callbacks, acknowledgements };
}

function register(state, redirect) {
  const event = { type: "redirect", id: "/synthetic-module", url: "/synthetic-module", raw: "synthetic", redirect };
  const callback = state.callbacks.get("vitest:interceptor:register");
  assert.equal(typeof callback, "function");
  callback(event);
  return state.registry.getById(event.id);
}

test("Vitest resolves a synchronized patched mocker in its existing major line", () => {
  const [major, minor, patch] = mockerManifest.version.split(".").map(Number);
  assert.ok(major === 4 && (minor > 1 || (minor === 1 && patch >= 12)));
  assert.equal(mockerManifest.version, vitestManifest.version);
});

for (const [label, pathname] of [
  ["forward separators", "../outside.js"],
  ["backslash separators", "..\\outside.js"],
  ["mixed nested separators", "folder/..\\..\\outside.js"],
]) {
  test(`Redirect registration excludes outside-root ${label} (GHSA-xp26-3454-mjgp)`, () => {
    const state = registration();
    assert.equal(register(state, `synthetic:${pathname}`), undefined);
    assert.deepEqual(state.acknowledgements, ["vitest:interceptor:register:result"]);
  });
}

for (const [label, pathname, expected] of [
  ["ordinary module", "folder/module.js", "folder/module.js"],
  ["nested backslash module", "folder\\module.js", "folder/module.js"],
  ["filename containing a space", "folder/my module.js", "folder/my module.js"],
]) {
  test(`Redirect registration preserves the ${label} inside the allowlist`, () => {
    const state = registration();
    const mock = register(state, `synthetic:${pathname}`);
    assert.ok(mock);
    assert.equal(mock.redirect, posix.join(root, expected));
    // The accepted path must stay inside the same root under Windows semantics.
    const relative = win32.relative(root, mock.redirect);
    assert.ok(relative !== ".." && !relative.startsWith("..\\") && !win32.isAbsolute(relative));
    assert.deepEqual(state.acknowledgements, ["vitest:interceptor:register:result"]);
  });
}

test("Disabling public WebSocket registration leaves handlers unregistered", () => {
  const state = registration({ registerWebSocketEvents: false });
  assert.equal(state.callbacks.size, 0);
  assert.deepEqual(state.acknowledgements, []);
});
