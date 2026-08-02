#!/usr/bin/env node
// Usage: node scripts/validate-route-geojson.mjs <geojson-path>
// Buildspec section 31, step 6 — validates the *derived* route GeoJSON
// artifact actually written by convert-route-gpx-to-geojson.mjs, as a
// distinct CI step from validating the GPX source (validate-route-source.mjs)
// or converting it (convert-route-gpx-to-geojson.mjs). Never re-derives
// coordinates from the GPX; only checks the shape and plausibility of the
// file that will actually be served to the browser (buildspec 8.6).

import { existsSync, readFileSync } from "node:fs";

const UW_SEATTLE = { name: "UW Seattle", lat: 47.6553, lon: -122.3035 };
const ISSAQUAH = { name: "Issaquah, WA", lat: 47.5301, lon: -122.0326 };

const BOUNDS_PADDING_DEGREES = 0.2;
const MAX_PLAUSIBLE_SPAN_DEGREES = 1.0;
const VALID_GEOMETRY_TYPES = new Set(["LineString", "MultiLineString"]);

class ValidationFailure extends Error {}

function fail(reason) {
  throw new ValidationFailure(reason);
}

function collectCoordinates(geometry) {
  if (geometry.type === "LineString") return geometry.coordinates;
  if (geometry.type === "MultiLineString") return geometry.coordinates.flat();
  return [];
}

function run(geojsonPath) {
  if (!geojsonPath) {
    throw new ValidationFailure("usage: node scripts/validate-route-geojson.mjs <geojson-path>");
  }
  if (!existsSync(geojsonPath)) {
    fail(`Route GeoJSON does not exist: ${geojsonPath}`);
  }

  let parsed;
  try {
    parsed = JSON.parse(readFileSync(geojsonPath, "utf8"));
  } catch (cause) {
    fail(`Route GeoJSON is not valid JSON: ${cause.message}`);
  }

  if (parsed.type !== "FeatureCollection" || !Array.isArray(parsed.features)) {
    fail("Route GeoJSON is not a FeatureCollection with a features array");
  }
  if (parsed.features.length === 0) {
    fail("Route GeoJSON is empty: no features");
  }

  const feature = parsed.features[0];
  const geometry = feature?.geometry;
  if (!geometry || !VALID_GEOMETRY_TYPES.has(geometry.type)) {
    fail(`Route GeoJSON feature has an invalid geometry type: ${geometry?.type}`);
  }

  const coords = collectCoordinates(geometry);
  if (coords.length < 2) {
    fail(`Route GeoJSON geometry has too few coordinates: ${coords.length}`);
  }

  coords.forEach((coord, index) => {
    const [lon, lat] = coord;
    if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
      fail(`Route GeoJSON coordinate ${index} has invalid latitude: ${lat}`);
    }
    if (!Number.isFinite(lon) || lon < -180 || lon > 180) {
      fail(`Route GeoJSON coordinate ${index} has invalid longitude: ${lon}`);
    }
  });

  const lats = coords.map((c) => c[1]);
  const lons = coords.map((c) => c[0]);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);

  if (maxLat - minLat > MAX_PLAUSIBLE_SPAN_DEGREES || maxLon - minLon > MAX_PLAUSIBLE_SPAN_DEGREES) {
    fail(
      `Route GeoJSON bounds span too large to be a plausible UW-Issaquah route: lat span ${(maxLat - minLat).toFixed(4)}, lon span ${(maxLon - minLon).toFixed(4)}`,
    );
  }

  const paddedMinLat = minLat - BOUNDS_PADDING_DEGREES;
  const paddedMaxLat = maxLat + BOUNDS_PADDING_DEGREES;
  const paddedMinLon = minLon - BOUNDS_PADDING_DEGREES;
  const paddedMaxLon = maxLon + BOUNDS_PADDING_DEGREES;

  for (const ref of [UW_SEATTLE, ISSAQUAH]) {
    const withinLat = ref.lat >= paddedMinLat && ref.lat <= paddedMaxLat;
    const withinLon = ref.lon >= paddedMinLon && ref.lon <= paddedMaxLon;
    if (!withinLat || !withinLon) {
      fail(
        `Route GeoJSON bounds are not plausible for the UW-Issaquah route: padded bbox ` +
          `[lat ${paddedMinLat.toFixed(4)}..${paddedMaxLat.toFixed(4)}, lon ${paddedMinLon.toFixed(4)}..${paddedMaxLon.toFixed(4)}] ` +
          `does not contain reference point "${ref.name}" (${ref.lat}, ${ref.lon})`,
      );
    }
  }

  console.log(
    `PASS: ${geojsonPath} — ${geometry.type} with ${coords.length} coordinate(s), ` +
      `bounds [${minLat.toFixed(5)}, ${minLon.toFixed(5)}] to [${maxLat.toFixed(5)}, ${maxLon.toFixed(5)}], plausible for UW-Issaquah`,
  );
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
