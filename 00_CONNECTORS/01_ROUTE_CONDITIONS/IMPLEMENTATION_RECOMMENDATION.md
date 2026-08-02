# IMPLEMENTATION_RECOMMENDATION.md — Lane 01_ROUTE_CONDITIONS (working draft)

Updated 2026-07-28 (fifth follow-up cycle: added REDM-01, ISS-03, ISS-04, SAM-02, SAM-03 — four new city-run ArcGIS REST sources found via a second user-supplied candidate list, plus KC-06/KC-07 from the fourth cycle). This is the working-level recommendation; the polished, final version for distribution is `UW_ISSY_01_ROUTE_CONDITIONS_IMPLEMENTATION_RECOMMENDATION_v1.md` in this same directory. Both describe the same architecture; the v1 file is the authoritative one to share/copy to Downloads.

## MVP source set (7 sources — grew from 5 this cycle, all VERIFIED)

1. KC-01 — King County Parks Burke-Gilman Trail page (VERIFIED)
2. KC-02 — King County Parks Sammamish River Trail page (VERIFIED)
3. KC-03 — King County Parks East Lake Sammamish Trail page (VERIFIED)
4. SAM-01 — City of Sammamish 2026 Construction Projects page (VERIFIED)
5. ISS-01 — City of Issaquah Civic Alerts (Traffic Alerts, CID=20) (VERIFIED)
6. **REDM-01 (new this cycle)** — City of Redmond Traffic/Alerts ArcGIS REST FeatureServer (VERIFIED) — real, live, structured, geometry-capable, 3 active alerts confirmed. Fills a real gap: Redmond owns 3 route segments and had no dedicated source before this cycle.
7. **ISS-03 (new this cycle)** — City of Issaquah Public Works Current Year Construction Projects ArcGIS REST MapServer (VERIFIED) — a live geometry query found a genuinely on-route project ("East Lake Sammamish Pkwy Drainage Improvement Project"), real evidence of route relevance, not a speculative match.

The two new MVP sources are the first DIRECT_API (structured, geometry-capable) sources in the MVP set — every prior MVP source (KC-01/02/03, SAM-01, ISS-01) is free-text HTML/RSS. Neither REDM-01 nor ISS-03 has yet had every one of its current live records confirmed to intersect the exact trail line (only a bounding-box test was performed for each) — this is flagged as a remaining implementation step, not assumed away.

## Secondary source set (10 sources — KC-06 added this cycle)

SEA-03 (Seattle Parks Burke-Gilman page — repairs-subpage URL now confirmed exact, body content still unretrieved), UW-01 (UW Facilities Blog), UW-02 (UW Transportation shuttle alerts — now VERIFIED but confirmed to carry no current trail-relevant content), WSDOT-01 (Traveler Information API — relevant at two named crossing zones), ST-01 (Sound Transit news), OTH-03B (City of Kenmore Burke Gilman/SR522 Accessibility Project page), OTH-03D (City of Woodinville Alert Center), **KC-06 (King County ArcGIS Server `RoadAlerts/KingCo_Road_Alerts`, NEW this cycle — real, live, unauthenticated DIRECT_API with structured fields and geometry, but scoped to unincorporated King County roads only, which this route rarely touches)**, plus manual periodic review of OTH-01 (Seattle Bike Blog) as a human early-warning/discovery tool (never auto-published).

OTH-03A (Bothell) and OTH-03C (Lake Forest Park) remain REJECTED — confirmed no dedicated trail channel.

## Secondary additions this cycle: ISS-04, SAM-02, SAM-03

**ISS-04** (Issaquah `active_projects_gc`) — real, live DIRECT_API, broader development-permit database than ISS-03; bbox hits found (short plats, townhomes) were not confirmed road/trail-relevant. SECONDARY.

**SAM-02** (Sammamish `Development_Activity_Map_Trakit_Prod_V2`) — real, live DIRECT_API, 1,343 general building/land-use permits. SECONDARY — requires heavy filtering; SAM-01 remains the more directly useful trail-relevant source for this city.

**SAM-03** (Sammamish `Transportation/TCIP_Projects`) — real, live DIRECT_API, 22 multi-year capital-improvement projects. SECONDARY — slow-moving capital list, overlaps conceptually with Lane 06 more than Lane 01.

## Unresolved source added (fourth cycle)

**KC-07** (King County ArcGIS Server `RoadAlerts/nonKCRoadAlerts`, specifically `SammamishRoadAlerts_line`/`_point`) — a real, live, unauthenticated DIRECT_API with a genuine closure-status schema (AlertTitle, AlertDescription, ClosureStatus, AlertStartDate/EndDate, AlertURL), structurally the best-suited source in the entire registry for automated route-impact detection if it were populated — but the only record present is a stale 2014 test entry, not live content. Not REJECTED (mechanism is real and could go live at any time) and not SECONDARY (nothing to act on today). Re-query in a future cycle to check for a status change before deciding either way. Note this layer only covers Sammamish among this route's cities — it can never substitute for KC-01/02/03/SAM-01/ISS-01 on the other segments even if it becomes live.

## DOM/Extraction Notes for the 5 MVP Sources (new this cycle — planning/documentation only, no scraper built)

Per the work order and the standing CLAUDE.md scope rule, production n8n workflow build remains out of scope. The notes below describe what was directly observed on each MVP page this cycle (2026-07-28, Test 21 in `API_AND_FEED_TEST_RESULTS.md`) to inform a *future* scraper design — plain structural description, not working extraction code.

### KC-01 — King County Parks Burke-Gilman Trail page
- **Observed structure:** No active alert banner was present at this fetch time (contrast with the first research cycle, which observed a live banner) — confirming alerts on this page family are transient. When present (as directly observed on the sibling KC-03 page, same CMS template), an alert renders as a plain `<h2>` heading followed by one or more `<p>` paragraphs — **not** inside a semantic `<div role="alert">` or a dedicated CSS alert component.
- **Date format:** Prose, e.g. "June 1, 2026" — not a machine-parseable microformat (no `<time datetime="...">` observed).
- **Per-item stability:** No stable per-alert anchor or dedicated URL exists when no alert is present; even when an alert exists (per KC-03), the anchor only jumps within the same page, not to an independently-fetchable resource.
- **Proposed extraction approach:** Fetch the full page on a schedule; extract the visible body text (or a specific heading+paragraph block if a stable CSS class/ID for the alert container can be confirmed by a future browser-based inspection); diff the extracted text against a stored last-known-good value; flag any change for manual review rather than attempting fixed-field date/location parsing.

### KC-02 — King County Parks Sammamish River Trail page
- **Observed structure:** Directly fetched for the first time this project. Same CMS template family as KC-01/KC-03 (heading+paragraph pattern for alerts, full trail-description content otherwise). No active alert banner present at this fetch time.
- **Date format / per-item stability:** Same as KC-01 (prose dates, no stable per-alert anchor/URL).
- **Proposed extraction approach:** Identical pattern to KC-01 — full-page diff against last-known-good, not per-item ID tracking.

### KC-03 — King County Parks East Lake Sammamish Trail page
- **Observed structure:** Active closure alert confirmed present and unchanged from the prior cycle: `<h2>` heading "ELST closure starting June 1, 2026" followed by `<p>` paragraphs. Verbatim: "A section of the East Lake Sammamish Trail will be closed starting June 1, 2026 and last through the rest of the year so crews can replace aging culverts," with location detail "The 600 ft trail closure area is located between Louis Thompson Rd NE and NE Inglewood Hill Rd."
- **Date format:** Prose Month Day, Year.
- **Per-item stability:** An in-page anchor `#elst-closure-anchor-link` was observed on the heading's link — but it only jumps within this same page; there is no dedicated, independently-fetchable subpage or persistent alert-specific URL.
- **Proposed extraction approach:** Fetch the full page; locate a heading matching a pattern like "`<segment> closure starting <date>`" or containing keywords "closure"/"closed"/"detour"; capture the immediately following paragraph(s) as the alert body; diff against last-known-good to detect new/changed/resolved closures. This is the clearest, most template-able example of the three King County Leafline pages because it currently has a real, structured example to design against.

### SAM-01 — City of Sammamish 2026 Construction Projects page
- **Observed structure:** A single long-form news article/page with a series of plain headings and prose paragraphs, one per project — not a table, accordion, or structured CMS list component. Verbatim examples: "The Southeast 6th Street Improvements consist of the construction of a new public street..." and "The work on George Davis Creek is expected to start this spring and go through to late fall 2026."
- **Date format:** Mostly descriptive/seasonal ("spring," "late fall 2026") rather than precise day-level dates; a page-level publication date ("Apr 09, 2026") appears at the bottom of the article.
- **Per-item stability:** Named projects link out to their own dedicated URLs (e.g. `www.sammamish.us/projects/se-6th-street-improvements/`), but individual project write-ups within this news-article page itself have no unique in-page anchor/fragment ID.
- **Proposed extraction approach:** Treat this as a single annual article; parse per-project text blocks by heading; cross-reference each block's text against the known trail-name/street-name list (see ROUTE_SECTION_SOURCE_MAPPING.md); where a project has its own dedicated project-page URL, prefer following out to that URL as the more stable long-term reference point rather than anchoring into this annual page (which will presumably be replaced by a "2027 Construction Projects" page in the future).

### ISS-01 — City of Issaquah Civic Alerts (Traffic Alerts, CID=20)
- **Observed structure:** CivicPlus module using semantic `<ul>`/`<li>` list markup — not a table or div-card layout. Each item contains an `<h3>` heading with an internal link, descriptive paragraph text, and category/date metadata.
- **Date format:** Prose "Posted on Month Day, Year" (example observed: "Posted on June 30, 2026").
- **Per-item stability:** Each alert has a stable per-item permalink with a numeric ID embedded in the path, e.g. `/m/newsflash/Home/Detail/6480` — this is the one MVP source with a genuinely durable per-item identifier.
- **Proposed extraction approach:** Parse the `<li>` list for title, date, and detail-link; follow the `/m/newsflash/Home/Detail/{id}` link for full alert text; use the numeric ID as the durable per-alert key for deduplication and change detection (more reliable than title-text matching, and the only MVP source where per-item — rather than whole-page — change detection is realistically possible). The RSS feed linked from this page's parent civic-alerts module (confirmed present in the first research cycle) is likely a cleaner structured alternative to HTML parsing and should be preferred if a future build re-confirms its exact feed URL and item schema.

### Cross-source summary
No MVP source uses a semantic alert component (`<div role="alert">` or equivalent) or a machine-parseable date microformat (`<time datetime="...">`). Only ISS-01 provides a stable numeric per-item URL; KC-01, KC-02, KC-03, and SAM-01 have no persistent per-alert identifier and must be monitored via whole-page (or whole-section) content diffing against a stored last-known-good value rather than per-item change tracking. This is a real structural constraint on any future scraper design, not a gap in this research pass.

## Acquisition method per source

- KC-01/02/03, SAM-01: scheduled HTTP GET of the page, HTML parsed for the alert-banner/heading-plus-paragraph block described above; diff against last-known-good rather than fixed-field date/location parsing, since no MVP source (except ISS-01) offers a stable per-item container. A one-time manual/browser-based DOM inspection is still recommended before production build to confirm an exact, stable CSS selector for the alert container (this cycle's plain-fetch inspection could describe structure and content but could not confirm CSS class names, since the fetch tool converts HTML to markdown before analysis).
- ISS-01: scheduled GET of the RSS feed URL (preferred) or the HTML civic-alerts list (fallback); parse standard RSS `<item>` elements, or the `<ul>`/`<li>` HTML list with its `/m/newsflash/Home/Detail/{id}` permalinks; filter using the Issaquah-approach street list below; use the numeric alert ID as the durable per-item key.
- OTH-03B (Kenmore project page): low-frequency (weekly) page-fetch check for status changes, since this is a capital-project page, not a recurring alert feed.
- OTH-03D (Woodinville Alert Center): same page/RSS-fetch pattern, lower priority.
- OTH-02 (GovDelivery): REJECTED, sixth cycle (2026-07-29) — the project owner confirmed GovDelivery is not accessible to them, closing off both remaining paths to an automatable topic-scoped feed URL (a subscribe flow with a monitored email, or a direct King County Parks inquiry). Not implementable; do not revisit unless GovDelivery access changes.
- SEA-03 repairs subpage: exact URL now confirmed (`https://www.seattle.gov/parks/about-us/projects/burke-gilman-trail-repairs`), but its body content could not be retrieved via plain WebFetch this cycle (twice attempted) — a future build should try a browser-rendered fetch for this specific page template before relying on it.
- WSDOT-01: not implementable until an Access Code is obtained; when implemented, restrict queries to the two confirmed crossing zones only (SR-522 through Kenmore; I-405/SR-522 interchange Bothell/Woodinville) — do not query WSDOT's statewide feed unfiltered.
- KC-06 (RoadAlerts/KingCo_Road_Alerts): scheduled ArcGIS REST `/query` against layer 0 (or the `CurrentClosure`/`UpcomingClosure` tables), filtered by a geometry buffer (e.g. 100-200m) around the canonical GPX line — NOT a bounding-box query, since a bbox test this cycle returned a real but geographically irrelevant record (Cottage Lake). Low priority: unincorporated-county coverage rarely applies to this route.
- KC-07 (RoadAlerts/nonKCRoadAlerts, SammamishRoadAlerts_line): do not implement yet — re-query periodically (e.g. monthly) to check whether the single stale 2014 test record has ever been replaced with live content before investing scraper effort here.
- REDM-01 (Redmond Traffic/Alerts): scheduled ArcGIS REST `/query` against all three geometry layers (point/line/polygon), filtered by a geometry buffer around the canonical GPX line. High priority given Redmond's direct ownership of 3 route segments; a corridor-buffer test (not yet performed) should be run before production build to confirm which of the 3 current alerts (or future ones) are true on-corridor hits.
- ISS-03 (Issaquah PW Current Year Construction Projects): scheduled ArcGIS REST `/query`, filtered by a geometry buffer around the canonical GPX line. High priority given the confirmed on-route hit this cycle.
- ISS-04, SAM-02, SAM-03: lower-priority, slower-poll (weekly) supplements — broad permit/capital-project databases requiring heavy geometry + keyword filtering; not primary signals.
- Secondary sources generally: same page-fetch pattern, lower priority/frequency than MVP sources.

## Route-filtering approach

This cycle added the first two geometry-capable MVP sources (REDM-01, ISS-03), so filtering is no longer purely text-based, though most MVP sources remain free-text:
- direct_geometry_intersection (corridor buffer, not bounding box) for REDM-01 and ISS-03: only bounding-box tests have been run for each so far (bbox is confirmed unreliable for this kind of source per the KC-06 finding — see ROUTE_SECTION_SOURCE_MAPPING.md), so a proper line-buffer intersection against the corrected canonical GPX should be run before production build to confirm true on-corridor hits.
- named_trail_segment_matching against a fixed list of trail names used by this route (Burke-Gilman Trail, Sammamish River Trail, East Lake Sammamish Trail, Marymoor Park, Marymoor Connector Trail).
- street_segment_matching for ISS-01: the route's real Issaquah-approach segment uses these exact streets, corrected against the canonical GPX v2 supplied this cycle (the prior list incorrectly included "Northeast 65th Street," a Redmond-area street that was never actually near Issaquah and has since been removed from the route entirely by the GPX correction): East Lake Sammamish Parkway Northeast; East Lake Sammamish Lane Northeast; East Lake Sammamish Trail. See ROUTE_SECTION_SOURCE_MAPPING.md for the full correction and waypoint-by-waypoint derivation. The corrected GPX also introduces a new named trail segment, "Marymoor Connector Trail," that should be added to named-trail-segment matching for the Marymoor Park section.
- street_segment_matching for WSDOT-01: restrict to SR-522 (Bothell Way) in the Kenmore stretch of the Burke-Gilman Trail, and the I-405/SR-522 interchange area of the Sammamish River Trail between Bothell and Woodinville.
- Every automatically-matched item should be flagged MANUAL_REVIEW_REQUIRED before being surfaced as CONFIRMED_ROUTE_IMPACT, given the free-text nature of every MVP source. Route-impact classification should default to POSSIBLE_ROUTE_IMPACT until a human confirms.

## Normalized event model (proposed fields)

`event_id, source_id, discovered_at, effective_start, effective_end, trail_or_street_name, location_description_raw, route_section(s), route_impact_classification, detour_available (bool/unknown), summary_text, source_url, last_verified_at`

For KC-01/02/03/SAM-01, `event_id` cannot be derived from a stable source-provided identifier (none exists) — it should be a hash of the extracted alert text block plus source_id, so that a text change produces a new event_id while unchanged text does not. For ISS-01, `event_id` should incorporate the real numeric permalink ID.

## Update cadence / freshness / failure behavior

- Cadence: daily poll for KC-01/02/03 and SAM-01 (slow-moving construction/closure content); every 1-4 hours for ISS-01 RSS (cheap, and traffic alerts can be more time-sensitive); 1 hour for REDM-01/ISS-03 (ArcGIS REST, MVP); weekly for OTH-03B and OTH-03D as SECONDARY supplements. OTH-02 REJECTED, sixth cycle — not scheduled.
- Freshness threshold: 24-48 hours per MVP source (see SOURCE_REGISTRY for per-source values); 48-72 hours for SECONDARY capital-project pages.
- Failure detection: non-200 HTTP status, or absence of the expected DOM container/RSS structure.
- Last-known-good: retain the last successfully parsed alert text/RSS item set per source; on failure, continue serving last-known-good with a visible staleness flag rather than silently going blank.

## Remaining gaps before this can be built

See SOURCE_GAPS.md in full. The sixth cycle (2026-07-29) CLOSED the GovDelivery topic-ID item: the project owner confirmed GovDelivery is not accessible to them, so OTH-02 is now REJECTED rather than pending — this is a closed gap, not resolved positively, and requires no further action. The fifth cycle added and directly live-verified five new city-run ArcGIS REST sources (REDM-01, ISS-03, ISS-04, SAM-02, SAM-03; REDM-01 and ISS-03 reached MVP grade), following a second user-supplied candidate-source list. The fourth cycle added KC-06/KC-07 (King County ArcGIS Server) and corrected the canonical GPX. Still genuinely open: KC-05 (portal UI still BLOCKED); SEA-03's repairs-subpage body content; whether KC-07's SammamishRoadAlerts layer ever carries live content; a proper geometry-corridor (not bbox) intersection test of KC-06, REDM-01, and ISS-03 against the full canonical GPX line, before their current/future alerts can be confidently classified CONFIRMED_ROUTE_IMPACT vs. NEARBY_NO_CONFIRMED_IMPACT. 5 of 7 MVP sources remain text-based (whole-page-diff); REDM-01 and ISS-03 are the first geometry-capable MVP sources, pending that corridor-buffer verification.

Per the work order, production n8n workflow design itself remains out of scope for this document and this cycle. The DOM/extraction notes above are planning documentation only — no scraper, CSS selector code, or workflow was built.
