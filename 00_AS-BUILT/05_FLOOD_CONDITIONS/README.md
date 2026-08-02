# 05_FLOOD_CONDITIONS — As Built

**n8n workflow:** `v0001.05_FloodConditionsConnector`, id `4RiNqOKD9BCZFH6P`, 56 nodes, `active: false`.
**Status:** Live-verified — the largest lane (10 sources), all landed real data on a successful run.

## Sources (10)

| Source | Fetches | Notes |
|---|---|---|
| USGS-01 | USGS gauge 12121600, stage/flow | |
| USGS-02 | USGS gauge 12120600, stage/flow | |
| USGS-03 | USGS gauge 12122000, stage/flow | |
| NWPS-01 | NOAA water prediction gauge ISSW1 | |
| NWPS-02 | NOAA water prediction gauge ISQW1 | |
| NWS-01 | NWS active alerts near the route | |
| ISS-01 | City of Issaquah flood page | |
| REDM-01 | Redmond ArcGIS traffic alerts | |
| KC-ROAD-01 | King County road alerts (ArcGIS) | |
| WSDOT-01 | WSDOT highway alerts | **Requires `WSDOT_TRAVELER_API_ACCESS_CODE`** — currently unset; treated as optional and non-blocking per architecture decision `DEC-007` |

## Output

`published/05_FLOOD_CONDITIONS/current.json` → pointer → real content at `published/05_FLOOD_CONDITIONS/05_FLOOD_CONDITIONS_published_<stamp>.json`.

## Known limitations / notable fixes

- All 10 `Land *` nodes called a `hashString()` helper that was referenced but never defined — real `ReferenceError` on live execution, invisible to static checks. Fixed by adding the same proven helper connector 01 uses.
- `route_relevance` on this lane's events has no classification/confidence-of-impact field at all, only a match-confidence for the geographic pairing — see the cross-lane note in `00_AS-BUILT/README.md`.
- Used a non-standard raw-landing subfolder convention; corrected to the shared `landings/` folder.
