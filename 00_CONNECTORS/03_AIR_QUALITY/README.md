# 03_AIR_QUALITY

## Status

Research, live source testing, classification, and implementation planning are
complete for the UW -> Burke-Gilman Trail -> Sammamish River Trail -> Marymoor
Park -> East Lake Sammamish Trail -> Issaquah corridor.

This folder contains research/planning deliverables only. No production n8n
workflow, deployment, scheduled job, or live connector output was built in this
cycle.

## Key answer

Yes: Seattle-area and Issaquah-area conditions can differ enough to justify
more than one monitoring point. The preferred official-monitor design is a
4-point corridor model using live official monitors at Seattle-NE 127th, Lake
Forest Park, Bellevue-SE 12th, and Issaquah-Lake Sammamish, with a 3-point
compressed MVP fallback documented in
`ROUTE_RELEVANCE_AND_THRESHOLDS.md`.

## Strongest sources found

- `ECO-01` — Washington State Department of Ecology hourly-monitor ArcGIS REST
  service: best current official machine-readable source for station-level AQI
  plus PM2.5 / ozone / PM10 fields when available.
- `ECO-02` — Washington State Department of Ecology smoke-forecast ArcGIS REST
  service: best official outlook/polygon source for smoke-driven route impacts.
- `PSCAA-02` — Puget Sound Clean Air Agency burn-ban status page: best official
  burn-ban status source found for the corridor.

## Notable constraints

- AirNow’s public file feeds are live and useful, but they collapse most of the
  route into the coarse reporting area `Seattle-Bellevue-Kent Valley`, so they
  should not be the only route-segmentation source.
- PSCAA’s detailed station endpoint is real and live, but it is session-backed
  and needs a page bootstrap/cookie before station-detail calls succeed.
- King County and Seattle public-health pages are useful guidance references but
  not monitoring connectors.

## Files in this directory

- `SOURCE_REGISTRY.md` / `SOURCE_REGISTRY.json`
- `RESEARCH_FINDINGS.md`
- `API_AND_FEED_TEST_RESULTS.md`
- `SOURCE_GAPS.md`
- `IMPLEMENTATION_RECOMMENDATION.md`
- `ROUTE_RELEVANCE_AND_THRESHOLDS.md`
- `ENV_AND_READINESS.md`
- `NORMALIZED_SCHEMA_PROPOSAL.md`
- `OVERLAP_NOTES.md`
- `SESSION_LOG.md`

## Final packaged deliverables

- `UW_ISSY_03_AIR_QUALITY_FINAL_RESEARCH_REPORT_v1.md`
- `UW_ISSY_03_AIR_QUALITY_IMPLEMENTATION_RECOMMENDATION_v1.md`
- `UW_ISSY_03_AIR_QUALITY_AUDIT_REPORT_v1.md`
- `UW_ISSY_03_AIR_QUALITY_FINAL_SOURCE_REGISTRY_v1.json`

## Sample responses

Small sanitized response samples saved because they materially help future
implementation work:

- `sample-responses/ecology_hourly_route_latest.json`
- `sample-responses/ecology_smokeforecast_route.json`
- `sample-responses/airnow_reportingarea_seattle_bellevue_kent_valley.txt`
- `sample-responses/airnow_cityzipcodes_route_excerpt.txt`
- `sample-responses/pscaa_getstations.json`
- `sample-responses/pscaa_geometries.json`
- `sample-responses/pscaa_aqi_station_10073_lake_forest_park.json`
- `sample-responses/wasmoke_rss.xml`
- `sample-responses/nws_air_quality_alerts_WA.json`
