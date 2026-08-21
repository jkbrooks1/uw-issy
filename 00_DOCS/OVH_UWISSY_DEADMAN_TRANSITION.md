# Transition Document: Complete UWISSY Project Handoff to Claude Code

## Purpose

This document transfers the entire UWISSY project from Codex to Claude Code. Claude Code must continue from the current live state, preserve completed work and existing proof, finish the remaining operational work, and determine whether the project can be closed.

The primary remaining implementation task is the independent external watchdog on the OVH KKB n8n instance. That watchdog is one component of the broader project closeout, not the whole handoff.

The watchdog is intentionally external. If the Hetzner host, UWISSY workflow, GitHub publication step, or Cloudflare publication path fails, the OVH workflow should still be able to detect the missing or stale public status document.

## Overall project outcome

The overall UWISSY project is intended to provide a dependable, unattended route-monitoring production chain. Scheduled source lanes run, Lane 20 assembles the current release input, Lane 30 suppresses duplicates, GitHub Actions validates and deploys the release, Cloudflare publishes the public site and machine-readable status, and production verification confirms the result. The final outcome is an independently observable system that proves a fresh verified release or reliably signals when the chain has stopped, gone stale, or failed.

The OVH workflow is the external dead-man/freshness watchdog that supplies that independent observation. It is not a replacement for UWISSY, GitHub Actions, Cloudflare Pages, or production verification.

## Current state

The project is not closed. The two mandatory closeout gates still missing are:

1. The external dead-man watchdog must be configured and proven.
2. One real unattended scheduled cycle must be captured with trigger-mode evidence for the final active UWISSY schedules.

The OVH VPS is reachable through the existing Mac SSH alias:

`ssh ovh-kkb`

The n8n administrator has successfully logged into:

`https://kkb.acceler8-ai.com/n8n`

The confirmed n8n administrator identity is:

`jb@acceler8-ai.com`

The password is known to the owner but must not be recorded in this document, shell history, workflow JSON, or logs.

The OVH n8n API key has been created and stored in the Mac Keychain as:

`OVH_KKB_N8N_API_KEY`

The API key was tested successfully against the OVH n8n API and returned workflow data. The key itself is not included here.

## OVH infrastructure

- VPS: OVH, public IPv4 `51.75.248.245`
- Hostname observed: `vps-e9ec6e71`
- Operating system: Ubuntu 26.04
- Application root: `/opt/kkb`
- Persistent data root: `/opt/kkb-data`
- Docker containers: `kkb-caddy`, `kkb-n8n`, `kkb-openwebui`, `kkb-postgres`
- n8n version observed: `2.22.6`
- Claude Code is installed on the VPS as maintenance tooling.

The OVH public routes include:

- `https://kkb.acceler8-ai.com/auth`
- `https://kkb.acceler8-ai.com/upload`
- `https://kkb.acceler8-ai.com/n8n`

The n8n route redirects to the n8n subdomain used for API access:

`https://kkb-n8n.acceler8-ai.com/`

The API base used for testing is:

`https://kkb-n8n.acceler8-ai.com/api/v1`

## Target being monitored

The watchdog must fetch:

`https://uw-issy.biketourfrance.net/data/system-health.json`

This is the real public machine-readable freshness/health document published by UWISSY. The originally assumed `monitor-status.json` endpoint does not exist. Its URL returns HTTP 200 with `text/html`, which is the SPA index-page fallback, not JSON. It must not be invented or used by the watchdog.

Other real published JSON documents include `release-manifest.json`, `dashboard-data.json`, and `route-events.geojson`.

## Verified contract correction

The live documents do not use the previously assumed snake_case contract with `expected_cycle`, `generated_at`, `production_verified_at`, `system_result`, and per-lane `completed_at`/`cycle`/`status`.

The real `system-health.json` shape uses camelCase and is the closest available freshness/completion signal. Observed fields include per-lane `freshnessState`, `sourceState`, `available`, and `usingLastKnownGood`, plus rollups `failedLaneIds`, `degradedLaneIds`, `assemblyState`, and `publicationState`.

Claude Code must inspect the live document and use its actual field paths. It must not silently invent a field mapping. The normalized watchdog result should retain the relevant source values or a bounded summary so a failure can be explained.

`release-manifest.json` is corroborating evidence only. Its observed `buildState`, `deployState`, and `productionProofState` are all currently `unknown`, so it cannot currently prove GitHub Actions or Cloudflare deployment success.

The latest known successful production evidence is useful for orientation but must not be hard-coded as a current success:

- GitHub Actions run: `32329370769`
- Head SHA: `d073315b30f45353c76e616f3cb897437156e1e3`
- Deployment: `https://f427bc68.uw-issy.pages.dev`
- Release manifest: `https://uw-issy.biketourfrance.net/data/release-manifest.json`
- Reported release: `20_STATUS_PUBLISHER-20260820T034129Z-001`

The current release input is `data/connectors/evidence/workflow20-status-latest.json`. The dated `workflow08-status-snapshot-20260802T162329Z.json` file is historical only and must not be treated as live production input.

## Watchdog result semantics

There is no separate snake_case status contract. The authoritative source is the live camelCase `system-health.json` document described above.

The normalized watchdog result should use:

- `PASSED` only when current freshness and completeness are positively established.
- `DEGRADED` when the document is readable but current completeness is not positively established, including acceptable partial or degraded source data.
- `FAILED` for missing or invalid data, failed requests, or explicit pipeline failure.

Only `PASSED` may emit a healthy heartbeat. `DEGRADED` must remain visible and must not be treated as proof that the full production chain completed.

## Intended schedule

The watchdog should run shortly after the two expected UWISSY production windows, approximately:

- 04:15 America/Los_Angeles
- 14:15 America/Los_Angeles

Claude Code must inspect the live status document and account for daylight-saving behavior and the actual cycle values instead of hard-coding a misleading UTC offset.

The corresponding UWISSY schedules are currently expected to be:

- Source lanes 01-08: `0 3,13 * * *`
- Lane 20: `15 3,13 * * *`
- Lane 30: `20 3,13 * * *`
- Timezone: `America/Los_Angeles`

The canonical live workflows are `v03.UWI_LANE01`, `v02.UWI_LANE02` through `v02.UWI_LANE07`, `v01.UWI_LANE08`, `v04.UWI_LANE20`, and `v03.UWI_LANE30`. These details should be verified against live state, not assumed to be unchanged.

## Required health checks

The final workflow must fail clearly when any of these occur:

- HTTP request failure or non-success HTTP status.
- Invalid or empty JSON.
- Missing required health fields in the live schema.
- An HTML response or invalid/empty JSON.
- A health document that is stale or not demonstrably current.
- A lane has a non-fresh `freshnessState`.
- A lane has an unavailable or failed `sourceState`.
- A lane is unavailable or is using last-known-good data when current freshness is required.
- `failedLaneIds` or unacceptable `degradedLaneIds` are present.
- `assemblyState` or `publicationState` is failed, stale, incomplete, or unknown when health requires a confirmed state.

The workflow should produce a compact result with `PASSED`, `DEGRADED`, or `FAILED`, the checked time, source URL, health summary, assembly and publication states, failed checks, and a lane summary. It should retain the relevant source values so the result can be explained.

## Alerting status

No notification destination has been confirmed yet. Claude Code must not invent an email address, Slack webhook, credential, or secret. It should implement a visible failure result and report alert delivery as unconfigured unless an existing safe notification credential and destination are discovered and explicitly authorized for use.

If a heartbeat mechanism is added, it must represent the full production chain and occur only after fresh production verification. A heartbeat proving only that the OVH n8n workflow ran, or only that the public URL returned HTTP 200, is insufficient.

## Existing n8n material

The API test returned existing KKB workflow data, including a document-review workflow. That workflow is unrelated to the UWISSY dead-man switch. It must not be modified, deleted, or used as the watchdog target.

The purpose-built watchdog should receive a distinct name containing `UWISSY` and `DEADMAN` so it can be identified safely.

## API handling

From the Mac, the key can be retrieved at runtime with:

```bash
OVH_N8N_API_KEY="$(security find-generic-password -a "$USER" -s "OVH_KKB_N8N_API_KEY" -w)"
```

Use it only in the `X-N8N-API-KEY` header. Never print it. Never place it in workflow JSON, a source file, a URL, a screenshot, or a final report.

The owner has explicitly requested copy-and-pasteable instructions and does not manually edit technical files. Claude Code should therefore create complete files and complete API requests itself, without asking the owner to edit placeholders.

## Acceptance criteria

The task is complete only when all of the following are true:

1. A purpose-built watchdog workflow exists on the OVH n8n instance.
2. The workflow JSON parses and its n8n connections are valid.
3. The workflow retrieves the live UWISSY `system-health.json` URL.
4. The workflow validates the actual `system-health.json` freshness, lane, assembly, and publication fields.
5. The workflow has a visible failure path.
6. The workflow has been uploaded or saved and then retrieved for verification.
7. A real manual execution has completed successfully against the live public endpoint, or the reason it cannot complete has been recorded.
8. At least one failure condition has been tested safely without changing UWISSY production data.
9. No existing KKB workflow, credential, database, Caddy configuration, or Hetzner/UWISSY workflow has been modified.
10. Activation is explicitly reported. Do not activate silently.

11. The workflow does not reference the nonexistent `monitor-status.json` endpoint.
12. The workflow does not claim that `release-manifest.json` proves deployment while its proof-state fields remain `unknown`.

The broader UWISSY closeout also requires real trigger-mode evidence that the canonical scheduled workflows run unattended. The watchdog task must not claim that requirement is satisfied merely because schedules exist in n8n or because a manual execution succeeded.

## Constraints from the broader handoff

- Continue from the current live UWISSY state; do not restart or redesign the project.
- Do not revert unrelated local changes or discard user work.
- Do not weaken CI, secret scanning, validation, or production verification.
- Do not expose secrets.
- Do not replace Cloudflare Pages, GitHub Actions, or n8n.
- Do not redeploy the historical frozen snapshot as live data.

The canonical UWISSY project root is:

`/Users/jkbrookspersonal/LocalSiteBuildFiles/BTF_UW-Issy_Route_Monitor`

The detailed closeout record is:

`/Users/jkbrookspersonal/LocalSiteBuildFiles/BTF_UW-Issy_Route_Monitor/00_DOCS/2026-08-20_UWISSY_FINAL_CLOSEOUT_NOT_CLOSED.md`

When Claude Code has access to that project, it should inspect the closeout record and current project rules before making any change. The watchdog itself can be built independently through the OVH n8n API, but the final project status must distinguish watchdog proof from unattended-cycle proof.

## Handoff instruction

Use the companion prompt file `CLAUDE_CODE_OVH_UWISSY_DEADMAN_PROMPT.md` as the direct operating instruction. Continue iterating through create, validate, upload, execute, inspect, debug, and retest until the acceptance criteria are met. Report evidence, not assumptions.
