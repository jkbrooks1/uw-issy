#!/usr/bin/env node
// Usage: node scripts/validate-route-source.mjs <gpx-path>
// Buildspec section 8.5 / 35.1.

import { existsSync, readFileSync } from "node:fs";
import { assertWellFormedXml, GpxError, parseGpxTracks } from "./lib/gpx.mjs";

// Real-world reference points used only to sanity-check the *derived* bounding
// box of the GPX's own track content — never used as a substitute for it.
const UW_SEATTLE = { name: "UW Seattle", lat: 47.6553, lon: -122.3035 };
const ISSAQUAH = { name: "Issaquah, WA", lat: 47.5301, lon: -122.0326 };

const BOUNDS_PADDING_DEGREES = 0.2;
const MAX_PLAUSIBLE_SPAN_DEGREES = 1.0;

class ValidationFailure extends Error {}

function fail(reason) {
  throw new ValidationFailure(reason);
}

function run(gpxPath) {
  if (!gpxPath) {
    throw new ValidationFailure("usage: node scripts/validate-route-source.mjs <gpx-path>");
  }
  if (!existsSync(gpxPath)) {
    fail(`GPX file does not exist: ${gpxPath}`);
  }

  let xmlText;
  try {
    xmlText = readFileSync(gpxPath, "utf8");
  } catch (cause) {
    fail(`GPX file could not be read: ${gpxPath} (${cause.message})`);
  }

  try {
    assertWellFormedXml(xmlText);
  } catch (cause) {
    if (cause instanceof GpxError) {
      fail(`GPX is not valid XML: ${cause.message}`);
    }
    throw cause;
  }

  const { tracks } = parseGpxTracks(xmlText);
  const points = tracks.flatMap((track) => track.segments.flat());

  if (tracks.length < 1 || points.length < 2) {
    fail(
      `GPX has no usable route: found ${tracks.length} track(s) and ${points.length} track point(s); need at least 1 track with at least 2 points`,
    );
  }

  points.forEach((point, index) => {
    if (!Number.isFinite(point.lat) || point.lat < -90 || point.lat > 90) {
      fail(`Track point ${index} has invalid latitude: ${point.lat}`);
    }
  });
  points.forEach((point, index) => {
    if (!Number.isFinite(point.lon) || point.lon < -180 || point.lon > 180) {
      fail(`Track point ${index} has invalid longitude: ${point.lon}`);
    }
  });

  const lats = points.map((p) => p.lat);
  const lons = points.map((p) => p.lon);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);

  if (maxLat - minLat > MAX_PLAUSIBLE_SPAN_DEGREES || maxLon - minLon > MAX_PLAUSIBLE_SPAN_DEGREES) {
    fail(
      `Route bounds span too large to be a plausible UW-Issaquah route: lat span ${(maxLat - minLat).toFixed(4)}, lon span ${(maxLon - minLon).toFixed(4)}`,
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
        `Route bounds are not plausible for the UW-Issaquah route: padded bbox ` +
          `[lat ${paddedMinLat.toFixed(4)}..${paddedMaxLat.toFixed(4)}, lon ${paddedMinLon.toFixed(4)}..${paddedMaxLon.toFixed(4)}] ` +
          `does not contain reference point "${ref.name}" (${ref.lat}, ${ref.lon})`,
      );
    }
  }

  const totalSegments = tracks.reduce((sum, track) => sum + track.segments.length, 0);
  console.log(
    `PASS: ${gpxPath} — ${tracks.length} track(s), ${totalSegments} segment(s), ${points.length} point(s), ` +
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
