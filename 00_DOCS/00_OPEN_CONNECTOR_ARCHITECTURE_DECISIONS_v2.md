# UW-Issaquah Open Connector Architecture Decisions (v2)

**Version note:** a differently-structured v1 already exists at
`00_CONNECTORS/00_OPEN_CONNECTOR_ARCHITECTURE_DECISIONS.md` from a separate, concurrent
session. Per explicit project-owner instruction, this v2 does not replace or delete it —
both currently exist.

An issue is marked `DECIDED` here only when repository evidence or an explicit existing
project rule actually decides it (cross-referenced to
`00_SHARED_AUTONOMOUS_CONNECTOR_BUILD_STANDARD_v2.md` where the decision was made).
Everything else is `OPEN`, `RECOMMENDED` (a default suggested but not binding),
`DEFERRED`, or `BLOCKED`.

---

### D01 — Where is connector output JSON actually stored/published?

- **Question:** local filesystem, a future Hetzner host (like CDM), object storage, or
  something else?
- **Why it matters:** every other publication-lifecycle decision (§D of the build
  standard) depends on knowing the actual write target.
- **Current evidence:** this project has no provisioned production host at all — unlike
  CDM (which runs on a known, documented Hetzner box already shared with EspoCRM and
  n8n). No `deploy/` scripts, no hosting config, and no `package.json` exist yet in this
  repository.
- **Options:** (a) local filesystem path mirroring CDM's `/files/cdm-status-output`
  pattern; (b) a new Hetzner or equivalent host; (c) object storage (S3-compatible).
- **Advantages / risks:** (a) simplest, but not itself web-servable without a separate
  process; (b) matches CDM's proven pattern but requires provisioning a new host or
  sharing CDM's, with the resource-contention risk CDM itself already documented; (c)
  decouples storage from any single host but adds a new credential/service dependency.
- **Dependencies:** blocks §D's exact atomic-rename target path, §L's evidence storage
  path, and the entire Workflow 08 design.
- **Recommended default:** none — this is a genuine infrastructure decision for the
  project owner, not something research evidence can resolve.
- **Decision owner:** project owner.
- **Decision deadline or trigger:** before any connector reaches `PUBLICATION_VALIDATED`
  (build standard §Q).
- **Status:** OPEN.
- **Consequences of deferral:** all five 03-07 workstreams can still be *built* and
  *statically/live-validated* (§Q) without this decision, but none can reach
  `PUBLICATION_VALIDATED` or beyond.

### D02 — Canonical schema field-casing convention

- **Question:** snake_case or camelCase for the shared envelope?
- **Why it matters:** 03/05's research proposed camelCase; 04/06/07 proposed snake_case
  — a genuine, already-discovered split (see `UW_ISSY_NORMALIZED_SCHEMAS_03_07.md`).
- **Current evidence:** 3 of 5 workstream proposals already used snake_case; this
  project's existing JSON files (`SOURCE_REGISTRY.json` etc.) predominantly use
  snake_case field names; CDM's own experience (L11) shows an undecided casing split
  requires a permanent dual-accept shim if not fixed before implementation — CDM itself
  resolved its split toward camelCase, for its own reasons, which does not bind this
  project.
- **Options:** (a) snake_case; (b) camelCase; (c) leave undecided and accept both with a
  translation shim (CDM's own path, explicitly not recommended per L11's own lesson).
- **Advantages / risks:** (a) matches this project's majority existing convention, no new
  shim needed; (b) would require translating 4 of 5 workstreams' 03-07 proposals instead
  of 2; (c) permanent complexity tax, explicitly what L11 warns against.
- **Dependencies:** blocks all `NORMALIZED_SCHEMA.json` authoring.
- **Recommended default:** snake_case.
- **Decision owner:** project owner (recommendation stands unless overridden).
- **Decision deadline or trigger:** before any connector's `NORMALIZED_SCHEMA.json` is
  authored.
- **Status:** **DECIDED** — see build standard §E. Recorded here per the job's own
  requirement to track this specific question explicitly, even though it has already been
  resolved.
- **Consequences of deferral:** N/A — already decided.

### D03 — Atomic publication mechanism

- **Question:** stage → validate → atomic rename, or some other mechanism?
- **Status:** **DECIDED** — atomic stage/validate/rename, per build standard §D, directly
  grounded in CDM's own proven pattern (L04's fix) and the explicit rejection of "verify
  via public URL" as a substitute (L05).
- **Decision owner:** N/A (evidence-decided).
- **Consequences of deferral:** N/A — already decided.

### D04 — Last-known-good / historical archive retention count

- **Question:** how many historical versions of a connector's output are retained?
- **Why it matters:** unbounded retention grows storage indefinitely; too little
  retention limits post-incident diagnosis.
- **Current evidence:** CDM's site-level build retention keeps every build permanently
  under a timestamped directory (never auto-deleted) with a `builds/current` symlink and
  a rollback script that refuses when no valid candidate exists — but this is a
  site-build-level pattern, not evidence for connector-output-level retention
  specifically, and depends on D01's storage location.
- **Options:** (a) keep N most recent (e.g. 5 or 10); (b) keep everything, prune
  periodically; (c) keep everything, never prune (matches CDM's site-build precedent, but
  CDM's is a much lower-frequency artifact than a connector output that may update every
  15 minutes).
- **Advantages / risks:** (a) bounded storage, simplest; (b) needs a pruning job, another
  moving part; (c) storage grows fast for 15-minute-cadence connectors — CDM's own
  precedent doesn't directly transfer because of the cadence difference.
- **Dependencies:** D01 (storage location determines what's cheap/expensive to retain).
- **Recommended default:** keep the last 10 versions per connector as a starting point,
  revisit once real storage costs under D01 are known.
- **Decision owner:** project owner.
- **Decision deadline or trigger:** before any connector reaches `PRODUCTION_READY`.
- **Status:** OPEN.
- **Consequences of deferral:** connectors can still be built and validated; only
  long-running production operation is affected.

### D05 — Source-level vs. connector-level source-health file structure

- **Question:** one combined health file, or separate per-level files?
- **Status:** **DECIDED** — both the full envelope-embedded `source_health[]` and a
  generated public-safe `source_health.json` projection exist, generated from the same
  data (build standard §G), avoiding the duplication-drift risk implied by maintaining two
  independently.
- **Decision owner:** N/A (evidence-decided, from the source-evaluation fields already
  established across all 7 workstreams' registries).
- **Consequences of deferral:** N/A — already decided.

### D06 — Execution-evidence retention count/policy

- **Question:** how long are per-execution `execution_evidence.json` files kept?
- **Why it matters:** every execution should be auditable, but retaining every execution
  forever for a 15-minute-cadence connector is a lot of small files.
- **Current evidence:** CDM's execution-proof artifacts (L17) are created per significant
  validation milestone, not per every routine scheduled run — suggesting routine runs may
  not need individually-retained evidence files, only milestone runs (first live
  execution, each version's validation) do.
- **Options:** (a) retain evidence for every run; (b) retain evidence only for
  milestone/validation runs, plus a rolling window (e.g. last 24 hours) of routine runs;
  (c) retain a lightweight summary always, full evidence only on failure.
- **Recommended default:** (c) — always log a lightweight per-run summary line to the
  connector's own contribution to `00_PROJECT_BUILDLOG.md`-style tracking, but only
  persist a full `execution_evidence.json` artifact for milestone validations and any run
  that failed or was degraded.
- **Dependencies:** D01, D04.
- **Decision owner:** project owner.
- **Decision deadline or trigger:** before any connector reaches `ACTIVE` on a real
  schedule.
- **Status:** RECOMMENDED (not yet decided).
- **Consequences of deferral:** connectors can be built, tested, and manually validated
  without this being settled; it matters once a connector runs unattended on a real
  cadence.

### D07 — Workflow 08's blocking-vs-non-blocking connector-failure policy

- **Question:** may Workflow 08 build/publish the site when one connector is degraded or
  failed?
- **Why it matters:** CDM's own eight-lane pipeline spec treats this as an explicit,
  owner-approved policy choice, not an automatic default (L19) — "one site may deploy
  when the other fails only if the owner approves independent degraded publication."
- **Current evidence:** per-source and per-connector failure isolation is CDM's proven
  default (many examples in L19); but SITE-LEVEL "publish anyway with one connector
  degraded" is explicitly owner-gated in CDM's own architecture, not automatic.
- **Options:** (a) any connector failure blocks the whole site build; (b) a per-connector
  `critical: true|false` manifest flag determines blocking vs. non-blocking, with the
  owner setting each flag explicitly; (c) always publish with a visible degraded-source
  indicator, never block.
- **Advantages / risks:** (a) safest but means one flaky source (e.g. 06's
  HTML-scrape-based sources, the least stable of the five per the Implementation Matrix)
  could block the whole site; (b) matches CDM's own precedent and gives fine-grained
  control, but requires the owner to actually set each flag thoughtfully; (c) maximizes
  uptime but risks quietly shipping a degraded experience if the indicator isn't
  prominent.
- **Dependencies:** none blocking (can be decided independently of infra).
- **Recommended default:** (b), matching CDM's own precedent directly.
- **Decision owner:** project owner.
- **Decision deadline or trigger:** before Workflow 08 is designed (explicitly a later,
  separate job per this job's own boundaries).
- **Status:** RECOMMENDED.
- **Consequences of deferral:** no impact on 03-07 connector implementation itself; only
  relevant once Workflow 08 is built.

### D08 — Should connector-data publication be git-triggered (like V2's UI pipeline) or remain schedule-triggered (like V1's n8n producers), or both?

- **Question:** what triggers a connector's own publish step, and separately, what
  triggers the SITE rebuild once connector data changes?
- **Why it matters:** directly maps to the project owner's own standing preference that
  validated public-facing changes should push automatically — but CDM's own most recent
  evidence (L20) shows a working git-triggered pipeline for a UI shell that explicitly
  left live connector-data wiring out of scope, so there is no proven precedent to copy
  wholesale.
- **Current evidence:** V1's connector producers are n8n-schedule-triggered, decoupled
  from git entirely. V2 built a genuine git-push → GitHub Actions → Wrangler deploy
  pipeline for its static UI shell, proven working, but connector-data promotion was
  explicitly deferred out of that same pipeline (L20).
- **Options:** (a) connectors publish on their own n8n schedule (as CDM V1 does), and a
  SEPARATE process (either another schedule, or triggered by a successful connector
  publish) rebuilds/redeploys the site; (b) connector output changes are committed to a
  git repo, and the SAME git-push-triggers-CI pipeline that redeploys the UI also picks
  up fresh connector data; (c) a hybrid — connectors publish to their own store on their
  own schedule, and Workflow 08 runs on ITS OWN schedule (not git-triggered) specifically
  because live data updates aren't naturally git-commit-shaped events.
- **Advantages / risks:** (a) matches the proven, decoupled CDM V1 pattern, but means two
  independent trigger mechanisms to keep synchronized; (b) gives the "automatic push"
  feel the owner wants, but forces every 15-minute data update through a git commit,
  which is an unusual and heavy way to move frequently-changing data; (c) keeps
  connectors and site-build as two independently-scheduled but still fully-automatic
  (no manual step) pipelines — likely the best fit for "automatic" without misusing git
  as a data-transport mechanism.
- **Dependencies:** D01 (storage location) and the not-yet-started Workflow 08 design.
- **Recommended default:** (c) — automatic does not have to mean git-triggered; a
  schedule-triggered Workflow 08 that runs immediately after (or shortly after) connector
  publish windows achieves the owner's "no manual step required" goal without forcing
  frequent data changes through git commits. Static UI/code changes MAY still use a
  git-triggered pipeline (CDM V2's proven pattern) for that specific, much-lower-frequency
  category of change.
- **Decision owner:** project owner.
- **Decision deadline or trigger:** before Workflow 08 is designed (later job).
- **Status:** RECOMMENDED, explicitly addressing the project owner's standing
  auto-push preference without deploying anything as part of this job.
- **Consequences of deferral:** no impact on 03-07 connector implementation; matters at
  the Workflow 08 stage.

### D09 — Maximum concurrent connector executions / host capacity

- **Question:** how many of the seven connectors may run simultaneously?
- **Why it matters:** CDM's own documentation flags real resource-contention risk on a
  shared, modest-RAM host running multiple services simultaneously.
- **Current evidence:** no host is provisioned for this project yet, so no capacity
  figure exists to reason from.
- **Options:** (a) run all connectors concurrently, rely on n8n's own queueing; (b) cap
  concurrency explicitly (e.g. max 3 at once); (c) stagger schedules so overlaps are rare
  by design.
- **Recommended default:** none — genuinely blocked on infrastructure provisioning.
- **Dependencies:** D01.
- **Decision owner:** project owner.
- **Decision deadline or trigger:** before any host is provisioned for this project.
- **Status:** BLOCKED (on infrastructure provisioning, not on further research).
- **Consequences of deferral:** none until a host exists; cannot be resolved by more
  research in the meantime.

### D10 — Actual `binaryDataMode` of the eventual target n8n instance

- **Question:** filesystem mode (like CDM's instance, per L03) or another mode?
- **Why it matters:** directly determines whether the mode-independent binary-read helper
  (`getBinaryDataBuffer`) is strictly necessary or merely good practice.
- **Current evidence:** no n8n instance is provisioned for this project yet; CDM's own
  instance (a different, shared host) runs filesystem mode, which is suggestive but not
  proof for a not-yet-provisioned UW-Issy instance.
- **Recommended default:** implement using the mode-independent helper regardless (it
  works correctly under any binary data mode), removing the need to wait on this answer.
- **Decision owner:** project owner / whoever provisions the eventual n8n instance.
- **Decision deadline or trigger:** before any connector's readback-validation code is
  written.
- **Status:** OPEN, but low-urgency given the recommended default sidesteps needing the
  answer immediately.
- **Consequences of deferral:** none, if the recommended default (always use the
  mode-independent helper) is followed.

### D11 — Workflow versioning convention enforcement mechanism

- **Question:** how is the `vNNNN.TT_ConnectorNameConnector` naming convention actually
  enforced, not just documented?
- **Why it matters:** L09 shows a documented convention alone did not prevent debug-suffix
  contamination, a forbidden test-name reaching production-candidate status, and three
  divergent name lineages for one logical connector in CDM.
- **Current evidence:** this project's own naming convention is already documented in
  `00_PROJECT_RULES.md`; no automated enforcement exists yet because no workflow has been
  built.
- **Recommended default:** an automated static-validation check (build standard §K) that
  parses the exported workflow JSON's own name field and rejects anything not matching
  the convention, plus a separate cross-check against n8n's own active-workflow API to
  confirm the actually-scheduled workflow matches the intended canonical name.
- **Decision owner:** whoever implements the first connector's static-validation script.
- **Decision deadline or trigger:** before the first connector reaches
  `STATICALLY_VALIDATED`.
- **Status:** RECOMMENDED.
- **Consequences of deferral:** the exact CDM failure mode (L09) becomes possible again.

### D12 — Reconciling this v2 register (and the v2 build standard/lessons/mise-en-place) with the pre-existing v1 versions

- **Question:** which version becomes authoritative — this v2 set, the pre-existing v1
  set at `00_CONNECTORS/`, or a manually-merged third version?
- **Why it matters:** two structurally different, differently-located attempts at the
  same architecture standard currently coexist in this repository.
- **Current evidence:** the v1 set was committed at 2026-07-29 19:28:29 by a process this
  session could not identify with certainty (no corresponding build-log entry describing
  that work was found, despite this project's otherwise-consistent append-only build-log
  discipline for every other piece of work in this repository).
- **Options:** (a) adopt this v2 set as authoritative, archive or delete the v1 set; (b)
  adopt the v1 set as authoritative, discard this v2 set; (c) manually merge the stronger
  parts of each into one final version.
- **Recommended default:** none — this is explicitly a project-owner decision, not
  something either session can resolve unilaterally, per the project owner's own
  instruction for this job ("redo, do not replace... give them a version number").
- **Decision owner:** project owner.
- **Decision deadline or trigger:** before any coding agent begins implementation using
  either set as its instructions.
- **Status:** OPEN.
- **Consequences of deferral:** a future implementation session could pick up the wrong
  (or a stale) version if this isn't resolved first — this is the single highest-priority
  item in this entire register to close before implementation begins.

---

## Summary

12 decisions tracked: 3 `DECIDED` (D02, D03, D05), 6 `OPEN` (D01, D04, D09, D10, D12, and
D06/D07/D08 are `RECOMMENDED` not `OPEN` — recount: D01 OPEN, D04 OPEN, D09 BLOCKED, D10
OPEN, D12 OPEN), 4 `RECOMMENDED` (D06, D07, D08, D11), 1 `BLOCKED` (D09). None are marked
`DECIDED` without a direct citation to the build standard section that made the call, and
none are marked `DECIDED` merely because a recommendation seemed reasonable.

**Highest-priority open item: D12** (reconciling this v2 set with the pre-existing v1
set) — every other decision in this register only matters once one authoritative
architecture standard exists for the next coding agent to follow.
