# SOURCE_REGISTRY.md — 04_WILDFIRE

Human-readable registry for the July 29, 2026 wildfire research cycle. `SOURCE_REGISTRY.json` is the canonical machine-readable source of truth; this file is the readable companion and uses the same `source_id` set.

Route: University of Washington -> Burke-Gilman Trail -> Sammamish River Trail -> Marymoor Park -> East Lake Sammamish Trail -> Issaquah

Reference route facts reused from already-completed project deliverables:

- Corrected canonical GPX distance: 33.83 miles
- Bounding box: lat 47.55207-47.75889 / lon -122.3057 to -122.04414
- Primary route jurisdictions: Seattle, Lake Forest Park / Kenmore edge, Bothell, Woodinville, Redmond, Sammamish, Issaquah, King County

## Summary Table

| Source ID | Name | Agency | Classification | Recommendation | Verification |
|---|---|---|---|---|---|
| DNR-01 | Current DNR Fire Statistics | WA DNR | DIRECT_API | SECONDARY | VERIFIED |
| DNR-02 | Wildfire Danger and Burn Bans polygons | WA DNR | DIRECT_API | SECONDARY | VERIFIED |
| DNR-03 | DNR Wildfire Portal ArcGIS Experience | WA DNR | UNSTRUCTURED_WEBPAGE | REJECT | PARTIALLY_VERIFIED |
| NWS-01 | NWS active alerts API | NOAA / NWS | DIRECT_API | MVP | VERIFIED |
| NIFC-01 | WFIGS Current Wildland Fire Locations | NIFC / WFIGS | DIRECT_API | MVP | VERIFIED |
| NIFC-02 | WFIGS Current Interagency Fire Perimeters | NIFC / WFIGS | DIRECT_API | MVP | VERIFIED |
| INCIWEB-01 | InciWeb incident RSS feed | InciWeb / NWCG | DOCUMENTED_FEED | SECONDARY | VERIFIED |
| NOAA-01 | NOAA HMS smoke polygons | NOAA OSPO / NESDIS | OPEN_DATA_DOWNLOAD | MVP | VERIFIED |
| NASA-01 | NASA FIRMS hotspots API / map services | NASA FIRMS | DIRECT_API | SECONDARY | BLOCKED |
| KC-01 | King County Fire Safety Burn Bans | King County Fire Marshal | STRUCTURED_WEBPAGE | MVP | VERIFIED |
| EFR-01 | Eastside Fire & Rescue burn restriction alert | Eastside Fire & Rescue | STRUCTURED_WEBPAGE | SECONDARY | VERIFIED |
| KC-02 | ALERT King County | King County OEM | EMAIL_OR_SMS_ALERT_ONLY | REJECT | VERIFIED |
| WAEMD-01 | WA EMD wildfire and alerts pages | WA EMD | MANUAL_REVIEW_ONLY | REJECT | VERIFIED |
| WSPARKS-01 | Washington State Parks alerts page | Washington State Parks | STRUCTURED_WEBPAGE | REJECT | VERIFIED |
| KC-TRAIL-01 | King County East Lake Sammamish Trail page | King County Parks | STRUCTURED_WEBPAGE | SECONDARY | VERIFIED |
| SEA-TRAIL-01 | Seattle Burke-Gilman trail and repairs pages | Seattle Parks and Recreation | UNSTRUCTURED_WEBPAGE | SECONDARY | PARTIALLY_VERIFIED |
| PULSEPOINT-01 | PulsePoint and similar local incident-system feeds | PulsePoint / local agencies | UNUSABLE | REJECT | PARTIALLY_VERIFIED |

## DNR-01 — Current DNR Fire Statistics

- Official source URL: `https://gis.dnr.wa.gov/site3/rest/services/Public_Wildfire/WADNR_PUBLIC_WD_WildFire_Data/MapServer/1`
- Documentation URL: `https://gis.dnr.wa.gov/site3/rest/services/Public_Wildfire/WADNR_PUBLIC_WD_WildFire_Data/MapServer`
- Access method: ArcGIS REST `/query` JSON
- Acquisition classification: `DIRECT_API`
- Machine-readable availability: Yes
- Authentication requirements: None
- Terms / usage constraints: Public state-government service; no explicit numeric rate limit found
- Geographic coverage: Washington incidents on DNR-protected lands or where DNR assisted
- Route points / sections covered: all sections by point-to-route buffer only
- Available fields: `INCIDENT_NM`, `COUNTY_LABEL_NM`, `FIREGCAUSE_LABEL_NM`, `FIREEVNT_CLASS_LABEL_NM`, `ACRES_BURNED`, `DSCVR_DT`, `CONTROL_DT`, `FIRE_OUT_DT`, `LAT_COORD`, `LON_COORD`, `PROTECTION_TYPE`, `REGION_NAME`
- Geometry availability: Point
- Update frequency: operational current layer
- Typical publication delay: not documented
- Historical availability: yes, via separate historical layers in the same service
- Pagination behavior: ArcGIS query model; maxRecordCount 2000
- Documented rate limits: none found
- Recommended freshness threshold: 30 minutes
- Failure detection method: HTTP error, ArcGIS error object, or implausibly empty statewide count
- Last-known-good suitability: Yes
- Fallback method: `NIFC-01`, `INCIWEB-01`
- Manual-review requirement: Yes
- Recommendation class: `SECONDARY`
- Verification status: `VERIFIED`
- Evidence URLs: see JSON
- Research notes: On July 29, 2026 the statewide layer contained 750 records, the route bbox contained 0, and King County contained 5 records that were all well southeast of the route. County-only matching is not acceptable.

## DNR-02 — Wildfire Danger and Burn Bans polygons

- Official source URL: `https://gis.dnr.wa.gov/site3/rest/services/Public_Wildfire/WADNR_PUBLIC_WD_WildfireDanger/MapServer`
- Documentation URL: `https://www.dnr.wa.gov/burn-restrictions`
- Access method: ArcGIS REST JSON plus human-readable DNR page
- Acquisition classification: `DIRECT_API`
- Machine-readable availability: Yes
- Authentication requirements: None
- Terms / usage constraints: DNR notes that local fire-district and county restrictions may also apply
- Geographic coverage: statewide DNR fire-danger rating areas and burn-ban polygons
- Route points / sections covered: all sections by point-in-polygon match
- Available fields: `FIREDANGER_AREA_NM`, `FIRE_DANGER_LEVEL_NM`, `BURN_BAN_LEVEL_NM`, `NOTES_TXT`, `DNR_REGION_NAME`, contact fields
- Geometry availability: Polygon
- Update frequency: operational current map
- Typical publication delay: not documented
- Historical availability: current-state polygons only
- Pagination behavior: ArcGIS query model; statewide feature count 23
- Documented rate limits: none found
- Recommended freshness threshold: 6 hours
- Failure detection method: HTTP error, ArcGIS error, or route-point query stops returning a polygon
- Last-known-good suitability: Yes
- Fallback method: `KC-01`, `EFR-01`
- Manual-review requirement: Yes before rider interpretation
- Recommendation class: `SECONDARY`
- Verification status: `VERIFIED`
- Evidence URLs: see JSON
- Research notes: A Marymoor-area route point intersected the `Central Lowlands FDRA` polygon with `High` fire danger and `Rule Burns are banned`, effective July 17, 2026.

## DNR-03 — DNR Wildfire Portal ArcGIS Experience

- Official source URL: `https://experience.arcgis.com/experience/6cdda73cf6154949a1fae76ccb2900a0`
- Documentation URL: `https://dnr.wa.gov/wildfire-resources/current-wildfire-incident-information/wildfire-portal`
- Access method: ArcGIS Experience web app
- Acquisition classification: `UNSTRUCTURED_WEBPAGE`
- Machine-readable availability: No stable feed identified directly from the shell
- Authentication requirements: None
- Terms / usage constraints: Public state-government page
- Geographic coverage: statewide dashboard view
- Route points / sections covered: visual context only
- Available fields: not directly queryable from the shell in this session
- Geometry availability: visual only
- Update frequency: not tested at feed level
- Typical publication delay: not tested
- Historical availability: dashboard only
- Pagination behavior: not applicable
- Documented rate limits: none found
- Recommended freshness threshold: do not automate from the shell
- Failure detection method: shell reachable but stable payload not retrieved
- Last-known-good suitability: No
- Fallback method: use `DNR-01` and `DNR-02` directly
- Manual-review requirement: Yes
- Recommendation class: `REJECT`
- Verification status: `PARTIALLY_VERIFIED`
- Evidence URLs: see JSON
- Research notes: Official and useful for human checking, but not the right automation primitive.

## NWS-01 — NWS active alerts API

- Official source URL: `https://api.weather.gov/alerts/active`
- Documentation URL: `https://www.weather.gov/documentation/services-web-api`
- Access method: HTTPS GET GeoJSON
- Acquisition classification: `DIRECT_API`
- Machine-readable availability: Yes
- Authentication requirements: None beyond descriptive `User-Agent`
- Terms / usage constraints: Open public API
- Geographic coverage: nationwide; route uses King County `WAC033` and fire weather zones `WAZ654` and `WAZ657`
- Route points / sections covered: all sections by zone or county match
- Available fields: `event`, `headline`, `description`, `instruction`, `severity`, `certainty`, `urgency`, `sent`, `effective`, `expires`, `affectedZones`, `geocode`, `geometry`
- Geometry availability: sometimes polygon, sometimes null
- Update frequency: event-driven
- Typical publication delay: near-real-time
- Historical availability: active endpoint only in this research cycle
- Pagination behavior: route queries were single-page FeatureCollections
- Documented rate limits: none found
- Recommended freshness threshold: 15 minutes
- Failure detection method: HTTP error, malformed FeatureCollection, stale `updated`
- Last-known-good suitability: Yes, with stale flag
- Fallback method: local burn-ban pages and route-owner closure pages
- Manual-review requirement: Yes for watch / warning publication
- Recommendation class: `MVP`
- Verification status: `VERIFIED`
- Evidence URLs: see JSON
- Research notes: Best official source for Red Flag Warnings and Fire Weather Watches. The route-relevant queries were all healthy on July 29, 2026 even though they returned zero active alerts.

## NIFC-01 — WFIGS Current Wildland Fire Locations

- Official source URL: `https://services3.arcgis.com/T4QMspbfLg3qTGWY/ArcGIS/rest/services/WFIGS_Incident_Locations_Current/FeatureServer/0`
- Documentation URL: `https://data-nifc.opendata.arcgis.com/pages/d6ef1367fadc4405b5f09c98e52ed972`
- Access method: ArcGIS REST `/query` JSON
- Acquisition classification: `DIRECT_API`
- Machine-readable availability: Yes
- Authentication requirements: None
- Terms / usage constraints: Public NIFC open data
- Geographic coverage: nationwide current wildland incidents, including wildfire and prescribed fire
- Route points / sections covered: all sections by point-to-route buffer
- Available fields: `IncidentName`, `IncidentTypeCategory`, `InitialLatitude`, `InitialLongitude`, `FireDiscoveryDateTime`, `ModifiedOnDateTime_dt`, `POOState`, `UniqueFireIdentifier`, `PercentContained`, `IncidentSize`, `DailyAcres`, `FireCause`
- Geometry availability: Point
- Update frequency: NIFC docs say every 5 minutes
- Typical publication delay: minutes
- Historical availability: current-only service; year-to-date and history services documented separately
- Pagination behavior: ArcGIS pagination; maxRecordCount 2000
- Documented rate limits: live testing hit ArcGIS Online request-unit 429 after a burst of queries
- Recommended freshness threshold: 15 minutes
- Failure detection method: HTTP error, ArcGIS error object, stale `ModifiedOnDateTime_dt`
- Last-known-good suitability: Yes, with stale flag
- Fallback method: `DNR-01`, `INCIWEB-01`
- Manual-review requirement: Yes, because `IncidentTypeCategory` includes `RX` prescribed fire
- Recommendation class: `MVP`
- Verification status: `VERIFIED`
- Evidence URLs: see JSON
- Research notes: Washington state count was 45 once the correct state code `US-WA` was used. Route bbox count was 0 on July 29, 2026.

## NIFC-02 — WFIGS Current Interagency Fire Perimeters

- Official source URL: `https://services3.arcgis.com/T4QMspbfLg3qTGWY/ArcGIS/rest/services/WFIGS_Interagency_Perimeters_Current/FeatureServer/0`
- Documentation URL: `https://data-nifc.opendata.arcgis.com/pages/d6ef1367fadc4405b5f09c98e52ed972`
- Access method: ArcGIS REST `/query` JSON
- Acquisition classification: `DIRECT_API`
- Machine-readable availability: Yes
- Authentication requirements: None
- Terms / usage constraints: Public NIFC open data
- Geographic coverage: nationwide current perimeters
- Route points / sections covered: all sections by polygon-to-route intersection or buffered intersection
- Available fields: `poly_IncidentName`, `attr_IncidentTypeCategory`, `attr_POOState`, `attr_UniqueFireIdentifier`, `poly_GISAcres`, `poly_DateCurrent`, `attr_ModifiedOnDateTime_dt`
- Geometry availability: Polygon
- Update frequency: NIFC docs say every 5 minutes
- Typical publication delay: minutes
- Historical availability: current-only service; year-to-date and full-history services documented separately
- Pagination behavior: ArcGIS pagination; maxRecordCount 2000
- Documented rate limits: same ArcGIS Online quota behavior as `NIFC-01`
- Recommended freshness threshold: 15 minutes
- Failure detection method: HTTP error, ArcGIS error object, stale `poly_DateCurrent`
- Last-known-good suitability: Yes
- Fallback method: `INCIWEB-01`, `DNR-01`
- Manual-review requirement: Yes
- Recommendation class: `MVP`
- Verification status: `VERIFIED`
- Evidence URLs: see JSON
- Research notes: Strongest perimeter source tested. Washington state count was 28 on July 29, 2026; route bbox count was 0.

## INCIWEB-01 — InciWeb incident RSS feed

- Official source URL: `http://inciweb.wildfire.gov/incidents/rss.xml`
- Documentation URL: `https://inciweb.wildfire.gov/state/washington/`
- Access method: RSS XML
- Acquisition classification: `DOCUMENTED_FEED`
- Machine-readable availability: Yes
- Authentication requirements: None
- Terms / usage constraints: Coordinates and perimeters in descriptions are approximate
- Geographic coverage: national notable incidents
- Route points / sections covered: all sections by free-text coordinate parsing and distance buffer
- Available fields: `title`, `link`, `description`
- Geometry availability: coordinates embedded in description text
- Update frequency: event-driven
- Typical publication delay: not documented
- Historical availability: recent items in RSS; deeper history via incident pages
- Pagination behavior: 50-item RSS channel observed
- Documented rate limits: none found
- Recommended freshness threshold: 30 minutes
- Failure detection method: HTTP error or malformed RSS
- Last-known-good suitability: Yes, as narrative fallback
- Fallback method: `NIFC-01`, `NIFC-02`
- Manual-review requirement: Yes
- Recommendation class: `SECONDARY`
- Verification status: `VERIFIED`
- Evidence URLs: see JSON
- Research notes: Live Washington items on July 29, 2026 included Modrite Fire and Skyo Fire.

## NOAA-01 — NOAA HMS smoke polygons

- Official source URL: `https://ospo.noaa.gov/products/land/hms.html`
- Documentation URL: dated files under the public NESDIS directory
- Access method: dated KML and shapefile downloads
- Acquisition classification: `OPEN_DATA_DOWNLOAD`
- Machine-readable availability: Yes
- Authentication requirements: None
- Terms / usage constraints: smoke extent, not direct health-impact measurement
- Geographic coverage: national daily smoke analysis
- Route points / sections covered: all sections by polygon-to-route intersection
- Available fields: daily KML / shapefile smoke polygons and HMS update timestamp
- Geometry availability: Polygon
- Update frequency: same-day, analyst-updated product
- Typical publication delay: same day
- Historical availability: excellent public archive by year / month / day
- Pagination behavior: one file per day
- Documented rate limits: none found
- Recommended freshness threshold: 24 hours
- Failure detection method: missing daily file or stale `Last-Modified`
- Last-known-good suitability: Yes, with stale flag
- Fallback method: `NWS-01` for official alerting; air-quality workstream for AQI interpretation
- Manual-review requirement: Yes
- Recommendation class: `MVP`
- Verification status: `VERIFIED`
- Evidence URLs: see JSON
- Research notes: On July 29, 2026 the dated smoke KML existed with 33 placemarks and the shapefile ZIP also existed with the full bundle.

## NASA-01 — NASA FIRMS hotspots API / map services

- Official source URL: `https://firms.modaps.eosdis.nasa.gov/api/area/`
- Documentation URL: `https://firms.modaps.eosdis.nasa.gov/mapserver/usfs/wfs-info/`
- Access method: area API CSV plus WMS / WFS
- Acquisition classification: `DIRECT_API`
- Machine-readable availability: Yes, but key-gated in practice
- Authentication requirements: `MAP_KEY`
- Terms / usage constraints: science data; false-positive and timeliness caveats apply
- Geographic coverage: national and global hotspot detections
- Route points / sections covered: all sections by point-to-route buffer
- Available fields: `latitude`, `longitude`, `acq_date`, `acq_time`, `confidence`, `frp`, `satellite`, `instrument`, `daynight`
- Geometry availability: Point
- Update frequency: docs say every 15 minutes
- Typical publication delay: minutes
- Historical availability: yes
- Pagination behavior: not fully tested without key
- Documented rate limits: 5000 transactions per 10-minute interval per docs
- Recommended freshness threshold: 15 minutes
- Failure detection method: HTTP 400 `Invalid MAP_KEY.`
- Last-known-good suitability: No until credentialed and retested
- Fallback method: `NIFC-01`, `NOAA-01`
- Manual-review requirement: Yes
- Recommendation class: `SECONDARY`
- Verification status: `BLOCKED`
- Evidence URLs: see JSON
- Research notes: Potentially useful for earliest hotspot detection, but not suitable as a public-facing trigger without credentialing and corroboration.

## KC-01 — King County Fire Safety Burn Bans

- Official source URL: `https://kingcounty.gov/en/dept/local-services/governance-leadership/local-government-for-unincorporated-king-county/fire-safety`
- Documentation URL: same
- Access method: HTML page
- Acquisition classification: `STRUCTURED_WEBPAGE`
- Machine-readable availability: No formal feed found
- Authentication requirements: None
- Terms / usage constraints: applies to unincorporated King County; page points riders to other agencies too
- Geographic coverage: unincorporated King County
- Route points / sections covered: route-wide county context
- Available fields: current stage, restriction text, contact details
- Geometry availability: None
- Update frequency: as needed
- Typical publication delay: not documented
- Historical availability: current page only
- Pagination behavior: none
- Documented rate limits: none found
- Recommended freshness threshold: 6 hours
- Failure detection method: HTTP error or loss of current-status section
- Last-known-good suitability: Yes
- Fallback method: `DNR-02`, `EFR-01`
- Manual-review requirement: No for raw stage extraction; yes for rider guidance wording
- Recommendation class: `MVP`
- Verification status: `VERIFIED`
- Evidence URLs: see JSON
- Research notes: Current status on July 29, 2026 was `Stage 1 Fire Safety Burn Ban`.

## EFR-01 — Eastside Fire & Rescue burn restriction alert

- Official source URL: `https://eastsidefire-rescue.org/`
- Documentation URL: `https://www.eastsidefire-rescue.org/27/About-EFR`
- Access method: homepage banner and AlertCenter page
- Acquisition classification: `STRUCTURED_WEBPAGE`
- Machine-readable availability: No working RSS confirmed
- Authentication requirements: None
- Terms / usage constraints: public local fire-agency page
- Geographic coverage: Issaquah, Sammamish, North Bend, Mercer Island, Woodinville and partner districts
- Route points / sections covered: Sammamish and Issaquah sections
- Available fields: alert title, AlertCenter ID, banner text
- Geometry availability: None
- Update frequency: as needed
- Typical publication delay: not documented
- Historical availability: AlertCenter pages exist; feed behavior unconfirmed
- Pagination behavior: HTML alert center
- Documented rate limits: none found
- Recommended freshness threshold: 6 hours
- Failure detection method: HTTP error or active alert title no longer exposed
- Last-known-good suitability: Yes
- Fallback method: `KC-01`, `DNR-02`
- Manual-review requirement: Yes
- Recommendation class: `SECONDARY`
- Verification status: `VERIFIED`
- Evidence URLs: see JSON
- Research notes: Live active title on July 29, 2026 was `STAGE 1 BURN RESTRICTION IN EFFECT`.

## KC-02 — ALERT King County

- Official source URL: `https://kingcounty.gov/alert`
- Documentation URL: `https://kingcounty.gov/en/dept/executive-services/health-safety/safety-injury-prevention/emergency-preparedness`
- Access method: signup page
- Acquisition classification: `EMAIL_OR_SMS_ALERT_ONLY`
- Machine-readable availability: No public feed found
- Authentication requirements: OnSolve-managed subscriptions
- Terms / usage constraints: resident-facing notification system
- Geographic coverage: King County
- Route points / sections covered: all sections by county membership
- Available fields: signup and subscription actions only
- Geometry availability: None public
- Update frequency: event-driven notifications
- Typical publication delay: not tested
- Historical availability: not public
- Pagination behavior: not applicable
- Documented rate limits: not applicable
- Recommended freshness threshold: do not automate
- Failure detection method: not applicable
- Last-known-good suitability: No
- Fallback method: `NWS-01`, trail-owner pages, county and local fire pages
- Manual-review requirement: Yes
- Recommendation class: `REJECT`
- Verification status: `VERIFIED`
- Evidence URLs: see JSON
- Research notes: Real official service, but not a usable unattended connector.

## WAEMD-01 — WA EMD wildfire and alerts pages

- Official source URL: `https://mil.wa.gov/wildfire`
- Documentation URL: `https://mil.wa.gov/alerts`
- Access method: HTML hub pages
- Acquisition classification: `MANUAL_REVIEW_ONLY`
- Machine-readable availability: No route-usable feed identified
- Authentication requirements: None for viewing; linked local systems often require signup
- Terms / usage constraints: public state-government pages
- Geographic coverage: statewide preparedness guidance
- Route points / sections covered: all sections as guidance only
- Available fields: partner links, evacuation-level explanations, local alert links
- Geometry availability: None
- Update frequency: as needed
- Typical publication delay: not documented
- Historical availability: current pages only
- Pagination behavior: none
- Documented rate limits: none found
- Recommended freshness threshold: manual reference only
- Failure detection method: not applicable
- Last-known-good suitability: No
- Fallback method: source-specific official feeds
- Manual-review requirement: Yes
- Recommendation class: `REJECT`
- Verification status: `VERIFIED`
- Evidence URLs: see JSON
- Research notes: Official and useful for preparedness, but not a direct feed.

## WSPARKS-01 — Washington State Parks alerts page

- Official source URL: `https://parks.wa.gov/about/news-announcements/alerts`
- Documentation URL: same
- Access method: HTML alerts page
- Acquisition classification: `STRUCTURED_WEBPAGE`
- Machine-readable availability: No feed tested
- Authentication requirements: None
- Terms / usage constraints: public state-government page
- Geographic coverage: statewide parks system
- Route points / sections covered: no route section directly depends on a state park facility
- Available fields: park name, alert type, posted date, burn-ban level, closure text
- Geometry availability: None
- Update frequency: as needed
- Typical publication delay: not documented
- Historical availability: current page only
- Pagination behavior: single page observed
- Documented rate limits: none found
- Recommended freshness threshold: manual reference only for this route
- Failure detection method: HTTP error
- Last-known-good suitability: No
- Fallback method: route-owner pages and county / local fire restrictions
- Manual-review requirement: Yes
- Recommendation class: `REJECT`
- Verification status: `VERIFIED`
- Evidence URLs: see JSON
- Research notes: Useful statewide alert page, but outside this route's core property ownership.

## KC-TRAIL-01 — King County East Lake Sammamish Trail page

- Official source URL: `https://kingcounty.gov/en/dept/dnrp/nature-recreation/parks-recreation/king-county-parks/trails/leafline-trails/east-lake-sammamish`
- Documentation URL: same
- Access method: HTML trail page
- Acquisition classification: `STRUCTURED_WEBPAGE`
- Machine-readable availability: No formal feed
- Authentication requirements: None
- Terms / usage constraints: public county page
- Geographic coverage: ELST corridor
- Route points / sections covered: Redmond, Sammamish, Issaquah ELST sections
- Available fields: heading text, closure paragraphs, prose dates, cross-street names
- Geometry availability: None on the page itself
- Update frequency: as needed
- Typical publication delay: not documented
- Historical availability: current page only
- Pagination behavior: none
- Documented rate limits: none found
- Recommended freshness threshold: 6 hours if used directly
- Failure detection method: HTTP error or unparseable body text
- Last-known-good suitability: Yes
- Fallback method: normalized closure output from workstreams `01_ROUTE_CONDITIONS` and `06_TRAIL_INFRASTRUCTURE_STATUS`
- Manual-review requirement: Yes
- Recommendation class: `SECONDARY`
- Verification status: `VERIFIED`
- Evidence URLs: see JSON
- Research notes: Authoritative route-owner closure page, but a shared source surface rather than a wildfire-primary feed.

## SEA-TRAIL-01 — Seattle Burke-Gilman trail and repairs pages

- Official source URL: `https://www.seattle.gov/parks/parks/burke-gilman-trail`
- Documentation URL: `https://www.seattle.gov/parks/about-us/projects/burke-gilman-trail-repairs`
- Access method: HTML pages
- Acquisition classification: `UNSTRUCTURED_WEBPAGE`
- Machine-readable availability: No public feed identified
- Authentication requirements: None
- Terms / usage constraints: public city pages
- Geographic coverage: Seattle Burke-Gilman segment
- Route points / sections covered: UW / U-District and Seattle Burke-Gilman sections
- Available fields: page text; repair project page when retrievable
- Geometry availability: None
- Update frequency: as needed
- Typical publication delay: not documented
- Historical availability: current pages only
- Pagination behavior: none
- Documented rate limits: none found
- Recommended freshness threshold: 6 hours if used directly
- Failure detection method: HTTP error or body reduced to navigation shell
- Last-known-good suitability: Yes
- Fallback method: normalized closure output from workstreams `01_ROUTE_CONDITIONS` and `06_TRAIL_INFRASTRUCTURE_STATUS`
- Manual-review requirement: Yes
- Recommendation class: `SECONDARY`
- Verification status: `PARTIALLY_VERIFIED`
- Evidence URLs: see JSON
- Research notes: Correct route-owner source for future fire-caused closures on the Seattle segment, but direct fetches still returned shell-heavy pages.

## PULSEPOINT-01 — PulsePoint and similar local incident-system feeds

- Official source URL: `https://www.pulsepoint.org/`
- Documentation URL: `https://www.pulsepoint.org/pulsepoint-respond-backup`
- Access method: app / platform documentation
- Acquisition classification: `UNUSABLE`
- Machine-readable availability: No route-usable public feed confirmed
- Authentication requirements: agency implementation and app model
- Terms / usage constraints: not a stable official wildland-monitoring feed for unattended route use
- Geographic coverage: agency-dependent
- Route points / sections covered: potentially scattered and extremely noisy
- Available fields: not tested as a route-usable public feed
- Geometry availability: app-centric
- Update frequency: near-real-time incident notifications
- Typical publication delay: not tested
- Historical availability: not tested
- Pagination behavior: not tested
- Documented rate limits: not tested
- Recommended freshness threshold: do not use in this connector
- Failure detection method: not applicable
- Last-known-good suitability: No
- Fallback method: `NIFC-01`, `NIFC-02`, `DNR-01`, `NWS-01`
- Manual-review requirement: Yes
- Recommendation class: `REJECT`
- Verification status: `PARTIALLY_VERIFIED`
- Evidence URLs: see JSON
- Research notes: Rejected because it is too likely to flood this urban route with routine EMS and structure-fire noise.
