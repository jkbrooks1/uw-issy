# SOURCE_GAPS.md

## Closed gaps

- The lane no longer depends on a speculative canal-status concept. The strongest evidence is local trail-adjacent culvert and drainage work.
- The route relevance of Ballard Locks and drawbridge operations was explicitly tested against the GPX and rejected for this route.
- A machine-readable city source was found for the south end of the route: Issaquah's current-year public works GIS.

## Remaining gaps

### 1. Seattle-side lane-06 coverage is weak

- Seattle Parks and SDOT pages were reachable, but neither produced a strong, route-specific, water-infrastructure operational feed.
- What would close it: a direct, stable Seattle GIS or project-status source naming the Burke-Gilman Seattle segment and exposing structured current work or current closure data.

### 2. King County trail pages are official but not structured

- King County's three trail pages are usable, but they require HTML extraction and text diffing.
- What would close it: a documented JSON or RSS alert feed for trail closures by named trail segment.

### 3. `KingCo_Bridges` is inventory, not live status

- It helps with facility matching and crossing inventories, but not with current closure state.
- What would close it: an official current-status or incident layer keyed to those bridge assets.

### 4. King County `SammamishRoadAlerts` is live but not genuinely operational

- The service only returned 2014 test records during this session.
- What would close it: real non-test records appearing in layer 4 or 5, or official confirmation that the service has been retired.

### 5. USACE pages are blocked from this local environment

- `nws.usace.army.mil` returned `403 Access Denied` via Akamai from this session.
- What would close it: direct reachability from the same environment or confirmation that production hosting can reach the site consistently.

### 6. No dedicated Sammamish River water-control status feed was found

- The route runs along the Sammamish River Trail, but no official source surfaced a distinct operations feed for water-control structures that also maps cleanly to rider impacts.
- What would close it: a County or city source publishing status for river-adjacent infrastructure with explicit trail-impact semantics.

### 7. Lane boundary with `05_FLOOD_CONDITIONS` must stay explicit

- USGS lake levels are real and useful, but they pull lane 06 toward hydrology unless the boundary is written down clearly.
- What would close it: formal cross-lane rule stating that raw gauges and stages stay in lane 05, while lane 06 only consumes derived route-impact events.

## Recommended follow-up after this research pass

1. Build lane 06 around the narrowed source set recommended in `IMPLEMENTATION_RECOMMENDATION.md`.
2. Reuse the canonical route buffer logic from lane 01 for geometry filters, but add the stricter lane-06 thresholds in `ROUTE_RELEVANCE_AND_THRESHOLDS.md`.
3. If Seattle-side coverage becomes more important, run a future browser-rendered source-discovery pass focused only on the UW-to-Seattle Burke-Gilman segment.
