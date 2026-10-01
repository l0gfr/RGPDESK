import assert from "node:assert/strict";
import fs from "node:fs";
import { execFileSync, spawnSync } from "node:child_process";
import { syncBuiltinESMExports } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { readBoundedRegularFile } from "./shared/bounded-file-read.mjs";
import { scanVersionableFiles } from "./check-secrets.mjs";

function fixture(t, content = "ordinary local input") {
  const root = fs.mkdtempSync(join(tmpdir(), "rgpdesk-bounded-read-"));
  const path = join(root, "input.txt");
  fs.writeFileSync(path, content);
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return { root, path };
}

function interceptRead(t, action) {
  const original = fs.readSync;
  let changed = false;
  t.mock.method(fs, "readSync", (...args) => {
    const count = original(...args);
    if (!changed) { changed = true; action(); }
    return count;
  });
  syncBuiltinESMExports();
  t.after(() => { t.mock.restoreAll(); syncBuiltinESMExports(); });
}

test("bounded reader preserves bytes, empty inputs, exact limits and partial reads", (t) => {
  const { path } = fixture(t, "ordinary input");
  assert.equal(readBoundedRegularFile(path, 14).toString(), "ordinary input");
  const original = fs.readSync;
  t.mock.method(fs, "readSync", (fd, buffer, offset, length, position) => original(fd, buffer, offset, Math.min(3, length), position));
  syncBuiltinESMExports();
  t.after(() => { t.mock.restoreAll(); syncBuiltinESMExports(); });
  assert.equal(readBoundedRegularFile(path, 14).toString(), "ordinary input");
  fs.writeFileSync(path, "");
  assert.deepEqual(readBoundedRegularFile(path, 0), Buffer.alloc(0));
});

test("bounded reader refuses oversize inputs before reading their contents", (t) => {
  const { path } = fixture(t);
  const original = fs.readSync;
  let reads = 0;
  t.mock.method(fs, "readSync", (...args) => { reads += 1; return original(...args); });
  syncBuiltinESMExports();
  t.after(() => { t.mock.restoreAll(); syncBuiltinESMExports(); });
  assert.throws(() => readBoundedRegularFile(path, 2), { code: "FILE_READ_LIMIT" });
  assert.equal(reads, 0);
  assert.equal(readBoundedRegularFile(path, 2, { skipOversized: true }), null);
  assert.equal(reads, 0);
});

test("bounded reader refuses direct symlinks and directories", (t) => {
  const { root, path } = fixture(t);
  const link = join(root, "link");
  fs.symlinkSync(path, link);
  assert.throws(() => readBoundedRegularFile(link, 100));
  assert.throws(() => readBoundedRegularFile(root, 100), /regular non-symlink file/);
  assert.equal(readBoundedRegularFile(link, 100, { skipNonRegular: true }), null);
  assert.equal(readBoundedRegularFile(root, 100, { skipNonRegular: true }), null);
});

test("bounded reader refuses growth during a read", (t) => {
  const { path } = fixture(t);
  interceptRead(t, () => fs.appendFileSync(path, "more content"));
  assert.throws(() => readBoundedRegularFile(path, 100), /grew|changed/);
});

test("bounded reader refuses same-size mutation during a read", (t) => {
  const { path } = fixture(t, "original");
  interceptRead(t, () => fs.writeFileSync(path, "modified"));
  assert.throws(() => readBoundedRegularFile(path, 100), /changed/);
});

test("bounded reader refuses truncation during a read", (t) => {
  const { path } = fixture(t);
  interceptRead(t, () => fs.truncateSync(path, 0));
  assert.throws(() => readBoundedRegularFile(path, 100), /changed|ended/);
});

test("bounded reader refuses replacement of the opened file name", (t) => {
  const { path } = fixture(t);
  interceptRead(t, () => { fs.unlinkSync(path); fs.writeFileSync(path, "replacement"); });
  assert.throws(() => readBoundedRegularFile(path, 100), /changed/);
});

test("binary classification stays bounded and uses the same opened file", (t) => {
  const { path } = fixture(t, Buffer.from([0, 1, 2]));
  fs.truncateSync(path, 11_000_000);
  assert.equal(readBoundedRegularFile(path, 1, { skipBinary: true }), null);
  fs.writeFileSync(path, Buffer.from([0, 1, 2]));
  interceptRead(t, () => fs.writeFileSync(path, "replacement text"));
  assert.throws(() => readBoundedRegularFile(path, 100, { skipBinary: true }), /changed/);
});

test("bounded reader promptly refuses a named pipe", { skip: process.platform === "win32" }, (t) => {
  const { root } = fixture(t);
  const pipe = join(root, "input.pipe");
  execFileSync("mkfifo", [pipe]);
  const result = spawnSync(process.execPath, ["--input-type=module", "-e", `import { readBoundedRegularFile } from './scripts/shared/bounded-file-read.mjs'; readBoundedRegularFile(process.argv[1], 100);`, pipe], { encoding: "utf8", timeout: 3000 });
  assert.equal(result.error, undefined);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /regular non-symlink file/);
});

test("secret scanning preserves binary, symlink and oversized-text policy with redacted findings", (t) => {
  const { root } = fixture(t);
  const repo = join(root, "repo");
  fs.mkdirSync(repo);
  execFileSync("git", ["init", "--quiet", repo]);
  fs.writeFileSync(join(repo, "ordinary.txt"), "ordinary local text");
  const binary = join(repo, "binary.bin");
  fs.writeFileSync(binary, Buffer.from([0]));
  fs.truncateSync(binary, 11_000_000);
  fs.writeFileSync(join(repo, "oversized.txt"), "x".repeat(10 * 1024 * 1024 + 1));
  fs.symlinkSync(join(root, "input.txt"), join(repo, "excluded-link"));
  const syntheticKey = ["sk", "live", "A".repeat(32)].join("_");
  fs.writeFileSync(join(repo, "credential.txt"), syntheticKey);
  const findings = scanVersionableFiles(repo);
  assert.deepEqual(findings, [
    { file: "credential.txt", label: "Stripe secret key" },
    { file: "oversized.txt", label: "versionable file exceeds the secret-scan size limit" },
  ]);
  assert.equal(JSON.stringify(findings).includes(syntheticKey), false);
});
