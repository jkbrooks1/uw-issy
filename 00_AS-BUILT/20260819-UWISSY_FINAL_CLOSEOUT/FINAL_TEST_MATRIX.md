# UWISSY Final Test Matrix — closeout 2026-08-21

Every row is backed by a real live execution ID, GitHub Actions run, or fresh API `GET`, not a static/inferred claim.

| Area | Test | Result | Evidence |
|---|---|---|---|
| Lane 01 | Stable event identity across content/timestamp change | PASS | Live published `event_id` = stable composite key |
| Lane 03 | `PSCAA-02` burn-ban / `WASMOKE-01` smoke-context stable across runs | PASS | Executions `3865`; regression suite |
| Lane 05 | 9 sources stable across runs with fresh fetch/reading | PASS | Executions `3867`/`3868`; regression suite |
| Lane 07 | 8 sources stable across runs | PASS | Executions `3869`/`3870`; regression suite |
| Lane 30 | Unchanged-event suppression | PASS | Executions `3872`, `3876`, `3880` — zero duplicates |
| Lane 30 | True-new-event alert (exactly one) | PASS | Execution `3879`, Gmail id `1a021cf66c055fa0` |
| Lanes 01–08 | Active, correct schedule | PASS | Fresh `GET`, all `0 3,13 * * *` LA |
| Lane 20 | Active, correct schedule, current GitHub input | PASS | Fresh `GET`; `deploy.yml` uses `workflow20-status-latest.json` |
| Lane 30 | Active, correct schedule | PASS | Fresh `GET`, `20 3,13 * * *` LA |
| All 10 lanes | Real unattended `mode=trigger` | PASS | Executions `3838`–`3848`, `2026-08-20 13:00 PDT` cycle |
| GitHub Actions | Green on real production commits | PASS | Runs `32358009607`, `32413072637`, `32435182814` |
| Cloudflare production | Serves current release | PASS | `release-manifest.json` = `20_STATUS_PUBLISHER-20260820T201500Z-001` |
| Watchdog | 3-state logic (PASSED/DEGRADED/FAILED) | PASS | Executions `732`/`733`/`734` (prior session) |
| Watchdog | Alert payload correctly mapped (no `undefined`) | PASS | Execution `742` |
| Watchdog | Real synthetic-failure send | PASS | Execution `742`, Gmail id `1a0223f3eb823c60` |
| Watchdog | Real live-data check, truthful classification | PASS | Execution `743`, `DEGRADED` (real) |
| Watchdog | Activation | PASS | Fresh `GET`, `active=true` |
| Watchdog | Real unattended `mode=trigger` execution | PASS | Execution `744`, real endpoint, real release, no pinData |
| Watchdog | Duplicate-suppression across two real trigger FAILED runs | **NOT DIRECTLY OBSERVED** | Execution `745` — real trigger fires do not honor `pinData` (safety property); dedup logic reviewed and structurally sound, not fabricated as proven |
| Git | Local/origin reconciled, pushed, CI green | PASS | Commit `a13eab6` (== `origin/main`), run `32435182814` |
| No regressions | All 10 canonical + watchdog re-confirmed post-closeout | PASS | Fresh `GET` on all 11 workflows at closeout |

**Overall: `PASS / PROJECT CLOSED`**, with one disclosed, non-blocking, structurally-explained residual item (dedup double-fire persistence) that does not affect the explicit trigger/real-alert closure criterion.
