# Claude Code Prompt: Take Over and Complete the UWISSY Project

You are taking over the entire UWISSY project from another coding agent. Continue from the current live state; do not restart or redesign the project. Read the transition document and current project rules first. The primary remaining implementation task is to build, test, debug, upload, and retest an external dead-man watchdog on the OVH KKB n8n instance, then help capture the remaining unattended scheduled-cycle proof and closeout evidence.

## Objective

Create an n8n workflow on the independent OVH n8n instance that monitors UWISSY's public system-health document:

`https://uw-issy.biketourfrance.net/data/system-health.json`

The workflow is an external dead-man/freshness watchdog. It must detect when UWISSY has failed to publish fresh, valid, complete monitoring results after a scheduled production cycle.

The OVH host is independent from the Hetzner n8n host that runs UWISSY. Do not install anything on the Hetzner host and do not modify UWISSY's production workflow.

Important correction: `monitor-status.json` does not exist. Its URL returns the SPA HTML fallback with HTTP 200, not JSON. Do not recreate, invent, or use that endpoint. Use the real published `system-health.json` document as the freshness/completion signal.

## Overall project outcome

The overall UWISSY project is intended to provide a dependable, unattended route-monitoring production system: scheduled source lanes run, Lane 20 assembles the current release input, Lane 30 suppresses duplicates, GitHub Actions validates and deploys the release, Cloudflare publishes the public site and machine-readable status, and production verification confirms the result. The final project outcome is not merely a successful n8n execution; it is an independently observable production chain that either proves a fresh verified release or reliably signals that the chain has stopped, gone stale, or failed.

This OVH workflow is the external dead-man/freshness watchdog needed to complete that outcome. It is one remaining project component, not a separate project. It is not a replacement for UWISSY, GitHub Actions, Cloudflare Pages, or the existing production verification steps.

The entire project is not closed yet. The two remaining mandatory closeout gates are:

- Configure and prove the external watchdog.
- Capture real unattended scheduled-cycle evidence using trigger-mode executions for the final active UWISSY schedules.

## Access

The canonical UWISSY project root is:

`/Users/jkbrookspersonal/LocalSiteBuildFiles/BTF_UW-Issy_Route_Monitor`

The full-project transition document is:

`/Users/jkbrookspersonal/LocalSiteBuildFiles/BTF_UW-Issy_Route_Monitor/00_DOCS/OVH_UWISSY_DEADMAN_TRANSITION.md`

The detailed not-closed closeout record is:

`/Users/jkbrookspersonal/LocalSiteBuildFiles/BTF_UW-Issy_Route_Monitor/00_DOCS/2026-08-20_UWISSY_FINAL_CLOSEOUT_NOT_CLOSED.md`

Inspect those documents and the project rules before changing anything.

The OVH n8n web interface is:

`https://kkb.acceler8-ai.com/n8n`

The n8n API is on the redirected host:

`https://kkb-n8n.acceler8-ai.com/api/v1`

The administrator account is `jb@acceler8-ai.com`. Do not ask for, print, store, or expose the password.

The API key is stored in the macOS Keychain under:

`OVH_KKB_N8N_API_KEY`

When running from the user's Mac, retrieve it only at runtime with:

```bash
OVH_N8N_API_KEY="$(security find-generic-password -a "$USER" -s "OVH_KKB_N8N_API_KEY" -w)"
```

Use the n8n API header `X-N8N-API-KEY`. Never print the key or include it in a file, workflow JSON, shell history, logs, screenshots, or your response.

SSH access to the OVH VPS is available through the user's existing SSH alias:

`ssh ovh-kkb`

Use SSH only for read-only inspection unless a change is explicitly required for this task. Do not change the Docker stack, Caddy, PostgreSQL, credentials, or existing KKB workflows.

## Existing OVH environment

- VPS public address: `51.75.248.245`
- OS: Ubuntu 26.04
- Application root: `/opt/kkb`
- Persistent data: `/opt/kkb-data`
- Docker containers: `kkb-caddy`, `kkb-n8n`, `kkb-openwebui`, `kkb-postgres`
- n8n version observed: `2.22.6`
- Claude Code is installed on the VPS, but this task is primarily performed from the Mac through the n8n API.

## Required workflow behavior

Create a workflow with a clear name containing `UWISSY` and `DEADMAN`. Do not overwrite or alter an existing workflow unless you first identify it as the purpose-built watchdog created during this task.

The workflow must:

1. Run on a schedule appropriate for the two expected UWISSY production cycles, approximately 04:15 and 14:15 America/Los_Angeles. Use the n8n schedule trigger and set the workflow timezone explicitly if supported.
2. Fetch the public JSON URL over HTTPS.
3. Require HTTP success and valid JSON.
4. Validate the actual `system-health.json` structure and its relevant camelCase fields.
5. Read per-lane `freshnessState`, `sourceState`, `available`, and `usingLastKnownGood`, plus `failedLaneIds`, `degradedLaneIds`, `assemblyState`, and `publicationState` when present.
6. Confirm the document represents fresh current-cycle health. Do not treat an old successful or last-known-good result as proof that the current cycle completed.
7. Treat missing health fields, stale or non-fresh lanes, unavailable sources, failed/degraded lanes, failed/stale/incomplete/unknown assembly or publication states, HTTP errors, HTML responses, and invalid JSON as watchdog failures or explicitly reported degraded states.
9. Produce a compact machine-readable result with at least:
   - `watchdog_status`: `PASSED`, `DEGRADED`, or `FAILED`
   - `checked_at`
   - `source_url`
   - `health_summary`
   - `assembly_state`
   - `publication_state`
   - `failed_checks`
   - `lane_summary`
10. Make the failure path visible and testable. Do not silently swallow errors.
11. Include an alert/output step for failures, but do not invent an email address, Slack destination, webhook secret, or other notification credential. If no notification credential already exists, use a clearly labeled failure result and document the missing alert destination as a configuration item.
12. Keep all secrets out of the workflow JSON. The UWISSY status URL is public and requires no credential.

## Actual system-health contract

Before creating the workflow, fetch and inspect the live JSON. The observed `system-health.json` shape uses camelCase fields and includes per-lane `freshnessState`, `sourceState`, `available`, and `usingLastKnownGood`, plus rollups such as `failedLaneIds`, `degradedLaneIds`, `assemblyState`, and `publicationState`.

Do not assume that the old illustrative contract with `expected_cycle`, `generated_at`, `production_verified_at`, `system_result`, and per-lane `completed_at`/`cycle`/`status` exists. It does not match the currently published document. Derive exact field paths from the live JSON and preserve the real published schema.

Treat failed lanes, non-fresh lanes, unavailable sources, inappropriate last-known-good data, and failed/stale/incomplete/unknown assembly or publication states as failure or degraded evidence according to the live semantics. Use `PASSED` only when current freshness and completeness are positively established. Use `DEGRADED` when the document is readable but current completeness is not positively established. Use `FAILED` for missing or invalid data, failed requests, or explicit pipeline failure. Only `PASSED` may emit a healthy heartbeat.

`release-manifest.json` is corroborating evidence only. Its observed `buildState`, `deployState`, and `productionProofState` are currently all `unknown`, so it cannot currently prove GitHub Actions or Cloudflare deployment success.

## Historical contract example

The following old example is retained only to explain why the original task was wrong. Do not use it as the implementation contract:

```json
{
  "schema_version": "1.0",
  "release_id": "20_STATUS_PUBLISHER-...",
  "expected_cycle": "2026-08-20T03:00:00-07:00",
  "timezone": "America/Los_Angeles",
  "generated_at": "2026-08-20T03:18:42-07:00",
  "production_verified_at": "2026-08-20T03:21:10-07:00",
  "system_result": "PASSED",
  "lanes": {
    "01_ROUTE_CONDITIONS": {
      "completed_at": "2026-08-20T03:02:14-07:00",
      "cycle": "2026-08-20T03:00:00-07:00",
      "status": "PASSED"
    }
  }
}
```

Do not assume the literal example lane list or any field in that historical example is complete. First inspect the live `system-health.json` and derive the observed lane set and field paths. If the contract does not provide a definitive required-lane list, use the lanes present in the live document and record that limitation clearly in the workflow description and transition notes.

## Current UWISSY production context

The current canonical live workflows are ten lanes:

- `v03.UWI_LANE01`
- `v02.UWI_LANE02` through `v02.UWI_LANE07`
- `v01.UWI_LANE08`
- `v04.UWI_LANE20`
- `v03.UWI_LANE30`

The intended live schedules are:

- Source lanes 01-08: `0 3,13 * * *`
- Lane 20: `15 3,13 * * *`
- Lane 30: `20 3,13 * * *`
- Timezone: `America/Los_Angeles`

The current production release input is `data/connectors/evidence/workflow20-status-latest.json`. The historical frozen snapshot `data/connectors/evidence/workflow08-status-snapshot-20260802T162329Z.json` must not be treated as current production input.

The latest reported successful production proof was GitHub Actions run `32329370769`, head SHA `d073315b30f45353c76e616f3cb897437156e1e3`, with deployment URL `https://f427bc68.uw-issy.pages.dev`. The public release manifest is `https://uw-issy.biketourfrance.net/data/release-manifest.json`, and it reported release `20_STATUS_PUBLISHER-20260820T034129Z-001`.

Treat these facts as context to verify, not as proof that the current cycle is healthy. Do not hard-code the old release ID as a passing value.

## Build and verification loop

Work in this order and continue through failures:

1. Inspect the current OVH n8n workflows through the API without exposing credentials.
2. Inspect the live `system-health.json` with a read-only HTTPS request.
3. Design the smallest reliable workflow that satisfies the behavior above.
4. Create the workflow JSON locally in a temporary working directory.
5. Validate that the JSON parses and that all node references and connections are internally consistent.
6. Upload/create the workflow through the OVH n8n API.
7. Retrieve the created workflow and verify its node names, trigger, URL, validation logic, and connections.
8. Execute it manually through the API or n8n UI using the least risky available method.
9. Inspect the execution result and fix any errors.
10. Repeat upload/retrieval/execution until it works.
11. Test at least one failure condition without changing UWISSY or production data. Prefer a temporary test-only validation branch or a local fixture if n8n execution mechanics permit it. Do not weaken the production validation path merely to make a test pass.
12. Verify that the final workflow is saved, identifiable, and not accidentally active unless the user explicitly authorizes activation.

The external watchdog should send or expose a healthy heartbeat only after the full chain is represented by fresh public evidence: source lanes, Lane 20, release-input publication, GitHub Actions, Cloudflare deployment, and production verification. Do not implement a heartbeat that fires merely because the OVH workflow itself ran or because the source URL returned HTTP 200.

Use official n8n API behavior for the installed version. If an API operation differs, discover the supported endpoint from the n8n API response or official documentation rather than guessing. Never use the API key in a URL.

## Safety rules

- Do not delete workflows.
- Do not overwrite existing workflows without proving the exact target.
- Do not modify UWISSY, Hetzner, Caddy, PostgreSQL, or existing KKB workflows.
- Do not create or change credentials.
- Do not put secrets in JSON or logs.
- Do not claim success without an actual n8n execution result.
- Do not treat a schedule definition alone as proof of unattended execution; the broader project still requires real trigger-mode evidence for the canonical live schedules.
- Do not redeploy or validate the historical frozen snapshot as current production data.
- Do not redesign or replace the existing UWISSY, GitHub Actions, or Cloudflare production path.
- If a required notification destination is unavailable, finish the validation workflow and report that alert delivery remains unconfigured.

## Final project handoff report

When the current work is finished, report the state of the entire UWISSY project, not just the OVH workflow. Include:

- Exact workflow name and n8n workflow ID.
- Whether it was created, updated, and/or activated.
- Exact public URL checked.
- Exact public URL checked: `https://uw-issy.biketourfrance.net/data/system-health.json`.
- Trigger schedule and timezone.
- Validation checks implemented.
- Manual execution result.
- Failure-path test result.
- Any remaining limitation, especially the alert destination or required-lane definition.
- Files created locally and their paths.
- Whether the two project closeout gates are both proven.
- Whether the project can honestly be marked closed. Do not mark it closed while either mandatory gate remains incomplete.

Do not include the API key, password, credential values, cookies, or authorization headers in the report.
