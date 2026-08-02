const fs = require('fs');
const vm = require('vm');

const WORKFLOW_PATH = '/Users/jkbrookspersonal/LocalSiteBuildFiles/BTF_UW-Issy_Route_Monitor/00_CONNECTORS/07_GOVERNMENT_SAFETY_ALERTS/07_GOVERNMENT_SAFETY_ALERTS_v1.json';
const FIXED_NOW_ISO = '2026-08-01T12:00:00Z';
const FIXED_NOW_MS = Date.parse(FIXED_NOW_ISO);
const LANE_ID = '07_GOVERNMENT_SAFETY_ALERTS';
const CONNECTOR_NAME = 'UW-Issaquah Government Safety Alerts Connector';
const CONNECTOR_VERSION = 'v0001';

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

    static now() {
      return FIXED_NOW_MS;
    }

    static parse(value) {
      return RealDate.parse(value);
    }

    static UTC(...args) {
      return RealDate.UTC(...args);
    }
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
      getBinaryDataBuffer: async (_itemIndex, _propertyName) => {
        if (binaryBuffer === null) {
          throw new Error('No binary data available for this item');
        }
        return Buffer.isBuffer(binaryBuffer) ? binaryBuffer : Buffer.from(binaryBuffer, 'utf8');
      },
    },
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
  if (!code) {
    throw new Error('Missing node code: ' + nodeName);
  }
  return code;
}

function makeFetchSuccess(body, statusCode = 200) {
  return {
    body,
    statusCode,
  };
}

function makeFetchFailure(message, statusCode = 503) {
  return {
    error: new Error(message),
    statusCode,
  };
}

function makeLanding(sourceId, filePath, contentHash, body) {
  return {
    file_path: filePath,
    source_id: sourceId,
    source_name: 'Landing stub',
    content_hash: contentHash,
    retrieved_at: FIXED_NOW_ISO,
    body,
  };
}

function makeLkgEntry({
  sourceId,
  sourceName = 'Last known good source',
  retrievedAt,
  staleAfterMinutes = 15,
  status = 'ok',
  warnings = [],
  errors = [],
  lastObservationAt,
  events = [],
  observations = [],
} = {}) {
  return {
    source_health: {
      schema_version: '1.0.0',
      connector_id: LANE_ID,
      source_id: sourceId,
      source_name: sourceName,
      status,
      retrieved_at: retrievedAt,
      stale_after_minutes: staleAfterMinutes,
      record_count: events.length,
      http_status: 200,
      last_observation_at: lastObservationAt ?? retrievedAt,
      warnings,
      errors,
    },
    events,
    observations,
  };
}

function makeRunMetadata() {
  return {
    schema_version: '1.0.0',
    connector_id: LANE_ID,
    connector_name: CONNECTOR_NAME,
    connector_version: CONNECTOR_VERSION,
    lane: LANE_ID,
    run_id: `${LANE_ID}-20260801T120000Z-001`,
    run_stamp: '20260801T120000Z',
    generated_at: FIXED_NOW_ISO,
    published_at: null,
    output_root: '/files/uw-issy-connectors',
    canonical_gpx: 'data/route/UnivWA-Issaquah.gpx',
    gazetteer: ['University of Washington', 'UW', 'U-District', 'University Way NE', 'Rainier Vista', 'Kane Hall', 'Burke-Gilman Trail', 'NE Pacific St', 'NE 45th St', 'Bothell Landing', 'Marymoor Park', 'East Lake Sammamish Trail', 'Kenmore', 'Lake Forest Park', 'Bothell', 'Woodinville', 'Redmond', 'Sammamish', 'Issaquah', 'SR-522', 'I-90', 'I-405', 'Seattle', 'Washington', 'King County'],
  };
}

function buildNormalizeInputs({ sourceKey, fetch, landing, parseOutput }) {
  return {
    'Initialize Run Metadata': makeRunMetadata(),
    [`Fetch ${sourceKey} Alerts`]: fetch,
    [`Land ${sourceKey} Raw Payload`]: landing,
    'Parse Last Known Good': parseOutput ?? { bySource: {} },
  };
}

function buildCandidateInput({ sourceHealth, events, observations = [], validationWarnings = [], validationErrors = [], sourceWarnings = [], sourceErrors = [] }) {
  return {
    schema_version: '1.0.0',
    connector_id: LANE_ID,
    connector_name: CONNECTOR_NAME,
    connector_version: CONNECTOR_VERSION,
    lane: LANE_ID,
    run_id: `${LANE_ID}-20260801T120000Z-001`,
    run_stamp: '20260801T120000Z',
    generated_at: FIXED_NOW_ISO,
    published_at: null,
    output_root: '/files/uw-issy-connectors',
    canonical_gpx: 'data/route/UnivWA-Issaquah.gpx',
    manifest_ref: { manifest_id: `${LANE_ID}-v0001`, schema_version: '1.0.0' },
    source_health: sourceHealth,
    deduplicated_events: events,
    deduplicated_observations: observations,
    route_sections: [],
    candidate_validation_passed: true,
    validation_warnings: validationWarnings,
    validation_errors: validationErrors,
    source_warnings: sourceWarnings,
    source_errors: sourceErrors,
    provenance: {
      source_ids_used: sourceHealth.map((source) => source.source_id),
      route_gpx_ref: 'data/route/UnivWA-Issaquah.gpx',
      source_payload_refs: [],
      normalization_notes: [],
      research_trace_refs: [],
    },
  };
}

async function runParseScenario(inputItem, binaryBuffer) {
  const code = getCode(loadWorkflowCache.codeByName, 'Parse Last Known Good');
  const output = await runNodeCode(code, {
    filename: 'Parse Last Known Good.vm.js',
    inputItems: [inputItem],
    binaryBuffer,
  });
  return output[0].json;
}

async function runNormalizeScenario({ sourceKey, fetch, landing, lkg, parseOutput }) {
  const code = getCode(loadWorkflowCache.codeByName, `Normalize ${sourceKey} Events`);
  const output = await runNodeCode(code, {
    filename: `Normalize ${sourceKey} Events.vm.js`,
    nodeOutputs: buildNormalizeInputs({ sourceKey, fetch, landing, parseOutput: parseOutput ?? (lkg ? { bySource: { [lkg.source_health.source_id]: lkg } } : undefined) }),
    inputItems: [{ json: {} }],
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

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function scenarioA() {
  const fetch = makeFetchSuccess([
    {
      id: 101,
      title: { rendered: 'UW Advisory - Emergency response' },
      excerpt: { rendered: 'Emergency response activity near University of Washington.' },
      content: { rendered: '<p>Emergency response activity near University of Washington.</p>' },
      link: 'https://example.com/uwnotice',
      date: '2026-08-01T11:58:00Z',
      modified: '2026-08-01T11:59:00Z',
    },
  ]);
  const landing = makeLanding('07_GOVERNMENT_SAFETY_ALERTS:SEA-01', '/tmp/sea.json', 'hash_a', fetch.body);
  const lkg = makeLkgEntry({
    sourceId: '07_GOVERNMENT_SAFETY_ALERTS:SEA-01',
    sourceName: 'AlertSeattle public feed and WordPress API',
    retrievedAt: '2026-08-01T11:40:00Z',
    staleAfterMinutes: 15,
    events: [{ source_id: '07_GOVERNMENT_SAFETY_ALERTS:SEA-01', event_id: 'lkg-a' }],
  });
  const result = await runNormalizeScenario({ sourceKey: 'SEA-01', fetch, landing, lkg });
  assert(result.source_health.status === 'ok', 'expected live success to stay ok');
  assert(result.source_health.status !== 'using_last_known_good', 'expected live success to ignore LKG');
  return 'live success stayed live';
}

async function scenarioB() {
  const fetch = makeFetchFailure('upstream timeout');
  const landing = makeLanding('07_GOVERNMENT_SAFETY_ALERTS:SEA-01', '/tmp/sea.json', 'hash_b', '<html></html>');
  const lkgTimestamp = '2026-08-01T11:55:00Z';
  const lkg = makeLkgEntry({
    sourceId: '07_GOVERNMENT_SAFETY_ALERTS:SEA-01',
    sourceName: 'AlertSeattle public feed and WordPress API',
    retrievedAt: lkgTimestamp,
    staleAfterMinutes: 15,
    warnings: ['cached warning'],
    events: [{ source_id: '07_GOVERNMENT_SAFETY_ALERTS:SEA-01', event_id: 'lkg-b' }],
  });
  const result = await runNormalizeScenario({ sourceKey: 'SEA-01', fetch, landing, lkg });
  assert(result.source_health.status === 'using_last_known_good', 'expected usable LKG to be served');
  assert(result.source_health.retrieved_at === lkgTimestamp, 'expected original LKG retrieved_at to be preserved');
  assert(Array.isArray(result.source_health.errors) && result.source_health.errors.some((msg) => String(msg).includes('upstream timeout')), 'expected live failure to be retained');
  return 'usable LKG served with original timestamp';
}

async function scenarioC() {
  const fetch = makeFetchFailure('upstream timeout');
  const landing = makeLanding('07_GOVERNMENT_SAFETY_ALERTS:SEA-01', '/tmp/sea.json', 'hash_c', '<html></html>');
  const lkg = makeLkgEntry({
    sourceId: '07_GOVERNMENT_SAFETY_ALERTS:SEA-01',
    sourceName: 'AlertSeattle public feed and WordPress API',
    retrievedAt: '2026-08-01T11:30:00Z',
    staleAfterMinutes: 15,
    events: [{ source_id: '07_GOVERNMENT_SAFETY_ALERTS:SEA-01', event_id: 'lkg-c' }],
  });
  const result = await runNormalizeScenario({ sourceKey: 'SEA-01', fetch, landing, lkg });
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
  const landing = makeLanding('07_GOVERNMENT_SAFETY_ALERTS:SEA-01', '/tmp/sea.json', 'hash_d', '<html></html>');
  const malformedLkg = {
    source_health: {
      schema_version: '1.0.0',
      connector_id: LANE_ID,
      source_id: '07_GOVERNMENT_SAFETY_ALERTS:SEA-01',
      source_name: 'AlertSeattle public feed and WordPress API',
      status: 'ok',
      stale_after_minutes: 15,
      record_count: 1,
      http_status: 200,
      last_observation_at: '2026-08-01T11:00:00Z',
      warnings: [],
      errors: [],
    },
    events: [{ source_id: '07_GOVERNMENT_SAFETY_ALERTS:SEA-01', event_id: 'lkg-d' }],
  };
  const result = await runNormalizeScenario({
    sourceKey: 'SEA-01',
    fetch,
    landing,
    parseOutput: { bySource: { '07_GOVERNMENT_SAFETY_ALERTS:SEA-01': malformedLkg } },
  });
  assert(result.source_health.status === 'failed', 'expected malformed LKG without retrieved_at to fail closed');
  assert(Array.isArray(result.events) && result.events.length === 0, 'expected malformed LKG without retrieved_at to return no events');
  return 'malformed LKG handled without throw';
}

async function scenarioE() {
  const input = buildCandidateInput({
    sourceHealth: [
      { source_id: '07_GOVERNMENT_SAFETY_ALERTS:NWS-01', status: 'ok' },
      { source_id: '07_GOVERNMENT_SAFETY_ALERTS:SEA-01', status: 'using_last_known_good' },
      { source_id: '07_GOVERNMENT_SAFETY_ALERTS:UW-01', status: 'failed' },
    ],
    events: [
      { source_id: '07_GOVERNMENT_SAFETY_ALERTS:NWS-01', route_relevance: { manual_review_required: false } },
      { source_id: '07_GOVERNMENT_SAFETY_ALERTS:SEA-01', route_relevance: { manual_review_required: false } },
    ],
  });
  const candidate = await runBuildCandidateScenario(input);
  assert(candidate.data_status === 'degraded', 'expected mixed live/LKG/failed dataStatus to be degraded');
  assert(candidate.connector_health.used_last_known_good === true, 'expected used_last_known_good to be true when any branch uses LKG');
  return 'mixed source state degraded';
}

async function scenarioF() {
  const input = buildCandidateInput({
    sourceHealth: [
      { source_id: '07_GOVERNMENT_SAFETY_ALERTS:NWS-01', status: 'using_last_known_good' },
      { source_id: '07_GOVERNMENT_SAFETY_ALERTS:SEA-01', status: 'using_last_known_good' },
      { source_id: '07_GOVERNMENT_SAFETY_ALERTS:UW-01', status: 'using_last_known_good' },
    ],
    events: [
      { source_id: '07_GOVERNMENT_SAFETY_ALERTS:NWS-01', route_relevance: { manual_review_required: false } },
    ],
  });
  const candidate = await runBuildCandidateScenario(input);
  assert(candidate.data_status === 'using_last_known_good', 'expected all-LKG candidate to advertise using_last_known_good');
  assert(candidate.connector_health.used_last_known_good === true, 'expected all-LKG candidate to flag used_last_known_good');
  return 'all-LKG candidate classified correctly';
}

async function scenarioG() {
  const input = buildCandidateInput({
    sourceHealth: [
      { source_id: '07_GOVERNMENT_SAFETY_ALERTS:NWS-01', status: 'failed' },
      { source_id: '07_GOVERNMENT_SAFETY_ALERTS:SEA-01', status: 'failed' },
      { source_id: '07_GOVERNMENT_SAFETY_ALERTS:UW-01', status: 'failed' },
    ],
    events: [],
  });
  const candidate = await runBuildCandidateScenario(input);
  assert(candidate.data_status === 'failed_fetch', 'expected all-failed candidate to remain failed_fetch');
  assert(candidate.connector_health.used_last_known_good === false, 'expected all-failed candidate to not claim LKG use');
  return 'all-failed candidate unchanged';
}

async function scenarioH() {
  const fetch = makeFetchSuccess([
    {
      id: 201,
      title: { rendered: 'No active banner detected' },
      excerpt: { rendered: 'No active banner detected.' },
      content: { rendered: '<p>No active banner detected.</p>' },
      link: 'https://example.com/clear',
      date: '2026-08-01T11:58:00Z',
      modified: '2026-08-01T11:59:00Z',
    },
  ]);
  const landing = makeLanding('07_GOVERNMENT_SAFETY_ALERTS:SEA-01', '/tmp/sea.json', 'hash_h', fetch.body);
  const lkg = makeLkgEntry({
    sourceId: '07_GOVERNMENT_SAFETY_ALERTS:SEA-01',
    sourceName: 'AlertSeattle public feed and WordPress API',
    retrievedAt: '2026-08-01T11:50:00Z',
    staleAfterMinutes: 15,
    status: 'using_last_known_good',
    events: [{ source_id: '07_GOVERNMENT_SAFETY_ALERTS:SEA-01', event_id: 'lkg-h' }],
  });
  const result = await runNormalizeScenario({ sourceKey: 'SEA-01', fetch, landing, lkg });
  assert(result.source_health.status === 'empty_but_valid', 'expected live success with no events to stay empty_but_valid');
  assert(result.source_health.status !== 'using_last_known_good', 'expected live success to ignore usable LKG');
  return 'live recovery overrode LKG as expected';
}

const loadWorkflowCache = loadWorkflow();

async function main() {
  const scenarios = [
    ['a', scenarioA],
    ['b', scenarioB],
    ['c', scenarioC],
    ['d', scenarioD],
    ['e', scenarioE],
    ['f', scenarioF],
    ['g', scenarioG],
    ['h', scenarioH],
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

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
