# 01_ROUTE_CONDITIONS — As Built

**n8n workflow:** `v0001.01_RouteConditionsConnector`, id `RR7cLSV9oGngrJdA`, 32 nodes, `active: false`.
**Status:** Reference implementation — the first lane built, and the pattern every other lane copies. Live-executed multiple times over SSH, including deliberate fault injection to prove last-known-good serving.

## Sources (4)

| Source | Fetches | URL |
|---|---|---|
| KC-03 | HTML page | `kingcounty.gov/.../east-lake-sammamish` |
| REDM-01 | ArcGIS FeatureServer (JSON) | `gis.redmond.gov/.../Traffic/Alerts/FeatureServer?f=json` |
| ISS-03 | ArcGIS FeatureServer (JSON) | `apps.issaquahwa.gov/.../PWProjectsCurrentYearConstruction...` |
| ISS-01 | HTML page | `issaquahwa.gov/CivicAlerts.aspx?CID=20` |

## Output

`published/01_ROUTE_CONDITIONS/current.json` → pointer → real content at `published/01_ROUTE_CONDITIONS/01_ROUTE_CONDITIONS_published_<stamp>.json`.

Real example, live-verified: KC-03 currently reports an actual active closure (East Lake Sammamish Trail, culvert replacement, `route_impact_state: confirmed_route_impact`).

## What's real and proven

- Last-known-good read-and-serve: a source that fails live serves its most recent successful data, with the *original* fetch timestamp preserved and the *current* failure also recorded — never a false all-clear. Proven with real induced-fault testing, not just fixture tests.
- Failure classification distinguishes "checked, found nothing" from "never checked" from "checked, it failed."
- Full debugging history (DNS/network egress root-cause fix, LKG parameter bugs, source-failure classification bug) live-documented in `00_PROJECT_BUILDLOG.md`.

## Known limitations

- 4 sources only — the narrowest source set of any lane.
