import { isKnownLaneId, laneLabelFor } from "./lane-labels";
import { toDisplayTier } from "./display-tier";
import { isEligibleForDisplay } from "./presentation-eligibility";
import type { DashboardEventWithUnknownLane, MonitoringLaneId, RouteEventsFile } from "./types";

const VALID_GEOMETRY_TYPES = new Set([
  "Point",
  "LineString",
  "MultiLineString",
  "Polygon",
  "MultiPolygon",
]);

export type RouteEventNormalizationGap = {
  eventId: string;
  reason: string;
};

export type NormalizedRouteEvents = {
  events: DashboardEventWithUnknownLane[];
  gaps: RouteEventNormalizationGap[];
};

/**
 * Turns the raw `route-events.geojson` file into the UI's normalized
 * DashboardEvent list. Follows the "no silent inference" rule (buildspec
 * 11.3): unmappable fields become null, an unknown tier becomes "unknown"
 * (never "normal"), and an unknown lane ID gets the "Other route source"
 * public label while the raw ID is preserved for logging (buildspec 34.4).
 */
export function normalizeRouteEvents(file: RouteEventsFile): NormalizedRouteEvents {
  const gaps: RouteEventNormalizationGap[] = [];
  const events: DashboardEventWithUnknownLane[] = [];

  for (const feature of file.features) {
    const props = feature.properties;
    const rawLaneId = props.laneId;
    const laneIsKnown = isKnownLaneId(rawLaneId);
    if (!laneIsKnown) {
      gaps.push({ eventId: props.id, reason: `Unknown lane ID "${rawLaneId}" (buildspec 34.4)` });
    }

    let geometry = feature.geometry;
    if (geometry !== null && !VALID_GEOMETRY_TYPES.has(geometry.type)) {
      gaps.push({
        eventId: props.id,
        reason: `Unsupported geometry type "${geometry.type}" — dropped, event kept as text (buildspec 34.3)`,
      });
      geometry = null;
    }

    const candidate: DashboardEventWithUnknownLane = {
      id: props.id,
      laneId: laneIsKnown ? (rawLaneId as MonitoringLaneId) : "unknown",
      rawLaneId,
      laneLabel: laneLabelFor(rawLaneId),
      title: props.title,
      summary: props.summary,
      locationLabel: props.locationLabel,
      routeSegmentId: props.routeSegmentId,
      routeSegmentLabel: props.routeSegmentLabel,
      displayTier: toDisplayTier(props.displayTier),
      routeEffect: props.routeEffect,
      reportedAt: props.reportedAt,
      effectiveFrom: props.effectiveFrom,
      effectiveUntil: props.effectiveUntil,
      geometry,
      sourceName: props.sourceName,
      sourceUrl: props.sourceUrl,
      mergedSourceUrls: props.mergedSourceUrls,
      confidence: props.confidence,
      isLastKnownGood: props.isLastKnownGood,
      isStale: props.isStale,
      presentationEligible: props.presentationEligible,
      presentationReason: props.presentationReason,
      routeRelevant: props.routeRelevant,
      routeImpact: props.routeImpact,
      duplicateGroupKey: props.duplicateGroupKey,
      lastSourceRefreshAt: props.lastSourceRefreshAt,
      severity: props.severity,
      currentStatus: props.currentStatus,
      detourAvailable: props.detourAvailable,
      detourDescription: props.detourDescription,
      closureName: props.closureName,
      closedLengthMiles: props.closedLengthMiles,
      closedLengthSource: props.closedLengthSource,
      closureStartCrossing: props.closureStartCrossing,
      closureEndCrossing: props.closureEndCrossing,
      closureHours: props.closureHours,
      closureStartDate: props.closureStartDate,
      projectedEndDate: props.projectedEndDate,
      routeAction: props.routeAction,
      riderCanPass: props.riderCanPass,
    };

    // Dashboard final guard (buildspec noise-reduction policy): the public
    // package should already contain only eligible events, but a card is
    // never rendered without this independent, defense-in-depth re-check.
    const guard = isEligibleForDisplay(candidate);
    if (!guard.eligible) {
      gaps.push({ eventId: props.id, reason: `Blocked by dashboard final guard: ${guard.reason}` });
      continue;
    }

    events.push(candidate);
  }

  return { events, gaps };
}
