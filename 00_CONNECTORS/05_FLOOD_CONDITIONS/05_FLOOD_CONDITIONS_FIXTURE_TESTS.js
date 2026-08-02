
const fs = require('fs');
const vm = require('vm');

const WORKFLOW_PATH = "/Users/jkbrookspersonal/LocalSiteBuildFiles/BTF_UW-Issy_Route_Monitor/00_CONNECTORS/05_FLOOD_CONDITIONS/05_FLOOD_CONDITIONS_v1.json";
const FIXED_NOW_ISO = '2026-08-01T12:00:00Z';
const FIXED_NOW_MS = Date.parse(FIXED_NOW_ISO);

function loadWorkflow() {
  const workflow = JSON.parse(fs.readFileSync(WORKFLOW_PATH, 'utf8'));
  const codeByName = new Map();
  for (const node of workflow.nodes || []) {
    if (node && node.name && node.parameters && typeof node.parameters.jsCode === 'string') {
      codeByName.set(node.name, node.parameters.jsCode);
    }
  }
  return { workflow, codeByName };
}

function makeFixedDateClass() {
  const RealDate = Date;
  return class FixedDate extends RealDate {
    constructor(...args) {
      if (args.length === 0) {
        super(FIXED_NOW_MS);
      } else {
        super(...args);
      }
    }
    static now() { return FIXED_NOW_MS; }
    static parse(value) { return RealDate.parse(value); }
    static UTC(...args) { return RealDate.UTC(...args); }
  };
}

function makeContext({ nodeOutputs = {}, inputItems = [{ json: {} }], binaryBuffer = null, env = {} } = {}) {
  const FixedDate = makeFixedDateClass();
  const context = {
    Buffer,
    Date: FixedDate,
    JSON,
    Math,
    Number,
    String,
    Boolean,
    Array,
    Object,
    RegExp,
    Set,
    Map,
    WeakMap,
    WeakSet,
    Promise,
    Error,
    TypeError,
    console,
    $env: env,
    __ctx: null,
    $: (nodeName) => ({
      first: () => ({ json: nodeOutputs[nodeName] ?? {} }),
      all: () => {
        const value = nodeOutputs[nodeName];
        if (Array.isArray(value)) return value;
        if (value === undefined) return [{ json: {} }];
        return [{ json: value }];
      }
    }),
    $input: {
      first: () => inputItems[0] ?? { json: {} },
      all: () => inputItems
    }
  };
  context.globalThis = context;
  context.global = context;
  context.__ctx = {
    helpers: {
      prepareBinaryData: async (buffer, fileName, mimeType) => ({
        fileName,
        mimeType,
        data: Buffer.isBuffer(buffer) ? buffer.toString('base64') : String(buffer)
      }),
      getBinaryDataBuffer: async (_itemIndex, _propertyName) => {
        if (binaryBuffer === null) {
          throw new Error('No binary data available for this item');
        }
        return Buffer.isBuffer(binaryBuffer) ? binaryBuffer : Buffer.from(binaryBuffer, 'utf8');
      }
    }
  };
  return vm.createContext(context);
}

async function runNodeCode(code, options = {}) {
  const wrapped = `(async function() {\n${code}\n}).call(__ctx)`;
  const script = new vm.Script(wrapped, { filename: options.filename || 'workflow-node.vm.js' });
  const context = makeContext(options);
  return await script.runInContext(context);
}

function getCode(codeByName, nodeName) {
  const code = codeByName.get(nodeName);
  if (!code) throw new Error('Missing node code: ' + nodeName);
  return code;
}

function makeRunMetadata() {
  return {
    schema_version: '1.0.0',
    connector_id: '05_FLOOD_CONDITIONS',
    connector_name: 'UW-Issaquah Flood Conditions Connector',
    connector_version: 'v0001',
    lane: '05_FLOOD_CONDITIONS',
    workflow_name: 'v0001.05_FloodConditionsConnector',
    run_id: '05_FLOOD_CONDITIONS-20260801T120000Z-001',
    run_stamp: '20260801T120000Z',
    generated_at: FIXED_NOW_ISO,
    published_at: null,
    output_root: '/files/uw-issy-connectors',
    canonical_gpx: 'data/route/UnivWA-Issaquah.gpx',
    manifest_ref: { manifest_id: '05_FLOOD_CONDITIONS-v0001', schema_version: '1.0.0' },
    route_sections: [
  {
    "route_section_id": "01_uw_u_district",
    "route_section_name": "UW / U-District"
  },
  {
    "route_section_id": "02_burke_gilman_seattle",
    "route_section_name": "Burke-Gilman - Seattle"
  },
  {
    "route_section_id": "03_burke_gilman_north_lake_wa_kenmore",
    "route_section_name": "Burke-Gilman - north Lake WA/Kenmore"
  },
  {
    "route_section_id": "04_burke_gilman_connector_bothell",
    "route_section_name": "Burke-Gilman/connector - Bothell"
  },
  {
    "route_section_id": "05_sammamish_river_trail_bothell_woodinville",
    "route_section_name": "Sammamish River Trail - Bothell/Woodinville"
  },
  {
    "route_section_id": "06_sammamish_river_trail_redmond",
    "route_section_name": "Sammamish River Trail - Redmond"
  },
  {
    "route_section_id": "07_marymoor_park",
    "route_section_name": "Marymoor Park"
  },
  {
    "route_section_id": "08_east_lake_sammamish_trail_redmond",
    "route_section_name": "East Lake Sammamish Trail - Redmond"
  },
  {
    "route_section_id": "09_east_lake_sammamish_trail_sammamish",
    "route_section_name": "East Lake Sammamish Trail - Sammamish"
  },
  {
    "route_section_id": "10_issaquah_approach_terminus",
    "route_section_name": "Issaquah approach / terminus"
  }
],
    source_configs: {},
    freshness_policy: { usgs_minutes: 30, nwps_minutes: 30, nws_minutes: 15, closure_supplement_minutes: 60, iss_minutes: 24 * 60 },
    route_filter_policy: { named_assets: ['Burke-Gilman Trail', 'Sammamish River Trail', 'Marymoor Park', 'East Lake Sammamish Trail', 'Lake Sammamish State Park'], geometry_requires_line_buffer_intersection: true, text_sources_require_relevant_flood_language: true },
    coverage_limitations: ['No verified direct live Sammamish River gauge is in the approved runtime set.'],
    runtime_flags: { wsdot_access_code_present: true }
  };
}

function makeLanding(sourceId, filePath, contentHash, body) {
  return {
    file_path: filePath,
    source_id: sourceId,
    source_name: 'Landing stub',
    content_hash: contentHash,
    retrieved_at: FIXED_NOW_ISO,
    body
  };
}

function makeLkgEntry({ retrievedAt, staleAfterMinutes = 1440, status = 'ok', warnings = [], errors = [], lastObservationAt, events = [], observations = [] } = {}) {
  return {
    source_health: {
      schema_version: '1.0.0',
      connector_id: '05_FLOOD_CONDITIONS',
      source_id: '05_FLOOD_CONDITIONS:USGS-01',
      source_name: 'USGS IV service - Issaquah Creek near mouth near Issaquah (12121600)',
      status,
      retrieved_at: retrievedAt,
      stale_after_minutes: staleAfterMinutes,
      record_count: events.length + observations.length,
      http_status: 200,
      last_observation_at: lastObservationAt ?? retrievedAt,
      warnings,
      errors
    },
    events,
    observations
  };
}

function makeNormalizeInputs({ fetch, landing, lkg, parseOutput, nodeName }) {
  return {
    'Initialize Run Metadata': makeRunMetadata(),
    [nodeName.fetch]: fetch,
    [nodeName.land]: landing,
    'Parse Last Known Good': parseOutput ?? { bySource: lkg ? { '05_FLOOD_CONDITIONS:USGS-01': lkg } : {} }
  };
}

function buildCandidateInput({ sourceHealth, events, observations = [], validationWarnings = [], validationErrors = [], sourceWarnings = [], sourceErrors = [], candidateValidationPassed = true }) {
  return {
    schema_version: '1.0.0',
    connector_id: '05_FLOOD_CONDITIONS',
    connector_name: 'UW-Issaquah Flood Conditions Connector',
    connector_version: 'v0001',
    lane: '05_FLOOD_CONDITIONS',
    run_id: '05_FLOOD_CONDITIONS-20260801T120000Z-001',
    run_stamp: '20260801T120000Z',
    generated_at: FIXED_NOW_ISO,
    output_root: '/files/uw-issy-connectors',
    canonical_gpx: 'data/route/UnivWA-Issaquah.gpx',
    manifest_ref: { manifest_id: '05_FLOOD_CONDITIONS-v0001', schema_version: '1.0.0' },
    source_health: sourceHealth,
    deduplicated_events: events,
    deduplicated_observations: observations,
    route_sections: [],
    candidate_validation_passed: candidateValidationPassed,
    validation_warnings: validationWarnings,
    validation_errors: validationErrors,
    source_warnings: sourceWarnings,
    source_errors: sourceErrors,
    dedup_valid: true,
    coverage_limitations: ['No verified direct live Sammamish River gauge is in the approved runtime set.'],
    source_items: sourceHealth.map(source => ({ raw_landing_path: '/tmp/' + source.source_id + '.json' }))
  };
}

async function runNormalizeScenario({ sourceKey, fetch, landing, lkg, parseOutput, env }) {
  const sourceMap = {
    USGS_01: { fetch: 'Fetch USGS-01 Gauge', land: 'Land USGS-01 Raw Payload', normalize: 'Normalize USGS-01 Events' },
    USGS_02: { fetch: 'Fetch USGS-02 Gauge', land: 'Land USGS-02 Raw Payload', normalize: 'Normalize USGS-02 Events' },
    USGS_03: { fetch: 'Fetch USGS-03 Gauge', land: 'Land USGS-03 Raw Payload', normalize: 'Normalize USGS-03 Events' },
    NWPS_01: { fetch: 'Fetch NWPS-01 Status', land: 'Land NWPS-01 Raw Payload', normalize: 'Normalize NWPS-01 Events' },
    NWPS_02: { fetch: 'Fetch NWPS-02 Status', land: 'Land NWPS-02 Raw Payload', normalize: 'Normalize NWPS-02 Events' },
    NWS_01: { fetch: 'Fetch NWS-01 Alerts', land: 'Land NWS-01 Raw Payload', normalize: 'Normalize NWS-01 Events' },
    ISS_01: { fetch: 'Fetch ISS-01 Flood Page', land: 'Land ISS-01 Raw Payload', normalize: 'Normalize ISS-01 Events' },
    REDM_01: { fetch: 'Fetch REDM-01 Alerts', land: 'Land REDM-01 Raw Payload', normalize: 'Normalize REDM-01 Events' },
    KC_ROAD_01: { fetch: 'Fetch KC-ROAD-01 Alerts', land: 'Land KC-ROAD-01 Raw Payload', normalize: 'Normalize KC-ROAD-01 Events' },
    WSDOT_01: { fetch: 'Fetch WSDOT-01 Alerts', land: 'Land WSDOT-01 Raw Payload', normalize: 'Normalize WSDOT-01 Events' }
  };
  const nodeName = sourceMap[sourceKey];
  const code = getCode(loadWorkflowCache.codeByName, nodeName.normalize);
  const output = await runNodeCode(code, {
    filename: nodeName.normalize + '.vm.js',
    nodeOutputs: makeNormalizeInputs({ fetch, landing, lkg, parseOutput, nodeName }),
    inputItems: [{ json: {} }],
    env: env || { WSDOT_TRAVELER_API_ACCESS_CODE: 'abc123' }
  });
  return output[0].json;
}

async function runParseScenario(inputItem, binaryBuffer) {
  const code = getCode(loadWorkflowCache.codeByName, 'Parse Last Known Good');
  const output = await runNodeCode(code, {
    filename: 'Parse Last Known Good.vm.js',
    inputItems: [inputItem],
    binaryBuffer: binaryBuffer ?? null
  });
  return output[0].json;
}

async function runBuildCandidateScenario(input) {
  const code = getCode(loadWorkflowCache.codeByName, 'Build Candidate Artifact');
  const output = await runNodeCode(code, {
    filename: 'Build Candidate Artifact.vm.js',
    inputItems: [{ json: input }]
  });
  return output[0].json.candidate_envelope;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function makeFetchSuccess(body) {
  return { body, statusCode: 200 };
}

function makeFetchFailure(message) {
  return { error: new Error(message), statusCode: 503 };
}

const loadWorkflowCache = loadWorkflow();

async function scenarioA() {
  const fetch = makeFetchSuccess({
    value: {
      timeSeries: [
        {
          variable: { variableCode: [{ value: '00060' }] },
          values: [{ value: [{ dateTime: '2026-08-01T11:45:00Z', value: '12.3' }] }]
        }
      ]
    }
  });
  const landing = makeLanding('05_FLOOD_CONDITIONS:USGS-01', '/tmp/usgs01.json', 'hash_a', fetch.body);
  const lkg = makeLkgEntry({
    retrievedAt: '2026-08-01T11:30:00Z',
    events: [{ source_id: '05_FLOOD_CONDITIONS:USGS-01', event_id: 'lkg-a' }]
  });
  const result = await runNormalizeScenario({ sourceKey: 'USGS_01', fetch, landing, lkg });
  assert(result.source_health.status === 'ok', 'expected live success to stay ok');
  assert(result.source_health.status !== 'using_last_known_good', 'expected live success to ignore LKG');
  return 'live success stayed live';
}

async function scenarioB() {
  const fetch = makeFetchFailure('upstream timeout');
  const landing = makeLanding('05_FLOOD_CONDITIONS:USGS-01', '/tmp/usgs01.json', 'hash_b', '<html></html>');
  const lkgTimestamp = '2026-08-01T11:40:00Z';
  const lkg = makeLkgEntry({
    retrievedAt: lkgTimestamp,
    warnings: ['cached warning'],
    events: [{ source_id: '05_FLOOD_CONDITIONS:USGS-01', event_id: 'lkg-b' }]
  });
  const result = await runNormalizeScenario({ sourceKey: 'USGS_01', fetch, landing, lkg });
  assert(result.source_health.status === 'using_last_known_good', 'expected usable LKG to be served');
  assert(result.source_health.retrieved_at === lkgTimestamp, 'expected original LKG retrieved_at to be preserved');
  assert(Array.isArray(result.source_health.errors) && result.source_health.errors.some(msg => msg.includes('upstream timeout')), 'expected live failure to be retained');
  return 'usable LKG served with original timestamp';
}

async function scenarioC() {
  const fetch = makeFetchFailure('upstream timeout');
  const landing = makeLanding('05_FLOOD_CONDITIONS:USGS-01', '/tmp/usgs01.json', 'hash_c', '<html></html>');
  const lkg = makeLkgEntry({
    retrievedAt: '2026-07-31T10:00:00Z',
    events: [{ source_id: '05_FLOOD_CONDITIONS:USGS-01', event_id: 'lkg-c' }]
  });
  const result = await runNormalizeScenario({ sourceKey: 'USGS_01', fetch, landing, lkg });
  assert(result.source_health.status === 'failed', 'expected expired LKG to be rejected');
  assert(Array.isArray(result.events) && result.events.length === 0, 'expected expired LKG to produce no events');
  return 'expired LKG rejected';
}

async function scenarioD() {
  const parseInvalid = await runParseScenario({ binary: { data: { data: 'filesystem-v2' } } }, 'not valid json');
  assert(parseInvalid.bySource && Object.keys(parseInvalid.bySource).length === 0, 'expected invalid JSON to return empty lookup');
  const parseMissingBinary = await runParseScenario({ json: { error: 'read failed' } });
  assert(parseMissingBinary.bySource && Object.keys(parseMissingBinary.bySource).length === 0, 'expected missing binary to return empty lookup');
  const parseHelperThrows = await runParseScenario({ binary: { data: { data: 'filesystem-v2' } } }, null);
  assert(parseHelperThrows.bySource && Object.keys(parseHelperThrows.bySource).length === 0, 'expected getBinaryDataBuffer failure to return empty lookup, not throw');
  const fetch = makeFetchFailure('upstream outage');
  const landing = makeLanding('05_FLOOD_CONDITIONS:USGS-01', '/tmp/usgs01.json', 'hash_d', '<html></html>');
  const malformedLkg = {
    source_health: {
      schema_version: '1.0.0',
      connector_id: '05_FLOOD_CONDITIONS',
      source_id: '05_FLOOD_CONDITIONS:USGS-01',
      source_name: 'USGS IV service - Issaquah Creek near mouth near Issaquah (12121600)',
      status: 'ok',
      stale_after_minutes: 1440,
      record_count: 1,
      http_status: 200,
      last_observation_at: '2026-08-01T11:00:00Z',
      warnings: [],
      errors: []
    },
    events: [{ source_id: '05_FLOOD_CONDITIONS:USGS-01', event_id: 'lkg-d' }]
  };
  const result = await runNormalizeScenario({ sourceKey: 'USGS_01', fetch, landing, parseOutput: { bySource: { '05_FLOOD_CONDITIONS:USGS-01': malformedLkg } } });
  assert(result.source_health.status === 'failed', 'expected malformed LKG without retrieved_at to fail closed');
  assert(Array.isArray(result.events) && result.events.length === 0, 'expected malformed LKG without retrieved_at to return no events');
  return 'malformed LKG handled without throw';
}

async function scenarioE() {
  const input = buildCandidateInput({
    sourceHealth: [
      { source_id: '05_FLOOD_CONDITIONS:USGS-01', status: 'ok' },
      { source_id: '05_FLOOD_CONDITIONS:USGS-02', status: 'using_last_known_good' },
      { source_id: '05_FLOOD_CONDITIONS:USGS-03', status: 'failed' }
    ],
    events: [
      { source_id: '05_FLOOD_CONDITIONS:USGS-01', route_impact: 'elevated_water', route_relevance: { method: 'point_to_route_distance' }, event_id: 'e1', event_type: 'gauge_observation', status: 'monitoring', severity: 'advisory', title: 't', summary: 's', observed_at: FIXED_NOW_ISO, location: {}, provenance: {} }
    ],
    observations: []
  });
  const candidate = await runBuildCandidateScenario(input);
  assert(candidate.data_status === 'degraded', 'expected mixed live/LKG/failed dataStatus to be degraded');
  assert(candidate.connector_health.used_last_known_good === true, 'expected used_last_known_good to be true when any branch uses LKG');
  return 'mixed source state degraded';
}

async function scenarioF() {
  const input = buildCandidateInput({
    sourceHealth: [
      { source_id: '05_FLOOD_CONDITIONS:USGS-01', status: 'using_last_known_good' },
      { source_id: '05_FLOOD_CONDITIONS:USGS-02', status: 'using_last_known_good' },
      { source_id: '05_FLOOD_CONDITIONS:USGS-03', status: 'using_last_known_good' }
    ],
    events: [
      { source_id: '05_FLOOD_CONDITIONS:USGS-01', route_impact: 'elevated_water', route_relevance: { method: 'point_to_route_distance' }, event_id: 'e1', event_type: 'gauge_observation', status: 'monitoring', severity: 'advisory', title: 't', summary: 's', observed_at: FIXED_NOW_ISO, location: {}, provenance: {} }
    ],
    observations: []
  });
  const candidate = await runBuildCandidateScenario(input);
  assert(candidate.data_status === 'using_last_known_good', 'expected all-LKG candidate to advertise using_last_known_good');
  assert(candidate.connector_health.used_last_known_good === true, 'expected all-LKG candidate to flag used_last_known_good');
  return 'all-LKG candidate classified correctly';
}

async function scenarioG() {
  const input = buildCandidateInput({
    sourceHealth: [
      { source_id: '05_FLOOD_CONDITIONS:USGS-01', status: 'failed' },
      { source_id: '05_FLOOD_CONDITIONS:USGS-02', status: 'failed' },
      { source_id: '05_FLOOD_CONDITIONS:USGS-03', status: 'failed' }
    ],
    events: [],
    observations: []
  });
  const candidate = await runBuildCandidateScenario(input);
  assert(candidate.data_status === 'failed_fetch', 'expected all-failed candidate to remain failed_fetch');
  assert(candidate.connector_health.used_last_known_good === false, 'expected all-failed candidate to not claim LKG use');
  return 'all-failed candidate unchanged';
}

async function scenarioH() {
  const fetch = makeFetchSuccess({
    value: {
      timeSeries: [
        {
          variable: { variableCode: [{ value: '00060' }] },
          values: [{ value: [{ dateTime: '2026-08-01T11:55:00Z', value: '11.2' }] }]
        }
      ]
    }
  });
  const landing = makeLanding('05_FLOOD_CONDITIONS:USGS-01', '/tmp/usgs01.json', 'hash_h', fetch.body);
  const lkg = makeLkgEntry({
    retrievedAt: '2026-08-01T11:50:00Z',
    status: 'using_last_known_good',
    events: [{ source_id: '05_FLOOD_CONDITIONS:USGS-01', event_id: 'lkg-h' }]
  });
  const result = await runNormalizeScenario({ sourceKey: 'USGS_01', fetch, landing, lkg });
  assert(result.source_health.status === 'ok', 'expected live success to stay live');
  assert(result.source_health.status !== 'using_last_known_good', 'expected live success to ignore usable LKG');
  return 'live recovery overrode LKG as expected';
}

async function main() {
  const scenarios = [
    ['a', scenarioA],
    ['b', scenarioB],
    ['c', scenarioC],
    ['d', scenarioD],
    ['e', scenarioE],
    ['f', scenarioF],
    ['g', scenarioG],
    ['h', scenarioH]
  ];
  let passed = 0;
  for (const [label, fn] of scenarios) {
    try {
      const detail = await fn();
      passed += 1;
      console.log(`PASS ${label}: ${detail}`);
    } catch (error) {
      console.log(`FAIL ${label}: ${error.message}`);
    }
  }
  if (passed === scenarios.length) {
    console.log(`PASS summary: ${passed}/${scenarios.length} scenarios passed`);
    return;
  }
  console.log(`FAIL summary: ${passed}/${scenarios.length} scenarios passed`);
  process.exitCode = 1;
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
