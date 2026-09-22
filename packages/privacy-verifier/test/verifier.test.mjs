import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import JSZip from "jszip";
import { packageFiles, zipFiles, verifyPackage, verifyFiles, sha256 } from "../src/index.js";
import { canonicalJson, renderShareFiles } from "../../privacy-core/src/share-format.js";
const uid = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const u = () => ({ state: "unknown" });
function fixture() {
  return { format: "rgpd-share-v1", id: uid(1), createdAt: "2026-09-22T12:00:00.000Z", profile: "article30-controller", catalogVersion: "fr-eu-2026-09-22.draft-1", recipient: "Équipe fictive", scope: "Exemple de registre", reservations: ["Conservation à préciser"], coverage: "incomplete", organization: { name: "Association fictive", contact: u(), dpo: u(), representatives: u() }, parties: [], references: [], activities: [{ id: uid(2), role: "controller", title: "Infolettre fictive", dataCategories: u(), dataSubjects: u(), recipients: u(), transfers: u(), securityMeasures: u(), purposes: [{ id: uid(3), description: u(), legalBasis: u(), retention: { period: u(), trigger: u() } }] }] };
}
async function repack(files, options = {}) {
  const zip = new JSZip(); for (const [name, text] of Object.entries(files)) zip.file(name, text, { createFolders: false });
  return zip.generateAsync({ type: "uint8array", compression: "STORE", ...options });
}
async function rehash(files) {
  const manifest = JSON.parse(files["manifest.json"]);
  for (const item of manifest.files) { const bytes = new TextEncoder().encode(files[item.name]); item.bytes = bytes.length; item.sha256 = await sha256(bytes); }
  const { sha256: _hash, ...body } = manifest; manifest.sha256 = await sha256(new TextEncoder().encode(canonicalJson(body)));
  files["manifest.json"] = canonicalJson(manifest) + "\n";
}
test("fixed inventory, byte hashes and local verifier round trip", async () => {
  const { files, manifestHash } = await packageFiles(fixture());
  const result = await verifyPackage(await zipFiles(files)); assert.equal(result.valid, true); assert.equal(result.manifestHash, manifestHash);
  assert.match(result.limitation, /recalculer toutes les empreintes/);
  assert.deepEqual(Object.keys(files).sort(), ["README.txt", "manifest.json", "register.csv", "register.json", "report.html"]);
});
test("altered byte and false hash are rejected", async () => {
  const { files } = await packageFiles(fixture()); const bytes = await zipFiles(files); bytes[60] ^= 1;
  assert.equal((await verifyPackage(bytes)).valid, false);
  const manifest = JSON.parse(files["manifest.json"]); manifest.files[0].sha256 = "0".repeat(64); files["manifest.json"] = canonicalJson(manifest) + "\n";
  assert.equal((await verifyPackage(await repack(files))).valid, false);
});
test("extra, missing and traversal entries are rejected before extraction", async () => {
  const { files } = await packageFiles(fixture());
  for (const name of ["extra.txt", "../escape.txt", "/absolute", "a/../register.json", "C:\\secret"]) {
    assert.equal((await verifyPackage(await repack({ ...files, [name]: "unsafe" }))).valid, false);
  }
  const { "README.txt": _readme, ...missing } = files;
  assert.equal((await verifyPackage(await repack(missing))).valid, false);
});
test("duplicate central entry names, local name mismatch, hidden ranges and truncated ZIP rejected", async () => {
  const { files } = await packageFiles(fixture()); const original = await zipFiles(files);
  const signatures = []; for (let i = 0; i < original.length - 4; i++) if (original[i] === 0x50 && original[i + 1] === 0x4b && original[i + 2] === 1 && original[i + 3] === 2) signatures.push(i);
  const json = signatures.find((pos) => new TextDecoder().decode(original.subarray(pos + 46, pos + 59)) === "register.json");
  const html = signatures.find((pos) => new TextDecoder().decode(original.subarray(pos + 46, pos + 57)) === "report.html");
  assert.ok(json); assert.ok(html);
  const dup = new Uint8Array(original); const view = new DataView(dup.buffer); const csv = signatures.find((pos) => new TextDecoder().decode(original.subarray(pos + 46, pos + 58)) === "register.csv");
  // Equal-length manifest.json/register.json create a real duplicated name.
  const manifest = signatures.find((pos) => new TextDecoder().decode(original.subarray(pos + 46, pos + 59)) === "manifest.json"); assert.ok(manifest);
  dup.set(new TextEncoder().encode("register.json"), manifest + 46);
  const local = view.getUint32(manifest + 42, true); dup.set(new TextEncoder().encode("register.json"), local + 30);
  assert.equal((await verifyPackage(dup)).valid, false); assert.ok(csv);
  const mismatch = new Uint8Array(original); mismatch[30] = 65; assert.equal((await verifyPackage(mismatch)).valid, false);
  const prefix = new Uint8Array(original.length + 1); prefix.set(original, 1); assert.equal((await verifyPackage(prefix)).valid, false);
  assert.equal((await verifyPackage(original.subarray(0, original.length - 7))).valid, false);
});
test("unknown version, extra properties, dangling links and false coverage rejected even with recomputed hashes", async () => {
  for (const mutate of [r => r.format = "rgpd-share-v99", r => r.internalNotes = "CANARY", r => r.coverage = "documented-profile", r => r.references.push({ id: uid(9), activityIds: [uid(99)], text: "Référence" }), r => r.activities[0].id = r.id]) {
    const { files } = await packageFiles(fixture()); const r = JSON.parse(files["register.json"]); mutate(r); files["register.json"] = canonicalJson(r) + "\n"; await rehash(files);
    assert.equal((await verifyPackage(await repack(files))).valid, false);
  }
});
test("active HTML and divergent CSV remain rejected after all hashes are recalculated", async () => {
  for (const [name, suffix] of [["report.html", "<script>alert(1)</script>"], ["register.csv", '"formula","=1+1"\r\n']]) {
    const { files } = await packageFiles(fixture()); files[name] += suffix; await rehash(files);
    assert.equal((await verifyPackage(await repack(files))).valid, false);
  }
});
test("size limits, deflated bomb and dishonest expanded size are rejected", async () => {
  const { files } = await packageFiles(fixture()); files["README.txt"] = "x".repeat(600_000);
  assert.equal((await verifyPackage(await repack(files, { compression: "DEFLATE" }))).valid, false);
  const valid = await zipFiles((await packageFiles(fixture())).files); const view = new DataView(valid.buffer);
  for (let pos = 0; pos < valid.length - 46; pos++) if (view.getUint32(pos, true) === 0x02014b50) { const offset = view.getUint32(pos + 42, true); view.setUint32(pos + 24, 1, true); view.setUint32(offset + 22, 1, true); break; }
  assert.equal((await verifyPackage(valid)).valid, false);
  assert.equal((await verifyPackage(new Uint8Array(2 * 1024 * 1024 + 1))).valid, false);
});
test("CLI and browser library return identical results; CLI rejects symlinks and invalid packages", async () => {
  const dir = await mkdtemp(join(tmpdir(), "rgpdesk-verify-"));
  try {
    const bytes = await zipFiles((await packageFiles(fixture())).files), path = join(dir, "fixture.zip"); await writeFile(path, bytes);
    const command = new URL("../bin/rgpdesk-verify.mjs", import.meta.url).pathname;
    const output = execFileSync(process.execPath, [command, path], { encoding: "utf8" }); assert.deepEqual(JSON.parse(output), await verifyPackage(bytes));
    const link = join(dir, "linked.zip"); await symlink(path, link); assert.throws(() => execFileSync(process.execPath, [command, link], { stdio: "pipe" }), e => e.status === 1);
    await writeFile(path, "bad"); assert.throws(() => execFileSync(process.execPath, [command, path], { stdio: "pipe" }), e => e.status === 1);
  } finally { await rm(dir, { recursive: true, force: true }); }
});
test("text is safely encoded in all files and files do not accidentally carry user HTML", async () => {
  const r = fixture(); r.activities[0].title = '<script>CANARY_TEXT</script>'; r.recipient = '＝HYPERLINK("https://invalid.example")';
  const { files } = await packageFiles(r); assert.ok(files["register.csv"].includes('"\'=HYPERLINK'));
  assert.ok(files["report.html"].includes("&lt;script&gt;")); assert.ok(!files["report.html"].includes("<script>"));
  assert.equal((await verifyFiles(files)).register.activities[0].title, r.activities[0].title);
  assert.deepEqual(renderShareFiles(r)["register.csv"], files["register.csv"]);
});
