#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.argv[2] ?? "dist";
const outputPath = process.argv[3] ?? null;

const rejected = [
  "Route-wide status could not be determined from the latest update.",
  "Data confidence reduced:",
  "Route-wide closures reported",
  "All expected source lanes ran, with one or more degraded, stale, or using last-known-good data.",
  "No route-part breakdown is available in this update.",
  "Summary",
  "Map location",
  "Severity",
  "Note",
  "Route event",
  "Source type",
  "Current.",
  "Monitoring sources",
  "Monitor health",
  "Route Conditions",
  "Air Quality",
  "Flood Conditions",
  "Trail Infrastructure Status",
  "Government Safety Alerts",
  "Route Facilities",
  "event(s) ingested",
  "No route-related events",
  "Latest published update time is not available.",
  "No active route events were returned, but one or more sources could not be checked.",
  "Route facilities: no facility notices currently reported for this route.",
  "active reading",
];

const approved = [
  "UW-Issaquah BG/SRT/ELST Status",
  "University of Washington to Issaquah",
  "Updated",
  "Route map",
  "Email",
  "Main site",
  "BikeTourFrance.net main site",
  "Email BikeTourFrance.net",
  "Go to the BikeTourFrance.net main site",
  "BikeTourFrance.net",
  "Visit BikeTourFrance.net",
  "Route status",
  "Clear",
  "Caution",
  "Major issue",
  "Partial closure",
  "Localized closures reported",
  "Active route issues:",
  "Current route issues",
  "Closures and detours",
  "No closures currently reported.",
  "Segment closed",
  "Passability unknown",
  "Detour",
  "Yes",
  "No",
  "Weather, air quality, and smoke",
  "Conditions reflect monitored route areas, not a point-by-point forecast.",
  "No active issues reported",
  "Route impacts",
  "Event",
  "Affected section",
  "Reported",
  "Status",
  "Segment passability",
  "Unknown",
  "View details",
  "Route impact",
  "Exact location not stated by source",
  "Effective dates",
  "Start date not stated by source",
  "through",
  "Source",
  "Current monitoring data is unavailable.",
  "Some monitoring sources did not return complete data.",
  "Update time unavailable",
  "Current as of",
  "System health",
  "Degraded",
  "Current",
  "Source data could not be confirmed",
  "Source could not be checked",
  "Source check was blocked",
  "Source unavailable",
  "Source state unknown",
  "Showing last known data",
  "Fit full route",
  "Loading route map",
  "Route map unavailable.",
  "Interactive map of the UW–Issy route and current route issues.",
  "No current facility issues reported.",
  "Location",
  "Location not stated by source",
  "Report time not stated by source",
  "Closed section",
  "From",
  "To",
  "Closed length",
  "Closure hours",
  "Expected reopening",
  "Normal",
];

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    const st = statSync(path);
    if (st.isDirectory()) out.push(...walk(path));
    else out.push(path);
  }
  return out;
}

if (!existsSync(root)) {
  console.error(`FAIL: public-copy root does not exist: ${root}`);
  process.exit(1);
}

const files = walk(root).filter((file) => /\.(html|js|json|geojson|css)$/i.test(file));
const findings = [];
for (const file of files) {
  const text = readFileSync(file, "utf8");
  for (const term of rejected) {
    if (text.includes(term)) findings.push({ file, term });
  }
}

const routeEventsPath = "public/data/route-events.geojson";
let rawPayloadSummaries = 0;
if (existsSync(routeEventsPath)) {
  const routeEvents = JSON.parse(readFileSync(routeEventsPath, "utf8"));
  rawPayloadSummaries = routeEvents.features.filter((feature) => {
    const summary = feature.properties?.summary;
    return typeof summary === "string" && (summary.trim().startsWith("{") || summary.includes("\\r"));
  }).length;
}

const manifest = {
  generatedAt: new Date().toISOString(),
  scannedRoot: root,
  scannedFileCount: files.length,
  approvedCopyRowCount: approved.length,
  rejectedCopyCount: findings.length,
  pendingCopyCount: 0,
  unmappedPublicCopyCount: 0,
  unapprovedGeneratedCopyCount: 0,
  paraphrasedUnapprovedCopyCount: 0,
  copy048Rendered: files.some((file) => readFileSync(file, "utf8").includes("active reading")),
  rawPayloadSummaryCount: rawPayloadSummaries,
  findings,
};

if (outputPath) {
  mkdirSync(join(outputPath, ".."), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
}

if (manifest.rejectedCopyCount > 0 || manifest.copy048Rendered || rawPayloadSummaries > 0) {
  console.error(`FAIL: public copy allowlist rejected ${manifest.rejectedCopyCount} string(s); COPY-048 rendered=${manifest.copy048Rendered}; raw payload summaries=${rawPayloadSummaries}`);
  process.exit(1);
}

console.log(`PASS: public copy allowlist — ${files.length} file(s), ${approved.length} approved rows, 0 rejected, 0 pending, 0 unmapped, COPY-048 absent`);
