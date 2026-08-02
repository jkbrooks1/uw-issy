#!/usr/bin/env node
// Usage: node scripts/check-public-output-for-secrets.mjs <dir>
// Buildspec section 31 step 16 / section 33. Scans every file that would
// actually ship in the built, public output for secret-like content before
// deploy. This is a pattern-based safety net, not a substitute for keeping
// secrets out of source in the first place.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

class SecretScanFailure extends Error {}

const PATTERNS = [
  { name: "AWS access key ID", re: /AKIA[0-9A-Z]{16}/g },
  { name: "generic API key assignment", re: /(?:api[_-]?key|apikey)\s*[:=]\s*["'][A-Za-z0-9_\-]{16,}["']/gi },
  { name: "Cloudflare API token", re: /\b[A-Za-z0-9_-]{40}\b(?=.*cloudflare)/gi },
  { name: "GitHub token", re: /gh[pousr]_[A-Za-z0-9]{20,}/g },
  { name: "n8n API key (JWT-shaped)", re: /eyJhbGciOi[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g },
  { name: "PEM private key block", re: /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/g },
  { name: "bearer token assignment", re: /Authorization\s*:\s*["']?Bearer\s+[A-Za-z0-9_\-.]{16,}/gi },
  { name: "password assignment", re: /password\s*[:=]\s*["'][^"'\s]{6,}["']/gi },
];

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stats = statSync(full);
    if (stats.isDirectory()) {
      walk(full, files);
    } else {
      files.push(full);
    }
  }
  return files;
}

function run(dir) {
  if (!dir) {
    throw new SecretScanFailure("usage: node scripts/check-public-output-for-secrets.mjs <dir>");
  }

  const files = walk(dir).filter((path) => /\.(html|js|css|json|geojson|svg|txt|xml)$/i.test(path));
  const findings = [];

  for (const file of files) {
    const text = readFileSync(file, "utf8");
    for (const pattern of PATTERNS) {
      const matches = text.match(pattern.re);
      if (matches) {
        findings.push(`${file}: possible ${pattern.name} (${matches.length} match(es))`);
      }
    }
  }

  if (findings.length > 0) {
    throw new SecretScanFailure(
      `secret-like content found in public output:\n${findings.map((f) => `  - ${f}`).join("\n")}`,
    );
  }

  console.log(`PASS: ${dir} — scanned ${files.length} file(s), no secret-like content found`);
}

try {
  run(process.argv[2]);
} catch (err) {
  if (err instanceof SecretScanFailure) {
    process.stderr.write(`FAIL: ${err.message}\n`);
    process.exit(1);
  }
  throw err;
}
