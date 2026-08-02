# 02_WEATHER

## Status

Research and source-verification phase COMPLETE (first cycle, 2026-07-29). All
6 primary NWS API endpoints were directly tested and VERIFIED against all 8
recommended route points; 2 secondary/candidate sources (WSDOT RWIS, UW
Atmospheric Sciences) were investigated and classified UNRESOLVED and REJECT
respectively. No production n8n workflow has been built. This directory
contains research, verification, and planning deliverables only, per the
assigned work order (research/planning only — production build is a separate
future task).

## Scope

Lane 02 covers weather conditions that materially affect cycling along the
UW–Issaquah route: current conditions, hourly/near-term/7-day forecast,
precipitation probability/type/amount, temperature and apparent temperature,
wind (sustained/gust/direction), visibility, thunderstorms, lightning-related
alerts, snow/freezing precipitation, frost/ice potential, excessive heat,
dense fog, high wind, severe weather, official meteorological alerts, and
observation/forecast freshness.

Lane 02 explicitly does NOT cover: air quality (03), wildfire (04), flood
conditions (05), trail infrastructure asset condition (06), or general
government/public-safety alerts (07). One real overlap was found and
documented this cycle: NWS's active-alerts feed can return Air Quality Alerts
(Lane 03's domain) and, by the same mechanism, could return Fire Weather
Watches (Lane 04's domain) — see `SOURCE_GAPS.md` item 5 and
`WEATHER_THRESHOLD_RECOMMENDATIONS.md` for the required event-type filter.

## Canonical route input

`data/route/UnivWA-Issaquah.gpx` (project root). Directly re-parsed this cycle
(1,470 track points, 33.83 mi, bbox lat 47.55207–47.75889 / lon -122.3057 to
-122.04414) — independently confirmed to match Lane 01's previously-reported
figures for the same corrected `v2` GPX.

## Files in this directory

- `README.md` — this file
- `SOURCE_REGISTRY.md` — human-readable source registry, all evaluated sources
- `SOURCE_REGISTRY.json` — machine-readable version of the same registry (validated JSON)
- `RESEARCH_FINDINGS.md` — narrative findings, discovery method, NWS API/observation/alert findings
- `API_AND_FEED_TEST_RESULTS.md` — actual fetch/test results with real HTTP status and observations
- `SOURCE_GAPS.md` — coverage gaps, rejected sources, unresolved items, lane overlaps
- `IMPLEMENTATION_RECOMMENDATION.md` — working-level recommendation for how to build Lane 02 later
- `ROUTE_WEATHER_POINT_MAPPING.md` — 8-point weather monitoring design, cross-referenced to the corrected GPX and NWS gridpoints
- `WEATHER_THRESHOLD_RECOMMENDATIONS.md` — initial rider-relevant thresholds, each labeled inherited/adjusted/proposed/unresolved

`sample-responses/` contains real JSON samples captured during live NWS API
testing: per-point `/points` responses (all 8), one full forecast/hourly/
gridpoint-data payload (WP1), alert payloads (point/zone/county/statewide),
and latest-observation samples for the 4 recommended stations. No
credentials, cookies, or tokens were saved. **Known cleanup item:** the
per-point `/stations` (observation-station-list) responses were captured for
all 8 points before it was confirmed they return the identical underlying
73-station regional catalog (same NWS office area) — 7 of the 8 are
redundant duplicates of `WP1_UW_Seattle_stations.json` and should be deleted
in a future pass (~720 KB); a deletion attempt in this cycle was blocked by
the runtime's permission policy rather than performed deliberately. No
`schemas/`, `scripts/`, or `tests/` subdirectories were created this cycle —
no normalization schema or helper script was built (research/planning only,
per the work order), and no test fixtures beyond the raw samples already
saved were needed yet.

## Final polished deliverables (same directory)

- `UW_ISSY_02_WEATHER_FINAL_RESEARCH_REPORT_v1.md`
- `UW_ISSY_02_WEATHER_IMPLEMENTATION_RECOMMENDATION_v1.md`
- `UW_ISSY_02_WEATHER_AUDIT_REPORT_v1.md`
- `UW_ISSY_02_WEATHER_FINAL_SOURCE_REGISTRY_v1.json`

These four files (only) were also copied to `/Users/jkbrookspersonal/Downloads`,
verified by SHA-256 against the authoritative copies in this directory.

## Key finding (one line)

A single NWS Weather Forecast Office (Seattle/Tacoma, `SEW`) has full,
verified, unauthenticated API coverage of the entire 33.83-mile route across
all 8 designed monitoring points — forecast, hourly forecast, raw numeric
grid data, and alerts are all VERIFIED/MVP with zero access barriers, while
full-featured (METAR-grade) observation stations are genuinely sparse for the
Woodinville-through-Issaquah two-thirds of the route, and Washington's own
road-weather (RWIS) network remains a real but access-gated (free
registration required) opportunity for future densification.
