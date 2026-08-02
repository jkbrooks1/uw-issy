import type { DisplayTier } from "./types";

const CANONICAL_TIERS: readonly DisplayTier[] = ["normal", "watch", "alert", "unknown"];

/** Buildspec section 10.2 — public labels for the four canonical tiers. */
export const DISPLAY_TIER_LABELS: Record<DisplayTier, string> = {
  normal: "Normal",
  watch: "Watch",
  alert: "Alert",
  unknown: "Status unknown",
};

/**
 * Maps any internal tier value to one of the four canonical display tiers.
 * Buildspec sections 10.2, 34.5, and 37 require an unrecognized value to
 * become "unknown" — never "normal".
 */
export function toDisplayTier(rawTier: string | null | undefined): DisplayTier {
  if (typeof rawTier !== "string") {
    return "unknown";
  }
  const normalized = rawTier.trim().toLowerCase();
  return (CANONICAL_TIERS as readonly string[]).includes(normalized)
    ? (normalized as DisplayTier)
    : "unknown";
}

export function displayTierLabel(tier: DisplayTier): string {
  return DISPLAY_TIER_LABELS[tier];
}
