const staticData = $getWorkflowStaticData('global');
const result = $input.first().json;

const cycleKey = result.expected_cycle || result.checked_at;
const lastAlertedCycle = staticData.lastAlertedFailureCycle || null;
const shouldSend = lastAlertedCycle !== cycleKey;
const previouslyAlertedAt = staticData.lastAlertedAt || null;

if (shouldSend) {
  staticData.lastAlertedFailureCycle = cycleKey;
  staticData.lastAlertedAt = DateTime.now().toUTC().toISO();
}

const subject = "UW-Issy Monitor FAILED TO RUN";

const laneLines = Object.entries(result.lane_summary || {}).map(([laneId, l]) => {
  return "  - " + laneId + ": freshnessState=" + l.freshnessState + ", sourceState=" + l.sourceState + ", class=" + l.lane_class + (l.reason ? " (" + l.reason + ")" : "");
});

const failedChecksLines = (result.failed_checks || []).map((c) => "  - " + c);

const hs = result.health_summary || {};

const bodyLines = [
  "UW-Issy external dead-man watchdog detected a failure.",
  "",
  "Watchdog state: " + result.watchdog_status,
  "Check time (UTC): " + result.checked_at,
  "Live endpoint checked: " + result.source_url,
  "",
  "Freshness state summary: fresh=" + hs.fresh_lane_count + ", degraded=" + hs.degraded_lane_count + ", failed=" + hs.failed_lane_count + " (of " + hs.total_lanes + " lanes)",
  "Assembly state: " + result.assembly_state,
  "Publication state: " + result.publication_state,
  "Failed lane IDs: " + (result.failed_lane_ids && result.failed_lane_ids.length ? result.failed_lane_ids.join(", ") : "none"),
  "Degraded lane IDs (source-reported): " + (result.degraded_lane_ids_reported_by_source && result.degraded_lane_ids_reported_by_source.length ? result.degraded_lane_ids_reported_by_source.join(", ") : "none"),
  "",
  "Reason(s) for failure:",
  ...(failedChecksLines.length ? failedChecksLines : ["  (none listed)"]),
  "",
  "Per-lane source state:",
  ...(laneLines.length ? laneLines : ["  (no lanes present in document)"]),
  "",
  "Latest known production release: " + (result.release_id || "unknown"),
  "Expected cycle: " + (result.expected_cycle || "unknown"),
  "Observed cycle: " + (result.observed_cycle || "unknown"),
  "",
  shouldSend
    ? "This is a new alert for expected cycle " + cycleKey + "."
    : "NOTE: this run would be SUPPRESSED as a duplicate — already alerted for expected cycle " + cycleKey + " at " + previouslyAlertedAt + "."
].join("\n");

return [{
  json: {
    ...result,
    alert_should_send: shouldSend,
    alert_dedup_cycle_key: cycleKey,
    alert_previously_alerted_at: previouslyAlertedAt,
    alert_subject: subject,
    alert_body: bodyLines
  }
}];
