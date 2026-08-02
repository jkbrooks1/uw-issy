# 02_WEATHER_EXECUTABLE_BUILD_SPECIFICATION_v1

Prepared: 2026-07-31

This document is the executable build specification for connector lane `02_WEATHER`. It translates the verified weather research artifacts in this directory into implementation-ready guidance for the first n8n build. It does not build the workflow itself.

## 1. Overview

- Lane ID: `02_WEATHER`
- Lane name: `UW-Issaquah Weather Connector`
- Purpose: support rider decisions about whether to start, delay, shorten, or avoid the UW-to-Issaquah ride because of precipitation, wind, temperature, fog, freezing conditions, thunderstorm risk, or an official NWS weather alert.
- Approved MVP source set:
  - `NWS-01` NWS points metadata resolution
  - `NWS-02` NWS 7-day / 12-hour forecast
  - `NWS-03` NWS hourly forecast
  - `NWS-04` NWS raw gridpoint forecast data
  - `NWS-05` NWS observation stations and latest observations
  - `NWS-06` NWS active alerts
- Approved secondary source set:
  - `WSDOT-01` WSDOT Traveler Information API RWIS, optional only after authenticated retest succeeds with `WSDOT_TRAVELER_API_ACCESS_CODE`
- Rejected source:
  - `UW-01` UW Atmospheric Sciences rooftop station, because no stable public machine-readable API was verified
- High-level data flow: resolve and cache point metadata via `NWS-01`, fetch weather branches, land raw payloads, normalize to the shared connector envelope plus lane-specific observations and events, validate schema/freshness/route mapping, preserve last-known-good where needed, publish internal connector artifacts for workflow-08 consumption.
- Workflow-08 integration: lane 02 writes only internal connector artifacts under `data/connectors/`. Workflow `08_ASSEMBLE_VALIDATE_BUILD_DEPLOY` consumes the published lane envelope, freshness, provenance, and source-health metadata, performs cross-lane deduplication, and alone writes rider-facing `public/data/` artifacts.
- Governing standards:
  - shared standard: `00_CONNECTORS/00_SHARED_AUTONOMOUS_CONNECTOR_BUILD_STANDARD.md`
  - architecture decisions: `00_CONNECTORS/00_OPEN_CONNECTOR_ARCHITECTURE_DECISIONS.md`
  - lessons applied: `00_CONNECTORS/00_CDM_CONNECTOR_LESSONS_APPLIED.md`
- Architecture decisions that directly bind this lane:
  - schedule: one non-overlapping connector workflow every `15 minutes` in `America/Los_Angeles` per `DEC-005`
  - runtime and local artifact paths: `data/connectors/.../<lane>/` internally; no direct `public/data/` writes per `DEC-001` and `DEC-002`
  - WSDOT optional-only in first production-capable weather release per `DEC-007`
- Readiness assessment: ready to build the first executable NWS-only connector now. Not fully policy-ready for final production thresholds because `WEATHER_THRESHOLD_RECOMMENDATIONS.md` leaves exact wind-advisory, dense-fog, and heat-policy choices unresolved pending owner approval or follow-up research. That means build-ready for implementation, not yet fully finalized for deploy-gating policy.
- Research-package note: this specification is grounded in the verified weather research set that actually exists in `00_CONNECTORS/02_WEATHER/`: `RESEARCH_FINDINGS.md`, `IMPLEMENTATION_RECOMMENDATION.md`, `API_AND_FEED_TEST_RESULTS.md`, `ROUTE_WEATHER_POINT_MAPPING.md`, `WEATHER_THRESHOLD_RECOMMENDATIONS.md`, `SOURCE_GAPS.md`, `SOURCE_REGISTRY.json`, `UW_ISSY_02_WEATHER_FINAL_RESEARCH_REPORT_v1.md`, `UW_ISSY_02_WEATHER_IMPLEMENTATION_RECOMMENDATION_v1.md`, and `UW_ISSY_02_WEATHER_AUDIT_REPORT_v1.md`. Build decisions below trace to that on-disk evidence set rather than to generic template filenames that are not part of this lane's actual deliverable package.

## 2. SOURCE ACQUISITION Strategy

### `NWS-01`

- Owning agency: National Weather Service (NOAA)
- Acquisition method: unauthenticated HTTPS `GET` to `/points/{lat},{lon}` with descriptive `User-Agent`
- Role in workflow: foundational metadata resolver for all 8 route weather points `WP1` through `WP8`
- Fetch cadence: once per build if cache missing; otherwise reuse cached result and revalidate weekly
- Freshness threshold: treat cached mapping as reusable until weekly revalidation; this is metadata, not an observation stream
- Environment variables: none
- n8n authentication pattern: none; set a fixed `User-Agent` header in the HTTP Request node
- Implementation requirement: follow the mandatory `301` redirect from raw GPX coordinates to the canonical 4-decimal coordinate; do not treat the initial `301` as a failure
- Documented failure modes from live testing:
  - redirect not followed
  - non-`200` after redirect
  - missing `gridId`, `gridX`, `gridY`, `forecast`, `forecastHourly`, `forecastGridData`, `observationStations`, `forecastZone`, `county`, or `timeZone`
- Error handling:
  - retry once after `5` seconds on network error or `5xx`, matching NWS rate-limit guidance
  - on persistent failure, use last-known-good point metadata if present
  - if no last-known-good exists for a point, mark that point's downstream branches failed while allowing other points to continue
- Rate limiting: NWS documents an undisclosed but "generous" rate limit and suggests retrying after about 5 seconds on exceedance; no numeric quota was verified
- Network requirements: reachable from the research environment over public HTTPS; no geo restrictions or credentials
- Fallback: last-known-good cached point mapping only
- Last-known-good strategy: preserve per-point `grid_id`, `grid_x`, `grid_y`, `forecast_zone`, `county_zone`, `fire_weather_zone`, and `time_zone`

### `NWS-02`

- Owning agency: National Weather Service (NOAA), Seattle/Tacoma WFO `SEW`
- Acquisition method: unauthenticated HTTPS `GET` to `/gridpoints/{office}/{x},{y}/forecast`
- Role in workflow: human-readable day/night forecast periods for each route point
- Fetch cadence: branch due every `60 minutes`, even though the parent workflow runs every `15 minutes`
- Freshness threshold: stale after `60 minutes`, keyed to `properties.updateTime`, not `generatedAt`
- Environment variables: none
- Authentication pattern: same fixed `User-Agent` header
- Documented failure modes:
  - non-`200`
  - missing `periods[]`
  - malformed or unparsable `updateTime`
  - explicit `null` values such as `temperatureTrend`
- Error handling:
  - retry once after `5` seconds on network or `5xx`
  - use last-known-good forecast periods if the fetch fails but a valid prior payload exists
  - mark the source `stale` if last-known-good is older than 60 minutes but still within the connector's stale-publication allowance
- Rate limiting: same NWS-wide undisclosed limit
- Network requirements: public HTTPS only
- Fallback: `NWS-03` or `NWS-04` for overlapping forecast fields, but `NWS-02` remains the canonical prose/daypart source
- Last-known-good strategy: preserve the full raw payload and the normalized period records

### `NWS-03`

- Owning agency: National Weather Service (NOAA), Seattle/Tacoma WFO `SEW`
- Acquisition method: unauthenticated HTTPS `GET` to `/gridpoints/{office}/{x},{y}/forecast/hourly`
- Role in workflow: near-term hourly forecast periods for each route point
- Fetch cadence: every `60 minutes`
- Freshness threshold: stale after `60 minutes`
- Environment variables: none
- Authentication pattern: fixed `User-Agent` header
- Documented failure modes:
  - non-`200`
  - missing `periods[]`
  - empty-string `name` or `detailedForecast`, which are valid and must not be treated as parse failures
  - string-formatted `windSpeed`, which must not be used as the authoritative numeric wind source
- Error handling:
  - retry once after `5` seconds on network or `5xx`
  - preserve last-known-good hourly periods on failure
- Rate limiting: same NWS-wide undisclosed limit
- Network requirements: public HTTPS only
- Fallback: `NWS-04` for numeric hourly-equivalent fields
- Last-known-good strategy: preserve the full raw payload and normalized hourly periods

### `NWS-04`

- Owning agency: National Weather Service (NOAA), Seattle/Tacoma WFO `SEW`
- Acquisition method: unauthenticated HTTPS `GET` to `/gridpoints/{office}/{x},{y}`
- Role in workflow: primary numeric threshold-evaluation source for temperature, apparent temperature, wind speed, wind gust, precipitation, visibility, thunder probability, snow, ice, and coded weather phenomena
- Fetch cadence: every `60 minutes`
- Freshness threshold: stale after `60 minutes`, keyed to `properties.updateTime`
- Environment variables: none
- Authentication pattern: fixed `User-Agent` header
- Documented failure modes:
  - non-`200`
  - missing expected field keys such as `windSpeed`, `windGust`, `visibility`, `probabilityOfThunder`, `weather`, `quantitativePrecipitation`
  - interval parsing failure because `validTime` is ISO-8601 interval syntax rather than a single timestamp
  - explicit `null` values for seasonal fields such as `heatIndex`, `windChill`, `iceAccumulation`
- Error handling:
  - retry once after `5` seconds on network or `5xx`
  - if a field is present but `value` is `null`, normalize it as `null`; do not invent zeros
  - preserve last-known-good grid data if fresh fetch fails
- Rate limiting: same NWS-wide undisclosed limit
- Network requirements: public HTTPS only
- Fallback: `NWS-02` and `NWS-03` for prose and limited overlapping values only; no other source replaces the numeric field coverage
- Last-known-good strategy: preserve both raw payload and expanded normalized time-series rows

### `NWS-05`

- Owning agency: National Weather Service (NOAA) / FAA for airport ASOS stations
- Acquisition method:
  - station catalog lookup from `/gridpoints/{office}/{x},{y}/stations`
  - latest observation fetches from `/stations/{stationId}/observations/latest`
- Role in workflow: real observed conditions from the verified 4-station set `SEAW1`, `KBFI`, `KRNT`, `KPAE`
- Fetch cadence: every `60 minutes` inside the `15-minute` parent schedule
- Freshness threshold: stale after `90 minutes`
- Environment variables: none
- Authentication pattern: fixed `User-Agent` header
- Documented failure modes:
  - non-`200`
  - station-ordering mismatch if the API order is trusted blindly instead of computing true distance
  - limited-field station behavior at `SEAW1` with empty `textDescription` and null `visibility`
  - unverified non-`V` quality-control codes in production
- Error handling:
  - retry once after `5` seconds on network or `5xx`
  - normalize missing station fields as `null`
  - downgrade confidence when `quality_control` is not `"V"` or when a field-specific QC code indicates lower trust
  - preserve last-known-good observations if the source fails
- Rate limiting: same NWS-wide undisclosed limit
- Network requirements: public HTTPS only
- Fallback:
  - for route points without nearby full-featured stations, use `NWS-04` as the primary current-conditions proxy and attach the nearest available station as corroboration only
  - do not claim station-confirmed visibility or precipitation for WP4, WP5, WP7, or WP8 when the nearest full station remains 10+ miles away
- Last-known-good strategy: preserve station-specific latest observations for the 4-station set

### `NWS-06`

- Owning agency: National Weather Service (NOAA)
- Acquisition method: unauthenticated HTTPS `GET` to `/alerts/active`
- Recommended runtime query pattern:
  - one county query for `WAC033`
  - one zone query each for the route's forecast zones `WAZ313`, `WAZ314`, `WAZ315`
  - de-duplicate returned alerts by NWS `id`
- Role in workflow: official active meteorological alerts relevant to the route
- Fetch cadence: every `15 minutes`
- Freshness threshold: stale after `15 minutes`
- Environment variables: none
- Authentication pattern: fixed `User-Agent` header
- Required alert filter:
  - include only genuinely meteorological weather events such as `Winter Storm Warning`, `Winter Weather Advisory`, `Wind Advisory`, `High Wind Warning`, `Dense Fog Advisory`, `Severe Thunderstorm Warning`, `Excessive Heat Warning`, `Heat Advisory`, `Freeze Warning`, `Freeze Watch`, and `Frost Advisory`
  - exclude `Air Quality Alert` because that belongs to lane 03
  - exclude `Fire Weather Watch` and other fire-weather products because they belong to lane 04
  - exclude flood-specific products because lane 05 owns flood-condition publication
- Documented failure modes:
  - non-`200`
  - malformed GeoJSON FeatureCollection
  - `geometry: null`, requiring zone-based rather than polygon-based matching
  - `severity`, `certainty`, or `urgency` values of `"Unknown"`, which are valid and must not fail parsing
- Error handling:
  - retry once after `5` seconds on network or `5xx`
  - preserve the last-known-good active alert set only until each alert's own `expires` or `ends`
  - once an alert has passed `expires` or `ends`, drop it even if it remains in last-known-good storage
- Rate limiting: same NWS-wide undisclosed limit
- Network requirements: public HTTPS only
- Fallback: none beyond short-window last-known-good preservation
- Last-known-good strategy: preserve only still-active alerts and never republish expired alerts as active

### `WSDOT-01` secondary

- Owning agency: Washington State Department of Transportation
- Acquisition method: HTTPS `GET` to Traveler Information API RWIS endpoints
- Role in workflow: optional future enrichment for road-surface-adjacent weather at route-adjacent highway locations
- Fetch cadence: not part of the first executable release; if enabled later, every `60 minutes`
- Freshness threshold: do not finalize until authenticated live testing confirms the source
- Environment variables: `WSDOT_TRAVELER_API_ACCESS_CODE`
- Authentication pattern in n8n: store the access code in an n8n credential or environment-backed expression; pass it as the required query parameter; do not hard-code it into node JSON
- Documented failure modes:
  - unauthenticated `401` with the message that the access code is missing or invalid
  - route relevance unresolved because the station list itself was blocked without the access code
- Error handling:
  - optional-only branch
  - a failed or unavailable WSDOT branch must never block valid NWS-only publication
- Rate limiting: not verified in this cycle
- Network requirements: public HTTPS plus valid access code
- Fallback: NWS-only publication
- Last-known-good strategy: only after an authenticated branch is proven valid; not part of first-release assumptions

## 3. Normalization and Validation

### Normalized output schema

The authoritative normalized output must use the shared outer envelope from `00_SHARED_AUTONOMOUS_CONNECTOR_BUILD_STANDARD.md`. Lane 02 populates that envelope as follows:

- `events[]`
  - official active weather alerts from `NWS-06`
  - optional threshold-derived weather advisories synthesized from `NWS-04` and explicitly marked as connector-derived, not official NWS alerts
- `observations[]`
  - current route-point weather summaries built from `NWS-04` and `NWS-05`
  - observation-station records for the 4-station set
- `route_sections[]`
  - per-route-section rider summaries keyed to `WP1` through `WP8`
- `source_health[]`
  - one source-health record per approved source branch
- `connector_health`
  - top-level workflow result separate from source hazard severity
- `provenance`
  - source IDs used, sample capture metadata, route point definitions, and nearest-station mappings
- `validation_state`
  - candidate/published validation outcomes
- `metadata`
  - lane-specific policy notes, threshold version, unresolved-threshold flags, and route-point registry

### Illustrative normalized JSON example

This example uses verified field names and representative values derived from the 2026-07-29 live NWS samples. It is illustrative, not a copied live publication, and intentionally shows a no-active-alert run because no route-relevant weather alert was observed in the research cycle.

```json
{
  "schema_version": "1.0.0",
  "connector_id": "02_WEATHER",
  "connector_name": "UW-Issaquah Weather Connector",
  "connector_version": "v0001",
  "lane": "02_WEATHER",
  "run_id": "02_WEATHER-20260731T170000Z-001",
  "generated_at": "2026-07-31T17:00:00Z",
  "published_at": "2026-07-31T17:00:03Z",
  "data_status": "ok",
  "freshness": {
    "overall_state": "fresh",
    "computed_at": "2026-07-31T17:00:03Z",
    "oldest_relevant_source_age_minutes": 34,
    "stale_source_ids": []
  },
  "manifest_ref": {
    "manifest_id": "02_WEATHER-v0001",
    "schema_version": "1.0.0"
  },
  "source_health": [
    {
      "schema_version": "1.0.0",
      "connector_id": "02_WEATHER",
      "source_id": "02_WEATHER:NWS-04",
      "source_name": "NWS raw gridpoint forecast data",
      "status": "ok",
      "retrieved_at": "2026-07-31T16:26:57Z",
      "stale_after_minutes": 60,
      "record_count": 8,
      "http_status": 200,
      "last_observation_at": "2026-07-31T16:26:57Z",
      "warnings": [],
      "errors": []
    },
    {
      "schema_version": "1.0.0",
      "connector_id": "02_WEATHER",
      "source_id": "02_WEATHER:NWS-06",
      "source_name": "NWS active alerts",
      "status": "empty_but_valid",
      "retrieved_at": "2026-07-31T16:45:00Z",
      "stale_after_minutes": 15,
      "record_count": 0,
      "http_status": 200,
      "last_observation_at": null,
      "warnings": [],
      "errors": []
    }
  ],
  "connector_health": {
    "schema_version": "1.0.0",
    "connector_id": "02_WEATHER",
    "status": "ok",
    "failed_stage": null,
    "warning_count": 0,
    "error_count": 0,
    "used_last_known_good": false,
    "candidate_written": true,
    "published_written": true
  },
  "events": [],
  "observations": [
    {
      "record_type": "route_point_current_conditions",
      "point_id": "WP8",
      "point_name": "Issaquah approach/terminus",
      "route_mile": 33.83,
      "route_section_label": "East Lake Sammamish Trail terminus; Issaquah approach streets",
      "latitude": 47.55207,
      "longitude": -122.04429,
      "forecast_grid_id": "SEW",
      "forecast_grid_x": 133,
      "forecast_grid_y": 64,
      "forecast_zone_id": "WAZ314",
      "county_zone_id": "WAC033",
      "source_observation_mode": "forecast_primary_station_corroboration",
      "observation_time_utc": "2026-07-29T06:50:00Z",
      "forecast_update_time_utc": "2026-07-29T06:26:57Z",
      "temperature_c": 18,
      "apparent_temperature_c": 18,
      "dewpoint_c": 11,
      "relative_humidity_percent": 63.625,
      "wind_speed_km_h": 7.416,
      "wind_gust_km_h": null,
      "wind_direction_degrees": 350,
      "visibility_m": 11265.41,
      "probability_of_precipitation_percent": 0,
      "quantitative_precipitation_mm": 0,
      "probability_of_thunder_percent": 0,
      "snowfall_amount_mm": 0,
      "ice_accumulation_mm": 0,
      "weather_codes": [],
      "official_nws_alert_ids": [],
      "threshold_flags": [],
      "nearest_station": {
        "station_id": "KRNT",
        "station_name": "Renton Municipal Airport",
        "station_distance_miles": 8.86,
        "station_is_full_featured": true,
        "quality_control_summary": "temperature:V, dewpoint:V, wind_speed:V, visibility:C"
      },
      "source_ids": [
        "02_WEATHER:NWS-04",
        "02_WEATHER:NWS-05"
      ]
    }
  ],
  "route_sections": [
    {
      "section_id": "WP8",
      "section_name": "Issaquah approach/terminus",
      "route_mile_start": 28.0,
      "route_mile_end": 33.83,
      "status": "ok",
      "summary": "No active weather alert. Current forecast-model conditions and nearest station corroboration do not breach approved weather thresholds.",
      "point_ids": [
        "WP8"
      ],
      "active_event_ids": []
    }
  ],
  "provenance": {
    "source_ids_used": [
      "02_WEATHER:NWS-01",
      "02_WEATHER:NWS-02",
      "02_WEATHER:NWS-03",
      "02_WEATHER:NWS-04",
      "02_WEATHER:NWS-05",
      "02_WEATHER:NWS-06"
    ],
    "route_gpx_ref": "data/route/UnivWA-Issaquah.gpx",
    "route_points_version": "2026-07-29",
    "threshold_reference": "WEATHER_THRESHOLD_RECOMMENDATIONS.md"
  },
  "validation_state": {
    "candidate_validation_passed": true,
    "published_from_candidate": true,
    "validator_version": "1.0.0"
  },
  "metadata": {
    "timezone": "America/Los_Angeles",
    "alert_filter_policy": "exclude air quality, fire weather, and flood-owned products from lane 02 publication",
    "threshold_policy_state": "owner_review_required_for_unresolved_items"
  }
}
```

### Required fields

- All shared envelope required fields from the shared standard
- For each weather observation record in `observations[]`:
  - `record_type`
  - `point_id`
  - `point_name`
  - `route_mile`
  - `latitude`
  - `longitude`
  - `forecast_grid_id`
  - `forecast_grid_x`
  - `forecast_grid_y`
  - `forecast_zone_id`
  - `county_zone_id`
  - `source_observation_mode`
  - `forecast_update_time_utc`
  - `temperature_c`
  - `wind_speed_km_h`
  - `probability_of_precipitation_percent`
  - `source_ids`
- For each alert event in `events[]`:
  - `event_id`
  - `event_type`
  - `source_id`
  - `status`
  - `effective_at`
  - `expires_at`
  - `forecast_zone_ids`
  - `county_zone_ids`
  - `is_official`

### Optional fields

- `apparent_temperature_c`
- `dewpoint_c`
- `relative_humidity_percent`
- `wind_gust_km_h`
- `visibility_m`
- `quantitative_precipitation_mm`
- `probability_of_thunder_percent`
- `snowfall_amount_mm`
- `ice_accumulation_mm`
- `snow_level_m`
- `nearest_station`
- `headline`
- `description`
- `instruction`
- `geometry`
- `official_nws_alert_ids`
- `threshold_flags`
- `manual_review_required`

### Enum-like fields

- `data_status`
  - `ok`
  - `degraded`
  - `stale`
  - `no_relevant_events`
  - `failed_validation`
  - `failed_fetch`
  - `blocked`
  - `using_last_known_good`
- `source_health.status`
  - `ok`
  - `degraded`
  - `failed`
  - `stale`
  - `blocked`
  - `not_run`
  - `skipped_as_not_due`
  - `empty_but_valid`
- `connector_health.status`
  - `ok`
  - `degraded`
  - `failed`
  - `blocked`
- `source_observation_mode`
  - `station_primary`
  - `forecast_primary_station_corroboration`
  - `forecast_only`
- `events[].record_type`
  - `official_weather_alert`
  - `connector_threshold_advisory`
- `events[].status`
  - `active`
  - `expired`
  - `cancelled`
  - `superseded`
- `threshold_flags[].severity`
  - `caution`
  - `high_risk`
  - `informational`

### Timestamp fields and semantics

- All timestamps must be ISO 8601 UTC strings ending with `Z`
- `generated_at`: when the connector assembled the envelope
- `published_at`: when the candidate was promoted to the lane's published internal artifact
- `freshness.computed_at`: when freshness logic ran
- `source_health.retrieved_at`: when the source payload was fetched or re-evaluated as skipped-not-due
- `source_health.last_observation_at`: latest source-native timestamp used for freshness, or `null`
- `observations[].observation_time_utc`: best current-conditions timestamp for that record; may come from station observation time or the relevant forecast-grid period start when forecast-primary mode is used
- `observations[].forecast_update_time_utc`: `NWS-02`, `NWS-03`, or `NWS-04` `updateTime` normalized to UTC
- `events[].effective_at`, `events[].onset_at`, `events[].expires_at`, `events[].ends_at`: direct NWS alert timing fields
- Example values:
  - `2026-07-29T06:26:57Z`
  - `2026-07-29T06:50:00Z`

### Geographic fields

- Coordinates: decimal degrees, EPSG:4326
- Weather route points:
  - `WP1` 47.65051, -122.30462
  - `WP2` 47.70489, -122.27521
  - `WP3` 47.74617, -122.28401
  - `WP4` 47.75031, -122.21119
  - `WP5` 47.72964, -122.14268
  - `WP6` 47.66129, -122.11027
  - `WP7` 47.61894, -122.06796
  - `WP8` 47.55207, -122.04429
- Route-wide bounding box for validation:
  - latitude 47.55207 to 47.75889
  - longitude -122.30570 to -122.04414
- Relevance metadata fields:
  - `point_id`
  - `route_section_label`
  - `route_mile`
  - `forecast_zone_id`
  - `county_zone_id`
  - `fire_weather_zone_id`
  - `nearest_station.station_distance_miles`

### Source attribution and provenance fields

- `provenance.source_ids_used`
- `provenance.route_gpx_ref`
- `provenance.route_points_version`
- `provenance.threshold_reference`
- `observations[].source_ids`
- `events[].source_id`
- `events[].official_product_identifier`
- `events[].forecast_zone_ids`
- `events[].county_zone_ids`

### Validators run on every publication

- Schema validation:
  - outer envelope keys present
  - required lane-specific fields present
  - arrays present even when empty
- Coordinate validation:
  - weather point coordinates must match one of the approved `WP1` through `WP8` definitions
  - station coordinates must fall within a broader Puget Sound sanity envelope and never replace the route point coordinate itself
- Timestamp freshness check:
  - forecast/grid data fresh if source `updateTime` age <= 60 minutes
  - observations fresh if latest station `timestamp` age <= 90 minutes
  - alerts fresh if fetch age <= 15 minutes and each alert remains before `expires`/`ends`
- Source-health check:
  - any documented failure mode must be recorded in `source_health.errors` or `source_health.warnings`
  - `skipped_as_not_due` may be used only when a due check ran and the source was intentionally skipped
- Deduplication check:
  - no duplicate alert `id`
  - no duplicate normalized grid observation row for the same `(point_id, period_start_utc)`
  - no duplicate station observation for the same `(station_id, timestamp)`
- Route-point integrity check:
  - only the approved 8 route points may appear in route-point observations
- Alert ownership check:
  - Air Quality, fire-weather, and flood-owned NWS products must be excluded from lane 02 publication

### Validation failure behavior

- Fail schema or envelope validation: quarantine the candidate artifact, keep existing published and last-known-good artifacts, set connector status `failed`
- Fail one source branch: continue with other branches, record per-source failure, publish degraded output if the merged envelope still validates
- Fail timestamp freshness on a source with valid last-known-good: publish `using_last_known_good` or `stale` for that branch and surface it in `stale_source_ids`
- Fail dedup check for a single event or observation: drop the duplicate record, log the reason, continue
- Fail route-point integrity check: skip the offending record, log an error, do not publish invented or out-of-registry points

## 4. ROUTE RELEVANCE Calculation

- Governing findings:
  - weather is not published by line-buffer intersection the way construction or wildfire geometries are
  - the research deliberately established 8 on-route monitoring points as the lane's route-relevance model
  - route-relevant official alerts are determined by the route's verified forecast zones and county, not by geocoding free text
- Decision by source type:
  - `NWS-01` through `NWS-04`: route relevance is exact by design because each request is made for one of the approved on-route points `WP1` through `WP8`
  - `NWS-05`: a station observation is route-relevant only when attached to one or more approved route points through the verified nearest-station mapping in `ROUTE_WEATHER_POINT_MAPPING.md`; station distance is preserved as metadata so eastern-route sparse coverage stays explicit
  - `NWS-06`: route relevance is a combination rule:
    - match `county` `WAC033`
    - or intersect the alert's `affectedZones`/`UGC` list with `WAZ313`, `WAZ314`, or `WAZ315`
    - then apply the lane-ownership event-type allowlist so only weather-owned alert types remain
  - `WSDOT-01`: deferred until authenticated station geometry can be tested against the route
- Exact route relevance implementation sketch:
  1. Load the canonical 8 route-point registry at workflow start.
  2. For forecast/grid sources, iterate only over those 8 points. No additional geographic filter is needed because the request itself is route-scoped.
  3. For observations, fetch the approved 4-station set and attach each station to the route points it best serves using the researched mapping:
     - `SEAW1` -> primarily WP1, WP2, WP3
     - `KBFI` -> primarily WP1, WP2, WP5, WP6
     - `KRNT` -> primarily WP6, WP7, WP8
     - `KPAE` -> primarily WP3, WP4
  4. For active alerts, query the route's county and forecast zones, merge the results, de-duplicate by NWS `id`, and then filter the event list through the weather-owned allowlist.
- Edge cases and fallback logic:
  - if `NWS-06` `geometry` is `null`, rely on `affectedZones` and `geocode.UGC`; this is expected behavior, not a failure
  - if a station is the nearest available source but is limited-field, keep the station as corroboration only and label the route-point observation mode `forecast_primary_station_corroboration`
  - if a route point loses cached `grid_x/grid_y`, fall back to last-known-good point metadata; do not geocode free text or approximate from a nearby point unless the exact point mapping exists
  - if a weather threshold fires at one point only, attribute the impact to that point's mapped section rather than the whole route
- Geographic bounds check:
  - every route-point observation must carry a coordinate inside the route bounding box
  - no alert, station, or route-section summary may invent a route location outside the approved route-point model
- Free-text geocoding: not used; the work order explicitly requires route relevance implementable without external geocoding services

## 5. FRESHNESS, Failure, and Fallback

### Freshness rules

- `NWS-01` point metadata:
  - cache and revalidate weekly
  - stale only if revalidation fails repeatedly and no last-known-good mapping remains
- `NWS-02`, `NWS-03`, `NWS-04`:
  - fresh if `updateTime` age <= 60 minutes
  - stale if > 60 minutes
  - unknown if timestamp missing, malformed, or in the future
- `NWS-05` observations:
  - fresh if station `timestamp` age <= 90 minutes
  - stale if > 90 minutes
  - for route points relying mainly on grid forecasts, the route-point record can still be fresh if the `NWS-04` source is fresh; the station corroboration then becomes optional context
- `NWS-06` alerts:
  - fresh if fetch age <= 15 minutes
  - additionally, each alert must still be before `expires` or `ends`
- Threshold-derived advisory events:
  - derive from the latest fresh `NWS-04` row only
  - drop derived advisories when the supporting row becomes stale or disappears

### Stale-data marking

- Do not null the entire connector because one source is stale
- Represent stale state in:
  - `data_status` as `stale` or `using_last_known_good` when it materially affects the connector output
  - `freshness.stale_source_ids`
  - each stale `source_health.status`
  - `metadata.threshold_policy_state` or record-level notes when derived conditions come from stale data
- Preserve stale values only when they are explicitly marked stale; never render them as current or safe

### Last-known-good caching

- Yes, this lane caches last-known-good artifacts
- Minimum retention behavior:
  - keep the active last-known-good snapshot until superseded by a newer valid snapshot, per `DEC-004`
  - also retain published immutable snapshots and evidence artifacts under the shared retention policy
- Cache scope:
  - per-source raw payloads
  - normalized branch outputs
  - latest valid merged connector envelope
  - point metadata cache for `NWS-01`

### Failure scenarios and recovery

- Source API down:
  - retry once after `5` seconds
  - if still failing, use source last-known-good if available
  - mark source `stale` or `failed`
  - do not overwrite a good published connector artifact with a broken one
- Source returns `4xx`:
  - for NWS, treat as source failure and continue other branches
  - for WSDOT `401`, treat as optional-branch blocked and continue NWS-only publication
- Source returns `500`:
  - retry once after `5` seconds
  - if the second call fails, continue with last-known-good
- Network unreachable:
  - mark source failed
  - use last-known-good where available
- Malformed response:
  - log sanitized parse error in validation log
  - skip that source's fresh payload
  - continue with other branches or last-known-good
- Missing timestamp:
  - freshness becomes `unknown`
  - the record cannot be treated as fresh
- Future timestamp:
  - freshness becomes `unknown`
  - treat as validation warning or error depending on the source and preserve LKG instead

### Stale record drop rules

- Active alerts: drop entirely once `expires` or `ends` passes
- Station observations: retain only as last-known-good support; do not expose as current if older than 90 minutes
- Forecast/grid data rows: drop from current-condition calculations once outside freshness thresholds; keep only in historical published snapshots
- Threshold-derived advisories: drop when the supporting source row is stale or absent

### Workflow-08 cross-lane deduplication participation

- Yes
- Lane 02 provides the metadata needed for workflow-08 to deduplicate:
  - official alert `id`
  - `event_type`
  - `forecast_zone_ids`
  - `county_zone_ids`
  - `is_official`
- Ownership rule:
  - lane 02 must not publish `Air Quality Alert`, `Fire Weather Watch`, or flood-owned products, so workflow-08 should normally not see those overlaps from lane 02 at all
  - if a future implementation bug leaks one through, workflow-08 should prefer the owning lane based on lane taxonomy and the explicit overlap notes preserved in this spec's traceability section

## 6. Evidence and Validation Outputs

- Raw landing payloads:
  - path pattern: `data/connectors/raw/02_WEATHER/<source_id>_landing_<timestamp>.json`
  - note: the work order suggested `data/connectors/02_WEATHER/landings/...`, but the shared standard's approved artifact-class path is `data/connectors/raw/<lane>/`; this spec follows the binding shared standard
  - one sanitized raw payload per source fetch
  - metadata stored alongside or inside the artifact:
    - `source_id`
    - `http_status`
    - `retrieved_at`
    - `request_url`
    - `content_type`
    - `record_count`
- Normalized output:
  - `data/connectors/normalized/02_WEATHER/02_WEATHER_normalized_output_<timestamp>.json`
  - one normalized connector envelope per execution
- Candidate artifact:
  - `data/connectors/candidate/02_WEATHER/current.json`
  - optional immutable snapshot beside it
- Published artifact:
  - `data/connectors/published/02_WEATHER/current.json`
  - immutable published snapshot per successful promotion
- Validation log:
  - `data/connectors/logs/02_WEATHER/validation_log_<timestamp>.jsonl`
  - one JSON line per validation event with `source_id`, `check`, `result`, `message`, `timestamp`
- Health/status report:
  - `data/connectors/health/02_WEATHER/status.json`
  - overwritten each run
  - fields:
    - `lane_id`
    - `last_fetch_at`
    - `last_success_at`
    - `status`
    - `source_health`
    - `error_messages`
    - `stale_data_fields`
- Last-known-good artifact:
  - `data/connectors/last_known_good/02_WEATHER/current.json`
- Evidence bundle:
  - `data/connectors/evidence/02_WEATHER/execution_evidence_<timestamp>.json`
- Quarantine output:
  - `data/connectors/quarantine/02_WEATHER/<timestamp>_<reason>.json`
- Schema copy for validator binding:
  - `data/connectors/schemas/02_WEATHER/02_WEATHER.schema.json`
- Manifest:
  - `data/connectors/manifests/02_WEATHER/02_WEATHER_manifest_v0001.json`
- Workflow-08 handoff record:
  - `data/connectors/handoff/02_WEATHER/02_WEATHER_handoff_<timestamp>.json`
- Retention:
  - use the shared retention defaults from `DEC-004`
  - raw success payloads 14 days
  - anomalous raw payloads 30 days
  - evidence 180 days
  - published snapshots 90 days
  - last-known-good current snapshot retained until superseded

## 7. DATA SCHEMA Specification

### Authoritative lane-level schema shape

- Outer envelope: shared connector schema `5.A Canonical connector output`
- Lane-specific arrays:
  - `events[]`: weather alerts and threshold-derived advisories
  - `observations[]`: route-point conditions plus station observations if separately retained
  - `route_sections[]`: point/section summaries

### Full illustrative JSON example

Use the example in section 3 as the authoritative illustrative example for this specification.

### Field definitions

- `events[].event_id`
  - type: string
  - cardinality: required
  - example: `urn:oid:2.49.0.1.840.0.8d0d6d...`
  - note: for official alerts, use the NWS `id`; for connector-derived advisories, use a deterministic synthetic ID such as `threshold:WP8:wind_gust:2026-07-31T16:00:00Z`
- `events[].event_type`
  - type: string
  - required
  - examples: `Wind Advisory`, `Dense Fog Advisory`, `threshold_wind_gust_high_risk`
- `events[].record_type`
  - type: string enum
  - required
- `events[].is_official`
  - type: boolean
  - required
- `events[].status`
  - type: string enum
  - required
- `events[].headline`
  - type: string or null
- `events[].description`
  - type: string or null
- `events[].instruction`
  - type: string or null
- `events[].severity`
  - type: string or null
  - note: preserve NWS-provided severity verbatim even when it is `Unknown`
- `events[].certainty`
  - type: string or null
- `events[].urgency`
  - type: string or null
- `events[].effective_at`
  - type: string
  - required for official alerts
- `events[].expires_at`
  - type: string
  - required for official alerts
- `events[].point_ids`
  - type: array of strings
  - required for connector-derived advisories
- `events[].forecast_zone_ids`
  - type: array of strings
  - required for official alerts
- `events[].county_zone_ids`
  - type: array of strings
  - required for official alerts
- `events[].threshold_flags`
  - type: array
  - optional
- `observations[].record_type`
  - type: string
  - required
  - examples: `route_point_current_conditions`, `station_latest_observation`
- `observations[].point_id`
  - type: string
  - required for route-point records
  - allowed values: `WP1` through `WP8`
- `observations[].station_id`
  - type: string or null
  - example: `KRNT`
- `observations[].temperature_c`
  - type: number or null
- `observations[].apparent_temperature_c`
  - type: number or null
- `observations[].wind_speed_km_h`
  - type: number or null
- `observations[].wind_gust_km_h`
  - type: number or null
- `observations[].visibility_m`
  - type: number or null
- `observations[].probability_of_precipitation_percent`
  - type: number or null
- `observations[].quantitative_precipitation_mm`
  - type: number or null
- `observations[].probability_of_thunder_percent`
  - type: number or null
- `observations[].snowfall_amount_mm`
  - type: number or null
- `observations[].ice_accumulation_mm`
  - type: number or null
- `observations[].weather_codes`
  - type: array of objects or strings
  - note: preserve NWS coded weather phenomena rather than collapsing immediately to prose
- `observations[].threshold_flags`
  - type: array
  - optional
- `route_sections[].section_id`
  - type: string
  - required
  - examples: `WP3`, `WP8`
- `route_sections[].status`
  - type: string
  - required
  - allowed values: `ok`, `caution`, `high_risk`, `degraded`, `stale`, `unknown`
- `route_sections[].summary`
  - type: string
  - required

### Nested objects and arrays

- `observations[].nearest_station`
  - `station_id`: string
  - `station_name`: string
  - `station_distance_miles`: number
  - `station_is_full_featured`: boolean
  - `quality_control_summary`: string
- `observations[].threshold_flags[]`
  - `threshold_code`: string
  - `severity`: enum `caution | high_risk | informational`
  - `source_field`: string
  - `threshold_value`: number or string
  - `observed_value`: number or string
  - `supporting_time_utc`: string

### Enum definitions

- Weather threshold codes:
  - `wind_sustained_caution`
  - `wind_sustained_advisory_aligned`
  - `wind_gust_caution`
  - `wind_gust_high_risk`
  - `temperature_heat_caution`
  - `temperature_heat_high_risk`
  - `temperature_frost_caution`
  - `temperature_ice_high_risk`
  - `precipitation_any_caution`
  - `precipitation_heavy_high_risk`
  - `thunderstorm_caution`
  - `thunderstorm_high_risk`
  - `snow_or_freezing_precipitation`
  - `dense_fog_caution`
  - `dense_fog_high_risk`

### Coordinate format

- Decimal degrees
- EPSG:4326
- No projected local coordinate system in published connector artifacts

### Timestamp format

- ISO 8601 UTC strings ending in `Z`
- Do not retain timezone offsets in published normalized artifacts; normalize everything to UTC

### Reserved fields

- `advisories`
- `ownership_annotations`
- any future cross-lane severity mapping field
- These must be omitted or `null` until workflow-08 formally requires them

### Example error states

- One source stale but valid envelope:
  - `data_status: "degraded"`
  - `freshness.stale_source_ids: ["02_WEATHER:NWS-05"]`
  - `source_health[NWS-05].status: "stale"`
- Last-known-good publication:
  - `data_status: "using_last_known_good"`
  - `connector_health.used_last_known_good: true`
- Full validation failure:
  - no published overwrite
  - invalid candidate quarantined under `data/connectors/quarantine/02_WEATHER/`

## 8. N8N WORKFLOW ARCHITECTURE Sketch

- Workflow name: `v0001.02_WeatherConnector`
- Export filename: `v0001.02_WeatherConnector.n8n.workflow.json`
- Project/folder: `UW-ISSY ROUTE MONITOR`
- Workflow tags:
  - `uw_issy`
  - `connector`
  - `lane_02_weather`
  - `no_direct_deploy`
  - `disabled` before schedule enablement
  - `active` after schedule enablement
- Trigger:
  - Schedule Trigger
  - Manual Trigger for operator runs
- Trigger cadence:
  - every `15 minutes`
  - timezone `America/Los_Angeles`
  - overlapping executions prevented per `DEC-005`

### Node structure pseudocode

```text
Schedule Trigger (every 15 minutes, America/Los_Angeles)
  -> Initialize run metadata
  -> Load route point registry (WP1-WP8) and last-known-good metadata cache
  -> Resolve due-check flags for each source branch

  -> Branch A: NWS-01 points metadata
    -> For each WPx
      -> If cached and not due, mark source_health skipped_as_not_due for metadata revalidation
      -> Else HTTP Request /points/{lat},{lon} with redirect follow
      -> Validate required fields
      -> Write raw landing
      -> Update point metadata cache

  -> Branch B: Forecast branch
    -> If due for NWS-02/NWS-03/NWS-04
      -> For each WPx
        -> HTTP Request forecast
        -> HTTP Request forecast/hourly
        -> HTTP Request raw gridpoint data
        -> Write raw landings
        -> Parse periods and validTime intervals
        -> Normalize route-point forecast and threshold rows
    -> Else mark source_health skipped_as_not_due for each forecast source

  -> Branch C: Observation branch
    -> If due for NWS-05
      -> HTTP Request stations catalog as needed
      -> HTTP Request latest observation for SEAW1, KBFI, KRNT, KPAE
      -> Write raw landings
      -> Normalize station observations
      -> Attach station corroboration to WPx mappings
    -> Else mark NWS-05 skipped_as_not_due

  -> Branch D: Alerts branch
    -> HTTP Request active alerts for WAC033, WAZ313, WAZ314, WAZ315
    -> Write raw landings
    -> Merge results and dedupe by alert id
    -> Filter event types to weather-owned allowlist
    -> Normalize official alert events

  -> Optional Branch E: WSDOT-01 only if env var exists and branch enabled
    -> HTTP Request with AccessCode
    -> Route filter against approved route geometry only after authenticated station list is proven

  -> Merge branches
  -> Build shared connector envelope
  -> Run validators
  -> Derive source_health and connector_health
  -> Write normalized artifact
  -> Write candidate artifact atomically
  -> If validation passes, promote to published artifact atomically
  -> Update last-known-good
  -> Write status, validation log, and execution evidence
```

### Error handling

- If one source fails, continue other branches and attempt a degraded merge
- If all sources fail or the merged envelope fails validation, do not overwrite the published artifact
- Publish partial output only when it still validates and clearly marks stale/degraded branches

### Retry strategy

- Network errors and `5xx`: retry once after about `5` seconds for NWS sources
- `4xx`: no retry unless the failure is a known redirect/auth flow detail
- Optional WSDOT branch:
  - `401` means blocked/auth-missing, not retriable without credentials

### Logging

- `info`
  - branch start/finish
  - source skipped-as-not-due
  - artifact writes
  - candidate promoted to published
- `warning`
  - stale source used
  - limited-field station used as corroboration only
  - threshold policy still unresolved for a triggered flag
- `error`
  - fetch failure
  - parse failure
  - schema validation failure
  - publication failure

### Performance considerations

- Expected runtime: comfortably under the 15-minute schedule if NWS calls are made in small bounded batches
- Parallelization opportunities:
  - fetch per-point forecast/gridpoint requests in parallel with bounded concurrency
  - fetch the 4 station observations in parallel
  - fetch the 4 alert queries in parallel
- Bounded concurrency matters because NWS publishes no numeric rate limit

## 9. INTEGRATION with Workflow-08 and Publication

- Workflow-08 consumes:
  - the published normalized lane envelope `data/connectors/published/02_WEATHER/current.json`
  - source-health and freshness metadata inside that envelope
  - provenance fields and alert ownership metadata
- Workflow-08 uses lane 02 for:
  - route weather observations and forecast-derived risk
  - official weather alerts that are meteorological and weather-owned
- Lane 02 responsibility:
  - fetch, normalize, validate, and publish honest internal weather data
  - exclude alert types owned by other lanes
  - preserve uncertainty where station coverage is weak
- Workflow-08 responsibility:
  - cross-lane deduplication
  - deployment gating
  - rider-facing artifact generation
  - any cross-lane severity rollup mapping
- Deduplication boundary:
  - lane 02 should already exclude lane-03, lane-04, and lane-05-owned NWS products
  - workflow-08 should still defend against duplicates by preferring the owning lane if the same NWS alert ID ever appears in multiple lane outputs
- Publication timing:
  - the lane publishes internal artifacts after each successful or degraded-valid run
  - site republication is workflow-08's decision, not lane 02's

## 10. TESTING and Validation Strategy

- Unit tests:
  - `NWS-01` redirect-follow logic
  - `validTime` interval expansion for `NWS-04`
  - null-safe handling of `heatIndex`, `windChill`, `iceAccumulation`, `temperatureTrend`
  - threshold evaluation against known sample values
  - alert allowlist / denylist behavior
- Integration tests:
  - fetch each approved NWS source live with the descriptive `User-Agent`
  - verify all 8 route points resolve to `SEW`
  - verify county `WAC033` and forecast zones `WAZ313`, `WAZ314`, `WAZ315`
  - verify 4-station observation branch returns parseable payloads
- Regression tests:
  - confirm the route-point/station mapping matches the researched assignments
  - confirm the connector excludes `Air Quality Alert` from lane 02 output
  - confirm `SEAW1` limited-field behavior does not cause false station-complete claims
- Mock tests:
  - use saved `sample-responses/WP1_gridData.json`
  - use saved `sample-responses/obs_KRNT_latest.json`
  - use saved `sample-responses/alerts_area_WA.json` to prove alert filtering removes off-lane alert families
- Failure tests:
  - simulate `NWS-04` timeout
  - simulate malformed `validTime`
  - simulate `NWS-05` stale observation timestamp
  - simulate missing `WSDOT_TRAVELER_API_ACCESS_CODE`
  - simulate `NWS-06` alert with `geometry: null`
- Evidence of test success:
  - every test records pass/fail with source ID and case ID
  - a valid test run must show:
    - no schema failures on the illustrative normalized output
    - no duplicate alerts after merge
    - correct use of `updateTime` for freshness
    - correct stale/degraded behavior when a source is intentionally failed

## 11. MONITORING and Observability

- Key metrics:
  - fetch success rate per source
  - average source age in minutes
  - count of stale sources per run
  - count of active official weather alerts
  - count of threshold-derived advisories by severity
  - count of route points using `forecast_primary_station_corroboration`
- Alert conditions for humans:
  - all NWS forecast branches stale for more than 2 hours
  - alerts branch stale for more than 30 minutes
  - zero successful source fetches in a run
  - repeated validation failure across 2 or more runs
  - unexpected publication halt or inability to update last-known-good
- Rider-facing status text that workflow-08 should be able to surface:
  - "Weather data current as of HH:MM UTC"
  - "Route-point conditions for WP4/WP5/WP7/WP8 use forecast-primary current-condition estimates because no nearby full-featured station was verified"
- Debugging order for operators:
  1. latest raw landing payload for the failing source
  2. latest validation log entries
  3. `health/02_WEATHER/status.json`
  4. last-known-good artifact
  5. the source website/API itself

## 12. KNOWN RISKS and Mitigations

- Sparse full-featured observation coverage in the eastern two-thirds of the route
  - mitigation: use `NWS-04` as the primary current-condition proxy there and preserve the limitation explicitly
- Some rider-threshold numbers remain unresolved
  - mitigation: keep thresholds configurable and mark unresolved items in metadata until owner approval
- NWS numeric rate limit not published
  - mitigation: bound concurrency, use the 15-minute parent schedule with due checks, and retry only once
- WSDOT could add useful pavement data but is still access-gated
  - mitigation: keep WSDOT optional-only until authenticated retesting succeeds
- Alert overlap with other lanes
  - mitigation: explicit event-type filter in lane 02, plus workflow-08 dedup guardrails
- Browser/site cache freshness after workflow-08 publication
  - mitigation: outside lane 02; workflow-08 and deployment configuration must handle site cache headers and invalidation

## 13. DEFERRED Decisions and Open Questions

- Final owner-approved threshold policy for unresolved wind, fog, and heat criteria
  - deferred to threshold approval / production policy phase
- WSDOT authenticated route-relevance retest
  - deferred until `WSDOT_TRAVELER_API_ACCESS_CODE` is available and a follow-up source test is run
- Full NWS observation quality-control code table handling
  - deferred to implementation hardening before production go-live
- Workflow-08 mandatory vs optional lane deployment gating
  - deferred to `DEC-006`
- Cloudflare/CDN publication behavior
  - deferred to workflow-08 and deployment phase
- Notification channel for unattended failures
  - deferred to `DEC-013`

## 14. RESEARCH TRACEABILITY

- MVP source set `NWS-01` through `NWS-06`
  - `IMPLEMENTATION_RECOMMENDATION.md`
  - `UW_ISSY_02_WEATHER_IMPLEMENTATION_RECOMMENDATION_v1.md`
  - `SOURCE_REGISTRY.json`
- WSDOT optional-only and unresolved
  - `SOURCE_REGISTRY.json`
  - `RESEARCH_FINDINGS.md`
  - `API_AND_FEED_TEST_RESULTS.md`
  - `UW_ISSY_02_WEATHER_AUDIT_REPORT_v1.md`
  - `DEC-007` in `00_OPEN_CONNECTOR_ARCHITECTURE_DECISIONS.md`
- Rejected UW rooftop station
  - `RESEARCH_FINDINGS.md`
  - `API_AND_FEED_TEST_RESULTS.md`
  - `SOURCE_REGISTRY.json`
- One complete workflow every 15 minutes, no overlapping runs
  - `DEC-005` in `00_OPEN_CONNECTOR_ARCHITECTURE_DECISIONS.md`
- Use internal `data/connectors/` artifact classes and keep workflow-08 separate from connector publication
  - `00_SHARED_AUTONOMOUS_CONNECTOR_BUILD_STANDARD.md`
  - `DEC-001`
  - `DEC-002`
  - `00_CDM_CONNECTOR_LESSONS_APPLIED.md`
- Validator-bound artifact set includes raw, normalized, candidate, published, last-known-good, health, evidence, logs, quarantine, schemas, manifests, and handoff directories
  - `00_SHARED_AUTONOMOUS_CONNECTOR_BUILD_STANDARD.md`
  - `DEC-001`
  - `DEC-002`
- Route relevance via the 8 approved route weather points and zone/county alert matching
  - `ROUTE_WEATHER_POINT_MAPPING.md`
  - `RESEARCH_FINDINGS.md`
  - `API_AND_FEED_TEST_RESULTS.md`
- Alert ownership filter excluding Air Quality and Fire Weather families
  - `SOURCE_GAPS.md`
  - `WEATHER_THRESHOLD_RECOMMENDATIONS.md`
  - `RESEARCH_FINDINGS.md`
  - `API_AND_FEED_TEST_RESULTS.md`
- Freshness thresholds:
  - forecasts/grid data 60 minutes
  - observations 90 minutes
  - alerts 15 minutes
  - metadata weekly revalidation
  - grounded in `IMPLEMENTATION_RECOMMENDATION.md`, `UW_ISSY_02_WEATHER_IMPLEMENTATION_RECOMMENDATION_v1.md`, and per-source `recommended_freshness_threshold` values in `SOURCE_REGISTRY.json`
- Need to use `updateTime`, not `generatedAt`
  - `RESEARCH_FINDINGS.md`
  - `API_AND_FEED_TEST_RESULTS.md`
- Need to expand `validTime` intervals and handle explicit `null` source values
  - `RESEARCH_FINDINGS.md`
  - `API_AND_FEED_TEST_RESULTS.md`
  - `SOURCE_REGISTRY.json`
- Observation sparsity for WP4/WP5/WP7/WP8
  - `SOURCE_GAPS.md`
  - `ROUTE_WEATHER_POINT_MAPPING.md`
  - `UW_ISSY_02_WEATHER_FINAL_RESEARCH_REPORT_v1.md`
  - `UW_ISSY_02_WEATHER_AUDIT_REPORT_v1.md`
- Last-known-good preservation, degraded-source handling, atomic writes, and source-health separation
  - `00_SHARED_AUTONOMOUS_CONNECTOR_BUILD_STANDARD.md`
  - `00_CDM_CONNECTOR_LESSONS_APPLIED.md`
  - `IMPLEMENTATION_RECOMMENDATION.md`
  - `UW_ISSY_02_WEATHER_IMPLEMENTATION_RECOMMENDATION_v1.md`
- Honest readiness statement that the lane is build-ready but still has unresolved threshold-policy items
  - `WEATHER_THRESHOLD_RECOMMENDATIONS.md`
  - `UW_ISSY_02_WEATHER_AUDIT_REPORT_v1.md`
  - `DEC-003` in `00_OPEN_CONNECTOR_ARCHITECTURE_DECISIONS.md`
