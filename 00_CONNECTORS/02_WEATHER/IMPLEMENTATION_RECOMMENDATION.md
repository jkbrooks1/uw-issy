# IMPLEMENTATION_RECOMMENDATION.md — Lane 02_WEATHER

Working-level recommendation for a future n8n build. **No workflow is built in
this cycle** — this document is planning input only, per the work order.

## MVP source set

All 6 NWS API sources (`NWS-01` through `NWS-06`) — see `SOURCE_REGISTRY.md`.
No authentication, no API key, all verified live 2026-07-29. This alone gives
full coverage of: current/near-term/hourly/7-day forecast, precipitation
probability and amount, temperature and apparent temperature, wind (sustained
and gust, though only NWS-04 gives numeric gust), visibility, thunderstorm
probability, snow/freezing precipitation, official alerts.

## Secondary sources

- `WSDOT-01` (WSDOT RWIS) — pending free AccessCode registration; would add
  road-surface-adjacent data (pavement/visibility at specific highway-adjacent
  points) if a station is confirmed on-route.

## Rejected

- `UW-01` (UW Atmospheric Sciences rooftop station) — no stable public API;
  fully substituted by NWS-04/NWS-05 at the same location (WP1).

## Recommended route points

All 8 points from `ROUTE_WEATHER_POINT_MAPPING.md` (WP1–WP8), each with its
own resolved `gridId`/`gridX`/`gridY`. Observations use the separate 4-station
set (`SEAW1`, `KBFI`, `KRNT`, `KPAE`) rather than one station per point, per
the forecast-vs-observation split documented in that file.

## Acquisition cadence

| Data type | Source | Recommended cadence | Basis |
|---|---|---|---|
| Points metadata (gridId/gridX/gridY) | NWS-01 | Once, cached; re-validate weekly | NWS documentation: grid assignments rarely change |
| 7-day/hourly forecast | NWS-02, NWS-03 | Hourly | `updateTime` freshness threshold set at 1 hour in the registry |
| Raw gridpoint data | NWS-04 | Hourly | Same freshness threshold; this is the primary field source for threshold evaluation |
| Observations | NWS-05 | Every 30-60 minutes | Full ASOS stations update sub-hourly (~10-15 min observed); 90-minute staleness threshold gives margin |
| Alerts | NWS-06 | Every 10-15 minutes | Alerts are time-sensitive/event-driven; shortest cadence of any Lane 02 source |

## Normalized data model (proposed)

Following the CDM connector's proven output-contract shape
(`02_WEATHER_CONNECTOR_OUTPUT_CONTRACT.md`, reviewed read-only, no French
fields reused) but with Washington-specific source IDs and field mappings:

```json
{
  "connectorId": "02_WEATHER",
  "connectorName": "UW-Issaquah Weather Connector",
  "generatedAt": "ISO-8601 UTC",
  "timezone": "America/Los_Angeles",
  "status": "ok | degraded | failed | infra_blocked",
  "sources": [
    { "sourceId": "nws-forecast", "sourceName": "NWS 7-Day/Hourly Forecast", "endpoint": "https://api.weather.gov/gridpoints/SEW/{x},{y}/forecast", "category": "weather" }
  ],
  "routePoints": [
    { "pointId": "WP1", "name": "UW / Seattle", "lat": 47.65051, "lon": -122.30462, "gridId": "SEW", "gridX": 126, "gridY": 70 }
  ],
  "forecast": [ "...normalized period records, one per WPx per forecast period..." ],
  "gridData": [ "...normalized hourly numeric records, one per WPx per hour, per NWS-04 fields..." ],
  "observations": [ "...normalized records, one per station in the 4-station set..." ],
  "alerts": [ "...normalized records, event-filtered per WEATHER_THRESHOLD_RECOMMENDATIONS.md allowlist..." ],
  "sourceHealth": [ "...per-source status/fetchedAt/staleAfterMinutes/httpStatus/recordCount/errors/warnings, mirroring the CDM sourceHealth contract shape..." ],
  "validation": { "passed": true, "errors": [], "warnings": [] }
}
```

`timezone` is `America/Los_Angeles` (directly confirmed via NWS-01 for all 8
points), replacing the CDM connector's `Europe/Paris`. `staleAfterMinutes`
values come directly from the freshness thresholds recorded per-source in
`SOURCE_REGISTRY.json` (60 for forecast/grid data, 90 for observations, 15 for
alerts) — not invented independently of that registry.

## Route-point iteration

Forecast/hourly/grid-data/alert fetches iterate over all 8 `WPx` points
(8 gridpoints, resolved once via NWS-01 and cached). Observation fetches
iterate over the fixed 4-station set instead of per-point, per the
`ROUTE_WEATHER_POINT_MAPPING.md` "forecast vs. observation point sets"
determination.

## Threshold evaluation

Apply the WA-ADJUSTED/PROPOSED thresholds in
`WEATHER_THRESHOLD_RECOMMENDATIONS.md` against NWS-04's numeric fields per
`WPx`/hour. Do not treat any threshold in that document as final policy without
project-owner sign-off — several are explicitly marked UNRESOLVED pending
retrieval of NWS SEW's own official advisory criteria.

## Route-section assignment

Each `WPx` maps to the named route section(s) in
`ROUTE_WEATHER_POINT_MAPPING.md`'s table (e.g. WP3 → "Burke-Gilman Trail
terminus / Sammamish River Trail head, Bothell Landing/Blyth Park area").
Threshold breaches at a given `WPx` should be attributed to that section,
not the whole route, mirroring Lane 01's per-segment attribution model.

## Source-health, stale-data, and partial-failure handling

Directly reuse the CDM connector's proven pattern (reviewed read-only):
- Each source gets its own `sourceHealth` entry with `status` in
  `ok | degraded | failed | stale`.
- One source failing (e.g. NWS-06 alerts times out) sets top-level `status`
  to `degraded`, not `failed` — the other sources still publish. This is a
  direct architectural reuse of the CDM output contract's degraded-source
  rule, which is source-agnostic and requires no French-specific adaptation.
- `status` becomes `failed` only when ALL sources fail, or the validation
  step finds a structural error (missing `connectorId`, invalid timestamp,
  unknown `sourceId`).
- A missing/expired cached grid resolution (NWS-01) is treated as a fetch
  failure for that point, not a fatal workflow error — falls back to the
  last-known-good `gridId`/`gridX`/`gridY` if within a reasonable staleness
  window, otherwise that point's forecast/grid data is marked `failed` for
  the run while other points continue.

## Last-known-good preservation

Every source (forecast, grid data, observations, alerts) preserves its last
successfully-fetched payload. On failure, the connector publishes the
last-known-good payload for that source with `sourceHealth.status: "stale"`
rather than omitting the data entirely — directly reusing the CDM/project-wide
rule ("Production outputs must use atomic writes and preserve the last known
good output when a connector fails," `00_PROJECT_RULES.md`).

## Atomic JSON writing

Write to a temp file, then atomic rename over the production file — same
pattern as the CDM connector's file-writing convention, source-agnostic and
directly reusable with no French-specific dependency.

## Deduplication

Alerts: dedupe on the NWS alert `id` (a persistent URN, confirmed present in
live testing) rather than a derived composite key, since NWS already provides
a stable identifier (unlike Météo-France vigilance, which required a derived
`externalId` per the CDM contract — this is a genuine simplification available
here, not a gap).

Forecast/grid-data records: dedupe on `(pointId, validTime-start)`.

## Alert expiration

An alert is considered expired and should be dropped from the "active" list
once `now > expires` (or `ends`, when present) — directly using the NWS
`expires`/`ends` fields confirmed present in live testing, no derived
expiration logic needed (unlike a source lacking a machine-readable
expiration field).

## One workflow, separate workflows, or separate branches — recommendation

**Recommendation: one workflow with separate branches** (forecast+grid-data,
observations, alerts, each its own branch merging into a shared normalization/
validation/write stage), not three separate workflows.

**Tradeoffs considered:**
- *Separate workflows* would isolate failures more completely and allow
  independent schedules, but this project's cadence differences are modest
  (60 min vs. 90 min vs. 15 min — not orders of magnitude apart) and three
  workflows would triplicate the shared `WPx`/gridpoint-resolution logic
  (NWS-01), risking drift between them.
- *One workflow, one branch* (no separation) would be simplest but couples
  the fast-cadence alert check to the slower forecast/observation fetch
  cadence, forcing alerts to only run as often as the slowest branch — not
  acceptable given alerts' 15-minute recommended freshness vs. forecast's
  60-minute threshold.
- **One workflow, separate branches, most frequent trigger wins** (i.e. the
  workflow runs on a 15-minute schedule; the forecast/observation branches
  internally skip re-fetching if their own staleness threshold hasn't yet
  elapsed) balances both concerns: a single shared NWS-01 resolution step,
  a single shared normalization/validation/write stage, but independent
  effective cadences per branch. This directly mirrors the CDM connector's
  own multi-source-single-workflow pattern (vigilance + observations in one
  workflow, per the reviewed output contract) rather than introducing a new
  pattern.

## Production output files (proposed, mirroring CDM naming convention)

Under this project's approved output location once one is designated (no
`/files/cdm-status-output`-equivalent path exists yet for this project — flag
for project-owner decision, not assumed here):
- `weather-connector-output.json` — full combined payload
- `weather-forecast.normalized.json`
- `weather-gridpoint-data.normalized.json`
- `weather-observations.normalized.json`
- `weather-alerts.normalized.json`
- `weather-source-health.json`

## Test fixtures

Recommend capturing one full real payload per NWS endpoint (already saved
under `sample-responses/` this cycle) as the seed for unit-test fixtures, plus
one synthetic fixture with `null`-valued fields (confirmed to occur in live
data — `temperatureTrend`, `heatIndex`, `windChill`) to test null-safe
parsing, and one synthetic fixture simulating a non-200 response to test the
degraded/failed/last-known-good code paths, since no live failure was
observed to capture directly this cycle.

## Risks

1. Six thresholds in `WEATHER_THRESHOLD_RECOMMENDATIONS.md` are marked
   UNRESOLVED and must not be encoded as final policy without project-owner
   review.
2. WSDOT-01's route relevance is unresolved; do not assume it will become an
   MVP source until re-tested with a real AccessCode.
3. Observation coverage is genuinely thin for 4 of 8 route points; do not
   present observation-based "current conditions" for WP4/WP5/WP7/WP8 without
   the forecast-derived-proxy caveat documented in `SOURCE_GAPS.md` item 1.
4. NWS documentation states a "generous" but undisclosed rate limit; a
   production schedule (worst case 15-minute alert polling × 8 points × 6
   endpoint types) should be load-tested against real usage before being
   treated as risk-free, since this research cycle only performed light,
   ad hoc testing, not sustained-load testing.

## Next implementation step

Project owner reviews and approves/adjusts the thresholds in
`WEATHER_THRESHOLD_RECOMMENDATIONS.md`, decides on the WSDOT AccessCode
registration, and designates a production output path/location for this
project (equivalent to the CDM project's `/files/cdm-status-output`) before
any n8n workflow build begins.
