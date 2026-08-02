# UW-Issaquah Connector Implementation Matrix (Workstreams 03-07)

Synthesized from each workstream's own `IMPLEMENTATION_RECOMMENDATION.md` and
`ENV_AND_READINESS.md`. Covers the 21 sources each workstream named as its MVP set,
plus the notable secondary/unresolved sources worth tracking. For the full 89-source
registry (MVP + secondary + rejected + unresolved, all fields), see
`UW_ISSY_CONNECTOR_REGISTRY_03_07.json`.

**IMPORTANT NAMESPACE WARNING:** source IDs are only unique *within* a workstream, not
across all five. `KC-01` means "King County Fire Safety Burn Bans" in 04_WILDFIRE but
"King County Parks Burke-Gilman Trail page" in 06_TRAIL_INFRASTRUCTURE_STATUS. `ISS-01`
similarly refers to two different City of Issaquah sources in 05 vs. 06. Any shared
implementation (n8n workflow, source-health dashboard, dedup logic) MUST namespace
source IDs by workstream (e.g. `05:ISS-01` vs `06:ISS-01`) before merging data across
workstreams — treating these as globally unique today would silently merge unrelated
sources.

## MVP source implementation matrix

| Workstream | Source | Connector type | Auth | Implementation method | Cadence | Fallback | Readiness | Complexity | Unresolved dependency |
|---|---|---|---|---|---|---|---|---|---|
| 03_AIR_QUALITY | `ECO-01` WA Ecology hourly-monitor ArcGIS REST | DIRECT_API | None | ArcGIS REST query, route-near monitor filter | every 60 min | `AIRNOW-02` cross-check | ready_now | Low | Re-test Ecology TLS behavior from the eventual production host (local `curl` failed exit 60; Python `requests` succeeded) |
| 03_AIR_QUALITY | `ECO-02` WA Ecology smoke-forecast ArcGIS REST | DIRECT_API | None | ArcGIS REST polygon query, route intersection | every 3-6 hrs in smoke season, daily off-season | `WASMOKE-01` prose context | ready_now | Low | None |
| 03_AIR_QUALITY | `PSCAA-02` PSCAA burn-ban status page | STRUCTURED_WEBPAGE | None | Scrape/parse official burn-ban page | every 6-12 hrs | Preserve last-known-good, mark `manual_review_required` | ready_now | Medium (webpage, not feed) | No documented JSON/RSS equivalent found this cycle |
| 04_WILDFIRE | `NIFC-01` WFIGS Current Wildland Fire Locations | DIRECT_API | None | ArcGIS REST point query, serialize requests | every 15 min | Keep perimeters + NWS + DNR context | ready_now | Medium | Live test hit ArcGIS Online `429`; must serialize, not burst, parallel queries |
| 04_WILDFIRE | `NIFC-02` WFIGS Current Interagency Fire Perimeters | DIRECT_API | None | ArcGIS REST polygon-buffer intersection | every 15 min | Keep locations + InciWeb + DNR | ready_now | Medium | Same WFIGS rate-limit caution as NIFC-01; join to NIFC-01 by `UniqueFireIdentifier` |
| 04_WILDFIRE | `NWS-01` NOAA/NWS active alerts API | DIRECT_API | None (User-Agent required) | Zone/point query for Red Flag/Fire Weather Watch | every 15 min | Keep WFIGS + burn-ban + smoke layers | ready_now | Low | None |
| 04_WILDFIRE | `NOAA-01` NOAA HMS smoke polygons | OPEN_DATA_DOWNLOAD | None | Dated KML/ZIP file discovery, polygon-buffer intersection | every 60 min | Remove smoke-extent confidence, keep warning/incident layers | ready_now | Medium | No stable "current" alias — guessed `current.kml` returned 404; must build/discover date-specific URL |
| 04_WILDFIRE | `KC-01` King County Fire Safety Burn Bans | STRUCTURED_WEBPAGE | None | HTML scrape/diff | every 6 hrs | Preserve last-known-good county restriction | ready_with_scraper | Medium | Unincorporated-King-County legal scope only, not full route |
| 05_FLOOD_CONDITIONS | `USGS-01` Issaquah Creek near mouth (12121600) | DIRECT_API | None | USGS IV JSON, 173m from route end | every 15 min | Preserve last-known-good | ready_now | Low | None |
| 05_FLOOD_CONDITIONS | `USGS-02` Issaquah Creek near Hobart (12120600) | DIRECT_API | None | USGS IV JSON, upstream lead-time signal | every 15 min | Preserve last-known-good | ready_now | Low | None |
| 05_FLOOD_CONDITIONS | `NWPS-01` NOAA Water Prediction Service (ISSW1) | DIRECT_API | None | Forecast/category API, action/minor/moderate/major thresholds | status every 15 min, stageflow/ratings every 60 min | `NWPS-02`/`USGS-02` corroboration | ready_now | Low | None |
| 05_FLOOD_CONDITIONS | `NWS-01` NWS flood/flash-flood alerts | DIRECT_API | None | CAP alert query, route zone/geometry match | every 10-15 min | Preserve last-known-good alert set | ready_now | Low | None |
| 05_FLOOD_CONDITIONS | `ISS-01` (flood) City of Issaquah Flooding page | STRUCTURED_WEBPAGE | None | Scrape official local phase semantics (I-IV) | daily / on-change | Treat as policy source, not sole live feed | ready_now | Medium | None |
| 06_TRAIL_INFRASTRUCTURE_STATUS | `KC-01` (trail) King County Parks Burke-Gilman Trail page | STRUCTURED_WEBPAGE | None | HTML body diff + keyword/facility filter | every 6 hrs | Preserve last-known-good parsed events | ready_with_scraper | Medium | No stable per-alert ID; requires whole-page/block diffing |
| 06_TRAIL_INFRASTRUCTURE_STATUS | `KC-02` (trail) King County Parks Sammamish River Trail page | STRUCTURED_WEBPAGE | None | HTML body diff + keyword/facility filter | every 6 hrs | Same as KC-01 (trail) | ready_with_scraper | Medium | Same as KC-01 (trail) |
| 06_TRAIL_INFRASTRUCTURE_STATUS | `KC-03` (trail) King County Parks East Lake Sammamish Trail page | STRUCTURED_WEBPAGE | None | HTML body diff + keyword/facility filter | every 6 hrs | Same as KC-01 (trail) | ready_with_scraper | Medium | Live culvert-closure event confirmed this cycle — good template example |
| 06_TRAIL_INFRASTRUCTURE_STATUS | `SAM-02` City of Sammamish George Davis Creek project-start update | STRUCTURED_WEBPAGE | None | HTML article parse, low-frequency poll | every 12 hrs | `SAM-01` project context page | ready_with_scraper | Medium | News/article page, not a structured feed |
| 06_TRAIL_INFRASTRUCTURE_STATUS | `ISS-01` (trail) City of Issaquah Public Works Current-Year Construction | DIRECT_API | None | ArcGIS REST query, route-corridor + keyword filter | every 6 hrs | Preserve last-known-good | ready_now | Low | None |
| 07_GOVERNMENT_SAFETY_ALERTS | `NWS-01` NWS modern alerts API and CAP products | DIRECT_API | None (User-Agent required) | CAP query by route point + King County zone + statewide backstop | every 5-15 min | Surface degraded-state language, preserve last-known-good | ready_now | Medium | Must filter out Air Quality Alerts (belong to 03) at implementation time — a real overlap this cycle's own live test surfaced |
| 07_GOVERNMENT_SAFETY_ALERTS | `SEA-01` AlertSeattle public feed + WordPress API | DOCUMENTED_FEED | None | WordPress API poll | every 15 min | `UW-01` + Seattle fire/police feeds | ready_now | Low | None |
| 07_GOVERNMENT_SAFETY_ALERTS | `UW-01` UW Alert blog feed + WordPress API | DOCUMENTED_FEED | None | WordPress API poll | every 15 min | `SEA-01` + Seattle public-safety feeds | ready_now | Low | None |

## Notable secondary sources worth tracking toward production

| Workstream | Source | Why secondary, not MVP | Path to promotion |
|---|---|---|---|
| 03_AIR_QUALITY | `AIRNOW-02` public fallback | Too coarse (whole route collapsed to one metro reporting area) for primary segmentation | Ship as national fallback / public cross-check now; no promotion path needed |
| 03_AIR_QUALITY | `WASMOKE-01`, `NWS-AQ-01` | Narrative/alert-only, not primary observation | Add once MVP prototype is stable |
| 03_AIR_QUALITY | `AIRNOW-01`, `PSCAA-01` | Credential-gated (`AIRNOW_API_KEY`) or session-state-bound | Obtain API key / reverse-engineer session bootstrap |
| 04_WILDFIRE | `DNR-01`, `DNR-02`, `EFR-01`, `INCIWEB-01`, `KC-TRAIL-01`, `SEA-TRAIL-01` | Context/corroboration or fragile HTML extraction | Add after MVP prototype proven |
| 04_WILDFIRE | `NASA-01` FIRMS | Credential-blocked (`NASA_FIRMS_MAP_KEY`), `400 Invalid MAP_KEY` on live test | Obtain free MAP_KEY, re-test route-buffer query |
| 05_FLOOD_CONDITIONS | `USGS-03`, `NWPS-02`, `REDM-01`, `KC-ROAD-01`, `WSDOT-01` | Context/corroboration, or credential-gated | `WSDOT-01` needs `WSDOT_TRAVELER_API_ACCESS_CODE` (name already present in environment, not yet tested live) |
| 06_TRAIL_INFRASTRUCTURE_STATUS | `SAM-01`, `REDM-01`, `KC-04` | Descriptive/inventory, not live status | Promote `REDM-01` only if future alerts explicitly touch drainage/shoreline/culverts/crossings near the route |
| 07_GOVERNMENT_SAFETY_ALERTS | `SEAFD-01`, `SEAPD-01`, `DOH-02`, `ST-01`, `KCMETRO-01` | Editorial/noisy, or alternate-transport context, not core alert backbone | Add after MVP prototype proven; `ST-01`/`KCMETRO-01` display in a separate alternate-transport block, never merged into the main hazard card |

## Explicitly unresolved / blocked (do not treat as production-ready)

| Workstream | Source | Status | Blocking dependency |
|---|---|---|---|
| 03_AIR_QUALITY | `PSCAA-03` (official corrected low-cost sensor) | UNRESOLVED | No proven unattended export/feed path |
| 04_WILDFIRE | `NASA-01` FIRMS | BLOCKED | `NASA_FIRMS_MAP_KEY` (400 Invalid MAP_KEY without it) |
| 05_FLOOD_CONDITIONS | `KC-ROAD-02` (Sammamish road alerts) | UNRESOLVED | Only 2014 test records observed; needs live-content re-check |
| 06_TRAIL_INFRASTRUCTURE_STATUS | `USACE-01` (Chittenden Locks / Ship Canal) | BLOCKED | `403 Access Denied` from Akamai in this environment |
| 07_GOVERNMENT_SAFETY_ALERTS | `WSDOT-01` | UNRESOLVED / BLOCKED | `WSDOT_TRAVELER_API_ACCESS_CODE` needed; clean 401 without it |
| 07_GOVERNMENT_SAFETY_ALERTS | `FEMA-01` (IPAWS live feed) | UNRESOLVED / BLOCKED | Requires FEMA IPAWS onboarding/MOA — `FEMA_IPAWS_USERNAME`/`PASSWORD`/`PIN` |
| 07_GOVERNMENT_SAFETY_ALERTS | `WSP-01` (Washington State Patrol) | BLOCKED | Sucuri JavaScript challenge blocks non-browser fetch |
| 07_GOVERNMENT_SAFETY_ALERTS | `BOTH-01`, `WOOD-01`, `ISS-01` (gov't safety, distinct from the flood/trail `ISS-01`s above) | UNRESOLVED | Public mechanism confirmed real, but only zero-alert states observed — needs one captured live item |

## Recommended build order (all 5 workstreams)

1. **05_FLOOD_CONDITIONS** and **07_GOVERNMENT_SAFETY_ALERTS** first — both have the
   cleanest, fully-credential-free MVP sets (all DIRECT_API/DOCUMENTED_FEED, no scraping)
   and the highest average readiness scores.
2. **04_WILDFIRE** next — mostly DIRECT_API, but requires the WFIGS rate-limit
   serialization caution and the NOAA HMS dated-file discovery logic before it's genuinely
   production-safe.
3. **03_AIR_QUALITY** next — clean MVP, but `PSCAA-02` is webpage-backed and needs the
   production TLS re-test called out above.
4. **06_TRAIL_INFRASTRUCTURE_STATUS** last among the five — every one of its MVP sources
   except `ISS-01` (trail) is HTML-scrape-backed with no stable per-alert ID, so it needs
   the most extraction-maintenance investment before it's low-risk to operate unattended.

This order is about which workstream can reach a safe production state with the least
additional work, not about hazard severity — a wildfire or flood event still deserves the
same urgency in the dashboard regardless of build sequencing.
