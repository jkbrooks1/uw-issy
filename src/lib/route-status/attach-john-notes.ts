import { readFileSync } from "node:fs";
import type { DashboardEventWithUnknownLane } from "./types";

export type EventWithJohnNote = DashboardEventWithUnknownLane & {
  johnNote?: string;
};

export type JohnNote = {
  matchText: string;
  note: string;
};

export type JohnNotesResult = {
  events: EventWithJohnNote[];
  johnNotes: JohnNote[];
  matchedNotes: JohnNote[];
  standaloneNotes: JohnNote[];
  notesByTitle: Record<string, string>;
};

function loadJohnNotes(notesFilePath: string): Record<string, string> {
  try {
    const content = readFileSync(notesFilePath, "utf8");
    const notes = JSON.parse(content) as Record<string, string>;

    if (typeof notes !== "object" || notes === null || Array.isArray(notes)) {
      throw new Error("JOHN_NOTES.json must be a valid JSON object (not array or null)");
    }

    return Object.fromEntries(
      Object.entries(notes).filter((entry): entry is [string, string] => {
        const [matchText, note] = entry;
        return matchText.trim().length > 0 && typeof note === "string" && note.trim().length > 0;
      }),
    );
  } catch (error) {
    if (error instanceof Error && error.message.includes("ENOENT")) {
      // File doesn't exist — no notes to attach
      return {};
    }
    // Any other error (parse error, type error) should fail the build
    throw new Error(`Failed to load JOHN_NOTES.json: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Load John Notes from JOHN_NOTES.json and attach to events by exact title match.
 * The JSON key must match the event's public title exactly.
 */
export function attachJohnNotes(
  events: DashboardEventWithUnknownLane[],
  notesFilePath: string,
): EventWithJohnNote[] {
  return attachJohnNotesForPresentation(events, notesFilePath).events;
}

export function attachJohnNotesForPresentation(
  events: DashboardEventWithUnknownLane[],
  notesFilePath: string,
): JohnNotesResult {
  const notes = loadJohnNotes(notesFilePath);
  const matchedKeys = new Set<string>();
  const notesByTitle: Record<string, string> = {};

  const eventsWithNotes = events.map((event): EventWithJohnNote => {
    const johnNote = notes[event.title];
    if (johnNote) {
      matchedKeys.add(event.title);
      notesByTitle[event.title] = johnNote;
    }
    return {
      ...event,
      ...(johnNote && { johnNote }),
    };
  });

  const johnNotes = Object.entries(notes).map(([matchText, note]) => ({ matchText, note }));
  const matchedNotes = johnNotes.filter((johnNote) => matchedKeys.has(johnNote.matchText));
  const standaloneNotes = johnNotes.filter((johnNote) => !matchedKeys.has(johnNote.matchText));

  return {
    events: eventsWithNotes,
    johnNotes,
    matchedNotes,
    standaloneNotes,
    notesByTitle,
  };
}
