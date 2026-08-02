# IMPLEMENTATION_RECOMMENDATION.md — 05_FLOOD_CONDITIONS

This is a planning document only. No production n8n workflow was built in this cycle.

## Recommended MVP runtime source set

1. `USGS-01` — downstream observed Issaquah Creek at the route end.
2. `USGS-02` — upstream Hobart observed gauge for lead time into the route end.
3. `NWPS-01` — official forecast/category source for Issaquah Creek near Issaquah.
4. `NWS-01` — official flood and flash-flood alerts.
5. `ISS-01` — official local phase semantics and lead-time interpretation for Issaquah.

## Recommended secondary source set

- `USGS-03` — Lake Sammamish elevation context.
- `NWPS-02` — upstream Hobart corroboration in NOAA form.
- `REDM-01` — Redmond closure supplement around West Lake Sammamish Parkway and NE 24th.
- `KC-ROAD-01` — low-probability but clean county-road closure supplement.
- `WSDOT-01` — state-highway crossing supplement.

## Sources not recommended as runtime dependencies

- `KCF-02` because it is an undocumented app backend.
- `KC-ROAD-02` until live Sammamish content is observed.
- Bellevue, Sammamish, Seattle/SPU, and sign-up systems because they are guidance or notification products, not feeds.
- Ecology flood maps because they are static planning context, not current conditions.

## Route-impact model

The implementation should evaluate route impact in this order:

1. **Confirmed route closure**
   A shared closure connector reports a geometry-matched closure with flood, water, washout, or drainage language.

2. **Observed flooding**
   `NWPS-01` observed category is minor, moderate, or major; or Issaquah local phase is II, III, or IV.

3. **Forecast flooding**
   `NWPS-01` forecast category is above `no_flooding`; or NWS issues Flood Watch / Flood Warning / Flash Flood Warning overlapping the route.

4. **Probable route impact**
   Water is elevated on a route-relevant gauge but no closure is confirmed yet. This should be conservative and section-specific, not route-wide.

5. **Elevated water**
   Context-only signal. Use for Lake Sammamish high water, rising Hobart levels below local phase triggers, or cautionary water-level anomalies without official flood status.

6. **No known route impact**
   No official flood alerts, no route-relevant closure, and route-relevant gauges below official or derived attention levels.

## Acquisition cadence

| Source | Cadence | Reason |
| --- | --- | --- |
| USGS-01 / USGS-02 / USGS-03 | every 15 minutes | USGS cache-control is `max-age=900` and the tested values updated on a 15-minute rhythm |
| NWPS-01 / NWPS-02 status | every 15 minutes | Observed status changed on a 15-minute rhythm |
| NWPS-01 stageflow / ratings | every 60 minutes | Forecast curve and ratings do not need 15-minute polling |
| NWS-01 | every 10 to 15 minutes | NWS tested cache-control is `max-age=5` and alerting is event-driven |
| REDM-01 / KC-ROAD-01 / WSDOT-01 | every 30 to 60 minutes | Closure supplements, not core hydrologic backbone |
| ISS-01 | daily or on-change | threshold/policy source, not a main live feed |

## Freshness and failure rules

- `USGS-01`, `USGS-02`, `USGS-03`: mark stale after 30 minutes.
- `NWPS-01`, `NWPS-02` observed status: mark stale after 30 minutes.
- `NWPS-01` forecast: mark stale after 6 hours.
- `NWS-01`: mark stale after 15 minutes.
- closure supplements: mark stale after 2 hours.

On failure:

- preserve last known good per source;
- surface per-source health;
- degrade only the affected sections;
- never convert missing data into “clear.”

## Proposed high-level n8n design

**Recommendation: one workflow with separate branches and a shared normalizer.**

Branches:

1. USGS observations.
2. NWPS status / stageflow / ratings.
3. NWS flood alerts.
4. Shared closure supplements.
5. Daily policy/reference scrape for `ISS-01`.

Shared stages:

- fetch
- validate payload shape
- map source timestamps
- evaluate route relevance
- classify severity
- write normalized output atomically
- keep last known good

## Key implementation cautions

- Do not treat `USGS-03` lake level as a closure trigger by itself.
- Do not assume upstream Hobart stage equals downstream trail flooding without local threshold logic.
- Do not use countywide or citywide closure sources without geometry matching.
- Do not depend on `KCF-02` unless King County later publishes a supported contract.

## Recommended next implementation step

Build a prototype normalizer against only:

- `USGS-01`
- `USGS-02`
- `NWPS-01`
- `NWS-01`

Then add `USGS-03` and shared closure supplements only after the base severity logic is stable.
