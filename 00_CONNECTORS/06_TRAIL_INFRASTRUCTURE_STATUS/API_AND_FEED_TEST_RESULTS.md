# API_AND_FEED_TEST_RESULTS.md

All tests below were run on Wednesday, July 29, 2026 from this local environment. No credentials, cookies, or tokens were stored. No standalone sample files were saved; small sanitized examples are recorded inline because the useful evidence fit cleanly in this document.

## Test 1 — King County Burke-Gilman Trail page

- URL: `https://cd10-prod.kingcounty.gov/en/dept/dnrp/nature-recreation/parks-recreation/king-county-parks/trails/leafline-trails/burke-gilman`
- Result: `HTTP 200`
- Content type: `text/html; charset=utf-8`
- Actual usable data: yes, real page body
- Timestamp fields present: none observed in body
- Coordinates/geographic identifiers present: named trail only; no geometry
- Pagination: none
- Rate-limit headers/docs: none observed
- Authentication: none
- Small sample: page text explicitly says the trail follows the Lake Washington Ship Canal and north along Lake Washington
- Unattended capable: yes, but HTML parsing only
- Failure behavior: non-200 or missing body text
- Local environment reachability: yes
- Bot protection / JS issues: none observed
- Lane-06 finding: no active water/crossing alert at test time, but this remains a viable lane-06 input if a future culvert, shoreline, or crossing notice is posted

## Test 2 — King County Sammamish River Trail page

- URL: `https://cd10-prod.kingcounty.gov/en/dept/dnrp/nature-recreation/parks-recreation/king-county-parks/trails/leafline-trails/sammamish-river-trail`
- Result: `HTTP 200`
- Content type: `text/html; charset=utf-8`
- Actual usable data: yes
- Timestamp fields present: none observed
- Coordinates/geographic identifiers present: named trail only
- Pagination: none
- Rate-limit headers/docs: none observed
- Authentication: none
- Unattended capable: yes, HTML scraping only
- Failure behavior: non-200 or missing body text
- Local environment reachability: yes
- Bot protection / JS issues: none observed
- Lane-06 finding: no current water-infrastructure notice, but this page is still the official route segment source for future river-adjacent closures

## Test 3 — King County East Lake Sammamish Trail page

- URL: `https://cd10-prod.kingcounty.gov/en/dept/dnrp/nature-recreation/parks-recreation/king-county-parks/trails/leafline-trails/east-lake-sammamish`
- Result: `HTTP 200`
- Content type: `text/html; charset=utf-8`
- Actual usable data: yes
- Timestamp fields present: closure start date in body text
- Coordinates/geographic identifiers present: `Louis Thompson Rd NE`, `NE Inglewood Hill Rd`, `East Lake Sammamish Trail`
- Pagination: none
- Rate-limit headers/docs: none observed
- Authentication: none
- Small sample: the body says the trail section will be closed starting June 1, 2026 through the rest of 2026 so crews can replace aging culverts
- Unattended capable: yes, but text extraction and diffing are required
- Failure behavior: non-200 or page body missing
- Local environment reachability: yes
- Bot protection / JS issues: none observed
- Lane-06 finding: strongest direct MVP source; active route-impacting culvert closure confirmed

## Test 4 — City of Sammamish George Davis Creek project page

- URL: `https://www.sammamish.us/projects/george-davis-creek-fish-passage-and-storm-improvement-project/`
- Result: `HTTP 200`
- Content type: `text/html; charset=utf-8`
- Actual usable data: yes
- Timestamp fields present: none prominent in the extracted body
- Coordinates/geographic identifiers present: `East Lake Sammamish Regional Trail`, `East Lake Sammamish Shore Lane NE`, `East Lake Sammamish Parkway`
- Pagination: none
- Rate-limit headers/docs: none observed
- Authentication: none
- Small sample: body text says final improvements require King County to replace culverts routing George Davis Creek beneath the trail
- Unattended capable: yes, but as a slow-moving HTML project page
- Failure behavior: non-200 or major page-template change
- Local environment reachability: yes
- Bot protection / JS issues: none observed
- Lane-06 finding: excellent project-context source, but less operational than the dated news page

## Test 5 — City of Sammamish George Davis Creek project-start update

- URL: `https://www.sammamish.us/news/george-davis-creek-project-to-start-this-spring/`
- Result: `HTTP 200`
- Content type: `text/html; charset=utf-8`
- Actual usable data: yes
- Timestamp fields present: `Published: Mar 23, 2026`; `Modified: Mar 25, 2026`
- Coordinates/geographic identifiers present: `East Lake Sammamish Shore Lane Northeast`, `East Lake Sammamish Trail`, `East Lake Sammamish Parkway`
- Pagination: none
- Rate-limit headers/docs: none observed
- Authentication: none
- Small sample: body text says the City and King County will close a section of the trail, parkway, and Shore Lane to replace aging culverts, and install a short-span bridge
- Unattended capable: yes, with HTML extraction
- Failure behavior: non-200 or missing article body
- Local environment reachability: yes
- Bot protection / JS issues: none observed
- Lane-06 finding: best municipal corroboration of the current live ELST water-infrastructure closure

## Test 6 — City of Issaquah current-year public works construction service metadata

- URL: `https://apps.issaquahwa.gov/server/rest/services/General_Mapservices/PWProjectsCurrentYearConstructionPublic/MapServer?f=json`
- Result: `HTTP 200`
- Content type: `application/json; charset=UTF-8`
- Actual usable data: yes, live ArcGIS service metadata
- Timestamp fields present: service metadata only; not per record
- Coordinates/geographic identifiers present: polygon service with spatial reference `EPSG:2926`
- Pagination: service metadata shows `maxRecordCount: 2000`; layer metadata confirmed `supportsPagination: true`
- Rate-limit headers/docs: none observed
- Authentication: none
- Unattended capable: yes
- Failure behavior: non-200 or invalid JSON
- Local environment reachability: yes
- Bot protection / JS issues: none observed
- Lane-06 finding: strongest machine-readable city service for this lane

## Test 7 — City of Issaquah filtered record query

- URL pattern: `.../MapServer/0/query`
- Result: `HTTP 200`
- Content type: `application/json; charset=UTF-8`
- Actual usable data: yes, `6` returned features in the drainage / culvert filter
- Timestamp fields present: none per record in tested field set
- Coordinates/geographic identifiers present: polygon geometry plus `ProjectLocation`
- Pagination: not needed in this test; result count below `maxRecordCount`
- Rate-limit headers/docs: none observed
- Authentication: none
- Small sample:
  - `ProjectName`: `East Lake Sammamish Pkwy Drainage Improvement Project`
  - `CurrentYearStatus`: `Construction`
  - description names `two fish passable culverts` under `SE 51st St` and `East Lake Sammamish Trail`
- Unattended capable: yes
- Failure behavior: zero records could mean no active route-relevant water infrastructure, not service failure
- Local environment reachability: yes
- Bot protection / JS issues: none observed
- Lane-06 finding: confirmed direct on-route waterway/crossing project signal

## Test 8 — City of Redmond Traffic/Alerts service

- URL: `https://gis.redmond.gov/arcgis/rest/services/Traffic/Alerts/FeatureServer?f=json`
- Result: `HTTP 200`
- Content type: `application/json; charset=UTF-8`
- Actual usable data: yes
- Timestamp fields present: per-feature `AlertStartDate`, `AlertEndDate`
- Coordinates/geographic identifiers present: geometry-capable line layer; `LocationDescription`
- Pagination: layer metadata confirmed `maxRecordCount: 2000` and `supportsPagination: true`
- Rate-limit headers/docs: none observed
- Authentication: none
- Unattended capable: yes
- Failure behavior: non-200 or empty features array
- Local environment reachability: yes
- Bot protection / JS issues: none observed
- Lane-06 finding: operational and useful, but current records are generic bike lane and paving work rather than water/crossing infrastructure

## Test 9 — King County `KingCo_Bridges` service metadata

- URL: `https://gismaps.kingcounty.gov/arcgis/rest/services/RoadAlerts/KingCo_Bridges/MapServer?f=json`
- Result: `HTTP 200`
- Content type: `application/json;charset=UTF-8`
- Actual usable data: yes
- Timestamp fields present: none
- Coordinates/geographic identifiers present: point geometry, bridge names, structure IDs
- Pagination: service metadata shows `maxRecordCount: 1000`; layer metadata confirmed `supportsPagination: true`
- Rate-limit headers/docs: none observed
- Authentication: none
- Unattended capable: yes
- Failure behavior: non-200 or invalid JSON
- Local environment reachability: yes
- Bot protection / JS issues: none observed
- Lane-06 finding: useful facility-reference source, not a current closure source

## Test 10 — King County `KingCo_Bridges` bbox query

- Query area: canonical route bbox
- Result: `HTTP 200`
- Content type: `application/json;charset=UTF-8`
- Actual usable data: yes, `25` bridge points in bbox
- Timestamp fields present: none
- Coordinates/geographic identifiers present: point geometry and bridge IDs
- Pagination: not needed in this test
- Rate-limit headers/docs: none observed
- Authentication: none
- Small sample:
  - `NE 124th St Bridge` came back about `19 m` from the GPX
  - one weight-restricted bridge near the route bbox was `Evans Creek Bridge`
- Unattended capable: yes
- Failure behavior: empty result can be real
- Local environment reachability: yes
- Bot protection / JS issues: none observed
- Lane-06 finding: supports facility matching and crossing inventories, but not public status ownership

## Test 11 — King County `nonKCRoadAlerts` Sammamish layers

- URLs:
  - `.../MapServer/4/query`
  - `.../MapServer/5/query`
- Result: `HTTP 200` on both
- Content type: `application/json;charset=UTF-8`
- Actual usable data: structurally yes, operationally no
- Timestamp fields present:
  - `CreatedDate`
  - `ModifiedDate`
  - `AlertStartDate`
  - `AlertEndDate`
- Coordinates/geographic identifiers present: point and line geometry
- Pagination: not needed; only `1` feature per layer
- Rate-limit headers/docs: none observed
- Authentication: none
- Small sample:
  - `AlertTitle: Test`
  - `AlertDescription: This is only a test`
  - 2014-era dates
- Unattended capable: technically yes
- Failure behavior: live service can still return only stale test records
- Local environment reachability: yes
- Bot protection / JS issues: none observed
- Lane-06 finding: reject for production monitoring as of July 29, 2026

## Test 12 — Seattle Parks Burke-Gilman Trail Repairs page

- URL: `https://www.seattle.gov/parks/about-us/projects/burke-gilman-trail-repairs`
- Result: `HTTP 200`
- Content type: `text/html; charset=utf-8`
- Actual usable data: partially; page title and site chrome were reachable, but extracted body content remained noisy and not clearly operational
- Timestamp fields present: not cleanly extractable in this test
- Coordinates/geographic identifiers present: page title only in direct extraction
- Pagination: none
- Rate-limit headers/docs: none observed
- Authentication: none
- Unattended capable: weak
- Failure behavior: page may return a shell that is hard to parse deterministically
- Local environment reachability: yes
- Bot protection / JS issues: not blocked, but content extraction quality was poor
- Lane-06 finding: not strong enough for MVP or reliable automation

## Test 13 — Seattle DOT Ballard Multimodal Corridor / Missing Link page

- URL: `https://www.seattle.gov/transportation/projects-and-programs/programs/bike-program/burke-gilman-trail-missing-link-project`
- Result: `HTTP 200`
- Content type: `text/html; charset=utf-8`
- Actual usable data: yes, but operationally off-route for this GPX
- Timestamp fields present: not used
- Coordinates/geographic identifiers present: page text references Ballard corridor and Ship Canal area
- Pagination: none
- Rate-limit headers/docs: none observed
- Authentication: none
- Unattended capable: yes
- Failure behavior: non-200 or template change
- Local environment reachability: yes
- Bot protection / JS issues: none observed
- Lane-06 finding: rejects cleanly on route relevance; Ballard corridor is too far from the GPX

## Test 14 — USGS Lake Sammamish real-time lake level

- URL: `https://waterservices.usgs.gov/nwis/iv/?format=json&sites=12122000&parameterCd=62614&siteStatus=all`
- Result: `HTTP 200`
- Content type: `application/json`
- Actual usable data: yes
- Timestamp fields present:
  - request timestamp
  - observation `dateTime`
- Coordinates/geographic identifiers present:
  - site name
  - site number `12122000`
  - lat/lon `47.57646258, -122.1112134`
- Pagination: not applicable in tested response
- Rate-limit headers/docs: none observed
- Authentication: none
- Small sample:
  - variable: `Lake or reservoir water surface elevation above NGVD 1929, ft`
  - value: `25.90`
  - timestamp: `2026-07-29T11:15:00-07:00`
- Unattended capable: yes
- Failure behavior: non-200 or empty `timeSeries`
- Local environment reachability: yes
- Bot protection / JS issues: none observed
- Lane-06 finding: authoritative, but belongs in lane 05 ownership

## Test 15 — USACE Chittenden Locks / Lake Washington Ship Canal pages

- Tested URLs:
  - `https://www.nws.usace.army.mil/Missions/Civil-Works/Locks-and-Dams/Chittenden-Locks/`
  - related 2025 lake-level news pages under `nws.usace.army.mil`
- Result: `HTTP 403`
- Content type: `text/html`
- Actual usable data: no, direct local fetch blocked
- Timestamp fields present: none
- Coordinates/geographic identifiers present: not reachable in local response
- Pagination: not applicable
- Rate-limit headers/docs: not exposed
- Authentication: no credential requested; access denied appears infrastructure-level
- Failure behavior: `Access Denied` HTML response
- Local environment reachability: no
- Bot protection / geographic restrictions: yes, access denied via `AkamaiGHost`
- Lane-06 finding: blocked from this environment and not strong enough on route relevance to justify special handling

## Test 16 — WSDOT movable bridges and bridge-opening API docs

- Tested URLs:
  - `https://wsdot.wa.gov/travel/roads-bridges/movable-bridges-state-routes`
  - `https://wsdot.wa.gov/traffic/api/Documentation/class_traveler_a_p_i_1_1_controller_1_1_bridge_opening_controller.html`
  - `https://wsdot.wa.gov/traffic/api/`
  - guessed live endpoint `.../BridgeOpeningREST.svc/GetOpeningsAsJson` returned `404`
- Result:
  - docs pages: `HTTP 200`
  - guessed live endpoint: `HTTP 404`
- Content type: HTML
- Actual usable data: documentation only
- Timestamp fields present in docs: model fields include `OpeningTime` and `LastUpdateDate`
- Coordinates/geographic identifiers present: bridge location is documented conceptually, not returned live in this session
- Pagination: not established
- Rate-limit headers/docs: not documented in fetched pages
- Authentication: WSDOT traveler APIs use an access-code model
- Unattended capable: only after owner-provided access code and only if route relevance exists
- Failure behavior: documentation reachable even when live endpoint path is not obvious
- Local environment reachability: docs yes, live data unconfirmed
- Bot protection / JS issues: none observed
- Lane-06 finding: reject for this GPX because the route does not traverse a state-operated movable bridge
