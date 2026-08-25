import type { NormalizedLaneSummary } from "./normalize-dashboard-data";
import type { DashboardEventWithUnknownLane } from "./types";

export type HarveyBallColor = "green" | "yellow" | "red" | "unknown";

export type CategoryStatus = {
  categoryId: "trail_conditions" | "weather" | "air_quality" | "safety_alerts";
  label: string;
  color: HarveyBallColor;
  ariaLabel: string;
};

function colorToLabel(color: HarveyBallColor): string {
  switch (color) {
    case "green":
      return "Green — no active rider-impacting issue reported";
    case "yellow":
      return "Yellow — caution";
    case "red":
      return "Red — confirmed rider-impacting condition";
    case "unknown":
      return "Unknown status";
  }
}

const TRAIL_CONDITION_LANES = new Set(["01_ROUTE_CONDITIONS", "06_TRAIL_INFRASTRUCTURE_STATUS"]);
const WEATHER_LANES = new Set(["02_WEATHER"]);
const AIR_QUALITY_LANES = new Set(["03_AIR_QUALITY"]);
const WILDFIRE_LANES = new Set(["04_WILDFIRE"]);
const FLOOD_LANES = new Set(["05_FLOOD_CONDITIONS"]);
const SAFETY_ALERT_LANES = new Set(["07_GOVERNMENT_SAFETY_ALERTS"]);

function severityRank(color: HarveyBallColor): number {
  switch (color) {
    case "red":
      return 3;
    case "yellow":
      return 2;
    case "unknown":
      return 1;
    case "green":
      return 0;
  }
}

function highestColor(colors: HarveyBallColor[]): HarveyBallColor {
  return colors.reduce<HarveyBallColor>(
    (highest, color) => (severityRank(color) > severityRank(highest) ? color : highest),
    "green",
  );
}

function eventToColor(event: DashboardEventWithUnknownLane): HarveyBallColor {
  const text = [
    event.alertNature,
    event.routeEffect,
    event.routeAction,
    event.currentStatus,
    event.severity,
    event.title,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (
    event.riderCanPass === "no" ||
    event.detourAvailable === false ||
    event.displayTier === "alert" ||
    /closed|closure|segment closed|major|severe|unhealthy|hazardous/.test(text)
  ) {
    return "red";
  }

  if (event.displayTier === "watch" || /caution|moderate|advisory|restriction|smoke|aqi|alert/.test(text)) {
    return "yellow";
  }

  if (event.displayTier === "unknown") {
    return "unknown";
  }

  return "green";
}

function uniqueRealWorldEvents(events: DashboardEventWithUnknownLane[]): DashboardEventWithUnknownLane[] {
  const seen = new Set<string>();
  const unique: DashboardEventWithUnknownLane[] = [];
  for (const event of events) {
    const key = event.duplicateGroupKey || [
      event.trailName,
      event.locationLabel,
      event.alertNature,
      event.routeEffect,
      event.effectiveFrom,
      event.effectiveUntil,
      event.sourceUrl,
    ].join("|");
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(event);
  }
  return unique;
}

function trailConditionColor(events: DashboardEventWithUnknownLane[]): HarveyBallColor {
  const trailEvents = uniqueRealWorldEvents(
    events.filter((event) => TRAIL_CONDITION_LANES.has(event.rawLaneId) || TRAIL_CONDITION_LANES.has(event.laneId)),
  );
  return highestColor(trailEvents.map(eventToColor));
}

function weatherColor(events: DashboardEventWithUnknownLane[]): HarveyBallColor {
  return highestColor(events.filter((event) => WEATHER_LANES.has(event.rawLaneId)).map(eventToColor));
}

function airQualityColor(events: DashboardEventWithUnknownLane[]): HarveyBallColor {
  const airEvents = events.filter((event) => {
    if (AIR_QUALITY_LANES.has(event.rawLaneId)) return true;
    if (!WILDFIRE_LANES.has(event.rawLaneId)) return false;
    const text = [event.alertNature, event.routeEffect, event.title, event.summary].filter(Boolean).join(" ").toLowerCase();
    return /smoke|air quality|aqi|particulate|pm2\.?5/.test(text);
  });
  return highestColor(airEvents.map(eventToColor));
}

function safetyAlertColor(events: DashboardEventWithUnknownLane[]): HarveyBallColor {
  const safetyEvents = events.filter((event) => {
    if (SAFETY_ALERT_LANES.has(event.rawLaneId)) return true;
    if (!FLOOD_LANES.has(event.rawLaneId)) return false;
    const text = [event.alertNature, event.routeEffect, event.title, event.summary].filter(Boolean).join(" ").toLowerCase();
    return /evacuation|public safety|emergency|closed|closure|flooding on route|trail closed/.test(text);
  });
  return highestColor(uniqueRealWorldEvents(safetyEvents).map(eventToColor));
}

function hasAvailableLane(laneSummaries: NormalizedLaneSummary[], laneIds: string[]): boolean {
  return laneSummaries.some((lane) => laneIds.includes(lane.laneId) && lane.available);
}

/**
 * Derives the four public rider-impact categories. Public categories do not
 * mirror internal lanes: source/system degradation remains in System Health,
 * while this grid uses qualified public events to represent rider impact.
 */
export function deriveRiderImpactGrid(
  laneSummaries: NormalizedLaneSummary[],
  events: DashboardEventWithUnknownLane[] = [],
): CategoryStatus[] {
  const trailAvailable = hasAvailableLane(laneSummaries, ["01_ROUTE_CONDITIONS", "06_TRAIL_INFRASTRUCTURE_STATUS"]);
  const weatherAvailable = hasAvailableLane(laneSummaries, ["02_WEATHER"]);
  const airAvailable = hasAvailableLane(laneSummaries, ["03_AIR_QUALITY", "04_WILDFIRE"]);
  const safetyAvailable = hasAvailableLane(laneSummaries, ["07_GOVERNMENT_SAFETY_ALERTS"]);
  const trailColor = trailConditionColor(events);
  const weatherImpactColor = weatherColor(events);
  const airQualityImpactColor = airQualityColor(events);
  const safetyImpactColor = safetyAlertColor(events);

  const categories: Array<Omit<CategoryStatus, "ariaLabel">> = [
    { categoryId: "trail_conditions", label: "Trail Conditions", color: trailAvailable ? trailColor : "unknown" },
    { categoryId: "weather", label: "Weather", color: weatherAvailable ? weatherImpactColor : "unknown" },
    { categoryId: "air_quality", label: "Air Quality", color: airAvailable ? airQualityImpactColor : "unknown" },
    { categoryId: "safety_alerts", label: "Safety Alerts", color: safetyAvailable ? safetyImpactColor : "unknown" },
  ];

  return categories.map((category) => ({
    ...category,
    ariaLabel: colorToLabel(category.color),
  }));
}
