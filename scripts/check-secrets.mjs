import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { readBoundedRegularFile } from "./shared/bounded-file-read.mjs";

const MAX_SCANNED_FILE_BYTES = 10 * 1024 * 1024;

const secretRules = [
  { label: "private key PEM", pattern: /-----BEGIN (?:RSA |EC |OPENSSH |ENCRYPTED )?PRIVATE KEY-----/g },
  { label: "PGP private key", pattern: /-----BEGIN PGP PRIVATE KEY BL(?:OCK)-----/g },
  { label: "Stripe secret key", pattern: /\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9]{20,}\b/g },
  { label: "Stripe webhook secret", pattern: /\bwhsec_[A-Za-z0-9]{20,}\b/g },
  { label: "GitHub credential", pattern: /\b(?:gh[pousr]_[A-Za-z0-9_]{30,}|github_pat_[A-Za-z0-9_]{22,})\b/g },
  { label: "AWS access key", pattern: /\bAKIA[0-9A-Z]{16}\b/g },
  { label: "Slack credential", pattern: /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/g },
  { label: "Google API key", pattern: /\bAIza[0-9A-Za-z_-]{30,}\b/g },
  { label: "OpenAI project key", pattern: /\bsk-proj-[A-Za-z0-9_-]{20,}\b/g },
];

function fixtureOrPlaceholder(value) {
  return /(?:fixture|example|replace|dummy|not[-_]?a[-_]?real)/i.test(value);
}

export function scanTextForSecrets(text) {
  const labels = new Set();
  for (const rule of secretRules) {
    rule.pattern.lastIndex = 0;
    for (const match of text.matchAll(rule.pattern)) {
      if (!fixtureOrPlaceholder(match[0])) labels.add(rule.label);
    }
  }
  return [...labels];
}

export function isBinaryPrefix(content) {
  return content.includes(0);
}

export function scanVersionableFiles(repositoryRoot = process.cwd()) {
  const listed = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard", "-z"], {
    cwd: repositoryRoot,
    encoding: "buffer",
    maxBuffer: 16 * 1024 * 1024,
  });
  const paths = listed.toString("utf8").split("\0").filter(Boolean);
  const deleted = new Set(execFileSync("git", ["ls-files", "--deleted", "-z"], {
    cwd: repositoryRoot, encoding: "utf8",
  }).split("\0").filter(Boolean));
  const findings = [];

  for (const path of paths) {
    if (deleted.has(path)) continue;
    const absolutePath = resolve(repositoryRoot, path);
    let content;
    try {
      content = readBoundedRegularFile(absolutePath, MAX_SCANNED_FILE_BYTES, { skipBinary: true, skipNonRegular: true });
    } catch (error) {
      if (error.code !== "FILE_READ_LIMIT") throw error;
      findings.push({ file: path, label: "versionable file exceeds the secret-scan size limit" });
      continue;
    }
    if (content === null) continue;
    for (const label of scanTextForSecrets(content.toString("utf8"))) {
      findings.push({ file: path, label });
    }
  }

  return findings;
}

function main() {
  const findings = scanVersionableFiles();
  if (findings.length > 0) {
    for (const finding of findings) {
      console.error(`SECURITY SECRET SCAN FAIL: ${finding.file} (${finding.label})`);
    }
    process.exit(1);
  }
  console.log("BLACKPROOF versionable-file secret scan passed.");
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
