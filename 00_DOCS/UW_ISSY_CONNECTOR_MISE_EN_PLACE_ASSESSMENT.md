# UW–Issaquah Connector Mise En Place Assessment

Assessment date: Friday, July 31, 2026

Scope:
- documentation and repository mise-en-place only
- no file moves or deletions performed
- no n8n workflow created or modified
- approved implementation-root decisions now recorded

## 1. Current Observations

The repository already contains the expected research corpus and governance structure. The implementation-side roots are still overlapping, but the target runtime structure is now approved.

- canonical documentation roots already exist: `00_CONNECTORS`, `00_DOCS`, `00_PLANNING_DOCS`, `00_AS-BUILT`
- the canonical route location remains `data/route/UnivWA-Issaquah.gpx`
- existing overlap areas remain in place for later controlled migration:
  - `data/monitoring`
  - `data/route-monitoring`
  - `ONGOING_ROUTE_MONITORING/data`
  - `public/data`
  - `scripts/route-monitoring`
  - `tests/fixtures`
  - `tests/route-monitoring-fixtures`
- app/deploy/build/worker/db/examples remain present but are not changed by this task

## 2. Approved Runtime And Repository Contract

### 2.1 Approved Hetzner runtime root

The final Hetzner connector runtime root is approved:

`/srv/uw-issy-route-monitor`

Required artifact-class directories under that root:

- `raw/`
- `normalized/`
- `candidate/`
- `published/`
- `last_known_good/`
- `health/`
- `evidence/`
- `logs/`
- `quarantine/`
- `fixtures/`
- `schemas/`
- `manifests/`
- `handoff/`

Every artifact-class directory MUST contain lane-specific subdirectories.

Example:
- `/srv/uw-issy-route-monitor/raw/02_WEATHER/`

### 2.2 Approved local repository mirror

The approved local repository implementation mirror is:

```text
data/connectors/
  raw/
  normalized/
  candidate/
  published/
  last_known_good/
  health/
  evidence/
  logs/
  quarantine/
  fixtures/
  schemas/
  manifests/
  handoff/
```

Every `data/connectors/<artifact-class>/` directory MUST contain lane-specific subdirectories once executable connector work begins.

Related implementation roots approved in this task:

- `scripts/connectors/`
- `tests/fixtures/connectors/`

### 2.3 Publication trust boundary

- Connectors `01` through `07` MUST write only internal connector artifacts under the approved Hetzner runtime root and its local repository mirror
- connectors `01` through `07` MUST NOT write directly to `public/data/`
- workflow `08` alone owns site-facing artifact generation under `public/data/`
- connector-published artifacts and rider-facing public artifacts are separate trust boundaries

## 3. Directory Classification

### Governance and design roots

| Path | Classification | Assessment |
| --- | --- | --- |
| `00_CONNECTORS/` | `KEEP` | canonical lane research and shared connector-doc root |
| `00_DOCS/` | `KEEP` | canonical cross-lane design/synthesis root |
| `00_PLANNING_DOCS/` | `KEEP` | valid work-order and planning root |
| `00_AS-BUILT/` | `KEEP` | valid future implementation record root |

### Runtime and data roots

| Path | Classification | Assessment |
| --- | --- | --- |
| `data/route/` | `KEEP` | canonical route source and archive location |
| `data/connectors/` | `APPROVED_TARGET` | approved local connector-runtime mirror created in this task |
| `data/monitoring/` | `REPURPOSE_LATER` | existing overlap root; do not expand further |
| `data/route-monitoring/` | `CONSOLIDATE_LATER` | existing overlap root; do not expand further |
| `ONGOING_ROUTE_MONITORING/data` | `CONSOLIDATE_LATER` | existing overlap root; do not expand further |
| `public/data/` | `KEEP` | site-facing output owned only by workflow 08 |

### Script and test roots

| Path | Classification | Assessment |
| --- | --- | --- |
| `scripts/` | `KEEP` | correct root for project scripts |
| `scripts/connectors/` | `APPROVED_TARGET` | approved connector-implementation script namespace created in this task |
| `scripts/route-monitoring/` | `CONSOLIDATE_LATER` | existing overlap root; do not delete or rename in this task |
| `scripts/audit/` | `KEEP` | useful audit namespace |
| `scripts/lib/` | `KEEP` | useful shared-library namespace |
| `tests/fixtures/` | `KEEP` | general fixture root |
| `tests/fixtures/connectors/` | `APPROVED_TARGET` | approved connector fixture namespace created in this task |
| `tests/route-monitoring-fixtures/` | `CONSOLIDATE_LATER` | existing overlap root; do not delete or rename in this task |

### Site/app roots

| Path | Classification | Assessment |
| --- | --- | --- |
| `app/` | `KEEP` | valid site/app root |
| `build/` | `DEFER` | keep placeholder; workflow-08 build specifics still deferred |
| `deploy/` | `DEFER` | keep placeholder; deployment strategy still deferred |
| `worker/` | `DEFER` | keep placeholder until needed |
| `db/` | `DEFER` | no current evidence first connector wave needs a database |
| `examples/` | `DEFER` | unchanged by this task |
| `docs/` | `CONSOLIDATE_LATER` | overlapping doc root; unchanged by this task |

## 4. Approved Target Tree

This is now the approved implementation target tree for connector runtime structure. It is not a command to move existing overlapping directories in this task.

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
      logs/
      quarantine/
      fixtures/
      schemas/
      manifests/
      handoff/
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

## 5. Directories Created In This Task

Created as empty tracked placeholders only:

- `data/connectors/raw/`
- `data/connectors/normalized/`
- `data/connectors/candidate/`
- `data/connectors/published/`
- `data/connectors/last_known_good/`
- `data/connectors/health/`
- `data/connectors/evidence/`
- `data/connectors/logs/`
- `data/connectors/quarantine/`
- `data/connectors/fixtures/`
- `data/connectors/schemas/`
- `data/connectors/manifests/`
- `data/connectors/handoff/`
- `scripts/connectors/`
- `tests/fixtures/connectors/`

No existing files were moved into them in this task.

## 6. Controlled Migration Boundaries

This task does NOT move, delete, rename, or repoint any of the following:

- `data/monitoring`
- `data/route-monitoring`
- `ONGOING_ROUTE_MONITORING`
- `tests/route-monitoring-fixtures`
- `scripts/route-monitoring`
- `docs`

Those migrations remain later controlled tasks after executable connector work exists and path references can be updated intentionally.

## 7. Minimal Migration Plan

Approved next-order migration logic:

1. future connector implementation work should land under `data/connectors/`, `scripts/connectors/`, and `tests/fixtures/connectors/`
2. connectors `01` through `07` should publish only internal connector artifacts, never directly to `public/data/`
3. workflow `08` should remain the only site-facing publication workflow
4. once executable connector work exists and references are stable, the overlap roots can be consolidated deliberately in a later task

## 8. Bottom Line

The implementation root is now approved for documentation-baseline purposes, with the corrected pre-Weather runtime root, scheduling, retention, and n8n naming values now aligned before connector implementation.

- the canonical route remains under `data/route/`
- the approved connector-runtime mirror is `data/connectors/`
- workflow `08` alone owns `public/data/`
- overlapping legacy roots remain untouched for now
- the first executable connector build specification may proceed without further repository-structure guesswork
