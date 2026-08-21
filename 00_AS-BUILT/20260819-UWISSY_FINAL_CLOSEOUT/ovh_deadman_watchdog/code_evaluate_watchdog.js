const SOURCE_URL = "https://uw-issy.biketourfrance.net/data/system-health.json";
const CYCLE_HOURS = [3, 13];
const ZONE = "America/Los_Angeles";
const EXPECTED_SCHEMA_VERSION = "1.0.0";

const item = $input.first();
const failedChecks = [];
let httpOk = true;
let body = null;

if (item.json && item.json.error) {
  httpOk = false;
  failedChecks.push("HTTP request failed: " + String(item.json.error));
} else {
  body = item.json;
}

const nowLA = DateTime.now().setZone(ZONE);

function lastCycleBoundary(dtLA) {
  const candidates = [];
  for (const dayOffset of [0, -1]) {
    const day = dtLA.plus({ days: dayOffset }).startOf("day");
    for (const h of CYCLE_HOURS) {
      candidates.push(day.set({ hour: h, minute: 0, second: 0, millisecond: 0 }));
    }
  }
  const past = candidates.filter((c) => c <= dtLA).sort((a, b) => b.toMillis() - a.toMillis());
  return past.length ? past[0] : null;
}

const expectedCycle = lastCycleBoundary(nowLA);

let observedCycle = null;
let schemaVersion = null;
let releaseId = null;
let assembledAtLA = null;
let assemblyState = null;
let publicationState = null;
let failedLaneIds = [];
let lanes = [];
const laneSummary = {};

if (httpOk) {
  if (!body || typeof body !== "object") {
    failedChecks.push("Response body is not valid JSON");
  } else {
    schemaVersion = body.schemaVersion;
    releaseId = body.releaseId;
    assemblyState = body.assemblyState;
    publicationState = body.publicationState;
    failedLaneIds = Array.isArray(body.failedLaneIds) ? body.failedLaneIds : [];
    lanes = Array.isArray(body.lanes) ? body.lanes : [];

    if (!schemaVersion) {
      failedChecks.push("Missing schema_version field (schemaVersion)");
    } else if (schemaVersion !== EXPECTED_SCHEMA_VERSION) {
      failedChecks.push("Unexpected schema_version: " + schemaVersion + " (expected " + EXPECTED_SCHEMA_VERSION + ")");
    }

    if (!body.assembledAt) {
      failedChecks.push("Missing assembledAt timestamp");
    } else {
      const parsed = DateTime.fromISO(body.assembledAt, { setZone: true });
      if (!parsed.isValid) {
        failedChecks.push("Invalid assembledAt timestamp: " + body.assembledAt);
      } else {
        assembledAtLA = parsed.setZone(ZONE);
        observedCycle = lastCycleBoundary(assembledAtLA);
        if (!expectedCycle || !observedCycle || observedCycle.toMillis() !== expectedCycle.toMillis()) {
          failedChecks.push(
            "Release is stale for the current expected cycle (observed cycle " +
              (observedCycle ? observedCycle.toISO() : "unknown") +
              ", expected " +
              (expectedCycle ? expectedCycle.toISO() : "unknown") +
              ")"
          );
        }
        if (assembledAtLA > nowLA) {
          failedChecks.push("assembledAt is in the future relative to watchdog check time");
        }
      }
    }

    if (assemblyState !== "ok") {
      failedChecks.push("assemblyState is not ok: " + String(assemblyState));
    }
    if (publicationState !== "published") {
      failedChecks.push("publicationState is not published: " + String(publicationState));
    }
    if (failedLaneIds.length > 0) {
      failedChecks.push("failedLaneIds reported by source: " + failedLaneIds.join(", "));
    }
    if (lanes.length === 0) {
      failedChecks.push("No lanes present in document");
    }

    for (const lane of lanes) {
      const laneId = lane.laneId || "UNKNOWN_LANE";
      const ok = lane.available === true && lane.freshnessState === "fresh" && !failedLaneIds.includes(laneId);
      laneSummary[laneId] = {
        available: lane.available === true,
        freshnessState: lane.freshnessState || null,
        sourceState: lane.sourceState || null,
        ok: ok
      };
      if (!ok) {
        failedChecks.push(
          "Lane " + laneId + " not fresh/complete for current cycle (available=" + lane.available + ", freshnessState=" + lane.freshnessState + ")"
        );
      }
    }
  }
}

const watchdogStatus = failedChecks.length === 0 ? "PASSED" : "FAILED";

const result = {
  watchdog_status: watchdogStatus,
  checked_at: DateTime.now().toUTC().toISO(),
  source_url: SOURCE_URL,
  expected_cycle: expectedCycle ? expectedCycle.toISO() : null,
  observed_cycle: observedCycle ? observedCycle.toISO() : null,
  system_result: watchdogStatus === "PASSED" ? "PASSED" : "FAILED",
  release_id: releaseId,
  schema_version: schemaVersion,
  assembly_state: assemblyState,
  publication_state: publicationState,
  failed_checks: failedChecks,
  lane_summary: laneSummary,
  note:
    "Watchdog checks system-health.json (the real published document) as the freshness/completion proxy. monitor-status.json referenced in the original task spec does not exist at the UWISSY public site as of 2026-08-20; required-lane list is the lane set present in the document, not an externally defined list."
};

return [{ json: result }];
