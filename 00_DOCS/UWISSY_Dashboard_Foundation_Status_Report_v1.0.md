# UW-Issy Dashboard Foundation — Status Report v1.0

**Date:** 2026-08-02
**Scope:** Continuation and completion of the existing dashboard-foundation swarm's work (`~/.ringer/work/btf-uwissy-dashboard-20260802/01-foundation`), which had finished in a `FAIL` state after getting blocked on `npm install`. No competing implementation was created; all work continued in the same files, same paths, same plan (`00_DOCS/v.01.UI_UWISSY_Status_Buildspec.md`).

## Files created and changed

**Created by the prior swarm attempt, verified and used as-is:**
- `package.json`, `astro.config.mjs`, `tsconfig.json`, `svelte.config.js`, `package-lock.json`
- `src/pages/index.astro`, `src/styles/route-status.css`
- `src/lib/route-status/` — all 10 contract-layer files (`types.ts`, `lane-labels.ts`, `lane-colors.ts`, `display-tier.ts`, `source-health.ts`, `format-time.ts`, `load-public-package.ts`, `validate-public-package.ts`, `normalize-dashboard-data.ts`, `normalize-route-events.ts`)
- `scripts/validate-route-source.mjs`, `scripts/convert-route-gpx-to-geojson.mjs`, `scripts/validate-public-package.mjs`, `scripts/lib/gpx.mjs`
- `tests/route/gpx-pipeline.test.ts`, `tests/public-package/*.test.ts`
- `data/connectors/evidence/workflow08-status-snapshot-20260802T162329Z.json` (real captured Workflow 08 output, read-only input)

**Changed in this task:**
- `scripts/build-public-package-snapshot.mjs` — fixed the event-geometry mapping gap (see below). This is the only script logic changed in this session.
- `src/lib/route-status/types.ts` — fixed a real TypeScript bug: `DashboardEventWithUnknownLane` used `DashboardEvent & {...}` to override `laneId`, but TypeScript intersects rather than overrides a shared property, silently narrowing it back to the strict 7-lane union and defeating the whole point of the type. Changed to `Omit<DashboardEvent, "laneId"> & {...}`.
- `tests/route/gpx-pipeline.test.ts` — fixed two `Math.min(...array)` calls receiving `(number | undefined)[]` under strict indexed-access typing; added non-null assertions on the known-shape coordinate pairs.

**Not created by this task, produced only as a side effect of running the (pre-existing) scripts for real, per the build brief:**
- `public/routes/UnivWA-Issaquah.geojson`, `public/data/dashboard-data.json`, `public/data/route-events.geojson`, `public/data/system-health.json`, `public/data/release-manifest.json`, `dist/` (Astro build output)

**Resolved after this report was first drafted:** `public/UnivWA-Issaquah.gpx` (the stale, superseded route file) was deleted by the project owner directly, with the canonical GPX and built GeoJSON both verified present and non-empty immediately beforehand. `rm` had been denied twice when attempted from within this session; the project owner ran the deletion themselves rather than have it forced or worked around.

## Was the canonical GPX converted correctly?

Yes, verified directly, not assumed:
- `node scripts/validate-route-source.mjs data/route/UnivWA-Issaquah.gpx` → `PASS: 1 track(s), 1 segment(s), 1470 point(s), bounds [47.55207, -122.30570] to [47.75889, -122.04414], plausible for UW-Issaquah`.
- `node scripts/convert-route-gpx-to-geojson.mjs` → `PASS: wrote public/routes/UnivWA-Issaquah.geojson — LineString with 1470 point(s)`.
- Point count (1,470) matches the real GPX's actual track-point count, independently confirmed in the geospatial capability audit before this task began.

## Does `route-events.geojson` contain any real geometry?

**Yes — 5 of 12 features now carry real, source-native `Point` geometry.** Before this task's fix, all 12 were `null` (the build script only checked for a literal `geometry` field, which no lane publishes). The fix adds a second, source-native check: `event.location.{latitude,longitude}`, used only when both are present as valid finite numbers in range — never invented, never geocoded, never inferred from a route section or place name.

## Feature counts

| | Count |
|---|---:|
| Total features in `route-events.geojson` | 12 |
| Features with real geometry (`Point`) | 5 |
| Features with `null` geometry (text-only) | 7 |

## Lane-by-lane geometry coverage (this real snapshot)

| Lane | Events in this snapshot | Real geometry | Null geometry | Why |
|---|---:|---:|---:|---|
| 01 Route Conditions | 1 | 0 | 1 | Source is a scraped page tied to a named trail segment, no coordinates published |
| 02 Weather | 0 | — | — | No events in this snapshot |
| 03 Air Quality | 1 | 0 | 1 | Burn-ban status page, no coordinates published for this event |
| 04 Wildfire | 0 | — | — | No events in this snapshot |
| 05 Flood Conditions | 5 | **5** | 0 | Every event is a fixed USGS/NOAA gauge with real, published station coordinates |
| 06 Trail Infrastructure | 0 | — | — | No events in this snapshot |
| 07 Government Safety Alerts | 5 | 0 | 5 | Statewide health advisories — `location.latitude`/`longitude` keys are present but genuinely `null` (confirmed by direct inspection: not missing keys, actual null values, correctly left ungeocoded) |

This distribution is a property of *this specific captured snapshot* (which lanes happened to have live events when it was taken), not a permanent per-lane capability ceiling — the geospatial audit found 6 of 7 lanes carry real coordinates on *some* sources; this snapshot simply only exercised lane 05's.

## Source-native coordinates used

All 5 real `Point` geometries came from `event.location.latitude` / `event.location.longitude` on lane 05 (Flood Conditions) events — real USGS/NOAA gauge station coordinates published by the connector, not derived, geocoded, or estimated by this task. Example: `05_FLOOD_CONDITIONS:USGS-01:d5267c19` → `[-122.0467, 47.5525]`, the real, fixed coordinates of the USGS gauge station monitoring Issaquah Creek.

## Geometry intentionally withheld

7 events, all confirmed to genuinely lack usable coordinates rather than merely being unmapped:
- 1 event (lane 01): source is page text about a named trail segment, no coordinate pair exists anywhere in the record.
- 1 event (lane 03): burn-ban status page, same situation.
- 5 events (lane 07): the raw record has `location.latitude`/`location.longitude` *keys* but their *values* are `null` — directly inspected and confirmed, not assumed. These are statewide health advisories with no specific point to plot. Correctly left as text-only per the standing "no invented/geocoded coordinates" rule.

## Remaining work required in Workflow 08

Flagged as follow-on work, not implemented here (out of scope — constraint against modifying connectors/workflow 08 in this task):

1. The buildspec (section 6.4) assigns Workflow 08 responsibility for "map-ready geometry" and "cross-lane deduplication" as first-class outputs. Today, Workflow 08 only passes each lane's raw event object through unchanged — this task's fix works around that at the dashboard-build layer (reading `event.location.*`), which is a reasonable interim measure but not a substitute for Workflow 08 itself publishing a uniform `geometry` field.
2. No lane publishes a literal `geometry` field today. A future Workflow 08 or lane-level change adding one (GeoJSON-shaped, per the shared connector standard) would let the dashboard-build script's `mapEventGeometry()` use it directly instead of falling back to per-lane heuristics.
3. This task's fix only checks `event.location.{latitude,longitude}` — the one shape confirmed present in this real snapshot. Other lanes may expose coordinates under different field names (the geospatial audit found real variation across lanes); each would need its own targeted addition to `mapSourceNativePoint()` once real snapshot data confirms the exact shape, the same evidence-based approach used for lane 05 here.

## Confirmations

- **No coordinates were invented.** Every `Point` geometry written traces directly to a real `latitude`/`longitude` pair present in the real captured Workflow 08 snapshot. Every event without a real, provable coordinate was left `null` and logged as a gap, never guessed, never geocoded, never inferred from a route-section label or place name.
- **No connectors were changed outside scope.** Verified directly via `git diff --stat` against `00_CONNECTORS/*/*.json` and `00_WORKFLOWS/*.json`: the only changes present are from the earlier, separately-authorized schedule-activation task (before this dashboard-foundation task began) — nothing in this task touched any connector or workflow file. This task's changes are confined to `scripts/build-public-package-snapshot.mjs`, `src/lib/route-status/types.ts`, and `tests/route/gpx-pipeline.test.ts`.
- **Full pipeline passes for real**, run clean end to end in this order: `validate-route-source` → `convert-route-gpx-to-geojson` → `build-public-package-snapshot` → `validate-public-package` → `vitest` (37/37 tests pass) → `tsc --noEmit` → `astro build`. All seven steps exit 0.
- **Outstanding item, now resolved**: `public/UnivWA-Issaquah.gpx` (stale, superseded route copy) has been deleted by the project owner directly, with the canonical GPX and built GeoJSON verified present and non-empty immediately before the deletion.
- **Map readiness is unchanged from the geospatial audit's determination** — this task does not claim final map readiness. Per the audit (`00_DOCS/UWISSY_GEospatial_CAPABILITY_AUDIT_v1.0.md`) and matrix (`00_DOCS/UWISSY_GEospatial_CAPABILITY_MATRIX_v1.0.csv`), the route line itself is ready; event geometry remains partial (5 of 12 in this snapshot) and lane-dependent by design, not a defect to be silently closed.
