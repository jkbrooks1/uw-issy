# 01_ROUTE_CONDITIONS

## Status

Research and source-verification phase COMPLETE through a fifth follow-up cycle (2026-07-28). The canonical GPX was corrected by the project owner in the fourth cycle (installed at the canonical path; prior version archived at `data/route/archive/`). This fifth cycle, triggered by a second user-supplied candidate-source list, added 5 new directly-verified ArcGIS REST sources (REDM-01, ISS-03, ISS-04, SAM-02, SAM-03) — REDM-01 (City of Redmond) and ISS-03 (City of Issaquah, with a confirmed on-route geometry hit) are the registry's first geometry-capable MVP sources, growing the MVP set from 5 to 7. Two unverified external claims (a Seattle ArcGIS service, a Redmond GIS layer) were directly tested and refuted rather than incorporated. See the audit report for the current PASS/PARTIAL status and what remains genuinely open (GovDelivery topic ID; geometry-corridor, not bounding-box, verification still needed for KC-06/REDM-01/ISS-03). No production n8n workflow has been built. This directory contains research, verification, and planning deliverables only, per the assigned work order (research/planning only — production build is a separate future task).

## Scope

Lane 01 covers current or planned conditions that affect whether the UW–Issaquah cycling route is open, passable, or practical to ride: full/partial/temporary closures, construction, maintenance, detours, surface work, blocked segments, access restrictions, incident-related closures, event-related closures, park-access restrictions affecting continuity, road/crossing closures interrupting the route, emergency repair work, utility work affecting the traveled corridor, and official notices of material route disruption.

Lane 01 explicitly does NOT cover: weather (02), air quality (03), wildfire (04), flood conditions (05), physical infrastructure asset condition/longer-term capital project tracking (06_TRAIL_INFRASTRUCTURE_STATUS), or general government/public-safety alerts (07). Overlaps with those lanes are called out in RESEARCH_FINDINGS.md and SOURCE_GAPS.md where they exist.

## Canonical route input

`data/route/UnivWA-Issaquah.gpx` (project root) — corrected by the project owner in the fourth follow-up cycle (2026-07-28); prior version archived at `data/route/archive/UnivWA-Issaquah.v1.20260728.gpx`, not deleted. Current facts: ~33.83 miles, bounding box lat 47.55207–47.75889 / lon -122.3057 to -122.04414.

## Files in this directory

- `README.md` — this file
- `SOURCE_REGISTRY.md` — human-readable source registry, all evaluated sources
- `SOURCE_REGISTRY.json` — machine-readable version of the same registry (validated JSON)
- `RESEARCH_FINDINGS.md` — narrative findings, jurisdiction breakdown, discovery method
- `API_AND_FEED_TEST_RESULTS.md` — actual fetch/test results with real HTTP status and observations
- `SOURCE_GAPS.md` — coverage gaps, rejected sources, unresolved items, lane overlaps
- `IMPLEMENTATION_RECOMMENDATION.md` — working-level recommendation for how to build Lane 01 later
- `ROUTE_SECTION_SOURCE_MAPPING.md` — route segment model cross-referenced to owning agencies and sources

No `raw-research/`, `sample-responses/`, `schemas/`, `scripts/`, or `tests/` subdirectories were created in this research cycle: no structured machine-readable payload was successfully retrieved that warranted a saved sample (see `API_AND_FEED_TEST_RESULTS.md`), and no helper script was needed beyond one-off inline JSON validation commands (recorded in the build log, not archived as a standalone script). Directories are created empty-decorative only when future work materially needs them.

## Final polished deliverables (same directory)

- `UW_ISSY_01_ROUTE_CONDITIONS_FINAL_RESEARCH_REPORT_v1.md`
- `UW_ISSY_01_ROUTE_CONDITIONS_IMPLEMENTATION_RECOMMENDATION_v1.md`
- `UW_ISSY_01_ROUTE_CONDITIONS_AUDIT_REPORT_v1.md`
- `UW_ISSY_01_ROUTE_CONDITIONS_FINAL_SOURCE_REGISTRY_v1.json`

These four files (only) were also copied to `/Users/jkbrookspersonal/Downloads`, verified by SHA-256 against the authoritative copies in this directory.

## Key finding (one line)

The Burke-Gilman, Sammamish River, and East Lake Sammamish Trails are collectively the "Leafline Trails Network" and are jurisdictionally split between Seattle (SDOT/Seattle Parks, south of NE 145th St), King County Parks (from NE 145th St through Bothell/Woodinville/Redmond/Sammamish), and the University of Washington (on-campus segment) — no single agency owns route-wide closure reporting. Unlike Seattle (whose entire ArcGIS Server is confirmed down), the cities of Redmond, Sammamish, and Issaquah each run their own live, unauthenticated ArcGIS REST services with real construction/alert data — two of these (Redmond's Traffic/Alerts, Issaquah's PW Construction Projects) are now MVP-grade, geometry-capable sources, the first non-free-text sources in this registry. The strongest MVP path is now a mix of monitored HTML/RSS pages (King County, Sammamish, Issaquah civic alerts) plus these newly-confirmed city-run ArcGIS REST APIs — still not a single clean statewide API, but no longer purely text-based either.
