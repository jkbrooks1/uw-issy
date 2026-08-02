# SOURCE_REGISTRY.md — 03_AIR_QUALITY

Route: University of Washington -> Burke-Gilman Trail -> Sammamish River Trail
-> Marymoor Park -> East Lake Sammamish Trail -> Issaquah

This markdown file and `SOURCE_REGISTRY.json` describe the same 11 evaluated
sources. The JSON is the canonical machine-readable registry; this file is the
human-readable companion.

## Summary Table

| Source ID | Source | Agency | Classification | Recommendation | Verification | Role on this route |
|---|---|---|---|---|---|---|
| `ECO-01` | WA Ecology hourly air-monitor results ArcGIS REST | WA Dept. of Ecology | `DIRECT_API` | `MVP` | `VERIFIED` | Primary current station observations and pollutant/AQI fields |
| `ECO-02` | WA Ecology smoke forecast ArcGIS REST | WA Dept. of Ecology | `DIRECT_API` | `MVP` | `VERIFIED` | Primary official outlook/smoke forecast polygons |
| `AIRNOW-01` | AirNow web services API | EPA AirNow | `DIRECT_API` | `SECONDARY` | `PARTIALLY_VERIFIED` | Optional auth-gated national cross-check |
| `AIRNOW-02` | AirNow file products (`reportingarea.dat`, `cityzipcodes.csv`) | EPA AirNow | `DOCUMENTED_FEED` | `SECONDARY` | `VERIFIED` | Useful national fallback, but too coarse for sole route segmentation |
| `PSCAA-01` | PSCAA network-map backend JSON | Puget Sound Clean Air Agency | `DIRECT_API` | `SECONDARY` | `VERIFIED` | Useful secondary station detail if session bootstrap is acceptable |
| `PSCAA-02` | PSCAA burn-ban status page | Puget Sound Clean Air Agency | `STRUCTURED_WEBPAGE` | `SECONDARY` | `VERIFIED` | Best official burn-ban status source for this corridor |
| `PSCAA-03` | PSCAA air-sensor map / dashboard | Puget Sound Clean Air Agency | `STRUCTURED_WEBPAGE` | `UNRESOLVED` | `PARTIALLY_VERIFIED` | Official corrected low-cost-sensor layer, but unattended feed not confirmed |
| `WASMOKE-01` | Washington Smoke Blog RSS | WA Ecology + partner agencies | `DOCUMENTED_FEED` | `SECONDARY` | `VERIFIED` | Best official prose smoke outlook feed |
| `NWS-AQ-01` | NWS Air Quality Alert CAP/GeoJSON API | National Weather Service | `DIRECT_API` | `SECONDARY` | `VERIFIED` | Official event/advisory alert feed |
| `KC-PH-01` | King County wildfire smoke guidance page | Public Health - Seattle & King County | `UNSTRUCTURED_WEBPAGE` | `REJECT` | `VERIFIED` | Guidance reference only, not a monitoring connector |
| `SEA-PH-01` | Seattle wildfire smoke safety page | City of Seattle | `UNSTRUCTURED_WEBPAGE` | `REJECT` | `VERIFIED` | Guidance reference only, not a monitoring connector |

## Per-Source Detail

### `ECO-01` — WA Ecology hourly air-monitor results ArcGIS REST

| Field | Value |
|---|---|
| `source_id` | `ECO-01` |
| `source_name` | Washington State Department of Ecology Air Quality Monitoring Hourly Results |
| `owning_agency` | Washington State Department of Ecology Air Quality Program |
| `official_source_url` | `https://gis.ecology.wa.gov/serverext/rest/services/AQ/AirQualityMonitoringHourlyResults/MapServer/0/query` |
| `documentation_url` | `https://ecology.wa.gov/regulations-permits/guidance-technical-assistance/air-monitoring-network` |
| `access_method` | HTTPS GET to ArcGIS REST metadata and query endpoints |
| `acquisition_classification` | `DIRECT_API` |
| `machine_readable_availability` | Yes — JSON / GeoJSON / PBF query support |
| `authentication_requirements` | None |
| `terms_usage_constraints` | Public agency map service; Ecology describes data as near real-time air-monitoring information |
| `geographic_coverage` | Washington statewide; route bbox query returned 4 route-near official monitor sites on 2026-07-29 |
| `route_points_sections_covered` | Seattle / Burke-Gilman west; Lake Forest Park / Kenmore north shore; Eastside mid-corridor; Issaquah terminus |
| `available_fields` | `SiteId`, `SiteName`, `SiteLocation`, `DateTime_PST`, overall AQI/category, pollutant-specific AQI and values for PM2.5 / PM10 / ozone / NO2 / SO2 / CO when present |
| `geometry_availability` | Point geometry per monitor |
| `update_frequency` | Hourly; service description says updated hourly |
| `typical_publication_delay` | AirNow guidance suggests prior hour generally available 10-30 minutes past the hour; this ArcGIS service behaved as a current-hour snapshot plus 24-hour rollup |
| `historical_availability` | Rolling last 24 hours in this service |
| `pagination_behavior` | ArcGIS transfer limits apply on broad queries; corridor-latest query (`HourPriorToLatest=0` + route bbox) returned 4 records without pagination |
| `documented_rate_limits` | None published in service metadata |
| `recommended_freshness_threshold` | 90 minutes |
| `failure_detection_method` | Non-200; JSON parse failure; missing `features`; stale `DateTime_PST`; zero route-near features |
| `last_known_good_suitability` | Yes |
| `fallback_method` | `AIRNOW-02` coarse reporting area + `PSCAA-01` session-backed station detail + stale last-known-good |
| `manual_review_requirement` | Low |
| `recommendation_class` | `MVP` |
| `verification_status` | `VERIFIED` |
| `evidence_urls` | `https://gis.ecology.wa.gov/serverext/rest/services/AQ/AirQualityMonitoringHourlyResults/MapServer?f=pjson`; `https://gis.ecology.wa.gov/serverext/rest/services/AQ/AirQualityMonitoringHourlyResults/MapServer/0?f=pjson` |
| `research_notes` | Best machine-readable current source found. Latest-hour route query returned 4 official corridor monitors at Seattle-NE 127th, Lake Forest Park-Town Center, Bellevue-SE 12th, and Issaquah-Lake Sammamish. PM10 fields exist but were null on all 4 route-near monitors during the 2026-07-29 test. |

### `ECO-02` — WA Ecology smoke forecast ArcGIS REST

| Field | Value |
|---|---|
| `source_id` | `ECO-02` |
| `source_name` | Washington State Department of Ecology Smoke Forecast |
| `owning_agency` | Washington State Department of Ecology Air Quality Program |
| `official_source_url` | `https://gis.ecology.wa.gov/serverext/rest/services/AQ/SmokeForecast/MapServer/0/query` |
| `documentation_url` | `https://www.ecology.wa.gov/air-climate/air-quality/smoke-fire/wildfire-smoke` |
| `access_method` | HTTPS GET to ArcGIS REST metadata and query endpoints |
| `acquisition_classification` | `DIRECT_API` |
| `machine_readable_availability` | Yes — JSON queryable polygon service |
| `authentication_requirements` | None |
| `terms_usage_constraints` | Public state smoke-forecast service; use as outlook, not current observation |
| `geographic_coverage` | Washington statewide forecast polygons |
| `route_points_sections_covered` | Whole route via polygon intersection; 2026-07-29 route bbox intersected `Seattle-Bellevue-Kent Valley` summer polygon |
| `available_fields` | `SmokeForecastId`, `Site`, `SiteName`, `Season`, `DisplayFlag`, `Date`, `Day1`-`Day5`, `ModifiedDate` |
| `geometry_availability` | Polygon geometry |
| `update_frequency` | Service description: updated hourly in the mornings; wildfire page says 5-day forecast in summer, 2-day otherwise |
| `typical_publication_delay` | Same-day morning issuance with updates as forecasters adjust |
| `historical_availability` | Current forecast run only; no tested archive endpoint in this cycle |
| `pagination_behavior` | No pagination issue observed on route query |
| `documented_rate_limits` | None published |
| `recommended_freshness_threshold` | 12 hours in smoke season; 24 hours off-season |
| `failure_detection_method` | Non-200; parse failure; route polygon missing; blank `Day1`-`Day5` on `DisplayFlag=1` feature during summer |
| `last_known_good_suitability` | Yes |
| `fallback_method` | `WASMOKE-01` RSS outlook text |
| `manual_review_requirement` | Low |
| `recommendation_class` | `MVP` |
| `verification_status` | `VERIFIED` |
| `evidence_urls` | `https://gis.ecology.wa.gov/serverext/rest/services/AQ/SmokeForecast/MapServer?f=pjson`; `https://gis.ecology.wa.gov/serverext/rest/services/AQ/SmokeForecast/MapServer/0?f=pjson` |
| `research_notes` | Strongest official outlook source. Route bbox intersected two polygons with the same place name, but only the summer `DisplayFlag=1` polygon carried live forecast values (`Good` for Days 1-5 on 2026-07-29). |

### `AIRNOW-01` — AirNow web services API

| Field | Value |
|---|---|
| `source_id` | `AIRNOW-01` |
| `source_name` | EPA AirNow web services API |
| `owning_agency` | U.S. EPA AirNow |
| `official_source_url` | `https://www.airnowapi.org/aq/observation/latLong/current/` |
| `documentation_url` | `https://docs.airnowapi.org/webservices`; `https://docs.airnowapi.org/faq` |
| `access_method` | HTTPS GET with API key |
| `acquisition_classification` | `DIRECT_API` |
| `machine_readable_availability` | Yes — JSON/XML web services |
| `authentication_requirements` | API key required |
| `terms_usage_constraints` | AirNow data use guidelines apply; data are preliminary and intended for AQI reporting/forecasting, not regulatory use |
| `geographic_coverage` | U.S./Canada/Mexico reporting areas and monitor-site services |
| `route_points_sections_covered` | Potentially whole route, but at reporting-area granularity unless site-level endpoints are used |
| `available_fields` | Current observations, forecasts, monitoring-site hourly/daily data depending on endpoint |
| `geometry_availability` | Lat/long query inputs; reporting-area and monitor-site outputs vary by endpoint |
| `update_frequency` | FAQ says observations generally update hourly and forecasts daily |
| `typical_publication_delay` | FAQ says previous-hour observations generally available 10-30 minutes past the hour |
| `historical_availability` | Yes by separate historical endpoints, not live-tested with valid credentials this cycle |
| `pagination_behavior` | Not tested with valid key |
| `documented_rate_limits` | Per-key hourly rate limits exist; docs do not expose one universal limit in the FAQ |
| `recommended_freshness_threshold` | 90 minutes for current observation endpoints |
| `failure_detection_method` | Non-200; AirNow error body; empty payload; stale timestamps |
| `last_known_good_suitability` | Yes |
| `fallback_method` | `AIRNOW-02` public file products |
| `manual_review_requirement` | Medium |
| `recommendation_class` | `SECONDARY` |
| `verification_status` | `PARTIALLY_VERIFIED` |
| `evidence_urls` | `https://docs.airnowapi.org/webservices`; `https://docs.airnowapi.org/faq` |
| `research_notes` | Live test with an invalid key returned clean HTTP 401 JSON (`Invalid API key`), proving the endpoint is live and auth-gated. Useful if a key is obtained, but not required for an MVP because Ecology already provides better official corridor segmentation without credentials. |

### `AIRNOW-02` — AirNow file products

| Field | Value |
|---|---|
| `source_id` | `AIRNOW-02` |
| `source_name` | AirNow file products: `reportingarea.dat` and `cityzipcodes.csv` |
| `owning_agency` | U.S. EPA AirNow |
| `official_source_url` | `https://files.airnowtech.org/airnow/today/reportingarea.dat` |
| `documentation_url` | `https://docs.airnowapi.org/faq` |
| `access_method` | Public HTTPS file download |
| `acquisition_classification` | `DOCUMENTED_FEED` |
| `machine_readable_availability` | Yes — pipe-delimited and CSV file outputs |
| `authentication_requirements` | None |
| `terms_usage_constraints` | AirNow data use guidelines apply; preliminary AQI/reporting data |
| `geographic_coverage` | National reporting areas and reporting-area-to-ZIP mappings |
| `route_points_sections_covered` | Most route ZIPs mapped to `Seattle-Bellevue-Kent Valley`; Issaquah/Sammamish foothill ZIPs also map to `Cascade foothills of King County` in `cityzipcodes.csv`, but that reporting area had no live rows in `reportingarea.dat` during this test |
| `available_fields` | Observation/forecast rows with date, time, type flag, reporting area, state, lat/lon, pollutant, AQI, category, action-day flag, forecast discussion; ZIP-to-reporting-area lookup table |
| `geometry_availability` | Reporting-area centroid only; ZIP centroid lookup table |
| `update_frequency` | FAQ says `reportingarea.dat` updates at `:25` and `:55`; `cityzipcodes.csv` once per day |
| `typical_publication_delay` | Current obs rows showed a 12:00 PDT snapshot during the 2026-07-29 test |
| `historical_availability` | Current-day file products only in this tested path |
| `pagination_behavior` | None |
| `documented_rate_limits` | None documented for file products |
| `recommended_freshness_threshold` | 90 minutes for current observation rows; 24 hours for ZIP mapping |
| `failure_detection_method` | Non-200; empty file; missing route reporting-area rows; stale observation time |
| `last_known_good_suitability` | Yes |
| `fallback_method` | `ECO-01` and `ECO-02` |
| `manual_review_requirement` | Low |
| `recommendation_class` | `SECONDARY` |
| `verification_status` | `VERIFIED` |
| `evidence_urls` | `https://files.airnowtech.org/airnow/today/reportingarea.dat`; `https://files.airnowtech.org/airnow/today/cityzipcodes.csv` |
| `research_notes` | Strong national fallback and the easiest way to use AirNow without credentials. Weakness: route resolution is coarse. On 2026-07-29 the route only had live rows for one metro reporting area, `Seattle-Bellevue-Kent Valley`, so AirNow alone would understate within-corridor variation. |

### `PSCAA-01` — PSCAA network-map backend JSON

| Field | Value |
|---|---|
| `source_id` | `PSCAA-01` |
| `source_name` | Puget Sound Clean Air Agency network map backend (`GetStations`, `Geometries`, `Aqi`) |
| `owning_agency` | Puget Sound Clean Air Agency |
| `official_source_url` | `https://secure.pscleanair.org/AirQuality/NetworkMap` |
| `documentation_url` | `https://pscleanair.gov/692/Technical-Tools` |
| `access_method` | Cookie-backed HTTPS JSON endpoints discovered from the official network-map page |
| `acquisition_classification` | `DIRECT_API` |
| `machine_readable_availability` | Yes, but stateful/session-backed |
| `authentication_requirements` | No login, but an ASP.NET session bootstrap cookie is required before `Aqi?stationId=...` succeeds |
| `terms_usage_constraints` | Official public technical tool; no published API contract or rate-limit doc found |
| `geographic_coverage` | PSCAA four-county region |
| `route_points_sections_covered` | Seattle, Lake Forest Park, Bellevue, Issaquah route-near stations confirmed live; polygon region feed also live |
| `available_fields` | Station list, AQI polygons, station detail including lat/lon, address, county, telemetry status, pollutant/QMU metadata, AQI category |
| `geometry_availability` | Point geometry in station detail; polygon geometry in `Geometries` |
| `update_frequency` | Appears near-real-time for current network map; no formal schedule published |
| `typical_publication_delay` | Not published |
| `historical_availability` | Current-state network map only in tested endpoints |
| `pagination_behavior` | None observed |
| `documented_rate_limits` | None found |
| `recommended_freshness_threshold` | 90 minutes |
| `failure_detection_method` | JSON `success:false`; session-null message; non-200; empty item list |
| `last_known_good_suitability` | Yes |
| `fallback_method` | `ECO-01` for machine-readable current observations |
| `manual_review_requirement` | Medium |
| `recommendation_class` | `SECONDARY` |
| `verification_status` | `VERIFIED` |
| `evidence_urls` | `https://secure.pscleanair.org/AirQuality/NetworkMap/GetStations`; `https://secure.pscleanair.org/AirQuality/NetworkMap/Geometries` |
| `research_notes` | Strong secondary source, but not chosen as MVP because the best detail endpoint (`Aqi`) fails statelessly with `Session was null, refresh the page.` A session bootstrap solved that in live testing, which is workable but more brittle than Ecology’s plain REST service. |

### `PSCAA-02` — PSCAA burn-ban status page

| Field | Value |
|---|---|
| `source_id` | `PSCAA-02` |
| `source_name` | Puget Sound Clean Air Agency Air Quality Burn Ban Status |
| `owning_agency` | Puget Sound Clean Air Agency |
| `official_source_url` | `https://www.pscleanair.gov/168/Air-Quality-Burn-Ban-Status` |
| `documentation_url` | `https://www.pscleanair.gov/168/Air-Quality-Burn-Ban-Status` |
| `access_method` | HTTPS HTML fetch |
| `acquisition_classification` | `STRUCTURED_WEBPAGE` |
| `machine_readable_availability` | Partial — stable repeated status blocks in HTML, but no documented JSON endpoint found |
| `authentication_requirements` | None |
| `terms_usage_constraints` | Public agency status page |
| `geographic_coverage` | PSCAA burn-ban areas in King / Kitsap / Pierce / Snohomish counties |
| `route_points_sections_covered` | Entire route, because the route lies inside PSCAA jurisdiction |
| `available_fields` | Human-readable ban/no-ban status plus explanatory text and links |
| `geometry_availability` | No machine-readable geometry found; separate area map linked |
| `update_frequency` | Change-driven |
| `typical_publication_delay` | Not documented |
| `historical_availability` | Current status page only |
| `pagination_behavior` | None |
| `documented_rate_limits` | None |
| `recommended_freshness_threshold` | 24 hours, or change-driven during burn-ban season |
| `failure_detection_method` | Non-200; missing status blocks; page changed enough that `status-text` classes disappear |
| `last_known_good_suitability` | Yes |
| `fallback_method` | Phone hotline on the same page; manual review |
| `manual_review_requirement` | Medium |
| `recommendation_class` | `SECONDARY` |
| `verification_status` | `VERIFIED` |
| `evidence_urls` | `https://www.pscleanair.gov/168/Air-Quality-Burn-Ban-Status` |
| `research_notes` | Best official burn-ban source found. Live HTML contained repeated `No Ban` status blocks on 2026-07-29. It is suitable for unattended scraping if no better endpoint is discovered, but it is still a webpage, not a documented feed. |

### `PSCAA-03` — PSCAA air-sensor map / dashboard

| Field | Value |
|---|---|
| `source_id` | `PSCAA-03` |
| `source_name` | Puget Sound Clean Air Agency air-sensor map / air-sensor dashboard |
| `owning_agency` | Puget Sound Clean Air Agency |
| `official_source_url` | `https://www.pscleanair.gov/570/Air-Quality-Sensor-Map` |
| `documentation_url` | `https://pscleanair.gov/692/Technical-Tools` |
| `access_method` | Public web pages linking to dashboard tools |
| `acquisition_classification` | `STRUCTURED_WEBPAGE` |
| `machine_readable_availability` | Not confirmed in this cycle |
| `authentication_requirements` | None observed |
| `terms_usage_constraints` | Official corrected/QC’d sensor layer; PSCAA warns raw PurpleAir should not be used uncorrected |
| `geographic_coverage` | PSCAA region |
| `route_points_sections_covered` | Potentially whole route if machine-readable access is confirmed |
| `available_fields` | Official description promises corrected/QC’d low-cost sensor information and confidence values |
| `geometry_availability` | Likely yes in the live map, but unattended export/feed was not verified |
| `update_frequency` | Not verified |
| `typical_publication_delay` | Not verified |
| `historical_availability` | Not verified |
| `pagination_behavior` | Not verified |
| `documented_rate_limits` | Not found |
| `recommended_freshness_threshold` | Not assigned until machine-readable access is proven |
| `failure_detection_method` | Not applicable yet |
| `last_known_good_suitability` | Unknown |
| `fallback_method` | `ECO-01` / `PSCAA-01` / `AIRNOW-03` conceptual equivalents |
| `manual_review_requirement` | High |
| `recommendation_class` | `UNRESOLVED` |
| `verification_status` | `PARTIALLY_VERIFIED` |
| `evidence_urls` | `https://www.pscleanair.gov/570/Air-Quality-Sensor-Map`; `https://pscleanair.gov/692/Technical-Tools` |
| `research_notes` | Keep only as a future enhancement. Officially valuable because PSCAA explicitly documents EPA-calibrated and QC’d sensor use, but this cycle did not prove a stable unattended data export path. |

### `WASMOKE-01` — Washington Smoke Blog RSS

| Field | Value |
|---|---|
| `source_id` | `WASMOKE-01` |
| `source_name` | Washington Smoke Blog RSS |
| `owning_agency` | Washington Smoke Information partnership led by WA Ecology and partner agencies |
| `official_source_url` | `https://wasmoke.blogspot.com/feeds/posts/default?alt=rss` |
| `documentation_url` | `https://www.ecology.wa.gov/air-climate/air-quality/smoke-fire/wildfire-smoke` |
| `access_method` | HTTPS RSS feed |
| `acquisition_classification` | `DOCUMENTED_FEED` |
| `machine_readable_availability` | Yes — RSS XML |
| `authentication_requirements` | None |
| `terms_usage_constraints` | Official partnership blog; use as outlook/context, not as current monitor substitute |
| `geographic_coverage` | Washington statewide |
| `route_points_sections_covered` | Whole route, but at regional prose-outlook level rather than per-station level |
| `available_fields` | RSS item title, publication time, category tags, content/description |
| `geometry_availability` | None |
| `update_frequency` | Event-driven; more active during smoke season |
| `typical_publication_delay` | Not documented |
| `historical_availability` | RSS retains recent posts; full Blogger archive exists |
| `pagination_behavior` | Feed length limit only; no pagination tested |
| `documented_rate_limits` | None |
| `recommended_freshness_threshold` | 12 hours in smoke season; 24 hours off-season |
| `failure_detection_method` | Non-200; empty RSS; stale `lastBuildDate`; malformed XML |
| `last_known_good_suitability` | Yes |
| `fallback_method` | `ECO-02` smoke forecast polygon |
| `manual_review_requirement` | Low |
| `recommendation_class` | `SECONDARY` |
| `verification_status` | `VERIFIED` |
| `evidence_urls` | `https://wasmoke.blogspot.com/feeds/posts/default?alt=rss`; `https://wasmoke.blogspot.com/p/forecasts.html` |
| `research_notes` | Best official prose smoke-outlook feed. Live RSS returned a current `lastBuildDate` on 2026-07-29. Good for forecast commentary and wildfire-smoke attribution. |

### `NWS-AQ-01` — NWS Air Quality Alert API

| Field | Value |
|---|---|
| `source_id` | `NWS-AQ-01` |
| `source_name` | National Weather Service active alerts API filtered to `Air Quality Alert` |
| `owning_agency` | National Weather Service |
| `official_source_url` | `https://api.weather.gov/alerts/active?event=Air%20Quality%20Alert` |
| `documentation_url` | `https://api.weather.gov/` |
| `access_method` | HTTPS GET to GeoJSON/CAP-derived API |
| `acquisition_classification` | `DIRECT_API` |
| `machine_readable_availability` | Yes — GeoJSON |
| `authentication_requirements` | None |
| `terms_usage_constraints` | Public NWS API; current alert feed only |
| `geographic_coverage` | U.S. alert areas |
| `route_points_sections_covered` | Route relevance determined by county/zone/polygon match to King County / route geometry |
| `available_fields` | `event`, `headline`, `severity`, `certainty`, `urgency`, `areaDesc`, `effective`, `expires`, `senderName`, more CAP-derived fields |
| `geometry_availability` | Sometimes; tested WA Air Quality Alert sample had `geometry: null` and relied on area description / geocodes |
| `update_frequency` | Event-driven; API max-age header was 5 seconds during live test |
| `typical_publication_delay` | Immediate event publication |
| `historical_availability` | Not used in this cycle |
| `pagination_behavior` | No pagination needed for tested WA sample |
| `documented_rate_limits` | Standard NWS API guidance; no numeric limit verified in this cycle |
| `recommended_freshness_threshold` | 15 minutes |
| `failure_detection_method` | Non-200; empty feature list when expected; stale `updated`; parse failure |
| `last_known_good_suitability` | Yes, but expired alerts must be dropped promptly |
| `fallback_method` | `WASMOKE-01` + `ECO-02` + `PSCAA-02` depending on use case |
| `manual_review_requirement` | Low |
| `recommendation_class` | `SECONDARY` |
| `verification_status` | `VERIFIED` |
| `evidence_urls` | `https://api.weather.gov/alerts/active?area=WA&event=Air%20Quality%20Alert` |
| `research_notes` | Good official alert channel for formal advisory states. On 2026-07-29 the route had no King County AQ alerts, but live WA sample data existed for eastern Washington and proved the schema. |

### `KC-PH-01` — King County wildfire smoke guidance page

| Field | Value |
|---|---|
| `source_id` | `KC-PH-01` |
| `source_name` | Public Health - Seattle & King County wildfire smoke guidance |
| `owning_agency` | Public Health - Seattle & King County |
| `official_source_url` | `https://kingcounty.gov/en/dept/dph/health-safety/safety-injury-prevention/emergency-preparedness/personal-preparedness/wildfire-smoke` |
| `documentation_url` | Same page |
| `access_method` | HTTPS HTML fetch |
| `acquisition_classification` | `UNSTRUCTURED_WEBPAGE` |
| `machine_readable_availability` | No |
| `authentication_requirements` | None |
| `terms_usage_constraints` | Public guidance page |
| `geographic_coverage` | King County |
| `route_points_sections_covered` | Entire route in a generic public-health sense |
| `available_fields` | Guidance text, threshold examples, reference links |
| `geometry_availability` | None |
| `update_frequency` | Change-driven |
| `typical_publication_delay` | Not documented |
| `historical_availability` | Current page only |
| `pagination_behavior` | None |
| `documented_rate_limits` | None |
| `recommended_freshness_threshold` | 30 days for guidance copy only |
| `failure_detection_method` | Non-200 or content removed |
| `last_known_good_suitability` | Yes, for reference copy only |
| `fallback_method` | Seattle page / EPA AQI basics |
| `manual_review_requirement` | High |
| `recommendation_class` | `REJECT` |
| `verification_status` | `VERIFIED` |
| `evidence_urls` | `https://kingcounty.gov/en/dept/dph/health-safety/safety-injury-prevention/emergency-preparedness/personal-preparedness/wildfire-smoke` |
| `research_notes` | Useful for static health guidance and copy references. Not a connector because it does not provide machine-readable current route conditions. |

### `SEA-PH-01` — Seattle wildfire smoke safety page

| Field | Value |
|---|---|
| `source_id` | `SEA-PH-01` |
| `source_name` | City of Seattle wildfire smoke safety page |
| `owning_agency` | City of Seattle |
| `official_source_url` | `https://www.seattle.gov/wildfire-smoke-safety` |
| `documentation_url` | Same page |
| `access_method` | HTTPS HTML fetch |
| `acquisition_classification` | `UNSTRUCTURED_WEBPAGE` |
| `machine_readable_availability` | No |
| `authentication_requirements` | None |
| `terms_usage_constraints` | Public guidance page |
| `geographic_coverage` | Seattle |
| `route_points_sections_covered` | UW / Burke-Gilman start segment only in a generic health-guidance sense |
| `available_fields` | Guidance text only |
| `geometry_availability` | None |
| `update_frequency` | Change-driven |
| `typical_publication_delay` | Not documented |
| `historical_availability` | Current page only |
| `pagination_behavior` | None |
| `documented_rate_limits` | None |
| `recommended_freshness_threshold` | 30 days for guidance copy only |
| `failure_detection_method` | Non-200 or content removed |
| `last_known_good_suitability` | Yes, for reference copy only |
| `fallback_method` | King County page / EPA AQI basics |
| `manual_review_requirement` | High |
| `recommendation_class` | `REJECT` |
| `verification_status` | `VERIFIED` |
| `evidence_urls` | `https://www.seattle.gov/wildfire-smoke-safety` |
| `research_notes` | Same conclusion as `KC-PH-01`: useful guidance reference, not a route-monitoring connector. |
