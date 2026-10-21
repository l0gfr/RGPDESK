import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { createContext, Script } from "node:vm";
import { readBoundedRegularFile } from "./shared/bounded-file-read.mjs";

const rootRequire = createRequire(new URL("../package.json", import.meta.url));
const webRequire = createRequire(new URL("../apps/web/package.json", import.meta.url));
const consumers = [
  ["root", rootRequire],
  ["Astro", createRequire(webRequire.resolve("astro/package.json"))],
  ["Vitest", createRequire(rootRequire.resolve("vitest/package.json"))],
];
const bundles = new Map();

for (const [consumer, require] of consumers) {
  const manifestPath = require.resolve("vite/package.json");
  const manifest = JSON.parse(readBoundedRegularFile(manifestPath, 100_000).toString("utf8"));
  test(`${consumer} resolves patched Vite 8.2.4`, () => {
    assert.equal(manifest.version, "8.2.4");
  });
  if (!bundles.has(manifestPath)) bundles.set(manifestPath, manifest.version);
}

function readBundle(packagePath) {
  const directory = path.join(path.dirname(packagePath), "dist/node/chunks");
  const files = readdirSync(directory).filter((name) => name.endsWith(".js"));
  assert.ok(files.length > 0 && files.length <= 64, "Unexpected Vite bundle inventory");
  let remainingBytes = 8_000_000;
  return files.map((name) => {
    const file = path.join(directory, name);
    const content = readBoundedRegularFile(file, remainingBytes);
    remainingBytes -= content.length;
    return content.toString("utf8");
  }).join("\n");
}

function moduleBody(source, name, optional = false) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const region = new RegExp(`//#region [^\\n]*/launch-editor/${escaped}\\r?\\n([\\s\\S]*?)//#endregion`, "g");
  const matches = [...source.matchAll(region)];
  if (optional && matches.length === 0) return null;
  assert.equal(matches.length, 1, `Expected one bundled launch-editor/${name}`);
  const wrapped = matches[0][1];
  const start = wrapped.indexOf("=> {");
  const end = wrapped.lastIndexOf("}));");
  assert.ok(start >= 0 && end > start, `Unsupported wrapper for ${name}`);
  const body = wrapped.slice(start + 4, end);
  assert.ok(body.length > 0 && body.length < 16_000, `Unexpected helper size: ${name}`);
  return body;
}

function helperBody(source, name, version) {
  const current = moduleBody(source, name, true);
  if (current !== null) return current;
  // The old bundle is supported only to demonstrate failing regressions before
  // the upgrade. Extract its pure statements, never its launcher or editor guesser.
  assert.equal(version, "8.2.1", `Missing patched bundled helper: ${name}`);
  const launcher = moduleBody(source, "index.js");
  if (name === "parse-file.js") {
    const start = launcher.indexOf("const positionRE =");
    const end = launcher.indexOf("let currentChildProcess =", start);
    assert.ok(start >= 0 && end > start, "Missing legacy path parser");
    return `${launcher.slice(start, end)}\nmodule.exports = parseFile;`;
  }
  assert.equal(name, "construct-windows-launch-command.js");
  const start = launcher.indexOf("function escapeCmdArgs(");
  const end = launcher.indexOf("currentChildProcess =", start);
  assert.ok(start >= 0 && end > start, "Missing legacy Windows command constructor");
  return `module.exports = function (editor, args) {\n${launcher.slice(start, end)}\nreturn launchCommand;\n};`;
}

function loadHelper(source, name, version, platform = "linux", wsl = false) {
  const basePath = platform === "win32" ? path.win32 : path.posix;
  const cwd = platform === "win32" ? "C:\\synthetic\\project" : wsl ? "/mnt/c/project" : "/synthetic/project";
  const purePath = Object.freeze({
    basename: basePath.basename,
    resolve: (...parts) => basePath.resolve(cwd, ...parts),
    relative: (from, to) => basePath.relative(basePath.resolve(cwd, from), basePath.resolve(cwd, to)),
  });
  const allowed = new Map([
    ["path", purePath],
    ["os", Object.freeze({ release: () => wsl ? "synthetic-Microsoft" : "synthetic" })],
    ["url", Object.freeze({ fileURLToPath })],
  ]);
  const context = createContext({
    module: { exports: {} },
    process: Object.freeze({ platform, env: Object.freeze({}) }),
    __require: (name) => {
      assert.ok(allowed.has(name), `Unexpected helper dependency: ${name}`);
      return allowed.get(name);
    },
  }, { codeGeneration: { strings: false, wasm: false } });
  const body = helperBody(source, name, version);
  assert.ok(!/child_process|childProcess|currentChildProcess|guessEditor/.test(body), "Launcher code is forbidden in the helper VM");
  new Script(`"use strict";\n${body}`, { filename: `vite-${name}` }).runInContext(context, { timeout: 100 });
  assert.equal(typeof context.module.exports, "function", `Missing helper export: ${name}`);
  const invoke = new Script("module.exports(...syntheticArguments)");
  return (...args) => {
    context.syntheticArguments = args;
    const result = invoke.runInContext(context, { timeout: 100 });
    return JSON.parse(JSON.stringify(result));
  };
}

for (const [packagePath, version] of bundles) {
  const source = readBundle(packagePath);

  test("Bundled editor arguments protect option-like filenames (GHSA-r825-w8mm-5pxw)", () => {
    const args = loadHelper(source, "get-args.js", version);
    for (const editor of ["vim", "mvim", "emacs", "notepad++"]) {
      for (const file of ["+synthetic-marker", "-synthetic-marker"]) {
        assert.equal(args(editor, file, "10", "5").at(-1), `/synthetic/project/${file}`);
        assert.deepEqual(args(editor, file), [`/synthetic/project/${file}`]);
      }
    }
  });

  test("Bundled WSL editor arguments prefix relative filenames (GHSA-r825-w8mm-5pxw)", () => {
    const args = loadHelper(source, "get-args.js", version, "linux", true);
    assert.equal(args("vim", "+synthetic-marker", "10", "5").at(-1), "./+synthetic-marker");
    assert.deepEqual(args("vim", "-synthetic-marker"), ["./-synthetic-marker"]);
  });

  test("Bundled Windows parser normalizes after position removal (GHSA-587h-7wmj-h5pm)", () => {
    const parse = loadHelper(source, "parse-file.js", version, "win32");
    assert.deepEqual(parse("C:\\synthetic\\project\\missing\\..:10:5"), {
      fileName: "C:\\synthetic\\project", lineNumber: "10", columnNumber: "5",
    });
    assert.equal(parse(":1:1").fileName, "");
  });

  test("Bundled Windows constructor rejects percent expansion (GHSA-698v-4r3x-3vcv)", () => {
    const command = loadHelper(source, "construct-windows-launch-command.js", version, "win32");
    for (const file of ["C:\\synthetic\\100%\\file.js", "C:\\synthetic\\%SYNTHETIC%\\file.js", "C:\\synthetic\\%SYNTHETIC:old=new%\\file.js"]) {
      assert.throws(() => command("code", [file]), /argument containing "%"/);
    }
  });

  test("Bundled Windows constructor rejects command line separators", () => {
    const command = loadHelper(source, "construct-windows-launch-command.js", version, "win32");
    for (const separator of ["\r", "\n"]) {
      assert.throws(() => command("code", [`C:\\synthetic\\file.js${separator}synthetic-marker`]), /argument containing a line break/);
    }
  });

  test("Bundled editor helpers preserve ordinary positioned filenames", () => {
    const args = loadHelper(source, "get-args.js", version);
    assert.deepEqual(args("code", "/synthetic/project/file.js", "10", "5"), ["-r", "-g", "/synthetic/project/file.js:10:5"]);
    assert.deepEqual(args("vim", "/synthetic/project/file.js", "10", "5"), ["+call cursor(10, 5)", "/synthetic/project/file.js"]);
    const parse = loadHelper(source, "parse-file.js", version);
    assert.deepEqual(parse("/synthetic/project/file.js:10:5"), { fileName: "/synthetic/project/file.js", lineNumber: "10", columnNumber: "5" });
    assert.equal(parse("file:///synthetic/project/file.js:10:5").fileName, "/synthetic/project/file.js");
  });

  test("Bundled Windows constructor preserves route syntax and quotes paths", () => {
    const command = loadHelper(source, "construct-windows-launch-command.js", version, "win32");
    for (const file of ["+page.svelte", "$route.tsx", "(group)\\page.tsx", "@route\\page.tsx", "[slug]\\page.tsx"]) {
      assert.equal(command("code", [file]), `code ${file}`);
    }
    assert.equal(command("C:\\Program Files\\Code.exe", ["C:\\my project\\file.js"]), '"C:\\Program Files\\Code.exe" "C:\\my project\\file.js"');
    assert.equal(command("code", ["C:\\synthetic\\&file.js"]), 'code ^"C:\\synthetic\\^&file.js^"');
  });
}
