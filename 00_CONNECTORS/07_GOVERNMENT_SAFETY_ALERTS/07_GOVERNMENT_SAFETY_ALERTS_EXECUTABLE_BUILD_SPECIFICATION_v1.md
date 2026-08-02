# 07_GOVERNMENT_SAFETY_ALERTS_EXECUTABLE_BUILD_SPECIFICATION_v1

## 1. OVERVIEW

- Lane ID: `07_GOVERNMENT_SAFETY_ALERTS`
- Lane name: `UW-Issaquah Government Safety Alerts Connector`
- Purpose: publish route-relevant government emergency alerts, campus and city public-safety advisories, and rider-relevant public-health safety notices that materially affect a cyclist traveling the canonical University of Washington -> Burke-Gilman Trail -> Sammamish River Trail -> Marymoor Park -> East Lake Sammamish Trail -> Issaquah route. The lane supports rider decisions about whether the route is safe to start, whether a route segment needs to be avoided, and whether alternate transport should be considered. Grounding: `RESEARCH_FINDINGS.md`, `OVERLAP_NOTES.md`, `UW_ISSY_07_GOVERNMENT_SAFETY_ALERTS_FINAL_RESEARCH_REPORT_v1.md`.
- Approved MVP source set:
  - `NWS-01`
  - `SEA-01`
  - `UW-01`
  Grounding: `IMPLEMENTATION_RECOMMENDATION.md`, `UW_ISSY_07_GOVERNMENT_SAFETY_ALERTS_IMPLEMENTATION_RECOMMENDATION_v1.md`, `ENV_AND_READINESS.md`.
- Approved secondary source set:
  - `SEAFD-01`
  - `SEAPD-01`
  - `DOH-02`
  - `ST-01`
  - `KCMETRO-01`
  Grounding: `IMPLEMENTATION_RECOMMENDATION.md`, `RESEARCH_FINDINGS.md`, `ENV_AND_READINESS.md`.
- High-level data flow: `fetch -> land raw payload -> validate payload shape and timestamps -> normalize records -> apply lane-07 ownership filters -> apply route relevance -> deduplicate within the lane -> validate merged envelope -> write candidate/published/LKG/status/evidence artifacts -> hand off published lane envelope to workflow 08`.
- Integration with workflow-08 and site publication pipeline: this lane writes only internal connector artifacts under approved `data/connectors/` artifact-class directories. Workflow `08_ASSEMBLE_VALIDATE_BUILD_DEPLOY` alone consumes the published lane envelope, performs cross-lane deduplication and deployment gating, and generates rider-facing `public/data/` outputs. Grounding: `00_SHARED_AUTONOMOUS_CONNECTOR_BUILD_STANDARD.md`, `00_OPEN_CONNECTOR_ARCHITECTURE_DECISIONS.md`, `OVERLAP_NOTES.md`.
- Shared standard and architecture references:
  - `00_CONNECTORS/00_SHARED_AUTONOMOUS_CONNECTOR_BUILD_STANDARD.md`
  - `00_CONNECTORS/00_OPEN_CONNECTOR_ARCHITECTURE_DECISIONS.md`
  - `00_CONNECTORS/00_CDM_CONNECTOR_LESSONS_APPLIED.md`
- Honest readiness statement: the lane is ready to build for the MVP source set. Secondary expansion is also actionable for `SEAFD-01`, `SEAPD-01`, `ST-01`, and `KCMETRO-01`. `DOH-02` is buildable but should be treated as a secondary HTML-parser branch with lower locality precision. Eastside municipal sources and `WSDOT-01` are not part of the approved initial executable scope. Grounding: `UW_ISSY_07_GOVERNMENT_SAFETY_ALERTS_AUDIT_REPORT_v1.md`, `ENV_AND_READINESS.md`.

## 2. SOURCE ACQUISITION STRATEGY

### 2.1 MVP sources

#### `NWS-01`

- Source ID: `NWS-01`
- Owning agency: `National Weather Service / NOAA`
- Acquisition method:
  - GeoJSON point query: `https://api.weather.gov/alerts/active?point=<lat>,<lon>`
  - GeoJSON zone backstop: `https://api.weather.gov/alerts/active?zone=WAC033`
  - GeoJSON statewide backstop: `https://api.weather.gov/alerts/active?area=WA`
  - Optional evidence fetches for retained alerts only:
    - Atom: `Accept: application/atom+xml`
    - per-alert CAP XML from returned alert ids
- Fetch cadence:
  - point queries for all `8` route waypoints every `15 minutes`
  - King County zone every `15 minutes`
  - statewide Washington backstop every `15 minutes`
  - CAP XML only for retained candidate alerts in that run
- Optimal freshness threshold: stale when the top-level `updated` timestamp is older than `15 minutes` from retrieval time. Grounding: `IMPLEMENTATION_RECOMMENDATION.md`, `SOURCE_REGISTRY.json`.
- Environment variables: none
- Authentication flow in n8n:
  - no credential
  - always send a descriptive `User-Agent` header because NWS published guidance expects one
- Error handling and documented failure modes:
  - HTTP non-`200` -> source `failed`
  - invalid GeoJSON or XML -> source `failed_validation`
  - stale `updated` -> source `stale`
  - empty `features[]` from point or zone query -> valid no-alert state, not a failure
  - contradictory results across point/zone/state queries -> keep the CAP record, log `warning`, and require route-relevance evaluation before publication
- Rate limiting considerations: `API_AND_FEED_TEST_RESULTS.md` observed short public cache headers and no credential requirement; `SOURCE_REGISTRY.json` records a generous but undisclosed limit. Use one scheduled run every `15 minutes`, not per-record looping.
- Network requirements: reachable from the research environment, no geo restriction or JavaScript gate observed in Tests 2-5.
- Fallback source if this source fails: `SEA-01` and `UW-01` provide local emergency context, but there is no equivalent replacement for route-wide structured CAP coverage. If `NWS-01` fails, the lane must degrade rather than claiming route safety.
- Last-known-good caching strategy: preserve the most recent validated `NWS-01` normalized branch snapshot for up to `60 minutes`. After `60 minutes`, keep the stale snapshot only as diagnostic evidence and mark the connector `degraded` or `using_last_known_good`, never `ok`. Grounding: `IMPLEMENTATION_RECOMMENDATION.md`, `SOURCE_REGISTRY.json`, `00_CDM_CONNECTOR_LESSONS_APPLIED.md`.

#### `SEA-01`

- Source ID: `SEA-01`
- Owning agency: `City of Seattle Office of Emergency Management`
- Acquisition method:
  - RSS: `https://alert.seattle.gov/feed/`
  - WordPress JSON: `https://alert.seattle.gov/wp-json/wp/v2/posts?per_page=10`
- Fetch cadence: every `15 minutes`
- Optimal freshness threshold: stale when feed or post timestamps are older than `15 minutes` beyond expected publication freshness. Grounding: `IMPLEMENTATION_RECOMMENDATION.md`, `SOURCE_REGISTRY.json`.
- Environment variables: none
- Authentication flow: none
- Error handling and documented failure modes:
  - HTTP non-`200`
  - invalid RSS or JSON
  - missing expected timestamp fields on all returned items
  - stale feed during a corroborated Seattle incident -> mark `stale`
- Rate limiting considerations: no documented limits were found in research; keep to the lane schedule and request one JSON page and one RSS snapshot per run.
- Network requirements: reachable from the research environment, no bot or geo restrictions observed in Tests 7-8.
- Fallback source if this source fails: `UW-01`, `SEAFD-01`, and `SEAPD-01` continue running for Seattle-origin context; `NWS-01` remains the structured public-warning backstop.
- Last-known-good caching strategy: preserve the latest validated normalized branch snapshot for up to `24 hours`, but mark it stale once it exceeds the `15-minute` freshness threshold.

#### `UW-01`

- Source ID: `UW-01`
- Owning agency: `University of Washington`
- Acquisition method:
  - RSS: `https://emergency.uw.edu/feed/`
  - WordPress JSON: `https://emergency.uw.edu/wp-json/wp/v2/posts?per_page=10`
- Fetch cadence: every `15 minutes`
- Optimal freshness threshold: stale after `15 minutes`. Grounding: `IMPLEMENTATION_RECOMMENDATION.md`, `SOURCE_REGISTRY.json`.
- Environment variables: none
- Authentication flow: none for public RSS or JSON
- Error handling and documented failure modes:
  - HTTP non-`200`
  - invalid RSS or JSON
  - missing `date` or `modified` fields in all returned posts
  - stale feed during a corroborated UW incident -> mark `stale`
- Rate limiting considerations: no documented limits were found; use one RSS and one JSON request per run.
- Network requirements: reachable from the research environment, no bot gate or geo restriction observed in Tests 11-12.
- Fallback source if this source fails: `SEA-01`, `SEAFD-01`, and `SEAPD-01` for Seattle public-safety context.
- Last-known-good caching strategy: preserve the latest validated normalized branch snapshot for up to `24 hours`, but surface stale status once the branch exceeds `15 minutes`.

### 2.2 Secondary sources

#### `SEAFD-01`

- Source ID: `SEAFD-01`
- Owning agency: `Seattle Fire Department`
- Acquisition method: RSS feed `https://fireline.seattle.gov/feed/`
- Fetch cadence: every `15 minutes`
- Optimal freshness threshold: `30 minutes` for acute incidents, `24 hours` for informational notices. For initial implementation, classify the whole source stale after `30 minutes` because lane 07 only uses it for acute incident corroboration. Grounding: `IMPLEMENTATION_RECOMMENDATION.md`, `SOURCE_REGISTRY.json`.
- Environment variables: none
- Authentication flow: none
- Error handling and documented failure modes:
  - HTTP non-`200`
  - invalid RSS
  - long silent period during a corroborated major Seattle fire incident -> `stale`
- Rate limiting considerations: no documented limits; one RSS request per run.
- Network requirements: reachable from the research environment, no JavaScript requirement observed in Test 9.
- Fallback source if this source fails: `SEA-01` then `NWS-01`
- Last-known-good caching strategy: preserve the latest validated normalized branch snapshot for up to `24 hours`

#### `SEAPD-01`

- Source ID: `SEAPD-01`
- Owning agency: `Seattle Police Department`
- Acquisition method:
  - RSS: `https://spdblotter.seattle.gov/feed/`
  - optional HTML corroboration page: `https://spdblotter.seattle.gov/significant-incident-reports/`
- Fetch cadence: every `15 minutes`
- Optimal freshness threshold: `30 minutes` for acute incidents. Grounding: `IMPLEMENTATION_RECOMMENDATION.md`, `SOURCE_REGISTRY.json`.
- Environment variables: none
- Authentication flow: none
- Error handling and documented failure modes:
  - HTTP non-`200`
  - invalid RSS
  - optional HTML page unavailable does not fail the source if RSS remains valid
  - stale feed during a corroborated police event -> `stale`
- Rate limiting considerations: no documented limits; use the RSS feed as the primary fetch and HTML only when deeper corroboration is needed in evidence output.
- Network requirements: reachable from the research environment, no bot gate observed in Test 10.
- Fallback source if this source fails: `SEA-01` and `UW-01`
- Last-known-good caching strategy: preserve the latest validated normalized branch snapshot for up to `24 hours`

#### `DOH-02`

- Source ID: `DOH-02`
- Owning agency: `Washington State Department of Health`
- Acquisition method: HTML table parse from `https://doh.wa.gov/public-health-provider-resources/washington-health-alert-network`
- Fetch cadence: every `6 hours`
- Optimal freshness threshold: stale after `6 hours`. Grounding: `IMPLEMENTATION_RECOMMENDATION.md`, `SOURCE_REGISTRY.json`.
- Environment variables: none
- Authentication flow: none
- Error handling and documented failure modes:
  - HTTP non-`200`
  - missing table structure
  - archive navigation broken
  - no recent entries is valid only if the page structure and timestamps still parse cleanly
- Rate limiting considerations: `API_AND_FEED_TEST_RESULTS.md` Test 21 observed `cache-control: max-age=86400, public`; do not fetch more than every `6 hours` in the scheduled workflow.
- Network requirements: reachable from the research environment, no bot gate observed.
- Fallback source if this source fails: `DOH-01` may be fetched as a diagnostic helper only; it is not promoted to an approved production source. If `DOH-02` fails, preserve LKG and mark the public-health branch degraded.
- Last-known-good caching strategy: preserve the latest validated normalized branch snapshot for up to `72 hours` because this is a slower-moving secondary source.

#### `ST-01`

- Source ID: `ST-01`
- Owning agency: `Sound Transit`
- Acquisition method: JSON snapshot `https://s3.amazonaws.com/st-service-alerts-prod/alerts_pb.json`
- Fetch cadence: every `15 minutes`
- Optimal freshness threshold: stale after `15 minutes`. Grounding: `IMPLEMENTATION_RECOMMENDATION.md`, `SOURCE_REGISTRY.json`.
- Environment variables: none
- Authentication flow: none
- Error handling and documented failure modes:
  - HTTP non-`200`
  - invalid JSON
  - stale GTFS header `timestamp`
- Rate limiting considerations: none documented; pull one full snapshot per run.
- Network requirements: reachable from the research environment, no bot or geo restriction observed in Test 22.
- Fallback source if this source fails: `KCMETRO-01`
- Last-known-good caching strategy: preserve the latest validated normalized alternate-transport branch snapshot for up to `24 hours`

#### `KCMETRO-01`

- Source ID: `KCMETRO-01`
- Owning agency: `King County Metro`
- Acquisition method:
  - primary: `https://s3.amazonaws.com/kcm-alerts-realtime-prod/alerts_enhanced.json`
  - fallback compatible format: `https://s3.amazonaws.com/kcm-alerts-realtime-prod/alerts_pb.json`
- Fetch cadence: every `15 minutes`
- Optimal freshness threshold: stale after `15 minutes`. Grounding: `IMPLEMENTATION_RECOMMENDATION.md`, `SOURCE_REGISTRY.json`.
- Environment variables: none
- Authentication flow: none
- Error handling and documented failure modes:
  - HTTP non-`200`
  - invalid JSON
  - stale GTFS header timestamp
- Rate limiting considerations: none documented; pull one full snapshot per run.
- Network requirements: reachable from the research environment, no bot or geo restriction observed in Test 23.
- Fallback source if this source fails: `ST-01`
- Last-known-good caching strategy: preserve the latest validated normalized alternate-transport branch snapshot for up to `24 hours`

### 2.3 Deferred non-MVP sources

- `WSDOT-01` is intentionally excluded from the executable build scope until credentialed testing succeeds. `ENV_AND_READINESS.md` requires `WSDOT_TRAVELER_API_ACCESS_CODE`, and `API_AND_FEED_TEST_RESULTS.md` Test 24 only verified a clean `401` without a usable payload.
- `REDM-01`, `BOTH-01`, `WOOD-01`, and `ISS-01` are intentionally excluded because research captured only zero-alert states or unstable widget behavior, not a live alert item structure fit for production normalization. Grounding: `RESEARCH_FINDINGS.md`, `ENV_AND_READINESS.md`, `API_AND_FEED_TEST_RESULTS.md`.

## 3. NORMALIZATION AND VALIDATION

### 3.1 Normalized output schema basis

- Authoritative outer envelope: the shared connector envelope from `00_SHARED_AUTONOMOUS_CONNECTOR_BUILD_STANDARD.md`
- Lane-specific usage:
  - `events[]` for discrete route-relevant government safety alerts
  - `observations[]` for branch-level context such as alternate transport advisories or public-health notices that are not lane-07 primary hazard cards
  - `route_sections[]` for segment impact summaries
  - `source_health[]` for per-source fetch, parse, freshness, and validation state
  - `connector_health` for branch-merge and publication outcome
  - `validation_state` for candidate/publication validation results
  - `metadata` for lane-specific diagnostics, including route-relevance notes and overlap annotations
- All fields use `snake_case`.

### 3.2 Lane field model

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
  - `source_event_ref`
  - `published_source_ids`
  - `observed_at`
  - `effective_at`
  - `expires_at`
  - `location`
  - `route_relevance`
  - `provenance`
- Optional or required-nullable event fields:
  - `official_category`
  - `public_action`
  - `cross_listed_to`
  - `location.latitude`
  - `location.longitude`
  - `location.named_area`
  - `location.route_section_ids`
  - `route_relevance.distance_km`
  - `route_relevance.matched_tokens`
  - `route_relevance.bounding_box_match`
  - `route_relevance.manual_review_required`
- Required observation fields:
  - `observation_id`
  - `observation_type`
  - `title`
  - `summary`
  - `source_id`
  - `observed_at`
  - `status`
- Optional observation fields:
  - `route_section_ids`
  - `public_action`
  - `provenance`
  - `related_event_ids`

### 3.3 Enum-like fields

- `data_status` valid values:
  - `ok`
  - `degraded`
  - `stale`
  - `no_relevant_events`
  - `failed_validation`
  - `failed_fetch`
  - `blocked`
  - `using_last_known_good`
- `event_type` valid values:
  - `civil_emergency`
  - `evacuation`
  - `shelter_in_place`
  - `hazmat`
  - `public_safety_incident`
  - `public_health_advisory`
  - `boil_water_notice`
  - `dam_incident`
  - `alternate_transport`
- `status` valid values:
  - `active`
  - `monitoring`
  - `resolved`
  - `expired`
- `severity` valid values:
  - `none`
  - `info`
  - `advisory`
  - `watch`
  - `warning`
  - `emergency`
- `route_impact` valid values:
  - `no_known_route_impact`
  - `possible_route_impact`
  - `route_segment_impacted`
  - `route_access_impacted`
  - `alternate_transport_only`
  - `manual_review_required`
- `route_relevance.classification` valid values:
  - `confirmed_route_relevant`
  - `possible_route_relevant`
  - `alternate_transport_only`
  - `not_route_relevant`
- `route_relevance.method` valid values:
  - `route_point_query`
  - `cap_geometry_intersection`
  - `ugc_same_area_match`
  - `text_landmark_match`
  - `local_gazetteer_coordinate_match`
  - `route_stop_mapping`
  - `manual_review_hold`
- `source_health[].status` valid values:
  - `ok`
  - `degraded`
  - `failed`
  - `stale`
  - `blocked`
  - `not_run`
  - `empty_but_valid`

### 3.4 Timestamp semantics

- All timestamps are ISO `8601` UTC strings ending with `Z`
- `generated_at`: time the merged connector envelope was assembled
- `published_at`: time candidate output was promoted to the lane published output; `null` allowed before promotion
- `retrieved_at`: time the workflow fetched a source payload
- `last_observation_at`: newest source-observation timestamp captured for source health
- `observed_at`: source-provided time for an event or observation
- `effective_at`: source-provided event effective start
- `expires_at`: source-provided expiration or end time
- `freshness.computed_at`: time stale/fresh state was calculated
- Future timestamps beyond `5 minutes` of tolerated clock skew fail freshness validation and degrade to `unknown`/`stale`, not `fresh`. Grounding: `00_CDM_CONNECTOR_LESSONS_APPLIED.md`.

### 3.5 Geographic fields

- Coordinate format: decimal degrees, `EPSG:4326`
- Canonical route source: `data/route/UnivWA-Issaquah.gpx`
- Canonical route bbox prefilter: lat `47.55207` to `47.75889`, lon `-122.30570` to `-122.04414`
- Route sections for this lane:
  - `WP1_UW`
  - `WP2_KENMORE_LFP`
  - `WP3_BOTHELL`
  - `WP4_WOODINVILLE`
  - `WP5_REDMOND`
  - `WP6_MARYMOOR_ELST`
  - `WP7_SAMMAMISH`
  - `WP8_ISSAQUAH`
- `location.latitude` and `location.longitude`: centroid or point only when the source or the maintained local gazetteer provides defensible coordinates
- `route_relevance.distance_km`: minimum route distance computed locally from the GPX for geometry-capable or gazetteer-resolved records
- `location.named_area`: human-readable place string from the source
- `location.route_section_ids`: affected sections after route matching

### 3.6 Source attribution and provenance fields

- Published source ids must be globally namespaced as `<lane_id>:<local_source_id>`, for example `07_GOVERNMENT_SAFETY_ALERTS:NWS-01`
- Every event and observation must include:
  - `source_id`
  - `provenance.source_url`
  - `provenance.retrieved_at`
  - `provenance.source_record_hash`
- Top-level `provenance` must include:
  - `source_ids_used`
  - `route_gpx_ref`
  - `source_payload_refs`
  - `normalization_notes`
  - `research_trace_refs`

### 3.7 Illustrative JSON example

The JSON below is illustrative only. It uses the tested source names, ids, timestamps, and no-alert states documented on Wednesday, July 29, 2026. It is not asserting a live incident at publication time.

```json
{
  "schema_version": "1.0.0",
  "connector_id": "07_GOVERNMENT_SAFETY_ALERTS",
  "connector_name": "UW-Issaquah Government Safety Alerts Connector",
  "connector_version": "v0001",
  "lane": "07_GOVERNMENT_SAFETY_ALERTS",
  "run_id": "07_GOVERNMENT_SAFETY_ALERTS-20260731T190000Z-001",
  "generated_at": "2026-07-31T19:00:00Z",
  "published_at": "2026-07-31T19:00:03Z",
  "data_status": "no_relevant_events",
  "freshness": {
    "overall_state": "fresh",
    "computed_at": "2026-07-31T19:00:03Z",
    "oldest_relevant_source_age_minutes": 8,
    "stale_source_ids": []
  },
  "manifest_ref": {
    "manifest_id": "07_GOVERNMENT_SAFETY_ALERTS-v0001",
    "schema_version": "1.0.0"
  },
  "source_health": [
    {
      "schema_version": "1.0.0",
      "connector_id": "07_GOVERNMENT_SAFETY_ALERTS",
      "source_id": "07_GOVERNMENT_SAFETY_ALERTS:NWS-01",
      "source_name": "NWS modern alerts API and CAP products",
      "status": "empty_but_valid",
      "retrieved_at": "2026-07-29T21:52:00Z",
      "stale_after_minutes": 15,
      "record_count": 0,
      "http_status": 200,
      "last_observation_at": "2026-07-29T21:52:00Z",
      "warnings": [],
      "errors": []
    },
    {
      "schema_version": "1.0.0",
      "connector_id": "07_GOVERNMENT_SAFETY_ALERTS",
      "source_id": "07_GOVERNMENT_SAFETY_ALERTS:SEA-01",
      "source_name": "AlertSeattle public feed and WordPress API",
      "status": "ok",
      "retrieved_at": "2026-07-29T21:54:00Z",
      "stale_after_minutes": 15,
      "record_count": 5,
      "http_status": 200,
      "last_observation_at": "2026-07-29T19:10:10Z",
      "warnings": [],
      "errors": []
    },
    {
      "schema_version": "1.0.0",
      "connector_id": "07_GOVERNMENT_SAFETY_ALERTS",
      "source_id": "07_GOVERNMENT_SAFETY_ALERTS:UW-01",
      "source_name": "UW Alert blog feed and WordPress API",
      "status": "ok",
      "retrieved_at": "2026-07-29T21:55:00Z",
      "stale_after_minutes": 15,
      "record_count": 5,
      "http_status": 200,
      "last_observation_at": "2026-07-29T18:38:58Z",
      "warnings": [],
      "errors": []
    }
  ],
  "connector_health": {
    "schema_version": "1.0.0",
    "connector_id": "07_GOVERNMENT_SAFETY_ALERTS",
    "status": "ok",
    "failed_stage": null,
    "warning_count": 0,
    "error_count": 0,
    "used_last_known_good": false,
    "candidate_written": true,
    "published_written": true
  },
  "events": [],
  "observations": [],
  "route_sections": [
    {
      "route_section_id": "WP1_UW",
      "status": "clear",
      "summary": "No route-relevant government safety alerts retained after route filtering.",
      "supporting_source_ids": [
        "07_GOVERNMENT_SAFETY_ALERTS:NWS-01",
        "07_GOVERNMENT_SAFETY_ALERTS:UW-01"
      ]
    }
  ],
  "provenance": {
    "source_ids_used": [
      "07_GOVERNMENT_SAFETY_ALERTS:NWS-01",
      "07_GOVERNMENT_SAFETY_ALERTS:SEA-01",
      "07_GOVERNMENT_SAFETY_ALERTS:UW-01"
    ],
    "route_gpx_ref": "data/route/UnivWA-Issaquah.gpx",
    "source_payload_refs": [
      "data/connectors/raw/07_GOVERNMENT_SAFETY_ALERTS/NWS-01/20260729T215200Z.json",
      "data/connectors/raw/07_GOVERNMENT_SAFETY_ALERTS/SEA-01/20260729T215400Z.xml",
      "data/connectors/raw/07_GOVERNMENT_SAFETY_ALERTS/UW-01/20260729T215500Z.xml"
    ],
    "normalization_notes": [
      "NWS point and zone queries returned valid zero-alert states during the verified research cycle.",
      "Seattle and UW feeds remained available and were filtered conservatively by route landmarks."
    ],
    "research_trace_refs": [
      "API_AND_FEED_TEST_RESULTS.md",
      "IMPLEMENTATION_RECOMMENDATION.md",
      "ROUTE_RELEVANCE_AND_THRESHOLDS.md"
    ]
  },
  "validation_state": {
    "schema_valid": true,
    "route_relevance_valid": true,
    "freshness_valid": true,
    "dedup_valid": true,
    "published_from_candidate": true
  },
  "metadata": {
    "summary_headline": "No current route-relevant government safety alerts.",
    "alternate_transport_block_present": false,
    "manual_review_queue_count": 0,
    "overlap_notes_ref": "OVERLAP_NOTES.md"
  }
}
```

### 3.8 Validators that run on every publication

- Schema validation:
  - validate the shared outer envelope
  - validate lane-07 required event and observation fields
  - fail publication if required arrays or required fields are missing
- Coordinate validation:
  - if coordinates are present, require them to fall inside a strict regional envelope slightly larger than the canonical route bbox
  - require any `confirmed_route_relevant` geometry record to have a computed route distance consistent with its classification
- Timestamp freshness check:
  - verify all source timestamps parse
  - reject future timestamps beyond `5` minutes
  - compare source age to the per-source threshold from Section 2
- Source-health check:
  - record fetch, parse, stale, blocked, and empty-valid states separately
  - preserve empty-valid no-alert responses as successful source executions
- Deduplication check:
  - prevent identical `event_id` publication twice in the same run
  - prevent duplicate cross-source clusters from producing multiple published cards for the same hazard
- Validation failure behavior:
  - branch-level failure -> log, quarantine branch artifact, continue other branches
  - merged-envelope failure -> do not overwrite published output; preserve prior published and LKG artifacts; write status `failed_validation`
  - event-level failure -> quarantine the record, record the reason, and omit the record from `events[]`

## 4. ROUTE RELEVANCE CALCULATION

- Governing principle: use the strongest deterministic geographic evidence available for each source class, and never publish on keyword matching alone. Grounding: `ROUTE_RELEVANCE_AND_THRESHOLDS.md`.

### 4.1 Per-source-class decision rules

#### `NWS-01`

- Decision order:
  1. if any of the `8` route-point queries return the alert id, classify `confirmed_route_relevant`
  2. else if CAP/GeoJSON geometry intersects a `0.5 mi` route buffer, classify `confirmed_route_relevant`
  3. else if geometry is null and `UGC`, `SAME`, `affectedZones`, or `areaDesc` resolve to King County or a route municipality, continue to text checks
  4. else if `areaDesc` or headline names a route municipality, trail, or landmark from the maintained gazetteer, classify `possible_route_relevant`
  5. otherwise classify `not_route_relevant`
- Thresholds:
  - point or geometry within `0.5 mi` of the route line = `confirmed_route_relevant`
  - point `0.5-1.0 mi` from the route line = `possible_route_relevant`
  - beyond `1.0 mi` without a route feature token = `not_route_relevant`

#### `SEA-01`, `UW-01`, `SEAFD-01`, `SEAPD-01`

- Decision order:
  1. extract place names, block references, facility names, streets, and route landmarks from title and body text
  2. match extracted tokens against a maintained local gazetteer, not an external geocoding service
  3. if a route trail, route-origin facility, or egress street token matches exactly, classify `confirmed_route_relevant`
  4. if a matched gazetteer entry has local coordinates and falls within `1.0 mi` of the Seattle/UW route segment, classify `possible_route_relevant`
  5. if the post is Seattle-citywide with no route token, classify `not_route_relevant`
- Required gazetteer starter tokens from research:
  - `University of Washington`
  - `Rainier Vista`
  - `University Way NE`
  - `Kane Hall`
  - `Burke-Gilman Trail`
  - `NE Pacific St`
  - `NE 45th St`
  - `U-District`
  - `Bothell Landing`
  - `Marymoor Park`
  - `East Lake Sammamish Trail`
- Special UW rule: anything clearly inside the UW Seattle campus core or on route-origin egress streets is treated as route relevant unless the post explicitly states the impact is internal-only and not affecting public movement.

#### `DOH-02`

- Decision order:
  1. event type must be relevant to outdoor rider safety or public health
  2. if the alert explicitly names King County, Seattle, UW, Redmond, Bothell, Woodinville, Sammamish, or Issaquah, classify `confirmed_route_relevant`
  3. if the alert is statewide and clearly affects outdoor exposure or public-water safety, classify `possible_route_relevant`
  4. provider-only technical notices are `not_route_relevant`

#### `ST-01` and `KCMETRO-01`

- Decision order:
  1. alert route ids or stop ids must belong to the maintained fallback-service list for UW, Bothell, Redmond/Bellevue, or Issaquah access
  2. matched transit alerts are classified `alternate_transport_only`
  3. unmatched network alerts are dropped from publication

### 4.2 Implementation sketch for n8n

- Load the canonical GPX once at the start of the workflow and derive:
  - route line coordinates
  - route bbox
  - `0.5 mi` and `1.0 mi` buffers
  - waypoint coordinate map for `WP1` through `WP8`
- For `NWS-01`:
  - fetch point, zone, and statewide alert sets
  - build a combined alert dictionary keyed by CAP identifier
  - compute route relevance from point-hit, geometry-hit, then geocode/text evidence
- For text-first sources:
  - strip HTML
  - tokenize titles and content
  - match against the maintained gazetteer
  - optionally attach local gazetteer coordinates and compute route distance locally
- For transit sources:
  - map route ids and stop ids to a maintained allowed list
  - publish into an alternate-transport block or `observations[]`, not the primary hazard card

### 4.3 Edge cases and fallback logic

- Ambiguous CAP alert with null geometry and county-level descriptors only:
  - retain as `possible_route_relevant`
  - publish only if the event type belongs to a lane-07-owned hazard class
- Seattle police or fire post with neighborhood text but no route token:
  - do not publish automatically
  - quarantine to manual review only if the source is otherwise fresh and the title implies a severe public-safety event
- DOH statewide advisory with no county specificity:
  - publish only when the health issue directly affects outdoor exposure or public water
- Transit alert affecting the region but not the maintained fallback-service list:
  - omit from publication

### 4.4 Geographic bounds check

- Use the canonical bbox only as a prefilter.
- Strict envelope for coordinate sanity:
  - latitude `47.50` to `47.80`
  - longitude `-122.35` to `-122.00`
- Real route relevance requires either:
  - `0.5 mi` geometry/point-to-route confirmation for direct alerts
  - `1.0 mi` local gazetteer coordinate confirmation for text-first Seattle/UW posts
  - maintained transit stop/route mapping for alternate transport

## 5. FRESHNESS, FAILURE, AND FALLBACK

### 5.1 Freshness rules

- `NWS-01`, `SEA-01`, `UW-01`, `ST-01`, `KCMETRO-01`: stale after `15 minutes`
- `SEAFD-01`, `SEAPD-01`: stale after `30 minutes`
- `DOH-02`: stale after `6 hours`
- Event timestamps:
  - if a source supplies `effective_at` and `expires_at`, use those for event status
  - if no expiration exists, retain the event while the source branch remains fresh and the event remains present in the source payload
- Different event-type handling:
  - acute emergency/public-warning events use the source freshness threshold above
  - public-health notices may remain active beyond one fetch cycle, but the source branch still becomes stale on its `6-hour` threshold if not refreshed

### 5.2 Stale-data marking

- Staleness is represented in:
  - top-level `data_status`
  - `freshness.overall_state`
  - `freshness.stale_source_ids`
  - `source_health[].status`
  - `metadata.summary_headline` when stale data affects rider interpretation
- Stale records are not nulled silently. The connector preserves the last validated record and marks it stale.

### 5.3 Last-known-good caching

- Cache the last successful full connector envelope under `data/connectors/last_known_good/07_GOVERNMENT_SAFETY_ALERTS/`
- Cache per-source normalized branch snapshots under the same lane directory for branch-level reuse
- Retention:
  - full lane LKG: active until superseded by a newer valid LKG, per `DEC-004`
  - per-source branch LKG:
    - `NWS-01`: reuse window `60 minutes`
    - `SEA-01`, `UW-01`, `SEAFD-01`, `SEAPD-01`, `ST-01`, `KCMETRO-01`: reuse window `24 hours`
    - `DOH-02`: reuse window `72 hours`

### 5.4 Failure scenarios and recovery

- Source API/feed down:
  - retry once with bounded backoff
  - if still failing, use per-source LKG if within its allowed reuse window
  - record `source_health[].status = failed`
  - if the failing source is `NWS-01`, degrade the connector
- Source returns `4xx`:
  - treat as source failure
  - skip the source after one retry only if the response suggests transient proxy behavior; otherwise do not loop
  - continue with other sources
- Source returns `5xx`:
  - retry once after `60` seconds
  - if retry fails, use eligible LKG and continue
- Network unreachable:
  - mark the source `failed`
  - use LKG if eligible
  - preserve existing published output
- Malformed response:
  - log sanitized parse error
  - quarantine the raw landing artifact
  - skip that source and continue
- Merged output fails validation:
  - do not overwrite the published lane output
  - keep prior published and LKG artifacts
  - write a failed status report and evidence bundle

### 5.5 Stale record drop policy

- Drop stale published events entirely when:
  - the source LKG reuse window is exceeded, or
  - the source no longer includes the event and the event has expired
- For `NWS-01`, drop stale alert reuse after `60 minutes`
- For other sources, keep the branch stale within its LKG window but stop surfacing individual events once the branch exceeds its reuse window

### 5.6 Workflow-08 cross-lane deduplication participation

- Yes. This lane participates by publishing:
  - `event_type`
  - `official_category`
  - `source_event_ref`
  - `published_source_ids`
  - `cross_listed_to`
  - `metadata.overlap_notes_ref`
- Workflow 08 uses those fields plus `OVERLAP_NOTES.md` to let other lanes own weather, air-quality, wildfire, flood, and infrastructure hazards when those hazards are not primarily government safety alerts.

## 6. EVIDENCE AND VALIDATION OUTPUTS

- Raw landing files:
  - path pattern: `data/connectors/raw/07_GOVERNMENT_SAFETY_ALERTS/<source_id>/<source_id>_landing_<timestamp>.json`
  - content: sanitized payload, HTTP status, retrieved-at, content-type, source metadata, SHA-256 hash
  - retention: follow `DEC-004` default retention, with at least the last `3` cycles preserved for each source and failed/anomalous payloads retained `30 days`
- Normalized per-source branch files:
  - path pattern: `data/connectors/normalized/07_GOVERNMENT_SAFETY_ALERTS/<source_id>/<source_id>_normalized_<timestamp>.json`
- Candidate merged output:
  - path pattern: `data/connectors/candidate/07_GOVERNMENT_SAFETY_ALERTS/07_GOVERNMENT_SAFETY_ALERTS_candidate_<timestamp>.json`
- Published merged output:
  - path pattern: `data/connectors/published/07_GOVERNMENT_SAFETY_ALERTS/07_GOVERNMENT_SAFETY_ALERTS_published_<timestamp>.json`
  - stable current pointer: `data/connectors/published/07_GOVERNMENT_SAFETY_ALERTS/current.json`
- Last-known-good:
  - path pattern: `data/connectors/last_known_good/07_GOVERNMENT_SAFETY_ALERTS/07_GOVERNMENT_SAFETY_ALERTS_lkg.json`
- Validation log:
  - path pattern: `data/connectors/logs/07_GOVERNMENT_SAFETY_ALERTS/validation_log_<timestamp>.jsonl`
  - one line per validation event with: `run_id`, `source_id`, `check`, `pass_fail`, `message`, `timestamp`
- Health/status report:
  - stable path: `data/connectors/health/07_GOVERNMENT_SAFETY_ALERTS/status.json`
  - required fields:
    - `lane_id`
    - `run_id`
    - `last_fetch_at`
    - `last_success_at`
    - `status`
    - `source_health`
    - `error_messages`
    - `stale_data_fields`
    - `used_last_known_good`
- Quarantine artifacts:
  - path pattern: `data/connectors/quarantine/07_GOVERNMENT_SAFETY_ALERTS/<reason>/<timestamp>_<source_id>.json`
- Execution evidence:
  - path pattern: `data/connectors/evidence/07_GOVERNMENT_SAFETY_ALERTS/execution_report_<timestamp>.json`
  - include workflow id/name, run id, connector version, artifact hashes, and validation summary

## 7. DATA SCHEMA SPECIFICATION

### 7.1 Authoritative normalized output example

The authoritative lane output is the shared connector envelope plus the lane-07 event and observation shapes defined below. The illustrative JSON in Section 3.7 is schema-valid for the intended contract and should be used as the first fixture.

### 7.2 Field definitions

- `schema_version`
  - type: `string`
  - cardinality: required
  - example: `"1.0.0"`
- `connector_id`
  - type: `string`
  - required
  - example: `"07_GOVERNMENT_SAFETY_ALERTS"`
- `connector_name`
  - type: `string`
  - required
  - example: `"UW-Issaquah Government Safety Alerts Connector"`
- `connector_version`
  - type: `string`
  - required
  - example: `"v0001"`
- `lane`
  - type: `string`
  - required
  - example: `"07_GOVERNMENT_SAFETY_ALERTS"`
- `run_id`
  - type: `string`
  - required
  - example: `"07_GOVERNMENT_SAFETY_ALERTS-20260731T190000Z-001"`
- `generated_at`
  - type: `string`
  - required
  - format: ISO `8601` UTC
- `published_at`
  - type: `string | null`
  - required nullable
- `data_status`
  - type: `string`
  - required
  - enum: Section 3.3
- `freshness`
  - type: `object`
  - required
  - fields:
    - `overall_state`
    - `computed_at`
    - `oldest_relevant_source_age_minutes`
    - `stale_source_ids`
- `manifest_ref`
  - type: `object`
  - required
- `source_health`
  - type: `array`
  - required
  - items:
    - `source_id`
    - `source_name`
    - `status`
    - `retrieved_at`
    - `stale_after_minutes`
    - `record_count`
    - `http_status`
    - `last_observation_at`
    - `warnings`
    - `errors`
- `connector_health`
  - type: `object`
  - required
  - fields:
    - `status`
    - `failed_stage`
    - `warning_count`
    - `error_count`
    - `used_last_known_good`
    - `candidate_written`
    - `published_written`
- `events`
  - type: `array`
  - required
  - items:
    - `event_id`: `string`
    - `event_type`: lane enum
    - `status`: lane enum
    - `severity`: lane enum
    - `route_impact`: lane enum
    - `title`: `string`
    - `summary`: `string`
    - `source_id`: `string`
    - `source_event_ref`: `string`
    - `published_source_ids`: `string[]`
    - `observed_at`: `string`
    - `effective_at`: `string | null`
    - `expires_at`: `string | null`
    - `official_category`: `string | null`
    - `public_action`: `string | null`
    - `cross_listed_to`: `string[]`
    - `location`: object
    - `route_relevance`: object
    - `provenance`: object
- `observations`
  - type: `array`
  - required
  - usage here:
    - alternate-transport notices
    - public-health context items that do not rise to lane-07 primary event ownership
- `route_sections`
  - type: `array`
  - required
  - items:
    - `route_section_id`
    - `status`
    - `summary`
    - `supporting_source_ids`
- `provenance`
  - type: `object`
  - required
- `validation_state`
  - type: `object`
  - required
- `metadata`
  - type: `object`
  - required

### 7.3 Nested object definitions

- `location`
  - `name`: `string`
  - `named_area`: `string | null`
  - `latitude`: `number | null`
  - `longitude`: `number | null`
  - `route_section_ids`: `string[]`
- `route_relevance`
  - `classification`: enum
  - `method`: enum
  - `distance_km`: `number | null`
  - `matched_tokens`: `string[]`
  - `bounding_box_match`: `boolean`
  - `manual_review_required`: `boolean`
  - `reason`: `string`
- `provenance` on each event or observation
  - `source_url`: `string`
  - `retrieved_at`: `string`
  - `source_record_hash`: `string`
  - `normalization_version`: `string`

### 7.4 Coordinate format

- decimal degrees
- assumed CRS: `EPSG:4326`

### 7.5 Timestamp format

- ISO `8601` UTC strings ending with `Z`

### 7.6 Reserved fields

- `ownership_annotations`
  - reserved for future workflow-08 merge hints
  - must be omitted or `[]` in v1
- `advisories`
  - reserved if workflow-08 later prefers a dedicated lane block instead of `observations[]`
  - must be omitted or `[]` in v1

### 7.7 Example error states

- `NWS-01` failed but `SEA-01` and `UW-01` succeeded:
  - `data_status = "degraded"`
  - `source_health` marks `NWS-01` failed
  - preserve prior valid `NWS-01` branch only if within `60 minutes`
- All MVP sources failed and no valid LKG exists:
  - `data_status = "failed_fetch"`
  - `events = []`
  - `observations = []`
  - `metadata.summary_headline` states that official government safety alert data is unavailable, not clear
- Merged candidate failed schema validation:
  - do not overwrite published output
  - write failed candidate to quarantine
  - `status.json` reports `failed_validation`

## 8. N8N WORKFLOW ARCHITECTURE SKETCH

- Workflow internal name: `v0001.07_GovernmentSafetyAlertsConnector`
- Exported filename: `v0001.07_GovernmentSafetyAlertsConnector.n8n.workflow.json`
- Required tags:
  - `uw_issy`
  - `connector`
  - `lane_07_government_safety_alerts`
  - `no_direct_deploy`
  - lifecycle tag such as `production` or `disabled`
- Trigger:
  - scheduled
  - manual execution also supported
- Trigger cadence:
  - one non-overlapping full workflow every `15 minutes` in `America/Los_Angeles`
  - due-logic inside the workflow skips `DOH-02` except every `6` hours
  - this is the most practical implementation of the research cadence while keeping one connector workflow. Grounding: `IMPLEMENTATION_RECOMMENDATION.md`, `00_SHARED_AUTONOMOUS_CONNECTOR_BUILD_STANDARD.md`

### 8.1 Node structure pseudocode

```text
Schedule Trigger (every 15 minutes, no overlapping executions)
  -> Initialize run metadata and load canonical GPX
  -> Load local gazetteer, route buffers, and transit fallback-service map
  -> Fetch NWS point queries for WP1-WP8
  -> Fetch NWS King County zone query
  -> Fetch NWS statewide backstop query
  -> Normalize and route-filter NWS alerts
  -> Fetch SEA-01 RSS and JSON
  -> Normalize SEA-01 posts and route-filter by gazetteer
  -> Fetch UW-01 RSS and JSON
  -> Normalize UW-01 posts and route-filter by gazetteer
  -> If secondary enabled:
       -> Fetch SEAFD-01 RSS
       -> Fetch SEAPD-01 RSS
       -> Fetch ST-01 JSON
       -> Fetch KCMETRO-01 JSON
       -> If DOH-02 due this run, fetch DOH-02 HTML
       -> Normalize secondary branches
  -> Land all raw payloads
  -> Run per-branch validators
  -> Deduplicate within each branch by source-native id
  -> Merge branches
  -> Apply cross-source clustering
  -> Apply lane-07 ownership filters from OVERLAP_NOTES.md
  -> Build route_sections summaries
  -> Validate merged envelope
  -> Write normalized branch outputs
  -> Write candidate envelope
  -> If candidate passes:
       -> Atomically promote to published/current and update LKG
  -> Write status.json
  -> Write validation log and execution evidence
```

### 8.2 Error handling

- If one source fails, continue with the other sources.
- If any non-MVP secondary source fails, the connector may still remain `ok` if the MVP sources are healthy and no retained secondary-only data is required.
- If `NWS-01` fails, the connector cannot remain `ok`; minimum state is `degraded`.
- Emit partial output when at least one MVP branch still validates.

### 8.3 Retry strategy

- one retry on network or `5xx` failure
- backoff: `60 seconds`
- no repeated loops

### 8.4 Logging

- `info`
  - fetch start/finish
  - candidate write
  - published write
- `warning`
  - stale source
  - route-relevance ambiguity
  - LKG reuse
- `error`
  - fetch failure
  - parse failure
  - merged validation failure

### 8.5 Performance considerations

- Expected runtime: under `2 minutes` for MVP, under `4 minutes` with all approved secondary sources enabled
- Parallelization:
  - NWS point and zone/state fetches can run in parallel
  - Seattle/UW/public-safety feeds can run in parallel
  - transit feeds can run in parallel
- Keep a merge barrier before candidate assembly so partial branch outputs do not leak directly to publication. Grounding: `00_CDM_CONNECTOR_LESSONS_APPLIED.md`.

## 9. INTEGRATION WITH WORKFLOW-08 AND PUBLICATION

- Workflow 08 consumes:
  - the published lane envelope in `data/connectors/published/07_GOVERNMENT_SAFETY_ALERTS/current.json`
  - `source_health`
  - `freshness`
  - `events`
  - `observations`
  - provenance metadata and overlap hints
- Cross-lane deduplication rules from lane 07:
  - weather warnings such as `Excessive Heat Warning`, `Severe Thunderstorm Warning`, and `High Wind Warning` are not lane-07 primary ownership
  - air-quality alerts are lane-03 primary ownership
  - flood alerts remain lane-05 primary ownership unless lane-07 emergency messaging is the dominant rider signal
  - route closures remain lane-01 or lane-06 primary ownership unless emergency messaging is the dominant rider signal
  Grounding: `OVERLAP_NOTES.md`
- Site republish timing:
  - workflow 08 decides when site artifacts are rebuilt
  - this lane does not trigger or perform deployment
- Lane responsibility:
  - fetch, normalize, validate, preserve LKG, publish internal lane envelope
- Workflow-08 responsibility:
  - cross-lane deduplication
  - lane-gating decisions
  - public-data generation
  - build/deploy pipeline control

## 10. TESTING AND VALIDATION STRATEGY

- Unit tests:
  - NWS CAP normalization
  - WordPress post normalization
  - RSS item normalization
  - route-point hit logic
  - `0.5 mi` and `1.0 mi` route-distance calculations
  - gazetteer token matching
  - freshness derivation
  - overlap ownership suppression
- Integration tests:
  - fetch each approved source
  - validate that a live no-alert or current-data payload lands successfully
  - validate the merged envelope against the lane schema
- Regression tests:
  - verified July 29, 2026 research cases:
    - `NWS-01` point and zone queries produce valid zero-alert state
    - statewide `NWS-01` query returns off-route air-quality alerts that must not publish in lane 07
    - `UW-01` titles such as `UW Advisory – Emergency response` stay route-origin relevant
    - `SEAFD-01` and `SEAPD-01` require conservative route filtering
- Mock tests:
  - fixture example: NWS GeoJSON with one alert containing CAP id, null geometry, King County `areaDesc`, and route-point hit
  - expected result: `confirmed_route_relevant` event with `route_relevance.method = route_point_query`
- Failure tests:
  - simulate `401`, `403`, `500`, timeout, malformed JSON/XML, malformed HTML table, and future timestamps
  - verify published output is preserved on failure
- Evidence of test success:
  - schema-valid candidate envelope
  - correct deduplication counts
  - expected stale/degraded states under source-failure fixtures
  - no non-route-relevant statewide NWS alerts published into lane 07

## 11. MONITORING AND OBSERVABILITY

- Key metrics:
  - fetch success rate per source
  - parse success rate per source
  - route-relevant event count per run
  - alternate-transport observation count per run
  - stale-source percentage
  - LKG reuse count
- Human alert triggers:
  - `NWS-01` failure for more than `30 minutes`
  - all MVP sources failed in one run
  - stale data persisted beyond `60 minutes` for `NWS-01`
  - zero output caused by validation failure rather than legitimate no-alert state
- Dashboard/status visibility for site visitors via workflow 08:
  - freshness timestamp
  - degraded/partial-data language when applicable
  - explicit separation between direct government alerts and alternate-transport context
- Operator debugging order:
  1. raw landing artifact
  2. validation log
  3. per-source normalized branch output
  4. published current envelope
  5. originating source website/feed

## 12. KNOWN RISKS AND MITIGATIONS

- Risk: eastside municipal public emergency coverage is weaker than Seattle/UW coverage
  - Mitigation: keep MVP centered on the verified route-wide and Seattle/UW sources; do not overstate eastside coverage. Grounding: `RESEARCH_FINDINGS.md`
- Risk: `NWS-01` can surface hazards owned by other lanes
  - Mitigation: apply `OVERLAP_NOTES.md` ownership suppression before publication
- Risk: police/fire editorial feeds can over-alert if location parsing is loose
  - Mitigation: require exact landmark or local gazetteer matches for automatic publication
- Risk: `DOH-02` is locality-coarse and HTML-parsed
  - Mitigation: keep secondary only; publish only clearly rider-relevant health notices
- Risk: credentialed or unstable follow-up sources may tempt scope creep
  - Mitigation: keep `WSDOT-01`, `REDM-01`, `BOTH-01`, `WOOD-01`, and `ISS-01` out of v1
- Risk: browser or CDN caching may outlive a source freshness threshold once workflow 08 publishes site files
  - Mitigation: workflow 08 must surface freshness timestamps and manage site cache invalidation; lane 07 only publishes internal artifacts

## 13. DEFERRED DECISIONS AND OPEN QUESTIONS

- Final production freshness thresholds remain subject to project-owner approval under `DEC-003`. This spec uses the researched draft defaults and must keep them configurable.
- Workflow-08 mandatory-versus-optional lane gating remains unresolved under `DEC-006`.
- Shared cross-lane severity taxonomy remains unresolved under `DEC-009`; lane 07 preserves its lane-native severity in the meantime.
- Cloudflare deployment project, domain, environment model, and cache-control specifics remain deferred to workflow-08 and deployment decisions under `DEC-011` and `DEC-012`.
- Notification channel for unattended failures remains unresolved under `DEC-013`.
- Review/quarantine reviewer workflow remains a later operational detail under `DEC-016`.

## 14. RESEARCH TRACEABILITY

| Decision in this spec | Research grounding |
|---|---|
| MVP sources are `NWS-01`, `SEA-01`, `UW-01` | `IMPLEMENTATION_RECOMMENDATION.md`, `UW_ISSY_07_GOVERNMENT_SAFETY_ALERTS_IMPLEMENTATION_RECOMMENDATION_v1.md`, `ENV_AND_READINESS.md` |
| Secondary sources are `SEAFD-01`, `SEAPD-01`, `DOH-02`, `ST-01`, `KCMETRO-01` | `IMPLEMENTATION_RECOMMENDATION.md`, `RESEARCH_FINDINGS.md`, `ENV_AND_READINESS.md` |
| `NWS-01` is the route-wide structured backbone | `RESEARCH_FINDINGS.md`, `API_AND_FEED_TEST_RESULTS.md` Tests 2-5, `SOURCE_REGISTRY.json` |
| `SEA-01` and `UW-01` are the best local public-safety feeds | `RESEARCH_FINDINGS.md`, `API_AND_FEED_TEST_RESULTS.md` Tests 7-8 and 11-12 |
| `SEAFD-01` and `SEAPD-01` remain secondary editorial context | `RESEARCH_FINDINGS.md`, `API_AND_FEED_TEST_RESULTS.md` Tests 9-10, `SOURCE_REGISTRY.json` |
| `DOH-02` is secondary and HTML-parsed | `RESEARCH_FINDINGS.md`, `API_AND_FEED_TEST_RESULTS.md` Test 21, `ENV_AND_READINESS.md`, `SOURCE_REGISTRY.json` |
| Transit alerts belong in alternate-transport context, not the primary hazard card | `RESEARCH_FINDINGS.md`, `IMPLEMENTATION_RECOMMENDATION.md`, `API_AND_FEED_TEST_RESULTS.md` Tests 22-23 |
| Route relevance uses `0.5 mi` direct-alert buffer and `1.0 mi` text/gazetteer proximity for ambiguous local posts | `ROUTE_RELEVANCE_AND_THRESHOLDS.md` |
| Route relevance must use local geometry and gazetteer logic, not external geocoding | `ROUTE_RELEVANCE_AND_THRESHOLDS.md`, plus work-order requirement for local math only |
| Stale thresholds are `15 minutes`, `30 minutes`, and `6 hours` by source class | `IMPLEMENTATION_RECOMMENDATION.md`, `UW_ISSY_07_GOVERNMENT_SAFETY_ALERTS_IMPLEMENTATION_RECOMMENDATION_v1.md`, `SOURCE_REGISTRY.json` |
| Preserve last-known-good and never replace good data with an empty error response | `IMPLEMENTATION_RECOMMENDATION.md`, `00_CDM_CONNECTOR_LESSONS_APPLIED.md` |
| Degrade rather than implying route safety when `NWS-01` fails | `IMPLEMENTATION_RECOMMENDATION.md`, `RESEARCH_FINDINGS.md`, `00_CDM_CONNECTOR_LESSONS_APPLIED.md` |
| Weather, flood, wildfire, air-quality, and closure overlaps are cross-listed rather than owned here in most cases | `OVERLAP_NOTES.md` |
| The lane writes only internal `data/connectors/` artifacts and never `public/data/` directly | `00_SHARED_AUTONOMOUS_CONNECTOR_BUILD_STANDARD.md`, `00_OPEN_CONNECTOR_ARCHITECTURE_DECISIONS.md` |
| The lane is ready to build for MVP but still honestly partial at the broader research/follow-up scope | `UW_ISSY_07_GOVERNMENT_SAFETY_ALERTS_AUDIT_REPORT_v1.md` |
