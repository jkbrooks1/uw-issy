# Lane 01 v02 Report-Out Upgrade Summary

Status: `PASS — v02.UWI_LANE01 live-qualified`

Workflow id: `RR7cLSV9oGngrJdA`

Old live name: `v01.UWI_LANE01`

New live name: `v02.UWI_LANE01`

Baseline v01 result: one-off CLI execution stalled after writing only KC-03 and REDM-01 raw landings. The process was terminated after inspection. Source diagnostics from inside the n8n container showed the Issaquah ArcGIS query exceeded a 20 second bounded fetch test, and the Issaquah CivicAlerts source returned a Cloudflare 403. The v01 HTTP Request nodes had no timeout configured.

v02 changes:

- Added 30000 ms timeout options to all four native HTTP Request source nodes.
- Updated workflow name to `v02.UWI_LANE01`.
- Updated connector version and manifest id to `v0002`.
- Added execution-evidence output to `Build Final Artifact Bundle`.
- Replaced the final report-out logic with a truth-based report supporting `PASSED`, `DEGRADED`, and `FAILED`.

Static checks:

- JSON parse: PASS.
- Custom graph/report/timeout/name/active-state checks: PASS.
- n8n structural validator: PASS against a temporary inactive validation copy, because the project validator rejects active canonical exports while this task required preserving the live active state.
- Existing Lane 01 LKG fixture scenarios: PASS, 8/8 via CommonJS stdin.

Final v02 live run:

- Run id: `01_ROUTE_CONDITIONS-20260819T052056Z-001`
- Started: `2026-08-19T05:20:55.480Z`
- Stopped: `2026-08-19T05:21:58.175Z`
- n8n status: success
- Report-out status: `DEGRADED`
- Published artifact: `/files/uw-issy-connectors/published/01_ROUTE_CONDITIONS/01_ROUTE_CONDITIONS_published_20260819T052056Z.json`
- Published pointer resolved: true
- Published data status: `degraded`
- Connector version in published artifact: `v0002`
- Source count: 4
- Failed source count: 3
- Event count: 1
- Execution evidence written: true
- Quarantine written: false

Fault/failure truth proof:

The final restored run itself exercised the failure path without deliberate source mutation. REDM-01 and ISS-03 timed out at 30000 ms, ISS-01 returned 403, and the report-out correctly returned `DEGRADED` rather than a false pass or empty-valid state. The published artifact preserved the failed source states and still carried usable degraded output.
