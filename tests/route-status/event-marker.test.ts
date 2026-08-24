import { describe, expect, it } from "vitest";
import { markerPresentationForEvent, markerSeverityForEvent } from "../../src/lib/route-status/event-marker";
import type { DashboardEventWithUnknownLane } from "../../src/lib/route-status/types";

function event(overrides: Partial<DashboardEventWithUnknownLane>): DashboardEventWithUnknownLane {
  return {
    id: "event",
    laneId: "01_ROUTE_CONDITIONS",
    rawLaneId: "01_ROUTE_CONDITIONS",
    laneLabel: "Route conditions",
    title: "Event",
    summary: null,
    locationLabel: null,
    trailName: null,
    alertNature: null,
    routeSegmentId: null,
    routeSegmentLabel: null,
    displayTier: "normal",
    routeEffect: null,
    reportedAt: null,
    effectiveFrom: null,
    effectiveUntil: null,
    geometry: { type: "Point", coordinates: [-122.1, 47.6] },
    sourceName: null,
    sourceUrl: null,
    mergedSourceUrls: null,
    confidence: null,
    isLastKnownGood: false,
    isStale: false,
    presentationEligible: true,
    presentationReason: "eligible",
    routeRelevant: true,
    routeImpact: true,
    duplicateGroupKey: null,
    lastSourceRefreshAt: null,
    severity: null,
    currentStatus: null,
    detourAvailable: null,
    detourDescription: null,
    closureName: null,
    closedLengthMiles: null,
    closedLengthSource: null,
    closureStartCrossing: null,
    closureEndCrossing: null,
    closureHours: null,
    closureStartDate: null,
    projectedEndDate: null,
    routeAction: null,
    riderCanPass: null,
    ...overrides,
  };
}

describe("event marker severity mapping", () => {
  it("uses red for closure or severe rider impact", () => {
    const presentation = markerPresentationForEvent(event({ riderCanPass: "no", severity: "high" }));
    expect(presentation.severity).toBe("major");
    expect(presentation.color).toBe("#C72B20");
  });

  it("uses yellow for caution/degraded/moderate rider impact", () => {
    expect(markerSeverityForEvent(event({ displayTier: "watch", severity: "moderate" }))).toBe("caution");
    expect(markerPresentationForEvent(event({ riderCanPass: "unknown" })).color).toBe("#D99100");
  });

  it("uses green only for low-risk or resolved marker-worthy conditions", () => {
    const presentation = markerPresentationForEvent(event({ severity: "resolved", currentStatus: "reopened" }));
    expect(presentation.severity).toBe("clear");
    expect(presentation.color).toBe("#2D7A30");
  });

  it("does not key marker color from source lane identity", () => {
    const route = markerPresentationForEvent(event({ laneId: "01_ROUTE_CONDITIONS", severity: "high" }));
    const trail = markerPresentationForEvent(event({ laneId: "06_TRAIL_INFRASTRUCTURE_STATUS", severity: "high" }));
    expect(route.color).toBe(trail.color);
  });
});
