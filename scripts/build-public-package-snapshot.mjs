#!/usr/bin/env node
// Usage: node scripts/build-public-package-snapshot.mjs <workflow20-status-latest-path> <output-dir> [audit-dir]
//
// Reads a real captured Status Publisher (workflow 20, formerly 08) combined status object (schema_version /
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
//
// NOISE-REDUCTION POLICY (2026-08-03): a normalized event fetched by a
// connector is not automatically fit for the public page. Each event is
// judged for route relevance, route-use effect, event type (health alerts
// excluded), severity, freshness, active period, and duplicate status
// before it may appear in `route-events.geojson`. Ineligible events are
// never deleted — they are written to a non-public audit file alongside a
// machine-readable reason, and the raw Status Publisher snapshot this script
// reads from is untouched.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

const CANONICAL_LANE_ORDER = [
  "01_ROUTE_CONDITIONS",
  "02_WEATHER",
  "03_AIR_QUALITY",
  "04_WILDFIRE",
  "05_FLOOD_CONDITIONS",
  "06_TRAIL_INFRASTRUCTURE_STATUS",
  "07_GOVERNMENT_SAFETY_ALERTS",
  "08_ROUTE_FACILITIES",
];

const LANE_LABELS = {
  "01_ROUTE_CONDITIONS": "Route conditions",
  "02_WEATHER": "Weather",
  "03_AIR_QUALITY": "Air quality",
  "04_WILDFIRE": "Wildfire",
  "05_FLOOD_CONDITIONS": "Flood conditions",
  "06_TRAIL_INFRASTRUCTURE_STATUS": "Trail infrastructure",
  "07_GOVERNMENT_SAFETY_ALERTS": "Government safety alerts",
  "08_ROUTE_FACILITIES": "Route facilities",
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
  degraded: "Degraded",
  stale: "Degraded",
  no_relevant_events: "Current",
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

// ---------------------------------------------------------------------------
// Noise-reduction policy constants
// ---------------------------------------------------------------------------

const SHORT_LIVED_FRESHNESS_HOURS = 48;
const LONG_RUNNING_CLOSURE_CHECK_HOURS = 24;

// Real `status` values seen across every lane in the evidence file: active,
// current, forecast, monitoring, closed, planned. Of these, "closed" and
// "planned" are themselves an ongoing/planned-closure signal regardless of
// which lane reported them or what event_type string they used — deliberately
// excludes "active" here, since "active" alone is also used by non-closure
// event types (e.g. lane 07 health advisories) and is already covered for
// real closures via laneId 01 / event_type "trail_closure" below. "current",
// "forecast", and "monitoring" are not closure signals, so they correctly
// stay on the generic short-lived-alert rule.
const ONGOING_OR_PLANNED_CLOSURE_STATUSES = new Set(["closed", "planned"]);

// Route-section ids observed across the evidence file are zero-padded
// two-digit ordinals ("01".."10", e.g. lane 06's "03"/"09" and lane 01's
// "09_east_lake_sammamish_trail_sammamish"), implying the route is divided
// into 10 ordinal sections start-to-end. No true section-boundary reference
// data exists anywhere in this repo (checked data/ and public/), so this is
// the most defensible non-invented structure available — logged as a gap
// wherever it is actually used to derive geometry.
const TOTAL_ROUTE_SECTIONS = 10;

// Route-relevance: only trust a route-relevance method that is genuinely
// tied to the route corridor (a named trail/street match, a close point-to-
// route distance, or an approved upstream-gauge relationship). Broad
// area/token matches (e.g. matching only on "Washington" or "Seattle") are
// exactly the false positive this policy exists to catch — never trusted.
const TRUSTED_ROUTE_RELEVANCE_METHODS = new Set([
  "named_trail_segment_matching",
  "point_to_route_distance",
  "upstream_relationship",
]);
const POINT_DISTANCE_TRUST_KM = 3;

const HEALTH_EVENT_TYPES = new Set([
  "public_health_advisory",
  "health_advisory",
  "health_alert",
  "disease_exposure_notice",
]);

// A health-originated event may still be shown, but only as a route-closure
// or access event — never as a health-warning card. Requires an explicit,
// direct closure/access signal, not an inferred one.
const CLOSURE_TEXT_PATTERN =
  /\b(route closed|trail closed|bridge closed|access blocked|evacuation order|travel prohibited|hazardous spill|active fire zone|police closure)\b/i;

// Real flood categories seen from NWS/NWPS gauges, worst to least severe.
// Anything not in the "major or worse" set — including raw USGS
// site:param:stat identifiers reused as a category, "no_flooding",
// "not_defined", "action", "minor", "moderate", "unknown", "n/a" — is
// correctly treated as not-major.
const MAJOR_OR_WORSE_FLOOD_CATEGORIES = new Set(["major", "record", "catastrophic"]);

const CAP_SEVERE_OR_EXTREME = new Set(["severe", "extreme"]);
const CAP_KNOWN_SEVERITIES = new Set(["extreme", "severe", "moderate", "minor", "unknown"]);

// Route-segment/trail alias normalization for both route-relevance text
// matching and duplicate-title grouping (buildspec: BG/SRT/ELST aliases).
const ALIAS_SUBSTITUTIONS = [
  [/\bburke[\s-]?gilman(?:\s+trail)?\b/gi, "bg trail"],
  [/\bbg\b/gi, "bg trail"],
  [/\bsammamish river trail\b/gi, "srt trail"],
  [/\bsrt\b/gi, "srt trail"],
  [/\beast lake sammamish trail\b/gi, "elst trail"],
  [/\belst\b/gi, "elst trail"],
];

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

// Real, resolvable route-segment id (see mapRouteSegmentId) drawn from the
// event's own route_sections / location.route_section_ids field. Some ids
// are the bare two-digit ordinal ("03"), others are a longer descriptive
// slug with the same ordinal as a prefix ("09_east_lake_sammamish_trail_
// sammamish") — both real, both grounded in the source data.
function extractSectionOrdinal(routeSegmentId) {
  if (typeof routeSegmentId !== "string") return null;
  const match = routeSegmentId.match(/^(\d{1,2})/);
  if (!match) return null;
  const ordinal = Number.parseInt(match[1], 10);
  return ordinal >= 1 && ordinal <= TOTAL_ROUTE_SECTIONS ? ordinal : null;
}

let cachedRouteLineCoordinates = null;

// Reads the real, GPX-derived canonical route LineString once per run.
// Never generates or geocodes a coordinate — every coordinate returned here
// is a real point already present in public/routes/UnivWA-Issaquah.geojson.
function loadRouteLineCoordinates(gaps) {
  if (cachedRouteLineCoordinates !== null) return cachedRouteLineCoordinates;
  try {
    const url = new URL("../public/routes/UnivWA-Issaquah.geojson", import.meta.url);
    const routeGeojson = JSON.parse(readFileSync(url, "utf8"));
    const coords = routeGeojson?.features?.[0]?.geometry?.coordinates;
    cachedRouteLineCoordinates = Array.isArray(coords) ? coords : [];
  } catch (cause) {
    gaps.push(`route-line: could not load canonical route geometry for segment-derived fallback geometry (${cause.message})`);
    cachedRouteLineCoordinates = [];
  }
  return cachedRouteLineCoordinates;
}

// Splits the real route line into TOTAL_ROUTE_SECTIONS equal-count chunks
// by point index and returns the real coordinates for one ordinal chunk.
// This is an ordinal approximation (real section lengths are not equal),
// not a geocoded segment boundary — every caller logs that as a gap.
function getRouteSectionChunkCoordinates(sectionOrdinal, routeCoords) {
  if (routeCoords.length === 0) return null;
  const chunkSize = Math.floor(routeCoords.length / TOTAL_ROUTE_SECTIONS);
  if (chunkSize === 0) return null;
  const startIdx = (sectionOrdinal - 1) * chunkSize;
  if (startIdx >= routeCoords.length) return null;
  const endIdx = sectionOrdinal === TOTAL_ROUTE_SECTIONS ? routeCoords.length - 1 : startIdx + chunkSize;
  return routeCoords.slice(startIdx, Math.min(endIdx + 1, routeCoords.length));
}

// A real "between X and Y" closure description, or a route_relevance
// matched_terms list of [trail name, ...endpoint terms], names two real
// cross-street/endpoint terms. Returns them verbatim — never invented.
function extractNamedEndpointTerms(rawEvent) {
  const text = rawEvent.location_description_raw;
  if (typeof text === "string") {
    const match = text.match(/between\s+(.+?)\s+and\s+(.+?)\.?\s*$/i);
    if (match) return [match[1].trim(), match[2].trim()];
  }
  const matchedTerms = rawEvent.route_relevance?.matched_terms;
  if (Array.isArray(matchedTerms) && matchedTerms.length >= 3) {
    return [matchedTerms[matchedTerms.length - 2], matchedTerms[matchedTerms.length - 1]];
  }
  return null;
}

// Real fallback for an event with no raw geometry/location but a real,
// resolvable routeSegmentId: derive geometry from the real canonical route
// line instead of discarding the event's location entirely. When the event
// names two real endpoint terms, use the matched section's full real
// coordinate range as the best-defensible bounded stretch (the exact
// position of the named cross streets along the line is not geocoded in
// this repo). Otherwise fall back to the section's real midpoint Point.
// Every use is logged to `gaps` — never a silent guess.
function deriveRouteSegmentFallbackGeometry(rawEvent, gaps, eventId) {
  const routeSegmentId = mapRouteSegmentId(rawEvent);
  if (!routeSegmentId) return null;

  const sectionOrdinal = extractSectionOrdinal(routeSegmentId);
  if (sectionOrdinal === null) {
    gaps.push(`${eventId}: routeSegmentId "${routeSegmentId}" has no recognizable 01-${TOTAL_ROUTE_SECTIONS} ordinal section number — cannot derive fallback geometry from the canonical route line — geometry left null`);
    return null;
  }

  const routeCoords = loadRouteLineCoordinates(gaps);
  const chunkCoords = getRouteSectionChunkCoordinates(sectionOrdinal, routeCoords);
  if (!chunkCoords || chunkCoords.length === 0) {
    gaps.push(`${eventId}: could not derive a coordinate range for section ${sectionOrdinal} from the canonical route line — geometry left null`);
    return null;
  }

  const endpointTerms = extractNamedEndpointTerms(rawEvent);
  if (endpointTerms) {
    gaps.push(
      `${eventId}: no raw geometry/location published — derived a LineString from the real canonical route line for section "${routeSegmentId}" (ordinal ${sectionOrdinal} of ${TOTAL_ROUTE_SECTIONS}), the best-defensible bounded stretch for its real named endpoints "${endpointTerms[0]}" and "${endpointTerms[1]}" (their exact positions along the line are not geocoded in this repo, so the full section range is used instead of two invented endpoint coordinates)`,
    );
    return { type: "LineString", coordinates: chunkCoords };
  }

  const midIndex = Math.floor(chunkCoords.length / 2);
  gaps.push(
    `${eventId}: no raw geometry/location and no two named endpoint terms in its location text — used the real canonical route line's midpoint within section "${routeSegmentId}" (ordinal ${sectionOrdinal} of ${TOTAL_ROUTE_SECTIONS}) as a representative Point instead (source-derived from the canonical route, not invented)`,
  );
  return { type: "Point", coordinates: chunkCoords[midIndex] };
}

function mapEventGeometry(rawEvent, gaps, eventId) {
  const geometry = rawEvent.geometry;
  if (geometry && typeof geometry === "object" && geometry.type !== "none" && geometry.coordinates !== null) {
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

  if (
    rawEvent.source_id === "01_ROUTE_CONDITIONS:KC-03" &&
    rawEvent.event_type === "trail_closure" &&
    rawEvent.provenance?.source_url ===
      "https://kingcounty.gov/en/dept/dnrp/nature-recreation/parks-recreation/king-county-parks/trails/leafline-trails/east-lake-sammamish"
  ) {
    gaps.push(
      `${eventId}: King County source states a 600 ft ELST closure between Louis Thompson Rd NE and NE Inglewood Hill Rd; exact endpoint coordinates are not published in project data, so used the official source-linked closure map point instead of the overbroad canonical route-section LineString`,
    );
    return { type: "Point", coordinates: [-122.06792, 47.617432] };
  }

  const fallbackGeometry = deriveRouteSegmentFallbackGeometry(rawEvent, gaps, eventId);
  if (fallbackGeometry) return fallbackGeometry;

  gaps.push(`${eventId}: no "geometry" field, no usable event.location.{latitude,longitude}, and no resolvable route segment published by its lane — geometry left null`);
  return null;
}

function mapRouteEffect(rawEvent) {
  if (isClosureSignalEvent(rawEvent)) return "Segment closed";
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

// Human-readable label for the resolved route segment, grounded in the same
// event's own real trail/facility fields (no separate invented lookup
// table exists in this repo — checked data/ and public/ first). Only
// populated when a routeSegmentId is actually resolvable for the event.
function mapRouteSegmentLabel(rawEvent) {
  if (!mapRouteSegmentId(rawEvent)) return null;
  return firstDefined(
    rawEvent.trail_or_street_name,
    Array.isArray(rawEvent.facilities) && rawEvent.facilities.length > 0 ? rawEvent.facilities[0] : undefined,
    rawEvent.location?.name,
    rawEvent.location?.named_area,
  );
}

function mapPublicSummary(rawEvent) {
  const summary = firstDefined(rawEvent.summary, rawEvent.details);
  if (typeof summary !== "string") return null;
  const trimmed = summary.trim();
  if (trimmed.startsWith("{") || trimmed.includes("\\r") || trimmed.includes("\r")) return null;
  if (trimmed.length > 280) return null;
  return trimmed;
}

function mapTrailName(rawEvent) {
  const trailName = firstDefined(rawEvent.trail_or_street_name, mapRouteSegmentLabel(rawEvent));
  return typeof trailName === "string" && trailName.trim().length > 0 ? trailName.trim() : null;
}

function mapMeaningfulLocation(rawEvent) {
  const location = mapLocationLabel(rawEvent);
  if (typeof location === "string" && location.trim().length > 0) return location.trim();
  const endpointTerms = extractNamedEndpointTerms(rawEvent);
  if (endpointTerms) return `Between ${endpointTerms[0]} and ${endpointTerms[1]}.`;
  return null;
}

function mapAlertNature(rawEvent) {
  if (isClosureSignalEvent(rawEvent)) {
    return firstDefined(mapPublicSummary(rawEvent), rawEvent.title);
  }
  if (typeof rawEvent.route_impact === "string" && rawEvent.route_impact.trim().length > 0) {
    return firstDefined(mapPublicSummary(rawEvent), rawEvent.title, rawEvent.route_impact);
  }
  if (typeof rawEvent.route_impact_state === "string" && DIRECT_ROUTE_IMPACT_STATES.has(rawEvent.route_impact_state)) {
    return firstDefined(mapPublicSummary(rawEvent), rawEvent.title);
  }
  return null;
}

function qualifyPublicAlert(rawEvent) {
  const trailName = mapTrailName(rawEvent);
  const location = mapMeaningfulLocation(rawEvent);
  const alertNature = mapAlertNature(rawEvent);
  return {
    qualified: Boolean(trailName && location && alertNature),
    trailName,
    location,
    alertNature,
  };
}

// ---------------------------------------------------------------------------
// Noise-reduction policy: route relevance
// ---------------------------------------------------------------------------

/**
 * True only when a genuinely route-tied signal exists: a named trail/street
 * match, a close point-to-route distance, an approved upstream-gauge
 * relationship, or an explicit route-section mapping. Broad area matches
 * (state, county, region, or a bare place-name token) are never sufficient
 * on their own — this is the exact false positive the policy targets.
 */
function classifyRouteRelevance(rawEvent) {
  const rel = rawEvent.route_relevance;
  if (rel && typeof rel === "object") {
    if (rel.classification === "not_route_relevant") return false;

    // A real, named match to one or more known route sections is itself a
    // provable route-corridor tie (the exact "named trail/street match" the
    // policy comment above already trusts) regardless of which method-label
    // string the connector used — lane 06 reports this real signal via
    // route_relevance.matched_route_sections instead of one of the
    // pre-approved method names. This is distinct from lane 07's broad
    // matched_tokens area matches, which stay untrusted below.
    if (
      rel.classification === "confirmed_route_impact" &&
      Array.isArray(rel.matched_route_sections) &&
      rel.matched_route_sections.length > 0
    ) {
      return true;
    }

    if (!TRUSTED_ROUTE_RELEVANCE_METHODS.has(rel.method)) return false;
    if (rel.method === "point_to_route_distance") {
      const distance = rel.distance_km ?? rel.distance_to_route_km;
      return typeof distance === "number" && distance <= POINT_DISTANCE_TRUST_KM;
    }
    return true;
  }

  // Lane 03 (air quality) shape: a bare boolean plus explicit route
  // section IDs naming a known route part — a trusted source mapping to a
  // known route segment (buildspec route-relevance rule, bullet 3).
  if (rawEvent.route_relevant === true && Array.isArray(rawEvent.route_sections) && rawEvent.route_sections.length > 0) {
    return true;
  }

  return false;
}

// ---------------------------------------------------------------------------
// Noise-reduction policy: health-alert exclusion
// ---------------------------------------------------------------------------

function classifyHealthAlert(rawEvent) {
  return HEALTH_EVENT_TYPES.has(rawEvent.event_type);
}

/** A health-originated event may be shown only as a closure/access event, never as a health-warning card. */
function healthEventCausesRouteClosure(rawEvent) {
  const text = [rawEvent.title, rawEvent.summary, rawEvent.details, rawEvent.public_action]
    .filter((v) => typeof v === "string")
    .join(" ");
  return CLOSURE_TEXT_PATTERN.test(text);
}

// ---------------------------------------------------------------------------
// Noise-reduction policy: flood threshold
// ---------------------------------------------------------------------------

function normalizeFloodCategory(rawCategory) {
  if (typeof rawCategory !== "string") return "unknown";
  const normalized = rawCategory.trim().toLowerCase();
  // Raw USGS site:param:stat identifiers (e.g. "USGS:12121600:00060:00000")
  // are reused as `official_category` by some sources but are not a real
  // flood category at all — never treat them as major.
  if (normalized.startsWith("usgs:")) return "unknown";
  return normalized;
}

function isMajorFloodCategory(rawCategory) {
  return MAJOR_OR_WORSE_FLOOD_CATEGORIES.has(normalizeFloodCategory(rawCategory));
}

// ---------------------------------------------------------------------------
// Noise-reduction policy: route-use effect
// ---------------------------------------------------------------------------

const DIRECT_ROUTE_IMPACT_STATES = new Set(["confirmed_route_impact"]);

function classifyRouteImpact(laneId, rawEvent) {
  if (laneId === "05_FLOOD_CONDITIONS") {
    // A flood event only has a proven route-use effect when it both meets
    // the major-or-worse threshold and reports a flood-related effect —
    // a bare "elevated_water" label on a non-major reading is exactly the
    // vague-label case the policy excludes.
    return isMajorFloodCategory(rawEvent.official_category) && typeof rawEvent.route_impact === "string";
  }

  if (typeof rawEvent.route_impact_state === "string") {
    return DIRECT_ROUTE_IMPACT_STATES.has(rawEvent.route_impact_state);
  }

  // Some lanes (e.g. 06) publish the same confirmed-impact signal nested
  // under route_relevance.classification instead of a top-level
  // route_impact_state field — same real value, different real location.
  if (typeof rawEvent.route_relevance?.classification === "string") {
    return DIRECT_ROUTE_IMPACT_STATES.has(rawEvent.route_relevance.classification);
  }

  return false;
}

// ---------------------------------------------------------------------------
// Noise-reduction policy: government CAP-style severity
// ---------------------------------------------------------------------------

function normalizeCapSeverity(rawSeverity) {
  if (typeof rawSeverity !== "string") return "unknown";
  const normalized = rawSeverity.trim().toLowerCase();
  return CAP_KNOWN_SEVERITIES.has(normalized) ? normalized : "unknown";
}

function governmentAlertPassesSeverityRule(rawEvent) {
  const severity = normalizeCapSeverity(rawEvent.cap_severity ?? rawEvent.severity);
  if (CAP_SEVERE_OR_EXTREME.has(severity)) return true;
  // No usable CAP severity: allow only when the source text itself states
  // a direct route effect. Never infer severe impact from vague text.
  const text = [rawEvent.title, rawEvent.summary, rawEvent.details]
    .filter((v) => typeof v === "string")
    .join(" ");
  return CLOSURE_TEXT_PATTERN.test(text);
}

// ---------------------------------------------------------------------------
// Noise-reduction policy: freshness and long-running closures
// ---------------------------------------------------------------------------

function deriveLastSourceRefreshAt(rawEvent) {
  return firstDefined(
    rawEvent.last_verified_at,
    rawEvent.provenance?.retrieved_at,
    rawEvent.retrieved_at,
    rawEvent.observed_at,
  );
}

function parseTimeMs(iso) {
  if (typeof iso !== "string") return null;
  const ms = Date.parse(iso);
  return Number.isFinite(ms) ? ms : null;
}

function endDateMs(rawEvent) {
  const endIso = firstDefined(rawEvent.effective_end, rawEvent.expires_at, rawEvent.effective_until);
  return parseTimeMs(endIso);
}

function hasValidFutureEndDate(rawEvent, buildNowMs) {
  const endMs = endDateMs(rawEvent);
  return endMs !== null && endMs > buildNowMs;
}

function hasPassedEndDate(rawEvent, buildNowMs) {
  const endMs = endDateMs(rawEvent);
  return endMs !== null && endMs <= buildNowMs;
}

function isCheckedRecently(lastSourceRefreshAt, buildNowMs, hours) {
  const refreshMs = parseTimeMs(lastSourceRefreshAt);
  if (refreshMs === null) return false;
  return buildNowMs - refreshMs <= hours * 60 * 60 * 1000;
}

// A closure-type event follows the long-running-closure rules exclusively
// (stated end date, or active + checked within 24h) — it never falls back
// to the generic 48h short-lived-alert rule, which exists for advisories,
// not closures. Everything else follows the short-lived-alert rule only.
function isClosureTypeEvent(laneId, rawEvent) {
  return (
    laneId === "01_ROUTE_CONDITIONS" ||
    rawEvent.event_type === "trail_closure" ||
    ONGOING_OR_PLANNED_CLOSURE_STATUSES.has(rawEvent.status)
  );
}

/**
 * Returns "fresh" (eligible on freshness grounds), "expired" (had a stated
 * active period that has definitively ended), or "stale" (no valid recent
 * source refresh, no closure exemption applies). Build time never
 * substitutes for a real source refresh time; a missing refresh time is
 * not fit for public display unless the closure exemption applies.
 */
function deriveFreshnessState(laneId, rawEvent, lastSourceRefreshAt, buildNowMs) {
  if (hasValidFutureEndDate(rawEvent, buildNowMs)) return "fresh";

  if (isClosureTypeEvent(laneId, rawEvent)) {
    if (hasPassedEndDate(rawEvent, buildNowMs)) return "expired";
    const hasCurrentClosureStatus = rawEvent.status === "active" || ONGOING_OR_PLANNED_CLOSURE_STATUSES.has(rawEvent.status);
    if (hasCurrentClosureStatus && isCheckedRecently(lastSourceRefreshAt, buildNowMs, LONG_RUNNING_CLOSURE_CHECK_HOURS)) {
      return "fresh";
    }
    return "stale";
  }

  if (hasPassedEndDate(rawEvent, buildNowMs)) return "expired";
  if (isCheckedRecently(lastSourceRefreshAt, buildNowMs, SHORT_LIVED_FRESHNESS_HOURS)) return "fresh";
  return "stale";
}

// ---------------------------------------------------------------------------
// Noise-reduction policy: single-event eligibility decision
// ---------------------------------------------------------------------------

/**
 * Judges one raw event against the full noise-reduction policy, in the
 * priority order documented in the policy spec: health exclusion, flood
 * threshold, government severity, route relevance, route-use effect,
 * freshness. Returns the decision plus every fact used to make it, so the
 * caller can both build the public feature and write an honest audit
 * record for hidden items. Duplicate merging is a separate, later pass.
 */
function evaluateEventEligibility(laneId, rawEvent, buildNowMs) {
  const routeRelevant = classifyRouteRelevance(rawEvent);
  const routeImpact = classifyRouteImpact(laneId, rawEvent);
  const isHealthAlert = classifyHealthAlert(rawEvent);
  const lastSourceRefreshAt = deriveLastSourceRefreshAt(rawEvent);
  const freshnessState = deriveFreshnessState(laneId, rawEvent, lastSourceRefreshAt, buildNowMs);
  const publicAlertQualification = qualifyPublicAlert(rawEvent);

  if (isHealthAlert && !healthEventCausesRouteClosure(rawEvent)) {
    return { eligible: false, reason: "health_alert_excluded", routeRelevant, routeImpact, lastSourceRefreshAt, freshnessState, publicAlertQualification };
  }

  if (laneId === "05_FLOOD_CONDITIONS") {
    if (!isMajorFloodCategory(rawEvent.official_category)) {
      const reason = normalizeFloodCategory(rawEvent.official_category) === "unknown"
        ? "flood_no_active_category"
        : "flood_below_major";
      return { eligible: false, reason, routeRelevant, routeImpact, lastSourceRefreshAt, freshnessState, publicAlertQualification };
    }
  }

  if (laneId === "07_GOVERNMENT_SAFETY_ALERTS" && !isHealthAlert) {
    if (!governmentAlertPassesSeverityRule(rawEvent)) {
      return { eligible: false, reason: "low_severity_government_alert", routeRelevant, routeImpact, lastSourceRefreshAt, freshnessState, publicAlertQualification };
    }
  }

  if (!routeRelevant) {
    const reason = mapLocationLabel(rawEvent) || mapRouteSegmentId(rawEvent) ? "off_route" : "unknown_or_unusable_location";
    return { eligible: false, reason, routeRelevant, routeImpact, lastSourceRefreshAt, freshnessState, publicAlertQualification };
  }

  if (!routeImpact) {
    return { eligible: false, reason: "no_route_impact", routeRelevant, routeImpact, lastSourceRefreshAt, freshnessState, publicAlertQualification };
  }

  if (freshnessState === "expired") {
    return { eligible: false, reason: "expired", routeRelevant, routeImpact, lastSourceRefreshAt, freshnessState, publicAlertQualification };
  }
  if (freshnessState === "stale") {
    return { eligible: false, reason: "stale_short_lived_alert", routeRelevant, routeImpact, lastSourceRefreshAt, freshnessState, publicAlertQualification };
  }

  if (!publicAlertQualification.qualified) {
    return { eligible: false, reason: "public_alert_unqualified", routeRelevant, routeImpact, lastSourceRefreshAt, freshnessState, publicAlertQualification };
  }

  return { eligible: true, reason: "eligible", routeRelevant, routeImpact, lastSourceRefreshAt, freshnessState, publicAlertQualification };
}

// ---------------------------------------------------------------------------
// Noise-reduction policy: duplicate detection and merging
// ---------------------------------------------------------------------------

function normalizeForGrouping(text) {
  if (typeof text !== "string" || text.length === 0) return "";
  let normalized = text.toLowerCase();
  for (const [pattern, replacement] of ALIAS_SUBSTITUTIONS) {
    normalized = normalized.replace(pattern, replacement);
  }
  return normalized
    .replace(/\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g, "") // repeated date text
    .replace(/[^a-z0-9\s]/g, " ") // punctuation
    .replace(/\s+/g, " ") // excess spaces
    .trim();
}

function eventClassBucket(laneId, rawEvent) {
  if (laneId === "05_FLOOD_CONDITIONS") return "flood_observation";
  if (laneId === "01_ROUTE_CONDITIONS" || rawEvent.event_type === "trail_closure") return "closure";
  if (laneId === "07_GOVERNMENT_SAFETY_ALERTS") return "gov_alert";
  return laneId;
}

/**
 * Groups candidates that describe the same basic hazard or closure: same
 * event class, same route segment (or, failing that, the same normalized/
 * alias-substituted location or title text), favoring merge over split.
 * Deliberately excludes lane ID from the key so the same real-world event
 * reported by two different agencies still merges (buildspec duplicate
 * policy, test 36). Different route segments always produce different
 * keys, so unrelated events on different route parts never collide.
 */
function computeDuplicateGroupKey(laneId, rawEvent) {
  const bucket = eventClassBucket(laneId, rawEvent);
  const segmentKey =
    mapRouteSegmentId(rawEvent) ||
    normalizeForGrouping(mapLocationLabel(rawEvent)) ||
    normalizeForGrouping(firstDefined(rawEvent.title, rawEvent.summary) ?? "");
  if (!segmentKey) return null;
  return `${bucket}::${segmentKey}`;
}

const SEVERITY_RANK = { extreme: 5, severe: 4, high: 3, moderate: 2, advisory: 2, minor: 1, info: 1, unknown: 0 };

function severityRank(rawEvent) {
  const raw = (rawEvent.cap_severity ?? rawEvent.severity ?? "unknown").toString().trim().toLowerCase();
  return SEVERITY_RANK[raw] ?? 0;
}

/**
 * Picks one representative per duplicate group (newest valid refresh time,
 * tie-broken by highest severity, then clearest/longest title), and
 * collects every member's source URL into a short, de-duplicated list.
 * Every non-representative member is suppressed with `duplicate_merged`.
 */
function mergeDuplicateGroup(members) {
  const sorted = [...members].sort((a, b) => {
    const refreshDiff = (parseTimeMs(b.decision.lastSourceRefreshAt) ?? -Infinity) - (parseTimeMs(a.decision.lastSourceRefreshAt) ?? -Infinity);
    if (refreshDiff !== 0) return refreshDiff;
    const severityDiff = severityRank(b.rawEvent) - severityRank(a.rawEvent);
    if (severityDiff !== 0) return severityDiff;
    const titleA = (firstDefined(a.rawEvent.title, a.rawEvent.summary) ?? "").length;
    const titleB = (firstDefined(b.rawEvent.title, b.rawEvent.summary) ?? "").length;
    return titleB - titleA;
  });

  const representative = sorted[0];
  const sourceUrls = [
    ...new Set(
      sorted
        .map((m) => m.rawEvent.provenance?.source_url)
        .filter((url) => typeof url === "string" && url.length > 0),
    ),
  ];

  return { representative, sourceUrls, suppressed: sorted.slice(1) };
}

// ---------------------------------------------------------------------------
// Round 2 rider-facing enrichment (Step 1) — real upstream fields only.
// Never invents a value a lane does not really supply (same "no silent
// inference" rule as the rest of this script).
// ---------------------------------------------------------------------------

function mapSeverity(rawEvent) {
  return firstDefined(rawEvent.severity, rawEvent.cap_severity);
}

// The event's own raw status string, distinct from the per-lane
// display_severity mapped elsewhere in this file.
function mapCurrentStatus(rawEvent) {
  return isClosureSignalEvent(rawEvent) ? firstDefined(rawEvent.status) : null;
}

function mapDetourAvailable(rawEvent) {
  return typeof rawEvent.detour_available === "boolean" ? rawEvent.detour_available : null;
}

function mapDetourDescription(rawEvent) {
  if (rawEvent.detour_available === true && typeof rawEvent.detour_description === "string") return rawEvent.detour_description;
  if (rawEvent.detour_available === false) return "No";
  return null;
}

function mapClosureName(rawEvent) {
  if (!isClosureSignalEvent(rawEvent)) return null;
  return firstDefined(rawEvent.trail_or_street_name, rawEvent.title, rawEvent.summary);
}

function mapClosureEndpoint(rawEvent, index) {
  const terms = extractNamedEndpointTerms(rawEvent);
  return terms ? terms[index] : null;
}

function mapClosedLengthMiles(rawEvent) {
  const explicitFeet = firstDefined(rawEvent.closed_length_feet, rawEvent.closure_length_feet);
  if (typeof explicitFeet === "number" && Number.isFinite(explicitFeet)) return Number((explicitFeet / 5280).toFixed(2));

  if (
    rawEvent.source_id === "01_ROUTE_CONDITIONS:KC-03" &&
    rawEvent.event_type === "trail_closure" &&
    rawEvent.provenance?.source_url ===
      "https://kingcounty.gov/en/dept/dnrp/nature-recreation/parks-recreation/king-county-parks/trails/leafline-trails/east-lake-sammamish"
  ) {
    return Number((600 / 5280).toFixed(2));
  }

  const text = [rawEvent.details, rawEvent.summary, rawEvent.location_description_raw]
    .filter((value) => typeof value === "string")
    .join(" ");
  const feetMatch = text.match(/\b(\d+(?:\.\d+)?)\s*ft\b/i);
  if (feetMatch) return Number((Number.parseFloat(feetMatch[1]) / 5280).toFixed(2));

  const milesMatch = text.match(/\b(\d+(?:\.\d+)?)\s*mi(?:le|les)?\b/i);
  if (milesMatch) return Number(Number.parseFloat(milesMatch[1]).toFixed(2));

  return null;
}

function mapClosedLengthSource(rawEvent) {
  return mapClosedLengthMiles(rawEvent) === null ? null : "official_source_distance";
}

function mapClosureHours(rawEvent) {
  return firstDefined(rawEvent.closure_hours, rawEvent.hours);
}

function mapProjectedEndDate(rawEvent) {
  if (typeof rawEvent.projected_end_date === "string") return rawEvent.projected_end_date;
  const text = [rawEvent.details, rawEvent.summary].filter((value) => typeof value === "string").join(" ");
  if (/through the end of 2026/i.test(text) || /through the rest of the year/i.test(text)) return "End of 2026";
  return null;
}

function mapRouteAction(rawEvent) {
  if (!isClosureSignalEvent(rawEvent)) return null;
  return rawEvent.detour_available === false ? "No" : null;
}

// A closure/access signal exists when the event's own status is "closed" or
// "planned" (see ONGOING_OR_PLANNED_CLOSURE_STATUSES above), or when the
// status is "active" and the event's own event_type is "trail_closure" —
// the exact same real-field combination isClosureTypeEvent already uses to
// decide freshness. Reuses that signal rather than inventing a second
// closure heuristic. Non-closure events (gauge readings, forecasts,
// advisories) get riderCanPass: null — passability is not a meaningful
// question for them.
function isClosureSignalEvent(rawEvent) {
  return rawEvent.event_type === "trail_closure" && (rawEvent.status === "active" || ONGOING_OR_PLANNED_CLOSURE_STATUSES.has(rawEvent.status));
}

// Never invents "yes": a rider-passable claim would require an explicit
// source statement that riders can get through, which no lane in this
// evidence file publishes. A confirmed closure with detour_available:false
// is the strongest real signal available — "no". A closure with no
// detour_available field, or detour_available:true (an alternate route
// exists, but that is not the same claim as "you can ride through this
// exact point"), stays "unknown" rather than guessing either way.
function mapRiderCanPass(rawEvent) {
  if (!isClosureSignalEvent(rawEvent)) return null;
  const detourAvailable = mapDetourAvailable(rawEvent);
  if (detourAvailable === false) return "no";
  return "unknown";
}

function buildRouteEventFeature(laneId, laneLabel, rawEvent, laneIsStale, laneUsedLastKnownGood, geometry, decision, mergedSourceUrls, duplicateGroupKey) {
  const id = rawEvent.event_id;
  if (typeof id !== "string" || id.length === 0) {
    fail(`Lane ${laneId} has an event with no event_id — cannot publish it`);
  }

  const primarySourceUrl = firstDefined(rawEvent.provenance?.source_url);

  return {
    type: "Feature",
    id,
    geometry,
    properties: {
      id,
      laneId,
      laneLabel,
      title: firstDefined(rawEvent.title, rawEvent.summary) ?? laneLabel,
      summary: mapPublicSummary(rawEvent),
      locationLabel: mapLocationLabel(rawEvent),
      trailName: mapTrailName(rawEvent),
      alertNature: mapAlertNature(rawEvent),
      routeSegmentId: mapRouteSegmentId(rawEvent),
      routeSegmentLabel: mapRouteSegmentLabel(rawEvent),
      // No per-event display tier is published by the Status Publisher today — only a
      // per-lane display_severity. Buildspec 11.3/34.5 forbid inferring an
      // unknown value as "normal", so every event is "unknown" pending a
      // reviewed per-event tier from the Status Publisher (logged in notes.md as a gap).
      displayTier: "unknown",
      routeEffect: mapRouteEffect(rawEvent),
      reportedAt: firstDefined(rawEvent.discovered_at, rawEvent.published_observation_at, rawEvent.observed_at),
      effectiveFrom: firstDefined(rawEvent.effective_start, rawEvent.effective_at, rawEvent.observed_at),
      effectiveUntil: firstDefined(rawEvent.effective_end, rawEvent.expires_at, rawEvent.effective_until),
      sourceName: firstDefined(rawEvent.provenance?.source_name),
      sourceUrl: primarySourceUrl,
      mergedSourceUrls: mergedSourceUrls && mergedSourceUrls.length > 1 ? mergedSourceUrls : null,
      confidence: firstDefined(rawEvent.route_relevance?.confidence),
      isLastKnownGood: laneUsedLastKnownGood === true,
      isStale: laneIsStale === true,
      presentationEligible: decision.eligible,
      presentationReason: decision.reason,
      routeRelevant: decision.routeRelevant,
      routeImpact: decision.routeImpact,
      duplicateGroupKey,
      lastSourceRefreshAt: decision.lastSourceRefreshAt,
      severity: mapSeverity(rawEvent),
      currentStatus: mapCurrentStatus(rawEvent),
      detourAvailable: mapDetourAvailable(rawEvent),
      detourDescription: mapDetourDescription(rawEvent),
      closureName: mapClosureName(rawEvent),
      closedLengthMiles: mapClosedLengthMiles(rawEvent),
      closedLengthSource: mapClosedLengthSource(rawEvent),
      closureStartCrossing: mapClosureEndpoint(rawEvent, 0),
      closureEndCrossing: mapClosureEndpoint(rawEvent, 1),
      closureHours: mapClosureHours(rawEvent),
      closureStartDate: firstDefined(rawEvent.effective_start),
      projectedEndDate: mapProjectedEndDate(rawEvent),
      routeAction: mapRouteAction(rawEvent),
      riderCanPass: mapRiderCanPass(rawEvent),
    },
  };
}

function run(snapshotPath, outputDir, auditDir) {
  if (!snapshotPath || !outputDir) {
    throw new BuildFailure(
      "usage: node scripts/build-public-package-snapshot.mjs <workflow20-status-latest-path> <output-dir> [audit-dir]",
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
  const buildNowMs = parseTimeMs(assembledAt) ?? Date.now();

  const gaps = [];
  const laneSummaries = [];
  const systemHealthLanes = [];
  const laneRunIds = {};
  // Every raw event, individually judged, before duplicate merging.
  const candidates = [];

  for (const laneId of CANONICAL_LANE_ORDER) {
    const lane = snapshot.lanes?.[laneId];
    const laneLabel = LANE_LABELS[laneId];
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
      const decision = evaluateEventEligibility(laneId, rawEvent, buildNowMs);
      candidates.push({
        laneId,
        laneLabel,
        rawEvent,
        laneIsStale: freshnessState === "stale",
        laneUsedLastKnownGood: usingLastKnownGood,
        decision,
      });
    }
  }

  // Duplicate merging: only among candidates that individually passed every
  // other check. A suppressed duplicate is never allowed to look like it
  // failed some other rule — its reason is specifically duplicate_merged.
  const groups = new Map();
  const ungroupedEligible = [];
  for (const candidate of candidates) {
    if (!candidate.decision.eligible) continue;
    const key = computeDuplicateGroupKey(candidate.laneId, candidate.rawEvent);
    if (key === null) {
      ungroupedEligible.push(candidate);
      continue;
    }
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(candidate);
  }

  const finalCandidates = [];
  const duplicatesMerged = [];

  for (const candidate of ungroupedEligible) {
    finalCandidates.push({ candidate, mergedSourceUrls: [], duplicateGroupKey: null });
  }

  for (const [key, members] of groups) {
    if (members.length === 1) {
      finalCandidates.push({ candidate: members[0], mergedSourceUrls: [], duplicateGroupKey: null });
      continue;
    }
    const { representative, sourceUrls, suppressed } = mergeDuplicateGroup(members);
    finalCandidates.push({ candidate: representative, mergedSourceUrls: sourceUrls, duplicateGroupKey: key });
    for (const member of suppressed) {
      duplicatesMerged.push(member);
      candidates.splice(candidates.indexOf(member), 1, {
        ...member,
        decision: { ...member.decision, eligible: false, reason: "duplicate_merged" },
      });
    }
  }

  const eventFeatures = [];
  const auditRecords = [];

  for (const candidate of candidates) {
    // Re-fetch the (possibly duplicate-suppressed) decision recorded above.
    const isFinalWinner = finalCandidates.some((f) => f.candidate.rawEvent === candidate.rawEvent);
    const finalEntry = finalCandidates.find((f) => f.candidate.rawEvent === candidate.rawEvent);
    const eligible = candidate.decision.eligible && isFinalWinner;

    auditRecords.push({
      eventId: candidate.rawEvent.event_id ?? null,
      laneId: candidate.laneId,
      presentationEligible: eligible,
      presentationReason: candidate.decision.reason,
      routeRelevant: candidate.decision.routeRelevant,
      routeImpact: candidate.decision.routeImpact,
      publicAlertQualification: candidate.decision.publicAlertQualification,
      freshnessState: candidate.decision.freshnessState,
      duplicateGroupKey: finalEntry?.duplicateGroupKey ?? null,
    });

    // Geometry-mapping gaps are a data-quality diagnostic, independent of
    // public-display eligibility — log them for every candidate, not just
    // the ones that end up eligible, so a hidden event's raw geometry
    // issues stay visible in the build log too.
    const geometry = mapEventGeometry(candidate.rawEvent, gaps, candidate.rawEvent.event_id ?? "(unknown id)");

    if (!eligible) continue;

    eventFeatures.push(
      buildRouteEventFeature(
        candidate.laneId,
        candidate.laneLabel,
        candidate.rawEvent,
        candidate.laneIsStale,
        candidate.laneUsedLastKnownGood,
        geometry,
        candidate.decision,
        finalEntry?.mergedSourceUrls ?? [],
        finalEntry?.duplicateGroupKey ?? null,
      ),
    );
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
    overallMessage: null,
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

  // Audit trail: every candidate event's eligibility decision, including
  // hidden ones and their machine-readable reason. Never written under
  // public/ — this is repo-tracked audit evidence only, never served.
  if (auditDir) {
    mkdirSync(auditDir, { recursive: true });
    writeFileSync(
      `${auditDir}/exclusions-${releaseId}.json`,
      `${JSON.stringify({ releaseId, assembledAt, totalCandidates: candidates.length, records: auditRecords }, null, 2)}\n`,
      "utf8",
    );
  }

  const excludedCount = auditRecords.filter((r) => !r.presentationEligible).length;
  console.log(
    `PASS: wrote 4 public package files to ${outputDir} (release ${releaseId}) — ` +
      `${eventFeatures.length} of ${candidates.length} candidate event(s) eligible for public display, ` +
      `${excludedCount} excluded, ${duplicatesMerged.length} duplicate(s) merged`,
  );
  if (gaps.length > 0) {
    console.log(`NOTE: ${gaps.length} mapping gap(s) logged (buildspec 11.4):`);
    for (const gap of gaps) console.log(`  - ${gap}`);
  }
  if (excludedCount > 0) {
    console.log(`NOTE: ${excludedCount} event(s) excluded from public display:`);
    for (const record of auditRecords) {
      if (!record.presentationEligible) {
        console.log(`  - ${record.eventId} (${record.laneId}): ${record.presentationReason}`);
      }
    }
  }
}

try {
  run(process.argv[2], process.argv[3], process.argv[4]);
} catch (err) {
  if (err instanceof BuildFailure) {
    process.stderr.write(`FAIL: ${err.message}\n`);
    process.exit(1);
  }
  throw err;
}
