# UWISSY Workflow Rename Proof

Execution time: 2026-08-18 21:56 PDT / 2026-08-19 04:56 UTC through 2026-08-18 22:00 PDT / 2026-08-19 05:00 UTC.

Instance: `https://n8n.biketourfrance.net`, accessed through SSH alias `hetzner`; n8n container `n8n`; database container `n8n-db`; n8n version `2.22.6`.

Target folder: `UWISSY`, folder id `LaS9Q6sil9yCDzrV`.

Result: `PASS — all current UWISSY workflows now use the vXX.UWI_LANEXX naming standard.`

## Proven current workflows renamed in place

| Lane | Workflow id | Old name | New name | Version | State | Nodes |
|---|---|---|---|---|---|---:|
| 01 | `RR7cLSV9oGngrJdA` | `v0001.01_RouteConditionsConnector` | `v01.UWI_LANE01` | `01` | active | 32 |
| 02 | `fA0ZjWH3Itl83aPC` | `v0001.02_WeatherConnector` | `v01.UWI_LANE02` | `01` | active | 40 |
| 03 | `qlM2XIv2BbFSh3in` | `v0001.03_AirQualityConnector` | `v01.UWI_LANE03` | `01` | active | 48 |
| 04 | `w6xnelPQeRFZk8BG` | `v0001.04_WildfireConnector` | `v01.UWI_LANE04` | `01` | active | 36 |
| 05 | `4RiNqOKD9BCZFH6P` | `v0001.05_FloodConditionsConnector` | `v01.UWI_LANE05` | `01` | active | 56 |
| 06 | `poGV37VLUGIUxfGK` | `v0001.06_TrailInfrastructureStatusConnector` | `v01.UWI_LANE06` | `01` | active | 48 |
| 07 | `08g3JNwQPVSxUl2H` | `v0001.07_GovernmentSafetyAlertsConnector` | `v01.UWI_LANE07` | `01` | active | 48 |
| 08 | `uwIssy08RouteFacilities` | `v0001.08_RouteFacilitiesConnector` | `v01.UWI_LANE08` | `01` | inactive | 24 |
| 20 | `gp8WlccGwLydNWG7` | `v0001.20_StatusPublisherConnector` | `v01.UWI_LANE20` | `01` | inactive | 36 |
| 30 | `KhbGg5gBn7Rbne68` | `v0001.30_AlertMonitorConnector` | `v01.UWI_LANE30` | `01` | inactive | 41 |

## Method

`n8n update:workflow` on this release can only toggle active state, not rename workflows. The live rename therefore used a single SQL transaction that updated only `workflow_entity.name` for the ten workflows already proven to be the current contents of `UWISSY`. No workflow id, nodes, connections, settings, credentials, active state, project membership, or folder membership was changed.

## Verification

- `inventory-before.tsv` and `inventory-after.tsv` show the same ten workflow ids in `UWISSY`, with only the names changed.
- `pre_exports_clean/` and `post_exports_clean/` contain one live JSON export per workflow, cleaned of the n8n CLI warning line.
- `pre-export-sha256.tsv` records the SHA-256 of every pre-rename export.
- `post-compare.tsv` proves that, for all ten workflows, pre/post exports match when `name` is normalized out. Connections, settings, credential references, shared project metadata, active state, node count, and `versionCounter` all remained unchanged.
- `final-inventory.tsv` lists the final live names and canonical local JSON paths.
- `local-json-file-list.txt` lists the ten new canonical local JSON files.

## Local naming alignment

New canonical current files were created under `00_WORKFLOWS/`:

- `v01.UWI_LANE01.json`
- `v01.UWI_LANE02.json`
- `v01.UWI_LANE03.json`
- `v01.UWI_LANE04.json`
- `v01.UWI_LANE05.json`
- `v01.UWI_LANE06.json`
- `v01.UWI_LANE07.json`
- `v01.UWI_LANE08.json`
- `v01.UWI_LANE20.json`
- `v01.UWI_LANE30.json`

The old descriptive filenames were preserved as historical artifacts. Each new file's internal workflow `name` matches the filename stem exactly.

## Proof files

- `proof/rename-map.tsv`
- `proof/inventory-before.tsv`
- `proof/inventory-after.tsv`
- `proof/pre-export-sha256.tsv`
- `proof/pre_exports_clean/*.json`
- `proof/post_exports_clean/*.json`
- `proof/post-compare.tsv`
- `proof/final-inventory.tsv`
- `proof/local-json-file-list.txt`
- `proof/git-status-before.txt`
- `proof/pass-summary.txt`

Safe to begin Lane 01 report-out work: yes, from the workflow rename perspective. The live current workflow and local canonical JSON now use the new naming standard.
