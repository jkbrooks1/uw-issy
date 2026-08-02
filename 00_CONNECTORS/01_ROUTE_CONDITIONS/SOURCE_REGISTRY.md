# SOURCE_REGISTRY.md — Lane 01_ROUTE_CONDITIONS

Route: University of Washington -> Burke-Gilman Trail -> Sammamish River Trail -> Marymoor Park -> East Lake Sammamish Trail -> Issaquah

This document and `SOURCE_REGISTRY.json` describe the same 28 sources and agree on classification/verification status. If a discrepancy is ever found, the JSON is the canonical machine-readable record; this file is generated to be human-readable from the same data.

Registry version 1.6 (updated 2026-07-29, sixth follow-up cycle: the project owner confirmed GovDelivery is not accessible to them, closing off the only remaining path to OTH-02's topic ID — reclassified SECONDARY/PARTIALLY_VERIFIED to REJECT/BLOCKED. No other sources changed).

Prior cycle (v1.5, fifth follow-up): Source count grew from 23 to 28. Four new sources added and directly live-verified via real ArcGIS REST queries, following a second user-supplied candidate-source list:

- **REDM-01** (City of Redmond `Traffic/Alerts` FeatureServer) — real, live, unauthenticated DIRECT_API with structured fields, geometry, and GovDelivery-integration fields. 3 real active alerts confirmed live. **MVP** — Redmond directly owns 3 route segments and had no dedicated source before this.
- **ISS-03** (Issaquah `PWProjectsCurrentYearConstructionPublic`) — real, live DIRECT_API; a geometry query against the route's own bounding box returned a genuinely on-route project ("East Lake Sammamish Pkwy Drainage Improvement Project"). **MVP.**
- **ISS-04** (Issaquah `active_projects_gc`) — real, live DIRECT_API, broader development-permit database; bbox hits found were general building permits, not confirmed road/trail-relevant. **SECONDARY.**
- **SAM-02** (Sammamish `Development_Activity_Map_Trakit_Prod_V2`) — real, live DIRECT_API, 1,343 general building/land-use permits. **SECONDARY.**
- **SAM-03** (Sammamish `Transportation/TCIP_Projects`) — real, live DIRECT_API, 22 multi-year capital-improvement projects. **SECONDARY.**

Also this cycle: Seattle's claimed working `SDOT_Bikes/MapServer` was directly retested and returned the identical "Service not started" error as `SDOT_StreetUse_V2` — confirms the entire `gisdata.seattle.gov` ArcGIS Server instance is down, not just one service; **reinforces SEA-01's REJECT**, not a new source. Redmond's claimed `DataSets/Landbase/MapServer` "Trail" layer was directly retested and returned HTTP 404 — does not exist, not added.

Legend: **MVP** = recommended for initial build. **SECONDARY** = useful supplement, not required for MVP. **REJECT** = evaluated and excluded, reason given. **UNRESOLVED** = needs further verification before a class can be assigned.

---

## KC-01 — King County Parks: Burke-Gilman Trail (Leafline Trails Network) page
- URL: https://kingcounty.gov/en/dept/dnrp/nature-recreation/parks-recreation/king-county-parks/trails/leafline-trails/burke-gilman
- Owning agency: King County Parks (DNRP)
- Acquisition: STRUCTURED_WEBPAGE (free-text alert banner on an otherwise stable page)
- Route sections: Burke-Gilman – north Lake WA/Kenmore; Burke-Gilman/connector – Bothell
- Verification: VERIFIED (directly fetched 2026-07-28; RE-FETCHED again 2026-07-28, third cycle)
- Recommendation: **MVP**
- Notes: Page carries closure/alert banners as the county's primary channel for this trail; no RSS/JSON alternative found. Third-cycle re-fetch (Test 21, see API_AND_FEED_TEST_RESULTS.md) found NO active alert banner present at fetch time — the page currently renders only standard trail description content ("About the Trail", quick facts, related topics) with no closure/construction text. This is treated as a real state change (the alert observed in the first research cycle is not necessarily still active), not a contradiction of the earlier VERIFIED finding — alert banners on this page family are confirmed transient/dynamic, appearing and disappearing as real conditions change. Page structure remains a plain heading+paragraph pattern (no semantic `<div role="alert">` wrapper observed on KC-03 either, see below), with no dedicated per-alert subpage or anchor when no alert is present.

## KC-02 — King County Parks: Sammamish River Trail (Leafline Trails Network) page
- URL: https://kingcounty.gov/en/dept/dnrp/nature-recreation/parks-recreation/king-county-parks/trails/leafline-trails/sammamish-river-trail
- Owning agency: King County Parks (DNRP)
- Acquisition: STRUCTURED_WEBPAGE
- Route sections: Sammamish River Trail – Bothell/Woodinville; Sammamish River Trail – Redmond; Marymoor Park approach
- Verification: VERIFIED (directly re-fetched 2026-07-28, third cycle — Test 21, see API_AND_FEED_TEST_RESULTS.md)
- Recommendation: **MVP**
- Notes: UPGRADED from PARTIALLY_VERIFIED to VERIFIED this cycle: the page was directly fetched (not just confirmed via search-result URL) and returned live, current content — footer copyright "© King County, WA 2026", full trail description (10.1-mile paved pathway, Bothell to Marymoor Park/Redmond, ADA notes, access points), same structural family as KC-01/KC-03. No closure/construction alert banner was present at fetch time. This cycle independently corroborated the segment's importance via a real GovDelivery "Regional Trail Alert" bulletin about a Sammamish River Trail closure in Woodinville (see OTH-02) — confirms King County, not the City of Woodinville, is the active publisher for this segment. VERIFIED here means "page reachable, current, and structurally confirmed" — it does not mean an alert is currently active; treat absence of a banner as "no known closure right now," not as a fetch failure.

## KC-03 — King County Parks: East Lake Sammamish Trail (Leafline Trails Network) page
- URL: https://kingcounty.gov/en/dept/dnrp/nature-recreation/parks-recreation/king-county-parks/trails/leafline-trails/east-lake-sammamish
- Owning agency: King County Parks (DNRP)
- Acquisition: STRUCTURED_WEBPAGE
- Route sections: East Lake Sammamish Trail – Redmond; East Lake Sammamish Trail – Sammamish; Issaquah approach/terminus
- Verification: VERIFIED (directly fetched 2026-07-28; RE-FETCHED again 2026-07-28, third cycle — closure still active)
- Recommendation: **MVP**
- Notes: Corroborated independently by SAM-01 (City of Sammamish) and OTH-01 (Seattle Bike Blog, non-authoritative cross-check only). Third-cycle re-fetch (Test 21) confirmed the closure notice is still live and unchanged: "A section of the East Lake Sammamish Trail will be closed starting June 1, 2026 and last through the rest of the year so crews can replace aging culverts," location "between Louis Thompson Rd NE and NE Inglewood Hill Rd." Structure is an `<h2>` heading ("ELST closure starting June 1, 2026") followed by `<p>` paragraphs — not a semantic alert component. An in-page anchor `#elst-closure-anchor-link` was observed on the heading link, but there is no dedicated, independently-fetchable subpage or persistent alert-specific URL.

## KC-04 — King County Parks Blog: Alerts category
- URL: https://kingcountyparks.org/category/alerts/
- Owning agency: King County Parks (DNRP)
- Acquisition: UNSTRUCTURED_WEBPAGE
- Verification: VERIFIED (directly fetched — but confirmed STALE: newest post found dated September 2021)
- Recommendation: **REJECT**
- Reason: Abandoned/superseded channel. Does not reflect the confirmed live 2026 ELST closure that appears on KC-03. Not fit for recurring automation.

## KC-05 — King County GIS Open Data: trail_line / regional trails datasets
- URL: https://gis-kingcounty.opendata.arcgis.com/ ; legacy catalog https://www5.kingcounty.gov/sdc/?Layer=trail
- Owning agency: King County GIS Center (KCIT) / King County Parks
- Acquisition: OPEN_DATA_DOWNLOAD (geometry reference only, not a status feed)
- Verification: BLOCKED (portal is JS-rendered; a plain fetch returned only page chrome, no dataset catalog or REST item ID)
- Recommendation: **UNRESOLVED**
- Notes: Not retested this cycle (out of scope for this follow-up pass, which focused on OTH-03, SEA-01/02, OTH-02, and WSDOT-01 per the work order). Still needs browser-based or known-item-ID follow-up in a future cycle. Superseded as a discovery *method*, not as a dataset, by KC-06/KC-07 below — those were found by bypassing this JS-rendered portal entirely and going straight to the underlying ArcGIS Server.

## KC-06 — King County ArcGIS Server: RoadAlerts/KingCo_Road_Alerts (unincorporated King County road closures)
- URL: https://gismaps.kingcounty.gov/arcgis/rest/services/RoadAlerts/KingCo_Road_Alerts/MapServer
- Owning agency: King County Road Services Division
- Acquisition: DIRECT_API (real, live, unauthenticated ArcGIS REST MapServer)
- Route sections: potentially any unincorporated-county road crossing (not yet fully enumerated against the GPX)
- Verification: VERIFIED — directly live-queried 2026-07-28 (fourth follow-up cycle): confirmed 24 real active closure records with structured fields (ClosureName, LocationLimits, Community, CityID, ClosureReason, PlannedClosedDate/PlannedOpenDate, ActualClosedDate/ActualOpenDate, ClosureState) and polyline geometry.
- Recommendation: **SECONDARY**
- Notes: A genuinely higher-quality data source (structured fields + geometry, not free-text) than any current MVP source — but scoped to **unincorporated King County roads only**, and this route runs almost entirely through incorporated cities. A bbox-intersection test against the route's own bounding box returned 1 of 24 records, and that record (Cottage Lake) is not actually near the trail corridor — a coincidental bbox hit. Confirms this source needs true geometry-corridor buffering, not bbox or jurisdiction matching, to avoid false-positive route-impact classifications. Valuable as a defense-in-depth check for any unincorporated-county crossings, not a primary signal.

## KC-07 — King County ArcGIS Server: RoadAlerts/nonKCRoadAlerts (MyCommute participating-jurisdiction alerts, incl. SammamishRoadAlerts)
- URL: https://gismaps.kingcounty.gov/arcgis/rest/services/RoadAlerts/nonKCRoadAlerts/MapServer
- Owning agency: King County (MyCommute platform), on behalf of participating jurisdictions
- Acquisition: DIRECT_API (real, live, unauthenticated; backend feed for King County's public MyCommute map)
- Route sections: East Lake Sammamish Trail – Sammamish (via `SammamishRoadAlerts_line`/`_point`) — the only participating jurisdiction (of Duvall/Tukwila/Sammamish/SeaTac) that this route passes through
- Verification: VERIFIED (schema/mechanism) — directly live-queried 2026-07-28. Structurally real with genuine status/date/URL fields (AlertTitle, AlertDescription, ClosureStatus, AlertStartDate, AlertEndDate, AlertURL) — but the only record present is a stale 2014 test entry ("Thisd is only as test" [sic]), not live content.
- Recommendation: **UNRESOLVED**
- Notes: Real, working mechanism, but currently empty of genuine alerts for Sammamish — neither confirmed abandoned nor confirmed active. A future cycle should re-query after some elapsed time to see if content ever changes before deciding REJECT vs. SECONDARY/MVP. Does not cover Redmond, Kenmore, Bothell, Woodinville, or Issaquah even if it becomes live, so it can never replace KC-01/02/03/SAM-01/ISS-01 for those segments.

## SEA-01 — SDOT Street Use ArcGIS MapServer (Potential Street Closures / Permits / Construction Look Ahead)
- URL: https://gisdata.seattle.gov/server/rest/services/SDOT/SDOT_StreetUse_V2/MapServer ; sibling https://gisdata.seattle.gov/server/rest/services/SDOT/SDOT_StreetUse/MapServer
- Owning agency: Seattle Department of Transportation (SDOT)
- Acquisition: DIRECT_API (currently non-functional)
- Verification: BLOCKED — RETESTED 2026-07-28 (follow-up cycle): both the `_V2` service and its non-`_V2` sibling were queried with `?f=json`. Both returned the identical ArcGIS service error: `"Service ... not started"`.
- Recommendation: **REJECT**
- Notes: Downgraded from UNRESOLVED to REJECT for this cycle: confirmed persistent failure across both known endpoint variants, not a transient blip. No realistic path to a working response without SDOT restarting the service on their end. Revisit opportunistically in a future cycle only if there is a specific reason to believe the service has been restored.

## SEA-02 — Seattle Open Data (Socrata): SDOT GIS Datasets catalog entry
- URL: https://data.seattle.gov/Transportation/SDOT-GIS-Datasets/jyjy-n3ap/data
- Owning agency: SDOT / City of Seattle IT
- Acquisition: OPEN_DATA_DOWNLOAD
- Verification: VERIFIED — RETESTED 2026-07-28 (follow-up cycle): `data.seattle.gov/resource/jyjy-n3ap.json` returned HTTP 400 (not a queryable resource); `data.seattle.gov/api/views/jyjy-n3ap.json` returned valid Socrata view metadata confirming this ID is a catalog/directory page ("SDOT GIS Datasets", 60+ referenced datasets) with an empty `columns` array — i.e., no row data of its own.
- Recommendation: **REJECT**
- Notes: Now definitively confirmed (not assumed) that this ID is a directory/landing page, not a closure or permit dataset. Remains a legitimate lead for discovering a genuinely relevant downstream Seattle GIS dataset in a future cycle — that follow-up (identifying and testing an actual construction/permit table from within the catalog) was not performed this cycle and is out of scope.

## SEA-03 — Seattle Parks & Recreation: Burke-Gilman Trail page (+ linked "Burke-Gilman Trail Repairs" project page)
- URL: https://www.seattle.gov/parks/parks/burke-gilman-trail ; repairs subpage https://www.seattle.gov/parks/about-us/projects/burke-gilman-trail-repairs
- Owning agency: Seattle Parks and Recreation
- Acquisition: UNSTRUCTURED_WEBPAGE
- Verification: PARTIALLY_VERIFIED — third cycle progress: the exact repairs-subpage URL is now CONFIRMED (directly fetched the parent page and extracted the real href `/parks/about-us/projects/burke-gilman-trail-repairs`, link text "Burke-Gilman Trail Repairs", listed under "Current Neighborhood Projects" > "Ongoing"). However, two direct WebFetch attempts at that exact subpage URL this cycle both returned only site navigation/menu markup, not the project's body content (status, dates, description) — a genuine tool/rendering limitation (the Seattle.gov project-page template appears to load body content in a way this fetch pass could not capture), not a dead link or fabricated content.
- Recommendation: **SECONDARY**
- Notes: Progress this cycle: URL upgraded from "inferred from nav link text" to "confirmed exact via direct fetch," but the subpage's actual current content (dates, active/inactive status) remains unconfirmed — do not treat as VERIFIED until a future session successfully retrieves the page's body text (may require a browser-rendered fetch rather than plain WebFetch).

## UW-01 — UW Facilities Blog (News & updates tag)
- URL: https://facilities.uw.edu/blog/tags/news-updates
- Owning agency: University of Washington Facilities
- Acquisition: UNSTRUCTURED_WEBPAGE
- Verification: VERIFIED (confirmed a real 2017 Burke-Gilman Trail closure post, and confirmed the blog is still active in 2025)
- Recommendation: **SECONDARY**
- Notes: General facilities blog, trail posts are rare; keyword filter required (trail, Burke-Gilman, closure, detour).

## UW-02 — UW Transportation Services: Shuttle alerts & updates page
- URL: https://transportation.uw.edu/getting-around/shuttles/alerts-updates
- Owning agency: UW Transportation Services
- Acquisition: UNSTRUCTURED_WEBPAGE
- Verification: VERIFIED (directly re-fetched 2026-07-28, third cycle — Test 21, see API_AND_FEED_TEST_RESULTS.md)
- Recommendation: **SECONDARY**
- Notes: UPGRADED from PARTIALLY_VERIFIED to VERIFIED (page directly fetched, content confirmed real) but with an important honest correction: the four alerts currently listed (Aug 28 2025, Apr 17 2025, Mar 20 2025, Dec 23 2024 — all shuttle-stop relocations/detours) contain NO mention of the Burke-Gilman Trail. A 2026 UW-holidays table is present but is unrelated to trail status. This contradicts the prior cycle's PARTIALLY_VERIFIED note, which relied on a search-engine snippet implying trail-relevant content; that snippet content is not present on the page as directly fetched this cycle (likely rotated out/archived, or the snippet was from a different/older page state). Practical conclusion: this page is confirmed real, current, and structurally understood (collapsible heading sections with IDs like `paragraph-content-section-11456-collapse`), but its trail-relevance is now shown to be rare/incidental in practice, not just in theory — keyword-filtering for "Burke-Gilman" or "trail" should be applied and will very often return zero matches. Remains SECONDARY, not MVP, on this stronger evidence.

## SAM-01 — City of Sammamish: 2026 Construction Projects page
- URL: https://www.sammamish.us/news/2026-construction-projects/
- Owning agency: City of Sammamish
- Acquisition: STRUCTURED_WEBPAGE
- Verification: VERIFIED (directly fetched 2026-07-28; corroborates KC-03 ELST closure and lists the George Davis Creek project)
- Recommendation: **MVP**

## SAM-02 — City of Sammamish: Development Activity Map (Trakit production service, ArcGIS REST)
- URL: https://maps.sammamishwa.gov/arcgis/rest/services/DevelopmentActivityMap/Development_Activity_Map_Trakit_Prod_V2/MapServer
- Owning agency: City of Sammamish
- Acquisition: DIRECT_API (real, live, unauthenticated)
- Verification: VERIFIED — directly live-queried 2026-07-28: 1,343 real building/land-use permit records confirmed.
- Recommendation: **SECONDARY**
- Notes: General permit database (parcels, site plans, short plats), not trail/road-specific — requires heavy geometry + keyword filtering to find the rare route-relevant permit. A sibling service, `DevelopmentActivityMap_2`, was tested and found genuinely empty (real service, `layers:[]`), not a dead link.

## SAM-03 — City of Sammamish: Transportation Capital Improvement Projects (TCIP_Projects, ArcGIS REST)
- URL: https://maps.sammamishwa.gov/arcgis/rest/services/Transportation/TCIP_Projects/FeatureServer
- Owning agency: City of Sammamish Public Works
- Acquisition: DIRECT_API (real, live, unauthenticated)
- Verification: VERIFIED — directly live-queried 2026-07-28: 22 real capital-improvement-project records confirmed.
- Recommendation: **SECONDARY**
- Notes: Multi-year capital-planning list (Years/Start_Year fields), overlapping conceptually with Lane 06 more than Lane 01's current-passability focus — useful as a slow-poll early-warning supplement, not a real-time status source.

## ISS-01 — City of Issaquah: Civic Alerts (Traffic Alerts category, CID=20)
- URL: https://www.issaquahwa.gov/CivicAlerts.aspx?CID=20
- Owning agency: City of Issaquah
- Acquisition: DOCUMENTED_FEED (RSS + email/SMS "Notify Me" confirmed present)
- Verification: VERIFIED (directly fetched 2026-07-28; live example traffic/construction alert confirmed)
- Recommendation: **MVP**
- Notes: General traffic-alerts category, not trail-specific — requires keyword/street-name filtering against the route's actual Issaquah-approach streets (East Lake Sammamish Parkway NE, East Lake Sammamish Lane NE — see ROUTE_SECTION_SOURCE_MAPPING.md for the full GPX-derived street list).

## ISS-02 — City of Issaquah Trail Alerts SMS subscription (text TRAILALERTS to 468311)
- URL: https://www.issaquahwa.gov/731/Parks-Trails
- Owning agency: City of Issaquah
- Acquisition: EMAIL_OR_SMS_ALERT_ONLY
- Verification: VERIFIED (existence confirmed via search)
- Recommendation: **REJECT**
- Reason: One-way SMS broadcast to a phone number; not automatable via n8n. Documented as a manual-review fallback channel only.

## ISS-03 — City of Issaquah: Public Works Current Year Construction Projects (ArcGIS REST)
- URL: https://apps.issaquahwa.gov/server/rest/services/General_Mapservices/PWProjectsCurrentYearConstructionPublic/MapServer
- Owning agency: City of Issaquah Public Works
- Acquisition: DIRECT_API (real, live, unauthenticated)
- Verification: VERIFIED — directly live-queried 2026-07-28: 62 real records; a bbox geometry query against the exact route corridor returned a genuinely on-route hit: "East Lake Sammamish Pkwy Drainage Improvement Project" (SE 51st St and ELSP).
- Recommendation: **MVP**
- Notes: Discovery required correcting a methodology error mid-cycle: an initial query against Issaquah's ArcGIS Hub search API without org-scoping returned irrelevant results from unrelated organizations (a Maryland town, a Canadian city); re-querying with the correct org filter (`emvaTQRwXeOg8U36`) surfaced the real service. Structured fields (ProjectName, ProjectDescription, ProjectLocation, CurrentYearStatus, geometry) exceed ISS-01's free-text format; both are retained as MVP since ISS-01 covers non-construction traffic alerts ISS-03 does not.

## ISS-04 — City of Issaquah: Active Projects (ArcGIS REST)
- URL: https://apps.issaquahwa.gov/server/rest/services/General_Mapservices/active_projects_gc/MapServer
- Owning agency: City of Issaquah Development Services
- Acquisition: DIRECT_API (real, live, unauthenticated)
- Verification: VERIFIED — directly live-queried 2026-07-28: 60 real records; bbox hits found (short plats, townhome projects) were general development permits, not confirmed road/trail-relevant.
- Recommendation: **SECONDARY**
- Notes: Broader development-permit database than ISS-03; requires heavier manual review, no confirmed on-route hit yet (unlike ISS-03's drainage-project match).

## WSDOT-01 — WSDOT Traveler Information API (Highway Alerts / Work Zones / WZDx)
- URL: https://wsdot.wa.gov/traffic/api/
- Owning agency: Washington State Department of Transportation
- Acquisition: DIRECT_API (requires free developer Access Code)
- Verification: PARTIALLY_VERIFIED — API mechanism itself still not live-queried (no Access Code obtained), but this cycle RESOLVED the relevance question with real evidence.
- Recommendation: **SECONDARY**
- Notes: CONFIRMED this cycle: SR-522 (Bothell Way) runs directly alongside the Burke-Gilman Trail through Kenmore — the City of Kenmore's WSDOT-funded "Burke Gilman/SR522 Accessibility Project" (Segment B, 57th–61st Ave NE) documents an existing grade-separated pedestrian underpass at 73rd Ave NE and a signed at-grade SR-522 crossing used by the official King County detour route during trail closures. A second confirmed relevance point: the Sammamish River Trail passes through the I-405/SR-522 interchange area between Bothell and Woodinville, where active interchange construction has required flagger-controlled trail crossings (per a May 2025 trail-condition report). WSDOT is therefore genuinely relevant to two specific route segments (Burke-Gilman – north Lake WA/Kenmore; Sammamish River Trail – Bothell/Woodinville), not rejected as statewide noise — but stays SECONDARY, not MVP, because (a) the live API itself still requires an Access Code not obtained this cycle, and (b) the VERIFIED King County Leafline pages (KC-01, KC-02) already cover trail-level status for these same segments.

## ST-01 — Sound Transit news releases / blog (Downtown Redmond Link Extension / Marymoor Village station)
- URL: https://www.soundtransit.org/get-to-know-us/news-events/news-releases
- Owning agency: Sound Transit
- Acquisition: UNSTRUCTURED_WEBPAGE
- Verification: PARTIALLY_VERIFIED (existence and historical relevance confirmed via search; not re-fetched for current 2026 content)
- Recommendation: **SECONDARY**
- Notes: Major construction near Marymoor/Redmond concluded with the May 2025 station openings; relevance to Lane 01 is now residual/low.

## REDM-01 — City of Redmond: Traffic/Alerts (ArcGIS REST FeatureServer)
- URL: https://gis.redmond.gov/arcgis/rest/services/Traffic/Alerts/FeatureServer
- Owning agency: City of Redmond Public Works
- Acquisition: DIRECT_API (real, live, unauthenticated ArcGIS REST FeatureServer)
- Route sections: Sammamish River Trail – Redmond; Marymoor Park; East Lake Sammamish Trail – Redmond
- Verification: VERIFIED — directly live-queried 2026-07-28 (fifth follow-up cycle): confirmed 3 real active alerts (0 point, 2 line, 1 polygon) with structured fields (AlertName, LocationDescription, AlertStartDate/EndDate, TrafficImpactDescription, AlertStatus, GovDeliveryMessage/Subject) and real geometry.
- Recommendation: **MVP**
- Notes: Redmond directly owns three route segments and had no dedicated source in this registry before this cycle. Real active alerts found: "Bel-Red Buffered Bike Lanes Project" (through Aug 2026), "154th Ave NE Pavement Management," "NE 24th Paving and Utility Upgrades." GovDelivery-integration fields suggest this database is the actual backend behind Redmond's public alerts. None of the three current alerts is yet confirmed to directly intersect the trail corridor itself (they are street projects, some near but distinct from the trail) — a future cycle should run a proper geometry-corridor buffer test to distinguish CONFIRMED_ROUTE_IMPACT from NEARBY_NO_CONFIRMED_IMPACT.

## OTH-01 — Seattle Bike Blog (unofficial community news blog)
- URL: https://www.seattlebikeblog.com/
- Owning agency: None — independent publication
- Acquisition: UNSTRUCTURED_WEBPAGE
- Verification: VERIFIED (real, active blog; its April 2026 ELST closure post was corroborated by two official sources)
- Recommendation: **REJECT**
- Reason: Per standing project rules, community/manual-review sources must not auto-publish route status. Valuable only as a human discovery/lead signal, always cross-checked against an official source before any classification.

## OTH-02 — GovDelivery WAKING (King County) bulletin/topic RSS feeds
- URL: https://content.govdelivery.com/accounts/WAKING/ ; subscriber signup https://public.govdelivery.com/accounts/WAKING/subscriber/new
- Owning agency: King County (via Granicus/GovDelivery)
- Acquisition: DOCUMENTED_FEED
- Verification: BLOCKED — REJECTED, sixth follow-up cycle (2026-07-29): the project owner confirmed GovDelivery is not accessible to them, closing off both remaining paths to the topic ID (a live subscribe flow, or a direct King County Parks inquiry conducted by the project owner).
- Recommendation: **REJECT** (downgraded from SECONDARY)
- Notes: The real content confirmed in prior cycles remains true for the record — directly fetched two real GovDelivery WAKING bulletins relevant to this route ("Regional Trail Alert: Sammamish River Trail Closure in Woodinville 8/20-31," bulletin 2068179; "Update: New dates for construction work on Sammamish River Trail in Bothell," bulletin 3b3827b) — but with no path left to an automatable topic-scoped feed URL, and given KC-01/02/03 already provide direct official coverage of the same segments, this source is now closed rather than left as an open action item.

## OTH-03A — City of Bothell: Notify Me subscription lists
- URL: https://www.bothellwa.gov/list.aspx
- Owning agency: City of Bothell
- Acquisition: MANUAL_REVIEW_ONLY
- Verification: VERIFIED — directly fetched 2026-07-28 (follow-up cycle)
- Recommendation: **REJECT**
- Notes: Confirmed categories: Parks and Recreation Board (advisory meetings only), Board/Commission Meetings, City Council, Emergency Alerts, City of Bothell News, Public Land Use Notices. No dedicated trail, Burke-Gilman, Sammamish River Trail, or general construction/traffic-alert category exists. Resolves prior UNVERIFIED status to a confirmed negative finding.

## OTH-03B — City of Kenmore: Burke Gilman/SR522 Accessibility Project page
- URL: https://www.kenmorewa.gov/our-city/projects/current-projects/sr-522-west-segment-b-improvements-57th-to-61st-avenues
- Owning agency: City of Kenmore
- Acquisition: UNSTRUCTURED_WEBPAGE
- Verification: PARTIALLY_VERIFIED — City of Kenmore's Parks & Recreation page was directly fetched successfully (confirms the site is real/live); this specific project page returned HTTP 403 on a direct retry, but its detailed content was independently confirmed via WebSearch extraction of the same live URL, corroborated by Bothell-Kenmore Reporter news coverage of a related trail-closure/safety-improvement story.
- Recommendation: **SECONDARY**
- Notes: This is the strongest and most specifically trail-relevant of the four small-city sources found this cycle: it documents a WSDOT-funded ADA connection project to the Burke-Gilman Trail, an existing pedestrian underpass at 73rd Ave NE, and the signed at-grade SR-522 crossing used during official King County trail detours — directly substantiating WSDOT-01's confirmed relevance to this route.

## OTH-03C — City of Lake Forest Park: Civic Alerts (general, CID=1) and Notify Me
- URL: https://www.cityoflfp.gov/CivicAlerts.aspx?CID=1 (note: cityoflfp.com 301-redirects to cityoflfp.gov — domain corrected this cycle)
- Owning agency: City of Lake Forest Park
- Acquisition: MANUAL_REVIEW_ONLY
- Verification: VERIFIED — directly fetched 2026-07-28 (follow-up cycle)
- Recommendation: **REJECT**
- Notes: Confirmed a real, working general CivicAlerts module (police/budget-related content at test time, not trail-specific) and Notify Me subscription. No dedicated trail/parks/public-works alert category found. Resolves prior UNVERIFIED status to a confirmed negative finding.

## OTH-03D — City of Woodinville: Alert Center (general RSS/Notify Me)
- URL: https://www.woodinville.gov/AlertCenter.aspx?CID=Emergency-Alerts-6 (correct domain; the prior cycle's recorded domain, woodinvillewa.gov, does not resolve — DNS failure confirmed twice this cycle)
- Owning agency: City of Woodinville
- Acquisition: DOCUMENTED_FEED (general RSS at /Rss.aspx)
- Verification: PARTIALLY_VERIFIED — directly fetched 2026-07-28 (follow-up cycle)
- Recommendation: **SECONDARY**
- Notes: IMPORTANT CORRECTION this cycle: domain corrected from woodinvillewa.gov (non-resolving) to woodinville.gov (live, confirmed). Confirmed a real CivicPlus Alert Center with a general RSS feed and Notify Me subscription; no dedicated Parks/Trails category found; no active alerts at test time. King County's GovDelivery "Regional Trail Alert" bulletin about the Sammamish River Trail closure in Woodinville (see OTH-02) confirms King County, not the City of Woodinville, is the more active publisher for this exact segment — KC-02 remains the correct MVP source; OTH-03D is a general-purpose supplement only.

---

## Summary table

| ID | Source | Agency | Acquisition | Verification | Recommendation |
|---|---|---|---|---|---|
| KC-01 | Burke-Gilman Leafline page | King County Parks | STRUCTURED_WEBPAGE | VERIFIED | MVP |
| KC-02 | Sammamish River Trail Leafline page | King County Parks | STRUCTURED_WEBPAGE | VERIFIED | MVP |
| KC-03 | East Lake Sammamish Trail Leafline page | King County Parks | STRUCTURED_WEBPAGE | VERIFIED | MVP |
| KC-04 | Parks Blog Alerts category | King County Parks | UNSTRUCTURED_WEBPAGE | VERIFIED (stale) | REJECT |
| KC-05 | GIS Open Data trail_line | King County GIS | OPEN_DATA_DOWNLOAD | BLOCKED | UNRESOLVED |
| KC-06 | RoadAlerts/KingCo_Road_Alerts (unincorporated) | King County Road Services | DIRECT_API | VERIFIED | SECONDARY |
| KC-07 | RoadAlerts/nonKCRoadAlerts (SammamishRoadAlerts) | King County (MyCommute) | DIRECT_API | VERIFIED (schema; content stale/test-only) | UNRESOLVED |
| SEA-01 | SDOT StreetUse ArcGIS MapServer | SDOT | DIRECT_API | BLOCKED (confirmed persistent) | REJECT |
| SEA-02 | SDOT GIS Datasets (Socrata) | SDOT | OPEN_DATA_DOWNLOAD | VERIFIED (confirmed catalog, not data) | REJECT |
| SEA-03 | Seattle Parks Burke-Gilman page | Seattle Parks | UNSTRUCTURED_WEBPAGE | PARTIALLY_VERIFIED | SECONDARY |
| UW-01 | UW Facilities Blog | UW Facilities | UNSTRUCTURED_WEBPAGE | VERIFIED | SECONDARY |
| UW-02 | UW Transportation shuttle alerts | UW Transportation | UNSTRUCTURED_WEBPAGE | VERIFIED (no current trail content) | SECONDARY |
| SAM-01 | 2026 Construction Projects page | City of Sammamish | STRUCTURED_WEBPAGE | VERIFIED | MVP |
| SAM-02 | Development Activity Map (Trakit) | City of Sammamish | DIRECT_API | VERIFIED | SECONDARY |
| SAM-03 | TCIP_Projects | City of Sammamish | DIRECT_API | VERIFIED | SECONDARY |
| ISS-01 | Civic Alerts / Traffic Alerts | City of Issaquah | DOCUMENTED_FEED | VERIFIED | MVP |
| ISS-02 | Trail Alerts SMS | City of Issaquah | EMAIL_OR_SMS_ALERT_ONLY | VERIFIED | REJECT |
| ISS-03 | PW Current Year Construction Projects | City of Issaquah | DIRECT_API | VERIFIED (on-route hit confirmed) | MVP |
| ISS-04 | Active Projects | City of Issaquah | DIRECT_API | VERIFIED | SECONDARY |
| WSDOT-01 | Traveler Information API | WSDOT | DIRECT_API | PARTIALLY_VERIFIED (relevance now confirmed) | SECONDARY |
| ST-01 | News releases/blog | Sound Transit | UNSTRUCTURED_WEBPAGE | PARTIALLY_VERIFIED | SECONDARY |
| REDM-01 | Traffic/Alerts | City of Redmond | DIRECT_API | VERIFIED | MVP |
| OTH-01 | Seattle Bike Blog | Independent | UNSTRUCTURED_WEBPAGE | VERIFIED | REJECT |
| OTH-02 | GovDelivery WAKING RSS/bulletins | King County | DOCUMENTED_FEED | BLOCKED (project owner has no GovDelivery access) | REJECT |
| OTH-03A | Bothell Notify Me lists | City of Bothell | MANUAL_REVIEW_ONLY | VERIFIED (no trail channel) | REJECT |
| OTH-03B | Kenmore SR522/Burke-Gilman project page | City of Kenmore | UNSTRUCTURED_WEBPAGE | PARTIALLY_VERIFIED | SECONDARY |
| OTH-03C | Lake Forest Park Civic Alerts | City of Lake Forest Park | MANUAL_REVIEW_ONLY | VERIFIED (no trail channel) | REJECT |
| OTH-03D | Woodinville Alert Center | City of Woodinville | DOCUMENTED_FEED | PARTIALLY_VERIFIED | SECONDARY |
