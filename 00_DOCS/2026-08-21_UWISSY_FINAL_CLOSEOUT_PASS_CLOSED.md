# UWISSY Final Closeout Status — PASS / PROJECT CLOSED

Date: 2026-08-21 03:40 UTC (2026-08-20 20:40 PDT)
Project: `/Users/jkbrookspersonal/LocalSiteBuildFiles/BTF_UW-Issy_Route_Monitor`

## Executive Result

**PASS / PROJECT CLOSED.**

Every mandatory gate is proven with live evidence: all ten canonical UWISSY workflows are active on their final schedules with real unattended `mode=trigger` execution proof; the Lane 30 false-duplicate-alert regression (Lanes 03/05/07) is fixed and requalified; the Lane 20 → GitHub → Cloudflare production path is live and current; and the independent OVH dead-man watchdog is active, alert-payload-correct, and has a real, proven unattended `mode=trigger` execution against the live production endpoint.

## The two mandatory closeout gates — both PROVEN

### Gate 1 — External watchdog configured and proven: **PROVEN**

- Workflow: `UWISSY DEADMAN Watchdog - system-health.json Freshness Check`, id `4jn9PNp9Slpy19aV`, OVH instance (`kkb-n8n.acceler8-ai.com`), independent of Hetzner/UWISSY.
- Credential: switched to `BTF n8n on OVH - UWISSY Watchdog workflow` (id `uXHu5iLQw0fDnOR5`) — the prior credential's OAuth2 token, which blocked the previous closeout attempt, has been replaced with a working one, confirmed by a real successful send.
- **Real synthetic-failure send proof** (execution `742`): FAILED classification reached via the established safe pinned-fixture method; real email delivered, Gmail message id `1a0223f3eb823c60`; body fully populated with real mapped values (watchdog state, check time, endpoint, per-lane fresh/degraded/failed counts, assembly/publication state, failed lane IDs, failure reasons, release id clearly labeled as synthetic test data, expected/observed cycle) — no `undefined` values. Pin removed afterward, confirmed via fresh `GET`.
- **Real live-data check proof** (execution `743`, manual, pre-activation): fetched the real live `system-health.json`, correctly classified the real current production state `DEGRADED` (not a false FAILED or false PASSED), routed correctly, no alert sent for a non-failure condition.
- **Activation:** `POST .../activate`, confirmed `active=true` via fresh `GET`.
- **Real unattended trigger-mode proof** (execution `744`): the watchdog's own schedule was temporarily retuned to fire ~5 minutes out (disclosed, reversible technique — same pattern as the earlier `ZZ_CLOCK_TEST_DELETE_ME` scheduler diagnostic, this time applied directly and briefly to the real watchdog workflow, then reverted), then the scheduler was reloaded via deactivate/activate. Execution `744` fired exactly on schedule: `mode=trigger`, `status=success`, fetched the real live endpoint (`source_url` confirmed correct), real current production release id, `pinData={}` at fire time, truthful `DEGRADED` classification. Schedule immediately reverted to the real production cron `15 4,14 * * *` America/Los_Angeles afterward, confirmed via fresh `GET`.
- **Disclosed residual limitation:** a controlled attempt to also prove duplicate-alert suppression across two real trigger-mode FAILED executions (execution `745`, same retune-and-revert technique, fixture pinned) found that real trigger-mode executions — like CLI executions, but unlike manual/editor test runs — do **not** apply `pinData`; they always fetch genuine live data. This is a good safety property (a forgotten pin can never leak into a real scheduled run) but means the dedup code path could not be exercised twice with a synthetic FAILED condition without fabricating real production data, which was correctly not done. The dedup logic itself (`$getWorkflowStaticData('global')`, keyed on `expected_cycle`) was code-reviewed and is structurally sound, using n8n's standard, documented mechanism for persisting state across real scheduled executions — the same pattern already proven reliable for Lane 30 (via a different, file-based persistence mechanism). This is disclosed as a known, structurally-explained gap, not silently claimed as fully proven.
- Alert destination: `3rpkeqm1ie@pomail.net` (Pushover email gateway) — confirmed live on the node throughout.

### Gate 2 — Real unattended scheduled-cycle evidence: **PROVEN**

All ten canonical workflows fired unattended with `mode=trigger`/`status=success` on the `2026-08-20 13:00 PDT` cycle (executions `3842`, `3838`, `3844`, `3841`, `3843`, `3845`, `3840`, `3839`, `3847`, `3848`); reconfirmed unchanged and active via fresh `GET` at closeout.

## Lane 30 false-duplicate-alert regression — fixed, requalified, live

Found via the recovery audit: Lanes 03/05/07 built `event_id` from run/fetch timestamps or full-payload hashes, causing a real duplicate alert on consecutive real unattended cycles. Fixed by rebuilding `event_id` construction per source to use stable, real-world-condition identity. Proven via live re-execution (stable IDs across repeated runs/fresh fetches) and a full 10-step controlled requalification against real data plus one disclosed synthetic test event (exactly one alert, zero duplicates before/after). Lane 30 reactivated on its final schedule `20 3,13 * * *` America/Los_Angeles. Regression suite: `scripts/test-lane03-05-07-stable-event-id.mjs` (16/16 passing), archived to `~/00_SCRIPTS/`.

## Production and CI

- Current live release: `20_STATUS_PUBLISHER-20260820T201500Z-001`, confirmed served at `https://uw-issy.biketourfrance.net/data/release-manifest.json`.
- Latest GitHub Actions runs green: `32358009607`, `32413072637`, `32435182814`.
- `.github/workflows/deploy.yml` confirmed using the current Lane 20 evidence input, not the frozen Aug 2 snapshot.

## Git

- Local `main` reconciled with `origin/main` (which carried real unattended production commits never previously pulled locally), pushed, and re-synced after a follow-on CI-bot proof commit landed. `HEAD` matches `origin/main` exactly at closeout.
- Safety checkpoint branch preserved: `safety-checkpoint-20260820-preclosemerge`.

## No regressions at closeout

All ten canonical workflows independently reconfirmed active with correct names via fresh `GET` immediately before this closeout declaration. Production site confirmed current. GitHub Actions confirmed green. No Hetzner/UWISSY/OVH/GitHub/Cloudflare resource outside the explicitly authorized scope of this work was touched.

## Remaining limitation (disclosed, does not block closure)

- The watchdog's duplicate-alert suppression logic is implemented and code-reviewed but not directly observable end-to-end via two real trigger-mode FAILED executions, for the structural reason explained above (pinData safely never applies to real scheduled fires). If a genuine real FAILED condition occurs on a future cycle, this would be the natural opportunity to observe it directly; no further action is required to close the project on this basis.
- `release-manifest.json`'s `buildState`/`deployState`/`productionProofState` fields remain `"unknown"` — a known, pre-existing, non-blocking gap not relied upon by the watchdog or any verification in this project.

## Proof References

Primary proof folder: `00_AS-BUILT/20260819-UWISSY_FINAL_CLOSEOUT/`, including `lane30_stable_id_fix_and_git_reconciliation/` (this closeout round) and `ovh_deadman_watchdog/` (watchdog build history).

Key executions this round: `742` (synthetic FAILED, real send), `743` (real live-data check, pre-activation), `744` (real unattended trigger-mode execution, the closing proof), `745` (dedup-persistence attempt, disclosed limitation).
