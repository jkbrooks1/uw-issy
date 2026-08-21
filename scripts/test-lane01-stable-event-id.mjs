import fs from "node:fs";
import vm from "node:vm";

const workflowPath = process.argv[2] || "00_WORKFLOWS/v03.UWI_LANE01.json";
const workflow = JSON.parse(fs.readFileSync(workflowPath, "utf8"));

const codeByName = new Map();
for (const node of workflow.nodes || []) {
  if (node?.name && typeof node.parameters?.jsCode === "string") {
    codeByName.set(node.name, node.parameters.jsCode);
  }
}

function getCode(name) {
  const code = codeByName.get(name);
  if (!code) throw new Error(`Missing node code: ${name}`);
  return code;
}

async function runCode(name, nodeOutputs) {
  const context = {
    Buffer,
    Date,
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
    console,
    sourceHealth: undefined,
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
      first: () => ({ json: {} }),
      all: () => [{ json: {} }],
    },
  };
  context.globalThis = context;
  context.global = context;
  const script = new vm.Script(`(async function() {\n${getCode(name)}\n})()`);
  return script.runInContext(vm.createContext(context));
}

function makeRun(generatedAt = "2026-08-20T10:00:00Z") {
  return {
    schema_version: "1.0.0",
    connector_id: "01_ROUTE_CONDITIONS",
    connector_name: "UW-Issaquah Route Conditions Connector",
    connector_version: "v0003",
    lane: "01_ROUTE_CONDITIONS",
    workflow_name: "v03.UWI_LANE01",
    run_id: `01_ROUTE_CONDITIONS-${generatedAt.replace(/[-:]/g, "").replace(/\\.\\d{3}Z$/, "Z")}-001`,
    run_stamp: generatedAt.replace(/[-:]/g, "").replace(/\\.\\d{3}Z$/, "Z"),
    generated_at: generatedAt,
    output_root: "/files/uw-issy-connectors",
    canonical_gpx: "data/route/UnivWA-Issaquah.gpx",
  };
}

function makeKcOutputs({ body, contentHash = "hash_fixture_a", generatedAt }) {
  return {
    "Initialize Run Metadata": makeRun(generatedAt),
    "Fetch KC-03 Page": { body, statusCode: 200 },
    "Land KC-03 Raw Payload": {
      file_path: "/files/uw-issy-connectors/raw/01_ROUTE_CONDITIONS/landings/KC-03_fixture.json",
      source_id: "01_ROUTE_CONDITIONS:KC-03",
      source_name: "KC-03 fixture",
      content_hash: contentHash,
      retrieved_at: generatedAt || "2026-08-20T10:00:00Z",
      body,
    },
    "Parse Last Known Good": { bySource: {} },
  };
}

function makeRedmOutputs() {
  return {
    "Initialize Run Metadata": makeRun("2026-08-20T10:00:00Z"),
    "Fetch REDM-01 Alerts": {
      body: {
        features: [
          {
            attributes: {
              AlertID: "REDM-FIXTURE-NEW-1",
              AlertName: "Sammamish River Trail construction closure",
              LocationDescription: "Sammamish River Trail near Marymoor Park",
              TrafficImpactDescription: "Trail closure with signed detour for construction.",
              AlertStatus: "Active",
              AlertStartDate: Date.parse("2026-09-01T00:00:00Z"),
              AlertEndDate: Date.parse("2026-09-15T00:00:00Z"),
            },
            geometry: { x: -122.13, y: 47.66 },
          },
        ],
      },
      statusCode: 200,
    },
    "Land REDM-01 Raw Payload": {
      file_path: "/files/uw-issy-connectors/raw/01_ROUTE_CONDITIONS/landings/REDM-01_fixture.json",
      source_id: "01_ROUTE_CONDITIONS:REDM-01",
      source_name: "REDM-01 fixture",
      content_hash: "hash_redm_fixture",
      retrieved_at: "2026-08-20T10:00:00Z",
    },
    "Parse Last Known Good": { bySource: {} },
  };
}

const baseClosureHtml = `
  <html><body><h2>East Lake Sammamish Trail closure</h2>
  <p>The East Lake Sammamish Trail is closed between Louis Thompson Rd NE and NE Inglewood Hill Rd starting June 1, 2026 through the end of 2026, with no detour.</p>
  </body></html>`;

const changedTextHtml = `
  <html><body><nav>updated menu text</nav><h2>East Lake Sammamish Trail closure</h2>
  <p>The East Lake Sammamish Trail remains closed between Louis Thompson Rd NE and NE Inglewood Hill Rd starting June 1, 2026 through the end of 2026, with no detour.</p>
  <footer>page refreshed with new footer copy</footer></body></html>`;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const unchangedA = await runCode("Normalize KC-03 Events", makeKcOutputs({ body: baseClosureHtml, contentHash: "hash_a" }));
const unchangedB = await runCode("Normalize KC-03 Events", makeKcOutputs({ body: baseClosureHtml, contentHash: "hash_a" }));
const changedText = await runCode("Normalize KC-03 Events", makeKcOutputs({ body: changedTextHtml, contentHash: "hash_b" }));
const changedTime = await runCode(
  "Normalize KC-03 Events",
  makeKcOutputs({ body: baseClosureHtml, contentHash: "hash_a", generatedAt: "2026-08-20T13:00:00Z" }),
);
const redm = await runCode("Normalize REDM-01 Events", makeRedmOutputs());

const idA = unchangedA[0].json.events[0]?.event_id;
const idB = unchangedB[0].json.events[0]?.event_id;
const idChangedText = changedText[0].json.events[0]?.event_id;
const idChangedTime = changedTime[0].json.events[0]?.event_id;
const redmId = redm[0].json.events[0]?.event_id;

assert(idA, "Test A setup produced no KC-03 event");
assert(idA === idB, "Test A failed: unchanged event did not keep same event_id");
assert(idA === idChangedText, "Test B failed: source text/content hash change changed event_id");
assert(idA === idChangedTime, "Test C failed: verification timestamp change changed event_id");
assert(redmId, "Test D setup produced no REDM event");
assert(idA !== redmId, "Test D failed: distinct real-world event did not get a different event_id");

const result = {
  workflowPath,
  workflowName: workflow.name,
  tests: [
    { id: "A", name: "unchanged event", result: "PASS", event_id: idA },
    { id: "B", name: "same event changed page text/hash", result: "PASS", event_id: idChangedText },
    { id: "C", name: "same event changed verification time", result: "PASS", event_id: idChangedTime },
    { id: "D", name: "distinct real-world event fixture", result: "PASS", event_id: redmId },
  ],
};

console.log(JSON.stringify(result, null, 2));
