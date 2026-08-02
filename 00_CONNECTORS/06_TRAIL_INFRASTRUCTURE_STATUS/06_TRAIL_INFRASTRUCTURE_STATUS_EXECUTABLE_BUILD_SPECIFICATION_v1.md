# 06_TRAIL_INFRASTRUCTURE_STATUS_EXECUTABLE_BUILD_SPECIFICATION_v1

## 1. Overview

- Lane ID: `06_TRAIL_INFRASTRUCTURE_STATUS`
- Lane working name: `Trail Infrastructure Status`
- Research-backed recommended public label for workflow-08 display mapping: `WATERWAY_AND_CROSSING_STATUS`

Purpose:

- This lane supports rider decisions about route-impacting culvert, drainage, fish-passage, shoreline, bridge, and crossing infrastructure on the canonical University of Washington to Issaquah GPX.
- It does not own generic construction, raw hydrology, flood-stage interpretation, smoke, weather, or broad safety alerts. That boundary is required by [IMPLEMENTATION_RECOMMENDATION.md], [RESEARCH_FINDINGS.md], and [OVERLAP_NOTES.md].

Approved source set:

- MVP sources: `KC-01`, `KC-02`, `KC-03`, `SAM-02`, `ISS-01`
- Secondary sources: `SAM-01`, `REDM-01`, `KC-04`
- Rejected or non-owner sources remain out of scope for build v1.

High-level data flow:

1. Fetch approved MVP sources on schedule.
2. Parse each source into lane-local intermediate records.
3. Apply route-relevance filtering using canonical GPX geometry plus named-facility matching.
4. Validate schema, timestamps, coordinates, and source health.
5. Deduplicate intra-lane records.
6. Publish canonical lane output plus evidence artifacts.
7. Hand off normalized output to workflow `08_ASSEMBLE_VALIDATE_BUILD_DEPLOY`.

Integration:

- Workflow-08 consumes this lane’s normalized connector envelope and lane ownership metadata, not raw landings.
- This connector never writes site-facing `public/data/` artifacts directly.
- Shared standard authority: `00_SHARED_AUTONOMOUS_CONNECTOR_BUILD_STANDARD.md`, schema version `1.0.0`
- Architecture decisions applied: `DEC-001`, `DEC-002`, `DEC-004`, `DEC-010` are binding; `DEC-003`, `DEC-006`, `DEC-008`, `DEC-009`, `DEC-011`, `DEC-012`, and `DEC-013` remain unresolved at system level but do not block this lane’s executable specification.

Readiness assessment:

- Ready to build as a connector with configurable freshness thresholds.
- Not sufficient by itself to declare workflow-08 deploy gating complete, because cross-lane mandatory/optional rules and final global freshness defaults remain open in [00_OPEN_CONNECTOR_ARCHITECTURE_DECISIONS.md].

## 2. SOURCE ACQUISITION STRATEGY

### MVP sources

#### `KC-01` | King County Parks Burke-Gilman Trail page

- Owning agency: `King County Parks`
- Acquisition method: unauthenticated `HTTP GET` of public HTML page
- n8n fetch pattern: `HTTP Request` node -> `HTML Extract` or text extraction -> keyword/facility diff against last-known-good extracted block
- Fetch cadence: every `6 hours`
- Freshness threshold: `24 hours`
- Environment variables: none
- Authentication flow: none
- Error handling:
  - non-`200` -> mark source failed, preserve prior extracted block
  - `200` with missing expected body text -> parser failure, do not clear prior event state on first occurrence
- Documented failure modes: HTML template change, empty body, page removes useful text without semantic replacement
- Rate limiting: none observed in [API_AND_FEED_TEST_RESULTS.md]
- Network requirements: reachable from tested local environment; no geo restriction observed
- Fallback source: none for the exact owner page; absence only degrades this source branch
- Last-known-good: keep previous extracted relevant text block and prior normalized records for up to `7 days`, but mark source stale after `24 hours`

#### `KC-02` | King County Parks Sammamish River Trail page

- Owning agency: `King County Parks`
- Acquisition method: unauthenticated `HTTP GET` of public HTML page
- Fetch cadence: every `6 hours`
- Freshness threshold: `24 hours`
- Environment variables: none
- Authentication flow: none
- Error handling: same HTML handling as `KC-01`
- Documented failure modes: non-`200`, missing body text, template drift
- Rate limiting: none observed
- Network requirements: reachable from tested local environment
- Fallback source: none for exact owner page
- Last-known-good: previous extracted block retained for up to `7 days`; stale marker after `24 hours`

#### `KC-03` | King County Parks East Lake Sammamish Trail page

- Owning agency: `King County Parks`
- Acquisition method: unauthenticated `HTTP GET` of public HTML page
- Fetch cadence: every `6 hours`
- Freshness threshold: `24 hours`
- Environment variables: none
- Authentication flow: none
- Error handling:
  - non-`200` or missing closure block -> fail branch and preserve prior parsed event
  - unexpected body disappearance -> treat as parser failure first; require one subsequent successful confirming fetch before clearing a previously active event
- Documented failure modes: body-text changes, missing closure block, generic page refresh that still returns `200`
- Rate limiting: none observed
- Network requirements: reachable from tested local environment
- Fallback source: `SAM-02` first, `SAM-01` second, for corroboration of the same George Davis Creek / East Lake Sammamish closure chain
- Last-known-good: preserve extracted closure text and normalized event for up to `14 days`; after `24 hours` mark stale, after `14 days` do not auto-publish without a fresh corroborating source

#### `SAM-02` | City of Sammamish George Davis Creek project-start update

- Owning agency: `City of Sammamish`
- Acquisition method: unauthenticated `HTTP GET` of public HTML article
- Fetch cadence: every `12 hours`
- Freshness threshold: `48 hours`
- Environment variables: none
- Authentication flow: none
- Error handling:
  - non-`200` or missing article body -> fail branch
  - missing `Published`/`Modified` text -> continue if body still parses, but mark timestamp confidence reduced
- Documented failure modes: article-template changes, body extraction failure
- Rate limiting: none observed
- Network requirements: reachable from tested local environment
- Fallback source: `KC-03` first, `SAM-01` second
- Last-known-good: preserve prior parsed article facts for up to `14 days`; after `48 hours` mark stale

#### `ISS-01` | City of Issaquah Public Works Current Year Construction Projects ArcGIS service

- Owning agency: `City of Issaquah Public Works`
- Acquisition method: ArcGIS REST metadata + query endpoint
- n8n fetch pattern:
  - metadata request to verify service health
  - query request against layer `0` with field selection and route/bbox prefilter
- Fetch cadence: every `6 hours`
- Freshness threshold: `12 hours`
- Environment variables: none
- Authentication flow: none
- Query pattern:
  - fetch metadata from `.../MapServer?f=json`
  - fetch records from `.../MapServer/0/query`
  - use JSON response; no external geocoding
- Error handling:
  - metadata `200` but invalid query response -> branch failure
  - zero returned features -> valid no-event state, not service failure
  - invalid JSON or missing `features` array -> parser failure
- Documented failure modes: service unreachable, invalid JSON, schema drift, empty but valid route-relevant set
- Rate limiting: none observed; `maxRecordCount` `2000`, pagination supported
- Network requirements: reachable from tested local environment; no geo restriction observed
- Fallback source: free-text corroboration from Issaquah city pages if later added; for v1 the fallback is last-known-good plus continued operation of the other MVP sources
- Last-known-good: preserve previous relevant features for up to `7 days`; mark stale after `12 hours`

### Secondary sources

#### `SAM-01` | City of Sammamish George Davis Creek project page

- Role: persistent context and corroboration
- Acquisition method: public HTML page
- Fetch cadence: daily
- Freshness threshold: `72 hours`
- Environment variables: none
- Authentication flow: none
- Failure behavior: source failure degrades context only; must not suppress `KC-03` or `SAM-02`
- Fallback: `SAM-02` and `KC-03`
- LKG: retain for `14 days`

#### `REDM-01` | City of Redmond Traffic Alerts FeatureServer

- Role: heavily filtered secondary alert source for future bridge/creek/shoreline/drainage work
- Acquisition method: ArcGIS REST metadata + line-layer query
- Fetch cadence: every `6 hours`
- Freshness threshold: `12 hours`
- Environment variables: none
- Authentication flow: none
- Failure behavior: continue without this source; do not gate connector publication
- Rate limiting: none observed; pagination supported
- Fallback: none required; lane-01 sources remain separate
- LKG: retain for `7 days`

#### `KC-04` | King County `KingCo_Bridges`

- Role: facility-reference layer only
- Acquisition method: ArcGIS REST metadata + query
- Fetch cadence: weekly refresh or static cache until inventory changes
- Freshness threshold: `7 days`
- Environment variables: none
- Authentication flow: none
- Failure behavior: continue without reference enrichment; do not publish bridge inventory as events
- Rate limiting: none observed
- Fallback: none
- LKG: retain current facility cache until a newer valid cache replaces it

## 3. Normalization and Validation

Normalized output must use the shared connector envelope and lane-06-specific event semantics.

### Canonical normalized structure

```json
{
  "schema_version": "1.0.0",
  "connector_id": "06_TRAIL_INFRASTRUCTURE_STATUS",
  "connector_name": "UW-Issaquah Trail Infrastructure Status Connector",
  "connector_version": "v0001",
  "lane": "06_TRAIL_INFRASTRUCTURE_STATUS",
  "run_id": "06_TRAIL_INFRASTRUCTURE_STATUS-20260731T190000Z-001",
  "generated_at": "2026-07-31T19:00:00Z",
  "published_at": "2026-07-31T19:00:02Z",
  "data_status": "ok",
  "freshness": {
    "overall_state": "fresh",
    "computed_at": "2026-07-31T19:00:02Z",
    "oldest_relevant_source_age_minutes": 180,
    "stale_source_ids": []
  },
  "manifest_ref": {
    "manifest_id": "06_TRAIL_INFRASTRUCTURE_STATUS-v0001",
    "schema_version": "1.0.0"
  },
  "source_health": [],
  "connector_health": {},
  "events": [],
  "observations": [],
  "route_sections": [],
  "provenance": {},
  "validation_state": {},
  "metadata": {
    "public_label": "WATERWAY_AND_CROSSING_STATUS"
  }
}
```

### Illustrative lane-06 example

This example is illustrative but grounded in real source fields observed on July 29, 2026.

```json
{
  "schema_version": "1.0.0",
  "connector_id": "06_TRAIL_INFRASTRUCTURE_STATUS",
  "connector_name": "UW-Issaquah Trail Infrastructure Status Connector",
  "connector_version": "v0001",
  "lane": "06_TRAIL_INFRASTRUCTURE_STATUS",
  "run_id": "06_TRAIL_INFRASTRUCTURE_STATUS-20260731T190000Z-001",
  "generated_at": "2026-07-31T19:00:00Z",
  "published_at": "2026-07-31T19:00:02Z",
  "data_status": "ok",
  "freshness": {
    "overall_state": "fresh",
    "computed_at": "2026-07-31T19:00:02Z",
    "oldest_relevant_source_age_minutes": 360,
    "stale_source_ids": []
  },
  "manifest_ref": {
    "manifest_id": "06_TRAIL_INFRASTRUCTURE_STATUS-v0001",
    "schema_version": "1.0.0"
  },
  "source_health": [
    {
      "source_id": "06_TRAIL_INFRASTRUCTURE_STATUS:KC-03",
      "source_name": "King County Parks East Lake Sammamish Trail page",
      "status": "ok",
      "last_fetch_at": "2026-07-31T18:55:00Z",
      "last_success_at": "2026-07-31T18:55:00Z",
      "freshness_state": "fresh",
      "http_status": 200,
      "message": "Closure text extracted successfully."
    },
    {
      "source_id": "06_TRAIL_INFRASTRUCTURE_STATUS:SAM-02",
      "source_name": "City of Sammamish George Davis Creek project-start update page",
      "status": "ok",
      "last_fetch_at": "2026-07-31T18:56:00Z",
      "last_success_at": "2026-07-31T18:56:00Z",
      "freshness_state": "fresh",
      "http_status": 200,
      "message": "Article body extracted successfully."
    },
    {
      "source_id": "06_TRAIL_INFRASTRUCTURE_STATUS:ISS-01",
      "source_name": "City of Issaquah Public Works Current Year Construction Projects ArcGIS service",
      "status": "ok",
      "last_fetch_at": "2026-07-31T18:57:00Z",
      "last_success_at": "2026-07-31T18:57:00Z",
      "freshness_state": "fresh",
      "http_status": 200,
      "message": "Filtered feature query returned route-relevant project records."
    }
  ],
  "connector_health": {
    "status": "healthy",
    "branches_total": 5,
    "branches_succeeded": 5,
    "branches_failed": 0,
    "used_last_known_good": false
  },
  "events": [
    {
      "event_id": "06_TRAIL_INFRASTRUCTURE_STATUS:KC-03:2026-06-01:louis-thompson-to-inglewood",
      "event_type": "culvert",
      "status": "closed",
      "severity": "high",
      "title": "East Lake Sammamish Trail closure for culvert replacement",
      "summary": "King County Parks states that the trail section between Louis Thompson Rd NE and NE Inglewood Hill Rd is closed starting June 1, 2026 while aging culverts are replaced.",
      "effective_start": "2026-06-01T00:00:00Z",
      "effective_end": null,
      "updated_at": "2026-07-31T18:55:00Z",
      "source_record_id": null,
      "route_relevance": {
        "classification": "confirmed_route_impact",
        "method": "named_trail_match",
        "confidence": "high",
        "nearest_route_distance_m": 0,
        "matched_route_sections": [
          "09",
          "10"
        ]
      },
      "location": {
        "location_text": "East Lake Sammamish Trail between Louis Thompson Rd NE and NE Inglewood Hill Rd",
        "municipality": "Sammamish",
        "county": "King",
        "state": "WA",
        "coordinates": null,
        "geometry_type": "none",
        "bbox": null
      },
      "facilities": [
        "East Lake Sammamish Trail",
        "George Davis Creek"
      ],
      "source": {
        "source_id": "06_TRAIL_INFRASTRUCTURE_STATUS:KC-03",
        "source_name": "King County Parks East Lake Sammamish Trail page",
        "agency": "King County Parks",
        "url": "https://cd10-prod.kingcounty.gov/en/dept/dnrp/nature-recreation/parks-recreation/king-county-parks/trails/leafline-trails/east-lake-sammamish",
        "retrieved_at": "2026-07-31T18:55:00Z",
        "published_or_observed_at": "2026-06-01T00:00:00Z"
      },
      "ownership": {
        "canonical_lane_owner": "06_TRAIL_INFRASTRUCTURE_STATUS",
        "overlap_notes": "Lane 01 may summarize generic passability, but lane 06 owns the culvert-driven infrastructure closure."
      }
    },
    {
      "event_id": "06_TRAIL_INFRASTRUCTURE_STATUS:ISS-01:objectid-illustrative-east-lake-sammamish-pkwy-drainage-improvement-project",
      "event_type": "drainage",
      "status": "active",
      "severity": "moderate",
      "title": "East Lake Sammamish Pkwy Drainage Improvement Project",
      "summary": "Issaquah Public Works describes fish-passable culvert work under SE 51st St and the East Lake Sammamish Trail.",
      "effective_start": null,
      "effective_end": null,
      "updated_at": "2026-07-31T18:57:00Z",
      "source_record_id": "illustrative_objectid",
      "route_relevance": {
        "classification": "confirmed_route_impact",
        "method": "geometry_intersection",
        "confidence": "high",
        "nearest_route_distance_m": 0,
        "matched_route_sections": [
          "10"
        ]
      },
      "location": {
        "location_text": "SE 51st St and East Lake Sammamish Trail",
        "municipality": "Issaquah",
        "county": "King",
        "state": "WA",
        "coordinates": {
          "latitude": 47.5525,
          "longitude": -122.0705
        },
        "geometry_type": "polygon",
        "bbox": {
          "min_lat": 47.5521,
          "min_lon": -122.0712,
          "max_lat": 47.5529,
          "max_lon": -122.0698
        }
      },
      "facilities": [
        "East Lake Sammamish Trail",
        "SE 51st St"
      ],
      "source": {
        "source_id": "06_TRAIL_INFRASTRUCTURE_STATUS:ISS-01",
        "source_name": "City of Issaquah Public Works Current Year Construction Projects ArcGIS service",
        "agency": "City of Issaquah Public Works",
        "url": "https://apps.issaquahwa.gov/server/rest/services/General_Mapservices/PWProjectsCurrentYearConstructionPublic/MapServer/0/query",
        "retrieved_at": "2026-07-31T18:57:00Z",
        "published_or_observed_at": null
      },
      "ownership": {
        "canonical_lane_owner": "06_TRAIL_INFRASTRUCTURE_STATUS",
        "overlap_notes": "Hydrologic interpretation remains in lane 05; this lane owns the route-impacting drainage infrastructure project."
      }
    }
  ],
  "observations": [],
  "route_sections": [
    {
      "section_id": "09",
      "section_name": "East Lake Sammamish Trail - Sammamish",
      "impact_level": "confirmed",
      "summary": "Confirmed waterway infrastructure closure on the shoreline trail segment.",
      "event_ids": [
        "06_TRAIL_INFRASTRUCTURE_STATUS:KC-03:2026-06-01:louis-thompson-to-inglewood"
      ]
    },
    {
      "section_id": "10",
      "section_name": "Issaquah approach / terminus",
      "impact_level": "confirmed",
      "summary": "Confirmed drainage infrastructure work adjacent to the route.",
      "event_ids": [
        "06_TRAIL_INFRASTRUCTURE_STATUS:ISS-01:objectid-illustrative-east-lake-sammamish-pkwy-drainage-improvement-project"
      ]
    }
  ],
  "provenance": {
    "source_ids_used": [
      "06_TRAIL_INFRASTRUCTURE_STATUS:KC-03",
      "06_TRAIL_INFRASTRUCTURE_STATUS:SAM-02",
      "06_TRAIL_INFRASTRUCTURE_STATUS:ISS-01"
    ],
    "route_gpx": "data/route/UnivWA-Issaquah.gpx",
    "research_basis": [
      "IMPLEMENTATION_RECOMMENDATION.md",
      "API_AND_FEED_TEST_RESULTS.md",
      "ROUTE_RELEVANCE_AND_THRESHOLDS.md",
      "NORMALIZED_SCHEMA_PROPOSAL.md",
      "OVERLAP_NOTES.md"
    ]
  },
  "validation_state": {
    "schema_valid": true,
    "freshness_valid": true,
    "route_relevance_valid": true,
    "deduplication_valid": true,
    "used_last_known_good": false
  },
  "metadata": {
    "public_label": "WATERWAY_AND_CROSSING_STATUS",
    "manual_review_required": false
  }
}
```

### Required fields

- Top level: `schema_version`, `connector_id`, `connector_name`, `connector_version`, `lane`, `run_id`, `generated_at`, `published_at`, `data_status`, `freshness`, `manifest_ref`, `source_health`, `connector_health`, `events`, `observations`, `route_sections`, `provenance`, `validation_state`, `metadata`
- Event level: `event_id`, `event_type`, `status`, `severity`, `title`, `summary`, `updated_at`, `route_relevance`, `location`, `facilities`, `source`, `ownership`
- Source health level: `source_id`, `source_name`, `status`, `last_fetch_at`, `last_success_at`, `freshness_state`, `message`

### Optional fields

- `published_at` may be `null` before publish promotion
- Event fields `effective_start`, `effective_end`, `source_record_id`, `location.coordinates`, `location.bbox`
- `observations` may stay empty in v1
- `advisories` may be added later under shared envelope optional fields

### Enum-like fields

- `data_status`: `ok`, `degraded`, `stale`, `no_relevant_events`, `failed_validation`, `failed_fetch`, `blocked`, `using_last_known_good`
- `connector_health.status`: `healthy`, `degraded`, `failed`
- `source_health.status`: `ok`, `stale`, `failed`, `using_last_known_good`, `no_relevant_records`
- `freshness.overall_state`: `fresh`, `stale`, `mixed`, `unknown`
- `event_type`: `culvert`, `drainage`, `bridge`, `crossing`, `shoreline`, `fish_passage`, `boardwalk`, `washout`, `other`
- Event `status`: `planned`, `active`, `restricted`, `closed`, `reopened`, `unknown`
- Event `severity`: `low`, `moderate`, `high`, `critical`, `unknown`
- `route_relevance.classification`: `confirmed_route_impact`, `possible_route_impact`, `nearby_not_confirmed`, `not_route_relevant`
- `route_relevance.method`: `geometry_intersection`, `named_trail_match`, `facility_match`, `text_location_match`
- `route_relevance.confidence`: `high`, `medium`, `low`
- `route_sections[].impact_level`: `none`, `possible`, `confirmed`

### Timestamp semantics

- All published timestamps must be `ISO 8601 UTC` with trailing `Z`
- `generated_at`: when merged normalized envelope is assembled
- `published_at`: when candidate becomes published artifact; `null` before promotion
- `source.retrieved_at`: fetch completion time for the specific source branch
- `source.published_or_observed_at`: best source-native time if explicitly available; otherwise `null`
- `effective_start` / `effective_end`: operational impact window if source text or fields support it
- `source_health.last_fetch_at`: last attempted fetch time
- `source_health.last_success_at`: last successful parse time

### Geographic fields

- Coordinate format: decimal degrees, `EPSG:4326`
- Geometry source notes:
  - HTML-only sources may have `coordinates: null`
  - ArcGIS-derived records must transform source geometry from `EPSG:2926` or source CRS into `EPSG:4326` before publication
- `matched_route_sections` must use the 10-section lane model from [ROUTE_RELEVANCE_AND_THRESHOLDS.md]
- Bounding-box validation must reject coordinates outside the canonical route envelope plus approved buffer

### Source attribution and provenance

- Every event must include the source agency, source URL, and fetch time
- Source IDs inside published output must be globally namespaced as `<lane_id>:<local_source_id>` per shared standard
- Provenance must record the research files and GPX asset used for route relevance

### Validators on every publication

1. Schema validation:
   - envelope keys present
   - arrays present even when empty
   - enum values valid
2. Coordinate validation:
   - decimal numbers parse successfully
   - coordinates stay inside route bbox expanded by `250 m` unless source is text-only
3. Timestamp freshness validation:
   - compare source age against per-source thresholds
   - missing, invalid, or future timestamps degrade to `unknown` or `stale`, never `fresh`
4. Source-health validation:
   - non-`200`, invalid JSON, missing body, or missing expected feature arrays become explicit branch health failures
5. Deduplication validation:
   - same facility + same title cluster + overlapping effective window must collapse to one lane event
   - corroborating sources attach as provenance, not duplicate events

### Validation failure behavior

- Record failure in validation log
- Quarantine invalid candidate artifact
- Do not overwrite published artifact with invalid output
- If prior valid output exists, publish status as `using_last_known_good` or `degraded` according to branch results
- Skip only the invalid event when the connector can still produce a valid partial envelope

## 4. ROUTE RELEVANCE CALCULATION

Decision:

- Lane 06 uses a combination of named-trail matching, named-facility matching, local geometry tests, and strict rejection of municipality-only matches.
- No external geocoding service is permitted.

Exact rules:

- Point sources:
  - `<= 60 m` from GPX line -> direct crossing/facility candidate
  - `> 60 m` and `<= 150 m` -> require exact facility, street, trail, or creek match
  - `> 150 m` -> reject unless source explicitly names the route trail segment
- Line and polygon sources:
  - prefilter using route bbox expanded by `250 m`
  - final direct-impact test requires intersection with a `75 m` buffered GPX line
  - within `250 m` but no intersection and exact route naming present -> classify `possible_route_impact`
- Text-only notices:
  - `confirmed_route_impact` only if exact named trail or exact crossing / bridge / creek / shoreline / route street match is extracted
  - municipality-only mention -> `possible_route_impact`, not auto-publishable

Implementation sketch for n8n:

1. Load canonical GPX-derived route geometry from a checked-in JSON/GeoJSON derivative prepared from `data/route/UnivWA-Issaquah.gpx`.
2. For ArcGIS sources, convert source geometry to `EPSG:4326`.
3. Compute nearest distance from point centroid or representative geometry point to the GPX.
4. Compute line/polygon intersection with a `75 m` buffered route line using local geometry math in a `Code` node or pre-approved JS helper.
5. Independently tokenize source text for exact trail/facility tokens:
   - `Burke-Gilman Trail`
   - `Sammamish River Trail`
   - `East Lake Sammamish Trail`
   - `Marymoor Connector Trail`
   - `George Davis Creek`
   - `Park Hill Creek`
   - `East Lake Sammamish Parkway`
   - `East Lake Sammamish Shore Lane NE`
   - `Louis Thompson Rd NE`
   - `NE Inglewood Hill Rd`
   - `SE 51st St`
   - `NE 124th St`
6. Classify relevance and confidence:
   - geometry hit + exact name -> `confirmed_route_impact`, `high`
   - exact name only -> `confirmed_route_impact`, `medium`
   - weak proximity or municipality only -> `possible_route_impact`, `low`
7. Auto-publish only `high` and `medium` confidence events.

Edge cases and fallback logic:

- If HTML source names the trail but gives no geometry, publish as confirmed using named-trail match.
- If geometry intersects but text is semantically generic, keep only if the event type matches lane-06 keywords such as `culvert`, `drainage`, `bridge`, `crossing`, `shoreline`, `fish passage`, `boardwalk`, `washout`.
- If source text mentions only `Sammamish` or `Issaquah` with no trail/facility token, keep diagnostic-only and do not auto-publish.
- If location is ambiguous but corroborated by another approved source naming the same facility, upgrade the merged event to confirmed and retain both sources in provenance.

Geographic bounds check:

- Canonical route bbox from [RESEARCH_FINDINGS.md]:
  - min lat `47.55207`
  - max lat `47.75889`
  - min lon `-122.3057`
  - max lon `-122.04414`
- Strict processing envelope:
  - expanded route bbox by `250 m` for prefilter only
  - anything entirely outside that envelope is rejected as `not_route_relevant`

Special fixed exclusions:

- Ballard Locks: reject; measured about `4.35 mi` from GPX
- Montlake Bridge: nearby but off-route; do not treat as on-route
- Lake Sammamish gage: context only, lane-05 owned unless tied to explicit official route-impact notice

## 5. FRESHNESS, FAILURE, AND FALLBACK

### Freshness rules

- `KC-01`, `KC-02`, `KC-03`: stale after `24 hours`
- `SAM-02`: stale after `48 hours`
- `ISS-01`: stale after `12 hours`
- `SAM-01`: stale after `72 hours`
- `REDM-01`: stale after `12 hours`
- `KC-04`: stale after `7 days`

Freshness semantics:

- Use source-native event timestamps when present for rider context.
- Use fetch-time freshness when no source-native timestamp exists.
- HTML trail pages without a reliable publication timestamp may still be fresh if fetched within threshold and parser output is stable.

Stale-data representation:

- Preserve event record but mark top-level `data_status` as `stale` or `using_last_known_good`
- Add stale source IDs to `freshness.stale_source_ids`
- Set `source_health[].freshness_state` to `stale`
- Do not null out event content solely because it is stale

Last-known-good caching:

- Yes, this lane caches the most recent valid normalized envelope and source-branch parsed artifacts.
- Active LKG snapshot persists until superseded by newer valid LKG per shared standard.
- Branch-level LKG usage is allowed when one source fails but the connector can still produce a valid degraded output.

Failure scenarios and recovery:

- Source API or page down:
  - retry once after short backoff
  - if still failed, use source LKG if available
  - mark source failed or stale
- Source returns `4xx`:
  - do not loop aggressively
  - skip this source for the run
  - keep prior valid branch output if within LKG retention
- Source returns `5xx`:
  - retry once with bounded backoff
  - then fail branch and continue connector
- Network unreachable:
  - emit error record
  - use branch LKG if available
- Malformed response:
  - log sanitized parser error
  - quarantine branch artifact
  - continue other branches
- Parsed body disappears unexpectedly:
  - treat as parser/template failure first
  - require one later successful confirming fetch before clearing previously active event state

Drop rules:

- Branch LKG older than `14 days` for HTML project/closure sources or `7 days` for ArcGIS sources must stop auto-publishing unless at least one other fresh corroborating source confirms the same event.
- If all sources exceed those limits, publish connector with `data_status: "stale"` only if a previously published valid envelope exists; otherwise publish no new candidate and leave prior published snapshot untouched.

Workflow-08 cross-lane deduplication:

- Yes, lane 06 participates.
- It must emit `ownership.canonical_lane_owner` and preserve source cause wording so workflow-08 can prefer lane 06 only for infrastructure-caused waterway/crossing impacts per [OVERLAP_NOTES.md].

## 6. Evidence and Validation Outputs

This lane must emit auditable artifacts for each execution using the binding shared-standard artifact tree under `data/connectors/{raw,normalized,candidate,published,last_known_good,health,evidence,logs,quarantine,handoff}/06_TRAIL_INFRASTRUCTURE_STATUS/`. The lane-local `landings/output/validation/status` wording from the work order maps to the shared-standard classes below and must not be implemented as a separate parallel directory tree.

### Landing files

- Canonical path pattern: `data/connectors/raw/06_TRAIL_INFRASTRUCTURE_STATUS/<source_id>_landing_<timestamp>.json`
- Content:
  - raw sanitized payload or extracted text block
  - `http_status`
  - `retrieved_at`
  - source metadata
  - parse mode
  - checksum
- Retention:
  - keep a quick-inspection index for the last `3` cycles or `24 hours`, whichever is longer, in `data/connectors/evidence/06_TRAIL_INFRASTRUCTURE_STATUS/`
  - keep successful raw payloads for `14 days` and failed/anomalous raw payloads for `30 days` per `DEC-004` and `00_SHARED_AUTONOMOUS_CONNECTOR_BUILD_STANDARD.md`

### Normalized output

- Per-run normalized path: `data/connectors/normalized/06_TRAIL_INFRASTRUCTURE_STATUS/06_TRAIL_INFRASTRUCTURE_STATUS_normalized_output_<timestamp>.json`
- Candidate publication path: `data/connectors/candidate/06_TRAIL_INFRASTRUCTURE_STATUS/06_TRAIL_INFRASTRUCTURE_STATUS_candidate_<timestamp>.json`
- Published snapshot path: `data/connectors/published/06_TRAIL_INFRASTRUCTURE_STATUS/06_TRAIL_INFRASTRUCTURE_STATUS_published_<timestamp>.json`
- Stable published pointer: `data/connectors/published/06_TRAIL_INFRASTRUCTURE_STATUS/current.json`
- Content: one connector envelope per execution
- Time-series: yes, one immutable file per execution plus the stable published pointer

### Validation log

- Path pattern: `data/connectors/logs/06_TRAIL_INFRASTRUCTURE_STATUS/validation_log_<timestamp>.jsonl`
- One JSON line per validation event:
  - `run_id`
  - `source_id`
  - `record_id`
  - `check_name`
  - `result`
  - `message`
  - `timestamp`

### Health/status report

- Path: `data/connectors/health/06_TRAIL_INFRASTRUCTURE_STATUS/status.json`
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

### Additional required artifacts

- Last-known-good snapshot:
  - `data/connectors/last_known_good/06_TRAIL_INFRASTRUCTURE_STATUS/06_TRAIL_INFRASTRUCTURE_STATUS_lkg.json`
- Quarantine artifacts:
  - `data/connectors/quarantine/06_TRAIL_INFRASTRUCTURE_STATUS/<timestamp>_<reason>.json`
- Handoff artifact for workflow-08:
  - `data/connectors/handoff/06_TRAIL_INFRASTRUCTURE_STATUS/06_TRAIL_INFRASTRUCTURE_STATUS_handoff_<timestamp>.json`

## 7. DATA SCHEMA SPECIFICATION

### Authoritative schema rules

- Envelope schema is the shared standard canonical connector output.
- Lane-specific payload authority is:
  - `events[]` for discrete culvert, drainage, bridge, crossing, shoreline, fish-passage, or washout impacts
  - `route_sections[]` for section summaries
  - `source_health[]` for branch status
- `observations[]` stays available but empty in v1 unless a future approved source yields continuous infrastructure state data.

### Field definitions

- `schema_version`: string, required, example `1.0.0`
- `connector_id`: string, required, exact value `06_TRAIL_INFRASTRUCTURE_STATUS`
- `connector_name`: string, required
- `connector_version`: string, required, example `v0001`
- `lane`: string, required, exact lane ID
- `run_id`: string, required, unique per execution
- `generated_at`: string, required, ISO 8601 UTC
- `published_at`: string or `null`, required nullable
- `data_status`: string enum, required
- `freshness`: object, required
- `manifest_ref`: object, required
- `source_health`: array, required
- `connector_health`: object, required
- `events`: array, required
- `observations`: array, required
- `route_sections`: array, required
- `provenance`: object, required
- `validation_state`: object, required
- `metadata`: object, required

Event object definitions:

- `event_id`: string, required, stable dedupe key
- `event_type`: enum, required
- `status`: enum, required
- `severity`: enum, required
- `title`: string, required
- `summary`: string, required
- `effective_start`: string or `null`
- `effective_end`: string or `null`
- `updated_at`: string, required
- `source_record_id`: string or `null`
- `route_relevance`: object, required
- `location`: object, required
- `facilities`: array of strings, required, may be empty only when source gives none
- `source`: object, required
- `ownership`: object, required

Nested objects:

- `freshness`:
  - `overall_state`: enum
  - `computed_at`: timestamp
  - `oldest_relevant_source_age_minutes`: number
  - `stale_source_ids`: array of strings
- `route_relevance`:
  - `classification`
  - `method`
  - `confidence`
  - `nearest_route_distance_m`
  - `matched_route_sections`
- `location`:
  - `location_text`
  - `municipality`
  - `county`
  - `state`
  - `coordinates`
  - `geometry_type`
  - `bbox`
- `source`:
  - `source_id`
  - `source_name`
  - `agency`
  - `url`
  - `retrieved_at`
  - `published_or_observed_at`
- `ownership`:
  - `canonical_lane_owner`
  - `overlap_notes`

Reserved fields:

- `observations[]`: reserved for future continuous infrastructure observations; omit records or keep empty
- `advisories[]`: allowed by shared standard optional fields; may be omitted in v1

Coordinate and timestamp format:

- Coordinates: decimal degrees, `EPSG:4326`
- Timestamps: `YYYY-MM-DDTHH:MM:SSZ`

Example error state:

```json
{
  "schema_version": "1.0.0",
  "connector_id": "06_TRAIL_INFRASTRUCTURE_STATUS",
  "connector_name": "UW-Issaquah Trail Infrastructure Status Connector",
  "connector_version": "v0001",
  "lane": "06_TRAIL_INFRASTRUCTURE_STATUS",
  "run_id": "06_TRAIL_INFRASTRUCTURE_STATUS-20260731T190000Z-001",
  "generated_at": "2026-07-31T19:00:00Z",
  "published_at": null,
  "data_status": "using_last_known_good",
  "freshness": {
    "overall_state": "mixed",
    "computed_at": "2026-07-31T19:00:00Z",
    "oldest_relevant_source_age_minutes": 1560,
    "stale_source_ids": [
      "06_TRAIL_INFRASTRUCTURE_STATUS:KC-03"
    ]
  },
  "manifest_ref": {
    "manifest_id": "06_TRAIL_INFRASTRUCTURE_STATUS-v0001",
    "schema_version": "1.0.0"
  },
  "source_health": [
    {
      "source_id": "06_TRAIL_INFRASTRUCTURE_STATUS:KC-03",
      "source_name": "King County Parks East Lake Sammamish Trail page",
      "status": "using_last_known_good",
      "last_fetch_at": "2026-07-31T19:00:00Z",
      "last_success_at": "2026-07-30T17:00:00Z",
      "freshness_state": "stale",
      "http_status": 500,
      "message": "Retry failed; published branch data carried forward from last-known-good."
    }
  ],
  "connector_health": {
    "status": "degraded",
    "branches_total": 5,
    "branches_succeeded": 4,
    "branches_failed": 1,
    "used_last_known_good": true
  },
  "events": [],
  "observations": [],
  "route_sections": [],
  "provenance": {
    "source_ids_used": [
      "06_TRAIL_INFRASTRUCTURE_STATUS:KC-03"
    ],
    "route_gpx": "data/route/UnivWA-Issaquah.gpx",
    "research_basis": [
      "IMPLEMENTATION_RECOMMENDATION.md",
      "API_AND_FEED_TEST_RESULTS.md"
    ]
  },
  "validation_state": {
    "schema_valid": true,
    "freshness_valid": false,
    "route_relevance_valid": true,
    "deduplication_valid": true,
    "used_last_known_good": true
  },
  "metadata": {
    "public_label": "WATERWAY_AND_CROSSING_STATUS",
    "manual_review_required": false
  }
}
```

## 8. N8N WORKFLOW ARCHITECTURE SKETCH

- Workflow internal name: `v0001.06_TrailInfrastructureStatusConnector`
- Exported filename stem must match exactly
- Tags:
  - `uw_issy`
  - `connector`
  - `lane_06_trail_infrastructure_status`
  - `no_direct_deploy`
  - `production` or `active` according to environment state

Trigger:

- Scheduled trigger plus manual execution
- Initial cadence for this lane: every `6 hours` in `America/Los_Angeles`
- Rationale: the dominant MVP sources in [IMPLEMENTATION_RECOMMENDATION.md] are `6-hour` cadence, with `SAM-02` being slower and safely polled inside the same full-workflow schedule
- Overlapping executions must be prevented

Node structure pseudocode:

```text
Schedule Trigger (every 6 hours, America/Los_Angeles; no overlap)
  -> Load connector config (source list, thresholds, keyword list, route sections)
  -> Load canonical route geometry derivative from data/route/UnivWA-Issaquah.gpx
  -> Fetch KC-01 HTML
    -> Extract relevant body text
    -> Compare against previous extracted block
    -> Parse lane-06 candidate records
    -> Validate branch payload
    -> Write landing artifact
  -> Fetch KC-02 HTML
    -> same pattern
  -> Fetch KC-03 HTML
    -> same pattern with closure-clearing guard
  -> Fetch SAM-02 HTML
    -> Extract article body and date fields
    -> Parse lane-06 candidate records
    -> Validate branch payload
    -> Write landing artifact
  -> Fetch ISS-01 service metadata
    -> Validate service health
  -> Query ISS-01 layer 0
    -> Parse features
    -> Apply keyword filter on ProjectName/ProjectDescription/ProjectLocation
    -> Apply bbox prefilter
    -> Apply 75 m route-buffer intersection
    -> Validate branch payload
    -> Write landing artifact
  -> Optional secondary branch group
    -> Fetch SAM-01
    -> Fetch REDM-01
    -> Refresh KC-04 reference cache when due
  -> Normalize all surviving branch records to shared envelope event shape
  -> Deduplicate by facility + title cluster + overlapping time window
  -> Build route_sections summaries
  -> Derive source_health and connector_health
  -> Run final schema/freshness/deduplication validation
  -> If valid
    -> Write candidate normalized output
    -> Atomically publish lane output
    -> Update last-known-good
  -> If invalid
    -> Quarantine artifact
    -> Preserve prior published and LKG snapshots
  -> Write validation log
  -> Write status report
  -> Write workflow-08 handoff artifact
```

Error handling:

- One source failure must not abort the whole workflow if a valid degraded envelope can still be produced.
- If all MVP sources fail and no valid LKG exists, mark connector `failed_fetch` and do not overwrite published output.
- Secondary-source failures never block a valid MVP-based publication.

Retry strategy:

- One retry for network / `5xx` failures
- Suggested backoff: `30 seconds`
- No retry loop for `4xx` or deterministic parse failures

Logging:

- `info`: fetch start/end, branch success, publish success
- `warning`: stale source, zero relevant records, fallback to LKG, secondary-source failure
- `error`: repeated fetch failure, malformed payload, schema failure, publish/quarantine failure

Performance considerations:

- Expected runtime: well under `5 minutes`
- Safe parallelization:
  - HTML fetch branches in parallel
  - ArcGIS metadata/query branch in parallel with HTML branches
  - final normalization only after all branches complete
- Keep geometry math local and bounded to returned features; no external geocoding calls

## 9. Integration with Workflow-08 and Publication

Workflow-08 consumes:

- the normalized lane envelope
- `source_health`
- `connector_health`
- `events`
- `route_sections`
- `ownership` metadata embedded in events
- provenance needed for rider-facing source transparency

Cross-lane deduplication:

- Workflow-08 must treat lane 06 as canonical only when the cause is route-impacting culvert, drainage, shoreline, bridge, or crossing infrastructure.
- If lane 01 and lane 06 both surface the same closure:
  - lane 06 keeps infrastructure-cause details
  - workflow-08 may show one merged rider-facing incident card with lane-06 ownership and lane-01 passability context
- If lane 05 and lane 06 both touch a flood-related closure:
  - lane 05 owns hydrologic condition
  - lane 06 owns only the structure-specific route closure if the official notice says the closure is caused by culvert, shoreline, drainage, lock, spillway, or crossing infrastructure

Publication timing:

- This lane publishes its own internal connector artifact after each successful or valid degraded execution.
- Workflow-08 site republish policy remains system-level and unresolved in [00_OPEN_CONNECTOR_ARCHITECTURE_DECISIONS.md]; this lane spec therefore assumes workflow-08 decides final site publication timing.

Responsibility split:

- Lane 06 responsibility:
  - fetch, parse, normalize, validate, dedupe within lane, publish lane artifact, emit handoff metadata
- Workflow-08 responsibility:
  - cross-lane dedupe
  - deploy gating
  - site-facing feed generation
  - public copy assembly
  - final publication to `public/data/`

## 10. Testing and Validation Strategy

Unit tests:

- route-relevance classification for:
  - point within `60 m`
  - point `60-150 m` with and without exact facility match
  - polygon intersecting `75 m` route buffer
  - municipality-only text notice
- schema validation for envelope and event object
- timestamp freshness calculations, including invalid and future timestamps
- dedupe clustering for `KC-03` plus `SAM-02` corroboration

Integration tests:

- live fetch against each approved MVP source
- validate that:
  - HTML pages still parse
  - `ISS-01` query returns valid JSON
  - route relevance logic identifies the known East Lake Sammamish and Issaquah examples correctly when present

Regression tests:

- preserve a fixture derived from:
  - `KC-03` East Lake Sammamish closure text
  - `SAM-02` George Davis Creek article text
  - `ISS-01` East Lake Sammamish Pkwy Drainage Improvement Project feature
- confirm these normalize to the expected event types and route sections

Mock tests:

- one fixture per source class:
  - HTML trail-page fixture with closure text
  - HTML article fixture with `Published` and `Modified`
  - ArcGIS feature fixture with polygon geometry and project text

Failure tests:

- `500` then success on retry
- persistent `500`
- `404`
- HTML page with missing body block
- ArcGIS JSON missing `features`
- geometry outside route envelope
- duplicate corroborating records

Evidence of test success:

- unit suite passes with no schema or classification failures
- integration fetches return expected HTTP and parse outcomes
- fixture tests produce deterministic output hashes
- failure tests leave published and LKG outputs untouched when expected

## 11. Monitoring and Observability

Key metrics:

- fetch success rate per source
- parse success rate per source
- count of published lane events per run
- stale-source percentage
- runs using LKG
- validation failures per run

Alert thresholds:

- alert human operator when any MVP source fails `3` consecutive runs
- alert when all MVP sources are stale beyond their thresholds
- alert when connector publishes zero events after previously publishing a confirmed long-lived closure and the clearing condition was not corroborated
- alert when route-relevance validation fails on any would-be published record

Status-page visibility:

- workflow-08 should surface:
  - lane label
  - current as-of time
  - degraded/stale notice if applicable
  - source transparency
- rider-facing status must never imply “all clear” when lane data are stale or partially failed

Debugging order:

1. landing file for the failing source
2. validation log
3. status report
4. last-known-good snapshot
5. source website or ArcGIS endpoint itself

## 12. Known Risks and Mitigations

- HTML-only official trail pages are brittle.
  - Mitigation: section-level text extraction, body diffing, parser-failure guard before clearing events.
- Seattle-side coverage is weak.
  - Mitigation: keep scope narrow and do not invent citywide Seattle coverage that research did not support.
- ArcGIS sources can be semantically broad.
  - Mitigation: require lane-06 keyword filter plus geometry test before publication.
- Cross-lane duplication risk with lanes 01 and 05.
  - Mitigation: emit ownership metadata and follow [OVERLAP_NOTES.md] exactly.
- No source-native event IDs on HTML pages.
  - Mitigation: stable hash from source ID + canonicalized text block + location token.
- Runtime freshness policy may change when global thresholds are approved.
  - Mitigation: keep thresholds configurable, not hard-coded in workflow logic.
- Static-site caching may delay rider-visible freshness after workflow-08 publishes.
  - Mitigation: workflow-08 must carry through exact `generated_at` and freshness labels; CDN policy remains a deployment-phase concern.

## 13. Deferred Decisions and Open Questions

- Final workflow-08 user-facing lane display name remains system-level open under `DEC-008`.
  - This spec uses binding folder/lane ID `06_TRAIL_INFRASTRUCTURE_STATUS` and carries `WATERWAY_AND_CROSSING_STATUS` only as the current research-backed display-label recommendation from `IMPLEMENTATION_RECOMMENDATION.md` and `RESEARCH_FINDINGS.md`.
- Global mandatory-vs-optional lane deploy gating remains open under `DEC-006`.
- Final cross-lane severity rollup taxonomy remains open under `DEC-009`.
- Cloudflare project/domain/deploy-branch concerns remain deferred to workflow-08 deployment design under `DEC-011` and `DEC-012`.
- Credential management system remains deferred to infrastructure phase.
- Notification transport remains open under `DEC-013`; this spec defines what should trigger alerts, not the final channel.

## 14. Research Traceability

- MVP sources `KC-01`, `KC-02`, `KC-03`, `SAM-02`, `ISS-01`
  - grounded in [IMPLEMENTATION_RECOMMENDATION.md], [RESEARCH_FINDINGS.md], [ENV_AND_READINESS.md]
- Secondary sources `SAM-01`, `REDM-01`, `KC-04`
  - grounded in [IMPLEMENTATION_RECOMMENDATION.md], [SOURCE_REGISTRY.json], [API_AND_FEED_TEST_RESULTS.md]
- Rejection of `KC-05`, `SEA-01`, `SEA-02`, `USGS-01`, `USACE-01`, `WSDOT-01`
  - grounded in [API_AND_FEED_TEST_RESULTS.md], [RESEARCH_FINDINGS.md], [SOURCE_REGISTRY.json]
- Route-relevance thresholds:
  - points `<= 60 m`, `60-150 m`, `> 150 m`
  - line/polygon prefilter `250 m`
  - direct-impact buffer `75 m`
  - grounded in [ROUTE_RELEVANCE_AND_THRESHOLDS.md]
- Ballard Locks, Montlake Bridge, and Lake Sammamish gage exclusions
  - grounded in [ROUTE_RELEVANCE_AND_THRESHOLDS.md], [RESEARCH_FINDINGS.md]
- HTML-source freshness `24 hours` and ArcGIS-source freshness `12 hours`
  - grounded in [IMPLEMENTATION_RECOMMENDATION.md], [ENV_AND_READINESS.md], [SOURCE_REGISTRY.json]
- `SAM-02` `48 hours`, `SAM-01` `72 hours`, `KC-04` `7 days`
  - grounded in [SOURCE_REGISTRY.json]
- Last-known-good preservation and failure-safe publication
  - grounded in [IMPLEMENTATION_RECOMMENDATION.md], [00_CDM_CONNECTOR_LESSONS_APPLIED.md], [00_SHARED_AUTONOMOUS_CONNECTOR_BUILD_STANDARD.md]
- Shared envelope, namespaced source IDs, no direct `public/data/` writes, workflow naming/tag rules
  - grounded in [00_SHARED_AUTONOMOUS_CONNECTOR_BUILD_STANDARD.md] and `DEC-001`, `DEC-002`, `DEC-010` from [00_OPEN_CONNECTOR_ARCHITECTURE_DECISIONS.md]
- Honest readiness statement
  - grounded in [UW_ISSY_06_TRAIL_INFRASTRUCTURE_STATUS_AUDIT_REPORT_v1.md], [ENV_AND_READINESS.md], and unresolved architecture decisions in [00_OPEN_CONNECTOR_ARCHITECTURE_DECISIONS.md]

## Completion Check

- All required sections are present.
- All source behavior claims in this spec are grounded in the recorded July 29, 2026 live tests.
- The JSON examples are illustrative, valid JSON, and based on real source fields rather than invented incident types.
- Route relevance is specified in implementable local-math terms with no external geocoding dependency.
- Freshness, failure, fallback, and LKG behavior are explicit at the source-branch and connector levels.
- Workflow pseudocode is n8n-implementable and references real observed field families.
- No credentials or secret values appear in this specification.
