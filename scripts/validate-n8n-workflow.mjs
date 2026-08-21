#!/usr/bin/env node
// Usage: node scripts/validate-n8n-workflow.mjs <workflow-json-path> <expected-connector-id>
//
// Structural validity check for a canonical n8n workflow export. Confirms
// the file is valid JSON, has a sane node graph (at least one trigger, at
// least one node, no duplicate node ids), stays inactive, and that its
// embedded connector_id/lane/run-id-prefix string literals inside Code
// node jsCode bodies actually match the expected connector, so a rename
// or import cannot silently carry a stale identity. This is deliberately
// a structural/identity check, not a full n8n schema validator.

import { existsSync, readFileSync } from "node:fs";

class ValidationFailure extends Error {}

function fail(reason) {
  throw new ValidationFailure(reason);
}

function run(workflowPath, expectedConnectorId) {
  if (!workflowPath || !expectedConnectorId) {
    throw new ValidationFailure(
      "usage: node scripts/validate-n8n-workflow.mjs <workflow-json-path> <expected-connector-id>",
    );
  }
  if (!existsSync(workflowPath)) {
    fail(`Workflow file does not exist: ${workflowPath}`);
  }

  let raw;
  try {
    raw = readFileSync(workflowPath, "utf8");
  } catch (cause) {
    fail(`Workflow file could not be read: ${workflowPath} (${cause.message})`);
  }

  let workflow;
  try {
    workflow = JSON.parse(raw);
  } catch (cause) {
    fail(`Workflow file is not valid JSON: ${workflowPath} (${cause.message})`);
  }
  if (Array.isArray(workflow)) {
    workflow = workflow[0]; // a live single-workflow export via `n8n export:workflow --id=` wraps in an array
  }

  if (typeof workflow.name !== "string" || workflow.name.length === 0) {
    fail(`Workflow has no name: ${workflowPath}`);
  }
  if (workflow.active !== false) {
    fail(`Workflow must be inactive (active: false) in a canonical export: ${workflowPath} (active: ${workflow.active})`);
  }

  const nodes = Array.isArray(workflow.nodes) ? workflow.nodes : [];
  if (nodes.length === 0) {
    fail(`Workflow has no nodes: ${workflowPath}`);
  }

  const ids = new Set();
  for (const node of nodes) {
    if (!node.id) fail(`Workflow has a node with no id: ${workflowPath}`);
    if (ids.has(node.id)) fail(`Workflow has a duplicate node id "${node.id}": ${workflowPath}`);
    ids.add(node.id);
  }

  const hasTrigger = nodes.some(
    (n) => typeof n.type === "string" && (n.type.includes("Trigger") || n.type.includes("trigger")),
  );
  if (!hasTrigger) {
    fail(`Workflow has no trigger node: ${workflowPath}`);
  }

  const jsCodeBlobs = nodes
    .map((n) => n.parameters?.jsCode)
    .filter((code) => typeof code === "string")
    .join("\n");

  if (!jsCodeBlobs.includes(`connector_id: '${expectedConnectorId}'`)) {
    fail(`No Code node sets connector_id: '${expectedConnectorId}' — found identity does not match expected connector: ${workflowPath}`);
  }
  if (!jsCodeBlobs.includes(`lane: '${expectedConnectorId}'`)) {
    fail(`No Code node sets lane: '${expectedConnectorId}': ${workflowPath}`);
  }
  if (!jsCodeBlobs.includes(`'${expectedConnectorId}-'`)) {
    fail(`No Code node builds a run_id (or similar identity string) with prefix '${expectedConnectorId}-': ${workflowPath}`);
  }

  const tagNames = Array.isArray(workflow.tags) ? workflow.tags.map((t) => t.name) : [];

  console.log(
    `PASS: ${workflowPath} — name "${workflow.name}", ${nodes.length} node(s), trigger present, ` +
      `active=false, connector_id/lane/run_id prefix all match "${expectedConnectorId}", tags: [${tagNames.join(", ")}]`,
  );
}

try {
  run(process.argv[2], process.argv[3]);
} catch (err) {
  if (err instanceof ValidationFailure) {
    process.stderr.write(`FAIL: ${err.message}\n`);
    process.exit(1);
  }
  throw err;
}
