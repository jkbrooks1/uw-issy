# UW–Issaquah Route Monitor — Lane 01 (Route Conditions) Final Research Report v1

**Route:** University of Washington -> Burke-Gilman Trail -> Sammamish River Trail -> Marymoor Park -> East Lake Sammamish Trail -> Issaquah
**Lane:** 01_ROUTE_CONDITIONS
**Date:** 2026-07-28 (initial research cycle through fifth follow-up cycle), updated 2026-07-29 (sixth follow-up cycle)
**Status:** Research and source verification only. No production n8n workflow has been built.

## 0a. What changed in the sixth follow-up cycle (2026-07-29)

The project owner confirmed GovDelivery is not accessible to them, closing off both remaining paths documented in prior cycles for resolving OTH-02's topic ID (a human subscribe flow with a monitored email, or a direct King County Parks inquiry conducted by the project owner). **OTH-02 is reclassified from SECONDARY/PARTIALLY_VERIFIED to REJECT/BLOCKED.** This is a closed gap, not a resolved one — the topic ID was never found, and no further action on this source is expected or useful, since KC-01/02/03 already provide direct official coverage of the same trail segments this source would have supplemented. All references to OTH-02 below reflect this final status. No other sources changed this cycle.

## 0. What changed in the fifth follow-up cycle

This report was updated in place (not re-issued as a v2) following a fifth cycle triggered by a SECOND user-supplied candidate-source list, covering claimed ArcGIS REST endpoints for Seattle, Lake Forest Park, Redmond, Sammamish, and Issaquah. Every claim was directly tested with real curl/ArcGIS REST calls rather than accepted at face value:

1. **Two claims were refuted by direct testing.** Seattle's claimed working `SDOT_Bikes/MapServer` returned the identical "Service not started" error as `SDOT_StreetUse_V2` (SEA-01) — the entire `gisdata.seattle.gov` ArcGIS Server instance is down, not just one service. Redmond's claimed `DataSets/Landbase/MapServer` "Trail" layer returned HTTP 404 — it does not exist. Neither was added; SEA-01's REJECT status is reinforced.

2. **Four new sources were discovered and directly live-verified, two reaching MVP grade for the first time in this registry.** **REDM-01** (City of Redmond `Traffic/Alerts` ArcGIS REST FeatureServer) is real, live, with 3 active alerts confirmed via direct query — MVP, since Redmond owns 3 route segments with no prior dedicated source. **ISS-03** (City of Issaquah `PWProjectsCurrentYearConstructionPublic`) is real, live, and a geometry query against the route's own bounding box returned a genuinely on-route project ("East Lake Sammamish Pkwy Drainage Improvement Project") — MVP, the registry's first geometry-confirmed on-route hit. **ISS-04** (Issaquah `active_projects_gc`) and **SAM-02/SAM-03** (Sammamish permit/capital-project databases) are real but SECONDARY — broader databases without confirmed route-specific relevance yet.

3. **A methodology error was caught and corrected mid-cycle.** An initial unscoped query against Issaquah's ArcGIS Hub search API returned irrelevant results from unrelated organizations (a Maryland town, a Canadian city) before being properly re-scoped to Issaquah's real ArcGIS org ID. This is disclosed in full in `API_AND_FEED_TEST_RESULTS.md` Test 38 rather than hidden.

See `API_AND_FEED_TEST_RESULTS.md` Tests 34-42 for full raw evidence.

## 1. Route and jurisdiction findings

The canonical GPX (`data/route/UnivWA-Issaquah.gpx`) was corrected by the project owner in the fourth cycle. Current facts: ~33.83 miles, bounding box lat 47.55207–47.75889 / lon -122.3057 to -122.04414. Cross-referencing the GPX-derived path shape against agency jurisdiction information found in this research confirms and refines the work order's 9/10-segment model:

- **University of Washington** owns the campus segment (UW/U-District).
- **City of Seattle** (jointly SDOT and Seattle Parks and Recreation) owns the Burke-Gilman Trail south of NE 145th St. Its ArcGIS Server (`gisdata.seattle.gov`) remains entirely non-operational as of this cycle's direct retest.
- **King County Parks** owns the Burke-Gilman Trail north of NE 145th St, the entire Sammamish River Trail, Marymoor Park (including "Marymoor Connector Trail," ownership presumed but not independently confirmed), and the entire East Lake Sammamish Trail.
- **City of Redmond** owns and directly reports on road/trail-adjacent projects via its own ArcGIS Server (`gis.redmond.gov`), confirmed this cycle to be real and live — a genuine gap-filler, since Redmond directly abuts 3 route segments (Sammamish River Trail-Redmond, Marymoor Park, ELST-Redmond) with no prior dedicated source.
- **City of Sammamish** actively co-publishes construction content (SAM-01) and runs its own ArcGIS Server (`maps.sammamishwa.gov`, confirmed this cycle) with broader permit/capital-project databases (SAM-02, SAM-03).
- **City of Issaquah** operates a general civic-alerts system (ISS-01) and, confirmed this cycle, its own ArcGIS Server (`apps.issaquahwa.gov`) with structured construction-project data (ISS-03, ISS-04) — one of which (ISS-03) returned a directly on-route hit.
- **Cities of Lake Forest Park, Kenmore, Bothell, and Woodinville** remain confirmed to have no dedicated automatable trail/construction channel (from prior cycles); this cycle did not find new evidence to change that.

Full segment-by-segment detail, including the two confirmed WSDOT crossing zones and the Issaquah-approach street list: see `ROUTE_SECTION_SOURCE_MAPPING.md` in this directory.

## 2. Discovery method

Candidate agencies were searched via WebSearch, then promising URLs independently retrieved with WebFetch or, for structured ArcGIS REST responses, with direct `curl` — to obtain raw JSON rather than trust an LLM's HTML-to-markdown summarization. This cycle specifically demonstrated the value of that discipline twice: (a) Seattle's SDOT_Bikes claim was tested directly rather than accepted, revealing the whole server is down; (b) an initial unscoped ArcGIS Hub API query for Issaquah returned irrelevant nationwide results, caught by inspecting the `owner`/`orgId` fields on the results rather than assuming they were genuine, then corrected with a properly org-scoped query.

This cycle's key technique, extending the fourth cycle's finding: when a city's own ArcGIS Server REST root (`<server>/arcgis/rest/services?f=json`) is directly reachable, it can be explored folder-by-folder (e.g. Redmond's `Traffic` folder, Sammamish's `DevelopmentActivityMap`/`Transportation` folders, Issaquah's `General_Mapservices` folder) to find real, live services even when a city's public-facing "Open Data Hub" search UI is unreliable or improperly scoped.

## 3. Verified source landscape

Of 28 candidate sources recorded in `SOURCE_REGISTRY.md`/`.json` (grew from 23 to 28 this cycle — REDM-01, ISS-03, ISS-04, SAM-02, SAM-03 added):

- **7 are recommended MVP, all VERIFIED**: KC-01, KC-02, KC-03, SAM-01, ISS-01 (unchanged), plus **REDM-01 and ISS-03 (new this cycle)** — the registry's first geometry-capable (DIRECT_API) MVP sources.
- **12 SECONDARY sources**: SEA-03, UW-01, UW-02, WSDOT-01, ST-01, OTH-03B, OTH-03D, KC-06, ISS-04, SAM-02, SAM-03.
- **8 REJECTED**: KC-04, ISS-02, OTH-01, SEA-01, SEA-02, OTH-03A, OTH-03C, **OTH-02 (newly rejected — GovDelivery not accessible to the project owner, closing off the only remaining path to its topic ID)**.
- **2 UNRESOLVED**: KC-05 (portal UI still BLOCKED), KC-07 (real mechanism, stale 2014 test content only).

**Key confirmed finding (still active):** an active, dated, official closure exists on the canonical route right now. The East Lake Sammamish Trail is closed between Louis Thompson Rd NE and NE Inglewood Hill Rd from June 1, 2026 through the end of 2026 (no detour), for culvert replacement/salmon-habitat restoration on George Davis Creek. This remains a CONFIRMED_ROUTE_IMPACT event on route segment 9.

**New finding this cycle — REDM-01, filling a real Redmond-specific gap.** A live query against the City of Redmond's own `Traffic/Alerts` FeatureServer found 3 real active alerts: "Bel-Red Buffered Bike Lanes Project" (through Aug 2026, lane closures), "154th Ave NE Pavement Management" (intermittent lane closures), and "NE 24th Paving and Utility Upgrades" (through Oct 2027, single lane closures). All include structured fields, real geometry, and GovDelivery-integration fields suggesting this is the actual backend behind Redmond's public alerts. None of the three is yet confirmed to directly intersect the trail corridor itself — only a bounding-box test has been run, which the KC-06 finding (below) already showed can produce false positives; a proper corridor-buffer test is a recommended next step.

**New finding this cycle — ISS-03, the registry's first geometry-confirmed on-route hit.** A live geometry query against the City of Issaquah's `PWProjectsCurrentYearConstructionPublic` MapServer, using the route's exact bounding box, returned "East Lake Sammamish Pkwy Drainage Improvement Project" (location: "SE 51st St and ELSP") — a project explicitly located on East Lake Sammamish Parkway, part of this route's real Issaquah-approach corridor. This is real evidence of route relevance from a live geometry query, not a speculative or name-based match.

**New finding this cycle — ISS-04, SAM-02, SAM-03: real but not yet route-specific.** All three are confirmed live ArcGIS REST services with real records (60, 1343, and 22 respectively), but bounding-box tests either found no clearly route-relevant content (ISS-04: general development permits) or were not yet performed with route-specific keyword filtering (SAM-02, SAM-03). Classified SECONDARY pending further filtering work.

## 4. Source-by-source findings

Full detail for all 28 sources, including every required evaluation field and this cycle's updates, appears in `SOURCE_REGISTRY.md` and the machine-readable `SOURCE_REGISTRY.json` (validated, 28/28 source IDs match between files). Actual fetch/test evidence for each tested endpoint, across all five research cycles, appears in `API_AND_FEED_TEST_RESULTS.md` (Tests 1-42).

## 5. Rejected and unresolved sources

See Section 3 above for the rejection/unresolved list and one-line reasons; full reasoning appears in `SOURCE_GAPS.md`, which distinguishes gaps RESOLVED this cycle from those genuinely still open.

## 6. Route coverage assessment

Coverage is uneven across the route:
- **Strong**: East Lake Sammamish Trail (segments 8–9) and the Issaquah terminus (segment 10) — now with THREE MVP sources at the terminus (KC-03, ISS-01, ISS-03), including the registry's first confirmed geometry-verified on-route hit.
- **Adequate to strong**: Sammamish River Trail/Marymoor Park/ELST-Redmond (segments 6–8) — previously adequate via KC-02/KC-03 alone, now strengthened by REDM-01, a geometry-capable, Redmond-specific MVP source with real live alerts. Burke-Gilman north of Seattle (segments 3–4) remains adequate via KC-01, with confirmed secondary corroboration (WSDOT-01, OTH-03B).
- **Weak, unchanged this cycle**: UW/U-District (segment 1) and Burke-Gilman within Seattle (segment 2). Seattle's entire ArcGIS Server remains confirmed down (re-verified this cycle); only general-purpose UW blogs (SECONDARY) provide any signal.

## 7. Remaining gaps

Full detail in `SOURCE_GAPS.md`. The sixth cycle CLOSED the GovDelivery topic-ID gap (OTH-02 now REJECTED — no further action expected). The fifth cycle added REDM-01, ISS-03, ISS-04, SAM-02, SAM-03 (2 new MVP, 3 new SECONDARY) and refuted two unverified claims (Seattle SDOT_Bikes, Redmond Landbase/Trail). Carried forward, still genuinely open: (a) KC-05's portal UI remains BLOCKED; (b) SEA-03's repairs-subpage body content; (c) whether KC-07 ever carries live content; (d) **a proper geometry-corridor (not bbox) intersection test is now needed for THREE sources — KC-06, REDM-01, and ISS-03** — since only bounding-box tests have been run for any of them, and bbox is confirmed unreliable for this class of source (KC-06's Cottage Lake false positive). This is now the single most important remaining technical step before production build: 5 of 7 MVP sources remain text-based (whole-page-diff); the 2 newest MVP sources are geometry-capable but their exact corridor relevance is not yet fully proven.
