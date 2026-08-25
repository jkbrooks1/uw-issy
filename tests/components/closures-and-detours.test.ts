import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const REPO_ROOT = join(__dirname, "..", "..");
const CLOSURES_ASTRO = readFileSync(
  join(REPO_ROOT, "src", "components", "route-status", "ClosuresAndDetours.astro"),
  "utf8",
);

describe("ClosuresAndDetours component", () => {
  it("1. renders John Note field if event has johnNote", () => {
    expect(CLOSURES_ASTRO).toMatch(/\(event as any\)\.johnNote/);
    expect(CLOSURES_ASTRO).toMatch(/<dt>John Note<\/dt>/);
  });

  it("2. renders John Note after Reported field (source-derived fields come first)", () => {
    const reportedIndex = CLOSURES_ASTRO.indexOf("<dt>Reported</dt>");
    const johnNoteIndex = CLOSURES_ASTRO.indexOf("<dt>John Note</dt>");
    expect(reportedIndex).toBeGreaterThan(0);
    expect(johnNoteIndex).toBeGreaterThan(reportedIndex);
  });

  it("3. does not render John Note if event does not have johnNote", () => {
    expect(CLOSURES_ASTRO).toMatch(
      /\{\(event as any\)\.johnNote && \(/s,
    );
  });

  it("4. uses approved label exactly: 'John Note'", () => {
    expect(CLOSURES_ASTRO).toMatch(/<dt>John Note<\/dt>/);
    expect(CLOSURES_ASTRO).not.toMatch(/<dt>John note<\/dt>/);
    expect(CLOSURES_ASTRO).not.toMatch(/<dt>Owner Note<\/dt>/);
    expect(CLOSURES_ASTRO).not.toMatch(/<dt>Editorial Note<\/dt>/);
  });

  it("5. renders the note value without mutation", () => {
    expect(CLOSURES_ASTRO).toMatch(
      /<dd>\{.*?\(event as any\)\.johnNote.*?\}<\/dd>/s,
    );
  });

  it("6. preserves all source-derived fields (Reported, Source, etc)", () => {
    expect(CLOSURES_ASTRO).toMatch(/<dt>Reported<\/dt>/);
    expect(CLOSURES_ASTRO).toMatch(/<dt>Source<\/dt>/);
    expect(CLOSURES_ASTRO).toMatch(/<dt>Closed section<\/dt>/);
    expect(CLOSURES_ASTRO).toMatch(/<dt>From<\/dt>/);
    expect(CLOSURES_ASTRO).toMatch(/<dt>To<\/dt>/);
    expect(CLOSURES_ASTRO).toMatch(/<dt>Closed length<\/dt>/);
    expect(CLOSURES_ASTRO).toMatch(/<dt>Detour<\/dt>/);
    expect(CLOSURES_ASTRO).toMatch(/<dt>Expected reopening<\/dt>/);
  });

  it("7. John Note is editorial overlay only (conditional rendering means no field if not present)", () => {
    expect(CLOSURES_ASTRO).toMatch(/\{.*\(event as any\)\.johnNote/);
  });
});
