import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { DashboardEventWithUnknownLane } from "./types";

export type EventWithJohnNote = DashboardEventWithUnknownLane & {
  johnNote?: string;
};

/**
 * Load John Notes from JOHN_NOTES.json and attach to events by exact title match.
 * The JSON key must match the event's public title exactly.
 */
export function attachJohnNotes(
  events: DashboardEventWithUnknownLane[],
  notesFilePath: string,
): EventWithJohnNote[] {
  let notes: Record<string, string> = {};

  try {
    const content = readFileSync(notesFilePath, "utf8");
    notes = JSON.parse(content) as Record<string, string>;

    if (typeof notes !== "object" || notes === null || Array.isArray(notes)) {
      throw new Error("JOHN_NOTES.json must be a valid JSON object (not array or null)");
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes("ENOENT")) {
      // File doesn't exist — no notes to attach
      return events;
    }
    // Any other error (parse error, type error) should fail the build
    throw new Error(`Failed to load JOHN_NOTES.json: ${error instanceof Error ? error.message : String(error)}`);
  }

  return events.map((event): EventWithJohnNote => {
    // Match against the exact public title
    const johnNote = notes[event.title];
    return {
      ...event,
      ...(johnNote && { johnNote }),
    };
  });
}
