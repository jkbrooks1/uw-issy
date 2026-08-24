import type { DashboardEventWithUnknownLane, SystemHealthFile } from "./types";
import type { RouteWideSummary } from "./normalize-dashboard-data";

export type RouteClosureScope = "none" | "partial";

export type RouteStatusState = "CLEAR" | "CAUTION" | "MAJOR ISSUE" | "PARTIAL CLOSURE" | "UNKNOWN";

export type RouteStatusMeta = {
  routeStatus: RouteStatusState;
  closureScope: RouteClosureScope;
  closureCount: number;
  activeEventCount: number;
  hasConfidenceIssue: boolean;
  failedCount: number;
  degradedCount: number;
  isDataUnavailable: boolean;
  isAssemblyFailed: boolean;
};

export function isClosureEvent(event: DashboardEventWithUnknownLane): boolean {
  return Boolean(
    event.closureName ||
      event.closureStartCrossing ||
      event.closureEndCrossing ||
      event.closedLengthMiles !== null ||
      event.detourAvailable !== null ||
      event.riderCanPass !== null,
  );
}

export function deriveRouteClosureScope(events: DashboardEventWithUnknownLane[]): RouteClosureScope {
  return events.some(isClosureEvent) ? "partial" : "none";
}

export function deriveRouteStatusMeta(
  summary: RouteWideSummary,
  systemHealth: SystemHealthFile | null,
  events: DashboardEventWithUnknownLane[],
): RouteStatusMeta {
  const activeEventCount = events.length;
  const closureCount = events.filter(isClosureEvent).length;
  const closureScope = deriveRouteClosureScope(events);
  const isDataUnavailable = systemHealth === null;
  const isAssemblyFailed = systemHealth?.assemblyState === "failed";
  const failedCount = systemHealth?.failedLaneIds.length ?? 0;
  const degradedCount = systemHealth?.degradedLaneIds.length ?? 0;
  const hasConfidenceIssue =
    isDataUnavailable || isAssemblyFailed || failedCount > 0 || degradedCount > 0 || summary.displayTier === "unknown";

  let routeStatus: RouteStatusState;
  if (isDataUnavailable || isAssemblyFailed || summary.displayTier === "unknown") routeStatus = "UNKNOWN";
  else if (closureScope === "partial") routeStatus = "PARTIAL CLOSURE";
  else if (summary.displayTier === "alert") routeStatus = "MAJOR ISSUE";
  else if (summary.displayTier === "watch") routeStatus = "CAUTION";
  else routeStatus = "CLEAR";

  return {
    routeStatus,
    closureScope,
    closureCount,
    activeEventCount,
    hasConfidenceIssue,
    failedCount,
    degradedCount,
    isDataUnavailable,
    isAssemblyFailed,
  };
}

export const deriveRiderStateMeta = deriveRouteStatusMeta;
