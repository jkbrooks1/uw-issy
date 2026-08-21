# UW–Issaquah Route Monitor — Project Status

**Last updated:** 2026-08-21 03:45 UTC (2026-08-20 20:45 PDT)

## Current phase

**PROJECT CLOSED — `PASS / PROJECT CLOSED`**, recorded 2026-08-21. See `00_DOCS/2026-08-21_UWISSY_FINAL_CLOSEOUT_PASS_CLOSED.md` for the authoritative, evidence-based gate-by-gate closeout record — this document is a summary, not the closeout record of truth.

The full production chain is live and scheduled twice daily, unattended, with real proof: Lanes 01–08 run at 03:00/13:00 America/Los_Angeles, Lane 20 (Status Publisher) at 03:15/13:15, and Lane 30 (Alert Monitor) at 03:20/13:20. All ten canonical workflows have real `mode=trigger` unattended executions on the current live schedule. Lane 20's release-bridge automatically pushes each cycle's current status into this repository, which triggers the existing GitHub Actions CI/CD path (validate → build → deploy → verify-production → log-proof) — this has now happened for real, unattended, multiple times, most recently at `2026-08-20T20:15Z`. The public site (`https://uw-issy.biketourfrance.net`) is live and built from current monitoring data, not a frozen snapshot.

The independent external dead-man watchdog (on a separate OVH n8n instance, outside the Hetzner/UWISSY infrastructure) is active, alert-payload-correct, and has a real, proven unattended `mode=trigger` execution against the live production endpoint (execution `744`). A real synthetic-failure alert was also delivered successfully (execution `742`).

**Live production dashboard:** `https://uw-issy.biketourfrance.net` (Cloudflare Pages project `uw-issy`)

## Project root

`/Users/jkbrookspersonal/LocalSiteBuildFiles/BTF_UW-Issy_Route_Monitor`

## Canonical route

Canonical GPX: `data/route/UnivWA-Issaquah.gpx`
Derived route GeoJSON (built during the site build): `public/routes/UnivWA-Issaquah.geojson`

## Canonical n8n workflows (Hetzner, folder `UWISSY`)

Naming standard: `vXX.UWI_LANEXX`. All ten are the only workflows recognized as canonical; any other UWISSY-named workflow on this instance is a stale/historical duplicate and must not be treated as live.

| Lane | Workflow | n8n ID | Active | Schedule (America/Los_Angeles) |
|---|---|---|---|---|
| 01 Route Conditions | `v03.UWI_LANE01` | `RR7cLSV9oGngrJdA` | true | `0 3,13 * * *` |
| 02 Weather | `v02.UWI_LANE02` | `fA0ZjWH3Itl83aPC` | true | `0 3,13 * * *` |
| 03 Air Quality | `v02.UWI_LANE03` | `qlM2XIv2BbFSh3in` | true | `0 3,13 * * *` |
| 04 Wildfire | `v02.UWI_LANE04` | `w6xnelPQeRFZk8BG` | true | `0 3,13 * * *` |
| 05 Flood Conditions | `v02.UWI_LANE05` | `4RiNqOKD9BCZFH6P` | true | `0 3,13 * * *` |
| 06 Trail Infrastructure Status | `v02.UWI_LANE06` | `poGV37VLUGIUxfGK` | true | `0 3,13 * * *` |
| 07 Government Safety Alerts | `v02.UWI_LANE07` | `08g3JNwQPVSxUl2H` | true | `0 3,13 * * *` |
| 08 Route Facilities | `v01.UWI_LANE08` | `uwIssy08RouteFacilities` | true | `0 3,13 * * *` |
| 20 Status Publisher | `v04.UWI_LANE20` | `gp8WlccGwLydNWG7` | true | `15 3,13 * * *` |
| 30 Alert Monitor | `v03.UWI_LANE30` | `KhbGg5gBn7Rbne68` | true | `20 3,13 * * *` |

All ten have real, verified `mode=trigger`/`status=success` unattended executions on this exact schedule (most recently the `2026-08-20 13:00 PDT` cycle).

## External dead-man watchdog (OVH, independent instance)

- Instance: `https://kkb-n8n.acceler8-ai.com` (independent of the Hetzner host running UWISSY).
- Workflow: `UWISSY DEADMAN Watchdog - system-health.json Freshness Check`, id `4jn9PNp9Slpy19aV`.
- Checks: `https://uw-issy.biketourfrance.net/data/system-health.json`, classifies `PASSED`/`DEGRADED`/`FAILED` — all three states proven with real and synthetic test data.
- Alert destination: `3rpkeqm1ie@pomail.net` (Pushover email gateway), wired via a Gmail node, credential `BTF n8n on OVH - UWISSY Watchdog workflow`.
- **Status: active, `mode=trigger` unattended execution proven** (execution `744`), real synthetic-failure alert delivered (execution `742`, Gmail message id `1a0223f3eb823c60`). Schedule `15 4,14 * * *` America/Los_Angeles.

## Known-fixed defects (this project's history)

- **Lane 01 stable event identity** (fixed earlier): `event_id` no longer changes when only page content/timestamp changes for the same real-world closure.
- **Lane 30 false-duplicate-alert regression, Lanes 03/05/07** (fixed 2026-08-20): the same defect class as the Lane 01 bug, found in three more lanes via a recovery audit after real production data showed repeated same-condition alert emails on consecutive unattended cycles. Fixed by rebuilding `event_id` construction to use stable source-native identity or already-computed state classification instead of timestamps/full-payload hashes. Proven via live re-execution and a full controlled requalification sequence. Regression tests: `scripts/test-lane03-05-07-stable-event-id.mjs`.

## Dashboard

Astro + Svelte static site (`src/`, `scripts/`, `public/`). Renders the real route line and event markers, current route state, monitoring-source health.

- **Data source:** `data/connectors/evidence/workflow20-status-latest.json`, kept current by the Lane 20 release-bridge script (`scripts/publish-workflow20-release-input.sh`), which runs as part of Lane 20's own n8n execution and commits/pushes only meaningful changes.
- **CI/CD:** `.github/workflows/deploy.yml` — validate → build → deploy → verify-production → log-proof on every push to `main`. Proven repeatedly with real unattended runs, most recently CI run `32435182814` (green).
- **Cloudflare Pages project:** `uw-issy`, custom domain `uw-issy.biketourfrance.net`.

## Known gaps — not silently worked around

- **Cloudflare Email Address Obfuscation** rewrites the `mailto:` link on the custom domain; a real cosmetic/automated-check-only issue, not a deploy fault. Zone-level setting change, outside this project's normal scope.
- **`release-manifest.json`'s `buildState`/`deployState`/`productionProofState` fields are always `"unknown"`** — the CI pipeline does not currently patch these in post-build/post-deploy. Not relied upon by the OVH watchdog or any other verification in this project; noted as a real gap for a future round.
- **Lane 05's flood-gauge severity classification is still static** (`advisory`/`monitoring` always) for USGS gauges — real threshold-tiered flood-stage logic has not been built. The Lane 30 fix uses this existing (constant) classification as the stable event identity; it does not add new severity logic. A future enhancement to Lane 05 with real flood-stage thresholds would need to be paired with re-verifying Lane 30's dedup behavior against the new states.

## Architecture status

- Shared connector standard: `00_CONNECTORS/00_SHARED_AUTONOMOUS_CONNECTOR_BUILD_STANDARD.md`.
- Canonical execution plan: `00_DOCS/2026-0829.CANONICAL_UWISSY_BUILD_PLAN.md` — takes precedence over older, superseded planning docs per its own stated precedence order.
- Authoritative current closeout status: `00_DOCS/2026-08-20_UWISSY_FINAL_CLOSEOUT_NOT_CLOSED.md`.
- Full chronological history: `00_PROJECT_BUILDLOG.md` (append-only, never pruned).

## Next phase

Project closed. Only non-blocking, previously-disclosed items remain for future consideration, not required for this closeout:

1. `release-manifest.json`'s `buildState`/`deployState`/`productionProofState` fields remain `"unknown"` — CI does not currently patch these post-deploy.
2. The watchdog's duplicate-alert suppression logic is implemented and code-reviewed but has not been observed end-to-end across two real trigger-mode FAILED executions (a structural n8n property — `pinData` safely never applies to real scheduled fires — prevented forcing this without fabricating production data). Would naturally be observable on a future real FAILED cycle.
3. Lane 05's flood-gauge severity classification remains static; a future real threshold-tiered upgrade would need re-verification against Lane 30's dedup behavior.
