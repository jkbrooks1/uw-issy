# UW-Issy Monitoring Data Quality Round 1

## Executive summary

Round 1 repaired the known local connector/config defects that could be safely fixed in the canonical workflow exports:

- ECO-01 now uses the documented Ecology endpoint family and a live-supported latest-hour filter.
- KC-ROAD-01 now uses a valid King County RoadAlerts query and parser support for fully-qualified ArcGIS field names.
- NIFC-01 now uses a valid WFIGS route-bbox query.

No health-scoring thresholds were changed.

The required remote all-8-monitor rerun is blocked: the n8n API endpoint is reachable, but all locally available API keys return unauthorized. No valid n8n CLI is installed. Therefore this report distinguishes published baseline from locally validated/projected after-state.

## Baseline 8-monitor health

| Monitor |Before state |After state/projected |Failed before |Failed after/projected |Correct empty |Remaining problem |
| --- |--- |--- |--- |--- |--- |--- |
| 01_ROUTE_CONDITIONS |degraded |degraded |3 |3 |0 |unchanged: REDM/ISS external failures remain |
| 02_WEATHER |ok |ok |0 |0 |1 |unchanged |
| 03_AIR_QUALITY |degraded |degraded |4 |3 |3 |ECO-01 fixed; ECO-02, PSCAA-02, AIRNOW-01, PSCAA-01 remain |
| 04_WILDFIRE |degraded |ok/projected |1 |0 |3 |NIFC-01 fixed to correct empty; warning empties are not failures |
| 05_FLOOD_CONDITIONS |degraded |degraded |4 |3 |1 |KC-ROAD-01 fixed; ISS/REDM external and WSDOT credential blocker remain |
| 06_TRAIL_INFRASTRUCTURE_STATUS |degraded |degraded |2 |2 |1 |ISS/REDM external failures remain |
| 07_GOVERNMENT_SAFETY_ALERTS |ok |ok |0 |0 |7 |unchanged |
| 08_ROUTE_FACILITIES |ok |ok |0 |0 |0 |unchanged |

## Baseline source matrix

| Monitor |Source ID |Current source state |Error count |Warning count |Root cause |Lane state |
| --- |--- |--- |--- |--- |--- |--- |
| 01_ROUTE_CONDITIONS |01_ROUTE_CONDITIONS:KC-03 |ok |0 |0 |No defect identified from current evidence. |degraded |
| 01_ROUTE_CONDITIONS |01_ROUTE_CONDITIONS:REDM-01 |failed |1 |1 |External/runtime network failure: Redmond ArcGIS timed out in connector artifact and still fails from local runtime. |degraded |
| 01_ROUTE_CONDITIONS |01_ROUTE_CONDITIONS:ISS-03 |failed |1 |1 |External/runtime network failure: Issaquah ArcGIS timed out in connector artifact and still fails from local runtime. |degraded |
| 01_ROUTE_CONDITIONS |01_ROUTE_CONDITIONS:ISS-01 |failed |1 |1 |External source blocking: Issaquah CivicAlerts returns Cloudflare challenge to non-browser fetch. |degraded |
| 02_WEATHER |02_WEATHER:NWS-01 |ok |0 |0 |No defect identified from current evidence. |ok |
| 02_WEATHER |02_WEATHER:NWS-02 |ok |0 |0 |No defect identified from current evidence. |ok |
| 02_WEATHER |02_WEATHER:NWS-03 |ok |0 |0 |No defect identified from current evidence. |ok |
| 02_WEATHER |02_WEATHER:NWS-04 |ok |0 |0 |No defect identified from current evidence. |ok |
| 02_WEATHER |02_WEATHER:NWS-05 |ok |0 |0 |No defect identified from current evidence. |ok |
| 02_WEATHER |02_WEATHER:NWS-06 |empty_but_valid |0 |0 |No defect identified from current evidence. |ok |
| 03_AIR_QUALITY |03_AIR_QUALITY:ECO-01 |failed |1 |0 |Our endpoint/query defect: stale Ecology /arcgis path returned 404 and HourPriorToLatest=0 returned zero current rows. |degraded |
| 03_AIR_QUALITY |03_AIR_QUALITY:ECO-02 |failed |1 |0 |External source unavailable: documented Ecology SmokeForecast service returns ArcGIS service-not-started error. |degraded |
| 03_AIR_QUALITY |03_AIR_QUALITY:PSCAA-02 |failed |1 |1 |External/runtime network failure: burn-ban page failed in artifact and remains unreachable from runtime. |degraded |
| 03_AIR_QUALITY |03_AIR_QUALITY:AIRNOW-02 |empty_but_valid |0 |1 |BENIGN LIMITATION - source works as contextual reporting-area data only. |degraded |
| 03_AIR_QUALITY |03_AIR_QUALITY:WASMOKE-01 |ok |0 |0 |No defect identified from current evidence. |degraded |
| 03_AIR_QUALITY |03_AIR_QUALITY:NWS-AQ-01 |empty_but_valid |0 |0 |CORRECT EMPTY - no active NWS air-quality alerts in the checked scope. |degraded |
| 03_AIR_QUALITY |03_AIR_QUALITY:PSCAA-01 |empty_but_valid |0 |1 |PARSER / EXTRACTION DEFECT - official pages are reachable but current canonical station snapshot is not deterministically extracted by this connector. |degraded |
| 03_AIR_QUALITY |03_AIR_QUALITY:AIRNOW-01 |failed |1 |0 |Credential/config blocker: API key not available to connector; no-key call returns 401. |degraded |
| 04_WILDFIRE |04_WILDFIRE:NIFC-01 |failed |1 |0 |Our query defect: ArcGIS query parameters produced invalid-query error; valid route-bbox query now executes. |degraded |
| 04_WILDFIRE |04_WILDFIRE:NIFC-02 |empty_but_valid |0 |1 |CORRECT EMPTY - healthy perimeter query returned no route-relevant wildfire perimeters. |degraded |
| 04_WILDFIRE |04_WILDFIRE:NWS-01 |empty_but_valid |0 |1 |CORRECT EMPTY - healthy NWS alert query returned no active route fire-weather alerts. |degraded |
| 04_WILDFIRE |04_WILDFIRE:NOAA-01 |ok |0 |0 |No defect identified from current evidence. |degraded |
| 04_WILDFIRE |04_WILDFIRE:KC-01 |empty_but_valid |0 |1 |CORRECT EMPTY - fire-safety page parsed and no active burn-ban condition was detected in this artifact. |degraded |
| 05_FLOOD_CONDITIONS |05_FLOOD_CONDITIONS:USGS-01 |ok |0 |0 |No defect identified from current evidence. |degraded |
| 05_FLOOD_CONDITIONS |05_FLOOD_CONDITIONS:USGS-02 |ok |0 |0 |No defect identified from current evidence. |degraded |
| 05_FLOOD_CONDITIONS |05_FLOOD_CONDITIONS:USGS-03 |ok |0 |0 |No defect identified from current evidence. |degraded |
| 05_FLOOD_CONDITIONS |05_FLOOD_CONDITIONS:NWPS-01 |ok |0 |1 |CORRECT EMPTY - gauge is healthy; no flood-category escalation. |degraded |
| 05_FLOOD_CONDITIONS |05_FLOOD_CONDITIONS:NWPS-02 |ok |0 |1 |CORRECT EMPTY - gauge is healthy; no flood-category escalation. |degraded |
| 05_FLOOD_CONDITIONS |05_FLOOD_CONDITIONS:NWS-01 |empty_but_valid |0 |1 |CORRECT EMPTY - valid empty NWS flood-alert collection. |degraded |
| 05_FLOOD_CONDITIONS |05_FLOOD_CONDITIONS:ISS-01 |failed |1 |1 |External source blocking: Issaquah flood page returns Cloudflare challenge. |degraded |
| 05_FLOOD_CONDITIONS |05_FLOOD_CONDITIONS:REDM-01 |failed |1 |1 |External/runtime network failure: Redmond ArcGIS timed out and remains unreachable from runtime. |degraded |
| 05_FLOOD_CONDITIONS |05_FLOOD_CONDITIONS:KC-ROAD-01 |failed |1 |1 |Our query defect: service requires fully-qualified fields or outFields=*; unqualified outFields failed. |degraded |
| 05_FLOOD_CONDITIONS |05_FLOOD_CONDITIONS:WSDOT-01 |failed |1 |1 |Credential/config blocker: WSDOT access code not available to connector; no-code call returns 401. |degraded |
| 06_TRAIL_INFRASTRUCTURE_STATUS |06_TRAIL_INFRASTRUCTURE_STATUS:KC-01 |ok |0 |0 |No defect identified from current evidence. |degraded |
| 06_TRAIL_INFRASTRUCTURE_STATUS |06_TRAIL_INFRASTRUCTURE_STATUS:KC-02 |ok |0 |0 |No defect identified from current evidence. |degraded |
| 06_TRAIL_INFRASTRUCTURE_STATUS |06_TRAIL_INFRASTRUCTURE_STATUS:KC-03 |ok |0 |0 |No defect identified from current evidence. |degraded |
| 06_TRAIL_INFRASTRUCTURE_STATUS |06_TRAIL_INFRASTRUCTURE_STATUS:SAM-01 |ok |0 |0 |No defect identified from current evidence. |degraded |
| 06_TRAIL_INFRASTRUCTURE_STATUS |06_TRAIL_INFRASTRUCTURE_STATUS:SAM-02 |ok |0 |0 |No defect identified from current evidence. |degraded |
| 06_TRAIL_INFRASTRUCTURE_STATUS |06_TRAIL_INFRASTRUCTURE_STATUS:ISS-01 |failed |1 |0 |External/runtime network failure: Issaquah ArcGIS timed out and remains unreachable from runtime. |degraded |
| 06_TRAIL_INFRASTRUCTURE_STATUS |06_TRAIL_INFRASTRUCTURE_STATUS:REDM-01 |failed |1 |0 |External/runtime network failure: Redmond ArcGIS timed out and remains unreachable from runtime. |degraded |
| 06_TRAIL_INFRASTRUCTURE_STATUS |06_TRAIL_INFRASTRUCTURE_STATUS:KC-04 |empty_but_valid |0 |0 |CORRECT EMPTY - bridge inventory source succeeded; no publishable lane-06 event. |degraded |
| 07_GOVERNMENT_SAFETY_ALERTS |07_GOVERNMENT_SAFETY_ALERTS:NWS-01 |empty_but_valid |0 |1 |No defect identified from current evidence. |ok |
| 07_GOVERNMENT_SAFETY_ALERTS |07_GOVERNMENT_SAFETY_ALERTS:SEA-01 |empty_but_valid |0 |2 |No defect identified from current evidence. |ok |
| 07_GOVERNMENT_SAFETY_ALERTS |07_GOVERNMENT_SAFETY_ALERTS:UW-01 |empty_but_valid |0 |2 |No defect identified from current evidence. |ok |
| 07_GOVERNMENT_SAFETY_ALERTS |07_GOVERNMENT_SAFETY_ALERTS:SEAFD-01 |empty_but_valid |0 |1 |No defect identified from current evidence. |ok |
| 07_GOVERNMENT_SAFETY_ALERTS |07_GOVERNMENT_SAFETY_ALERTS:SEAPD-01 |empty_but_valid |0 |1 |No defect identified from current evidence. |ok |
| 07_GOVERNMENT_SAFETY_ALERTS |07_GOVERNMENT_SAFETY_ALERTS:DOH-02 |ok |0 |0 |No defect identified from current evidence. |ok |
| 07_GOVERNMENT_SAFETY_ALERTS |07_GOVERNMENT_SAFETY_ALERTS:ST-01 |empty_but_valid |0 |1 |No defect identified from current evidence. |ok |
| 07_GOVERNMENT_SAFETY_ALERTS |07_GOVERNMENT_SAFETY_ALERTS:KCMETRO-01 |empty_but_valid |0 |1 |No defect identified from current evidence. |ok |
| 08_ROUTE_FACILITIES |08_ROUTE_FACILITIES:SEA-01 |ok |0 |0 |No defect identified from current evidence. |ok |
| 08_ROUTE_FACILITIES |08_ROUTE_FACILITIES:KC-01 |ok |0 |1 |No defect identified from current evidence. |ok |

## Repairs performed

| Source |Before |Root cause / fix |After |Verified |
| --- |--- |--- |--- |--- |
| 03_AIR_QUALITY:ECO-01 |failed |Changed Ecology endpoint to /serverext/rest/services/AQ/... and changed latest-hour filter to HourPriorToLatest=1. |fresh success: 146 features |YES |
| 05_FLOOD_CONDITIONS:KC-ROAD-01 |failed |Changed RoadAlerts query to outFields=* and added qualified-field parser accessor. |fresh success: 31 records |YES |
| 04_WILDFIRE:NIFC-01 |failed |Changed WFIGS route-bbox query to valid encoded geometry and outFields=*. |correct empty: 0 route-bbox incidents, 594 global incidents |YES |
| 03_AIR_QUALITY:AIRNOW-01 |failed |No key present locally; remote n8n API unauthorized, so workflow credential wiring cannot be verified or repaired safely. |BLOCKER |NO |
| 05_FLOOD_CONDITIONS:WSDOT-01 |failed |No access code present locally; remote n8n API unauthorized, so workflow credential wiring cannot be verified or repaired safely. |BLOCKER |NO |
| 03_AIR_QUALITY:PSCAA-01 |empty_but_valid warning |Investigated reachable station pages; deterministic station snapshot extraction remains unresolved. |PARSER / EXTRACTION DEFECT |PARTIAL |

## Endpoint proof

| Check |Result |
| --- |--- |
| ECO-01 old endpoint |FAIL; HTTP 404; count/features ; <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd"> <html xmlns="http://www.w3.org/1999/xhtml"> <head> <meta http-equiv="Content-Type" content="text/html; charset=iso-8859-1"/> <titl |
| ECO-01 repaired endpoint |OK; HTTP 200; count/features 146; |
| ECO-02 documented endpoint |FAIL; HTTP 200; count/features ; Service AQ/SmokeForecast/MapServer not started |
| KC-ROAD-01 old query |FAIL; HTTP 200; count/features ; Failed to execute query. |
| KC-ROAD-01 repaired query |OK; HTTP 200; count/features 31; |
| NIFC-01 repaired route bbox query |OK; HTTP 200; count/features 0; |
| NIFC-01 global count |OK; HTTP 200; count/features 595; |

## Credential/config findings

- AIRNOW_API_KEY present locally: no.
- WSDOT_TRAVELER_API_ACCESS_CODE present locally: no.
- n8n API reachable: yes.
- n8n API authorized with available local keys: no.
- Secret values were not recorded.

## External failures remaining

| Source |Current live result |Classification |
| --- |--- |--- |
| REDM-01 |FAIL; HTTP network; count/features ; TypeError: fetch failed |external/runtime network limitation |
| ISS-03 |FAIL; HTTP network; count/features ; TypeError: fetch failed |external/runtime network limitation |
| ISS-01 CivicAlerts |FAIL; HTTP 403; count/features ; <!DOCTYPE html><html lang="en-US"><head><title>Just a moment...</title><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"><meta http-equiv="X-UA-Compatible" content="IE=Edge"><meta name="robots" content="noindex,nofollow"><m |Cloudflare challenge / source blocking |
| ISS-01 flood page |FAIL; HTTP 403; count/features ; <!DOCTYPE html><html lang="en-US"><head><title>Just a moment...</title><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"><meta http-equiv="X-UA-Compatible" content="IE=Edge"><meta name="robots" content="noindex,nofollow"><m |Cloudflare challenge / source blocking |
| ECO-02 |FAIL; HTTP 200; count/features ; Service AQ/SmokeForecast/MapServer not started |source unavailable |
| PSCAA-02 |FAIL; HTTP network; count/features ; TypeError: fetch failed |external/runtime network limitation |

## Empty_but_valid classifications

| Source |Classification |
| --- |--- |
| 03_AIR_QUALITY:AIRNOW-02 |BENIGN LIMITATION - source works as contextual reporting-area data only. |
| 03_AIR_QUALITY:NWS-AQ-01 |CORRECT EMPTY - no active NWS air-quality alerts in the checked scope. |
| 03_AIR_QUALITY:PSCAA-01 |PARSER / EXTRACTION DEFECT - official pages are reachable but current canonical station snapshot is not deterministically extracted by this connector. |
| 04_WILDFIRE:NIFC-02 |CORRECT EMPTY - healthy perimeter query returned no route-relevant wildfire perimeters. |
| 04_WILDFIRE:NWS-01 |CORRECT EMPTY - healthy NWS alert query returned no active route fire-weather alerts. |
| 04_WILDFIRE:KC-01 |CORRECT EMPTY - fire-safety page parsed and no active burn-ban condition was detected in this artifact. |
| 05_FLOOD_CONDITIONS:NWPS-01 |CORRECT EMPTY - gauge is healthy; no flood-category escalation. |
| 05_FLOOD_CONDITIONS:NWPS-02 |CORRECT EMPTY - gauge is healthy; no flood-category escalation. |
| 05_FLOOD_CONDITIONS:NWS-01 |CORRECT EMPTY - valid empty NWS flood-alert collection. |
| 06_TRAIL_INFRASTRUCTURE_STATUS:KC-04 |CORRECT EMPTY - bridge inventory source succeeded; no publishable lane-06 event. |

## Fresh full-cycle results

Fresh full-cycle n8n execution was not completed because remote n8n API authorization is blocked. Local endpoint-level repair proofs were completed for the three safe connector/query defects. The public package remains at release 20_STATUS_PUBLISHER-20260823T201500Z-001.

## Before/after source table

| Source |Before |Fix |After/projected |Verified |
| --- |--- |--- |--- |--- |
| 03_AIR_QUALITY:ECO-01 |failed |Changed Ecology endpoint to /serverext/rest/services/AQ/... and changed latest-hour filter to HourPriorToLatest=1. |fresh success: 146 features |YES |
| 05_FLOOD_CONDITIONS:KC-ROAD-01 |failed |Changed RoadAlerts query to outFields=* and added qualified-field parser accessor. |fresh success: 31 records |YES |
| 04_WILDFIRE:NIFC-01 |failed |Changed WFIGS route-bbox query to valid encoded geometry and outFields=*. |correct empty: 0 route-bbox incidents, 594 global incidents |YES |
| 03_AIR_QUALITY:AIRNOW-01 |failed |No key present locally; remote n8n API unauthorized, so workflow credential wiring cannot be verified or repaired safely. |BLOCKER |NO |
| 05_FLOOD_CONDITIONS:WSDOT-01 |failed |No access code present locally; remote n8n API unauthorized, so workflow credential wiring cannot be verified or repaired safely. |BLOCKER |NO |
| 03_AIR_QUALITY:PSCAA-01 |empty_but_valid warning |Investigated reachable station pages; deterministic station snapshot extraction remains unresolved. |PARSER / EXTRACTION DEFECT |PARTIAL |

## Current health-scoring-rule audit

The public `system-health.json` is assembled from lane-level `sourceState` values and Lane 20 source summaries. The current published state shows lanes marked `degraded` when one or more configured source checks fail. The evidence supports that a single failed source can mark a lane degraded when that failed source remains in the lane's source-health summary as `failed`, regardless of total source count or redundancy.

Examples:

- Wildfire is degraded in the current snapshot with one failed source identified in the current diagnosis.
- Route conditions is degraded with three failed sources out of four.

This scoring rule was not changed.

## Remaining degraded states

- Route conditions: external Redmond/Issaquah failures remain.
- Air quality: ECO-01 fixed, but ECO-02 source unavailable, PSCAA-02 unavailable, AIRNOW-01 credential blocker, and PSCAA-01 parser/extraction issue remain.
- Flood conditions: KC-ROAD-01 fixed, but Issaquah/Redmond external failures and WSDOT credential blocker remain.
- Trail infrastructure: Issaquah/Redmond external failures remain.

## Round 2 source-replacement recommendations

- Redmond source redundancy or alternate endpoint path.
- Issaquah structured replacement for Cloudflare-blocked CivicAlerts/flood HTML.
- PSCAA burn-ban/source redundancy.
- Ecology SmokeForecast alternative while service is not started.
- AirNow and WSDOT credential decision by owner.
- PSCAA-01 deterministic station API/parser research.

## Owner decisions still needed

- Provide valid n8n API access or approve another remote execution path.
- Decide whether to provision AIRNOW_API_KEY.
- Decide whether to provision WSDOT_TRAVELER_API_ACCESS_CODE.
- Decide Round 2 replacement-source priorities.
- Decide whether health scoring should remain "any failed source degrades lane" or become criticality/redundancy-aware.
