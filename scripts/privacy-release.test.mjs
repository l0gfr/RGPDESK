import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import { collectPrivacyFiles, digest, privacyPages, readRegular, renderApache } from "./build-privacy-release.mjs";

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), "rgpdesk-release-test-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const put = (name, content) => { const path = join(root, name); mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, content); };
  for (const page of privacyPages) put(page, `<title>RGPDESK</title><meta content="connect-src 'none'; form-action 'none'"><link href="/_astro/privacy.123.css"><astro-island component-url="/_astro/PrivacyApp.123.js" renderer-url="/_astro/client.123.js"></astro-island>`);
  put("_astro/PrivacyApp.123.js", 'import { value } from "./shared.123.js"; console.log(value);');
  put("_astro/client.123.js", "export default 1;");
  put("_astro/shared.123.js", "export const value = 3;");
  put("_astro/privacy.123.css", "body{color:navy}");
  put("_astro/CyberApp.123.js", "export default 'cyber-excluded';");
  put("app/cases/index.html", "excluded");
  put(".env", "excluded");
  return { root, put };
}

test("distribution contains RGPD pages and their transitive assets only", async (t) => {
  const { root } = fixture(t);
  const files = await collectPrivacyFiles(root);
  assert.deepEqual([...files.keys()].sort(), [...privacyPages, "index.html", "_astro/PrivacyApp.123.js", "_astro/client.123.js", "_astro/shared.123.js", "_astro/privacy.123.css"].sort());
  assert.deepEqual(files.get("index.html"), files.get("app/privacy/index.html"));
});
test("missing page fails closed", async (t) => {
  const { root } = fixture(t);
  rmSync(join(root, privacyPages[1]));
  await assert.rejects(collectPrivacyFiles(root));
});
test("an external module dependency is rejected", async (t) => {
  const { root, put } = fixture(t);
  put("_astro/PrivacyApp.123.js", 'import "https://example.invalid/library.js";');
  await assert.rejects(collectPrivacyFiles(root));
});
test("a dependency outside the compiled assets is rejected", async (t) => {
  const { root, put } = fixture(t);
  put("outside.js", "export default 1");
  put("_astro/PrivacyApp.123.js", 'import "../outside.js";');
  await assert.rejects(collectPrivacyFiles(root));
});
test("nonliteral dynamic imports are rejected", async (t) => {
  const { root, put } = fixture(t);
  put("_astro/PrivacyApp.123.js", "import(globalThis.untrustedPath);");
  await assert.rejects(collectPrivacyFiles(root));
});
test("symlink files and directory traversal are rejected", (t) => {
  const { root } = fixture(t);
  symlinkSync(join(root, "_astro/shared.123.js"), join(root, "_astro/link.js"));
  assert.throws(() => readRegular(root, "_astro/link.js"));
  assert.throws(() => readRegular(root, "../outside.js"));
  symlinkSync(join(root, "_astro"), join(root, "alias"));
  assert.throws(() => readRegular(root, "alias/shared.123.js"));
});
test("public entry pages must retain network and form policies", async (t) => {
  const { root, put } = fixture(t);
  put(privacyPages[0], '<title>RGPDESK</title>');
  await assert.rejects(collectPrivacyFiles(root));
});
test("Apache configuration has dedicated scope and strictly validated substitution", () => {
  const template = readFileSync("deploy/rgpdesk/rgpdesk.fr.conf.example", "utf8");
  const commit = "a".repeat(40);
  const csp = "default-src 'self'; connect-src 'none'; form-action 'none'";
  const result = renderApache(template, commit, csp);
  assert.ok(result.includes(`/var/www/html/rgpdesk/releases/${commit}`));
  assert.ok(!result.includes("blackproof") && !result.includes("ProxyPass") && !result.includes("__RGPDESK_"));
  assert.throws(() => renderApache(template, "../outside", csp));
  assert.throws(() => renderApache(template, commit, csp + '\nAlias /private /etc'));
  assert.throws(() => renderApache(template, commit, csp + "; script-src 'unsafe-inline'"));
});

function verifierFixture(t) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "rgpdesk-verifier-test-")));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const commit = "a".repeat(40);
  const names = ["site/index.html", ...privacyPages.map((name) => `site/${name}`), "site/LICENSE.txt", "site/NOTICE.txt", "site/THIRD_PARTY_NOTICES.txt", "site/TRADEMARKS.txt", "site/robots.txt", "site/release.json", "apache/rgpdesk.fr.conf", "apache/rgpdesk-bootstrap.conf", "verify-release.py"];
  const files = names.map((path) => {
    const bytes = Buffer.from(path === "site/release.json" ? JSON.stringify({ product: "RGPDESK", commit, dirtyWorktree: false }) : "synthetic release fixture");
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), bytes);
    return { path, bytes: bytes.length, sha256: digest(bytes) };
  });
  const manifest = { format: "rgpdesk-static-release-v1", commit, dirtyWorktree: false, files };
  const save = () => {
    const bytes = Buffer.from(JSON.stringify(manifest));
    writeFileSync(join(root, "manifest.json"), bytes);
    writeFileSync(join(root, "SHA256SUMS"), [...files.map((f) => `${f.sha256}  ${f.path}\n`), `${digest(bytes)}  manifest.json\n`].join(""));
  };
  save();
  const run = () => spawnSync("python3", ["deploy/rgpdesk/verify-release.py", root, commit], { encoding: "utf8" });
  return { root, manifest, save, run };
}

test("independent Python verifier accepts a complete clean release", (t) => {
  const fixture = verifierFixture(t);
  const result = fixture.run();
  assert.equal(result.status, 0, result.stderr);
});
for (const attack of ["extra", "corrupt", "symlink", "dirty", "commit", "duplicate", "path", "missing"]) {
  test(`independent Python verifier rejects ${attack} release`, (t) => {
    const { root, manifest, save, run } = verifierFixture(t);
    if (attack === "extra") writeFileSync(join(root, "site/private.env"), "fixture");
    if (attack === "corrupt") writeFileSync(join(root, "site/index.html"), "changed");
    if (attack === "symlink") { rmSync(join(root, "site/index.html")); symlinkSync(join(root, "site/LICENSE.txt"), join(root, "site/index.html")); }
    if (attack === "dirty") { manifest.dirtyWorktree = true; save(); }
    if (attack === "commit") { manifest.commit = "b".repeat(40); save(); }
    if (attack === "duplicate") { manifest.files.push(manifest.files[0]); save(); }
    if (attack === "path") { manifest.files[0].path = "../escape"; save(); }
    if (attack === "missing") rmSync(join(root, "site/index.html"));
    assert.equal(run().status, 1);
  });
}
