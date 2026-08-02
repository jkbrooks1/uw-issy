# UW-Issaquah Connector Research — Full Report (Workstreams 03-07)

This is the consolidated full-depth report across all five workstreams researched in this
cycle. It synthesizes each workstream's own `RESEARCH_FINDINGS.md`,
`IMPLEMENTATION_RECOMMENDATION.md`, `ROUTE_RELEVANCE_AND_THRESHOLDS.md`,
`SOURCE_GAPS.md`, and `SOURCE_REGISTRY.json`. For quick-reference tables, see the
companion documents: `UW_ISSY_CONNECTOR_RESEARCH_03_07_EXECUTIVE_SUMMARY.md`,
`UW_ISSY_CONNECTOR_IMPLEMENTATION_MATRIX_03_07.md`,
`UW_ISSY_HAZARD_OWNERSHIP_MATRIX_03_07.md`,
`UW_ISSY_CONNECTOR_ENV_REQUIREMENTS_03_07.md`,
`UW_ISSY_CONNECTOR_SOURCE_TEST_LOG_03_07.md`, `UW_ISSY_NORMALIZED_SCHEMAS_03_07.md`, and
the merged `UW_ISSY_CONNECTOR_REGISTRY_03_07.json`.

Canonical route: `data/route/UnivWA-Issaquah.gpx` — 33.83 mi, bbox lat 47.55207-47.75889 /
lon -122.3057 to -122.04414, reused unchanged from workstreams 01/02 by every workstream
in this cycle. No workstream re-derived route geometry from scratch; all built on the
already-validated figures.

---

## 03_AIR_QUALITY

**Sources evaluated: 11** (2 MVP, 6 SECONDARY, 1 UNRESOLVED, 2 REJECT).

**Route relevance finding**: live official monitor data on July 29, 2026 showed real
variation even on a clean day (Seattle-NE 127th AQI 9; Lake Forest Park-Town Center AQI
16; Bellevue-SE 12th AQI 17; Issaquah-Lake Sammamish AQI 22) — this directly answered the
job's question of whether Seattle and Issaquah conditions differ enough to justify
multiple observation points: **yes**. Recommended design: 4 official monitor points
(minimum viable: compress to 3 corridor buckets). Route-relevance method: point-to-route
distance for monitors (8-mile eligibility radius), polygon intersection for forecast
layers, never city-name matching alone.

**Rejected/non-primary sources and why**: `KC-PH-01` and `SEA-PH-01` (King County/Seattle
public-health guidance pages) kept as reference copy only — real content, but not live
connectors. `PSCAA-03` (official corrected low-cost sensor concept) is UNRESOLVED, not
rejected — the policy/quality story is good but no proven unattended export path exists
yet.

**Key risk**: PSCAA's station-detail endpoint requires session bootstrap (cookie state),
making it operationally brittle as a primary source — kept as secondary rather than MVP
for this reason. PM10 fields exist structurally in `ECO-01` but returned null at all 4
route-near stations on test day — treat as opportunistic, not guaranteed.

---

## 04_WILDFIRE

**Sources evaluated: 17** (5 MVP, 7 SECONDARY, 5 REJECT).

**Route relevance finding**: strict geometry-first pipeline required — incident-type
filter first, bbox prefilter only to cut cost, then real point-distance/polygon
intersection/fire-zone match, only then severity. Route sits fully inside fire zones
`WAZ654`/`WAZ657` and county `WAC033`, which anchors the zone-match fallback for NWS
alerts with null geometry. Concrete thresholds: active fire point ≤5mi (high priority
≤2mi), perimeter within 10mi buffer (high priority 2mi or route-line intersection),
evacuation zone requires actual polygon intersection or named landmark match (no
proximity inference), smoke plume 5mi buffer, Red Flag/Fire Weather Watch by fire-zone
membership, county burn restriction by county membership.

**Rejected sources and why**: `DNR-03` (dashboard shell — DNR's underlying services are
the better automation target), `KC-02` (signup-only), `WAEMD-01` (guidance hub, not a
feed), `WSPARKS-01` (route doesn't depend on a WA State Park segment), `PULSEPOINT-01`
(wrong signal shape for an urban wildfire route monitor).

**Key risks**: WFIGS burst querying hit an ArcGIS Online `429` — must serialize requests
and reuse incident IDs. NOAA HMS has no stable "current" alias (dated-file pattern only).
No verified unattended public evacuation feed exists for this corridor at all — the
strongest gap in this workstream. FIRMS remains fully credential-blocked
(`NASA_FIRMS_MAP_KEY`).

---

## 05_FLOOD_CONDITIONS

**Sources evaluated: 23** (5 MVP, 6 SECONDARY, 11 REJECT, 1 UNRESOLVED) — the largest and
most heavily-tested registry of the five workstreams (17 live tests).

**Route relevance finding**: six route sections mapped to gauge relevance, with the
strongest signal at the route's Issaquah terminus (`USGS-01`/`NWPS-01`, 173m from the
route end) and the weakest in the middle third — no verified live Sammamish River gauge
exists in the tested, production-ready set, despite the route running many miles through
that corridor. Official thresholds are unusually well-defined here: Issaquah local flood
phases (I: 6.5ft, II: 7.5ft, III: 8.5ft, IV: 9.0ft at Hobart) and NWPS flow categories
(Action 1340cfs, Minor 2000cfs, Moderate 2300cfs, Major 2800cfs) both map cleanly to a
6-state route-impact model (confirmed closure -> observed flooding -> forecast flooding
-> probable impact -> elevated water -> no known impact).

**Rejected sources and why**: `KCF-02` (King County's own app backend — undocumented,
key-bound, should not be mirrored), `KC-ROAD-02` (only 2014 test records), Bellevue/
Sammamish/Seattle-SPU/alert-signup systems (guidance/notification products, not feeds),
Ecology flood maps (static planning context, not current conditions).

**Key risk**: do not assume a high river/lake stage automatically means the trail is
flooded — this was an explicit hard rule in the job brief and this workstream built its
entire impact model around respecting it (Lake Sammamish level alone never escalates
past `elevated_water` without closure/NWS corroboration).

---

## 06_TRAIL_INFRASTRUCTURE_STATUS

**Sources evaluated: 14** (5 MVP, 3 SECONDARY, 6 REJECT).

**Scope decision**: the Seattle-area route does not follow a French canal system: no
canal authority was invented, and no irrelevant canal data was forced in. Ballard Locks
(closest approach ~4.35mi) and Montlake Bridge (~0.21mi but not actually traversed by the
canonical GPX) were both explicitly tested against the route geometry and rejected as
route-relevant. The workstream instead confirmed a real, narrower scope: waterway-caused
and crossing-caused trail infrastructure impacts (culverts, drainage, fish passage,
shoreline, bridges) — anchored by a **live, currently-active culvert-closure event** on
the East Lake Sammamish Trail discovered during testing (`KC-03`), independently
corroborated by a City of Sammamish project-update page (`SAM-02`) naming the same creek,
culverts, and short-span bridge.

**Answering the six required questions**: (1) yes, a dedicated sixth connector is
justified — real, currently-active route-relevant events exist that neither 01 nor 05
would naturally surface; (2) it does not duplicate 01 (generic closures) or 05 (raw
hydrology) once scoped to infrastructure-caused impacts specifically; (3) unique data:
culvert/drainage/bridge/shoreline/fish-passage-caused trail impacts; (4) generic
construction stays in 01, raw gauge/stage data stays in 05; (5) recommended label
`WATERWAY_AND_CROSSING_STATUS`; (6) implement as a **hybrid** — specialized normalization
logic plus filtered reuse of existing closure sources, not a standalone hydrology
connector; (7) five official sources provide enough data: three King County Parks trail
pages, one City of Sammamish update, one City of Issaquah ArcGIS service.

**Rejected sources and why**: `KC-05`/`SammamishRoadAlerts` (only stale 2014 test
records), `SEA-01`/Seattle Parks repairs page (weak extraction quality), `SEA-02`/SDOT
Ballard corridor (off-route), `USGS-01` lake level (belongs to lane 05, not 06),
`USACE-01` (blocked from this environment, `403 Access Denied`), `WSDOT-01` movable
bridges (route doesn't traverse a state-operated movable bridge).

**Key risk**: every MVP source except the Issaquah ArcGIS service is HTML-only with no
stable per-alert ID — production implementation requires whole-page/block diffing against
last-known-good, not per-item change detection. Seattle-side coverage (Burke-Gilman west
of the lake) remains the weakest link in the whole workstream.

---

## 07_GOVERNMENT_SAFETY_ALERTS

**Sources evaluated: 24** (3 MVP, 6 SECONDARY, 6 UNRESOLVED, 9 REJECT) — the most
extensively tested workstream (27 live tests).

**Route relevance finding**: six source-class-specific relevance methods defined (CAP/NWS
structured alerts by 8 route-point query + zone backstop; Seattle/UW/OEM text-first
sources by gazetteer token match; municipal CivicPlus feeds by city-intersection +
route-feature match; WSDOT by a precomputed crossing/detour watchlist; DOH by King
County/route-municipality specificity; GTFS alternate-transport kept in a wholly separate
block, never merged into the main hazard card).

**Deduplication strategy**: CAP identifier first, then source-native ID (WordPress
post_id, CivicPlus alert_id, GTFS entity_id), then cross-source clustering by normalized
headline + event type + place tokens + effective-time bucket. Priority order when the
same event appears in multiple official channels: NWS CAP > UW-01 (campus-origin) >
SEA-01 (Seattle OEM-origin) > municipal feeds (only when adding route-local specificity)
> SEAFD-01/SEAPD-01 (corroboration only, never canonical).

**Rejected sources and why**: `NOAA-LEGACY-01` (superseded by modern NWS stack),
`KCEM-01` (authoritative subscriber system, not a public pull source), `RPIN-LEGACY-01`
(legacy naming, not a distinct connector), `BEL-01`/`KIRK-01`/`SAM-01` (informational or
signup-only, not unattended feeds), `WAEMD-01` (statewide directory, not a live incident
source), `FEMA-02` (retrospective audit only — 442,914 archived records but ~24hr
publication delay, unsuitable for live monitoring), `WSP-01` (blocked by a Sucuri
JavaScript challenge).

**Key risk, confirmed live rather than theoretical**: a statewide NWS query during this
workstream's own testing returned live Air Quality Alerts — real data, but belonging to
03, not 07. This is now a hard implementation-time filter requirement, not a hypothetical
edge case. Eastside municipal coverage (Bothell, Woodinville, Sammamish, Issaquah) remains
markedly weaker than Seattle/UW coverage — every one of those four either showed only a
zero-alert state or (Sammamish) has no public machine-readable feed at all.

---

## Cross-cutting risks affecting all five workstreams

1. **Source-ID namespace collisions** (`KC-01`, `ISS-01`, and others mean different
   things in different workstreams) — see
   `UW_ISSY_CONNECTOR_IMPLEMENTATION_MATRIX_03_07.md`.
2. **Schema field-naming split** (camelCase in 03/05, snake_case in 04/06/07) — see
   `UW_ISSY_NORMALIZED_SCHEMAS_03_07.md`.
3. **Genuinely joint-owned hazard types** requiring merged event publishing, not
   single-workstream ownership — see `UW_ISSY_HAZARD_OWNERSHIP_MATRIX_03_07.md`.
4. **No testing was performed from the eventual Hetzner/n8n production host** — every
   "live and reachable" result in this cycle needs one production-host confirmation pass;
   03 already found one concrete local-vs-library TLS discrepancy against Ecology.
5. **ArcGIS-hosted services (heavily used across 04, 05, 06) require serialized, polite
   polling** — a real `429` was hit this cycle, not a theoretical rate limit.
6. **JavaScript/bot-protection challenges** blocked exactly two sources project-wide
   (USACE in 06, Washington State Patrol in 07) — both need a browser-capable fetch path
   if ever required.

## What this cycle did not do

No production n8n workflow was built for any of the five workstreams. No website changes
were deployed. No scheduled jobs were activated. No paid API accounts were registered. No
credentials were exposed — every environment-variable inspection in every workstream was
name-only. No workstream identifier was renamed, merged, or deleted. This report and its
companion documents are the complete research handoff; see
`UW_ISSY_IMPLEMENTATION_HANDOFF_03_07.md` for the self-contained prompt to hand to the
next coding agent.
