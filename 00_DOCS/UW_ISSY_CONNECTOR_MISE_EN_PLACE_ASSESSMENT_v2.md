# UW-Issaquah Connector Mise En Place Assessment (v2)

**Version note:** a v1 of this exact filename already exists at this same path
(`00_DOCS/UW_ISSY_CONNECTOR_MISE_EN_PLACE_ASSESSMENT.md`), created by a separate,
concurrent session. Per explicit project-owner instruction, this v2 does not replace or
delete it — both currently exist at the same directory, distinguished by filename.

## Executive finding

This repository is **100% research-phase and 0% build-phase** across all seven
workstreams. Every one of the 01-07 connector folders contains complete or
near-complete research documentation (source registries, implementation recommendations,
schema proposals, test logs). **None contains a single implementation artifact**: no n8n
workflow JSON exists anywhere in this repository, `package.json` does not exist at the
root, and the scaffolded `app/`, `scripts/`, `tests/` directories are structurally present
but entirely empty. This is not a partial-build situation to triage — it is a clean,
well-documented starting line. The go/no-go recommendation below reflects that.

## Repository inventory

Top-level structure (confirmed by direct `find` at the time of this assessment):

```
00_AS-BUILT/            — per-workstream README stubs (7 folders, minimal content)
00_CONNECTORS/          — per-workstream research (7 folders, substantial) + 4 architecture
                          docs from the concurrent v1 session + 2 backup dirs (both empty)
00_DOCS/                — cross-workstream synthesis (9 files from this job's earlier
                          phase) + pre-existing project docs + this job's v2 deliverables
00_PLANNING_DOCS/       — one work-order document (02_WEATHER)
00_PROJECT_BUILDLOG.md  — append-only log, 1047 lines at time of writing
00_PROJECT_RULES.md, 00_PROJECT_STATUS.md, CLAUDE.md, AGENTS.md, GEMINI.md, README.md
app/, build/, db/, deploy/, docs/, examples/, worker/  — EMPTY scaffold directories
data/                   — canonical GPX + archive + monitoring/route-monitoring subdirs
ONGOING_ROUTE_MONITORING/ — data/logs/parsers/registry/workflows subdirs (not inspected
                          in depth this pass; out of scope for 03-07 connector assessment)
public/                 — canonical GPX copy + data/ subdir
scripts/, tests/        — EMPTY scaffold directories
```

Two untracked root-level zip files exist (`00_CONNECTORS.zip`, `00_DOCS.zip`) — these
appear to be backup/export snapshots, not part of the working tree's intended content.
Not modified or investigated further; flagged here for the project owner's awareness.

## Existing governance

`CLAUDE.md`, `AGENTS.md`, `00_PROJECT_RULES.md`, `00_PROJECT_STATUS.md` all read and
followed throughout this job and the preceding research cycle. Key rules already in force:
project separation from the France/CDM projects (explicit, and never violated per every
workstream's own self-check); canonical GPX at `data/route/UnivWA-Issaquah.gpx`; append-
only build log; complete-replacement-file convention (no partial patches); never invent
source coverage or route impact; validate every generated JSON file; preserve
last-known-good production data (stated as a rule well before any connector has actually
implemented it — currently aspirational, not yet evidenced).

## Existing connector maturity by workstream

| Workstream | Research complete | Source registry complete | Schema proposed | Workflow present | Static validation evidence | Live execution evidence | Publication evidence | Health contract | Last-known-good behavior | Build-log coverage | Reference-standard compliance | Current maturity | Next required action |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 01_ROUTE_CONDITIONS | Yes (PASS, 5 cycles) | Yes, 28 sources | No dedicated schema-proposal file (predates that convention) | No | No | No | No | Not formalized (predates ENV_AND_READINESS.md convention) | Discussed narratively only | Yes, extensive | N/A — standard didn't exist yet | RESEARCH_COMPLETE | Retrofit a `NORMALIZED_SCHEMA_PROPOSAL.md`-equivalent for consistency with 03-07, or explicitly grandfather it; then proceed to build phase per this standard |
| 02_WEATHER | Yes (PASS) | Yes, 8 sources | No dedicated schema-proposal file (predates that convention) | No | No | No | No | Not formalized | Discussed narratively only | Yes | N/A | RESEARCH_COMPLETE | Same retrofit note as 01; **selected reference-connector candidate — see readiness assessment below** |
| 03_AIR_QUALITY | Yes (PARTIAL) | Yes, 11 sources | Yes | No | No | No | No | Yes (ENV_AND_READINESS.md) | Discussed narratively only | Yes | N/A | RESEARCH_COMPLETE | Await reference-connector remediation, then build per standard |
| 04_WILDFIRE | Yes (PARTIAL) | Yes, 17 sources | Yes | No | No | No | No | Yes | Discussed narratively only | Yes | N/A | RESEARCH_COMPLETE | Same |
| 05_FLOOD_CONDITIONS | Yes (PARTIAL) | Yes, 23 sources | Yes | No | No | No | No | Yes | Discussed narratively only | Yes | N/A | RESEARCH_COMPLETE | Same — recommended first build order per Executive Summary |
| 06_TRAIL_INFRASTRUCTURE_STATUS | Yes (PASS) | Yes, 14 sources | Yes | No | No | No | No | Yes | Discussed narratively only | Yes | N/A | RESEARCH_COMPLETE | Same — recommended last build order (highest scrape-maintenance burden) |
| 07_GOVERNMENT_SAFETY_ALERTS | Yes (PARTIAL) | Yes, 24 sources | Yes | No | No | No | No | Yes | Discussed narratively only | Yes | N/A | RESEARCH_COMPLETE | Same |

**No workstream has crossed the line from research into any build-phase state.** This is
stated plainly rather than inferred from filenames alone — it was confirmed by directly
opening `scripts/`, `tests/`, `app/`, searching the entire repository for
`n8n-nodes-base` (zero matches), and confirming no `package.json` exists at the root.

## Existing schemas

03-07 each have a `NORMALIZED_SCHEMA_PROPOSAL.md` (design document with illustrative JSON,
not machine-checkable). None exist as an actual `.json` JSON Schema file anywhere in the
repository. 01/02 have no equivalent document at all — their schema thinking is folded
narratively into their `IMPLEMENTATION_RECOMMENDATION.md` files instead.

## Existing workflow assets

None. Zero n8n workflow JSON files exist anywhere in this repository (confirmed by direct
grep for `n8n-nodes-base` across all JSON files, repository-wide).

## Existing test assets

None. `tests/`, `tests/fixtures/`, `tests/route-monitoring-fixtures/` all exist as empty
directories.

## Existing scripts

None at the repository-root `scripts/` level (empty). One connector-level `scripts/`
directory exists (`00_CONNECTORS/05_FLOOD_CONDITIONS/scripts/`, untracked, created during
the research cycle) — its actual contents were not inspected in this pass since script
archiving was explicitly conditional ("if you create a standalone script") during that
cycle and most testing was one-off inline commands per each workstream's own
`SESSION_LOG.md`.

## Existing source registries

All 7 workstreams have a complete `SOURCE_REGISTRY.json` (89 sources total across 03-07
alone, per the already-merged `UW_ISSY_CONNECTOR_REGISTRY_03_07.json`; 28 more for 01; 8
more for 02). All validated as parseable JSON with consistent field structures within
each workstream (though not across workstreams — see the schema-casing and source-ID
namespace findings already documented in this job's earlier synthesis phase).

## Existing output/publication paths

None. No connector has ever written a real production output file — this repository has
no equivalent yet to CDM's `/files/cdm-status-output` path. Decision D01 in the companion
Open Decisions register tracks this as unresolved.

## Existing health/evidence artifacts

None as runtime artifacts. 03-07 have research-phase `ENV_AND_READINESS.md` files
containing per-source readiness *scoring* (a design-time assessment), which is a
different thing from a runtime `source_health[]` record produced by an actual execution —
no execution has ever happened, so no runtime health artifact exists.

## Existing build/deploy mechanisms

None. `build/`, `deploy/`, `worker/` are all empty scaffold directories. No
`package.json`, no CI configuration, no deploy script of any kind exists in this
repository yet.

## Gaps

1. No workstream has any implementation artifact (workflow, schema-as-code, tests,
   evidence) — this is the central, overarching gap.
2. 01 and 02 lack the newer `ENV_AND_READINESS.md`/`NORMALIZED_SCHEMA_PROPOSAL.md`/
   `OVERLAP_NOTES.md` files that 03-07 all have — a documentation-format inconsistency
   across the seven workstreams' research phase, not a build-phase gap.
3. No `package.json`, meaning no dependency management, build tooling, or test runner is
   even selected yet for this project — this blocks any code-level implementation
   (connector scripts, tests) starting from zero, not just n8n workflows.
4. No production host, hosting target, or deploy mechanism is provisioned (Decision D01).

## Conflicts

The central conflict this assessment must report: **a second, differently-structured set
of the same architecture documents this job also produces already exists**, committed at
2026-07-29 19:28:29, at `00_CONNECTORS/` instead of the `00_DOCS/` location this job's own
instructions specify, with no corresponding build-log entry describing that work (a
departure from this project's otherwise-universal append-only build-log discipline). This
is tracked as Decision D12 in the companion Open Decisions register and is the
single highest-priority item to resolve before any implementation begins.

## Obsolete or duplicate files

- `00_AS-BUILT/0X_*/README.md` files (7 total) contain only minimal placeholder-style
  content and substantially duplicate/predate the far more complete
  `00_CONNECTORS/0X_*/README.md` files. Not deleted or modified in this job (out of
  scope), but flagged as likely obsolete now that `00_CONNECTORS/` research is complete.
- `00_CONNECTORS/00_RUN_1_LIVE_BACKUP/` and `00_RUN_2_CANONICAL_BACKUP/` are both
  completely empty directories — likely intended as backup locations that were never
  populated, or were populated and then cleared. Not modified in this job.
- `00_CONNECTORS.zip` and `00_DOCS.zip` (untracked, root-level) are almost certainly
  redundant snapshots of the directories they're named after. Not modified in this job.

## Recommended repository changes

1. Resolve Decision D12 (which architecture-document set is authoritative) before
   anything else.
2. Decide whether to retrofit 01/02 with the newer research-file convention (schema
   proposal, env/readiness, overlap notes) for consistency, or explicitly document them
   as grandfathered.
3. Initialize `package.json` and select a dependency/test toolchain before any connector
   code (as opposed to n8n-workflow-only implementation) is written.
4. Decide Decision D01 (output storage location) before any connector attempts to reach
   `PUBLICATION_VALIDATED`.

## Reference-connector readiness

**`02_WEATHER`: `NOT_REFERENCE_READY`.**

02_WEATHER has the strongest *research* documentation of any workstream (a clean PASS
audit, the most heavily-tested source set among 01/02 with 55 live HTTP requests, and a
well-specified 8-source registry with all 6 MVP sources fully credential-free). But
"research complete" is not "reference-ready" — per this repository's direct inspection,
it has exactly the same zero build-phase artifacts as every other workstream. Naming it
the reference connector today would mean building the FIRST real implementation of
anything in this project under its name, not copying a proven pattern.

**Required remediation before 02_WEATHER can actually serve as a reference template**
(see build standard §S for full detail): build one real, minimal n8n workflow
implementing its 6 NWS-endpoint MVP set, walk it through static validation → import →
live execution → publication → readback (build standard §C/§K), and produce the first
real `CONNECTOR_MANIFEST.json`, `NORMALIZED_SCHEMA.json`, and `execution_evidence.json`
this project has ever had. Only after that remediation exists should any of the 03-07
workstreams be told to "follow the Weather pattern" — right now there is no pattern to
follow, only a research plan.

## Workflow 08 readiness

Not assessable yet — Workflow 08 depends on at least one connector reaching
`PUBLICATION_VALIDATED` to have anything real to consume, and on Decision D01 (storage
location) being resolved. Workflow 08 design work is explicitly out of scope for this job
and the next (per this job's own stated boundaries) — it should not begin until the
reference connector is remediated and the 03-07 build order is substantially underway.

## Go/no-go recommendation

**GO, with the decision-register items resolved first.** This repository has an unusually
clean starting position for implementation: complete, credential-free-MVP, live-tested
research for all five 03-07 workstreams, an established (if not yet enforced) governance
structure, and — now — a shared architecture standard grounded in real evidence from a
comparable, more mature sibling project (CDM). The one blocking prerequisite is Decision
D12 (reconciling this v2 architecture-document set with the pre-existing, differently-
structured v1 set) — implementation should not begin from two competing standards. Once
that is resolved, remediating `02_WEATHER` as the reference connector is the correct next
step, ahead of building any of 03-07 for real.
