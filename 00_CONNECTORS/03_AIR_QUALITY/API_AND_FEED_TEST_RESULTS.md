# API_AND_FEED_TEST_RESULTS.md — 03_AIR_QUALITY

All tests below were run on Wednesday, July 29, 2026 from this local
environment unless otherwise noted.

## Test 1 — AirNow public file product: `reportingarea.dat`

- URL: `https://files.airnowtech.org/airnow/today/reportingarea.dat`
- Status: `200`
- Content-Type: `binary/octet-stream`
- Payload usable: yes; live pipe-delimited rows with observation and forecast
  records
- Timestamp fields present: yes — observation date, forecast date, observation
  time, relative day flag
- Coordinates/geographic identifiers: reporting-area name, state, centroid
  lat/lon
- Pagination: none
- Rate limits: none documented in file-product docs
- Auth: none
- Sample saved: `sample-responses/airnow_reportingarea_seattle_bellevue_kent_valley.txt`
- Unattended capable: yes
- Failure behavior observed: none
- Reachable from local environment: yes
- Bot/JS/geo restrictions: none observed
- Key route result: only `Seattle-Bellevue-Kent Valley` produced live route-area
  rows during this test; this is useful but too coarse for sole route
  segmentation

## Test 2 — AirNow public file product: `cityzipcodes.csv`

- URL: `https://files.airnowtech.org/airnow/today/cityzipcodes.csv`
- Status: `200`
- Content-Type: `binary/octet-stream`
- Payload usable: yes; live pipe-delimited ZIP-to-reporting-area lookup rows
- Timestamp fields present: no explicit file timestamp inside rows
- Coordinates/geographic identifiers: reporting area, ZIP code, centroid lat/lon
- Pagination: none
- Rate limits: none documented
- Auth: none
- Sample saved: `sample-responses/airnow_cityzipcodes_route_excerpt.txt`
- Unattended capable: yes
- Failure behavior observed: none
- Reachable from local environment: yes
- Bot/JS/geo restrictions: none observed
- Key route result: route ZIPs mapped mostly to `Seattle-Bellevue-Kent Valley`
  with some southeast foothill ZIPs mapping to `Cascade foothills of King
  County`

## Test 3 — AirNow web service auth wall

- URL tested: `https://www.airnowapi.org/aq/observation/latLong/current/?format=application/json&latitude=47.65051&longitude=-122.30462&distance=25&API_KEY=INVALID`
- Status: `401`
- Content-Type: `application/json;charset=UTF-8`
- Payload usable: yes for verification; returned `Invalid API key`
- Timestamp fields present: not applicable
- Coordinates/geographic identifiers: request used live route start coordinates
- Pagination: not tested
- Rate limits: docs say per-key limits exist
- Auth: required
- Sample saved: no separate file; response was a one-line auth error
- Unattended capable: yes once key exists
- Failure behavior observed: clean JSON auth error
- Reachable from local environment: yes
- Bot/JS/geo restrictions: none observed
- Key route result: endpoint is live but credential-gated

## Test 4 — Ecology hourly-monitor service metadata

- URLs:
  - `https://gis.ecology.wa.gov/serverext/rest/services/AQ/AirQualityMonitoringHourlyResults/MapServer?f=pjson`
  - `https://gis.ecology.wa.gov/serverext/rest/services/AQ/AirQualityMonitoringHourlyResults/MapServer/0?f=pjson`
- Status: `200` in Python `requests`; default `curl` returned exit `60`
- Content-Type: `text/plain; charset=UTF-8`
- Payload usable: yes; live ArcGIS service metadata and field list
- Timestamp fields present: metadata no; layer fields include `DateTime_PST`
- Coordinates/geographic identifiers: service extent and point layer definition
- Pagination: ArcGIS record-window behavior documented by `maxRecordCount=2000`
- Rate limits: none published
- Auth: none
- Sample saved: no separate metadata file; live query outputs captured below
- Unattended capable: yes, subject to TLS behavior on target host
- Failure behavior observed: local `curl` CA validation failed while Python
  `requests` with default verification succeeded
- Reachable from local environment: yes, but CLI TLS behavior was inconsistent
- Bot/JS/geo restrictions: none observed
- Key route result: this is a real point-feature API with pollutant fields, not
  just a webpage map

## Test 5 — Ecology hourly-monitor route query

- URL family: `.../AirQualityMonitoringHourlyResults/MapServer/0/query`
- Query used:
  - `where=HourPriorToLatest=0`
  - route bbox `-122.3057,47.55207,-122.04414,47.75889`
  - `geometryType=esriGeometryEnvelope`
  - `inSR=4326`
  - `outFields=SiteId,SiteName,...`
- Status: `200`
- Content-Type: `text/plain; charset=UTF-8`
- Payload usable: yes; live route-near official monitor rows
- Timestamp fields present: `DateTime_PST`
- Coordinates/geographic identifiers: station IDs, names, addresses, point
  geometry
- Pagination: no pagination needed on the constrained route-latest query
- Rate limits: none documented
- Auth: none
- Sample saved: `sample-responses/ecology_hourly_route_latest.json`
- Unattended capable: yes
- Failure behavior observed: none on constrained query
- Reachable from local environment: yes
- Bot/JS/geo restrictions: none observed
- Key route result: 4 route-near official monitors returned for 12:00 PDT on
  July 29, 2026:
  - `Seattle-NE 127th` AQI 9
  - `Lake Forest Park-Town Center` AQI 16
  - `Bellevue-SE 12th` AQI 17
  - `Issaquah-Lake Sammamish` AQI 22

## Test 6 — Ecology smoke forecast metadata and route query

- URLs:
  - `https://gis.ecology.wa.gov/serverext/rest/services/AQ/SmokeForecast/MapServer/0?f=pjson`
  - `https://gis.ecology.wa.gov/serverext/rest/services/AQ/SmokeForecast/MapServer/0/query?...`
- Status: `200`
- Content-Type: `text/plain; charset=UTF-8`
- Payload usable: yes
- Timestamp fields present: `Date`, `ModifiedDate`
- Coordinates/geographic identifiers: polygon geometry; `SiteName`
- Pagination: none needed on route query
- Rate limits: none documented
- Auth: none
- Sample saved: `sample-responses/ecology_smokeforecast_route.json`
- Unattended capable: yes
- Failure behavior observed: none
- Reachable from local environment: yes
- Bot/JS/geo restrictions: none observed
- Key route result: route bbox intersected the summer `DisplayFlag=1` polygon
  `Seattle-Bellevue-Kent Valley` with `Good` values for `Day1`-`Day5`

## Test 7 — PSCAA technical-tool discovery pages

- URLs:
  - `https://pscleanair.gov/692/Technical-Tools`
  - `https://www.pscleanair.gov/570/Air-Quality-Sensor-Map`
  - `https://www.pscleanair.gov/168/Air-Quality-Burn-Ban-Status`
- Status: `200`
- Content-Type: `text/html; charset=utf-8`
- Payload usable: yes for discovery
- Timestamp fields present: none obvious in body
- Coordinates/geographic identifiers: none directly
- Pagination: none
- Rate limits: none documented
- Auth: none
- Sample saved: no
- Unattended capable: discovery only
- Failure behavior observed: none
- Reachable from local environment: yes
- Bot/JS/geo restrictions: none observed
- Key route result: official pages exposed the secure technical-tool URLs used
  in later tests

## Test 8 — PSCAA network-map station list and polygons

- URLs:
  - `https://secure.pscleanair.org/AirQuality/NetworkMap/GetStations`
  - `https://secure.pscleanair.org/AirQuality/NetworkMap/Geometries`
- Status: `200`
- Content-Type: `application/json; charset=utf-8`
- Payload usable: yes
- Timestamp fields present: no explicit timestamps
- Coordinates/geographic identifiers:
  - station IDs from `GetStations`
  - polygon coordinates and area names from `Geometries`
- Pagination: none
- Rate limits: none documented
- Auth: no login; bootstrap session cookie created automatically
- Sample saved:
  - `sample-responses/pscaa_getstations.json`
  - `sample-responses/pscaa_geometries.json`
- Unattended capable: yes, but only with cookie/session handling
- Failure behavior observed: none on these two endpoints
- Reachable from local environment: yes; default `curl` succeeded here
- Bot/JS/geo restrictions: none observed
- Key route result: confirmed a real backend, not only a visual map shell

## Test 9 — PSCAA station-detail endpoint (`Aqi`) without session bootstrap

- URL example: `https://secure.pscleanair.org/AirQuality/NetworkMap/Aqi?stationId=10050`
- Status: `200`
- Content-Type: `application/json; charset=utf-8`
- Payload usable: yes for failure characterization
- Timestamp fields present: not checked because request failed functionally
- Coordinates/geographic identifiers: requested by station ID
- Pagination: none
- Rate limits: none documented
- Auth: no login, but missing required session bootstrap
- Sample saved: no separate failure file
- Unattended capable: not statelessly
- Failure behavior observed: `{"success":false,"message":"Session was null, refresh the page."}`
- Reachable from local environment: yes
- Bot/JS/geo restrictions: session state required
- Key route result: proves PSCAA detail endpoint is not a clean stateless feed

## Test 10 — PSCAA station-detail endpoint (`Aqi`) after bootstrap

- Method:
  1. GET `https://secure.pscleanair.org/AirQuality/NetworkMap`
  2. retain ASP.NET session cookie
  3. GET `.../NetworkMap/Aqi?stationId=10073`
- Status: `200`
- Content-Type: `application/json; charset=utf-8`
- Payload usable: yes
- Timestamp fields present: station metadata, AQI category, QMU/pollutant detail
  present; no clearly exposed fetch timestamp in sampled fragment
- Coordinates/geographic identifiers: `StationId`, station name, address,
  latitude, longitude, county
- Pagination: none
- Rate limits: none documented
- Auth: session bootstrap only
- Sample saved: `sample-responses/pscaa_aqi_station_10073_lake_forest_park.json`
- Unattended capable: yes with cookie handling, but brittle
- Failure behavior observed: stateless call fails; cookie-backed call succeeds
- Reachable from local environment: yes
- Bot/JS/geo restrictions: session state required
- Key route result: detailed Lake Forest Park station JSON was retrievable once
  bootstrapped

## Test 11 — PSCAA `ThreeTile` endpoint

- URL tested: `https://secure.pscleanair.org/AirQuality/ThreeTile?stationName=Lake%20Forest%20Park-Town%20Center`
- Status: `500`
- Content-Type: none exposed in the truncated failure response
- Payload usable: no
- Timestamp fields present: not applicable
- Coordinates/geographic identifiers: station name input only
- Pagination: none
- Rate limits: none documented
- Auth: session-bootstrap alone did not make this query succeed
- Sample saved: no
- Unattended capable: not recommended as tested
- Failure behavior observed: server-side 500
- Reachable from local environment: yes
- Bot/JS/geo restrictions: unclear; may depend on an exact internal station-name
  convention
- Key route result: not all PSCAA backend routes are equally automation-friendly

## Test 12 — PSCAA burn-ban status page

- URL: `https://www.pscleanair.gov/168/Air-Quality-Burn-Ban-Status`
- Status: `200`
- Content-Type: `text/html; charset=utf-8`
- Payload usable: yes
- Timestamp fields present: none obvious
- Coordinates/geographic identifiers: burn-ban areas referenced, map linked
- Pagination: none
- Rate limits: none documented
- Auth: none
- Sample saved: no separate HTML save
- Unattended capable: yes via webpage scraping
- Failure behavior observed: none
- Reachable from local environment: yes
- Bot/JS/geo restrictions: none observed
- Key route result: repeated `No Ban` status blocks present on July 29, 2026

## Test 13 — Washington Smoke Blog RSS

- URL: `https://wasmoke.blogspot.com/feeds/posts/default?alt=rss`
- Status: `200`
- Content-Type: `application/rss+xml; charset=UTF-8`
- Payload usable: yes
- Timestamp fields present: `lastBuildDate`, per-item publication timestamps
- Coordinates/geographic identifiers: no geometry; place names in titles/body
- Pagination: feed-length-limited RSS only
- Rate limits: none documented
- Auth: none
- Sample saved: `sample-responses/wasmoke_rss.xml`
- Unattended capable: yes
- Failure behavior observed: none
- Reachable from local environment: yes
- Bot/JS/geo restrictions: none observed
- Key route result: strong official prose smoke-outlook feed, good for wildfire
  smoke attribution and context

## Test 14 — NWS Air Quality Alert API sample

- URL: `https://api.weather.gov/alerts/active?area=WA&event=Air%20Quality%20Alert`
- Status: `200`
- Content-Type: `application/geo+json`
- Payload usable: yes
- Timestamp fields present: `updated`, `sent`, `effective`, `onset`, `expires`
- Coordinates/geographic identifiers: alert IDs, `areaDesc`; geometry was `null`
  on the tested sample
- Pagination: none needed
- Rate limits: not formally documented in this cycle; response cache-control was
  `max-age=5`
- Auth: none
- Sample saved: `sample-responses/nws_air_quality_alerts_WA.json`
- Unattended capable: yes
- Failure behavior observed: none
- Reachable from local environment: yes
- Bot/JS/geo restrictions: none observed
- Key route result: route had no King County AQ alert during the test, but live
  WA sample data existed for eastern Washington and proved the official schema

## Test 15 — King County and Seattle guidance pages

- URLs:
  - `https://kingcounty.gov/en/dept/dph/health-safety/safety-injury-prevention/emergency-preparedness/personal-preparedness/wildfire-smoke`
  - `https://www.seattle.gov/wildfire-smoke-safety`
- Status: `200`
- Content-Type: `text/html; charset=utf-8`
- Payload usable: yes for guidance, no for live monitoring
- Timestamp fields present: none obvious in body
- Coordinates/geographic identifiers: city/county scope only
- Pagination: none
- Rate limits: none documented
- Auth: none
- Sample saved: no
- Unattended capable: not as live AQ connectors
- Failure behavior observed: none
- Reachable from local environment: yes
- Bot/JS/geo restrictions: none observed
- Key route result: both are good reference pages and bad monitoring connectors
