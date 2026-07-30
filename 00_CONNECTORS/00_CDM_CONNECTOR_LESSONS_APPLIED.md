# UW–Issaquah Connector Lessons Applied

Living engineering lessons register for the UW–Issaquah autonomous connector program.

Purpose:
- capture reusable connector lessons from the CDM projects
- distinguish proven CDM evidence from reasonable but still-unproven ideas
- make adoption decisions explicit before any UW–Issaquah production connector workflow is built

Classification meanings:
- `VALIDATED`: concrete CDM evidence was inspected locally and supports the lesson
- `PROVISIONAL`: the lesson is sensible and partially supported, but the inspected CDM evidence is incomplete
- `OPEN`: the lesson matters, but this audit did not find enough CDM evidence to validate it yet
- `REJECTED_APPROACH`: inspected CDM evidence showed the approach was unsafe, misleading, or superseded

Adoption decisions:
- `ADOPT`: carry forward substantially as-is
- `ADAPT`: carry forward with UW–Issaquah-specific changes
- `DEFER`: keep open for later implementation phase
- `REJECT`: do not carry forward

## Lesson Register

### LESSON-CDM-001
- Title: Workflow internal name must match the exported workflow filename stem
- Classification: `VALIDATED`
- Source project: `BTF_local_CDM_STATUS_PAGE_PROJECT` and `BTF_local_CDM_STATUS_PAGE_PROJECT_V2_CONNECTOR_UI`
- Evidence file or artifact:
  - `/Users/jkbrookspersonal/LocalSiteBuildFiles/BTF_local_CDM_STATUS_PAGE_PROJECT_V2_CONNECTOR_UI/00_BUILD_LOG.md`
  - `/Users/jkbrookspersonal/LocalSiteBuildFiles/BTF_local_CDM_STATUS_PAGE_PROJECT_V2_CONNECTOR_UI/tests/v2-03-air-quality-raw-promotion.test.cjs`
  - `/Users/jkbrookspersonal/LocalSiteBuildFiles/BTF_local_CDM_STATUS_PAGE_PROJECT/00_CONNECTORS/03_AIR_QUALITY/v0010.03_AirQualityConnector.n8n.workflow.json`
- Observed problem: CDM had version/name drift in the air-quality workflow history; the exported file was `v0010.03_AirQualityConnector...` while the workflow JSON still carried `"name": "v0001.03_AirQualityConnector"` until later repair evidence was logged.
- Observed consequence: workflow identity became ambiguous across export files, execution evidence, and canonical references.
- Reusable engineering lesson: workflow version, internal workflow name, and exported filename stem must be kept in lockstep and verified as part of release evidence.
- Applicability to UW–Issaquah: high; seven connectors plus workflow 08 will otherwise accumulate ambiguous execution evidence.
- Adoption decision: `ADOPT`
- Rationale: the CDM mismatch was concrete and avoidable.
- Validation still required: verify final UW–Issaquah naming against real n8n exports when workflows exist.
- Owner or next verification phase: workflow implementation phase.

### LESSON-CDM-002
- Title: Connectors must execute independently and must not require another connector to produce their own raw landing artifacts
- Classification: `VALIDATED`
- Source project: `BTF_local_CDM_STATUS_PAGE_PROJECT_V2_CONNECTOR_UI`
- Evidence file or artifact:
  - `/Users/jkbrookspersonal/LocalSiteBuildFiles/BTF_local_CDM_STATUS_PAGE_PROJECT_V2_CONNECTOR_UI/scripts/connectors/build-v2-site-feeds-from-connectors.cjs`
  - `/Users/jkbrookspersonal/LocalSiteBuildFiles/BTF_local_CDM_STATUS_PAGE_PROJECT_V2_CONNECTOR_UI/tests/v2-03-air-quality-raw-promotion.test.cjs`
- Observed problem: V2 explicitly separated raw execution capture from candidate-feed generation and public promotion.
- Observed consequence: connector output could be proven and promoted stepwise without mutating public feeds.
- Reusable engineering lesson: every connector should produce its own raw, normalized, and evidence artifacts independently; merge/build/deploy is a later phase.
- Applicability to UW–Issaquah: high; it directly supports the required 01–07 to 08 handoff model.
- Adoption decision: `ADOPT`
- Rationale: this matches the UW–Issaquah request to keep assembly/build/deploy separate.
- Validation still required: prove the separation in live UW–Issaquah runs once connectors exist.
- Owner or next verification phase: connector build phase.

### LESSON-CDM-003
- Title: Independent connector observability must be retained as first-class artifacts
- Classification: `VALIDATED`
- Source project: `BTF_local_CDM_STATUS_PAGE_PROJECT_V2_CONNECTOR_UI`
- Evidence file or artifact:
  - `/Users/jkbrookspersonal/LocalSiteBuildFiles/BTF_local_CDM_STATUS_PAGE_PROJECT_V2_CONNECTOR_UI/tests/v2-03-air-quality-execution-capture.test.cjs`
  - `/Users/jkbrookspersonal/LocalSiteBuildFiles/BTF_local_CDM_STATUS_PAGE_PROJECT_V2_CONNECTOR_UI/tests/v2-03-air-quality-raw-promotion.test.cjs`
- Observed problem: execution evidence is only trustworthy if the source execution id, workflow id, hashes, and captured artifacts are all retained together.
- Observed consequence: CDM could prove byte preservation, exact workflow id, and execution lineage for a connector run.
- Reusable engineering lesson: retain execution provenance, SHA-256 checksums, artifact capture reports, and per-run execution reports for each connector.
- Applicability to UW–Issaquah: high.
- Adoption decision: `ADOPT`
- Rationale: it is the cleanest way to distinguish source failure, validation failure, and publication failure.
- Validation still required: pick final retention periods.
- Owner or next verification phase: architecture decisions phase, then connector build phase.

### LESSON-CDM-004
- Title: Successful HTTP fetch does not equal valid connector output
- Classification: `VALIDATED`
- Source project: `BTF_local_CDM_STATUS_PAGE_PROJECT_V2_CONNECTOR_UI`
- Evidence file or artifact:
  - `/Users/jkbrookspersonal/LocalSiteBuildFiles/BTF_local_CDM_STATUS_PAGE_PROJECT_V2_CONNECTOR_UI/scripts/connectors/lib/connector-validation.cjs`
  - `/Users/jkbrookspersonal/LocalSiteBuildFiles/BTF_local_CDM_STATUS_PAGE_PROJECT_V2_CONNECTOR_UI/tests/v2-03-air-quality-execution-capture.test.cjs`
  - `/Users/jkbrookspersonal/LocalSiteBuildFiles/BTF_local_CDM_STATUS_PAGE_PROJECT_V2_CONNECTOR_UI/tests/v2-connector-adapter-foundation.test.cjs`
- Observed problem: route-impact assertions and output shape could be wrong even when payload retrieval succeeded.
- Observed consequence: CDM added explicit validation failures such as `MISSING_ROUTE_IMPACT_EVIDENCE` and rejected malformed or incomplete captured outputs.
- Reusable engineering lesson: semantic validation must happen after normalization and before any candidate or published write.
- Applicability to UW–Issaquah: high.
- Adoption decision: `ADOPT`
- Rationale: several UW–Issaquah source registries already document sources that can return live but misleading data.
- Validation still required: map lane-specific semantic checks in final validators.
- Owner or next verification phase: schema/validator implementation phase.

### LESSON-CDM-005
- Title: Route-corridor filtering must precede publication
- Classification: `VALIDATED`
- Source project: `BTF_local_CDM_STATUS_PAGE_PROJECT_V2_CONNECTOR_UI`
- Evidence file or artifact:
  - `/Users/jkbrookspersonal/LocalSiteBuildFiles/BTF_local_CDM_STATUS_PAGE_PROJECT_V2_CONNECTOR_UI/00_BUILD_LOG.md`
- Observed problem: CDM published or queued items that were geographically near but not actually route-intersecting.
- Observed consequence: Pont d'Aquitaine and other near-route cases required later suppression or manual-review handling.
- Reusable engineering lesson: publication decisions must be based on corridor or explicit route-access evidence, not broad geography alone.
- Applicability to UW–Issaquah: high.
- Adoption decision: `ADOPT`
- Rationale: UW lane 01 already produced a live false positive from bounding-box matching.
- Validation still required: finalize corridor buffer defaults per lane.
- Owner or next verification phase: route-relevance implementation phase.

### LESSON-CDM-006
- Title: Bounding-box matching is insufficient when line-buffer intersection is required
- Classification: `VALIDATED`
- Source project: `BTF_local_CDM_STATUS_PAGE_PROJECT_V2_CONNECTOR_UI`
- Evidence file or artifact:
  - `/Users/jkbrookspersonal/LocalSiteBuildFiles/BTF_UW-Issy_Route_Monitor/00_CONNECTORS/01_ROUTE_CONDITIONS/API_AND_FEED_TEST_RESULTS.md`
  - `/Users/jkbrookspersonal/LocalSiteBuildFiles/BTF_local_CDM_STATUS_PAGE_PROJECT_V2_CONNECTOR_UI/00_BUILD_LOG.md`
- Observed problem: CDM construction/intersection work and UW lane-01 research both showed false positives from broad geography before line-level intersection confirmation.
- Observed consequence: items could be miscolored or published even though they did not intersect the route.
- Reusable engineering lesson: use line-buffer intersection or explicit access-impact confirmation for geometry-capable sources; do not treat bbox hits as publication proof.
- Applicability to UW–Issaquah: high.
- Adoption decision: `ADOPT`
- Rationale: the lesson is now supported by both CDM and the local UW evidence inventory.
- Validation still required: lane-specific buffer sizes and fallback methods.
- Owner or next verification phase: connector implementation phase.

### LESSON-CDM-007
- Title: Merge barriers and branch-execution safety must be explicit
- Classification: `VALIDATED`
- Source project: `BTF_local_CDM_STATUS_PAGE_PROJECT_V2_CONNECTOR_UI`
- Evidence file or artifact:
  - `/Users/jkbrookspersonal/LocalSiteBuildFiles/BTF_local_CDM_STATUS_PAGE_PROJECT/00_CONNECTORS/03_AIR_QUALITY/03_AIR_QUALITY_CONNECTOR_OUTPUT_CONTRACT.md`
  - `/Users/jkbrookspersonal/LocalSiteBuildFiles/BTF_local_CDM_STATUS_PAGE_PROJECT/00_CONNECTORS/02_WEATHER/02_WEATHER_CONNECTOR_OUTPUT_CONTRACT.md`
- Observed problem: connectors with multiple sources can partially fail without making the whole connector unusable.
- Observed consequence: CDM defined `ok`, `degraded`, `failed`, and infrastructure-blocked distinctions and kept source health separate from final connector status.
- Reusable engineering lesson: multi-branch connectors need explicit merge rules and status derivation rules before write stages.
- Applicability to UW–Issaquah: high, especially for lanes 02–07.
- Adoption decision: `ADOPT`
- Rationale: it prevents branch leakage and silent green states.
- Validation still required: final status vocabulary standardization.
- Owner or next verification phase: shared standard implementation phase.

### LESSON-CDM-008
- Title: Atomic publication must use same-filesystem temp-write plus rename and read-back validation
- Classification: `VALIDATED`
- Source project: `BTF_local_CDM_STATUS_PAGE_PROJECT_V2_CONNECTOR_UI`
- Evidence file or artifact:
  - `/Users/jkbrookspersonal/LocalSiteBuildFiles/BTF_local_CDM_STATUS_PAGE_PROJECT_V2_CONNECTOR_UI/scripts/connectors/lib/json-file-utils.cjs`
- Observed problem: partial writes or corrupted writes would otherwise leave inconsistent connector or site artifacts.
- Observed consequence: CDM implemented temp-file write, rename, and read-back JSON validation in a shared utility.
- Reusable engineering lesson: every JSON publication step should be atomic and immediately read back.
- Applicability to UW–Issaquah: high.
- Adoption decision: `ADOPT`
- Rationale: the implementation is simple and directly reusable as a policy pattern.
- Validation still required: final runtime path selection on Hetzner/local.
- Owner or next verification phase: connector implementation phase.

### LESSON-CDM-009
- Title: Candidate and published artifacts must remain separate until promotion is explicitly approved
- Classification: `VALIDATED`
- Source project: `BTF_local_CDM_STATUS_PAGE_PROJECT_V2_CONNECTOR_UI`
- Evidence file or artifact:
  - `/Users/jkbrookspersonal/LocalSiteBuildFiles/BTF_local_CDM_STATUS_PAGE_PROJECT_V2_CONNECTOR_UI/tests/v2-03-air-quality-raw-promotion.test.cjs`
  - `/Users/jkbrookspersonal/LocalSiteBuildFiles/BTF_local_CDM_STATUS_PAGE_PROJECT_V2_CONNECTOR_UI/scripts/connectors/build-v2-site-feeds-from-connectors.cjs`
- Observed problem: raw landing, candidate generation, and public promotion are distinct trust boundaries.
- Observed consequence: CDM recorded `promotionScope`, `candidateFeedsGenerated`, and `publicPromotionPerformed` explicitly and verified public files remained unchanged.
- Reusable engineering lesson: connector raw landing, candidate feeds, and published outputs must be separate directories and separate state transitions.
- Applicability to UW–Issaquah: high.
- Adoption decision: `ADOPT`
- Rationale: this is central to safe workflow-08 assembly.
- Validation still required: define final local and production paths.
- Owner or next verification phase: architecture decisions phase.

### LESSON-CDM-010
- Title: Invalid outputs must be quarantined rather than published
- Classification: `VALIDATED`
- Source project: `BTF_local_CDM_STATUS_PAGE_PROJECT_V2_CONNECTOR_UI`
- Evidence file or artifact:
  - `/Users/jkbrookspersonal/LocalSiteBuildFiles/BTF_local_CDM_STATUS_PAGE_PROJECT_V2_CONNECTOR_UI/00_BUILD_LOG.md`
- Observed problem: invalid injected events and fixture-tainted events appeared in review and publication paths.
- Observed consequence: CDM demoted invalid items to review queue, blocked fixture-backed publication, and preserved a valid written feed.
- Reusable engineering lesson: failed semantic records should move to quarantine/review evidence, not overwrite candidate or published artifacts.
- Applicability to UW–Issaquah: high.
- Adoption decision: `ADOPT`
- Rationale: it gives a safe place for bad-but-informative artifacts.
- Validation still required: define exact quarantine file shapes and retention.
- Owner or next verification phase: shared standard implementation phase.

### LESSON-CDM-011
- Title: Last-known-good must be preserved when a live fetch fails
- Classification: `VALIDATED`
- Source project: `BTF_local_CDM_STATUS_PAGE_PROJECT_V2_CONNECTOR_UI`
- Evidence file or artifact:
  - `/Users/jkbrookspersonal/LocalSiteBuildFiles/BTF_local_CDM_STATUS_PAGE_PROJECT_V2_CONNECTOR_UI/00_BUILD_LOG.md`
  - `/Users/jkbrookspersonal/LocalSiteBuildFiles/BTF_local_CDM_STATUS_PAGE_PROJECT/00_CONNECTORS/02_WEATHER/02_WEATHER_CONNECTOR_OUTPUT_CONTRACT.md`
- Observed problem: live-fetch failures originally tempted fixture substitution or blank output.
- Observed consequence: CDM moved to fail-closed preservation behavior and explicitly documented preserving prior events instead of substituting fixtures.
- Reusable engineering lesson: failed fetches should not erase last-known-good outputs; instead mark health and freshness accordingly.
- Applicability to UW–Issaquah: high.
- Adoption decision: `ADOPT`
- Rationale: it aligns with project rules and avoids false green/no-data states.
- Validation still required: define when LKG becomes too stale for workflow-08 deploy.
- Owner or next verification phase: workflow-08 gate design phase.

### LESSON-CDM-012
- Title: Stale data must be labeled explicitly
- Classification: `VALIDATED`
- Source project: `BTF_local_CDM_STATUS_PAGE_PROJECT_V2_CONNECTOR_UI`
- Evidence file or artifact:
  - `/Users/jkbrookspersonal/LocalSiteBuildFiles/BTF_local_CDM_STATUS_PAGE_PROJECT_V2_CONNECTOR_UI/00_BUILD_LOG.md`
- Observed problem: a static connector-supplied freshness label let week-old data still display as fresh.
- Observed consequence: on July 30, 2026 CDM corrected the UI to compute freshness from `lastSuccessAt` and show `Fresh`, `Recent`, `Stale`, `Outdated`, or `Unknown`.
- Reusable engineering lesson: staleness is derived from timestamps and thresholds, not stored as static truth.
- Applicability to UW–Issaquah: high.
- Adoption decision: `ADOPT`
- Rationale: the failure mode is concrete and recent.
- Validation still required: set UW defaults and per-lane overrides.
- Owner or next verification phase: architecture decisions phase.

### LESSON-CDM-013
- Title: Missing, invalid, and future timestamps must fail safely to unknown
- Classification: `VALIDATED`
- Source project: `BTF_local_CDM_STATUS_PAGE_PROJECT_V2_CONNECTOR_UI`
- Evidence file or artifact:
  - `/Users/jkbrookspersonal/LocalSiteBuildFiles/BTF_local_CDM_STATUS_PAGE_PROJECT_V2_CONNECTOR_UI/00_BUILD_LOG.md`
- Observed problem: malformed or future timestamps can accidentally look fresh if naively parsed.
- Observed consequence: CDM explicitly classified missing, invalid, and future timestamps as `Unknown`, not fresh.
- Reusable engineering lesson: timestamp parsing failures and future times must degrade to unknown and block freshness claims.
- Applicability to UW–Issaquah: high.
- Adoption decision: `ADOPT`
- Rationale: directly relevant to all seven lanes.
- Validation still required: choose allowable future skew tolerance if any.
- Owner or next verification phase: schema/validator implementation phase.

### LESSON-CDM-014
- Title: Source health and hazard severity must be separate concepts
- Classification: `VALIDATED`
- Source project: `BTF_local_CDM_STATUS_PAGE_PROJECT` and V2
- Evidence file or artifact:
  - `/Users/jkbrookspersonal/LocalSiteBuildFiles/BTF_local_CDM_STATUS_PAGE_PROJECT/00_CONNECTORS/02_WEATHER/02_WEATHER_CONNECTOR_OUTPUT_CONTRACT.md`
  - `/Users/jkbrookspersonal/LocalSiteBuildFiles/BTF_local_CDM_STATUS_PAGE_PROJECT/00_CONNECTORS/03_AIR_QUALITY/03_AIR_QUALITY_CONNECTOR_OUTPUT_CONTRACT.md`
- Observed problem: a healthy source can report severe hazards, and a failing source says nothing about actual hazard severity.
- Observed consequence: CDM kept `sourceHealth[]` separate from alert severity and connector status.
- Reusable engineering lesson: never derive rider hazard severity from connector/source health state alone.
- Applicability to UW–Issaquah: high.
- Adoption decision: `ADOPT`
- Rationale: foundational contract rule.
- Validation still required: finalize connector-health schema separate from source-health schema.
- Owner or next verification phase: shared standard phase.

### LESSON-CDM-015
- Title: Connector health must be separate from source health
- Classification: `VALIDATED`
- Source project: `BTF_local_CDM_STATUS_PAGE_PROJECT`
- Evidence file or artifact:
  - `/Users/jkbrookspersonal/LocalSiteBuildFiles/BTF_local_CDM_STATUS_PAGE_PROJECT/00_CONNECTORS/03_AIR_QUALITY/03_AIR_QUALITY_CONNECTOR_OUTPUT_CONTRACT.md`
- Observed problem: one source can fail while a connector still produces a degraded but valid output.
- Observed consequence: CDM distinguished top-level connector `status` from per-source `sourceHealth`.
- Reusable engineering lesson: expose both layers explicitly.
- Applicability to UW–Issaquah: high.
- Adoption decision: `ADOPT`
- Rationale: needed for workflow-08 gating.
- Validation still required: lock the final enum vocabulary.
- Owner or next verification phase: shared standard phase.

### LESSON-CDM-016
- Title: Production publication must not occur after failed validation
- Classification: `VALIDATED`
- Source project: `BTF_local_CDM_STATUS_PAGE_PROJECT_V2_CONNECTOR_UI`
- Evidence file or artifact:
  - `/Users/jkbrookspersonal/LocalSiteBuildFiles/BTF_local_CDM_STATUS_PAGE_PROJECT_V2_CONNECTOR_UI/scripts/connectors/build-v2-site-feeds-from-connectors.cjs`
  - `/Users/jkbrookspersonal/LocalSiteBuildFiles/BTF_local_CDM_STATUS_PAGE_PROJECT_V2_CONNECTOR_UI/tests/v2-connector-adapter-foundation.test.cjs`
- Observed problem: candidate or public writes could otherwise occur after structural or evidence validation failure.
- Observed consequence: CDM built explicit validation bags, parity checks, and write gates before reporting success.
- Reusable engineering lesson: validation success is a prerequisite for promotion.
- Applicability to UW–Issaquah: high.
- Adoption decision: `ADOPT`
- Rationale: essential safety barrier.
- Validation still required: final cross-lane workflow-08 gate thresholds.
- Owner or next verification phase: workflow-08 design phase.

### LESSON-CDM-017
- Title: Connector workflows must not directly deploy the site
- Classification: `VALIDATED`
- Source project: `BTF_local_CDM_STATUS_PAGE_PROJECT_V2_CONNECTOR_UI`
- Evidence file or artifact:
  - `/Users/jkbrookspersonal/LocalSiteBuildFiles/BTF_local_CDM_STATUS_PAGE_PROJECT_V2_CONNECTOR_UI/00_BUILD_LOG.md`
  - `/Users/jkbrookspersonal/LocalSiteBuildFiles/BTF_local_CDM_STATUS_PAGE_PROJECT_V2_CONNECTOR_UI/scripts/connectors/v2-doctor.cjs`
- Observed problem: deploying from producer paths couples source polling to site release and weakens safety boundaries.
- Observed consequence: CDM documented a separate deploy pipeline and repeatedly logged that cross-connector merge layer and workflow 08 were separate work.
- Reusable engineering lesson: production build/deploy is its own workflow with its own evidence and credentials.
- Applicability to UW–Issaquah: high.
- Adoption decision: `ADOPT`
- Rationale: directly matches this task’s requested architecture.
- Validation still required: define exact workflow-08 deployment contract.
- Owner or next verification phase: architecture decisions phase.

### LESSON-CDM-018
- Title: Build logs must be append-only and evidence-rich
- Classification: `VALIDATED`
- Source project: both CDM references
- Evidence file or artifact:
  - `/Users/jkbrookspersonal/LocalSiteBuildFiles/BTF_local_CDM_STATUS_PAGE_PROJECT_V2_CONNECTOR_UI/00_BUILD_LOG.md`
  - `/Users/jkbrookspersonal/LocalSiteBuildFiles/BTF_local_CDM_STATUS_PAGE_PROJECT/00_PROJECT_BUILDLOG.md`
- Observed problem: without preserved chronology, connector provenance and correction history become ambiguous.
- Observed consequence: CDM kept detailed append-only logs with execution ids, hashes, deployment ids, failures, and corrections.
- Reusable engineering lesson: append-only logs are part of the runtime evidence model, not just a diary.
- Applicability to UW–Issaquah: high.
- Adoption decision: `ADOPT`
- Rationale: already required by local project rules.
- Validation still required: none beyond continued enforcement.
- Owner or next verification phase: all phases.

### LESSON-CDM-019
- Title: Credentials must never appear in exports, logs, repositories, or generated docs
- Classification: `VALIDATED`
- Source project: both CDM references
- Evidence file or artifact:
  - `/Users/jkbrookspersonal/LocalSiteBuildFiles/BTF_local_CDM_STATUS_PAGE_PROJECT_V2_CONNECTOR_UI/00_BUILD_LOG.md`
  - `/Users/jkbrookspersonal/LocalSiteBuildFiles/BTF_local_CDM_STATUS_PAGE_PROJECT_V2_CONNECTOR_UI/tests/v2-doctor-safety.test.cjs`
- Observed problem: CDM repeatedly handled credential-gated systems and explicitly guarded production-sensitive commands.
- Observed consequence: logs emphasized that secrets were not printed or committed and that dangerous deploy/fetch scripts were blocked or wrapped.
- Reusable engineering lesson: secret-name documentation is acceptable; secret values in artifacts are never acceptable.
- Applicability to UW–Issaquah: high.
- Adoption decision: `ADOPT`
- Rationale: required for WSDOT, Cloudflare, and any future gated source.
- Validation still required: define exact env var names and credential storage paths.
- Owner or next verification phase: architecture decisions phase.

### LESSON-CDM-020
- Title: Test and deployment evidence must be retained
- Classification: `VALIDATED`
- Source project: `BTF_local_CDM_STATUS_PAGE_PROJECT_V2_CONNECTOR_UI`
- Evidence file or artifact:
  - `/Users/jkbrookspersonal/LocalSiteBuildFiles/BTF_local_CDM_STATUS_PAGE_PROJECT_V2_CONNECTOR_UI/00_BUILD_LOG.md`
  - `/Users/jkbrookspersonal/LocalSiteBuildFiles/BTF_local_CDM_STATUS_PAGE_PROJECT_V2_CONNECTOR_UI/tests/v2-03-air-quality-raw-promotion.test.cjs`
- Observed problem: deployment or promotion claims are weak without retained hashes, execution ids, and post-deploy verification notes.
- Observed consequence: CDM logged deployment ids, saved execution bundles, and verified hashes and output parity.
- Reusable engineering lesson: evidence files are required artifacts, not optional notes.
- Applicability to UW–Issaquah: high.
- Adoption decision: `ADOPT`
- Rationale: workflow-08 must be auditable.
- Validation still required: finalize evidence retention policy.
- Owner or next verification phase: architecture decisions phase.

### LESSON-CDM-021
- Title: Source IDs must be globally namespaced before cross-lane merging
- Classification: `VALIDATED`
- Source project: `BTF_local_CDM_STATUS_PAGE_PROJECT_V2_CONNECTOR_UI` and UW synthesis docs
- Evidence file or artifact:
  - `/Users/jkbrookspersonal/LocalSiteBuildFiles/BTF_UW-Issy_Route_Monitor/00_DOCS/UW_ISSY_CONNECTOR_RESEARCH_03_07_EXECUTIVE_SUMMARY.md`
  - `/Users/jkbrookspersonal/LocalSiteBuildFiles/BTF_UW-Issy_Route_Monitor/00_DOCS/UW_ISSY_NORMALIZED_SCHEMAS_03_07.md`
- Observed problem: short source ids such as `KC-01` and `ISS-01` are reused across connectors.
- Observed consequence: any merge without namespacing will silently corrupt joins and dedup logic.
- Reusable engineering lesson: namespace source ids with lane or connector id everywhere outside a lane-local registry.
- Applicability to UW–Issaquah: immediate.
- Adoption decision: `ADOPT`
- Rationale: the collision is already present in the current UW research set.
- Validation still required: finalize exact namespace format.
- Owner or next verification phase: shared standard phase.

### LESSON-CDM-022
- Title: Duplicated events require deterministic identity and deduplication rules
- Classification: `VALIDATED`
- Source project: `BTF_local_CDM_STATUS_PAGE_PROJECT_V2_CONNECTOR_UI`
- Evidence file or artifact:
  - `/Users/jkbrookspersonal/LocalSiteBuildFiles/BTF_local_CDM_STATUS_PAGE_PROJECT_V2_CONNECTOR_UI/00_BUILD_LOG.md`
- Observed problem: multiple producers could reference the same real-world hazard from different source angles.
- Observed consequence: CDM introduced lifecycle/dedupe logic, review queue separation, and route-status tests covering dedupe/update/remove behavior.
- Reusable engineering lesson: event identity must be deterministic and documented per source type, with a composite fallback when no native id exists.
- Applicability to UW–Issaquah: high.
- Adoption decision: `ADOPT`
- Rationale: essential for cross-lane ownership matrix enforcement.
- Validation still required: finalize event-id fallback fields per lane.
- Owner or next verification phase: shared standard phase.

### LESSON-CDM-023
- Title: Static freshness labels are a rejected approach
- Classification: `REJECTED_APPROACH`
- Source project: `BTF_local_CDM_STATUS_PAGE_PROJECT_V2_CONNECTOR_UI`
- Evidence file or artifact:
  - `/Users/jkbrookspersonal/LocalSiteBuildFiles/BTF_local_CDM_STATUS_PAGE_PROJECT_V2_CONNECTOR_UI/00_BUILD_LOG.md`
- Observed problem: the UI originally trusted connector-supplied `freshness` strings directly.
- Observed consequence: week-old sources could still show as fresh.
- Reusable engineering lesson: do not persist `fresh` as authoritative truth in published connector output.
- Applicability to UW–Issaquah: high.
- Adoption decision: `REJECT`
- Rationale: explicitly contradicted by later CDM correction on July 30, 2026.
- Validation still required: none; the approach is rejected.
- Owner or next verification phase: shared standard phase.

### LESSON-CDM-024
- Title: Connector health and deployment readiness are related but distinct
- Classification: `PROVISIONAL`
- Source project: `BTF_local_CDM_STATUS_PAGE_PROJECT_V2_CONNECTOR_UI`
- Evidence file or artifact:
  - `/Users/jkbrookspersonal/LocalSiteBuildFiles/BTF_local_CDM_STATUS_PAGE_PROJECT_V2_CONNECTOR_UI/scripts/connectors/build-v2-site-feeds-from-connectors.cjs`
  - `/Users/jkbrookspersonal/LocalSiteBuildFiles/BTF_local_CDM_STATUS_PAGE_PROJECT_V2_CONNECTOR_UI/00_BUILD_LOG.md`
- Observed problem: CDM clearly separated connector generation from later build/deploy, but the final fully-autonomous workflow-08 equivalent was still out of scope.
- Observed consequence: strong evidence exists for separation, but not for the final all-lane UW-style deployment gate semantics.
- Reusable engineering lesson: workflow-08 must look at more than “connector ran successfully”.
- Applicability to UW–Issaquah: high.
- Adoption decision: `ADAPT`
- Rationale: the CDM evidence is directional, but UW still has to define its own gate matrix.
- Validation still required: final blocking vs non-blocking lane policy.
- Owner or next verification phase: open architecture decisions phase.

### LESSON-CDM-025
- Title: Cloudflare credentials should be least-privilege and isolated from connector execution
- Classification: `PROVISIONAL`
- Source project: `BTF_local_CDM_STATUS_PAGE_PROJECT_V2_CONNECTOR_UI`
- Evidence file or artifact:
  - `/Users/jkbrookspersonal/LocalSiteBuildFiles/BTF_local_CDM_STATUS_PAGE_PROJECT_V2_CONNECTOR_UI/00_BUILD_LOG.md`
- Observed problem: deploy pipelines required separate secrets and explicit deploy workflows.
- Observed consequence: CDM avoided embedding tokens in connectors and documented GitHub Actions secrets instead.
- Reusable engineering lesson: deployment credentials belong to workflow-08 or CI only, not connector workflows.
- Applicability to UW–Issaquah: high.
- Adoption decision: `ADAPT`
- Rationale: the least-privilege principle is clear, but the exact UW Cloudflare project and scope are unresolved.
- Validation still required: final Cloudflare project, token scope, and deployment path.
- Owner or next verification phase: architecture decisions phase.

### LESSON-CDM-026
- Title: Source response size control matters for artifact safety and reproducibility
- Classification: `OPEN`
- Source project: both CDM references
- Evidence file or artifact:
  - `/Users/jkbrookspersonal/LocalSiteBuildFiles/BTF_local_CDM_STATUS_PAGE_PROJECT/00_CONNECTORS/03_AIR_QUALITY/03_AIR_QUALITY_ATMO_EPISODES_SIZE_PROBE_REPORT.md`
- Observed problem: large source payloads can bloat execution capture and promotion artifacts.
- Observed consequence: size probes were present, but this audit did not re-read enough end-to-end CDM evidence to promote a concrete global standard.
- Reusable engineering lesson: size limits and truncation rules likely belong in the shared standard.
- Applicability to UW–Issaquah: medium to high.
- Adoption decision: `DEFER`
- Rationale: important, but needs final numeric thresholds set intentionally for UW.
- Validation still required: define per-source raw retention and max payload strategy.
- Owner or next verification phase: implementation planning phase.

## Current Register State

- `VALIDATED`: 22
- `PROVISIONAL`: 2
- `OPEN`: 1
- `REJECTED_APPROACH`: 1

## How To Maintain This Register

- Add new lessons rather than rewriting history.
- If a `PROVISIONAL` or `OPEN` lesson becomes proven in a later UW or CDM evidence pass, keep the same lesson ID and update classification with the new evidence path.
- If a lesson is later disproven, reclassify it to `REJECTED_APPROACH` and preserve the prior rationale in the update note.
