# 05_FLOOD_CONDITIONS_EXECUTABLE_BUILD_SPECIFICATION_v1

## 1. Overview

- Lane ID: `05_FLOOD_CONDITIONS`
- Lane name: `UW-Issaquah Flood Conditions Connector`
- Purpose: publish route-relevant flood observations, forecasts, official alerts, and flood-caused closure context so riders can distinguish between elevated water, probable route impact, and confirmed access disruption. The strongest coverage is at the Lake Sammamish State Park / Issaquah Creek terminus. The connector must state explicitly that the Sammamish River / Marymoor middle corridor still lacks a verified direct live runtime gauge. Grounding: `RESEARCH_FINDINGS.md`, `ROUTE_RELEVANCE_AND_THRESHOLDS.md`, `UW_ISSY_05_FLOOD_CONDITIONS_FINAL_RESEARCH_REPORT_v1.md`, `UW_ISSY_05_FLOOD_CONDITIONS_AUDIT_REPORT_v1.md`.
- Approved MVP source set:
  - `USGS-01`
  - `USGS-02`
  - `NWPS-01`
  - `NWS-01`
  - `ISS-01`
  Grounding: `IMPLEMENTATION_RECOMMENDATION.md`, `UW_ISSY_05_FLOOD_CONDITIONS_IMPLEMENTATION_RECOMMENDATION_v1.md`.
- Approved secondary source set:
  - `USGS-03`
  - `NWPS-02`
  - `REDM-01`
  - `KC-ROAD-01`
  - `WSDOT-01`
  Grounding: `IMPLEMENTATION_RECOMMENDATION.md`, `ENV_AND_READINESS.md`, `SOURCE_REGISTRY.json`.
- High-level data flow: `fetch -> land raw -> validate payload shape and timestamps -> normalize source records -> apply route relevance -> derive route impact -> merge lane envelope -> validate merged envelope -> write normalized/candidate/published/LKG/health/evidence artifacts`.
- Integration with workflow-08: this connector writes only internal connector artifacts under `data/connectors/{raw,normalized,candidate,published,last_known_good,health,evidence,logs,quarantine,schemas,manifests,handoff}/05_FLOOD_CONDITIONS/`. Workflow `08_ASSEMBLE_VALIDATE_BUILD_DEPLOY` consumes the lane published envelope and lane handoff record, performs cross-lane deduplication and publication gating, and alone writes rider-facing `public/data/` artifacts. Grounding: `00_SHARED_AUTONOMOUS_CONNECTOR_BUILD_STANDARD.md`, `00_OPEN_CONNECTOR_ARCHITECTURE_DECISIONS.md`, `OVERLAP_NOTES.md`.
- Shared standards:
  - Binding shared standard: `00_SHARED_AUTONOMOUS_CONNECTOR_BUILD_STANDARD.md`
  - Binding architecture decisions: `00_OPEN_CONNECTOR_ARCHITECTURE_DECISIONS.md`
  - Applied connector lessons: `00_CDM_CONNECTOR_LESSONS_APPLIED.md`
- Readiness statement: the lane is ready for connector build with an explicit observability limitation, not for claims of full direct flood sensing across the whole corridor. Grounding: `UW_ISSY_05_FLOOD_CONDITIONS_AUDIT_REPORT_v1.md`.

## 2. SOURCE ACQUISITION STRATEGY

### 2.1 MVP sources

#### `USGS-01`

- Owning agency: `U.S. Geological Survey`
- Acquisition method: direct REST API `https://waterservices.usgs.gov/nwis/iv/?format=json&sites=12121600&parameterCd=00060,00065`
- Role: strongest direct observed route-end signal for Issaquah Creek near the route terminus
- Fetch cadence: every `15 minutes`
- Optimal freshness threshold: stale when newest `dateTime` is older than `30 minutes`
- Environment variables: none
- Authentication flow: none
- Error handling and documented failure modes:
  - HTTP non-`200` -> source `failed`
  - `200` with zero `timeSeries` -> source `failed`
  - missing both `00060` and `00065` -> source `failed_validation`
  - latest observation older than `30 minutes` -> source `stale`
- Rate limiting: no numeric limit observed; tested `cache-control: max-age=900`, so do not poll faster than `15 minutes`
- Network requirements: reachable from the tested environment; no bot, JS, or geo restrictions observed
- Fallback source: `NWPS-01` for official current/forecast context, then merged lane LKG
- Last-known-good strategy: preserve per-source normalized snapshot for up to `24 hours`
- Grounding: `API_AND_FEED_TEST_RESULTS.md` Test 2, `ENV_AND_READINESS.md`, `SOURCE_REGISTRY.json`

#### `USGS-02`

- Owning agency: `U.S. Geological Survey`
- Acquisition method: direct REST API `https://waterservices.usgs.gov/nwis/iv/?format=json&sites=12120600&parameterCd=00060,00065`
- Role: upstream Hobart lead-time gauge used by Issaquah local flood guidance
- Fetch cadence: every `15 minutes`
- Optimal freshness threshold: stale when newest `dateTime` is older than `30 minutes`
- Environment variables: none
- Authentication flow: none
- Error handling and documented failure modes:
  - HTTP non-`200`
  - `200` with zero `timeSeries`
  - missing parameter series after successful response
  - stale latest observation
- Rate limiting: tested `cache-control: max-age=900`
- Network requirements: reachable; no bot or geo restrictions observed
- Fallback source: `NWPS-02`, then merged lane LKG
- Last-known-good strategy: preserve per-source normalized snapshot for up to `24 hours`
- Special relevance rule: this source is about `10.934 km` from the route and is admitted only because `ISS-01` explicitly states Hobart provides `3` to `4` hours of lead time for Issaquah flooding
- Grounding: `API_AND_FEED_TEST_RESULTS.md` Test 3, `RESEARCH_FINDINGS.md`, `ROUTE_RELEVANCE_AND_THRESHOLDS.md`, `SOURCE_REGISTRY.json`

#### `NWPS-01`

- Owning agency: `NOAA National Weather Service / Office of Water Prediction`
- Acquisition method:
  - `https://api.water.noaa.gov/nwps/v1/gauges/ISSW1`
  - `https://api.water.noaa.gov/nwps/v1/gauges/ISSW1/stageflow`
  - `https://api.water.noaa.gov/nwps/v1/gauges/ISSW1/ratings`
- Role: canonical official flood-category and forecast source for the route terminus
- Fetch cadence:
  - status endpoint every `15 minutes`
  - stageflow every `60 minutes`
  - ratings every `60 minutes`
- Optimal freshness threshold:
  - `status.observed.validTime` stale after `30 minutes`
  - `status.forecast.validTime` or `stageflow.issuedTime` stale after `6 hours`
  - ratings metadata may be reused until explicitly superseded
- Environment variables: none
- Authentication flow: none
- Error handling and documented failure modes:
  - HTTP non-`200`
  - missing `flood.categories`
  - stale observed timestamp
  - empty or sentinel-only forecast arrays
  - malformed ratings payload
- Rate limiting: no numeric limits observed
- Network requirements: reachable; no bot or geo restrictions observed
- Fallback source: `USGS-01` for current observation, `NWS-01` for federal alert context, merged lane LKG for already-published forecast context
- Last-known-good strategy:
  - status LKG for up to `24 hours`
  - forecast/stageflow LKG for up to `24 hours`
  - ratings metadata LKG for up to `30 days`
- Grounding: `API_AND_FEED_TEST_RESULTS.md` Tests 6 and 7, `IMPLEMENTATION_RECOMMENDATION.md`, `SOURCE_REGISTRY.json`

#### `NWS-01`

- Owning agency: `NOAA National Weather Service`
- Acquisition method:
  - point health check `https://api.weather.gov/alerts/active?point=47.6505,-122.3046`
  - event queries for `Flood Warning`, `Flood Watch`, `Flash Flood Warning`, and `Flood Advisory` in `WA`
- Role: canonical federal flood-alert layer for this lane
- Fetch cadence: every `15 minutes`
- Optimal freshness threshold: top-level `updated` stale after `15 minutes`
- Environment variables: none
- Authentication flow: none; send a descriptive `User-Agent`
- Error handling and documented failure modes:
  - HTTP non-`200`
  - malformed GeoJSON
  - stale `updated`
  - empty collection is valid and must be recorded as `empty_but_valid`
- Rate limiting: tested `cache-control: public, max-age=5, s-maxage=5`; no numeric limit observed
- Network requirements: reachable; no geo restrictions observed
- Fallback source: none for equivalent federal alert truth; use merged lane LKG for short retention only
- Last-known-good strategy: preserve alert-set LKG for up to `60 minutes`; after `60 minutes`, mark alert coverage degraded and stop reusing the prior alert set
- Grounding: `API_AND_FEED_TEST_RESULTS.md` Test 9, `OVERLAP_NOTES.md`, `SOURCE_REGISTRY.json`

#### `ISS-01`

- Owning agency: `City of Issaquah`
- Acquisition method: structured HTML scrape from `https://www.issaquahwa.gov/flood`
- Role: official local phase semantics and lead-time interpretation; not the primary live water-status feed
- Fetch cadence: `24 hours`, plus manual rerun whenever parser drift is detected
- Optimal freshness threshold: `24 hours` for the policy snapshot
- Environment variables: none
- Authentication flow: none
- Error handling and documented failure modes:
  - HTTP non-`200`
  - missing threshold text for Phases `I` through `IV`
  - structural HTML drift preventing extraction
- Rate limiting: none documented; daily polling is sufficient
- Network requirements: reachable; no bot or geo restrictions observed
- Fallback source: last validated local threshold snapshot only
- Last-known-good strategy: preserve the validated threshold snapshot for up to `30 days`
- Grounding: `API_AND_FEED_TEST_RESULTS.md` Test 12, `ROUTE_RELEVANCE_AND_THRESHOLDS.md`, `ENV_AND_READINESS.md`, `SOURCE_REGISTRY.json`

### 2.2 Secondary sources

#### `USGS-03`

- Owning agency: `U.S. Geological Survey`
- Acquisition method: direct REST API `https://waterservices.usgs.gov/nwis/iv/?format=json&sites=12122000`
- Role: Lake Sammamish shoreline context only
- Fetch cadence: every `15 minutes`
- Optimal freshness threshold: `30 minutes`
- Environment variables: none
- Authentication flow: none
- Error handling and documented failure modes:
  - HTTP non-`200`
  - missing `62614` series
  - stale latest observation
- Rate limiting: tested `cache-control: max-age=900`
- Network requirements: reachable
- Fallback source: none required; this source is optional
- Last-known-good strategy: preserve per-source snapshot for up to `24 hours`
- Constraint: this source must never independently escalate beyond `elevated_water`
- Grounding: `API_AND_FEED_TEST_RESULTS.md` Test 4, `ROUTE_RELEVANCE_AND_THRESHOLDS.md`, `SOURCE_REGISTRY.json`

#### `NWPS-02`

- Owning agency: `NOAA National Weather Service / Office of Water Prediction`
- Acquisition method:
  - `https://api.water.noaa.gov/nwps/v1/gauges/ISQW1`
  - optional `stageflow` and `ratings` endpoints
- Role: NOAA-form corroboration for the upstream Hobart point
- Fetch cadence:
  - status every `15 minutes`
  - optional stageflow/ratings every `60 minutes`
- Optimal freshness threshold: `30 minutes` for observed status
- Environment variables: none
- Authentication flow: none
- Error handling and documented failure modes:
  - HTTP non-`200`
  - stale observed timestamp
  - empty observed section
  - absence of forecast/categories is expected and not a failure
- Rate limiting: no numeric limits observed
- Network requirements: reachable
- Fallback source: `USGS-02`
- Last-known-good strategy: preserve per-source snapshot for up to `24 hours`
- Grounding: `API_AND_FEED_TEST_RESULTS.md` Test 8, `SOURCE_REGISTRY.json`

#### `REDM-01`

- Owning agency: `City of Redmond`
- Acquisition method: ArcGIS REST FeatureServer metadata and layer queries under `https://gis.redmond.gov/arcgis/rest/services/Traffic/Alerts/FeatureServer`
- Role: closure supplement for Redmond and West Lake Sammamish Parkway approach segments
- Fetch cadence: every `60 minutes`
- Optimal freshness threshold: `60 minutes`
- Environment variables: none
- Authentication flow: none
- Error handling and documented failure modes:
  - HTTP non-`200`
  - dead layer query
  - malformed JSON
  - empty valid layers are acceptable
- Rate limiting: no numeric limits observed
- Network requirements: reachable
- Fallback source: lane `01_ROUTE_CONDITIONS` closure truth in workflow-08 merge
- Last-known-good strategy: preserve per-source snapshot for up to `24 hours`
- Grounding: `API_AND_FEED_TEST_RESULTS.md` Test 13, `ENV_AND_READINESS.md`, `SOURCE_REGISTRY.json`

#### `KC-ROAD-01`

- Owning agency: `King County Road Services Division`
- Acquisition method: ArcGIS REST MapServer query under `https://gismaps.kingcounty.gov/arcgis/rest/services/RoadAlerts/KingCo_Road_Alerts/MapServer`
- Role: low-probability county-road closure supplement
- Fetch cadence: every `60 minutes`
- Optimal freshness threshold: `60 minutes`
- Environment variables: none
- Authentication flow: none
- Error handling and documented failure modes:
  - HTTP non-`200`
  - broken service metadata
  - malformed query response
  - zero current features is valid
- Rate limiting: no numeric limits observed
- Network requirements: reachable
- Fallback source: `REDM-01` and lane `01_ROUTE_CONDITIONS`
- Last-known-good strategy: preserve per-source snapshot for up to `24 hours`
- Grounding: `API_AND_FEED_TEST_RESULTS.md` Test 14, `ENV_AND_READINESS.md`, `SOURCE_REGISTRY.json`

#### `WSDOT-01`

- Owning agency: `Washington State Department of Transportation`
- Acquisition method: WSDOT Traveler Information API Highway Alerts REST
- Role: state-highway crossing and detour supplement only
- Fetch cadence: every `60 minutes`
- Optimal freshness threshold: `60 minutes`
- Environment variables: `WSDOT_TRAVELER_API_ACCESS_CODE`
- Authentication flow:
  - read `WSDOT_TRAVELER_API_ACCESS_CODE` from the n8n environment
  - inject it into the WSDOT request as the required access-code parameter
  - if absent, mark source `not_run` and continue because the source is optional
- Error handling and documented failure modes:
  - HTTP auth failure
  - malformed array payload
  - route-targeted empty array is valid
  - authenticated transport success with unusable payload -> `failed_validation`
- Rate limiting: no numeric limits observed
- Network requirements: reachable from the tested environment when the credential is present; no geo restriction observed in the research
- Fallback source: lane `01_ROUTE_CONDITIONS` closure truth
- Last-known-good strategy: preserve per-source snapshot for up to `24 hours`
- Grounding: `API_AND_FEED_TEST_RESULTS.md` Test 15, `ENV_AND_READINESS.md`, `SOURCE_REGISTRY.json`

## 3. Normalization and Validation

### 3.1 Normalized output schema

- The authoritative top-level contract is the shared connector envelope from `00_SHARED_AUTONOMOUS_CONNECTOR_BUILD_STANDARD.md`.
- Lane payload usage:
  - `events[]` for discrete alerts, gauge-derived hazard records, and flood-caused closure records
  - `observations[]` for policy thresholds, context-only lake readings, and non-discrete monitoring notes
  - `route_sections[]` for section summaries
  - `source_health[]` for per-source runtime status
  - `connector_health` for merge/publication status
  - `validation_state` for schema/freshness/dedup result
  - `metadata` for limitations, run settings, and diagnostic notes

### 3.2 Illustrative JSON example

The JSON below is illustrative only. It uses real field names and live-tested source values, but it does not claim a live flood incident at publication time.

```json
{
  "schema_version": "1.0.0",
  "connector_id": "05_FLOOD_CONDITIONS",
  "connector_name": "UW-Issaquah Flood Conditions Connector",
  "connector_version": "v0001",
  "lane": "05_FLOOD_CONDITIONS",
  "run_id": "05_FLOOD_CONDITIONS-20260731T190000Z-001",
  "generated_at": "2026-07-31T19:00:00Z",
  "published_at": "2026-07-31T19:00:03Z",
  "data_status": "ok",
  "freshness": {
    "overall_state": "fresh",
    "computed_at": "2026-07-31T19:00:03Z",
    "oldest_relevant_source_age_minutes": 15,
    "stale_source_ids": []
  },
  "manifest_ref": {
    "manifest_id": "05_FLOOD_CONDITIONS-v0001",
    "schema_version": "1.0.0"
  },
  "source_health": [
    {
      "schema_version": "1.0.0",
      "connector_id": "05_FLOOD_CONDITIONS",
      "source_id": "05_FLOOD_CONDITIONS:USGS-01",
      "source_name": "USGS IV service - Issaquah Creek near mouth near Issaquah (12121600)",
      "status": "ok",
      "retrieved_at": "2026-07-31T18:59:15Z",
      "stale_after_minutes": 30,
      "record_count": 2,
      "http_status": 200,
      "last_observation_at": "2026-07-31T18:45:00Z",
      "warnings": [],
      "errors": []
    },
    {
      "schema_version": "1.0.0",
      "connector_id": "05_FLOOD_CONDITIONS",
      "source_id": "05_FLOOD_CONDITIONS:NWPS-01",
      "source_name": "NOAA National Water Prediction Service - Issaquah Creek near Issaquah (ISSW1)",
      "status": "ok",
      "retrieved_at": "2026-07-31T18:59:22Z",
      "stale_after_minutes": 30,
      "record_count": 3,
      "http_status": 200,
      "last_observation_at": "2026-07-31T18:45:00Z",
      "warnings": [],
      "errors": []
    }
  ],
  "connector_health": {
    "schema_version": "1.0.0",
    "connector_id": "05_FLOOD_CONDITIONS",
    "status": "ok",
    "failed_stage": null,
    "warning_count": 0,
    "error_count": 0,
    "used_last_known_good": false,
    "candidate_written": true,
    "published_written": true
  },
  "events": [
    {
      "event_id": "05_FLOOD_CONDITIONS:USGS-01:2026-07-31T18:45:00Z",
      "event_type": "gauge_observation",
      "status": "monitoring",
      "severity": "advisory",
      "route_impact": "elevated_water",
      "title": "Issaquah Creek near route terminus observed below official flood category",
      "summary": "Observed stage and flow are current at the route terminus and remain below NWPS action and flood categories.",
      "source_id": "05_FLOOD_CONDITIONS:USGS-01",
      "source_event_ref": "12121600",
      "observed_at": "2026-07-31T18:45:00Z",
      "effective_until": null,
      "official_category": "below_action",
      "metric": {
        "metric_name": "stage_ft",
        "metric_value": 3.79,
        "secondary_metric_name": "flow_cfs",
        "secondary_metric_value": 21.5,
        "unit": "ft"
      },
      "location": {
        "name": "Issaquah Creek near mouth near Issaquah",
        "latitude": 47.5525,
        "longitude": -122.0467,
        "route_section_ids": [
          "section_06_issaquah_terminus"
        ]
      },
      "route_relevance": {
        "method": "point_to_route_distance",
        "distance_km": 0.173,
        "confidence": "high",
        "reason": "Gauge lies within 3 km of the GPX and directly monitors the route terminus."
      },
      "provenance": {
        "source_url": "https://waterservices.usgs.gov/nwis/iv/?format=json&sites=12121600&parameterCd=00060,00065",
        "retrieved_at": "2026-07-31T18:59:15Z",
        "source_record_hash": "illustrative-only"
      }
    }
  ],
  "observations": [
    {
      "observation_id": "05_FLOOD_CONDITIONS:ISS-01:phase-thresholds",
      "observation_type": "policy_threshold",
      "title": "City of Issaquah flood phase thresholds",
      "summary": "Phase I begins at 6.5 ft and rising at Hobart; Phase II begins at 7.5 ft and rising.",
      "source_id": "05_FLOOD_CONDITIONS:ISS-01",
      "observed_at": "2026-07-31T00:00:00Z",
      "route_section_ids": [
        "section_06_issaquah_terminus"
      ],
      "metric": null,
      "notes": "Illustrative policy reference only."
    }
  ],
  "route_sections": [
    {
      "route_section_id": "section_06_issaquah_terminus",
      "label": "Lake Sammamish State Park / Issaquah Creek terminus",
      "status": "monitoring",
      "route_impact": "elevated_water",
      "supporting_source_ids": [
        "05_FLOOD_CONDITIONS:USGS-01",
        "05_FLOOD_CONDITIONS:NWPS-01",
        "05_FLOOD_CONDITIONS:ISS-01"
      ]
    }
  ],
  "provenance": {
    "source_ids_used": [
      "05_FLOOD_CONDITIONS:USGS-01",
      "05_FLOOD_CONDITIONS:NWPS-01",
      "05_FLOOD_CONDITIONS:ISS-01"
    ],
    "route_gpx_ref": "data/route/UnivWA-Issaquah.gpx",
    "source_payload_refs": [
      "data/connectors/raw/05_FLOOD_CONDITIONS/usgs_01/usgs_01_landing_20260731T185915Z.json",
      "data/connectors/raw/05_FLOOD_CONDITIONS/nwps_01/nwps_01_status_landing_20260731T185922Z.json"
    ],
    "normalization_notes": [
      "Illustrative example only.",
      "No active flood alert is implied by this sample."
    ]
  },
  "validation_state": {
    "schema_valid": true,
    "freshness_valid": true,
    "dedup_valid": true,
    "published_from_candidate": true
  },
  "metadata": {
    "coverage_limitations": [
      "No verified direct live Sammamish River gauge is in the approved runtime set."
    ],
    "optional_sources_not_run": [],
    "stale_data_fields": []
  }
}
```

### 3.3 Required fields

- Required top-level fields:
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
- Required event fields:
  - `event_id`
  - `event_type`
  - `status`
  - `severity`
  - `route_impact`
  - `title`
  - `summary`
  - `source_id`
  - `observed_at`
  - `location`
  - `route_relevance`
  - `provenance`
- Required observation fields:
  - `observation_id`
  - `observation_type`
  - `title`
  - `summary`
  - `source_id`
  - `observed_at`

### 3.4 Optional fields

- Event fields that may be `null` or omitted when the source does not provide them:
  - `source_event_ref`
  - `effective_until`
  - `official_category`
  - `metric`
  - `location.latitude`
  - `location.longitude`
  - `location.route_section_ids`
- Observation optional fields:
  - `route_section_ids`
  - `metric`
  - `notes`
- Top-level optional arrays:
  - `advisories`
  - `ownership_annotations`

### 3.5 Enum-like fields and valid values

- `data_status`:
  - `ok`
  - `degraded`
  - `stale`
  - `no_relevant_events`
  - `failed_validation`
  - `failed_fetch`
  - `blocked`
  - `using_last_known_good`
- `event_type`:
  - `gauge_observation`
  - `gauge_forecast`
  - `nws_alert`
  - `closure_confirmation`
  - `policy_threshold`
  - `derived_context`
- `status`:
  - `active`
  - `monitoring`
  - `resolved`
  - `expired`
- `severity`:
  - `info`
  - `advisory`
  - `watch`
  - `warning`
  - `severe`
- `route_impact`:
  - `no_known_route_impact`
  - `elevated_water`
  - `watch`
  - `probable_route_impact`
  - `forecast_flooding`
  - `observed_flooding`
  - `warning`
  - `confirmed_route_closure`
- `source_health[].status`:
  - `ok`
  - `degraded`
  - `failed`
  - `stale`
  - `blocked`
  - `not_run`
  - `empty_but_valid`

### 3.6 Timestamp fields and semantics

- All timestamps must be RFC 3339 / ISO-8601 UTC strings ending in `Z`
- `generated_at`: when the merged connector envelope was assembled
- `published_at`: when the candidate artifact was promoted to the lane published artifact; may be `null` before promotion
- `retrieved_at`: when the workflow fetched a source payload
- `last_observation_at`: newest source timestamp used in `source_health`
- `observed_at`: source-provided observation or event time
- `effective_until`: alert expiration or closure end time if present
- `freshness.computed_at`: when freshness state was derived
- Future timestamps more than `5 minutes` ahead of workflow time are invalid and must degrade to unknown/stale, not fresh

### 3.7 Geographic fields

- Coordinate format: decimal degrees in `EPSG:4326`
- `location.latitude` and `location.longitude`: source point, geometry centroid, or query-derived representative point
- `location.route_section_ids`: affected route sections
- `route_relevance.distance_km`: minimum computed distance to the canonical GPX when point or geometry distance is used
- `route_relevance.method` allowed values:
  - `point_to_route_distance`
  - `upstream_relationship`
  - `polygon_intersection`
  - `named_facility_match`
  - `roadway_match`
  - `bbox_prefilter_then_intersection`
- `route_relevance.reason`: deterministic plain-language explanation of why the item was retained

### 3.8 Source attribution and provenance

- Published `source_id` values must be globally namespaced, for example `05_FLOOD_CONDITIONS:USGS-01`
- Every event must include:
  - `source_id`
  - `provenance.source_url`
  - `provenance.retrieved_at`
- Top-level `provenance` must include:
  - `source_ids_used`
  - `route_gpx_ref`
  - `source_payload_refs`
  - `normalization_notes`

### 3.9 Validators run on every publication

- Schema validation:
  - shared envelope fields present
  - lane-required event and observation fields present
  - arrays present even when empty
- Coordinate validation:
  - coordinates numeric and within the route operating envelope
  - point/geometry distance computed against `data/route/UnivWA-Issaquah.gpx`
- Timestamp freshness validation:
  - source timestamps present when required
  - freshness thresholds enforced per source
  - future timestamps fail safely
- Source-health validation:
  - documented failure modes mapped into `source_health`
  - source status distinct from rider hazard severity
- Deduplication validation:
  - same source event not emitted twice in one run
  - same real-world closure/flood pair flagged for workflow-08 merge rather than duplicated

### 3.10 Validation failure behavior

- Record-level failure:
  - log the failure
  - skip the invalid record
  - continue the source branch if other records remain valid
- Source-level failure:
  - mark the source degraded/failed/stale
  - preserve prior published/LKG artifacts
  - continue with remaining sources
- Envelope-level failure:
  - do not overwrite `data/connectors/published/05_FLOOD_CONDITIONS/current.json`
  - quarantine the failed candidate
  - emit degraded connector health

## 4. ROUTE RELEVANCE CALCULATION

- Reference basis: `ROUTE_RELEVANCE_AND_THRESHOLDS.md`
- Canonical geometry: `data/route/UnivWA-Issaquah.gpx`

### 4.1 Decision by source type

- Gauge and forecast points:
  - direct route gauges within `3 km` of the GPX may affect only the nearest relevant section
  - gauges outside `3 km` but inside `5 km` may be used only if they clearly monitor the same water body and the mapped section is explicit
  - gauges outside `5 km` are excluded unless they are an approved official upstream exception
  - approved upstream exception in this lane: `USGS-02` and `NWPS-02` because `ISS-01` explicitly uses Hobart as lead-time guidance
- Alert polygons:
  - use geometry intersection when geometry is present
  - use CAP geocodes / affected zones / county codes as corroboration, not replacement
  - use route-point query fallback only when polygon handling is unavailable
- Closure sources:
  - require geometry buffer or explicit roadway/facility match
  - require flood-related text such as `flood`, `standing water`, `washout`, `drainage failure`, or `water over roadway`
  - never accept keyword-only matching without geometry or roadway validation
- Named-facility logic:
  - retain matches for `Burke-Gilman Trail`, `Sammamish River Trail`, `Marymoor Park`, `East Lake Sammamish Trail`, and `Lake Sammamish State Park`
- Lake Sammamish rule:
  - `USGS-03` may produce `elevated_water` context only
  - it must not independently produce `warning`, `observed_flooding`, or `confirmed_route_closure`

### 4.2 n8n implementation sketch

1. Load the canonical GPX and precompute route sections and route-point arrays.
2. For each source record, normalize any point or geometry into `EPSG:4326`.
3. Compute minimum point-to-route distance for point sources.
4. For geometry-capable alert or closure sources:
   - run a coarse bounding-box prefilter
   - then run actual geometry intersection against a local route buffer
5. Apply source-specific rules:
   - `USGS-01` / `NWPS-01` -> direct point rule
   - `USGS-02` / `NWPS-02` -> upstream exception rule
   - `USGS-03` -> shoreline context rule
   - `NWS-01` -> polygon or point-fallback rule
   - `REDM-01`, `KC-ROAD-01`, `WSDOT-01` -> geometry plus flood-text rule
6. Assign retained records to one or more route sections, never route-wide by default.

### 4.3 Edge cases and fallback logic

- Ambiguous citywide text with no route landmark:
  - downgrade confidence
  - do not publish as route-impacting unless a geometry or named-facility match exists
- Source geometry absent but roadway text exact:
  - retain only if the roadway/facility clearly intersects the route
- Upstream gauge exceeds a local threshold but downstream route-end data is quiet:
  - publish `watch` or `probable_route_impact` for the Issaquah-end section, not a route-wide closure state
- Multiple sources describe the same flood-caused closure:
  - emit one lane event annotated for workflow-08 merge with lane 01 closure truth

### 4.4 Geographic bounds check

- Strict route operating envelope from the research basis:
  - latitude `47.55207` to `47.75889`
  - longitude `-122.3057` to `-122.04414`
- Points outside that envelope may still be retained only when they qualify as the approved upstream Hobart exception.
- Geometry sources may intersect buffered route sections even if their overall feature bounds extend outside the route envelope.

## 5. FRESHNESS, FAILURE, AND FALLBACK

### 5.1 Freshness rules

- `USGS-01`, `USGS-02`, `USGS-03`:
  - newest observation must be younger than `30 minutes`
- `NWPS-01`, `NWPS-02` observed status:
  - observed time must be younger than `30 minutes`
- `NWPS-01` forecast:
  - `status.forecast.validTime` or `stageflow.issuedTime` must be younger than `6 hours`
- `NWS-01`:
  - top-level `updated` must be younger than `15 minutes`
- `REDM-01`, `KC-ROAD-01`, `WSDOT-01`:
  - source retrieval must be younger than `60 minutes`
  - closure-supplement degradation threshold is `2 hours`
- `ISS-01`:
  - policy snapshot must be younger than `24 hours`

### 5.2 Stale-data marking

- Stale data is not replaced with false-safe values.
- Source-level stale state must appear in:
  - `source_health[].status`
  - `freshness.stale_source_ids`
  - `metadata.stale_data_fields`
- Record-level stale data may be retained only when explicitly marked and still within LKG limits.

### 5.3 Last-known-good caching

- Paths:
  - per-source LKG: `data/connectors/last_known_good/05_FLOOD_CONDITIONS/<source_id>_current.json`
  - merged lane LKG: `data/connectors/last_known_good/05_FLOOD_CONDITIONS/current.json`
- Reuse windows:
  - `USGS-01`, `USGS-02`, `USGS-03`: `24 hours`
  - `NWPS-01`, `NWPS-02`: `24 hours`
  - `NWS-01`: `60 minutes`
  - `ISS-01`: `30 days`
  - closure supplements: `24 hours`, but connector health must show degraded closure confidence after `2 hours`

### 5.4 Failure scenarios and recovery

- Source API down or network unreachable:
  - retry once with bounded backoff
  - if still failing, use source LKG if inside its reuse window
  - mark source degraded/failed and emit stale marker if using LKG
- Source returns `4xx`:
  - do not blind-retry except one credential-path retry for optional `WSDOT-01`
  - skip the source after failure
  - continue the workflow with remaining sources
- Source returns `5xx`:
  - back off and retry once
  - if retry fails, use LKG if allowed
- Malformed response:
  - log sanitized parse error
  - quarantine the raw landing if needed
  - skip this source and continue
- Empty but valid response:
  - allowed for `NWS-01`, `KC-ROAD-01`, route-targeted `WSDOT-01`, and any source where the research proved empty is a legitimate quiet-state response

### 5.5 Stale-record drop rules

- Drop a stale live record entirely when it exceeds the source-specific LKG reuse window.
- Do not let an alert record older than `60 minutes` from `NWS-01` remain active.
- Do not let a closure supplement older than `24 hours` remain as active closure evidence.
- Preserve dropped records only in evidence/log/quarantine history, not in current published output.

### 5.6 Workflow-08 cross-lane deduplication

- This lane participates in workflow-08 deduplication.
- Lane `05_FLOOD_CONDITIONS` owns hydrologic hazard semantics.
- Lane `01_ROUTE_CONDITIONS` owns closure confirmation.
- When both describe the same real-world event, workflow-08 merges them into one rider-facing event with closure truth from lane 01 and flood-cause truth from lane 05. Grounding: `OVERLAP_NOTES.md`.

## 6. Evidence and Validation Outputs

The work order proposed lane-local `data/connectors/05_FLOOD_CONDITIONS/...` paths. The binding shared standard and architecture decisions require artifact-class directories with lane subfolders, so the approved paths below supersede the proposed shorthand.

### 6.1 Landing files

- Raw source payloads:
  - `data/connectors/raw/05_FLOOD_CONDITIONS/<source_id>/<source_id>_landing_<TIMESTAMP>.json`
- Landing metadata must include:
  - HTTP status
  - retrieved-at timestamp
  - request URL
  - source id
  - connector version
- Retention:
  - keep the last `3` successful cycles or `24 hours`, whichever is longer
  - also respect the broader raw-retention defaults from `DEC-004`

### 6.2 Normalized output

- One normalized artifact per execution:
  - `data/connectors/normalized/05_FLOOD_CONDITIONS/05_FLOOD_CONDITIONS_normalized_output_<TIMESTAMP>.json`
- Candidate and published pointers:
  - `data/connectors/candidate/05_FLOOD_CONDITIONS/current.json`
  - `data/connectors/published/05_FLOOD_CONDITIONS/current.json`
- Published immutable snapshot:
  - `data/connectors/published/05_FLOOD_CONDITIONS/05_FLOOD_CONDITIONS_published_<TIMESTAMP>.json`

### 6.3 Validation log

- Path:
  - `data/connectors/logs/05_FLOOD_CONDITIONS/validation_log_<TIMESTAMP>.jsonl`
- One line per validation event with:
  - `source_id`
  - `check_name`
  - `pass_fail`
  - `message`
  - `timestamp`

### 6.4 Health/status report

- Paths:
  - `data/connectors/health/05_FLOOD_CONDITIONS/status.json`
  - `data/connectors/health/05_FLOOD_CONDITIONS/status_<TIMESTAMP>.json`
- Required fields:
  - `lane_id`
  - `last_fetch_at`
  - `last_success_at`
  - `status`
  - `source_health`
  - `error_messages`
  - `stale_data_fields`

### 6.5 Additional evidence artifacts

- Execution evidence:
  - `data/connectors/evidence/05_FLOOD_CONDITIONS/execution_evidence_<TIMESTAMP>.json`
- Quarantine:
  - `data/connectors/quarantine/05_FLOOD_CONDITIONS/<TIMESTAMP>_<reason>.json`
- Schema file:
  - `data/connectors/schemas/05_FLOOD_CONDITIONS/05_FLOOD_CONDITIONS.schema.json`
- Manifest:
  - `data/connectors/manifests/05_FLOOD_CONDITIONS/05_FLOOD_CONDITIONS_manifest_v0001.json`
- Workflow-08 handoff:
  - `data/connectors/handoff/05_FLOOD_CONDITIONS/05_FLOOD_CONDITIONS_handoff_<TIMESTAMP>.json`

## 7. DATA SCHEMA SPECIFICATION

### 7.1 Authoritative output contract

- The authoritative normalized output is the shared connector envelope plus this lane’s event, observation, and route-section usage.
- Coordinates must be decimal degrees in `EPSG:4326`.
- Timestamps must be ISO-8601 UTC.
- Arrays must be present even when empty.

### 7.2 Field definitions

- `schema_version`: string, required, one, example `1.0.0`
- `connector_id`: string, required, one, example `05_FLOOD_CONDITIONS`
- `connector_name`: string, required, one
- `connector_version`: string, required, one, example `v0001`
- `lane`: string, required, one
- `run_id`: string, required, one
- `generated_at`: string timestamp, required, one
- `published_at`: string timestamp or `null`, required nullable, one
- `data_status`: enum, required, one
- `freshness`: object, required, one
- `manifest_ref`: object, required, one
- `source_health`: array, required, many
- `connector_health`: object, required, one
- `events`: array, required, many
- `observations`: array, required, many
- `route_sections`: array, required, many
- `provenance`: object, required, one
- `validation_state`: object, required, one
- `metadata`: object, required, one

### 7.3 Event object definition

- `event_id`: string, required, one
- `event_type`: enum, required, one
- `status`: enum, required, one
- `severity`: enum, required, one
- `route_impact`: enum, required, one
- `title`: string, required, one
- `summary`: string, required, one
- `source_id`: string, required, one
- `source_event_ref`: string or `null`, optional
- `observed_at`: string timestamp, required, one
- `effective_until`: string timestamp or `null`, optional
- `official_category`: string or `null`, optional
- `metric`: object or `null`, optional
- `location`: object, required, one
- `route_relevance`: object, required, one
- `provenance`: object, required, one

### 7.4 Observation object definition

- `observation_id`: string, required, one
- `observation_type`: enum-like string, required, one
- `title`: string, required, one
- `summary`: string, required, one
- `source_id`: string, required, one
- `observed_at`: string timestamp, required, one
- `route_section_ids`: array, optional
- `metric`: object or `null`, optional
- `notes`: string or `null`, optional

### 7.5 Reserved fields

- Reserved for future use and must be `null` or omitted until explicitly approved:
  - `advisories[].cross_lane_severity_tier`
  - `metadata.workflow_08_display_hint`
  - `metadata.publication_gate_reason`

### 7.6 Full illustrative JSON example

- Use the example in Section 3.2 as the authoritative illustrative example for this version.

### 7.7 Example error states

- Example source failure publication:
  - `data_status` becomes `degraded` or `using_last_known_good`
  - `source_health[].status` shows `failed`, `stale`, or `not_run`
  - `events[]` may still be populated from remaining healthy sources
- Example total validation failure:
  - candidate artifact written for forensics
  - published `current.json` not overwritten
  - quarantine artifact created

## 8. N8N WORKFLOW ARCHITECTURE SKETCH

- Workflow name: `v0001.05_FloodConditionsConnector`
- Workflow tags:
  - `uw_issy`
  - `connector`
  - `lane_05_flood_conditions`
  - `no_direct_deploy`
  - `production`
- Trigger mode: scheduled and manual
- Trigger cadence: one complete connector workflow every `15 minutes` in `America/Los_Angeles`, with overlapping executions prevented. This cadence satisfies the `15-minute` MVP backbone while allowing due-logic inside the workflow for daily `ISS-01` and hourly secondary branches. Grounding: `IMPLEMENTATION_RECOMMENDATION.md`, `00_OPEN_CONNECTOR_ARCHITECTURE_DECISIONS.md`.

### 8.1 Node structure pseudocode

```text
Schedule Trigger (every 15 minutes, no overlap)
  -> Initialize run context
  -> Load canonical GPX and route-section metadata
  -> Branch: USGS-01
    -> HTTP GET
    -> Validate payload shape and timestamps
    -> Land raw payload
    -> Normalize gauge observation
    -> Apply direct point-to-route relevance
  -> Branch: USGS-02
    -> HTTP GET
    -> Validate payload shape and timestamps
    -> Land raw payload
    -> Normalize upstream lead-time observation
    -> Apply approved upstream exception rule
  -> Branch: NWPS-01 status
    -> HTTP GET
    -> Validate payload
    -> Land raw payload
    -> Normalize observed category
  -> Branch: NWPS-01 stageflow and ratings when due
    -> HTTP GET stageflow
    -> HTTP GET ratings
    -> Validate payloads
    -> Land raw payloads
    -> Normalize forecast and thresholds
  -> Branch: NWS-01
    -> HTTP GET flood alert queries
    -> Validate GeoJSON
    -> Land raw payload
    -> Apply polygon intersection or route-point fallback
    -> Normalize alert events
  -> Branch: ISS-01 when due
    -> HTTP GET
    -> Parse structured threshold text
    -> Land raw payload
    -> Normalize policy-threshold observation
  -> Optional branch: USGS-03 when enabled
    -> HTTP GET
    -> Normalize shoreline context observation
  -> Optional branch: NWPS-02 when enabled
    -> HTTP GET
    -> Normalize upstream corroboration
  -> Optional branch: REDM-01
    -> HTTP GET ArcGIS metadata and layers
    -> Validate geometry and dates
    -> Apply route-intersection plus flood-text rule
    -> Normalize closure supplement candidates
  -> Optional branch: KC-ROAD-01
    -> HTTP GET ArcGIS query
    -> Validate geometry and dates
    -> Apply route-intersection plus flood-text rule
    -> Normalize closure supplement candidates
  -> Optional branch: WSDOT-01 if WSDOT_TRAVELER_API_ACCESS_CODE exists
    -> HTTP GET with access code
    -> Validate array payload
    -> Apply roadway/facility route match
    -> Normalize closure supplement candidates
  -> Merge normalized branch outputs
  -> Deduplicate within lane
  -> Derive route_sections and top-level freshness
  -> Validate merged envelope
  -> Write normalized artifact
  -> Write candidate artifact atomically
  -> Promote to published artifact atomically if valid
  -> Update LKG
  -> Write validation log
  -> Write health/status report
  -> Write execution evidence and workflow-08 handoff record
```

### 8.2 Error handling

- If one source fails, continue the workflow with the remaining sources.
- Partial output is allowed when the merged envelope still passes validation.
- A failed source must degrade source health, not silently clear hazard state.
- A merged envelope that fails validation must not overwrite the published artifact.

### 8.3 Retry strategy

- Network or `5xx` error: retry once after bounded backoff
- `4xx` error: no retry except a single credential-path retry for optional `WSDOT-01`
- Parse/validation error: no retry; continue after logging the failure

### 8.4 Logging

- `info`:
  - fetch start and finish
  - raw landing write
  - normalized artifact write
  - candidate/published promotion
- `warning`:
  - stale source
  - empty-but-valid payload
  - optional source skipped
  - reduced closure confidence
- `error`:
  - fetch failure
  - parse failure
  - schema failure
  - publication failure

### 8.5 Performance considerations

- Expected runtime: short enough for a `15-minute` schedule because all approved sources are HTTP/JSON or simple HTML endpoints with no browser automation required in the research.
- Parallelization opportunities:
  - USGS branches in parallel
  - NWPS status and NWS in parallel
  - closure supplements in parallel
- The workflow must still serialize final merge, validation, and atomic writes.

## 9. Integration with Workflow-08 and Publication

- Workflow-08 consumes:
  - `data/connectors/published/05_FLOOD_CONDITIONS/current.json`
  - published snapshots if historical comparison is needed
  - `data/connectors/handoff/05_FLOOD_CONDITIONS/*.json`
- Workflow-08 uses from this lane:
  - normalized `events`
  - `route_sections`
  - `source_health`
  - provenance and ownership annotations
- Cross-lane deduplication rule:
  - flood cause truth comes from lane 05
  - closure truth comes from lane 01
  - workflow-08 merges them into one rider-facing event
- Site republication:
  - not owned by this connector
  - workflow-08 decides when site-facing artifacts are regenerated after connector assembly and gating
- Lane responsibilities:
  - fetch, normalize, validate, and internally publish flood-lane artifacts
  - expose source health, provenance, and merge hints
- Workflow-08 responsibilities:
  - cross-lane deduplication
  - deployment/publication gating
  - generation of rider-facing `public/data/` outputs

## 10. Testing and Validation Strategy

### 10.1 Unit tests

- Schema transformation tests:
  - USGS observation to `gauge_observation`
  - NWPS status/stageflow to observed and forecast event shapes
  - NWS GeoJSON to alert event shape
- Route-relevance tests:
  - direct point within `3 km`
  - upstream exception beyond `5 km`
  - shoreline context only
  - closure geometry intersection
- Freshness tests:
  - stale after configured threshold
  - future timestamp fails safely

### 10.2 Integration tests

- Fetch each approved MVP source from the real endpoint
- Validate that a normalized envelope is produced or that a documented quiet-state result is recorded
- Confirm all artifact writes land in approved `data/connectors/` paths

### 10.3 Regression tests

- Confirm `USGS-04`, `USGS-05`, and `USGS-06` style `200` plus zero-series responses are rejected as unusable
- Confirm `USGS-03` never produces a closure or warning state by itself
- Confirm Hobart upstream data can influence the Issaquah-end section only through the approved local-threshold logic

### 10.4 Mock tests

- Example mock: `NWS-01` valid empty GeoJSON collection
  - expected result: source health `empty_but_valid`
  - no false alert event emitted
- Example mock: `REDM-01` geometry-intersecting closure with non-flood text
  - expected result: not promoted as flood-caused closure

### 10.5 Failure tests

- Simulate source downtime
- Simulate malformed JSON
- Simulate stale timestamps
- Simulate missing `WSDOT_TRAVELER_API_ACCESS_CODE`
- Simulate network timeout

### 10.6 Evidence of success

- Pass criteria:
  - merged envelope validates
  - no invalid artifact overwrites the current published file
  - source health reflects the simulated condition
  - route relevance logic assigns the expected section
- Evidence:
  - validation log entries
  - normalized output snapshots
  - status report
  - quarantine artifact when applicable

## 11. Monitoring and Observability

- Key metrics:
  - fetch success rate by source
  - normalized event count
  - stale-source percentage
  - number of runs using LKG
  - number of route-impacting events by section
- Alerts for human review:
  - MVP source failure persisting beyond one full freshness window
  - stale hydrologic data older than `3 hours`
  - zero valid MVP hydrologic sources in a run
  - repeated validation failure or quarantine writes
- Status-page visibility:
  - lane freshness timestamp
  - degraded-data indicator
  - explicit limitation when only partial corridor coverage is available
- Debugging order:
  - raw landing file
  - validation log
  - health report
  - source endpoint directly

## 12. Known Risks and Mitigations

- Risk: the middle corridor lacks a verified direct live flood gauge
  - mitigation: state the limitation openly and rely on closure supplements plus section-specific downstream/upstream interpretation
- Risk: `USGS-03` has no official route-impact threshold
  - mitigation: cap it at `elevated_water` unless corroborated by other sources
- Risk: closure supplements are not flood-specific
  - mitigation: require flood text plus geometry/facility confirmation
- Risk: `WSDOT-01` depends on credential presence
  - mitigation: keep it optional and mark `not_run` when absent
- Risk: static-site caching after workflow-08 publication can hide fresher connector data
  - mitigation: keep connector freshness metadata explicit and leave CDN policy to deployment-phase decisions

## 13. Deferred Decisions and Open Questions

- Final owner-approved cross-lane deployment-gate matrix
  - deferred to workflow-08 policy work
  - grounding: `DEC-006`
- Shared cross-lane display severity taxonomy
  - deferred to workflow-08 design
  - grounding: `DEC-009`
- Cloudflare Pages project, domain, and environment model
  - deferred to deployment phase
  - grounding: `DEC-011`, `DEC-012`
- Final alerting/notification channel
  - deferred to ops phase
  - grounding: `DEC-013`
- Exact workflow-08 handoff manifest shape beyond approved path/location
  - non-blocking and deferred to workflow-08 wiring
  - grounding: `DEC-014`

## 14. Research Traceability

- MVP sources are `USGS-01`, `USGS-02`, `NWPS-01`, `NWS-01`, `ISS-01`
  - grounding: `IMPLEMENTATION_RECOMMENDATION.md`, `UW_ISSY_05_FLOOD_CONDITIONS_IMPLEMENTATION_RECOMMENDATION_v1.md`
- Secondary sources are `USGS-03`, `NWPS-02`, `REDM-01`, `KC-ROAD-01`, `WSDOT-01`
  - grounding: `IMPLEMENTATION_RECOMMENDATION.md`, `ENV_AND_READINESS.md`, `SOURCE_REGISTRY.json`
- `KCF-02` is not an approved runtime dependency
  - grounding: `RESEARCH_FINDINGS.md`, `ENV_AND_READINESS.md`, `SOURCE_REGISTRY.json`
- `USGS-01` is the strongest direct observed route-end signal
  - grounding: `API_AND_FEED_TEST_RESULTS.md` Test 2, `ENV_AND_READINESS.md`, `SOURCE_REGISTRY.json`
- `USGS-02` remains relevant despite distance because Issaquah uses Hobart for local lead time
  - grounding: `RESEARCH_FINDINGS.md`, `ROUTE_RELEVANCE_AND_THRESHOLDS.md`, `SOURCE_REGISTRY.json`
- `NWPS-01` is the canonical official category and forecast source
  - grounding: `API_AND_FEED_TEST_RESULTS.md` Tests 6 and 7, `RESEARCH_FINDINGS.md`, `UW_ISSY_05_FLOOD_CONDITIONS_FINAL_RESEARCH_REPORT_v1.md`
- `NWS-01` is the canonical federal flood-alert source
  - grounding: `API_AND_FEED_TEST_RESULTS.md` Test 9, `OVERLAP_NOTES.md`, `SOURCE_REGISTRY.json`
- Freshness defaults are:
  - gauges `30 minutes`
  - `NWPS-01` forecast `6 hours`
  - `NWS-01` `15 minutes`
  - closure supplements `60 minutes`
  - `ISS-01` `24 hours`
  - grounding: `IMPLEMENTATION_RECOMMENDATION.md`, `SOURCE_REGISTRY.json`
- Route-relevance thresholds are:
  - direct points within `3 km`
  - exclusion outside `5 km` unless officially linked upstream
  - geometry intersection for alerts and closures
  - grounding: `ROUTE_RELEVANCE_AND_THRESHOLDS.md`
- Lake Sammamish must not independently trigger closure or warning state
  - grounding: `RESEARCH_FINDINGS.md`, `ROUTE_RELEVANCE_AND_THRESHOLDS.md`, `UW_ISSY_05_FLOOD_CONDITIONS_FINAL_RESEARCH_REPORT_v1.md`
- Last-known-good preservation and fail-closed behavior are required
  - grounding: `IMPLEMENTATION_RECOMMENDATION.md`, `00_CDM_CONNECTOR_LESSONS_APPLIED.md`, `00_SHARED_AUTONOMOUS_CONNECTOR_BUILD_STANDARD.md`
- Connector publication must remain internal and separate from workflow-08 public publication
  - grounding: `00_SHARED_AUTONOMOUS_CONNECTOR_BUILD_STANDARD.md`, `00_OPEN_CONNECTOR_ARCHITECTURE_DECISIONS.md`
- Cross-lane dedup rule is lane 05 flood-cause truth plus lane 01 closure truth
  - grounding: `OVERLAP_NOTES.md`
- Honest readiness limitation is the middle-corridor gauge gap
  - grounding: `RESEARCH_FINDINGS.md`, `ROUTE_RELEVANCE_AND_THRESHOLDS.md`, `UW_ISSY_05_FLOOD_CONDITIONS_AUDIT_REPORT_v1.md`
