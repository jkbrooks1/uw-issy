import type { SourceHealthState } from "./types";

/** Approved public SS-H vocabulary only. */
export const SOURCE_HEALTH_TEXT: Record<SourceHealthState, string> = {
  ok: "Current",
  degraded: "Degraded",
  stale: "Degraded",
  no_relevant_events: "Current",
  failed_validation: "Source data could not be confirmed",
  failed_fetch: "Source could not be checked",
  blocked: "Source check was blocked",
  using_last_known_good: "Showing last known data",
  unavailable: "Source unavailable",
  unknown: "Source state unknown",
};

const CANONICAL_STATES: readonly SourceHealthState[] = [
  "ok",
  "degraded",
  "stale",
  "no_relevant_events",
  "failed_validation",
  "failed_fetch",
  "blocked",
  "using_last_known_good",
  "unavailable",
  "unknown",
];

/** Maps any raw internal state string to one canonical source-health state. */
export function toSourceHealthState(rawState: string | null | undefined): SourceHealthState {
  if (typeof rawState !== "string") return "unknown";
  return (CANONICAL_STATES as readonly string[]).includes(rawState)
    ? (rawState as SourceHealthState)
    : "unknown";
}

export function sourceHealthText(state: SourceHealthState): string {
  return SOURCE_HEALTH_TEXT[state];
}
