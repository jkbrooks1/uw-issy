#!/usr/bin/env node
// Usage: node scripts/verify-production.mjs <base-url>
// Buildspec section 31 steps 18-19 and section 36. Checks the LIVE deployed
// site, not local disk — this is production proof, not a repeat of the
// pre-deploy build-time validation. Exits 1 on the first failed check and
// prints every check attempted either way.
//
// Not everything in buildspec section 36 can be proven by an HTTP client
// (map rendering, mobile layout, reduced-motion/stale/failure UI states,
// the cross-browser matrix in 35.5). Those are explicitly listed at the end
// as still requiring a real browser check — never silently marked as done.

const LOGO_URL = "https://pub-40b24fc600d44d828529b84a0d97ded7.r2.dev/BTF_LOGO_White_on_Transparent.png";
const MAIN_SITE_URL = "https://biketourfrance.net";
const EMAIL_HREF = "mailto:contact@biketourfrance.net";

const BANNED_MOCK_STRINGS = [
  "Loose gravel on sharp curve",
  "High wind near coastal viewpoint",
  "AQI moderate — slight haze",
  "Controlled burn nearby",
  "Minor pooling water",
  "Water fountain at station 4",
  "Flash detour setup",
  "Canyon Climb",
  "Coastal Link",
  "Valley Loop",
];

const SECRET_PATTERNS = [
  { name: "AWS access key ID", re: /AKIA[0-9A-Z]{16}/g },
  { name: "generic API key assignment", re: /(?:api[_-]?key|apikey)\s*[:=]\s*["'][A-Za-z0-9_\-]{16,}["']/gi },
  { name: "GitHub token", re: /gh[pousr]_[A-Za-z0-9]{20,}/g },
  { name: "PEM private key block", re: /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/g },
  { name: "bearer token assignment", re: /Authorization\s*:\s*["']?Bearer\s+[A-Za-z0-9_\-.]{16,}/gi },
];

class ProductionCheckFailure extends Error {}

const results = [];

function record(label, ok, detail) {
  results.push({ label, ok, detail });
  const prefix = ok ? "PASS" : "FAIL";
  console.log(`${prefix}: ${label}${detail ? ` — ${detail}` : ""}`);
}

async function fetchText(url) {
  const response = await fetch(url, { headers: { accept: "*/*" } });
  const text = await response.text();
  return { response, text };
}

function scanForSecrets(label, text) {
  for (const pattern of SECRET_PATTERNS) {
    const matches = text.match(pattern.re);
    if (matches) {
      record(`${label} — no secret-like content`, false, `possible ${pattern.name} (${matches.length} match(es))`);
      return;
    }
  }
  record(`${label} — no secret-like content`, true);
}

function scanForMockStrings(label, text) {
  const found = BANNED_MOCK_STRINGS.filter((s) => text.includes(s));
  record(`${label} — no banned mock content`, found.length === 0, found.length > 0 ? found.join("; ") : undefined);
}

async function checkJsonFile(baseUrl, fileName) {
  const url = `${baseUrl}/data/${fileName}`;
  try {
    const { response, text } = await fetchText(url);
    record(`${fileName} returns success`, response.ok, `HTTP ${response.status}`);
    if (!response.ok) return null;
    let parsed;
    try {
      parsed = JSON.parse(text);
      record(`${fileName} is valid JSON`, true);
    } catch (cause) {
      record(`${fileName} is valid JSON`, false, cause.message);
      return null;
    }
    scanForSecrets(fileName, text);
    scanForMockStrings(fileName, text);
    return parsed;
  } catch (cause) {
    record(`${fileName} returns success`, false, cause.message);
    return null;
  }
}

async function run(baseUrl) {
  if (!baseUrl) {
    throw new ProductionCheckFailure("usage: node scripts/verify-production.mjs <base-url>");
  }
  const base = baseUrl.replace(/\/$/, "");

  // Main page.
  const { response: pageResponse, text: pageText } = await fetchText(`${base}/`);
  record("Main page returns success", pageResponse.ok, `HTTP ${pageResponse.status}`);
  record("Main page contains approved logo URL", pageText.includes(LOGO_URL));
  record("Main page email link is correct", pageText.includes(EMAIL_HREF));
  record("Main page main-site link is correct", pageText.includes(MAIN_SITE_URL));
  scanForSecrets("main page", pageText);
  scanForMockStrings("main page", pageText);

  // Approved logo actually loads (it's hosted on R2, not this Pages deploy,
  // but "approved logo loads" in section 36 means the URL the page points at
  // must actually resolve, not merely be textually present).
  try {
    const logoResponse = await fetch(LOGO_URL, { method: "HEAD" });
    record("Approved logo loads", logoResponse.ok, `HTTP ${logoResponse.status}`);
  } catch (cause) {
    record("Approved logo loads", false, cause.message);
  }

  // Route GeoJSON.
  const routeUrl = `${base}/routes/UnivWA-Issaquah.geojson`;
  try {
    const { response, text } = await fetchText(routeUrl);
    record("Route GeoJSON returns success", response.ok, `HTTP ${response.status}`);
    if (response.ok) {
      const parsed = JSON.parse(text);
      record(
        "Route GeoJSON is a FeatureCollection with real geometry",
        parsed.type === "FeatureCollection" && parsed.features?.[0]?.geometry?.coordinates?.length > 1,
      );
      scanForSecrets("route GeoJSON", text);
    }
  } catch (cause) {
    record("Route GeoJSON returns success", false, cause.message);
  }

  // Four public monitoring files.
  const dashboardData = await checkJsonFile(base, "dashboard-data.json");
  const routeEvents = await checkJsonFile(base, "route-events.geojson");
  const systemHealth = await checkJsonFile(base, "system-health.json");
  const releaseManifest = await checkJsonFile(base, "release-manifest.json");

  if (dashboardData && routeEvents && systemHealth && releaseManifest) {
    const releaseIds = new Set([
      dashboardData.releaseId,
      systemHealth.releaseId,
      releaseManifest.releaseId,
      routeEvents.releaseId,
    ]);
    record(
      "Release IDs match across all four live public files",
      releaseIds.size === 1,
      releaseIds.size > 1 ? Array.from(releaseIds).join(", ") : undefined,
    );
  }

  console.log("");
  console.log("NOT checked by this script — requires a real browser, per buildspec 35.3-35.5 and 36:");
  console.log("  - Map renders the real route (visual)");
  console.log("  - Mobile layout / reading order");
  console.log("  - Stale-state and failure-state UI");
  console.log("  - Reduced motion, 200% zoom, contrast, touch target size");
  console.log("  - Cross-browser matrix (Chrome, Safari, Firefox, Edge, iOS Safari, Android Chrome)");

  const failures = results.filter((r) => !r.ok);
  if (failures.length > 0) {
    throw new ProductionCheckFailure(`${failures.length} of ${results.length} production check(s) failed`);
  }

  console.log("");
  console.log(`PASS: all ${results.length} automated production checks passed for ${base}`);
}

try {
  await run(process.argv[2]);
} catch (err) {
  if (err instanceof ProductionCheckFailure) {
    process.stderr.write(`FAIL: ${err.message}\n`);
    process.exit(1);
  }
  throw err;
}
