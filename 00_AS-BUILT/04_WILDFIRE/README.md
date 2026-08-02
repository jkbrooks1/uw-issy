# 04_WILDFIRE — As Built

**n8n workflow:** `v0001.04_WildfireConnector`, id `w6xnelPQeRFZk8BG`, 36 nodes, `active: false`.
**Status:** Live-verified — passed on its first real execution, no live bugs found (built after the model-selection issue was corrected; see `00_PROJECT_BUILDLOG.md` for that history).

## Sources (5)

| Source | Fetches |
|---|---|
| NIFC-01 | WFIGS incident locations (ArcGIS, NIFC) |
| NIFC-02 | WFIGS interagency fire perimeters (ArcGIS, NIFC) |
| NWS-01 | NWS active alerts for route-relevant zones |
| NOAA-01 | NOAA HMS smoke polygon KML (date-stamped daily file) |
| KC-01 | King County unincorporated-area burn ban status |

## Output

`published/04_WILDFIRE/current.json` → pointer → real content at `published/04_WILDFIRE/04_WILDFIRE_published_<stamp>.json`.

## Known limitations

- `route_relevance` on this lane's events is a plain string (`route_wide` / `contextual_only`), not the `{classification: ...}` object shape used by lanes 01/02/06/07, and doesn't itself signal "confirmed impact" — see the cross-lane note in `00_AS-BUILT/README.md`.
- This is the connector that motivated the recovery/import work: it was the one lane whose local build never completed in an earlier session, and the one built with the wrong (mini) Codex model on the first attempt before being corrected and rebuilt.
