# IMPLEMENTATION_RECOMMENDATION.md — 03_AIR_QUALITY

Planning document only. No production n8n workflow was built in this cycle.

## Recommended MVP source set

### 1. `ECO-01` — WA Ecology hourly-monitor ArcGIS REST

Why it belongs in the MVP:

- strongest official current-condition source found
- machine-readable without credentials
- station-level AQI plus pollutant-specific fields
- route-near point geometry enables deterministic segment mapping

### 2. `ECO-02` — WA Ecology smoke-forecast ArcGIS REST

Why it belongs in the MVP:

- strongest official outlook source found
- route-intersectable polygons
- directly answers smoke-driven “what about later today / next few days?”

### 3. `PSCAA-02` — PSCAA burn-ban status page

Why it belongs in the MVP:

- best official burn-ban source found for this corridor
- directly covers the route’s jurisdiction
- satisfies the work order’s air-quality-driven burn-ban requirement

## Recommended secondary sources

- `AIRNOW-02` — public fallback and public-facing cross-check
- `WASMOKE-01` — official smoke-outlook explanation and wildfire-smoke
  attribution
- `NWS-AQ-01` — formal event/advisory alert layer
- `PSCAA-01` — useful secondary station detail if the production implementation
  is willing to handle session bootstrap and cookie state
- `AIRNOW-01` — only if an API key is obtained and maintained

## Rejected or non-primary sources

- `KC-PH-01`, `SEA-PH-01`: keep as copy/reference pages only, not as live
  connectors
- `PSCAA-03`: good official low-cost-sensor concept, but automation path not
  proved this cycle

## Minimum viable connector set vs. preferred production set

### Minimum viable connector set

- `ECO-01`
- `ECO-02`
- `PSCAA-02`

This is the smallest set that still credibly covers:

- current AQI by official monitor
- route-segment current conditions
- smoke-driven outlook
- burn-ban status

### Preferred production connector set

- MVP set, plus:
- `AIRNOW-02`
- `WASMOKE-01`
- `NWS-AQ-01`
- optionally `PSCAA-01`
- optionally `AIRNOW-01` after key acquisition

Reasoning:

- `AIRNOW-02` adds national fallback and public-parity reporting-area data
- `WASMOKE-01` adds official smoke attribution and prose context
- `NWS-AQ-01` adds a clean formal-alert channel
- `PSCAA-01` adds rich local station detail but costs more operational effort

## Recommended route model

Use more than one point. The preferred production model is 4 official monitor
points:

1. Seattle-NE 127th
2. Lake Forest Park-Town Center
3. Bellevue-SE 12th
4. Issaquah-Lake Sammamish

If the first version must be simpler, compress to 3 corridor buckets:

1. north / west route
2. eastside mid-corridor
3. Issaquah / south terminus

Full assignment logic is in `ROUTE_RELEVANCE_AND_THRESHOLDS.md`.

## Acquisition cadence

| Source | Recommended cadence | Freshness threshold |
|---|---|---|
| `ECO-01` | every 60 minutes | 90 minutes |
| `ECO-02` | every 3-6 hours in smoke season; daily off-season | 12 hours in smoke season |
| `PSCAA-02` | every 6-12 hours; more often in burn-ban season | 24 hours |
| `AIRNOW-02` | every 30-60 minutes for observations; daily for ZIP map | 90 minutes obs / 24 hours ZIP |
| `WASMOKE-01` | every 3-6 hours in smoke season | 12 hours |
| `NWS-AQ-01` | every 10-15 minutes | 15 minutes |

## Freshness, failure, and fallback behavior

### Current observations

- Prefer `ECO-01`
- Mark stale if latest `DateTime_PST` is older than 90 minutes
- If stale or failed:
  - keep last-known-good
  - mark source degraded
  - optionally cross-check `AIRNOW-02`

### Forecast / outlook

- Prefer `ECO-02`
- Enrich with `WASMOKE-01` when the blog has current smoke outlook text
- Never present forecast data as current observations

### Burn bans

- Use `PSCAA-02`
- If unavailable, preserve last-known-good and mark `manual_review_required`
  rather than inventing a status

### Alerts / advisories

- Use `NWS-AQ-01` only for formal air-quality alert events
- If there is no formal alert, do not synthesize one; instead show observed AQI
  severity from `ECO-01`

## Last-known-good behavior

The connector should preserve last-known-good data for each source family:

- `current_observations`
- `smoke_forecast`
- `burn_ban_status`
- `formal_alerts`

If one source fails, publish a degraded but still structured output rather than
dropping the entire lane. This matches project-wide expectations from
`00_PROJECT_RULES.md`.

## Proposed high-level n8n design

Recommendation: one workflow with separate branches and one final normalization
stage.

### Branch A — current observations

- fetch `ECO-01`
- reduce to route-near monitor set
- compute segment assignments and top-level current severity

### Branch B — smoke outlook

- fetch `ECO-02`
- intersect polygons with route
- optionally fetch `WASMOKE-01` and attach text/context

### Branch C — advisories

- fetch `PSCAA-02`
- fetch `NWS-AQ-01`
- classify each as `burn_ban`, `formal_alert`, or none

### Merge / normalize / write

- validate against `NORMALIZED_SCHEMA_PROPOSAL.md`
- write atomically
- preserve last-known-good per source branch

## Production output recommendations

Recommended production file family once the implementation phase begins:

- `air-quality-connector-output.json`
- `air-quality-current.normalized.json`
- `air-quality-forecast.normalized.json`
- `air-quality-advisories.normalized.json`
- `air-quality-source-health.json`

## Risks

1. `ECO-01` is excellent, but PM10 is not guaranteed at every route-near station.
2. `PSCAA-01` is real but session-backed; it adds operational brittleness.
3. AirNow is useful but coarse; if over-trusted it will blur route variation.
4. Smoke-blog prose can be highly valuable, but it must stay clearly labeled as
   outlook/context rather than current measured conditions.
5. The eventual production host should re-test Ecology TLS behavior once from
   that host, even though this cycle proved the data itself is live.

## Next implementation step

Build a small prototype fetch-only workflow against:

- `ECO-01`
- `ECO-02`
- `PSCAA-02`

Do not add `AIRNOW-01` or `PSCAA-01` until the first prototype already works
end-to-end and writes a validated normalized JSON file.
