import fs from 'node:fs';

const outDir = '00_AS-BUILT/20260823-UWISSY_MONITOR_DATA_QUALITY_ROUND1';
const reportPath = '00_DOCS/2026-08-23_UWISSY_MONITOR_DATA_QUALITY_ROUND1.md';

const publicHealth = JSON.parse(fs.readFileSync('public/data/system-health.json', 'utf8'));
const workflow20 = JSON.parse(fs.readFileSync('data/connectors/evidence/workflow20-status-latest.json', 'utf8'));
const probes = JSON.parse(fs.readFileSync(`${outDir}/probes/live-endpoint-probes.json`, 'utf8'));
const credentials = JSON.parse(fs.readFileSync(`${outDir}/probes/credential-presence-proof.json`, 'utf8'));

const rootCauses = {
  '01_ROUTE_CONDITIONS:REDM-01': 'External/runtime network failure: Redmond ArcGIS timed out in connector artifact and still fails from local runtime.',
  '01_ROUTE_CONDITIONS:ISS-03': 'External/runtime network failure: Issaquah ArcGIS timed out in connector artifact and still fails from local runtime.',
  '01_ROUTE_CONDITIONS:ISS-01': 'External source blocking: Issaquah CivicAlerts returns Cloudflare challenge to non-browser fetch.',
  '03_AIR_QUALITY:ECO-01': 'Our endpoint/query defect: stale Ecology /arcgis path returned 404 and HourPriorToLatest=0 returned zero current rows.',
  '03_AIR_QUALITY:ECO-02': 'External source unavailable: documented Ecology SmokeForecast service returns ArcGIS service-not-started error.',
  '03_AIR_QUALITY:PSCAA-02': 'External/runtime network failure: burn-ban page failed in artifact and remains unreachable from runtime.',
  '03_AIR_QUALITY:AIRNOW-01': 'Credential/config blocker: API key not available to connector; no-key call returns 401.',
  '04_WILDFIRE:NIFC-01': 'Our query defect: ArcGIS query parameters produced invalid-query error; valid route-bbox query now executes.',
  '05_FLOOD_CONDITIONS:ISS-01': 'External source blocking: Issaquah flood page returns Cloudflare challenge.',
  '05_FLOOD_CONDITIONS:REDM-01': 'External/runtime network failure: Redmond ArcGIS timed out and remains unreachable from runtime.',
  '05_FLOOD_CONDITIONS:KC-ROAD-01': 'Our query defect: service requires fully-qualified fields or outFields=*; unqualified outFields failed.',
  '05_FLOOD_CONDITIONS:WSDOT-01': 'Credential/config blocker: WSDOT access code not available to connector; no-code call returns 401.',
  '06_TRAIL_INFRASTRUCTURE_STATUS:ISS-01': 'External/runtime network failure: Issaquah ArcGIS timed out and remains unreachable from runtime.',
  '06_TRAIL_INFRASTRUCTURE_STATUS:REDM-01': 'External/runtime network failure: Redmond ArcGIS timed out and remains unreachable from runtime.',
};

const emptyClassifications = {
  '03_AIR_QUALITY:AIRNOW-02': 'BENIGN LIMITATION - source works as contextual reporting-area data only.',
  '03_AIR_QUALITY:NWS-AQ-01': 'CORRECT EMPTY - no active NWS air-quality alerts in the checked scope.',
  '03_AIR_QUALITY:PSCAA-01': 'PARSER / EXTRACTION DEFECT - official pages are reachable but current canonical station snapshot is not deterministically extracted by this connector.',
  '04_WILDFIRE:NIFC-02': 'CORRECT EMPTY - healthy perimeter query returned no route-relevant wildfire perimeters.',
  '04_WILDFIRE:NWS-01': 'CORRECT EMPTY - healthy NWS alert query returned no active route fire-weather alerts.',
  '04_WILDFIRE:KC-01': 'CORRECT EMPTY - fire-safety page parsed and no active burn-ban condition was detected in this artifact.',
  '05_FLOOD_CONDITIONS:NWPS-01': 'CORRECT EMPTY - gauge is healthy; no flood-category escalation.',
  '05_FLOOD_CONDITIONS:NWPS-02': 'CORRECT EMPTY - gauge is healthy; no flood-category escalation.',
  '05_FLOOD_CONDITIONS:NWS-01': 'CORRECT EMPTY - valid empty NWS flood-alert collection.',
  '06_TRAIL_INFRASTRUCTURE_STATUS:KC-04': 'CORRECT EMPTY - bridge inventory source succeeded; no publishable lane-06 event.',
};

const repairs = [
  ['03_AIR_QUALITY:ECO-01', 'failed', 'Changed Ecology endpoint to /serverext/rest/services/AQ/... and changed latest-hour filter to HourPriorToLatest=1.', 'fresh success: 146 features', 'YES'],
  ['05_FLOOD_CONDITIONS:KC-ROAD-01', 'failed', 'Changed RoadAlerts query to outFields=* and added qualified-field parser accessor.', 'fresh success: 31 records', 'YES'],
  ['04_WILDFIRE:NIFC-01', 'failed', 'Changed WFIGS route-bbox query to valid encoded geometry and outFields=*.', 'correct empty: 0 route-bbox incidents, 594 global incidents', 'YES'],
  ['03_AIR_QUALITY:AIRNOW-01', 'failed', 'No key present locally; remote n8n API unauthorized, so workflow credential wiring cannot be verified or repaired safely.', 'BLOCKER', 'NO'],
  ['05_FLOOD_CONDITIONS:WSDOT-01', 'failed', 'No access code present locally; remote n8n API unauthorized, so workflow credential wiring cannot be verified or repaired safely.', 'BLOCKER', 'NO'],
  ['03_AIR_QUALITY:PSCAA-01', 'empty_but_valid warning', 'Investigated reachable station pages; deterministic station snapshot extraction remains unresolved.', 'PARSER / EXTRACTION DEFECT', 'PARTIAL'],
];

const afterMonitor = {
  '01_ROUTE_CONDITIONS': ['degraded', 'unchanged: REDM/ISS external failures remain'],
  '02_WEATHER': ['ok', 'unchanged'],
  '03_AIR_QUALITY': ['degraded', 'ECO-01 fixed; ECO-02, PSCAA-02, AIRNOW-01, PSCAA-01 remain'],
  '04_WILDFIRE': ['ok/projected', 'NIFC-01 fixed to correct empty; warning empties are not failures'],
  '05_FLOOD_CONDITIONS': ['degraded', 'KC-ROAD-01 fixed; ISS/REDM external and WSDOT credential blocker remain'],
  '06_TRAIL_INFRASTRUCTURE_STATUS': ['degraded', 'ISS/REDM external failures remain'],
  '07_GOVERNMENT_SAFETY_ALERTS': ['ok', 'unchanged'],
  '08_ROUTE_FACILITIES': ['ok', 'unchanged'],
};

function probeLine(name) {
  const probe = probes.find((entry) => entry.name === name);
  if (!probe) return 'not probed';
  const details = probe.json_error?.message || probe.network_error || probe.text_sample || '';
  const count = probe.feature_count ?? probe.count ?? '';
  return `${probe.ok ? 'OK' : 'FAIL'}; HTTP ${probe.http_status ?? 'network'}; count/features ${count}; ${details}`.trim();
}

function sourceRows() {
  const rows = [];
  for (const [laneId, lane] of Object.entries(workflow20.lanes)) {
    for (const source of lane.source_health_summary || []) {
      rows.push({
        monitor: laneId,
        source_id: source.source_id,
        state: source.status,
        error_count: source.error_count,
        warning_count: source.warning_count,
        root_cause: rootCauses[source.source_id] || emptyClassifications[source.source_id] || 'No defect identified from current evidence.',
        lane_state: lane.data_status,
      });
    }
  }
  return rows;
}

function mdTable(headers, rows) {
  return [
    `| ${headers.join(' |')} |`,
    `| ${headers.map(() => '---').join(' |')} |`,
    ...rows.map((row) => `| ${row.map((cell) => String(cell ?? '').replace(/\|/g, '\\|')).join(' |')} |`),
  ].join('\n');
}

const monitorRows = publicHealth.lanes.map((lane) => [
  lane.laneId,
  lane.sourceState,
  afterMonitor[lane.laneId]?.[0] || lane.sourceState,
  (workflow20.lanes[lane.laneId]?.source_health_summary || []).filter((s) => s.status === 'failed').length,
  lane.laneId === '03_AIR_QUALITY' ? 3 : lane.laneId === '04_WILDFIRE' ? 0 : lane.laneId === '05_FLOOD_CONDITIONS' ? 3 : (workflow20.lanes[lane.laneId]?.source_health_summary || []).filter((s) => s.status === 'failed').length,
  (workflow20.lanes[lane.laneId]?.source_health_summary || []).filter((s) => s.status === 'empty_but_valid').length,
  afterMonitor[lane.laneId]?.[1] || '',
]);

const sourceMatrixRows = sourceRows().map((row) => [
  row.monitor,
  row.source_id,
  row.state,
  row.error_count,
  row.warning_count,
  row.root_cause,
  row.lane_state,
]);

const repairRows = repairs.map(([source, before, fix, after, verified]) => [source, before, fix, after, verified]);

const report = `# UW-Issy Monitoring Data Quality Round 1

## Executive summary

Round 1 repaired the known local connector/config defects that could be safely fixed in the canonical workflow exports:

- ECO-01 now uses the documented Ecology endpoint family and a live-supported latest-hour filter.
- KC-ROAD-01 now uses a valid King County RoadAlerts query and parser support for fully-qualified ArcGIS field names.
- NIFC-01 now uses a valid WFIGS route-bbox query.

No health-scoring thresholds were changed.

The required remote all-8-monitor rerun is blocked: the n8n API endpoint is reachable, but all locally available API keys return unauthorized. No valid n8n CLI is installed. Therefore this report distinguishes published baseline from locally validated/projected after-state.

## Baseline 8-monitor health

${mdTable(['Monitor', 'Before state', 'After state/projected', 'Failed before', 'Failed after/projected', 'Correct empty', 'Remaining problem'], monitorRows)}

## Baseline source matrix

${mdTable(['Monitor', 'Source ID', 'Current source state', 'Error count', 'Warning count', 'Root cause', 'Lane state'], sourceMatrixRows)}

## Repairs performed

${mdTable(['Source', 'Before', 'Root cause / fix', 'After', 'Verified'], repairRows)}

## Endpoint proof

${mdTable(['Check', 'Result'], [
  ['ECO-01 old endpoint', probeLine('ECO-01 old endpoint')],
  ['ECO-01 repaired endpoint', probeLine('ECO-01 repaired endpoint')],
  ['ECO-02 documented endpoint', probeLine('ECO-02 documented endpoint')],
  ['KC-ROAD-01 old query', probeLine('KC-ROAD-01 old query')],
  ['KC-ROAD-01 repaired query', probeLine('KC-ROAD-01 repaired query')],
  ['NIFC-01 repaired route bbox query', probeLine('NIFC-01 repaired route bbox query')],
  ['NIFC-01 global count', probeLine('NIFC-01 global count')],
])}

## Credential/config findings

- AIRNOW_API_KEY present locally: ${credentials.AIRNOW_API_KEY.present ? 'yes' : 'no'}.
- WSDOT_TRAVELER_API_ACCESS_CODE present locally: ${credentials.WSDOT_TRAVELER_API_ACCESS_CODE.present ? 'yes' : 'no'}.
- n8n API reachable: yes.
- n8n API authorized with available local keys: no.
- Secret values were not recorded.

## External failures remaining

${mdTable(['Source', 'Current live result', 'Classification'], [
  ['REDM-01', probeLine('REDM-01 metadata'), 'external/runtime network limitation'],
  ['ISS-03', probeLine('ISS-03 metadata'), 'external/runtime network limitation'],
  ['ISS-01 CivicAlerts', probeLine('ISS-01 CivicAlerts'), 'Cloudflare challenge / source blocking'],
  ['ISS-01 flood page', probeLine('ISS-01 flood page'), 'Cloudflare challenge / source blocking'],
  ['ECO-02', probeLine('ECO-02 documented endpoint'), 'source unavailable'],
  ['PSCAA-02', probeLine('PSCAA-02 burn-ban page'), 'external/runtime network limitation'],
])}

## Empty_but_valid classifications

${mdTable(['Source', 'Classification'], Object.entries(emptyClassifications).map(([source, classification]) => [source, classification]))}

## Fresh full-cycle results

Fresh full-cycle n8n execution was not completed because remote n8n API authorization is blocked. Local endpoint-level repair proofs were completed for the three safe connector/query defects. The public package remains at release ${publicHealth.releaseId}.

## Before/after source table

${mdTable(['Source', 'Before', 'Fix', 'After/projected', 'Verified'], repairRows)}

## Current health-scoring-rule audit

The public \`system-health.json\` is assembled from lane-level \`sourceState\` values and Lane 20 source summaries. The current published state shows lanes marked \`degraded\` when one or more configured source checks fail. The evidence supports that a single failed source can mark a lane degraded when that failed source remains in the lane's source-health summary as \`failed\`, regardless of total source count or redundancy.

Examples:

- Wildfire is degraded in the current snapshot with one failed source identified in the current diagnosis.
- Route conditions is degraded with three failed sources out of four.

This scoring rule was not changed.

## Remaining degraded states

- Route conditions: external Redmond/Issaquah failures remain.
- Air quality: ECO-01 fixed, but ECO-02 source unavailable, PSCAA-02 unavailable, AIRNOW-01 credential blocker, and PSCAA-01 parser/extraction issue remain.
- Flood conditions: KC-ROAD-01 fixed, but Issaquah/Redmond external failures and WSDOT credential blocker remain.
- Trail infrastructure: Issaquah/Redmond external failures remain.

## Round 2 source-replacement recommendations

- Redmond source redundancy or alternate endpoint path.
- Issaquah structured replacement for Cloudflare-blocked CivicAlerts/flood HTML.
- PSCAA burn-ban/source redundancy.
- Ecology SmokeForecast alternative while service is not started.
- AirNow and WSDOT credential decision by owner.
- PSCAA-01 deterministic station API/parser research.

## Owner decisions still needed

- Provide valid n8n API access or approve another remote execution path.
- Decide whether to provision AIRNOW_API_KEY.
- Decide whether to provision WSDOT_TRAVELER_API_ACCESS_CODE.
- Decide Round 2 replacement-source priorities.
- Decide whether health scoring should remain "any failed source degrades lane" or become criticality/redundancy-aware.
`;

fs.writeFileSync(reportPath, report);
fs.writeFileSync(`${outDir}/matrices/before-after-monitor-matrix.json`, `${JSON.stringify(monitorRows, null, 2)}\n`);
fs.writeFileSync(`${outDir}/matrices/before-after-source-matrix.json`, `${JSON.stringify(repairRows, null, 2)}\n`);
fs.writeFileSync(`${outDir}/final-acceptance-summary.md`, report);
console.log(JSON.stringify({ reportPath, monitorRows: monitorRows.length, sourceRows: sourceMatrixRows.length }, null, 2));
