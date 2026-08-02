# SOURCE_GAPS.md — Lane 01_ROUTE_CONDITIONS

Updated 2026-07-28 (fifth follow-up cycle). Gaps resolved this cycle are marked RESOLVED with real evidence; genuinely still-open gaps are retained and marked accordingly. This supersedes the fourth cycle's version in place — no v2 file was created.

## Fifth cycle: four new sources added, MVP set grew from 5 to 7

A second user-supplied candidate-source list prompted direct ArcGIS REST verification of claims for Seattle, Redmond, Sammamish, and Issaquah. Real results: **REDM-01** (Redmond `Traffic/Alerts`, MVP — 3 real active alerts, structured fields, geometry, GovDelivery-integrated) and **ISS-03** (Issaquah `PWProjectsCurrentYearConstructionPublic`, MVP — a live geometry query found a genuinely on-route project) both reached MVP grade; **ISS-04** (Issaquah `active_projects_gc`) and **SAM-02/SAM-03** (Sammamish Trakit permits / TCIP capital projects) are real but SECONDARY (broader databases, no confirmed on-route relevance yet). Two claims from the candidate list were directly tested and refuted: Seattle's "confirmed working" `SDOT_Bikes/MapServer` returned the identical "Service not started" error as `SDOT_StreetUse_V2` (the whole Seattle ArcGIS Server is down, reinforcing SEA-01's REJECT), and Redmond's claimed `DataSets/Landbase/MapServer` "Trail" layer returned HTTP 404 (does not exist). See `SOURCE_REGISTRY.json`/`.md` for full detail and `API_AND_FEED_TEST_RESULTS.md` Tests 34+.

**New gap opened by this cycle's own honest evaluation:** REDM-01 and ISS-03, the two newest MVP sources, have only been tested with bounding-box geometry queries, not true line-buffer corridor intersections — the same limitation already documented for KC-06. Before production build, a proper corridor-buffer test against the corrected canonical GPX should be run for all three (KC-06, REDM-01, ISS-03) to confirm which specific alerts/projects are true on-corridor hits versus coincidental bbox matches.

## New sources added and directly verified this cycle (not gaps — a discovery, documented here for continuity)

The user supplied a list of candidate ArcGIS Open Data portals compiled by a separate research pass (statewide WSDOT/DNR, King/Snohomish/Pierce County GIS portals, Seattle GeoData). Cross-referencing it against this registry found most were already evaluated (WSDOT-01, KC-05, SEA-01/02) or out of route scope (Snohomish/Pierce County, WA DNR, geo.wa.gov — this route never leaves King County). One genuinely new, actionable lead came from it: rather than the JS-blocked `opendata.arcgis.com` portal UI (KC-05), querying King County's own underlying ArcGIS Server REST root directly (`gismaps.kingcounty.gov/arcgis/rest/services?f=json`, plain curl, no JS) surfaced 31 real service folders including `RoadAlerts` and `Parks`. Two new sources were added and directly live-queried as a result:

- **KC-06 (`RoadAlerts/KingCo_Road_Alerts`)** — real, live, unauthenticated DIRECT_API, 24 active closure records with structured fields and polyline geometry, confirmed via a live `/query` call. Scoped to unincorporated King County roads only; a bbox test against this route's bounding box returned exactly 1 record, which turned out to be geographically irrelevant (Cottage Lake) — confirming bbox filtering is unreliable for this source and true geometry-corridor buffering is required. Classified SECONDARY.
- **KC-07 (`RoadAlerts/nonKCRoadAlerts`, `SammamishRoadAlerts_line`)** — real, live, unauthenticated DIRECT_API with a genuine closure-status schema, confirmed via a live `/query` call, but containing only a single stale 2014 test record for Sammamish (the only participating city on this route). Classified UNRESOLVED, not REJECT — the mechanism is real and could go live, but there is nothing to act on today.

See `SOURCE_REGISTRY.json`/`SOURCE_REGISTRY.md` for full field-level detail on both.

## Gaps RESOLVED this cycle

1. **KC-02 (King County Parks Sammamish River Trail page) — RESOLVED.** Directly fetched for the first time this project (previously only confirmed via a search-result URL, treated as PARTIALLY_VERIFIED by analogy to KC-01/KC-03). Confirmed live, current (footer "© King County, WA 2026"), and structurally identical to KC-01/KC-03. No active alert banner was present at this specific fetch time — that is recorded as a real finding ("no known closure right now"), not a fetch failure. Upgraded to VERIFIED. See API_AND_FEED_TEST_RESULTS.md Test 21.

2. **UW-02 (UW Transportation shuttle alerts page) — RESOLVED, with an honest correction.** Directly fetched for the first time this project (previously only confirmed via a search-engine snippet). The four alerts currently on the page (Aug 2025 through Dec 2024, all shuttle-stop relocations) contain no mention of the Burke-Gilman Trail — this contradicts the prior cycle's search-snippet-based claim of trail-relevant content, which is not reproducible in the page as fetched this cycle. Upgraded to VERIFIED (page confirmed real/current/structurally understood) but its practical trail-relevance is now shown to be rarer than previously assumed. See API_AND_FEED_TEST_RESULTS.md Test 23.

3. **SEA-03's linked "Burke-Gilman Trail Repairs" subpage — PARTIALLY RESOLVED.** The exact subpage URL is now confirmed via direct fetch of the parent page's link markup (`/parks/about-us/projects/burke-gilman-trail-repairs`), upgrading it from "inferred from nav link text" to "confirmed exact." However, two direct WebFetch attempts at that exact URL this cycle both returned only navigation/menu markup, not the project's body content — a genuine tool/rendering limitation for this page template. Remains PARTIALLY_VERIFIED; the subpage's actual current status/dates are still unconfirmed. See API_AND_FEED_TEST_RESULTS.md Test 22.

4. **DOM/extraction structure for the 5 MVP sources (KC-01, KC-02, KC-03, SAM-01, ISS-01) — RESOLVED (documentation only, no scraper built).** All 5 were directly fetched and their HTML structure, date formats, and per-item anchor/URL stability were documented. Key finding: none of the 5 use a semantic alert component or a machine-parseable date microformat; only ISS-01 (Issaquah Civic Alerts) has a stable numeric per-item permalink (`/m/newsflash/Home/Detail/{id}`). KC-01/02/03 and SAM-01 have no persistent per-alert identifier and must be monitored via full-page content diffing against a stored last-known-good value, not per-item change detection. Full notes are in `IMPLEMENTATION_RECOMMENDATION.md` ("Proposed Extraction Approach" per source) and in each source's `research_notes` in `SOURCE_REGISTRY.json`. Per the work order and the standing CLAUDE.md scope rule, this is planning documentation only — no scraper, selector code, or n8n workflow was built.

## Gap CLOSED, sixth follow-up cycle (2026-07-29)

1. **The exact GovDelivery topic ID for King County Parks trail alerts (OTH-02) — CLOSED (REJECTED), not resolved positively.** Probed from four independent angles across the third/fourth cycles (all dead ends, none fabricated — see history below), then formally closed this cycle: the project owner confirmed GovDelivery is not accessible to them, which forecloses both remaining paths (a human subscribe flow with a monitored email, or a direct King County Parks inquiry conducted by the project owner). OTH-02 is reclassified REJECT/BLOCKED in `SOURCE_REGISTRY.json`/`.md`. This is a closed gap, not an open one — no further action is expected or useful here. The real bulletin content confirmed in prior cycles remains true for the historical record (see `API_AND_FEED_TEST_RESULTS.md`), but this source will not be pursued further since KC-01/02/03 already provide direct, official coverage of the same segments.

Prior probing history (retained for context):
   - Angle 1 (more bulletin discovery): found additional real "Regional Trail Alert" bulletins (further confirming content, not a topic ID).
   - Angle 2 (numbered signup URL `/signup/46599`): rendered only the generic subscriber form, no topic name/ID exposed.
   - Angle 3 (bulletin-page topic metadata): individual bulletin pages carry no visible topic/category tag or topic-specific subscribe link.
   - Angle 4 (GovDelivery's own developer API docs): confirms topic listing is an authenticated-API-only operation ("List all Topics" requires API credentials); no public/unauthenticated enumeration method is documented anywhere by GovDelivery itself.

## Confirmed coverage gaps still genuinely open (carried forward, unchanged this cycle)

1. **No verified real-time, machine-readable closure/status API exists for any part of this corridor.** Unchanged this cycle. SEA-01/SEA-02 remain confirmed non-functional/catalog-only. KC-05 (King County GIS Open Data portal UI) remains BLOCKED. WSDOT's API requires a developer Access Code not obtained. The realistic MVP acquisition method remains page/feed monitoring plus the newly-added city ArcGIS REST APIs (REDM-01, ISS-03), not a single clean statewide API.

2. **King County — the single most important owning agency for this corridor — still has no confirmed API or structured open-data closure feed.** Its confirmed live closure-communication channels remain the `kingcounty.gov` trail pages (KC-01/02/03, all VERIFIED). GovDelivery (OTH-02), the one other King County channel this registry evaluated, is now formally REJECTED (see above) rather than pending.

3. **KC-05 (King County GIS Open Data portal UI) was not retested this cycle** — remains BLOCKED (the `opendata.arcgis.com` search UI itself is still JS-rendered). Note this is now a narrower gap than before: the underlying ArcGIS Server behind that portal is confirmed directly reachable and queryable (see KC-06/KC-07 above), so the practical value of fixing KC-05 specifically is reduced — a future cycle could instead try enumerating other `gismaps.kingcounty.gov` folders (e.g. `Roads`, `Districts`) directly by curl rather than fighting the JS portal.

3b. **KC-07's SammamishRoadAlerts layer has not been observed to carry any content besides its single 2014 test record.** Not yet resolvable — requires a future re-query after elapsed time to determine if this is truly abandoned (→ REJECT) or simply dormant pending a real Sammamish road alert (→ SECONDARY/MVP once confirmed live).

3c. **KC-06 has not been tested with a true geometry-corridor (line-buffer) intersection against the full canonical GPX** — only a bounding-box test was performed this cycle, which produced one geographically-irrelevant hit. A future cycle should perform a proper buffered-line intersection query to determine definitively whether any unincorporated-county road crossings exist on this route at all.

4. **No source in this registry provides confirmed point/line/polygon geometry alongside closure status**, except WSDOT-01 (documented geometry-capable fields, not live-tested). Every VERIFIED MVP source (KC-01/02/03, SAM-01, ISS-01) is free-text/prose — this cycle's DOM inspection reconfirmed this directly (no `<div role="alert">` or structured alert schema found anywhere), meaning route-impact determination will depend on named-trail-segment and street-name text matching plus, for KC-01/02/03/SAM-01, whole-page diffing (no per-alert ID exists to key off of). This remains a real, structural limitation, now documented with direct DOM evidence rather than inference.

5. **SEA-03's linked repairs subpage body content still could not be retrieved** despite the URL now being confirmed exact (see resolved item 3 above) — a future session should try a browser-rendered fetch rather than plain WebFetch for this specific Seattle.gov page template.

## Rejected sources and reasons (OTH-02 newly REJECTED this cycle; rest carried forward from SOURCE_REGISTRY)

- **OTH-02 (GovDelivery WAKING bulletins):** NEW REJECTION, sixth cycle. Real, on-topic content confirmed in prior cycles, but the project owner confirmed GovDelivery is not accessible to them, closing off the only two paths to an automatable topic-scoped feed URL. REJECTED.
- **KC-04 (King County Parks Blog Alerts category):** Confirmed stale (no posts since 2021); superseded by KC-01/02/03. REJECTED.
- **ISS-02 (Issaquah Trail Alerts SMS):** One-way SMS broadcast, not a retrievable feed. REJECTED for automation; manual-review fallback only.
- **OTH-01 (Seattle Bike Blog):** Real and active but non-governmental. REJECTED per standing project rule; discovery/lead tool only.
- **SEA-01 (SDOT Street Use ArcGIS MapServer):** Confirmed persistent service failure (prior cycle). REJECTED.
- **SEA-02 (SDOT GIS Datasets Socrata catalog):** Confirmed to be a catalog/directory page, not a data feed (prior cycle). REJECTED.
- **OTH-03A (Bothell) and OTH-03C (Lake Forest Park):** Confirmed no dedicated trail/construction-alert category (prior cycle). REJECTED.

## Overlap notes (see also RESEARCH_FINDINGS.md) — unchanged this cycle

- Lane 06 (Trail Infrastructure Status) overlaps with Lane 01 on any bridge/culvert/boardwalk project (e.g. the George Davis Creek culvert replacement, now independently confirmed by three channels — KC-03, SAM-01, and a GovDelivery bulletin).
- Lane 05 (Flood Conditions) and Lane 04 (Wildfire) may generate hazard advisories near the corridor that do not automatically constitute a Lane 01 route closure; Lane 01 must wait for an explicit official route/trail-closure statement.
- Lane 07 (Government Safety Alerts) may carry emergency/incident-driven closures; Lane 01 should only claim CONFIRMED_ROUTE_IMPACT when a segment name is explicitly given.

## Honest bottom line (updated, sixth cycle)

The sixth follow-up cycle closed exactly one item: OTH-02 (GovDelivery), reclassified REJECT/BLOCKED after the project owner confirmed GovDelivery is not accessible to them. This is a closed gap, not a resolved one — the topic ID was never found, but the item no longer sits open awaiting a human action that isn't available. No other sources changed. The registry stays at 28 sources, version bumped 1.5→1.6.

The fifth follow-up cycle (prior) added four new, directly-verified sources (REDM-01, ISS-03, ISS-04, SAM-02, SAM-03 — five entries) via direct ArcGIS REST queries prompted by a second user-supplied candidate list; two (REDM-01, ISS-03) reached MVP grade — the registry's MVP set grew from 5 to 7, the first geometry-capable MVP sources in this registry. That cycle also caught and corrected its own methodology error mid-stream and directly refuted two external claims (Seattle SDOT_Bikes; Redmond Landbase/Trail) rather than accepting them at face value.

Remaining genuinely open gaps, carried forward and not re-litigated here: KC-05 portal UI (BLOCKED); SEA-03 repairs-subpage body content; KC-07 live-content status; and the geometry-corridor (not bbox) verification needed for KC-06, REDM-01, and ISS-03.
