#!/usr/bin/env node
// Usage: node scripts/convert-route-gpx-to-geojson.mjs <gpx-path> <output-geojson-path>
// Buildspec section 7 / 8.2-8.5. Deterministic: the same input always
// produces byte-identical output — no timestamps, no random IDs. Must not
// import leaflet-gpx; the browser must never parse GPX (buildspec 22.4).

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { assertWellFormedXml, GpxError, parseGpxTracks } from "./lib/gpx.mjs";

class ConversionFailure extends Error {}

function fail(reason) {
  throw new ConversionFailure(reason);
}

function pointToCoordinate(point) {
  return point.ele === null ? [point.lon, point.lat] : [point.lon, point.lat, point.ele];
}

function run(gpxPath, outputPath) {
  if (!gpxPath || !outputPath) {
    throw new ConversionFailure(
      "usage: node scripts/convert-route-gpx-to-geojson.mjs <gpx-path> <output-geojson-path>",
    );
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

  const { metadataName, tracks } = parseGpxTracks(xmlText);

  // Only real segments found in the file become lines — never invented (buildspec 8.4).
  const segments = tracks.flatMap((track) =>
    track.segments
      .filter((points) => points.length >= 2)
      .map((points) => ({ trackName: track.name, points })),
  );

  if (segments.length === 0) {
    fail("GPX contains no usable track segment (need at least one segment with 2+ points)");
  }

  const name = metadataName ?? segments[0].trackName ?? null;

  let geometry;
  if (segments.length === 1) {
    geometry = {
      type: "LineString",
      coordinates: segments[0].points.map(pointToCoordinate),
    };
  } else {
    geometry = {
      type: "MultiLineString",
      coordinates: segments.map((segment) => segment.points.map(pointToCoordinate)),
    };
  }

  const pointCount = segments.reduce((sum, segment) => sum + segment.points.length, 0);

  const feature = {
    type: "Feature",
    properties: {
      name,
      trackNames: segments.map((segment) => segment.trackName),
      trackCount: tracks.length,
      segmentCount: segments.length,
      pointCount,
    },
    geometry,
  };

  const featureCollection = {
    type: "FeatureCollection",
    features: [feature],
  };

  const output = `${JSON.stringify(featureCollection, null, 2)}\n`;
  writeFileSync(outputPath, output, "utf8");
  console.log(`PASS: wrote ${outputPath} — ${geometry.type} with ${pointCount} point(s)`);
}

try {
  run(process.argv[2], process.argv[3]);
} catch (err) {
  if (err instanceof ConversionFailure) {
    process.stderr.write(`FAIL: ${err.message}\n`);
    process.exit(1);
  }
  throw err;
}
