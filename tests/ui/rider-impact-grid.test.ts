import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const REPO_ROOT = join(__dirname, "..", "..");
const INDEX_ASTRO = readFileSync(join(REPO_ROOT, "src", "pages", "index.astro"), "utf8");
const RIDER_IMPACT_GRID_ASTRO = readFileSync(
  join(REPO_ROOT, "src", "components", "route-status", "RiderImpactGrid.astro"),
  "utf8",
);
const RIDER_IMPACT_GRID_TS = readFileSync(
  join(REPO_ROOT, "src", "lib", "route-status", "rider-impact-grid.ts"),
  "utf8",
);
const CURRENT_ROUTE_STATE_ASTRO = readFileSync(
  join(REPO_ROOT, "src", "components", "route-status", "CurrentRouteState.astro"),
  "utf8",
);
const CSS = readFileSync(join(REPO_ROOT, "src", "styles", "route-status.css"), "utf8");

describe("rider impact grid (Harvey-ball replacement)", () => {
  it("1. the old Route status summary card (CurrentRouteState.astro) is no longer imported in index.astro", () => {
    expect(INDEX_ASTRO).not.toMatch(/import.*CurrentRouteState/);
    expect(INDEX_ASTRO).not.toMatch(/CurrentRouteState/);
  });

  it("2. the old Route status summary card component content is removed", () => {
    expect(CURRENT_ROUTE_STATE_ASTRO).not.toContain("RiderImpactGrid");
  });

  it("3. the old 'Partial closure' top-card presentation is not in the grid", () => {
    expect(RIDER_IMPACT_GRID_ASTRO).not.toMatch(/Partial closure/);
  });

  it("4. the old 'Active route issues:' line is not in the grid", () => {
    expect(RIDER_IMPACT_GRID_ASTRO).not.toMatch(/Active route issues/);
  });

  it("5. the old 'Localized closures reported:' line is not in the grid", () => {
    expect(RIDER_IMPACT_GRID_ASTRO).not.toMatch(/Localized closures/);
  });

  it("6. six approved labels render in the grid", () => {
    expect(RIDER_IMPACT_GRID_TS).toMatch(/01_ROUTE_CONDITIONS/);
    expect(RIDER_IMPACT_GRID_TS).toMatch(/02_WEATHER/);
    expect(RIDER_IMPACT_GRID_TS).toMatch(/03_AIR_QUALITY/);
    expect(RIDER_IMPACT_GRID_TS).toMatch(/04_WILDFIRE/);
    expect(RIDER_IMPACT_GRID_TS).toMatch(/05_FLOOD_CONDITIONS/);
    expect(RIDER_IMPACT_GRID_TS).toMatch(/06_TRAIL_INFRASTRUCTURE_STATUS/);
  });

  it("7. the grid uses a 2-column layout", () => {
    expect(CSS).toMatch(/\.rider-impact-grid__container\s*\{[\s\S]*?grid-template-columns:\s*1fr\s+1fr/);
  });

  it("8. on mobile, the grid collapses to 1 column", () => {
    expect(CSS).toMatch(/@media.*max-width:\s*600px[\s\S]*?\.rider-impact-grid__container\s*\{[\s\S]*?grid-template-columns:\s*1fr/);
  });

  it("9. Harvey balls render with color classes (green/yellow/red/unknown)", () => {
    expect(CSS).toMatch(/\.rider-impact-grid__ball--green/);
    expect(CSS).toMatch(/\.rider-impact-grid__ball--yellow/);
    expect(CSS).toMatch(/\.rider-impact-grid__ball--red/);
    expect(CSS).toMatch(/\.rider-impact-grid__ball--unknown/);
  });

  it("10. Harvey balls have aria-labels for accessibility", () => {
    expect(RIDER_IMPACT_GRID_ASTRO).toMatch(/aria-label={category\.ariaLabel}/);
    expect(RIDER_IMPACT_GRID_TS).toMatch(/colorToLabel/);
    expect(RIDER_IMPACT_GRID_TS).toMatch(/green[\s\S]*?no active rider-impacting issue/);
    expect(RIDER_IMPACT_GRID_TS).toMatch(/yellow[\s\S]*?caution/);
    expect(RIDER_IMPACT_GRID_TS).toMatch(/red[\s\S]*?confirmed rider-impacting condition/);
  });

  it("11. no lane numbers (Lane 01, Lane 02, etc.) appear in the grid", () => {
    expect(RIDER_IMPACT_GRID_ASTRO).not.toMatch(/Lane \d+/);
    expect(RIDER_IMPACT_GRID_ASTRO).not.toMatch(/lane \d+/i);
  });

  it("12. rider-impact color derives from displayTier (normal->green, watch->yellow, alert->red, unknown->unknown)", () => {
    expect(RIDER_IMPACT_GRID_TS).toMatch(/case "normal":\s*return "green"/);
    expect(RIDER_IMPACT_GRID_TS).toMatch(/case "watch":\s*return "yellow"/);
    expect(RIDER_IMPACT_GRID_TS).toMatch(/case "alert":\s*return "red"/);
    expect(RIDER_IMPACT_GRID_TS).toMatch(/case "unknown":\s*return "unknown"/);
  });

  it("13. the grid utility does not consider sourceState or system health", () => {
    expect(RIDER_IMPACT_GRID_TS).not.toMatch(/sourceState/);
    expect(RIDER_IMPACT_GRID_TS).not.toMatch(/systemHealth/);
    expect(RIDER_IMPACT_GRID_TS).not.toMatch(/degraded/);
    expect(RIDER_IMPACT_GRID_TS).not.toMatch(/failed/);
  });

  it("14. RiderImpactGrid is imported and wired into index.astro", () => {
    expect(INDEX_ASTRO).toMatch(/import.*RiderImpactGrid/);
    expect(INDEX_ASTRO).toMatch(/RiderImpactGrid/);
  });

  it("15. the grid replaces CurrentRouteState in the item-route-status div", () => {
    expect(INDEX_ASTRO).toMatch(/<div class="item-route-status">\s*<RiderImpactGrid/);
  });
});
