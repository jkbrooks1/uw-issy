# UW-Issaquah Connector Source Test Log (Workstreams 03-07)

Consolidated index of every live test executed across the five parallel research
workstreams. All testing was performed on **Wednesday, July 29, 2026**, from this local
development environment (not yet from the eventual Hetzner/n8n production host — see
per-workstream caveats below). Full request/response detail for each test lives in each
workstream's own `API_AND_FEED_TEST_RESULTS.md`; this document indexes and summarizes.

**Total: 90 live tests across 5 workstreams** (15 + 15 + 17 + 16 + 27).

## 03_AIR_QUALITY — 15 tests

| # | Test | Result summary |
|---|---|---|
| 1 | AirNow public file product `reportingarea.dat` | Live, usable |
| 2 | AirNow public file product `cityzipcodes.csv` | Live, usable, but reporting-area coarse |
| 3 | AirNow web service auth wall | Confirmed key-gated (`AIRNOW_API_KEY`) |
| 4 | Ecology hourly-monitor service metadata | Live |
| 5 | Ecology hourly-monitor route query | Live, 4 route-near monitors returned, PM10 fields present but null |
| 6 | Ecology smoke forecast metadata + route query | Live, polygon intersected `Seattle-Bellevue-Kent Valley` |
| 7 | PSCAA technical-tool discovery pages | Live |
| 8 | PSCAA network-map station list + polygons | Live (`GetStations`, `Geometries` work directly) |
| 9 | PSCAA station-detail (`Aqi`) without session bootstrap | Failed — requires session state |
| 10 | PSCAA station-detail (`Aqi`) after bootstrap | Succeeded after cookie/session bootstrap |
| 11 | PSCAA `ThreeTile` endpoint | Returned HTTP 500 |
| 12 | PSCAA burn-ban status page | Live, HTML only, no JSON/RSS equivalent found |
| 13 | Washington Smoke Blog RSS | Live |
| 14 | NWS Air Quality Alert API sample | Live (tested against other counties; no active King County AQ alert at test time) |
| 15 | King County + Seattle guidance pages | Live but reference-only, not a connector |

Production-host caveat: local `curl` (default) failed against Ecology with exit `60`
(TLS/CA-store issue) while Python `requests` succeeded — flagged for re-test from the
actual production host before treating Ecology as "set and forget."

## 04_WILDFIRE — 15 tests

| # | Test | Result summary |
|---|---|---|
| 1-2 | DNR wildfire-danger service metadata + route-point query | Live |
| 3-4 | DNR current-fire layer metadata/counts + King County sample | Live; 5 King County incidents on test date, none route-relevant |
| 5 | NWS route-relevant alert queries | Live |
| 6-7 | WFIGS current incident locations + perimeters | Live, but burst querying both services hit an ArcGIS Online `429` — must serialize |
| 8 | InciWeb RSS | Live |
| 9 | NOAA HMS page + daily smoke/fire files | Live dated files exist; guessed `current.kml` alias returned 404 |
| 10 | NASA FIRMS API + map-service auth behavior | `400 Invalid MAP_KEY.` — credential-blocked |
| 11 | King County Fire Safety Burn Bans page | Live, HTML only |
| 12 | Eastside Fire & Rescue burn restriction alert | Live, HTML only, Sammamish/Issaquah scope only |
| 13 | Alert King County + WA EMD alert hubs | Signup/hub pages, not public feeds |
| 14 | Washington State Parks alerts page | Live but not route-dependent |
| 15 | Route-owner closure pages (fire-caused closure fallback) | Seattle repairs subpage still shell-heavy HTML |

## 05_FLOOD_CONDITIONS — 17 tests

| # | Test | Result summary |
|---|---|---|
| 1 | USGS site sweep within route bbox | Live, identified 6 candidate gauges |
| 2 | `USGS-01` downstream Issaquah Creek (12121600) | Live, 173m from route end — strongest signal |
| 3 | `USGS-02` upstream Hobart (12120600) | Live, upstream lead-time signal |
| 4 | `USGS-03` Lake Sammamish (12122000) | Live, shoreline context only |
| 5 | USGS IV unusable-nearby gauges (Bear Creek, N. Fork Issaquah Creek, Coal Creek) | HTTP 200 but zero time-series objects returned |
| 6-7 | `NWPS-01` gauge metadata + stageflow/ratings (ISSW1) | Live, official action/minor/moderate/major thresholds confirmed |
| 8 | `NWPS-02` upstream Hobart (ISQW1) | Live, observed-only, no forecast |
| 9 | `NWS-01` flood/flash-flood alerts | Live |
| 10-11 | King County flood overview pages + app internal API (`KCF-02`) | Live JSON but undocumented/key-bound backend — not a supported contract |
| 12 | `ISS-01` City of Issaquah flood page | Live, official local phase semantics (Phase I-IV) |
| 13 | `REDM-01` Redmond Traffic Alerts ArcGIS | Live, 3 active alerts with real fields |
| 14 | King County road-alert ArcGIS layers (`KC-ROAD-01`/`02`) | Live schema, but Sammamish layer only had 2014 test records |
| 15 | `WSDOT-01` Highway Alerts | Reachable docs, live query untested (credential-gated) |
| 16 | Bellevue, Sammamish, Seattle/SPU, alert-signup pages | Reference-only, no machine-readable feed |
| 17 | Ecology flood-map viewer | Static planning context only, not current conditions |

## 06_TRAIL_INFRASTRUCTURE_STATUS — 16 tests

| # | Test | Result summary |
|---|---|---|
| 1-3 | King County Burke-Gilman / Sammamish River / East Lake Sammamish Trail pages | All live; East Lake Sammamish page returned a **live active culvert-closure event** |
| 4-5 | City of Sammamish George Davis Creek project page + project-start update | Live, names the active closure mechanics explicitly |
| 6-7 | City of Issaquah current-year public works construction service (metadata + filtered query) | Live ArcGIS REST, 62 records, one genuinely on-route hit (SE 51st St / ELSP drainage project) |
| 8 | City of Redmond Traffic/Alerts service | Live, but current records are generic transportation projects, not water/crossing-specific |
| 9-10 | King County `KingCo_Bridges` metadata + bbox query | Live, facility inventory only, not current status |
| 11 | King County `nonKCRoadAlerts` Sammamish layers | Live schema, but only 2014 test records |
| 12 | Seattle Parks Burke-Gilman Trail Repairs page | Reachable, but shell-heavy HTML, weak extraction quality |
| 13 | Seattle DOT Ballard Multimodal Corridor / Missing Link page | Reachable but off-route (Ballard corridor not on canonical GPX) |
| 14 | USGS Lake Sammamish real-time lake level | Live, but this is lane-05 hydrology, not lane-06 ownership |
| 15 | USACE Chittenden Locks / Ship Canal pages | `403 Access Denied` (Akamai) from this environment |
| 16 | WSDOT movable bridges / bridge-opening API docs | Route does not traverse a state-operated movable bridge — not pursued live |

## 07_GOVERNMENT_SAFETY_ALERTS — 27 tests

| # | Test | Result summary |
|---|---|---|
| 1 | Mise en place and route prerequisites | Confirmed project state, canonical GPX, prior lane conventions |
| 2-4 | NWS route-point, King County zone, and statewide queries | All live; statewide query surfaced live Air Quality Alerts (belong to 03, not 07 — real overlap found, not hypothetical) |
| 5 | NWS Atom feed + per-alert CAP XML | Live |
| 6 | Legacy NOAA alerts host | Failed — superseded by modern NWS stack |
| 7-8 | AlertSeattle RSS + WordPress JSON | Both live |
| 9 | Seattle Fire Department Fireline RSS | Live, secondary/editorial |
| 10 | Seattle Police Blotter RSS + Significant Incident Reports | Live, secondary/noisy |
| 11-12 | UW Alert RSS + WordPress JSON | Both live |
| 13 | ALERT King County public page | Signup hub, not a public feed |
| 14 | Redmond emergency page, AlertCenter, RSS, Everbridge widget | Reachable but widget did not return a stable payload from this environment |
| 15-18 | Bothell, Woodinville, Sammamish, Issaquah municipal alert surfaces | Mechanisms real; Bothell/Woodinville/Issaquah showed zero-alert states; Sammamish has no public machine-readable feed at all |
| 19 | Washington EMD alerts page | Directory/hub, not a live feed |
| 20-21 | DOH Health and Safety Alerts + WA Health Alert Network table | Live statewide tables, coarse locality |
| 22-23 | Sound Transit + King County Metro GTFS-realtime alerts | Both live; alternate-transport context only |
| 24 | WSDOT Highway Alerts API without access code | Clean `401` — confirms endpoint live and correctly gated |
| 25-26 | FEMA IPAWS archive feature service + live-feed documentation | Archive live (442,914 records, ~24hr delay); live feed access-controlled |
| 27 | Washington State Patrol public site surfaces | Sucuri JavaScript challenge blocked non-browser fetch |

## Cross-workstream testing patterns worth flagging

- **Rate limiting is real, not theoretical**: 04_WILDFIRE's WFIGS burst query hit an
  ArcGIS Online `429` — any shared implementation querying multiple ArcGIS-hosted sources
  (04, 05, 06 all use ArcGIS REST heavily) must serialize requests and reuse IDs rather
  than spraying ad hoc lookups.
- **JavaScript/bot-protection challenges blocked exactly two sources**: USACE (06, Akamai
  403) and Washington State Patrol (07, Sucuri challenge). Both need a browser-capable
  fetch path if they are ever required, not a retry-harder approach.
- **Session-state-bound APIs exist and are workable but fragile**: PSCAA's `Aqi` endpoint
  (03) needed cookie bootstrap; this is a real operational-brittleness pattern to plan for
  if PSCAA-01 is ever promoted from secondary to MVP.
- **"Live schema, dead data" appeared twice independently**: King County's
  `nonKCRoadAlerts`/`SammamishRoadAlerts` layer returned only 2014 test records in both
  05's and 06's independent testing — strong signal this specific King County service may
  be abandoned rather than actively maintained, not a fluke of one workstream's test.
- **Local-environment-only testing caveat applies project-wide**: none of these 90 tests
  were run from the eventual Hetzner/n8n production host. 03 already found one concrete
  local-vs-library TLS discrepancy (Ecology); treat every "live and reachable" result
  above as needing one production-host confirmation pass before full trust, not as
  automatically transferable.
