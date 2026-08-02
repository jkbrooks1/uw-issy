const fs = require('fs');
const vm = require('vm');

const WORKFLOW_PATH = '/Users/jkbrookspersonal/LocalSiteBuildFiles/BTF_UW-Issy_Route_Monitor/00_CONNECTORS/03_AIR_QUALITY/03_AIR_QUALITY_v1.json';
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
    connector_id: '03_AIR_QUALITY',
    connector_name: 'UW-Issaquah Air Quality Connector',
    connector_version: 'v0001',
    lane: '03_AIR_QUALITY',
    workflow_name: 'v0001.03_AirQualityConnector',
    run_id: '03_AIR_QUALITY-20260801T120000Z-001',
    run_stamp: '20260801T120000Z',
    generated_at: FIXED_NOW_ISO,
    published_at: null,
    output_root: '/files/uw-issy-connectors',
    canonical_gpx: 'data/route/UnivWA-Issaquah.gpx',
    source_configs: {
      ECO_01: {
        source_id: '03_AIR_QUALITY:ECO-01',
        source_name: 'Washington State Department of Ecology Air Quality Monitoring Hourly Results',
        freshness_threshold_minutes: 90,
        source_folder: 'ECO-01'
      }
    }
  };
}

function makeFetchSuccess(body, statusCode = 200) {
  return { body, statusCode };
}

function makeFetchFailure(message, statusCode = 503) {
  return { error: new Error(message), statusCode };
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
  errors = [],
  lastObservationAt,
  events = [],
  observations = [],
  routeSections = []
} = {}) {
  return {
    source_health: {
      schema_version: '1.0.0',
      connector_id: '03_AIR_QUALITY',
      source_id: '03_AIR_QUALITY:ECO-01',
      source_name: 'Washington State Department of Ecology Air Quality Monitoring Hourly Results',
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
    observations,
    route_sections: routeSections
  };
}

function buildCandidateInput({
  sourceHealth,
  events,
  observations = [],
  routeSections = [],
  validationWarnings = [],
  validationErrors = [],
  sourceWarnings = [],
  sourceErrors = [],
  candidateValidationPassed = true
}) {
  return {
    schema_version: '1.0.0',
    connector_id: '03_AIR_QUALITY',
    connector_name: 'UW-Issaquah Air Quality Connector',
    connector_version: 'v0001',
    lane: '03_AIR_QUALITY',
    run_id: '03_AIR_QUALITY-20260801T120000Z-001',
    run_stamp: '20260801T120000Z',
    generated_at: FIXED_NOW_ISO,
    output_root: '/files/uw-issy-connectors',
    canonical_gpx: 'data/route/UnivWA-Issaquah.gpx',
    source_health: sourceHealth,
    deduplicated_events: events,
    deduplicated_observations: observations,
    route_sections: routeSections,
    provenance: { source_ids_used: sourceHealth.map((source) => source.source_id), sources: [] },
    validation_warnings: validationWarnings,
    validation_errors: validationErrors,
    source_warnings: sourceWarnings,
    source_errors: sourceErrors,
    candidate_validation_passed: candidateValidationPassed,
    validator_version: '1.0.0',
    events,
    observations,
    metadata: {
      lane_summary: {
        current_category: 'Good',
        current_aqi_max: 22,
        burn_ban_status: 'no_ban',
        formal_alert_active: false,
        message: 'test'
      }
    }
  };
}

const loadWorkflowCache = loadWorkflow();

async function runNormalizeScenario({ fetch, landing, lkg, parseOutput, nodeName = 'Normalize ECO-01 Events' }) {
  const code = getCode(loadWorkflowCache.codeByName, nodeName);
  const output = await runNodeCode(code, {
    filename: nodeName + '.vm.js',
    nodeOutputs: {
      'Initialize Run Metadata': makeRunMetadata(),
      'Fetch ECO-01 Monitor Results': fetch,
      'Land ECO-01 Raw Payload': landing,
      'Parse Last Known Good': parseOutput ?? { bySource: lkg ? { '03_AIR_QUALITY:ECO-01': lkg } : {} }
    },
    inputItems: [{ json: {} }]
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
  if (!condition) {
    throw new Error(message);
  }
}

async function scenarioA() {
  const fetch = makeFetchSuccess({
    features: [
      {
        attributes: {
          SiteId: '19',
          SiteName: 'Issaquah-Lake Sammamish',
          SiteLocation: '2000 NW Sammamish rd',
          DateTime_PST: '2026-07-29T19:00:00-07:00',
          AQIValue: 22,
          AQICategory: 'Good',
          AQI_PM25: 9,
          AQI_PM25_Cat: 'Good',
          PM25_Value: 1.6,
          AQI_O3: 22,
          AQI_O3_Cat: 'Good',
          O3_Value: 0.027
        }
      }
    ]
  });
  const landing = makeLanding('03_AIR_QUALITY:ECO-01', '/tmp/eco01.json', 'hash_a', fetch.body);
  const lkg = makeLkgEntry({
    retrievedAt: '2026-08-01T11:45:00Z',
    events: [{ source_id: '03_AIR_QUALITY:ECO-01', event_id: 'lkg-a' }]
  });
  const result = await runNormalizeScenario({ fetch, landing, lkg });
  assert(result.source_health.status === 'ok', 'expected live success to stay ok');
  assert(result.source_health.status !== 'using_last_known_good', 'expected live success to ignore LKG');
  assert(Array.isArray(result.observations) && result.observations.length === 1, 'expected one observation');
  return 'live success stayed live';
}

async function scenarioB() {
  const fetch = makeFetchFailure('upstream timeout');
  const landing = makeLanding('03_AIR_QUALITY:ECO-01', '/tmp/eco01.json', 'hash_b', '<html></html>');
  const lkgTimestamp = '2026-08-01T11:30:00Z';
  const lkg = makeLkgEntry({
    retrievedAt: lkgTimestamp,
    warnings: ['cached warning'],
    events: [{ source_id: '03_AIR_QUALITY:ECO-01', event_id: 'lkg-b' }],
    observations: [
      {
        source_id: '03_AIR_QUALITY:ECO-01',
        observation_id: 'lkg-b-ob',
        observed_at: lkgTimestamp,
        aqi_value: 18,
        aqi_category: 'Good',
        severity: 'good',
        route_relevance: { method: 'point_to_route_distance', distance_km: 1, threshold_km: 12.87, route_section_id: 'aqp4_issaquah' },
        source_record_id: '19',
        retrieved_at: lkgTimestamp
      }
    ],
    routeSections: []
  });
  const result = await runNormalizeScenario({ fetch, landing, lkg });
  assert(result.source_health.status === 'using_last_known_good', 'expected usable LKG to be served');
  assert(result.source_health.retrieved_at === lkgTimestamp, 'expected original LKG retrieved_at to be preserved');
  assert(Array.isArray(result.source_health.errors) && result.source_health.errors.some((msg) => msg.includes('upstream timeout')), 'expected live failure to be retained');
  assert(Array.isArray(result.observations) && result.observations.length === 1, 'expected LKG observation to be reused');
  return 'usable LKG served with original timestamp';
}

async function scenarioC() {
  const fetch = makeFetchFailure('upstream timeout');
  const landing = makeLanding('03_AIR_QUALITY:ECO-01', '/tmp/eco01.json', 'hash_c', '<html></html>');
  const lkg = makeLkgEntry({
    retrievedAt: '2026-07-31T10:00:00Z',
    events: [{ source_id: '03_AIR_QUALITY:ECO-01', event_id: 'lkg-c' }]
  });
  const result = await runNormalizeScenario({ fetch, landing, lkg });
  assert(result.source_health.status === 'failed', 'expected expired LKG to be rejected');
  assert(Array.isArray(result.observations) && result.observations.length === 0, 'expected expired LKG to produce no observations');
  return 'expired LKG rejected';
}

async function scenarioD() {
  const parseInvalid = await runParseScenario(makeBinaryStubItem(), 'not valid json');
  assert(parseInvalid.bySource && Object.keys(parseInvalid.bySource).length === 0, 'expected invalid JSON to return empty lookup');

  const parseMissingBinary = await runParseScenario({ json: { error: 'read failed' } });
  assert(parseMissingBinary.bySource && Object.keys(parseMissingBinary.bySource).length === 0, 'expected missing binary to return empty lookup');

  const malformedLkg = { source_health: { status: 'ok' }, events: [{ source_id: '03_AIR_QUALITY:ECO-01', event_id: 'bad' }] };
  const result = await runNormalizeScenario({
    fetch: makeFetchFailure('upstream outage'),
    landing: makeLanding('03_AIR_QUALITY:ECO-01', '/tmp/eco01.json', 'hash_d', '<html></html>'),
    parseOutput: { bySource: { '03_AIR_QUALITY:ECO-01': malformedLkg } }
  });
  assert(result.source_health.status === 'failed', 'expected malformed LKG without retrieved_at to fail closed');
  assert(Array.isArray(result.observations) && result.observations.length === 0, 'expected malformed LKG to return no observations');
  return 'malformed LKG handled without throw';
}

async function scenarioE() {
  const input = buildCandidateInput({
    sourceHealth: [
      { source_id: '03_AIR_QUALITY:ECO-01', status: 'ok', retrieved_at: FIXED_NOW_ISO, stale_after_minutes: 90, record_count: 1, http_status: 200, last_observation_at: FIXED_NOW_ISO, warnings: [], errors: [] },
      { source_id: '03_AIR_QUALITY:ECO-02', status: 'using_last_known_good', retrieved_at: FIXED_NOW_ISO, stale_after_minutes: 720, record_count: 1, http_status: 200, last_observation_at: FIXED_NOW_ISO, warnings: [], errors: [] },
      { source_id: '03_AIR_QUALITY:PSCAA-02', status: 'failed', retrieved_at: FIXED_NOW_ISO, stale_after_minutes: 1440, record_count: 0, http_status: 503, last_observation_at: null, warnings: [], errors: ['failure'] }
    ],
    events: [{ source_id: '03_AIR_QUALITY:ECO-02', event_type: 'smoke_forecast', event_id: 'e', status: 'forecast', severity: 'moderate', route_relevant: true, source_record_id: '1' }]
  });
  const candidate = await runBuildCandidateScenario(input);
  assert(candidate.data_status === 'degraded', 'expected mixed live/LKG/failed dataStatus to be degraded');
  assert(candidate.connector_health.used_last_known_good === true, 'expected used_last_known_good to be true when any branch uses LKG');
  return 'mixed source state degraded';
}

async function scenarioF() {
  const input = buildCandidateInput({
    sourceHealth: [
      { source_id: '03_AIR_QUALITY:ECO-01', status: 'using_last_known_good', retrieved_at: FIXED_NOW_ISO, stale_after_minutes: 90, record_count: 1, http_status: 200, last_observation_at: FIXED_NOW_ISO, warnings: [], errors: [] },
      { source_id: '03_AIR_QUALITY:ECO-02', status: 'using_last_known_good', retrieved_at: FIXED_NOW_ISO, stale_after_minutes: 720, record_count: 1, http_status: 200, last_observation_at: FIXED_NOW_ISO, warnings: [], errors: [] },
      { source_id: '03_AIR_QUALITY:PSCAA-02', status: 'using_last_known_good', retrieved_at: FIXED_NOW_ISO, stale_after_minutes: 1440, record_count: 1, http_status: 200, last_observation_at: FIXED_NOW_ISO, warnings: [], errors: [] }
    ],
    events: [{ source_id: '03_AIR_QUALITY:PSCAA-02', event_type: 'burn_ban', event_id: 'f', status: 'current', severity: 'good', route_relevant: true, source_record_id: '1' }]
  });
  const candidate = await runBuildCandidateScenario(input);
  assert(candidate.data_status === 'using_last_known_good', 'expected all-LKG candidate to advertise using_last_known_good');
  assert(candidate.connector_health.used_last_known_good === true, 'expected all-LKG candidate to flag used_last_known_good');
  return 'all-LKG candidate classified correctly';
}

async function scenarioG() {
  const input = buildCandidateInput({
    sourceHealth: [
      { source_id: '03_AIR_QUALITY:ECO-01', status: 'failed', retrieved_at: FIXED_NOW_ISO, stale_after_minutes: 90, record_count: 0, http_status: 503, last_observation_at: null, warnings: [], errors: ['failure'] },
      { source_id: '03_AIR_QUALITY:ECO-02', status: 'failed', retrieved_at: FIXED_NOW_ISO, stale_after_minutes: 720, record_count: 0, http_status: 503, last_observation_at: null, warnings: [], errors: ['failure'] },
      { source_id: '03_AIR_QUALITY:PSCAA-02', status: 'failed', retrieved_at: FIXED_NOW_ISO, stale_after_minutes: 1440, record_count: 0, http_status: 503, last_observation_at: null, warnings: [], errors: ['failure'] }
    ],
    events: []
  });
  const candidate = await runBuildCandidateScenario(input);
  assert(candidate.data_status === 'failed_fetch', 'expected all-failed candidate to remain failed_fetch');
  assert(candidate.connector_health.used_last_known_good === false, 'expected all-failed candidate to not claim LKG use');
  return 'all-failed candidate unchanged';
}

async function scenarioH() {
  const fetch = makeFetchSuccess({
    features: [
      {
        attributes: {
          SiteId: '19',
          SiteName: 'Issaquah-Lake Sammamish',
          SiteLocation: '2000 NW Sammamish rd',
          DateTime_PST: '2026-08-01T11:59:00-07:00',
          AQIValue: 18,
          AQICategory: 'Good',
          AQI_PM25: 8,
          AQI_PM25_Cat: 'Good',
          PM25_Value: 1.2,
          AQI_O3: 18,
          AQI_O3_Cat: 'Good',
          O3_Value: 0.024
        }
      }
    ]
  });
  const landing = makeLanding('03_AIR_QUALITY:ECO-01', '/tmp/eco01.json', 'hash_h', fetch.body);
  const lkg = makeLkgEntry({
    retrievedAt: '2026-08-01T11:50:00Z',
    status: 'using_last_known_good',
    events: [{ source_id: '03_AIR_QUALITY:ECO-01', event_id: 'lkg-h' }],
    observations: [
      {
        source_id: '03_AIR_QUALITY:ECO-01',
        observation_id: 'lkg-h-ob',
        observed_at: '2026-08-01T11:50:00Z',
        aqi_value: 25,
        aqi_category: 'Good',
        severity: 'good',
        route_relevance: { method: 'point_to_route_distance', distance_km: 1, threshold_km: 12.87, route_section_id: 'aqp4_issaquah' },
        source_record_id: '19',
        retrieved_at: '2026-08-01T11:50:00Z'
      }
    ]
  });
  const result = await runNormalizeScenario({ fetch, landing, lkg });
  assert(result.source_health.status === 'ok', 'expected live success with no issue to stay ok');
  assert(result.source_health.status !== 'using_last_known_good', 'expected live success to ignore usable LKG');
  assert(Array.isArray(result.observations) && result.observations[0].observed_at === '2026-08-01T18:59:00.000Z', 'expected live observation to win over LKG');
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
      console.log('PASS ' + label + ': ' + detail);
    } catch (error) {
      console.log('FAIL ' + label + ': ' + error.message);
    }
  }

  if (passed === scenarios.length) {
    console.log('PASS summary: ' + passed + '/' + scenarios.length + ' scenarios passed');
    return;
  }

  console.log('FAIL summary: ' + passed + '/' + scenarios.length + ' scenarios passed');
  process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
