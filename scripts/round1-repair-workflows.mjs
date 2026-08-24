import fs from 'node:fs';

const files = [
  '00_CONNECTORS/03_AIR_QUALITY/03_AIR_QUALITY_v1.json',
  '00_WORKFLOWS/v02.UWI_LANE03.json',
  '00_CONNECTORS/04_WILDFIRE/04_WILDFIRE_v1.json',
  '00_WORKFLOWS/v02.UWI_LANE04.json',
  '00_CONNECTORS/05_FLOOD_CONDITIONS/05_FLOOD_CONDITIONS_v1.json',
  '00_WORKFLOWS/v02.UWI_LANE05.json',
];

const replacements = [
  ["connector_id:'04_WILDFIRE'", "connector_id: '04_WILDFIRE'"],
  ["lane:'04_WILDFIRE'", "lane: '04_WILDFIRE'"],
  [
    'https://gis.ecology.wa.gov/arcgis/rest/services/AirQualityMonitoringHourlyResults/MapServer/0/query?f=json&where=HourPriorToLatest%3D0&outFields=*&returnGeometry=true',
    'https://gis.ecology.wa.gov/serverext/rest/services/AQ/AirQualityMonitoringHourlyResults/MapServer/0/query?f=json&where=HourPriorToLatest%3D1&outFields=*&returnGeometry=true',
  ],
  [
    'https://gis.ecology.wa.gov/serverext/rest/services/AQ/AirQualityMonitoringHourlyResults/MapServer/0/query?f=json&where=HourPriorToLatest%3D0&outFields=*&returnGeometry=true',
    'https://gis.ecology.wa.gov/serverext/rest/services/AQ/AirQualityMonitoringHourlyResults/MapServer/0/query?f=json&where=HourPriorToLatest%3D1&outFields=*&returnGeometry=true',
  ],
  [
    'https://gis.ecology.wa.gov/arcgis/rest/services/SmokeForecast/MapServer/0/query?f=json&where=1%3D1&outFields=*&returnGeometry=true',
    'https://gis.ecology.wa.gov/serverext/rest/services/AQ/SmokeForecast/MapServer/0/query?f=json&where=1%3D1&outFields=*&returnGeometry=true',
  ],
  [
    'https://gismaps.kingcounty.gov/arcgis/rest/services/RoadAlerts/KingCo_Road_Alerts/MapServer/0/query?where=1%3D1&outFields=ClosureName,LocationLimits,Community,ClosureReason,ClosureState,PlannedClosedDate,PlannedOpenDate&returnGeometry=true&f=json',
    'https://gismaps.kingcounty.gov/arcgis/rest/services/RoadAlerts/KingCo_Road_Alerts/MapServer/0/query?where=1%3D1&outFields=*&returnGeometry=true&f=json',
  ],
  [
    'where=1%3D1&geometry=-122.3057,47.55207,-122.04414,47.75889&geometryType=esriGeometryEnvelope&inSR=4326&spatialRel=esriSpatialRelIntersects&outFields=IncidentName,IncidentTypeCategory,InitialLatitude,InitialLongitude,FireDiscoveryDateTime,ModifiedOnDateTime_dt,POOState,UniqueFireIdentifier,PercentContained,IncidentSize,DailyAcres,FireCause,GACC&returnGeometry=true&f=json',
    'where=1%3D1&geometry=-122.3057%2C47.55207%2C-122.04414%2C47.75889&geometryType=esriGeometryEnvelope&inSR=4326&spatialRel=esriSpatialRelIntersects&outFields=*&returnGeometry=true&f=json',
  ],
];

const attrReplacements = [
  ['attrs.AlertName || attrs.ClosureName || attrs.AlertTitle || attrs.AlertDescription || attrs.LocationDescription || attrs.LocationLimits || attrs.TrafficImpactDescription || attrs.ClosureReason || attrs.GovDeliverySubject || attrs.GovDeliveryMessage', "getAttr('AlertName') || getAttr('ClosureName') || getAttr('AlertTitle') || getAttr('AlertDescription') || getAttr('LocationDescription') || getAttr('LocationLimits') || getAttr('TrafficImpactDescription') || getAttr('ClosureReason') || getAttr('GovDeliverySubject') || getAttr('GovDeliveryMessage')"],
  ['attrs.AlertStartDate || attrs.StartTime || attrs.startDate || attrs.LastUpdatedTime || attrs.AlertDate || run.generated_at', "getAttr('AlertStartDate') || getAttr('StartTime') || getAttr('startDate') || getAttr('LastUpdatedTime') || getAttr('AlertDate') || run.generated_at"],
  ["attrs.AlertName || attrs.ClosureName || attrs.AlertTitle || 'Flood-related closure supplement'", "getAttr('AlertName') || getAttr('ClosureName') || getAttr('AlertTitle') || 'Flood-related closure supplement'"],
  ['attrs.TrafficImpactDescription || attrs.ClosureReason || attrs.AlertDescription || text', "getAttr('TrafficImpactDescription') || getAttr('ClosureReason') || getAttr('AlertDescription') || text"],
  ['attrs.AlertID || attrs.OBJECTID || attrs.AlertTitle || attrs.ClosureName || null', "getAttr('AlertID') || getAttr('OBJECTID') || getAttr('AlertTitle') || getAttr('ClosureName') || null"],
  ['attrs.AlertEndDate || attrs.PlannedOpenDate || attrs.EndTime || null', "getAttr('AlertEndDate') || getAttr('PlannedOpenDate') || getAttr('EndTime') || null"],
  ['attrs.AlertStatus || attrs.ClosureState || null', "getAttr('AlertStatus') || getAttr('ClosureState') || null"],
  ["attrs.LocationDescription || attrs.LocationLimits || attrs.Community || attrs.AlertName || 'Route-relevant location'", "getAttr('LocationDescription') || getAttr('LocationLimits') || getAttr('Community') || getAttr('AlertName') || 'Route-relevant location'"],
  ["String(attrs.AlertStatus || attrs.ClosureState || 'active').toLowerCase()", "String(getAttr('AlertStatus') || getAttr('ClosureState') || 'active').toLowerCase()"],
];

function replaceAll(text, from, to) {
  return text.split(from).join(to);
}

function patchValue(value, file) {
  if (typeof value === 'string') {
    let next = value;
    for (const [from, to] of replacements) next = replaceAll(next, from, to);

    if ((file.includes('05_FLOOD_CONDITIONS') || file.includes('LANE05')) && next.includes("source_id: '05_FLOOD_CONDITIONS:KC-ROAD-01'")) {
      const line = 'const attrs = feature?.attributes || feature || {};';
      const accessor = `const attrs = feature?.attributes || feature || {};
    const getAttr = (...names) => {
      for (const name of names) {
        if (attrs[name] !== undefined && attrs[name] !== null && attrs[name] !== '') return attrs[name];
        const suffix = Object.keys(attrs).find((key) => key === name || key.endsWith('.' + name));
        if (suffix && attrs[suffix] !== undefined && attrs[suffix] !== null && attrs[suffix] !== '') return attrs[suffix];
      }
      return undefined;
    };`;
      if (!next.includes('const getAttr = (...names)')) next = next.replace(line, accessor);
      for (const [from, to] of attrReplacements) next = replaceAll(next, from, to);
    }

    return next;
  }
  if (Array.isArray(value)) return value.map((entry) => patchValue(entry, file));
  if (value && typeof value === 'object') {
    for (const key of Object.keys(value)) value[key] = patchValue(value[key], file);
  }
  return value;
}

for (const file of files) {
  const before = fs.readFileSync(file, 'utf8');
  const parsed = JSON.parse(before);
  const patched = patchValue(parsed, file);
  const after = JSON.stringify(patched, null, 2);
  JSON.parse(after);
  if (after !== before) {
    fs.writeFileSync(file, `${after}\n`);
    console.log(`updated ${file}`);
  } else {
    console.log(`unchanged ${file}`);
  }
}
