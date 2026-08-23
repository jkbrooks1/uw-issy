import { describe, expect, it } from "vitest";
import { deriveRiderStateMeta, deriveRouteClosureScope } from "../../src/lib/route-status/rider-state";
import type { DashboardEventWithUnknownLane, SystemHealthFile } from "../../src/lib/route-status/types";
import type { RouteWideSummary } from "../../src/lib/route-status/normalize-dashboard-data";

function baseSummary(overrides: Partial<RouteWideSummary> = {}): RouteWideSummary {
  return {
    displayTier: "watch",
    displayTierLabel: "Watch",
    activeEventCount: 1,
    overallMessage: "One source degraded.",
    lastUpdatedLabel: "Aug 23, 2026",
    laneSummaries: [],
    routeImpacts: null,
    ...overrides,
  };
}

function baseHealth(overrides: Partial<SystemHealthFile> = {}): SystemHealthFile {
  return {
    schemaVersion: "1.0.0",
    releaseId: "test",
    assembledAt: "2026-08-23T20:15:00.000Z",
    lanes: [],
    failedLaneIds: [],
    degradedLaneIds: [],
    assemblyState: "ok",
    publicationState: "published",
    ...overrides,
  };
}

function baseEvent(overrides: Partial<DashboardEventWithUnknownLane> = {}): DashboardEventWithUnknownLane {
  return {
    id: "event-1",
    laneId: "01_ROUTE_CONDITIONS",
    rawLaneId: "01_ROUTE_CONDITIONS",
    laneLabel: "Route conditions",
    title: "East Lake Sammamish Trail closure",
    summary: null,
    locationLabel: "Between Louis Thompson Rd NE and NE Inglewood Hill Rd.",
    routeSegmentId: "elst",
    routeSegmentLabel: "East Lake Sammamish Trail",
    displayTier: "unknown",
    routeEffect: "confirmed_route_impact",
    reportedAt: null,
    effectiveFrom: null,
    effectiveUntil: null,
    geometry: { type: "LineString", coordinates: [[-122.1, 47.6], [-122.09, 47.61]] },
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
    severity: "high",
    currentStatus: "active",
    detourAvailable: false,
    riderCanPass: "no",
    ...overrides,
  };
}

describe("rider state derivation", () => {
  it("classifies localized closures as partial closure, not whole-route closed", () => {
    const meta = deriveRiderStateMeta(baseSummary(), baseHealth(), [baseEvent()]);

    expect(meta.riderState).toBe("PARTIAL CLOSURE");
    expect(meta.closureScope).toBe("partial");
    expect(meta.closureCount).toBe(1);
    expect(meta.statusDetail).toMatch(/full route is not reported closed/i);
  });

  it("keeps source degradation distinct from route closure", () => {
    const meta = deriveRiderStateMeta(
      baseSummary({ displayTier: "watch" }),
      baseHealth({ degradedLaneIds: ["01_ROUTE_CONDITIONS", "03_AIR_QUALITY"] }),
      [],
    );

    expect(meta.riderState).toBe("CAUTION");
    expect(meta.closureScope).toBe("none");
    expect(meta.closureCount).toBe(0);
  });

  it("uses whole-route closed only for explicit route-wide closure language without localized evidence", () => {
    const event = baseEvent({
      title: "Entire route closed",
      locationLabel: null,
      routeSegmentId: null,
      routeSegmentLabel: null,
      geometry: null,
    });

    expect(deriveRouteClosureScope([event])).toBe("full");
    expect(deriveRiderStateMeta(baseSummary(), baseHealth(), [event]).riderState).toBe("CLOSED");
  });
});
