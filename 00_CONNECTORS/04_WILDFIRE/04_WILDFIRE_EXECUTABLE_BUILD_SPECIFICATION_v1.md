# 04_WILDFIRE_EXECUTABLE_BUILD_SPECIFICATION_v1

## 1. Overview

- Lane ID: `04_WILDFIRE`
- Lane name: `UW-Issaquah Wildfire Connector`
- Purpose: support cyclist go / caution / reroute / avoid decisions by detecting route-relevant wildfire incidents, fire perimeters, Red Flag Warning / Fire Weather Watch conditions, wildfire smoke extent, and burn restrictions, while explicitly separating wildfire context from route-owner closure authority and air-quality public-health ownership. Sources: `RESEARCH_FINDINGS.md`, `IMPLEMENTATION_RECOMMENDATION.md`, `OVERLAP_NOTES.md`.
- Canonical route source: `data/route/UnivWA-Issaquah.gpx`. Shared standard and local agent guidance both require this GPX as the route truth. Sources: `00_SHARED_AUTONOMOUS_CONNECTOR_BUILD_STANDARD.md`, `AGENTS.md`.
- Approved MVP source set:
  - `NIFC-01` WFIGS Current Wildland Fire Locations
  - `NIFC-02` WFIGS Current Interagency Fire Perimeters
  - `NWS-01` NOAA / NWS active alerts API
  - `NOAA-01` NOAA HMS smoke polygons
  - `KC-01` King County Fire Safety Burn Bans
  Sources: `IMPLEMENTATION_RECOMMENDATION.md`, `UW_ISSY_04_WILDFIRE_IMPLEMENTATION_RECOMMENDATION_v1.md`.
- Approved secondary source set:
  - `DNR-01`
  - `DNR-02`
  - `EFR-01`
  - `INCIWEB-01`
  - `KC-TRAIL-01`
  - `SEA-TRAIL-01`
  - `NASA-01` only after credentialing and live retest
  Sources: `IMPLEMENTATION_RECOMMENDATION.md`, `ENV_AND_READINESS.md`.
- High-level flow: fetch source payloads -> land raw payloads -> parse -> normalize to lane schema -> apply route relevance -> validate schema/freshness/deduplication -> publish candidate output and status artifacts -> preserve/update last-known-good -> hand off normalized output to workflow `08_ASSEMBLE_VALIDATE_BUILD_DEPLOY`. Sources: `00_SHARED_AUTONOMOUS_CONNECTOR_BUILD_STANDARD.md`, `IMPLEMENTATION_RECOMMENDATION.md`, `00_CDM_CONNECTOR_LESSONS_APPLIED.md`.
- Workflow-08 integration:
  - lane `04_WILDFIRE` publishes connector-owned normalized JSON only
  - workflow `08` consumes lane output, performs cross-lane deduplication and site-facing assembly
  - lane `04` never writes directly to `public/data/`
  Sources: `00_SHARED_AUTONOMOUS_CONNECTOR_BUILD_STANDARD.md`, `00_OPEN_CONNECTOR_ARCHITECTURE_DECISIONS.md`, `OVERLAP_NOTES.md`.
- Governing build standards:
  - shared build standard: `00_SHARED_AUTONOMOUS_CONNECTOR_BUILD_STANDARD.md`, effective for design immediately
  - approved architecture decisions: `00_OPEN_CONNECTOR_ARCHITECTURE_DECISIONS.md`, updated `2026-07-31`
  - CDM lessons adopted: connector independence, atomic publication, explicit stale/LKG handling, and route-corridor filtering before publication. Source: `00_CDM_CONNECTOR_LESSONS_APPLIED.md`.
- Readiness statement:
  - ready to build the lane workflow and validators now
  - not fully production-gate-complete because `DEC-003`, `DEC-006`, `DEC-009`, `DEC-011`, `DEC-012`, and `DEC-013` remain open for global workflow-08 deployment policy
  - lane-specific unresolved source gap remains unattended public evacuation feed coverage
  Sources: `UW_ISSY_04_WILDFIRE_AUDIT_REPORT_v1.md`, `00_OPEN_CONNECTOR_ARCHITECTURE_DECISIONS.md`.

## 2. SOURCE ACQUISITION STRATEGY

This lane uses one scheduled workflow with per-source due checks. The workflow runs every `15 minutes` in `America/Los_Angeles`; hourly and six-hour sources are fetched only when their next-due time has arrived. This preserves one connector workflow while honoring research cadences. Source cadence defaults come from `IMPLEMENTATION_RECOMMENDATION.md`. Final production freshness gates remain configurable because `DEC-003` is still open in `00_OPEN_CONNECTOR_ARCHITECTURE_DECISIONS.md`.

### MVP sources

#### `NIFC-01` — WFIGS Current Wildland Fire Locations

- Owning agency: National Interagency Fire Center / WFIGS
- Acquisition method: public ArcGIS REST JSON `FeatureServer/0/query`
- Fetch cadence: every `15 minutes`
- Freshness threshold: stale after `15 minutes`
- Credentials: none
- Authentication pattern: none; send descriptive User-Agent header
- n8n fetch pattern: one HTTP Request node with route-bbox prefilter and a second query only when additional incident details are needed
- Error handling:
  - on `429`, wait `60 seconds` and retry once
  - on non-`200` or ArcGIS error JSON, mark source `error`, preserve LKG, continue
  - on empty route result but healthy statewide response, treat as valid `no relevant events`
- Failure modes observed: ArcGIS Online request-unit `429`; empty route-bbox result is normal; incorrect state-code form causes false negatives
- Rate limiting: serialize WFIGS requests and avoid burst parallelism across `NIFC-01` and `NIFC-02`
- Network requirements: reachable from tested environment; no geo restriction observed
- Fallback sources: `DNR-01` for Washington corroboration, `INCIWEB-01` for narrative enrichment
- LKG: keep per-source normalized branch snapshot for `24 hours`; do not clear prior fire events on single-poll failure
- Research basis: `API_AND_FEED_TEST_RESULTS.md`, `SOURCE_REGISTRY.json`, `IMPLEMENTATION_RECOMMENDATION.md`

#### `NIFC-02` — WFIGS Current Interagency Fire Perimeters

- Owning agency: National Interagency Fire Center / WFIGS
- Acquisition method: public ArcGIS REST JSON `FeatureServer/0/query`
- Fetch cadence: every `15 minutes`
- Freshness threshold: stale after `15 minutes`
- Credentials: none
- Authentication pattern: none; same User-Agent discipline as `NIFC-01`
- n8n fetch pattern: HTTP Request node against current perimeter service, preferably using the same route bbox and serialized execution order as `NIFC-01`
- Error handling:
  - retry once after `60 seconds` for `429`
  - on ArcGIS error JSON, mark source `error`, keep location/events already normalized from other sources, continue merge
- Failure modes observed: same ArcGIS quota family as `NIFC-01`
- Rate limiting: no burst traffic; reuse `UniqueFireIdentifier` linkage instead of extra search queries
- Network requirements: reachable; no geo restriction observed
- Fallback sources: `NIFC-01` incident points for continuity, `INCIWEB-01` for incident page context
- LKG: keep last valid perimeter-derived route impact snapshot for `24 hours`
- Research basis: `API_AND_FEED_TEST_RESULTS.md`, `SOURCE_REGISTRY.json`

#### `NWS-01` — NOAA / NWS active alerts API

- Owning agency: National Weather Service / NOAA
- Acquisition method: GeoJSON over HTTPS
- Fetch cadence: every `15 minutes`
- Freshness threshold: stale after `15 minutes`
- Credentials: none
- Authentication pattern: no auth; descriptive User-Agent recommended
- n8n fetch pattern:
  - query `WAZ654`
  - query `WAZ657`
  - query `WAC033`
  - merge unique alert IDs
- Error handling:
  - on non-`200`, malformed GeoJSON, or stale top-level `updated`, mark source `error`
  - if one query fails and others succeed, keep branch `degraded` and continue
- Failure modes observed: none during testing; geometry may be null and still be valid
- Rate limiting: no numeric limit found; still use polite polling
- Network requirements: reachable; no geo restriction observed
- Fallback sources:
  - no equivalent direct fallback for Red Flag / Fire Weather Watch ownership
  - preserve LKG and mark route fire-weather status stale rather than clear
- LKG: keep route alert branch snapshot for `24 hours`
- Research basis: `API_AND_FEED_TEST_RESULTS.md`, `ROUTE_RELEVANCE_AND_THRESHOLDS.md`, `SOURCE_REGISTRY.json`

#### `NOAA-01` — NOAA HMS smoke polygons

- Owning agency: NOAA HMS / NESDIS
- Acquisition method: dated KML or shapefile ZIP download
- Fetch cadence: every `60 minutes`
- Freshness threshold: stale after `24 hours`
- Credentials: none
- Authentication pattern: none
- n8n fetch pattern:
  - build dated URL for current UTC date
  - fetch KML first
  - if KML missing or malformed, try shapefile ZIP path and mark branch degraded if fallback used
- Error handling:
  - on missing dated file, compare file date and `Last-Modified`
  - if last valid smoke file is older than `24 hours`, publish smoke branch as stale
  - malformed KML/ZIP goes to quarantine and does not overwrite valid smoke observations
- Failure modes observed: no stable `current` alias; dated-file discovery required
- Rate limiting: none published
- Network requirements: reachable; no geo restriction observed
- Fallback sources: no equivalent geometry fallback; `NWS-01` and lane `03_AIR_QUALITY` remain separate alert owners
- LKG: keep last valid smoke geometry branch for `24 hours`, but expose stale marker once threshold exceeded
- Research basis: `API_AND_FEED_TEST_RESULTS.md`, `ENV_AND_READINESS.md`, `SOURCE_REGISTRY.json`

#### `KC-01` — King County Fire Safety Burn Bans

- Owning agency: King County Local Services / Fire Safety
- Acquisition method: HTML scrape of authoritative page
- Fetch cadence: every `6 hours`
- Freshness threshold: stale after `6 hours`
- Credentials: none
- Authentication pattern: none
- n8n fetch pattern:
  - HTTP Request node
  - HTML Extract node for current status/stage block
  - validator requires current-status section to be present
- Error handling:
  - on missing expected status block, mark `error` and keep prior advisory
  - on `200` with parse drift, store raw HTML landing and quarantine parsed result
- Failure modes observed: page has no reliable operational timestamp in the current status block; HTML comments are not trustworthy freshness markers
- Rate limiting: none published
- Network requirements: reachable; no geo restriction observed
- Fallback sources: `DNR-02` for DNR-land context, `EFR-01` for Sammamish/Issaquah local context; neither replaces countywide King County legal context
- LKG: keep last valid county burn-ban advisory for `72 hours`; after that keep record only as stale context and set connector `degraded`
- Research basis: `API_AND_FEED_TEST_RESULTS.md`, `ENV_AND_READINESS.md`, `SOURCE_REGISTRY.json`

### Secondary sources

#### `DNR-01`

- Use: Washington-specific wildfire corroboration and small-fire context
- Acquisition: ArcGIS REST JSON
- Cadence / freshness: every `30 minutes`; stale after `30 minutes`
- Credentials: none
- Failure handling: non-blocking secondary branch; keep LKG and do not override WFIGS ownership
- Fallback: `NIFC-01`, `INCIWEB-01`
- LKG: `24 hours`
- Research basis: `API_AND_FEED_TEST_RESULTS.md`, `SOURCE_REGISTRY.json`

#### `DNR-02`

- Use: DNR fire-danger and DNR-land burn-ban context
- Acquisition: ArcGIS REST JSON point-in-polygon query
- Cadence / freshness: every `6 hours`; stale after `6 hours`
- Credentials: none
- Failure handling: non-blocking advisory context branch
- Fallback: `KC-01`, `EFR-01`
- LKG: `72 hours`
- Research basis: `API_AND_FEED_TEST_RESULTS.md`, `SOURCE_REGISTRY.json`

#### `EFR-01`

- Use: Sammamish / Issaquah local burn-restriction context
- Acquisition: HTML scrape of homepage / AlertCenter pages
- Cadence / freshness: every `6 hours`; stale after `6 hours`
- Credentials: none
- Failure handling: non-blocking local advisory branch; template drift expected
- Fallback: `KC-01`, `DNR-02`
- LKG: `72 hours`
- Research basis: `API_AND_FEED_TEST_RESULTS.md`, `ENV_AND_READINESS.md`

#### `INCIWEB-01`

- Use: official narrative enrichment and incident-page URL enrichment
- Acquisition: RSS XML
- Cadence / freshness: every `30 minutes`; stale after `30 minutes`
- Credentials: none
- Failure handling: non-blocking enrichment source; never sole incident trigger
- Fallback: none required because `NIFC-01`/`NIFC-02` are primary
- LKG: `24 hours`
- Research basis: `API_AND_FEED_TEST_RESULTS.md`, `SOURCE_REGISTRY.json`

#### `KC-TRAIL-01`

- Use: authoritative fire-caused closure fallback for East Lake Sammamish Trail sections
- Acquisition: HTML trail-owner page scrape
- Cadence / freshness: every `6 hours`; stale after `6 hours`
- Credentials: none
- Failure handling: closure-confirmation branch only; if parse fails, do not infer closure from wildfire proximity
- Fallback: none; leave closure ownership to route-owner page or workflow-08 shared closure feed
- LKG: `72 hours`
- Research basis: `IMPLEMENTATION_RECOMMENDATION.md`, `OVERLAP_NOTES.md`, `API_AND_FEED_TEST_RESULTS.md`

#### `SEA-TRAIL-01`

- Use: authoritative fire-caused closure fallback for Seattle Burke-Gilman sections
- Acquisition: HTML page scrape; currently weaker unattended extraction
- Cadence / freshness: every `6 hours`; stale after `6 hours`
- Credentials: none
- Failure handling: optional secondary source; shell-heavy HTML means parse failures are expected and non-blocking
- Fallback: none
- LKG: `72 hours`
- Research basis: `API_AND_FEED_TEST_RESULTS.md`, `ENV_AND_READINESS.md`

#### `NASA-01`

- Use: future hotspot corroboration only, not first-release rider-facing incident ownership
- Acquisition: FIRMS API after credentialing
- Cadence / freshness: disabled until credential exists; proposed future cadence every `15 minutes`
- Credentials: `NASA_FIRMS_MAP_KEY`
- Authentication pattern: API key in URL path / query according to FIRMS API contract; keep secret in n8n credential/env storage only
- Failure handling: if key missing or `400 Invalid MAP_KEY.`, branch stays disabled and does not affect connector status
- Rate limiting: docs state `5000 transactions / 10-minute interval`
- Network requirements: reachable from tested environment
- Fallback: `NIFC-01`, `NIFC-02`, `DNR-01`
- LKG: not applicable until enabled
- Research basis: `API_AND_FEED_TEST_RESULTS.md`, `ENV_AND_READINESS.md`

## 3. Normalization and Validation

### Normalized output schema shape

The lane publishes one canonical connector envelope following the shared connector contract, with wildfire-specific use of `events`, `observations`, `route_sections`, optional `advisories`, and optional `ownership_annotations`. Sources: `00_SHARED_AUTONOMOUS_CONNECTOR_BUILD_STANDARD.md`, `NORMALIZED_SCHEMA_PROPOSAL.md`, `OVERLAP_NOTES.md`.

Top-level shape:

```json
{
  "schema_version": "1.0.0",
  "connector_id": "04_WILDFIRE",
  "connector_name": "UW-Issaquah Wildfire Connector",
  "connector_version": "v0001",
  "lane": "04_WILDFIRE",
  "run_id": "04_WILDFIRE-20260731T190000Z-001",
  "generated_at": "2026-07-31T19:00:00Z",
  "published_at": "2026-07-31T19:00:02Z",
  "data_status": "ok",
  "freshness": {},
  "manifest_ref": {},
  "source_health": [],
  "connector_health": {},
  "events": [],
  "observations": [],
  "route_sections": [],
  "provenance": {},
  "validation_state": {},
  "metadata": {},
  "advisories": [],
  "ownership_annotations": []
}
```

### Illustrative JSON example

This example is illustrative but grounded in live-tested route conditions observed on `2026-07-29`: no route-intersecting WFIGS incidents, no active NWS fire-weather alerts, active King County Stage 1 burn restrictions, and DNR route-point danger context near Marymoor. It is not a fabricated fire incident. Sources: `API_AND_FEED_TEST_RESULTS.md`, `NORMALIZED_SCHEMA_PROPOSAL.md`.

```json
{
  "schema_version": "1.0.0",
  "connector_id": "04_WILDFIRE",
  "connector_name": "UW-Issaquah Wildfire Connector",
  "connector_version": "v0001",
  "lane": "04_WILDFIRE",
  "run_id": "04_WILDFIRE-20260729T194032Z-001",
  "generated_at": "2026-07-29T19:40:32Z",
  "published_at": "2026-07-29T19:40:35Z",
  "data_status": "ok",
  "freshness": {
    "overall_state": "fresh",
    "computed_at": "2026-07-29T19:40:35Z",
    "oldest_relevant_source_age_minutes": 10,
    "stale_source_ids": []
  },
  "manifest_ref": {
    "manifest_id": "04_WILDFIRE-v0001",
    "schema_version": "1.0.0"
  },
  "source_health": [
    {
      "source_id": "04_WILDFIRE:NIFC-01",
      "status": "ok",
      "last_retrieved_at": "2026-07-29T19:30:00Z",
      "freshness_state": "fresh",
      "http_status": 200,
      "note": "Healthy response; route bbox returned 0 relevant incidents."
    },
    {
      "source_id": "04_WILDFIRE:NIFC-02",
      "status": "ok",
      "last_retrieved_at": "2026-07-29T19:30:20Z",
      "freshness_state": "fresh",
      "http_status": 200,
      "note": "Healthy response; route bbox returned 0 relevant perimeters."
    },
    {
      "source_id": "04_WILDFIRE:NWS-01",
      "status": "ok",
      "last_retrieved_at": "2026-07-29T19:31:00Z",
      "freshness_state": "fresh",
      "http_status": 200,
      "note": "WAZ654, WAZ657, and WAC033 returned empty active FeatureCollections."
    },
    {
      "source_id": "04_WILDFIRE:NOAA-01",
      "status": "ok",
      "last_retrieved_at": "2026-07-29T19:05:00Z",
      "freshness_state": "fresh",
      "http_status": 200,
      "note": "Smoke KML for 2026-07-29 downloaded successfully."
    },
    {
      "source_id": "04_WILDFIRE:KC-01",
      "status": "ok",
      "last_retrieved_at": "2026-07-29T19:10:00Z",
      "freshness_state": "fresh",
      "http_status": 200,
      "note": "Current burn-ban status block parsed successfully."
    }
  ],
  "connector_health": {
    "status": "healthy",
    "primary_sources_ok": 5,
    "primary_sources_total": 5,
    "using_last_known_good": false
  },
  "events": [],
  "observations": [
    {
      "observation_id": "obs_dnr_fdra_central_lowlands_20260729",
      "source_id": "04_WILDFIRE:DNR-02",
      "observation_type": "wildfire_danger_context",
      "title": "Central Lowlands FDRA danger context at route point",
      "severity": "moderate",
      "route_relevance": "segment_specific",
      "route_match_method": "point_in_polygon",
      "segment_ids": [
        "redmond_marymoor"
      ],
      "observed_at": "2026-07-29T19:30:00Z",
      "public_note": "DNR route-point query returned High fire danger and rule-burn ban context near Marymoor."
    }
  ],
  "route_sections": [
    {
      "segment_id": "redmond_marymoor",
      "segment_name": "Redmond / Marymoor",
      "status": "burn_restriction_context",
      "severity": "low",
      "reason_codes": [
        "DNR_FIRE_DANGER_CONTEXT"
      ],
      "event_ids": [],
      "advisory_ids": [
        "adv_kc_stage1_20260729"
      ]
    }
  ],
  "provenance": {
    "route_source": "data/route/UnivWA-Issaquah.gpx",
    "source_ids": [
      "04_WILDFIRE:NIFC-01",
      "04_WILDFIRE:NIFC-02",
      "04_WILDFIRE:NWS-01",
      "04_WILDFIRE:NOAA-01",
      "04_WILDFIRE:KC-01"
    ]
  },
  "validation_state": {
    "schema_valid": true,
    "freshness_valid": true,
    "deduplication_valid": true,
    "published_from_candidate": true
  },
  "metadata": {
    "route_fire_zones": [
      "WAZ654",
      "WAZ657"
    ],
    "route_county_code": "WAC033",
    "source_retrieved_at": {
      "NIFC-01": "2026-07-29T19:30:00Z",
      "NIFC-02": "2026-07-29T19:30:20Z",
      "NWS-01": "2026-07-29T19:31:00Z",
      "NOAA-01": "2026-07-29T19:05:00Z",
      "KC-01": "2026-07-29T19:10:00Z"
    }
  },
  "advisories": [
    {
      "advisory_id": "adv_kc_stage1_20260729",
      "source_id": "04_WILDFIRE:KC-01",
      "advisory_type": "burn_restriction",
      "title": "King County Stage 1 burn restriction",
      "severity": "low",
      "route_relevance": "route_wide",
      "route_match_method": "county_match",
      "effective_at": null,
      "expires_at": null,
      "jurisdiction": "King County",
      "public_note": "County burn restrictions were active during live validation; legal effect is strongest in unincorporated King County."
    }
  ],
  "ownership_annotations": [
    {
      "record_id": "adv_kc_stage1_20260729",
      "canonical_owner_lane": "04_WILDFIRE",
      "shared_with_lanes": [],
      "dedupe_key": "burn_restriction:king_county:stage1"
    }
  ]
}
```

### Required fields

- Outer envelope fields required by shared standard:
  - `schema_version`
  - `connector_id`
  - `connector_name`
  - `connector_version`
  - `lane`
  - `run_id`
  - `generated_at`
  - `published_at` (nullable for candidate-only)
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
- Wildfire lane required record-level fields:
  - every `event` requires `event_id`, `source_id`, `event_type`, `title`, `severity`, `route_relevance`, `route_match_method`
  - every `advisory` requires `advisory_id`, `source_id`, `advisory_type`, `title`, `severity`, `route_relevance`, `route_match_method`
  - every `source_health` record requires `source_id`, `status`, `last_retrieved_at`, `freshness_state`
  Sources: `00_SHARED_AUTONOMOUS_CONNECTOR_BUILD_STANDARD.md`, `NORMALIZED_SCHEMA_PROPOSAL.md`

### Optional fields

- `published_at` when candidate-only
- `advisories`
- `ownership_annotations`
- event fields `started_at`, `updated_at`, `geometry_type`, `location_label`, `route_distance_miles`, `source_event_id`
- advisory fields `effective_at`, `expires_at`, `jurisdiction`, `area_desc`
- observation fields `observed_at`, `segment_ids`
- `metadata.source_retrieved_at`
- `connector_health.error_messages`
- reserved future fields listed in section 7

### Enum-like fields

- `data_status`: `ok`, `degraded`, `stale`, `no_relevant_events`, `failed_validation`, `failed_fetch`, `blocked`, `using_last_known_good`
- connector `status`: `healthy`, `degraded`, `failed`
- source `status`: `ok`, `stale`, `error`, `skipped`, `using_last_known_good`
- `freshness.overall_state`: `fresh`, `stale`, `mixed`, `unknown`
- `severity`: `none`, `low`, `moderate`, `high`, `extreme`
- `event_type`: `wildfire`, `prescribed_burn`, `fire_related_closure`, `evacuation`
- `advisory_type`: `smoke_plume`, `red_flag_warning`, `fire_weather_watch`, `burn_restriction`
- `observation_type`: `wildfire_danger_context`, `smoke_context`, `source_gap_note`
- `route_relevance`: `confirmed_route_impact`, `near_route`, `route_wide`, `segment_specific`, `contextual_only`, `not_route_relevant`
- `route_match_method`: `point_distance`, `polygon_intersection`, `fire_zone_match`, `county_match`, `service_area_match`, `named_trail_match`, `point_in_polygon`, `manual_review`

### Timestamp semantics

- All timestamps are ISO 8601 UTC with trailing `Z`
- `generated_at`: when normalized envelope was assembled
- `published_at`: when candidate became published output; may be `null` before promotion
- `last_retrieved_at`: source payload fetch completion time
- `started_at`: source-reported incident start/discovery time if available
- `updated_at`: source-reported incident update/modification time if available
- `effective_at` / `expires_at`: advisory validity window from source if available
- `observed_at`: time of observation record or source snapshot used
- `last_successful_update`: stored under `metadata` or `connector_health` in status artifact for LKG semantics

### Geographic fields

- Coordinates use decimal degrees EPSG:4326
- Route geometry comes only from `data/route/UnivWA-Issaquah.gpx`
- Required geographic metadata:
  - route bbox `47.55207-47.75889 / -122.3057 to -122.04414`
  - fire zones `WAZ654`, `WAZ657`
  - county code `WAC033`
- Event/advisory geographic fields may include:
  - `latitude`, `longitude`
  - `geometry_type`
  - `route_distance_miles`
  - `segment_ids`
  - `location_label`
  - `jurisdiction`
  Sources: `RESEARCH_FINDINGS.md`, `ROUTE_RELEVANCE_AND_THRESHOLDS.md`, `SOURCE_REGISTRY.json`

### Source attribution and provenance

- Every published record keeps lane-namespaced `source_id` such as `04_WILDFIRE:NIFC-01`
- Keep source-native IDs when available:
  - WFIGS `UniqueFireIdentifier`
  - NWS alert `id`
  - InciWeb item link or GUID
- `provenance.source_ids` lists all contributing sources for the run
- `ownership_annotations` carry workflow-08 dedupe hints where hazards are shared with other lanes

### Validators run on every publication

- Schema validation:
  - required outer-envelope keys present
  - arrays exist even when empty
  - enum values from this spec only
- Coordinate validation:
  - coordinates must fall inside a sane Washington envelope before route-distance math
  - route relevance must be computed against canonical GPX, not source bbox alone
- Timestamp freshness:
  - compare source-retrieved time and source-reported updated time to source threshold
  - invalid or future timestamps degrade to `unknown`/`stale`
- Source-health check:
  - non-`200`
  - malformed JSON / GeoJSON / XML / KML / HTML parse drift
  - stale top-level metadata or missing required status block
- Deduplication check:
  - no duplicate `event_id` / `advisory_id`
  - same WFIGS incident must not publish twice from point and perimeter branches
  - same NWS alert ID must not publish twice across zone and county queries
- Validation behavior:
  - invalid record -> quarantine record, log error, continue connector if remaining output stays valid
  - invalid merged output -> do not overwrite published output; preserve prior published/LKG artifacts
  Sources: `00_SHARED_AUTONOMOUS_CONNECTOR_BUILD_STANDARD.md`, `00_CDM_CONNECTOR_LESSONS_APPLIED.md`

## 4. ROUTE RELEVANCE CALCULATION

### Decision by source family

- `NIFC-01`:
  - include when incident point is `<= 5 miles` from route line
  - elevate to high-priority route event at `<= 2 miles`
  - ignore county membership alone
- `NIFC-02`:
  - include when perimeter intersects a `10-mile` route buffer
  - elevate when perimeter intersects a `2-mile` route buffer or route line
- `NWS-01`:
  - if alert geometry exists, use polygon-route intersection
  - if geometry is null, any active Red Flag Warning or Fire Weather Watch affecting `WAZ654` or `WAZ657` is route-relevant
  - county code `WAC033` is secondary confirmation, not sole logic for fire-weather ownership
- `NOAA-01`:
  - include when smoke polygon intersects a `5-mile` route buffer
  - elevate to high severity when `medium` or `heavy` plume intersects the route line itself
- `KC-01`:
  - countywide relevance by design because the route is entirely in King County
  - publish as context, not as proof of direct route closure
- `DNR-02`:
  - point-in-polygon or route-point-in-polygon context only
  - never flatten DNR-only land rules into route-wide legal restriction
- `EFR-01`:
  - service-area and route-section match only
- `KC-TRAIL-01` / `SEA-TRAIL-01`:
  - named trail match or closure geometry within `0.25 mile` of route line
- Evacuation:
  - include only with official source and polygon intersection with route line or `1-mile` route buffer, or clear named route/trail/city match when geometry is absent
  Sources: `ROUTE_RELEVANCE_AND_THRESHOLDS.md`, `RESEARCH_FINDINGS.md`, `UW_ISSY_04_WILDFIRE_IMPLEMENTATION_RECOMMENDATION_v1.md`

### n8n implementation sketch

1. Load canonical GPX-derived route vertices from local route file or precomputed route-geometry JSON fixture.
2. Run source-specific class filtering first:
   - WFIGS `IncidentTypeCategory = WF` for wildfire
   - keep `RX` separate as prescribed burn
   - exclude structure-fire-like records by default
3. Apply cheap bbox prefilter using route bbox only to reduce payload work.
4. In a Code node:
   - compute point-to-polyline minimum Haversine distance for point sources
   - compute polygon relevance by checking:
     - polygon bbox overlap with route buffer bbox
     - any route vertex inside polygon
     - any polygon vertex within threshold distance of route line
5. For NWS null-geometry alerts, match `affectedZones` and `UGC` against `WAZ654` and `WAZ657`; use `WAC033` only as supporting scope check.
6. For closure pages, match normalized trail names:
   - `Burke-Gilman Trail`
   - `Sammamish River Trail`
   - `East Lake Sammamish Trail`
   - route-owner section names from lane `01` / `06` work
7. Store `route_match_method`, `route_distance_miles`, matched segment IDs, and reason codes on each normalized record.

### Edge cases and fallback logic

- Point source missing coordinates: do not publish as route-relevant unless same incident links to a relevant `NIFC-02` perimeter
- Polygon source with broken geometry: quarantine record, rely on linked incident point if present
- NWS alert with null geometry and no route-zone match: keep as not route-relevant
- Ambiguous closure text without route/trail match: keep in logs/manual review only
- Prescribed burn within threshold:
  - publish only if smoke, closure, or official warning also affects route
  - otherwise keep as contextual-only
- Countywide King County burn restriction:
  - always publish as route-wide context
  - never escalate to closure or direct impact without another source

### Geographic bounds check

- Pre-filter envelope: route bbox `min_lat 47.55207`, `max_lat 47.75889`, `min_lon -122.3057`, `max_lon -122.04414`
- Sane-source envelope for coordinate validity before any route math:
  - latitude `47.0` to `48.3`
  - longitude `-123.0` to `-121.0`
- Strict route-relevance envelope:
  - points must survive the exact mileage threshold
  - polygons must survive the actual intersection rule
  - bbox hits alone are never publication proof
  Sources: `RESEARCH_FINDINGS.md`, `ROUTE_RELEVANCE_AND_THRESHOLDS.md`, `00_CDM_CONNECTOR_LESSONS_APPLIED.md`

## 5. FRESHNESS, FAILURE, AND FALLBACK

### Freshness rules

- `NIFC-01`, `NIFC-02`, `NWS-01`: stale after `15 minutes`
- `INCIWEB-01`: stale after `30 minutes`
- `NOAA-01`: stale after `24 hours`
- `KC-01`, `DNR-02`, `EFR-01`, closure fallback pages: stale after `6 hours`
- `DNR-01`: stale after `30 minutes`
- Record-level freshness:
  - if source payload is fresh but source record timestamp is invalid or in the future, mark that record `unknown` freshness and do not let it prove freshness for the whole connector
  Sources: `IMPLEMENTATION_RECOMMENDATION.md`, `UW_ISSY_04_WILDFIRE_IMPLEMENTATION_RECOMMENDATION_v1.md`, `00_CDM_CONNECTOR_LESSONS_APPLIED.md`

### Stale-data marking

- Do not null out healthy historical records silently
- Mark stale state in:
  - `data_status = stale` or `using_last_known_good`
  - `freshness.stale_source_ids`
  - `source_health[].freshness_state`
  - status artifact `stale_data_fields`
- Published records may keep their last values while adding:
  - `metadata.last_successful_update`
  - `connector_health.using_last_known_good = true`

### Last-known-good caching

- Yes, this lane caches LKG
- Keep:
  - lane-level last valid normalized output snapshot
  - per-source last valid parsed branch snapshot where useful
- Minimum retention for active LKG: until superseded by newer valid LKG, per shared architecture decision `DEC-004`
- Operational use:
  - one failed poll does not clear prior fire / warning / smoke / burn restriction data
  - stale markers must make LKG use explicit

### Failure scenarios and recovery

- Source API down:
  - use source LKG if within stale horizon
  - mark source `error`
  - keep connector output `degraded` or `using_last_known_good`
- Source returns `4xx`:
  - `429`: back off `60 seconds`, retry once
  - other `4xx`: skip source for this run, preserve LKG, continue
- Source returns `500`:
  - retry once after short backoff
  - if second failure, continue connector with source marked `error`
- Network unreachable:
  - log sanitized error
  - use LKG if available
- Malformed response:
  - quarantine parsed artifact
  - keep raw landing
  - skip source branch
- Empty but valid route result:
  - publish `no_relevant_events` for that branch, not an error
- Closure page ambiguous:
  - do not infer route closure from wildfire proximity alone
  Sources: `IMPLEMENTATION_RECOMMENDATION.md`, `API_AND_FEED_TEST_RESULTS.md`, `00_CDM_CONNECTOR_LESSONS_APPLIED.md`

### Drop horizons

- Drop stale source branch from active route summary after:
  - `24 hours` for `NIFC-01`, `NIFC-02`, `NWS-01`, `INCIWEB-01`
  - `48 hours` for `NOAA-01`
  - `72 hours` for `KC-01`, `DNR-02`, `EFR-01`, closure pages
- Even after drop, retain historical artifacts per retention policy in `DEC-004`
- If all MVP branches exceed their stale horizon, connector `data_status` becomes `stale` and workflow-08 should treat lane output as non-fresh

### Workflow-08 cross-lane deduplication participation

- Yes
- Lane `04` emits:
  - canonical owner hints for Red Flag Warning, Fire Weather Watch, and burn restrictions
  - shared-ownership hints for smoke, evacuation, and fire-related closure
  - dedupe keys per record
- Workflow-08 is still the final dedupe authority; lane `04` only supplies evidence and ownership metadata. Sources: `00_SHARED_AUTONOMOUS_CONNECTOR_BUILD_STANDARD.md`, `OVERLAP_NOTES.md`

## 6. Evidence and Validation Outputs

These lane-facing artifacts prove fetch, parse, normalize, and publish behavior. They use the required `data/connectors/` structure for this specification. Implementation may additionally mirror equivalent artifacts into the shared-standard artifact-class directories, but the following paths are the lane contract for review and evidence.

### Landing files

- Path pattern: `data/connectors/04_WILDFIRE/landings/<source_id>_landing_<timestamp>.json`
- One file per fetch attempt
- Contents:
  - `source_id`
  - `retrieved_at`
  - `http_status`
  - `content_type`
  - `source_url`
  - sanitized headers of operational value
  - payload body or body reference
- Retention: keep last `3` cycles or `24 hours`, whichever is longer
- Examples:
  - `data/connectors/04_WILDFIRE/landings/NIFC-01_landing_20260731T190000Z.json`
  - `data/connectors/04_WILDFIRE/landings/KC-01_landing_20260731T180000Z.json`

### Normalized output

- Path pattern: `data/connectors/04_WILDFIRE/output/04_WILDFIRE_normalized_output_<timestamp>.json`
- One time-series file per execution
- This is the canonical lane handoff payload consumed by workflow-08
- Publish `current.json` symlink/alias behavior may be added later in implementation, but the immutable time-series file is the evidence artifact

### Validation log

- Path pattern: `data/connectors/04_WILDFIRE/validation/validation_log_<timestamp>.jsonl`
- One JSON line per validation event
- Minimum fields:
  - `timestamp`
  - `run_id`
  - `source_id`
  - `record_id`
  - `check`
  - `result`
  - `message`
  - `severity`

### Health / status report

- Path: `data/connectors/04_WILDFIRE/status.json`
- Overwritten each run
- Minimum fields:
  - `lane_id`
  - `connector_version`
  - `last_fetch_at`
  - `last_success_at`
  - `status`
  - `data_status`
  - `source_health`
  - `error_messages`
  - `stale_data_fields`
  - `using_last_known_good`

### Last-known-good artifact

- Path: `data/connectors/04_WILDFIRE/last_known_good/04_WILDFIRE_last_known_good.json`
- Updated only after a valid normalized output passes all publish validators
- Never overwritten by failed validation or malformed fetch output

### Quarantine artifacts

- Path pattern: `data/connectors/04_WILDFIRE/quarantine/<source_id>_<timestamp>.json`
- Use for malformed responses, invalid parsed records, and failed merged outputs
- Keep reason code and checksum alongside payload reference

## 7. DATA SCHEMA SPECIFICATION

### Authoritative normalized output

The authoritative normalized output is the shared connector envelope plus wildfire-specific record contracts below. The schema is defined by:

1. shared envelope requirements in `00_SHARED_AUTONOMOUS_CONNECTOR_BUILD_STANDARD.md`
2. wildfire record semantics in `NORMALIZED_SCHEMA_PROPOSAL.md`
3. overlap ownership rules in `OVERLAP_NOTES.md`

### Full JSON example

Use the section 3 example as the canonical illustrative sample. It is valid JSON and grounded in live-tested route conditions from `2026-07-29`.

### Field definitions

| Field | Type | Cardinality | Example | Definition |
|---|---|---|---|---|
| `schema_version` | string | required | `1.0.0` | Connector output schema version |
| `connector_id` | string | required | `04_WILDFIRE` | Lane identifier |
| `connector_name` | string | required | `UW-Issaquah Wildfire Connector` | Human-readable connector name |
| `connector_version` | string | required | `v0001` | Workflow/spec version |
| `lane` | string | required | `04_WILDFIRE` | Repeats lane ID |
| `run_id` | string | required | `04_WILDFIRE-20260731T190000Z-001` | Unique execution identifier |
| `generated_at` | string | required | `2026-07-31T19:00:00Z` | Envelope creation time |
| `published_at` | string or null | required nullable | `2026-07-31T19:00:02Z` | Publish/promote time |
| `data_status` | string | required | `ok` | Connector publication state |
| `freshness` | object | required | see example | Overall freshness object |
| `manifest_ref` | object | required | see example | Manifest and schema linkage |
| `source_health` | array | required | `[]` | Per-source health records |
| `connector_health` | object | required | see example | Overall connector health |
| `events` | array | required | `[]` | Discrete wildfire, closure, or evacuation events |
| `observations` | array | required | `[]` | Contextual non-discrete records such as DNR danger context |
| `route_sections` | array | required | `[]` | Segment rollups for workflow-08 and site display |
| `provenance` | object | required | see example | Route source and contributing source IDs |
| `validation_state` | object | required | see example | Validation outcomes for this artifact |
| `metadata` | object | required | see example | Supplemental route/source metadata |
| `advisories` | array | optional but recommended | `[]` | Smoke, fire-weather, and burn-ban advisories |
| `ownership_annotations` | array | optional | `[]` | Workflow-08 dedupe and ownership hints |

### `source_health[]`

| Field | Type | Required | Example |
|---|---|---|---|
| `source_id` | string | yes | `04_WILDFIRE:NIFC-01` |
| `status` | enum | yes | `ok` |
| `last_retrieved_at` | string | yes | `2026-07-29T19:30:00Z` |
| `freshness_state` | enum | yes | `fresh` |
| `http_status` | integer or null | no | `200` |
| `note` | string | no | `Healthy response; route bbox returned 0 relevant incidents.` |

### `events[]`

| Field | Type | Required | Example |
|---|---|---|---|
| `event_id` | string | yes | `evt_wfigs_skyo_20260729` |
| `source_id` | string | yes | `04_WILDFIRE:NIFC-01` |
| `source_event_id` | string or null | no | `WA-OWF-000319` |
| `event_type` | enum | yes | `wildfire` |
| `title` | string | yes | `Skyo Fire` |
| `status` | enum | yes | `active` |
| `severity` | enum | yes | `moderate` |
| `route_relevance` | enum | yes | `near_route` |
| `route_distance_miles` | number or null | no | `3.8` |
| `route_match_method` | enum | yes | `point_distance` |
| `segment_ids` | array | no | `["elst_sammamish"]` |
| `location_label` | string or null | no | `Eastside foothills` |
| `started_at` | string or null | no | `2026-07-29T15:10:00Z` |
| `updated_at` | string or null | no | `2026-07-29T19:25:00Z` |
| `geometry_type` | enum or null | no | `point` |
| `public_note` | string | yes | `Route-relevant wildfire within five miles of the route.` |

### `advisories[]`

| Field | Type | Required | Example |
|---|---|---|---|
| `advisory_id` | string | yes | `adv_nws_red_flag_waz657_20260731` |
| `source_id` | string | yes | `04_WILDFIRE:NWS-01` |
| `advisory_type` | enum | yes | `red_flag_warning` |
| `title` | string | yes | `Red Flag Warning` |
| `severity` | enum | yes | `high` |
| `route_relevance` | enum | yes | `route_wide` |
| `route_match_method` | enum | yes | `fire_zone_match` |
| `effective_at` | string or null | no | `2026-07-31T18:00:00Z` |
| `expires_at` | string or null | no | `2026-08-01T06:00:00Z` |
| `jurisdiction` | string or null | no | `WAZ657` |
| `area_desc` | string or null | no | `East Puget Sound Lowlands` |
| `public_note` | string | yes | `Fire-weather warning affects the route fire zone.` |

### `observations[]`

| Field | Type | Required | Example |
|---|---|---|---|
| `observation_id` | string | yes | `obs_dnr_fdra_central_lowlands_20260729` |
| `source_id` | string | yes | `04_WILDFIRE:DNR-02` |
| `observation_type` | enum | yes | `wildfire_danger_context` |
| `title` | string | yes | `Central Lowlands FDRA danger context at route point` |
| `severity` | enum | yes | `moderate` |
| `route_relevance` | enum | yes | `segment_specific` |
| `route_match_method` | enum | yes | `point_in_polygon` |
| `segment_ids` | array | no | `["redmond_marymoor"]` |
| `observed_at` | string or null | no | `2026-07-29T19:30:00Z` |
| `public_note` | string | yes | `DNR route-point query returned High fire danger and rule-burn ban context near Marymoor.` |

### `route_sections[]`

| Field | Type | Required | Example |
|---|---|---|---|
| `segment_id` | string | yes | `redmond_marymoor` |
| `segment_name` | string | yes | `Redmond / Marymoor` |
| `status` | enum | yes | `burn_restriction_context` |
| `severity` | enum | yes | `low` |
| `reason_codes` | array | yes | `["DNR_FIRE_DANGER_CONTEXT"]` |
| `event_ids` | array | yes | `[]` |
| `advisory_ids` | array | yes | `["adv_kc_stage1_20260729"]` |

### Enum definitions

- `event.status`: `active`, `monitoring`, `contained`, `closed`, `unknown`
- `route_sections.status`: `clear`, `nearby_fire`, `smoke_affected`, `warning_area`, `burn_restriction_context`, `closed`, `evacuation_related`
- `validation_state` booleans:
  - `schema_valid`
  - `freshness_valid`
  - `deduplication_valid`
  - `published_from_candidate`

### Coordinate and timestamp format

- Coordinates: decimal degrees, EPSG:4326
- Distances: miles in published route-distance fields
- Timestamps: ISO 8601 UTC strings ending in `Z`

### Reserved fields

These may be `null` or omitted until later phases:

- `geometry_wkt`
- `smoke_density_code`
- `evacuation_level`
- `manual_review_ticket_id`
- `cross_lane_resolution_note`

### Example error states

- Source failure but valid LKG:

```json
{
  "data_status": "using_last_known_good",
  "freshness": {
    "overall_state": "mixed",
    "stale_source_ids": [
      "04_WILDFIRE:NWS-01"
    ]
  },
  "connector_health": {
    "status": "degraded",
    "using_last_known_good": true
  }
}
```

- Validation failure:

```json
{
  "data_status": "failed_validation",
  "published_at": null,
  "validation_state": {
    "schema_valid": false,
    "freshness_valid": true,
    "deduplication_valid": true,
    "published_from_candidate": false
  }
}
```

## 8. N8N WORKFLOW ARCHITECTURE SKETCH

- Workflow name: `v0001.04_WildfireConnector`
- Workflow tags:
  - `uw_issy`
  - `connector`
  - `lane_04_wildfire`
  - `no_direct_deploy`
  - `production` or `active` depending on environment state
- Trigger:
  - Schedule Trigger every `15 minutes` in `America/Los_Angeles`
  - Manual execution allowed
- Overlap handling: prevent overlapping executions; if prior run still active, skip next scheduled run

### Pseudocode structure

```text
Trigger (15-minute schedule, non-overlapping)
  -> Initialize run metadata, due-times, and route geometry
  -> For each MVP source branch:
    -> If source is due:
      -> Fetch payload
      -> Write landing artifact
      -> Parse response
      -> Validate payload shape
      -> Normalize records
      -> Apply route relevance
      -> Validate normalized records
      -> Write branch diagnostics / quarantine on failure
    -> Else:
      -> Load latest valid branch snapshot or skip as not due
  -> Optional secondary-source branches on their own due checks
  -> Merge WFIGS locations and perimeters by UniqueFireIdentifier
  -> Merge NWS zone/county alerts by alert ID
  -> Add burn-ban, smoke, and context observations
  -> Apply connector-level dedupe and status derivation
  -> Validate merged envelope
  -> Write normalized output time-series artifact
  -> Update last-known-good if valid
  -> Write validation log
  -> Write status report
```

### Node groups

1. `Trigger / Init`
   - Schedule Trigger
   - Code node for run ID, due-time checks, and route metadata
2. `Fetch`
   - HTTP Request nodes for WFIGS, NWS, NOAA HMS, DNR, InciWeb, HTML pages
3. `Land Raw`
   - write raw landing JSON file before destructive parsing
4. `Parse`
   - JSON parse for ArcGIS and NWS
   - XML parse for RSS
   - HTML Extract for county/local pages
   - KML parse or structured text extraction for NOAA HMS
5. `Normalize`
   - source-specific Code nodes producing common event/advisory/observation records
6. `Route Relevance`
   - Code nodes for point distance, polygon intersection, zone matching, and named-trail matching
7. `Deduplicate / Merge`
   - WFIGS incident/perimeter join by `UniqueFireIdentifier`
   - NWS zone/county merge by alert `id`
8. `Validate / Publish`
   - envelope validation
   - atomic file write
   - read-back validation
9. `Status / Evidence`
   - validation log
   - status report
   - LKG update

### Error handling

- One source failure does not fail the whole connector if a valid merged envelope can still be produced
- Connector emits partial/degraded output when at least one MVP branch remains valid and no invalid artifact is promoted
- If merged envelope fails validation, no published overwrite occurs

### Retry strategy

- `429`: one retry after `60 seconds`
- `5xx` or network timeout: one retry after short backoff
- HTML parse drift or malformed payload: no automatic parse retry; quarantine and continue

### Logging

- `info`: fetch start/end, due-check skip, successful parse, successful publish
- `warning`: stale source, LKG use, partial branch failure, parse drift
- `error`: fetch failure after retry, schema failure, candidate publish rejection

### Performance considerations

- Expected runtime: under `2 minutes` for normal 15-minute executions, because only due sources fetch
- Do not parallelize WFIGS queries aggressively
- NWS zone queries can run in parallel
- HTML branches are lightweight and infrequent
- Route geometry should be loaded once per run, not recomputed per record

## 9. Integration with Workflow-08 and Publication

### What workflow-08 consumes

- The normalized output JSON from `data/connectors/04_WILDFIRE/output/`
- Status metadata from `data/connectors/04_WILDFIRE/status.json`
- Ownership/dedupe hints from `ownership_annotations`
- Provenance and source-health metadata for freshness labeling

### Cross-lane deduplication rules

- Smoke:
  - lane `03_AIR_QUALITY` owns public AQ warning card
  - lane `04_WILDFIRE` contributes wildfire smoke geometry/context only
- Fire-weather alerts:
  - lane `04_WILDFIRE` is canonical owner for Red Flag Warning and Fire Weather Watch
  - workflow-08 suppresses duplicate display from `02_WEATHER` or `07_GOVERNMENT_SAFETY_ALERTS`
- Fire-related closure:
  - route-owner closure source owns closure status
  - wildfire lane owns incident context
- Evacuation:
  - one record per official issuing authority and area; no inferred wildfire-only evacuation records
- Burn restrictions:
  - keep separate by authority and jurisdiction; do not flatten
  Sources: `OVERLAP_NOTES.md`

### Site republication

- Workflow-08 decides site publication timing
- Lane `04` responsibility ends at candidate/published connector artifact production and accurate health metadata
- Given open architecture decisions, this spec assumes workflow-08 will republish after its own lane-gate evaluation, not immediately after any single lane run. Source: `00_OPEN_CONNECTOR_ARCHITECTURE_DECISIONS.md`.

### Responsibility split

- Lane `04`:
  - fetch wildfire sources
  - normalize wildfire data
  - compute route relevance
  - emit lane health, LKG, and evidence
- Workflow-08:
  - cross-lane deduplication
  - site-wide severity/display rollups
  - `public/data/` generation
  - deploy gating and eventual site publication
  Sources: `00_SHARED_AUTONOMOUS_CONNECTOR_BUILD_STANDARD.md`, `OVERLAP_NOTES.md`

## 10. Testing and Validation Strategy

### Unit tests

- Route-distance math:
  - point within `2 miles`
  - point within `5 miles`
  - point beyond `5 miles`
- Polygon relevance:
  - route-line intersection
  - `10-mile` perimeter buffer hit
  - `5-mile` smoke buffer hit
- NWS zone logic:
  - null-geometry alert with `WAZ657`
  - non-route zone alert rejected
- Freshness logic:
  - valid timestamp
  - stale timestamp
  - missing/future timestamp
- Deduplication:
  - same `UniqueFireIdentifier` from `NIFC-01` and `NIFC-02`
  - same NWS alert ID from zone and county query

### Integration tests

- Live fetch tests for all MVP sources using the exact tested endpoints documented in `API_AND_FEED_TEST_RESULTS.md`
- Validate that:
  - healthy empty route results produce valid empty arrays, not errors
  - county burn-ban page still yields a parseable status block
  - NOAA dated file for current date still downloads

### Regression tests

- Known July 29, 2026 research facts must remain reproducible:
  - `NIFC-01` route bbox count `0`
  - `NIFC-02` route bbox count `0`
  - `NWS-01` route zone queries return valid empty FeatureCollections
  - `DNR-01` King County current-fire query returns records that still require distance suppression
  Sources: `API_AND_FEED_TEST_RESULTS.md`

### Mock tests

- Store fixture responses derived from `sample-responses/`
- Example mock:
  - `sample-responses/wfigs_incident_skyo.json`
  - assert classification `wildfire`
  - assert no publication if computed route distance exceeds `5 miles`

### Failure tests

- Simulate WFIGS `429` and verify single retry plus degraded continuation
- Simulate malformed NOAA KML and verify quarantine
- Simulate King County page without current-status selector and verify parse drift handling
- Simulate NWS null geometry with route-zone match and verify advisory still publishes

### Evidence of test success

- Pass criteria:
  - all schema validations pass
  - no invalid JSON written to output path
  - stale/failure cases preserve prior LKG
  - dedupe count matches expectations
- Evidence files:
  - test log
  - produced normalized fixture output
  - validation log excerpts

## 11. Monitoring and Observability

### Key metrics

- fetch success rate per source
- parse success rate per source
- normalized event count
- advisory count
- stale-source percentage
- runs using LKG
- validation failure count

### Alerts

- notify human operator when:
  - any MVP source fails for `3` consecutive due runs
  - all MVP sources become stale
  - wildfire lane produces zero-byte or invalid output
  - lane stays in `using_last_known_good` for more than `24 hours`
  - county burn-ban page parse fails for more than `12 hours`
- Final notification channel remains an ops decision outside this lane spec. Source: `00_OPEN_CONNECTOR_ARCHITECTURE_DECISIONS.md`

### Status page visibility

- Site visitors should see:
  - wildfire data current as of `HH:MM UTC`
  - whether route wildfire status is fresh, stale, or degraded
  - whether a route fire-weather warning, smoke advisory, or burn restriction is active
- Do not imply clear conditions when a source is stale or failed. Source: `00_SHARED_AUTONOMOUS_CONNECTOR_BUILD_STANDARD.md`, `00_CDM_CONNECTOR_LESSONS_APPLIED.md`

### Debugging order

1. `data/connectors/04_WILDFIRE/status.json`
2. latest landing file for failing source
3. latest validation log
4. latest normalized output
5. source website / endpoint itself

## 12. Known Risks and Mitigations

- Single-source risk:
  - WFIGS owns the best active wildfire coverage; mitigation is secondary corroboration with `DNR-01` and `INCIWEB-01`
- Geographic coverage gap:
  - no unattended public evacuation feed was validated; mitigation is explicit gap documentation and no inferred evacuation logic
- HTML fragility:
  - `KC-01`, `EFR-01`, `KC-TRAIL-01`, and especially `SEA-TRAIL-01` can drift; mitigation is parser validation, LKG, and non-blocking secondary status
- Rate limiting:
  - WFIGS `429` observed; mitigation is serialized requests and one bounded retry
- NOAA file-shape risk:
  - HMS uses dated files rather than a stable current alias; mitigation is deterministic date URL builder plus stale-file checks
- Credential rotation:
  - `NASA_FIRMS_MAP_KEY` will require managed secret storage if later enabled; until then the branch stays disabled and non-blocking
- Third-party reliability:
  - no SLA guarantees were documented in research; mitigation is connector degradation states and preserved LKG
- Static-site freshness:
  - workflow-08 and Cloudflare caching decisions are still separate; mitigation is timestamp-rich output and no direct site writes from lane `04`

## 13. Deferred Decisions and Open Questions

- Final global freshness/deploy gate thresholds remain configurable until `DEC-003` is resolved. Source: `00_OPEN_CONNECTOR_ARCHITECTURE_DECISIONS.md`
- Mandatory vs optional lane matrix for workflow-08 remains open under `DEC-006`
- Cross-lane display severity taxonomy remains open under `DEC-009`
- Cloudflare Pages project/domain/environment decisions remain deferred to `DEC-011` and `DEC-012`
- Human notification channel remains open under `DEC-013`
- Public unattended evacuation feed remains an unresolved source gap for this lane
- NASA FIRMS enablement remains deferred until credential acquisition and live retest

None of the above blocks implementation of the connector fetch/normalize/validate workflow itself. They do block claiming full deploy-gate completeness.

## 14. Research Traceability

- MVP sources `NIFC-01`, `NIFC-02`, `NWS-01`, `NOAA-01`, `KC-01`
  - traced to `IMPLEMENTATION_RECOMMENDATION.md` and `UW_ISSY_04_WILDFIRE_IMPLEMENTATION_RECOMMENDATION_v1.md`
- Secondary sources `DNR-01`, `DNR-02`, `EFR-01`, `INCIWEB-01`, `KC-TRAIL-01`, `SEA-TRAIL-01`, `NASA-01`
  - traced to `IMPLEMENTATION_RECOMMENDATION.md`, `ENV_AND_READINESS.md`
- WFIGS as best active-fire and perimeter source
  - traced to `RESEARCH_FINDINGS.md`, `UW_ISSY_04_WILDFIRE_FINAL_RESEARCH_REPORT_v1.md`, and live tests in `API_AND_FEED_TEST_RESULTS.md`
- NWS fire-zone ownership with `WAZ654` and `WAZ657`
  - traced to `RESEARCH_FINDINGS.md`, `ROUTE_RELEVANCE_AND_THRESHOLDS.md`, `API_AND_FEED_TEST_RESULTS.md`
- Route thresholds:
  - active point `<= 5 miles`, high priority `<= 2 miles`
  - perimeter intersects `10-mile` buffer, high priority `2-mile` buffer/route line
  - smoke intersects `5-mile` buffer
  - closure `0.25 mile`
  - evacuation `1 mile`
  - traced to `ROUTE_RELEVANCE_AND_THRESHOLDS.md` and confirmed as the implementation recommendation in `UW_ISSY_04_WILDFIRE_IMPLEMENTATION_RECOMMENDATION_v1.md`
- Freshness defaults:
  - WFIGS/NWS `15 minutes`
  - NOAA HMS `24 hours`
  - burn-ban pages `6 hours`
  - InciWeb `30 minutes`
  - traced to `IMPLEMENTATION_RECOMMENDATION.md` and `UW_ISSY_04_WILDFIRE_IMPLEMENTATION_RECOMMENDATION_v1.md`
- Failure and LKG behavior
  - traced to `IMPLEMENTATION_RECOMMENDATION.md`
  - reinforced by adopted lessons in `00_CDM_CONNECTOR_LESSONS_APPLIED.md`
- Independent connector publication and no direct site writes
  - traced to `00_SHARED_AUTONOMOUS_CONNECTOR_BUILD_STANDARD.md` and `00_OPEN_CONNECTOR_ARCHITECTURE_DECISIONS.md`
- Cross-lane ownership and dedupe rules
  - traced to `OVERLAP_NOTES.md`
- Readiness claim and remaining gap honesty
  - traced to `UW_ISSY_04_WILDFIRE_AUDIT_REPORT_v1.md`, `ENV_AND_READINESS.md`, and `00_OPEN_CONNECTOR_ARCHITECTURE_DECISIONS.md`

## Completion Check

- All required sections are present and filled with lane-specific content.
- Source behavior claims are tied to live-test files from `2026-07-29`.
- The schema example is valid JSON and does not fabricate a fake wildfire incident.
- Route relevance is implementable with canonical GPX geometry and local math only.
- Failure, fallback, stale, and LKG behavior are explicit at each decision point.
- The workflow sketch is n8n-implementable and keeps workflow-08 separation intact.
- No credentials or secret values are included.
- No France/CDM endpoint leakage is included beyond the allowed lessons register and shared standards references.
