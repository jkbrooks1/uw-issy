# UWISSY n8n Workflow Project/Folder Move Proof

Execution time: 2026-08-18 21:41 PDT / 2026-08-19 04:41 UTC

Instance: `https://n8n.biketourfrance.net` via SSH alias `hetzner`, container `n8n`, database container `n8n-db`, n8n version `2.22.6`.

Target object: existing n8n folder `UWISSY`, folder id `LaS9Q6sil9yCDzrV`, under project id `Y0Ygmqe59jevHoeV` (`John Brooks <john@biketourfrance.net>`), parent folder `Route_Status_Seven_Connectors`.

Method: no REST/API or CLI project/folder reassignment command was available in n8n CLI `2.22.6`. The exact schema was verified first: workflow folder membership is stored in `workflow_entity."parentFolderId"` and project sharing in `shared_workflow."projectId"`. All ten proven current workflows were already in the same project, so the only database update was `workflow_entity."parentFolderId" = 'LaS9Q6sil9yCDzrV'` for the ten proven workflow IDs. No workflow JSON, credentials, schedules, active state, tags, executions, or shared project rows were changed.

Database backup: full host-side `pg_dump -Fc` backup created before the update at `/tmp/20260819T043720Z_before_uwissy_folder_move_n8n.dump` on the Hetzner host, size 431M, SHA-256 `45d3203761f6a89186b919bd07bec9f9a3390b1df3f4a047b2f1eb4d56c20fdd`.

## Final UWISSY Contents

| Lane | Workflow id | Workflow name | State | Nodes | Prior folder | Final folder |
|---|---|---|---:|---:|---|---|
| 01 Route Conditions | `RR7cLSV9oGngrJdA` | `v0001.01_RouteConditionsConnector` | active | 32 | none/root | `UWISSY` |
| 02 Weather | `fA0ZjWH3Itl83aPC` | `v0001.02_WeatherConnector` | active | 40 | none/root | `UWISSY` |
| 03 Air Quality | `qlM2XIv2BbFSh3in` | `v0001.03_AirQualityConnector` | active | 48 | none/root | `UWISSY` |
| 04 Wildfire | `w6xnelPQeRFZk8BG` | `v0001.04_WildfireConnector` | active | 36 | none/root | `UWISSY` |
| 05 Flood Conditions | `4RiNqOKD9BCZFH6P` | `v0001.05_FloodConditionsConnector` | active | 56 | none/root | `UWISSY` |
| 06 Trail Infrastructure Status | `poGV37VLUGIUxfGK` | `v0001.06_TrailInfrastructureStatusConnector` | active | 48 | none/root | `UWISSY` |
| 07 Government Safety Alerts | `08g3JNwQPVSxUl2H` | `v0001.07_GovernmentSafetyAlertsConnector` | active | 48 | none/root | `UWISSY` |
| 08 Route Facilities | `uwIssy08RouteFacilities` | `v0001.08_RouteFacilitiesConnector` | inactive | 24 | none/root | `UWISSY` |
| 20 Status Publisher | `gp8WlccGwLydNWG7` | `v0001.20_StatusPublisherConnector` | inactive | 36 | none/root | `UWISSY` |
| 30 Alert Monitor | `KhbGg5gBn7Rbne68` | `v0001.30_AlertMonitorConnector` | inactive | 41 | none/root | `UWISSY` |

## Classification

| Expected workflow | Classification | Proven current id | Notes |
|---|---|---|---|
| `01_ROUTE_CONDITIONS` | `FOUND_DUPLICATES` | `RR7cLSV9oGngrJdA` | Old/staging copies left in `CDM`: `pelOd6E0sdu5mygf`, `BkZnr8GXZN44QOOP`, `1f898nUrd8fdQNbb`. |
| `02_WEATHER` | `FOUND_DUPLICATES` | `fA0ZjWH3Itl83aPC` | Old/staging copy left in `CDM`: `CvzPNlnWXrzZfYGP`. |
| `03_AIR_QUALITY` | `FOUND_DUPLICATES` | `qlM2XIv2BbFSh3in` | Old/staging copies left in `CDM`: `qQPYZ1eUdNsAwBNM`, `qWAlsffIyfEF8OL0`, `D2jq6dJuKQmmRVUp`, `i4QexQX1yXfqjRC1`, `6mtvJsEiGNOFEngG`, `zx4ksMf1gbiw2PY7`, `B3K3UPZWDuRgdHQo`, `hCjyk3wSTSTC7N1Q`, `wi3x7NfHxpFYHBKx`, `r3boxdxGt60mx9sr`. |
| `04_WILDFIRE` | `FOUND_DUPLICATES` | `w6xnelPQeRFZk8BG` | Old/staging copy left in `CDM`: `263acPaILiJmPW9m`. |
| `05_FLOOD_CONDITIONS` | `FOUND_DUPLICATES` | `4RiNqOKD9BCZFH6P` | Old/staging copy left in `CDM`: `D1Dsa02M3LAmzRfy`. |
| `06_TRAIL_INFRASTRUCTURE_STATUS` | `FOUND_ONE` | `poGV37VLUGIUxfGK` | No duplicate with matching lane name found. |
| `07_GOVERNMENT_SAFETY_ALERTS` | `FOUND_DUPLICATES` | `08g3JNwQPVSxUl2H` | Old/staging copy left in `CDM`: `0h9XYSxumCdZFYwh`. |
| `08_ROUTE_FACILITIES` | `FOUND_ONE` | `uwIssy08RouteFacilities` | Live ID determined from n8n. |
| `20_STATUS_PUBLISHER` | `FOUND_ONE` | `gp8WlccGwLydNWG7` | Moved, inactive state preserved. |
| `30_ALERT_MONITOR` | `FOUND_ONE` | `KhbGg5gBn7Rbne68` | Moved, inactive state and credential reference preserved. |

Missing workflows: none.

Ambiguous workflows: none.

Duplicates left in place: yes, old/staging copies listed above. They were not deleted, overwritten, renamed, activated, deactivated, or moved.

UW-Issy workflows still outside `UWISSY`: only the duplicate old/staging copies listed above; every proven current workflow is now in `UWISSY`.

## Verification

Before and after live exports were captured for all ten proven workflows. Cleaned export JSON validation passed for 10 before files and 10 after files. Export comparison showed unchanged workflow id, name, active state, node count, node hash, connection hash, settings hash, and credential-reference hash for every moved workflow.

Primary proof files:

- `proof/n8n-projects-before.tsv`
- `proof/n8n-folders-before.tsv`
- `proof/uw-issy-candidate-workflows-before.tsv`
- `proof/db-backup-before.txt`
- `proof/db-update-result.tsv`
- `proof/uw-issy-candidate-workflows-after.tsv`
- `proof/uwissy-folder-contents-after.tsv`
- `proof/export-content-comparison.tsv`
- `proof/live-export-json-validation-before.txt`
- `proof/live-export-json-validation-after.txt`
- `proof/live_exports_clean/*.before.json`
- `proof/live_exports_after_clean/*.after.json`

Result: `PARTIAL` because duplicate old/staging copies still exist outside `UWISSY`, even though every proven current UW-Issy workflow found in n8n was moved and verified.
