// Proves the Round 2 rider-first rebuild's title/layout changes. This
// project has no Astro component-render test harness (no @astrojs/test or
// container API usage anywhere), and CI runs `npm test` before
// `astro build`, so these tests read the authoritative source files
// directly rather than a built dist/ output — matching this project's
// existing pattern of validating source/behavior with plain text/subprocess
// checks rather than a heavyweight new test framework.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const REPO_ROOT = join(__dirname, "..", "..");
const INDEX_ASTRO = readFileSync(join(REPO_ROOT, "src", "pages", "index.astro"), "utf8");
const HEADING_ASTRO = readFileSync(
  join(REPO_ROOT, "src", "components", "route-status", "DashboardHeading.astro"),
  "utf8",
);
const CURRENT_ROUTE_STATE_ASTRO = readFileSync(
  join(REPO_ROOT, "src", "components", "route-status", "CurrentRouteState.astro"),
  "utf8",
);
const RIDER_STATE_TS = readFileSync(join(REPO_ROOT, "src", "lib", "route-status", "rider-state.ts"), "utf8");
const FOOTER_ASTRO = readFileSync(join(REPO_ROOT, "src", "components", "site", "SiteFooter.astro"), "utf8");
const CSS = readFileSync(join(REPO_ROOT, "src", "styles", "route-status.css"), "utf8");

describe("title and layout (Round 2 rider-first rebuild)", () => {
  it("1. the page title is exactly UW-Issaquah BG/SRT/ELST Status", () => {
    expect(HEADING_ASTRO).toMatch(/<h1>UW-Issaquah BG\/SRT\/ELST Status<\/h1>/);
    expect(INDEX_ASTRO).toMatch(/<title>UW-Issaquah BG\/SRT\/ELST Status \| BikeTourFrance\.net<\/title>/);
  });

  it("2. the Route Status Summary (CurrentRouteState.astro) is wired into index.astro", () => {
    expect(INDEX_ASTRO).toMatch(/CurrentRouteState/);
    expect(INDEX_ASTRO).toMatch(/item-route-status/);
    // Rider-facing vocabulary must actually be present, not just the tier words.
    expect(CURRENT_ROUTE_STATE_ASTRO).toMatch(/CLEAR/);
    expect(CURRENT_ROUTE_STATE_ASTRO).toMatch(/CAUTION/);
    expect(CURRENT_ROUTE_STATE_ASTRO).toMatch(/MAJOR ISSUE/);
    expect(CURRENT_ROUTE_STATE_ASTRO).toMatch(/PARTIAL CLOSURE/);
    expect(CURRENT_ROUTE_STATE_ASTRO).toMatch(/CLOSED/);
    expect(CURRENT_ROUTE_STATE_ASTRO).toMatch(/DATA STALE/);
    // Unknown/failed/stale data must never present as CLEAR.
    expect(RIDER_STATE_TS).toMatch(/isDataUnavailable \|\| isAssemblyFailed \|\| summary\.displayTier === "unknown"/);
  });

  it("3. rider content (status summary, map, issues) renders before the collapsed Monitor Health section", () => {
    const statusIdx = INDEX_ASTRO.indexOf("item-route-status");
    const mapIdx = INDEX_ASTRO.indexOf("item-route-map");
    const alertsIdx = INDEX_ASTRO.indexOf("item-route-alerts");
    const closuresIdx = INDEX_ASTRO.indexOf("item-closures");
    const weatherIdx = INDEX_ASTRO.indexOf("item-weather-air");
    const monitorIdx = INDEX_ASTRO.indexOf("item-monitor-health");
    for (const idx of [statusIdx, mapIdx, alertsIdx, closuresIdx, weatherIdx]) {
      expect(idx).toBeGreaterThan(-1);
    }
    expect(monitorIdx).toBeGreaterThan(-1);
    expect(statusIdx).toBeLessThan(mapIdx);
    expect(mapIdx).toBeLessThan(alertsIdx);
    expect(alertsIdx).toBeLessThan(closuresIdx);
    expect(closuresIdx).toBeLessThan(weatherIdx);
    expect(weatherIdx).toBeLessThan(monitorIdx);
  });

  it("4. mobile layout stacks every panel in a single column with a clean, gap-free order", () => {
    expect(CSS).toMatch(/\.dashboard-layout\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)/);
    const orderMatches = [...CSS.matchAll(/\.item-([a-z-]+)\s*\{\s*order:\s*(\d+);?\s*\}/g)];
    const orders = new Map(orderMatches.map((m) => [m[1], Number(m[2])]));
    expect(orders.get("route-status")).toBe(1);
    expect(orders.get("route-map")).toBe(2);
    expect(orders.get("route-alerts")).toBe(3);
    expect(orders.get("closures")).toBe(4);
    expect(orders.get("weather-air")).toBe(5);
    expect(orders.get("route-impacts")).toBe(6);
    expect(orders.get("facilities")).toBe(7);
    expect(orders.get("monitor-health")).toBe(8);
    // No duplicate order values — every panel gets a distinct slot.
    const values = [...orders.values()];
    expect(new Set(values).size).toBe(values.length);
  });

  it("5. the Monitor Health section is a collapsed <details> merging monitoring sources and system health", () => {
    const monitorHealthDisclosure = readFileSync(
      join(REPO_ROOT, "src", "components", "route-status", "MonitorHealthDisclosure.astro"),
      "utf8",
    );
    expect(monitorHealthDisclosure).toMatch(/<details class="monitor-health-disclosure">/);
    expect(monitorHealthDisclosure).toMatch(/MonitoringSources/);
    expect(monitorHealthDisclosure).toMatch(/SystemHealthDisclosure/);
  });

  it("6. the unauthorized footer marketing line is gone and nothing replaced it", () => {
    expect(FOOTER_ASTRO).not.toMatch(/Safe routes\. Well-informed riders\. Better bike tours\./);
    expect(FOOTER_ASTRO).not.toMatch(/smart|AI-powered|real-time intelligence/i);
    expect(FOOTER_ASTRO).toMatch(/Visit BikeTourFrance\.net/);
  });

  it("7. the map uses the CyclOSM tile layer, not CARTO", () => {
    const routeMap = readFileSync(
      join(REPO_ROOT, "src", "components", "route-status", "RouteMap.svelte"),
      "utf8",
    );
    expect(routeMap).toMatch(
      /https:\/\/\{s\}\.tile-cyclosm\.openstreetmap\.fr\/cyclosm\/\{z\}\/\{x\}\/\{y\}\.png/,
    );
    expect(routeMap).not.toMatch(/basemaps\.cartocdn\.com/);
    expect(routeMap).toMatch(/CyclOSM/);
  });

  it("8. the route line is fixed red and event markers are semantic triangles", () => {
    const routeMap = readFileSync(
      join(REPO_ROOT, "src", "components", "route-status", "RouteMap.svelte"),
      "utf8",
    );
    expect(routeMap).toMatch(/const ROUTE_STYLE = \{ color: "#C72B20", weight: 6, opacity: 0\.98 \}/);
    expect(routeMap).toMatch(/map-marker-triangle/);
    expect(routeMap).toMatch(/markerPresentationForEvent/);
    expect(routeMap).not.toMatch(/laneColorFor/);
    expect(CSS).toMatch(/\.map-marker-triangle span\s*\{[^}]*border-bottom:\s*24px solid #D99100/s);
    expect(CSS).toMatch(/\.event-marker--major span,[\s\S]*border-bottom-color:\s*#C72B20/);
    expect(CSS).toMatch(/\.event-marker--caution span,[\s\S]*border-bottom-color:\s*#D99100/);
    expect(CSS).toMatch(/\.event-marker--clear span,[\s\S]*border-bottom-color:\s*#2D7A30/);
  });

  it("9. the BTF logo render size is increased by exactly 25 percent", () => {
    const header = readFileSync(join(REPO_ROOT, "src", "components", "site", "SiteHeader.astro"), "utf8");
    expect(header).toMatch(/width="200" height="50"/);
    expect(CSS).toMatch(/\.site-header__logo img\s*\{[^}]*height:\s*50px/s);
    expect(CSS).toMatch(/@media \(max-width: 480px\)[\s\S]*\.site-header__logo img\s*\{[^}]*height:\s*42\.5px/s);
  });
});
