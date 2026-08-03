// Proves the title/layout changes (task spec items 1-4). This project has
// no Astro component-render test harness (no @astrojs/test or container
// API usage anywhere), and CI runs `npm test` before `astro build`, so
// these tests read the authoritative source files directly rather than a
// built dist/ output — matching this project's existing pattern of
// validating source/behavior with plain text/subprocess checks rather
// than a heavyweight new test framework.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const REPO_ROOT = join(__dirname, "..", "..");
const INDEX_ASTRO = readFileSync(join(REPO_ROOT, "src", "pages", "index.astro"), "utf8");
const HEADING_ASTRO = readFileSync(
  join(REPO_ROOT, "src", "components", "route-status", "DashboardHeading.astro"),
  "utf8",
);
const CSS = readFileSync(join(REPO_ROOT, "src", "styles", "route-status.css"), "utf8");

describe("title and layout (tests 1-4)", () => {
  it("1. the page title is exactly UW-Issaquah BG/SRT/ELST Status", () => {
    expect(HEADING_ASTRO).toMatch(/<h1>UW-Issaquah BG\/SRT\/ELST Status<\/h1>/);
    expect(INDEX_ASTRO).toMatch(/<title>UW-Issaquah BG\/SRT\/ELST Status \| BikeTourFrance\.net<\/title>/);
  });

  it("2. Current Route State is not rendered", () => {
    expect(INDEX_ASTRO).not.toMatch(/CurrentRouteState/);
    expect(INDEX_ASTRO).not.toMatch(/item-route-state/);
  });

  it("3. Monitoring Sources and Route Map share the intended desktop row", () => {
    // Desktop grid-template-areas: rail-top and main-top are the same row.
    expect(CSS).toMatch(/"rail-top main-top"/);
    expect(CSS).toMatch(/\.item-monitoring-sources\s*\{\s*grid-area:\s*rail-top/);
    expect(CSS).toMatch(/\.item-route-map\s*\{\s*grid-area:\s*main-top/);
    // The removed box's old grid cell must not be silently reused by a
    // duplicate/empty rail-top assignment.
    expect(CSS).not.toMatch(/item-route-state/);
  });

  it("4. mobile layout stacks every panel in a single column with a clean order", () => {
    expect(CSS).toMatch(/\.dashboard-layout\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)/);
    const mobileOrderMatches = [...CSS.matchAll(/\.item-([a-z-]+)\s*\{\s*order:\s*(\d+);?\s*\}/g)];
    const orders = new Map(mobileOrderMatches.map((m) => [m[1], Number(m[2])]));
    expect(orders.get("route-state")).toBeUndefined();
    expect(orders.get("freshness")).toBe(1);
    expect(orders.get("route-map")).toBe(2);
    expect(orders.get("route-alerts")).toBe(3);
    expect(orders.get("monitoring-sources")).toBe(4);
    expect(orders.get("route-impacts")).toBe(5);
    expect(orders.get("system-health")).toBe(6);
    // No duplicate order values on mobile — every panel gets a distinct slot.
    const values = [...orders.values()];
    expect(new Set(values).size).toBe(values.length);
  });
});
