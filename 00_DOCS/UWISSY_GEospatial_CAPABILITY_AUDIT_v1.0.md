# UW-Issy Geospatial Capability Audit v1.0

**Date:** 2026-08-02
**Scope:** Workflows 01–09, their published output on Hetzner, the canonical GPX, and `00_AS-BUILT` documentation. Read-only audit — no workflow, connector, or activation changes were made as part of this task.
**Final readiness decision:** **PARTIALLY_READY_WITH_TEXT_ONLY_FALLBACKS**

## Important note on a concurrent process

While running this audit, a separate, independently-running Ringer swarm (`~/.ringer/work/btf-uwissy-dashboard-20260802/01-foundation.swarm.json`, still active during this audit) was found writing new files directly into this same repository under `public/data/` and `public/routes/`, including `UnivWA-Issaquah.geojson`, `route-events.geojson`, `dashboard-data.json`, `release-manifest.json`, `system-health.json`, plus new scripts (`scripts/convert-route-gpx-to-geojson.mjs`, `scripts/build-public-package-snapshot.mjs`, `scripts/validate-public-package.mjs`, `scripts/validate-route-source.mjs`, `scripts/lib/gpx.mjs`). This was not produced by this audit or by workflows 01–09. Its content is described below for completeness (it directly bears on route geometry), but it is **not** counted as verified, stable "already implemented" capability in this audit's readiness decision — it's in-progress output from a process outside this audit's visibility, mid-run at the time of writing.

## 1. The canonical route geometry

`data/route/UnivWA-Issaquah.gpx`: a real RideWithGPS export containing one `<trk>` with **1,470 track points** (full-resolution polyline with elevation) plus 42 turn-cue waypoints. This is genuine, high-fidelity route geometry — good enough to draw an accurate route line on a map today.

**No workflow (01–09) ever parses this file's geometry at runtime.** Every connector's `Initialize Run Metadata` node carries `canonical_gpx: 'data/route/UnivWA-Issaquah.gpx'` as a plain provenance string — a path reference for documentation, not something read or converted by any n8n node. Confirmed by direct inspection of the code around every `canonical_gpx` reference in all 7 connectors: it is always a literal string assignment, never a file read.

**Existing conversion (outside the connector layer, from the concurrent swarm above)**: `public/routes/UnivWA-Issaquah.geojson` is a genuine, well-formed `FeatureCollection` with one `LineString` feature carrying all 1,470 coordinate triples (lon/lat/elevation). If this file is accurate and stable once that swarm finishes, it is a legitimate map-ready base layer for the route line itself. This audit did not independently re-verify its coordinate accuracy against the source GPX beyond a spot check of the first several points, which matched.

## 2. Route-section tagging (not geometry)

A consistent ~10-segment naming convention is used across most lanes to tag *which part of the route* an event affects — e.g. `09_east_lake_sammamish_trail_sammamish`, `10_issaquah_approach_terminus`. This is a **label**, not geometry. There is no shared, published lookup file mapping these section IDs to actual coordinates anywhere in `00_CONNECTORS`, `00_DOCS`, or the shared standard.

One exception found: `04_WILDFIRE`'s `Normalize NIFC-01 Events` node defines an internal `ROUTE_VERTICES` constant — 10 lat/lon points, one per section, used only for that lane's own nearest-point distance math. It is:
- **Lane-local** — not defined or reused anywhere else; the other 6 lanes do not reference it.
- **Coarse** — 10 points for the entire route, not the full 1,470-point track.
- **Not published** — it lives inside a Code node's source and is never written to any output artifact. A dashboard cannot reach it.

## 3. Per-event/observation coordinates

Checked every lane's normalize logic directly for real `latitude`/`longitude` fields on individual events or observations (not the route as a whole):

| Lane | Real lat/lon on events/observations? | How route relevance is actually computed |
|---|---|---|
| 01 Route Conditions | No — sources are scraped pages/ArcGIS project lists tied to named locations, not point coordinates | Named-segment text matching |
| 02 Weather | Yes — per weather station/grid point | Point-distance math against route waypoints |
| 03 Air Quality | Yes — per monitor/station | Point-distance math |
| 04 Wildfire | Yes — per incident/perimeter | Point-distance math against the internal `ROUTE_VERTICES` (see above) |
| 05 Flood Conditions | Yes — per gauge | **Hardcoded, pre-researched `distance_km`/`method`/`reason` per source** in `sourceConfigs`, not computed live against any geometry at runtime |
| 06 Trail Infrastructure | Yes — per project/page location | Named-segment matching, some coordinates |
| 07 Government Safety Alerts | Yes — per alert/incident, where the source provides it | Mixed: named-area/zone matching plus some coordinates |

No lane does real polyline-buffer intersection against the full-resolution GPX. Every method in production today is either (a) point-to-coarse-vertex distance, (b) hardcoded pre-researched distance, or (c) text/name matching against segment labels — never live geometric computation against the actual 1,470-point track.

## 4. What workflow 08 actually publishes

Confirmed directly in `Aggregate All Lanes`: each lane's `events` array is passed through to `public/status.json` **verbatim, unmodified** — whatever coordinate fields a lane's own events carry (per the table above) survive into the aggregated feed exactly as-is. Workflow 08 does not add, resolve, strip, or otherwise transform any geometry itself; it is a pure pass-through for whatever the source lane already put in the event object.

**Practical consequence**: a dashboard reading `public/status.json` today *can* place some events on a map, but only by writing its own per-lane logic to find and extract each lane's differently-shaped coordinate fields — there is no single, uniform `event.geometry` or `event.coordinates` key a dashboard can rely on across all 7 lanes. This mirrors the same non-uniform-vocabulary problem already documented for route-impact classification in `00_AS-BUILT/README.md`.

## 5. GeoJSON output — none, natively

Searched all 9 workflow JSON files for any GeoJSON type marker (`"type": "Feature"`, `"LineString"`, `"FeatureCollection"`, `"Point"` as a geometry type). **Zero matches in any workflow.** No connector or workflow 08/09 produces GeoJSON. The two GeoJSON files that exist in `public/` were produced by the separate concurrent process described in the note above, not by any of workflows 01–09.

## Readiness decision and rationale

**PARTIALLY_READY_WITH_TEXT_ONLY_FALLBACKS**

- **The route line itself**: ready, if the existing GPX→GeoJSON conversion (from the concurrent process, not yet independently verified by this audit) is trusted, or trivially re-derivable directly from the canonical GPX's 1,470 real track points either way.
- **Event placement on the map**: not uniformly ready. Real coordinates exist for a meaningful subset of events (weather, air quality, wildfire, flood gauges, some trail/government items), but extracting them requires per-lane logic that doesn't exist yet anywhere in the pipeline, and roughly a third of possible events (most of lane 01, and any event where a source genuinely has no coordinates) will never have real geometry — only a named segment label at best.
- Per the standing instruction: do not invent, geocode, or infer coordinates. Events without a real, source-derived coordinate must render as text-only list items, keyed by their `route_section_id`/location label, not plotted on the map.

## Recommended follow-on work (not performed here — flagged as scoped-out)

1. A single canonical `route_section_id → representative coordinate` lookup, built once from the real GPX (not hardcoded per-lane), published somewhere a dashboard can read it — would resolve every section-tagged-but-coordinate-less event to at least an approximate map position without inventing anything (the coordinate would represent "this named section of the real route," not the event itself).
2. A uniform `geometry` field added to the shared connector envelope standard, so lanes that do have real coordinates expose them the same way, removing the need for per-lane dashboard logic.
3. Independent verification of the concurrent process's `public/routes/UnivWA-Issaquah.geojson` and `public/data/route-events.geojson` once that swarm finishes, before relying on them.

These are connector/workflow-level changes and are explicitly out of scope for this audit per the instruction not to modify workflows 01–08 during this pass.
