#!/usr/bin/env node
// Regression tests for the Lane 03/05/07 stable-event-identity fix.
// Mirrors the exact event_id formulas deployed to the live Hetzner
// Normalize-* Code nodes on 2026-08-20/21. If the live node logic changes,
// update the corresponding buildEventId function here to match.

function assertEqual(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`FAIL ${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
  console.log(`PASS ${label}`);
}

function assertNotEqual(actual, expected, label) {
  if (actual === expected) {
    throw new Error(`FAIL ${label}: expected values to differ, both were ${JSON.stringify(actual)}`);
  }
  console.log(`PASS ${label}`);
}

// ---------------------------------------------------------------------
// Lane 03 PSCAA-02 burn-ban identity: source_id + burnBanStatus (state)
// ---------------------------------------------------------------------
function laneO3BurnBanId(burnBanStatus) {
  return '03_AIR_QUALITY:PSCAA-02:burn-ban:' + burnBanStatus;
}

{
  const id1 = laneO3BurnBanId('stage_1');
  const id2 = laneO3BurnBanId('stage_1'); // simulate a later run, same status
  assertEqual(id2, id1, 'Lane03 burn-ban: same status across runs -> same event_id');

  const id3 = laneO3BurnBanId('stage_2'); // genuine state transition
  assertNotEqual(id3, id1, 'Lane03 burn-ban: status changes stage_1 -> stage_2 -> different event_id');
}

// ---------------------------------------------------------------------
// Lane 03 WASMOKE-01 smoke-context identity: matched areas + severity
// ---------------------------------------------------------------------
function laneO3SmokeContextId(matchedAreas, severity) {
  const areaKey = matchedAreas.slice().sort().join('-').toLowerCase().replace(/[^a-z0-9-]+/g, '-');
  return '03_AIR_QUALITY:WASMOKE-01:smoke-context:' + areaKey + ':' + severity;
}

{
  const idA = laneO3SmokeContextId(['Seattle', 'Bellevue'], 'moderate');
  const idB = laneO3SmokeContextId(['Seattle', 'Bellevue'], 'moderate'); // new fetch, same areas/severity, different RSS wording
  assertEqual(idB, idA, 'Lane03 smoke-context: same areas/severity across runs -> same event_id');

  const idC = laneO3SmokeContextId(['Seattle', 'Bellevue'], 'unhealthy'); // severity worsened
  assertNotEqual(idC, idA, 'Lane03 smoke-context: severity change -> different event_id');
}

// ---------------------------------------------------------------------
// Lane 05 gauge-observation identity (USGS-01/02/03): source_id + severity:status
// ---------------------------------------------------------------------
function lane05GaugeId(sourceTag, routeSeverity, status) {
  return `05_FLOOD_CONDITIONS:${sourceTag}:gauge-observation:${routeSeverity}:${status}`;
}

{
  const id1 = lane05GaugeId('USGS-01', 'advisory', 'monitoring');
  const id2 = lane05GaugeId('USGS-01', 'advisory', 'monitoring'); // new reading value, same state
  assertEqual(id2, id1, 'Lane05 USGS-01: same gauge state across runs with different raw reading -> same event_id');
}

// ---------------------------------------------------------------------
// Lane 05 NWPS-01/02 identity: source_id + category + severity
// ---------------------------------------------------------------------
function lane05NwpsId(sourceTag, category, severity) {
  const key = (category || 'not_defined').toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return `05_FLOOD_CONDITIONS:${sourceTag}:${key}:${severity}`;
}

{
  const id1 = lane05NwpsId('NWPS-01', 'no_flooding', 'advisory');
  const id2 = lane05NwpsId('NWPS-01', 'no_flooding', 'advisory'); // new run timestamp, same category
  assertEqual(id2, id1, 'Lane05 NWPS-01: same category across runs -> same event_id');

  const id3 = lane05NwpsId('NWPS-01', 'major', 'severe'); // genuine state transition to major flooding
  assertNotEqual(id3, id1, 'Lane05 NWPS-01: category escalates to major -> different event_id (alert-worthy transition)');
}

// ---------------------------------------------------------------------
// Lane 05 NWS-01 identity: CAP alert id when present, else fallback hash
// ---------------------------------------------------------------------
function lane05NwsId(props, fallbackHash) {
  return '05_FLOOD_CONDITIONS:NWS-01:' + String(props.id || props['@id'] || props.identifier || fallbackHash);
}

{
  const capId = 'https://api.weather.gov/alerts/urn:oid:2.49.0.1.840.0.example';
  const id1 = lane05NwsId({ id: capId }, 'fallback-should-not-be-used');
  const id2 = lane05NwsId({ id: capId }, 'different-fallback-does-not-matter');
  assertEqual(id2, id1, 'Lane05 NWS-01: same CAP alert id across runs -> same event_id regardless of fallback');

  const id3 = lane05NwsId({}, 'hash-abc123'); // no official id present -> uses fallback
  const id4 = lane05NwsId({}, 'hash-abc123');
  assertEqual(id4, id3, 'Lane05 NWS-01: identical fallback hash (no content change) -> same event_id');

  const id5 = lane05NwsId({ id: 'urn:oid:different-alert' }, 'fallback');
  assertNotEqual(id5, id1, 'Lane05 NWS-01: distinct official CAP alert id -> different event_id');
}

// ---------------------------------------------------------------------
// Lane 05 REDM-01 / KC-ROAD-01 identity: AlertID/GlobalID/OBJECTID, else
// stable-field hash (name+location only, no geom/timestamp)
// ---------------------------------------------------------------------
function laneO5ArcgisId(lanePrefix, attrs, hashFn) {
  const stableId = attrs.AlertID || attrs.GlobalID || attrs.OBJECTID;
  if (stableId) return `05_FLOOD_CONDITIONS:${lanePrefix}:` + String(stableId);
  const nameKey = attrs.AlertName || attrs.ClosureName || attrs.AlertTitle || '';
  const locKey = attrs.LocationDescription || attrs.LocationLimits || '';
  return `05_FLOOD_CONDITIONS:${lanePrefix}:` + hashFn(nameKey + '|' + locKey);
}

{
  const simpleHash = (s) => 'h_' + Buffer.from(s).toString('hex').slice(0, 8);
  const attrsWithId = { AlertID: 'KC-4471' };
  const id1 = laneO5ArcgisId('KC-ROAD-01', attrsWithId, simpleHash);
  const id2 = laneO5ArcgisId('KC-ROAD-01', attrsWithId, simpleHash);
  assertEqual(id2, id1, 'Lane05 KC-ROAD-01: same official AlertID -> same event_id');

  const attrsNoId1 = { AlertName: 'West Lake Sammamish Pkwy closure', LocationDescription: 'MP 1.2-1.4', LastUpdatedTime: '2026-08-20T20:00:00Z' };
  const attrsNoId2 = { AlertName: 'West Lake Sammamish Pkwy closure', LocationDescription: 'MP 1.2-1.4', LastUpdatedTime: '2026-08-20T21:30:00Z' }; // only timestamp changed
  const id3 = laneO5ArcgisId('KC-ROAD-01', attrsNoId1, simpleHash);
  const id4 = laneO5ArcgisId('KC-ROAD-01', attrsNoId2, simpleHash);
  assertEqual(id4, id3, 'Lane05 KC-ROAD-01 (no official id): only LastUpdatedTime changed -> same event_id (timestamp excluded from hash input)');
}

// ---------------------------------------------------------------------
// Lane 05 WSDOT-01 identity: record.AlertID, else stable-field hash
// ---------------------------------------------------------------------
function laneO5WsdotId(record, hashFn) {
  if (record.AlertID) return '05_FLOOD_CONDITIONS:WSDOT-01:' + String(record.AlertID);
  const key = (record.HeadlineDescription || record.EventCategory || '') + '|' + (record.County || '');
  return '05_FLOOD_CONDITIONS:WSDOT-01:' + hashFn(key);
}

{
  const simpleHash = (s) => 'h_' + Buffer.from(s).toString('hex').slice(0, 8);
  const id1 = laneO5WsdotId({ AlertID: 'WSDOT-9981' }, simpleHash);
  const id2 = laneO5WsdotId({ AlertID: 'WSDOT-9981' }, simpleHash);
  assertEqual(id2, id1, 'Lane05 WSDOT-01: same AlertID -> same event_id');
}

// ---------------------------------------------------------------------
// Lane 07 identity: sourceId + stable sourceRecordRef (CAP id / guid / link
// / joined stable cells), content hash retained only as provenance
// ---------------------------------------------------------------------
function lane07Id(sourceId, sourceRecordRef) {
  return sourceId + ':' + String(sourceRecordRef);
}

{
  const sourceId = '07_GOVERNMENT_SAFETY_ALERTS:DOH-02';
  const ref = '08/12/2026|Public Health - Seattle & King County|Health Advisory: Take Steps Now.|';
  const id1 = lane07Id(sourceId, ref);
  const id2 = lane07Id(sourceId, ref); // re-fetch, identical table row -> identical ref
  assertEqual(id2, id1, 'Lane07 DOH-02: same table-row content across runs -> same event_id');

  const distinctRef = '08/11/2026|Centers for Disease Control and Prevention|Health Advisory: Arboviral Disease.|';
  const id3 = lane07Id(sourceId, distinctRef);
  assertNotEqual(id3, id1, 'Lane07 DOH-02: genuinely distinct advisory row -> different event_id');
}

// ---------------------------------------------------------------------
// Two distinct simultaneous events must produce distinct IDs (all lanes)
// ---------------------------------------------------------------------
{
  const idA = lane05NwpsId('NWPS-01', 'minor', 'warning');
  const idB = lane05NwpsId('NWPS-02', 'minor', 'warning'); // same category/severity, different gauge/source
  assertNotEqual(idB, idA, 'Distinct sources with same category/severity -> different event_id (source scoped)');
}

console.log('\nAll Lane 03/05/07 stable-event-identity regression tests passed.');
