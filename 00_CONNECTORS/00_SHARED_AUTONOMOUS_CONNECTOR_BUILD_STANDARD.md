# UW–Issaquah Shared Autonomous Connector Build Standard

Binding standard for connectors `01_ROUTE_CONDITIONS` through `07_GOVERNMENT_SAFETY_ALERTS` and for workflow `08_ASSEMBLE_VALIDATE_BUILD_DEPLOY`.

Status:
- effective for design immediately
- binding on future connector implementation
- schema examples below are normative examples of field names and shape, not live data

## 1. Core Principles

1. Every connector MUST operate independently through candidate publication.
2. Every connector MUST treat `data/route/UnivWA-Issaquah.gpx` as the canonical route source.
3. Connectors MUST NOT deploy the website directly.
4. Connector publication and workflow-08 publication MUST be separate phases.
5. All shared field names MUST use `snake_case`.
6. Every source id outside a lane-local registry MUST be globally namespaced as `<lane_id>:<local_source_id>`, for example `03_AIR_QUALITY:ECO-01`.
7. Unknown, stale, malformed, or missing data MUST NOT be rendered or interpreted as green, clear, or safe.

## 2. Scope And Independence

### 2.1 Connector scope and independence

- Each lane connector MUST fetch, normalize, validate, and publish only its own lane outputs.
- Each lane connector MAY read shared route geometry, shared schema definitions, and its own lane research.
- Each lane connector MUST NOT depend on another lane connector to produce its own raw landing, normalized outputs, source-health records, or execution evidence.
- Cross-lane deduplication and deployment gating MUST happen in workflow 08, not inside a lane connector, except that connectors MAY emit ownership and cross-reference metadata.

### 2.2 n8n workflow naming

- Workflow internal name MUST follow `vNNNN.<lane_number>_<lane_short_name>`.
- Exported filename stem MUST equal the internal workflow name exactly.
- Example:
  - internal name: `v0001.03_AirQualityConnector`
  - exported filename: `v0001.03_AirQualityConnector.n8n.workflow.json`

### 2.3 n8n folder and tag conventions

- Final n8n folder names are not yet resolved and remain an open decision.
- Until resolved, all design docs MUST refer to:
  - folder class: `UW_ISSY_CONNECTORS`
  - tags: `uw_issy`, lane id tag, environment tag, and lifecycle tag
- Minimum tags SHOULD be:
  - `uw_issy`
  - `01_route_conditions` through `08_assemble_validate_build_deploy`
  - `candidate_only`
  - `no_direct_deploy` for workflows 01–07

### 2.4 Exported workflow filename conventions

- Connector exports MUST use `.n8n.workflow.json`.
- Workflow-08 export MUST use the same suffix.
- Timestamped archival copies MAY be added, but the canonical export filename MUST remain stable.

### 2.5 Workflow versioning

- Connector versions MUST increment monotonically per lane.
- `connector_version` MUST be recorded in every output envelope, execution-evidence record, and handoff record.
- Version changes MUST be documented in `00_PROJECT_BUILDLOG.md`.

## 3. Runtime And Repository Paths

### 3.1 Hetzner runtime paths

These are required logical directories; the final absolute root is an open decision.

- Runtime root MUST contain:
  - `raw/`
  - `normalized/`
  - `candidate/`
  - `published/`
  - `last_known_good/`
  - `health/`
  - `evidence/`
  - `logs/`
  - `quarantine/`
  - `fixtures/`
  - `schemas/`
  - `handoff/`

- Final Hetzner absolute root remains open. Until resolved, documentation MUST refer to it as:
  - `<hetzner_runtime_root>/uw_issy_route_monitor/`

### 3.2 Local repository paths

- Research and design source of truth:
  - `00_CONNECTORS/<lane_dir>/`
  - `00_DOCS/`
- Canonical route:
  - `data/route/UnivWA-Issaquah.gpx`
- Proposed local implementation roots:
  - `data/connectors/raw/`
  - `data/connectors/normalized/`
  - `data/connectors/candidate/`
  - `data/connectors/published/`
  - `data/connectors/last_known_good/`
  - `data/connectors/health/`
  - `data/connectors/evidence/`
  - `data/connectors/quarantine/`
  - `data/connectors/manifests/`
  - `data/connectors/handoff/`
  - `tests/connectors/fixtures/`
  - `data/connectors/schemas/`

These paths are proposed target paths for future implementation and MUST NOT be assumed to already exist unless created intentionally in a later phase.

## 4. Canonical Shared Envelope

Every lane connector MUST publish one canonical connector output envelope.

### 4.1 Required outer envelope

```json
{
  "schema_version": "1.0.0",
  "connector_id": "03_AIR_QUALITY",
  "connector_name": "UW-Issaquah Air Quality Connector",
  "connector_version": "v0001",
  "lane": "03_AIR_QUALITY",
  "run_id": "03_AIR_QUALITY-20260730T190000Z-001",
  "generated_at": "2026-07-30T19:00:00Z",
  "published_at": "2026-07-30T19:00:02Z",
  "data_status": "ok",
  "freshness": {
    "overall_state": "fresh",
    "computed_at": "2026-07-30T19:00:02Z",
    "oldest_relevant_source_age_minutes": 12,
    "stale_source_ids": []
  },
  "manifest_ref": {
    "manifest_id": "03_AIR_QUALITY-v0001",
    "schema_version": "1.0.0"
  },
  "source_health": [],
  "connector_health": {},
  "events": [],
  "observations": [],
  "route_sections": [],
  "provenance": {},
  "validation_state": {},
  "metadata": {}
}
```

### 4.2 Outer-envelope rules

- `data_status` MUST describe connector publication state, not source hazard severity.
- `events[]` MUST hold discrete hazards or discrete closures/incidents.
- `observations[]` MUST hold continuous or sample-like conditions that are not discrete hazards.
- `route_sections[]` MUST summarize route impacts by named route section or segment id.
- `source_health` MUST be separate from `connector_health`.
- `validation_state` MUST indicate whether this envelope was validated and whether it was published from candidate.

## 5. Shared Schemas

For every schema below:
- records MUST use `snake_case`
- timestamps MUST use RFC 3339 / ISO-8601 UTC strings ending with `Z`
- when a field is “required nullable”, the key MUST exist and the value MAY be `null`

### 5.A Canonical connector output

Purpose:
- lane-level published or candidate connector output consumed by workflow 08

Required fields:
- `schema_version`: string
- `connector_id`: string
- `connector_name`: string
- `connector_version`: string
- `lane`: string
- `run_id`: string
- `generated_at`: string
- `published_at`: string or `null`
- `data_status`: enum
- `freshness`: object
- `manifest_ref`: object
- `source_health`: array
- `connector_health`: object
- `events`: array
- `observations`: array
- `route_sections`: array
- `provenance`: object
- `validation_state`: object
- `metadata`: object

Optional fields:
- `advisories`: array
- `ownership_annotations`: array

Allowed `data_status` values:
- `ok`
- `degraded`
- `stale`
- `no_relevant_events`
- `failed_validation`
- `failed_fetch`
- `blocked`
- `using_last_known_good`

Null behavior:
- `published_at` MAY be `null` for candidate-only records
- arrays MUST be present even when empty

Validation failure behavior:
- a failed connector output MUST NOT overwrite the published connector output
- the failed artifact MUST be quarantined and recorded in execution evidence

Publication scope:
- both internal candidate and published

Example JSON:

```json
{
  "schema_version": "1.0.0",
  "connector_id": "05_FLOOD_CONDITIONS",
  "connector_name": "UW-Issaquah Flood Conditions Connector",
  "connector_version": "v0001",
  "lane": "05_FLOOD_CONDITIONS",
  "run_id": "05_FLOOD_CONDITIONS-20260730T191500Z-001",
  "generated_at": "2026-07-30T19:15:00Z",
  "published_at": "2026-07-30T19:15:02Z",
  "data_status": "ok",
  "freshness": {
    "overall_state": "fresh",
    "computed_at": "2026-07-30T19:15:02Z",
    "oldest_relevant_source_age_minutes": 10,
    "stale_source_ids": []
  },
  "manifest_ref": {
    "manifest_id": "05_FLOOD_CONDITIONS-v0001",
    "schema_version": "1.0.0"
  },
  "source_health": [],
  "connector_health": {
    "status": "ok",
    "failed_stage": null,
    "warning_count": 0,
    "error_count": 0
  },
  "events": [],
  "observations": [],
  "route_sections": [],
  "provenance": {
    "source_ids_used": [
      "05_FLOOD_CONDITIONS:USGS-01",
      "05_FLOOD_CONDITIONS:NWPS-01"
    ]
  },
  "validation_state": {
    "candidate_validation_passed": true,
    "published_from_candidate": true,
    "validator_version": "1.0.0"
  },
  "metadata": {}
}
```

### 5.B Connector manifest

Purpose:
- declarative connector contract used by workflow 08 and auditors

Required fields:
- `schema_version`
- `connector_id`
- `connector_name`
- `lane`
- `connector_version`
- `workflow_name`
- `workflow_export_filename`
- `source_registry_ref`
- `expected_outputs`
- `required_sources`
- `optional_sources`
- `freshness_policy`
- `route_filter_policy`
- `owner`

Optional fields:
- `notes`
- `known_limitations`

Validation failure behavior:
- incompatible manifest MUST block workflow 08

Publication scope:
- retained internally and read by workflow 08; not a rider-facing public file

Example JSON:

```json
{
  "schema_version": "1.0.0",
  "connector_id": "03_AIR_QUALITY",
  "connector_name": "UW-Issaquah Air Quality Connector",
  "lane": "03_AIR_QUALITY",
  "connector_version": "v0001",
  "workflow_name": "v0001.03_AirQualityConnector",
  "workflow_export_filename": "v0001.03_AirQualityConnector.n8n.workflow.json",
  "source_registry_ref": "00_CONNECTORS/03_AIR_QUALITY/SOURCE_REGISTRY.json",
  "expected_outputs": [
    "connector-output.json",
    "source-health.json",
    "execution-evidence.json",
    "validation-result.json",
    "workflow-08-handoff.json"
  ],
  "required_sources": [
    "03_AIR_QUALITY:ECO-01",
    "03_AIR_QUALITY:ECO-02",
    "03_AIR_QUALITY:PSCAA-02"
  ],
  "optional_sources": [
    "03_AIR_QUALITY:NWS-AQ-01"
  ],
  "freshness_policy": {
    "default_threshold_minutes": 90,
    "lane_override_key": "03_AIR_QUALITY"
  },
  "route_filter_policy": {
    "text_only_requires_manual_rule": true,
    "geometry_requires_line_buffer_intersection": true
  },
  "owner": "UW_ISSY_CONNECTOR_PROGRAM",
  "notes": []
}
```

### 5.C Source-health record

Purpose:
- report health and freshness for one source within one connector run

Required fields:
- `schema_version`
- `connector_id`
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

Allowed `status` values:
- `ok`
- `degraded`
- `failed`
- `stale`
- `blocked`
- `not_run`
- `empty_but_valid`

Null behavior:
- `http_status` MAY be `null` when the failure happened before HTTP response
- `last_observation_at` MAY be `null`

Validation failure behavior:
- malformed source-health record MUST fail connector validation

Publication scope:
- both internal and published with connector output

Example JSON:

```json
{
  "schema_version": "1.0.0",
  "connector_id": "07_GOVERNMENT_SAFETY_ALERTS",
  "source_id": "07_GOVERNMENT_SAFETY_ALERTS:NWS-01",
  "source_name": "NWS CAP alerts",
  "status": "empty_but_valid",
  "retrieved_at": "2026-07-30T19:20:00Z",
  "stale_after_minutes": 15,
  "record_count": 0,
  "http_status": 200,
  "last_observation_at": null,
  "warnings": [],
  "errors": []
}
```

### 5.D Connector-health record

Purpose:
- report the connector pipeline state as distinct from source health

Required fields:
- `schema_version`
- `connector_id`
- `status`
- `failed_stage`
- `warning_count`
- `error_count`
- `used_last_known_good`
- `candidate_written`
- `published_written`

Allowed `status` values:
- `ok`
- `degraded`
- `failed`
- `blocked`

Validation failure behavior:
- malformed connector-health MUST fail connector output validation

Publication scope:
- both internal and published with connector output

Example JSON:

```json
{
  "schema_version": "1.0.0",
  "connector_id": "04_WILDFIRE",
  "status": "degraded",
  "failed_stage": "source_fetch",
  "warning_count": 1,
  "error_count": 0,
  "used_last_known_good": false,
  "candidate_written": true,
  "published_written": true
}
```

### 5.E Execution-evidence record

Purpose:
- preserve run lineage, artifacts, hashes, and promotion decisions

Required fields:
- `schema_version`
- `connector_id`
- `run_id`
- `workflow_name`
- `workflow_internal_id`
- `execution_id`
- `connector_version`
- `started_at`
- `finished_at`
- `result`
- `artifacts`
- `promotion_scope`
- `candidate_generated`
- `published_generated`

Allowed `result` values:
- `success`
- `partial_success`
- `failed`
- `blocked`

Allowed `promotion_scope` values:
- `raw_only`
- `normalized_only`
- `candidate_only`
- `candidate_and_published`
- `last_known_good_only`
- `none`

Publication scope:
- retained internally only

Example JSON:

```json
{
  "schema_version": "1.0.0",
  "connector_id": "03_AIR_QUALITY",
  "run_id": "03_AIR_QUALITY-20260730T192500Z-001",
  "workflow_name": "v0001.03_AirQualityConnector",
  "workflow_internal_id": "pending_n8n_id",
  "execution_id": "pending_n8n_execution_id",
  "connector_version": "v0001",
  "started_at": "2026-07-30T19:25:00Z",
  "finished_at": "2026-07-30T19:25:45Z",
  "result": "success",
  "artifacts": [
    {
      "path": "data/connectors/candidate/03_AIR_QUALITY/connector-output.json",
      "sha256": "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
    }
  ],
  "promotion_scope": "candidate_and_published",
  "candidate_generated": true,
  "published_generated": true
}
```

### 5.F Validation-result record

Purpose:
- machine-readable validation output for connector candidate and published artifacts

Required fields:
- `schema_version`
- `connector_id`
- `run_id`
- `passed`
- `errors`
- `warnings`
- `validator_version`
- `validated_paths`

Publication scope:
- retained internally and MAY be mirrored into published metadata if passed

Example JSON:

```json
{
  "schema_version": "1.0.0",
  "connector_id": "06_TRAIL_INFRASTRUCTURE_STATUS",
  "run_id": "06_TRAIL_INFRASTRUCTURE_STATUS-20260730T193000Z-001",
  "passed": true,
  "errors": [],
  "warnings": [],
  "validator_version": "1.0.0",
  "validated_paths": [
    "data/connectors/candidate/06_TRAIL_INFRASTRUCTURE_STATUS/connector-output.json"
  ]
}
```

### 5.G Publication record

Purpose:
- record one publish action to candidate, published, or last-known-good

Required fields:
- `schema_version`
- `connector_id`
- `run_id`
- `publication_target`
- `written_at`
- `written_paths`
- `atomic_write_confirmed`
- `read_back_validated`
- `superseded_run_id`

Allowed `publication_target` values:
- `candidate`
- `published`
- `last_known_good`
- `quarantine`

Publication scope:
- retained internally only

### 5.H Workflow-08 assembly handoff record

Purpose:
- declare what workflow 08 may consume from a lane run

Required fields:
- `schema_version`
- `connector_id`
- `lane`
- `run_id`
- `handoff_generated_at`
- `connector_output_path`
- `manifest_path`
- `validation_result_path`
- `execution_evidence_path`
- `publication_status`
- `data_status`
- `uses_last_known_good`
- `schema_compatible_with_workflow_08`

Publication scope:
- retained internally; workflow 08 input

Example JSON:

```json
{
  "schema_version": "1.0.0",
  "connector_id": "02_WEATHER",
  "lane": "02_WEATHER",
  "run_id": "02_WEATHER-20260730T194000Z-001",
  "handoff_generated_at": "2026-07-30T19:40:20Z",
  "connector_output_path": "data/connectors/published/02_WEATHER/connector-output.json",
  "manifest_path": "data/connectors/manifests/02_WEATHER/connector-manifest.json",
  "validation_result_path": "data/connectors/evidence/02_WEATHER/validation-result.json",
  "execution_evidence_path": "data/connectors/evidence/02_WEATHER/execution-evidence.json",
  "publication_status": "published",
  "data_status": "ok",
  "uses_last_known_good": false,
  "schema_compatible_with_workflow_08": true
}
```

### 5.I Canonical event identity

Purpose:
- deduplicate the same real-world event across sources and lanes

Required fields:
- `schema_version`
- `event_id`
- `event_owner_lane`
- `event_type`
- `identity_basis`
- `primary_source_id`
- `secondary_source_ids`

Allowed `identity_basis` values:
- `source_native_id`
- `cap_id`
- `source_object_id`
- `composite_key`

Composite-key fallback MUST include:
- namespaced source id
- normalized event type
- normalized location key
- effective start or first observed timestamp
- source-native title or summary hash

Example JSON:

```json
{
  "schema_version": "1.0.0",
  "event_id": "03_AIR_QUALITY:NWS-01:air_quality_alert:king_county:2026-07-30T18:00:00Z",
  "event_owner_lane": "03_AIR_QUALITY",
  "event_type": "air_quality_alert",
  "identity_basis": "composite_key",
  "primary_source_id": "03_AIR_QUALITY:NWS-01",
  "secondary_source_ids": [
    "03_AIR_QUALITY:ECO-01"
  ]
}
```

## 6. Lane-Specific Payload Boundary

- Shared envelope fields MUST remain common across all seven lanes.
- Lane-specific detail fields MUST live inside:
  - `events[].details`
  - `observations[].details`
  - `route_sections[].details`
- Connectors MUST NOT invent empty cross-domain fields merely to satisfy a forced shared schema.

## 7. Source ID Namespacing, Event Identity, Deduplication, And Ownership

### 7.1 Source id namespacing

- Lane-local registries MAY keep local ids like `ECO-01`.
- Any output consumed outside the lane MUST use namespaced ids like `03_AIR_QUALITY:ECO-01`.

### 7.2 Deterministic event identity

- Native source ids MUST be preferred.
- If no stable native id exists, use documented composite-key fallback.
- HTML whole-page or text-block sources MUST hash a canonical extracted block plus namespaced source id and effective timestamp when present.

### 7.3 Event deduplication

- Workflow 08 MUST deduplicate across lanes using canonical event identity and ownership rules.
- One real-world event MUST produce one rider-facing event record.

### 7.4 Cross-lane event ownership

Canonical owners:
- air quality alert: `03_AIR_QUALITY`
- smoke forecast: `03_AIR_QUALITY`
- wildfire smoke source event: `04_WILDFIRE` for cause context, `03_AIR_QUALITY` for route air-quality consequence
- active wildfire: `04_WILDFIRE`
- burn ban: `04_WILDFIRE` unless a future owner-approved lane change says otherwise
- red flag warning: `04_WILDFIRE`
- flooding: `05_FLOOD_CONDITIONS`
- flooded trail: `05_FLOOD_CONDITIONS` for cause, `01_ROUTE_CONDITIONS` for closure fact if a closure source exists
- flood-caused closure: merged event owned by closure fact from `01_ROUTE_CONDITIONS` with flood cause from `05_FLOOD_CONDITIONS`
- culvert or drainage failure: `06_TRAIL_INFRASTRUCTURE_STATUS`
- infrastructure closure: `06_TRAIL_INFRASTRUCTURE_STATUS` when structure-specific; otherwise `01_ROUTE_CONDITIONS`
- construction closure: `01_ROUTE_CONDITIONS`, except structure-specific waterway/crossing subset in `06`
- emergency government alert: `07_GOVERNMENT_SAFETY_ALERTS`
- transit-related safety alert: `07_GOVERNMENT_SAFETY_ALERTS`
- weather alert: `02_WEATHER`
- route closure caused by another hazard lane: single merged event; closure fact from `01`, causal annotation from the hazard lane

## 8. Timestamps, Freshness, And Staleness

### 8.1 Timestamp rules

- All authoritative timestamps MUST be UTC ISO-8601 strings with `Z`.
- Connectors MAY preserve source-local timestamps in `details`, but freshness logic MUST use normalized UTC timestamps.
- Distinct timestamp roles MUST be preserved:
  - `source_response_time`
  - `source_observation_time`
  - `connector_fetch_time`
  - `connector_generation_time`
  - `connector_publication_time`
  - `last_known_good_publication_time`

### 8.2 Freshness calculation

- Connectors MUST compute freshness dynamically from timestamps.
- Connectors MUST NOT store `fresh` as static truth.
- Freshness MUST be computed against a policy table at validation and display time.

### 8.3 Default thresholds

Default policy values are configuration defaults, not final scientific truth:
- `01_ROUTE_CONDITIONS`: `OPEN`
- `02_WEATHER`: base 60 minutes for observations; 15 minutes for active alerts; forecast-specific per-source overrides
- `03_AIR_QUALITY`: base 90 minutes for current observations; 12 hours for smoke forecast; 15 minutes for formal alerts
- `04_WILDFIRE`: 15 minutes for alerts/incidents; 60 minutes for smoke polygons; 6 hours for burn bans
- `05_FLOOD_CONDITIONS`: 30 minutes for gauges; 15 minutes for flood alerts; 6 hours for forecast issue freshness
- `06_TRAIL_INFRASTRUCTURE_STATUS`: 6 hours for high-priority sources; 12 to 24 hours for slower HTML sources
- `07_GOVERNMENT_SAFETY_ALERTS`: 5 to 15 minutes for CAP-style feeds; 15 minutes for official municipal/campus feeds

Where research does not support a final threshold, the threshold MUST remain configurable and marked open.

### 8.4 Lane-specific freshness overrides

- Connectors MUST support a lane-specific freshness policy map.
- Workflow 08 MUST read the same policy map when evaluating deployment gates.

### 8.5 Missing, malformed, or future timestamps

- Missing timestamp -> freshness state `unknown`
- Malformed timestamp -> freshness state `unknown`
- Future timestamp -> freshness state `unknown`
- None of the above may be treated as fresh

### 8.6 Stale-data behavior

- Stale data MAY still be published if it is the last-known-good record, but it MUST be labeled `using_last_known_good` or `stale`.
- Workflow 08 MUST decide whether stale-but-valid data is deployable per lane.

### 8.7 Display-age guidance

- UIs SHOULD show both a machine-readable status and a human-readable elapsed age.

## 9. Last-Known-Good, No-Data, Partial Degradation

### 9.1 Last-known-good behavior

- Each lane MUST preserve a last-known-good published connector output.
- The last-known-good record MUST retain its original publication timestamp.
- When reused, the connector MUST update connector-health and handoff records to indicate LKG reuse.

### 9.2 No-data vs failed-fetch

- Zero relevant route events from a successful source query MUST become `no_relevant_events`, not `failed_fetch`.
- Source fetch failure MUST remain a failure even if it returns HTTP 200 with unusable semantics.

### 9.3 Partial-source degradation

- One failed source with at least one valid required source MAY produce `degraded`.
- Missing all mandatory sources MUST fail publication and trigger quarantine or LKG reuse instead.

## 10. Publication Lifecycle

Mandatory sequence:
- fetch
- capture raw response
- normalize
- route-filter
- deduplicate
- validate in-memory
- write candidate
- validate candidate from disk
- atomically publish
- update last-known-good
- write manifest reference if changed
- write health
- write execution evidence
- emit workflow-08 handoff

Failure rules:
- fetch failure: record source-health failure, do not publish invalid output
- normalization failure: quarantine, fail validation, preserve current published output
- route-filter failure: quarantine, preserve published output
- dedupe failure: quarantine, preserve published output
- candidate write failure: fail connector-health; do not update published or LKG
- candidate read-back validation failure: quarantine candidate, do not publish
- published write failure: preserve prior published output and prior LKG

Publication ordering:
1. candidate write
2. candidate read-back validation
3. published atomic rename
4. LKG update
5. execution evidence
6. handoff record

Manifest and data publication MUST NOT leave an inconsistent snapshot.

## 11. Retry, Timeout, And Failure Taxonomy

### 11.1 Retry and backoff

- Connectors SHOULD use bounded retry for transient HTTP failures.
- Retries MUST NOT be unbounded.

### 11.2 Timeout handling

- Source-specific timeout values SHOULD be documented in manifests.
- Timeout MUST be classified as source failure, not “no events”.

### 11.3 HTTP failure taxonomy

- `network_error`
- `timeout`
- `http_4xx`
- `http_5xx`
- `auth_blocked`
- `malformed_payload`
- `semantic_validation_failed`
- `route_relevance_unconfirmed`

## 12. Source Retention, Logging, Evidence

- Raw responses MAY be retained when licensing and storage policy allow.
- Response retention periods remain open decisions.
- Logs MUST avoid credential values.
- Execution evidence MUST include hashes for every candidate and published artifact written.

## 13. Route-Corridor Filtering

- Geometry-capable sources MUST use line-buffer or explicit route-access intersection.
- Bounding-box-only matching MUST NOT be treated as sufficient for publication.
- Text-only sources MUST use documented relevance classification and confidence levels.
- HTML diffing MUST compare canonical extracted text blocks, not raw page noise where avoidable.

## 14. Tests

Every connector MUST have:
- unit tests
- integration tests
- negative tests
- malformed-data tests
- stale-data tests
- recovery tests

Minimum required assertions:
- JSON examples parse
- schema validation catches missing required fields
- invalid timestamps fail safely
- namespaced source ids are preserved
- no relevant events is distinct from failed fetch
- invalid candidate does not overwrite published output
- LKG reuse is labeled explicitly

## 15. Workflow-08 Input Contract

Workflow 08 MUST read from handoff records plus published connector outputs for lanes 01–07.

Workflow 08 MUST:
- discover expected lane outputs
- verify schema versions
- verify required files
- verify connector manifests
- inspect connector and source health
- calculate actual age from timestamps
- identify stale or missing lanes
- enforce deployment gates
- assemble a consistent snapshot
- validate generated site data
- build the application
- deploy only after all mandatory gates pass
- retain deployment evidence
- support rollback

Blocking conditions:
- missing mandatory lane with no approved LKG fallback
- incompatible schema version
- failed connector validation
- missing manifest
- candidate/published mismatch
- unresolved credential/deploy blocker in workflow 08

Non-blocking degraded conditions:
- optional source failure inside an otherwise valid lane
- stale-but-allowed lane with explicit policy approval
- no relevant events with healthy source response

Stale-but-allowed conditions:
- lane output valid
- age exceeds default freshness but is within owner-approved deploy allowance
- workflow 08 labels it explicitly

Missing lane behavior:
- MUST block unless the lane is declared optional for that deploy mode or approved LKG exists and is within allowed age

Last-known-good assembly behavior:
- workflow 08 MAY assemble from approved LKG lane outputs
- assembled snapshot MUST label each reused lane explicitly

No-op deployment behavior:
- if assembled site data hashes match the last deployed snapshot exactly, workflow 08 SHOULD record a no-op deployment evidence entry and MUST NOT perform a blind deploy

Partial deployment prohibition:
- workflow 08 MUST NOT deploy a site snapshot built from an inconsistent lane set

Post-deployment verification:
- MUST verify expected site data files exist
- MUST verify deployment evidence and resulting hashes
- SHOULD verify a health endpoint or static fetch of published data files

## 16. Build Logs And As-Built Requirements

- Every material connector or workflow-08 action MUST append to `00_PROJECT_BUILDLOG.md`.
- As-built documentation MUST capture:
  - final workflow name and export filename
  - source list and credential names
  - runtime paths
  - validation rules
  - known limitations
  - evidence retention paths
  - rollback procedure

## 17. Unresolved Values Handled By This Standard

This standard intentionally does not invent final values for:
- final Hetzner runtime root
- final production publication path
- final freshness thresholds where research is incomplete
- retention periods
- schedule frequency
- mandatory vs optional deployment gates
- WSDOT credential use
- lane 06 user-facing label final approval
- final severity taxonomy mapping across lanes
- production n8n folder/tag names
- Cloudflare Pages project and domain
- branch/deployment strategy
- workflow-08 failure notification mechanism

Those items are tracked in `00_CONNECTORS/00_OPEN_CONNECTOR_ARCHITECTURE_DECISIONS.md`.
