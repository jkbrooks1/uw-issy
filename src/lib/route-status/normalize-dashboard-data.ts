import { toDisplayTier, displayTierLabel } from "./display-tier";
import { formatPacificTime } from "./format-time";
import { laneLabelFor } from "./lane-labels";
import { toSourceHealthState, sourceHealthText } from "./source-health";
import type { DashboardDataFile, DisplayTier, LaneSummary, RouteImpact } from "./types";

export type NormalizedLaneSummary = {
  laneId: string;
  laneLabel: string;
  available: boolean;
  displayTier: DisplayTier;
  displayTierLabel: string;
  sourceStateText: string;
  eventCount: number;
};

/** Route-wide summary consumed by the "Current route state" panel (buildspec section 18). */
export type RouteWideSummary = {
  displayTier: DisplayTier;
  displayTierLabel: string;
  activeEventCount: number;
  overallMessage: string | null;
  lastUpdatedLabel: string | null;
  laneSummaries: NormalizedLaneSummary[];
  routeImpacts: RouteImpact[] | null;
};

function normalizeLaneSummary(lane: LaneSummary): NormalizedLaneSummary {
  const tier = toDisplayTier(lane.displayTier);
  const sourceState = toSourceHealthState(lane.sourceState);
  return {
    laneId: lane.laneId,
    laneLabel: laneLabelFor(lane.laneId) || lane.laneLabel,
    available: lane.available,
    displayTier: tier,
    displayTierLabel: displayTierLabel(tier),
    sourceStateText: sourceHealthText(sourceState),
    eventCount: lane.eventCount,
  };
}

/**
 * Turns the raw `dashboard-data.json` file into the UI's normalized
 * route-wide summary. Follows the "no silent inference" rule (buildspec
 * 11.3): an unrecognized display tier becomes "unknown", never "normal".
 */
export function normalizeDashboardData(file: DashboardDataFile): RouteWideSummary {
  const tier = toDisplayTier(file.displayTier);
  return {
    displayTier: tier,
    displayTierLabel: displayTierLabel(tier),
    activeEventCount: file.activeEventCount,
    overallMessage: file.overallMessage,
    lastUpdatedLabel: formatPacificTime(file.assembledAt),
    laneSummaries: file.laneSummaries.map(normalizeLaneSummary),
    routeImpacts: file.routeImpacts,
  };
}
