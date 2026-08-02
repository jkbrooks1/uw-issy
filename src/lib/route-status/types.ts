/// <reference types="geojson" />

/** Buildspec 6.3 — the seven canonical internal lane IDs. */
export type MonitoringLaneId =
  | "01_ROUTE_CONDITIONS"
  | "02_WEATHER"
  | "03_AIR_QUALITY"
  | "04_WILDFIRE"
  | "05_FLOOD_CONDITIONS"
  | "06_TRAIL_INFRASTRUCTURE_STATUS"
  | "07_GOVERNMENT_SAFETY_ALERTS";

/** Buildspec 10.1 — canonical public route display tiers. */
export type DisplayTier = "normal" | "watch" | "alert" | "unknown";

/** Buildspec 10.5 — internal lane source-health states. */
export type SourceHealthState =
  | "ok"
  | "degraded"
  | "stale"
  | "no_relevant_events"
  | "failed_validation"
  | "failed_fetch"
  | "blocked"
  | "using_last_known_good"
  | "unavailable"
  | "unknown";

/** Buildspec 11.1 — the required normalized UI event type. */
export type DashboardEvent = {
  id: string;
  laneId: MonitoringLaneId;
  laneLabel: string;
  title: string;
  summary: string | null;
  locationLabel: string | null;
  routeSegmentId: string | null;
  routeSegmentLabel: string | null;
  displayTier: DisplayTier;
  routeEffect: string | null;
  reportedAt: string | null;
  effectiveFrom: string | null;
  effectiveUntil: string | null;
  geometry: GeoJSON.Geometry | null;
  sourceName: string | null;
  sourceUrl: string | null;
  confidence: string | null;
  isLastKnownGood: boolean;
  isStale: boolean;
};

/**
 * Buildspec 34.4 — an event whose lane ID was not one of the seven canonical
 * lanes. The raw ID is preserved for logging (never silently dropped), while
 * `laneLabel` still gets the "Other route source" public fallback.
 */
export type DashboardEventWithUnknownLane = Omit<DashboardEvent, "laneId"> & {
  laneId: MonitoringLaneId | "unknown";
  rawLaneId: string;
};

/** Buildspec 9.4 — one lane's rider-facing summary row in dashboard-data.json. */
export type LaneSummary = {
  laneId: string;
  laneLabel: string;
  available: boolean;
  displayTier: DisplayTier;
  sourceState: SourceHealthState;
  eventCount: number;
};

/** Buildspec 21 — a reviewed route-part row. Null fields mean "not derivable", never guessed. */
export type RouteImpact = {
  routeSegmentId: string;
  routeSegmentLabel: string | null;
  displayTier: DisplayTier;
  effectNote: string | null;
  linkedEventCount: number;
};

/** Buildspec 9.4 — `dashboard-data.json` (rider-facing state). */
export type DashboardDataFile = {
  schemaVersion: string;
  releaseId: string;
  assembledAt: string;
  routeId: string;
  routeName: string;
  displayTier: DisplayTier;
  overallMessage: string | null;
  activeEventCount: number;
  laneSummaries: LaneSummary[];
  routeImpacts: RouteImpact[] | null;
  eventRefs: string[];
};

/** Buildspec 9.4 / 11.1 — one GeoJSON Feature's properties in `route-events.geojson`. */
export type RouteEventProperties = {
  id: string;
  laneId: string;
  laneLabel: string;
  title: string;
  summary: string | null;
  locationLabel: string | null;
  routeSegmentId: string | null;
  routeSegmentLabel: string | null;
  displayTier: DisplayTier;
  routeEffect: string | null;
  reportedAt: string | null;
  effectiveFrom: string | null;
  effectiveUntil: string | null;
  sourceName: string | null;
  sourceUrl: string | null;
  confidence: string | null;
  isLastKnownGood: boolean;
  isStale: boolean;
};

export type RouteEventFeature = {
  type: "Feature";
  id: string;
  geometry: GeoJSON.Geometry | null;
  properties: RouteEventProperties;
};

/** Buildspec 9.4 — `route-events.geojson`. Carries its own release marker per section 32.3. */
export type RouteEventsFile = {
  type: "FeatureCollection";
  releaseId: string;
  generatedAt: string;
  features: RouteEventFeature[];
};

/** Buildspec 9.4 / 10.5 — one lane's row in `system-health.json`. */
export type LaneHealthEntry = {
  laneId: string;
  laneLabel: string;
  available: boolean;
  sourceState: SourceHealthState;
  publicText: string;
  freshnessState: "fresh" | "stale" | "unknown";
  usingLastKnownGood: boolean;
  eventCount: number;
};

/** Buildspec 9.4 — `system-health.json`. */
export type SystemHealthFile = {
  schemaVersion: string;
  releaseId: string;
  assembledAt: string;
  lanes: LaneHealthEntry[];
  failedLaneIds: string[];
  degradedLaneIds: string[];
  assemblyState: "ok" | "degraded" | "failed";
  publicationState: "published" | "unpublished";
};

/** Buildspec 9.4 — `release-manifest.json`. */
export type ReleaseManifestFile = {
  releaseId: string;
  assembledAt: string;
  schemaVersion: string;
  laneRunIds: Record<string, string | null>;
  sourceGitCommit: string | null;
  buildState: "unknown" | "pass" | "fail";
  deployState: "unknown" | "deployed";
  productionProofState: "unknown" | "verified";
};

/** The four-file public package as loaded together, per buildspec section 9. */
export type PublicPackage = {
  dashboardData: DashboardDataFile;
  routeEvents: RouteEventsFile;
  systemHealth: SystemHealthFile;
  releaseManifest: ReleaseManifestFile;
};
