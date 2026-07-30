# UW–Issaquah Connector Mise En Place Assessment

Assessment date: Thursday, July 30, 2026

Scope:
- repository structure only
- no file moves or deletions performed
- minimal-change recommendation set

## 1. Current Observations

The repository already contains the expected research corpus and governance structure, but the implementation-side directories are partly overlapping:

- clear documentation roots already exist: `00_CONNECTORS`, `00_DOCS`, `00_PLANNING_DOCS`, `00_AS-BUILT`
- the canonical route location is clear: `data/route/UnivWA-Issaquah.gpx`
- implementation/runtime roots are not yet consolidated:
  - `data/monitoring`
  - `data/route-monitoring`
  - `ONGOING_ROUTE_MONITORING/data`
  - `public/data`
  - `scripts/route-monitoring`
  - `tests/fixtures`
  - `tests/route-monitoring-fixtures`
- app/deploy/build/worker/db/examples are present but mostly not yet populated in this project

## 2. Directory Classification

### Governance and design roots

| Path | Classification | Assessment |
| --- | --- | --- |
| `00_CONNECTORS/` | `KEEP` | canonical lane research and future shared connector docs root |
| `00_DOCS/` | `KEEP` | canonical cross-lane design/synthesis root |
| `00_PLANNING_DOCS/` | `KEEP` | valid work-order and planning root |
| `00_AS-BUILT/` | `KEEP` | valid future as-built root; currently placeholder-only by lane |

### Runtime and data roots

| Path | Classification | Assessment |
| --- | --- | --- |
| `data/route/` | `KEEP` | canonical route source and archive location |
| `data/monitoring/` | `REPURPOSE` | should become internal generated shared monitoring/config/runtime data only if needed |
| `data/route-monitoring/` | `CONSOLIDATE` | overlaps with `ONGOING_ROUTE_MONITORING/data` and should become the single internal connector-runtime tree if adopted |
| `ONGOING_ROUTE_MONITORING/` | `RENAME` | current name is descriptive but duplicates future runtime concepts already better expressed under `data/connectors/` or `data/route-monitoring/` |
| `public/data/` | `KEEP` | final site-consumed generated data should land here only through workflow 08 |

### Script and test roots

| Path | Classification | Assessment |
| --- | --- | --- |
| `scripts/` | `KEEP` | correct root for project scripts |
| `scripts/route-monitoring/` | `CONSOLIDATE` | overlaps conceptually with `ONGOING_ROUTE_MONITORING/workflows` and future connector runtime logic |
| `scripts/audit/` | `KEEP` | useful audit namespace |
| `scripts/lib/` | `KEEP` | useful shared-library namespace |
| `tests/fixtures/` | `CONSOLIDATE` | should become the general fixture root unless a strong reason for a second fixture tree remains |
| `tests/route-monitoring-fixtures/` | `CONSOLIDATE` | likely should become a subdirectory under a single `tests/fixtures/` tree |

### Site/app roots

| Path | Classification | Assessment |
| --- | --- | --- |
| `app/` | `KEEP` | valid site/app root |
| `build/` | `DEFER` | keep empty placeholder for now; final role depends on workflow-08 output strategy |
| `deploy/` | `DEFER` | keep placeholder; exact deployment strategy unresolved |
| `worker/` | `DEFER` | keep placeholder until it is clear whether a worker is truly needed |
| `db/` | `DEFER` | no current evidence that a database is needed for first connector wave |
| `examples/` | `REMOVE_LATER` | no current documented purpose in this project |
| `docs/` | `CONSOLIDATE` | overlaps with `00_DOCS`; should become either export/reference docs only or be folded conceptually into `00_DOCS` later |

## 3. Overlap Assessment

### 3.1 `data/monitoring` vs `data/route-monitoring` vs `ONGOING_ROUTE_MONITORING/data`

Current state:
- all three imply generated monitoring/runtime data
- none is yet clearly designated as the single implementation root

Recommendation:
- do not create a fourth parallel data root
- target one internal runtime tree only
- preferred target: `data/connectors/` for connector implementation artifacts, with `data/route/` remaining separate for route source

Classification:
- `data/monitoring`: `REPURPOSE`
- `data/route-monitoring`: `CONSOLIDATE`
- `ONGOING_ROUTE_MONITORING/data`: `RENAME`

### 3.2 `public/data` vs internal runtime data

Current state:
- `public/data` should be public site-consumption output
- it should not also become the lane-connector scratch or candidate directory

Recommendation:
- `public/data` remains publish-only
- lanes 01–07 should write internal candidate/published artifacts elsewhere
- workflow 08 alone should write site-facing `public/data`

Classification:
- `public/data`: `KEEP`

### 3.3 `build`, `deploy`, and `worker`

Current state:
- present but not yet substantively used

Recommendation:
- keep them as placeholders only
- do not grow them until workflow-08 architecture decisions are resolved

Classification:
- all three: `DEFER`

### 3.4 `tests/fixtures` vs `tests/route-monitoring-fixtures`

Current state:
- two fixture roots create needless ambiguity

Recommendation:
- future migration should standardize on `tests/fixtures/`
- route-monitoring-specific fixtures can become `tests/fixtures/route-monitoring/`

Classification:
- both current roots: `CONSOLIDATE`

### 3.5 `00_AS-BUILT` vs `00_DOCS` vs `docs`

Current state:
- `00_DOCS` is already the active canonical design/synthesis root
- `00_AS-BUILT` is clearly the future implementation record root
- `docs/` is redundant unless kept strictly for generated exports or public/reference docs

Recommendation:
- keep `00_DOCS` as canonical project docs
- reserve `00_AS-BUILT` for implementation-complete artifacts only
- treat `docs/` as non-canonical reference/export area if retained at all

Classification:
- `00_DOCS`: `KEEP`
- `00_AS-BUILT`: `KEEP`
- `docs`: `CONSOLIDATE`

## 4. Proposed Target Tree

This is a recommended target tree for later implementation, not a command to move files now.

```text
/
  00_CONNECTORS/
    00_*.md
    01_ROUTE_CONDITIONS/
    02_WEATHER/
    03_AIR_QUALITY/
    04_WILDFIRE/
    05_FLOOD_CONDITIONS/
    06_TRAIL_INFRASTRUCTURE_STATUS/
    07_GOVERNMENT_SAFETY_ALERTS/
  00_DOCS/
  00_PLANNING_DOCS/
  00_AS-BUILT/
  app/
  data/
    route/
    connectors/
      raw/
      normalized/
      candidate/
      published/
      last_known_good/
      health/
      evidence/
      quarantine/
      manifests/
      handoff/
      schemas/
  public/
    data/
  scripts/
    connectors/
    audit/
    lib/
  tests/
    fixtures/
      connectors/
      route-monitoring/
  build/
  deploy/
  worker/
```

## 5. New Directories Actually Required

Not to be created in this phase, but required later:

| Path | Classification | Why |
| --- | --- | --- |
| `data/connectors/raw/` | `CREATE` | raw landed artifacts |
| `data/connectors/normalized/` | `CREATE` | normalized lane outputs before candidate/published split |
| `data/connectors/candidate/` | `CREATE` | candidate artifacts |
| `data/connectors/published/` | `CREATE` | internal published lane outputs |
| `data/connectors/last_known_good/` | `CREATE` | explicit LKG storage |
| `data/connectors/health/` | `CREATE` | source-health and connector-health records if not colocated |
| `data/connectors/evidence/` | `CREATE` | execution evidence and validation results |
| `data/connectors/quarantine/` | `CREATE` | invalid or non-publishable artifacts |
| `data/connectors/manifests/` | `CREATE` | connector manifests and policy files |
| `data/connectors/handoff/` | `CREATE` | workflow-08 handoff records |
| `data/connectors/schemas/` | `CREATE` | JSON schemas and validators |
| `scripts/connectors/` | `CREATE` | future shared connector utilities |

## 6. Directories That Should Not Be Created Yet

| Path | Classification | Why |
| --- | --- | --- |
| `data/connectors/deployments/` | `DEFER` | deployment evidence path should be decided together with workflow-08 strategy |
| `data/connectors/cache/` | `DEFER` | no approved caching policy yet |
| `infra/` or `ops/` | `DEFER` | would create another parallel governance root without a current need |
| any second route-monitoring runtime tree | `DEFER` | existing overlap is already too high |

## 7. Minimal Migration Plan

Principle:
- preserve Git history
- do not break current references
- avoid parallel roots

Suggested order:
1. Approve the target runtime root and publication contract first.
2. Create `data/connectors/` only after the contract is approved.
3. Migrate future implementation outputs into `data/connectors/` rather than adding more under `ONGOING_ROUTE_MONITORING/` or `data/route-monitoring/`.
4. Once live implementation exists, repoint fixture and script references gradually:
   - `tests/route-monitoring-fixtures/` -> `tests/fixtures/route-monitoring/`
   - `scripts/route-monitoring/` -> `scripts/connectors/` or a clearly bounded subdirectory
5. After references are updated and stable, deprecate overlapping roots:
   - `ONGOING_ROUTE_MONITORING/`
   - `data/route-monitoring/`
   - possibly `docs/` if it remains redundant

## 8. Bottom Line

Minimum-change recommendation:
- keep the governance and research structure
- keep `data/route/` and `public/data/`
- do not build another parallel runtime tree
- consolidate future implementation work under a single `data/connectors/` root
- treat `ONGOING_ROUTE_MONITORING/`, `data/route-monitoring/`, `tests/route-monitoring-fixtures/`, and `docs/` as overlap areas to resolve later, not as templates to expand further now
