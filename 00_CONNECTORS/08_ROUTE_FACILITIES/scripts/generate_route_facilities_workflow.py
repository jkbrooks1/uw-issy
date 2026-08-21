#!/usr/bin/env python3
"""Generate the 08_ROUTE_FACILITIES n8n workflow JSON from a single source of truth.

Run: python3 generate_route_facilities_workflow.py
Writes:
  00_CONNECTORS/08_ROUTE_FACILITIES/08_ROUTE_FACILITIES_v1.json
  00_WORKFLOWS/v0001.08_ROUTE_FACILITIESConnector.n8n.workflow.json
"""
import json
import os

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
CONNECTOR_DIR = os.path.join(REPO_ROOT, "00_CONNECTORS", "08_ROUTE_FACILITIES")
WORKFLOWS_DIR = os.path.join(REPO_ROOT, "00_WORKFLOWS")

WORKFLOW_NAME = "v0001.08_RouteFacilitiesConnector"
WORKFLOW_ID = "uwIssy08RouteFacilities"

ROUTE_SECTIONS_JS = """[
  {"route_section_id":"01_uw_u_district","route_section_name":"UW / U-District"},
  {"route_section_id":"02_burke_gilman_seattle","route_section_name":"Burke-Gilman - Seattle"},
  {"route_section_id":"03_burke_gilman_north_lake_wa_kenmore","route_section_name":"Burke-Gilman - north Lake WA/Kenmore"},
  {"route_section_id":"04_burke_gilman_connector_bothell","route_section_name":"Burke-Gilman/connector - Bothell"},
  {"route_section_id":"05_sammamish_river_trail_bothell_woodinville","route_section_name":"Sammamish River Trail - Bothell/Woodinville"},
  {"route_section_id":"06_sammamish_river_trail_redmond","route_section_name":"Sammamish River Trail - Redmond"},
  {"route_section_id":"07_marymoor_park","route_section_name":"Marymoor Park"},
  {"route_section_id":"08_east_lake_sammamish_trail_redmond","route_section_name":"East Lake Sammamish Trail - Redmond"},
  {"route_section_id":"09_east_lake_sammamish_trail_sammamish","route_section_name":"East Lake Sammamish Trail - Sammamish"},
  {"route_section_id":"10_issaquah_approach_terminus","route_section_name":"Issaquah approach / terminus"}
]"""

# Real coordinates and real computed route_distance_km from
# scripts/compute-facility-route-distances.py (see 00_PROJECT_BUILDLOG.md,
# 2026-08-03 21:55:09 UTC entry). tier is 'publish' or 'exception_review' -
# facilities that were excluded per that entry are not present here at all.
FACILITIES = [
    dict(id="matthews_beach_bathhouse", name="Matthews Beach Bathhouse", agency="Seattle Parks and Recreation",
         lon=-122.273312, lat=47.696373, source="SEA-01", route_section_ids=["02_burke_gilman_seattle"],
         route_distance_km=0.161, tier="publish", has_water_fill=None, has_water_fill_source=None, notes=None),
    dict(id="pathways_park", name="Pathways Park", agency="Seattle Parks and Recreation",
         lon=-122.281052, lat=47.667397, source="SEA-01", route_section_ids=["01_uw_u_district"],
         route_distance_km=0.096, tier="publish", has_water_fill=None, has_water_fill_source=None, notes=None),
    dict(id="ravenna_park_lower_sh", name="Ravenna Park Lower SH", agency="Seattle Parks and Recreation",
         lon=-122.302920, lat=47.669220, source="SEA-01", route_section_ids=["01_uw_u_district"],
         route_distance_km=0.363, tier="publish", has_water_fill=None, has_water_fill_source=None, notes=None),
    dict(id="tracy_owen_station_log_boom_park", name="Tracy Owen Station / Log Boom Park", agency="City of Kenmore",
         lon=-122.26519773951055, lat=47.757809491886199, source="KC-01", route_section_ids=["03_burke_gilman_north_lake_wa_kenmore"],
         route_distance_km=0.022, tier="publish", has_water_fill=None, has_water_fill_source=None,
         notes="Rider-confirmed: \"excellent bathroom stop on trail.\""),
    dict(id="blyth_park", name="Blyth Park", agency="City of Bothell",
         lon=-122.20894995246699, lat=47.750530002208684, source="KC-01", route_section_ids=["04_burke_gilman_connector_bothell"],
         route_distance_km=0.136, tier="publish", has_water_fill=None, has_water_fill_source=None,
         notes="Rider-confirmed reachable; \"a little off\" the Burke-Gilman/Sammamish River Trail line."),
    dict(id="park_at_bothell_landing", name="Park at Bothell Landing", agency="City of Bothell",
         lon=-122.20721796131076, lat=47.758235518921872, source="KC-01", route_section_ids=["04_burke_gilman_connector_bothell"],
         route_distance_km=0.078, tier="publish", has_water_fill=None, has_water_fill_source=None,
         notes="Rider-confirmed: restrooms near the trail crossing."),
    dict(id="wilmot_gateway_park", name="Wilmot Gateway Park", agency="City of Woodinville",
         lon=-122.16660421621036, lat=47.753421964267062, source="KC-01", route_section_ids=["05_sammamish_river_trail_bothell_woodinville"],
         route_distance_km=0.016, tier="publish", has_water_fill=None, has_water_fill_source=None,
         notes="Rider-confirmed: \"excellent option on the trail.\""),
    dict(id="northshore_athletic_fields", name="Northshore Athletic Fields", agency="King County Parks and Recreation",
         lon=-122.146, lat=47.735, source="KC-01", route_section_ids=["06_sammamish_river_trail_redmond"],
         route_distance_km=0.019, tier="publish", has_water_fill=True,
         has_water_fill_source="Rider testimony (project owner, direct riding experience) - not confirmed by an official source.",
         notes=None),
    dict(id="marymoor_pt2", name="Marymoor Park - Restroom (pt2)", agency="King County Parks and Recreation",
         lon=-122.106, lat=47.661, source="KC-01", route_section_ids=["07_marymoor_park"],
         route_distance_km=0.020, tier="publish", has_water_fill=None, has_water_fill_source=None, notes=None),
    dict(id="marymoor_pt5", name="Marymoor Park - Restroom (pt5)", agency="King County Parks and Recreation",
         lon=-122.126, lat=47.664, source="KC-01", route_section_ids=["07_marymoor_park"],
         route_distance_km=0.064, tier="publish", has_water_fill=None, has_water_fill_source=None, notes=None),
    dict(id="marymoor_pt3", name="Marymoor Park - Restroom (pt3)", agency="King County Parks and Recreation",
         lon=-122.113, lat=47.665, source="KC-01", route_section_ids=["07_marymoor_park"],
         route_distance_km=0.116, tier="publish", has_water_fill=None, has_water_fill_source=None, notes=None),
    dict(id="marymoor_pt4_best_concessions", name="Marymoor Park - Restroom (pt4, best / concessions bldg)",
         agency="King County Parks and Recreation", lon=-122.114, lat=47.665, source="KC-01",
         route_section_ids=["07_marymoor_park"], route_distance_km=0.105, tier="publish",
         has_water_fill=None, has_water_fill_source=None,
         notes="Rider-recommended best restroom in the park - co-located with concessions, near the main ballfields, ~200 yards west of the velodrome (triangulated, see 00_PROJECT_BUILDLOG.md 2026-08-03 21:04:52 UTC)."),
    dict(id="marymoor_pt7", name="Marymoor Park - Restroom (pt7)", agency="King County Parks and Recreation",
         lon=-122.121, lat=47.665, source="KC-01", route_section_ids=["07_marymoor_park"],
         route_distance_km=0.105, tier="publish", has_water_fill=None, has_water_fill_source=None, notes=None),
    dict(id="marymoor_pt1", name="Marymoor Park - Restroom (pt1)", agency="King County Parks and Recreation",
         lon=-122.119, lat=47.662, source="KC-01", route_section_ids=["07_marymoor_park"],
         route_distance_km=0.229, tier="publish", has_water_fill=None, has_water_fill_source=None, notes=None),
    dict(id="marymoor_pt6", name="Marymoor Park - Restroom (pt6)", agency="King County Parks and Recreation",
         lon=-122.121, lat=47.666, source="KC-01", route_section_ids=["07_marymoor_park"],
         route_distance_km=0.215, tier="publish", has_water_fill=None, has_water_fill_source=None, notes=None),
    dict(id="marymoor_pt8", name="Marymoor Park - Restroom (pt8)", agency="King County Parks and Recreation",
         lon=-122.117, lat=47.663, source="KC-01", route_section_ids=["07_marymoor_park"],
         route_distance_km=0.141, tier="publish", has_water_fill=None, has_water_fill_source=None, notes=None),
    dict(id="marymoor_pt9", name="Marymoor Park - Restroom (pt9)", agency="King County Parks and Recreation",
         lon=-122.117, lat=47.661, source="KC-01", route_section_ids=["07_marymoor_park"],
         route_distance_km=0.349, tier="publish", has_water_fill=None, has_water_fill_source=None, notes=None),
    dict(id="sixty_acres_park", name="Sixty Acres Park (park access point - reduced confidence)",
         agency="King County Parks and Recreation (LWYSA-operated)", lon=-122.140898, lat=47.704065, source="KC-01-fallback",
         route_section_ids=["06_sammamish_river_trail_redmond"], route_distance_km=0.141, tier="publish",
         has_water_fill=True,
         has_water_fill_source="Rider testimony (project owner, direct riding experience) - not confirmed by an official source.",
         notes="No official restroom-type GIS record exists for this park; coordinate is the park's official access point, not a building-specific restroom coordinate. Restroom's real-world existence is credible (park confirmation + independent secondary corroboration + rider testimony) but not officially source-confirmed. See 00_PROJECT_BUILDLOG.md 2026-08-03 21:00:14 UTC entry, item 4."),
    # Exception-review tier: real coordinate, exceeds the 500m default corridor radius,
    # no disqualifying rider testimony recorded either - held, not auto-published, not deleted.
    dict(id="rhododendron_park", name="Rhododendron Park", agency="City of Kenmore",
         lon=-122.24839166194674, lat=47.751931177043566, source="KC-01", route_section_ids=["03_burke_gilman_north_lake_wa_kenmore"],
         route_distance_km=0.654, tier="exception_review", has_water_fill=None, has_water_fill_source=None,
         notes="Exceeds the 500m default corridor radius (real computed distance). No rider testimony either confirming or disqualifying practicality. Held at exception-review tier pending project owner review, not silently published or dropped."),
    dict(id="ravenna_park_upper_cs", name="Ravenna Park Upper CS", agency="Seattle Parks and Recreation",
         lon=-122.305605, lat=47.671526, source="SEA-01", route_section_ids=["01_uw_u_district"],
         route_distance_km=0.682, tier="exception_review", has_water_fill=None, has_water_fill_source=None,
         notes="Exceeds the 500m default corridor radius (real computed distance). Officially open per Seattle Parks live feed; not among the rider's confirmed practical trail stops. Held at exception-review tier."),
    dict(id="laurelhurst_playfield", name="Laurelhurst Playfield / CC", agency="Seattle Parks and Recreation",
         lon=-122.277867, lat=47.659076, source="SEA-01", route_section_ids=["02_burke_gilman_seattle"],
         route_distance_km=0.768, tier="exception_review", has_water_fill=None, has_water_fill_source=None,
         notes="Exceeds the 500m default corridor radius (real computed distance). Disclosed rider tension: officially open and within the University-Village-to-Kenmore stretch, but not among the rider's named three practical stops. Held at exception-review tier, see 00_PROJECT_BUILDLOG.md 2026-08-03 20:46:25 UTC entry."),
]

SEA01_URL = "https://services.arcgis.com/ZOyb2t4B0UYuYNYH/arcgis/rest/services/Parks_Restrooms/FeatureServer/0/query?where=1%3D1&outFields=*&f=json&outSR=4326"
KC01_URL = "https://gismaps.kingcounty.gov/arcgis/rest/services/Parks/KingCo_ParksAndTrails/MapServer/3/query?where=F_Type+LIKE+%27%25Restroom%25%27&outFields=*&f=json&outSR=4326"


def facility_configs_js():
    entries = []
    for f in FACILITIES:
        entries.append(
            "  %s: {\n"
            "    facility_id: %s,\n"
            "    name: %s,\n"
            "    agency: %s,\n"
            "    latitude: %s,\n"
            "    longitude: %s,\n"
            "    source_id: %s,\n"
            "    route_section_ids: %s,\n"
            "    route_method: 'point_to_route_distance',\n"
            "    route_distance_km: %s,\n"
            "    tier: %s,\n"
            "    has_water_fill: %s,\n"
            "    has_water_fill_source: %s,\n"
            "    notes: %s\n"
            "  }" % (
                json.dumps(f["id"]),
                json.dumps(f["id"]),
                json.dumps(f["name"]),
                json.dumps(f["agency"]),
                json.dumps(f["lat"]),
                json.dumps(f["lon"]),
                json.dumps("08_ROUTE_FACILITIES:" + f["source"]),
                json.dumps(f["route_section_ids"]),
                json.dumps(f["route_distance_km"]),
                json.dumps(f["tier"]),
                json.dumps(f["has_water_fill"]),
                json.dumps(f["has_water_fill_source"]),
                json.dumps(f["notes"]),
            )
        )
    return "{\n" + ",\n".join(entries) + "\n}"


INIT_METADATA_JS = """
const now = new Date();
const runStamp = now.toISOString().replace(/[-:]/g, '').replace(/\\.\\d{3}Z$/, 'Z');
const runId = '08_ROUTE_FACILITIES-' + runStamp + '-001';
const routeSections = %(routeSections)s;
const facilityConfigs = %(facilityConfigs)s;
return [{
  json: {
    schema_version: '1.0.0',
    connector_id: '08_ROUTE_FACILITIES',
    connector_name: 'UW-Issaquah Route Facilities Connector',
    connector_version: 'v0001',
    lane: '08_ROUTE_FACILITIES',
    workflow_name: '%(workflowName)s',
    run_id: runId,
    run_stamp: runStamp,
    generated_at: now.toISOString(),
    published_at: null,
    output_root: '/files/uw-issy-connectors',
    canonical_gpx: 'data/route/UnivWA-Issaquah.gpx',
    manifest_ref: {
      manifest_id: '08_ROUTE_FACILITIES-v0001',
      schema_version: '1.0.0'
    },
    route_sections: routeSections,
    facility_configs: facilityConfigs,
    freshness_policy: {
      sea01_minutes: 1440,
      kc01_minutes: 1440
    },
    route_filter_policy: {
      default_radius_km: 0.5,
      exception_path: 'documented reason + true distance shown, no automatic inclusion beyond default radius',
      geometry_requires_line_buffer_intersection: true
    },
    coverage_limitations: [
      'No coordinate-bearing candidate exists yet for the East Lake Sammamish Trail / Sammamish / Issaquah stretch (route sections 08-10); Sammamish Landing Park, Lake Sammamish State Park, Confluence Park, and Redmond City Hall trailside restroom remain address/map-position-only and are not ingested by this connector version.',
      'Woodin Creek Park (Woodinville) has a confirmed park but no source that itself states a restroom exists; not ingested.',
      'King County GIS source (KC-01) has no live open/closed status or hours field of any kind; all KC-01-sourced facilities are structurally status_unknown by source design, not a connector defect.',
      'Water-refill capability is confirmed only where a source (including direct rider testimony) explicitly states it; all other facilities carry has_water_fill: null (unknown), not false.'
    ],
    facility_type: 'restroom'
  }
}];
""" % {
    "routeSections": ROUTE_SECTIONS_JS,
    "facilityConfigs": facility_configs_js(),
    "workflowName": WORKFLOW_NAME,
}

READ_LKG_PARAMS = {
    "operation": "read",
    "options": {},
    "fileSelector": "={{ $('Initialize Run Metadata').first().json.output_root }}/last_known_good/08_ROUTE_FACILITIES/current.json"
}

PARSE_LKG_JS = """
const lkgItem = $input.first();
let bySource = {};
let byFacility = {};
try {
  const binary = lkgItem.binary && lkgItem.binary.data;
  if (binary) {
    const text = Buffer.isBuffer(binary.data) ? binary.data.toString('utf8') : Buffer.from(binary.data, 'base64').toString('utf8');
    const parsed = JSON.parse(text);
    for (const obs of (parsed.observations || [])) {
      if (obs && obs.details && obs.details.facility_id) byFacility[obs.details.facility_id] = obs;
    }
    for (const sh of (parsed.source_health || [])) {
      if (sh && sh.source_id) bySource[sh.source_id] = sh;
    }
  }
} catch (e) {
  // No usable LKG yet - first run, or LKG file not present. Not an error.
}
return [{ json: { bySource, byFacility } }];
"""


def fetch_node(node_id, name, url, notes):
    return {
        "id": node_id,
        "name": name,
        "type": "n8n-nodes-base.httpRequest",
        "typeVersion": 4.2,
        "position": [0, 0],
        "parameters": {
            "method": "GET",
            "url": "=" + url,
            "responseFormat": "json",
            "options": {"timeout": 30000}
        },
        "onError": "continueRegularOutput",
        "notes": notes,
    }


def land_raw_js(source_id, source_name, source_url, fetch_node_name):
    return """
const run = $('Initialize Run Metadata').first().json;
const fetch = $('%(fetchNode)s').first().json || {};
const body = fetch.body !== undefined ? fetch.body : fetch;
const bodyText = typeof body === 'string' ? body : JSON.stringify(body ?? null);
const statusCode = fetch.statusCode ?? fetch.status ?? null;
const hashString = (input) => { let hash = 2166136261; for (let i = 0; i < input.length; i++) { hash ^= input.charCodeAt(i); hash = Math.imul(hash, 16777619); } return (hash >>> 0).toString(16).padStart(8, '0'); };
const contentHash = 'hash_' + hashString(bodyText);
const filePath = run.output_root + '/raw/08_ROUTE_FACILITIES/landings/%(sourceIdShort)s_landing_' + run.run_stamp + '.json';
const landing = {
  schema_version: '1.0.0',
  connector_id: run.connector_id,
  source_id: %(sourceIdJson)s,
  source_name: %(sourceNameJson)s,
  source_url: %(sourceUrlJson)s,
  retrieved_at: run.generated_at,
  http_status: statusCode,
  content_hash: contentHash,
  body_length: bodyText.length,
  fetch_status: fetch.error ? 'failed' : 'ok',
  body: body
};
if (fetch.error) landing.error_message = String(fetch.error.message || fetch.error);
const buffer = Buffer.from(JSON.stringify(landing, null, 2), 'utf8');
const binary = await this.helpers.prepareBinaryData(buffer, filePath.split('/').pop(), 'application/json');
return [{ json: { file_path: filePath, source_id: landing.source_id, source_name: landing.source_name, content_hash: contentHash, retrieved_at: run.generated_at, fetch_status: landing.fetch_status, error_message: landing.error_message || null }, binary: { data: binary } }];
""" % {
        "fetchNode": fetch_node_name,
        "sourceIdShort": source_id.split(":")[-1],
        "sourceIdJson": json.dumps(source_id),
        "sourceNameJson": json.dumps(source_name),
        "sourceUrlJson": json.dumps(source_url),
    }


NORMALIZE_SEA01_JS = """
const run = $('Initialize Run Metadata').first().json;
const fetch = $('Fetch SEA-01 Seattle Parks Restrooms Feed').first().json || {};
const landing = $('Land SEA-01 Raw Payload').first().json || {};
const lkg = $('Parse Last Known Good').first().json || { byFacility: {} };
const liveFailed = !!fetch.error;
const raw = fetch.body !== undefined ? fetch.body : fetch;
const features = Array.isArray(raw && raw.features) ? raw.features : [];

const haversineMeters = (lat1, lon1, lat2, lon2) => {
  const R = 6371000;
  const toRad = (d) => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
};

const MATCH_RADIUS_M = 120;
const facilityConfigs = run.facility_configs || {};
const seaFacilities = Object.values(facilityConfigs).filter((f) => f.source_id === '08_ROUTE_FACILITIES:SEA-01');

const mapStatus = (attrs) => {
  const cs = (attrs.CURRENTSTATUS || '').toString().trim().toUpperCase();
  if (cs === 'OPEN') return 'open';
  if (cs === 'CLOSED') return 'closed';
  return 'status_unknown';
};

const observations = [];
const matchedIds = [];
for (const facility of seaFacilities) {
  let bestFeature = null;
  let bestDist = Infinity;
  for (const feature of features) {
    const geom = feature.geometry || {};
    const flat = typeof geom.y === 'number' ? geom.y : null;
    const flon = typeof geom.x === 'number' ? geom.x : null;
    if (flat === null || flon === null) continue;
    const d = haversineMeters(facility.latitude, facility.longitude, flat, flon);
    if (d < bestDist) { bestDist = d; bestFeature = feature; }
  }
  const matched = bestFeature && bestDist <= MATCH_RADIUS_M && !liveFailed;
  const attrs = matched ? (bestFeature.attributes || {}) : {};
  if (matched) matchedIds.push(facility.facility_id);
  const lkgObs = (lkg.byFacility || {})[facility.facility_id];
  const status = matched ? mapStatus(attrs) : (lkgObs ? lkgObs.details.status : 'status_unknown');
  observations.push({
    observation_id: '08_ROUTE_FACILITIES:' + facility.facility_id,
    observation_type: 'route_facility',
    title: facility.name,
    summary: facility.name + ' - ' + status + (facility.tier === 'exception_review' ? ' (exception-review tier: exceeds default 500m corridor radius)' : ''),
    source_id: facility.source_id,
    observed_at: run.generated_at,
    route_section_ids: facility.route_section_ids,
    details: {
      facility_id: facility.facility_id,
      facility_type: 'restroom',
      agency: facility.agency,
      status: status,
      status_fields_raw: matched ? {
        CURRENTSTATUS: attrs.CURRENTSTATUS ?? null,
        OPENTOPUBLIC: attrs.OPENTOPUBLIC ?? null,
        SEASON: attrs.SEASON ?? null,
        HOURS: attrs.HOURS ?? null,
        RSNCLOSED: attrs.RSNCLOSED ?? null,
        DAILYLOCKSTATUS: attrs.DAILYLOCKSTATUS ?? null
      } : null,
      has_water_fill: facility.has_water_fill,
      has_water_fill_source: facility.has_water_fill_source,
      tier: facility.tier,
      coordinates: { latitude: facility.latitude, longitude: facility.longitude },
      route_relevance: {
        method: facility.route_method,
        distance_km: facility.route_distance_km,
        confidence: 'high',
        reason: facility.tier === 'publish'
          ? 'Real point-to-route-polyline distance computed against public/routes/UnivWA-Issaquah.geojson; within the 500m default corridor radius.'
          : 'Real point-to-route-polyline distance computed against public/routes/UnivWA-Issaquah.geojson; exceeds the 500m default corridor radius, no exception basis recorded - held at exception-review tier per the task\\'s documented exception path.'
      },
      notes: facility.notes,
      live_match_found: matched,
      live_match_distance_m: matched ? Math.round(bestDist) : null,
      used_last_known_good: !matched && !!lkgObs
    }
  });
}

const sourceHealth = {
  schema_version: '1.0.0',
  connector_id: run.connector_id,
  source_id: '08_ROUTE_FACILITIES:SEA-01',
  source_name: 'Seattle Parks and Recreation - Park Restrooms (live GIS FeatureServer)',
  status: liveFailed ? 'failed' : (features.length ? 'ok' : 'empty_but_valid'),
  retrieved_at: run.generated_at,
  stale_after_minutes: run.freshness_policy.sea01_minutes,
  record_count: features.length,
  http_status: fetch.statusCode ?? fetch.status ?? null,
  last_observation_at: run.generated_at,
  warnings: matchedIds.length < seaFacilities.length ? ['Matched ' + matchedIds.length + ' of ' + seaFacilities.length + ' configured SEA-01 facilities within ' + MATCH_RADIUS_M + 'm this run; unmatched facilities fell back to last-known-good status or status_unknown.'] : [],
  errors: liveFailed ? [String(fetch.error.message || fetch.error)] : []
};

return [{
  json: {
    source_id: '08_ROUTE_FACILITIES:SEA-01',
    source_health: sourceHealth,
    observations,
    raw_landing_path: landing.file_path || null
  }
}];
"""

NORMALIZE_KC01_JS = """
const run = $('Initialize Run Metadata').first().json;
const fetch = $('Fetch KC-01 King County Facilities Restrooms').first().json || {};
const landing = $('Land KC-01 Raw Payload').first().json || {};
const lkg = $('Parse Last Known Good').first().json || { byFacility: {} };
const liveFailed = !!fetch.error;
const raw = fetch.body !== undefined ? fetch.body : fetch;
const features = Array.isArray(raw && raw.features) ? raw.features : [];

const haversineMeters = (lat1, lon1, lat2, lon2) => {
  const R = 6371000;
  const toRad = (d) => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
};

const MATCH_RADIUS_M = 120;
const facilityConfigs = run.facility_configs || {};
const kcFacilities = Object.values(facilityConfigs).filter((f) => f.source_id === '08_ROUTE_FACILITIES:KC-01');

const observations = [];
const matchedIds = [];
for (const facility of kcFacilities) {
  let bestFeature = null;
  let bestDist = Infinity;
  for (const feature of features) {
    const geom = feature.geometry || {};
    const flat = typeof geom.y === 'number' ? geom.y : null;
    const flon = typeof geom.x === 'number' ? geom.x : null;
    if (flat === null || flon === null) continue;
    const d = haversineMeters(facility.latitude, facility.longitude, flat, flon);
    if (d < bestDist) { bestDist = d; bestFeature = feature; }
  }
  const matched = bestFeature && bestDist <= MATCH_RADIUS_M && !liveFailed;
  const attrs = matched ? (bestFeature.attributes || {}) : {};
  if (matched) matchedIds.push(facility.facility_id);
  observations.push({
    observation_id: '08_ROUTE_FACILITIES:' + facility.facility_id,
    observation_type: 'route_facility',
    title: facility.name,
    summary: facility.name + ' - status_unknown (source has no live open/closed or hours field)' + (facility.tier === 'exception_review' ? ' (exception-review tier: exceeds default 500m corridor radius)' : ''),
    source_id: facility.source_id,
    observed_at: run.generated_at,
    route_section_ids: facility.route_section_ids,
    details: {
      facility_id: facility.facility_id,
      facility_type: 'restroom',
      agency: facility.agency,
      status: 'status_unknown',
      status_fields_raw: matched ? { F_Name: attrs.F_Name ?? null, F_Type: attrs.F_Type ?? null, SiteName: attrs.SiteName ?? null, Owner: attrs.Owner ?? null } : null,
      status_reason: 'King County GIS Facilities layer (KC-01) carries no open/closed/hours field of any kind for any facility type - this is a real source limitation, not a connector defect.',
      has_water_fill: facility.has_water_fill,
      has_water_fill_source: facility.has_water_fill_source,
      tier: facility.tier,
      coordinates: { latitude: facility.latitude, longitude: facility.longitude },
      route_relevance: {
        method: facility.route_method,
        distance_km: facility.route_distance_km,
        confidence: facility.source_id.endsWith('fallback') ? 'medium' : 'high',
        reason: facility.tier === 'publish'
          ? 'Real point-to-route-polyline distance computed against public/routes/UnivWA-Issaquah.geojson; within the 500m default corridor radius.'
          : 'Real point-to-route-polyline distance computed against public/routes/UnivWA-Issaquah.geojson; exceeds the 500m default corridor radius, no exception basis recorded - held at exception-review tier per the task\\'s documented exception path.'
      },
      notes: facility.notes,
      live_match_found: matched,
      live_match_distance_m: matched ? Math.round(bestDist) : null,
      used_last_known_good: false
    }
  });
}

const sourceHealth = {
  schema_version: '1.0.0',
  connector_id: run.connector_id,
  source_id: '08_ROUTE_FACILITIES:KC-01',
  source_name: 'King County DNRP Parks - KingCo_ParksAndTrails Facilities layer (F_Type=Restroom)',
  status: liveFailed ? 'failed' : (features.length ? 'ok' : 'empty_but_valid'),
  retrieved_at: run.generated_at,
  stale_after_minutes: run.freshness_policy.kc01_minutes,
  record_count: features.length,
  http_status: fetch.statusCode ?? fetch.status ?? null,
  last_observation_at: run.generated_at,
  warnings: matchedIds.length < kcFacilities.length ? ['Matched ' + matchedIds.length + ' of ' + kcFacilities.length + ' configured KC-01 facilities within ' + MATCH_RADIUS_M + 'm this run (Sixty Acres Park is expected to structurally never match - it uses a park-access-point fallback coordinate, not a restroom-type GIS record).'] : [],
  errors: liveFailed ? [String(fetch.error.message || fetch.error)] : []
};

return [{
  json: {
    source_id: '08_ROUTE_FACILITIES:KC-01',
    source_health: sourceHealth,
    observations,
    raw_landing_path: landing.file_path || null
  }
}];
"""

AGGREGATE_JS = """
const run = $('Initialize Run Metadata').first().json;
const inputs = $input.all().map(item => item.json || {});
const observations = inputs.flatMap(item => Array.isArray(item.observations) ? item.observations : []);
const sourceHealth = inputs.map(item => item.source_health).filter(Boolean);
const sourceIds = inputs.map(item => item.source_id).filter(Boolean);
const sourcePayloadRefs = inputs.map(item => item.raw_landing_path).filter(Boolean);
return [{
  json: {
    schema_version: run.schema_version,
    connector_id: run.connector_id,
    connector_name: run.connector_name,
    connector_version: run.connector_version,
    lane: run.lane,
    run_id: run.run_id,
    run_stamp: run.run_stamp,
    generated_at: run.generated_at,
    published_at: null,
    output_root: run.output_root,
    canonical_gpx: run.canonical_gpx,
    manifest_ref: run.manifest_ref,
    route_sections: run.route_sections,
    coverage_limitations: run.coverage_limitations,
    source_health: sourceHealth,
    events: [],
    observations: observations,
    provenance: {
      source_ids_used: sourceIds,
      route_gpx_ref: run.canonical_gpx,
      source_payload_refs: sourcePayloadRefs,
      normalization_notes: ['Facilities are never emitted as events[] - route_facility observations only, per the hard project rule that restroom/facility status must never be represented as a route-alert class.']
    }
  }
}];
"""

DEDUPE_JS = """
const input = $input.first().json;
const seen = new Map();
const deduplicatedObservations = [];
const duplicateObservations = [];
for (const observation of input.observations || []) {
  const key = observation.observation_id;
  if (seen.has(key)) { duplicateObservations.push(observation); continue; }
  seen.set(key, true);
  deduplicatedObservations.push(observation);
}
return [{ json: { ...input, observations_before_dedup: (input.observations || []).length, deduplicated_events: [], deduplicated_observations: deduplicatedObservations, duplicate_observations: duplicateObservations, dedup_valid: duplicateObservations.length === 0 } }];
"""

ROLLUPS_JS = """
const input = $input.first().json;
const sectionMap = {};
for (const section of input.route_sections || []) {
  sectionMap[section.route_section_id] = { ...section, status: 'no_facilities', event_ids: [], observation_ids: [], updated_at: input.generated_at };
}
for (const obs of input.deduplicated_observations || []) {
  for (const sectionId of (obs.route_section_ids || [])) {
    const section = sectionMap[sectionId];
    if (!section) continue;
    section.updated_at = input.generated_at;
    section.observation_ids.push(obs.observation_id);
    section.status = obs.details.tier === 'publish' ? 'facilities_present' : 'facilities_present_exception_review';
  }
}
return [{ json: { ...input, route_sections: Object.values(sectionMap) } }];
"""

VALIDATE_JS = """
const input = $input.first().json;
const errors = [];
const warnings = [];
const requiredRootFields = ['schema_version', 'connector_id', 'connector_name', 'connector_version', 'lane', 'run_id', 'generated_at', 'output_root', 'canonical_gpx', 'manifest_ref'];
for (const field of requiredRootFields) {
  if (!(field in input) || input[field] === null || input[field] === undefined || input[field] === '') errors.push('Missing required root field: ' + field);
}
if (!Array.isArray(input.source_health)) errors.push('source_health must be an array');
if (!Array.isArray(input.deduplicated_observations)) errors.push('deduplicated_observations must be an array');
if (!Array.isArray(input.route_sections)) errors.push('route_sections must be an array');
const allowedSourceStatuses = ['ok', 'degraded', 'failed', 'stale', 'blocked', 'not_run', 'skipped_as_not_due', 'empty_but_valid', 'using_last_known_good'];
const allowedFacilityStatuses = ['open', 'closed', 'seasonal', 'hours_unknown', 'status_unknown'];
const allowedTiers = ['publish', 'exception_review'];
for (const obs of input.deduplicated_observations || []) {
  const fields = ['observation_id', 'observation_type', 'title', 'summary', 'source_id', 'observed_at', 'route_section_ids', 'details'];
  for (const field of fields) {
    if (!(field in obs) || obs[field] === null || obs[field] === undefined || obs[field] === '') {
      errors.push('Observation missing required field: ' + field + ' (' + (obs.observation_id || 'unknown') + ')');
    }
  }
  if (obs.observation_type !== 'route_facility') errors.push('Invalid observation_type for lane 08: ' + obs.observation_type + ' (' + obs.observation_id + ')');
  const details = obs.details || {};
  if (details.facility_type !== 'restroom') errors.push('Invalid facility_type: ' + details.facility_type + ' (' + obs.observation_id + ')');
  if (!allowedFacilityStatuses.includes(details.status)) errors.push('Invalid facility status: ' + details.status + ' (' + obs.observation_id + ')');
  if (!allowedTiers.includes(details.tier)) errors.push('Invalid tier: ' + details.tier + ' (' + obs.observation_id + ')');
  if (typeof details.has_water_fill !== 'boolean' && details.has_water_fill !== null) errors.push('has_water_fill must be true, false, or null: ' + obs.observation_id);
  if (!details.coordinates || typeof details.coordinates.latitude !== 'number' || typeof details.coordinates.longitude !== 'number') errors.push('Missing or invalid coordinates: ' + obs.observation_id);
  if (!details.route_relevance || typeof details.route_relevance.distance_km !== 'number') errors.push('Missing route_relevance.distance_km: ' + obs.observation_id);
}
for (const source of input.source_health || []) {
  const fields = ['schema_version', 'connector_id', 'source_id', 'source_name', 'status', 'retrieved_at', 'stale_after_minutes', 'record_count', 'http_status', 'last_observation_at', 'warnings', 'errors'];
  for (const field of fields) {
    if (!(field in source) || source[field] === undefined) errors.push('Source health missing field: ' + field + ' (' + (source.source_id || 'unknown') + ')');
  }
  if (source.status && !allowedSourceStatuses.includes(source.status)) errors.push('Invalid source health status: ' + source.status + ' (' + (source.source_id || 'unknown') + ')');
}
const candidateValidationPassed = errors.length === 0;
if (!candidateValidationPassed) warnings.push('Validation failed; candidate will be quarantined and published output suppressed.');
return [{ json: { ...input, validation_errors: errors, validation_warnings: warnings, candidate_validation_passed: candidateValidationPassed, validator_version: '1.0.0' } }];
"""

BUILD_CANDIDATE_JS = """
const input = $input.first().json;
const sourceStatuses = (input.source_health || []).map(source => source.status);
const anyFailed = sourceStatuses.some(status => status === 'failed');
const anyStale = sourceStatuses.some(status => status === 'stale' || status === 'using_last_known_good');
const anyLkg = (input.deduplicated_observations || []).some(o => o.details && o.details.used_last_known_good);
const allFailed = sourceStatuses.length > 0 && sourceStatuses.every(status => status === 'failed');
const hasObservations = (input.deduplicated_observations || []).length > 0;
let dataStatus = 'ok';
if (!input.candidate_validation_passed) dataStatus = 'failed_validation'; else if (allFailed) dataStatus = 'failed_fetch'; else if (!hasObservations) dataStatus = 'no_relevant_events'; else if (anyFailed || anyLkg) dataStatus = 'degraded';
const freshnessState = allFailed ? 'unknown' : (anyFailed || anyLkg ? 'stale' : 'fresh');
const staleSourceIds = (input.source_health || []).filter(source => source.status === 'stale' || source.status === 'using_last_known_good' || source.status === 'failed').map(source => source.source_id);
const candidateEnvelope = {
  schema_version: input.schema_version,
  connector_id: input.connector_id,
  connector_name: input.connector_name,
  connector_version: input.connector_version,
  lane: input.lane,
  run_id: input.run_id,
  generated_at: input.generated_at,
  published_at: null,
  data_status: dataStatus,
  freshness: {
    overall_state: freshnessState,
    computed_at: input.generated_at,
    oldest_relevant_source_age_minutes: 0,
    stale_source_ids: staleSourceIds
  },
  manifest_ref: input.manifest_ref,
  source_health: input.source_health || [],
  connector_health: {
    schema_version: '1.0.0',
    connector_id: input.connector_id,
    status: input.candidate_validation_passed ? (anyFailed ? 'degraded' : 'ok') : 'failed',
    failed_stage: input.candidate_validation_passed ? null : 'validation',
    warning_count: (input.validation_warnings || []).length,
    error_count: (input.validation_errors || []).length,
    used_last_known_good: anyLkg,
    candidate_written: true,
    published_written: false
  },
  events: [],
  observations: input.deduplicated_observations || [],
  route_sections: input.route_sections || [],
  provenance: {
    source_ids_used: (input.source_health || []).map(source => source.source_id),
    route_gpx_ref: input.canonical_gpx,
    source_payload_refs: [],
    normalization_notes: input.validation_warnings || []
  },
  validation_state: {
    schema_valid: input.candidate_validation_passed,
    freshness_valid: freshnessState !== 'unknown',
    dedup_valid: input.dedup_valid !== false,
    candidate_validation_passed: input.candidate_validation_passed,
    published_from_candidate: false,
    validator_version: input.validator_version || '1.0.0'
  },
  metadata: {
    coverage_limitations: input.coverage_limitations || [],
    facility_type: 'restroom',
    publish_tier_count: (input.deduplicated_observations || []).filter(o => o.details.tier === 'publish').length,
    exception_review_tier_count: (input.deduplicated_observations || []).filter(o => o.details.tier === 'exception_review').length
  }
};
const normalizedPath = input.output_root + '/normalized/08_ROUTE_FACILITIES/08_ROUTE_FACILITIES_normalized_output_' + input.run_stamp + '.json';
const candidatePath = input.output_root + '/candidate/08_ROUTE_FACILITIES/08_ROUTE_FACILITIES_candidate_' + input.run_stamp + '.json';
const buffer1 = Buffer.from(JSON.stringify(candidateEnvelope, null, 2), 'utf8');
const buffer2 = Buffer.from(JSON.stringify(candidateEnvelope, null, 2), 'utf8');
const bin1 = await this.helpers.prepareBinaryData(buffer1, normalizedPath.split('/').pop(), 'application/json');
const bin2 = await this.helpers.prepareBinaryData(buffer2, candidatePath.split('/').pop(), 'application/json');
return [
  { json: { file_path: normalizedPath, file_name: normalizedPath.split('/').pop(), artifact_type: 'normalized', candidate_envelope: candidateEnvelope }, binary: { data: bin1 } },
  { json: { file_path: candidatePath, file_name: candidatePath.split('/').pop(), artifact_type: 'candidate', candidate_envelope: candidateEnvelope }, binary: { data: bin2 } }
];
"""

PUBLISH_GATE_JS = """
const candidate = $('Build Candidate Artifact').first().json.candidate_envelope;
const validation = $('Validate Candidate Envelope').first().json;
const shouldPublish = !!validation.candidate_validation_passed;
const reason = shouldPublish ? 'Validation passed' : 'Validation failed: ' + (validation.validation_errors || []).join('; ');
return [{ json: { should_publish: shouldPublish, reason, candidate_envelope: candidate, validation_errors: validation.validation_errors || [], validation_warnings: validation.validation_warnings || [], run_id: validation.run_id, run_stamp: validation.run_stamp, output_root: validation.output_root, connector_id: validation.connector_id, connector_name: validation.connector_name, connector_version: validation.connector_version, lane: validation.lane, generated_at: validation.generated_at, source_health: validation.source_health || [], deduplicated_observations: validation.deduplicated_observations || [], route_sections: validation.route_sections || [] } }];
"""

BUILD_FINAL_BUNDLE_JS = """
const hashString = (input) => { let hash = 2166136261; for (let i = 0; i < input.length; i++) { hash ^= input.charCodeAt(i); hash = Math.imul(hash, 16777619); } return (hash >>> 0).toString(16).padStart(8, '0'); };
const gate = $input.first().json;
const candidateEnvelope = gate.candidate_envelope || $('Build Candidate Artifact').first().json.candidate_envelope;
const runStamp = gate.run_stamp || candidateEnvelope.generated_at.replace(/[-:]/g, '').replace(/\\.\\d{3}Z$/, 'Z');
const now = new Date().toISOString();
const outputRoot = gate.output_root || '/files/uw-issy-connectors';
const runId = gate.run_id || candidateEnvelope.run_id;
const publishedPath = outputRoot + '/published/08_ROUTE_FACILITIES/08_ROUTE_FACILITIES_published_' + runStamp + '.json';
const publishedCurrentPath = outputRoot + '/published/08_ROUTE_FACILITIES/current.json';
const lkgCurrentPath = outputRoot + '/last_known_good/08_ROUTE_FACILITIES/current.json';
const lkgArchivePath = outputRoot + '/last_known_good/08_ROUTE_FACILITIES/archive/' + runStamp + '.json';
const validationLogPath = outputRoot + '/logs/08_ROUTE_FACILITIES/validation_log_' + runStamp + '.jsonl';
const statusPath = outputRoot + '/health/08_ROUTE_FACILITIES/status.json';
const statusArchivePath = outputRoot + '/health/08_ROUTE_FACILITIES/status_' + runStamp + '.json';
const executionEvidencePath = outputRoot + '/health/08_ROUTE_FACILITIES/execution_evidence_' + runStamp + '.json';
const handoffPath = outputRoot + '/handoff/08_ROUTE_FACILITIES/08_ROUTE_FACILITIES_handoff_' + runStamp + '.json';
const quarantinePath = outputRoot + '/health/08_ROUTE_FACILITIES/quarantine_' + runStamp + '.json';
const validationErrors = gate.validation_errors || [];
const validationWarnings = gate.validation_warnings || [];
const sourceHealth = gate.source_health || [];
const sourceStatuses = sourceHealth.map(source => source.status);
const anyFailed = sourceStatuses.some(status => status === 'failed');
const allFailed = sourceHealth.length > 0 && sourceStatuses.every(status => status === 'failed');
const hasObservations = (gate.deduplicated_observations || []).length > 0;
const publishedArtifactRef = gate.should_publish ? publishedPath : null;
const statusValue = gate.should_publish ? (anyFailed ? 'degraded' : 'ok') : 'failed';
let dataStatus = 'ok';
if (allFailed) dataStatus = 'failed_fetch'; else if (!hasObservations) dataStatus = 'no_relevant_events'; else if (anyFailed) dataStatus = 'degraded';
const publishedEnvelope = gate.should_publish ? {
  ...candidateEnvelope,
  published_at: now,
  data_status: dataStatus,
  connector_health: { ...candidateEnvelope.connector_health, status: anyFailed ? 'degraded' : 'ok', failed_stage: null, candidate_written: true, published_written: true },
  validation_state: { ...candidateEnvelope.validation_state, candidate_validation_passed: true, published_from_candidate: true },
  freshness: { ...candidateEnvelope.freshness, overall_state: anyFailed ? 'stale' : 'fresh', computed_at: now }
} : null;
const statusDoc = {
  lane_id: '08_ROUTE_FACILITIES',
  last_fetch_at: gate.generated_at || candidateEnvelope.generated_at,
  last_success_at: gate.should_publish ? now : null,
  status: statusValue,
  source_health: sourceHealth,
  error_messages: validationErrors,
  stale_data_fields: [],
  published_artifact_ref: publishedArtifactRef,
  last_known_good_ref: lkgCurrentPath
};
const handoffDoc = {
  schema_version: '1.0.0',
  connector_id: gate.connector_id,
  lane: gate.lane || candidateEnvelope.lane,
  run_id: runId,
  handoff_generated_at: now,
  connector_output_path: gate.should_publish ? publishedPath : quarantinePath,
  manifest_path: '/files/uw-issy-connectors/manifests/08_ROUTE_FACILITIES/08_ROUTE_FACILITIES_manifest_v0001.json',
  validation_result_path: statusPath,
  execution_evidence_path: executionEvidencePath,
  publication_status: gate.should_publish ? 'published' : 'quarantined',
  data_status: gate.should_publish ? dataStatus : candidateEnvelope.data_status,
  uses_last_known_good: (gate.deduplicated_observations || []).some(o => o.details && o.details.used_last_known_good),
  schema_compatible_with_workflow_20: !!gate.should_publish,
  source_ids_used: (gate.source_health || []).map(source => source.source_id),
  route_sections: gate.route_sections || []
};
const evidencePayload = {
  schema_version: '1.0.0',
  connector_id: gate.connector_id,
  run_id: runId,
  workflow_name: '%(workflowName)s',
  workflow_internal_id: 'pending_n8n_id',
  execution_id: 'pending_n8n_execution_id',
  connector_version: gate.connector_version || 'v0001',
  started_at: candidateEnvelope.generated_at,
  finished_at: now,
  result: gate.should_publish ? 'success' : 'failed',
  artifacts: [],
  promotion_scope: gate.should_publish ? 'candidate_and_published' : 'none',
  candidate_generated: true,
  published_generated: !!gate.should_publish
};
const makeBinaryItem = async (filePath, payload, artifactType, mime = 'application/json') => {
  const text = typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2);
  const buffer = Buffer.from(text, 'utf8');
  const binary = await this.helpers.prepareBinaryData(buffer, filePath.split('/').pop(), mime);
  return { json: { file_path: filePath, file_name: filePath.split('/').pop(), artifact_type: artifactType, content_hash: 'hash_' + hashString(text) }, binary: { data: binary } };
};
const files = [];
if (gate.should_publish && publishedEnvelope) {
  const publishedText = JSON.stringify(publishedEnvelope, null, 2);
  const publishedHash = 'hash_' + hashString(publishedText);
  evidencePayload.artifacts.push({ path: publishedPath, sha256: publishedHash });
  evidencePayload.artifacts.push({ path: publishedCurrentPath, sha256: publishedHash });
  evidencePayload.artifacts.push({ path: lkgCurrentPath, sha256: publishedHash });
  evidencePayload.artifacts.push({ path: lkgArchivePath, sha256: publishedHash });
  files.push(await makeBinaryItem(publishedPath, publishedEnvelope, 'published'));
  files.push(await makeBinaryItem(publishedCurrentPath, { run_id: runId, artifact: publishedPath }, 'published_current'));
  files.push(await makeBinaryItem(lkgCurrentPath, publishedEnvelope, 'last_known_good_current'));
  files.push(await makeBinaryItem(lkgArchivePath, publishedEnvelope, 'last_known_good_archive'));
  files.push(await makeBinaryItem(statusPath, statusDoc, 'status'));
  files.push(await makeBinaryItem(statusArchivePath, statusDoc, 'status_archive'));
} else {
  const quarantineEnvelope = { run_id: runId, reason: gate.reason, validation_errors: validationErrors, validation_warnings: validationWarnings, candidate_envelope: candidateEnvelope };
  evidencePayload.artifacts.push({ path: quarantinePath, sha256: 'hash_' + hashString(JSON.stringify(quarantineEnvelope, null, 2)) });
  files.push(await makeBinaryItem(quarantinePath, quarantineEnvelope, 'quarantine'));
  files.push(await makeBinaryItem(statusPath, statusDoc, 'status'));
  files.push(await makeBinaryItem(statusArchivePath, statusDoc, 'status_archive'));
}
const validationLogLines = [];
for (const source of sourceHealth) {
  validationLogLines.push(JSON.stringify({ source_id: source.source_id, check_name: 'source_health', pass_fail: source.status === 'failed' ? 'fail' : 'pass', message: source.status + ' / ' + source.record_count + ' record(s)', timestamp: gate.generated_at || candidateEnvelope.generated_at }));
}
validationLogLines.push(JSON.stringify({ source_id: 'CONNECTOR', check_name: 'candidate_schema', pass_fail: gate.should_publish ? 'pass' : 'fail', message: gate.should_publish ? 'Candidate passed validation.' : (validationErrors.join('; ') || 'Validation failed.'), timestamp: gate.generated_at || candidateEnvelope.generated_at }));
validationLogLines.push(JSON.stringify({ source_id: 'CONNECTOR', check_name: 'publish_gate', pass_fail: gate.should_publish ? 'pass' : 'fail', message: gate.should_publish ? 'Candidate promoted to published.' : gate.reason, timestamp: now }));
files.push(await makeBinaryItem(validationLogPath, validationLogLines.join('\\n'), 'validation_log', 'text/plain'));
files.push(await makeBinaryItem(executionEvidencePath, evidencePayload, 'execution_evidence'));
files.push(await makeBinaryItem(handoffPath, handoffDoc, 'handoff'));
return files;
""" % {"workflowName": WORKFLOW_NAME}

FINAL_STATUS_JS = """
const gate = $('Publish Gate Decision').first().json;
const bundleItems = $('Build Final Artifact Bundle').all();
const candidate = $('Build Candidate Artifact').first().json.candidate_envelope;
return [{ json: {
  run_id: gate.run_id || candidate.run_id,
  status: gate.should_publish ? 'PASSED' : 'FAILED',
  candidate_written: true,
  published_written: !!gate.should_publish,
  quarantine_written: !gate.should_publish,
  validation_log_written: true,
  status_written: true,
  handoff_written: true,
  execution_evidence_written: true,
  artifact_count_written: bundleItems.length,
  publish_tier_count: candidate.metadata.publish_tier_count,
  exception_review_tier_count: candidate.metadata.exception_review_tier_count,
  timestamp: candidate.generated_at
} }];
"""


def code_node(node_id, name, js, mode="runOnceForAllItems", notes=None):
    n = {
        "id": node_id,
        "name": name,
        "type": "n8n-nodes-base.code",
        "typeVersion": 2,
        "position": [0, 0],
        "parameters": {"mode": mode, "jsCode": js},
    }
    if notes:
        n["notes"] = notes
    return n


def rwf_node(node_id, name, params, notes=None, on_error=None, always_output=None):
    n = {
        "id": node_id,
        "name": name,
        "type": "n8n-nodes-base.readWriteFile",
        "typeVersion": 1,
        "position": [0, 0],
        "parameters": params,
    }
    if on_error:
        n["onError"] = on_error
    if always_output:
        n["alwaysOutputData"] = True
    if notes:
        n["notes"] = notes
    return n


def build_workflow():
    nodes = []
    nodes.append({"id": "manual_trigger", "name": "Manual Trigger", "type": "n8n-nodes-base.manualTrigger", "typeVersion": 2, "position": [0, 0], "parameters": {}})
    nodes.append({
        "id": "schedule_trigger", "name": "Schedule Trigger", "type": "n8n-nodes-base.scheduleTrigger",
        "typeVersion": 1.2, "position": [0, 0],
        "parameters": {"rule": {"interval": [{"field": "hours", "hoursInterval": 6}]}},
        "notes": "Every 6 hours. Facility open/closed status changes far less often than flood gauges; 6-hour cadence keeps rider-facing status reasonably current without hammering two public GIS services."
    })
    nodes.append(code_node("init_metadata", "Initialize Run Metadata", INIT_METADATA_JS))
    nodes.append(rwf_node("read_lkg", "Read Last Known Good", READ_LKG_PARAMS, on_error="continueRegularOutput", always_output=True))
    nodes.append(code_node("parse_lkg", "Parse Last Known Good", PARSE_LKG_JS))

    nodes.append(fetch_node("fetch_sea01", "Fetch SEA-01 Seattle Parks Restrooms Feed", SEA01_URL,
                             "Full unfiltered Seattle Parks Restrooms FeatureServer feed (outSR=4326). Matched to known facilities by nearest-coordinate, per the Phase 3 lesson: pull the complete dataset, do not query by an assumed landmark-name list."))
    nodes.append(code_node("land_sea01", "Land SEA-01 Raw Payload", land_raw_js("08_ROUTE_FACILITIES:SEA-01", "Seattle Parks and Recreation - Park Restrooms (live GIS FeatureServer)", SEA01_URL, "Fetch SEA-01 Seattle Parks Restrooms Feed")))
    nodes.append(rwf_node("write_sea01", "Write SEA-01 Raw Landing", {"operation": "write", "fileName": "={{ $json.file_path }}", "dataPropertyName": "data", "options": {}}))
    nodes.append(code_node("normalize_sea01", "Normalize SEA-01 Facility Matches", NORMALIZE_SEA01_JS))

    nodes.append(fetch_node("fetch_kc01", "Fetch KC-01 King County Facilities Restrooms", KC01_URL,
                             "King County KingCo_ParksAndTrails Facilities layer (Layer 3), filtered server-side to F_Type LIKE '%Restroom%', outSR=4326. Layer 2 ('Restroom') errors server-side; Layer 3 is the confirmed-working equivalent, per Phase 3 research."))
    nodes.append(code_node("land_kc01", "Land KC-01 Raw Payload", land_raw_js("08_ROUTE_FACILITIES:KC-01", "King County DNRP Parks - KingCo_ParksAndTrails Facilities layer (F_Type=Restroom)", KC01_URL, "Fetch KC-01 King County Facilities Restrooms")))
    nodes.append(rwf_node("write_kc01", "Write KC-01 Raw Landing", {"operation": "write", "fileName": "={{ $json.file_path }}", "dataPropertyName": "data", "options": {}}))
    nodes.append(code_node("normalize_kc01", "Normalize KC-01 Facility Matches", NORMALIZE_KC01_JS))

    nodes.append({"id": "merge_normalized", "name": "Merge Normalized Branches", "type": "n8n-nodes-base.merge", "typeVersion": 3.1, "position": [0, 0], "parameters": {"numberInputs": 2}})
    nodes.append(code_node("aggregate", "Aggregate Normalized Branches", AGGREGATE_JS))
    nodes.append(code_node("dedupe", "Deduplicate Observations", DEDUPE_JS))
    nodes.append(code_node("rollups", "Build Route Sections Rollups", ROLLUPS_JS))
    nodes.append(code_node("validate", "Validate Candidate Envelope", VALIDATE_JS))
    nodes.append(code_node("build_candidate", "Build Candidate Artifact", BUILD_CANDIDATE_JS))
    nodes.append(rwf_node("write_candidate", "Write Candidate Artifact", {"operation": "write", "fileName": "={{ $json.file_path }}", "dataPropertyName": "data", "options": {}}))
    nodes.append(code_node("publish_gate", "Publish Gate Decision", PUBLISH_GATE_JS))
    nodes.append(code_node("build_final", "Build Final Artifact Bundle", BUILD_FINAL_BUNDLE_JS))
    nodes.append(rwf_node("write_final", "Write Final Artifacts", {"operation": "write", "fileName": "={{ $json.file_path }}", "dataPropertyName": "data", "options": {}}))
    nodes.append(code_node("final_status", "Final Status Report", FINAL_STATUS_JS))

    # Layout (cosmetic only)
    x = 0
    col_w = 260
    positions = {
        "manual_trigger": (0, 0), "schedule_trigger": (0, 120), "init_metadata": (260, 60),
        "read_lkg": (520, 60), "parse_lkg": (780, 60),
        "fetch_sea01": (260, 260), "land_sea01": (520, 260), "write_sea01": (780, 260), "normalize_sea01": (1040, 260),
        "fetch_kc01": (260, 460), "land_kc01": (520, 460), "write_kc01": (780, 460), "normalize_kc01": (1040, 460),
        "merge_normalized": (1300, 360), "aggregate": (1560, 360), "dedupe": (1820, 360), "rollups": (2080, 360),
        "validate": (2340, 360), "build_candidate": (2600, 360), "write_candidate": (2860, 360),
        "publish_gate": (3120, 360), "build_final": (3380, 360), "write_final": (3640, 360), "final_status": (3900, 360),
    }
    for n in nodes:
        n["position"] = list(positions.get(n["id"], (0, 0)))

    connections = {
        "Manual Trigger": {"main": [[{"node": "Initialize Run Metadata", "type": "main", "index": 0}]]},
        "Schedule Trigger": {"main": [[{"node": "Initialize Run Metadata", "type": "main", "index": 0}]]},
        "Initialize Run Metadata": {"main": [[
            {"node": "Read Last Known Good", "type": "main", "index": 0},
            {"node": "Fetch SEA-01 Seattle Parks Restrooms Feed", "type": "main", "index": 0},
            {"node": "Fetch KC-01 King County Facilities Restrooms", "type": "main", "index": 0},
        ]]},
        "Read Last Known Good": {"main": [[{"node": "Parse Last Known Good", "type": "main", "index": 0}]]},
        "Parse Last Known Good": {"main": [[]]},
        "Fetch SEA-01 Seattle Parks Restrooms Feed": {"main": [[{"node": "Land SEA-01 Raw Payload", "type": "main", "index": 0}]]},
        "Land SEA-01 Raw Payload": {"main": [[{"node": "Write SEA-01 Raw Landing", "type": "main", "index": 0}]]},
        "Write SEA-01 Raw Landing": {"main": [[{"node": "Normalize SEA-01 Facility Matches", "type": "main", "index": 0}]]},
        "Normalize SEA-01 Facility Matches": {"main": [[{"node": "Merge Normalized Branches", "type": "main", "index": 0}]]},
        "Fetch KC-01 King County Facilities Restrooms": {"main": [[{"node": "Land KC-01 Raw Payload", "type": "main", "index": 0}]]},
        "Land KC-01 Raw Payload": {"main": [[{"node": "Write KC-01 Raw Landing", "type": "main", "index": 0}]]},
        "Write KC-01 Raw Landing": {"main": [[{"node": "Normalize KC-01 Facility Matches", "type": "main", "index": 0}]]},
        "Normalize KC-01 Facility Matches": {"main": [[{"node": "Merge Normalized Branches", "type": "main", "index": 1}]]},
        "Merge Normalized Branches": {"main": [[{"node": "Aggregate Normalized Branches", "type": "main", "index": 0}]]},
        "Aggregate Normalized Branches": {"main": [[{"node": "Deduplicate Observations", "type": "main", "index": 0}]]},
        "Deduplicate Observations": {"main": [[{"node": "Build Route Sections Rollups", "type": "main", "index": 0}]]},
        "Build Route Sections Rollups": {"main": [[{"node": "Validate Candidate Envelope", "type": "main", "index": 0}]]},
        "Validate Candidate Envelope": {"main": [[{"node": "Build Candidate Artifact", "type": "main", "index": 0}]]},
        "Build Candidate Artifact": {"main": [[{"node": "Write Candidate Artifact", "type": "main", "index": 0}]]},
        "Write Candidate Artifact": {"main": [[{"node": "Publish Gate Decision", "type": "main", "index": 0}]]},
        "Publish Gate Decision": {"main": [[{"node": "Build Final Artifact Bundle", "type": "main", "index": 0}]]},
        "Build Final Artifact Bundle": {"main": [[{"node": "Write Final Artifacts", "type": "main", "index": 0}]]},
        "Write Final Artifacts": {"main": [[{"node": "Final Status Report", "type": "main", "index": 0}]]},
    }

    workflow = {
        "name": WORKFLOW_NAME,
        "id": WORKFLOW_ID,
        "active": False,
        "settings": {"executionOrder": "v1", "timezone": "America/Los_Angeles"},
        "tags": [
            {"id": "tag-uw-issy", "name": "uw_issy"},
            {"id": "tag-connector", "name": "connector"},
            {"id": "tag-lane-08-route-facilities", "name": "lane_08_route_facilities"},
            {"id": "tag-no-direct-deploy", "name": "no_direct_deploy"},
        ],
        "nodes": nodes,
        "connections": connections,
        "pinData": {},
    }
    return workflow


def main():
    workflow = build_workflow()
    text = json.dumps(workflow, indent=2) + "\n"
    connector_out = os.path.join(CONNECTOR_DIR, "08_ROUTE_FACILITIES_v1.json")
    with open(connector_out, "w") as f:
        f.write(text)
    os.makedirs(WORKFLOWS_DIR, exist_ok=True)
    canonical_out = os.path.join(WORKFLOWS_DIR, "v0001.08_ROUTE_FACILITIESConnector.n8n.workflow.json")
    with open(canonical_out, "w") as f:
        f.write(text)
    print("Wrote", connector_out)
    print("Wrote", canonical_out)
    print("Nodes:", len(workflow["nodes"]))


if __name__ == "__main__":
    main()
