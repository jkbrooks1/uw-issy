const PACIFIC_TIME_ZONE = "America/Los_Angeles";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: PACIFIC_TIME_ZONE,
  month: "short",
  day: "numeric",
  year: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: PACIFIC_TIME_ZONE,
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

const zoneFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: PACIFIC_TIME_ZONE,
  timeZoneName: "short",
});

/**
 * Formats an ISO timestamp into Pacific time in the exact style shown in
 * buildspec section 15.3, e.g. "Aug 2, 2026 at 10:00 AM PDT".
 * Returns null when the input is not a parseable timestamp — callers must
 * not invent a fallback time (buildspec section 11.3).
 */
export function formatPacificTime(isoTimestamp: string | null | undefined): string | null {
  if (typeof isoTimestamp !== "string" || isoTimestamp.trim() === "") {
    return null;
  }
  const date = new Date(isoTimestamp);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const datePart = dateFormatter.format(date);
  const timePart = timeFormatter.format(date);
  const zonePart = zoneFormatter
    .formatToParts(date)
    .find((part) => part.type === "timeZoneName")?.value;

  return zonePart ? `${datePart} at ${timePart} ${zonePart}` : `${datePart} at ${timePart}`;
}
