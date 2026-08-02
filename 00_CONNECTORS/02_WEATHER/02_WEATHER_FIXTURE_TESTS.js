const fs = require('fs');
const vm = require('vm');

const WORKFLOW_PATH = '/Users/jkbrookspersonal/LocalSiteBuildFiles/BTF_UW-Issy_Route_Monitor/00_CONNECTORS/02_WEATHER/02_WEATHER_v1.json';
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
      if (args.length === 0) super(FIXED_NOW_MS);
      else super(...args);
    }
    static now() { return FIXED_NOW_MS; }
    static parse(value) { return RealDate.parse(value); }
    static UTC(...args) { return RealDate.UTC(...args); }
  };
}

function makeContext({ nodeOutputs = {}, inputItems = [{ json: {} }], binaryBuffer = null } = {}) {
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
    __ctx: null,
    $: (nodeName) => ({
      first: () => ({ json: nodeOutputs[nodeName] ?? {} }),
      all: () => {
        const value = nodeOutputs[nodeName];
        if (Array.isArray(value)) return value;
        if (value === undefined) return [{ json: {} }];
        return [{ json: value }];
      },
    }),
    $input: {
      first: () => inputItems[0] ?? { json: {} },
      all: () => inputItems,
    },
  };
  context.globalThis = context;
  context.global = context;
  context.__ctx = {
    helpers: {
      prepareBinaryData: async (buffer, fileName, mimeType) => ({
        fileName,
        mimeType,
        data: Buffer.isBuffer(buffer) ? buffer.toString('base64') : String(buffer),
      }),
      getBinaryDataBuffer: async () => {
        if (binaryBuffer === null) throw new Error('No binary data available for this item');
        return Buffer.isBuffer(binaryBuffer) ? binaryBuffer : Buffer.from(binaryBuffer, 'utf8');
      },
    },
  };
  return vm.createContext(context);
}

async function runNodeCode(code, options = {}) {
  const wrapped = '(async function() {\n' + code + '\n}).call(__ctx)';
  const script = new vm.Script(wrapped, { filename: options.filename || 'workflow-node.vm.js' });
  const context = makeContext(options);
  return await script.runInContext(context);
}

function makeBinaryStubItem() {
  return { binary: { data: { data: 'filesystem-v2' } } };
}

function getCode(codeByName, nodeName) {
  const code = codeByName.get(nodeName);
  if (!code) throw new Error('Missing node code: ' + nodeName);
  return code;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function makeRunMetadata() {
  return {
    schema_version: '1.0.0',
    connector_id: '02_WEATHER',
    connector_name: 'UW-Issaquah Weather Connector',
    connector_version: 'v0001',
    lane: '02_WEATHER',
    run_id: '02_WEATHER-20260801T120000Z-001',
    run_stamp: '20260801T120000Z',
    generated_at: FIXED_NOW_ISO,
    published_at: null,
    output_root: '/files/uw-issy-connectors',
    canonical_gpx: 'data/route/UnivWA-Issaquah.gpx',
    route_points: [
      { point_id: 'WP1', forecast_zone_id: 'WAZ315', county_zone_id: 'WAC033' },
      { point_id: 'WP2', forecast_zone_id: 'WAZ315', county_zone_id: 'WAC033' },
      { point_id: 'WP3', forecast_zone_id: 'WAZ313', county_zone_id: 'WAC033' },
      { point_id: 'WP4', forecast_zone_id: 'WAZ314', county_zone_id: 'WAC033' },
      { point_id: 'WP5', forecast_zone_id: 'WAZ314', county_zone_id: 'WAC033' },
      { point_id: 'WP6', forecast_zone_id: 'WAZ314', county_zone_id: 'WAC033' },
      { point_id: 'WP7', forecast_zone_id: 'WAZ314', county_zone_id: 'WAC033' },
      { point_id: 'WP8', forecast_zone_id: 'WAZ314', county_zone_id: 'WAC033' },
    ],
    source_configs: {
      'NWS-06': {
        source_id: '02_WEATHER:NWS-06',
        source_name: 'NWS active alerts',
        source_type: 'alerts',
      },
    },
    alert_allowlist: [
      'Winter Storm Warning',
      'Winter Weather Advisory',
      'Wind Advisory',
      'High Wind Warning',
      'Dense Fog Advisory',
      'Severe Thunderstorm Warning',
      'Excessive Heat Warning',
      'Excessive Heat Watch',
      'Heat Advisory',
      'Freeze Warning',
      'Freeze Watch',
      'Frost Advisory',
    ],
    route_points_version: '2026-07-29',
    threshold_reference: 'WEATHER_THRESHOLD_RECOMMENDATIONS.md',
  };
}

function makeFetchSuccess(body) {
  return { raw_items: [{ kind: 'alerts', ok: true, statusCode: 200, body, url: 'https://example.test' }], fetch_error_count: 0, fetch_ok_count: 1 };
}

function makeFetchFailure(message) {
  return { error: new Error(message), raw_items: [], fetch_error_count: 1, fetch_ok_count: 0 };
}

function makeLkgEntry({ retrievedAt, staleAfterMinutes = 60, status = 'ok', warnings = [], errors = [], events = [], observations = [] } = {}) {
  return {
    source_health: {
      schema_version: '1.0.0',
      connector_id: '02_WEATHER',
      source_id: '02_WEATHER:NWS-06',
      source_name: 'NWS active alerts',
      status,
      retrieved_at: retrievedAt,
      stale_after_minutes: staleAfterMinutes,
      record_count: events.length,
      http_status: 200,
      last_observation_at: retrievedAt,
      warnings,
      errors,
    },
    events,
    observations,
  };
}

function buildNormalizeInputs({ fetch, landing, lkg, parseOutput }) {
  return {
    'Initialize Run Metadata': makeRunMetadata(),
    'Fetch NWS-06': fetch,
    'Land NWS-06 Raw Payload': landing,
    'Parse Last Known Good': parseOutput ?? { bySource: lkg ? { '02_WEATHER:NWS-06': lkg } : {} },
  };
}

async function runNormalizeScenario({ fetch, landing, lkg, parseOutput }) {
  const code = getCode(loadWorkflowCache.codeByName, 'Normalize NWS-06 Events');
  const output = await runNodeCode(code, {
    filename: 'Normalize NWS-06 Events.vm.js',
    nodeOutputs: buildNormalizeInputs({ fetch, landing, lkg, parseOutput }),
    inputItems: [{ json: {} }],
  });
  return output[0].json;
}

async function runParseScenario(inputItem, binaryBuffer) {
  const code = getCode(loadWorkflowCache.codeByName, 'Parse Last Known Good');
  const output = await runNodeCode(code, {
    filename: 'Parse Last Known Good.vm.js',
    inputItems: [inputItem],
    binaryBuffer: binaryBuffer ?? null,
  });
  return output[0].json;
}

async function runBuildCandidateScenario(input) {
  const code = getCode(loadWorkflowCache.codeByName, 'Build Candidate Artifact');
  const output = await runNodeCode(code, {
    filename: 'Build Candidate Artifact.vm.js',
    inputItems: [{ json: input }],
  });
  return output[0].json.candidate_envelope;
}

const loadWorkflowCache = loadWorkflow();

async function scenarioA() {
  const fetch = makeFetchSuccess({ features: [] });
  const landing = { file_path: '/tmp/nws06.json', content_hash: 'hash_a' };
  const lkg = makeLkgEntry({ retrievedAt: '2026-08-01T11:45:00Z', events: [{ source_id: '02_WEATHER:NWS-06', id: 'lkg-a' }] });
  const result = await runNormalizeScenario({ fetch, landing, lkg });
  assert(result.source_health.status === 'empty_but_valid', 'expected live success to be empty_but_valid');
  assert(result.source_health.status !== 'using_last_known_good', 'expected live success to ignore LKG');
  return 'live success stayed live';
}

async function scenarioB() {
  const fetch = makeFetchFailure('upstream timeout');
  const landing = { file_path: '/tmp/nws06.json', content_hash: 'hash_b' };
  const lkgTimestamp = '2026-08-01T11:50:00Z';
  const lkg = makeLkgEntry({ retrievedAt: lkgTimestamp, warnings: ['cached warning'], events: [{ source_id: '02_WEATHER:NWS-06', id: 'lkg-b' }] });
  const result = await runNormalizeScenario({ fetch, landing, lkg });
  assert(result.source_health.status === 'using_last_known_good', 'expected usable LKG to be served');
  assert(result.source_health.retrieved_at === lkgTimestamp, 'expected original LKG retrieved_at to be preserved');
  assert(Array.isArray(result.source_health.errors) && result.source_health.errors.some((msg) => msg.includes('upstream timeout')), 'expected live failure to be retained');
  return 'usable LKG served with original timestamp';
}

async function scenarioC() {
  const fetch = makeFetchFailure('upstream timeout');
  const landing = { file_path: '/tmp/nws06.json', content_hash: 'hash_c' };
  const lkg = makeLkgEntry({ retrievedAt: '2026-07-31T10:00:00Z', events: [{ source_id: '02_WEATHER:NWS-06', id: 'lkg-c' }] });
  const result = await runNormalizeScenario({ fetch, landing, lkg });
  assert(result.source_health.status === 'failed', 'expected expired LKG to be rejected');
  assert(Array.isArray(result.events) && result.events.length === 0, 'expected expired LKG to produce no events');
  return 'expired LKG rejected';
}

async function scenarioD() {
  const parseInvalid = await runParseScenario(makeBinaryStubItem(), 'not valid json');
  assert(parseInvalid.bySource && Object.keys(parseInvalid.bySource).length === 0, 'expected invalid JSON to return empty lookup');

  const parseMissingBinary = await runParseScenario({ json: { error: 'read failed' } });
  assert(parseMissingBinary.bySource && Object.keys(parseMissingBinary.bySource).length === 0, 'expected missing binary to return empty lookup');

  const parseHelperThrows = await runParseScenario(makeBinaryStubItem(), null);
  assert(parseHelperThrows.bySource && Object.keys(parseHelperThrows.bySource).length === 0, 'expected getBinaryDataBuffer failure to return empty lookup, not throw');

  const fetch = makeFetchFailure('upstream outage');
  const landing = { file_path: '/tmp/nws06.json', content_hash: 'hash_d' };
  const malformedLkg = {
    source_health: {
      schema_version: '1.0.0',
      connector_id: '02_WEATHER',
      source_id: '02_WEATHER:NWS-06',
      source_name: 'NWS active alerts',
      status: 'ok',
      stale_after_minutes: 60,
      record_count: 1,
      http_status: 200,
      last_observation_at: '2026-08-01T11:00:00Z',
      warnings: [],
      errors: [],
    },
    events: [{ source_id: '02_WEATHER:NWS-06', id: 'lkg-d' }],
  };
  const result = await runNormalizeScenario({ fetch, landing, parseOutput: { bySource: { '02_WEATHER:NWS-06': malformedLkg } } });
  assert(result.source_health.status === 'failed', 'expected malformed LKG without retrieved_at to fail closed');
  assert(Array.isArray(result.events) && result.events.length === 0, 'expected malformed LKG without retrieved_at to return no events');
  return 'malformed LKG handled without throw';
}

async function scenarioE() {
  const input = {
    schema_version: '1.0.0',
    connector_id: '02_WEATHER',
    connector_name: 'UW-Issaquah Weather Connector',
    connector_version: 'v0001',
    lane: '02_WEATHER',
    run_id: '02_WEATHER-20260801T120000Z-001',
    run_stamp: '20260801T120000Z',
    generated_at: FIXED_NOW_ISO,
    output_root: '/files/uw-issy-connectors',
    canonical_gpx: 'data/route/UnivWA-Issaquah.gpx',
    source_health: [
      { source_id: '02_WEATHER:NWS-01', status: 'ok', retrieved_at: FIXED_NOW_ISO, stale_after_minutes: 60, record_count: 1, http_status: 200, last_observation_at: FIXED_NOW_ISO, warnings: [], errors: [] },
      { source_id: '02_WEATHER:NWS-04', status: 'using_last_known_good', retrieved_at: FIXED_NOW_ISO, stale_after_minutes: 60, record_count: 1, http_status: 200, last_observation_at: FIXED_NOW_ISO, warnings: [], errors: [] },
      { source_id: '02_WEATHER:NWS-05', status: 'failed', retrieved_at: FIXED_NOW_ISO, stale_after_minutes: 90, record_count: 0, http_status: 503, last_observation_at: FIXED_NOW_ISO, warnings: [], errors: ['oops'] },
    ],
    deduplicated_events: [{ source_id: '02_WEATHER:NWS-06', event_id: 'evt-a', route_relevance: { manual_review_required: false } }],
    observations: [],
    route_sections: [],
    validation_errors: [],
    validation_warnings: [],
    source_warnings: [],
    source_errors: [],
    candidate_validation_passed: true,
  };
  const candidate = await runBuildCandidateScenario(input);
  assert(candidate.data_status === 'degraded', 'expected mixed live/LKG/failed dataStatus to be degraded');
  assert(candidate.connector_health.used_last_known_good === true, 'expected used_last_known_good to be true when any branch uses LKG');
  return 'mixed source state degraded';
}

async function scenarioF() {
  const input = {
    schema_version: '1.0.0',
    connector_id: '02_WEATHER',
    connector_name: 'UW-Issaquah Weather Connector',
    connector_version: 'v0001',
    lane: '02_WEATHER',
    run_id: '02_WEATHER-20260801T120000Z-001',
    run_stamp: '20260801T120000Z',
    generated_at: FIXED_NOW_ISO,
    output_root: '/files/uw-issy-connectors',
    canonical_gpx: 'data/route/UnivWA-Issaquah.gpx',
    source_health: [
      { source_id: '02_WEATHER:NWS-01', status: 'using_last_known_good', retrieved_at: FIXED_NOW_ISO, stale_after_minutes: 60, record_count: 1, http_status: 200, last_observation_at: FIXED_NOW_ISO, warnings: [], errors: [] },
      { source_id: '02_WEATHER:NWS-02', status: 'using_last_known_good', retrieved_at: FIXED_NOW_ISO, stale_after_minutes: 60, record_count: 1, http_status: 200, last_observation_at: FIXED_NOW_ISO, warnings: [], errors: [] },
    ],
    deduplicated_events: [{ source_id: '02_WEATHER:NWS-06', event_id: 'evt-a', route_relevance: { manual_review_required: false } }],
    observations: [],
    route_sections: [],
    validation_errors: [],
    validation_warnings: [],
    source_warnings: [],
    source_errors: [],
    candidate_validation_passed: true,
  };
  const candidate = await runBuildCandidateScenario(input);
  assert(candidate.data_status === 'using_last_known_good', 'expected all-LKG candidate to advertise using_last_known_good');
  assert(candidate.connector_health.used_last_known_good === true, 'expected all-LKG candidate to flag used_last_known_good');
  return 'all-LKG candidate classified correctly';
}

async function scenarioG() {
  const input = {
    schema_version: '1.0.0',
    connector_id: '02_WEATHER',
    connector_name: 'UW-Issaquah Weather Connector',
    connector_version: 'v0001',
    lane: '02_WEATHER',
    run_id: '02_WEATHER-20260801T120000Z-001',
    run_stamp: '20260801T120000Z',
    generated_at: FIXED_NOW_ISO,
    output_root: '/files/uw-issy-connectors',
    canonical_gpx: 'data/route/UnivWA-Issaquah.gpx',
    source_health: [
      { source_id: '02_WEATHER:NWS-01', status: 'failed', retrieved_at: FIXED_NOW_ISO, stale_after_minutes: 60, record_count: 0, http_status: 503, last_observation_at: FIXED_NOW_ISO, warnings: [], errors: [] },
      { source_id: '02_WEATHER:NWS-02', status: 'failed', retrieved_at: FIXED_NOW_ISO, stale_after_minutes: 60, record_count: 0, http_status: 503, last_observation_at: FIXED_NOW_ISO, warnings: [], errors: [] },
    ],
    deduplicated_events: [],
    observations: [],
    route_sections: [],
    validation_errors: [],
    validation_warnings: [],
    source_warnings: [],
    source_errors: [],
    candidate_validation_passed: true,
  };
  const candidate = await runBuildCandidateScenario(input);
  assert(candidate.data_status === 'failed_fetch', 'expected all-failed candidate to remain failed_fetch');
  assert(candidate.connector_health.used_last_known_good === false, 'expected all-failed candidate to not claim LKG use');
  return 'all-failed candidate unchanged';
}

async function scenarioH() {
  const fetch = makeFetchSuccess({ features: [] });
  const landing = { file_path: '/tmp/nws06.json', content_hash: 'hash_h' };
  const lkg = makeLkgEntry({ retrievedAt: '2026-08-01T11:50:00Z', status: 'using_last_known_good', events: [{ source_id: '02_WEATHER:NWS-06', id: 'lkg-h' }] });
  const result = await runNormalizeScenario({ fetch, landing, lkg });
  assert(result.source_health.status === 'empty_but_valid', 'expected live success with no events to stay empty_but_valid');
  assert(result.source_health.status !== 'using_last_known_good', 'expected live success to ignore usable LKG');
  return 'live recovery overrode LKG as expected';
}

async function main() {
  const scenarios = [['a', scenarioA], ['b', scenarioB], ['c', scenarioC], ['d', scenarioD], ['e', scenarioE], ['f', scenarioF], ['g', scenarioG], ['h', scenarioH]];
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

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
