import type { DashboardEventWithUnknownLane, SystemHealthFile } from "./types";
import type { RouteWideSummary } from "./normalize-dashboard-data";

export type RouteClosureScope = "none" | "partial" | "full";

export type RiderState =
  | "CLEAR"
  | "CAUTION"
  | "MAJOR ISSUE"
  | "PARTIAL CLOSURE"
  | "CLOSED"
  | "DATA STALE";

export type RiderStateMeta = {
  riderState: RiderState;
  closureScope: RouteClosureScope;
  closureCount: number;
  activeEventCount: number;
  statusDetail: string | null;
  hasConfidenceIssue: boolean;
  failedCount: number;
  degradedCount: number;
  isDataUnavailable: boolean;
  isAssemblyFailed: boolean;
};

export function isClosureEvent(event: DashboardEventWithUnknownLane): boolean {
  return event.riderCanPass !== null && event.riderCanPass !== undefined;
}

function hasExplicitWholeRouteLanguage(event: DashboardEventWithUnknownLane): boolean {
  const haystack = [
    event.title,
    event.summary,
    event.locationLabel,
    event.routeSegmentLabel,
    event.routeSegmentId,
    event.routeEffect,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return /\b(full|whole|entire|all)\s+(route|uw[-\s]?issy|university of washington to issaquah)\b/.test(haystack);
}

function hasLocalizedClosureEvidence(event: DashboardEventWithUnknownLane): boolean {
  return Boolean(event.locationLabel || event.routeSegmentLabel || event.routeSegmentId || event.geometry);
}

export function deriveRouteClosureScope(events: DashboardEventWithUnknownLane[]): RouteClosureScope {
  const closureEvents = events.filter(isClosureEvent);
  if (closureEvents.length === 0) return "none";

  const hasRouteWideClosure = closureEvents.some(
    (event) => hasExplicitWholeRouteLanguage(event) && !hasLocalizedClosureEvidence(event),
  );

  return hasRouteWideClosure ? "full" : "partial";
}

export function deriveRiderStateMeta(
  summary: RouteWideSummary,
  systemHealth: SystemHealthFile | null,
  events: DashboardEventWithUnknownLane[],
): RiderStateMeta {
  const activeEventCount = events.length;
  const closureEvents = events.filter(isClosureEvent);
  const closureCount = closureEvents.length;
  const closureScope = deriveRouteClosureScope(events);
  const isDataUnavailable = systemHealth === null;
  const isAssemblyFailed = systemHealth?.assemblyState === "failed";
  const failedCount = systemHealth?.failedLaneIds.length ?? 0;
  const degradedCount = systemHealth?.degradedLaneIds.length ?? 0;
  const hasConfidenceIssue =
    isDataUnavailable || isAssemblyFailed || failedCount > 0 || degradedCount > 0 || summary.displayTier === "unknown";

  let riderState: RiderState;
  if (isDataUnavailable || isAssemblyFailed || summary.displayTier === "unknown") riderState = "DATA STALE";
  else if (closureScope === "full") riderState = "CLOSED";
  else if (closureScope === "partial") riderState = "PARTIAL CLOSURE";
  else if (summary.displayTier === "alert") riderState = "MAJOR ISSUE";
  else if (summary.displayTier === "watch" || failedCount > 0 || degradedCount > 0) riderState = "CAUTION";
  else riderState = "CLEAR";

  let statusDetail: string | null = null;
  if (closureScope === "partial") {
    statusDetail =
      "One or more localized route segments are closed; the full route is not reported closed. Check the mapped closure and alert detail before riding.";
  } else if (closureScope === "full") {
    statusDetail = "A route-wide closure is reported. Check the mapped closure and alert detail before riding.";
  }

  return {
    riderState,
    closureScope,
    closureCount,
    activeEventCount,
    statusDetail,
    hasConfidenceIssue,
    failedCount,
    degradedCount,
    isDataUnavailable,
    isAssemblyFailed,
  };
}
