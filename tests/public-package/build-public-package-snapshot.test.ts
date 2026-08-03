import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const REPO_ROOT = join(__dirname, "..", "..");
const BUILD_SCRIPT = join(REPO_ROOT, "scripts", "build-public-package-snapshot.mjs");

function runBuild(snapshotPath: string, outDir: string): { status: number; stdout: string; stderr: string } {
  try {
    const stdout = execFileSync("node", [BUILD_SCRIPT, snapshotPath, outDir], { encoding: "utf8" });
    return { status: 0, stdout, stderr: "" };
  } catch (err) {
    const e = err as { status: number; stdout: string; stderr: string };
    return { status: e.status, stdout: e.stdout?.toString() ?? "", stderr: e.stderr?.toString() ?? "" };
  }
}

function baseSnapshot(overrides: Record<string, unknown> = {}) {
  return {
    schema_version: "1.0.0",
    connector_id: "workflow08-status-publisher",
    generated_at: "2026-08-02T16:23:29.490Z",
    run_id: "TEST-RUN-001",
    overall: { display_severity: "normal", message: "All lanes normal." },
    lanes: {
      "01_ROUTE_CONDITIONS": {
        lane_label: "Route Conditions",
        available: true,
        display_severity: "normal",
        data_status: "ok",
        freshness: { overall_state: "fresh" },
        connector_health: { used_last_known_good: false },
        event_count: 0,
        events: [],
      },
    },
    severity_mapping_note: "test fixture",
    ...overrides,
  };
}

let dir: string;

afterEach(() => {
  if (dir) rmSync(dir, { recursive: true, force: true });
});

function writeSnapshotAndBuild(snapshot: unknown) {
  dir = mkdtempSync(join(tmpdir(), "build-pkg-test-"));
  const snapshotPath = join(dir, "snapshot.json");
  writeFileSync(snapshotPath, JSON.stringify(snapshot));
  const outDir = join(dir, "out");
  const result = runBuild(snapshotPath, outDir);
  return { result, outDir };
}

describe("build-public-package-snapshot.mjs", () => {
  it("fails when the snapshot file does not exist", () => {
    dir = mkdtempSync(join(tmpdir(), "build-pkg-test-"));
    const result = runBuild(join(dir, "missing.json"), join(dir, "out"));
    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/does not exist/);
  });

  it("uses the snapshot's real run_id as the shared release ID across all four files", () => {
    const { result, outDir } = writeSnapshotAndBuild(baseSnapshot());
    expect(result.status).toBe(0);
    const dashboardData = JSON.parse(readFileSync(join(outDir, "dashboard-data.json"), "utf8"));
    const systemHealth = JSON.parse(readFileSync(join(outDir, "system-health.json"), "utf8"));
    const releaseManifest = JSON.parse(readFileSync(join(outDir, "release-manifest.json"), "utf8"));
    const routeEvents = JSON.parse(readFileSync(join(outDir, "route-events.geojson"), "utf8"));
    expect(dashboardData.releaseId).toBe("TEST-RUN-001");
    expect(systemHealth.releaseId).toBe("TEST-RUN-001");
    expect(releaseManifest.releaseId).toBe("TEST-RUN-001");
    expect(routeEvents.releaseId).toBe("TEST-RUN-001");
  });

  it("maps an unrecognized display_severity to the unknown tier, never normal", () => {
    const snapshot = baseSnapshot({
      lanes: {
        "01_ROUTE_CONDITIONS": {
          lane_label: "Route Conditions",
          available: true,
          display_severity: "some-unrecognized-value",
          data_status: "ok",
          freshness: { overall_state: "fresh" },
          connector_health: { used_last_known_good: false },
          event_count: 0,
          events: [],
        },
      },
    });
    const { result, outDir } = writeSnapshotAndBuild(snapshot);
    expect(result.status).toBe(0);
    const dashboardData = JSON.parse(readFileSync(join(outDir, "dashboard-data.json"), "utf8"));
    const lane = dashboardData.laneSummaries.find((l: { laneId: string }) => l.laneId === "01_ROUTE_CONDITIONS");
    expect(lane.displayTier).toBe("unknown");
  });

  it("fills in a canonical label for a lane missing from the snapshot entirely", () => {
    const { result, outDir } = writeSnapshotAndBuild(baseSnapshot());
    expect(result.status).toBe(0);
    const dashboardData = JSON.parse(readFileSync(join(outDir, "dashboard-data.json"), "utf8"));
    expect(dashboardData.laneSummaries).toHaveLength(7);
    const missingLane = dashboardData.laneSummaries.find(
      (l: { laneId: string }) => l.laneId === "07_GOVERNMENT_SAFETY_ALERTS",
    );
    expect(missingLane.available).toBe(false);
    expect(missingLane.laneLabel).toBe("Government safety alerts");
    expect(missingLane.eventCount).toBe(0);
  });

  it("reports zero events with all sources healthy", () => {
    const { result, outDir } = writeSnapshotAndBuild(baseSnapshot());
    expect(result.status).toBe(0);
    const dashboardData = JSON.parse(readFileSync(join(outDir, "dashboard-data.json"), "utf8"));
    const systemHealth = JSON.parse(readFileSync(join(outDir, "system-health.json"), "utf8"));
    expect(dashboardData.activeEventCount).toBe(0);
    expect(systemHealth.failedLaneIds).toHaveLength(0);
  });

  it("reports zero events alongside a failed source and marks assemblyState degraded", () => {
    const snapshot = baseSnapshot({
      lanes: {
        "01_ROUTE_CONDITIONS": {
          lane_label: "Route Conditions",
          available: false,
          display_severity: "unknown",
          data_status: "failed_fetch",
          freshness: { overall_state: "unknown" },
          connector_health: { used_last_known_good: false },
          event_count: 0,
          events: [],
        },
      },
    });
    const { result, outDir } = writeSnapshotAndBuild(snapshot);
    expect(result.status).toBe(0);
    const dashboardData = JSON.parse(readFileSync(join(outDir, "dashboard-data.json"), "utf8"));
    const systemHealth = JSON.parse(readFileSync(join(outDir, "system-health.json"), "utf8"));
    expect(dashboardData.activeEventCount).toBe(0);
    expect(systemHealth.failedLaneIds).toContain("01_ROUTE_CONDITIONS");
    expect(systemHealth.assemblyState).toBe("degraded");
    const lane = systemHealth.lanes.find((l: { laneId: string }) => l.laneId === "01_ROUTE_CONDITIONS");
    expect(lane.publicText).toBe("Source could not be checked");
  });

  it("marks a degraded source with using_last_known_good faithfully, not healthier or worse than reported", () => {
    const snapshot = baseSnapshot({
      lanes: {
        "01_ROUTE_CONDITIONS": {
          lane_label: "Route Conditions",
          available: true,
          display_severity: "watch",
          data_status: "using_last_known_good",
          freshness: { overall_state: "stale" },
          connector_health: { used_last_known_good: true },
          event_count: 0,
          events: [],
        },
      },
    });
    const { result, outDir } = writeSnapshotAndBuild(snapshot);
    expect(result.status).toBe(0);
    const systemHealth = JSON.parse(readFileSync(join(outDir, "system-health.json"), "utf8"));
    const lane = systemHealth.lanes.find((l: { laneId: string }) => l.laneId === "01_ROUTE_CONDITIONS");
    expect(lane.sourceState).toBe("using_last_known_good");
    expect(lane.usingLastKnownGood).toBe(true);
    expect(lane.freshnessState).toBe("stale");
  });

  it("logs a mapping gap for a geometry-free event, and excludes it from public output for lacking route evidence (noise-reduction policy)", () => {
    const snapshot = baseSnapshot({
      lanes: {
        "01_ROUTE_CONDITIONS": {
          lane_label: "Route Conditions",
          available: true,
          display_severity: "watch",
          data_status: "degraded",
          freshness: { overall_state: "stale" },
          connector_health: { used_last_known_good: false },
          event_count: 1,
          events: [
            {
              event_id: "evt-no-geometry",
              title: "Test event without geometry",
              summary: "test",
            },
          ],
        },
      },
    });
    const { result, outDir } = writeSnapshotAndBuild(snapshot);
    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(/mapping gap/);
    const routeEvents = JSON.parse(readFileSync(join(outDir, "route-events.geojson"), "utf8"));
    expect(routeEvents.features.find((f: { id: string }) => f.id === "evt-no-geometry")).toBeUndefined();
  });

  it("keeps a geometry-null event in public output when it carries real route relevance and route impact", () => {
    const snapshot = baseSnapshot({
      lanes: {
        "01_ROUTE_CONDITIONS": {
          lane_label: "Route Conditions",
          available: true,
          display_severity: "watch",
          data_status: "degraded",
          freshness: { overall_state: "stale" },
          connector_health: { used_last_known_good: false },
          event_count: 1,
          events: [
            {
              event_id: "evt-none-geometry",
              title: "Test event with type none",
              geometry: { type: "none", coordinates: null, bbox: null, spatial_reference: null },
              status: "active",
              route_impact_state: "confirmed_route_impact",
              route_relevance: { classification: "confirmed_route_impact", method: "named_trail_segment_matching" },
              last_verified_at: "2026-08-02T16:00:00.000Z",
            },
          ],
        },
      },
    });
    const { result, outDir } = writeSnapshotAndBuild(snapshot);
    expect(result.status).toBe(0);
    const routeEvents = JSON.parse(readFileSync(join(outDir, "route-events.geojson"), "utf8"));
    expect(routeEvents.features).toHaveLength(1);
    expect(routeEvents.features[0].geometry).toBeNull();
    expect(routeEvents.features[0].properties.presentationEligible).toBe(true);
  });
});
