import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const REPO_ROOT = join(__dirname, "..", "..");
const VALIDATE_SCRIPT = join(REPO_ROOT, "scripts", "validate-public-package.mjs");
const REAL_PACKAGE_DIR = join(REPO_ROOT, "public", "data");

function runValidate(dir: string): { status: number; stdout: string; stderr: string } {
  try {
    const stdout = execFileSync("node", [VALIDATE_SCRIPT, dir], { encoding: "utf8" });
    return { status: 0, stdout, stderr: "" };
  } catch (err) {
    const e = err as { status: number; stdout: string; stderr: string };
    return { status: e.status, stdout: e.stdout?.toString() ?? "", stderr: e.stderr?.toString() ?? "" };
  }
}

const RELEASE_ID = "TEST-RELEASE-001";
const ASSEMBLED_AT = "2026-08-02T16:23:29.490Z";

function baseDashboardData(overrides: Record<string, unknown> = {}) {
  return {
    schemaVersion: "1.0.0",
    releaseId: RELEASE_ID,
    assembledAt: ASSEMBLED_AT,
    routeId: "UnivWA-Issaquah",
    routeName: "University of Washington to Issaquah",
    displayTier: "normal",
    activeEventCount: 1,
    laneSummaries: [],
    eventRefs: ["evt-1"],
    ...overrides,
  };
}

function baseRouteEvents(overrides: Record<string, unknown> = {}) {
  return {
    type: "FeatureCollection",
    releaseId: RELEASE_ID,
    generatedAt: ASSEMBLED_AT,
    features: [
      {
        type: "Feature",
        id: "evt-1",
        properties: {},
        geometry: { type: "Point", coordinates: [-122.2, 47.6] },
      },
    ],
    ...overrides,
  };
}

function baseSystemHealth(overrides: Record<string, unknown> = {}) {
  return {
    schemaVersion: "1.0.0",
    releaseId: RELEASE_ID,
    assembledAt: ASSEMBLED_AT,
    lanes: [],
    assemblyState: "ok",
    publicationState: "ok",
    ...overrides,
  };
}

function baseReleaseManifest(overrides: Record<string, unknown> = {}) {
  return {
    releaseId: RELEASE_ID,
    assembledAt: ASSEMBLED_AT,
    schemaVersion: "1.0.0",
    sourceGitCommit: null,
    ...overrides,
  };
}

function writePackage(
  dir: string,
  files: {
    dashboardData?: unknown;
    routeEvents?: unknown;
    systemHealth?: unknown;
    releaseManifest?: unknown;
    skip?: string[];
  },
) {
  const skip = new Set(files.skip ?? []);
  if (!skip.has("dashboard-data.json")) {
    writeFileSync(
      join(dir, "dashboard-data.json"),
      JSON.stringify(files.dashboardData ?? baseDashboardData()),
    );
  }
  if (!skip.has("route-events.geojson")) {
    writeFileSync(
      join(dir, "route-events.geojson"),
      JSON.stringify(files.routeEvents ?? baseRouteEvents()),
    );
  }
  if (!skip.has("system-health.json")) {
    writeFileSync(
      join(dir, "system-health.json"),
      JSON.stringify(files.systemHealth ?? baseSystemHealth()),
    );
  }
  if (!skip.has("release-manifest.json")) {
    writeFileSync(
      join(dir, "release-manifest.json"),
      JSON.stringify(files.releaseManifest ?? baseReleaseManifest()),
    );
  }
}

let dir: string;

afterEach(() => {
  if (dir) rmSync(dir, { recursive: true, force: true });
});

describe("validate-public-package.mjs", () => {
  it("passes when all four files are individually and cross-consistently valid", () => {
    dir = mkdtempSync(join(tmpdir(), "pkg-test-"));
    writePackage(dir, {});
    const result = runValidate(dir);
    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(/^PASS:/);
  });

  it("passes for the real generated public package", () => {
    const result = runValidate(REAL_PACKAGE_DIR);
    expect(result.status).toBe(0);
  });

  it("fails when a required file is missing", () => {
    dir = mkdtempSync(join(tmpdir(), "pkg-test-"));
    writePackage(dir, { skip: ["release-manifest.json"] });
    const result = runValidate(dir);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/Missing required file/);
  });

  it("fails with a wrong schema (missing required field)", () => {
    dir = mkdtempSync(join(tmpdir(), "pkg-test-"));
    const bad = baseDashboardData();
    delete (bad as Record<string, unknown>).routeId;
    writePackage(dir, { dashboardData: bad });
    const result = runValidate(dir);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/missing required field "routeId"/);
  });

  it("fails on mismatched release IDs across files", () => {
    dir = mkdtempSync(join(tmpdir(), "pkg-test-"));
    writePackage(dir, { systemHealth: baseSystemHealth({ releaseId: "DIFFERENT-RELEASE" }) });
    const result = runValidate(dir);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/Release IDs do not match/);
  });

  it("fails when dashboard-data.json references an event missing from route-events.geojson", () => {
    dir = mkdtempSync(join(tmpdir(), "pkg-test-"));
    writePackage(dir, { dashboardData: baseDashboardData({ eventRefs: ["evt-does-not-exist"] }) });
    const result = runValidate(dir);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/references event "evt-does-not-exist" that is missing/);
  });

  it("fails on a bad geometry type", () => {
    dir = mkdtempSync(join(tmpdir(), "pkg-test-"));
    writePackage(dir, {
      routeEvents: baseRouteEvents({
        features: [
          {
            type: "Feature",
            id: "evt-1",
            properties: {},
            geometry: { type: "Circle", coordinates: [] },
          },
        ],
      }),
    });
    const result = runValidate(dir);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/invalid geometry type/);
  });

  it("passes when a lane is missing from system-health.json (unknown-lane handling is the loader's job, not this validator's)", () => {
    dir = mkdtempSync(join(tmpdir(), "pkg-test-"));
    writePackage(dir, { systemHealth: baseSystemHealth({ lanes: [] }) });
    const result = runValidate(dir);
    expect(result.status).toBe(0);
  });

  it("accepts a lane reporting a failed source state (validator does not reject on tier/state values)", () => {
    dir = mkdtempSync(join(tmpdir(), "pkg-test-"));
    writePackage(dir, {
      systemHealth: baseSystemHealth({
        lanes: [
          {
            laneId: "01_ROUTE_CONDITIONS",
            laneLabel: "Route Conditions",
            available: false,
            sourceState: "failed_fetch",
            publicText: "Source unavailable",
            freshnessState: "stale",
            usingLastKnownGood: false,
            eventCount: 0,
          },
        ],
      }),
    });
    const result = runValidate(dir);
    expect(result.status).toBe(0);
  });

  it("accepts a lane reporting a degraded source state", () => {
    dir = mkdtempSync(join(tmpdir(), "pkg-test-"));
    writePackage(dir, {
      systemHealth: baseSystemHealth({
        lanes: [
          {
            laneId: "02_WEATHER",
            laneLabel: "Weather",
            available: true,
            sourceState: "degraded",
            publicText: "Partial data",
            freshnessState: "stale",
            usingLastKnownGood: false,
            eventCount: 0,
          },
        ],
      }),
    });
    const result = runValidate(dir);
    expect(result.status).toBe(0);
  });

  it("accepts a lane using last-known-good data", () => {
    dir = mkdtempSync(join(tmpdir(), "pkg-test-"));
    writePackage(dir, {
      systemHealth: baseSystemHealth({
        lanes: [
          {
            laneId: "04_WILDFIRE",
            laneLabel: "Wildfire",
            available: true,
            sourceState: "using_last_known_good",
            publicText: "Showing last known data",
            freshnessState: "stale",
            usingLastKnownGood: true,
            eventCount: 0,
          },
        ],
      }),
    });
    const result = runValidate(dir);
    expect(result.status).toBe(0);
  });

  it("fails when route-events.geojson is not a valid FeatureCollection", () => {
    dir = mkdtempSync(join(tmpdir(), "pkg-test-"));
    writePackage(dir, { routeEvents: { type: "NotAFeatureCollection", features: "oops" } });
    const result = runValidate(dir);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/not a valid GeoJSON FeatureCollection/);
  });

  it("fails when route-events.geojson lacks its own release/generated marker", () => {
    dir = mkdtempSync(join(tmpdir(), "pkg-test-"));
    const events = baseRouteEvents();
    delete (events as Record<string, unknown>).releaseId;
    writePackage(dir, { routeEvents: events });
    const result = runValidate(dir);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/missing its own release\/generated marker/);
  });
});
