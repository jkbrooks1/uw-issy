const SOURCE_URL = "https://uw-issy.biketourfrance.net/data/system-health.json";
const CYCLE_HOURS = [3, 13];
const ZONE = "America/Los_Angeles";
const SCHEMA_VERSION_PATTERN = /^\d+\.\d+(\.\d+)?$/;

const item = $input.first();
const failedChecks = [];
const degradedChecks = [];
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
let degradedLaneIds = [];
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
    degradedLaneIds = Array.isArray(body.degradedLaneIds) ? body.degradedLaneIds : [];
    lanes = Array.isArray(body.lanes) ? body.lanes : [];

    if (!schemaVersion || typeof schemaVersion !== "string" || !SCHEMA_VERSION_PATTERN.test(schemaVersion)) {
      failedChecks.push("Missing or invalid schemaVersion: " + JSON.stringify(schemaVersion));
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
      const available = lane.available === true;
      const usingLastKnownGood = lane.usingLastKnownGood === true;
      const freshnessState = lane.freshnessState || null;
      const sourceState = lane.sourceState || null;

      let laneClass = "ok";
      let laneReason = null;

      if (failedLaneIds.includes(laneId)) {
        laneClass = "failed";
        laneReason = "reported in failedLaneIds";
      } else if (usingLastKnownGood) {
        laneClass = "failed";
        laneReason = "usingLastKnownGood=true";
      } else if (!available) {
        laneClass = "failed";
        laneReason = "available=false";
      } else if (sourceState === "degraded" || freshnessState !== "fresh") {
        laneClass = "degraded";
        laneReason = "sourceState=" + sourceState + ", freshnessState=" + freshnessState;
      }

      laneSummary[laneId] = {
        available: available,
        freshnessState: freshnessState,
        sourceState: sourceState,
        usingLastKnownGood: usingLastKnownGood,
        lane_class: laneClass,
        reason: laneReason
      };

      if (laneClass === "failed") {
        failedChecks.push("Lane " + laneId + " FAILED (" + laneReason + ")");
      } else if (laneClass === "degraded") {
        degradedChecks.push("Lane " + laneId + " DEGRADED (" + laneReason + ")");
      }
    }
  }
}

let watchdogStatus;
if (failedChecks.length > 0) {
  watchdogStatus = "FAILED";
} else if (degradedChecks.length > 0) {
  watchdogStatus = "DEGRADED";
} else {
  watchdogStatus = "PASSED";
}

const freshLaneCount = Object.values(laneSummary).filter((l) => l.lane_class === "ok").length;
const degradedLaneCount = Object.values(laneSummary).filter((l) => l.lane_class === "degraded").length;
const failedLaneCount = Object.values(laneSummary).filter((l) => l.lane_class === "failed").length;

const healthSummary = {
  total_lanes: lanes.length,
  fresh_lane_count: freshLaneCount,
  degraded_lane_count: degradedLaneCount,
  failed_lane_count: failedLaneCount,
  assembly_state: assemblyState,
  publication_state: publicationState
};

const result = {
  watchdog_status: watchdogStatus,
  checked_at: DateTime.now().toUTC().toISO(),
  source_url: SOURCE_URL,
  health_summary: healthSummary,
  assembly_state: assemblyState,
  publication_state: publicationState,
  failed_checks: failedChecks,
  degraded_checks: degradedChecks,
  lane_summary: laneSummary,
  expected_cycle: expectedCycle ? expectedCycle.toISO() : null,
  observed_cycle: observedCycle ? observedCycle.toISO() : null,
  release_id: releaseId,
  schema_version: schemaVersion,
  failed_lane_ids: failedLaneIds,
  degraded_lane_ids_reported_by_source: degradedLaneIds,
  note:
    "Three-state watchdog: FAILED if any of HTTP/JSON error, missing/invalid schemaVersion or assembledAt, stale cycle, assemblyState!=ok, publicationState!=published, failedLaneIds present, or any lane with usingLastKnownGood=true or available=false. DEGRADED if the document is otherwise structurally valid but one or more lanes have sourceState=degraded or freshnessState!=fresh. PASSED only if all lanes are fresh/available and assembly/publication are confirmed. Checks system-health.json as the real published freshness/completion signal; monitor-status.json does not exist at the UWISSY public site."
};

return [{ json: result }];
