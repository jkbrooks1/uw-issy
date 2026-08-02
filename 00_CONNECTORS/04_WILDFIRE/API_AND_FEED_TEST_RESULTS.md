# API_AND_FEED_TEST_RESULTS.md — 04_WILDFIRE

All tests below were run directly from this local environment on Wednesday, July 29, 2026. Commands used `curl` or Python's standard-library HTTP client. No cookies, secrets, or tokens were saved.

User-Agent used where appropriate:

```text
(BTF-UW-Issy-Wildfire-Research, john@biketourfrance.net)
```

## Test 1 — DNR wildfire danger service metadata

- URL tested: `https://gis.dnr.wa.gov/site3/rest/services/Public_Wildfire/WADNR_PUBLIC_WD_WildfireDanger/MapServer?f=json`
- Response status: `200`
- Content type: `application/json; charset=UTF-8`
- Usable data confirmed: Yes. Service metadata listed two layers, `Burn Bans` and `Wildfire Danger`.
- Timestamp fields present: none at the service root
- Coordinates / geographic identifiers present: yes, statewide service extent and per-layer spatial reference metadata
- Pagination behavior: standard ArcGIS service; maxRecordCount `1000`
- Rate-limit headers / docs: none found
- Authentication requirements: none
- Sample saved: `sample-responses/dnr_fire_danger_route_point.json`
- Unattended suitability: yes
- Failure behavior: would surface as ArcGIS error JSON or HTTP failure
- Reachable from this local environment: yes
- Cloudflare / bot / JS / geo restrictions: none observed

## Test 2 — DNR wildfire danger route-point query

- URL tested: `.../MapServer/0/query?geometry=-122.1103,47.6613&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelIntersects&outFields=*&returnGeometry=false&f=json`
- Response status: `200`
- Content type: `application/json; charset=UTF-8`
- Usable data confirmed: Yes. Returned one polygon match for `Central Lowlands FDRA`.
- Timestamp fields present: no formal timestamp field, but `NOTES_TXT` contained `Effective 7/17/2026 at 12:01 AM`
- Coordinates / geographic identifiers present: DNR area name and DNR region fields; request point itself was route-relevant
- Pagination behavior: single-record result
- Rate-limit headers / docs: none found
- Authentication requirements: none
- Sample saved: `sample-responses/dnr_fire_danger_route_point.json`
- Unattended suitability: yes, if route-point lookup is stable
- Failure behavior: ArcGIS error JSON or empty feature list
- Reachable from this local environment: yes
- Cloudflare / bot / JS / geo restrictions: none observed

## Test 3 — DNR current-fire layer metadata and counts

- URLs tested:
  - `https://gis.dnr.wa.gov/site3/rest/services/Public_Wildfire/WADNR_PUBLIC_WD_WildFire_Data/MapServer/1?f=json`
  - `.../query?where=1%3D1&returnCountOnly=true&f=json`
  - `.../query?where=1%3D1&geometry=-122.3057,47.55207,-122.04414,47.75889&geometryType=esriGeometryEnvelope&inSR=4326&spatialRel=esriSpatialRelIntersects&returnCountOnly=true&f=json`
- Response status: all `200`
- Content type: `application/json`
- Usable data confirmed: Yes. Metadata listed point fields including `INCIDENT_NM`, `FIREGCAUSE_LABEL_NM`, `DSCVR_DT`, `LAT_COORD`, `LON_COORD`. Statewide count was `750`; route bbox count was `0`.
- Timestamp fields present: `DSCVR_DT`, `CONTROL_DT`, `FIRE_OUT_DT`
- Coordinates / geographic identifiers present: `LAT_COORD`, `LON_COORD`, `COUNTY_LABEL_NM`, `REGION_NAME`
- Pagination behavior: ArcGIS query model; maxRecordCount `2000`
- Rate-limit headers / docs: none found
- Authentication requirements: none
- Sample saved: `sample-responses/dnr_current_fires_king_county_sample.json`
- Unattended suitability: yes, but only with distance filtering and manual review
- Failure behavior: ArcGIS error JSON or implausibly empty statewide count
- Reachable from this local environment: yes
- Cloudflare / bot / JS / geo restrictions: none observed

## Test 4 — DNR King County current-fire sample

- URL tested: `.../query?where=COUNTY_LABEL_NM%3D%27KING%27&outFields=INCIDENT_NM,COUNTY_LABEL_NM,FIREGCAUSE_LABEL_NM,FIREEVNT_CLASS_LABEL_NM,DSCVR_DT,LAT_COORD,LON_COORD,PROTECTION_TYPE,REGION_NAME,ACRES_BURNED&returnGeometry=false&f=json`
- Response status: `200`
- Content type: `application/json`
- Usable data confirmed: Yes. Returned 5 King County records including `WINDY GAP`, `309`, `NORTH FORK`, `LESTER`, `PALMER`.
- Timestamp fields present: `DSCVR_DT`
- Coordinates / geographic identifiers present: yes
- Pagination behavior: single-page result for this query
- Rate-limit headers / docs: none found
- Authentication requirements: none
- Sample saved: `sample-responses/dnr_current_fires_king_county_sample.json`
- Unattended suitability: yes, as corroboration only
- Failure behavior: ArcGIS error or empty feature list
- Reachable from this local environment: yes
- Cloudflare / bot / JS / geo restrictions: none observed
- Key finding: county-only matching is too loose for this route because all 5 King County incidents were outside the urban route corridor.

## Test 5 — NWS route-relevant alert queries

- URLs tested:
  - `https://api.weather.gov/alerts/active/zone/WAZ657`
  - `https://api.weather.gov/alerts/active/zone/WAZ654`
  - `https://api.weather.gov/alerts/active/zone/WAC033`
- Response status: all `200`
- Content type: `application/geo+json`
- Usable data confirmed: Yes. All three returned valid FeatureCollections with current `updated` timestamps and `features: []`.
- Timestamp fields present: `updated`
- Coordinates / geographic identifiers present: zone / county IDs in titles; route fire zone metadata verified separately via `https://api.weather.gov/zones/fire/WAZ657`
- Pagination behavior: none encountered
- Rate-limit headers / docs: no numeric rate limit found in docs
- Authentication requirements: none
- Sample saved: `sample-responses/nws_waz657_active_alerts.json`
- Unattended suitability: yes
- Failure behavior: HTTP error or malformed GeoJSON
- Reachable from this local environment: yes
- Cloudflare / bot / JS / geo restrictions: none observed

## Test 6 — WFIGS current incident locations

- URLs tested:
  - `https://services3.arcgis.com/T4QMspbfLg3qTGWY/ArcGIS/rest/services/WFIGS_Incident_Locations_Current/FeatureServer/0?f=json`
  - `.../query?where=1%3D1&returnCountOnly=true&f=json`
  - `.../query?where=IncidentName%20like%20%27%25Skyo%25%27...`
  - `.../query?where=IncidentName%20like%20%27%25Modrite%25%27...`
  - `.../query?where=POOState%3D%27US-WA%27&returnCountOnly=true&f=json`
  - `.../query?where=1%3D1&geometry=-122.3057,47.55207,-122.04414,47.75889&geometryType=esriGeometryEnvelope&inSR=4326&spatialRel=esriSpatialRelIntersects&returnCountOnly=true&f=json`
- Response status: `200` after one retry window; one earlier burst returned `429`
- Content type: `application/json; charset=utf-8`
- Usable data confirmed: Yes. Statewide current count `650`. Washington current count `45` using the correct `POOState = US-WA`. Route bbox count `0`. Named Washington wildfire records for `SKYO` and `Modrite` returned successfully.
- Timestamp fields present: `FireDiscoveryDateTime`, `ModifiedOnDateTime_dt`
- Coordinates / geographic identifiers present: `InitialLatitude`, `InitialLongitude`, `POOState`, `UniqueFireIdentifier`
- Pagination behavior: ArcGIS pagination supported
- Rate-limit headers / docs: none in headers, but the service returned explicit `429` JSON with `maximum allowed request units (57600) per Minute. Retry after 60 sec.`
- Authentication requirements: none
- Sample saved: `sample-responses/wfigs_incident_skyo.json`
- Unattended suitability: yes, with serialized / polite polling
- Failure behavior: HTTP `429` and ArcGIS error JSON when quota exceeded
- Reachable from this local environment: yes
- Cloudflare / bot / JS / geo restrictions: none observed

## Test 7 — WFIGS current fire perimeters

- URLs tested:
  - `https://services3.arcgis.com/T4QMspbfLg3qTGWY/ArcGIS/rest/services/WFIGS_Interagency_Perimeters_Current/FeatureServer/0?f=json`
  - `.../query?where=1%3D1&returnCountOnly=true&f=json`
  - `.../query?where=poly_IncidentName%20like%20%27%25Skyo%25%27...`
  - `.../query?where=poly_IncidentName%20like%20%27%25Modrite%25%27...`
  - `.../query?where=attr_POOState%3D%27US-WA%27&returnCountOnly=true&f=json`
  - `.../query?where=1%3D1&geometry=-122.3057,47.55207,-122.04414,47.75889&geometryType=esriGeometryEnvelope&inSR=4326&spatialRel=esriSpatialRelIntersects&returnCountOnly=true&f=json`
- Response status: all `200`
- Content type: `application/json; charset=utf-8`
- Usable data confirmed: Yes. Statewide current count `228`; Washington current count `28` using `attr_POOState = US-WA`; route bbox count `0`. Named Washington perimeter records for `Skyo` and `Modrite` returned successfully.
- Timestamp fields present: `poly_DateCurrent`, `attr_ModifiedOnDateTime_dt`, `attr_ContainmentDateTime`
- Coordinates / geographic identifiers present: polygon geometry plus state code and incident ID fields
- Pagination behavior: ArcGIS pagination supported
- Rate-limit headers / docs: same ArcGIS Online quota family as Test 6
- Authentication requirements: none
- Sample saved: `sample-responses/wfigs_perimeter_skyo.json`
- Unattended suitability: yes
- Failure behavior: ArcGIS error JSON or quota failures under burst traffic
- Reachable from this local environment: yes
- Cloudflare / bot / JS / geo restrictions: none observed

## Test 8 — InciWeb RSS

- URL tested: `http://inciweb.wildfire.gov/incidents/rss.xml`
- Response status: `200`
- Content type: `application/rss+xml; charset=utf-8`
- Usable data confirmed: Yes. Channel contained `50` items. Washington items included `WACOA Modrite Fire` and `WAGPF Skyo Fire`.
- Timestamp fields present: per-item narrative text contains `Last updated: 2026-07-29` style text
- Coordinates / geographic identifiers present: coordinates and `State: Washington` embedded in the description text
- Pagination behavior: fixed-size channel; no multi-page mechanism tested
- Rate-limit headers / docs: none found
- Authentication requirements: none
- Sample saved: `sample-responses/inciweb_rss_excerpt.xml`
- Unattended suitability: yes, as secondary enrichment
- Failure behavior: HTTP error or malformed RSS
- Reachable from this local environment: yes
- Cloudflare / bot / JS / geo restrictions: none observed

## Test 9 — NOAA HMS page and daily smoke / fire files

- URLs tested:
  - `https://ospo.noaa.gov/products/land/hms.html`
  - `https://satepsanone.nesdis.noaa.gov/pub/FIRE/web/HMS/Smoke_Polygons/KML/2026/07/hms_smoke20260729.kml`
  - `https://satepsanone.nesdis.noaa.gov/pub/FIRE/web/HMS/Smoke_Polygons/Shapefile/2026/07/hms_smoke20260729.zip`
  - `https://satepsanone.nesdis.noaa.gov/pub/FIRE/web/HMS/Fire_Points/KML/2026/07/hms_fire20260729.kml`
- Response status: all `200`
- Content type:
  - page: `text/html`
  - KML: `application/vnd.google-earth.kml+xml`
  - ZIP: `application/zip`
- Usable data confirmed: Yes. Smoke KML contained `33` placemarks. Fire KML contained `53799` placemarks. Smoke ZIP contained `.shp`, `.shx`, `.dbf`, `.prj`.
- Timestamp fields present: page displayed `updated Jul 29, 2026 19:08:00 GMT`; files exposed `Last-Modified`
- Coordinates / geographic identifiers present: yes, via KML / shapefile geometry
- Pagination behavior: one file per date
- Rate-limit headers / docs: none found
- Authentication requirements: none
- Sample saved: `sample-responses/hms_smoke_20260729_head.kml`
- Unattended suitability: yes, but daily URL construction is required
- Failure behavior: missing dated file or stale `Last-Modified`
- Reachable from this local environment: yes
- Cloudflare / bot / JS / geo restrictions: none observed

## Test 10 — NASA FIRMS API and map-service auth behavior

- URLs tested:
  - `https://firms.modaps.eosdis.nasa.gov/api/area/csv/INVALID_KEY/VIIRS_NOAA20_NRT/world/1`
  - `https://firms.modaps.eosdis.nasa.gov/mapserver/wms/fires/INVALID_KEY/?REQUEST=GetCapabilities`
- Response status:
  - area API: `400`
  - WMS GetCapabilities: `200`
- Content type:
  - area API: `text/plain;charset=UTF-8`
  - WMS GetCapabilities: `text/xml;charset=UTF-8`
- Usable data confirmed:
  - area API: no, body was plain text `Invalid MAP_KEY.`
  - WMS GetCapabilities: yes, service metadata and layer capability XML loaded
- Timestamp fields present: not the focus of this auth-wall test
- Coordinates / geographic identifiers present: WMS capabilities exposed layers, but no live route query was possible without a real key-backed data request
- Pagination behavior: not fully tested
- Rate-limit headers / docs: docs page states `5000 transactions / 10-minute interval`
- Authentication requirements: `MAP_KEY`
- Sample saved: none; docs and failure text were sufficient
- Unattended suitability: not until credentialed and separately tested
- Failure behavior: explicit `400 Invalid MAP_KEY.`
- Reachable from this local environment: yes
- Cloudflare / bot / JS / geo restrictions: none observed

## Test 11 — King County Fire Safety Burn Bans page

- URL tested: `https://kingcounty.gov/en/dept/local-services/governance-leadership/local-government-for-unincorporated-king-county/fire-safety`
- Response status: `200`
- Content type: `text/html; charset=utf-8`
- Usable data confirmed: Yes. The page exposed the current state and stage sections in directly retrievable HTML.
- Timestamp fields present: no explicit publish timestamp in the current status block; page source carried an HTML comment showing a last update marker from 2024, which is not reliable as operational freshness
- Coordinates / geographic identifiers present: countywide jurisdiction text only
- Pagination behavior: none
- Rate-limit headers / docs: none found
- Authentication requirements: none
- Sample saved: `sample-responses/king_county_burn_ban_excerpt.html`
- Unattended suitability: yes, with HTML parser and stale detection
- Failure behavior: HTTP error or missing `Current status` section
- Reachable from this local environment: yes
- Cloudflare / bot / JS / geo restrictions: none observed

## Test 12 — Eastside Fire & Rescue burn restriction alert

- URLs tested:
  - `https://eastsidefire-rescue.org/`
  - `https://eastsidefire-rescue.org/AlertCenter.aspx?CID=Alerts-Banner-4`
  - `https://eastsidefire-rescue.org/AlertCenter.aspx?AID=STAGE-1-BURN-RESTRICTION-IN-EFFECT-15`
- Response status: all `200`
- Content type: `text/html; charset=utf-8`
- Usable data confirmed: Yes. Both homepage and AlertCenter exposed `STAGE 1 BURN RESTRICTION IN EFFECT`.
- Timestamp fields present: none retrieved from the alert page body in this session
- Coordinates / geographic identifiers present: not in the alert item itself; service-area relevance verified separately from the official About EF&R page
- Pagination behavior: HTML pages only
- Rate-limit headers / docs: none found
- Authentication requirements: none
- Sample saved: `sample-responses/eastside_fire_alert_excerpt.html`
- Unattended suitability: limited but possible as HTML scraping
- Failure behavior: HTTP error or banner no longer exposing the active alert title
- Reachable from this local environment: yes
- Cloudflare / bot / JS / geo restrictions: none observed

## Test 13 — Alert King County and WA EMD alert hubs

- URLs tested:
  - `https://kingcounty.gov/alert`
  - `https://mil.wa.gov/alerts`
  - `https://mil.wa.gov/wildfire`
- Response status: all `200`
- Content type: `text/html`
- Usable data confirmed: Yes for human guidance, no for unattended production feeds
- Timestamp fields present: not material; these are hub / signup pages
- Coordinates / geographic identifiers present: county / statewide text only
- Pagination behavior: none
- Rate-limit headers / docs: none found
- Authentication requirements: end-user signup for the actual notification channels
- Sample saved: none; no machine payload to preserve
- Unattended suitability: no
- Failure behavior: not applicable for production ingestion
- Reachable from this local environment: yes
- Cloudflare / bot / JS / geo restrictions: none observed

## Test 14 — Washington State Parks alerts page

- URL tested: `https://parks.wa.gov/about/news-announcements/alerts`
- Response status: `200`
- Content type: `text/html; charset=UTF-8`
- Usable data confirmed: Yes. The page exposed current park alerts and statewide burn-ban level text.
- Timestamp fields present: item-level `Posted on` text in page content
- Coordinates / geographic identifiers present: park names, not route geometry
- Pagination behavior: single page observed
- Rate-limit headers / docs: none found
- Authentication requirements: none
- Sample saved: none; route relevance was low enough that preserving a sample was not useful
- Unattended suitability: technically yes, but not recommended for this route
- Failure behavior: HTTP error
- Reachable from this local environment: yes
- Cloudflare / bot / JS / geo restrictions: none observed

## Test 15 — Route-owner closure pages relevant to fire-caused trail closure

- URLs tested:
  - `https://kingcounty.gov/en/dept/dnrp/nature-recreation/parks-recreation/king-county-parks/trails/leafline-trails/east-lake-sammamish`
  - `https://www.seattle.gov/parks/parks/burke-gilman-trail`
  - `https://www.seattle.gov/parks/about-us/projects/burke-gilman-trail-repairs`
- Response status: all `200`
- Content type: `text/html`
- Usable data confirmed: partially
  - King County ELST page: yes, reachable and parseable as a trail-owner page
  - Seattle pages: reachable, but repair page still returned shell-heavy markup in direct fetches
- Timestamp fields present: not consistently available in retrievable body text
- Coordinates / geographic identifiers present: trail names and prose location text
- Pagination behavior: none
- Rate-limit headers / docs: none found
- Authentication requirements: none
- Sample saved: none; existing 01-route-conditions work already captures the DOM behavior in more detail
- Unattended suitability: only as secondary shared closure fallbacks
- Failure behavior: HTML template changes or empty shell-only responses
- Reachable from this local environment: yes
- Cloudflare / bot / JS / geo restrictions: no blocking, but Seattle templating still reduced body retrieval quality
