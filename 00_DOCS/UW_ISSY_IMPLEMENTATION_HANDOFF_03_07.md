# IMPLEMENTATION HANDOFF PROMPT: UW-Issaquah Connectors 03-07 Production Build

**Revision note:** this handoff has been revised to sit downstream of the shared
autonomous connector architecture standard (produced after the original version of this
document). It no longer jumps directly from research to five production connector
builds — it now requires the architecture standard to be read and its blocking decisions
closed first, and requires the reference connector to be remediated before any of 03-07
is built for real. All of the original per-workstream, source-specific build detail is
preserved unchanged below; only the surrounding phase structure changed.

Copy this entire document as the prompt for the next coding agent. It is self-contained —
all research is already complete; do not ask the project owner to re-research or manually
fill in anything below. If a genuine gap is found during implementation that this
document doesn't cover, treat it the same way the research cycle did: document it
honestly rather than inventing a source or a result.

---

## PHASE 0 — READ THE ARCHITECTURE STANDARD AND CLOSE BLOCKING DECISIONS FIRST

Before touching any connector, read, in order:

1. `00_DOCS/00_SHARED_AUTONOMOUS_CONNECTOR_BUILD_STANDARD_v2.md` — the mandatory shared
   contract every connector below must follow (identity, directory structure, execution
   lifecycle, publication, envelope, event dedup, health, freshness, failure handling,
   last-known-good, validation, execution evidence, manifest, scheduling, credentials,
   build logging, completion definition, Workflow 08 handoff, reference-connector
   requirement).
2. `00_DOCS/00_CDM_CONNECTOR_LESSONS_APPLIED_v2.md` — the evidence base the standard is
   built on; every `MUST` in the standard traces to a specific lesson here.
3. `00_DOCS/00_OPEN_CONNECTOR_ARCHITECTURE_DECISIONS_v2.md` — decisions still open.
   **Decision D12 (which architecture-document set is authoritative — this v2 set, or the
   differently-structured, differently-located v1 set at `00_CONNECTORS/`) is the single
   highest-priority item and MUST be resolved by the project owner before you proceed past
   this phase.** Do not silently pick one yourself.
4. `00_DOCS/UW_ISSY_CONNECTOR_MISE_EN_PLACE_ASSESSMENT_v2.md` — confirms this repository's
   actual current state: 100% research-complete, 0% build-phase, across all seven
   workstreams, including `02_WEATHER`.
5. `00_DOCS/00_CONNECTOR_GLOSSARY.md` — shared vocabulary; use these terms consistently
   in whatever you build and document.

**Do not proceed past Phase 0 until:**
- Decision D12 is resolved by the project owner.
- Decision D01 (output storage location) is at least provisionally resolved — you cannot
  reach the `PUBLICATION_VALIDATED` maturity state (build standard §Q) without knowing
  where output actually gets published, though you MAY complete earlier maturity states
  (`BUILD_COMPLETE`, `STATICALLY_VALIDATED`, `IMPORTED`, `LIVE_VALIDATED`) without it.
- Every other decision marked `BLOCKED` or `OPEN` in the decisions register that your
  specific build work touches has been addressed or explicitly deferred by the project
  owner.

## PHASE 1 — REMEDIATE THE REFERENCE CONNECTOR (02_WEATHER) FIRST

Per build standard §S and the Mise En Place Assessment: **no connector in this project,
including `02_WEATHER`, has ever been built, imported, or executed** — only researched.
`02_WEATHER` is the selected reference-connector candidate (cleanest research, most
heavily-tested MVP set, zero credential dependencies) but is currently
`NOT_REFERENCE_READY`.

**Before building any of 03-07, remediate `02_WEATHER`:** build one real, minimal n8n
workflow implementing its 6-source NWS-endpoint MVP set, and walk it through the full
execution lifecycle (build standard §C) and completion-state ladder (build standard §Q)
for the first time in this project — static validation → import → live execution →
write/readback → the first real `CONNECTOR_MANIFEST.json`, `NORMALIZED_SCHEMA.json`, and
`execution_evidence.json` this project has ever produced. Only once `02_WEATHER` reaches
`PUBLICATION_VALIDATED` (or as far as Decision D01 allows) does it become the actual
implementation template — copy its proven pattern for 03-07, not its research
documentation alone.

**This phase is separate from, and must complete before, Phase 2.**

## PHASE 2 — BUILD 03-07 AGAINST THE REMEDIATED REFERENCE PATTERN

Using the already-completed research in `00_CONNECTORS/0X_*/` and the cross-cutting
synthesis in `00_DOCS/UW_ISSY_*_03_07.*` as your source of truth. Do not re-research
sources already classified MVP/SECONDARY/REJECT/UNRESOLVED below — implement against them
directly.

### PROJECT LOCATIONS

- Project root: `/Users/jkbrookspersonal/LocalSiteBuildFiles/BTF_UW-Issy_Route_Monitor`
- Canonical GPX (read-only): `data/route/UnivWA-Issaquah.gpx`
- Per-workstream research (read, do not re-derive): `00_CONNECTORS/03_AIR_QUALITY/`,
  `00_CONNECTORS/04_WILDFIRE/`, `00_CONNECTORS/05_FLOOD_CONDITIONS/`,
  `00_CONNECTORS/06_TRAIL_INFRASTRUCTURE_STATUS/`,
  `00_CONNECTORS/07_GOVERNMENT_SAFETY_ALERTS/`
- Cross-cutting synthesis (read first, this is your build plan):
  `00_DOCS/UW_ISSY_CONNECTOR_RESEARCH_03_07_EXECUTIVE_SUMMARY.md`,
  `00_DOCS/UW_ISSY_CONNECTOR_RESEARCH_03_07_FULL_REPORT.md`,
  `00_DOCS/UW_ISSY_CONNECTOR_REGISTRY_03_07.json`,
  `00_DOCS/UW_ISSY_CONNECTOR_IMPLEMENTATION_MATRIX_03_07.md`,
  `00_DOCS/UW_ISSY_HAZARD_OWNERSHIP_MATRIX_03_07.md`,
  `00_DOCS/UW_ISSY_CONNECTOR_ENV_REQUIREMENTS_03_07.md`,
  `00_DOCS/UW_ISSY_CONNECTOR_SOURCE_TEST_LOG_03_07.md`,
  `00_DOCS/UW_ISSY_NORMALIZED_SCHEMAS_03_07.md`
- Architecture standard (governs HOW you build, per Phase 0):
  `00_DOCS/00_SHARED_AUTONOMOUS_CONNECTOR_BUILD_STANDARD_v2.md`
- Read and follow: `CLAUDE.md`, `AGENTS.md`, `00_PROJECT_RULES.md`,
  `00_PROJECT_STATUS.md`
- Reference implementation (once remediated per Phase 1): `00_CONNECTORS/02_WEATHER/`
- Build log (append only, never rewrite): `00_PROJECT_BUILDLOG.md`

### CROSS-CUTTING REQUIREMENTS (now governed by the architecture standard, summarized here for convenience)

These were found during research synthesis and are now formal requirements of the build
standard (§A, §E, §F) — not optional cleanup:

1. **Namespace every source ID by `<workstream_id>:<local_source_id>`** (e.g.
   `05_FLOOD_CONDITIONS:USGS-01`, per build standard §A's DECIDED format — note this is
   the full workstream folder name, not merely the two-digit code, per the reasoning in
   §A). The research registries reuse short IDs like `KC-01` and `ISS-01` across
   different workstreams for different real sources — merging them without this
   namespace will silently corrupt any shared dashboard, health page, or dedup logic.
2. **Standardize every connector's output schema on snake_case** field names
   (`schema_version`, `workstream_id`, `route_summary`, `route_segment_impacts`, etc.),
   per build standard §E's DECIDED casing. Workstreams 04, 06, and 07's schema proposals
   already used this convention; 03 and 05's proposals used camelCase and need a
   field-name translation pass when you implement them — the underlying field semantics
   in each workstream's `NORMALIZED_SCHEMA_PROPOSAL.md` are correct, only the casing needs
   to change for 03 and 05.
3. **Adopt these two fields project-wide on every `events[]` item**, per build standard
   §E's envelope definition:
   - `cross_listed_to: []` (from 07's proposal) — populate whenever the hazard ownership
     matrix says an event should be intentionally shown under more than one workstream.
   - `basis: []` (from 05's proposal) — list the specific source IDs that back a given
     segment or event classification, for auditability.
4. **Cross-workstream event deduplication belongs to Workflow 08, not to any individual
   connector** (build standard §F) — each connector publishes its own honest
   `cause_workstream`/`closure_of_record_workstream`/`cross_listed_to` fields; it does
   NOT attempt to merge with another workstream's output itself. This avoids the circular
   dependency that would result if two connectors each tried to read and merge the
   other's data.

### BUILD ORDER

Build in this order (see Executive Summary for the readiness/maintenance-burden
reasoning) **unless the architecture review in Phase 0 produces a documented reason to
change it**: **05_FLOOD_CONDITIONS -> 07_GOVERNMENT_SAFETY_ALERTS -> 04_WILDFIRE ->
03_AIR_QUALITY -> 06_TRAIL_INFRASTRUCTURE_STATUS**.

**Each connector MUST reach the completion definition (build standard §Q) appropriate to
what Decision D01 currently allows before the next connector in this order is considered
started.** Do not parallelize the five builds against an unresolved shared architecture —
that is exactly the mistake this handoff's own Phase 0 exists to prevent (see Lesson L11
and Decision D02's resolution history).

### PER-WORKSTREAM BUILD SPEC

For each workstream, build against exactly the MVP source set, cadence, freshness rule,
and failure/fallback behavior already specified in that workstream's own
`IMPLEMENTATION_RECOMMENDATION.md` and the consolidated
`UW_ISSY_CONNECTOR_IMPLEMENTATION_MATRIX_03_07.md`. Do not add a secondary or
unresolved/blocked source to the first production build — promote them later, one at a
time, per each workstream's own promotion-path notes.

#### 05_FLOOD_CONDITIONS (build first)

MVP: `USGS-01`, `USGS-02` (USGS IV JSON, 15-min cadence), `NWPS-01` (NOAA Water
Prediction Service, 15-min status / 60-min stageflow), `NWS-01` (flood/flash-flood CAP
alerts, 10-15 min), `ISS-01` (City of Issaquah flood-phase policy page, daily/on-change).
Route-impact model: confirmed route closure -> observed flooding -> forecast flooding ->
probable route impact -> elevated water -> no known route impact (six states, in that
priority order — never skip straight to "no known route impact" just because gauges are
below threshold if a closure source says otherwise). Do not let a gauge or lake-level
reading alone ever produce anything stronger than `elevated_water` without closure or NWS
corroboration. No credential needed for the MVP set.

#### 07_GOVERNMENT_SAFETY_ALERTS (build second)

MVP: `NWS-01` (CAP alerts, 8 route-point query + King County zone + statewide backstop,
5-15 min), `SEA-01` (AlertSeattle WordPress API, 15 min), `UW-01` (UW Alert WordPress API,
15 min). **Hard requirement, confirmed necessary by a live test during research, not
theoretical**: filter out any NWS alert whose event type is an Air Quality Alert — those
belong to 03, not 07. Deduplication: CAP identifier first, then source-native ID, then
cross-source clustering by normalized headline + event type + place tokens + effective
time. Display alternate-transport alerts (`ST-01`, `KCMETRO-01`, secondary-tier) in a
visually separate block, never merged into the main hazard count. No credential needed
for the MVP set (`WSDOT_TRAVELER_API_ACCESS_CODE` and FEMA IPAWS credentials are
secondary/unresolved — see below).

#### 04_WILDFIRE (build third)

MVP: `NIFC-01` + `NIFC-02` (WFIGS locations + perimeters, 15 min, **must serialize
requests** — a live `429` was hit during research when both were queried in quick
succession; this is Lesson L01 in the CDM lessons register, an independently reproduced
class of ArcGIS rate-limiting risk, not unique to this project), `NWS-01` (Red Flag/Fire
Weather Watch, 15 min, zone match against `WAZ654`/`WAZ657`), `NOAA-01` (HMS smoke
polygons, 60 min, **no stable "current" alias exists** — build the dated-file discovery
logic, do not hardcode a guessed URL), `KC-01` (King County burn bans, HTML scrape, 6 hr).
Thresholds: active fire point ≤5mi (high priority ≤2mi), perimeter within 10mi buffer
(high priority 2mi or route-line intersection), evacuation zone requires real polygon
intersection or named-landmark match (never infer from fire proximity alone), smoke
plume 5mi buffer, fire-related route closure requires named-segment or ≤0.25mi geometry
match (do not infer from perimeter proximity). No credential needed for the MVP set.

#### 03_AIR_QUALITY (build fourth)

MVP: `ECO-01` (WA Ecology hourly monitors, 60 min), `ECO-02` (WA Ecology smoke forecast
polygons, 3-6 hr in smoke season / daily off-season), `PSCAA-02` (burn-ban status page,
HTML scrape, 6-12 hr). **Before treating `ECO-01`/`ECO-02` as production-stable, re-test
TLS behavior from the actual production host** — this research cycle found that default
`curl` failed against Ecology with exit 60 while Python `requests` succeeded from the same
local machine; confirm which behavior the production host actually exhibits before
shipping (this is the same class of local-vs-production-host discrepancy documented as
Lesson L14 in the CDM lessons register — verify environment parity, don't assume). 
Recommended point design: 4 official monitor points (Seattle-NE 127th, Lake Forest
Park-Town Center, Bellevue-SE 12th, Issaquah-Lake Sammamish) or, if a simpler first
version is needed, 3 corridor buckets. Use EPA AQI categories directly
(Good/Moderate/USG/Unhealthy/Very Unhealthy/Hazardous) as the rider-facing severity scale
— do not invent a new category system. No credential needed for the MVP set.

#### 06_TRAIL_INFRASTRUCTURE_STATUS (build fifth)

MVP: `KC-01`, `KC-02`, `KC-03` (King County Parks trail pages, HTML diff, 6 hr — **no
stable per-alert ID exists on any of these**, implement whole-page/block diffing against
last-known-good, not per-item change detection, using the deterministic content-hash
fallback identity method defined in build standard §F), `SAM-02` (City of Sammamish
creek-project update, HTML article parse, 12 hr), `ISS-01` (City of Issaquah construction
ArcGIS service, route-corridor + keyword filter, 6 hr). Public-facing label:
**`WATERWAY_AND_CROSSING_STATUS`** (internal folder identifier
`06_TRAIL_INFRASTRUCTURE_STATUS` stays unchanged — do not rename it, per explicit project
rule). Positive keyword list for filtering: culvert, drainage, storm drainage, fish
passage, salmon habitat, bridge, crossing, shoreline, creek, spillway, boardwalk,
washout. Only auto-publish `high`/`medium` confidence events (exact geometry or
facility/trail-name match); keep `low`-confidence (municipality-only) matches
diagnostic/manual-review-only. No credential needed for the MVP set.

### CREDENTIALS

Test `WSDOT_TRAVELER_API_ACCESS_CODE` first if pursuing any secondary source — it is
already present in this environment by name, was never tested against a live payload in
any of the three workstreams that reference it (05, 06, 07), and independently unlocks
value in all three. Do not provision `NASA_FIRMS_MAP_KEY`, `AIRNOW_API_KEY`, or any FEMA
IPAWS credential unless the project owner explicitly requests promoting one of those
secondary/unresolved sources — none of them block any MVP build. Full detail:
`00_DOCS/UW_ISSY_CONNECTOR_ENV_REQUIREMENTS_03_07.md`. Never print, log, test, or commit
any credential value, in this phase or any other — this restriction is absolute and
carries forward from every prior phase of this project.

## PHASE 3 — PRODUCTION-HOST VERIFICATION (separate from and after Phase 2's implementation)

Once a connector passes live execution locally, re-verify against the actual production
host once one is provisioned (Decision D01): re-test Ecology TLS behavior (03), confirm
WFIGS serialization actually avoids rate-limiting under the production host's real network
path (04), and re-confirm environment-variable parity generally (per CDM Lesson L14 — a
cross-host discrepancy was once misdiagnosed as a hardware/architecture issue when the
real cause was an environment variable present on one host and not the other). Do not
skip this phase because local execution passed — local success and production success
are tracked as separate completion-state gates (build standard §Q), not one combined
claim.

## PHASE 4 — WORKFLOW 08 INTEGRATION (OUT OF SCOPE for this handoff)

Workflow 08 (the cross-workstream assembly/build/deploy workflow) is explicitly out of
scope for this handoff and the work it authorizes. Do not begin designing or building it.
When that job is reached, it must be briefed against build standard §F (dedup
responsibility) and §R (handoff contract), and Decision D07/D08 in the open decisions
register must be resolved first.

## PHASE 5 — WEBSITE BUILD/DEPLOY AND PRODUCTION ACTIVATION (OUT OF SCOPE for this handoff)

Also explicitly out of scope. Do not deploy a website, activate a schedule, or push
anything to a remote repository as part of the work this handoff authorizes. These are
separate, later milestones per build standard §Q (production-ready is not the same as
active) and require explicit project-owner approval to cross into, per this project's
standing permission policy.

---

## HAZARD DEDUPLICATION — IMPLEMENT AS CODE, NOT AS A REMINDER (applies within Phase 2)

`00_DOCS/UW_ISSY_HAZARD_OWNERSHIP_MATRIX_03_07.md` is not just documentation — its
escalation rule must be implemented: for any hazard marked "jointly owned" in that matrix
(fire-caused trail closures, flood-caused trail closures, bridge closures, dam incidents,
waterway infrastructure closures), each connector resolves its own honest
`cause_workstream`/`closure_of_record_workstream` fields (build standard §E/§F) — the
actual one-event-not-two merge happens in Workflow 08 (Phase 4, out of scope here), never
inside an individual connector.

## COMPLETION DEFINITION (applies to each connector built in Phase 2)

Per build standard §Q, no connector may be considered complete on static validation or
workflow-JSON export alone. Each connector must pass through the full maturity ladder —
`BUILD_COMPLETE` → `STATICALLY_VALIDATED` → `IMPORTED` → `LIVE_VALIDATED` →
`PUBLICATION_VALIDATED` (as far as Decision D01 currently allows) — with the evidence
required at each stage (build standard §K/§L) actually captured, not merely asserted.
**A connector must satisfy this completion definition before the next connector in the
build order (above) is considered complete** — do not declare all five "done" based on
one connector's evidence.

## VALIDATION BEFORE COMPLETION (per connector)

1. Confirm every MVP source per workstream is queried exactly as specified above (correct
   cadence, correct freshness threshold, correct fallback behavior).
2. Confirm source IDs are namespaced by `<workstream_id>:<local_source_id>` everywhere
   they could collide.
3. Confirm output schemas use snake_case consistently across all five workstreams.
4. Confirm the joint-hazard fields (`cause_workstream`, `closure_of_record_workstream`,
   `cross_listed_to`) are populated honestly per connector — do not attempt the actual
   cross-workstream merge here (that's Workflow 08's job, Phase 4).
5. Confirm no credential value is printed, logged, tested, or committed anywhere.
6. Confirm the WFIGS serialization fix is actually in place (no burst parallel queries).
7. Confirm the NOAA HMS dated-file discovery logic works without a hardcoded "current"
   alias.
8. Confirm the connector's `execution_evidence.json`, `CONNECTOR_MANIFEST.json`, and
   `NORMALIZED_SCHEMA.json` all exist and are internally consistent (build standard §L/§M).
9. Append a full build-log entry to `00_PROJECT_BUILDLOG.md` for each workstream as it is
   completed, following this project's existing entry format, including which maturity
   state (build standard §Q) was reached and why it didn't go further if it didn't.
10. Copy any new helper script to `/Users/jkbrookspersonal/00_SCRIPTS` with a timestamped
    filename, per this project's script-archive convention.

## DO NOT

- Do not skip Phase 0 or Phase 1 — do not build any of 03-07 before Decision D12 is
  resolved and `02_WEATHER` is remediated as the reference connector.
- Do not re-research sources already classified in the registry — implement against the
  existing classification, or explicitly justify and document any deviation.
- Do not merge two workstreams' source IDs without the namespace fix above.
- Do not perform cross-workstream event deduplication inside an individual connector —
  that belongs to Workflow 08 (Phase 4, out of scope here).
- Do not invent a canal authority or force canal-status data into workstream 06 — the
  route does not follow a French canal system, and this was already explicitly tested and
  rejected.
- Do not rename `06_TRAIL_INFRASTRUCTURE_STATUS`'s internal folder identifier.
- Do not promote any UNRESOLVED or BLOCKED source to production without first closing its
  documented blocker (credential, live-item capture, or browser-capable fetch path).
- Do not skip the production-host TLS re-test for Ecology before relying on it for
  03_AIR_QUALITY (Phase 3).
- Do not build, modify, import, or execute n8n workflows for Workflow 08, deploy a
  website, activate a production schedule, or push to a remote repository as part of the
  work this handoff authorizes (Phases 4-5 are explicitly out of scope).
- Do not create a local git commit unless the project owner explicitly instructs it for
  this specific work.
