# IMPLEMENTATION_RECOMMENDATION.md

## Recommended public-facing label

`WATERWAY_AND_CROSSING_STATUS`

## Implementation decision

Implement lane 06 as a hybrid:

- specialized lane-06 normalization and publishing logic
- filtered reuse of official route-closure sources already relevant to the corridor
- a small number of direct lane-06 infrastructure sources

Do not implement it as a broad standalone hydrology connector.

## MVP source set

### 1. KC-01 — King County Burke-Gilman Trail page

- Role: official trail-segment status for future water/crossing issues on the north Lake Washington segment
- Why MVP: official owner source for a route segment that runs beside the ship canal / lake corridor
- Extraction: HTML body diffing and keyword/facility filtering

### 2. KC-02 — King County Sammamish River Trail page

- Role: official trail-segment status for future river-adjacent closures on the Sammamish River Trail
- Why MVP: official owner source for the Bothell/Woodinville/Redmond riverfront segment
- Extraction: HTML body diffing and keyword/facility filtering

### 3. KC-03 — King County East Lake Sammamish Trail page

- Role: official trail-segment status for the most active lane-06 corridor
- Why MVP: directly returned the live culvert-closure event on Wednesday, July 29, 2026
- Extraction: HTML body diffing and keyword/facility filtering

### 4. SAM-02 — City of Sammamish George Davis Creek project-start update

- Role: municipal corroboration and structure-specific detail for the active East Lake Sammamish closure
- Why MVP: names the culverts, the short-span bridge, and the closure of the trail, parkway, and Shore Lane
- Extraction: HTML article parsing, low-frequency poll

### 5. ISS-01 — City of Issaquah current-year public works construction service

- Role: machine-readable source for drainage, culvert, and bridge-adjacent projects near the south end of the route
- Why MVP: live geometry plus route-relevant water-infrastructure project descriptions
- Extraction: ArcGIS REST query with route-corridor filter and water/crossing keyword filter

## Secondary source set

### SAM-01 — City of Sammamish George Davis Creek project page

- Best use: persistent project context page
- Why not MVP: more descriptive than operational

### REDM-01 — City of Redmond Traffic/Alerts FeatureServer

- Best use: secondary geometry-capable alert layer for future Redmond bridge, creek, shoreline, or drainage work
- Why not MVP: current records are generic transportation projects

### KC-04 — King County `KingCo_Bridges`

- Best use: facility-reference layer for route-relevance matching
- Why not MVP: inventory, not current status

## Rejected sources

### KC-05 — King County `SammamishRoadAlerts`

- Reason: only stale 2014 test records were returned

### SEA-01 — Seattle Parks Burke-Gilman Trail Repairs

- Reason: reachable, but content extraction quality was weak and did not provide a dependable operational feed

### SEA-02 — SDOT Ballard Multimodal Corridor / Missing Link page

- Reason: off-route; Ballard corridor is not on the canonical GPX

### USGS-01 — Lake Sammamish lake-level API for lane-06 ownership

- Reason: authoritative, but belongs in lane 05 ownership

### USACE-01 — Chittenden Locks / Lake Washington Ship Canal pages

- Reason: blocked from this local environment and not operationally central to this GPX

### WSDOT-01 — Movable bridges / bridge opening sources

- Reason: the route does not traverse a state-operated movable bridge

## Acquisition cadence

- KC-01 / KC-02 / KC-03: every 6 hours
- SAM-02: every 12 hours
- ISS-01: every 6 hours
- SAM-01: daily
- REDM-01: every 6 hours
- KC-04 facility reference refresh: weekly or static cache until asset inventory changes

## Route filter

Use a two-stage route relevance filter:

1. Cheap prefilter:
   - city / route segment / named trail / facility keyword / bbox
2. Strict relevance:
   - buffered route geometry intersection
   - direct facility match
   - exact named-trail or crossing match

Do not publish based on city match alone.

## Lane-06 keyword and facility list

Positive terms:

- culvert
- drainage
- storm drainage
- fish passage
- salmon habitat
- bridge
- crossing
- shoreline
- creek
- spillway
- boardwalk
- washout

Named facilities and segments:

- Burke-Gilman Trail
- Sammamish River Trail
- East Lake Sammamish Trail
- George Davis Creek
- East Lake Sammamish Parkway
- East Lake Sammamish Shore Lane NE
- SE 51st St and ELSP
- NE 124th St bridge/crossing context

## Freshness, failure, and last-known-good behavior

- freshness threshold:
  - HTML pages: 24 hours
  - ArcGIS services: 12 hours
- if fetch fails:
  - retain last-known-good parsed events
  - mark source stale
  - surface diagnostics, not false "all clear"
- if parsed body disappears unexpectedly:
  - treat as parser failure first
  - require one successful confirming fetch before clearing a previously active event

## Proposed normalized outputs

Lane 06 should publish:

- overall status for the workstream
- route summary text
- route-segment impacts
- individual events
- public-facing source provenance
- diagnostic source health and stale-state fields

See `NORMALIZED_SCHEMA_PROPOSAL.md`.

## High-level n8n design

1. Fetch KC-01, KC-02, KC-03 HTML pages.
2. Fetch SAM-02 and SAM-01 HTML pages.
3. Query ISS-01 ArcGIS service with route-corridor and keyword filters.
4. Optionally query REDM-01 as a secondary branch.
5. Normalize all records into a lane-06 event shape.
6. Apply route relevance logic from `ROUTE_RELEVANCE_AND_THRESHOLDS.md`.
7. Deduplicate by source + facility + time window.
8. Publish atomic JSON output and preserve last-known-good on failure.

Do not build this workflow in this task.

## Risks

- King County trail pages are HTML-only and may require selector maintenance.
- Seattle-side water-infrastructure coverage remains weak.
- Some city GIS sources are excellent structurally but semantically broad, so false positives are possible without strict filtering.
- If lane 06 is labeled or scoped too broadly, it will become a duplicate of lanes 01 and 05.

## Recommended next implementation step

Build the first normalized prototype against:

- KC-03
- SAM-02
- ISS-01

Then add KC-01 and KC-02 using the same parser/diff pattern, and only after that decide whether REDM-01 adds enough incremental value to keep in the production poll set.
