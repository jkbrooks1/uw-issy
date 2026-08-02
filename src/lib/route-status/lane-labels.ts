import type { MonitoringLaneId } from "./types";

/** Buildspec section 6.3 — internal lane ID to public label. */
export const LANE_LABELS: Record<MonitoringLaneId, string> = {
  "01_ROUTE_CONDITIONS": "Route conditions",
  "02_WEATHER": "Weather",
  "03_AIR_QUALITY": "Air quality",
  "04_WILDFIRE": "Wildfire",
  "05_FLOOD_CONDITIONS": "Flood conditions",
  "06_TRAIL_INFRASTRUCTURE_STATUS": "Trail infrastructure",
  "07_GOVERNMENT_SAFETY_ALERTS": "Government safety alerts",
};

/** Buildspec section 34.4 — public label for an event whose lane ID is not one of the seven canonical lanes. */
export const UNKNOWN_LANE_LABEL = "Other route source";

export function isKnownLaneId(laneId: string): laneId is MonitoringLaneId {
  return Object.prototype.hasOwnProperty.call(LANE_LABELS, laneId);
}

export function laneLabelFor(laneId: string): string {
  return isKnownLaneId(laneId) ? LANE_LABELS[laneId] : UNKNOWN_LANE_LABEL;
}
