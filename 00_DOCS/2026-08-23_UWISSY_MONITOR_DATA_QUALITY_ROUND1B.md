# UW-Issy Monitor Data Quality Round 1B

Date: 2026-08-23 PDT / 2026-08-24 UTC

## 1. Executive Result

Round 1B completed the production portion of Round 1 after authenticated access to the BTF Hetzner n8n instance was restored.

Result:

- `H_N8N_API_KEY` from `~/.config/jb/secrets.env` authenticated successfully to `https://n8n.biketourfrance.net`.
- UWISSY project `Y0Ygmqe59jevHoeV` and canonical lane workflows were verified by API.
- Live workflow backups were captured before changes.
- Verified Round 1 connector repairs were deployed in place to Lane 03, Lane 04, and Lane 05.
- All 8 monitor lanes were executed live.
- Lane 20 was executed after the lane reruns and published a fresh public health package.
- Live public package release: `20_STATUS_PUBLISHER-20260824T060529Z-001`.
- Live URL verified: `https://uw-issy.biketourfrance.net`.
- Health scoring thresholds were not changed.
- Public copy was not changed.
- No pseudo-event or Route Status regression was introduced by this task.

Actual after-state: 3 monitors Current, 5 monitors Degraded.

## 2. n8n Authentication Proof

Target:

`https://n8n.biketourfrance.net`

Authentication:

- Header: `X-N8N-API-KEY`
- Credential variable: `H_N8N_API_KEY`
- Credential source: `~/.config/jb/secrets.env`
- Secret value: not printed, logged, committed, or included in proof

Read-only probe:

`GET https://n8n.biketourfrance.net/api/v1/workflows?limit=1`

Result:

HTTP 200.

Proof:

`00_AS-BUILT/20260823-UWISSY_MONITOR_DATA_QUALITY_ROUND1B/api/auth-http200-proof.json`

## 3. UWISSY Project / Workflow Verification

Project:

- Name: `UWISSY`
- Project ID: `Y0Ygmqe59jevHoeV`
- Folder ID: `LaS9Q6sil9yCDzrV`
- Workflow count: 10

Verified workflow IDs:

| Lane | Workflow ID | Live name | Active |
| --- | --- | --- | --- |
| 01 | `RR7cLSV9oGngrJdA` | `v03.UWI_LANE01` | true |
| 02 | `fA0ZjWH3Itl83aPC` | `v02.UWI_LANE02` | true |
| 03 | `qlM2XIv2BbFSh3in` | `v02.UWI_LANE03` | true |
| 04 | `w6xnelPQeRFZk8BG` | `v02.UWI_LANE04` | true |
| 05 | `4RiNqOKD9BCZFH6P` | `v02.UWI_LANE05` | true |
| 06 | `poGV37VLUGIUxfGK` | `v02.UWI_LANE06` | true |
| 07 | `08g3JNwQPVSxUl2H` | `v02.UWI_LANE07` | true |
| 08 | `uwIssy08RouteFacilities` | `v01.UWI_LANE08` | true |
| 20 | `gp8WlccGwLydNWG7` | `v04.UWI_LANE20` | true |
| 30 | `KhbGg5gBn7Rbne68` | `v03.UWI_LANE30` | true |

Proof:

- `00_AS-BUILT/20260823-UWISSY_MONITOR_DATA_QUALITY_ROUND1B/discovery/project-folders.json`
- `00_AS-BUILT/20260823-UWISSY_MONITOR_DATA_QUALITY_ROUND1B/discovery/uwissy-known-workflows.json`

## 4. Pre-Deploy Live Workflow Reconciliation

Live workflows were exported before modification to:

`00_AS-BUILT/20260823-UWISSY_MONITOR_DATA_QUALITY_ROUND1B/live-backups/pre-change/`

Reconciliation conclusion:

| Workflow | Repair | Conclusion |
| --- | --- | --- |
| Lane 03 | ECO-01 endpoint/latest-hour repair | SAFE TO APPLY |
| Lane 04 | NIFC-01 valid WFIGS route-bbox query | SAFE TO APPLY |
| Lane 05 | KC-ROAD-01 query/parser repair | SAFE TO APPLY |

Reconciliation proof:

`00_AS-BUILT/20260823-UWISSY_MONITOR_DATA_QUALITY_ROUND1B/reconciliation/`

## 5. Lane 03 Deployment Result

Lane 03 workflow:

`qlM2XIv2BbFSh3in`

Changed node:

`Fetch ECO-01 Monitor Results`

Result:

- ECO-01 deployed with repaired Ecology `/serverext/rest/services/AQ/...` endpoint and live-supported latest-hour filtering.
- Current upstream probe returned HTTP 200 with 146 features.
- After live rerun, ECO-01 no longer failed and reported `empty_but_valid`.
- Lane 03 remained Degraded because other sources still failed.

Proof:

- `00_AS-BUILT/20260823-UWISSY_MONITOR_DATA_QUALITY_ROUND1B/workflow-updates/lane03-update-result.json`
- `00_AS-BUILT/20260823-UWISSY_MONITOR_DATA_QUALITY_ROUND1B/live-backups/post-change/lane03-qlM2XIv2BbFSh3in-v02.UWI_LANE03.json`

## 6. Lane 04 Deployment Result

Lane 04 workflow:

`w6xnelPQeRFZk8BG`

Changed nodes:

- `Fetch NIFC-01 Locations`
- `Land NIFC-01 Raw Payload`

Result:

- NIFC-01 deployed with valid WFIGS ArcGIS route-bbox query semantics.
- Current upstream route-bbox probe returned HTTP 200 with 0 route-bbox incidents.
- Global WFIGS source had current records, supporting correct empty for the route bbox.
- After live rerun, NIFC-01 no longer failed and reported `empty_but_valid`.
- Lane 04 remained Degraded because NOAA-01 used last-known-good.

Proof:

- `00_AS-BUILT/20260823-UWISSY_MONITOR_DATA_QUALITY_ROUND1B/workflow-updates/lane04-update-result.json`
- `00_AS-BUILT/20260823-UWISSY_MONITOR_DATA_QUALITY_ROUND1B/live-backups/post-change/lane04-w6xnelPQeRFZk8BG-v02.UWI_LANE04.json`

## 7. Lane 05 Deployment Result

Lane 05 workflow:

`4RiNqOKD9BCZFH6P`

Changed nodes:

- `Fetch KC-ROAD-01 Alerts`
- `Land KC-ROAD-01 Raw Payload`
- `Normalize KC-ROAD-01 Events`

Additional in-scope live fix:

- The first live Lane 05 rerun exposed a schema validation failure: `Invalid event status: 2`.
- Root cause: KC RoadAlerts `ClosureState` numeric value was being passed through as event `status`.
- Fix: normalize schema `status` to a valid active status while preserving the official numeric code in `official_category`.

Result:

- KC-ROAD-01 query returned successfully.
- KC-ROAD-01 reported `ok` with 1 parsed record after the schema fix.
- Lane 05 remained Degraded because ISS-01, REDM-01, and WSDOT-01 still failed.

Proof:

- `00_AS-BUILT/20260823-UWISSY_MONITOR_DATA_QUALITY_ROUND1B/workflow-updates/lane05-update-result.json`
- `00_AS-BUILT/20260823-UWISSY_MONITOR_DATA_QUALITY_ROUND1B/workflow-updates/lane05-kc-status-normalizer-live-update.json`
- `00_AS-BUILT/20260823-UWISSY_MONITOR_DATA_QUALITY_ROUND1B/live-backups/post-change/lane05-4RiNqOKD9BCZFH6P-v02.UWI_LANE05-after-kc-status-normalizer.json`

## 8. AIRNOW-01 Result

Live implementation:

- Lane 03 node: `Fetch AIRNOW-01 API Alerts`
- Expected runtime variable: `AIRNOW_API_KEY`

Finding:

- The live n8n execution cannot access the required environment variable.
- Source failure after rerun: `access to env vars denied`.
- No approved n8n HTTP credential object was already wired to this node.
- No secret value was exposed or hard-coded.

Classification:

`OWNER/RUNTIME CREDENTIAL REQUIRED`

Round 2 / owner action:

Expose an approved `AIRNOW_API_KEY` to the n8n execution environment or wire an approved n8n credential object to the HTTP request.

## 9. WSDOT-01 Result

Live implementation:

- Lane 05 node: `Fetch WSDOT-01 Alerts`
- Expected runtime variable: `WSDOT_TRAVELER_API_ACCESS_CODE`

Finding:

- The live n8n execution cannot access the required environment variable.
- Source failure after rerun: `access to env vars denied`.
- No approved n8n HTTP credential object was already wired to this node.
- No secret value was exposed or hard-coded.

Classification:

`OWNER/RUNTIME CREDENTIAL REQUIRED`

Round 2 / owner action:

Expose an approved `WSDOT_TRAVELER_API_ACCESS_CODE` to the n8n execution environment or wire an approved n8n credential object to the HTTP request.

## 10. PSCAA-01 Result

Finding:

- Current official pages were reachable in bounded probes.
- No small, deterministic machine-readable station snapshot extraction was proven within Round 1B scope.
- The live source remains `empty_but_valid` with a warning, not a hard failure.

Classification:

`ROUND 2 SOURCE/PARSER RESEARCH REQUIRED`

No brittle parser or replacement source was added in Round 1B.

## 11. External Source Results

Remaining external/source or runtime-network issues after live rerun:

| Source | Lane(s) | Current result | Classification |
| --- | --- | --- | --- |
| REDM-01 | 01, 05, 06 | timeout of 30000ms exceeded | external/runtime network limitation |
| ISS-03 | 01 | timeout of 30000ms exceeded | external/runtime network limitation |
| ISS-01 | 01, 05, 06 | Cloudflare challenge / timeout | external/source access limitation |
| ECO-02 | 03 | HTTP 404 source response | source unavailable |
| PSCAA-02 | 03 | HTTP 404 source response | source unavailable |
| NOAA-01 | 04 | HTTP 404, served last-known-good | source unavailable / LKG coverage limitation |

Round 1B did not bypass Cloudflare, weaken validation, mark stale data fresh, or replace sources.

## 12. All-8-Lane Execution Table

| Lane | Workflow ID | Execution ID | Result |
| --- | --- | --- | --- |
| 01 | `RR7cLSV9oGngrJdA` | `3984` | success |
| 02 | `fA0ZjWH3Itl83aPC` | `3985` | success |
| 03 | `qlM2XIv2BbFSh3in` | `3986` | success |
| 04 | `w6xnelPQeRFZk8BG` | `3987` | success |
| 05 | `4RiNqOKD9BCZFH6P` | `3994` | success after KC-ROAD status normalization fix |
| 06 | `poGV37VLUGIUxfGK` | `3989` | success |
| 07 | `08g3JNwQPVSxUl2H` | `3991` | success |
| 08 | `uwIssy08RouteFacilities` | `3992` | success |

Raw execution proof was sanitized before inclusion in proof.

Proof:

- `00_AS-BUILT/20260823-UWISSY_MONITOR_DATA_QUALITY_ROUND1B/live-executions/n8n-api-execution-summary.json`
- `00_AS-BUILT/20260823-UWISSY_MONITOR_DATA_QUALITY_ROUND1B/live-executions/lane05-lane20-rerun-api-summary.json`

## 13. Lane 20 Publication Result

Lane 20 workflow:

`gp8WlccGwLydNWG7`

Final execution:

`3995`

Release:

`20_STATUS_PUBLISHER-20260824T060529Z-001`

Assembled:

`2026-08-24T06:05:29.026Z`

Published commit from Lane 20 GitHub bridge:

`ef2067b88b1a91402b072656d07fdd8dc409f777`

Live public package validation passed against the custom domain package.

## 14. Actual Before / After 8-Monitor Table

| Monitor | Before | After | Failed before | Failed after | Remaining reason |
| --- | --- | --- | ---: | ---: | --- |
| Route conditions | Degraded | Degraded | 3 | 3 | REDM-01 timeout; ISS-03 timeout; ISS-01 Cloudflare challenge |
| Weather | Current | Current | 0 | 0 | none |
| Air quality | Degraded | Degraded | 4 | 3 | ECO-02 404; PSCAA-02 404; AIRNOW-01 env access denied |
| Wildfire | Degraded | Degraded | 1 | 0 | NOAA-01 using last-known-good after HTTP 404 |
| Flood conditions | Degraded | Degraded | 4 | 3 | ISS-01 Cloudflare challenge; REDM-01 timeout; WSDOT-01 env access denied |
| Trail infrastructure | Degraded | Degraded | 2 | 2 | ISS-01 timeout; REDM-01 timeout |
| Government safety alerts | Current | Current | 0 | 0 | none |
| Route facilities | Current | Current | 0 | 0 | none |

Summary:

- Current before: 3
- Degraded before: 5
- Current after: 3
- Degraded after: 5
- Failed after: 0

## 15. Actual Before / After Source Failures

Source failures eliminated:

- ECO-01
- NIFC-01
- KC-ROAD-01

Known repaired-source after-state:

| Source | Before | After | Verified |
| --- | --- | --- | --- |
| ECO-01 | failed | empty_but_valid | yes |
| NIFC-01 | failed | empty_but_valid | yes |
| KC-ROAD-01 | failed | ok, 1 record | yes |
| AIRNOW-01 | failed | failed | owner/runtime credential required |
| WSDOT-01 | failed | failed | owner/runtime credential required |
| PSCAA-01 | empty_but_valid with warning | empty_but_valid with warning | deferred to Round 2 source/parser research |

## 16. Health-Scoring Logic Audit

The health scoring rule was audited and not changed.

Finding:

- Per-lane logic treats any source status of `failed`, `stale`, or `using_last_known_good` as degrading that lane when validation/publish otherwise succeeds.
- Lane 20 maps lane `degraded`, `stale`, `failed_fetch`, and `using_last_known_good` to display severity `watch`.
- Lane 20 sets aggregate `system_result` to `DEGRADED` if any lane is `watch` or `unknown`, or if an expected lane did not run current cycle.
- The current rule does not weight source criticality, redundancy, percentage coverage, required/optional source role, or successful fallback coverage.

Answer:

Yes. Under current per-lane logic, one failed configured source can mark a monitor Degraded. A lane with 1 failed source out of 8 and a lane with 3 failed sources out of 4 are both classified through the same `anyFailed` degradation path.

Proof:

`00_AS-BUILT/20260823-UWISSY_MONITOR_DATA_QUALITY_ROUND1B/scoring-rule-audit.txt`

## 17. Unresolved Round 2 Candidates

Do not implement in Round 1B. Recommended owner-review candidates:

- Redmond source replacement/redundancy for REDM-01.
- Issaquah structured-source replacement for ISS-01 and ISS-03.
- Ecology SmokeForecast alternative for ECO-02.
- PSCAA source/API replacement or deterministic station parser research for PSCAA-01 / PSCAA-02.
- NOAA-01 endpoint replacement/revalidation for wildfire LKG condition.
- Runtime credential provisioning for AIRNOW-01 and WSDOT-01.

## 18. Owner Decisions Required Next

1. Decide whether to provision `AIRNOW_API_KEY` and `WSDOT_TRAVELER_API_ACCESS_CODE` into the production n8n runtime or convert those branches to approved n8n credential objects.
2. Decide whether Round 2 should prioritize source replacement/redundancy for Redmond, Issaquah, PSCAA, Ecology SmokeForecast, and NOAA-01.
3. Decide whether the health scoring rule should continue to degrade a full monitor for one failed configured source, or whether source criticality/redundancy should be modeled explicitly in a later owner-approved scoring task.

## Validation

Validation results:

- Unit tests: 8 files, 110 tests passed.
- Typecheck: `npm run typecheck` passed.
- Production build: `npm run build` passed.
- Workflow validation: Lane 03, Lane 04, and Lane 05 passed.
- Public package validation: local `dist/data` passed.
- Public package validation: live custom-domain package passed, release `20_STATUS_PUBLISHER-20260824T060529Z-001`.
- Copy allowlist validation: passed, 73 approved rows, 0 rejected, 0 pending, 0 unmapped, COPY-048 absent.
- Secret scan: local `dist` passed.
- Secret scan: Round 1B proof folder passed after redacting Cloudflare challenge-token strings from raw execution proof.

## Proof

Proof folder:

`00_AS-BUILT/20260823-UWISSY_MONITOR_DATA_QUALITY_ROUND1B/`

Proof ZIP:

`/Users/jkbrookspersonal/Downloads/20260823-UWISSY_MONITOR_DATA_QUALITY_ROUND1B_PROOF.zip`

SHA-256:

`fb17f2e8538dec5f53d6bc2186feed56772e369da55b4939fbba54709759239a`

Final local commits:

- `4d3a159`

Lane 20 publication commit:

- `ef2067b88b1a91402b072656d07fdd8dc409f777`
