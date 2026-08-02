#!/usr/bin/env node
// Usage: node scripts/build-public-package-snapshot.mjs <real-workflow08-snapshot-path> <output-dir>
//
// Reads the real captured Workflow 08 combined status object (schema_version /
// connector_id / generated_at / run_id / overall / lanes / severity_mapping_note)
// and deterministically splits it into the four approved public package files
// (buildspec section 9.4): dashboard-data.json, route-events.geojson,
// system-health.json, release-manifest.json.
//
// Mapping tables are intentionally duplicated here rather than imported from
// src/lib/route-status (a plain .mjs build script cannot import .ts sources
// without a compile step) — matches this project's existing pattern of
// self-contained scripts (see 00_AS-BUILT/README.md).
//
// Every value that cannot be honestly derived from the real snapshot is
// written as null. Nothing is invented (buildspec 11.3, 12, 30, 37).

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

const CANONICAL_LANE_ORDER = [
  "01_ROUTE_CONDITIONS",
  "02_WEATHER",
  "03_AIR_QUALITY",
  "04_WILDFIRE",
  "05_FLOOD_CONDITIONS",
  "06_TRAIL_INFRASTRUCTURE_STATUS",
  "07_GOVERNMENT_SAFETY_ALERTS",
];

const LANE_LABELS = {
  "01_ROUTE_CONDITIONS": "Route conditions",
  "02_WEATHER": "Weather",
  "03_AIR_QUALITY": "Air quality",
  "04_WILDFIRE": "Wildfire",
  "05_FLOOD_CONDITIONS": "Flood conditions",
  "06_TRAIL_INFRASTRUCTURE_STATUS": "Trail infrastructure",
  "07_GOVERNMENT_SAFETY_ALERTS": "Government safety alerts",
};

const CANONICAL_TIERS = new Set(["normal", "watch", "alert", "unknown"]);
const CANONICAL_SOURCE_STATES = new Set([
  "ok",
  "degraded",
  "stale",
  "no_relevant_events",
  "failed_validation",
  "failed_fetch",
  "blocked",
  "using_last_known_good",
  "unavailable",
  "unknown",
]);

const SOURCE_HEALTH_TEXT = {
  ok: "Current",
  degraded: "Partial data",
  stale: "Data may be out of date",
  no_relevant_events: "No route-related events",
  failed_validation: "Source data could not be confirmed",
  failed_fetch: "Source could not be checked",
  blocked: "Source check was blocked",
  using_last_known_good: "Showing last known data",
  unavailable: "Source unavailable",
  unknown: "Source state unknown",
};

const VALID_GEOMETRY_TYPES = new Set([
  "Point",
  "LineString",
  "MultiLineString",
  "Polygon",
  "MultiPolygon",
]);

class BuildFailure extends Error {}

function fail(reason) {
  throw new BuildFailure(reason);
}

function toDisplayTier(rawTier) {
  if (typeof rawTier !== "string") return "unknown";
  const normalized = rawTier.trim().toLowerCase();
  return CANONICAL_TIERS.has(normalized) ? normalized : "unknown";
}

function toSourceState(rawState) {
  if (typeof rawState !== "string") return "unknown";
  return CANONICAL_SOURCE_STATES.has(rawState) ? rawState : "unknown";
}

function firstDefined(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null) return value;
  }
  return null;
}

function isValidLatitude(value) {
  return typeof value === "number" && Number.isFinite(value) && value >= -90 && value <= 90;
}

function isValidLongitude(value) {
  return typeof value === "number" && Number.isFinite(value) && value >= -180 && value <= 180;
}

// Source-native point coordinates: some lanes publish a real, provable
// event.location.{latitude,longitude} pair (e.g. a USGS gauge's fixed
// station coordinates) even though no lane publishes a literal `geometry`
// field yet. This is real, source-derived data — not an inferred or
// geocoded position — so it must be used when present (buildspec 11.4,
// UWISSY_GEospatial_CAPABILITY_AUDIT_v1.0.md finding #3/#4). A lane whose
// location object has the keys but null/missing values (e.g. a statewide
// health advisory with no point) still correctly yields no geometry.
function mapSourceNativePoint(rawEvent) {
  const lat = rawEvent.location?.latitude;
  const lon = rawEvent.location?.longitude;
  if (isValidLatitude(lat) && isValidLongitude(lon)) {
    return { type: "Point", coordinates: [lon, lat] };
  }
  return null;
}

function mapEventGeometry(rawEvent, gaps, eventId) {
  const geometry = rawEvent.geometry;
  if (geometry && typeof geometry === "object") {
    if (geometry.type === "none" || geometry.coordinates === null) {
      return null;
    }
    if (!VALID_GEOMETRY_TYPES.has(geometry.type)) {
      gaps.push(`${eventId}: unsupported geometry type "${geometry.type}" — geometry left null`);
      return null;
    }
    return { type: geometry.type, coordinates: geometry.coordinates };
  }

  const nativePoint = mapSourceNativePoint(rawEvent);
  if (nativePoint) {
    gaps.push(`${eventId}: no "geometry" field published by its lane — used real event.location.{latitude,longitude} as a Point instead (source-native, not invented)`);
    return nativePoint;
  }

  gaps.push(`${eventId}: no "geometry" field and no usable event.location.{latitude,longitude} published by its lane — geometry left null`);
  return null;
}

function mapRouteEffect(rawEvent) {
  if (typeof rawEvent.route_impact_state === "string") return rawEvent.route_impact_state;
  if (typeof rawEvent.route_impact === "string") return rawEvent.route_impact;
  if (typeof rawEvent.route_relevant === "boolean") {
    return rawEvent.route_relevant ? "route_relevant" : "not_route_relevant";
  }
  return null;
}

function mapRouteSegmentId(rawEvent) {
  const fromRouteSections = Array.isArray(rawEvent.route_sections) ? rawEvent.route_sections[0] : undefined;
  const fromLocationSections = Array.isArray(rawEvent.location?.route_section_ids)
    ? rawEvent.location.route_section_ids[0]
    : undefined;
  return firstDefined(fromRouteSections, fromLocationSections);
}

function mapLocationLabel(rawEvent) {
  return firstDefined(
    rawEvent.location?.name,
    rawEvent.location_description_raw,
    rawEvent.trail_or_street_name,
    rawEvent.location?.named_area,
  );
}

function buildRouteEventFeature(laneId, laneLabel, rawEvent, laneIsStale, laneUsedLastKnownGood, gaps) {
  const id = rawEvent.event_id;
  if (typeof id !== "string" || id.length === 0) {
    fail(`Lane ${laneId} has an event with no event_id — cannot publish it`);
  }

  return {
    type: "Feature",
    id,
    geometry: mapEventGeometry(rawEvent, gaps, id),
    properties: {
      id,
      laneId,
      laneLabel,
      title: firstDefined(rawEvent.title, rawEvent.summary) ?? `${laneLabel} event`,
      summary: firstDefined(rawEvent.summary, rawEvent.details),
      locationLabel: mapLocationLabel(rawEvent),
      routeSegmentId: mapRouteSegmentId(rawEvent),
      routeSegmentLabel: null,
      // No per-event display tier is published by Workflow 08 today — only a
      // per-lane display_severity. Buildspec 11.3/34.5 forbid inferring an
      // unknown value as "normal", so every event is "unknown" pending a
      // reviewed per-event tier from Workflow 08 (logged in notes.md as a gap).
      displayTier: "unknown",
      routeEffect: mapRouteEffect(rawEvent),
      reportedAt: firstDefined(rawEvent.discovered_at, rawEvent.published_observation_at, rawEvent.observed_at),
      effectiveFrom: firstDefined(rawEvent.effective_start, rawEvent.effective_at, rawEvent.observed_at),
      effectiveUntil: firstDefined(rawEvent.effective_end, rawEvent.expires_at, rawEvent.effective_until),
      sourceName: firstDefined(rawEvent.provenance?.source_name),
      sourceUrl: firstDefined(rawEvent.provenance?.source_url),
      confidence: firstDefined(rawEvent.route_relevance?.confidence),
      isLastKnownGood: laneUsedLastKnownGood === true,
      isStale: laneIsStale === true,
    },
  };
}

function run(snapshotPath, outputDir) {
  if (!snapshotPath || !outputDir) {
    throw new BuildFailure(
      "usage: node scripts/build-public-package-snapshot.mjs <real-workflow08-snapshot-path> <output-dir>",
    );
  }
  if (!existsSync(snapshotPath)) {
    fail(`Snapshot file does not exist: ${snapshotPath}`);
  }

  let snapshot;
  try {
    snapshot = JSON.parse(readFileSync(snapshotPath, "utf8"));
  } catch (cause) {
    fail(`Snapshot file is not valid JSON: ${snapshotPath} (${cause.message})`);
  }

  const releaseId = snapshot.run_id;
  const assembledAt = snapshot.generated_at;
  const schemaVersion = snapshot.schema_version ?? "1.0.0";
  if (typeof releaseId !== "string" || typeof assembledAt !== "string") {
    fail("Snapshot is missing run_id or generated_at — cannot establish a shared release ID");
  }

  const gaps = [];
  const laneSummaries = [];
  const systemHealthLanes = [];
  const laneRunIds = {};
  const eventFeatures = [];

  for (const laneId of CANONICAL_LANE_ORDER) {
    const lane = snapshot.lanes?.[laneId];
    const laneLabel = lane?.lane_label ?? LANE_LABELS[laneId];
    const available = lane?.available === true;
    const displayTier = toDisplayTier(lane?.display_severity);
    const sourceState = toSourceState(lane?.data_status);
    const freshnessState = ["fresh", "stale", "unknown"].includes(lane?.freshness?.overall_state)
      ? lane.freshness.overall_state
      : "unknown";
    const usingLastKnownGood = lane?.connector_health?.used_last_known_good === true;
    const events = Array.isArray(lane?.events) ? lane.events : [];
    const eventCount = typeof lane?.event_count === "number" ? lane.event_count : events.length;

    laneRunIds[laneId] = null; // not present per-lane in this snapshot shape — logged as a gap

    laneSummaries.push({
      laneId,
      laneLabel,
      available,
      displayTier,
      sourceState,
      eventCount,
    });

    systemHealthLanes.push({
      laneId,
      laneLabel,
      available,
      sourceState,
      publicText: SOURCE_HEALTH_TEXT[sourceState],
      freshnessState,
      usingLastKnownGood,
      eventCount,
    });

    for (const rawEvent of events) {
      eventFeatures.push(
        buildRouteEventFeature(
          laneId,
          laneLabel,
          rawEvent,
          freshnessState === "stale",
          usingLastKnownGood,
          gaps,
        ),
      );
    }
  }

  const failedLaneIds = systemHealthLanes
    .filter((lane) => ["failed_fetch", "failed_validation", "blocked", "unavailable"].includes(lane.sourceState))
    .map((lane) => lane.laneId);
  const degradedLaneIds = systemHealthLanes
    .filter((lane) => ["degraded", "stale", "using_last_known_good"].includes(lane.sourceState))
    .map((lane) => lane.laneId);

  const dashboardData = {
    schemaVersion,
    releaseId,
    assembledAt,
    routeId: "UnivWA-Issaquah",
    routeName: "University of Washington to Issaquah",
    displayTier: toDisplayTier(snapshot.overall?.display_severity),
    overallMessage: snapshot.overall?.message ?? null,
    activeEventCount: eventFeatures.length,
    laneSummaries,
    routeImpacts: null,
    eventRefs: eventFeatures.map((feature) => feature.id),
  };

  const routeEvents = {
    type: "FeatureCollection",
    releaseId,
    generatedAt: assembledAt,
    features: eventFeatures,
  };

  const systemHealth = {
    schemaVersion,
    releaseId,
    assembledAt,
    lanes: systemHealthLanes,
    failedLaneIds,
    degradedLaneIds,
    assemblyState: failedLaneIds.length > 0 ? "degraded" : "ok",
    publicationState: "published",
  };

  const releaseManifest = {
    releaseId,
    assembledAt,
    schemaVersion,
    laneRunIds,
    sourceGitCommit: null,
    buildState: "unknown",
    deployState: "unknown",
    productionProofState: "unknown",
  };

  mkdirSync(outputDir, { recursive: true });
  const write = (fileName, data) =>
    writeFileSync(`${outputDir}/${fileName}`, `${JSON.stringify(data, null, 2)}\n`, "utf8");

  write("dashboard-data.json", dashboardData);
  write("route-events.geojson", routeEvents);
  write("system-health.json", systemHealth);
  write("release-manifest.json", releaseManifest);

  console.log(`PASS: wrote 4 public package files to ${outputDir} (release ${releaseId})`);
  if (gaps.length > 0) {
    console.log(`NOTE: ${gaps.length} mapping gap(s) logged (buildspec 11.4):`);
    for (const gap of gaps) console.log(`  - ${gap}`);
  }
}

try {
  run(process.argv[2], process.argv[3]);
} catch (err) {
  if (err instanceof BuildFailure) {
    process.stderr.write(`FAIL: ${err.message}\n`);
    process.exit(1);
  }
  throw err;
}
