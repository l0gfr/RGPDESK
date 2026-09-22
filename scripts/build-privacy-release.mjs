import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { lstatSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
import ts from "typescript";
import JSZip from "jszip";
import { extractBuildCsp } from "./shared/csp.mjs";

export const privacyPages = [
  "app/privacy/index.html",
  "app/privacy/verify/index.html",
  "app/privacy/confidentialite/index.html",
];
const assetName = /^_astro\/[A-Za-z0-9_.-]+\.(?:js|css|woff2?|svg|png|webp)$/;
export const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");

export function readRegular(root, name) {
  assert.ok(name && !name.includes("\\") && !name.split("/").some((part) => !part || part === "." || part === ".."), "Unsafe release path");
  let path = resolve(root);
  assert.ok(lstatSync(path).isDirectory() && !lstatSync(path).isSymbolicLink(), "Unsafe input root");
  const parts = name.split("/");
  for (const [index, part] of parts.entries()) {
    path = join(path, part);
    const stat = lstatSync(path);
    assert.ok(!stat.isSymbolicLink(), "Symlink in release input");
    assert.ok(index === parts.length - 1 ? stat.isFile() : stat.isDirectory(), "Non-regular release input");
  }
  assert.ok(lstatSync(path).size <= 5_000_000, "Oversized release input");
  return readFileSync(path);
}

function assertLiteralImports(path, content) {
  const tree = ts.createSourceFile(path, content, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  function visit(node) {
    if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
      assert.ok(node.arguments.length === 1 && ts.isStringLiteral(node.arguments[0]), "Nonliteral asset import");
    }
    ts.forEachChild(node, visit);
  }
  visit(tree);
}

// Work from the compiled entry points and the parser's dependency graph. Never
// copy the complete historical distribution or rewrite compiled application code.
export async function collectPrivacyFiles(dist) {
  assert.ok(!lstatSync(dist).isSymbolicLink(), "Symlink input root");
  dist = realpathSync(dist);
  const files = new Map();
  const entries = new Set();
  for (const page of privacyPages) {
    const bytes = readRegular(dist, page);
    const html = bytes.toString("utf8");
    assert.match(html, /<title>RGPDESK/);
    assert.match(html, /connect-src 'none'/);
    assert.match(html, /form-action 'none'/);
    files.set(page, bytes);
    for (const match of html.matchAll(/(?:href|src|component-url|renderer-url)="(\/_astro\/[^"\s]+)"/g)) {
      const name = match[1].slice(1);
      assert.ok(assetName.test(name), "Unexpected entry asset path");
      readRegular(dist, name);
      entries.add(resolve(dist, name));
    }
  }
  assert.ok(entries.size >= 3, "Missing compiled application assets");
  const graph = await build({
    entryPoints: [...entries], bundle: true, write: false, metafile: true,
    outdir: resolve(dist, "graph-not-written"), logLevel: "silent", platform: "browser",
    loader: { ".woff": "file", ".woff2": "file", ".svg": "file", ".png": "file", ".webp": "file" },
  });
  for (const [input, details] of Object.entries(graph.metafile.inputs)) {
    const name = relative(resolve(dist), resolve(input)).split("\\").join("/");
    assert.ok(assetName.test(name), "Asset dependency escaped the RGPD build assets");
    assert.ok(details.imports.every((item) => !item.external || (item.path === "<runtime>" && item.kind === "import-statement")), "External asset dependency");
    const bytes = readRegular(dist, name);
    if (name.endsWith(".js")) assertLiteralImports(name, bytes.toString("utf8"));
    files.set(name, bytes);
  }
  files.set("index.html", files.get("app/privacy/index.html"));
  return files;
}

export function renderApache(template, commit, csp) {
  assert.match(commit, /^[a-f0-9]{40}$/);
  assert.ok(!/[\r\n"\\]/.test(csp) && csp.includes("connect-src 'none'") && !csp.includes("unsafe-"), "Unsafe CSP");
  assert.ok(template.includes("__RGPDESK_CSP__") && template.includes("__RGPDESK_COMMIT__"), "Missing template boundary");
  const rendered = template.replaceAll("__RGPDESK_COMMIT__", commit).replace("__RGPDESK_CSP__", csp);
  assert.ok(!rendered.includes("__RGPDESK_"), "Unresolved configuration placeholder");
  return rendered;
}

export async function createPrivacyRelease({ root = process.cwd(), candidate = false } = {}) {
  const git = (args) => execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
  const commit = git(["rev-parse", "HEAD"]);
  const dirty = git(["status", "--porcelain"]) !== "";
  assert.ok(candidate || !dirty, "A release requires a clean committed worktree; --candidate is for local qualification only");
  const dist = join(root, "apps/web/dist");
  const site = await collectPrivacyFiles(dist);
  for (const [source, target] of [["LICENSE", "LICENSE.txt"], ["NOTICE", "NOTICE.txt"], ["THIRD_PARTY_NOTICES.md", "THIRD_PARTY_NOTICES.txt"], ["TRADEMARKS.md", "TRADEMARKS.txt"]]) {
    site.set(target, readRegular(root, source));
  }
  const date = new Date(Number(git(["log", "-1", "--format=%ct"])) * 1000);
  site.set("robots.txt", Buffer.from("User-agent: *\nDisallow: /\n"));
  site.set("release.json", Buffer.from(JSON.stringify({
    product: "RGPDESK", version: "0.3.0-preview", commit, dirtyWorktree: dirty,
    sourceCode: `https://github.com/l0gfr/RGPDESK/tree/${commit}`,
    license: "AGPL-3.0-only", legalReview: "not-performed", independentSecurityAudit: "not-performed",
  }, null, 2) + "\n"));

  const artifactRoot = join(root, "artifacts");
  mkdirSync(artifactRoot, { recursive: true });
  assert.ok(!lstatSync(artifactRoot).isSymbolicLink(), "Unsafe artifact root");
  const temporary = mkdtempSync(join(artifactRoot, ".rgpdesk-"));
  try {
    for (const [path, bytes] of site) {
      const target = join(temporary, "site", path);
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, bytes);
    }
    const csp = extractBuildCsp(join(temporary, "site"));
    const files = new Map([...site].map(([path, bytes]) => [`site/${path}`, bytes]));
    files.set("apache/rgpdesk.fr.conf", Buffer.from(renderApache(readRegular(root, "deploy/rgpdesk/rgpdesk.fr.conf.example").toString("utf8"), commit, csp)));
    files.set("apache/rgpdesk-bootstrap.conf", readRegular(root, "deploy/rgpdesk/rgpdesk-bootstrap.conf"));
    files.set("verify-release.py", readRegular(root, "deploy/rgpdesk/verify-release.py"));
    const inventory = [...files].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([path, bytes]) => ({ path, bytes: bytes.length, sha256: digest(bytes) }));
    files.set("manifest.json", Buffer.from(JSON.stringify({ format: "rgpdesk-static-release-v1", commit, dirtyWorktree: dirty, files: inventory }, null, 2) + "\n"));
    files.set("SHA256SUMS", Buffer.from([...files].map(([path, bytes]) => `${digest(bytes)}  ${path}\n`).join("")));
    const zip = new JSZip();
    for (const [path, bytes] of files) {
      const target = join(temporary, path);
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, bytes);
      zip.file(path, bytes, { date, createFolders: false, unixPermissions: 0o100644 });
    }
    const archive = await zip.generateAsync({ type: "nodebuffer", platform: "UNIX", compression: "DEFLATE", compressionOptions: { level: 9 } });
    const checked = await JSZip.loadAsync(archive, { checkCRC32: true });
    assert.equal(Object.keys(checked.files).length, files.size);
    for (const [path, bytes] of files) assert.equal(digest(await checked.file(path).async("nodebuffer")), digest(bytes));
    const output = join(artifactRoot, "rgpdesk");
    try { assert.ok(!lstatSync(output).isSymbolicLink(), "Unsafe output path"); } catch (error) { if (error.code !== "ENOENT") throw error; }
    rmSync(output, { recursive: true, force: true });
    renameSync(temporary, output);
    writeFileSync(join(artifactRoot, "rgpdesk-release.zip"), archive);
    writeFileSync(join(artifactRoot, "rgpdesk-release.zip.sha256"), `${digest(archive)}  rgpdesk-release.zip\n`);
    console.log(JSON.stringify({ commit, dirty, siteFiles: site.size, bytes: archive.length, sha256: digest(archive), output: "artifacts/rgpdesk-release.zip" }));
  } finally { rmSync(temporary, { recursive: true, force: true }); }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  assert.ok(process.argv.slice(2).every((arg) => arg === "--candidate"), "Unexpected release argument");
  await createPrivacyRelease({ candidate: process.argv.includes("--candidate") });
}
