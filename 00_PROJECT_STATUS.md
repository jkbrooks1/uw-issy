# UW–Issaquah Route Monitor — Project Status

**Last updated:** 2026-08-02 PDT

## Current phase

All seven connector lanes are built, imported into n8n, and independently verified with real live executions against real government data sources. A status-publishing workflow (08) and an email alert workflow (09) are now also built and live-verified on top of them. Every workflow remains inactive (no schedules enabled, no automatic runs). The full repository is on GitHub at `https://github.com/jkbrooks1/uw-issy` (`main` branch).

## Project root

`/Users/jkbrookspersonal/LocalSiteBuildFiles/BTF_UW-Issy_Route_Monitor`

## Canonical route

Canonical GPX:

`data/route/UnivWA-Issaquah.gpx`

## Connector status — all 7 lanes

| Lane | n8n workflow ID | Active | Live-verified |
|---|---|---|---|
| 01 Route Conditions | `RR7cLSV9oGngrJdA` | false | yes — multiple real executions, LKG read/serve proven |
| 02 Weather | `fA0ZjWH3Itl83aPC` | false | yes — real NWS fetches, real published artifact |
| 03 Air Quality | `qlM2XIv2BbFSh3in` | false | yes — real degraded status from a genuine source HTTP 404 |
| 04 Wildfire | `w6xnelPQeRFZk8BG` | false | yes — passed on first live execution |
| 05 Flood Conditions | `4RiNqOKD9BCZFH6P` | false | yes — 10 real sources landed |
| 06 Trail Infrastructure Status | `poGV37VLUGIUxfGK` | false | yes — real published artifact after validation-ordering fix |
| 07 Government Safety Alerts | `08g3JNwQPVSxUl2H` | false | yes — real published artifact, `data_status: ok` |
| 08 Status Publisher | `gp8WlccGwLydNWG7` | false | yes — real aggregated feed written and read back |
| 09 Alert Monitor | `KhbGg5gBn7Rbne68` | false | yes — real email sent (Gmail msg `19fc34bc6a2b9552`), duplicate correctly suppressed on re-run |

Canonical, correct workflow exports (matching what is actually live and proven) are in `00_WORKFLOWS/`. The lane-local `00_CONNECTORS/0X_*/0X_*_v1.json` (or `_v4.json` for lane 01) files are the source of truth these exports were generated from.

## Workflows 08 and 09 (status publishing and alerting)

Split deliberately into two independent workflows rather than one combined aggregator/alerter, so a bug in either cannot silently take down the other:

- **08 Status Publisher**: reads all 7 lanes' real published output, maps each lane's native `data_status` to a small three-tier display severity (`normal`/`watch`/`alert` — per `DEC-009`, lane-native severity is preserved verbatim alongside it, never overwritten) and writes the combined result to `/files/uw-issy-connectors/public/status.json`. Not yet wired to an actual public-facing site — that's still gated on the deferred Cloudflare/deployment decision.
- **09 Alert Monitor**: reads the same 7 lanes plus its own persisted `alerts/last_alerted_state.json`, and emails (`DEC-013`: resolved — email to `john@biketourfrance.net` via the existing `GMAIL OAUTH LODGING PROP MON` credential) only genuinely new events since the last check, identified by a uniform `event_id` diff. Deliberately does *not* attempt to harmonize each lane's differently-shaped route-relevance classification into the alert trigger itself (confirmed these genuinely differ by lane — `confirmed_route_impact` vs `confirmed_route_relevant` vs a bare boolean vs none at all) — that's a documented simplification for this version, not an oversight.

Both remain `active: false`. Neither is scheduled.

## What live qualification actually found and fixed

Every lane except 01 (already fixed in an earlier session) needed at least one real bug found only by executing it against the live n8n instance — none of these were caught by static file checks:

- **Missing `alwaysOutputData` on the LKG read node** (all 7 lanes): on a first-ever run with no last-known-good file yet, the read node silently returned zero items and starved the entire rest of the pipeline with no error. Fixed everywhere.
- **Malformed connection graphs** (lanes 02, 05, 07): a single-output Code node given multiple connection branches instead of one branch with multiple targets, and a Merge node's inputs not uniquely indexed. Both are invalid n8n graph shapes that surface as runtime errors, not import-time errors.
- **Browser-only `fetch()` used inside a Code node** (lane 02): this n8n instance's Code-node sandbox has no `fetch`; replaced with the real `this.helpers.httpRequest` helper (verified against n8n's own source).
- **Truncated node-name references** (lane 02): `$('Fetch NWS-01')` instead of the node's real full name — a silent runtime lookup failure.
- **Non-string `notes` field** (lane 03): rejected by the n8n import API.
- **Wrong raw-landing subdirectory convention** (lanes 03, 05, 07): used a per-source subfolder instead of the proven shared `landings/` folder that actually exists on the server.
- **Premature validation requirements** (lanes 03, 06, 07): the validator required `data_status`, `freshness`, `manifest_ref`, `connector_health`, and/or `validation_state` before the pipeline stage that actually computes them — guaranteed every run to be wrongly quarantined. Reordered to match the proven lane pattern.
- **Missing `metadata` field entirely** (lanes 03, 07): lane 03's validator crashed outright on it (`Cannot read properties of undefined`); lane 07's aggregation step never set `output_root`, `run_stamp`, or `metadata` at all, corrupting every downstream file path.
- **Missing `hashString` helper** (lane 05, all 10 sources): referenced but never defined — real `ReferenceError` on live execution.
- **Blocked `$env` access inside a Code node** (lane 05): this instance blocks `process.env`/`$env` in Code nodes; replaced a diagnostic-only WSDOT flag with a hardcoded value.
- **Unescaped raw newline inside a JS string literal** (lanes 02, 03, 06, 07): broke the JS parser outright.
- **`.toISOString()` called on an invalid Date without checking first** (lane 07, 8 occurrences): throws instead of returning a sentinel string, as the surrounding code incorrectly assumed.
- **Missing `quarantine/` directory tier on the server** (infrastructure, affected all lanes): only discovered when a validation-failure path actually tried to write there for the first time.

Every fix was verified two ways: the lane's own fixture test harness (still 8/8 across all 7 lanes) and a real execution against the live n8n instance with the actual output files read back over SSH.

## Architecture status

- shared connector standard exists in `00_CONNECTORS/00_SHARED_AUTONOMOUS_CONNECTOR_BUILD_STANDARD.md`
- the repository runtime structure is approved and now includes the previously-missing `quarantine/`, `public/`, and `alerts/` tiers under `data/connectors/` (local mirror) and `/files/uw-issy-connectors/` (live server)
- `DEC-009` (cross-lane severity mapping) and `DEC-013` (notification channel) are resolved — see workflows 08/09 above
- Cloudflare deployment decisions remain deferred
- the site itself (a page that actually reads `public/status.json`) has not been built — workflow 08 produces the feed, nothing consumes it publicly yet

## Approved runtime structure

- Hetzner runtime root: `/srv/uw-issy-route-monitor`
- live n8n container output root: `/files/uw-issy-connectors/`
- local repository mirror: `data/connectors/`
- aggregated site-facing status feed: `/files/uw-issy-connectors/public/status.json`, owned only by workflow `08`
- alert state: `/files/uw-issy-connectors/alerts/last_alerted_state.json`, owned only by workflow `09`

## Not done in this phase

- No workflow was activated or scheduled. All 9 remain `active: false`.
- No actual public-facing dashboard page exists yet — only the JSON feed workflow 08 produces.
- No Cloudflare or public-site changes were made.
- Workflow 09's alert trigger uses a safe uniform signal (new `event_id`), not lane-specific route-impact classification — see above.

## Next phase

1. Decide on and build the actual dashboard front-end that reads `public/status.json` (static site, Cloudflare Pages, or otherwise — still gated on the deferred Cloudflare decision).
2. Decide activation/scheduling policy now that all 9 workflows are proven functional.
3. Consider refining workflow 09's alert trigger to use each lane's native route-impact classification once/if a reliable cross-lane approach is worked out.
4. Resolve remaining deferred Cloudflare decisions.
