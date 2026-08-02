# UW-Issaquah Connector Glossary

First version — no prior version of this specific file exists in this repository. This
glossary defines terminology only; policy and rules live in
`00_SHARED_AUTONOMOUS_CONNECTOR_BUILD_STANDARD_v2.md`, not here.

Where this project currently uses more than one term for the same concept, the preferred
term is listed first, with deprecated synonyms noted so future documents converge on one
vocabulary.

---

**Connector** — the complete workstream deliverable for one of the seven monitoring
categories (01-07): its research, its eventual n8n workflow, its schema, and its
published output, taken together. Preferred term. *Deprecated synonym: "producer"* — some
CDM documents use "producer" for this same role; this project uses "connector"
consistently and "producer" only when specifically referring to the acquisition/normalize
stages in isolation from the whole connector.

**Workstream** — one of the seven numbered monitoring categories
(`01_ROUTE_CONDITIONS` through `07_GOVERNMENT_SAFETY_ALERTS`). Used interchangeably with
"connector" in casual reference, but `workstream_id` is the formal identifier field (see
build standard §A).

**Source** — one external, real-world data origin a connector queries (e.g. a specific
USGS gauge, a specific city's alert page). Identified by a workstream-scoped
`source_id`, never globally unique on its own (see build standard §A, and Lesson L13).

**Source registry** — the `SOURCE_REGISTRY.json`/`.md` pair listing every source a
workstream evaluated, whether accepted or rejected, with the full evaluation-field set
already established across all 7 workstreams' research.

**Producer** — the acquisition + normalization portion of a connector's execution
lifecycle (build standard §C, stages Acquire/Normalize). See "Connector" above for the
preferred whole-deliverable term.

**Consumer** — anything that reads a connector's published output: Workflow 08, or
(indirectly) the eventual public website.

**Normalized record** — a single event or observation after passing through a
connector's Normalize stage, conforming to that connector's `NORMALIZED_SCHEMA.json`.

**Event** — a discrete, timestamped occurrence (an incident, a closure, an alert) in the
shared envelope's `events[]` array. Distinct from "advisory" (below) and from
"observation" (below).

**Advisory** — a warning, guidance, or non-incident notice in the shared envelope's
`advisories[]` array (e.g. a burn ban, a health guidance note) — something a rider should
know, but not necessarily a discrete incident with a location and duration.

**Observation** — a raw or lightly-processed measurement from a source (e.g. a gauge
reading, an AQI value) that feeds into `route_segment_impacts[]` or a `basis[]`
reference, but is not itself an `event` or `advisory`.

**Incident** — used informally in workstream research (e.g. wildfire "incidents") to mean
an `event` of a specific hazard type. Not a separate schema concept from `event`.

**Route impact** — the classification of whether and how a hazard affects the actual
route, distinct from mere geographic proximity. Every workstream's own
`ROUTE_RELEVANCE_AND_THRESHOLDS.md` defines this per-source; see also `route_relevance`
in the shared envelope's `events[]` items (build standard §F).

**Route segment impact** — a per-section (not per-hazard) summary entry in
`route_segment_impacts[]`, describing the current state of one named route section.

**Source provenance** — the record of which source(s) contributed to a given piece of
output and when, in the shared envelope's `source_provenance[]`.

**Basis** — the specific list of source IDs that support one segment's or event's
classification (introduced by 05_FLOOD_CONDITIONS's own research, adopted project-wide
per the Normalized Schemas synthesis and build standard §E) — makes a classification
auditable back to real evidence rather than an opaque conclusion.

**Cross-listing** — deliberately showing the same real-world event under more than one
workstream's public card, when the Hazard Ownership Matrix says it's appropriate (e.g. a
wildfire-caused air-quality alert cross-listed under both 03 and 04). Tracked via the
`cross_listed_to[]` field (introduced by 07_GOVERNMENT_SAFETY_ALERTS's own research,
adopted project-wide).

**Deduplication** — ensuring the same real-world event is not published as two separate,
unrelated-looking cards. See build standard §F for the full responsibility split between
connector-level and Workflow-08-level deduplication.

**Event clustering** — the process of grouping multiple source-native events (possibly
from different sources, possibly from different workstreams) that represent the same
real-world occurrence, prior to assigning one `canonical_event_id`.

**Canonical event** — the single, deduplicated, cross-workstream-merged representation of
a real-world occurrence, carrying `canonical_event_id`, produced only by Workflow 08 (see
build standard §F) — never by an individual connector.

**Closure of record** — the workstream whose source is treated as authoritative for
whether a route/trail segment is actually closed, as opposed to the workstream that
merely explains *why* (the causal workstream). See the Hazard Ownership Matrix and build
standard §E's `closure_of_record_workstream` field.

**Cause workstream** — the workstream whose research explains *why* a joint-owned hazard
is occurring (e.g. `04_WILDFIRE` for a fire-caused closure), distinct from the closure-
of-record workstream. See build standard §E's `cause_workstream` field.

**Freshness** — how recently a source's underlying data was actually observed, expressed
as a raw timestamp (`source_observation_timestamp`), never a pre-computed label (see
build standard §H and Lesson L08).

**Stale** — a state where a source's or connector's data has aged past its documented
freshness threshold. Computed by the consumer from a raw timestamp, never stored as a
static label by the producer (Lesson L08).

**Outdated** — used informally in some research documents as a stronger synonym for
"stale" (e.g. the freshness classification tiers Fresh/Recent/Stale/Outdated found in
CDM V2, Lesson L08). This project's shared envelope uses `stale` as the schema-level
enum value; "outdated" MAY be used as a human-facing display label for the same
underlying state at a longer age threshold, per whatever specific tier scheme a consumer
implements.

**Degraded** — a connector or source state where partial, but not zero, functionality is
available (some sources succeeded, others didn't). Distinct from `failed` (below).

**Failed** — a connector or source state where the relevant fetch, normalization, or
validation could not produce any usable result this run.

**Valid empty result** — a source or connector state where acquisition and processing
succeeded, but there is genuinely nothing to report (e.g. no active alerts). This is a
success state, not a failure or degraded state — see build standard §D.

**Last-known-good (LKG)** — the most recently successfully published, schema-valid
connector output, preserved and continued to be served whenever a new run fails to
produce a valid replacement. See build standard §J.

**Candidate output** — a connector's about-to-be-published artifact, written to a staging
path, prior to validation and atomic promotion. See build standard §D.

**Published output** — a candidate that has passed validation and been atomically
promoted to the connector's real production path.

**Quarantine** — the practice of retaining (never deleting) an invalid candidate output
or malformed record for diagnosis, rather than silently discarding it. See build standard
§D.

**Atomic publication** — the stage → validate → atomic-rename mechanism (build standard
§D) that guarantees a partially-written file is never visible at the production path.

**Readback verification** — re-reading a just-published artifact to confirm its actual
content matches what was intended to be written, as a hard gate (not best-effort) in the
execution lifecycle. See build standard §C/§K and Lessons L02/L03.

**Source health** — the per-source diagnostic record (status, timing, error info) kept
both embedded in the full envelope and as a lightweight public-safe projection. See build
standard §G.

**Connector health** — the connector-level rollup of all its sources' health, reflected
in `overall_status`/`publication_state`.

**Execution evidence** — the structured, persisted `execution_evidence.json` artifact
proving what actually happened during one connector run, as opposed to a narrative claim.
See build standard §L and Lesson L17.

**Manifest** (`CONNECTOR_MANIFEST.json`) — the machine-readable, source-controlled
description of a connector's identity, sources, cadence, and thresholds. Distinct from a
runtime manifest snapshot (build standard §M), which records what actually happened on a
given run.

**Workflow** — the n8n workflow implementing a connector's execution lifecycle. Named per
the `vNNNN.TT_ConnectorNameConnector` convention (build standard §A).

**Workflow version** — the `vNNNN` component of a workflow's name, incremented on every
semantically meaningful change, never reused (Lesson L09).

**Producer version** — the version of a connector's own code/workflow logic, tracked
separately from `schema_version` (build standard §A) — one can change independently of
the other.

**Schema version** — the version of the shared envelope schema a given published artifact
conforms to (build standard §E).

**Reference connector** — the first connector to be fully remediated through the entire
execution lifecycle and completion-state ladder (build standard §Q), serving as the
proven implementation template for the rest. As of this assessment, no connector — not
even `02_WEATHER` — has reached this state yet (see the Mise En Place Assessment and
build standard §S).

**Workflow 08** — the not-yet-designed assembly/build/deploy workflow that consumes all
seven connectors' published outputs, performs cross-workstream deduplication (build
standard §F), and produces the public-facing site build. Explicitly out of scope for
implementation in this job and the immediately following one.

**Production ready** — a connector that has passed every stage of the completion-state
ladder through `PUBLICATION_VALIDATED` (build standard §Q). Not the same as `active`
(below) — a connector can be production-ready without yet being scheduled to actually
run.

**Active** — a connector whose workflow is live, scheduled, and currently expected to run
on its own cadence. Requires explicit project-owner approval to transition into, per this
project's standing permission policy on activating schedules.
