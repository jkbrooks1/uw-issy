# API_AND_FEED_TEST_RESULTS.md — 05_FLOOD_CONDITIONS

All tests below were run from this local environment on Wednesday, July 29, 2026. Successful HTTP status alone was not treated as proof of usability.

## Test 1 — USGS site sweep within the route bounding box

- Endpoint: `https://waterservices.usgs.gov/nwis/site/?format=rdb&bBox=-122.35,47.54,-122.02,47.77&siteType=ST,LK&siteStatus=active`
- Status: `200`
- Content type: tab-delimited text
- Usable payload: yes
- Timestamp fields present: retrieval timestamp in header only
- Geographic identifiers present: site numbers, names, decimal lat/lon, HUC
- Result: six active surface-water or lake sites were identified near the route
- Key finding: the site sweep was useful for discovery, but only half of the nearby sites later returned usable IV data

## Test 2 — `USGS-01` — USGS IV, downstream Issaquah Creek (`12121600`)

- Endpoint: `https://waterservices.usgs.gov/nwis/iv/?format=json&sites=12121600&parameterCd=00060,00065`
- Status: `200`
- Content type: `application/json`
- Usable payload: yes
- Timestamp fields present: per-value `dateTime`
- Coordinates or geographic identifiers: site number in query and payload; route distance about 264 m
- Pagination behavior: none observed
- Cache / rate headers: `cache-control: max-age=900`; no numeric rate-limit headers
- Authentication: none
- Small sample: latest values were `21.5 cfs` and `3.79 ft` at `2026-07-29T12:15:00-07:00`
- Unattended suitability: yes
- Failure behavior: standard HTTP errors or zero time-series count
- Environment reachability: reachable from this local environment
- Bot / JS / geo restrictions: none observed

## Test 3 — `USGS-02` — USGS IV, upstream Hobart (`12120600`)

- Endpoint: `https://waterservices.usgs.gov/nwis/iv/?format=json&sites=12120600&parameterCd=00060,00065`
- Status: `200`
- Content type: `application/json`
- Usable payload: yes
- Timestamp fields present: per-value `dateTime`
- Coordinates or geographic identifiers: site number in query and payload; about 10.9 km from the route
- Pagination behavior: none observed
- Cache / rate headers: `cache-control: max-age=900`; no numeric rate-limit headers
- Authentication: none
- Small sample: latest values were `12.3 cfs` and `3.97 ft` at `2026-07-29T11:45:00-07:00`
- Unattended suitability: yes
- Failure behavior: standard HTTP errors or zero time-series count
- Environment reachability: reachable
- Bot / JS / geo restrictions: none observed

## Test 4 — `USGS-03` — USGS IV, Lake Sammamish (`12122000`)

- Endpoint: `https://waterservices.usgs.gov/nwis/iv/?format=json&sites=12122000`
- Status: `200`
- Content type: `application/json`
- Usable payload: yes
- Timestamp fields present: per-value `dateTime`
- Coordinates or geographic identifiers: site number in query and payload; about 2.2 km from the route
- Pagination behavior: none observed
- Cache / rate headers: `cache-control: max-age=900`
- Authentication: none
- Small sample: parameter `62614` returned `25.94 ft` above NGVD29 at `2026-07-29T12:15:00-07:00`
- Unattended suitability: yes
- Failure behavior: missing `62614` series
- Environment reachability: reachable
- Bot / JS / geo restrictions: none observed

## Test 5 — USGS IV unusable-nearby gauges

- Endpoints:
  - `...sites=12121570`
  - `...sites=12124490`
  - `...sites=12119690`
- Status: all `200`
- Content type: `application/json`
- Usable payload: no
- Timestamp fields present: none, because zero time-series objects were returned
- Coordinates or geographic identifiers: yes, from the discovery step
- Pagination behavior: none observed
- Authentication: none
- Unattended suitability: no
- Failure behavior: false-positive `200` with empty data
- Environment reachability: reachable
- Bot / JS / geo restrictions: none observed
- Conclusion: these gauges are not suitable connector inputs unless a different USGS service is later identified

## Test 6 — `NWPS-01` — NWPS gauge metadata (`ISSW1`)

- Endpoint: `https://api.water.noaa.gov/nwps/v1/gauges/ISSW1`
- Status: `200`
- Content type: `application/json`
- Usable payload: yes
- Timestamp fields present: `status.observed.validTime`, `status.forecast.validTime`
- Coordinates or geographic identifiers: `lid`, `usgsId`, `reachId`, lat/lon
- Pagination behavior: none observed
- Cache / rate headers: no numeric rate-limit headers observed
- Authentication: none
- Small sample:
  - observed `0.0222 kcfs / 3.8 ft` at `2026-07-29T17:15:00Z`
  - forecast `0.0252 kcfs / 3.8 ft` at `2026-08-02T00:00:00Z`
  - thresholds: action `1340 cfs`, minor `2000 cfs`, moderate `2300 cfs`, major `2800 cfs`
- Unattended suitability: yes
- Failure behavior: HTTP errors, missing `flood.categories`, or stale `validTime`
- Environment reachability: reachable
- Bot / JS / geo restrictions: none observed

## Test 7 — `NWPS-01` — NWPS stageflow and ratings (`ISSW1`)

- Endpoints:
  - `https://api.water.noaa.gov/nwps/v1/gauges/ISSW1/stageflow`
  - `https://api.water.noaa.gov/nwps/v1/gauges/ISSW1/ratings`
- Status: both `200`
- Content type: `application/json`
- Usable payload: yes
- Timestamp fields present: `issuedTime`, `validTime`, `generatedTime`
- Coordinates or geographic identifiers: inherit from gauge ID
- Pagination behavior: none observed
- Authentication: none
- Small sample:
  - observed series count `2819`
  - forecast series count `29`
  - ratings curve begins at stage `3.59 ft` / flow `10 cfs`
- Unattended suitability: yes
- Failure behavior: empty `data` arrays or impossible sentinel values
- Environment reachability: reachable
- Bot / JS / geo restrictions: none observed

## Test 8 — `NWPS-02` — NWPS upstream Hobart (`ISQW1`)

- Endpoint family:
  - `.../gauges/ISQW1`
  - `.../gauges/ISQW1/stageflow`
  - `.../gauges/ISQW1/ratings`
- Status: all `200`
- Content type: `application/json`
- Usable payload: yes, but observed-only
- Timestamp fields present: `status.observed.validTime`, `issuedTime`, `validTime`, `generatedTime`
- Coordinates or geographic identifiers: `lid`, `usgsId`, `reachId`, lat/lon
- Pagination behavior: none observed
- Authentication: none
- Small sample:
  - observed `3.97 ft / 0.012 kcfs` at `2026-07-29T18:45:00Z`
  - forecast section empty / sentinel
  - flood categories not defined
- Unattended suitability: yes as corroborating observation
- Failure behavior: empty observed data or stale issued time
- Environment reachability: reachable
- Bot / JS / geo restrictions: none observed

## Test 9 — `NWS-01` — NWS flood and flash-flood alerts

- Endpoints:
  - `https://api.weather.gov/alerts/active?event=Flood%20Warning&area=WA`
  - `https://api.weather.gov/alerts/active?event=Flood%20Watch&area=WA`
  - `https://api.weather.gov/alerts/active?event=Flash%20Flood%20Warning&area=WA`
  - `https://api.weather.gov/alerts/active?event=Flood%20Advisory&area=WA`
  - `https://api.weather.gov/alerts/active?point=47.6505,-122.3046`
- Status: all `200`
- Content type: `application/geo+json`
- Usable payload: yes; all queries returned valid empty collections rather than errors
- Timestamp fields present: top-level `updated`
- Coordinates or geographic identifiers: alert geometry when present; point query accepted
- Pagination behavior: none observed in the empty responses
- Cache / rate headers: `cache-control: public, max-age=5, s-maxage=5`; no numeric rate-limit headers
- Authentication: none
- Small sample: each statewide flood-specific query reported `0` features with updated time `2026-07-29T19:32:51Z`
- Unattended suitability: yes
- Failure behavior: HTTP errors, stale `updated`, malformed GeoJSON
- Environment reachability: reachable
- Bot / JS / geo restrictions: none observed

## Test 10 — `KCF-01` — King County flood overview pages

- Endpoints:
  - `https://kingcounty.gov/.../warning-system`
  - `https://flood.kingcounty.gov/`
  - `https://green2.kingcounty.gov/rivergagedata/gage-data.aspx?r=issaquah`
  - `https://flood.kingcounty.gov/river/4/`
- Status: all `200`
- Content type: HTML
- Usable payload: yes as reference/corroboration; no documented supported API contract exposed in the HTML itself
- Timestamp fields present:
  - overview pages: none obvious in the body
  - app-derived content: page shell only unless rendered client-side
- Coordinates or geographic identifiers: river-specific path / `r=issaquah` parameter
- Pagination behavior: none observed
- Authentication: none for the public pages
- Cache / headers:
  - `flood.kingcounty.gov` shell reachable
  - route pages are Next.js shells
- Unattended suitability: moderate for page diffing, weak as an API surface
- Failure behavior: page-shell changes or client bundle changes
- Environment reachability: reachable
- Bot / JS / geo restrictions: no hard block, but meaningful data lives behind client-side rendering

## Test 11 — `KCF-02` — King County app internal API

- Endpoint: `https://api.kingcounty.gov/floodwarning/v1/rivers`
- Status: `200`
- Content type: `application/json`
- Usable payload: yes for river list
- Timestamp fields present: `lastUpdated`, per-river `phaseDateTime`, per-gauge `gaugeDataDateTime`, `downloadDateTime`
- Coordinates or geographic identifiers: river IDs, USGS IDs, NWS IDs, gauge lat/lon
- Pagination behavior: none observed
- Authentication: APIM subscription key required by request header; no public issuance flow found
- Small sample:
  - Issaquah Creek thresholds: `6.5`, `7.5`, `8.5`, `9.0`
  - gauge grouping included Hobart, Issaquah Mouth, and Lake Sammamish
- Failure behavior: the obvious direct gauge path was unstable / unsupported in this session
- Environment reachability: reachable only by reproducing the app's own request pattern
- Bot / JS / geo restrictions: none beyond the key dependence
- Conclusion: informative, but not a supported production contract

## Test 12 — `ISS-01` — City of Issaquah flood page

- Endpoint: `https://www.issaquahwa.gov/flood`
- Status: `200`
- Content type: HTML
- Usable payload: yes
- Timestamp fields present: page `Last-Modified` header, but no live incident timestamp in the tested body excerpt
- Coordinates or geographic identifiers:
  - linked USGS Hobart gauge `12120600`
  - linked NWPS `ISSW1`
  - linked King County `river/4/`
- Pagination behavior: none observed
- Authentication: none
- Cache / headers: `cache-control: public, max-age=30`; `last-modified` present
- Unattended suitability: yes for occasional scraping/configuration checks, not as sole live status
- Failure behavior: HTML changes
- Environment reachability: reachable
- Bot / JS / geo restrictions: none observed

## Test 13 — `REDM-01` — Redmond Traffic Alerts ArcGIS service

- Endpoints:
  - root metadata
  - count queries for layers `0`, `1`, `2`
  - field queries for layers `1` and `2`
- Status: all `200`
- Content type: `application/json; charset=UTF-8`
- Usable payload: yes
- Timestamp fields present: `AlertStartDate`, `AlertEndDate`
- Coordinates or geographic identifiers: geometry-enabled layers and location descriptions
- Pagination behavior: standard ArcGIS behavior; no pagination needed for the tested small result sets
- Cache / headers: `cache-control: must-revalidate,max-age=0,public`; `etag` present; no numeric rate-limit headers
- Authentication: none
- Small sample:
  - layer 1 count `2`
  - layer 2 count `1`
  - example `NE 24th Paving and Utility Upgrades` on `West Lake Sammamish Parkway NE`
- Unattended suitability: yes
- Failure behavior: empty metadata or dead layer queries
- Environment reachability: reachable
- Bot / JS / geo restrictions: none observed

## Test 14 — `KC-ROAD-01` and `KC-ROAD-02` — King County road-alert ArcGIS layers

- Endpoints:
  - `KingCo_Road_Alerts` root
  - `nonKCRoadAlerts` root
  - `SammamishRoadAlerts_point` sample query
  - `SammamishRoadAlerts_line` sample query
- Status: all `200`
- Content type: `application/json`
- Usable payload:
  - `KingCo_Road_Alerts` metadata yes, current tested layer sample no active records
  - `SammamishRoadAlerts` yes structurally, but content is stale test data
- Timestamp fields present: `AlertStartDate`, `AlertEndDate`, `CreatedDate`, `ModifiedDate`
- Coordinates or geographic identifiers: geometry-enabled layers
- Pagination behavior: none needed in tested results
- Authentication: none
- Small sample:
  - `AlertTitle: Test`
  - `AlertDescription: This is only a test`
- Unattended suitability:
  - `KingCo_Road_Alerts`: yes, secondary only
  - `SammamishRoadAlerts`: not yet
- Failure behavior: stale test records or zero results
- Environment reachability: reachable
- Bot / JS / geo restrictions: none observed

## Test 15 — `WSDOT-01` — WSDOT Highway Alerts

- Endpoints:
  - docs root and help page
  - `GetAlertsAsJson`
  - `SearchAlertsAsJson` for SR-522, region 9, mileposts 0-25
- Status: all `200`
- Content type: JSON for live calls
- Usable payload: yes
- Timestamp fields present: `StartTime`, `EndTime`, `LastUpdatedTime`
- Coordinates or geographic identifiers: start/end roadway latitude, longitude, route, milepost
- Pagination behavior: none observed in tested arrays
- Cache / headers: `cache-control: private` on live alerts; no numeric rate-limit headers
- Authentication: AccessCode required
- Small sample:
  - statewide call returned live alerts
  - route-targeted SR-522 call returned `[]` on Wednesday, July 29, 2026
- Unattended suitability: yes when credential is available
- Failure behavior: auth errors or empty arrays where a broad test should contain data
- Environment reachability: reachable from this local environment with the existing project credential name
- Bot / JS / geo restrictions: none observed

## Test 16 — Bellevue, Sammamish, Seattle, and alert-signup pages

- Endpoints:
  - Bellevue flooding / alerts pages
  - Sammamish stormwater / alert sign-up pages
  - Seattle flood-safety page
  - AlertRedmond page
- Status: all `200`
- Content type: HTML
- Usable payload: yes for guidance, no for unattended feed extraction
- Timestamp fields present: generally none relevant to live incidents
- Coordinates or geographic identifiers: city scope only
- Pagination behavior: none observed
- Authentication: none for the pages, but user accounts required for the underlying notification systems
- Unattended suitability: no
- Failure behavior: n/a for live-monitoring use
- Environment reachability: reachable
- Bot / JS / geo restrictions: none observed

## Test 17 — Ecology flood-map viewer

- Endpoint: `https://apps.ecology.wa.gov/coastalatlas/tools/Flood.aspx`
- Status: `200`
- Content type: HTML
- Usable payload: partially; the page shell loads and clearly represents a map app, but no live connector-style flood event feed was identified from this environment
- Timestamp fields present: none relevant to live incidents
- Coordinates or geographic identifiers: map viewer only
- Pagination behavior: not applicable
- Authentication: none
- Unattended suitability: no for live monitoring; yes as a manual planning reference
- Failure behavior: broken JS map shell
- Environment reachability: reachable
- Bot / JS / geo restrictions: no hard block, but the value is still planning-only
