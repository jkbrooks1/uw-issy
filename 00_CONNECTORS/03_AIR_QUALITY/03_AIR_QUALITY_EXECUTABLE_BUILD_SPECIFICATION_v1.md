# 03_AIR_QUALITY_EXECUTABLE_BUILD_SPECIFICATION_v1

Prepared: 2026-07-31

This document is the executable build specification for connector lane `03_AIR_QUALITY`. It translates the verified research deliverables in `00_CONNECTORS/03_AIR_QUALITY/` into implementation-ready guidance for the first n8n workflow build. It does not build the workflow itself.

## 1. Overview

- Lane ID: `03_AIR_QUALITY`
- Lane name: `UW-Issaquah Air Quality Connector`
- Purpose: support rider decisions about whether the route is presently acceptable for normal riding, whether sensitive riders should reduce effort or avoid the route, whether forecast smoke changes the decision later in the day, and whether a formal air-quality alert or air-quality burn ban materially changes the recommendation.
- Approved MVP source set, per `IMPLEMENTATION_RECOMMENDATION.md` and `UW_ISSY_03_AIR_QUALITY_IMPLEMENTATION_RECOMMENDATION_v1.md`:
  - `ECO-01` Washington State Department of Ecology Air Quality Monitoring Hourly Results
  - `ECO-02` Washington State Department of Ecology Smoke Forecast
  - `PSCAA-02` Puget Sound Clean Air Agency Air Quality Burn Ban Status page
- Approved secondary source set:
  - `AIRNOW-02` AirNow public file products
  - `WASMOKE-01` Washington Smoke Blog RSS
  - `NWS-AQ-01` NWS Air Quality Alert feed
  - `PSCAA-01` optional only after session-bootstrap handling is proven stable
  - `AIRNOW-01` optional only after `AIRNOW_API_KEY` exists
- High-level data flow: fetch source payloads -> land raw payloads -> normalize into the shared connector envelope plus lane-specific events/observations/route sections -> validate schema, route relevance, freshness, and deduplication -> write lane evidence, output, status, and last-known-good artifacts for workflow-08 consumption.
- Integration boundary:
  - This workflow publishes only lane artifacts.
  - Workflow `08_ASSEMBLE_VALIDATE_BUILD_DEPLOY` consumes this lane's normalized output, performs cross-lane deduplication and deployment gating, and alone writes rider-facing publication artifacts.
- Governing documents:
  - `00_SHARED_AUTONOMOUS_CONNECTOR_BUILD_STANDARD.md`
  - `00_OPEN_CONNECTOR_ARCHITECTURE_DECISIONS.md`
  - `00_CDM_CONNECTOR_LESSONS_APPLIED.md`
- Shared architecture decisions applied here:
  - connector independence is mandatory
  - `data/connectors/` is the lane-internal publication family
  - workflow 08 is the only component allowed to materialize public site data
  - last-known-good preservation is required on failure
  - invalid outputs quarantine instead of overwriting good outputs
- Honest readiness assessment: ready to build the first executable connector now with the MVP source set. Remaining unresolved items do not block this lane build specification, but still matter later:
  - `DEC-003` final owner-approved global freshness/deploy gate defaults
  - `DEC-006` workflow-08 mandatory-vs-optional lane matrix
  - `DEC-011` through `DEC-013` deployment target and unattended notification choices
  - production-host retest of Ecology TLS behavior, noted in `ENV_AND_READINESS.md` and `UW_ISSY_03_AIR_QUALITY_AUDIT_REPORT_v1.md`

## 2. SOURCE ACQUISITION Strategy

### `ECO-01`

- Source ID: `ECO-01`
- Owning agency: Washington State Department of Ecology Air Quality Program
- Acquisition method: unauthenticated ArcGIS REST query over HTTPS GET
- Verified endpoint family:
  - metadata: `.../AirQualityMonitoringHourlyResults/MapServer?f=pjson`
  - query: `.../AirQualityMonitoringHourlyResults/MapServer/0/query`
- Fetch cadence: every `60 minutes`
- Freshness threshold: stale after `90 minutes`
- Environment variables: none
- Authentication flow: none
- n8n acquisition sketch:
  - HTTP Request node
  - query `where=HourPriorToLatest=0`
  - supply route bbox from canonical GPX envelope
  - request point geometry and fields `SiteId`, `SiteName`, `SiteLocation`, `DateTime_PST`, `AQIValue`, `AQICategory`, `AQI_PM25`, `AQI_PM25_Cat`, `PM25_Value`, `AQI_O3`, `AQI_O3_Cat`, `O3_Value`, `AQI_PM10`, `AQI_PM10_Cat`, `PM10_Value`, `AQI_NO2`, `AQI_NO2_Cat`, `NO2_Value`
- Documented failure modes from `API_AND_FEED_TEST_RESULTS.md` and `SOURCE_REGISTRY.json`:
  - non-`200`
  - JSON parse failure
  - zero route-near `features[]`
  - stale `DateTime_PST`
  - local `curl` TLS CA failure observed on 2026-07-29 while Python `requests` succeeded
- Error handling:
  - retry once after `60` seconds on network errors and `5xx`
  - do not retry deterministic schema/parse failures
  - preserve branch last-known-good if fresh fetch is unavailable
  - mark source `degraded` or `stale` in `source_health`
- Rate limiting: none published in service metadata; keep retries bounded and avoid duplicate parallel calls to the same endpoint in one run
- Network requirements: reachable from the tested environment; no geo, JS, or bot restrictions were observed
- Fallback source: `AIRNOW-02` for coarse route-area cross-check; `PSCAA-01` only if the optional stateful branch is enabled later
- Last-known-good strategy: retain the latest valid current-observations branch snapshot until superseded; if the branch is stale or failed, publish a degraded connector output rather than blanking current observations

### `ECO-02`

- Source ID: `ECO-02`
- Owning agency: Washington State Department of Ecology Air Quality Program
- Acquisition method: unauthenticated ArcGIS REST polygon query over HTTPS GET
- Verified endpoint family:
  - metadata: `.../SmokeForecast/MapServer/0?f=pjson`
  - query: `.../SmokeForecast/MapServer/0/query`
- Fetch cadence: every `6 hours` in the shared 15-minute workflow, using a due-check gate so the branch only fetches when due
- Freshness threshold: `12 hours` in smoke season, `24 hours` off-season
- Environment variables: none
- Authentication flow: none
- n8n acquisition sketch:
  - HTTP Request node
  - query for polygon geometry and fields `SmokeForecastId`, `Site`, `SiteName`, `Season`, `DisplayFlag`, `Date`, `Day1`, `Day2`, `Day3`, `Day4`, `Day5`, `ModifiedDate`
  - prefilter by route bbox
  - perform polygon-route intersection in a Code node using the route GPX geometry loaded locally
- Documented failure modes:
  - non-`200`
  - parse failure
  - no route-intersecting polygon suitable for publication
  - blank day fields on the returned feature
- Error handling:
  - retry once after `60` seconds on network errors and `5xx`
  - preserve forecast last-known-good if it remains within the allowed stale window
  - never substitute forecast data into current-observation fields
- Rate limiting: none published
- Network requirements: reachable from the tested environment; no restrictions observed
- Fallback source: `WASMOKE-01`
- Last-known-good strategy: retain the most recent valid forecast branch artifact and mark it stale if the next due fetch fails

### `PSCAA-02`

- Source ID: `PSCAA-02`
- Owning agency: Puget Sound Clean Air Agency
- Acquisition method: HTML page fetch with deterministic status extraction
- Verified endpoint: `https://www.pscleanair.gov/168/Air-Quality-Burn-Ban-Status`
- Fetch cadence: every `12 hours`
- Freshness threshold: `24 hours`
- Environment variables: none
- Authentication flow: none
- n8n acquisition sketch:
  - HTTP Request node
  - HTML Extract or Code node to capture burn-ban status blocks and normalized status text
  - produce one burn-ban advisory record for the corridor
- Documented failure modes:
  - non-`200`
  - missing expected status blocks
  - page structure drift
- Error handling:
  - retry once after `60` seconds on network errors and `5xx`
  - if parsing fails, preserve last-known-good if one exists
  - if parsing fails and no valid LKG exists, publish `burn_ban_status: "unknown"` and add a validation warning plus `manual_review_required`
- Rate limiting: none documented
- Network requirements: reachable from the tested environment; no restrictions observed
- Fallback source: no equivalent machine-readable feed was verified; fallback is last-known-good only
- Last-known-good strategy: retain the last verified burn-ban state until superseded; mark stale after `24 hours`

### `AIRNOW-02`

- Source ID: `AIRNOW-02`
- Owning agency: U.S. EPA AirNow
- Acquisition method: public file download
- Verified endpoints:
  - `https://files.airnowtech.org/airnow/today/reportingarea.dat`
  - `https://files.airnowtech.org/airnow/today/cityzipcodes.csv`
- Fetch cadence:
  - observations cross-check every `60 minutes`
  - ZIP mapping refresh every `24 hours`
- Freshness threshold:
  - observation rows `90 minutes`
  - ZIP mapping `24 hours`
- Environment variables: none
- Authentication flow: none
- n8n acquisition sketch:
  - HTTP Request node for each file
  - split text rows
  - filter for route reporting areas and ZIP mappings
  - normalize only as supporting provenance and fallback context
- Documented failure modes: no source-specific failure beyond ordinary network or empty-file failure was observed in live testing
- Error handling: always non-blocking; failure cannot prevent valid MVP publication
- Rate limiting: none documented for file products
- Network requirements: reachable from the tested environment; no bot or geo restrictions observed
- Fallback source: not required; this source is itself a fallback layer
- Last-known-good strategy: retain the most recent valid parsed file data, but never let it override fresher `ECO-01` route-point observations

### `WASMOKE-01`

- Source ID: `WASMOKE-01`
- Owning agency: Washington Smoke Information partnership led by Washington Ecology and partner agencies
- Acquisition method: RSS feed fetch
- Verified endpoint: `https://wasmoke.blogspot.com/feeds/posts/default?alt=rss`
- Fetch cadence: every `6 hours`
- Freshness threshold: `12 hours` in smoke season
- Environment variables: none
- Authentication flow: none
- n8n acquisition sketch:
  - HTTP Request node
  - XML parser
  - select latest item
  - free-text location matching against the approved lookup list from `ROUTE_RELEVANCE_AND_THRESHOLDS.md`
- Documented failure modes: none source-specific observed in live testing
- Error handling: non-blocking enrichment only; if the feed fails, `ECO-02` remains the authoritative forecast source
- Rate limiting: none documented
- Network requirements: reachable from the tested environment
- Fallback source: none; this branch is enrichment only
- Last-known-good strategy: retain the most recent successfully parsed contextual smoke text for attribution and rider messaging only

### `NWS-AQ-01`

- Source ID: `NWS-AQ-01`
- Owning agency: National Weather Service / NOAA
- Acquisition method: GeoJSON API
- Verified endpoint: `https://api.weather.gov/alerts/active?area=WA&event=Air%20Quality%20Alert`
- Fetch cadence: every `15 minutes`
- Freshness threshold: `15 minutes`
- Environment variables: none
- Authentication flow: none
- n8n acquisition sketch:
  - HTTP Request node
  - parse `features[]`
  - keep only `properties.event == "Air Quality Alert"`
  - route-relevance by geometry if present, otherwise by county/zone/geocode/text matching
- Documented failure modes:
  - route may have no current alert, which is a valid empty result
  - `geometry` may be `null`, requiring county/text-based route relevance
- Error handling:
  - retry once after `30` seconds on network errors and `5xx`
  - treat no matching alert as `empty_but_valid`
  - treat source failure as non-blocking degradation of the formal-alert layer only
- Rate limiting: no formal limit was documented in this cycle; the live response advertised `cache-control: max-age=5`
- Network requirements: reachable from the tested environment; no restrictions observed
- Fallback source: none verified for a parallel formal alert feed; optional future local-agency alert text can enrich but not replace this source
- Last-known-good strategy: retain a last relevant alert only until its own `expires` timestamp; do not continue publishing expired formal alerts as active

### Optional branches

#### `PSCAA-01`

- Enable only after cookie-bootstrap handling is proven stable in n8n
- Fetch cadence: every `60 minutes`
- Freshness threshold: `90 minutes`
- Environment variables: none
- Authentication flow:
  - request `https://secure.pscleanair.org/AirQuality/NetworkMap`
  - retain ASP.NET session cookie
  - request `GetStations`, `Geometries`, and optional `Aqi?stationId=...`
- Verified failure mode: stateless `Aqi` returned `{"success":false,"message":"Session was null, refresh the page."}` and `ThreeTile` returned `500`
- Connector rule: never mandatory for MVP publication

#### `AIRNOW-01`

- Enable only when `AIRNOW_API_KEY` is present
- Fetch cadence: every `60 minutes`
- Freshness threshold: `90 minutes`
- Environment variables: `AIRNOW_API_KEY`
- Authentication flow: API key query parameter, per the verified invalid-key test path
- Verified failure mode: invalid key returned clean `401` JSON auth error
- Connector rule: never mandatory for MVP publication

## 3. Normalization and Validation

### Normalized output schema

The connector MUST publish the shared outer envelope required by `00_SHARED_AUTONOMOUS_CONNECTOR_BUILD_STANDARD.md`, with lane-specific semantics inside:

- `events[]` for discrete forecast, alert, and burn-ban records
- `observations[]` for current point observations from route-near monitors
- `route_sections[]` for rider-facing four-section summaries
- `metadata.lane_summary` for the compact route-level summary adapted from `NORMALIZED_SCHEMA_PROPOSAL.md`
- `provenance.sources[]` for lane-specific attribution details

### Illustrative normalized JSON example

This example is illustrative and grounded in the live 2026-07-29 sample values from `ecology_hourly_route_latest.json`, `ecology_smokeforecast_route.json`, and the verified `PSCAA-02` "No Ban" observation. It is not a live run artifact.

```json
{
  "schema_version": "1.0.0",
  "connector_id": "03_AIR_QUALITY",
  "connector_name": "UW-Issaquah Air Quality Connector",
  "connector_version": "v0001",
  "lane": "03_AIR_QUALITY",
  "run_id": "03_AIR_QUALITY-20260731T170000Z-001",
  "generated_at": "2026-07-31T17:00:00Z",
  "published_at": null,
  "data_status": "ok",
  "freshness": {
    "overall_state": "fresh",
    "computed_at": "2026-07-31T17:00:20Z",
    "oldest_relevant_source_age_minutes": 30,
    "stale_source_ids": []
  },
  "manifest_ref": {
    "manifest_id": "03_AIR_QUALITY-v0001",
    "schema_version": "1.0.0"
  },
  "source_health": [
    {
      "schema_version": "1.0.0",
      "connector_id": "03_AIR_QUALITY",
      "source_id": "03_AIR_QUALITY:ECO-01",
      "source_name": "Washington State Department of Ecology Air Quality Monitoring Hourly Results",
      "status": "ok",
      "retrieved_at": "2026-07-31T17:00:05Z",
      "stale_after_minutes": 90,
      "record_count": 4,
      "http_status": 200,
      "last_observation_at": "2026-07-29T19:00:00Z",
      "warnings": [],
      "errors": []
    },
    {
      "schema_version": "1.0.0",
      "connector_id": "03_AIR_QUALITY",
      "source_id": "03_AIR_QUALITY:ECO-02",
      "source_name": "Washington State Department of Ecology Smoke Forecast",
      "status": "ok",
      "retrieved_at": "2026-07-31T17:00:07Z",
      "stale_after_minutes": 720,
      "record_count": 1,
      "http_status": 200,
      "last_observation_at": "2026-07-29T14:42:01Z",
      "warnings": [],
      "errors": []
    },
    {
      "schema_version": "1.0.0",
      "connector_id": "03_AIR_QUALITY",
      "source_id": "03_AIR_QUALITY:PSCAA-02",
      "source_name": "Puget Sound Clean Air Agency Air Quality Burn Ban Status",
      "status": "ok",
      "retrieved_at": "2026-07-31T17:00:09Z",
      "stale_after_minutes": 1440,
      "record_count": 1,
      "http_status": 200,
      "last_observation_at": "2026-07-31T17:00:09Z",
      "warnings": [],
      "errors": []
    }
  ],
  "connector_health": {
    "schema_version": "1.0.0",
    "connector_id": "03_AIR_QUALITY",
    "status": "ok",
    "failed_stage": null,
    "warning_count": 0,
    "error_count": 0,
    "used_last_known_good": false,
    "candidate_written": true,
    "published_written": false
  },
  "events": [
    {
      "event_id": "03_AIR_QUALITY:ECO-02:Seattle-Bellevue-Kent-Valley:2026-07-29",
      "event_type": "smoke_forecast",
      "title": "Ecology smoke forecast for Seattle-Bellevue-Kent Valley",
      "status": "forecast",
      "severity": "good",
      "category_label": "Good",
      "effective_at": "2026-07-29T07:00:00-07:00",
      "expires_at": null,
      "route_relevant": true,
      "wildfire_smoke_related": false,
      "areas": [
        "Seattle-Bellevue-Kent Valley"
      ],
      "source_id": "03_AIR_QUALITY:ECO-02",
      "source_record_id": "49",
      "geometry_type": "polygon",
      "manual_review_required": false
    },
    {
      "event_id": "03_AIR_QUALITY:PSCAA-02:king-county-burn-ban:2026-07-31",
      "event_type": "burn_ban",
      "title": "PSCAA burn ban status",
      "status": "current",
      "severity": "good",
      "category_label": "No Ban",
      "effective_at": null,
      "expires_at": null,
      "route_relevant": true,
      "wildfire_smoke_related": false,
      "areas": [
        "King County"
      ],
      "source_id": "03_AIR_QUALITY:PSCAA-02",
      "source_record_id": "king-county",
      "geometry_type": "text_only",
      "manual_review_required": false
    }
  ],
  "observations": [
    {
      "observation_id": "03_AIR_QUALITY:ECO-01:19:2026-07-29T19:00:00Z",
      "observation_type": "current_air_quality",
      "source_id": "03_AIR_QUALITY:ECO-01",
      "source_record_id": "19",
      "observed_at": "2026-07-29T19:00:00Z",
      "retrieved_at": "2026-07-31T17:00:05Z",
      "station_name": "Issaquah-Lake Sammamish",
      "station_location": "2000 NW Sammamish rd",
      "aqi_value": 22,
      "aqi_category": "Good",
      "severity": "good",
      "dominant_pollutant": "ozone",
      "pollutants": {
        "pm25": {
          "aqi": 9,
          "category": "Good",
          "value": 1.6,
          "units": "ug/m3"
        },
        "pm10": null,
        "ozone": {
          "aqi": 22,
          "category": "Good",
          "value": 0.027,
          "units": "ppm"
        },
        "no2": null
      },
      "wildfire_smoke_related": false,
      "route_relevance": {
        "method": "point_to_route_distance",
        "distance_km": 0.03,
        "threshold_km": 12.87,
        "route_section_id": "aqp4_issaquah"
      },
      "location": {
        "latitude": 47.5525,
        "longitude": -122.064722,
        "epsg": 4326
      }
    }
  ],
  "route_sections": [
    {
      "route_section_id": "aqp1_seattle",
      "route_section_name": "UW / Burke-Gilman west-north Seattle",
      "status": "current",
      "severity": "good",
      "aqi_value": 9,
      "aqi_category": "Good",
      "primary_monitor_source_id": "03_AIR_QUALITY:ECO-01",
      "primary_monitor_record_id": "453",
      "wildfire_smoke_related": false,
      "formal_alert_active": false,
      "forecast_category_worst": null
    },
    {
      "route_section_id": "aqp2_lake_forest_park",
      "route_section_name": "Lake Forest Park / Kenmore / Bothell handoff",
      "status": "current",
      "severity": "good",
      "aqi_value": 16,
      "aqi_category": "Good",
      "primary_monitor_source_id": "03_AIR_QUALITY:ECO-01",
      "primary_monitor_record_id": "10073",
      "wildfire_smoke_related": false,
      "formal_alert_active": false,
      "forecast_category_worst": null
    },
    {
      "route_section_id": "aqp3_bellevue",
      "route_section_name": "Woodinville / Redmond / Marymoor / north Sammamish",
      "status": "current",
      "severity": "good",
      "aqi_value": 17,
      "aqi_category": "Good",
      "primary_monitor_source_id": "03_AIR_QUALITY:ECO-01",
      "primary_monitor_record_id": "505",
      "wildfire_smoke_related": false,
      "formal_alert_active": false,
      "forecast_category_worst": null
    },
    {
      "route_section_id": "aqp4_issaquah",
      "route_section_name": "South Sammamish / Issaquah",
      "status": "current",
      "severity": "good",
      "aqi_value": 22,
      "aqi_category": "Good",
      "primary_monitor_source_id": "03_AIR_QUALITY:ECO-01",
      "primary_monitor_record_id": "19",
      "wildfire_smoke_related": false,
      "formal_alert_active": false,
      "forecast_category_worst": null
    }
  ],
  "provenance": {
    "source_ids_used": [
      "03_AIR_QUALITY:ECO-01",
      "03_AIR_QUALITY:ECO-02",
      "03_AIR_QUALITY:PSCAA-02"
    ],
    "sources": [
      {
        "source_id": "03_AIR_QUALITY:ECO-01",
        "source_name": "Washington State Department of Ecology Air Quality Monitoring Hourly Results",
        "retrieved_at": "2026-07-31T17:00:05Z",
        "source_timestamp": "2026-07-29T19:00:00Z",
        "status": "ok",
        "stale": false
      }
    ]
  },
  "validation_state": {
    "candidate_validation_passed": true,
    "published_from_candidate": false,
    "validator_version": "1.0.0"
  },
  "metadata": {
    "lane_summary": {
      "current_category": "Good",
      "current_aqi_max": 22,
      "dominant_pollutant": "ozone",
      "wildfire_smoke_related": false,
      "forecast_category_worst": "Good",
      "burn_ban_status": "no_ban",
      "formal_alert_active": false,
      "message": "Official corridor monitors were Good across the route in the latest sampled cycle."
    }
  }
}
```

### Required fields

The following keys must always be present in the published lane output:

- shared envelope fields:
  - `schema_version`
  - `connector_id`
  - `connector_name`
  - `connector_version`
  - `lane`
  - `run_id`
  - `generated_at`
  - `published_at`
  - `data_status`
  - `freshness`
  - `manifest_ref`
  - `source_health`
  - `connector_health`
  - `events`
  - `observations`
  - `route_sections`
  - `provenance`
  - `validation_state`
  - `metadata`
- lane-specific required fields:
  - `metadata.lane_summary.current_category`
  - `metadata.lane_summary.current_aqi_max`
  - `metadata.lane_summary.burn_ban_status`
  - `metadata.lane_summary.formal_alert_active`
  - `observations[].observation_id`
  - `observations[].observed_at`
  - `observations[].aqi_value`
  - `observations[].aqi_category`
  - `observations[].severity`
  - `observations[].route_relevance`
  - `route_sections[].route_section_id`
  - `route_sections[].route_section_name`
  - `route_sections[].severity`

### Optional fields

These may be `null` or omitted when the source does not provide them:

- `published_at`
- `events[].effective_at`
- `events[].expires_at`
- `events[].source_record_id`
- `observations[].dominant_pollutant`
- `observations[].pollutants.pm10`
- `observations[].pollutants.no2`
- `route_sections[].forecast_category_worst`
- `provenance.sources[].source_timestamp`
- `metadata.lane_summary.forecast_category_worst`

### Enum-like fields

- `data_status`:
  - `ok`
  - `degraded`
  - `stale`
  - `no_relevant_events`
  - `failed_validation`
  - `failed_fetch`
  - `blocked`
  - `using_last_known_good`
- `freshness.overall_state`:
  - `fresh`
  - `recent`
  - `stale`
  - `outdated`
  - `unknown`
- `source_health[].status`:
  - `ok`
  - `degraded`
  - `failed`
  - `stale`
  - `blocked`
  - `not_run`
  - `skipped_as_not_due`
  - `empty_but_valid`
- `connector_health.status`:
  - `ok`
  - `degraded`
  - `failed`
  - `blocked`
- `events[].event_type`:
  - `smoke_forecast`
  - `air_quality_alert`
  - `burn_ban`
- `events[].status`:
  - `current`
  - `forecast`
  - `expired`
  - `stale`
- `observations[].observation_type`:
  - `current_air_quality`
- `severity` fields:
  - `good`
  - `moderate`
  - `usg`
  - `unhealthy`
  - `very_unhealthy`
  - `hazardous`
  - `unknown`
- `metadata.lane_summary.burn_ban_status`:
  - `no_ban`
  - `stage_1`
  - `stage_2`
  - `unknown`

### Timestamp fields and semantics

- `generated_at`: UTC timestamp for when the connector assembled the candidate artifact
- `published_at`: UTC timestamp for lane publication; `null` for candidate-only artifacts
- `freshness.computed_at`: UTC time the freshness model ran
- `source_health[].retrieved_at`: UTC time the fetch finished
- `source_health[].last_observation_at`: UTC-normalized most recent source observation or publication timestamp
- `observations[].observed_at`: UTC-normalized `DateTime_PST` from Ecology
- `observations[].retrieved_at`: UTC fetch timestamp
- `events[].effective_at`: original source-effective timestamp converted to ISO 8601 when available
- `events[].expires_at`: original source-expiration timestamp when available
- Example values:
  - `2026-07-31T17:00:00Z`
  - `2026-07-29T19:00:00Z`
  - `2026-07-29T07:00:00-07:00`

### Geographic fields

- All coordinates use decimal degrees, EPSG:4326
- `observations[].location.latitude`
- `observations[].location.longitude`
- `observations[].route_relevance.distance_km`
- `observations[].route_relevance.threshold_km`
- `observations[].route_relevance.route_section_id`
- `events[].areas[]` holds named areas rather than coordinates when a source is text-only
- `events[].geometry_type`:
  - `point`
  - `polygon`
  - `county_zone`
  - `text_only`

### Source attribution and provenance fields

- `source_health[]` is the authoritative per-source health list
- `provenance.source_ids_used[]` records the sources that actually contributed to the output
- `provenance.sources[]` preserves fetch timestamp, source timestamp, and stale state
- Every `event` and `observation` record MUST include `source_id`

### Validators that run on every publication

- Schema validation:
  - validate the full outer envelope
  - validate presence of all required lane fields
  - reject unknown top-level shape changes
- Coordinate validation:
  - point observations must fall within the strict route envelope or within the allowed point-to-route threshold
  - latitude and longitude must be numeric and inside Washington-valid bounds for this route envelope
- Timestamp freshness validation:
  - parse all timestamps
  - reject future timestamps beyond a 5-minute clock-skew allowance
  - evaluate source freshness by the source-specific thresholds in this spec
- Source-health validation:
  - if a source returns a documented failure mode, reflect it in `source_health[]`
  - a healthy HTTP fetch is not sufficient without semantic validation
- Deduplication validation:
  - same `source_id + source_record_id + observed_at/effective_at` must not appear twice in one run
  - same event must not be duplicated across `events[]`

### Validation failure behavior

- Invalid raw or normalized artifacts must be written to a lane quarantine or validation artifact, not promoted
- Schema failure: log `error`, quarantine artifact, preserve published output and LKG
- Freshness failure with valid older data: log `warning`, publish `degraded` or `using_last_known_good`
- Coordinate failure: drop the failing record, log `error`, and continue if enough valid source data remains
- Parse failure on a secondary source: log `warning`, keep going
- Parse failure on an MVP source with valid LKG: publish degraded output with stale marker
- Parse failure on an MVP source with no valid LKG: publish partial output only if at least one other MVP branch still produces valid lane content; otherwise mark connector `failed_fetch`

## 4. ROUTE RELEVANCE Calculation

### Decision by source type

#### Official monitor points: `ECO-01`, optional `PSCAA-01`

- Rule: point-to-route distance threshold of `8` straight-line miles, which is `12.87 km`
- Additional rule: assign the point to the nearest approved route section / route anchor
- Approved sections, per `ROUTE_RELEVANCE_AND_THRESHOLDS.md`:
  - `aqp1_seattle` -> Seattle-NE 127th
  - `aqp2_lake_forest_park` -> Lake Forest Park-Town Center
  - `aqp3_bellevue` -> Bellevue-SE 12th
  - `aqp4_issaquah` -> Issaquah-Lake Sammamish

#### Forecast polygons: `ECO-02`

- Rule: route bbox prefilter, then actual polygon intersection with the canonical GPX line
- Buffer distance: `0 km` additional buffer; use the route polyline itself for the authoritative intersection test
- Publication rule: city-name matching alone is never sufficient when polygon geometry exists

#### Reporting areas and ZIP mapping: `AIRNOW-02`

- Rule: use reporting-area and ZIP mapping only as fallback/cross-check context
- Publication rule: do not treat reporting-area centroid distance as equivalent to a route monitor

#### Formal alerts: `NWS-AQ-01`

- Rule order:
  1. if geometry exists, intersect geometry with the canonical route line
  2. if geometry is `null`, match `areaDesc` and any geocode data to Washington / King County route relevance
  3. if the alert is not King County or otherwise route-related, treat it as non-relevant
- Spatial confidence: lower than polygon intersection when geometry is absent, but still deterministic at the county/zone level

#### Narrative smoke outlook: `WASMOKE-01`

- Rule: match only against the approved lookup table from `ROUTE_RELEVANCE_AND_THRESHOLDS.md`
  - `Seattle`
  - `Bellevue`
  - `Eastside`
  - `King County`
  - `Issaquah`
  - `Cascade foothills`
  - `Seattle-Bellevue-Kent Valley`
- Publication rule: use as context and smoke attribution only; never as the sole route-classification source

### Implementation sketch for n8n

1. Read canonical route geometry from `data/route/UnivWA-Issaquah.gpx`
2. Derive strict bbox once per execution:
   - latitude `47.55207` to `47.75889`
   - longitude `-122.3057` to `-122.04414`
3. For point sources:
   - compute minimum distance from point to route polyline
   - reject if `distance_km > 12.87`
   - assign nearest route section
4. For polygon sources:
   - reject if bbox does not intersect the route bbox
   - otherwise run polygon-line intersection
5. For text-only sources:
   - match only against the approved lookup list
   - if no approved route location appears, keep the item as statewide context only and do not publish it as route-relevant

### Edge cases and fallback logic

- Ambiguous monitor assignment:
  - if two sections are effectively tied, pick the nearest route section centroid and log a warning
- No route-relevant monitors returned:
  - mark `ECO-01` degraded and fall back to LKG rather than inventing a replacement monitor
- Polygon touches bbox but not route:
  - drop the record as non-route-relevant
- NWS alert with `geometry: null` and non-specific `areaDesc`:
  - require at least county-level route relevance before publishing
- Narrative smoke post with statewide-only language:
  - retain in raw landing or provenance only, not in `events[]`

### Geographic bounds check

- Strict envelope:
  - latitude `47.55207` to `47.75889`
  - longitude `-122.3057` to `-122.04414`
- Point-source acceptance:
  - either inside the strict envelope, or within `12.87 km` of the route polyline
- Polygon-source acceptance:
  - bbox overlap plus line intersection required

### Reference

All route-relevance rules in this section are derived from `ROUTE_RELEVANCE_AND_THRESHOLDS.md`, with the exact `8` mile monitor threshold carried forward directly.

## 5. FRESHNESS, Failure, and Fallback

### Source freshness rules

- `ECO-01` observations: stale after `90 minutes`
- `ECO-02` smoke forecast:
  - stale after `12 hours` in smoke season
  - stale after `24 hours` off-season
- `WASMOKE-01` smoke RSS: stale after `12 hours` in smoke season
- `PSCAA-02` burn-ban page: stale after `24 hours`
- `NWS-AQ-01` formal alerts: stale after `15 minutes`
- `AIRNOW-02` reporting-area observations: stale after `90 minutes`
- `AIRNOW-02` ZIP mapping: stale after `24 hours`

### Field-level freshness application

- Current route severity comes only from fresh `ECO-01` data or explicitly marked stale LKG
- Forecast fields come only from `ECO-02` or, as text-only context, `WASMOKE-01`
- Formal alert state comes only from `NWS-AQ-01`
- Burn-ban state comes only from `PSCAA-02`

### Stale-data representation

- Stale records remain structurally present when LKG is being used
- The output MUST express staleness through:
  - top-level `data_status`
  - `freshness.overall_state`
  - `freshness.stale_source_ids`
  - `source_health[].status`
  - `metadata.lane_summary` values that stay present but are supported by stale provenance
- Nulling rules:
  - if no valid current observation or valid LKG exists, `metadata.lane_summary.current_category` becomes `Unknown`-equivalent via `severity: "unknown"` and `current_aqi_max: null`
  - if burn-ban parsing fails and no LKG exists, publish `burn_ban_status: "unknown"`

### Last-known-good caching

- Cache branch-specific last-known-good artifacts for:
  - `current_observations`
  - `smoke_forecast`
  - `burn_ban_status`
  - `formal_alerts`
- Retention rule from `DEC-004`: keep the active last-known-good snapshot until superseded by a newer valid LKG
- Lane-local file family:
  - `data/connectors/03_AIR_QUALITY/lkg/current_observations_latest.json`
  - `data/connectors/03_AIR_QUALITY/lkg/smoke_forecast_latest.json`
  - `data/connectors/03_AIR_QUALITY/lkg/burn_ban_status_latest.json`
  - `data/connectors/03_AIR_QUALITY/lkg/formal_alerts_latest.json`

### Failure scenarios and recovery

- Source API down:
  - retry once
  - if still down, use branch LKG if it exists
  - mark stale in `source_health`
- Source returns `4xx`:
  - treat as source-specific failure
  - do not keep retrying in the same run
  - continue with other branches
- Source returns `5xx`:
  - one bounded retry
  - if still failing, degrade the branch and continue
- Network unreachable:
  - emit sanitized error
  - use LKG if available
- Malformed response:
  - log sanitized parse error
  - skip the source
  - continue
- Secondary-source failure:
  - never block an otherwise-valid MVP publication
- Multiple MVP source failures:
  - publish degraded output if at least one essential lane function still has valid fresh or LKG data
  - otherwise mark connector failed and preserve prior published output

### How long stale records remain publishable

These drop horizons are implementation decisions derived from the research freshness windows and the project rule against presenting old data as current:

- current observations: drop from active publication after `24 hours`; keep only in evidence/LKG history after that
- smoke forecast: drop from active publication after `48 hours`
- smoke RSS context: drop from active publication after `24 hours`
- burn-ban state: drop from active publication after `72 hours` without a successful re-parse, then publish `unknown`
- formal alerts: drop immediately at `expires_at`; if `expires_at` is absent, drop after `60 minutes`

### Workflow-08 cross-lane deduplication participation

- Yes
- This lane emits hazard ownership metadata implicitly through `event_type`, `source_id`, and route relevance, and workflow 08 handles cross-lane deduplication
- Deduplication rules must follow `OVERLAP_NOTES.md`:
  - lane 03 owns the air-quality consequence
  - lane 04 owns the wildfire cause/perimeter
  - lane 07 may carry the same formal alert shell, but workflow 08 should keep one canonical alert record enriched with lane-03 air-quality consequences instead of publishing duplicates

## 6. Evidence and Validation Outputs

The lane writes execution evidence under a lane-scoped subtree:

- root: `data/connectors/03_AIR_QUALITY/`

### Landing files

- Path pattern: `data/connectors/03_AIR_QUALITY/landings/<source_id>_landing_<TIMESTAMP>.json`
- One file per source fetch attempt
- Required landing metadata:
  - `source_id`
  - `source_name`
  - `retrieved_at`
  - `http_status`
  - `content_type`
  - `request_url`
  - `record_count`
  - `payload`
- Rules:
  - sanitize cookies, headers, and secrets out of the landing file
  - preserve raw payload shape
- Retention:
  - keep the last `3` cycles or `24` hours, whichever is longer

### Normalized output

- Path pattern: `data/connectors/03_AIR_QUALITY/output/03_AIR_QUALITY_normalized_output_<TIMESTAMP>.json`
- One file per execution
- This is the canonical lane output consumed by workflow 08

### Validation log

- Path pattern: `data/connectors/03_AIR_QUALITY/validation/validation_log_<TIMESTAMP>.jsonl`
- One JSON line per validation event
- Required fields per line:
  - `timestamp`
  - `lane_id`
  - `run_id`
  - `source_id`
  - `check`
  - `status`
  - `message`
  - `record_id`

### Health/status report

- Path: `data/connectors/03_AIR_QUALITY/status.json`
- Overwritten each run
- Required fields:
  - `lane_id`
  - `run_id`
  - `last_fetch_at`
  - `last_success_at`
  - `status`
  - `source_health`
  - `error_messages`
  - `stale_data_fields`
  - `used_last_known_good`

### Additional lane-local artifacts

- `data/connectors/03_AIR_QUALITY/lkg/`
- `data/connectors/03_AIR_QUALITY/quarantine/`
- `data/connectors/03_AIR_QUALITY/fixtures/`

## 7. DATA SCHEMA Specification

### Authoritative normalized output model

The shared outer envelope from `00_SHARED_AUTONOMOUS_CONNECTOR_BUILD_STANDARD.md` is authoritative. This lane specializes that envelope with:

- `events[]`:
  - forecast polygons
  - formal air-quality alerts
  - burn-ban records
- `observations[]`:
  - one record per route-relevant monitor observation
- `route_sections[]`:
  - one record per approved route section
- `metadata.lane_summary`:
  - route-wide summary for workflow 08 and downstream display layers

### Full illustrative JSON example

Use the Section 3 JSON example as the authoritative shape example for this lane. It is already grounded in verified field names and sampled values.

### Field definitions

- `schema_version`
  - type: `string`
  - cardinality: required
  - example: `"1.0.0"`
- `connector_id`
  - type: `string`
  - required
  - example: `"03_AIR_QUALITY"`
- `run_id`
  - type: `string`
  - required
  - example: `"03_AIR_QUALITY-20260731T170000Z-001"`
- `data_status`
  - type: `string`
  - required
  - enum: see Section 3
- `events`
  - type: `array<object>`
  - required, may be empty
- `events[].event_id`
  - type: `string`
  - required
- `events[].event_type`
  - type: `string`
  - required
  - enum: `smoke_forecast`, `air_quality_alert`, `burn_ban`
- `events[].severity`
  - type: `string`
  - required
- `events[].route_relevant`
  - type: `boolean`
  - required
- `observations`
  - type: `array<object>`
  - required, may be empty
- `observations[].observation_id`
  - type: `string`
  - required
- `observations[].source_record_id`
  - type: `string`
  - required
  - example: `"19"`
- `observations[].aqi_value`
  - type: `number`
  - required
  - example: `22`
- `observations[].aqi_category`
  - type: `string`
  - required
  - example: `"Good"`
- `observations[].dominant_pollutant`
  - type: `string|null`
  - optional/nullable
  - allowed values: `pm25`, `pm10`, `ozone`, `no2`, `unknown`
- `observations[].pollutants`
  - type: `object`
  - required
- `observations[].pollutants.pm25`
  - type: `object|null`
  - example: `{ "aqi": 9, "category": "Good", "value": 1.6, "units": "ug/m3" }`
- `observations[].pollutants.ozone`
  - type: `object|null`
  - example: `{ "aqi": 22, "category": "Good", "value": 0.027, "units": "ppm" }`
- `observations[].route_relevance`
  - type: `object`
  - required
  - fields:
    - `method`: `point_to_route_distance`
    - `distance_km`: `number`
    - `threshold_km`: `number`
    - `route_section_id`: `string`
- `route_sections`
  - type: `array<object>`
  - required
  - cardinality: normally `4` records in the preferred production design
- `route_sections[].route_section_id`
  - type: `string`
  - required
  - values:
    - `aqp1_seattle`
    - `aqp2_lake_forest_park`
    - `aqp3_bellevue`
    - `aqp4_issaquah`
- `metadata.lane_summary`
  - type: `object`
  - required
  - fields:
    - `current_category`: `string`
    - `current_aqi_max`: `number|null`
    - `dominant_pollutant`: `string|null`
    - `wildfire_smoke_related`: `boolean`
    - `forecast_category_worst`: `string|null`
    - `burn_ban_status`: `string`
    - `formal_alert_active`: `boolean`
    - `message`: `string`

### Enum definitions

- EPA AQI severity mapping:
  - `0-50` -> `good`
  - `51-100` -> `moderate`
  - `101-150` -> `usg`
  - `151-200` -> `unhealthy`
  - `201-300` -> `very_unhealthy`
  - `301+` -> `hazardous`
- Burn-ban status:
  - `no_ban`
  - `stage_1`
  - `stage_2`
  - `unknown`

### Nested objects and arrays

- `pollutants` is a nested object with per-pollutant child objects or `null`
- `location` is a nested object with `latitude`, `longitude`, `epsg`
- `route_relevance` is a nested object with method and threshold details
- `provenance.sources[]` and `source_health[]` are distinct arrays; do not collapse them

### Coordinate format

- decimal degrees
- EPSG:4326
- source monitor geometries preserve original point coordinates

### Timestamp format

- ISO 8601 / RFC 3339
- UTC strings ending with `Z` unless the source timestamp is intentionally preserved with source offset for transparency in `effective_at`

### Reserved fields

These are reserved for future use and must be `null` or omitted in v1 unless real data exists:

- `events[].advisory_text`
- `events[].issuer_contact`
- `observations[].confidence_score`
- `metadata.lane_summary.recommended_mask_type`

### Example error states

- `ECO-01` failed, LKG available:
  - `data_status: "using_last_known_good"`
  - `freshness.stale_source_ids` includes `03_AIR_QUALITY:ECO-01`
  - `source_health[].status` for `ECO-01` is `stale` or `failed`
- `PSCAA-02` failed, no LKG:
  - `metadata.lane_summary.burn_ban_status: "unknown"`
  - a validation warning is emitted
- all MVP sources failed:
  - no new published artifact replaces the last valid published output
  - current run status becomes `failed_fetch` or `failed_validation`

## 8. N8N WORKFLOW ARCHITECTURE Sketch

- Workflow name: `v0001.03_AirQualityConnector`
- Workflow tags:
  - `uw_issy`
  - `connector`
  - `lane_03_air_quality`
  - `no_direct_deploy`
  - `active` or `disabled` depending on environment state
- Trigger:
  - scheduled
  - manual execution also supported
- Scheduler timezone: `America/Los_Angeles`
- Base trigger cadence: every `15 minutes`
- Branch due-checks:
  - `NWS-AQ-01` every run
  - `ECO-01`, `AIRNOW-02` observation file, optional `PSCAA-01`, optional `AIRNOW-01` when due every `60 minutes`
  - `ECO-02` and `WASMOKE-01` when due every `6 hours`
  - `PSCAA-02` when due every `12 hours`
- Overlap handling: overlapping executions must be prevented

### Node structure pseudocode

```text
Schedule Trigger (every 15 minutes, America/Los_Angeles)
  -> Load lane config and canonical GPX
  -> Compute route bbox and route sections
  -> Branch: ECO-01 due?
      -> HTTP GET Ecology hourly query
      -> Land raw response
      -> Parse features
      -> Validate fields, timestamps, coordinates
      -> Compute point-to-route distances
      -> Normalize observations and route_sections
      -> Write/update current-observations LKG if valid
  -> Branch: ECO-02 due?
      -> HTTP GET Ecology smoke forecast query
      -> Land raw response
      -> Parse polygons
      -> Validate timestamps and geometry
      -> Run polygon-route intersection
      -> Normalize smoke_forecast events
      -> Write/update forecast LKG if valid
  -> Branch: PSCAA-02 due?
      -> HTTP GET burn-ban page
      -> Land raw response
      -> Parse status blocks
      -> Normalize burn_ban event and lane summary field
      -> Write/update burn-ban LKG if valid
  -> Branch: AIRNOW-02 due?
      -> HTTP GET reportingarea.dat and cityzipcodes.csv
      -> Land raw responses
      -> Parse rows
      -> Normalize fallback provenance only
  -> Branch: WASMOKE-01 due?
      -> HTTP GET RSS
      -> Land raw response
      -> Parse latest item
      -> Match route-relevant place names
      -> Normalize contextual smoke attribution
  -> Branch: NWS-AQ-01
      -> HTTP GET active WA Air Quality Alerts
      -> Land raw response
      -> Parse features
      -> Route filter by geometry or county/text
      -> Normalize formal alert events
      -> Write/update formal-alert LKG if valid
  -> Optional branch: PSCAA-01 if enabled and due
  -> Optional branch: AIRNOW-01 if enabled and due
  -> Merge branch outputs
  -> Build outer connector envelope
  -> Run final schema, freshness, and dedup validators
  -> Write normalized output
  -> Write validation log
  -> Write status report
  -> Promote valid branch snapshots to LKG
```

### Error handling

- One branch failing must not automatically fail the whole connector
- The connector may publish partial/degraded output when at least one MVP branch still yields valid lane data
- If no valid MVP branch output or acceptable LKG exists, do not overwrite the last published good output

### Retry strategy

- network errors and `5xx`: one retry
- `NWS-AQ-01`: retry after `30` seconds
- all other sources: retry after `60` seconds
- `4xx`, parse failures, and semantic validation failures: no same-run retry

### Logging

- `info`:
  - branch due checks
  - successful fetches
  - LKG promotion
  - output write success
- `warning`:
  - stale source
  - secondary-source failure
  - fallback to LKG
  - ambiguous text relevance resolution
- `error`:
  - schema failure
  - route-geometry failure
  - malformed payload
  - all-MVP-source failure

### Performance considerations

- Expected runtime:
  - routine 15-minute cycles without due branches should be well under `1 minute`
  - full due cycles should still target under `3 minutes`
- Safe parallelization opportunities:
  - `AIRNOW-02`, `WASMOKE-01`, and `NWS-AQ-01` can fetch in parallel with `ECO-01`/`ECO-02`
  - `PSCAA-02` can run independently
- Avoid parallel duplicate requests to the same source family in one run

## 9. Integration with Workflow-08 and Publication

### What workflow 08 consumes

- the canonical normalized lane output JSON written under `data/connectors/03_AIR_QUALITY/output/`
- source provenance metadata
- source and connector health information
- route section severity summaries

### Cross-lane deduplication

Workflow 08 is responsible for cross-lane deduplication. This lane's role is to provide enough metadata for that deduplication to be correct.

- Smoke consequences:
  - lane 03 owns AQI / air-quality consequence
  - lane 04 owns wildfire cause/perimeter
- Formal air-quality alerts:
  - lane 03 owns the air-quality subject matter
  - lane 07 may also surface the same government alert shell
  - workflow 08 must keep one alert record, not two
- Burn bans:
  - lane 03 owns air-quality-driven burn-ban status

These rules come directly from `OVERLAP_NOTES.md`.

### Site republication timing

- This lane does not republish the site
- Workflow 08 decides publication timing after it evaluates the current lane set and deploy gates
- This spec assumes workflow 08 can consume the most recent valid lane artifact without requiring all branches in this lane to be fresh at the same moment

### Responsibility split

- Lane 03 responsibilities:
  - fetch
  - normalize
  - validate
  - preserve LKG
  - emit lane evidence and health
- Workflow 08 responsibilities:
  - read lane artifacts
  - deduplicate cross-lane events
  - apply cross-lane gating
  - generate public site artifacts
  - manage deploy/build steps

## 10. Testing and Validation Strategy

### Unit tests

- AQI severity mapping:
  - verify AQI to severity enum mapping at each EPA threshold boundary
- Route relevance:
  - point-to-route distance acceptance at `12.87 km`
  - rejection beyond `12.87 km`
  - nearest-section assignment
- Freshness:
  - stale/fresh logic for each source family
  - future timestamp handling fails safely to unknown/stale
- Schema transformation:
  - ecology observation payload to normalized `observations[]`
  - smoke forecast payload to normalized `events[]`
  - burn-ban HTML parse to normalized advisory state

### Integration tests

- Live or recorded-source tests for each approved source
- Validate that:
  - `ECO-01` yields route-section observations
  - `ECO-02` yields route-relevant polygon forecast when applicable
  - `PSCAA-02` yields a valid burn-ban state
  - secondary branches do not break MVP publication on failure

### Regression tests

- Use the saved `2026-07-29` research fixtures to assert:
  - four route-near monitors are recognized
  - values `9`, `16`, `17`, `22` map to `good`
  - `Issaquah-Lake Sammamish` keeps ozone as dominant pollutant in the saved sample
  - no false King County formal alert is created from the eastern-Washington NWS sample

### Mock tests

- Keep mock payloads in `data/connectors/03_AIR_QUALITY/fixtures/`
- Example mock:
  - `ECO-01` payload with one fresh Bellevue row and one stale out-of-corridor row
  - expected result: only the fresh route-relevant row survives normalization

### Failure tests

- simulate `ECO-01` timeout
- simulate `ECO-02` malformed polygon JSON
- simulate `PSCAA-02` HTML structure drift
- simulate `NWS-AQ-01` `geometry: null`
- simulate future timestamp in `DateTime_PST`

### Evidence of test success

- pass criteria:
  - normalized artifact validates
  - expected route sections are produced
  - stale and fallback states are explicit
  - no duplicate event IDs appear
- example success outputs:
  - JSON schema validation pass
  - validation log lines with all required checks marked `pass`
  - fixture-based regression snapshots matching expected severity and route-section assignment

## 11. Monitoring and Observability

### Key metrics

- fetch success rate per source
- parse success rate per source
- normalized observation count per run
- normalized event count per run
- stale-source percentage
- LKG-usage rate
- run duration

### Alerts

- notify a human when:
  - all MVP sources fail in one run
  - `ECO-01` remains stale for more than `3 hours`
  - `PSCAA-02` remains stale for more than `48 hours`
  - no route observations are produced for more than `24 hours`
  - validation failures occur in consecutive runs

Notification transport is still deferred under `DEC-013`, but the trigger conditions should be implemented in the lane status model now.

### Dashboard/status-page visibility

Site-visible status should eventually show:

- air-quality data current as of `<timestamp>`
- whether the lane is fresh, stale, degraded, or using LKG
- whether a formal air-quality alert is active
- whether burn-ban status is current or unknown

### Debugging order

When output is wrong, operators should inspect in this order:

1. `data/connectors/03_AIR_QUALITY/status.json`
2. latest landing file for the failing source
3. latest validation log
4. latest normalized output
5. source website or endpoint directly

## 12. Known Risks and Mitigations

- Ecology TLS client behavior differed across local tools on 2026-07-29
  - mitigation: production-host retest before live scheduling
- `PSCAA-02` is webpage-backed, not feed-backed
  - mitigation: bounded parser, LKG, explicit `unknown` fallback
- `PSCAA-01` rich detail is stateful
  - mitigation: keep optional and non-blocking
- AirNow is coarse for this corridor
  - mitigation: never use it as the primary route segmentation engine
- PM10 may be structurally present but null in route-near rows
  - mitigation: allow pollutant fields to be nullable; do not fabricate pollutant detail
- Geographic coverage can still be imperfect between the four official monitors
  - mitigation: use four-point preferred design and keep forecast polygons separate from point observations
- Browser/cache freshness downstream is outside this lane
  - mitigation: lane publishes accurate timestamps and freshness metadata for workflow 08 to honor

## 13. Deferred Decisions and Open Questions

- Final workflow-08 deploy gate policy
  - deferred to `DEC-006`
- Cloudflare deployment target, branch strategy, and preview/prod environment model
  - deferred to `DEC-011` and `DEC-012`
- Human notification channel
  - deferred to `DEC-013`
- Whether the optional `PSCAA-01` branch is worth the operational complexity
  - deferred to implementation hardening after MVP
- Whether a future lane-specific polygon buffer is needed beyond direct line intersection
  - deferred unless live false negatives prove it necessary

No open question above blocks authoring or building the initial lane-03 connector against the MVP set.

## 14. Research Traceability

| Decision in this spec | Research / standard source |
|---|---|
| MVP sources are `ECO-01`, `ECO-02`, `PSCAA-02` | `IMPLEMENTATION_RECOMMENDATION.md`, `UW_ISSY_03_AIR_QUALITY_IMPLEMENTATION_RECOMMENDATION_v1.md` |
| Secondary sources are `AIRNOW-02`, `WASMOKE-01`, `NWS-AQ-01`, optional `PSCAA-01`, optional `AIRNOW-01` | `IMPLEMENTATION_RECOMMENDATION.md`, `ENV_AND_READINESS.md`, `SOURCE_REGISTRY.json` |
| Route should use more than one AQ point, with four preferred monitors | `RESEARCH_FINDINGS.md`, `ROUTE_RELEVANCE_AND_THRESHOLDS.md`, `UW_ISSY_03_AIR_QUALITY_FINAL_RESEARCH_REPORT_v1.md` |
| Official point threshold is `8` miles / `12.87 km` | `ROUTE_RELEVANCE_AND_THRESHOLDS.md` |
| Route bbox is lat `47.55207-47.75889`, lon `-122.3057 to -122.04414` | `ROUTE_RELEVANCE_AND_THRESHOLDS.md` |
| `ECO-01` returned four route-near stations with AQI `9`, `16`, `17`, `22` on 2026-07-29 | `API_AND_FEED_TEST_RESULTS.md`, `RESEARCH_FINDINGS.md` |
| `ECO-02` is the strongest official structured smoke forecast source | `RESEARCH_FINDINGS.md`, `IMPLEMENTATION_RECOMMENDATION.md`, `SOURCE_REGISTRY.json` |
| `PSCAA-02` is the strongest verified burn-ban source | `IMPLEMENTATION_RECOMMENDATION.md`, `API_AND_FEED_TEST_RESULTS.md`, `SOURCE_REGISTRY.json` |
| `PSCAA-01` is stateful and optional | `API_AND_FEED_TEST_RESULTS.md`, `RESEARCH_FINDINGS.md`, `ENV_AND_READINESS.md` |
| `AIRNOW-02` is useful fallback but too coarse for primary route segmentation | `RESEARCH_FINDINGS.md`, `API_AND_FEED_TEST_RESULTS.md`, `ENV_AND_READINESS.md` |
| Source freshness thresholds | `IMPLEMENTATION_RECOMMENDATION.md`, `ROUTE_RELEVANCE_AND_THRESHOLDS.md`, `UW_ISSY_03_AIR_QUALITY_IMPLEMENTATION_RECOMMENDATION_v1.md` |
| Preserve last-known-good instead of blanking output | `IMPLEMENTATION_RECOMMENDATION.md`, `00_CDM_CONNECTOR_LESSONS_APPLIED.md`, `00_SHARED_AUTONOMOUS_CONNECTOR_BUILD_STANDARD.md` |
| Connectors publish internal artifacts only; workflow 08 owns public data | `00_SHARED_AUTONOMOUS_CONNECTOR_BUILD_STANDARD.md`, `00_OPEN_CONNECTOR_ARCHITECTURE_DECISIONS.md` |
| Lane 03 owns air-quality consequence while lane 04 owns wildfire cause | `OVERLAP_NOTES.md` |
| Current, forecast, formal alerts, and burn bans must stay semantically distinct | `NORMALIZED_SCHEMA_PROPOSAL.md`, `IMPLEMENTATION_RECOMMENDATION.md` |
| Production-host Ecology TLS retest is still required | `ENV_AND_READINESS.md`, `UW_ISSY_03_AIR_QUALITY_AUDIT_REPORT_v1.md` |
