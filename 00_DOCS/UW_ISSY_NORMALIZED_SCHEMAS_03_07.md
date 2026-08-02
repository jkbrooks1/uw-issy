# UW-Issaquah Normalized Output Schemas (Workstreams 03-07)

Consolidated from each workstream's own `NORMALIZED_SCHEMA_PROPOSAL.md`, written
independently by five parallel research workers. Full field-by-field detail and
illustrative JSON examples live in each workstream's own connector folder; this document
summarizes the common shape, calls out where the five proposals genuinely disagree, and
recommends one reconciled convention for implementation.

## Common shape every workstream converged on independently

Despite being researched in parallel with no shared schema dictated up front, all five
workstreams independently arrived at the same conceptual contract:

- A top-level `schema_version` / workstream ID / `generated_at` timestamp.
- An `overall_status` (ok/degraded/stale/error family) and a `severity` field.
- A compact `route_summary` for one-screen rider-facing display.
- `route_segment_impacts[]` for per-section detail.
- `events[]` for discrete incidents/observations and `advisories[]` for
  warnings/advisories — kept as two distinct arrays in every proposal.
- `source_provenance[]` recording which sources contributed and when.
- A clear split between public-facing fields (safe to hand directly to the site) and
  diagnostic-only fields (pipeline health, stale-data state, raw errors).
- Every proposal explicitly marked its example JSON as illustrative only, never a
  fabricated live incident — consistent with the project's core sourcing philosophy.

## CRITICAL RECONCILIATION NEEDED: naming convention is inconsistent across workstreams

Because the five workstreams researched in parallel without a shared schema contract
imposed on them, **they split on field-naming convention**:

| Workstream | Convention used | Example |
|---|---|---|
| 03_AIR_QUALITY | camelCase | `schemaVersion`, `workstreamId`, `routeSummary`, `segmentImpacts` |
| 04_WILDFIRE | snake_case | `schema_version`, `workstream_id`, `route_summary`, `route_segment_impacts` |
| 05_FLOOD_CONDITIONS | camelCase | `schemaVersion`, `workstreamId`, `routeSummary`, `routeSegmentImpacts` |
| 06_TRAIL_INFRASTRUCTURE_STATUS | snake_case | `schema_version`, `workstream_id`, `route_summary`, `route_segment_impacts` |
| 07_GOVERNMENT_SAFETY_ALERTS | snake_case | `schema_version`, `workstream_id`, `route_summary`, `route_segment_impacts` |

**This is a real gap this synthesis pass is surfacing, not a hidden problem to paper
over.** Three of five (04, 06, 07) used snake_case; two of five (03, 05) used camelCase.
**Recommendation: standardize on snake_case** for the actual implementation — it matches
the majority (3 of 5), and it is easier to keep consistent with the existing
`00_CONNECTORS/01_ROUTE_CONDITIONS` and `00_CONNECTORS/02_WEATHER` production-output
conventions established before this research cycle (both prior lanes' proposed outputs
also lean snake_case). Workstreams 03 and 05's proposals will need a field-name
translation pass — not a redesign — before implementation; their underlying field
semantics do not conflict with 04/06/07's, only the naming style does.

## Per-workstream schema summaries

### 03_AIR_QUALITY

Key fields: `overallStatus`, `severity` (EPA AQI category scale:
good/moderate/usg/unhealthy/very_unhealthy/hazardous), `routeSummary` (current AQI max,
dominant pollutant, `wildfireSmokeRelated` flag, `burnBanStatus`, `formalAlertActive`),
`segmentImpacts[]` (per-monitor AQI + pollutant breakdown), `events[]`
(smoke_forecast/air_quality_alert/burn_ban), `advisories[]`. Full spec:
`00_CONNECTORS/03_AIR_QUALITY/NORMALIZED_SCHEMA_PROPOSAL.md`.

### 04_WILDFIRE

Key fields: `severity` (none/low/moderate/high/extreme), `route_summary.primary_reason`
(fire_perimeter/smoke/fire_weather/burn_restriction/closure/evacuation/none),
`route_segment_impacts[].status` (clear/nearby_fire/smoke_affected/warning_area/
burn_restriction_context/closed/evacuation_related), `events[]` with explicit
`route_match_method` and `route_distance_miles` fields, `advisories[]` for Red Flag/Fire
Weather Watch/smoke plume/burn restriction. Notably the most geometry-explicit of the
five proposals (every event carries its route-match method and distance). Full spec:
`00_CONNECTORS/04_WILDFIRE/NORMALIZED_SCHEMA_PROPOSAL.md`.

### 05_FLOOD_CONDITIONS

Key fields: `severity` uses a flood-specific vocabulary (`elevated_water` as an example
state distinct from official NWS categories), `routeSummary.confidence`,
`routeSegmentImpacts[].basis[]` (explicitly lists which source IDs support each segment's
classification — a pattern worth reusing in other workstreams), `events[]` with
`observed`/`forecast` booleans kept as separate fields rather than a single enum (a
deliberate choice to avoid conflating current conditions with forecasts). Full spec:
`00_CONNECTORS/05_FLOOD_CONDITIONS/NORMALIZED_SCHEMA_PROPOSAL.md`.

### 06_TRAIL_INFRASTRUCTURE_STATUS

Key fields: includes a `label` field (`"WATERWAY_AND_CROSSING_STATUS"`) directly in the
schema — the only one of the five proposals to embed its own recommended display label
inside the data contract itself. `route_segment_impacts[].impact_level`
(none/possible/confirmed), `events[].route_relevance.method`
(geometry_intersection/named_trail_match/facility_match/text_location_match) with an
explicit `confidence` field, `pipeline_health` with source-count rollups. Full spec:
`00_CONNECTORS/06_TRAIL_INFRASTRUCTURE_STATUS/NORMALIZED_SCHEMA_PROPOSAL.md`.

### 07_GOVERNMENT_SAFETY_ALERTS

Key fields: `severity` uses a public-warning vocabulary
(none/info/advisory/watch/warning/emergency, distinct from the other four workstreams'
scales), `summary.alternate_transport_event_count` as a separate counter from
`active_event_count` (alternate-transport alerts are deliberately never merged into the
main hazard count), `events[].cross_listed_to[]` (an explicit field for when an event is
intentionally shown under another workstream too — directly implements the "avoid showing
the same alert in multiple dashboard cards unless cross-listing is intentional and
clearly marked" requirement), `source_provenance[].verification_state`
(VERIFIED/PARTIALLY_VERIFIED/BLOCKED, reusing the registry's own vocabulary). Full spec:
`00_CONNECTORS/07_GOVERNMENT_SAFETY_ALERTS/NORMALIZED_SCHEMA_PROPOSAL.md`.

## Recommended shared conventions for implementation

1. **Adopt snake_case project-wide** (see reconciliation above).
2. **Adopt 07's `cross_listed_to[]` field project-wide** on every workstream's `events[]`
   items — it directly operationalizes the hazard ownership matrix's dedup rules
   (`UW_ISSY_HAZARD_OWNERSHIP_MATRIX_03_07.md`) and should not be unique to one
   workstream.
3. **Adopt 05's `basis[]` / provenance-per-segment pattern** project-wide — it makes every
   segment-level classification auditable back to specific source IDs, which is valuable
   everywhere, not just for flood gauges.
4. **Severity vocabularies should stay workstream-specific** (air-quality's EPA
   categories, wildfire's none-through-extreme scale, and government-alerts'
   info-through-emergency scale are genuinely different domains) — do not force one
   universal severity enum across all five; instead define a documented mapping table
   from each workstream's native severity to one shared rendering tier (e.g. a 4-level
   dashboard color: green/yellow/orange/red) at the presentation layer, not the data
   layer.
5. **Namespace source IDs by workstream** in `source_provenance` before merging any two
   workstreams' output (see the namespace warning in
   `UW_ISSY_CONNECTOR_IMPLEMENTATION_MATRIX_03_07.md` — `KC-01` and `ISS-01` mean
   different things in different workstreams).
