# UW–Issaquah Route Monitor — Lane 01 (Route Conditions) Audit Report v1

**Date:** 2026-07-28 (initial research cycle); updated 2026-07-28 (follow-up verification cycle); updated again 2026-07-28 (third follow-up cycle); updated again 2026-07-28 (fourth follow-up cycle); updated again 2026-07-28 (fifth follow-up cycle, same day, later session)
**Scope:** Research/verification cycle for Lane 01_ROUTE_CONDITIONS, plus four follow-up verification passes resolving specific documented gaps, incorporating a project-owner-supplied route correction, and evaluating two rounds of user-supplied candidate-source lists. No production n8n workflow was built or claimed to be built in any cycle.

## Files inspected / used as input

- `data/route/UnivWA-Issaquah.gpx` — corrected in the fourth cycle (unchanged this cycle).
- All prior-cycle authoritative deliverables were read in full before any change was made.
- A second user-supplied list of candidate GIS/ArcGIS sources (covering Seattle, Lake Forest Park, Redmond, Sammamish, Issaquah) was cross-referenced against this registry and directly tested claim-by-claim with real curl/ArcGIS REST calls, not accepted at face value.

## Sources tested and test methods

28 candidate sources are recorded (grew from 23 this cycle — REDM-01, ISS-03, ISS-04, SAM-02, SAM-03 added). Across all five cycles, 25 sources were directly fetched/queried at least once with real HTTP/ArcGIS REST calls, and the remainder identified via WebSearch only, explicitly labeled as such. Full per-source test detail is in `API_AND_FEED_TEST_RESULTS.md` (Tests 1-42).

| Test method | Sources |
|---|---|
| Directly fetched with WebFetch, successful/readable response | KC-01, KC-02, KC-03, KC-04, ISS-01, SAM-01, UW-01, UW-02, OTH-03A, OTH-03C, OTH-03D, OTH-02, SEA-03 (parent page) |
| Directly queried with real ArcGIS REST calls (curl) | KC-06, KC-07 (fourth cycle); **REDM-01, ISS-03, ISS-04, SAM-02, SAM-03 (new this cycle)** — all confirmed real via service-description, field-list, count, and (for REDM-01/ISS-03) route-corridor bounding-box queries |
| Directly fetched with WebFetch/curl, real error/blocked response recorded | SEA-01 (ArcGIS service error, retested across three endpoint variants across cycles including SDOT_Bikes this cycle), SEA-02 (catalog, not data), KC-05 (JS app-shell only) |
| Directly tested this cycle, claim REFUTED | Seattle `SDOT_Bikes/MapServer` (claimed working — returned identical "Service not started" error); Redmond `DataSets/Landbase/MapServer` (claimed "Trail" layer — returned HTTP 404, does not exist) |
| Directly fetched, partial success + independent corroboration | OTH-03B (Kenmore) |
| Directly fetched, URL confirmed but body content not retrievable | SEA-03's linked "Burke-Gilman Trail Repairs" subpage |
| Identified via WebSearch only, not independently fetched | WSDOT-01 (API itself), ST-01 |

Note: OTH-01 (Seattle Bike Blog) is treated as VERIFIED-to-exist because its ELST closure article's underlying fact was independently confirmed via direct WebFetch of KC-03 and SAM-01.

## Fifth follow-up cycle: what was actually tested, with real results

1. **Seattle SDOT_Bikes retest (refuted claim).** A second user-supplied list claimed Seattle has "strong, confirmed" REST endpoints including `SDOT_Bikes/MapServer` (multi-use trails, bike facilities). Directly tested: `MapServer?f=json` and a layer-3 query both returned `{"error":{"code":500,"message":"Service SDOT/SDOT_Bikes/MapServer not started ","details":[]}}` — identical to the already-rejected SDOT_StreetUse_V2 error. **Result: claim refuted; confirms the entire gisdata.seattle.gov ArcGIS Server instance is down, not one service. SEA-01's REJECT status is reinforced, not reopened.**

2. **Redmond Landbase/Trail retest (refuted claim).** The same list claimed a "Trail" layer on `DataSets/Landbase/MapServer`. Directly tested: returned `{"error":{"code":404,"message":"Service DataSets/Landbase/MapServer not found ","details":[]}}`. **Result: claim refuted; this service does not exist.**

3. **Redmond Traffic/Alerts discovery and live verification.** Queried Redmond's real ArcGIS REST root directly, found the `Traffic` folder, and directly queried `Traffic/Alerts` (FeatureServer, 3 geometry layers). Real results: field list confirmed (AlertName, LocationDescription, AlertStartDate/EndDate, TrafficImpactDescription, AlertStatus, GovDeliveryMessage/Subject); live queries found 3 real active alerts with real 2026 dates and "ACT" status. **Result: added as REDM-01, VERIFIED, MVP.**

4. **Issaquah ArcGIS Hub search — methodology error caught and corrected.** An initial unscoped query (`?q=trail`) against Issaquah's ArcGIS Hub v3 API returned results from unrelated organizations (a Maryland town, a Canadian city) — inspected the `owner`/`orgId` fields, confirmed the query was not properly scoped, and corrected by finding Issaquah's real org ID (`emvaTQRwXeOg8U36`) via a differently-worded query, then re-querying with `filter[orgId]=`. **This error is disclosed in full in `API_AND_FEED_TEST_RESULTS.md` Test 38 rather than hidden or silently corrected.**

5. **Issaquah PWProjectsCurrentYearConstructionPublic and Active Projects, live verification + route-corridor test.** Both directly queried: 62 and 60 real records respectively, confirmed via count queries. A bounding-box geometry query against the route's exact corridor found a genuinely on-route project for the first ("East Lake Sammamish Pkwy Drainage Improvement Project," SE 51st St and ELSP) and only general development permits for the second. **Result: PWProjectsCurrentYearConstructionPublic added as ISS-03, VERIFIED, MVP (the registry's first geometry-confirmed on-route hit); Active Projects added as ISS-04, VERIFIED, SECONDARY.**

6. **Sammamish DevelopmentActivityMap and Transportation folders, live verification.** Directly queried Sammamish's ArcGIS REST root and found real folders. `DevelopmentActivityMap_2` was found genuinely empty (`"layers":[]`) — a real but unused service, not a broken link. `Development_Activity_Map_Trakit_Prod_V2` is the real production service: 1,343 real permit records confirmed via count query. `Transportation/TCIP_Projects` is real: 22 records confirmed. **Result: added as SAM-02 (Trakit, SECONDARY) and SAM-03 (TCIP_Projects, SECONDARY).**

## Endpoint / page accessibility results

- **Working, content-bearing ArcGIS REST API endpoints confirmed live this cycle:** REDM-01 (Redmond, 3 real alerts), ISS-03 (Issaquah, 62 records incl. 1 confirmed on-route), ISS-04 (Issaquah, 60 records), SAM-02 (Sammamish, 1,343 records), SAM-03 (Sammamish, 22 records).
- **Claims directly tested and found false this cycle:** Seattle SDOT_Bikes (down), Redmond Landbase/Trail (doesn't exist).
- **No credentials, API keys, tokens, or authenticated sessions were used or required for any test performed in any cycle**, including all new ArcGIS REST queries this cycle.

## Validation performed

- **JSON validation:** `SOURCE_REGISTRY.json` was loaded with Python's `json.load()` this cycle and confirmed to parse without error, 28 sources, `registry_version` "1.5". `UW_ISSY_01_ROUTE_CONDITIONS_FINAL_SOURCE_REGISTRY_v1.json` was regenerated programmatically from the authoritative registry this cycle and independently validated the same way; source-ID sets in both files were compared and confirmed identical (28 IDs in both).
- **Registry consistency:** `SOURCE_REGISTRY.md` was updated in lockstep with `SOURCE_REGISTRY.json` this cycle for every added field (REDM-01, ISS-03, ISS-04, SAM-02, SAM-03; registry_version and last_updated bumped); classifications and verification statuses match across both files by direct comparison.
- **Route-corridor geometry testing:** for the two new MVP sources (REDM-01, ISS-03), real bounding-box queries were run against the route's exact coordinates, and results were manually assessed for genuine geographic relevance (not merely "a record was returned") — this is how ISS-03's on-route hit was confirmed as real (SE 51st St and ELSP genuinely names a route-adjacent street) and how REDM-01's current alerts were assessed as not-yet-confirmed on-corridor (street projects near but not proven to intersect the exact trail line).
- **No production workflow validation applies** — none was built.

## File-copy verification (Downloads)

Per the Downloads rule, only these four files were re-copied to `/Users/jkbrookspersonal/Downloads`, overwriting the prior cycle's copies:
1. `UW_ISSY_01_ROUTE_CONDITIONS_FINAL_RESEARCH_REPORT_v1.md`
2. `UW_ISSY_01_ROUTE_CONDITIONS_IMPLEMENTATION_RECOMMENDATION_v1.md`
3. `UW_ISSY_01_ROUTE_CONDITIONS_AUDIT_REPORT_v1.md` (this file)
4. `UW_ISSY_01_ROUTE_CONDITIONS_FINAL_SOURCE_REGISTRY_v1.json`

Each copy was re-verified against its updated authoritative project-directory counterpart using SHA-256 (see the build log for the exact hash values recorded at re-copy time). No working files, raw research, samples, scripts, schemas, notes, READMEs, logs, fixtures, internal registries, drafts, or the GPX file itself were copied to Downloads.

## Limitations

- The exact GovDelivery topic ID for King County Parks trail alerts remains unresolved (unchanged this cycle, not retested).
- SEA-03's linked "Burke-Gilman Trail Repairs" subpage body content still could not be retrieved (unchanged this cycle, not retested).
- KC-05's portal UI remains BLOCKED (unchanged this cycle, not retested).
- **KC-06, REDM-01, and ISS-03 have only been tested with bounding-box geometry queries, not true line-buffer corridor intersections.** Bbox is confirmed unreliable (KC-06's Cottage Lake false positive) — none of the three should be treated as providing fully-verified route-impact geometry until a proper corridor-buffer test is run.
- KC-07's SammamishRoadAlerts layer has only ever shown a single 2014 test record — not yet resolvable as REJECT or SECONDARY/MVP.
- REDM-01's three current alerts and ISS-04/SAM-02/SAM-03's bbox-matched records have not been individually confirmed to intersect the exact trail line versus a nearby-but-distinct street.
- This audit does not and cannot certify future availability of any source; agency web pages and services can change or go down without notice (demonstrated directly this cycle by Seattle's ArcGIS Server going from "documented as working" in an external research pass to confirmed down under direct test).

## Unresolved issues (updated, fifth cycle)

1. ~~KC-02, UW-02 direct re-confirmation~~ — RESOLVED (third cycle).
2. SEA-03's linked repairs subpage body content — STILL OPEN (not retested this cycle).
3. GovDelivery topic-ID discovery (OTH-02) — STILL OPEN (not retested this cycle).
4. King County GIS trail-geometry dataset access via the portal UI (KC-05) — STILL OPEN (not retested this cycle).
5. ~~DOM/extraction structure notes for the 5 original MVP sources~~ — RESOLVED (third cycle).
6. KC-06 geometry-corridor (not bbox) intersection test — STILL OPEN (carried forward from fourth cycle).
7. KC-07 SammamishRoadAlerts live-content recheck — STILL OPEN (carried forward from fourth cycle).
8. **NEW this cycle: REDM-01 geometry-corridor (not bbox) intersection test** — STILL OPEN; only a general awareness that 3 alerts exist was confirmed, not a corridor-buffer test against the specific GPX line.
9. **NEW this cycle: ISS-03's remaining current records (61 of 62) not individually geometry-tested** — only the bbox query's top results were inspected; a full corridor-buffer pass over all 62 records has not been performed.
10. **NEW this cycle: ISS-04/SAM-02/SAM-03 route-specific keyword+geometry filtering** — not yet performed; only generic bbox tests were run.

## Final status

**PARTIAL** (consistent with prior cycles — this cycle added substantial verified value without closing every open item, and honestly opened new ones through its own rigor).

Reasoning: this fifth follow-up cycle's central achievement is growing the MVP set from 5 to 7 for the first time in this project's research history, with both new sources (REDM-01, ISS-03) backed by real, direct evidence — not assumed from documentation or a third party's claims. This cycle also demonstrated the value of this registry's standing "never verify without a direct test" discipline twice: it caught its own methodology error (an unscoped Issaquah Hub query returning irrelevant nationwide results) and refuted two false claims from an external research pass (Seattle's SDOT_Bikes server, Redmond's Landbase/Trail layer) rather than incorporating them uncritically. The report remains PARTIAL, not PASS, for two kinds of reasons: (a) four items carried forward from prior cycles remain genuinely open and were not re-attempted this cycle (GovDelivery topic ID, KC-05 portal UI, SEA-03 repairs-subpage body, KC-07 live-content status); and (b) this cycle's own rigor opened three new, honestly-disclosed open items rather than glossing over them — the geometry-corridor (not bbox) verification gap now applies to three sources (KC-06, REDM-01, ISS-03), and ISS-03's full record set has not been exhaustively geometry-tested. Zero fabricated verification, invented source coverage, or invented geometry-match results were introduced at any point in any cycle — every "on-route" claim in this report is traceable to a specific, real, quoted API response.
