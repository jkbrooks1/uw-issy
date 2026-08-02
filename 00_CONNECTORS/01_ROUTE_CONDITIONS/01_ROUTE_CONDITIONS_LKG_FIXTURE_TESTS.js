const fs = require('fs');
const vm = require('vm');

const WORKFLOW_PATH = '/Users/jkbrookspersonal/LocalSiteBuildFiles/BTF_UW-Issy_Route_Monitor/00_CONNECTORS/01_ROUTE_CONDITIONS/01_ROUTE_CONDITIONS_v4.json';
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
      // Mirrors real n8n: getBinaryDataBuffer abstracts over storage mode (inline base64,
      // filesystem-v2, etc.) so Code nodes never read item.binary.<prop>.data directly.
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

// A stub binary marker: real n8n items carry only a storage reference here (e.g. the
// literal string "filesystem-v2"), never the actual content - actual content must always
// be fetched via this.helpers.getBinaryDataBuffer(). The mock enforces the same discipline.
function makeBinaryStubItem() {
  return { binary: { data: { data: 'filesystem-v2' } } };
}

function getCode(codeByName, nodeName) {
  const code = codeByName.get(nodeName);
  if (!code) {
    throw new Error('Missing node code: ' + nodeName);
  }
  return code;
}

function makeRunMetadata() {
  return {
    schema_version: '1.0.0',
    connector_id: '01_ROUTE_CONDITIONS',
    connector_name: 'UW-Issaquah Route Conditions Connector',
    connector_version: 'v0001',
    lane: '01_ROUTE_CONDITIONS',
    run_id: '01_ROUTE_CONDITIONS-20260801T120000Z-001',
    run_stamp: '20260801T120000Z',
    generated_at: FIXED_NOW_ISO,
    published_at: null,
    output_root: '/files/uw-issy-connectors',
    canonical_gpx: 'data/route/UnivWA-Issaquah.gpx'
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

function makeLkgEntry({
  retrievedAt,
  staleAfterMinutes = 1440,
  status = 'ok',
  warnings = [],
  lastObservationAt,
  events = []
} = {}) {
  return {
    source_health: {
      schema_version: '1.0.0',
      connector_id: '01_ROUTE_CONDITIONS',
      source_id: '01_ROUTE_CONDITIONS:KC-03',
      source_name: 'King County Parks - East Lake Sammamish Trail (Leafline Trails Network) page',
      status,
      retrieved_at: retrievedAt,
      stale_after_minutes: staleAfterMinutes,
      record_count: events.length,
      http_status: 200,
      last_observation_at: lastObservationAt ?? retrievedAt,
      warnings,
      errors: []
    },
    events
  };
}

function makeNormalizeInputs({
  fetch,
  landing,
  lkg,
  parseOutput
}) {
  const nodeOutputs = {
    'Initialize Run Metadata': makeRunMetadata(),
    'Fetch KC-03 Page': fetch,
    'Land KC-03 Raw Payload': landing,
    'Parse Last Known Good': parseOutput ?? { bySource: lkg ? { '01_ROUTE_CONDITIONS:KC-03': lkg } : {} }
  };
  return nodeOutputs;
}

function buildCandidateInput({ sourceHealth, events, validationWarnings = [], validationErrors = [], sourceWarnings = [], sourceErrors = [] }) {
  return {
    schema_version: '1.0.0',
    connector_id: '01_ROUTE_CONDITIONS',
    connector_name: 'UW-Issaquah Route Conditions Connector',
    connector_version: 'v0001',
    lane: '01_ROUTE_CONDITIONS',
    run_id: '01_ROUTE_CONDITIONS-20260801T120000Z-001',
    run_stamp: '20260801T120000Z',
    generated_at: FIXED_NOW_ISO,
    output_root: '/files/uw-issy-connectors',
    canonical_gpx: 'data/route/UnivWA-Issaquah.gpx',
    source_health: sourceHealth,
    deduplicated_events: events,
    route_sections: [],
    candidate_validation_passed: true,
    validation_warnings: validationWarnings,
    validation_errors: validationErrors,
    source_warnings: sourceWarnings,
    source_errors: sourceErrors
  };
}

async function runNormalizeScenario({ fetch, landing, lkg, parseOutput, body, label }) {
  const { codeByName } = loadWorkflowCache;
  const code = getCode(codeByName, 'Normalize KC-03 Events');
  const output = await runNodeCode(code, {
    filename: 'Normalize KC-03 Events.vm.js',
    nodeOutputs: makeNormalizeInputs({ fetch, landing, lkg, parseOutput }),
    inputItems: [{ json: {} }]
  });
  const result = output[0].json;
  if (label) {
    return { label, result };
  }
  return result;
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
  if (!condition) {
    throw new Error(message);
  }
}

function makeFetchSuccess(body) {
  return {
    body,
    statusCode: 200
  };
}

function makeFetchFailure(message) {
  return {
    error: new Error(message),
    statusCode: 503
  };
}

const loadWorkflowCache = loadWorkflow();

async function scenarioA() {
  const fetch = makeFetchSuccess('<html><body><h2>East Lake Sammamish Trail closure</h2><p>Trail closed.</p></body></html>');
  const landing = makeLanding('01_ROUTE_CONDITIONS:KC-03', '/tmp/kc03.json', 'hash_a', fetch.body);
  const lkg = makeLkgEntry({
    retrievedAt: '2026-08-01T11:45:00Z',
    events: [{ source_id: '01_ROUTE_CONDITIONS:KC-03', id: 'lkg-a' }]
  });
  const result = await runNormalizeScenario({ fetch, landing, lkg });
  assert(result.source_health.status === 'ok', 'expected live success to stay ok');
  assert(result.source_health.status !== 'using_last_known_good', 'expected live success to ignore LKG');
  return 'live success stayed live';
}

async function scenarioB() {
  const fetch = makeFetchFailure('upstream timeout');
  const landing = makeLanding('01_ROUTE_CONDITIONS:KC-03', '/tmp/kc03.json', 'hash_b', '<html></html>');
  const lkgTimestamp = '2026-08-01T11:30:00Z';
  const lkg = makeLkgEntry({
    retrievedAt: lkgTimestamp,
    warnings: ['cached warning'],
    events: [{ source_id: '01_ROUTE_CONDITIONS:KC-03', id: 'lkg-b' }]
  });
  const result = await runNormalizeScenario({ fetch, landing, lkg });
  assert(result.source_health.status === 'using_last_known_good', 'expected usable LKG to be served');
  assert(result.source_health.retrieved_at === lkgTimestamp, 'expected original LKG retrieved_at to be preserved');
  assert(Array.isArray(result.source_health.errors) && result.source_health.errors.some(msg => msg.includes('upstream timeout')), 'expected live failure to be retained');
  return 'usable LKG served with original timestamp';
}

async function scenarioC() {
  const fetch = makeFetchFailure('upstream timeout');
  const landing = makeLanding('01_ROUTE_CONDITIONS:KC-03', '/tmp/kc03.json', 'hash_c', '<html></html>');
  const lkg = makeLkgEntry({
    retrievedAt: '2026-07-31T10:00:00Z',
    events: [{ source_id: '01_ROUTE_CONDITIONS:KC-03', id: 'lkg-c' }]
  });
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
  const landing = makeLanding('01_ROUTE_CONDITIONS:KC-03', '/tmp/kc03.json', 'hash_d', '<html></html>');
  const malformedLkg = {
    source_health: {
      schema_version: '1.0.0',
      connector_id: '01_ROUTE_CONDITIONS',
      source_id: '01_ROUTE_CONDITIONS:KC-03',
      source_name: 'King County Parks - East Lake Sammamish Trail (Leafline Trails Network) page',
      status: 'ok',
      stale_after_minutes: 1440,
      record_count: 1,
      http_status: 200,
      last_observation_at: '2026-08-01T11:00:00Z',
      warnings: [],
      errors: []
    },
    events: [{ source_id: '01_ROUTE_CONDITIONS:KC-03', id: 'lkg-d' }]
  };
  const result = await runNormalizeScenario({ fetch, landing, parseOutput: { bySource: { '01_ROUTE_CONDITIONS:KC-03': malformedLkg } } });
  assert(result.source_health.status === 'failed', 'expected malformed LKG without retrieved_at to fail closed');
  assert(Array.isArray(result.events) && result.events.length === 0, 'expected malformed LKG without retrieved_at to return no events');
  return 'malformed LKG handled without throw';
}

async function scenarioE() {
  const input = buildCandidateInput({
    sourceHealth: [
      { source_id: '01_ROUTE_CONDITIONS:KC-03', status: 'ok' },
      { source_id: '01_ROUTE_CONDITIONS:REDM-01', status: 'using_last_known_good' },
      { source_id: '01_ROUTE_CONDITIONS:ISS-03', status: 'failed' }
    ],
    events: [
      { source_id: '01_ROUTE_CONDITIONS:KC-03', route_relevance: { manual_review_required: false } },
      { source_id: '01_ROUTE_CONDITIONS:REDM-01', route_relevance: { manual_review_required: false } }
    ]
  });
  const candidate = await runBuildCandidateScenario(input);
  assert(candidate.data_status === 'degraded', 'expected mixed live/LKG/failed dataStatus to be degraded');
  assert(candidate.connector_health.used_last_known_good === true, 'expected used_last_known_good to be true when any branch uses LKG');
  return 'mixed source state degraded';
}

async function scenarioF() {
  const input = buildCandidateInput({
    sourceHealth: [
      { source_id: '01_ROUTE_CONDITIONS:KC-03', status: 'using_last_known_good' },
      { source_id: '01_ROUTE_CONDITIONS:REDM-01', status: 'using_last_known_good' },
      { source_id: '01_ROUTE_CONDITIONS:ISS-03', status: 'using_last_known_good' }
    ],
    events: [
      { source_id: '01_ROUTE_CONDITIONS:KC-03', route_relevance: { manual_review_required: false } }
    ]
  });
  const candidate = await runBuildCandidateScenario(input);
  assert(candidate.data_status === 'using_last_known_good', 'expected all-LKG candidate to advertise using_last_known_good');
  assert(candidate.connector_health.used_last_known_good === true, 'expected all-LKG candidate to flag used_last_known_good');
  return 'all-LKG candidate classified correctly';
}

async function scenarioG() {
  const input = buildCandidateInput({
    sourceHealth: [
      { source_id: '01_ROUTE_CONDITIONS:KC-03', status: 'failed' },
      { source_id: '01_ROUTE_CONDITIONS:REDM-01', status: 'failed' },
      { source_id: '01_ROUTE_CONDITIONS:ISS-03', status: 'failed' }
    ],
    events: []
  });
  const candidate = await runBuildCandidateScenario(input);
  assert(candidate.data_status === 'failed_fetch', 'expected all-failed candidate to remain failed_fetch');
  assert(candidate.connector_health.used_last_known_good === false, 'expected all-failed candidate to not claim LKG use');
  return 'all-failed candidate unchanged';
}

async function scenarioH() {
  const fetch = makeFetchSuccess('<html><body><p>No active closure banner.</p></body></html>');
  const landing = makeLanding('01_ROUTE_CONDITIONS:KC-03', '/tmp/kc03.json', 'hash_h', fetch.body);
  const lkg = makeLkgEntry({
    retrievedAt: '2026-08-01T11:50:00Z',
    status: 'using_last_known_good',
    events: [{ source_id: '01_ROUTE_CONDITIONS:KC-03', id: 'lkg-h' }]
  });
  const result = await runNormalizeScenario({ fetch, landing, lkg });
  assert(result.source_health.status === 'empty_but_valid', 'expected live success with no events to stay empty_but_valid');
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
