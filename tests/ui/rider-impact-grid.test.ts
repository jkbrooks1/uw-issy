import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { deriveRiderImpactGrid } from "../../src/lib/route-status/rider-impact-grid";
import type { NormalizedLaneSummary } from "../../src/lib/route-status/normalize-dashboard-data";
import type { DashboardEventWithUnknownLane, DisplayTier } from "../../src/lib/route-status/types";

const REPO_ROOT = join(__dirname, "..", "..");
const INDEX_ASTRO = readFileSync(join(REPO_ROOT, "src", "pages", "index.astro"), "utf8");
const RIDER_IMPACT_GRID_ASTRO = readFileSync(
  join(REPO_ROOT, "src", "components", "route-status", "RiderImpactGrid.astro"),
  "utf8",
);
const RIDER_IMPACT_GRID_TS = readFileSync(
  join(REPO_ROOT, "src", "lib", "route-status", "rider-impact-grid.ts"),
  "utf8",
);
const CSS = readFileSync(join(REPO_ROOT, "src", "styles", "route-status.css"), "utf8");

function lane(laneId: string, displayTier: DisplayTier = "normal", available = true): NormalizedLaneSummary {
  return {
    laneId,
    laneLabel: laneId,
    available,
    displayTier,
    displayTierLabel: displayTier,
    sourceStateText: "Degraded",
    eventCount: 1,
  };
}

const LANES = [
  lane("01_ROUTE_CONDITIONS", "watch"),
  lane("02_WEATHER", "normal"),
  lane("03_AIR_QUALITY", "watch"),
  lane("04_WILDFIRE", "watch"),
  lane("05_FLOOD_CONDITIONS", "watch"),
  lane("06_TRAIL_INFRASTRUCTURE_STATUS", "watch"),
  lane("07_GOVERNMENT_SAFETY_ALERTS", "normal"),
];

function event(overrides: Partial<DashboardEventWithUnknownLane>): DashboardEventWithUnknownLane {
  return {
    id: "event-1",
    laneId: "01_ROUTE_CONDITIONS",
    rawLaneId: "01_ROUTE_CONDITIONS",
    laneLabel: "Route conditions",
    title: "Trail event",
    summary: null,
    locationLabel: "Trail location",
    trailName: "East Lake Sammamish Trail",
    alertNature: "Trail closure",
    routeSegmentId: null,
    routeSegmentLabel: null,
    displayTier: "alert",
    routeEffect: "Segment closed",
    reportedAt: null,
    effectiveFrom: null,
    effectiveUntil: null,
    geometry: null,
    sourceName: null,
    sourceUrl: "https://example.test/source",
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
    riderCanPass: "no",
    ...overrides,
  };
}

describe("four-category rider impact grid", () => {
  it("1. derives exactly four public Harvey categories", () => {
    expect(deriveRiderImpactGrid(LANES, [])).toHaveLength(4);
  });

  it("2. uses the exact approved labels", () => {
    expect(deriveRiderImpactGrid(LANES, []).map((category) => category.label)).toEqual([
      "Trail Conditions",
      "Weather",
      "Air Quality",
      "Safety Alerts",
    ]);
  });

  it("3-6. does not define removed internal-lane labels as Harvey categories", () => {
    expect(RIDER_IMPACT_GRID_TS).not.toContain('label: "Route Conditions"');
    expect(RIDER_IMPACT_GRID_TS).not.toContain('label: "Wildfire"');
    expect(RIDER_IMPACT_GRID_TS).not.toContain('label: "Flood Conditions"');
    expect(RIDER_IMPACT_GRID_TS).not.toContain('label: "Trail Infrastructure"');
  });

  it("7. desktop layout is label, ball, label, ball", () => {
    expect(CSS).toMatch(
      /\.rider-impact-grid__container\s*\{[\s\S]*?grid-template-columns:\s*max-content\s+20px\s+max-content\s+20px/,
    );
  });

  it("8. label-to-ball spacing is compact", () => {
    expect(CSS).toMatch(/column-gap:\s*14px/);
    expect(CSS).not.toMatch(/\.rider-impact-grid__label\s*\{[\s\S]*?flex:\s*1/);
  });

  it("9. Harvey-ball columns remain aligned", () => {
    expect(CSS).toMatch(/\.rider-impact-grid__cell\s*\{[\s\S]*?display:\s*contents/);
    expect(CSS).toMatch(/\.rider-impact-grid__ball\s*\{[\s\S]*?justify-self:\s*start/);
  });

  it("10. Trail Conditions aggregates qualified trail-impact data", () => {
    const grid = deriveRiderImpactGrid(LANES, [event({ rawLaneId: "06_TRAIL_INFRASTRUCTURE_STATUS" })]);
    expect(grid.find((category) => category.label === "Trail Conditions")?.color).toBe("red");
  });

  it("11. duplicate underlying lane reports do not change the highest real-world issue result", () => {
    const duplicateA = event({ id: "a", duplicateGroupKey: "same-closure", rawLaneId: "01_ROUTE_CONDITIONS" });
    const duplicateB = event({ id: "b", duplicateGroupKey: "same-closure", rawLaneId: "06_TRAIL_INFRASTRUCTURE_STATUS" });
    const grid = deriveRiderImpactGrid(LANES, [duplicateA, duplicateB]);
    expect(grid.find((category) => category.label === "Trail Conditions")?.color).toBe("red");
  });

  it("12. wildfire source data alone does not create a public Harvey warning", () => {
    const grid = deriveRiderImpactGrid(LANES, [
      event({
        rawLaneId: "04_WILDFIRE",
        laneId: "04_WILDFIRE",
        title: "Regional fire perimeter",
        alertNature: "Regional fire perimeter",
        routeEffect: null,
        displayTier: "watch",
        riderCanPass: null,
      }),
    ]);
    expect(grid.find((category) => category.label === "Air Quality")?.color).toBe("green");
  });

  it("13. flood source data alone does not create a public Harvey warning", () => {
    const grid = deriveRiderImpactGrid(LANES, [
      event({
        rawLaneId: "05_FLOOD_CONDITIONS",
        laneId: "05_FLOOD_CONDITIONS",
        title: "Gauge observation",
        alertNature: "Gauge observation",
        routeEffect: null,
        displayTier: "watch",
        riderCanPass: null,
      }),
    ]);
    expect(grid.find((category) => category.label === "Safety Alerts")?.color).toBe("green");
    expect(grid.find((category) => category.label === "Trail Conditions")?.color).toBe("green");
  });

  it("14. source/system degradation alone does not change Harvey color", () => {
    const degradedLanes = LANES.map((sourceLane) => ({ ...sourceLane, displayTier: "watch" as const, sourceStateText: "Degraded" }));
    const grid = deriveRiderImpactGrid(degradedLanes, []);
    expect(grid.map((category) => category.color)).toEqual(["green", "green", "green", "green"]);
  });

  it("15. Current route issue detail remains below the grid", () => {
    expect(INDEX_ASTRO).toMatch(/<RiderImpactGrid summary={summary} events={events} \/>[\s\S]*?<CurrentRouteAlerts events={events}/);
  });

  it("16. map remains below the grid", () => {
    expect(INDEX_ASTRO).toMatch(/<RiderImpactGrid summary={summary} events={events} \/>[\s\S]*?<RouteMap/);
  });

  it("17. System Health remains separate", () => {
    expect(INDEX_ASTRO).toMatch(/<MonitorHealthDisclosure summary={summary} systemHealth={systemHealth} \/>/);
    expect(RIDER_IMPACT_GRID_ASTRO).not.toMatch(/systemHealth/);
  });

  it("18. accessibility labels remain available", () => {
    expect(RIDER_IMPACT_GRID_ASTRO).toMatch(/aria-label={category\.ariaLabel}/);
    expect(RIDER_IMPACT_GRID_TS).toMatch(/Green — no active rider-impacting issue reported/);
    expect(RIDER_IMPACT_GRID_TS).toMatch(/Yellow — caution/);
    expect(RIDER_IMPACT_GRID_TS).toMatch(/Red — confirmed rider-impacting condition/);
  });
});
