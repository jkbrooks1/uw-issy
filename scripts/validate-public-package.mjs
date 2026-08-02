#!/usr/bin/env node
// Usage: node scripts/validate-public-package.mjs <dir>
// Buildspec section 9 / 31 / 32.3. Exits 1 with a specific reason for the
// first thing that fails.

import { existsSync, readFileSync } from "node:fs";

const VALID_GEOMETRY_TYPES = new Set([
  "Point",
  "LineString",
  "MultiLineString",
  "Polygon",
  "MultiPolygon",
]);

class ValidationFailure extends Error {}

function fail(reason) {
  throw new ValidationFailure(reason);
}

function readJsonFile(dir, fileName) {
  const path = `${dir}/${fileName}`;
  if (!existsSync(path)) {
    fail(`Missing required file: ${path}`);
  }
  let text;
  try {
    text = readFileSync(path, "utf8");
  } catch (cause) {
    fail(`Could not read ${path}: ${cause.message}`);
  }
  try {
    return JSON.parse(text);
  } catch (cause) {
    fail(`${fileName} is not valid JSON: ${cause.message}`);
  }
  return undefined;
}

function requireFields(fileName, obj, fields) {
  for (const field of fields) {
    if (obj[field] === undefined) {
      fail(`${fileName} is missing required field "${field}"`);
    }
  }
}

function run(dir) {
  if (!dir) {
    throw new ValidationFailure("usage: node scripts/validate-public-package.mjs <dir>");
  }

  const dashboardData = readJsonFile(dir, "dashboard-data.json");
  requireFields("dashboard-data.json", dashboardData, [
    "schemaVersion",
    "releaseId",
    "assembledAt",
    "routeId",
    "routeName",
    "displayTier",
    "activeEventCount",
    "laneSummaries",
  ]);

  const routeEvents = readJsonFile(dir, "route-events.geojson");
  if (routeEvents.type !== "FeatureCollection" || !Array.isArray(routeEvents.features)) {
    fail("route-events.geojson is not a valid GeoJSON FeatureCollection");
  }
  if (typeof routeEvents.releaseId !== "string" || typeof routeEvents.generatedAt !== "string") {
    fail("route-events.geojson is missing its own release/generated marker");
  }
  for (const feature of routeEvents.features) {
    if (feature.geometry !== null) {
      if (!feature.geometry || !VALID_GEOMETRY_TYPES.has(feature.geometry.type)) {
        fail(`route-events.geojson feature "${feature.id}" has an invalid geometry type`);
      }
    }
  }

  const systemHealth = readJsonFile(dir, "system-health.json");
  requireFields("system-health.json", systemHealth, [
    "schemaVersion",
    "releaseId",
    "assembledAt",
    "lanes",
    "assemblyState",
    "publicationState",
  ]);

  const releaseManifest = readJsonFile(dir, "release-manifest.json");
  requireFields("release-manifest.json", releaseManifest, [
    "releaseId",
    "assembledAt",
    "schemaVersion",
    "sourceGitCommit",
  ]);

  const releaseIds = new Set([
    dashboardData.releaseId,
    systemHealth.releaseId,
    releaseManifest.releaseId,
    routeEvents.releaseId,
  ]);
  if (releaseIds.size > 1) {
    fail(`Release IDs do not match across the four files: ${Array.from(releaseIds).join(", ")}`);
  }

  const eventIdsInGeojson = new Set(routeEvents.features.map((feature) => feature.id));
  for (const eventRef of dashboardData.eventRefs ?? []) {
    if (!eventIdsInGeojson.has(eventRef)) {
      fail(`dashboard-data.json references event "${eventRef}" that is missing from route-events.geojson`);
    }
  }

  console.log(`PASS: ${dir} — all four public package files are valid, release ${dashboardData.releaseId}`);
}

try {
  run(process.argv[2]);
} catch (err) {
  if (err instanceof ValidationFailure) {
    process.stderr.write(`FAIL: ${err.message}\n`);
    process.exit(1);
  }
  throw err;
}
