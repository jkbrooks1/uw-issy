# 01_ROUTE_CONDITIONS_EXECUTABLE_BUILD_SPECIFICATION_v1

## 1. Overview

- **Lane ID / name:** `01_ROUTE_CONDITIONS` / `UW-Issaquah Route Conditions Connector`
- **Purpose:** publish official route-passability conditions that affect whether a rider can traverse the University of Washington -> Burke-Gilman Trail -> Sammamish River Trail -> Marymoor Park -> East Lake Sammamish Trail -> Issaquah corridor, with emphasis on closures, detours, construction impacts, and access restrictions, not general hazard advisories. This follows `RESEARCH_FINDINGS.md`, `ROUTE_SECTION_SOURCE_MAPPING.md`, and the lane-overlap rules stated in `SOURCE_GAPS.md`.
- **Approved MVP sources:** `KC-01`, `KC-02`, `KC-03`, `SAM-01`, `ISS-01`, `REDM-01`, `ISS-03` (`IMPLEMENTATION_RECOMMENDATION.md`, `UW_ISSY_01_ROUTE_CONDITIONS_IMPLEMENTATION_RECOMMENDATION_v1.md`).
- **Approved secondary sources for the first executable build:** `SEA-03`, `UW-01`, `UW-02`, `KC-06`, `ISS-04`, `SAM-02`, `SAM-03`, `WSDOT-01`, `ST-01`, `OTH-03B`, `OTH-03D` (`SOURCE_REGISTRY.json`, `IMPLEMENTATION_RECOMMENDATION.md`). `KC-07` is real but unresolved and is excluded from the initial build set (`IMPLEMENTATION_RECOMMENDATION.md`, `UW_ISSY_01_ROUTE_CONDITIONS_AUDIT_REPORT_v1.md`).
- **High-level data flow:** schedule trigger -> fetch source payload -> land raw payload -> parse -> normalize -> apply route relevance -> validate -> write candidate artifact -> promote to published only if validation passes -> emit health, evidence, and workflow-08 handoff metadata.
- **Workflow-08 integration:** this connector writes only internal connector artifacts under `data/connectors/{raw,normalized,candidate,published,last_known_good,health,evidence,logs,quarantine,handoff}/01_ROUTE_CONDITIONS/`; workflow `08_ASSEMBLE_VALIDATE_BUILD_DEPLOY` consumes the published connector envelope plus health/provenance artifacts and alone generates rider-facing `public/data/` outputs (`00_SHARED_AUTONOMOUS_CONNECTOR_BUILD_STANDARD.md`, `00_OPEN_CONNECTOR_ARCHITECTURE_DECISIONS.md` DEC-002).
- **Shared standard and architecture references:** this specification is bound to `00_SHARED_AUTONOMOUS_CONNECTOR_BUILD_STANDARD.md`, `00_OPEN_CONNECTOR_ARCHITECTURE_DECISIONS.md`, and `00_CDM_CONNECTOR_LESSONS_APPLIED.md`.
- **Readiness assessment:** ready to build an initial connector workflow, but not ready to auto-assert geometry-based `confirmed_route_impact` for `KC-06`, `REDM-01`, or `ISS-03` until corridor-buffer intersection is implemented against the canonical GPX. The research explicitly documents that bbox-only matching is unreliable (`IMPLEMENTATION_RECOMMENDATION.md`, `API_AND_FEED_TEST_RESULTS.md`, `SOURCE_GAPS.md`, `UW_ISSY_01_ROUTE_CONDITIONS_AUDIT_REPORT_v1.md`).
- **Documentation note:** the work order names lane-local files `ROUTE_RELEVANCE_AND_THRESHOLDS.md`, `ENV_AND_READINESS.md`, `NORMALIZED_SCHEMA_PROPOSAL.md`, and `OVERLAP_NOTES.md`, but those files are not present in `00_CONNECTORS/01_ROUTE_CONDITIONS` as of July 31, 2026. Their required evidence is instead taken from `IMPLEMENTATION_RECOMMENDATION.md`, `SOURCE_REGISTRY.json`, `SOURCE_GAPS.md`, `ROUTE_SECTION_SOURCE_MAPPING.md`, and the v1 summary reports.

## 2. SOURCE ACQUISITION Strategy

### 2.1 First-release scheduling contract

- **Workflow trigger cadence:** one complete connector workflow every `60 minutes` in `America/Los_Angeles`.
- **Reasoning:** `REDM-01` and `ISS-03` are MVP structured APIs with a recommended `1 hour` freshness threshold; slower HTML/RSS sources can be fetched on the same hourly workflow without violating their own slower thresholds (`IMPLEMENTATION_RECOMMENDATION.md`, `SOURCE_REGISTRY.json`).
- **Execution rule:** prevent overlapping runs; bounded retries only; failed runs must preserve published and last-known-good artifacts (`00_CDM_CONNECTOR_LESSONS_APPLIED.md`, `00_SHARED_AUTONOMOUS_CONNECTOR_BUILD_STANDARD.md`).

### 2.2 MVP sources

| Source | Agency | Acquisition | Fetch in first build | Freshness threshold | Credentials |
|---|---|---|---|---|---|
| `KC-01` | King County Parks | HTML page fetch | hourly workflow | stale after 24h | none |
| `KC-02` | King County Parks | HTML page fetch | hourly workflow | stale after 24h | none |
| `KC-03` | King County Parks | HTML page fetch | hourly workflow | stale after 24h | none |
| `SAM-01` | City of Sammamish | HTML page fetch | hourly workflow | stale after 48h | none |
| `ISS-01` | City of Issaquah | RSS preferred, HTML fallback | hourly workflow | stale after 24h | none |
| `REDM-01` | City of Redmond | ArcGIS REST `/query` | hourly workflow | stale after 1h | none |
| `ISS-03` | City of Issaquah | ArcGIS REST `/query` | hourly workflow | stale after 1h | none |

### 2.3 Secondary sources

| Source | Agency | Acquisition | Fetch in first build | Freshness threshold | Credentials |
|---|---|---|---|---|---|
| `SEA-03` | Seattle Parks | HTML page fetch | every 24th workflow run | stale after 48h | none |
| `UW-01` | UW Facilities | HTML page fetch | every 24th workflow run | stale after 24h | none |
| `UW-02` | UW Transportation | HTML page fetch | every 24th workflow run | stale after 24h | none |
| `KC-06` | King County Road Services | ArcGIS REST `/query` | hourly workflow | stale after 1h | none |
| `ISS-04` | City of Issaquah | ArcGIS REST `/query` | every 24th workflow run | stale after 72h | none |
| `SAM-02` | City of Sammamish | ArcGIS REST `/query` | every 24th workflow run | stale after 48h | none |
| `SAM-03` | City of Sammamish | ArcGIS REST `/query` | every 168th workflow run | stale after 7d | none |
| `WSDOT-01` | WSDOT | REST API | disabled in v1 | stale after 1h if enabled later | `UW_ISSY_WSDOT_ACCESS_CODE` |
| `ST-01` | Sound Transit | HTML page fetch | every 168th workflow run | stale after 7d | none |
| `OTH-03B` | City of Kenmore | HTML page fetch | every 168th workflow run | stale after 72h | none |
| `OTH-03D` | City of Woodinville | RSS preferred, HTML fallback | every 24th workflow run | stale after 48h | none |

### 2.4 Per-source acquisition details

#### `KC-01`, `KC-02`, `KC-03`

- **Owning agency:** King County Parks / Leafline Trails Network.
- **Method:** unauthenticated `HTTP Request` to the page URL.
- **n8n pattern:** `HTTP Request` -> `HTML Extract` or `Code` node to isolate the alert block -> `Set` node for source metadata -> normalization branch.
- **Authentication flow:** none.
- **Error handling:** retry once after a 2-minute backoff for timeout, network error, or `5xx`; do not retry `4xx`; if the page loads but the expected content block cannot be found, mark the source `degraded`, record a validation event, and preserve last-known-good.
- **Documented failure modes:** transient banner disappearance, page redesign, fetch success with missing alert structure, transport failure (`API_AND_FEED_TEST_RESULTS.md`, `SOURCE_REGISTRY.json`).
- **Rate limiting:** none documented; courtesy access only.
- **Network requirements:** public King County web pages; research confirmed reachability from an ordinary public network.
- **Fallback:** no direct substitute; absence or failure on one King County page does not permit inferring status from a sibling page.
- **Last-known-good:** retain the last successfully parsed content block and its content hash.

#### `SAM-01`

- **Owning agency:** City of Sammamish.
- **Method:** unauthenticated HTML page fetch.
- **n8n pattern:** `HTTP Request` -> `HTML Extract` or `Code` node to split project sections by heading -> route-term matching -> normalization.
- **Authentication flow:** none.
- **Error handling:** retry once on timeout or `5xx`; no retry on `4xx`; if the annual page rolls to a new URL or loses expected headings, mark `degraded`, do not publish new events from this source for that run, and preserve LKG.
- **Documented failure modes:** annual page rollover, seasonal prose instead of exact dates, page-structure drift (`API_AND_FEED_TEST_RESULTS.md`, `SOURCE_REGISTRY.json`).
- **Rate limiting:** none documented.
- **Network requirements:** public city website; no geo restriction observed.
- **Fallback:** `KC-03` remains the stronger source for ELST trail-status language; `SAM-01` is corroborating and segment-supplementing.
- **Last-known-good:** retain the last parsed project blocks plus page-level publication date if present.

#### `ISS-01`

- **Owning agency:** City of Issaquah.
- **Method:** RSS feed preferred because the civic alerts page explicitly exposes RSS; HTML list/detail pages are the fallback (`API_AND_FEED_TEST_RESULTS.md`, `IMPLEMENTATION_RECOMMENDATION.md`).
- **n8n pattern:** `HTTP Request` RSS -> XML parse -> per-item filter by route street list -> detail fetch by civic alert ID if needed; fallback branch `HTTP Request` HTML -> extract `<li>` items -> follow per-item link.
- **Authentication flow:** none.
- **Error handling:** if RSS fails but HTML succeeds, mark source `degraded` and continue; if both fail, preserve LKG and mark source stale once the 24-hour threshold is exceeded.
- **Documented failure modes:** feed parse drift, RSS unavailable while HTML still works, items that are citywide but not route-relevant (`SOURCE_REGISTRY.json`, `IMPLEMENTATION_RECOMMENDATION.md`).
- **Rate limiting:** none documented.
- **Network requirements:** public CivicPlus infrastructure; no auth required.
- **Fallback:** `ISS-03` supplements construction projects only and does not replace general traffic alerts.
- **Last-known-good:** store last successful items by numeric civic alert ID.

#### `REDM-01`

- **Owning agency:** City of Redmond Public Works.
- **Method:** ArcGIS REST `query` against all three geometry layers in `Traffic/Alerts`.
- **n8n pattern:** layer loop `0`, `1`, `2` -> `HTTP Request` JSON -> merge features -> corridor-buffer route relevance -> normalization.
- **Authentication flow:** none.
- **Error handling:** retry once on timeout, network failure, or `5xx`; do not retry `4xx` or ArcGIS schema errors; if one layer fails and the others succeed, mark `degraded` rather than `failed`.
- **Documented failure modes:** layer schema drift, route-nearby but not route-intersecting alerts, bbox false positives if implementation is sloppy (`API_AND_FEED_TEST_RESULTS.md`, `IMPLEMENTATION_RECOMMENDATION.md`, `SOURCE_GAPS.md`).
- **Rate limiting:** none documented in live testing.
- **Network requirements:** public ArcGIS Server reachable from a normal public network.
- **Fallback:** no Redmond-owned equivalent source exists; `KC-02` and `KC-03` cover nearby trail pages but not the same structured city alert set.
- **Last-known-good:** retain the full successful feature set and the last normalized route-relevant subset.

#### `ISS-03`

- **Owning agency:** City of Issaquah Public Works.
- **Method:** ArcGIS REST `query` against layer `0` of `PWProjectsCurrentYearConstructionPublic`.
- **n8n pattern:** `HTTP Request` JSON -> corridor-buffer route relevance -> normalization.
- **Authentication flow:** none.
- **Error handling:** retry once on timeout, network failure, or `5xx`; on malformed JSON or missing required fields, quarantine the landing payload, preserve LKG, and continue the connector run.
- **Documented failure modes:** broad project set, only bbox-tested during research, geometry relevance not fully corridor-proven yet (`API_AND_FEED_TEST_RESULTS.md`, `IMPLEMENTATION_RECOMMENDATION.md`, `UW_ISSY_01_ROUTE_CONDITIONS_AUDIT_REPORT_v1.md`).
- **Rate limiting:** none documented.
- **Network requirements:** public ArcGIS Server; no token gate encountered in live tests.
- **Fallback:** `ISS-01` may still surface street-specific general alerts, but it does not replace current-year project geometry.
- **Last-known-good:** retain the full successful feature set and the last normalized route-relevant subset.

#### Secondary-source rules

- `SEA-03`, `UW-01`, `UW-02`, `ST-01`, `OTH-03B`, and `OTH-03D` are text sources only. They may contribute `possible_route_impact` events or provenance/supporting context but do not override the stronger MVP signals for the same segment (`SOURCE_REGISTRY.json`, `ROUTE_SECTION_SOURCE_MAPPING.md`).
- `KC-06`, `ISS-04`, `SAM-02`, and `SAM-03` are structured ArcGIS sources. They must use the same corridor-buffer logic as `REDM-01` and `ISS-03`, and they default to `possible_route_impact` unless the route impact is explicit in source fields or exact geometry intersection with a named route segment is proven.
- `WSDOT-01` is out of scope for the first release because live API use still requires a developer access code that was not obtained during research. If added later, it must be restricted to the two confirmed crossing zones documented in `ROUTE_SECTION_SOURCE_MAPPING.md` and `SOURCE_REGISTRY.json`.

## 3. Normalization and Validation

### 3.1 Canonical output contract

The authoritative published artifact is the shared connector envelope defined by `00_SHARED_AUTONOMOUS_CONNECTOR_BUILD_STANDARD.md`, with route-condition content placed primarily in `events[]`, route section summaries in `route_sections[]`, and source/connector execution state in `source_health[]`, `connector_health`, `freshness`, `validation_state`, and `metadata`.

### 3.2 Illustrative normalized JSON example

This example is illustrative but grounded in a real researched condition: the East Lake Sammamish Trail closure documented by `KC-03` and corroborated by `SAM-01`. No additional incident is invented.

```json
{
  "schema_version": "1.0.0",
  "connector_id": "01_ROUTE_CONDITIONS",
  "connector_name": "UW-Issaquah Route Conditions Connector",
  "connector_version": "v0001",
  "lane": "01_ROUTE_CONDITIONS",
  "run_id": "01_ROUTE_CONDITIONS-20260731T190000Z-001",
  "generated_at": "2026-07-31T19:00:00Z",
  "published_at": "2026-07-31T19:00:03Z",
  "data_status": "ok",
  "freshness": {
    "overall_state": "fresh",
    "computed_at": "2026-07-31T19:00:03Z",
    "oldest_relevant_source_age_minutes": 41,
    "stale_source_ids": []
  },
  "manifest_ref": {
    "manifest_id": "01_ROUTE_CONDITIONS-v0001",
    "schema_version": "1.0.0"
  },
  "source_health": [
    {
      "source_id": "01_ROUTE_CONDITIONS:KC-03",
      "status": "ok",
      "retrieved_at": "2026-07-31T19:00:00Z",
      "http_status": 200,
      "used_last_known_good": false,
      "stale": false,
      "message": null
    }
  ],
  "connector_health": {
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
      "event_id": "01_ROUTE_CONDITIONS:KC-03:sha256_9dfd5f53",
      "source_id": "01_ROUTE_CONDITIONS:KC-03",
      "source_local_id": null,
      "source_event_key": "sha256:9dfd5f53",
      "event_type": "trail_closure",
      "status": "active",
      "severity": "high",
      "route_impact_state": "confirmed_route_impact",
      "summary": "East Lake Sammamish Trail closure for George Davis Creek culvert replacement.",
      "details": "Official King County page states the trail is closed between Louis Thompson Rd NE and NE Inglewood Hill Rd, starting June 1, 2026 through the end of 2026, with no detour.",
      "effective_start": "2026-06-01T00:00:00Z",
      "effective_end": "2026-12-31T23:59:59Z",
      "discovered_at": "2026-07-31T19:00:00Z",
      "last_verified_at": "2026-07-31T19:00:00Z",
      "published_observation_at": "2026-07-31T19:00:00Z",
      "location_description_raw": "Between Louis Thompson Rd NE and NE Inglewood Hill Rd.",
      "trail_or_street_name": "East Lake Sammamish Trail",
      "route_sections": [
        "09_east_lake_sammamish_trail_sammamish"
      ],
      "route_relevance": {
        "classification": "confirmed_route_impact",
        "method": "named_trail_segment_matching",
        "distance_to_route_km": 0.0,
        "buffer_km": null,
        "matched_terms": [
          "East Lake Sammamish Trail",
          "Louis Thompson Rd NE",
          "NE Inglewood Hill Rd"
        ],
        "manual_review_required": false
      },
      "detour_available": false,
      "geometry": {
        "type": "none",
        "coordinates": null,
        "bbox": null,
        "spatial_reference": "EPSG:4326"
      },
      "provenance": {
        "source_name": "King County Parks - East Lake Sammamish Trail page",
        "source_url": "https://kingcounty.gov/en/dept/dnrp/nature-recreation/parks-recreation/king-county-parks/trails/leafline-trails/east-lake-sammamish",
        "retrieved_at": "2026-07-31T19:00:00Z",
        "retrieval_method": "html_page_fetch",
        "content_hash": "sha256:9dfd5f53"
      }
    }
  ],
  "observations": [],
  "route_sections": [
    {
      "route_section_id": "09_east_lake_sammamish_trail_sammamish",
      "route_section_name": "East Lake Sammamish Trail - Sammamish",
      "status": "active_closure",
      "event_ids": [
        "01_ROUTE_CONDITIONS:KC-03:sha256_9dfd5f53"
      ],
      "updated_at": "2026-07-31T19:00:00Z"
    }
  ],
  "provenance": {
    "source_ids_used": [
      "01_ROUTE_CONDITIONS:KC-03"
    ],
    "canonical_gpx": "data/route/UnivWA-Issaquah.gpx"
  },
  "validation_state": {
    "candidate_validation_passed": true,
    "published_from_candidate": true,
    "validator_version": "1.0.0"
  },
  "metadata": {
    "manual_review_required": false,
    "notes": [
      "Illustrative example rooted in researched July 2026 evidence."
    ]
  }
}
```

### 3.3 Required fields

- **Envelope:** all fields required by section `5.A` of `00_SHARED_AUTONOMOUS_CONNECTOR_BUILD_STANDARD.md`.
- **Event required fields:** `event_id`, `source_id`, `event_type`, `status`, `severity`, `route_impact_state`, `summary`, `discovered_at`, `last_verified_at`, `location_description_raw`, `route_sections`, `route_relevance`, `provenance`.
- **Route relevance required subfields:** `classification`, `method`, `manual_review_required`.
- **Provenance required subfields:** `source_name`, `source_url`, `retrieved_at`, `retrieval_method`.

### 3.4 Optional fields

- `source_local_id`
- `source_event_key`
- `details`
- `effective_start`
- `effective_end`
- `published_observation_at`
- `trail_or_street_name`
- `detour_available`
- `geometry.coordinates`
- `geometry.bbox`
- `provenance.content_hash`
- `metadata.notes`

### 3.5 Enum-like fields

| Field | Allowed values |
|---|---|
| `data_status` | `ok`, `degraded`, `stale`, `no_relevant_events`, `failed_validation`, `failed_fetch`, `blocked`, `using_last_known_good` |
| `source_health[].status` | `ok`, `degraded`, `failed`, `stale`, `using_last_known_good`, `skipped_not_due` |
| `connector_health.status` | `ok`, `degraded`, `failed`, `stale`, `using_last_known_good` |
| `event_type` | `trail_closure`, `trail_detour`, `road_closure`, `construction_impact`, `access_restriction`, `maintenance_notice` |
| `status` | `active`, `scheduled`, `resolved`, `unknown` |
| `severity` | `high`, `medium`, `low`, `unknown` |
| `route_impact_state` | `confirmed_route_impact`, `possible_route_impact`, `nearby_no_confirmed_impact`, `not_route_relevant`, `unknown` |
| `route_relevance.classification` | same values as `route_impact_state` |
| `route_relevance.method` | `named_trail_segment_matching`, `route_street_name_matching`, `corridor_buffer_intersection`, `cross_street_match`, `manual_only` |
| `geometry.type` | `point`, `line`, `polygon`, `none` |
| `freshness.overall_state` | `fresh`, `stale`, `unknown` |
| `route_sections[].status` | `no_current_events`, `active_closure`, `active_restriction`, `possible_impact`, `unknown` |

### 3.6 Timestamp semantics

- All timestamps are RFC 3339 / ISO 8601 UTC strings ending in `Z`.
- `generated_at`: when the envelope was assembled.
- `published_at`: when the candidate artifact was promoted to published.
- `discovered_at`: when this connector first observed the event in normalized form.
- `last_verified_at`: last successful source fetch confirming the event still exists or is still active.
- `published_observation_at`: event timestamp derived from the source or, if absent, the connector fetch timestamp.
- `effective_start` / `effective_end`: source-stated event window when available; otherwise `null`.
- Example valid values: `2026-07-31T19:00:00Z`, `2026-06-01T00:00:00Z`.

### 3.7 Geographic fields

- Coordinates, when present, use decimal degrees in `EPSG:4326`.
- `geometry.coordinates` stores the normalized source geometry or representative point.
- `geometry.bbox` stores `[min_lon, min_lat, max_lon, max_lat]` when source geometry is reduced for metadata.
- `route_sections` stores normalized section IDs tied to the 10-section model in `ROUTE_SECTION_SOURCE_MAPPING.md`.
- `route_relevance.distance_to_route_km` is required nullable: actual numeric distance for geometry-capable sources, `0.0` for exact named-trail matches, `null` when not computable from source evidence.

### 3.8 Provenance fields

- Every event carries source-level provenance.
- Every envelope carries `provenance.source_ids_used` and `provenance.canonical_gpx`.
- Source IDs external to the lane-local registry are namespaced as `01_ROUTE_CONDITIONS:<local_source_id>` per the shared standard.

### 3.9 Validators run on every candidate publication

1. **Schema validation**
   - Validate the outer envelope and every event object against the connector schema.
   - Required fields must exist even when nullable.
2. **Coordinate validation**
   - For geometry-capable records, reject malformed geometries and any coordinates outside the canonical route envelope `lat 47.55207-47.75889`, `lon -122.3057 to -122.04414`, unless explicitly marked `nearby_no_confirmed_impact` (`RESEARCH_FINDINGS.md`, `API_AND_FEED_TEST_RESULTS.md`).
3. **Timestamp freshness validation**
   - Parse all timestamps.
   - Missing, invalid, or future timestamps degrade freshness to `unknown` and must not be treated as fresh (`00_CDM_CONNECTOR_LESSONS_APPLIED.md`).
4. **Source-health validation**
   - Compare the source fetch outcome to the documented failure modes from `SOURCE_REGISTRY.json`.
5. **Deduplication validation**
   - Ensure the same source event is not emitted twice within the same run or across unchanged runs.
6. **Route relevance validation**
   - For text sources, require exact named-trail or route-street evidence before `confirmed_route_impact`.
   - For geometry sources, require corridor-buffer intersection, not bbox-only matching, before `confirmed_route_impact`.

### 3.10 Validation-failure behavior

- Schema failure: quarantine candidate artifact, log error, preserve published and LKG artifacts.
- Coordinate failure on one event: drop that event from the candidate envelope, log validation failure, continue connector run if the rest of the envelope remains valid.
- Freshness failure: keep the event only if coming from LKG within the permitted retention window, mark envelope `using_last_known_good` or `stale`.
- Source failure: keep other source branches running and mark source health separately from connector health.
- Deduplication failure: collapse duplicates to a single canonical event and log the merge decision.

## 4. ROUTE RELEVANCE Calculation

### 4.1 Core decision by source class

- **King County and Sammamish HTML pages (`KC-01`, `KC-02`, `KC-03`, `SAM-01`):** use `named_trail_segment_matching` plus exact cross-street matching where present. This is grounded in the research finding that these pages are prose-only and do not expose machine-parseable geometry (`API_AND_FEED_TEST_RESULTS.md`, `IMPLEMENTATION_RECOMMENDATION.md`).
- **Issaquah Civic Alerts (`ISS-01`):** use `route_street_name_matching` against the corrected Issaquah-approach street list from `ROUTE_SECTION_SOURCE_MAPPING.md`: `East Lake Sammamish Parkway Northeast`, `East Lake Sammamish Lane Northeast`, `East Lake Sammamish Trail`.
- **Geometry-capable sources (`REDM-01`, `ISS-03`, `KC-06`, `ISS-04`, `SAM-02`, `SAM-03`, future `WSDOT-01`):** use `corridor_buffer_intersection` against the canonical GPX, never bbox-only matching. The implementation threshold for v1 is an exact `0.20 km` route buffer, derived from the research recommendation of `100-200m` and fixed here at the conservative upper bound to minimize false negatives while still obeying the validated anti-bbox rule (`IMPLEMENTATION_RECOMMENDATION.md`, `UW_ISSY_01_ROUTE_CONDITIONS_IMPLEMENTATION_RECOMMENDATION_v1.md`).
- **Secondary Seattle/UW/Sound Transit text sources (`SEA-03`, `UW-01`, `UW-02`, `ST-01`, `OTH-03B`, `OTH-03D`):** use exact named trail or route-street matches only; otherwise classify as `possible_route_impact` or `not_route_relevant`.

### 4.2 n8n implementation sketch

1. Load canonical GPX geometry from `data/route/UnivWA-Issaquah.gpx`.
2. Precompute:
   - route bounding envelope
   - 10 normalized route sections
   - a `0.20 km` buffered corridor polyline/polygon
   - exact route term lists from `ROUTE_SECTION_SOURCE_MAPPING.md`
3. For text sources:
   - normalize case and whitespace
   - search for exact trail names, route section names, and approved Issaquah street names
   - require route term plus impact term such as `closed`, `closure`, `detour`, `construction`, `flagger`, `lane closure`, `trail closure`
4. For geometry sources:
   - convert source geometries to `EPSG:4326` if needed
   - intersect source point/line/polygon with the buffered route corridor
   - compute `distance_to_route_km`
5. Assign classification:
   - exact named trail closure on the route -> `confirmed_route_impact`
   - exact corridor geometry intersection but unclear passability -> `possible_route_impact`
   - geometry inside city bbox but outside corridor buffer -> `nearby_no_confirmed_impact`
   - no route evidence -> `not_route_relevant`

### 4.3 Edge cases and fallback logic

- Ambiguous street name with no exact route-term match: publish only as `possible_route_impact` with `manual_review_required=true`.
- Geometry feature intersects the buffer but source text does not indicate passability impact: publish as `possible_route_impact`, not `confirmed_route_impact`.
- Source names a jurisdiction but not the route, trail, or known route street: `not_route_relevant`.
- Multiple route sections matched: assign all matched section IDs.
- Missing geometry from a geometry-capable source: use source text and status fields if present; otherwise classify `unknown`.

### 4.4 Geographic bounds check

- Strict envelope check for route-adjacent claims:
  - minimum latitude `47.55207`
  - maximum latitude `47.75889`
  - minimum longitude `-122.3057`
  - maximum longitude `-122.04414`
- Records outside that envelope cannot be classified `confirmed_route_impact`.
- This envelope is only a coarse validator. It is never sufficient for publication proof because the research showed bbox-only matching can produce false positives (`RESEARCH_FINDINGS.md`, `SOURCE_GAPS.md`, `API_AND_FEED_TEST_RESULTS.md`).

## 5. FRESHNESS, Failure, and Fallback

### 5.1 Freshness rules

| Source class | Fresh if last success <= | Stale if older than | Drop from published output after |
|---|---|---|---|
| `REDM-01`, `ISS-03`, `KC-06`, future `WSDOT-01` | 1h | >1h | 24h |
| `ISS-01`, `UW-01`, `UW-02`, `KC-01`, `KC-02`, `KC-03` | 24h | >24h | 72h |
| `SAM-01`, `SEA-03`, `OTH-03D`, `ISS-04`, `SAM-02` | 48h | >48h | 7d |
| `SAM-03`, `ST-01`, `OTH-03B` | 7d | >7d | 21d |

- The drop horizon is an implementation policy derived from the recommended source cadences plus the shared LKG/stale-data lessons. It preserves visibility of prior validated data without letting it appear current (`IMPLEMENTATION_RECOMMENDATION.md`, `00_CDM_CONNECTOR_LESSONS_APPLIED.md`).

### 5.2 Stale-data marking

- Stale events remain in the envelope only while within the drop horizon.
- The envelope-level `data_status` becomes `stale` or `using_last_known_good`.
- `freshness.stale_source_ids` lists every stale source.
- `source_health[].stale=true`.
- No stale field is rewritten to a false fresh value; unknown timestamps stay unknown.

### 5.3 Last-known-good strategy

- Store the latest validated published envelope in `data/connectors/last_known_good/01_ROUTE_CONDITIONS/current.json`.
- Retain immutable timestamped LKG snapshots under `data/connectors/last_known_good/01_ROUTE_CONDITIONS/archive/`.
- The active LKG snapshot remains until superseded by a newer valid one, per DEC-004 and the shared standard.
- Raw per-source LKG payloads may also be retained for fragile HTML sources whose change detection depends on full-page diffing.

### 5.4 Failure and recovery behavior

- **Source API/page down:** retry once if transport or `5xx`; if still failing, preserve source-level LKG, mark source health `using_last_known_good`, continue the run, and keep the connector `degraded` if at least one required source branch still succeeded.
- **Source returns `4xx`:** do not retry; mark source `failed`; continue other branches.
- **Source returns `500` or timeout:** retry once after 2 minutes; if still failing, preserve LKG and continue other branches.
- **Network unreachable:** same as timeout.
- **Malformed response:** write sanitized landing payload and error note, quarantine parse output if needed, skip new events from that source, continue other branches.
- **Merged output fails validation:** do not overwrite published output; keep current published artifact; write candidate failure evidence and quarantine.
- **All MVP sources fail or only stale LKG remains beyond drop horizons:** connector `data_status=failed_fetch` or `stale` depending on what remains; do not erase the prior published snapshot.

### 5.5 Cross-lane deduplication participation

- This lane does **not** perform cross-lane deduplication itself.
- It **does** emit `route_impact_state`, `event_type`, `route_sections`, and provenance needed by workflow `08` to deduplicate overlapping hazards with lanes `05`, `06`, and `07`.
- Overlap guidance comes from `RESEARCH_FINDINGS.md` and `SOURCE_GAPS.md`: lane `01` owns current passability/closure impacts; lane `06` owns longer-lived infrastructure condition context; lanes `05` and `07` own the underlying flood or public-safety hazard unless there is an explicit route closure.

## 6. Evidence and Validation Outputs

The work order’s example paths are normalized here to the approved shared artifact tree from `00_SHARED_AUTONOMOUS_CONNECTOR_BUILD_STANDARD.md`.

### 6.1 Raw landings

- **Path:** `data/connectors/raw/01_ROUTE_CONDITIONS/landings/<source_id>_landing_<timestamp>.json`
- **Contents:** sanitized raw payload, HTTP status, retrieved-at timestamp, request URL, source metadata, content hash.
- **Retention:** keep at least the last 3 cycles per source and then apply DEC-004 defaults: 14 days for successful raw payloads, 30 days for failed/anomalous payloads.

### 6.2 Normalized outputs

- **Candidate path:** `data/connectors/candidate/01_ROUTE_CONDITIONS/01_ROUTE_CONDITIONS_candidate_<timestamp>.json`
- **Published path:** `data/connectors/published/01_ROUTE_CONDITIONS/01_ROUTE_CONDITIONS_published_<timestamp>.json`
- **Normalized intermediate path:** `data/connectors/normalized/01_ROUTE_CONDITIONS/01_ROUTE_CONDITIONS_normalized_output_<timestamp>.json`
- **Current pointer files:** `current.json` in candidate, published, and last-known-good directories.

### 6.3 Validation logs

- **Path:** `data/connectors/logs/01_ROUTE_CONDITIONS/validation_log_<timestamp>.jsonl`
- **Format:** one JSON object per validation event with `source_id`, `run_id`, `stage`, `check`, `result`, `message`, `timestamp`.

### 6.4 Health and status report

- **Path:** `data/connectors/health/01_ROUTE_CONDITIONS/status.json`
- **Overwrite policy:** overwritten each run after validation and publication decisions complete.
- **Required fields:** `lane_id`, `run_id`, `last_fetch_at`, `last_success_at`, `status`, `source_health`, `error_messages`, `stale_data_fields`, `published_artifact_ref`, `last_known_good_ref`.

### 6.5 Quarantine and handoff artifacts

- **Quarantine:** `data/connectors/quarantine/01_ROUTE_CONDITIONS/<timestamp>_<reason>.json`
- **Workflow-08 handoff:** `data/connectors/handoff/01_ROUTE_CONDITIONS/<run_id>.json`

## 7. DATA SCHEMA Specification

### 7.1 Authoritative envelope shape

- The authoritative schema is the shared connector envelope from `00_SHARED_AUTONOMOUS_CONNECTOR_BUILD_STANDARD.md`.
- Lane-specific required arrays:
  - `events[]`: discrete closures, detours, construction impacts, or access restrictions.
  - `observations[]`: normally empty for this lane unless a source exposes non-discrete passability observations.
  - `route_sections[]`: section rollups for workflow-08 consumption.

### 7.2 Field definitions

| Field | Type | Cardinality | Definition | Example |
|---|---|---|---|---|
| `schema_version` | string | required | schema version for the envelope | `1.0.0` |
| `connector_id` | string | required | connector identifier | `01_ROUTE_CONDITIONS` |
| `run_id` | string | required | unique execution identifier | `01_ROUTE_CONDITIONS-20260731T190000Z-001` |
| `data_status` | string | required | connector publication state | `ok` |
| `source_health` | array | required | per-source execution state | `[]` |
| `events` | array | required | route-condition events | `[ ... ]` |
| `route_sections` | array | required | route-section status rollups | `[ ... ]` |
| `event_id` | string | required | stable normalized event key | `01_ROUTE_CONDITIONS:KC-03:sha256_9dfd5f53` |
| `source_id` | string | required | globally namespaced source id | `01_ROUTE_CONDITIONS:KC-03` |
| `source_local_id` | string or null | required nullable | source-native record id when available | `6480` |
| `event_type` | string | required | normalized event class | `trail_closure` |
| `status` | string | required | event lifecycle state | `active` |
| `severity` | string | required | rider-facing seriousness within this lane | `high` |
| `route_impact_state` | string | required | route impact conclusion | `confirmed_route_impact` |
| `summary` | string | required | concise normalized summary | `East Lake Sammamish Trail closure for George Davis Creek culvert replacement.` |
| `details` | string or null | optional | fuller narrative | `Official King County page states...` |
| `effective_start` | string or null | required nullable | event start if known | `2026-06-01T00:00:00Z` |
| `effective_end` | string or null | required nullable | event end if known | `2026-12-31T23:59:59Z` |
| `location_description_raw` | string | required | source text naming the affected area | `Between Louis Thompson Rd NE and NE Inglewood Hill Rd.` |
| `route_sections` | array of strings | required | normalized affected route sections | `["09_east_lake_sammamish_trail_sammamish"]` |
| `route_relevance` | object | required | route matching evidence | `{...}` |
| `geometry` | object | required | normalized geometry metadata | `{ "type": "none", ... }` |
| `provenance` | object | required | source attribution | `{...}` |

### 7.3 Nested object definitions

- `route_relevance`
  - `classification`: enum
  - `method`: enum
  - `distance_to_route_km`: number or null
  - `buffer_km`: number or null
  - `matched_terms`: array
  - `manual_review_required`: boolean
- `geometry`
  - `type`: enum
  - `coordinates`: array or null
  - `bbox`: array or null
  - `spatial_reference`: string
- `provenance`
  - `source_name`: string
  - `source_url`: string
  - `retrieved_at`: string
  - `retrieval_method`: string
  - `content_hash`: string or null

### 7.4 Reserved fields

- `advisories`: reserved for future workflow-08 consumption; omit or publish as `[]`.
- `ownership_annotations`: reserved for future cross-lane ownership metadata; omit or publish as `[]`.
- Any future manual-review workflow IDs are reserved and must be `null` or omitted in v1.

### 7.5 Example error-state publication

If `REDM-01` and `ISS-03` both fail on a run but the connector can still safely publish preserved `KC-03` LKG data, publish:

```json
{
  "data_status": "using_last_known_good",
  "freshness": {
    "overall_state": "stale",
    "computed_at": "2026-07-31T19:00:03Z",
    "oldest_relevant_source_age_minutes": 180,
    "stale_source_ids": [
      "01_ROUTE_CONDITIONS:REDM-01",
      "01_ROUTE_CONDITIONS:ISS-03"
    ]
  },
  "connector_health": {
    "status": "degraded",
    "used_last_known_good": true
  }
}
```

## 8. N8N WORKFLOW ARCHITECTURE Sketch

- **Workflow name:** `v0001.01_RouteConditionsConnector`
- **Workflow tags:** `uw_issy`, `connector`, `lane_01_route_conditions`, `no_direct_deploy`, `active`
- **Project/folder:** `UW-ISSY ROUTE MONITOR`
- **Trigger:** scheduled plus manual execution support
- **Trigger cadence:** every `60 minutes` in `America/Los_Angeles`

### 8.1 Node structure pseudocode

```text
Schedule Trigger (60 minutes, no overlap)
  -> Initialize run metadata
  -> Load canonical GPX and route-section lookup
  -> Build 0.20 km corridor buffer and route term lists
  -> For each source definition:
       -> If source disabled or not due, emit source_health=skipped_not_due
       -> Else Fetch source payload
       -> Land raw payload to data/connectors/raw/01_ROUTE_CONDITIONS/landings/
       -> Parse payload by source adapter
       -> Normalize source records
       -> Apply route relevance
       -> Validate source records
       -> Deduplicate within source
       -> Emit source_health record
  -> Merge all normalized events
  -> Deduplicate across sources within lane
  -> Build route_sections summaries
  -> Validate merged envelope
  -> Write normalized intermediate artifact
  -> Write candidate artifact
  -> If candidate validation passed:
       -> Atomically promote candidate to published
       -> Update last-known-good
     Else:
       -> Quarantine failed candidate
       -> Preserve current published artifact
  -> Write validation log
  -> Write health/status file
  -> Write workflow-08 handoff file
```

### 8.2 Error handling

- One source branch failing does not abort the whole workflow if at least one required source still produces a valid branch.
- Partial output is allowed and should be marked `degraded`.
- If merged validation fails, the connector must not publish the new candidate.

### 8.3 Retry strategy

- Network error or `5xx`: one retry after 2 minutes.
- `4xx`: no retry.
- Malformed body: no retry unless the source returned a transport-level partial body due to timeout; otherwise quarantine and continue.

### 8.4 Logging

- `info`: fetch start/end, landing write, candidate write, publish promotion, source skipped-not-due.
- `warning`: extraction mismatch, stale source, LKG use, ambiguous route relevance, manual-review-needed classification.
- `error`: fetch failure after retry, parse failure, schema failure, candidate quarantine, published write refusal.

### 8.5 Performance

- Expected runtime: well under 10 minutes for the hourly run under normal conditions because all first-release sources are low-volume pages or modest ArcGIS queries.
- Parallelization: fetch sources in parallel branches by source; serialize only at merge, candidate write, published promotion, LKG update, and status-file write.

## 9. Integration with Workflow-08 and Publication

- **Workflow-08 consumes:** the published connector envelope, `status.json`, and the handoff artifact.
- **Fields workflow-08 needs from this lane:** `data_status`, `freshness`, `events[]`, `route_sections[]`, `source_health`, `connector_health`, and provenance.
- **Cross-lane overlap handling:** workflow-08 must deduplicate on `route_sections`, `event_type`, `route_impact_state`, and provenance while preserving source-native descriptions. Lane `01` owns current passability impacts; it does not own generalized flood, wildfire, or public-safety warnings unless an official source explicitly ties them to route closure (`RESEARCH_FINDINGS.md`, `SOURCE_GAPS.md`).
- **Publication timing:** workflow-08 should republish the site on its own schedule or after connector success according to the separate workflow-08 spec; this connector does not decide deployment gates, because DEC-006 remains unresolved.
- **Responsibility split:**
  - lane `01`: fetch, normalize, validate, preserve LKG, publish internal connector artifacts
  - workflow `08`: cross-lane deduplication, deploy gating, rider-facing data materialization, site publication

## 10. Testing and Validation Strategy

### 10.1 Unit tests

- Route-term matching for `KC-01/02/03`, `SAM-01`, `ISS-01`
- Corridor-buffer intersection math for `REDM-01`, `ISS-03`, `KC-06`
- Timestamp freshness classification
- Deduplication key generation
- Source-health derivation

### 10.2 Integration tests

- Real fetch smoke tests for all MVP sources using live endpoints documented in `API_AND_FEED_TEST_RESULTS.md`
- Parser tests against stored landing fixtures for:
  - `KC-03` closure page
  - `SAM-01` George Davis Creek section
  - `ISS-01` Civic Alerts RSS or HTML item list
  - `REDM-01` sample ArcGIS feature payload
  - `ISS-03` sample ArcGIS feature payload

### 10.3 Regression tests

- `KC-03` must normalize the researched East Lake Sammamish Trail closure into `confirmed_route_impact`
- `ISS-03` must recognize the researched `East Lake Sammamish Pkwy Drainage Improvement Project` as route-relevant but must not auto-upgrade to `confirmed_route_impact` without the corridor-buffer proof and passability evidence
- `KC-06` Cottage Lake false-positive case must remain excluded from route-relevant publication

### 10.4 Mock-test example

- Fixture: a saved `REDM-01` line feature whose geometry touches the buffered corridor and whose `AlertStatus=ACT`.
- Expected result: event emitted with `route_relevance.method=corridor_buffer_intersection`; if passability text is absent, `route_impact_state=possible_route_impact`.

### 10.5 Failure tests

- Simulate `500` on `ISS-03` and verify one retry then LKG fallback.
- Simulate HTML structure drift on `KC-03` and verify the connector does not silently publish an empty event set as `no_relevant_events`.
- Simulate malformed RSS on `ISS-01` and verify HTML fallback branch.
- Simulate future timestamp and verify freshness becomes `unknown`.

### 10.6 Pass criteria

- Candidate schema validates.
- Published artifact is only overwritten after successful validation.
- Validation log records every source branch and every decision.
- Known researched events map to the expected route section and classification.

## 11. Monitoring and Observability

- **Key metrics:**
  - fetch success rate per source
  - parse success rate per source
  - count of route-relevant events per run
  - percent of runs using LKG
  - stale-source count
  - candidate-validation pass rate
- **Alerts for operators:**
  - any MVP source failing for more than 2 consecutive runs
  - any MVP source stale beyond its freshness threshold
  - zero route-relevant output after a run that also reports parser warnings on a source that previously had active data
  - connector stuck in `using_last_known_good` for more than 24 hours
- **Status-page visibility:** workflow-08 should surface “Route conditions current as of `<timestamp>`” and show stale/degraded states honestly; it must not imply clear conditions when this lane is stale or unavailable.
- **Debug order:** check raw landing -> validation log -> status.json -> published artifact -> source page/API directly.

## 12. Known Risks and Mitigations

- **Risk:** five of seven MVP sources are prose HTML/RSS, not strict APIs.
  - **Mitigation:** full-page diffing, exact term matching, conservative `possible_route_impact` defaults where proof is weak.
- **Risk:** bbox false positives for geometry-capable sources.
  - **Mitigation:** mandatory `0.20 km` corridor-buffer intersection; bbox used only as a coarse validator.
- **Risk:** weak Seattle/UW coverage on route segments 1-2.
  - **Mitigation:** keep `SEA-03`, `UW-01`, and `UW-02` in the build as secondaries and surface low-confidence/coverage gaps honestly.
- **Risk:** credentialed WSDOT source unavailable in v1.
  - **Mitigation:** keep `WSDOT-01` disabled and non-blocking; rely on `KC-01` and `KC-02` for the confirmed crossing segments.
- **Risk:** overlap with lane `06` on capital projects such as George Davis Creek.
  - **Mitigation:** lane `01` publishes current passability impact; workflow-08 preserves cross-lane provenance and ownership separation.
- **Risk:** static-site publication can hide connector freshness if workflow-08 caches too aggressively.
  - **Mitigation:** workflow-08 must surface connector timestamps and stale state in rider-facing data.

## 13. Deferred Decisions and Open Questions

- Cloudflare/CDN cache behavior for rider-facing publication is deferred to workflow-08 and deployment work.
- The mandatory-vs-optional lane gate matrix for workflow-08 remains unresolved under DEC-006.
- Final workflow-08 deployment target, branch strategy, and failure notification channel remain unresolved under DEC-011, DEC-012, and DEC-013.
- `KC-07` remains excluded until it shows live content beyond its stale 2014 test record.
- A one-time browser-rendered DOM inspection is still needed before fragile HTML extraction selectors are finalized for the King County and Sammamish pages (`IMPLEMENTATION_RECOMMENDATION.md`).

## 14. Research Traceability

- **MVP source set `KC-01`, `KC-02`, `KC-03`, `SAM-01`, `ISS-01`, `REDM-01`, `ISS-03`:** `IMPLEMENTATION_RECOMMENDATION.md`, `UW_ISSY_01_ROUTE_CONDITIONS_IMPLEMENTATION_RECOMMENDATION_v1.md`, `SOURCE_REGISTRY.json`
- **Secondary source set and `KC-07` exclusion:** `SOURCE_REGISTRY.json`, `IMPLEMENTATION_RECOMMENDATION.md`, `UW_ISSY_01_ROUTE_CONDITIONS_AUDIT_REPORT_v1.md`
- **Need for corridor-buffer instead of bbox-only geometry:** `IMPLEMENTATION_RECOMMENDATION.md`, `API_AND_FEED_TEST_RESULTS.md`, `SOURCE_GAPS.md`, `UW_ISSY_01_ROUTE_CONDITIONS_AUDIT_REPORT_v1.md`
- **Chosen `0.20 km` buffer:** derived from the documented `100-200m` geometry-buffer recommendation in `IMPLEMENTATION_RECOMMENDATION.md` and `UW_ISSY_01_ROUTE_CONDITIONS_IMPLEMENTATION_RECOMMENDATION_v1.md`
- **Issaquah route-street list for `ISS-01`:** `ROUTE_SECTION_SOURCE_MAPPING.md`, `API_AND_FEED_TEST_RESULTS.md`
- **Canonical route envelope and Marymoor Connector correction:** `RESEARCH_FINDINGS.md`, `API_AND_FEED_TEST_RESULTS.md`
- **Freshness thresholds by source class:** `SOURCE_REGISTRY.json`, `IMPLEMENTATION_RECOMMENDATION.md`
- **Fallback/LKG/preserve-published behavior:** `00_CDM_CONNECTOR_LESSONS_APPLIED.md`, `00_SHARED_AUTONOMOUS_CONNECTOR_BUILD_STANDARD.md`
- **Retention defaults and approved artifact tree:** `00_OPEN_CONNECTOR_ARCHITECTURE_DECISIONS.md` DEC-002 and DEC-004, `00_SHARED_AUTONOMOUS_CONNECTOR_BUILD_STANDARD.md`
- **Cross-lane ownership boundaries:** `RESEARCH_FINDINGS.md`, `SOURCE_GAPS.md`
- **Honest readiness caution on geometry-capable MVP sources:** `UW_ISSY_01_ROUTE_CONDITIONS_AUDIT_REPORT_v1.md`, `UW_ISSY_01_ROUTE_CONDITIONS_FINAL_RESEARCH_REPORT_v1.md`
