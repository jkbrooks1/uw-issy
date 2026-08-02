# 03_AIR_QUALITY — As Built

**n8n workflow:** `v0001.03_AirQualityConnector`, id `qlM2XIv2BbFSh3in`, 48 nodes, `active: false`.
**Status:** Live-verified — real degraded status from a genuine source HTTP 404 (Ecology monitor endpoint), correctly classified rather than silently swallowed.

## Sources (8)

| Source | Fetches | Notes |
|---|---|---|
| ECO-01 | WA Dept of Ecology hourly AQ monitoring (ArcGIS) | |
| ECO-02 | WA Dept of Ecology smoke forecast (ArcGIS) | |
| PSCAA-01 | Puget Sound Clean Air Agency network map | |
| PSCAA-02 | Puget Sound Clean Air Agency burn-ban status page | |
| AIRNOW-01 | AirNow API current observations by zip | **Requires `AIRNOW_API_KEY` env var**; falls back to a public endpoint when unset |
| AIRNOW-02 | AirNow reporting-area file | |
| WASMOKE-01 | WA Smoke Blog RSS | |
| NWS-AQ-01 | NWS air-quality alerts | |

## Output

`published/03_AIR_QUALITY/current.json` → pointer → real content at `published/03_AIR_QUALITY/03_AIR_QUALITY_published_<stamp>.json`.

Includes a computed `metadata.lane_summary`: `{ current_category, current_aqi_max, burn_ban_status, formal_alert_active, message }` — a genuine rollup computed from real observations/events, not placeholder content.

## Known limitations / notable fixes

- Validator originally required `data_status`/`freshness`/`manifest_ref`/`connector_health`/`validation_state` before the pipeline stage that actually computes them — guaranteed every run to be wrongly quarantined regardless of real data quality. Fixed to match the correct pipeline order.
- Validator also crashed outright (`Cannot read properties of undefined`) reading `metadata.lane_summary` before `metadata` was ever set. Fixed by actually computing `lane_summary` from real data using helper functions that existed in the code but were never called.
- Used a non-standard raw-landing subfolder convention; corrected to the shared `landings/` folder used by every other lane.
