import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const REPO_ROOT = join(__dirname, "..", "..");
const INDEX_ASTRO = readFileSync(join(REPO_ROOT, "src", "pages", "index.astro"), "utf8");
const CURRENT_ROUTE_ALERTS_ASTRO = readFileSync(
  join(REPO_ROOT, "src", "components", "route-status", "CurrentRouteAlerts.astro"),
  "utf8",
);
const EVENT_TABLE_ASTRO = readFileSync(join(REPO_ROOT, "src", "components", "route-status", "EventTable.astro"), "utf8");
const EVENT_LIST_MOBILE_ASTRO = readFileSync(
  join(REPO_ROOT, "src", "components", "route-status", "EventListMobile.astro"),
  "utf8",
);
const CLOSURES_AND_DETOURS_ASTRO = readFileSync(
  join(REPO_ROOT, "src", "components", "route-status", "ClosuresAndDetours.astro"),
  "utf8",
);
const ROUTE_MAP_SVELTE = readFileSync(join(REPO_ROOT, "src", "components", "route-status", "RouteMap.svelte"), "utf8");
const RIDER_IMPACT_GRID_TS = readFileSync(
  join(REPO_ROOT, "src", "lib", "route-status", "rider-impact-grid.ts"),
  "utf8",
);

describe("John Note placement", () => {
  it("1. matching route issue renders John Note within that event in Current route issues", () => {
    expect(CURRENT_ROUTE_ALERTS_ASTRO).toContain("<EventTable events={events} />");
    expect(CURRENT_ROUTE_ALERTS_ASTRO).toContain("<EventListMobile events={events} />");
    expect(INDEX_ASTRO).toContain("const events = johnNotesPresentation.events;");
    expect(EVENT_TABLE_ASTRO).toContain('class="john-note-row"');
    expect(EVENT_TABLE_ASTRO).toContain('colspan="5"');
    expect(EVENT_TABLE_ASTRO).toContain("<strong>John Note</strong>");
    expect(EVENT_LIST_MOBILE_ASTRO).toContain('class="john-note-block"');
    expect(EVENT_LIST_MOBILE_ASTRO).toContain("<strong>John Note</strong>");
    expect(CLOSURES_AND_DETOURS_ASTRO).not.toContain("<dt>John Note</dt>");
  });

  it("1b. Current route issues keeps the compact five-column row and does not dump EventDetail", () => {
    expect(EVENT_TABLE_ASTRO).toContain("<th scope=\"col\">Event</th>");
    expect(EVENT_TABLE_ASTRO).toContain("<th scope=\"col\">Affected section</th>");
    expect(EVENT_TABLE_ASTRO).toContain("<th scope=\"col\">Reported</th>");
    expect(EVENT_TABLE_ASTRO).toContain("<th scope=\"col\">Status</th>");
    expect(EVENT_TABLE_ASTRO).toContain("<th scope=\"col\">Segment passability</th>");
    expect(EVENT_TABLE_ASTRO).not.toContain("EventDetail");
    expect(EVENT_TABLE_ASTRO).not.toContain("<details");
    expect(EVENT_TABLE_ASTRO).not.toContain("<summary");
  });

  it("2. zero reportable route issues still render standalone John Note in Current route issues", () => {
    expect(INDEX_ASTRO).toContain("const currentRouteIssueJohnNotes = events.length === 0");
    expect(INDEX_ASTRO).toContain("johnNotes={currentRouteIssueJohnNotes}");
    expect(CURRENT_ROUTE_ALERTS_ASTRO).toContain('<p class="empty-note">No active route issues reported.</p>');
    expect(CURRENT_ROUTE_ALERTS_ASTRO).toContain("<dt>John Note</dt>");
    expect(CURRENT_ROUTE_ALERTS_ASTRO).toContain("<dd>{johnNote.note}</dd>");
  });

  it("3. standalone John Note does not increment active issue count", () => {
    expect(INDEX_ASTRO).not.toMatch(/activeEventCount\s*[+=]/);
    expect(INDEX_ASTRO).not.toMatch(/summary\.activeEventCount\s*=\s*.*john/i);
    expect(CURRENT_ROUTE_ALERTS_ASTRO).not.toMatch(/events\s*=\s*\[.*johnNotes/s);
  });

  it("4. standalone John Note does not change Harvey-ball state", () => {
    expect(INDEX_ASTRO).toContain("<RiderImpactGrid summary={summary} events={events} />");
    expect(INDEX_ASTRO).not.toMatch(/RiderImpactGrid[^>]*johnNotes/);
    expect(RIDER_IMPACT_GRID_TS).not.toMatch(/johnNote|johnNotes/i);
  });

  it("5. standalone John Note does not create a map marker", () => {
    expect(INDEX_ASTRO).toContain("johnNotesByTitle={johnNotesPresentation.notesByTitle}");
    expect(ROUTE_MAP_SVELTE).toContain("export let johnNotesByTitle");
    expect(ROUTE_MAP_SVELTE).toContain("props.johnNote ?? johnNotesByTitle[title]");
    expect(ROUTE_MAP_SVELTE).toContain("for (const feature of eventsGeoJson.features ?? [])");
    expect(ROUTE_MAP_SVELTE).not.toContain("for (const johnNote");
  });
});
