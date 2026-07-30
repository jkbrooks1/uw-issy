# UW–Issaquah Open Connector Architecture Decisions

Unresolved decisions found during the July 30, 2026 documentation audit.

Classification:
- `BLOCKING`: must be resolved before one or more production connectors or workflow 08 can be considered complete
- `NON_BLOCKING`: important, but a connector can be designed or partially built without final resolution
- `DEFERRED`: legitimate future decision, but not required before connector design begins

## Decision Register

### DEC-001
- Classification: `BLOCKING`
- Question: What is the final Hetzner runtime root for raw, candidate, published, LKG, evidence, and quarantine outputs?
- Why it matters: atomic publication, same-filesystem rename, and workflow-08 discovery all depend on final path design.
- Evidence available: current repo only has placeholder/overlapping local directories; the UW research set does not define a final production runtime root.
- Options:
  - define one dedicated `<hetzner_runtime_root>/uw_issy_route_monitor/`
  - reuse a broader existing monitoring root
- Recommendation: dedicated project-scoped runtime root.
- Decision owner: project owner
- Deadline or phase: before first live connector workflow writes production-like artifacts
- Whether `02_WEATHER` can proceed before resolution: yes for design-only and local prototype work, no for final publication wiring

### DEC-002
- Classification: `BLOCKING`
- Question: What is the final published production output path contract for lanes 01–07 and workflow 08?
- Why it matters: candidate/published/LKG separation and workflow-08 handoff need stable locations.
- Evidence available: current project has `public/data`, `data/monitoring`, `data/route-monitoring`, and `ONGOING_ROUTE_MONITORING/data`, but no agreed production publication contract.
- Options:
  - `data/connectors/published/<lane>/`
  - `public/data/` direct lane writes
  - hybrid internal published + workflow-08-generated public site data
- Recommendation: internal published lane outputs under `data/connectors/published/`, then workflow 08 generates `public/data/`.
- Decision owner: project owner plus implementation owner
- Deadline or phase: before workflow build
- Whether `02_WEATHER` can proceed before resolution: yes for connector design, no for final production handoff

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
- Classification: `BLOCKING`
- Question: What retention periods apply to raw responses, candidate artifacts, evidence bundles, quarantine files, and LKG files?
- Why it matters: storage growth, forensic value, and privacy/licensing boundaries depend on it.
- Evidence available: CDM retained evidence and raw artifacts, but this audit did not find a single reusable numeric retention policy.
- Options:
  - fixed day-based retention per artifact class
  - size-based rotation plus minimum retention
- Recommendation: define per-artifact-class retention with longer retention for evidence and LKG than for raw transient payloads.
- Decision owner: project owner
- Deadline or phase: before first live production run
- Whether `02_WEATHER` can proceed before resolution: yes for code design; no for final operational sign-off

### DEC-005
- Classification: `BLOCKING`
- Question: What is the authoritative schedule frequency for each lane and for workflow 08?
- Why it matters: freshness, rate limiting, and deploy cadence all depend on it.
- Evidence available: lane docs suggest cadences but no global approved scheduler contract exists.
- Options:
  - lane-specific schedules only
  - synchronized workflow-08 schedule after connector windows
- Recommendation: approve lane-specific fetch schedules plus a separate workflow-08 cadence.
- Decision owner: project owner
- Deadline or phase: before live scheduling
- Whether `02_WEATHER` can proceed before resolution: yes for workflow design

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
- Classification: `BLOCKING`
- Question: Will WSDOT credentialed sources be used in the first production wave, and if so in which lanes?
- Why it matters: environment configuration, source-health expectations, and scope commitments change depending on that answer.
- Evidence available: WSDOT appears in lane 02, 05, 06, and 07 research as optional, blocked, or secondary.
- Options:
  - no WSDOT in first wave
  - WSDOT only in 02
  - selective WSDOT in 02/05/06/07
- Recommendation: keep WSDOT out of first mandatory deploy gates unless the credential is available and retested.
- Decision owner: project owner
- Deadline or phase: before workflow build for affected lanes
- Whether `02_WEATHER` can proceed before resolution: yes

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
- Classification: `BLOCKING`
- Question: What are the final production n8n project/folder/tag names?
- Why it matters: naming discipline, run discovery, and audits depend on it.
- Evidence available: none final in the UW repo.
- Options:
  - one UW project folder with per-lane tags
  - per-lane folders
- Recommendation: single project folder plus lane and lifecycle tags.
- Decision owner: implementation owner and project owner
- Deadline or phase: before import into production n8n
- Whether `02_WEATHER` can proceed before resolution: yes

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

Blocking decisions still open: 13

Most important blockers before production connector implementation:
- final runtime and publication roots
- final freshness and deployment-gate policy
- workflow-08 deployment target and notification model
- lane-06 final label approval

02_WEATHER can proceed before full resolution:
- yes, for documentation, schema design, validator design, and even connector implementation against configurable settings
- no, for final production publication wiring and deploy-capable workflow-08 integration
