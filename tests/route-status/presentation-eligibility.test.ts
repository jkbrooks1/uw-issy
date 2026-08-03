import { describe, expect, it } from "vitest";
import { isEligibleForDisplay } from "../../src/lib/route-status/presentation-eligibility";
import type { DashboardEvent } from "../../src/lib/route-status/types";

const NOW = Date.parse("2026-08-02T16:23:29.490Z");

function baseEvent(overrides: Partial<DashboardEvent> = {}): Pick<
  DashboardEvent,
  "presentationEligible" | "presentationReason" | "routeRelevant" | "routeImpact" | "effectiveUntil" | "lastSourceRefreshAt"
> {
  return {
    presentationEligible: true,
    presentationReason: "eligible",
    routeRelevant: true,
    routeImpact: true,
    effectiveUntil: null,
    lastSourceRefreshAt: "2026-08-02T10:00:00.000Z",
    ...overrides,
  };
}

describe("dashboard final guard (presentation-eligibility.ts)", () => {
  it("blocks an event the data layer marked ineligible or absent", () => {
    expect(isEligibleForDisplay(baseEvent({ presentationEligible: false }), NOW).eligible).toBe(false);
  });

  it("blocks a banned health alert even if presentationEligible were somehow true", () => {
    const check = isEligibleForDisplay(baseEvent({ presentationReason: "health_alert_excluded" }), NOW);
    expect(check.eligible).toBe(false);
    expect(check.reason).toBe("health_alert_excluded");
  });

  it("blocks a non-major flood item", () => {
    expect(isEligibleForDisplay(baseEvent({ presentationReason: "flood_below_major" }), NOW).eligible).toBe(false);
  });

  it("blocks an item lacking route relevance", () => {
    expect(isEligibleForDisplay(baseEvent({ routeRelevant: false }), NOW).eligible).toBe(false);
  });

  it("blocks an item lacking a route-use effect", () => {
    expect(isEligibleForDisplay(baseEvent({ routeImpact: false }), NOW).eligible).toBe(false);
  });

  it("blocks a known duplicate", () => {
    expect(isEligibleForDisplay(baseEvent({ presentationReason: "duplicate_merged" }), NOW).eligible).toBe(false);
  });

  it("blocks an item past its stated end date, independent of the data layer's own check", () => {
    const check = isEligibleForDisplay(baseEvent({ effectiveUntil: "2026-07-01T00:00:00.000Z" }), NOW);
    expect(check.eligible).toBe(false);
    expect(check.reason).toBe("expired");
  });

  it("blocks a short-lived alert more than 48h past its last valid source refresh", () => {
    const check = isEligibleForDisplay(baseEvent({ lastSourceRefreshAt: "2026-07-30T00:00:00.000Z" }), NOW);
    expect(check.eligible).toBe(false);
    expect(check.reason).toBe("stale_short_lived_alert");
  });

  it("blocks an item with no valid refresh time and no future end date", () => {
    const check = isEligibleForDisplay(baseEvent({ lastSourceRefreshAt: null }), NOW);
    expect(check.eligible).toBe(false);
  });

  it("allows an eligible, route-relevant, route-impacting, fresh item through", () => {
    const check = isEligibleForDisplay(baseEvent(), NOW);
    expect(check.eligible).toBe(true);
    expect(check.reason).toBe("eligible");
  });

  it("allows a long-running closure with a future end date through even with an old refresh time", () => {
    const check = isEligibleForDisplay(
      baseEvent({ effectiveUntil: "2026-12-31T23:59:59.000Z", lastSourceRefreshAt: "2026-06-01T00:00:00.000Z" }),
      NOW,
    );
    expect(check.eligible).toBe(true);
  });
});
