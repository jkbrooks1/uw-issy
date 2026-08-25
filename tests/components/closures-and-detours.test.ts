import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const REPO_ROOT = join(__dirname, "..", "..");
const CLOSURES_ASTRO = readFileSync(
  join(REPO_ROOT, "src", "components", "route-status", "ClosuresAndDetours.astro"),
  "utf8",
);

describe("ClosuresAndDetours component", () => {
  it("1. does not render John Note because owner placement is Current route issues", () => {
    expect(CLOSURES_ASTRO).not.toMatch(/<dt>John Note<\/dt>/);
    expect(CLOSURES_ASTRO).not.toMatch(/\(event as any\)\.johnNote/);
  });

  it("2. preserves all source-derived closure fields", () => {
    expect(CLOSURES_ASTRO).toMatch(/<dt>Reported<\/dt>/);
    expect(CLOSURES_ASTRO).toMatch(/<dt>Source<\/dt>/);
    expect(CLOSURES_ASTRO).toMatch(/<dt>Closed section<\/dt>/);
    expect(CLOSURES_ASTRO).toMatch(/<dt>From<\/dt>/);
    expect(CLOSURES_ASTRO).toMatch(/<dt>To<\/dt>/);
    expect(CLOSURES_ASTRO).toMatch(/<dt>Closed length<\/dt>/);
    expect(CLOSURES_ASTRO).toMatch(/<dt>Detour<\/dt>/);
    expect(CLOSURES_ASTRO).toMatch(/<dt>Expected reopening<\/dt>/);
  });
});
