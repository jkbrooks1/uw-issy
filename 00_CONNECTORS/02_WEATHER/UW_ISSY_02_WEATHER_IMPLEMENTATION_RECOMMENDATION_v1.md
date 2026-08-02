# UW–Issaquah Connector 02 (Weather) — Implementation Recommendation v1

**Prepared:** 2026-07-29
**Lane:** `02_WEATHER`
**Status:** Planning recommendation only. No n8n workflow has been built.

## Recommended MVP source set

All 6 NWS API sources — `NWS-01` (points resolution), `NWS-02` (7-day
forecast), `NWS-03` (hourly forecast), `NWS-04` (raw gridpoint data),
`NWS-05` (observation stations/latest observations), `NWS-06` (active
alerts). No authentication required; all verified live 2026-07-29 against
all 8 route points. Full detail: `SOURCE_REGISTRY.md` /
`UW_ISSY_02_WEATHER_FINAL_SOURCE_REGISTRY_v1.json`.

## Secondary sources

`WSDOT-01` (WSDOT Traveler Information API, RWIS road-weather stations) —
pending free `AccessCode` registration at `https://wsdot.wa.gov/traffic/api/`;
would add road-surface-adjacent data at specific highway-crossing points if
a station is confirmed on-route in a follow-up cycle.

## Rejected

`UW-01` (UW Atmospheric Sciences rooftop station) — no stable public API;
fully substituted by NWS-04/NWS-05 at the same location.

## Recommended route points

8 points (WP1–WP8), full detail in `ROUTE_WEATHER_POINT_MAPPING.md`. Forecast/
hourly/grid-data/alerts query all 8 gridpoints directly; observations use a
separate fixed 4-station set (`SEAW1`, `KBFI`, `KRNT`, `KPAE`) rather than a
per-point derivation, because full-featured stations are far sparser than
forecast gridpoints along this corridor.

## Acquisition cadence

| Data type | Source(s) | Cadence | Basis |
|---|---|---|---|
| Points metadata | NWS-01 | Once, cached; re-validate weekly | NWS docs: grid assignments rarely change |
| Forecast (7-day, hourly) | NWS-02, NWS-03 | Hourly | 1-hour freshness threshold |
| Raw gridpoint data | NWS-04 | Hourly | 1-hour freshness threshold; primary threshold-evaluation source |
| Observations | NWS-05 | 30-60 min | Full ASOS updates sub-hourly; 90-min staleness threshold |
| Alerts | NWS-06 | 10-15 min | Time-sensitive/event-driven; shortest cadence of any source |

## Normalized data model

```json
{
  "connectorId": "02_WEATHER",
  "connectorName": "UW-Issaquah Weather Connector",
  "generatedAt": "ISO-8601 UTC",
  "timezone": "America/Los_Angeles",
  "status": "ok | degraded | failed | infra_blocked",
  "sources": [{ "sourceId": "string", "sourceName": "string", "endpoint": "string", "category": "weather" }],
  "routePoints": [{ "pointId": "WP1", "name": "string", "lat": 0, "lon": 0, "gridId": "SEW", "gridX": 0, "gridY": 0 }],
  "forecast": ["...normalized period records, one per WPx per forecast period..."],
  "gridData": ["...normalized hourly numeric records, one per WPx per hour..."],
  "observations": ["...normalized records, one per station in the 4-station set..."],
  "alerts": ["...normalized records, event-filtered per the threshold allowlist..."],
  "sourceHealth": [{ "sourceId": "string", "status": "ok|degraded|failed|stale", "fetchedAt": "ISO-8601", "staleAfterMinutes": 0, "httpStatus": 200, "recordCount": 0, "errors": [], "warnings": [] }],
  "validation": { "passed": true, "errors": [], "warnings": [] }
}
```

`timezone` is `America/Los_Angeles` (confirmed via NWS-01 for all 8 points).
`staleAfterMinutes`: 60 (forecast/grid data), 90 (observations), 15 (alerts)
— taken directly from the freshness thresholds recorded per-source in the
registry, not invented independently.

## Thresholds, freshness rules

Apply the WA-ADJUSTED/PROPOSED thresholds in
`WEATHER_THRESHOLD_RECOMMENDATIONS.md` against NWS-04's numeric fields per
`WPx`/hour. **Several thresholds are explicitly marked UNRESOLVED** (exact
NWS SEW Wind Advisory/Dense Fog Advisory numeric criteria; whether to defer
to NWS's own `heatRisk` field instead of a flat degree threshold; trail
surface type cross-check) and require project-owner review before being
encoded as policy. Freshness thresholds are set per-source as listed above.

## Failure, fallback, and last-known-good behavior

Directly reuses the CDM connector's proven pattern (reviewed read-only, no
French-specific dependency):

- Each source gets its own `sourceHealth` entry
  (`ok | degraded | failed | stale`).
- One source failing sets top-level `status` to `degraded`; the other
  sources still publish. `status` becomes `failed` only when **all** sources
  fail, or validation finds a structural error.
- Every source preserves its last successfully-fetched payload; on failure,
  the connector publishes last-known-good with `sourceHealth.status: "stale"`
  rather than omitting data — per the project-wide rule in
  `00_PROJECT_RULES.md` ("preserve the last known good output when a
  connector fails").
- A missing/expired cached grid resolution (NWS-01) falls back to the
  last-known-good `gridId`/`gridX`/`gridY` if within a reasonable staleness
  window; otherwise that point's data is marked `failed` for the run while
  other points continue.
- Atomic writes: temp file + atomic rename, same as the CDM connector's
  file-writing convention.

## Deduplication and alert expiration

Alerts dedupe on the NWS alert `id` (a persistent URN, confirmed present in
live testing) — simpler than the CDM connector's derived-`externalId`
approach, since NWS already supplies a stable identifier. Forecast/grid-data
records dedupe on `(pointId, validTime-start)`. Alert expiration uses the
NWS `expires`/`ends` fields directly (both confirmed present in live
testing) — no derived expiration logic needed.

## Proposed n8n design: one workflow, separate branches

**Recommendation:** one workflow, with separate branches for
forecast+grid-data, observations, and alerts, each merging into a shared
normalization/validation/write stage — not three separate workflows, and not
one undifferentiated branch.

**Why:** Separate workflows would triplicate the shared NWS-01
gridpoint-resolution logic and risk drift. A single undifferentiated branch
would force the fast-moving alert check (15-min freshness) onto the same
cadence as the slower forecast/observation fetch (60/90-min), which is not
acceptable. A single workflow on a 15-minute trigger with internal per-branch
staleness checks (each branch skips re-fetching until its own threshold has
elapsed) gives one shared resolution/normalization/validation/write stage
while preserving independent effective cadences per branch — directly
mirroring the CDM connector's own multi-source-single-workflow pattern.

## Production output recommendations

Proposed files (naming mirrors the CDM connector's convention; exact output
path/location for this project is not yet designated and is flagged as a
project-owner decision, not assumed here):

- `weather-connector-output.json` (full combined payload)
- `weather-forecast.normalized.json`
- `weather-gridpoint-data.normalized.json`
- `weather-observations.normalized.json`
- `weather-alerts.normalized.json`
- `weather-source-health.json`

## Risks

1. 6 thresholds in `WEATHER_THRESHOLD_RECOMMENDATIONS.md` are UNRESOLVED and
   must not be encoded as final policy without project-owner review.
2. WSDOT-01's route relevance is unresolved; do not assume MVP status until
   re-tested with a real AccessCode.
3. Observation coverage is genuinely thin for 4 of 8 route points; any
   "current conditions" presentation for WP4/WP5/WP7/WP8 must carry the
   forecast-derived-proxy caveat from `SOURCE_GAPS.md`.
4. NWS's rate limit is documented as "generous" but undisclosed numerically;
   this cycle performed light, ad hoc testing only, not sustained-load
   testing — load-test the full production polling pattern (worst case:
   15-min alert cadence × 8 points × multiple endpoint types) before
   treating it as risk-free.

## Next implementation step

Project owner reviews and approves/adjusts the thresholds in
`WEATHER_THRESHOLD_RECOMMENDATIONS.md`, decides on WSDOT AccessCode
registration, and designates a production output path/location for this
project before any n8n workflow build begins.
