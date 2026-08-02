import type { MonitoringLaneId } from "./types";

/** Buildspec section 20.1 — lane colors. Color must never be the only sign of lane identity or state. */
export const LANE_COLORS: Record<MonitoringLaneId, string> = {
  "01_ROUTE_CONDITIONS": "#4C9F38",
  "02_WEATHER": "#1976C9",
  "03_AIR_QUALITY": "#7A3CC2",
  "04_WILDFIRE": "#F46B13",
  "05_FLOOD_CONDITIONS": "#8B5C21",
  "06_TRAIL_INFRASTRUCTURE_STATUS": "#168B8C",
  "07_GOVERNMENT_SAFETY_ALERTS": "#C72B20",
};

export function laneColorFor(laneId: string): string | null {
  return Object.prototype.hasOwnProperty.call(LANE_COLORS, laneId)
    ? LANE_COLORS[laneId as MonitoringLaneId]
    : null;
}
