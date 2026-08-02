# UW-Issaquah Shared Autonomous Connector Build Standard (v2)

**Version note:** a differently-structured v1 already exists at
`00_CONNECTORS/00_SHARED_AUTONOMOUS_CONNECTOR_BUILD_STANDARD.md` from a separate,
concurrent session. Per explicit project-owner instruction, this v2 does not replace or
delete it — both currently exist. This v2 is derived independently from
`00_CDM_CONNECTOR_LESSONS_APPLIED_v2.md`, this project's own completed 01/02 and 03-07
research, and a fresh direct audit of this repository (see
`UW_ISSY_CONNECTOR_MISE_EN_PLACE_ASSESSMENT_v2.md`), not from the v1 file's own content.

This document uses `MUST` / `MUST NOT` / `SHOULD` / `MAY` / `OPEN` / `RECOMMENDED` /
`DECIDED` consistently. Every mandatory rule states its scope, reason, validation method,
and failure consequence. Unresolved consequential decisions are NOT silently resolved
here — they are placed in `00_OPEN_CONNECTOR_ARCHITECTURE_DECISIONS_v2.md` instead.

This standard separates four concerns, per the job's own required structure:

- **A-B, M, O** — Connector producer contract (what each of the seven workstreams must
  build).
- **C-L, N** — Shared operational contract (lifecycle, publication, failure, evidence —
  applies identically to every connector).
- **R** — Workflow 08 consumer/handoff contract (what the not-yet-built assembly workflow
  may assume).
- **(none)** — Website presentation concerns are explicitly OUT OF SCOPE for this
  document; see the Open Decisions register for where that boundary is tracked.

---

## 1. Core principles

1. This standard is derived from repository evidence (CDM lessons register, this
   project's own completed research, and this project's actual current state), not
   invented in isolation. Every section below cites what it is grounded in.
2. Where evidence is incomplete, the matter is classified `OPEN` in the companion
   decisions register, not silently resolved.
3. Domain-specific severity vocabularies, thresholds, and route-relevance methods stay
   workstream-specific (per `UW_ISSY_NORMALIZED_SCHEMAS_03_07.md`'s own finding) — this
   standard defines the shared envelope and lifecycle around them, not a forced universal
   domain model.
4. This standard governs workstreams 01-07 uniformly going forward. It does not require
   retroactively rebuilding 01/02's completed research, but any NEW build work on 01 or 02
   MUST also follow this standard.

---

## A. Connector identity

**Grounding:** L09 (naming-convention drift, three divergent name lineages for one
connector), L13 (short-code collision across two meanings), and this project's own
established `0X_WORKSTREAM_NAME` folder convention (already in use for all 7 workstreams).

| Field | Definition | Rule |
|---|---|---|
| `connector_id` | Globally unique identifier for one producer | MUST equal `workstream_id` unless a workstream is later split into multiple producers (not the case today) |
| `workstream_id` | The full folder-name identifier, e.g. `05_FLOOD_CONDITIONS` | MUST use the existing folder name exactly, including the two-digit prefix |
| `connector_name` | Human-readable name, e.g. "Flood Conditions Connector" | SHOULD match the workstream's research-phase title |
| `public_display_label` | User-facing dashboard label, e.g. `WATERWAY_AND_CROSSING_STATUS` for 06 | MAY differ from `workstream_id` and `connector_name` — see `UW_ISSY_CONNECTOR_RESEARCH_03_07_EXECUTIVE_SUMMARY.md` for the 06 precedent of researching this independently |
| `internal_folder_name` | The `00_CONNECTORS/0X_*` directory name | MUST NOT be renamed once established (explicit project rule; `06_TRAIL_INFRASTRUCTURE_STATUS` is the confirmed example) |
| `workflow_name` | The n8n workflow's display name | MUST follow the existing project convention `vNNNN.TT_ConnectorNameConnector` (e.g. `v0001.05_FloodConditionsConnector`); MUST NOT contain debug suffixes (`[ringer-live-check]`) or test markers (`RINGER TEST`) in anything considered production-candidate, per L09 |
| `workflow_version` | The `vNNNN` component | MUST increment on every semantically meaningful change; MUST NOT be reused |
| `schema_version` | Envelope schema version | MUST be an explicit field in every published envelope (see §E) |
| `producer_version` | Version of the connector's own code/workflow, independent of schema_version | MUST be tracked separately from `schema_version` — a producer can change without the output schema changing, and vice versa |
| `source namespace` | See below | Decided in this section |

### Source-ID namespace format — DECIDED

**Decision:** the canonical source identifier is `<workstream_id>:<local_source_id>`,
e.g. `05_FLOOD_CONDITIONS:USGS-01`, using the full workstream folder name, not the
two-digit code alone.

**Why the full form, not the shorter `05:USGS-01`:** the two-digit code alone is
*currently* unique across the seven workstreams, but L13 (CDM's `code_zone=11` colliding
between a department and an unrelated AASQA region) demonstrates that short numeric codes
are exactly the kind of identifier that collides silently when a system's scope expands
later (e.g. if an eighth workstream or a sub-workstream split is ever introduced). The
full folder name costs a few more characters and removes this entire risk class. This
also matches the existing, already-adopted convention that every research artifact in
this project already names itself with the full `0X_WORKSTREAM_NAME` prefix (e.g.
`UW_ISSY_05_FLOOD_CONDITIONS_...`), so this decision does not introduce a new convention —
it extends the one already in use.

**A two-digit-only form (`05:USGS-01`) MAY be used as a display abbreviation in
human-facing UI where space is constrained, but MUST NOT be used as the stored or
compared identifier anywhere in code, logs, or the shared envelope.**

---

## B. Repository directory contract

**Grounding:** direct audit of this repository's current state (see the mise-en-place
assessment for full detail) — every one of the seven `00_CONNECTORS/0X_*` folders
currently contains only research-phase documentation (README, SOURCE_REGISTRY.md/.json,
RESEARCH_FINDINGS.md, API_AND_FEED_TEST_RESULTS.md, SOURCE_GAPS.md,
IMPLEMENTATION_RECOMMENDATION.md, plus the 03-07-specific ROUTE_RELEVANCE_AND_THRESHOLDS.md/
ENV_AND_READINESS.md/NORMALIZED_SCHEMA_PROPOSAL.md/OVERLAP_NOTES.md/SESSION_LOG.md, and
four polished `_v1` files). No connector directory contains a workflow export, a
machine-readable manifest, tests, or execution evidence yet, because no implementation has
begun for any of the seven workstreams.

### Mandatory paths (every connector, once implementation begins)

| Path | Purpose | Runtime output or source-controlled? |
|---|---|---|
| `README.md` | Status + pointer to the rest of the folder | Source-controlled |
| `CONNECTOR_MANIFEST.json` | Machine-readable identity/config (see §M) | Source-controlled (template) |
| `SOURCE_REGISTRY.json` | Already established by research; carries forward unchanged into build phase | Source-controlled |
| `NORMALIZED_SCHEMA.md` | As-built schema doc, promoted from the research phase's `NORMALIZED_SCHEMA_PROPOSAL.md` once implementation fixes the real shape | Source-controlled |
| `NORMALIZED_SCHEMA.json` | Machine-checkable JSON Schema for the connector's payload portion of the envelope | Source-controlled |
| `workflow/` | Exported n8n workflow JSON (once built) | Source-controlled |
| `evidence/` | Execution-evidence records (see §L) | Runtime output |
| `output/` | Local audit copy of the last published artifact (distinct from wherever the real production path lives — see §D) | Runtime output |

### Optional paths (create only when materially useful — do not create empty decorative directories, per this project's own existing convention already stated in `00_PLANNING_DOCS/UW_ISSY_02_WEATHER_CLAUDE_CODE_WORK_ORDER_v1.md`)

| Path | When to create it |
|---|---|
| `scripts/` | Only if a standalone, reusable script is written (already precedented — `05_FLOOD_CONDITIONS/scripts/` exists from the research cycle) |
| `tests/` | Once the connector has real normalization/validation logic to test |
| `fixtures/` | Once tests exist that need fixed sample payloads |
| `sample-responses/` | Already precedented (02, 03, 04 all have this from the research cycle) — keep using it for small sanitized live-response captures |
| `diagnostics/` | Only if diagnostic output volume grows large enough to warrant separating from `evidence/` — otherwise fold into `evidence/` |
| `archive/` | Only if last-known-good history needs local retention beyond what the production output path itself retains (see §D) |

**docs/**, **schemas/** as top-level connector subdirectories are NOT required in addition
to the above — `NORMALIZED_SCHEMA.md`/`.json` already cover the schema need, and the
existing flat research-file layout already serves the docs need. Do not create a nested
`docs/` folder that would just duplicate files already at the connector root.

---

## C. Execution lifecycle

**Grounding:** CDM's own proven pipeline shape (L02, L03, L17 — "Merge-then-Validate-
then-BuildPayloads-then-Write-then-Readback-then-ValidateWritten-then-Diagnostics") and
this project's existing 9-step workflow-completion rule.

**Decision:** the lifecycle is **Acquire → Normalize → Validate → Classify → Publish →
Verify → Record Evidence** (7 stages). This is CDM's proven shape relabeled to match this
project's own already-established vocabulary (e.g. "Classify" covers route-relevance and
severity assignment, both already deeply specified per-workstream in each
`ROUTE_RELEVANCE_AND_THRESHOLDS.md`).

| Stage | Purpose | Inputs | Outputs | Success criteria | Failure behavior | Logging | Evidence required | LKG publishable? |
|---|---|---|---|---|---|---|---|---|
| Acquire | Fetch raw data from each source | Source URLs/credentials from manifest | Raw per-source payloads | HTTP success + payload matches expected content type (never assume a 200 alone is proof, per this project's own existing source-testing requirement) | Isolate per-source (L19); do not fail the whole connector for one source failure | Per-source attempt logged | Raw response sample (sanitized, small) | N/A (pre-normalization) |
| Normalize | Convert raw payloads to the shared envelope shape | Raw payloads | Normalized records | Schema-conformant per `NORMALIZED_SCHEMA.json` | Quarantine the malformed record; do not silently drop it (log why) | Normalization errors logged per record | Sample of normalized output | N/A |
| Validate | Schema + semantic validation | Normalized records | Pass/fail per record | Passes `NORMALIZED_SCHEMA.json` AND semantic rules (e.g. a "confirmed_route_impact" classification actually has geometry or exact-match evidence, per each workstream's own route-relevance rules) | Reject invalid records into quarantine; connector-level validation failure preserves LKG (§J) | Validation result logged | Validation report | Yes — LKG still servable while a new candidate fails validation |
| Classify | Apply route-relevance and severity/threshold logic | Validated records | Classified records (severity, route_relevance, segment assignment) | Matches the workstream's own documented method in `ROUTE_RELEVANCE_AND_THRESHOLDS.md` | Fall back to `possible_route_impact`/lower-confidence tier rather than guessing high-confidence, per each workstream's own conservative-default precedent | Classification decisions logged with method used | Classification rationale | Yes |
| Publish | Atomic staging → validate → promote (see §D) | Classified records + envelope | Production output file(s) | Real production path content/timestamp changed (per L04 — never trust "workflow ran" alone) | On promotion failure, preserve LKG, quarantine the candidate, mark degraded | Publication attempt logged with before/after path state | Staging file + promotion result | Yes (this is the LKG-serving stage itself) |
| Verify | Read back the actual published artifact | Published path | Confirmed match to what was intended to publish | Readback content matches what was written (per L02/L03 — use mode-independent binary helpers, never assume upstream fields survive a read) | If readback fails, treat as a publish failure, not a soft warning | Readback result logged | Readback proof | N/A (verifying the prior stage) |
| Record Evidence | Persist execution evidence | All of the above | `evidence/` artifact (see §L) | Evidence artifact exists and is schema-valid | A missing evidence artifact means the run is NOT complete, regardless of whether publish succeeded | N/A (this IS the log) | The evidence artifact itself | N/A |

---

## D. Publication lifecycle

**Grounding:** L04 (staging-only publish masquerading as success), L06/L07 (last-known-good
misrepresentation), CDM's staging→validate→atomic-rename pattern (already directly
precedented in CDM's own `03_AIR_QUALITY_CONNECTOR_RUN_2_ADDENDUM.md`).

**MUST:** every publish operation follows: write to a `.staging.json` candidate path →
validate the candidate (schema + semantic) → atomically rename/move the validated
candidate into the real production path. Partial writes MUST NOT be visible at the
production path at any point (atomic rename, not in-place overwrite).

**MUST:** on any validation failure post-staging, the candidate is quarantined (kept, not
deleted, for diagnosis) and the production path is left untouched, preserving whatever LKG
was already there.

**MUST NOT:** invalid current data may never replace last-known-good, under any
circumstance, including "the workflow reported success."

**MUST:** a connector MAY publish a valid empty result (see below) — this is different
from a failure and must be represented differently.

**Distinguishing the eight cases required by the job brief:**

| Case | How it's represented |
|---|---|
| Valid empty result | `overall_status: "ok"`, `events: []`, `advisories: []` — the source was queried successfully and genuinely returned nothing relevant. This is a normal, expected state, not degraded. |
| Source returned no events | Same as valid empty result at the per-source level; the connector-level `overall_status` stays `ok` if this is the only source and it behaved correctly. |
| Source unavailable | That source's entry in `source_health[]` shows `status: "unreachable"`; connector-level status becomes `degraded` if that source is required, stays `ok` if optional and other required sources succeeded. |
| Normalization failure | Record quarantined, error logged; connector-level status `degraded` if it affects a required source's data. |
| Validation failure | Candidate quarantined pre-promotion; production path retains LKG; `overall_status` reflects `stale` relative to the LKG's age, not `failed` (the site still has something valid to show). |
| Stale output | `overall_status: "stale"` (or a dedicated field — see L07), computed from raw timestamp age at consumption time (L08), never a static label. |
| Partially degraded output | `overall_status: "degraded"`, with per-source health showing which source(s) failed; still publish what succeeded. |
| Complete connector failure | Production path retains LKG (does not get overwritten); `source_health[]` shows all sources failed; a manual-review flag SHOULD be raised. |

**OPEN (see Decisions register):** whether JSON is written locally, on a future Hetzner
host, or to object storage — this project has no provisioned production host yet, unlike
CDM. Whether history retention count is N=5, N=10, or unlimited-with-periodic-pruning.
Whether source-level and connector-level LKG are stored as separate files or one combined
structure.

**Timestamps required, each distinct (do not conflate):** `source_observation_timestamp`
(when the source itself says its data is from), `workflow_execution_timestamp` (when this
connector run happened), `publication_timestamp` (when the atomic promotion completed).

**Checksum:** every published artifact SHOULD include a SHA-256 hash of its own content in
`execution_evidence` (matching this project's own existing Downloads-copy verification
practice already used throughout the 01/02/03-07 research cycle).

---

## E. Common connector envelope

**Grounding:** the converged common shape independently found across all five 03-07
schema proposals (see `UW_ISSY_NORMALIZED_SCHEMAS_03_07.md`), plus L11 (casing drift) and
L07/L08 (freshness/staleness field requirements).

**DECIDED: snake_case for all field names**, resolving the split found in
`UW_ISSY_NORMALIZED_SCHEMAS_03_07.md` (03/05 proposed camelCase, 04/06/07 proposed
snake_case). Reasoning: 3 of 5 research proposals already used it; it matches this
project's existing file-naming conventions (`source_id`, `route_segment_impacts` already
appear in the majority of the research-phase JSON); and per L11, CDM's own experience
shows that NOT deciding this before implementation starts creates a permanent dual-accept
shim later. **Note this DECIDED item is intentionally not identical to L11's CDM
precedent (CDM went the opposite way, to camelCase, for its own reasons)** — the two
projects are allowed to differ; this decision is made on UW-Issy's own evidence, not by
copying CDM's choice.

### Envelope structure

```json
{
  "schema_version": "1.0.0",
  "connector_id": "05_FLOOD_CONDITIONS",
  "workstream_id": "05_FLOOD_CONDITIONS",
  "connector_name": "Flood Conditions Connector",
  "public_display_label": "FLOOD_CONDITIONS",
  "producer_version": "1.0.0",
  "workflow_execution_id": "string",
  "generated_at": "2026-07-29T22:00:00Z",
  "publication_state": "published | stale_serving | quarantined | failed",
  "overall_status": "ok | degraded | stale | failed",
  "severity": "workstream-specific vocabulary — see NORMALIZED_SCHEMAS_03_07.md per workstream",
  "freshness": {
    "source_observation_timestamp": "2026-07-29T21:45:00Z",
    "workflow_execution_timestamp": "2026-07-29T22:00:00Z",
    "publication_timestamp": "2026-07-29T22:00:05Z"
  },
  "route_summary": {},
  "route_segment_impacts": [],
  "events": [
    {
      "event_id": "string",
      "source_event_id": "string or null",
      "canonical_event_id": "string, used for cross-source/cross-workstream clustering",
      "event_fingerprint": "content hash, used only when no stable source-native id exists",
      "cause_workstream": "workstream_id that determined the causal classification, if a joint-owned hazard",
      "closure_of_record_workstream": "workstream_id that owns the closure/incident fact, if a joint-owned hazard",
      "cross_listed_to": [],
      "basis": ["source ids that support this event's classification"]
    }
  ],
  "advisories": [],
  "source_provenance": [],
  "source_health": [],
  "diagnostics": {},
  "execution_evidence": {}
}
```

**Public vs. diagnostic fields:** `schema_version` through `advisories` are public-facing.
`source_provenance`, `source_health` (full form), `diagnostics`, `execution_evidence` are
diagnostic-only — a consumer MAY choose to omit them from the default public render, but
they MUST still be present in the stored/published artifact for audit purposes.

**Null/empty-array rules:** an array field with no data is `[]`, never `null`. A missing
optional object is `null`, never an empty object standing in for "no data." **Reason:**
this removes ambiguity between "no records" and "field not populated," which several CDM
incidents (L07) show matters in practice.

**Timestamp format:** UTC ISO 8601 with explicit `Z` suffix, no other format, in every
machine-facing field. Human-facing schedule descriptions (in manifests, docs) MAY use
America/Los_Angeles for readability, but stored timestamps MUST be UTC.

**Forward-compatibility rule:** consumers MUST ignore unknown fields rather than fail on
them, so `schema_version` can be incremented additively without breaking Workflow 08.

---

## F. Event identity and deduplication contract

**Grounding:** L13 (namespace collision), L15 (server-side merging precedent), the
already-completed Hazard Ownership Matrix's joint-owned hazard findings, and 06's own
research-phase recommendation ("`event_id` should be a stable hash of
`source_id + extracted_text_block`" — already independently arrived at during research,
now generalized here).

**Definitions:**
- **Source-native event**: whatever identity (or lack of one) the source itself provides.
- **Normalized event**: one connector's own record after Normalize, carrying `event_id`
  (this connector's stable identifier) and `source_event_id` (if the source has one, else
  null).
- **Cross-source event cluster**: multiple normalized events from different sources
  *within the same connector* believed to represent the same real-world event.
- **Assembled rider-facing event**: the final, cross-*workstream* merged event a rider
  actually sees, carrying `canonical_event_id`.

**Deterministic fallback identity:** when no stable source-native ID exists (the common
case for HTML-only sources per L10/06's own research finding that none of its MVP HTML
sources have a stable per-alert ID), `event_id` MUST be a stable hash of
`source_id + a normalized text/content block`, so the same real content always produces
the same ID across runs, enabling whole-page/block diffing against last-known-good rather
than per-item change detection.

**Deduplication responsibility split (resolves the job's explicit "avoid circular
dependencies" question):**

| Merge level | Who performs it | Why |
|---|---|---|
| Inside one source | The connector's own Normalize stage | Trivial, source-local |
| Inside one connector, across its own multiple sources | The connector's own Classify/Publish stage | Still fully within one connector's own visibility |
| Across workstreams (the joint-owned hazards in the Hazard Ownership Matrix) | **Workflow 08**, never an individual connector | Any individual connector merging across workstreams would require it to read every OTHER connector's output, creating a circular dependency (05 would need 01's output, 01 would need 05's, etc.) if both sides tried to own the merge. Only Workflow 08 has visibility into all seven connectors simultaneously without this problem. |

This directly operationalizes `UW_ISSY_HAZARD_OWNERSHIP_MATRIX_03_07.md`'s escalation
rule: each connector publishes its own honest `cause_workstream` /
`closure_of_record_workstream` / `cross_listed_to` fields; Workflow 08 is the only place
where the actual one-event-not-two merge happens.

---

## G. Source health contract

**Grounding:** the source-evaluation fields already established across all 7 workstreams'
`SOURCE_REGISTRY.json` files, plus L08 (consumer must compute freshness itself).

**Fields (per source, per connector run):** `source_id` (namespaced per §A),
`source_name`, `source_type` (= `acquisition_classification`, reusing the existing
vocabulary: `DIRECT_API`/`DOCUMENTED_FEED`/`OPEN_DATA_DOWNLOAD`/`STRUCTURED_WEBPAGE`/
`UNSTRUCTURED_WEBPAGE`/`PDF_OR_DOCUMENT_NOTICE`/`EMAIL_OR_SMS_ALERT_ONLY`/
`MANUAL_REVIEW_ONLY`/`UNUSABLE`), `attempted_at`, `response_received_at`, `http_status`,
`fetch_status`, `parse_status`, `validation_status`, `record_count`,
`relevant_record_count`, `latency_ms`, `freshness_state` (raw timestamp, NOT a computed
label — see L08), `last_success_at`, `consecutive_failures`, `last_error_code`,
`last_error_summary` (redacted, never a raw stack trace containing paths/secrets),
`manual_review_required`.

**Public-safe subset:** `source_id`, `source_name`, `freshness_state` (raw timestamp only
— consumer computes the label), `manual_review_required`. Everything else
(`http_status`, `latency_ms`, `last_error_summary`, etc.) is diagnostic-only.

**Embedded vs. separate file: DECIDED — both, without duplication.** The full
`source_health[]` array is embedded in the main envelope (diagnostic section). A
lightweight `source_health.json` projection (public-safe subset only, per source) is
ALSO emitted, generated directly from the same data, so Workflow 08 can poll health
cheaply without downloading the full payload. The projection MUST be generated from the
envelope's own data at publish time, never maintained as separately-entered data (avoids
the two ever disagreeing).

---

## H. Freshness and staleness contract

**Grounding:** L08 (compute at consumption time, not producer-supplied labels); each
workstream's own already-documented per-source freshness thresholds (e.g. 15 min for
USGS/NWS flood alerts, 60 min for Ecology AQ, 24 hr for NOAA HMS smoke).

**MUST:** every freshness-related field stores a raw timestamp. `fresh`/`stale`/`unknown`
style labels are computed by the consumer (Workflow 08, or the eventual website), never
stored as a static enum by the producer.

**MUST NOT** assume one threshold fits every source — each source's own threshold (already
documented per-workstream in each `IMPLEMENTATION_RECOMMENDATION.md`'s acquisition-cadence
table) is the source of truth; the shared envelope carries the raw timestamps needed to
apply those per-source thresholds downstream.

**Mixed freshness within one connector:** the connector's own `overall_status` MUST
reflect its worst-case component (if any required source is stale, the connector-level
status is `stale` or `degraded`, never `ok`), AND the per-source breakdown MUST remain
available in `source_health[]` so a consumer can distinguish "everything is a little old"
from "one critical source is very stale."

---

## I. Failure and degraded-state contract

**Grounding:** L01 (WFIGS `429`), L04/L05/L06/L07 (publish/staleness failure modes), L19
(isolation-level distinction).

| Scenario | Required behavior |
|---|---|
| One source fails | Isolate; do not fail the whole connector; mark that source `degraded`/`unreachable` in `source_health[]`; publish with what succeeded if the failed source is optional |
| One source returns malformed data | Quarantine that record; do not propagate garbage into the published envelope |
| One source rate-limits | Back off with exponential delay and a cap; MUST NOT burst-retry (L01's ArcGIS `429` is a live, reproduced risk, not hypothetical) |
| All sources fail | Preserve LKG; mark connector `failed`; raise manual review |
| Schema validation fails | Quarantine candidate; preserve LKG; do not promote |
| Publication fails | Preserve LKG; retry the publish step itself (bounded), not the whole Acquire pipeline |
| Readback fails | Treat identically to a publication failure (per L02/L03 — readback is a hard gate, not best-effort) |
| A scraper's page structure changes | Detect via a parse-failure or unexpected-shape check; quarantine and flag `manual_review_required`; do not silently publish a mis-parsed record |
| Credentials missing for an optional source | Skip that source gracefully; connector stays `ok` if MVP sources succeed (per `UW_ISSY_CONNECTOR_ENV_REQUIREMENTS_03_07.md`, no MVP source requires a credential) |
| Credentials missing for a required source | Connector `failed`; this should not occur in the initial 03-07 build since no workstream's MVP set requires a credential |
| Production host cannot establish TLS | Connector `failed` for that source, with the specific TLS error captured in `last_error_summary` — do not silently fall back to an insecure request; escalate for the kind of host-vs-local discrepancy already found once in this project (03_AIR_QUALITY's Ecology TLS finding) and repeatedly in CDM (L14) |
| Source result is unexpectedly empty | Valid empty result (see §D) UNLESS the source's own established baseline (e.g. "this source always has some content") makes empty suspicious — that judgment is workstream-specific and documented in each connector's own `SOURCE_GAPS.md` |

**MUST NOT:** unbounded retry loops. Every retry is bounded (a fixed maximum attempt
count) with exponential backoff, then defers to the next scheduled run rather than
retrying indefinitely within one execution.

---

## J. Last-known-good contract

**Grounding:** L06 (must be proven with a controlled failure test, not assumed), L07
(the LKG flag must reflect reality).

**Definition:** the most recent successfully-published, schema-valid artifact at a
connector's production path, prior to the current run.

**Storage:** at the production output path itself — the LKG IS whatever is currently
there until a new validated candidate is promoted over it (per the atomic-rename model in
§D). A separate historical archive (§D, OPEN on retention count) additionally preserves
prior versions.

**Age reporting:** via the raw `source_observation_timestamp` / `publication_timestamp`
fields (§E) — never a static "last known good" boolean alone; always paired with when it
was actually published.

**When servable:** any time a new run fails validation or fails to acquire required
sources — the production path is simply left untouched, which means it continues serving
by default (no special "serve LKG" code path is needed; the risk is the opposite —
accidentally overwriting it, per §D's atomic-rename requirement).

**When it must no longer be served:** MUST NOT be served indefinitely without disclosure —
`publication_state: "stale_serving"` MUST be set once the LKG's age exceeds the
connector's documented staleness threshold, so a consumer can visually distinguish "old
but disclosed" from "current."

**Source-level vs. connector-level LKG:** DECIDED — both exist and are distinct. A single
source can be stale/failed while the connector as a whole still publishes (using that
source's own LKG contribution) — this is the `source_health[]`-level concept. The
connector-level LKG (the whole published artifact) is a separate, coarser concept used
when the ENTIRE publish pipeline fails, not just one source.

**Required proof before claiming this contract works for any connector:** a real
controlled-failure test — a deliberately broken fetch pointed at an isolated throwaway
output path, with a before/after hash comparison proving a failed run did not clobber the
real production data — per L06. An architectural description of the retention logic is
NOT sufficient evidence that it works.

---

## K. Validation contract

**Grounding:** L04, L17 (three separately-tracked gates), this project's own existing
rule ("Workflow JSON export is not execution proof").

| Layer | Automatable? | Evidence retained |
|---|---|---|
| Workflow JSON static validation | Fully | Static validation report |
| Schema validation | Fully | Schema validation result per run |
| Semantic validation | Partially (geometry/threshold tests automatable; new-source-type judgment calls are not) | Semantic validation result per run |
| Route-relevance validation | Partially (per-workstream method already documented; automatable once implemented, but initial method selection is a human judgment call) | Route-relevance test results |
| Publication validation | Fully | Before/after path state, checksum |
| Readback validation | Fully | Readback proof |
| Diagnostic validation | Fully | Diagnostics report |
| Live execution validation | Semi-automatable (the temp-webhook execution-proof pattern from CDM, L17, can be scripted, but requires a live n8n instance) | Execution proof artifact (matching CDM's `*_CONNECTOR_LIVE_EXECUTION_PROOF.json` precedent) |

**Prohibited completion claims:** a connector MUST NOT be declared complete, production-
ready, or PASS on the strength of static validation or workflow-JSON export alone (this
project's existing rule, reaffirmed here with the specific CDM evidence — L04 — showing
exactly how that claim can be wrong even when every earlier gate passed).

---

## L. Execution evidence contract

**Grounding:** L17 (three-gate discipline), CDM's `*_CONNECTOR_LIVE_EXECUTION_PROOF.json`
precedent (a structured, persisted artifact rather than a narrative claim).

**`execution_evidence.json` (per run, stored in the connector's `evidence/` directory)
MUST capture:** workflow ID, workflow version, execution ID, execution start/end
timestamps, execution status, host/environment identifier, sources attempted, sources
successful, output path, output checksum (SHA-256), schema validation result, readback
result, diagnostics result, a `run_classification` field (`test_fixture` vs. `live_run` —
so test executions are never confused with production evidence), and redacted error
summaries (never a raw stack trace that might contain a credential value or local path
with a username).

**MUST NOT** ever capture a secret value, even redacted-in-place (omit the field entirely
rather than partially masking it — partial masking has caused accidental exposure in CDM,
L18).

**Retention/naming:** one evidence file per execution, named by `execution_id` and
`workflow_execution_timestamp`; retention count is OPEN (see Decisions register) pending
the same infra decision as historical output archiving.

---

## M. Connector manifest

**Grounding:** the job's own required field list; this project's existing
`SOURCE_REGISTRY.json` convention as the closest existing precedent for a structured,
machine-readable per-connector artifact.

**DECIDED: both a source-controlled manifest and a runtime manifest snapshot exist, as
separate artifacts.**

- **`CONNECTOR_MANIFEST.json` (source-controlled, in the connector's repo folder):**
  connector identity (§A fields), workflow name/ID placeholder, schema_version, output
  path (once decided — see Open Decisions), health path, evidence path, cadence,
  freshness thresholds (per source), required sources list, optional sources list,
  required credential variable names only (never values), route dependency (which GPX-
  derived data it consumes), active/disabled state, owner, last-validated date.
- **Runtime manifest snapshot:** generated at each execution, capturing the ACTUAL values
  observed that run (e.g. which sources were actually reachable this run) — this is a
  runtime output, written to `evidence/`, not maintained by hand.

The two are never conflated: the source-controlled manifest is what the connector is
*supposed* to do; the runtime snapshot is what it *actually did* on a given run.

---

## N. Scheduling and concurrency

**Grounding:** L01 (ArcGIS `429`), each workstream's own already-documented acquisition
cadence.

**Cadence ownership:** each connector's own manifest owns its cadence — no shared global
schedule.

**Timezone:** human-facing schedule descriptions use America/Los_Angeles (matching this
project's own timestamp conventions seen throughout its build log); all STORED timestamps
are UTC ISO 8601 (§E) regardless of the schedule's human-facing timezone.

**Overlap prevention:** MUST prevent two overlapping executions of the SAME connector (a
concurrency guard per connector, matching V2's own proven "concurrency group so
overlapping runs cancel rather than race" pattern from L20's evidence file).

**Maximum concurrent executions across all connectors:** OPEN — depends on the eventual
n8n host's actual capacity, which is not yet provisioned for this project (unlike CDM,
which runs on a known, capacity-documented Hetzner host). See Open Decisions register.

**Per-source serialization:** MUST for any connector querying multiple endpoints on the
same ArcGIS-hosted service (04, 05, 06 all use ArcGIS REST heavily) — serialize, reuse
IDs, do not burst-query, per L01's directly-reproduced `429`.

**Rate-limit backoff:** exponential, with a hard cap on total wait time per run, then defer
to the next scheduled run (§I).

---

## O. Credentials and secrets

**Grounding:** this project's own existing, strict no-secret-value rule; L18 (self-
disclose if exposed); `UW_ISSY_CONNECTOR_ENV_REQUIREMENTS_03_07.md`'s already-completed
credential inventory for 03-07.

**MUST:** documentation references environment-variable names only, never values.
**MUST:** credential references live in n8n's own credential store, not hardcoded in
workflow JSON.
**MUST:** startup/preflight behavior checks for required credentials before attempting a
source that needs one; missing-optional-credential = skip gracefully (§I); missing-
required-credential = fail closed, not silently degrade.
**MUST:** if a credential value is ever accidentally displayed (in a log, a session
transcript, a debug echo), self-disclose it immediately with a rotation recommendation —
never silently correct and move on (L18).
**MUST NOT:** test, print, copy, or rotate any credential value as part of this
architecture job itself (explicit boundary for this job — see project instructions).

---

## P. Build logging

**Grounding:** this project's own existing, already-followed convention (every
`SESSION_LOG.md` and every `00_PROJECT_BUILDLOG.md` entry this cycle already follows this
shape).

**MUST:** append an entry to `00_PROJECT_BUILDLOG.md` for every meaningful connector
build/change, containing: timestamp, objective, files created/changed, validation
commands run and their results, whether a commit was made, and one of `PASS`,
`PASS WITH BLOCKERS`, or `FAIL`.
**MUST NOT:** rewrite, prune, reorder, or summarize existing build-log history — append
only (already an explicit project rule, reaffirmed here).
**`PASS WITH BLOCKERS` is preferred over concealing uncertainty** — matches this project's
own established practice throughout the 03-07 research cycle's audit reports.

---

## Q. Completion definition

**Grounding:** L17 (three-gate discipline), this project's existing 9-step
workflow-completion rule, L04 (why "active + succeeding" is not enough).

**DECIDED: adopt maturity states matching the job's own suggested list, since repository
evidence directly supports this granularity (CDM's own build logs already separately
track static/import/execution as distinct gates — L17):**

`RESEARCH_COMPLETE` → `ARCHITECTURE_READY` → `BUILD_COMPLETE` → `STATICALLY_VALIDATED` →
`IMPORTED` → `LIVE_VALIDATED` → `PUBLICATION_VALIDATED` → `PRODUCTION_READY` → `ACTIVE`,
with `DEGRADED` and `DISABLED` as states reachable from `ACTIVE`.

Each transition requires the evidence defined in §K/§L for that stage — a connector
cannot skip from `BUILD_COMPLETE` to `PRODUCTION_READY` without passing through
`STATICALLY_VALIDATED` → `IMPORTED` → `LIVE_VALIDATED` → `PUBLICATION_VALIDATED`
individually, each with its own retained evidence.

**Local commit vs. production activation: DECIDED as separate milestones.** A local git
commit reflects a documentation/code milestone; workflow activation (making it live on a
schedule) is a separate, operational milestone requiring explicit project-owner approval,
matching this project's existing permission-policy stance on not activating schedules
without approval.

---

## R. Workflow 08 handoff contract

**Grounding:** L15 (server-side merging precedent), L19 (isolation-level distinction), L20
(git-triggered deploy proven for a UI shell but connector-data wiring left open), F above
(dedup responsibility split).

**What Workflow 08 may assume from each connector:** a `CONNECTOR_MANIFEST.json` at a
discoverable, consistent path; an envelope conforming to §E; `source_health[]` reflecting
real per-source state; raw timestamps it can apply its own freshness judgment to (§H); and
that NO cross-workstream merging has already been silently done by the connector itself
(§F) — Workflow 08 owns that step exclusively.

**Input discovery:** RECOMMENDED — registry-driven discovery (Workflow 08 reads a list of
known connector manifest paths, not hardcoded per-connector logic), so adding an eighth
workstream later doesn't require editing Workflow 08's own code.

**Schema compatibility / freshness / source-health checks:** Workflow 08 MUST validate
each connector's envelope against `NORMALIZED_SCHEMA.json` before consuming it, and MUST
apply its own freshness classification from raw timestamps (§H), never trust an
upstream-supplied label.

**Blocking vs. non-blocking connector failure:** RECOMMENDED that each connector's manifest
carry a `critical: true|false` flag, defaulting to a conservative per-connector value the
project owner sets explicitly (matching L19's finding that this is an owner-approval
decision, not an automatic default). This specific flag design and its default values are
OPEN — see Decisions register.

**Site build/deployment mechanics:** explicitly OUT OF SCOPE for producer connectors —
per the job's own boundary, deployment mechanics belong in Workflow 08 only, never in an
individual connector. CDM's own proven git-push-triggered pattern (L20) is a reasonable
precedent to study when that job is reached, but is NOT decided here for UW-Issy, since
this project has no provisioned hosting/deploy target yet (OPEN — see Decisions register).

---

## S. Reference connector requirement

**Grounding:** direct audit of this repository (see
`UW_ISSY_CONNECTOR_MISE_EN_PLACE_ASSESSMENT_v2.md` for full detail).

**Finding: `02_WEATHER` is `NOT_REFERENCE_READY`.**

02_WEATHER has excellent, PASS-grade research documentation (9 required research files +
4 polished deliverables, all validated in its own prior audit cycle) — but a direct
inspection of this repository's `app/`, `scripts/`, `tests/`, and `workflow`-equivalent
paths found **zero actual implementation artifacts for any of the seven workstreams,
including 02_WEATHER**: no n8n workflow JSON exists anywhere in this repository, no
`package.json` exists at the root, and `scripts/`, `tests/`, and `app/` are all
structurally-scaffolded but completely empty. Research completeness is not the same
thing as build completeness (see the Connector Glossary's explicit distinction), and no
workstream has crossed that line yet.

**Required remediation before 02_WEATHER (or any workstream) can serve as the reference
template:** build a real, minimal n8n workflow implementing 02's own already-researched
6-source MVP set (all NWS endpoints), producing an actual `workflow/` export,
`CONNECTOR_MANIFEST.json`, `NORMALIZED_SCHEMA.json`, at least one `execution_evidence.json`
from a genuine live execution (per §L), and passing readback verification (per §D) —
i.e., actually walking it through the §C lifecycle and §Q maturity states for the first
time, for any connector. Until that happens, there is no proven implementation pattern in
this repository to copy, only research.
