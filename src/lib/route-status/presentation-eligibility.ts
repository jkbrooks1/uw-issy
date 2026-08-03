import type { DashboardEvent, PresentationReason } from "./types";

const SHORT_LIVED_FRESHNESS_HOURS = 48;

export type EligibilityCheck = {
  eligible: boolean;
  reason: PresentationReason | "presentation_ineligible_or_absent";
};

/**
 * Dashboard-side final safety guard (noise-reduction policy). The public-
 * package layer is authoritative and already excludes everything this
 * blocks — this is defense in depth, not the primary decision, and must
 * never show something the data layer marked ineligible. Re-derives its
 * own freshness check against the real current time (not just the build
 * snapshot's own timestamp) so a short-lived alert does not stay visible
 * forever just because the site has not rebuilt recently.
 */
export function isEligibleForDisplay(
  event: Pick<
    DashboardEvent,
    | "presentationEligible"
    | "presentationReason"
    | "routeRelevant"
    | "routeImpact"
    | "effectiveUntil"
    | "lastSourceRefreshAt"
  >,
  nowMs: number = Date.now(),
): EligibilityCheck {
  if (event.presentationEligible !== true) {
    return { eligible: false, reason: "presentation_ineligible_or_absent" };
  }
  if (
    event.presentationReason === "health_alert_excluded" ||
    event.presentationReason === "flood_below_major" ||
    event.presentationReason === "flood_no_active_category" ||
    event.presentationReason === "duplicate_merged" ||
    event.presentationReason === "expired" ||
    event.presentationReason === "stale_short_lived_alert"
  ) {
    return { eligible: false, reason: event.presentationReason };
  }
  if (!event.routeRelevant) {
    return { eligible: false, reason: "off_route" };
  }
  if (!event.routeImpact) {
    return { eligible: false, reason: "no_route_impact" };
  }

  const untilMs = event.effectiveUntil ? Date.parse(event.effectiveUntil) : NaN;
  const hasValidFutureEnd = Number.isFinite(untilMs) && untilMs > nowMs;
  if (Number.isFinite(untilMs) && untilMs <= nowMs) {
    return { eligible: false, reason: "expired" };
  }
  if (!hasValidFutureEnd) {
    const refreshMs = event.lastSourceRefreshAt ? Date.parse(event.lastSourceRefreshAt) : NaN;
    if (!Number.isFinite(refreshMs) || nowMs - refreshMs > SHORT_LIVED_FRESHNESS_HOURS * 60 * 60 * 1000) {
      return { eligible: false, reason: "stale_short_lived_alert" };
    }
  }

  return { eligible: true, reason: "eligible" };
}
