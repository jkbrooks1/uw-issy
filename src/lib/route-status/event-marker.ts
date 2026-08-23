import type { DashboardEventWithUnknownLane } from "./types";

export type EventMarkerSeverity = "major" | "caution" | "clear";

export type EventMarkerPresentation = {
  severity: EventMarkerSeverity;
  label: "Major issue" | "Caution" | "Clear / resolved";
  color: string;
  cssClass: string;
};

const MAJOR_SEVERITY_TERMS = new Set(["high", "major", "severe", "closure", "closed", "critical"]);
const CAUTION_SEVERITY_TERMS = new Set(["medium", "moderate", "watch", "caution", "degraded", "advisory"]);
const CLEAR_SEVERITY_TERMS = new Set(["low", "minor", "normal", "clear", "resolved", "informational", "info"]);
const CLOSED_STATUS_TERMS = new Set(["closed", "closure", "active closure"]);
const RESOLVED_STATUS_TERMS = new Set(["resolved", "clear", "cleared", "reopened", "open"]);

function normalized(value: string | null | undefined): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function markerSeverityForEvent(event: DashboardEventWithUnknownLane): EventMarkerSeverity {
  const riderCanPass = normalized(event.riderCanPass);
  const severity = normalized(event.severity);
  const status = normalized(event.currentStatus);

  if (riderCanPass === "no") return "major";
  if (MAJOR_SEVERITY_TERMS.has(severity) || CLOSED_STATUS_TERMS.has(status)) return "major";
  if (event.displayTier === "alert") return "major";

  if (CAUTION_SEVERITY_TERMS.has(severity) || riderCanPass === "unknown") return "caution";
  if (event.displayTier === "watch") return "caution";

  if (CLEAR_SEVERITY_TERMS.has(severity) || RESOLVED_STATUS_TERMS.has(status) || event.displayTier === "normal") {
    return "clear";
  }

  return "caution";
}

export function markerPresentationForEvent(event: DashboardEventWithUnknownLane): EventMarkerPresentation {
  const severity = markerSeverityForEvent(event);
  if (severity === "major") {
    return { severity, label: "Major issue", color: "#C72B20", cssClass: "event-marker--major" };
  }
  if (severity === "caution") {
    return { severity, label: "Caution", color: "#D99100", cssClass: "event-marker--caution" };
  }
  return { severity, label: "Clear / resolved", color: "#2D7A30", cssClass: "event-marker--clear" };
}
