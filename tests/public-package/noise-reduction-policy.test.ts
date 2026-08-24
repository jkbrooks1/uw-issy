// Proves the noise-reduction policy (2026-08-03): flood threshold, health
// exclusion, government CAP-style severity, freshness/long-running
// closures, and duplicate merging, all enforced in
// scripts/build-public-package-snapshot.mjs — the layer that owns the
// final cross-lane public event set. Follows the same fixture/subprocess
// pattern as build-public-package-snapshot.test.ts. Numbered comments
// match the task spec's TEST REQUIREMENTS numbering.

import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const REPO_ROOT = join(__dirname, "..", "..");
const BUILD_SCRIPT = join(REPO_ROOT, "scripts", "build-public-package-snapshot.mjs");
const VALIDATE_SCRIPT = join(REPO_ROOT, "scripts", "validate-public-package.mjs");

const GENERATED_AT = "2026-08-02T16:23:29.490Z"; // fixed "build now" for every fixture below

function runBuild(snapshotPath: string, outDir: string, auditDir?: string) {
  try {
    const args = auditDir ? [BUILD_SCRIPT, snapshotPath, outDir, auditDir] : [BUILD_SCRIPT, snapshotPath, outDir];
    const stdout = execFileSync("node", args, { encoding: "utf8" });
    return { status: 0, stdout, stderr: "" };
  } catch (err) {
    const e = err as { status: number; stdout: string; stderr: string };
    return { status: e.status, stdout: e.stdout?.toString() ?? "", stderr: e.stderr?.toString() ?? "" };
  }
}

function runValidate(dir: string) {
  try {
    const stdout = execFileSync("node", [VALIDATE_SCRIPT, dir], { encoding: "utf8" });
    return { status: 0, stdout, stderr: "" };
  } catch (err) {
    const e = err as { status: number; stdout: string; stderr: string };
    return { status: e.status, stdout: e.stdout?.toString() ?? "", stderr: e.stderr?.toString() ?? "" };
  }
}

type RawEvent = Record<string, unknown>;

function emptyLane(overrides: Record<string, unknown> = {}) {
  return {
    lane_label: "Test lane",
    available: true,
    display_severity: "normal",
    data_status: "ok",
    freshness: { overall_state: "fresh" },
    connector_health: { used_last_known_good: false },
    event_count: 0,
    events: [],
    ...overrides,
  };
}

function snapshotWithLanes(lanes: Record<string, unknown>, runId = "TEST-RUN") {
  return {
    schema_version: "1.0.0",
    connector_id: "workflow08-status-publisher",
    generated_at: GENERATED_AT,
    run_id: runId,
    overall: { display_severity: "normal", message: "test" },
    lanes,
    severity_mapping_note: "test fixture",
  };
}

let dir: string;
afterEach(() => {
  if (dir) rmSync(dir, { recursive: true, force: true });
});

function build(lanes: Record<string, unknown>, runId?: string) {
  dir = mkdtempSync(join(tmpdir(), "noise-policy-test-"));
  const snapshotPath = join(dir, "snapshot.json");
  writeFileSync(snapshotPath, JSON.stringify(snapshotWithLanes(lanes, runId)));
  const outDir = join(dir, "out");
  const auditDir = join(dir, "audit");
  const result = runBuild(snapshotPath, outDir, auditDir);
  return { result, outDir, auditDir };
}

function readFeatures(outDir: string) {
  return JSON.parse(readFileSync(join(outDir, "route-events.geojson"), "utf8")).features as Array<{
    id: string;
    geometry: GeoJSON.Geometry | null;
    properties: Record<string, unknown>;
  }>;
}

function reasonFor(outDir: string, auditDir: string, eventId: string): string {
  const audit = JSON.parse(
    readFileSync(join(auditDir, `exclusions-${JSON.parse(readFileSync(join(outDir, "release-manifest.json"), "utf8")).releaseId}.json`), "utf8"),
  );
  const record = audit.records.find((r: { eventId: string }) => r.eventId === eventId);
  return record?.presentationReason;
}

// ---------------------------------------------------------------------------
// Flood fixtures (tests 5-12)
// ---------------------------------------------------------------------------

function floodEvent(overrides: RawEvent = {}): RawEvent {
  return {
    event_id: "05_FLOOD_CONDITIONS:TEST:evt1",
    event_type: "gauge_observation",
    status: "monitoring",
    severity: "advisory",
    route_impact: "elevated_water",
    title: "Test flood gauge",
    summary: "test",
    observed_at: "2026-08-02T10:00:00.000Z",
    official_category: "major",
    trail_or_street_name: "Test Trail",
    location: {
      name: "Test Trail at Test Creek",
      latitude: 47.6,
      longitude: -122.1,
      route_section_ids: ["10_issaquah_approach_terminus"],
    },
    route_relevance: { method: "point_to_route_distance", distance_km: 0.2 },
    provenance: { source_url: "https://example.gov/gauge" },
    ...overrides,
  };
}

function floodLane(events: RawEvent[]) {
  return { "05_FLOOD_CONDITIONS": emptyLane({ event_count: events.length, events }) };
}

describe("flood policy (tests 5-12)", () => {
  it("5. hides official_category no_flooding", () => {
    const { result, outDir } = build(floodLane([floodEvent({ official_category: "no_flooding" })]));
    expect(result.status).toBe(0);
    expect(readFeatures(outDir)).toHaveLength(0);
  });

  it("6. hides official_category minor", () => {
    const { result, outDir } = build(floodLane([floodEvent({ official_category: "minor" })]));
    expect(result.status).toBe(0);
    expect(readFeatures(outDir)).toHaveLength(0);
  });

  it("7. hides official_category moderate", () => {
    const { result, outDir } = build(floodLane([floodEvent({ official_category: "moderate" })]));
    expect(result.status).toBe(0);
    expect(readFeatures(outDir)).toHaveLength(0);
  });

  it("8. hides official_category unknown / raw USGS identifier", () => {
    const { result, outDir, auditDir } = build(
      floodLane([floodEvent({ official_category: "USGS:12121600:00060:00000" })]),
    );
    expect(result.status).toBe(0);
    expect(readFeatures(outDir)).toHaveLength(0);
    expect(reasonFor(outDir, auditDir, "05_FLOOD_CONDITIONS:TEST:evt1")).toBe("flood_no_active_category");
  });

  it("9. hides major flood that is off-route", () => {
    const { result, outDir, auditDir } = build(
      floodLane([floodEvent({ official_category: "major", route_relevance: { method: "ugc_same_area_match" } })]),
    );
    expect(result.status).toBe(0);
    expect(readFeatures(outDir)).toHaveLength(0);
    expect(reasonFor(outDir, auditDir, "05_FLOOD_CONDITIONS:TEST:evt1")).toBe("off_route");
  });

  it("10. hides major on-route flood with no route-use effect", () => {
    const event = floodEvent({ official_category: "major" });
    delete event.route_impact;
    const { result, outDir, auditDir } = build(floodLane([event]));
    expect(result.status).toBe(0);
    expect(readFeatures(outDir)).toHaveLength(0);
    expect(reasonFor(outDir, auditDir, "05_FLOOD_CONDITIONS:TEST:evt1")).toBe("no_route_impact");
  });

  it("11. shows major on-route flood with a direct route-use effect", () => {
    const { result, outDir } = build(
      floodLane([floodEvent({ official_category: "major", route_impact: "trail_flooded" })]),
    );
    expect(result.status).toBe(0);
    const features = readFeatures(outDir);
    expect(features).toHaveLength(1);
    expect(features[0]!.properties.presentationEligible).toBe(true);
  });

  it("12. hides raw gauge text with n/a values (real NWPS shape)", () => {
    const { result, outDir } = build(
      floodLane([
        floodEvent({
          event_id: "05_FLOOD_CONDITIONS:NWPS-01:test",
          title: "NOAA NWPS observed status and forecast",
          summary: "Observed stage=n/a | flow=n/a | category=no_flooding | forecast=n/a",
          official_category: "no_flooding",
        }),
      ]),
    );
    expect(result.status).toBe(0);
    expect(readFeatures(outDir)).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Health-alert fixtures (tests 13-16)
// ---------------------------------------------------------------------------

function healthEvent(overrides: RawEvent = {}): RawEvent {
  return {
    event_id: "07_GOVERNMENT_SAFETY_ALERTS:TEST:health1",
    event_type: "public_health_advisory",
    status: "active",
    severity: "advisory",
    title: "Test health advisory",
    summary: "Health Advisory: test exposure notice",
    observed_at: "2026-08-02T10:00:00.000Z",
    location: { name: "Washington", route_section_ids: [] },
    route_relevance: { classification: "confirmed_route_relevant", method: "text_landmark_match" },
    provenance: { source_url: "https://doh.wa.gov/test" },
    ...overrides,
  };
}

function govLane(events: RawEvent[]) {
  return { "07_GOVERNMENT_SAFETY_ALERTS": emptyLane({ event_count: events.length, events }) };
}

describe("health-alert exclusion (tests 13-16)", () => {
  it("13. hides a local measles warning", () => {
    const { result, outDir } = build(
      govLane([healthEvent({ summary: "Health Advisory: Potential Exposure to Measles from Visitor" })]),
    );
    expect(result.status).toBe(0);
    expect(readFeatures(outDir)).toHaveLength(0);
  });

  it("14. hides a statewide health notice", () => {
    const { result, outDir, auditDir } = build(govLane([healthEvent()]));
    expect(result.status).toBe(0);
    expect(readFeatures(outDir)).toHaveLength(0);
    expect(reasonFor(outDir, auditDir, "07_GOVERNMENT_SAFETY_ALERTS:TEST:health1")).toBe("health_alert_excluded");
  });

  it("15. hides an overseas Ebola notice", () => {
    const { result, outDir } = build(
      govLane([healthEvent({ summary: "Health Alert: Ebola Outbreak in DRC and Uganda" })]),
    );
    expect(result.status).toBe(0);
    expect(readFeatures(outDir)).toHaveLength(0);
  });

  it("16. shows a health-originated event only as the closure event, when it directly states a route closure", () => {
    const { result, outDir } = build(
      govLane([
        healthEvent({
          summary: "Public health emergency: evacuation order covering the route corridor",
          route_relevance: { classification: "confirmed_route_impact", method: "named_trail_segment_matching" },
          route_impact_state: "confirmed_route_impact",
          trail_or_street_name: "Test Trail",
          location: { name: "Test Trail", route_section_ids: ["09_east_lake_sammamish_trail_sammamish"] },
        }),
      ]),
    );
    expect(result.status).toBe(0);
    const features = readFeatures(outDir);
    expect(features).toHaveLength(1);
    expect(features[0]!.properties.presentationEligible).toBe(true);
    expect(features[0]!.properties.presentationReason).toBe("eligible");
  });
});

// ---------------------------------------------------------------------------
// Government CAP-severity fixtures (tests 17-25)
// ---------------------------------------------------------------------------

function govAlertEvent(overrides: RawEvent = {}): RawEvent {
  return {
    event_id: "07_GOVERNMENT_SAFETY_ALERTS:TEST:alert1",
    event_type: "weather_alert",
    status: "active",
    severity: "Severe",
    title: "Test government alert",
    summary: "test",
    trail_or_street_name: "Test Trail",
    location: { name: "Test Trail", route_section_ids: ["09_east_lake_sammamish_trail_sammamish"] },
    observed_at: "2026-08-02T10:00:00.000Z",
    route_relevance: { method: "named_trail_segment_matching" },
    route_impact_state: "confirmed_route_impact",
    provenance: { source_url: "https://example.gov" },
    ...overrides,
  };
}

describe("government alert severity (tests 17-25)", () => {
  it("17. shows a Severe, on-route, route-impacting alert", () => {
    const { result, outDir } = build(govLane([govAlertEvent({ severity: "Severe" })]));
    expect(result.status).toBe(0);
    expect(readFeatures(outDir)).toHaveLength(1);
  });

  it("18. shows an Extreme, on-route, route-impacting alert", () => {
    const { result, outDir } = build(govLane([govAlertEvent({ severity: "Extreme" })]));
    expect(result.status).toBe(0);
    expect(readFeatures(outDir)).toHaveLength(1);
  });

  it("19. hides a Moderate alert", () => {
    const { result, outDir, auditDir } = build(govLane([govAlertEvent({ severity: "Moderate" })]));
    expect(result.status).toBe(0);
    expect(readFeatures(outDir)).toHaveLength(0);
    expect(reasonFor(outDir, auditDir, "07_GOVERNMENT_SAFETY_ALERTS:TEST:alert1")).toBe("low_severity_government_alert");
  });

  it("20. hides a Minor alert", () => {
    const { result, outDir } = build(govLane([govAlertEvent({ severity: "Minor" })]));
    expect(result.status).toBe(0);
    expect(readFeatures(outDir)).toHaveLength(0);
  });

  it("21a. hides an Unknown-severity alert with no explicit closure text", () => {
    const { result, outDir } = build(govLane([govAlertEvent({ severity: "Unknown", summary: "General notice" })]));
    expect(result.status).toBe(0);
    expect(readFeatures(outDir)).toHaveLength(0);
  });

  it("21b. shows an Unknown-severity alert that has explicit closure/access-block text", () => {
    const { result, outDir } = build(
      govLane([govAlertEvent({ severity: "Unknown", summary: "Notice: trail closed until further notice" })]),
    );
    expect(result.status).toBe(0);
    expect(readFeatures(outDir)).toHaveLength(1);
  });

  it("22. hides a statewide alert with no route tie", () => {
    const { result, outDir, auditDir } = build(
      govLane([
        govAlertEvent({
          route_relevance: { method: "ugc_same_area_match" },
          location: { name: "Washington", route_section_ids: [] },
        }),
      ]),
    );
    expect(result.status).toBe(0);
    expect(readFeatures(outDir)).toHaveLength(0);
    expect(reasonFor(outDir, auditDir, "07_GOVERNMENT_SAFETY_ALERTS:TEST:alert1")).toBe("off_route");
  });

  it("23. hides a federal alert outside the route area regardless of source level", () => {
    const { result, outDir } = build(
      govLane([
        govAlertEvent({ source_level: "federal", route_relevance: { method: "text_landmark_match" } } as RawEvent),
      ]),
    );
    expect(result.status).toBe(0);
    expect(readFeatures(outDir)).toHaveLength(0);
  });

  it("24. hides a local alert outside the route area — no ranking by source level", () => {
    const { result, outDir } = build(
      govLane([
        govAlertEvent({ source_level: "local", route_relevance: { method: "ugc_same_area_match" } } as RawEvent),
      ]),
    );
    expect(result.status).toBe(0);
    expect(readFeatures(outDir)).toHaveLength(0);
  });

  it("25. shows a local route closure even though the source is not federal or state", () => {
    const { result, outDir } = build({
      "01_ROUTE_CONDITIONS": emptyLane({
        event_count: 1,
        events: [
          {
            event_id: "01_ROUTE_CONDITIONS:TEST:local-closure",
            event_type: "trail_closure",
            status: "active",
            source_level: "local_parks_department",
            title: "Local trail closure",
            summary: "test",
            effective_start: "2026-06-01T00:00:00Z",
            effective_end: "2026-12-31T23:59:59Z",
            last_verified_at: "2026-08-01T16:00:00.000Z",
            route_impact_state: "confirmed_route_impact",
            route_relevance: { classification: "confirmed_route_impact", method: "named_trail_segment_matching" },
            location: { name: "Test Trail", route_section_ids: ["09_east_lake_sammamish_trail_sammamish"] },
            provenance: { source_url: "https://example.local.gov" },
          },
        ],
      }),
    });
    expect(result.status).toBe(0);
    expect(readFeatures(outDir)).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// Freshness (tests 26-33)
// ---------------------------------------------------------------------------

describe("freshness policy (tests 26-33)", () => {
  it("26. shows a short-lived alert refreshed less than 48h ago", () => {
    const { result, outDir } = build(
      govLane([govAlertEvent({ last_verified_at: "2026-08-01T10:00:00.000Z" })]), // ~30h before generated_at
    );
    expect(result.status).toBe(0);
    expect(readFeatures(outDir)).toHaveLength(1);
  });

  it("27. hides a short-lived alert not refreshed for more than 48h", () => {
    const { result, outDir, auditDir } = build(
      govLane([govAlertEvent({ last_verified_at: "2026-07-30T10:00:00.000Z" })]), // ~78h before generated_at
    );
    expect(result.status).toBe(0);
    expect(readFeatures(outDir)).toHaveLength(0);
    expect(reasonFor(outDir, auditDir, "07_GOVERNMENT_SAFETY_ALERTS:TEST:alert1")).toBe("stale_short_lived_alert");
  });

  it("28. build time does not reset source freshness — a recent discovery time does not rescue a stale source refresh", () => {
    const { result, outDir } = build(
      govLane([
        govAlertEvent({
          discovered_at: "2026-08-02T16:00:00.000Z", // minutes before generated_at
          observed_at: "2026-07-25T00:00:00.000Z", // >48h before generated_at — this is the real refresh signal
          last_verified_at: undefined,
        }),
      ]),
    );
    expect(result.status).toBe(0);
    expect(readFeatures(outDir)).toHaveLength(0);
  });

  it("29. keeps an active planned closure with a future end date shown", () => {
    const { result, outDir } = build({
      "01_ROUTE_CONDITIONS": emptyLane({
        event_count: 1,
        events: [
          {
            event_id: "01_ROUTE_CONDITIONS:TEST:closure-future",
            event_type: "trail_closure",
            status: "active",
            title: "Planned closure",
            effective_start: "2026-06-01T00:00:00Z",
            effective_end: "2026-12-31T23:59:59Z",
            last_verified_at: "2026-06-15T00:00:00.000Z", // old refresh, irrelevant — end date not passed
            route_impact_state: "confirmed_route_impact",
            route_relevance: { method: "named_trail_segment_matching" },
            location: { name: "Test Trail", route_section_ids: ["09_east_lake_sammamish_trail_sammamish"] },
            provenance: { source_url: "https://example.gov" },
          },
        ],
      }),
    });
    expect(result.status).toBe(0);
    expect(readFeatures(outDir)).toHaveLength(1);
  });

  it("30. removes a planned closure after its end date passes", () => {
    const { result, outDir, auditDir } = build({
      "01_ROUTE_CONDITIONS": emptyLane({
        event_count: 1,
        events: [
          {
            event_id: "01_ROUTE_CONDITIONS:TEST:closure-past",
            event_type: "trail_closure",
            status: "active",
            title: "Ended closure",
            effective_start: "2026-01-01T00:00:00Z",
            effective_end: "2026-07-01T00:00:00Z", // before generated_at
            last_verified_at: "2026-06-15T00:00:00.000Z",
            route_impact_state: "confirmed_route_impact",
            route_relevance: { method: "named_trail_segment_matching" },
            location: { name: "Test Trail", route_section_ids: ["09_east_lake_sammamish_trail_sammamish"] },
            provenance: { source_url: "https://example.gov" },
          },
        ],
      }),
    });
    expect(result.status).toBe(0);
    expect(readFeatures(outDir)).toHaveLength(0);
    expect(reasonFor(outDir, auditDir, "01_ROUTE_CONDITIONS:TEST:closure-past")).toBe("expired");
  });

  it("31. keeps an open-ended closure shown only when the source still marks it active and was checked within 24h", () => {
    const { result, outDir } = build({
      "01_ROUTE_CONDITIONS": emptyLane({
        event_count: 1,
        events: [
          {
            event_id: "01_ROUTE_CONDITIONS:TEST:closure-open",
            event_type: "trail_closure",
            status: "active",
            title: "Open-ended closure",
            effective_start: "2026-06-01T00:00:00Z",
            last_verified_at: "2026-08-02T10:00:00.000Z", // ~6h before generated_at
            route_impact_state: "confirmed_route_impact",
            route_relevance: { method: "named_trail_segment_matching" },
            location: { name: "Test Trail", route_section_ids: ["09_east_lake_sammamish_trail_sammamish"] },
            provenance: { source_url: "https://example.gov" },
          },
        ],
      }),
    });
    expect(result.status).toBe(0);
    expect(readFeatures(outDir)).toHaveLength(1);
  });

  it("31b. hides an open-ended closure checked more than 24h ago, even though it is within 48h — closures use the 24h rule, not the 48h alert rule", () => {
    const { result, outDir } = build({
      "01_ROUTE_CONDITIONS": emptyLane({
        event_count: 1,
        events: [
          {
            event_id: "01_ROUTE_CONDITIONS:TEST:closure-open-stale",
            event_type: "trail_closure",
            status: "active",
            title: "Open-ended closure, checked 30h ago",
            effective_start: "2026-06-01T00:00:00Z",
            last_verified_at: "2026-08-01T10:00:00.000Z", // ~30h before generated_at: within 48h, outside 24h
            route_impact_state: "confirmed_route_impact",
            route_relevance: { method: "named_trail_segment_matching" },
            location: { name: "Test Trail", route_section_ids: ["09_east_lake_sammamish_trail_sammamish"] },
            provenance: { source_url: "https://example.gov" },
          },
        ],
      }),
    });
    expect(result.status).toBe(0);
    expect(readFeatures(outDir)).toHaveLength(0);
  });

  it("32. a failed source check (no refresh time at all) does not keep an old event public forever", () => {
    const { result, outDir } = build(
      govLane([
        govAlertEvent({
          last_verified_at: undefined,
          observed_at: undefined,
          provenance: { source_url: "https://example.gov" }, // no retrieved_at either
        }),
      ]),
    );
    expect(result.status).toBe(0);
    expect(readFeatures(outDir)).toHaveLength(0);
  });

  it("33. last-known-good at the lane level does not override an expired active period", () => {
    const { result, outDir } = build({
      "01_ROUTE_CONDITIONS": emptyLane({
        event_count: 1,
        connector_health: { used_last_known_good: true },
        freshness: { overall_state: "stale" },
        events: [
          {
            event_id: "01_ROUTE_CONDITIONS:TEST:closure-lkg-expired",
            event_type: "trail_closure",
            status: "active",
            title: "Expired closure under LKG",
            effective_start: "2026-01-01T00:00:00Z",
            effective_end: "2026-07-01T00:00:00Z",
            last_verified_at: "2026-06-15T00:00:00.000Z",
            route_impact_state: "confirmed_route_impact",
            route_relevance: { method: "named_trail_segment_matching" },
            location: { name: "Test Trail", route_section_ids: ["09_east_lake_sammamish_trail_sammamish"] },
            provenance: { source_url: "https://example.gov" },
          },
        ],
      }),
    });
    expect(result.status).toBe(0);
    expect(readFeatures(outDir)).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Duplicate merging (tests 34-41)
// ---------------------------------------------------------------------------

describe("duplicate merging (tests 34-41)", () => {
  it("34. three Issaquah Creek observations for the same flood state produce one public card", () => {
    const base = { official_category: "major", route_impact: "trail_flooded" };
    const { result, outDir } = build(
      floodLane([
        floodEvent({ ...base, event_id: "05_FLOOD_CONDITIONS:A:1", title: "Issaquah Creek gauge A" }),
        floodEvent({ ...base, event_id: "05_FLOOD_CONDITIONS:B:2", title: "Issaquah Creek gauge B" }),
        floodEvent({ ...base, event_id: "05_FLOOD_CONDITIONS:C:3", title: "Issaquah Creek gauge C" }),
      ]),
    );
    expect(result.status).toBe(0);
    expect(readFeatures(outDir)).toHaveLength(1);
  });

  it("35. observation and forecast records for the same event produce one card", () => {
    const base = { official_category: "major", route_impact: "trail_flooded" };
    const { result, outDir } = build(
      floodLane([
        floodEvent({ ...base, event_id: "05_FLOOD_CONDITIONS:OBS:1", event_type: "gauge_observation" }),
        floodEvent({ ...base, event_id: "05_FLOOD_CONDITIONS:FCST:2", event_type: "gauge_forecast" }),
      ]),
    );
    expect(result.status).toBe(0);
    expect(readFeatures(outDir)).toHaveLength(1);
  });

  it("36. the same real-world closure reported under two source IDs on one lane produces one card", () => {
    const base = {
      event_type: "trail_closure",
      status: "active",
      effective_start: "2026-06-01T00:00:00Z",
      effective_end: "2026-12-31T23:59:59Z",
      route_impact_state: "confirmed_route_impact",
      route_relevance: { method: "named_trail_segment_matching" },
      location: { name: "Test Trail", route_section_ids: ["09_east_lake_sammamish_trail_sammamish"] },
    };
    const { result, outDir } = build({
      "01_ROUTE_CONDITIONS": emptyLane({
        event_count: 2,
        events: [
          { ...base, event_id: "01_ROUTE_CONDITIONS:AGENCY-A:1", title: "Trail closure (Agency A)", provenance: { source_url: "https://a.gov" } },
          { ...base, event_id: "01_ROUTE_CONDITIONS:AGENCY-B:2", title: "Trail closure (Agency B)", provenance: { source_url: "https://b.gov" } },
        ],
      }),
    });
    expect(result.status).toBe(0);
    expect(readFeatures(outDir)).toHaveLength(1);
  });

  it("37. the merged card uses the newest valid refresh time", () => {
    const base = { official_category: "major", route_impact: "trail_flooded" };
    const { result, outDir } = build(
      floodLane([
        floodEvent({ ...base, event_id: "05_FLOOD_CONDITIONS:OLD:1", observed_at: "2026-08-01T00:00:00.000Z" }),
        floodEvent({ ...base, event_id: "05_FLOOD_CONDITIONS:NEW:2", observed_at: "2026-08-02T12:00:00.000Z" }),
      ]),
    );
    expect(result.status).toBe(0);
    const features = readFeatures(outDir);
    expect(features).toHaveLength(1);
    expect(features[0]!.properties.lastSourceRefreshAt).toBe("2026-08-02T12:00:00.000Z");
  });

  it("38. the merged card keeps the highest valid severity", () => {
    const base = {
      event_type: "trail_closure",
      status: "active",
      effective_start: "2026-06-01T00:00:00Z",
      effective_end: "2026-12-31T23:59:59Z",
      last_verified_at: "2026-08-02T10:00:00.000Z",
      route_impact_state: "confirmed_route_impact",
      route_relevance: { method: "named_trail_segment_matching" },
      location: { name: "Test Trail", route_section_ids: ["09_east_lake_sammamish_trail_sammamish"] },
    };
    const { result, outDir } = build({
      "01_ROUTE_CONDITIONS": emptyLane({
        event_count: 2,
        events: [
          { ...base, event_id: "01_ROUTE_CONDITIONS:LOW:1", severity: "moderate", title: "Minor advisory" },
          { ...base, event_id: "01_ROUTE_CONDITIONS:HIGH:2", severity: "severe", title: "Severe closure warning" },
        ],
      }),
    });
    expect(result.status).toBe(0);
    const features = readFeatures(outDir);
    expect(features).toHaveLength(1);
    expect(features[0]!.properties.title).toBe("Severe closure warning");
  });

  it("39. the merged card keeps source links without repeating card text", () => {
    const base = { official_category: "major", route_impact: "trail_flooded" };
    const { result, outDir } = build(
      floodLane([
        floodEvent({ ...base, event_id: "05_FLOOD_CONDITIONS:X:1", provenance: { source_url: "https://a.gov/x" } }),
        floodEvent({ ...base, event_id: "05_FLOOD_CONDITIONS:Y:2", provenance: { source_url: "https://b.gov/y" } }),
      ]),
    );
    expect(result.status).toBe(0);
    const features = readFeatures(outDir);
    expect(features).toHaveLength(1);
    const mergedUrls = features[0]!.properties.mergedSourceUrls as string[];
    expect(mergedUrls).toEqual(expect.arrayContaining(["https://a.gov/x", "https://b.gov/y"]));
    expect(mergedUrls).toHaveLength(2);
    expect(features[0]!.properties.title).toBe("Test flood gauge"); // single clean title, not concatenated
  });

  it("40. two hazards on different route segments remain separate", () => {
    const base = { official_category: "major", route_impact: "trail_flooded" };
    const { result, outDir } = build(
      floodLane([
        floodEvent({
          ...base,
          event_id: "05_FLOOD_CONDITIONS:SEG-A:1",
          location: { name: "Creek A", route_section_ids: ["07_marymoor_park"] },
        }),
        floodEvent({
          ...base,
          event_id: "05_FLOOD_CONDITIONS:SEG-B:2",
          location: { name: "Creek B", route_section_ids: ["10_issaquah_approach_terminus"] },
        }),
      ]),
    );
    expect(result.status).toBe(0);
    expect(readFeatures(outDir)).toHaveLength(2);
  });

  it("41. near-match wording still merges when the route segment and hazard facts match", () => {
    const base = {
      event_type: "trail_closure",
      status: "active",
      effective_start: "2026-06-01T00:00:00Z",
      effective_end: "2026-12-31T23:59:59Z",
      route_impact_state: "confirmed_route_impact",
      route_relevance: { method: "named_trail_segment_matching" },
      trail_or_street_name: "East Lake Sammamish Trail",
      location: { name: "East Lake Sammamish Trail near Louis Thompson Road", route_section_ids: ["09_east_lake_sammamish_trail_sammamish"] },
    };
    const { result, outDir } = build({
      "01_ROUTE_CONDITIONS": emptyLane({
        event_count: 2,
        events: [
          { ...base, event_id: "01_ROUTE_CONDITIONS:WORD-A:1", title: "ELST closure at Louis Thompson Rd", provenance: { source_url: "https://a.gov" } },
          { ...base, event_id: "01_ROUTE_CONDITIONS:WORD-B:2", title: "East Lake Sammamish Trail closure near Louis Thompson Road", provenance: { source_url: "https://b.gov" } },
        ],
      }),
    });
    expect(result.status).toBe(0);
    expect(readFeatures(outDir)).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// Public package integrity (tests 42-45)
// ---------------------------------------------------------------------------

describe("public package integrity (tests 42-45)", () => {
  it("42. hidden items remain traceable in the audit output", () => {
    const { result, outDir, auditDir } = build(govLane([healthEvent()]));
    expect(result.status).toBe(0);
    const releaseId = JSON.parse(readFileSync(join(outDir, "release-manifest.json"), "utf8")).releaseId;
    const audit = JSON.parse(readFileSync(join(auditDir, `exclusions-${releaseId}.json`), "utf8"));
    expect(audit.records.some((r: { eventId: string }) => r.eventId === "07_GOVERNMENT_SAFETY_ALERTS:TEST:health1")).toBe(true);
  });

  it("43. public output contains only eligible items", () => {
    const { result, outDir } = build({
      ...govLane([healthEvent(), govAlertEvent({ event_id: "07_GOVERNMENT_SAFETY_ALERTS:TEST:eligible1" })]),
    });
    expect(result.status).toBe(0);
    const features = readFeatures(outDir);
    expect(features.every((f) => f.properties.presentationEligible === true)).toBe(true);
    expect(features.some((f) => f.id === "07_GOVERNMENT_SAFETY_ALERTS:TEST:health1")).toBe(false);
  });

  it("44. every excluded item has a clear, non-empty exclusion reason", () => {
    const { result, outDir, auditDir } = build(
      floodLane([floodEvent({ official_category: "minor" }), floodEvent({ official_category: "moderate", event_id: "05_FLOOD_CONDITIONS:TEST:evt2" })]),
    );
    expect(result.status).toBe(0);
    const releaseId = JSON.parse(readFileSync(join(outDir, "release-manifest.json"), "utf8")).releaseId;
    const audit = JSON.parse(readFileSync(join(auditDir, `exclusions-${releaseId}.json`), "utf8"));
    for (const record of audit.records) {
      if (!record.presentationEligible) {
        expect(typeof record.presentationReason).toBe("string");
        expect(record.presentationReason.length).toBeGreaterThan(0);
        expect(record.presentationReason).not.toBe("eligible");
      }
    }
  });

  it("45. public package schema validation passes on filtered output", () => {
    const { result, outDir } = build(govLane([govAlertEvent()]));
    expect(result.status).toBe(0);
    const validated = runValidate(outDir);
    expect(validated.status).toBe(0);
  });
});

describe("targeted public alert qualification and geometry remediation", () => {
  it("requires Trail, Location, and Alert facts before a public triangle can render", () => {
    const { result, outDir, auditDir } = build({
      "06_TRAIL_INFRASTRUCTURE_STATUS": emptyLane({
        event_count: 1,
        events: [
          {
            event_id: "06_TRAIL_INFRASTRUCTURE_STATUS:TEST:pseudo",
            event_type: "infrastructure_project",
            status: "active",
            title: "George Davis Creek fish-passage and storm improvement project",
            route_relevance: {
              classification: "confirmed_route_impact",
              matched_route_sections: ["09_east_lake_sammamish_trail_sammamish"],
            },
            location: { route_section_ids: ["09_east_lake_sammamish_trail_sammamish"] },
            trail_or_street_name: "George Davis Creek",
            last_verified_at: "2026-08-02T10:00:00.000Z",
            provenance: { source_url: "https://example.gov/project" },
          },
        ],
      }),
    });
    expect(result.status).toBe(0);
    expect(readFeatures(outDir)).toHaveLength(0);
    expect(reasonFor(outDir, auditDir, "06_TRAIL_INFRASTRUCTURE_STATUS:TEST:pseudo")).toBe(
      "public_alert_unqualified",
    );
  });

  it("does not use Unknown to qualify an otherwise meaningless public alert", () => {
    const { result, outDir } = build({
      "06_TRAIL_INFRASTRUCTURE_STATUS": emptyLane({
        event_count: 1,
        events: [
          {
            event_id: "06_TRAIL_INFRASTRUCTURE_STATUS:TEST:unknown",
            event_type: "infrastructure_project",
            status: "active",
            title: "Unknown",
            summary: "Unknown",
            route_relevance: {
              classification: "confirmed_route_impact",
              matched_route_sections: ["03_burke_gilman_trail"],
            },
            location: { route_section_ids: ["03_burke_gilman_trail"] },
            trail_or_street_name: "Burke-Gilman Trail",
            last_verified_at: "2026-08-02T10:00:00.000Z",
            provenance: { source_url: "https://example.gov/project" },
          },
        ],
      }),
    });
    expect(result.status).toBe(0);
    expect(readFeatures(outDir)).toHaveLength(0);
  });

  it("publishes the current ELST closure as one qualified point alert with supported closure facts", () => {
    const { result, outDir } = build({
      "01_ROUTE_CONDITIONS": emptyLane({
        event_count: 1,
        events: [
          {
            event_id:
              "01_ROUTE_CONDITIONS:KC-03:trail_closure:east_lake_sammamish_trail_louis_thompson_to_inglewood_2026-06-01",
            source_id: "01_ROUTE_CONDITIONS:KC-03",
            event_type: "trail_closure",
            status: "active",
            severity: "high",
            title: "East Lake Sammamish Trail closure for George Davis Creek culvert replacement.",
            summary: "East Lake Sammamish Trail closure for George Davis Creek culvert replacement.",
            trail_or_street_name: "East Lake Sammamish Trail",
            location_description_raw: "Between Louis Thompson Rd NE and NE Inglewood Hill Rd.",
            effective_start: "2026-06-01T00:00:00Z",
            effective_end: "2026-12-31T23:59:59Z",
            last_verified_at: "2026-08-02T10:00:00.000Z",
            detour_available: false,
            route_impact_state: "confirmed_route_impact",
            route_sections: ["09_east_lake_sammamish_trail_sammamish"],
            route_relevance: { classification: "confirmed_route_impact", method: "named_trail_segment_matching" },
            provenance: {
              source_name: "King County Parks - East Lake Sammamish Trail page",
              source_url:
                "https://kingcounty.gov/en/dept/dnrp/nature-recreation/parks-recreation/king-county-parks/trails/leafline-trails/east-lake-sammamish",
            },
          },
        ],
      }),
    });
    expect(result.status).toBe(0);
    const features = readFeatures(outDir);
    expect(features).toHaveLength(1);
    const feature = features[0]!;
    expect(feature.geometry).toEqual({ type: "Point", coordinates: [-122.06792, 47.617432] });
    expect(feature.properties.trailName).toBe("East Lake Sammamish Trail");
    expect(feature.properties.locationLabel).toBe("Between Louis Thompson Rd NE and NE Inglewood Hill Rd.");
    expect(feature.properties.alertNature).toBe("East Lake Sammamish Trail closure for George Davis Creek culvert replacement.");
    expect(feature.properties.routeEffect).toBe("Segment closed");
    expect(feature.properties.closedLengthMiles).toBe(0.11);
    expect(feature.properties.closureStartCrossing).toBe("Louis Thompson Rd NE");
    expect(feature.properties.closureEndCrossing).toBe("NE Inglewood Hill Rd");
    expect(feature.properties.detourAvailable).toBe(false);
  });
});
