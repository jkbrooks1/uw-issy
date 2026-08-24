import fs from 'node:fs';

const outDir = '00_AS-BUILT/20260823-UWISSY_MONITOR_DATA_QUALITY_ROUND1';
fs.mkdirSync(`${outDir}/probes`, { recursive: true });
fs.mkdirSync(`${outDir}/matrices`, { recursive: true });

const headers = {
  'User-Agent': 'BTF-UW-Issy-monitor-round1/1.0',
  Accept: 'application/json,text/html;q=0.8,*/*;q=0.5',
};

const laneArtifactFiles = [
  ['01_ROUTE_CONDITIONS', '00_AS-BUILT/20260818-UWISSY_LANES01-07_REPORTOUT_UPGRADE/LANE01/health-status.json'],
  ['03_AIR_QUALITY', '00_AS-BUILT/20260818-UWISSY_LANES01-07_REPORTOUT_UPGRADE/LANE03/server-pulled/health-status.json'],
  ['04_WILDFIRE', '00_AS-BUILT/20260818-UWISSY_LANES01-07_REPORTOUT_UPGRADE/LANE04/server-pulled/health-status.json'],
  ['05_FLOOD_CONDITIONS', '00_AS-BUILT/20260818-UWISSY_LANES01-07_REPORTOUT_UPGRADE/LANE05/server-pulled/health-status.json'],
  ['06_TRAIL_INFRASTRUCTURE_STATUS', '00_AS-BUILT/20260818-UWISSY_LANES01-07_REPORTOUT_UPGRADE/LANE06/final-pulled/status.json'],
];

const probes = [
  ['ECO-01 old endpoint', 'https://gis.ecology.wa.gov/arcgis/rest/services/AirQualityMonitoringHourlyResults/MapServer/0/query?f=json&where=HourPriorToLatest%3D0&outFields=*&returnGeometry=true'],
  ['ECO-01 repaired endpoint', 'https://gis.ecology.wa.gov/serverext/rest/services/AQ/AirQualityMonitoringHourlyResults/MapServer/0/query?f=json&where=HourPriorToLatest%3D1&outFields=*&returnGeometry=true'],
  ['ECO-02 documented endpoint', 'https://gis.ecology.wa.gov/serverext/rest/services/AQ/SmokeForecast/MapServer/0/query?f=json&where=1%3D1&outFields=*&returnGeometry=true'],
  ['KC-ROAD-01 old query', 'https://gismaps.kingcounty.gov/arcgis/rest/services/RoadAlerts/KingCo_Road_Alerts/MapServer/0/query?where=1%3D1&outFields=ClosureName,LocationLimits,Community,ClosureReason,ClosureState,PlannedClosedDate,PlannedOpenDate&returnGeometry=false&f=json'],
  ['KC-ROAD-01 repaired query', 'https://gismaps.kingcounty.gov/arcgis/rest/services/RoadAlerts/KingCo_Road_Alerts/MapServer/0/query?where=1%3D1&outFields=*&returnGeometry=false&f=json'],
  ['KC-ROAD-01 schema', 'https://gismaps.kingcounty.gov/arcgis/rest/services/RoadAlerts/KingCo_Road_Alerts/MapServer/0?f=json'],
  ['NIFC-01 repaired route bbox query', 'https://services3.arcgis.com/T4QMspbfLg3qTGWY/ArcGIS/rest/services/WFIGS_Incident_Locations_Current/FeatureServer/0/query?where=1%3D1&geometry=-122.3057%2C47.55207%2C-122.04414%2C47.75889&geometryType=esriGeometryEnvelope&inSR=4326&spatialRel=esriSpatialRelIntersects&outFields=*&returnGeometry=true&f=json'],
  ['NIFC-01 global count', 'https://services3.arcgis.com/T4QMspbfLg3qTGWY/ArcGIS/rest/services/WFIGS_Incident_Locations_Current/FeatureServer/0/query?where=1%3D1&returnCountOnly=true&f=json'],
  ['PSCAA-01 station map', 'https://map.pscleanair.gov/'],
  ['PSCAA-01 legacy NetworkMap', 'https://secure.pscleanair.org/AirQuality/NetworkMap'],
  ['AIRNOW-01 no-key auth check', 'https://www.airnowapi.org/aq/observation/zipCode/current/?format=application/json&zipCode=98027&distance=25&API_KEY='],
  ['WSDOT-01 no-code auth check', 'https://wsdot.wa.gov/Traffic/api/HighwayAlerts/HighwayAlertsREST.svc/GetAlertsAsJson?AccessCode='],
  ['REDM-01 metadata', 'https://gis.redmond.gov/arcgis/rest/services/Traffic/Alerts/FeatureServer?f=json'],
  ['ISS-03 metadata', 'https://apps.issaquahwa.gov/server/rest/services/General_Mapservices/PWProjectsCurrentYearConstructionPublic/MapServer?f=json'],
  ['ISS-01 CivicAlerts', 'https://www.issaquahwa.gov/CivicAlerts.aspx?CID=20'],
  ['ISS-01 flood page', 'https://www.issaquahwa.gov/flood'],
  ['PSCAA-02 burn-ban page', 'https://www.pscleanair.gov/168/Air-Quality-Burn-Ban-Status'],
  ['NIFC-02 perimeter route bbox', 'https://services3.arcgis.com/T4QMspbfLg3qTGWY/ArcGIS/rest/services/WFIGS_Interagency_Perimeters_Current/FeatureServer/0/query?where=1%3D1&geometry=-122.3057,47.55207,-122.04414,47.75889&geometryType=esriGeometryEnvelope&inSR=4326&spatialRel=esriSpatialRelIntersects&returnCountOnly=true&f=json'],
  ['NWS wildfire WAZ657', 'https://api.weather.gov/alerts/active/zone/WAZ657'],
  ['KC wildfire fire safety', 'https://kingcounty.gov/en/dept/local-services/governance-leadership/local-government-for-unincorporated-king-county/fire-safety'],
  ['NWPS ISSW1', 'https://api.water.noaa.gov/nwps/v1/gauges/ISSW1'],
  ['NWPS ISQW1', 'https://api.water.noaa.gov/nwps/v1/gauges/ISQW1'],
  ['NWS flood point', 'https://api.weather.gov/alerts/active?point=47.6505,-122.3046'],
];

function readJson(path) {
  return JSON.parse(fs.readFileSync(path, 'utf8'));
}

function sourceList(data) {
  return data.source_health || data.sourceHealth || data.source_status || data.sourceStatuses || data.sources || [];
}

function publicBaseline() {
  const health = readJson('public/data/system-health.json');
  return health.lanes.map((lane) => ({
    monitor: lane.laneId,
    lane_label: lane.laneLabel,
    lane_state: lane.sourceState,
    freshness_state: lane.freshnessState,
    lkg_use: lane.usingLastKnownGood,
    event_count: lane.eventCount,
  }));
}

function detailedBaseline() {
  const rows = [];
  for (const [lane, file] of laneArtifactFiles) {
    const data = readJson(file);
    for (const source of sourceList(data)) {
      rows.push({
        monitor: lane,
        source_id: source.source_id || source.sourceId || source.id,
        source_name: source.source_name || source.sourceName || source.name,
        state: source.status || source.state || source.source_state || source.sourceState,
        error_count: source.error_count ?? source.errorCount ?? source.errors?.length ?? 0,
        warning_count: source.warning_count ?? source.warningCount ?? source.warnings?.length ?? 0,
        errors: source.errors || [],
        warnings: source.warnings || [],
        run_id: data.run_id || data.runId || data.run?.run_id || null,
        artifact: file,
      });
    }
  }
  return rows;
}

async function probe(name, url) {
  const controller = new AbortController();
  const startedAt = Date.now();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(url, { headers, signal: controller.signal, redirect: 'follow' });
    const text = await response.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch {}
    const fields = json?.fields?.map((field) => field.name);
    return {
      name,
      url,
      ok: response.ok && !json?.error,
      http_status: response.status,
      content_type: response.headers.get('content-type'),
      elapsed_ms: Date.now() - startedAt,
      json_error: json?.error || null,
      count: json?.count,
      feature_count: Array.isArray(json?.features) ? json.features.length : undefined,
      field_count: fields?.length,
      fields_sample: fields?.slice(0, 20),
      text_sample: json ? undefined : text.replace(/\s+/g, ' ').slice(0, 240),
      json_keys: json ? Object.keys(json).slice(0, 12) : undefined,
    };
  } catch (error) {
    return {
      name,
      url,
      ok: false,
      elapsed_ms: Date.now() - startedAt,
      network_error: `${error.name}: ${error.message}`,
    };
  } finally {
    clearTimeout(timer);
  }
}

const results = [];
for (const [name, url] of probes) {
  results.push(await probe(name, url));
}

const credentials = {
  AIRNOW_API_KEY: { present: Boolean(process.env.AIRNOW_API_KEY), value_recorded: false },
  WSDOT_TRAVELER_API_ACCESS_CODE: { present: Boolean(process.env.WSDOT_TRAVELER_API_ACCESS_CODE), value_recorded: false },
  N8N_API_ACCESS: { reachable: true, authorized_with_available_local_keys: false, value_recorded: false },
};

fs.writeFileSync(`${outDir}/matrices/baseline-monitor-health.json`, `${JSON.stringify(publicBaseline(), null, 2)}\n`);
fs.writeFileSync(`${outDir}/matrices/baseline-source-matrix.json`, `${JSON.stringify(detailedBaseline(), null, 2)}\n`);
fs.writeFileSync(`${outDir}/probes/live-endpoint-probes.json`, `${JSON.stringify(results, null, 2)}\n`);
fs.writeFileSync(`${outDir}/probes/credential-presence-proof.json`, `${JSON.stringify(credentials, null, 2)}\n`);

console.log(JSON.stringify({
  monitor_count: publicBaseline().length,
  detailed_source_rows: detailedBaseline().length,
  probe_count: results.length,
  failed_probes: results.filter((result) => !result.ok).length,
}, null, 2));
