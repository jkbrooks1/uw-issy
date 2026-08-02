# UW–Issaquah Route Monitor — Lane 01 (Route Conditions) Implementation Recommendation v1

**Status:** Recommendation only. No production n8n workflow exists yet; this document plans the future build. Updated 2026-07-28 (fifth follow-up cycle) — production workflow design itself remains out of scope for this cycle, per the work order. This cycle, triggered by a second user-supplied candidate-source list: (1) added and directly live-verified four new city-run ArcGIS REST sources (REDM-01, ISS-03, ISS-04, SAM-02, SAM-03 — 5 entries), two of which (REDM-01, ISS-03) reached MVP grade, the first geometry-capable MVP sources in this registry; (2) directly refuted two unverified claims (Seattle's "working" SDOT_Bikes server, actually down; Redmond's claimed Landbase/Trail layer, doesn't exist).

## MVP source set (7 sources — grew from 5 this cycle, all VERIFIED)

| Source | Agency | Route segment(s) | Acquisition method | Verification |
|---|---|---|---|---|
| KC-01 — Burke-Gilman Trail Leafline page | King County Parks | Burke-Gilman north Lake WA/Kenmore; Bothell connector | Scheduled HTTP GET, parse alert-banner HTML container | VERIFIED |
| KC-02 — Sammamish River Trail Leafline page | King County Parks | SRT Bothell/Woodinville; SRT Redmond; Marymoor Park | Scheduled HTTP GET, parse alert-banner HTML container | VERIFIED |
| KC-03 — East Lake Sammamish Trail Leafline page | King County Parks | ELST Redmond; ELST Sammamish; Issaquah approach | Scheduled HTTP GET, parse alert-banner HTML container | VERIFIED |
| SAM-01 — City of Sammamish 2026 Construction Projects page | City of Sammamish | ELST Sammamish | Scheduled HTTP GET, parse project-list prose | VERIFIED |
| ISS-01 — City of Issaquah Civic Alerts / Traffic Alerts (CID=20) | City of Issaquah | Issaquah approach/terminus | Scheduled RSS GET, parse standard RSS items, filter against the GPX-derived street list | VERIFIED |
| **REDM-01 — City of Redmond Traffic/Alerts (ArcGIS REST)** | City of Redmond Public Works | SRT-Redmond; Marymoor Park; ELST-Redmond | Scheduled ArcGIS REST `/query` against 3 geometry layers, filtered by corridor buffer (not yet implemented — bbox test only) | VERIFIED |
| **ISS-03 — City of Issaquah PW Current Year Construction Projects (ArcGIS REST)** | City of Issaquah Public Works | Issaquah approach/terminus | Scheduled ArcGIS REST `/query`, filtered by corridor buffer (not yet implemented — bbox test only) | VERIFIED |

All 7 MVP sources are directly VERIFIED. REDM-01 and ISS-03 are new this cycle and are the registry's first geometry-capable (DIRECT_API) MVP sources — every prior MVP source is free-text HTML/RSS. Both still need a proper geometry-corridor (line-buffer, not bounding-box) intersection test against the corrected canonical GPX before their route-impact classifications can be fully trusted (see Route-filtering approach below).

## Secondary source set (13 sources — ISS-04, SAM-02, SAM-03 added this cycle)

SEA-03, UW-01, UW-02, WSDOT-01, ST-01, OTH-02, OTH-03B, OTH-03D, KC-06 (all unchanged from prior cycles), plus:

- **ISS-04 (City of Issaquah `active_projects_gc`, new this cycle)** — real, live, unauthenticated DIRECT_API, 60 real records. A bbox test against the route corridor found only general development permits (short plats, townhomes), not confirmed road/trail-relevant content — unlike ISS-03's confirmed drainage-project hit.
- **SAM-02 (City of Sammamish `Development_Activity_Map_Trakit_Prod_V2`, new this cycle)** — real, live, unauthenticated DIRECT_API, 1,343 real building/land-use permit records. General permit database, not trail-specific; requires heavy geometry + keyword filtering.
- **SAM-03 (City of Sammamish `Transportation/TCIP_Projects`, new this cycle)** — real, live, unauthenticated DIRECT_API, 22 real multi-year capital-improvement-project records. Slower-moving than SAM-01/KC-03; overlaps conceptually with Lane 06.

Seattle Bike Blog (OTH-01) remains recommended as a manual, human-reviewed early-warning tool only — never as an automated input.

OTH-03A (City of Bothell) and OTH-03C (City of Lake Forest Park) remain REJECTED — confirmed to have no dedicated trail/construction-alert channel.

## Unresolved source: KC-07

**KC-07** (King County ArcGIS Server `RoadAlerts/nonKCRoadAlerts`, specifically `SammamishRoadAlerts_line`/`_point`) is a real, live, unauthenticated DIRECT_API with a genuine closure-status schema — structurally excellent, but populated with only a single stale 2014 test record. Not REJECTED (mechanism is real) and not SECONDARY (nothing to act on today) — re-query periodically to check for a status change.

## Refuted claims this cycle (not added — documented so they aren't re-discovered and re-tested)

- **Seattle `SDOT_Bikes/MapServer`** — claimed working; directly retested and found to return the identical "Service not started" error as SDOT_StreetUse_V2 (SEA-01). The entire `gisdata.seattle.gov` ArcGIS Server instance is confirmed down.
- **Redmond `DataSets/Landbase/MapServer`** ("Trail" layer) — claimed to exist; directly tested, returned HTTP 404. Does not exist.

## DOM/Extraction Notes for the 5 original (free-text) MVP Sources

Per the work order, this section documents observed page structure to inform a future scraper build; it is descriptive, not working code. All 5 pages were directly re-fetched on 2026-07-28 for this purpose (see API_AND_FEED_TEST_RESULTS.md Test 21). REDM-01 and ISS-03 (new this cycle) do not need DOM/extraction notes since they are structured ArcGIS REST APIs, not HTML pages — see their acquisition-method entries below instead.

**KC-01 — Burke-Gilman Trail Leafline page.** No active alert banner present at this fetch time (a live banner was observed in the first research cycle, confirming these banners are transient). When present (observed directly on the sibling KC-03 page, same CMS template), an alert renders as a plain `<h2>` heading followed by one or more `<p>` paragraphs — not a semantic `<div role="alert">` or dedicated alert component. Dates appear as prose ("June 1, 2026"), not a machine-parseable microformat. There is no stable per-alert anchor or dedicated URL. *Proposed approach:* full-page text diff against a stored last-known-good value; flag any change for manual review rather than fixed-field parsing.

**KC-02 — Sammamish River Trail Leafline page.** Directly fetched for the first time this project. Same CMS template family as KC-01/KC-03; full trail-description content confirmed current (2026 footer copyright). No active alert banner at this fetch time. *Proposed approach:* identical to KC-01 — full-page diff, not per-item tracking.

**KC-03 — East Lake Sammamish Trail Leafline page.** Active closure alert confirmed present and unchanged from the prior cycle: `<h2>` heading "ELST closure starting June 1, 2026" followed by `<p>` paragraphs, verbatim text re-confirmed. An in-page anchor `#elst-closure-anchor-link` was observed on the heading link, but it only jumps within the same page — no dedicated, independently-fetchable subpage exists. *Proposed approach:* locate a heading matching a "`<segment> closure starting <date>`" pattern or containing "closure"/"closed"/"detour"; capture the following paragraph(s) as the alert body; diff against last-known-good.

**SAM-01 — City of Sammamish 2026 Construction Projects page.** A single long-form annual news article: plain headings and prose paragraphs per project, not a table/accordion/CMS list. Dates are mostly seasonal prose ("spring," "late fall 2026"); a page-level publication date ("Apr 09, 2026") appears at the bottom. Named projects link out to their own dedicated URLs (e.g. `/projects/se-6th-street-improvements/`) but have no in-page anchor of their own within this article. *Proposed approach:* parse per-project text blocks by heading; cross-reference against the known trail-name/street-name list; prefer following out to a project's own dedicated URL over anchoring into this annual page, which will presumably be superseded by a "2027" page in the future.

**ISS-01 — City of Issaquah Civic Alerts (Traffic Alerts, CID=20).** CivicPlus module using semantic `<ul>`/`<li>` list markup, not a table/card layout. Each item has an `<h3>` heading with an internal link, descriptive text, and "Posted on Month Day, Year" metadata. Each alert has a stable per-item permalink with a numeric ID, e.g. `/m/newsflash/Home/Detail/6480` — the one MVP source with a genuinely durable per-item identifier. *Proposed approach:* parse the `<li>` list for title/date/link; follow the detail link for full text; use the numeric ID as the durable per-alert key. The page's linked RSS feed (confirmed present in the first cycle) is likely a cleaner structured alternative and should be preferred if its exact feed URL/schema is re-confirmed in a future build.

**Cross-source summary:** no MVP source uses a semantic alert component or a machine-parseable date microformat. Only ISS-01 has a stable per-item URL/ID; KC-01, KC-02, KC-03, and SAM-01 require whole-page (or whole-section) diffing against last-known-good rather than per-item change tracking. A one-time browser-based DOM inspection (not performed this cycle, since this pass used plain-fetch HTML-to-markdown conversion) is still recommended before final production build to confirm exact, stable CSS selectors.

## Per-source acquisition method (detail)

For the four King County/Sammamish HTML sources (KC-01, KC-02, KC-03, SAM-01): a scheduled HTTP GET against the page URL, with the alert/project-content block (described above) extracted and diffed against last-known-good. The exact stable CSS selector for each page was not identified with certainty in this or prior cycles (a plain-fetch tool converts HTML to markdown before analysis, which obscures exact class/ID names) — a one-time browser-based page-structure inspection is still required before extraction logic is written.

For ISS-01: a scheduled GET against the RSS feed (preferred) or the HTML civic-alerts list (`<ul>`/`<li>` with numeric-ID permalinks, fallback), filtered against the GPX-derived Issaquah-approach street list (Northeast 65th Street; East Lake Sammamish Parkway Northeast; East Lake Sammamish Lane Northeast; East Lake Sammamish Trail), using the numeric alert ID as the durable per-item key.

For OTH-03B (Kenmore project page): a low-frequency (weekly) page-fetch check for status changes, since this is a capital-project page, not a recurring alert feed.

For SEA-03's repairs subpage: exact URL now confirmed (`https://www.seattle.gov/parks/about-us/projects/burke-gilman-trail-repairs`); a plain WebFetch could not retrieve its body content in two attempts this cycle — a future build should try a browser-rendered fetch for this specific page template.

For WSDOT-01: not implementable until a developer Access Code is obtained; when implemented, restrict queries strictly to the two confirmed crossing zones (SR-522 through Kenmore; I-405/SR-522 interchange Bothell/Woodinville) — never query WSDOT's statewide feed unfiltered.

For OTH-02 (GovDelivery): cannot yet be automated by topic ID. A four-angle probe confirmed this is a structural GovDelivery platform limitation (topic listing requires authenticated API access, per GovDelivery's own developer documentation, or a completed subscribe flow with a real email) — not something further research can close. Treat as a manual/periodic check of bulletin search results only, until either a human operator completes the real subscribe flow or King County Parks communications staff are directly contacted for the topic ID.

For KC-06 (new this cycle): scheduled ArcGIS REST `/query` against layer 0 (or the `CurrentClosure`/`UpcomingClosure` tables), filtered by a geometry buffer (e.g. 100-200m) around the canonical GPX line — NOT a bounding-box query, since a bbox test this cycle returned a real but geographically irrelevant record. Low priority: unincorporated-county coverage rarely applies to this route; treat as a defense-in-depth check, not primary coverage.

For KC-07 (new this cycle): do not implement yet. Re-query periodically (e.g. monthly) to check whether the single stale 2014 test record has ever been replaced with live content before investing scraper effort here.

For REDM-01 (new this cycle, MVP): scheduled ArcGIS REST `/query` against all three geometry layers (point/line/polygon) on `Traffic/Alerts`. High priority given Redmond's direct ownership of 3 route segments and confirmed real active alerts. A geometry-corridor buffer test (not yet performed — only a general awareness that 3 alerts exist, not yet bbox/corridor-tested against the specific GPX line) should be run before production build to confirm which alerts are true on-corridor hits.

For ISS-03 (new this cycle, MVP): scheduled ArcGIS REST `/query` against `PWProjectsCurrentYearConstructionPublic`. High priority given the confirmed on-route hit this cycle ("East Lake Sammamish Pkwy Drainage Improvement Project"). A proper corridor-buffer (not bbox) test should be run to confirm all genuinely on-route projects, since only a bbox test has been performed so far.

For ISS-04, SAM-02, SAM-03 (new this cycle, SECONDARY): lower-priority, slower-poll (weekly) ArcGIS REST `/query` checks — broad permit/capital-project databases requiring heavy geometry + keyword filtering; not primary signals.

## Route-filtering approach

5 of 7 MVP sources provide no geometry (free-text HTML/RSS); REDM-01 and ISS-03 (new this cycle) are the first geometry-capable MVP sources, though their exact corridor relevance is only bbox-tested so far, not corridor-buffer-tested. The recommended filtering approach:

- **named_trail_segment_matching**: match content against the fixed list of trail names actually used by this route (Burke-Gilman Trail, Sammamish River Trail, East Lake Sammamish Trail, Marymoor Park, and — per the corrected canonical GPX — Marymoor Connector Trail).
- **street_segment_matching for ISS-01** (corrected against the canonical GPX v2; the prior list incorrectly included "Northeast 65th Street," a Redmond-area street never actually near Issaquah and now removed from the route entirely): East Lake Sammamish Parkway Northeast; East Lake Sammamish Lane Northeast; East Lake Sammamish Trail.
- **direct_geometry_intersection (corridor buffer, not bbox) for KC-06, REDM-01, and ISS-03**: if implemented, restrict to a line-buffer (e.g. 100-200m) around the canonical GPX — a bbox test against KC-06 this cycle produced one real but geographically irrelevant hit (Cottage Lake), confirming bbox filtering is inadequate for this class of source. The same caveat applies to REDM-01's and ISS-03's current records, which have only been bbox-tested, not corridor-buffer-tested.
- **street_segment_matching for WSDOT-01**: restrict to SR-522 (Bothell Way) in the Kenmore stretch of the Burke-Gilman Trail, and the I-405/SR-522 interchange area of the Sammamish River Trail between Bothell and Woodinville.
- Every automatically-matched item should default to **POSSIBLE_ROUTE_IMPACT**, not CONFIRMED_ROUTE_IMPACT, until a human reviewer confirms — including matches from the geometry-capable sources, until a proper corridor-buffer test (not bbox) is performed.

## Normalized event model (proposed)

```
event_id                    (generated: hash of extracted alert text block + source_id for KC-01/02/03/SAM-01;
                              numeric permalink ID + source_id for ISS-01)
source_id                   (registry ID, e.g. "KC-03")
discovered_at                (ISO 8601 timestamp of first automated detection)
effective_start              (parsed from source text if present, else null)
effective_end                 (parsed from source text if present, else null)
trail_or_street_name          (matched name)
location_description_raw     (verbatim text snippet)
route_section(s)              (one or more of the 10 confirmed route segments)
route_impact_classification   (CONFIRMED_ROUTE_IMPACT / POSSIBLE_ROUTE_IMPACT / NEARBY_NO_CONFIRMED_IMPACT / NOT_ROUTE_RELEVANT / MANUAL_REVIEW_REQUIRED)
detour_available              (true / false / unknown)
summary_text                  (human-readable summary)
source_url                    (evidence link)
last_verified_at              (timestamp of last successful re-fetch confirming this event is still current)
```

## Update cadence and freshness rules

- KC-01, KC-02, KC-03, SAM-01: daily poll (slow-moving construction/closure notices, not real-time feeds); freshness threshold 24–48 hours.
- ISS-01 (RSS): poll every 1–4 hours; freshness threshold 24 hours.
- REDM-01, ISS-03 (new this cycle, MVP, ArcGIS REST): 1-hour poll — these are structured APIs capable of finer-grained freshness than the free-text MVP sources; freshness threshold 1 hour.
- OTH-03B, OTH-03D, OTH-02, ISS-04, SAM-02, SAM-03: weekly poll, given lower priority and (for OTH-02) still-unresolved automation path.
- Secondary sources generally: weekly poll.

## Failure behavior and last-known-good handling

- Failure is detected as a non-200 HTTP status, or the absence of the expected page structure/RSS schema on a successful HTTP response.
- On failure, the connector must continue serving last-known-good content with an explicit staleness flag and timestamp, rather than going blank or silently dropping a known active closure.
- Repeated failures beyond the freshness threshold should escalate to MANUAL_REVIEW_REQUIRED rather than auto-clearing the last-known event.
- Because KC-01/02/03 and SAM-01 have no stable per-item identifier, last-known-good tracking for those four sources must operate on the whole extracted content block, not a per-event key. ISS-01 (numeric alert ID), REDM-01 (AlertID field), and ISS-03 (ObjectID/ProjectNumber fields) all have genuine stable per-record identifiers suitable for true per-item last-known-good tracking — 3 of 7 MVP sources now support this, up from 1 of 5 before this cycle.

## Manual-review rules

- Every new or changed event from every MVP source must pass through manual review before being marked CONFIRMED_ROUTE_IMPACT, because every current MVP source is unstructured/semi-structured text, not machine-verifiable geometry.
- Any event sourced from OTH-01 (Seattle Bike Blog) may only ever reach POSSIBLE_ROUTE_IMPACT or lower, pending independent confirmation from an official source.

## Anticipated n8n workflow architecture (future build, not built in this cycle)

1. Scheduled trigger (per-source cadence above).
2. HTTP Request node per source (GET).
3. HTML/RSS parsing node (per source, since each page's DOM differs — see DOM/Extraction Notes above) to extract candidate alert text.
4. Keyword/named-entity filter node applying named_trail_segment_matching / street_segment_matching.
5. Normalization node mapping into the event model above.
6. Diff-against-last-known-good node to detect new/changed/resolved events (whole-block diff for KC-01/02/03/SAM-01; per-ID diff for ISS-01).
7. Manual-review queue before any CONFIRMED_ROUTE_IMPACT is published.
8. Publish node writing to the shared connector output location for this project (not yet finalized — out of scope for this research cycle).

## Implementation sequence (updated — items 1-11 below are RESOLVED; items 12-14 remain)

1. ~~Directly fetch the official sites for City of Bothell, City of Kenmore, City of Lake Forest Park, and City of Woodinville (OTH-03)~~ — DONE (second cycle).
2. ~~Retest SEA-01 and SEA-02~~ — DONE (second cycle).
3. ~~Derive the exact Issaquah-approach street list and any WSDOT state-highway crossing points directly from the GPX turn-cue waypoints~~ — DONE (second cycle); CORRECTED this cycle after a canonical GPX correction (see item 9).
4. ~~Directly re-confirm KC-02, SEA-03's linked repairs subpage, and UW-02~~ — DONE (third cycle).
5. ~~Manually inspect the DOM structure of each MVP HTML source (KC-01/02/03, SAM-01) to identify extraction approach~~ — DONE (third cycle).
6. ~~Probe the GovDelivery topic-ID question further~~ — DONE (third cycle); genuinely remains unresolved as a structural platform limitation.
7. ~~Add DOM/extraction notes to this document~~ — DONE (third cycle).
8. ~~Investigate King County GIS Open Data further, beyond the JS-blocked portal UI~~ — DONE this cycle: queried the underlying ArcGIS Server REST root directly, discovering and directly verifying KC-06 and KC-07.
9. ~~Incorporate the project owner's corrected canonical GPX~~ — DONE (fourth cycle): installed at the canonical path (prior version archived), and corrected the downstream Issaquah-approach street list, which had mislabeled "Northeast 65th Street" as Issaquah-approach.
10. ~~Investigate a second user-supplied candidate-source list covering Seattle/Redmond/Sammamish/Issaquah~~ — DONE this cycle: 4 new sources added and directly live-verified (REDM-01, ISS-03, ISS-04, SAM-02, SAM-03), 2 of which reached MVP grade; 2 unverified claims (Seattle SDOT_Bikes, Redmond Landbase/Trail) directly refuted.
11. ~~Confirm on-route relevance for the new Issaquah/Redmond sources with at least a bounding-box geometry test~~ — DONE this cycle for ISS-03 (confirmed on-route hit) and partially for REDM-01 (3 alerts found, corridor-buffer test still needed — see item 12).
12. Complete the GovDelivery topic-ID discovery via a human subscribe step with a real monitored email, or a direct King County Parks communications inquiry — this remains the single most well-documented remaining human/offline-only action item.
13. Perform a true geometry-corridor (line-buffer, not bounding-box) intersection test against the full corrected canonical GPX line for all THREE geometry-capable sources found so far — KC-06, REDM-01, and ISS-03 — to determine definitively which specific alerts/projects are true on-corridor hits.
14. Only then begin building the production n8n workflow, per the project's standing 9-step workflow-completion rule (statically validated -> imported -> live executed -> debugged -> write/readback validated -> final diagnostics -> execution proof -> documented -> logged). A one-time browser-based DOM inspection to pin exact CSS selectors on the 4 free-text, non-ISS-01 MVP sources is recommended as part of this future build step.

## Risks and dependencies

- **Text-extraction fragility**: 5 of 7 MVP sources depend on free-text HTML parsing; a page redesign by King County, Sammamish, or Issaquah would silently break extraction without a matching content-diff/anomaly alert.
- **No stable per-item identifier for 4 of 7 MVP sources**: KC-01, KC-02, KC-03, and SAM-01 have no durable per-alert ID or anchor. ISS-01, REDM-01, and ISS-03 (new this cycle) all have genuine stable identifiers.
- **King County Parks is a single point of dependency** for 6 of the route's 10 segments; if its Leafline pages ever go down or move, the majority of this lane's coverage is lost until re-verified.
- **No confirmed API means higher long-term maintenance cost** for the Seattle/UW segments specifically; SDOT's two candidate GIS/open-data endpoints remain confirmed non-viable (re-confirmed this cycle via SDOT_Bikes retest — the entire gisdata.seattle.gov ArcGIS Server is down), and WSDOT's API remains ungated by an Access Code. This risk no longer applies uniformly across the whole route: Redmond, Sammamish, and Issaquah all now have confirmed working ArcGIS REST infrastructure.
- **Geometry-corridor verification gap (new this cycle)**: KC-06, REDM-01, and ISS-03 have only been tested with bounding-box geometry queries. Bbox is confirmed unreliable (KC-06's Cottage Lake false positive) — a production build must not treat a bbox match as sufficient evidence of CONFIRMED_ROUTE_IMPACT for any of these three sources without a true line-buffer corridor test first.
- **Third-party research verification risk (demonstrated this cycle)**: two claims from an external candidate-source list (Seattle SDOT_Bikes "confirmed working"; Redmond Landbase/Trail layer) were false when directly tested. This registry's standing practice of never marking a source VERIFIED without a direct fetch/query is the reason these were caught before being incorporated — this discipline should be maintained for any future candidate-source lists.
