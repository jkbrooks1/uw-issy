import type { DisplayTier } from "./types";
import type { NormalizedLaneSummary } from "./normalize-dashboard-data";

export type HarveyBallColor = "green" | "yellow" | "red" | "unknown";

export type CategoryStatus = {
  laneId: string;
  label: string;
  color: HarveyBallColor;
  ariaLabel: string;
};

/**
 * Maps display tier to Harvey-ball rider-impact color.
 * The tier already represents rider impact, not system health.
 */
function tierToColor(tier: DisplayTier): HarveyBallColor {
  switch (tier) {
    case "normal":
      return "green"; // No active rider-impacting issue
    case "watch":
      return "yellow"; // Caution — elevated concern
    case "alert":
      return "red"; // Confirmed rider-impacting condition
    case "unknown":
      return "unknown"; // Status unknown
  }
}

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

/**
 * Derives the rider-impact status for each of the six rider-facing categories.
 * Uses lane summaries from the dashboard data, which already encode rider impact via displayTier.
 */
export function deriveRiderImpactGrid(laneSummaries: NormalizedLaneSummary[]): CategoryStatus[] {
  const RIDER_FACING_LANES = [
    "01_ROUTE_CONDITIONS",
    "02_WEATHER",
    "03_AIR_QUALITY",
    "04_WILDFIRE",
    "05_FLOOD_CONDITIONS",
    "06_TRAIL_INFRASTRUCTURE_STATUS",
  ];

  return RIDER_FACING_LANES.map((laneId) => {
    const summary = laneSummaries.find((lane) => lane.laneId === laneId);
    if (!summary) {
      return {
        laneId,
        label: laneId,
        color: "unknown",
        ariaLabel: colorToLabel("unknown"),
      };
    }

    const color = tierToColor(summary.displayTier);
    return {
      laneId,
      label: summary.laneLabel,
      color,
      ariaLabel: colorToLabel(color),
    };
  });
}
