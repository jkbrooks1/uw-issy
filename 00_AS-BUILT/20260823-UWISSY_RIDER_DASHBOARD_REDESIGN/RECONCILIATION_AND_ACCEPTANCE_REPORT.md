# UW-Issy Rider Dashboard Redesign — Reconciliation & Acceptance Report

Date: 2026-08-23
Live URL: https://uw-issy.biketourfrance.net
Deploy commit: `49238e13ce3a8f3f319ea20f45b38bdc08ed36e5`
CI run: https://github.com/jkbrooks1/uw-issy/actions/runs/32664558345 (green, all 18 steps)
Live release: `20_STATUS_PUBLISHER-20260823T201500Z-001`

## Root cause (data pipeline)

Two real, code-level bugs in `scripts/build-public-package-snapshot.mjs` were silently dropping real active trail closures and discarding usable geometry:

1. `classifyRouteRelevance`/`classifyRouteImpact` only trusted a narrow set of upstream field shapes. Lane 06 (Trail Infrastructure Status) publishes its route-tie signal as `route_relevance.classification`/`matched_route_sections`, a real, valid signal the code didn't recognize — so genuine `confirmed_route_impact` closures were marked `off_route`/`no_route_impact` before freshness was ever evaluated.
2. `isClosureTypeEvent` only exempted `laneId === "01_ROUTE_CONDITIONS"` or `event_type === "trail_closure"` from the generic 48-hour short-lived-alert rule. Lane 06's real closures have `event_type: "other"` with `status: "closed"/"planned"` — a real closure signal the code didn't recognize, so they'd have been wrongly aged out as stale even after fix #1.
3. `mapEventGeometry` discarded any event whose raw `geometry.type === "none"`, even when a resolvable `routeSegmentId` existed (as with the East Lake Sammamish Trail closure) — so the map had nothing to plot.

`src/lib/route-status/presentation-eligibility.ts` (the dashboard's own independent defense-in-depth freshness guard) had the same narrow-window gap as bug #2, applied separately — found and fixed during final verification, after Round 1/2 had already fixed the pipeline-layer copy of this logic but not this parallel TypeScript copy.

## Real event/map reconciliation — live production data

| Stage | Count | Source |
|---|---|---|
| Raw candidate events across all 8 lanes | 21 | `data/connectors/evidence/workflow20-status-latest.json` |
| Route-relevant + route-impact + presentation-eligible (rider-relevant active issues) | **4** | live `dashboard-data.json` → `activeEventCount` |
| Reasonably mappable (real geometry derivable from route or native coordinates) | 4 | live `route-events.geojson` |
| Actually mapped (real, non-null geometry) | **4 / 4** | live `route-events.geojson` — 1 `LineString`, 3 `Point`, all derived from real source fields or the real canonical route line, none invented |
| Correctly list-only (no geometry, justified gap) | 0 | none this cycle — all 4 currently-eligible events had a resolvable location |
| Duplicate merges | 2 | logged in `verify-snapshot-rebuild.txt` |

Before this fix (same real evidence date, pre-fix code): 1 of 21 eligible, 1 of 1 mapped. The 3 previously-hidden Lane 06 trail-infrastructure closures (Burke-Gilman Trail, Sammamish River Trail, George Davis Creek fish-passage project) are now real, visible, correctly-mapped rider issues.

## Hard acceptance gates

| Gate | Result | Evidence |
|---|---|---|
| 1 — Rider hierarchy leads, not lanes | **PASS** | `src/pages/index.astro` render order: header → Route status → map → Current route alerts → Closures/Detours → Weather/Air → Route impacts → collapsed Monitor Health |
| 2 — Every displayed count has matching detail | **PASS** | `CurrentRouteState.astro` counts the actual rendered `events` array, not a raw lane-summary sum; live page shows 4 issues / 4 detailed cards |
| 3 — Map usefulness | **PASS** | all 4 live events have real, non-null geometry and render as markers/segment |
| 4 — Map/list parity | **PASS** | same 4 event IDs back both `route-events.geojson` (map) and `dashboard-data.json`/event table (list) |
| 5 — Closure mapping | **PASS** | East Lake Sammamish Trail closure renders as a real `LineString` segment on the live map, distinctly colored, not list-only text |
| 6 — Cycling base layer | **PASS** | live JS bundle confirmed: `tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png`, attribution links to cyclosm.org and openstreetmap.org/copyright |
| 7 — Unauthorized copy removed | **PASS** | live page fetch confirms "Safe routes. Well-informed riders. Better bike tours." absent; no replacement copy added |
| 8 — Monitor lanes demoted | **PASS** | lane/source detail now lives in collapsed `MonitorHealthDisclosure.astro`, below rider content |
| 9 — No false precision | **PASS** | events without geocoded endpoints use route-section-derived geometry, not invented coordinates; none of the 4 live events needed a "broad area" fallback this cycle |
| 10 — No false all-clear | **PASS** | rider state logic (`CurrentRouteState.astro`) treats failed/degraded/unknown data as CAUTION/DATA STALE, never CLEAR; current live state correctly shows CLOSED (real closures present) with a "5 degraded" confidence note |

## Verification commands run for real (this session, against the live-deployed commit)

- `npm run typecheck` → pass (`verify-typecheck.txt`)
- `npx vitest run` → 6 files / 98 tests pass (`verify-tests.txt`)
- `node scripts/build-public-package-snapshot.mjs ... public/data` → 4 of 21 eligible (`verify-snapshot-rebuild.txt`)
- `node scripts/validate-public-package.mjs public/data` → pass (`verify-public-package.txt`)
- `npx astro build` → pass (`verify-astro-build.txt`)
- `node scripts/verify-production.mjs https://uw-issy.biketourfrance.net` → 26/27 pass; the 1 failure is the pre-existing, disclosed Cloudflare Email Address Obfuscation mailto-rewrite issue, unchanged from before this redesign, not a new regression (`verify-production.txt`)
- Live GitHub Actions run 32664558345: all 18 steps green (`ci-run-proof.json`)
- Live `curl` checks of the deployed site and its 4 data files, and the deployed JS bundle for the CyclOSM URL — all confirmed directly in this session, not assumed from CI's own self-report

## Known limitations, disclosed

- Mobile viewport testing used browser window resize, not true device emulation — visual check only, not a device-lab pass across the full matrix (reduced motion, 200% zoom, cross-browser) called out in `verify-production.mjs`'s own disclosed-gap list.
- `release-manifest.json`'s `buildState`/`deployState`/`productionProofState` remain `"unknown"` — a pre-existing, disclosed gap from before this redesign, unrelated to this work, not touched.
- Weather/Air summary currently reflects the same route-wide (not multi-point) data the pipeline already provides; no new per-point weather data source was added, since none exists upstream — flagged honestly on the page rather than implying coverage that doesn't exist.
