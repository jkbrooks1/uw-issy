# UW-Issaquah Connector Research — Executive Summary (Workstreams 03-07)

**Scope:** first research/planning cycle for the five remaining connector workstreams —
Air Quality (03), Wildfire (04), Flood Conditions (05), Waterway & Trail Infrastructure
Status (06), and Government Safety Alerts (07) — for the UW-Issaquah cycling route
(University of Washington -> Burke-Gilman Trail -> Sammamish River Trail -> Marymoor Park
-> East Lake Sammamish Trail -> Issaquah, 33.83 mi). Workstreams 01 (Route Conditions) and
02 (Weather) were already completed in prior cycles and are referenced here only for
context. **No production n8n workflow was built in this cycle for any workstream** — this
is research, source testing, and implementation planning only.

**Method:** run as a 5-task parallel Ringer swarm (independent Codex workers, one per
workstream, each with live network access and write access scoped to its own connector
folder), followed by this cross-workstream synthesis pass performed directly by the
orchestrating session (the synthesis step requires reading all five workstreams together
and is not itself parallelizable work).

## Recommended source stack by workstream

| Workstream | Recommended MVP set |
|---|---|
| 03_AIR_QUALITY | WA Ecology hourly-monitor ArcGIS REST (`ECO-01`), WA Ecology smoke-forecast ArcGIS REST (`ECO-02`), PSCAA burn-ban status page (`PSCAA-02`) |
| 04_WILDFIRE | WFIGS fire locations (`NIFC-01`) + perimeters (`NIFC-02`), NWS active alerts (`NWS-01`), NOAA HMS smoke polygons (`NOAA-01`), King County burn bans (`KC-01`) |
| 05_FLOOD_CONDITIONS | USGS Issaquah Creek gauges x2 (`USGS-01`, `USGS-02`), NOAA Water Prediction Service (`NWPS-01`), NWS flood alerts (`NWS-01`), City of Issaquah flood page (`ISS-01`) |
| 06_TRAIL_INFRASTRUCTURE_STATUS | King County Parks trail pages x3 (`KC-01`, `KC-02`, `KC-03`), City of Sammamish George Davis Creek update (`SAM-02`), City of Issaquah construction ArcGIS service (`ISS-01`) |
| 07_GOVERNMENT_SAFETY_ALERTS | NWS CAP alerts (`NWS-01`), AlertSeattle (`SEA-01`), UW Alert (`UW-01`) |

Every one of these 21 MVP sources is **free of any authentication requirement** and was
**directly tested live** during this cycle (90 live tests total across the five
workstreams — see `UW_ISSY_CONNECTOR_SOURCE_TEST_LOG_03_07.md`).

## Immediate implementation priorities

1. Build 05_FLOOD_CONDITIONS and 07_GOVERNMENT_SAFETY_ALERTS first — cleanest,
   fully credential-free MVP sets, highest readiness scores.
2. Build 04_WILDFIRE next, respecting the WFIGS rate-limit serialization requirement and
   the NOAA HMS dated-file discovery pattern.
3. Build 03_AIR_QUALITY next, re-testing Ecology's TLS behavior from the actual
   production host first (a local client-library discrepancy was found this cycle, not a
   dead source).
4. Build 06_TRAIL_INFRASTRUCTURE_STATUS last — every MVP source except `ISS-01` is
   HTML-scrape-backed with no stable per-alert ID, the highest ongoing maintenance
   burden of the five.
5. Before any of the above: implement the cross-workstream dedup rules in
   `UW_ISSY_HAZARD_OWNERSHIP_MATRIX_03_07.md` and the source-ID namespacing fix in
   `UW_ISSY_CONNECTOR_IMPLEMENTATION_MATRIX_03_07.md` — both are structural risks that
   affect every workstream above, not optional polish.

## Blockers

- **Source-ID collisions across workstreams**: `KC-01`, `ISS-01`, and other IDs are
  reused with different meanings in different workstreams' own registries. Any shared
  dashboard or pipeline must namespace by workstream before merging data, or it will
  silently corrupt cross-workstream joins.
- **Schema-convention split**: 03 and 05 proposed camelCase field names; 04, 06, and 07
  proposed snake_case. Must be reconciled to one convention (snake_case recommended)
  before implementation.
- **Several genuinely joint-owned hazards** (fire-caused trail closures, flood-caused
  trail closures, bridge closures, dam incidents, waterway infrastructure closures) need
  deliberate event-merging logic so the same real-world event doesn't appear as two
  separate rider-facing cards.

## Credentials required

Only one credential is worth pursuing immediately: **`WSDOT_TRAVELER_API_ACCESS_CODE`**
(already present in this environment by name, never yet tested live) — it independently
unlocks value for three workstreams (05, 06, 07). Everything else credential-gated
(`AIRNOW_API_KEY`, `NASA_FIRMS_MAP_KEY`, FEMA IPAWS username/password/PIN) is secondary or
unresolved and does **not** block any MVP build. Full detail:
`UW_ISSY_CONNECTOR_ENV_REQUIREMENTS_03_07.md`.

## Major overlap decisions

See `UW_ISSY_HAZARD_OWNERSHIP_MATRIX_03_07.md` for the full 19-hazard matrix. Headline
decisions: 03 owns air-quality alerts outright; 04 owns Red Flag/Fire Weather Watch
outright; 05 owns Flood Watch/Warning/Advisory outright; 07 owns
evacuation/hazmat/boil-water/dam-incident as primary public-warning surfaces; and five
hazard types (fire-caused and flood-caused trail closures, bridge closures, dam
incidents, waterway infrastructure closures) are genuinely joint-owned between a
closure-of-record workstream and a cause-classification workstream, requiring merged
event publishing rather than single ownership.

## Workstream 06 — public-facing name recommendation

The internal folder identifier `06_TRAIL_INFRASTRUCTURE_STATUS` (already renamed from the
inherited CDM taxonomy's `06_CANAL_STATUS` in a prior session, confirmed by the project
owner as authoritative for this research cycle) stays unchanged. For the **public-facing
display label**, this cycle's independent research recommends:

**`WATERWAY_AND_CROSSING_STATUS`**

This was evaluated fresh against the other candidates (`WATERWAY_STATUS`,
`TRAIL_WATERWAY_STATUS`, `WATER_INFRASTRUCTURE_STATUS`, `RIVER_AND_LAKE_TRAIL_STATUS`,
and the internal folder name itself) and was the only option that captures both the
waterway-infrastructure cause (culverts, drainage, fish passage, shoreline) and the
crossing/bridge dimension the research confirmed is genuinely in scope for this route,
without implying a canal-authority concept the actual GPX doesn't touch.

## Recommended implementation order (all five workstreams)

05_FLOOD_CONDITIONS -> 07_GOVERNMENT_SAFETY_ALERTS -> 04_WILDFIRE -> 03_AIR_QUALITY ->
06_TRAIL_INFRASTRUCTURE_STATUS, per the readiness/maintenance-burden reasoning above.

## Required summary table

| Workstream | Recommended primary source | Recommended secondary source | Supplemental source | Auth required | Route-specific capability | Update frequency | Implementation readiness | Principal risk | Recommended build order |
|---|---|---|---|---|---|---|---|---|---|
| 03_AIR_QUALITY | `ECO-01` WA Ecology hourly monitors | `ECO-02` WA Ecology smoke forecast | `AIRNOW-02`, `WASMOKE-01`, `NWS-AQ-01` | No | 3-4 point corridor design (UW/Seattle, Eastside, Issaquah differ measurably) | 60 min (current), 3-6 hr (smoke forecast) | `ready_now` | PSCAA session-bound secondary source; production TLS re-test needed for Ecology | 4th |
| 04_WILDFIRE | `NIFC-01`/`NIFC-02` WFIGS | `NWS-01` Red Flag/Fire Weather Watch | `NOAA-01` smoke polygons, `KC-01` burn bans | No | Point/perimeter/zone-based route-buffer thresholds (5mi/2mi/10mi tiers) | 15 min (fire/alerts), 60 min (smoke) | `ready_now` | WFIGS rate limiting; NOAA HMS no stable "current" alias | 3rd |
| 05_FLOOD_CONDITIONS | `USGS-01`/`USGS-02` Issaquah Creek gauges | `NWPS-01` official flood categories | `NWS-01` flood alerts, `ISS-01` local phase policy | No | Route-end gauge at 173m; official action/minor/moderate/major thresholds | 15 min | `ready_now` | No verified live Sammamish River gauge for the middle third of the route | 1st |
| 06_TRAIL_INFRASTRUCTURE_STATUS | `KC-03` East Lake Sammamish Trail page (live closure confirmed) | `SAM-02` Sammamish creek project update | `ISS-01` construction ArcGIS, `KC-01`/`KC-02` | No | Strict facility/trail-name geometry matching; 60m/150m point-distance tiers | 6-12 hr | `ready_with_scraper` | No stable per-alert ID on any HTML source; highest maintenance burden of the five | 5th |
| 07_GOVERNMENT_SAFETY_ALERTS | `NWS-01` CAP alerts | `SEA-01` AlertSeattle | `UW-01`, `SEAFD-01`, `SEAPD-01`, `DOH-02` | No (WSDOT/FEMA secondary sources need credentials) | 8 route-point CAP queries plus King County zone/statewide backstop | 5-15 min | `ready_now` | Must filter NWS Air Quality Alerts (belong to 03) — a real overlap confirmed live, not hypothetical | 2nd |

## Overall result

`PASS WITH BLOCKERS`. All five workstreams completed their required research deliverables
with live-tested, credential-free MVP sets ready to build. The blockers above (source-ID
namespacing, schema-convention split, joint-hazard event merging) are implementation-time
fixes, not research gaps — none require further research before a coding agent can begin
building, provided the implementation handoff prompt's requirements are followed.
