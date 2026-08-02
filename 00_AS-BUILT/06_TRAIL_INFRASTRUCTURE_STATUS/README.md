# 06_TRAIL_INFRASTRUCTURE_STATUS — As Built

**n8n workflow:** `v0001.06_TrailInfrastructureStatusConnector`, id `poGV37VLUGIUxfGK`, 48 nodes, `active: false`.
**Status:** Live-verified — real published artifact after fixing a validation-ordering bug that was quarantining every run.

## Sources (8)

| Source | Fetches |
|---|---|
| KC-01, KC-02, KC-03 | King County Parks trail pages |
| KC-04 | King County bridges (ArcGIS) |
| SAM-01, SAM-02 | City of Sammamish project pages (George Davis Creek fish-passage/storm project) |
| ISS-01 | City of Issaquah current-year construction projects (ArcGIS) |
| REDM-01 | Redmond ArcGIS traffic alerts |

## Output

`published/06_TRAIL_INFRASTRUCTURE_STATUS/current.json` → pointer → real content at `published/06_TRAIL_INFRASTRUCTURE_STATUS/06_TRAIL_INFRASTRUCTURE_STATUS_published_<stamp>.json`.

## Known limitations / notable fixes

- Validator required `published_at`, `data_status`, `freshness`, `manifest_ref`, and `connector_health` before the pipeline stage that computes them — every run was wrongly quarantined, including a stricter variant that treated the *legitimately null* `published_at` as a failure. Fixed to match the correct pipeline order.
- The `/files/uw-issy-connectors/quarantine/` directory tier didn't exist anywhere on the server for any lane until this lane's validation-failure path tried to write there for the first time — created for all 7 lanes as part of this fix, not just this one.
