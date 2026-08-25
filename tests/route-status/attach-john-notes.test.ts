import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { writeFileSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { attachJohnNotes } from "../../src/lib/route-status/attach-john-notes";
import type { DashboardEventWithUnknownLane } from "../../src/lib/route-status/types";

const TEMP_DIR = "/tmp/john-notes-test";

function event(title: string, overrides: Partial<DashboardEventWithUnknownLane> = {}): DashboardEventWithUnknownLane {
  return {
    id: "test-event",
    laneId: "01_ROUTE_CONDITIONS",
    rawLaneId: "01_ROUTE_CONDITIONS",
    laneLabel: "Route conditions",
    title,
    summary: null,
    locationLabel: "Test location",
    trailName: "Test trail",
    alertNature: "Test alert",
    routeSegmentId: null,
    routeSegmentLabel: null,
    displayTier: "watch",
    routeEffect: "Test effect",
    reportedAt: null,
    effectiveFrom: null,
    effectiveUntil: null,
    geometry: null,
    sourceName: "Test source",
    sourceUrl: "https://example.com",
    mergedSourceUrls: null,
    confidence: null,
    isLastKnownGood: false,
    isStale: false,
    presentationEligible: true,
    presentationReason: "eligible",
    routeRelevant: true,
    routeImpact: true,
    duplicateGroupKey: null,
    lastSourceRefreshAt: null,
    severity: null,
    currentStatus: null,
    detourAvailable: null,
    detourDescription: null,
    closureName: null,
    closedLengthMiles: null,
    closedLengthSource: null,
    closureStartCrossing: null,
    closureEndCrossing: null,
    closureHours: null,
    closureStartDate: null,
    projectedEndDate: null,
    routeAction: null,
    riderCanPass: null,
    ...overrides,
  };
}

describe("attach-john-notes", () => {
  beforeEach(() => {
    try {
      unlinkSync(TEMP_DIR);
    } catch {
      // Ignore if file doesn't exist
    }
  });

  afterEach(() => {
    try {
      unlinkSync(TEMP_DIR);
    } catch {
      // Ignore if file doesn't exist
    }
  });

  it("1. attaches a note when the event title exactly matches a JOHN_NOTES.json key", () => {
    const testNote = "It's possible to take an alternate route.";
    writeFileSync(
      TEMP_DIR,
      JSON.stringify({
        "Test event title": testNote,
      }),
    );

    const events = [event("Test event title")];
    const result = attachJohnNotes(events, TEMP_DIR);

    expect(result).toHaveLength(1);
    expect((result[0] as any).johnNote).toBe(testNote);
  });

  it("2. does not attach a note when the event title does not match any key", () => {
    writeFileSync(
      TEMP_DIR,
      JSON.stringify({
        "Different title": "Some note",
      }),
    );

    const events = [event("Test event title")];
    const result = attachJohnNotes(events, TEMP_DIR);

    expect(result).toHaveLength(1);
    expect((result[0] as any).johnNote).toBeUndefined();
  });

  it("3. does not mutate the original event's source-derived fields", () => {
    const testNote = "Alternate route available.";
    writeFileSync(
      TEMP_DIR,
      JSON.stringify({
        "Test event title": testNote,
      }),
    );

    const originalEvent = event("Test event title", {
      routeEffect: "Segment closed",
      displayTier: "alert",
      severity: "high",
    });

    const result = attachJohnNotes([originalEvent], TEMP_DIR);
    const resultEvent = result[0] as any;

    // Verify source fields unchanged
    expect(resultEvent.routeEffect).toBe("Segment closed");
    expect(resultEvent.displayTier).toBe("alert");
    expect(resultEvent.severity).toBe("high");
    // Verify John Note is added as separate field
    expect(resultEvent.johnNote).toBe(testNote);
  });

  it("4. returns unmodified events when JOHN_NOTES.json does not exist", () => {
    const events = [event("Test event title")];
    const result = attachJohnNotes(events, "/nonexistent/path/to/notes.json");

    expect(result).toHaveLength(1);
    expect((result[0] as any).johnNote).toBeUndefined();
  });

  it("5. throws an error when JOHN_NOTES.json is malformed JSON", () => {
    writeFileSync(TEMP_DIR, "{ invalid json ]");

    const events = [event("Test event title")];
    expect(() => attachJohnNotes(events, TEMP_DIR)).toThrow("Failed to load JOHN_NOTES.json");
  });

  it("6. throws an error when JOHN_NOTES.json is not an object", () => {
    writeFileSync(TEMP_DIR, '["array", "not", "object"]');

    const events = [event("Test event title")];
    expect(() => attachJohnNotes(events, TEMP_DIR)).toThrow("must be a valid JSON object");
  });

  it("7. matches only exact titles (case-sensitive)", () => {
    writeFileSync(
      TEMP_DIR,
      JSON.stringify({
        "Test Event Title": "Note for capitalized title",
      }),
    );

    const events = [event("Test event title")];
    const result = attachJohnNotes(events, TEMP_DIR);

    expect((result[0] as any).johnNote).toBeUndefined();
  });

  it("8. attaches multiple notes to different events", () => {
    writeFileSync(
      TEMP_DIR,
      JSON.stringify({
        "Event A": "Note for A",
        "Event B": "Note for B",
      }),
    );

    const events = [event("Event A"), event("Event B"), event("Event C")];
    const result = attachJohnNotes(events, TEMP_DIR);

    expect((result[0] as any).johnNote).toBe("Note for A");
    expect((result[1] as any).johnNote).toBe("Note for B");
    expect((result[2] as any).johnNote).toBeUndefined();
  });

  it("9. preserves all event array order and count", () => {
    writeFileSync(
      TEMP_DIR,
      JSON.stringify({
        "Event A": "Note A",
      }),
    );

    const events = [event("Event A"), event("Event B"), event("Event C")];
    const result = attachJohnNotes(events, TEMP_DIR);

    expect(result).toHaveLength(3);
    expect(result[0].title).toBe("Event A");
    expect(result[1].title).toBe("Event B");
    expect(result[2].title).toBe("Event C");
  });

  it("10. the East Lake Sammamish Trail closure has the corrected typo in JOHN_NOTES.json", () => {
    // This test reads the actual JOHN_NOTES.json from the project root
    const realNotesPath = join(process.cwd(), "JOHN_NOTES.json");
    const events = [
      event("East Lake Sammamish Trail closure for George Davis Creek culvert replacement."),
    ];
    const result = attachJohnNotes(events, realNotesPath);

    const note = (result[0] as any).johnNote;
    expect(note).toBeDefined();
    expect(note).toContain("cross oncoming traffic");
    expect(note).not.toContain("crooss");
  });
});
