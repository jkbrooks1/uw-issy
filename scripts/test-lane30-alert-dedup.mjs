#!/usr/bin/env node

function detectNewEvents({ alertedEventIds, lanes }) {
  const alertedSet = new Set(alertedEventIds || []);
  const newEventsByLane = [];
  const allCurrentEventIds = new Set();

  for (const item of lanes) {
    if (!item.available || !item.data) continue;
    const events = item.data.events || item.data.deduplicated_events || [];
    for (const event of events) {
      const eventId = event && event.event_id;
      if (!eventId) continue;
      allCurrentEventIds.add(eventId);
      if (!alertedSet.has(eventId)) {
        newEventsByLane.push({
          lane_id: item.lane_id,
          lane_label: item.lane_label,
          event_id: eventId,
          summary: event.summary || event.title || null,
          details: event.details || event.description || null,
        });
      }
    }
  }

  return {
    newEventsByLane,
    updatedAlertedEventIds: Array.from(new Set([...alertedSet, ...allCurrentEventIds])),
  };
}

const stableClosureId =
  "01_ROUTE_CONDITIONS:KC-03:trail_closure:east_lake_sammamish_trail_louis_thompson_to_inglewood_2026-06-01";
const legacyClosureHashId = "01_ROUTE_CONDITIONS:KC-03:hash_40e1d868";
const secondClosureId = "01_ROUTE_CONDITIONS:TEST-SECOND-CLOSURE:2026-08-20";

function migrateLegacyAlertedIds(alertedEventIds) {
  const ids = Array.from(new Set(alertedEventIds || []));
  if (!ids.includes(stableClosureId) && ids.some((id) => id.startsWith("01_ROUTE_CONDITIONS:KC-03:hash_"))) {
    ids.push(stableClosureId);
  }
  return ids;
}

function laneWithEvents(events) {
  return [
    {
      lane_id: "01_ROUTE_CONDITIONS",
      lane_label: "Route Conditions",
      available: true,
      data: { events },
    },
  ];
}

function closure(overrides = {}) {
  return {
    event_id: stableClosureId,
    source_id: "01_ROUTE_CONDITIONS:KC-03",
    event_type: "trail_closure",
    summary: "East Lake Sammamish Trail closure",
    details: "Original source page text.",
    last_verified_at: "2026-08-20T03:00:00Z",
    provenance: { content_hash: "hash_original" },
    ...overrides,
  };
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

let state = [];

const first = detectNewEvents({ alertedEventIds: state, lanes: laneWithEvents([closure()]) });
assert(first.newEventsByLane.length === 1, "Test 1 failed: expected one new-event alert");
state = first.updatedAlertedEventIds;

const second = detectNewEvents({ alertedEventIds: state, lanes: laneWithEvents([closure()]) });
assert(second.newEventsByLane.length === 0, "Test 2 failed: unchanged event should not alert twice");
state = second.updatedAlertedEventIds;

const changedText = detectNewEvents({
  alertedEventIds: state,
  lanes: laneWithEvents([closure({ details: "Changed source page text.", provenance: { content_hash: "hash_changed_text" } })]),
});
assert(changedText.newEventsByLane.length === 0, "Test 3 failed: changed source text with stable event_id should not alert");
state = changedText.updatedAlertedEventIds;

const changedTimestamp = detectNewEvents({
  alertedEventIds: state,
  lanes: laneWithEvents([closure({ last_verified_at: "2026-08-20T13:00:00Z" })]),
});
assert(changedTimestamp.newEventsByLane.length === 0, "Test 4 failed: changed verification timestamp should not alert");
state = changedTimestamp.updatedAlertedEventIds;

const secondEvent = closure({
  event_id: secondClosureId,
  source_id: "01_ROUTE_CONDITIONS:TEST-SECOND-CLOSURE",
  summary: "Second distinct closure",
});
const newSecond = detectNewEvents({ alertedEventIds: state, lanes: laneWithEvents([closure(), secondEvent]) });
assert(newSecond.newEventsByLane.length === 1, "Test 5 failed: expected one alert for the newly introduced second event");
assert(newSecond.newEventsByLane[0].event_id === secondClosureId, "Test 5 failed: alerted event should be the new second event only");
state = newSecond.updatedAlertedEventIds;

const persisted = JSON.parse(JSON.stringify(state));
const afterRestart = detectNewEvents({ alertedEventIds: persisted, lanes: laneWithEvents([closure(), secondEvent]) });
assert(afterRestart.newEventsByLane.length === 0, "Test 6 failed: persisted state should suppress prior events");

const migratedLegacyState = migrateLegacyAlertedIds([legacyClosureHashId]);
const legacySuppressed = detectNewEvents({ alertedEventIds: migratedLegacyState, lanes: laneWithEvents([closure()]) });
assert(legacySuppressed.newEventsByLane.length === 0, "Test 7 failed: legacy KC-03 hash state should suppress stable KC-03 event");

console.log("PASS: Lane 30 alert dedup regression tests 1-7 passed");
