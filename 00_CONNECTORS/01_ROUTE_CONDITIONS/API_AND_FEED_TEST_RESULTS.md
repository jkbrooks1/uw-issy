# API_AND_FEED_TEST_RESULTS.md — Lane 01_ROUTE_CONDITIONS

This file records the actual fetch attempts made across five research cycles: the initial cycle (2026-07-28), a follow-up verification cycle (also 2026-07-28, later session, focused on resolving documented gaps), a third follow-up cycle (also 2026-07-28, later session still, focused on the GovDelivery topic ID, re-confirming KC-02/SEA-03-repairs/UW-02, and DOM/extraction notes for the 5 MVP sources), a fourth follow-up cycle (also 2026-07-28, later session still, triggered by a user-supplied list of candidate GIS/ArcGIS sources, yielding KC-06/KC-07 via King County's ArcGIS Server REST root, Tests 29-32), and a fifth follow-up cycle (also 2026-07-28, later session still, triggered by a SECOND user-supplied candidate-source list covering Seattle/Redmond/Sammamish/Issaquah, yielding REDM-01, ISS-03, ISS-04, SAM-02, SAM-03, Tests 34-42). No result below is inferred or assumed — where a fetch was not performed, that is stated explicitly rather than presenting a guess as a test result.

---

## Initial cycle (2026-07-28)

### Test 1 — SDOT Street Use ArcGIS MapServer
- URL tested: `https://gisdata.seattle.gov/server/rest/services/SDOT/SDOT_StreetUse_V2/MapServer?f=json`
- Tool: WebFetch
- Result: Service-level error returned in the JSON body: `"Service SDOT/SDOT_StreetUse_V2/MapServer not started"` (functionally a 500-class ArcGIS service error, not a 404 — the service is registered but not running/serving at test time).
- Conclusion: BLOCKED at test time. See Test 11 for the follow-up retest.

### Test 2 — Seattle Open Data (Socrata) SDOT GIS Datasets landing page
- URL tested: `https://data.seattle.gov/Transportation/SDOT-GIS-Datasets/jyjy-n3ap/data`
- Tool: WebFetch
- Result: Returned only the Socrata portal's JavaScript-rendered navigation/header chrome — no dataset table, schema, or row data was retrievable via a plain fetch.
- Conclusion: PARTIALLY_VERIFIED at test time. See Test 12 for the follow-up retest.

### Test 3 — King County Parks: East Lake Sammamish Trail page
- URL tested: `https://kingcounty.gov/en/dept/dnrp/nature-recreation/parks-recreation/king-county-parks/trails/leafline-trails/east-lake-sammamish`
- Tool: WebFetch
- Result: Successfully retrieved page content. Confirmed a live, dated closure alert: trail closed between Louis Thompson Rd NE and NE Inglewood Hill Rd, June 1, 2026 through end of 2026, no detour, culvert replacement/salmon-habitat work (George Davis Creek). Page includes a map graphic and a link to the City of Sammamish's "Cone Zone" construction-update subscription.
- Conclusion: VERIFIED. This is the strongest single confirmed result of the initial research cycle and directly demonstrates CONFIRMED_ROUTE_IMPACT on the ELST – Sammamish route section.

### Test 4 — King County Parks Blog: Alerts category
- URL tested: `https://kingcountyparks.org/category/alerts/`
- Tool: WebFetch
- Result: Page loaded successfully (real WordPress blog, standard pagination). Newest visible post dated September 2021; posts trail back to 2013.
- Conclusion: VERIFIED as a real page, but VERIFIED-STALE for operational purposes. REJECTED as an acquisition source for this reason.

### Test 5 — King County GIS Open Data portal search
- URL tested: `https://gis-kingcounty.opendata.arcgis.com/search?q=trail`
- Tool: WebFetch
- Result: Returned only a header label ("King County GIS Open Data") with no dataset catalog content — confirms the search UI is JavaScript-rendered and not retrievable via a plain fetch.
- Conclusion: BLOCKED. Not retested this cycle (out of scope for this follow-up pass).

### Test 6 — City of Issaquah Civic Alerts (Traffic Alerts category)
- URL tested: `https://www.issaquahwa.gov/CivicAlerts.aspx?CID=20`
- Tool: WebFetch
- Result: Successfully retrieved page content. Confirmed a working CivicPlus/CivicEngage alerts module with an RSS feed link and an email/SMS "Notify Me" subscription option. A live example alert (a street-specific traffic/construction alert with named streets and dates) was present at test time.
- Conclusion: VERIFIED. Classified DOCUMENTED_FEED on the strength of the confirmed RSS option; the RSS XML itself was not independently fetched and parsed.

### Test 7 — City of Sammamish 2026 Construction Projects page
- URL tested: `https://www.sammamish.us/news/2026-construction-projects/`
- Tool: WebFetch
- Result: Successfully retrieved page content. Confirmed prose descriptions of 7 named 2026 projects, including the George Davis Creek restoration project explicitly referencing an East Lake Sammamish Trail closure — consistent with Test 3.
- Conclusion: VERIFIED.

### Test 8 — Seattle Parks & Recreation Burke-Gilman Trail page
- URL tested: `https://www.seattle.gov/parks/parks/burke-gilman-trail`
- Tool: WebFetch
- Result: Returned mostly site-navigation markup, with one substantive item: a link to a "Burke-Gilman Trail Repairs" project subpage (not independently followed).
- Conclusion: PARTIALLY_VERIFIED. Not retested this cycle.

### Test 9 — UW Facilities Blog: 2017 Burke-Gilman Trail closure post
- URL tested: `https://facilities.uw.edu/blog/posts/2017/10/30/bgt-closure`
- Tool: WebFetch
- Result: Confirmed real post, tagged "News & updates," dated November 1, 2017.
- Conclusion: VERIFIED as a real, existing content type on this blog.

### Test 10 — GovDelivery WAKING bulletins RSS (general account feed)
- URL tested: `https://content.govdelivery.com/accounts/WAKING/bulletins.rss`
- Tool: WebFetch
- Result: HTTP 406 Not Acceptable.
- Conclusion: BLOCKED at test time. See Tests 15-17 for the follow-up.

---

## Follow-up verification cycle (2026-07-28, later session)

This cycle's scope, per the work order: (1) directly fetch the four small-city websites (OTH-03), (2) retest SEA-01/SEA-02, (3) identify the correct GovDelivery topic for King County Parks trail alerts (OTH-02), (4) derive Issaquah-approach streets and WSDOT crossing points from the GPX turn-cue waypoints.

### Test 11 — SDOT Street Use ArcGIS MapServer, retest of both variants
- URLs tested: `https://gisdata.seattle.gov/server/rest/services/SDOT/SDOT_StreetUse/MapServer?f=json` (non-`_V2` sibling) and re-confirmation of the `_V2` path
- Tool: WebFetch
- Result: Both returned the identical error: `{"error":{"code":500,"message":"Service SDOT/SDOT_StreetUse/MapServer not started ","details":[]}}`
- Conclusion: BLOCKED, confirmed persistent across both known endpoint variants. Reclassified SEA-01 from UNRESOLVED to REJECT — this is not a transient failure that a different URL would fix.

### Test 12 — Seattle Socrata SDOT GIS Datasets, direct SODA endpoint retest
- URLs tested: `https://data.seattle.gov/resource/jyjy-n3ap.json` and `https://data.seattle.gov/resource/jyjy-n3ap.json?$limit=5`
- Tool: WebFetch
- Result: Both returned HTTP 400 Bad Request — confirms `jyjy-n3ap` is not a queryable SODA tabular resource ID.
- URL tested: `https://data.seattle.gov/api/views/jyjy-n3ap.json` (Socrata view-metadata endpoint)
- Tool: WebFetch
- Result: Valid JSON returned. Dataset name "SDOT GIS Datasets"; description confirms it is a directory/index of 60+ separate City of Seattle Transportation GIS datasets; the `columns` field is present but empty (`[]`).
- Conclusion: VERIFIED (as a catalog/index page, not as a data feed). Reclassified SEA-02 from PARTIALLY_VERIFIED/UNRESOLVED to VERIFIED/REJECT — the ambiguity is resolved: this ID has no queryable data of its own. A genuinely useful downstream dataset may exist within the catalog it describes, but identifying and testing one was out of scope this cycle.

### Test 13 — City of Bothell notification lists
- URL tested: `https://www.bothellwa.gov/list.aspx`
- Tool: WebFetch
- Result: Successfully retrieved page content. Categories confirmed: Parks and Recreation Board (advisory meetings), Board/Commission Meetings, City Council, Emergency Alerts, City of Bothell News, Public Land Use Notices. No dedicated trail/Burke-Gilman/Sammamish River Trail/construction-alert category.
- Conclusion: VERIFIED (real site, real fetch) with a confirmed negative finding — no dedicated trail channel exists. Also tested `https://www.bothellwa.gov/1063/Parks-Trails`, which surfaced a general construction-updates signup (`list.aspx`), a Main Street project traffic-alerts page, and an Emergency Alerts page — none of it Burke-Gilman/Sammamish-River-Trail specific.

### Test 14 — City of Kenmore parks page and SR-522/Burke-Gilman project page
- URL tested: `https://www.kenmorewa.gov/parks-recreation`
- Tool: WebFetch
- Result: Successfully retrieved page content (site confirmed real and live).
- URL tested: `https://www.kenmorewa.gov/our-city/projects/current-projects/sr-522-west-segment-b-improvements-57th-to-61st-avenues`
- Tool: WebFetch
- Result: HTTP 403 Forbidden on direct retry.
- Follow-up: WebSearch retrieved detailed content from this same live, indexed URL: a WSDOT-funded ADA-connection project to the Burke-Gilman Trail, referencing an existing pedestrian underpass at 73rd Ave NE and a signed at-grade SR-522 crossing used by King County's official Burke-Gilman detour route. Corroborated independently by a Bothell-Kenmore Reporter article on a related Burke-Gilman/Kenmore trail-closure safety-improvement story.
- Conclusion: PARTIALLY_VERIFIED (site and project confirmed real via a mix of direct fetch and independent search-snippet corroboration of the same URL; the exact project page itself could not be re-fetched a second time in this session).

### Test 15 — City of Lake Forest Park site (domain correction)
- URL tested: `https://cityoflfp.com/`
- Tool: WebFetch
- Result: 301 redirect to `https://www.cityoflfp.gov/`.
- URL tested: `https://www.cityoflfp.gov/`
- Tool: WebFetch
- Result: Successfully retrieved page content. Confirmed a general CivicAlerts module (CID=1, police/budget content at test time) and a Notify Me subscription option. No dedicated trail/parks/public-works alert category found.
- Conclusion: VERIFIED (real site, real fetch) with a confirmed negative finding for a dedicated trail channel. Domain corrected from `.com` to the live `.gov`.

### Test 16 — City of Woodinville site (domain correction)
- URL tested: `https://woodinvillewa.gov/` and `https://www.woodinvillewa.gov/`
- Tool: WebFetch
- Result: `getaddrinfo ENOTFOUND` — this domain does not resolve (confirmed twice).
- Follow-up: WebSearch identified the correct live domain: `woodinville.gov`.
- URL tested: `https://www.woodinville.gov/AlertCenter.aspx?CID=Emergency-Alerts-6`
- Tool: WebFetch
- Result: Successfully retrieved page content. Confirmed a CivicPlus Alert Center with a general RSS feed (`/Rss.aspx`) and Notify Me subscription (`/list.aspx?Mode=Subscribe#alertCenter`); no active alerts at test time; no dedicated Parks/Trails category found.
- URL tested: `https://www.woodinville.gov/243/Parks`
- Tool: WebFetch
- Result: Successfully retrieved page content. No trail closure/construction alert content; only a general problem-reporting link.
- Conclusion: PARTIALLY_VERIFIED. IMPORTANT: the domain recorded in the prior cycle (`woodinvillewa.gov`) is WRONG/non-resolving; the correct domain (`woodinville.gov`) is now confirmed and recorded.

### Test 17 — GovDelivery WAKING: real bulletin content discovery
- URLs tested (via WebSearch then WebFetch): `https://content.govdelivery.com/accounts/WAKING/bulletins/2068179` ("Regional Trail Alert: Sammamish River Trail Closure in Woodinville 8/20-31") and `https://content.govdelivery.com/accounts/WAKING/bulletins/3b3827b` ("Update: New dates for construction work on Sammamish River Trail in Bothell")
- Tool: WebFetch
- Result: Both bulletins successfully retrieved and confirmed real, official King County Parks content directly relevant to this route's Sammamish River Trail segment. Neither page displayed a topic-specific subscribe link or topic ID in the retrieved content — only a generic "update your preferences" link.
- Conclusion: PARTIALLY_VERIFIED (upgraded from BLOCKED). The content stream is real and relevant; the specific subscribable topic ID for automation remains unidentified.

### Test 18 — GovDelivery WAKING subscriber signup page
- URL tested: `https://public.govdelivery.com/accounts/WAKING/subscriber/new`
- Tool: WebFetch
- Result: Page loaded but only shows subscription-type fields (email/SMS, contact info); the topic checklist itself is not present in the fetched HTML — it is revealed only after a real email is submitted into the interactive form.
- Conclusion: BLOCKED for the specific purpose of identifying a topic ID via passive fetch. This is a genuine interactive-flow limitation, not a search-effort shortfall.

### Test 19 — King County subscription page
- URL tested: `https://kingcounty.gov/en/legacy/about/news/subscribe.aspx`
- Tool: WebFetch
- Result: HTTP 404 Not Found.
- Conclusion: This specific legacy URL no longer resolves; the real, working subscriber entry point is the GovDelivery-hosted page tested in Test 18.

### Test 20 — WSDOT/route-crossing research (GPX turn-cue waypoint analysis)
- Method: WebSearch queries cross-referencing the supplied GPX turn-cue waypoints against WSDOT project documentation and news coverage, plus targeted WebSearch for WSDOT crossing/interchange documentation near Bothell, Kenmore, Redmond, and Issaquah.
- Result 1 (CONFIRMED): SR-522 (Bothell Way) runs directly alongside the Burke-Gilman Trail through the City of Kenmore. The city's WSDOT-funded "Burke Gilman/SR522 Accessibility Project" documents an existing grade-separated pedestrian underpass at 73rd Ave NE and a signed at-grade SR-522 crossing used by King County's official detour route during trail closures. This corresponds to the GPX's Burke-Gilman – north Lake WA/Kenmore segment (waypoints in the ~47.66–47.74, -122.27 to -122.29 range).
- Result 2 (CONFIRMED): The Sammamish River Trail passes through the I-405/SR-522 interchange area between Bothell and Woodinville (GPX waypoints ~19-21, ~47.752-47.758, -122.20 to -122.21), where active interchange-area construction has required flagger-controlled trail crossings (per a May 2025 trail-condition report found via WebSearch).
- Result 3 (WEAKER / NOT ON-ROUTE): East Lake Sammamish Parkway SE meets I-90 at a diamond interchange (Exit 17) near the Issaquah-Preston Trail junction, east of this route's GPX terminus at ~47.552,-122.044. The supplied GPX does not extend to this interchange, so it is documented as corridor context, not a confirmed on-route WSDOT crossing.
- Issaquah-approach street list, ORIGINALLY derived from the v1 GPX's turn-cue waypoints (waypoints 34-46): Northeast 65th Street (waypoint 34); East Lake Sammamish Parkway Northeast (waypoints 35, 36, 40, 42); East Lake Sammamish Lane Northeast (waypoint 43); East Lake Sammamish Trail itself (waypoints 30, 33, 37, 38, 44, 45). **CORRECTED, fourth follow-up cycle:** "Northeast 65th Street" was mislabeled — it is a Redmond/Bear Creek-area street, not part of the Issaquah approach, and is removed from the route entirely by the project owner's corrected v2 GPX (see Test 33 below and RESEARCH_FINDINGS.md item 8). The corrected list is: East Lake Sammamish Parkway Northeast; East Lake Sammamish Lane Northeast; East Lake Sammamish Trail. See ROUTE_SECTION_SOURCE_MAPPING.md for the current authoritative version.

### Test 33 — Canonical GPX correction supplied by project owner (fourth follow-up cycle)
- File compared: `/Users/jkbrookspersonal/Downloads/v2.UnivWA-Issaquah.gpx` (new, supplied by project owner) vs. the prior canonical `data/route/UnivWA-Issaquah.gpx` (now archived at `data/route/archive/UnivWA-Issaquah.v1.20260728.gpx`)
- Method: Parsed both GPX files directly (Python `xml.etree.ElementTree`), computed trackpoint count, total haversine distance, bounding box, and full waypoint list for each; diffed the waypoint lists.
- Result: v1 had 1,429 trackpoints, 33.49 mi, 47 waypoints. v2 has 1,470 trackpoints, 33.83 mi, 42 waypoints. Bounding box identical in both (lat 47.55207-47.75889, lon -122.3057 to -122.04414). The diff shows v1's waypoints 25-37 (a jog through "Bear Creek Trail" and onto "Northeast 65th Street" / an early "East Lake Sammamish Parkway Northeast" segment near Redmond, ~47.66-47.664 lat) are replaced in v2 by a "Marymoor Connector Trail" path (six new waypoints, ~47.66-47.674 lat, -122.097 to -122.129 lon) that more directly traces through the Marymoor Park area before rejoining the East Lake Sammamish Trail at the same point (~47.661, -122.098).
- Conclusion: This is a genuine route correction, not a cosmetic change — the corrected route now actually matches its stated description ("...Sammamish River Trail → Marymoor Park → East Lake Sammamish Trail...") more faithfully. The new canonical GPX was installed at the required canonical path; the prior version was archived, not deleted, per the project's last-known-good preservation rule. Downstream documents (ROUTE_SECTION_SOURCE_MAPPING.md, IMPLEMENTATION_RECOMMENDATION.md, RESEARCH_FINDINGS.md, and this file) were corrected accordingly.
- Conclusion: WSDOT-01's relevance to this corridor is CONFIRMED (not rejected) at two specific, named crossing zones. WSDOT-01 remains SECONDARY (not MVP) because the live Traveler Information API itself still requires a developer Access Code not obtained this cycle, and because KC-01/KC-02 already provide VERIFIED/PARTIALLY_VERIFIED trail-level status for the same two segments.

---

## Third follow-up cycle (2026-07-28, later session — DOM/extraction notes, KC-02/SEA-03/UW-02 re-confirmation, GovDelivery topic-ID deep probe)

### Test 21 — MVP source DOM/extraction structure pass (KC-01, KC-02, KC-03, SAM-01, ISS-01)
- Method: Direct WebFetch of each of the 5 current MVP source pages, with prompts specifically asking for HTML structure, verbatim alert text, date format, and stable per-item anchors/URLs (for future scraper planning only — no scraper was written).
- KC-01 (`.../leafline-trails/burke-gilman`): Re-fetched. No active alert banner present at this fetch time (contrast with the first research cycle, which observed a live banner) — page shows only standard trail description content. Confirms alert banners on this page family are transient/dynamic.
- KC-02 (`.../leafline-trails/sammamish-river-trail`): Directly fetched for the first time this project (previously only confirmed via search-result URL). Live, current page (footer "© King County, WA 2026"); full trail description present; no active alert banner at fetch time. See SOURCE_REGISTRY.json for full verbatim excerpt.
- KC-03 (`.../leafline-trails/east-lake-sammamish`): Re-fetched. Closure notice confirmed still live and unchanged: `<h2>` heading "ELST closure starting June 1, 2026" followed by `<p>` paragraphs; verbatim text and location detail matched the first cycle's finding exactly. In-page anchor `#elst-closure-anchor-link` observed on the heading link (no dedicated subpage).
- SAM-01 (`sammamish.us/news/2026-construction-projects/`): Re-fetched. Content is a series of plain headings/paragraphs per project, not a table/accordion/CMS list. Verbatim project text quoted (Southeast 6th Street Improvements; George Davis Creek). Dates are mostly seasonal prose ("spring," "late fall 2026"); a page-level "Apr 09, 2026" publication date appears at the bottom. Named projects link out to their own dedicated URLs (e.g. `/projects/se-6th-street-improvements/`) but have no in-page anchor of their own.
- ISS-01 (`issaquahwa.gov/CivicAlerts.aspx?CID=20`): Re-fetched. CivicPlus module uses semantic `<ul>`/`<li>` list markup, not a table/card layout. Example alert: "Traffic Alert: W Sunset Way", "Posted on June 30, 2026". Each item has a stable per-item permalink with a numeric ID, e.g. `/m/newsflash/Home/Detail/6480`.
- Conclusion: All 5 MVP sources are free-text/prose HTML pages with no machine-readable date microformat and no semantic alert markup (no `<div role="alert">` or equivalent observed anywhere). Only ISS-01 offers a stable numeric per-item ID/URL; KC-01/02/03 and SAM-01 have no persistent per-alert identifier and must be monitored via full-page diffing against a stored last-known-good value. Full "Proposed Extraction Approach" narrative per source is recorded in `IMPLEMENTATION_RECOMMENDATION.md` and in each source's `research_notes` field in `SOURCE_REGISTRY.json`.

### Test 22 — SEA-03 linked "Burke-Gilman Trail Repairs" subpage, direct fetch attempts
- URLs tested: `https://www.seattle.gov/parks/parks/burke-gilman-trail` (parent, to extract the exact link) and `https://www.seattle.gov/parks/about-us/projects/burke-gilman-trail-repairs` (the linked subpage itself, fetched twice with different prompts).
- Result: Parent page fetch succeeded and returned the exact href verbatim: `/parks/about-us/projects/burke-gilman-trail-repairs`, link text "Burke-Gilman Trail Repairs", under "Current Neighborhood Projects" > "Ongoing" — this upgrades the URL from "inferred" (prior cycle) to "confirmed exact" (this cycle). Both direct fetch attempts at the subpage URL itself returned only site navigation/menu markup, not the project's body content (status, description, dates) — a genuine WebFetch/rendering limitation for this specific Seattle.gov page template, not a dead link.
- Conclusion: PARTIALLY_VERIFIED (unchanged) — real progress (exact URL confirmed) but the subpage's actual current content remains unconfirmed. A future session should try a browser-rendered fetch instead of plain WebFetch.

### Test 23 — UW-02 (UW Transportation shuttle alerts page), direct re-fetch
- URL tested: `https://transportation.uw.edu/getting-around/shuttles/alerts-updates`
- Result: Successfully fetched. Four alerts currently present: Aug 28 2025 (South Lake Union/Fred Hutch stop relocation), Apr 17 2025 (Dial-A-Ride/HSE stop relocation), Mar 20 2025 (Health Sciences Express detour), Dec 23 2024 (HSE stop relocation) — none mention the Burke-Gilman Trail. A separate 2026 UW-holidays table is present but unrelated to trail status. This directly contradicts the prior cycle's PARTIALLY_VERIFIED note (based on a search snippet implying trail-relevant content), which is not reproducible in the page as fetched this cycle.
- Conclusion: UPGRADED to VERIFIED (page reachable, current, structure understood) with an honest correction that current content is not trail-relevant. Remains SECONDARY.

### Test 24 — GovDelivery topic-ID deep probe, angle 1: additional bulletin discovery
- Method: WebSearch for more "Regional Trail Alert" bulletins from the WAKING account.
- Result: Found and noted bulletin `24231fe` ("Closure on the Burke-Gilman Trail May 6") and bulletin `2d9c7c0` ("Portion of the East Lake Sammamish Trail closed beginning June 1") — the latter independently corroborates KC-03's 2026 ELST closure via a third channel (GovDelivery, in addition to KC-03 itself and SAM-01).
- Conclusion: Further confirms the content stream is real and on-topic; does not surface a topic ID.

### Test 25 — GovDelivery topic-ID deep probe, angle 2: numbered signup URL
- URL tested: `https://public.govdelivery.com/accounts/WAKING/signup/46599`
- Result: Rendered only the generic subscriber form (Email/SMS Wireless Number/Name fields, Facebook/Google sign-in, footer links) — no topic name or ID exposed in the page title, headings, or visible form fields.
- Conclusion: Dead end — the numeric path segment does not expose a human-readable topic name via a plain fetch.

### Test 26 — GovDelivery topic-ID deep probe, angle 3: bulletin-page topic metadata
- URL tested: `https://content.govdelivery.com/accounts/WAKING/bulletins/2d9c7c0`
- Result: No topic/category tag or label visible on the bulletin page itself; only a generic "Update your preferences or unsubscribe from messages" link, not a topic-specific subscribe link.
- Conclusion: Dead end — individual bulletin pages do not surface their originating topic ID.

### Test 27 — GovDelivery topic-ID deep probe, angle 4: developer API documentation
- URL tested: `https://developers.govdelivery.com/api/comm_cloud_v1/Content/API/Comm%20Cloud%20V1/API_CommCloudV1_Topics.htm`
- Result: Confirms topic codes are assigned by GovDelivery (or chosen by the account administrator) at topic-creation time, and that the "List all Topics" API endpoint requires authenticated API credentials. No unauthenticated/public topic-enumeration method is documented.
- Conclusion: Confirms, from GovDelivery's own documentation, that there is no passive/unauthenticated way to enumerate this account's topics. The topic-ID gap is a structural platform limitation, not a research-effort shortfall — genuinely unresolved without either (a) a human completing the real subscribe flow with a monitored email, or (b) a direct inquiry to King County Parks communications staff.

### Test 28 — Subscriber signup page, re-check for hidden topic fields
- URL tested: `https://public.govdelivery.com/accounts/WAKING/subscriber/new`
- Result: Confirmed again this cycle: only Email/SMS subscription-type toggle, contact-info fields, and social sign-in buttons are present pre-submission; no topic checklist is rendered until a real email is submitted.
- Conclusion: Consistent with the prior cycle's finding; re-confirmed rather than assumed carried-forward.

### Test 29 — King County ArcGIS Server REST root, direct curl (fourth follow-up cycle)
- URL tested: `https://gismaps.kingcounty.gov/arcgis/rest/services?f=json`
- Method: Plain `curl`, not WebFetch (to get raw JSON rather than an LLM's HTML-to-markdown summary, after a first WebFetch pass on this exact URL returned a summary worth independently verifying).
- Result: HTTP 200, valid ArcGIS REST services-directory JSON. Real response: `{"currentVersion":10.91,"folders":["Accela","Address","Administration","BaseMaps","Census","DCHS","Districts","DLS","DPH","Environment","FWSD","Hydro","Imagery","INet","KCGIS","Parks","Planning","Printing","Property","PublicSafety","RoadAlerts","Roads","Survey","SWD","Testing","Topo","Transit","Utilities","Utility","Wastewater","WLRD"],"services":[{"name":"Geometry","type":"GeometryServer"},{"name":"SampleWorldCities","type":"MapServer"}]}` — 31 real folders, no authentication required.
- Conclusion: This confirms King County's underlying ArcGIS Server is directly reachable via plain HTTP, unlike the JS-rendered `opendata.arcgis.com` portal UI (KC-05) that fronts it. The `RoadAlerts` and `Parks` folder names were the basis for Tests 30-32 below. The two default Esri sample services (`Geometry`, `SampleWorldCities`) present alongside real County folders confirm this is a standard, not specially locked-down, ArcGIS Server instance.

### Test 30 — RoadAlerts folder listing and KingCo_Road_Alerts MapServer inspection
- URLs tested: `https://gismaps.kingcounty.gov/arcgis/rest/services/RoadAlerts?f=json`, `.../RoadAlerts/KingCo_Road_Alerts/MapServer?f=json`, `.../RoadAlerts/KingCo_Road_Alerts/MapServer/0?f=json`
- Result: Folder listing confirmed 9 real services: `AVL_LiGOplowdata`, `AVL_supportlayers`, `GP_TravelAlerts2` (GPServer), `KingCo_Bridges`, `KingCo_Road_Alerts`, `KingCo_Traffic_Cameras`, `nonKCRoadAlerts`, `TravelAlertsAdmin2`, `TravelAlertsAdminOps`. `KingCo_Road_Alerts/MapServer` returned a real service description: "This map depicts road segments that are affected by closures, construction, detours, etc in unincorporated King County, WA." Layer 0 ("Travel Alerts") field list confirmed 34 real fields spanning a `ClosureSegment` table and a `CurrentClosures_View` (ClosureName, LocationLimits, Community, CityID, ClosureReason, ClosureTypeID, PlannedClosedDate, ActualClosedDate, PlannedOpenDate, ActualOpenDate, ClosureState, StatusOther, Comment, GlobalID, Shape geometry).
- Conclusion: Real, live, structured, geometry-capable DIRECT_API confirmed. Became source KC-06.

### Test 31 — KingCo_Road_Alerts live feature query (count, sample records, route-bbox intersection)
- URLs tested: `.../KingCo_Road_Alerts/MapServer/0/query?where=1=1&returnCountOnly=true&f=json`; a 3-record sample query with explicit `outFields`; a bounding-box intersection query using the route's exact bbox (`-122.3057,47.55207,-122.04414,47.75889`, `inSR=4326`).
- Result: 24 active closure records county-wide at query time (real examples returned: "SE Mud Mountain Road between SR 410 and 248th Avenue SE," Enumclaw; "Renton Ave S between 78th Ave S and S 128th St," Skyway; "SE Covington-Sawyer Road east of 164th Pl SE," Covington). The bbox-intersection query returned exactly 1 record: "NE 165th St between 179th Pl NE and 183rd Pl NE," Cottage Lake, "Water over roadway," ActualClosedDate 2024-10-04, StatusOther including a direct `kingcounty.gov/roads/ne-165th-street` URL.
- Conclusion: Confirms the API is genuinely live and queryable with real, current data — but also confirms the Cottage Lake hit is a coincidental bounding-box match, not an actual on-corridor closure (Cottage Lake is not on this route). This is direct empirical proof that bbox filtering is inadequate for this source; a true line-buffer geometry intersection against the full GPX is required before this source could safely feed CONFIRMED_ROUTE_IMPACT classifications.

### Test 32 — nonKCRoadAlerts folder and SammamishRoadAlerts_line query
- URLs tested: `.../RoadAlerts/nonKCRoadAlerts/MapServer?f=json`; `.../nonKCRoadAlerts/MapServer/5/query?where=1=1&returnCountOnly=true&f=json`; the same layer with `outFields=*`
- Result: Service description: "Road alerts for participating local jurisdiction in King county, WA. this service is primarily intended to be used by the King County MyCommute web site." Confirmed 8 layers (point+line pairs for Duvall, Tukwila, Sammamish, SeaTac). `SammamishRoadAlerts_line` (layer 5) record count: 1. That record's real fields: `AlertID: 1, AlertTitle: "Test", AlertDescription: "Thisd is only as test", AlertURL: "https://www.sammamish.us/", ClosureStatus: "Restricted", AlertStartDate: 2014-09-05, AlertEndDate: 2014-09-06, CreatedDate: 2014-09-05, ModifiedDate: 2014-09-05` (epoch millisecond timestamps converted for readability).
- Conclusion: The schema (AlertTitle/AlertDescription/ClosureStatus/AlertStartDate/AlertEndDate/AlertURL) is real, live, and closure-status-capable — but the only content present is an eleven-plus-year-old test/placeholder record, not genuine live data. Became source KC-07, classified UNRESOLVED rather than REJECT or SECONDARY.

## Fifth follow-up cycle (2026-07-28, later session) — Tests 34-42

Triggered by a second user-supplied candidate-source list covering Seattle, Lake Forest Park, Redmond, Sammamish, and Issaquah, each with claimed working ArcGIS REST endpoints. Every claim was tested directly with curl rather than accepted at face value.

### Test 34 — Seattle SDOT_Bikes MapServer (claimed working, contradicts SEA-01's REJECT status)
- URLs tested: `https://gisdata.seattle.gov/server/rest/services/SDOT/SDOT_Bikes/MapServer?f=json`; layer 3 (Multi-use Trails) query; `SDOT/SDOT_StreetUse_V2/MapServer?f=json` re-tested for comparison
- Result: All three returned the identical error: `{"error":{"code":500,"message":"Service ... not started ","details":[]}}`
- Conclusion: The claim that Seattle has "strong, confirmed" REST access was not reproducible. This confirms the entire `gisdata.seattle.gov` ArcGIS Server instance is currently non-operational, not just the SDOT_StreetUse_V2 service already rejected as SEA-01. No new Seattle source was added; SEA-01's REJECT status is reinforced with broader evidence.

### Test 35 — Redmond DataSets/Landbase/MapServer (claimed "Trail" layer)
- URL tested: `https://gis.redmond.gov/arcgis/rest/services/DataSets/Landbase/MapServer?f=json`
- Result: HTTP response body: `{"error":{"code":404,"message":"Service DataSets/Landbase/MapServer not found ","details":[]}}`
- Conclusion: This specific service does not exist. Not added to the registry.

### Test 36 — Redmond ArcGIS REST root and Traffic/Alerts discovery
- URLs tested: `https://gis.redmond.gov/arcgis/rest/services?f=json`; `.../Traffic?f=json`; `.../Projects?f=json`; `.../Common?f=json`
- Result: Real root folder listing (17 folders: AddressViewer, Common, CrimeMap, CSS, ESRICommunity, FlockCameras, ForceMetrics, KingCounty911, Masterworks, Projects, PV, QAlert, SnowPlow, Topo, Traffic, Utilities, UV, Vertical). `Traffic` folder contains real services: `Alerts2023` (MapServer), `Alerts` (FeatureServer + MapServer), `Cameras` (MapServer). `Common` folder contains aerial imagery/basemap/geocoding services only, no trail-specific layer (refuting the "Trail" layer claim tested in Test 35).
- Conclusion: `Traffic/Alerts` is the real, relevant service — became source REDM-01.

### Test 37 — Redmond Traffic/Alerts live query (all 3 geometry layers)
- URLs tested: `.../Traffic/Alerts/FeatureServer?f=json`; layer 0/1/2 field lists; count queries and full-field queries on layers 1 and 2
- Result: Layer 0 (point): 0 records. Layer 1 (line): 2 records - "Bel-Red Buffered Bike Lanes Project" (Bel-Red Road, West Lake Sammamish Pkwy to NE 30th St, 04/20/2026-08/31/2026, lane closures 7am-3:30pm, AlertStatus "ACT") and "Pavement Management - 154th Ave NE" (Redmond Way to NE 85th St, intermittent lane closures). Layer 2 (polygon): 1 record - "NE 24th Paving and Utility Upgrades" (172nd Ave NE to West Lake Sammamish Pkwy NE, 04/16/2026-10/29/2027, single lane closures, AlertStatus "ACT"). All records include real GovDeliveryMessage HTML content with direct links to `redmond.gov` project pages and a `gis.redmond.gov/traffic?id=...` map link.
- Conclusion: Real, live, current data confirmed with actual field values, not just schema. REDM-01 confirmed VERIFIED, classified MVP given Redmond's direct ownership of 3 route segments.

### Test 38 — Issaquah ArcGIS Hub search API, first attempt (methodology error caught)
- URL tested: `https://open-data-issaquahwa.hub.arcgis.com/api/v3/datasets?q=trail`
- Result: Returned datasets named "911 Trail," "Art Trail," "Washington-Rochambeau Trail," "Capt John Smith Trail" - inspection of the `owner`/`orgId` fields on these results showed owner `mauryt_havredegracemd` (Havre de Grace, Maryland) and other unrelated organizations, plus a Moncton, Canada trail-closure PDF.
- Conclusion: This query was NOT scoped to Issaquah and returned irrelevant nationwide results from a shared/multi-tenant ArcGIS Hub search. This was caught and corrected in Test 39 rather than being reported as a real finding - a genuine methodology error, disclosed rather than hidden.

### Test 39 — Issaquah ArcGIS Hub search, corrected with proper org scoping
- URLs tested: `.../api/v3/datasets?q=issaquah%20construction` (to discover the real org ID); then `.../api/v3/datasets?filter[orgId]=emvaTQRwXeOg8U36&q=trail` and `&q=active%20projects` (properly scoped)
- Result: First query surfaced Issaquah's real ArcGIS org ID (`emvaTQRwXeOg8U36`, confirmed via results like "Issaquah City Limits," "Issaquah Light basemap"). Properly org-scoped queries then returned genuine Issaquah datasets: real trail reference layers (`apps.issaquahwa.gov/server/rest/services/SingleLayers/Trails/FeatureServer/2`, several basemap trail layers), and construction-relevant hits: "Active Projects" (`General_Mapservices/active_projects_gc/MapServer/1`), "PWProjectsCurrentYearConstructionPublic" (`General_Mapservices/PWProjectsCurrentYearConstructionPublic/MapServer/0`).
- Conclusion: Confirmed Issaquah runs a real ArcGIS Server at `apps.issaquahwa.gov`, separate from the Hub's own search index. Two real MapServer layers identified for direct testing (Tests 40-41).

### Test 40 — Issaquah PWProjectsCurrentYearConstructionPublic, live query + route-corridor bbox test
- URLs tested: field-list query; count query; a bounding-box geometry query using the route's exact bbox (`-122.3057,47.55207,-122.04414,47.75889`, `inSR=4326`)
- Result: Real fields confirmed (ProjectName, ProjectNumber, ProjectDescription, ProjectLocation, StaffContactName, ProjectType, IsActive, CurrentYearStatus, StaffContactEmail, MajorProjectsLink, geometry). Count: 62 real records. The bbox query returned 5 results including "East Lake Sammamish Pkwy Drainage Improvement Project," location "SE 51st St and ELSP" - a real project name explicitly naming East Lake Sammamish Parkway, part of this route's actual Issaquah-approach corridor.
- Conclusion: Genuine on-route relevance confirmed by direct geometry query, not assumed from the layer's general subject matter. Became source ISS-03, classified MVP.

### Test 41 — Issaquah active_projects_gc, live query + route-corridor bbox test
- URLs tested: field-list query; count query; the same bbox geometry query as Test 40
- Result: Real fields confirmed (PROJECT_NO, IsActive, ProjectName, Description, Location, Status, CityContactName, WebURL, geometry). Count: 60 real records. The bbox query returned 3 results: "FOUTUNE CLOUD LLC SHORT PLAT," "PARK PLACE TOWNHOMES - Trails at Sammamish," "300 RAINIER TOWNHOMES" - general development/building permits, not obviously road or trail construction.
- Conclusion: Real and live, but no confirmed route-impacting content found (unlike Test 40). Became source ISS-04, classified SECONDARY.

### Test 42 — Sammamish ArcGIS REST root and DevelopmentActivityMap / Transportation folders
- URLs tested: `https://maps.sammamishwa.gov/arcgis/rest/services?f=json`; `.../DevelopmentActivityMap?f=json`; `.../DevelopmentActivityMap/DevelopmentActivityMap_2/MapServer?f=json`; `.../DevelopmentActivityMap/Development_Activity_Map_Trakit_Prod_V2/MapServer?f=json` (+ field list + count); `.../Roads?f=json`; `.../Transportation?f=json`; `.../Transportation/TCIP_Projects/FeatureServer/0?f=json` (+ count)
- Result: Root folder listing real (31 folders). `DevelopmentActivityMap_2` is real but genuinely empty (`"layers":[]`, `fullExtent` all `"NaN"` - a real, live, but unused/misconfigured alternate service, not a broken link). `Development_Activity_Map_Trakit_Prod_V2` is the real production service: 1,343 real permit records confirmed via count query, fields include IDENTIFIER, TYPE, STATUS, SITE_LOCATION, APPLIED/APPROVED/EXPIRED/CLOSED dates. `Roads` folder contains only a generic `Streets` MapServer, no alerts-equivalent. `Transportation/TCIP_Projects` is real: 22 records, fields Project_Num, Project_Name, Years, Start_Year, Description.
- Conclusion: Two real new sources confirmed. `Development_Activity_Map_Trakit_Prod_V2` became SAM-02 (SECONDARY - general permit database, not trail-specific). `TCIP_Projects` became SAM-03 (SECONDARY - multi-year capital-projects list).

---

## Sources found only via WebSearch (search-result snippets), not independently fetched with WebFetch

- Sound Transit news releases (ST-01) — existence and historical relevance confirmed via search; current 2026 content not independently re-fetched (out of scope this cycle).
- King County GIS Open Data portal (KC-05) — not retested this cycle (out of scope for this follow-up pass; still BLOCKED from the initial cycle).
- WSDOT's live Traveler Information API payload — documentation pages were reviewed but the API itself was not queried (requires a registered Access Code not obtained in any cycle to date).
- The exact GovDelivery WAKING subscriber topic checklist/ID (OTH-02) — confirmed across four independent discovery angles this cycle (Tests 24-27) to require submitting a real email into an interactive form, or authenticated API access; not retrievable via any passive fetch attempted.
- Seattle Parks Burke-Gilman Trail Repairs subpage body content (SEA-03) — the exact URL is now confirmed (Test 22), but its body content could not be retrieved via WebFetch in two attempts this cycle.

Note: KC-02 and UW-02, previously listed in this section in the prior cycle's version of this document, were directly fetched with WebFetch this cycle (Tests 21 and 23) and are removed from this "search-snippet only" list accordingly.

## Sample retention

No large raw datasets, credentials, cookies, or tokens were retrieved or saved in any cycle. The only "samples" retained are the prose excerpts quoted above and in SOURCE_REGISTRY.md/.json, themselves already sanitized (public page text, no PII, no secrets). No separate `sample-responses/` directory was created because no structured machine-readable payload was successfully retrieved that would warrant a saved sample file.
