# UW–Issaquah Open Connector Architecture Decisions

Updated on Friday, July 31, 2026 to record the project owner's approved implementation decisions required before the first executable connector build specification is authored.

Classification:
- `RESOLVED`: owner-approved and binding for implementation
- `BLOCKING`: still must be resolved before one or more production connectors or workflow 08 can be considered complete
- `NON_BLOCKING`: important, but a connector can be designed or partially built without final resolution
- `DEFERRED`: legitimate future decision, but not required before connector design begins

## Decision Register

### DEC-001
- Classification: `RESOLVED` (was `BLOCKING`)
- Question: What is the final Hetzner runtime root for raw, candidate, published, LKG, evidence, and quarantine outputs?
- Why it matters: atomic publication, same-filesystem rename, and workflow-08 discovery all depend on final path design.
- Evidence available: current repo only has placeholder/overlapping local directories; the UW research set did not previously define a final production runtime root.
- Options considered:
  - define one dedicated `<hetzner_runtime_root>/uw_issy_route_monitor/`
  - reuse a broader existing monitoring root
- Original recommendation: dedicated project-scoped runtime root.
- Decision owner: project owner
- Deadline or phase: before first live connector workflow writes production-like artifacts
- Whether `02_WEATHER` could proceed before resolution: yes for design-only and local prototype work, no for final publication wiring
- Resolution date: `2026-07-31`
- Correction note: the value recorded in commit `0afce56` used the wrong runtime-root spelling and trailing-slash form; that historical record is superseded before connector implementation as part of this documentation-baseline correction.
- Approved decision: use absolute Hetzner runtime root `/srv/uw-issy-route-monitor` with required artifact-class directories `raw/`, `normalized/`, `candidate/`, `published/`, `last_known_good/`, `health/`, `evidence/`, `logs/`, `quarantine/`, `fixtures/`, `schemas/`, `manifests/`, and `handoff/`; every artifact-class directory MUST contain lane-specific subdirectories such as `/srv/uw-issy-route-monitor/raw/02_WEATHER/`
- Implementation consequence: all connector manifests, publication logic, evidence paths, retention jobs, and workflow-08 discovery logic MUST target this exact runtime root and lane-subdirectory pattern
- Validation still required: confirm the exact tree exists on Hetzner before the first executable connector is marked production-capable; confirm same-filesystem atomic rename behavior for candidate/published promotion

### DEC-002
- Classification: `RESOLVED` (was `BLOCKING`)
- Question: What is the final published production output path contract for lanes 01–07 and workflow 08?
- Why it matters: candidate/published/LKG separation and workflow-08 handoff need stable locations.
- Evidence available: current project had `public/data`, `data/monitoring`, `data/route-monitoring`, and `ONGOING_ROUTE_MONITORING/data`, but no agreed production publication contract.
- Options considered:
  - `data/connectors/published/<lane>/`
  - `public/data/` direct lane writes
  - hybrid internal published + workflow-08-generated public site data
- Original recommendation: internal published lane outputs under `data/connectors/published/`, then workflow 08 generates `public/data/`.
- Decision owner: project owner plus implementation owner
- Deadline or phase: before workflow build
- Whether `02_WEATHER` could proceed before resolution: yes for connector design, no for final production handoff
- Resolution date: `2026-07-31`
- Approved decision: connectors `01` through `07` MUST write internal connector artifacts only under the approved Hetzner runtime root and, in the local repository mirror, under `data/connectors/{raw,normalized,candidate,published,last_known_good,health,evidence,logs,quarantine,fixtures,schemas,manifests,handoff}/<lane>/`; connectors MUST NOT write directly to `public/data/`; workflow 08 alone owns generation of site-facing artifacts under `public/data/`
- Implementation consequence: connector executable specifications MUST treat connector-published artifacts and rider-facing public site artifacts as separate trust boundaries; workflow 08 becomes the only component allowed to materialize `public/data/`
- Validation still required: confirm every connector manifest, publication record, and workflow-08 handoff path points to `data/connectors/` internally and never to `public/data/`

### DEC-003
- Classification: `BLOCKING`
- Question: What are the final default freshness thresholds and lane-specific overrides for UW–Issaquah?
- Why it matters: workflow-08 deploy gates and stale labeling depend on them.
- Evidence available: lane docs propose thresholds, but the user explicitly instructed not to inherit CDM UI thresholds blindly.
- Options:
  - accept current lane proposals as first defaults
  - require owner approval per lane
- Recommendation: keep current lane thresholds as draft defaults in config, mark final values pending owner approval.
- Decision owner: project owner
- Deadline or phase: before first production deploy-capable run
- Whether `02_WEATHER` can proceed before resolution: yes for implementation with configurable thresholds

### DEC-004
- Classification: `RESOLVED` (was `BLOCKING`)
- Question: What retention periods apply to raw responses, candidate artifacts, evidence bundles, quarantine files, and LKG files?
- Why it matters: storage growth, forensic value, and privacy/licensing boundaries depend on it.
- Evidence available: CDM retained evidence and raw artifacts, but this audit did not previously find a single reusable numeric retention policy.
- Options considered:
  - fixed day-based retention per artifact class
  - size-based rotation plus minimum retention
- Original recommendation: define per-artifact-class retention with longer retention for evidence and LKG than for raw transient payloads.
- Decision owner: project owner
- Deadline or phase: before first live production run
- Whether `02_WEATHER` could proceed before resolution: yes for code design; no for final operational sign-off
- Resolution date: `2026-07-31`
- Correction note: the retention values recorded in commit `0afce56` are superseded before connector implementation as part of this documentation-baseline correction.
- Approved decision: initial retention periods are `14 days` successful raw source responses, `30 days` failed or anomalous raw responses, `14 days` normalized intermediate artifacts, `14 days` candidate artifacts, `90 days` quarantined invalid artifacts, `180 days` execution evidence, `90 days` source and connector health history, `90 days` published immutable snapshots, active last-known-good snapshot retained until superseded by a newer valid LKG, runtime logs retained `30 days`, test fixtures retained in Git until intentionally removed, and connector manifests and schemas permanently versioned; retention MUST be configurable and cleanup MUST NOT delete the snapshot referenced by `current.json`, the active last-known-good snapshot, a snapshot needed to reproduce the latest deployed site state, evidence associated with an unresolved incident, or committed schemas/manifests; the policy MUST be reviewed after `60` to `90` days of runtime storage evidence
- Implementation consequence: cleanup jobs, manifests, and operational docs MUST use these exact defaults and MUST expose them as configuration rather than hard-coded irreversible constants
- Validation still required: confirm the same values appear identically in the shared standard, manifests, and future cleanup implementation; verify keep-rules for incident-linked and latest-deployment artifacts before cleanup is automated

### DEC-005
- Classification: `RESOLVED` (was `BLOCKING`)
- Question: What is the authoritative schedule frequency for each lane and for workflow 08?
- Why it matters: freshness, rate limiting, and deploy cadence all depend on it.
- Evidence available: lane docs suggested cadences but no global approved scheduler contract previously existed.
- Options considered:
  - lane-specific schedules only
  - synchronized workflow-08 schedule after connector windows
- Original recommendation: approve lane-specific fetch schedules plus a separate workflow-08 cadence.
- Decision owner: project owner
- Deadline or phase: before live scheduling
- Whether `02_WEATHER` could proceed before resolution: yes for workflow design
- Resolution date: `2026-07-31`
- Correction note: the multi-cadence Weather schedule recorded in commit `0afce56` is superseded before connector implementation as part of this documentation-baseline correction.
- Approved decision: the initial `02_WEATHER` scheduling policy is one complete connector workflow scheduled every `15 minutes` in `America/Los_Angeles`; manual execution remains supported; overlapping executions MUST be prevented; retries MUST be bounded; source-specific timeouts remain required; failed executions MUST preserve the existing published and last-known-good snapshots; the Weather connector MUST NOT build or deploy the site; source-specific due logic MAY be considered later as an optimization, but it is not the approved initial scheduling architecture
- Implementation consequence: the first Weather executable specification MUST use one non-overlapping `15-minute` schedule for the complete workflow rather than preserving the superseded `10/30/60` cadence as a governing alternative
- Validation still required: confirm the shared standard and future Weather manifest use the same `15-minute` `America/Los_Angeles` schedule and preserve published/LKG outputs on failure

### DEC-006
- Classification: `BLOCKING`
- Question: Which lanes are mandatory versus optional for workflow-08 deployment gates?
- Why it matters: workflow 08 cannot decide block/deploy behavior without it.
- Evidence available: lane research is complete, but the mandatory/optional matrix does not yet exist.
- Options:
  - all 01–07 mandatory
  - tiered critical vs optional lanes
- Recommendation: define a critical core and explicit stale-but-allowed allowances, rather than informal exceptions.
- Decision owner: project owner
- Deadline or phase: before workflow-08 implementation
- Whether `02_WEATHER` can proceed before resolution: yes individually

### DEC-007
- Classification: `RESOLVED` (was `BLOCKING`)
- Question: Will WSDOT credentialed sources be used in the first production wave, and if so in which lanes?
- Why it matters: environment configuration, source-health expectations, and scope commitments change depending on that answer.
- Evidence available: WSDOT appears in lane 02, 05, 06, and 07 research as optional, blocked, or secondary.
- Options considered:
  - no WSDOT in first wave
  - WSDOT only in 02
  - selective WSDOT in 02/05/06/07
- Original recommendation: keep WSDOT out of first mandatory deploy gates unless the credential is available and retested.
- Decision owner: project owner
- Deadline or phase: before workflow build for affected lanes
- Whether `02_WEATHER` could proceed before resolution: yes
- Resolution date: `2026-07-31`
- Approved decision: WSDOT credentialed sources are NOT mandatory for the first production-capable `02_WEATHER` release; the initial Weather connector MUST operate without WSDOT; WSDOT MAY be added later only after credential availability is confirmed, authentication is retested successfully, source output is semantically validated, and failure behavior is proven non-blocking for valid non-WSDOT Weather publication; the Weather manifest MUST distinguish required non-WSDOT sources from optional WSDOT sources
- Implementation consequence: first-release Weather manifests, validation gates, and source-health expectations MUST treat WSDOT as optional and non-blocking
- Validation still required: confirm the first executable Weather specification and manifest place all WSDOT sources in `optional_sources` only, with no release gate depending on them

### DEC-008
- Classification: `BLOCKING`
- Question: Is the final user-facing label for lane 06 approved as `WATERWAY_AND_CROSSING_STATUS`, or should another label be used?
- Why it matters: it leaks into manifest, UI, as-built docs, and possibly connector metadata.
- Evidence available: the July 29, 2026 cross-lane synthesis recommended `WATERWAY_AND_CROSSING_STATUS`, but the user explicitly asked not to silently choose unresolved matters.
- Options:
  - `WATERWAY_AND_CROSSING_STATUS`
  - keep folder-style `TRAIL_INFRASTRUCTURE_STATUS` in UI
  - another owner-approved label
- Recommendation: approve `WATERWAY_AND_CROSSING_STATUS` unless the owner prefers something shorter.
- Decision owner: project owner
- Deadline or phase: before UI or workflow-08 display mapping
- Whether `02_WEATHER` can proceed before resolution: yes

### DEC-009
- Classification: `BLOCKING`
- Question: What shared cross-lane severity taxonomy, if any, should workflow 08 use for site-wide rollups?
- Why it matters: lane-native severities are intentionally different.
- Evidence available: UW synthesis recommends keeping lane-native severity vocabularies.
- Options:
  - no shared severity, only lane-local
  - workflow-08-only mapped display tier
- Recommendation: workflow-08 may map lane-native severity to a small display tier, but MUST preserve original lane severity verbatim.
- Decision owner: implementation owner with project-owner approval
- Deadline or phase: before workflow-08 build
- Whether `02_WEATHER` can proceed before resolution: yes

### DEC-010
- Classification: `RESOLVED` (was `BLOCKING`)
- Question: What are the final production n8n project/folder/tag names?
- Why it matters: naming discipline, run discovery, and audits depend on it.
- Evidence available: none final in the UW repo before owner approval.
- Options considered:
  - one UW project folder with per-lane tags
  - per-lane folders
- Original recommendation: single project folder plus lane and lifecycle tags.
- Decision owner: implementation owner and project owner
- Deadline or phase: before import into production n8n
- Whether `02_WEATHER` could proceed before resolution: yes
- Resolution date: `2026-07-31`
- Correction note: the n8n project name recorded in commit `0afce56` is superseded before connector implementation as part of this documentation-baseline correction.
- Approved decision: use one n8n project/folder for the complete system named exactly `UW-ISSY ROUTE MONITOR`; required tags are `uw_issy`, `connector`, `workflow_08`, `lane_01_route_conditions`, `lane_02_weather`, `lane_03_air_quality`, `lane_04_wildfire`, `lane_05_flood_conditions`, `lane_06_trail_infrastructure_status`, `lane_07_government_safety_alerts`, `candidate_only`, `no_direct_deploy`, `production`, `disabled`, and `active`; workflows `01` through `07` MUST carry `uw_issy`, `connector`, their lane tag, `no_direct_deploy`, and the applicable lifecycle/environment tag; workflow `08` MUST carry `uw_issy`, `workflow_08`, and the applicable lifecycle/environment tag
- Implementation consequence: all future exported workflows, audit references, and operational runbooks MUST use this exact project/folder name and tag vocabulary
- Validation still required: confirm the final n8n imports use this exact folder name and exact tag spellings with no alias drift

### DEC-011
- Classification: `BLOCKING`
- Question: What Cloudflare Pages project name, domain, and environment model will workflow 08 target?
- Why it matters: deployment credentials, no-op deploy checks, rollback, and verification all depend on it.
- Evidence available: UW repo contains `deploy/`, `worker/`, and site scaffolding, but no final Cloudflare deployment decision.
- Options:
  - one production Pages project
  - preview plus production Pages branches
- Recommendation: define project, preview, and production explicitly before workflow-08 deployment work.
- Decision owner: project owner
- Deadline or phase: before workflow-08 deploy implementation
- Whether `02_WEATHER` can proceed before resolution: yes

### DEC-012
- Classification: `BLOCKING`
- Question: What branch/deployment strategy applies to workflow 08 and Cloudflare?
- Why it matters: determines preview/prod promotion logic and rollback procedure.
- Evidence available: none final for UW.
- Options:
  - preview branch plus production branch
  - main-only deploy
- Recommendation: explicit preview and production branches if deployment automation is added.
- Decision owner: project owner
- Deadline or phase: before deployment automation
- Whether `02_WEATHER` can proceed before resolution: yes

### DEC-013
- Classification: `BLOCKING`
- Question: How will workflow 08 notify failures, stale mandatory lanes, or blocked deploys?
- Why it matters: unattended operation without notification is operationally weak.
- Evidence available: no UW notification mechanism documented yet.
- Options:
  - email
  - Slack
  - log-only initially
- Recommendation: choose at least one owner-visible notification channel before live automation.
- Decision owner: project owner
- Deadline or phase: before unattended scheduling
- Whether `02_WEATHER` can proceed before resolution: yes

### DEC-014
- Classification: `NON_BLOCKING`
- Question: Should workflow-08 handoff records live under `data/connectors/handoff/` or inside each lane’s published directory?
- Why it matters: it affects discoverability and cleanup.
- Evidence available: no existing local contract.
- Options:
  - central handoff directory
  - per-lane colocated handoff
- Recommendation: central handoff directory with lane subfolders.
- Decision owner: implementation owner
- Deadline or phase: before workflow-08 wiring
- Whether `02_WEATHER` can proceed before resolution: yes

### DEC-015
- Classification: `NON_BLOCKING`
- Question: What exact buffer distances should be used for geometry-based route relevance by lane?
- Why it matters: false positives and false negatives trade off differently by lane.
- Evidence available: lane docs argue for line-buffer intersection but do not finalize universal numeric buffers.
- Options:
  - one shared default
  - lane-specific per-source buffers
- Recommendation: lane-specific per-source buffers with documented defaults.
- Decision owner: implementation owner
- Deadline or phase: before geometry-capable source go-live
- Whether `02_WEATHER` can proceed before resolution: yes

### DEC-016
- Classification: `NON_BLOCKING`
- Question: What exact review/quarantine retention and reviewer workflow should be used?
- Why it matters: manual review artifacts can accumulate and affect auditability.
- Evidence available: CDM used review queues and quarantine-like handling, but UW has no final process yet.
- Options:
  - simple retained JSON plus build-log references
  - richer review-state machine later
- Recommendation: start with retained JSON records and explicit reason codes.
- Decision owner: implementation owner
- Deadline or phase: before first lane that emits review items
- Whether `02_WEATHER` can proceed before resolution: yes

### DEC-017
- Classification: `DEFERRED`
- Question: Should workflow 08 support an explicit rollback manifest with one-click target reactivation?
- Why it matters: useful for mature operations, but not required before first safe deployment pipeline exists.
- Evidence available: CDM retained deployment evidence and hashes, but this audit did not inspect a reusable rollback-manifest implementation.
- Options:
  - immediate rollback manifest
  - initial hash-and-artifact retention only
- Recommendation: retain enough evidence now to add explicit rollback orchestration later.
- Decision owner: implementation owner
- Deadline or phase: after first stable deploy-capable version
- Whether `02_WEATHER` can proceed before resolution: yes

## Summary

Resolved on `2026-07-31`:
- `DEC-001` runtime root
- `DEC-002` publication path and trust boundary
- `DEC-004` retention policy
- `DEC-005` initial Weather schedule policy
- `DEC-007` WSDOT first-release status
- `DEC-010` n8n project/folder/tag organization

Blocking decisions still open: `7`

Most important blockers that remain before workflow-08 deployment work:
- final freshness thresholds and lane-specific overrides
- mandatory versus optional deployment-gate matrix
- lane-06 final user-facing label
- workflow-08 cross-lane severity mapping
- Cloudflare project/domain/environment decision
- branch/deployment strategy
- failure notification channel

What this approval unlocks immediately:
- the shared connector standard now has approved runtime, publication, retention, WSDOT, scheduling, and n8n-organization values
- the repository runtime mirror can be created under `data/connectors/`
- the first executable connector build specification may proceed
- `02_WEATHER` remains the intended first executable specification

What remains deferred:
- Cloudflare deployment specifics
- workflow-08 notification design
- workflow-08 deployment-gate policy
