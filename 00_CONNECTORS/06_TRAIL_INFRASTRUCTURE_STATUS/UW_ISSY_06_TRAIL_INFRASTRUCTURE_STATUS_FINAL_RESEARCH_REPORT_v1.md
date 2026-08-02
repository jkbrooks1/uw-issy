# RESEARCH_FINDINGS.md

Route used for this workstream: University of Washington -> Burke-Gilman Trail -> Sammamish River Trail -> Marymoor Park -> East Lake Sammamish Trail -> Issaquah.

Canonical route facts reused from existing project deliverables:

- distance: 33.83 miles
- bounding box: lat `47.55207` to `47.75889`, lon `-122.3057` to `-122.04414`
- canonical GPX exists and was readable during this session

## Mise en place verified

Before research started, the following were confirmed:

- project root existed at `/Users/jkbrookspersonal/LocalSiteBuildFiles/BTF_UW-Issy_Route_Monitor`
- canonical GPX existed and was readable at `data/route/UnivWA-Issaquah.gpx`
- connector folder existed and contained only the placeholder `README.md`
- `CLAUDE.md`, `AGENTS.md`, `00_PROJECT_RULES.md`, and `00_PROJECT_STATUS.md` were read
- `00_CONNECTORS/01_ROUTE_CONDITIONS/` and `00_CONNECTORS/02_WEATHER/` were reviewed as formatting and rigor templates

## What I searched

I evaluated official sources in six buckets:

1. King County and city trail pages already carrying route-specific closures.
2. City and County GIS layers that could expose drainage, culvert, bridge, or crossing work with geometry.
3. Seattle-side trail and transportation project pages for the UW/Burke-Gilman start of the route.
4. Lake-level and water-management sources for Lake Sammamish and the Lake Washington Ship Canal.
5. Bridge-opening and bridge-status sources from WSDOT and King County.
6. Cross-lane overlap candidates already used or considered in `01_ROUTE_CONDITIONS`.

## What the live tests showed

### 1. The archetypal lane-06 event is already live on this route

The strongest confirmed route-impact event is the East Lake Sammamish Trail closure tied to culvert replacement and fish-passage work:

- King County's East Lake Sammamish Trail page returned live HTML with an active closure notice.
- The notice says the trail section between Louis Thompson Rd NE and NE Inglewood Hill Rd is closed starting June 1, 2026 and lasting through the rest of 2026 so crews can replace aging culverts.
- City of Sammamish project pages directly corroborate the same George Davis Creek project and add structure details: new box culverts under the trail and Shore Lane, plus a short-span bridge under East Lake Sammamish Parkway.

This is exactly the kind of signal lane 06 should own.

### 2. The best machine-readable city source for this lane is Issaquah's current-year public works GIS

The strongest structured source was:

- `PWProjectsCurrentYearConstructionPublic` on the City of Issaquah ArcGIS server

Direct tests confirmed:

- live unauthenticated ArcGIS REST service
- polygon geometry
- stable project fields including `ProjectName`, `ProjectDescription`, `ProjectLocation`, `CurrentYearStatus`
- multiple route-relevant drainage projects, including:
  - `East Lake Sammamish Pkwy Drainage Improvement Project`
  - project description explicitly naming two fish-passable culverts under `SE 51st St` and `East Lake Sammamish Trail`
  - additional localized drainage/flooding projects in Issaquah, including `SE 5th Street and Issaquah Bridge`

This source is the best lane-06 example of a city-run, machine-readable infrastructure feed with both geometry and water-infrastructure semantics.

### 3. Redmond's alerts feed is real, but too general to be lane-06 primary

The City of Redmond `Traffic/Alerts` FeatureServer is live and structured, but the current records are:

- a Bel-Red buffered bike lanes project
- a pavement management project on 154th Ave NE

That makes it useful as a secondary filtered input for future bridge, creek, shoreline, or drainage work, but not as a lane-06 primary by itself.

### 4. King County's bridge GIS is useful as facility reference, not as an operational status feed

`KingCo_Bridges` is a real ArcGIS REST service with point geometry for King County bridges, including assets close to the route:

- one queried bridge point (`NE 124th St Bridge`) fell about 19 meters from the GPX
- the service also exposes a weight-restricted subset

But the layer is an asset/inventory view, not a current closure or operational-status feed. It is therefore useful for route relevance and facility matching, not for direct public status publishing.

### 5. King County's `nonKCRoadAlerts` Sammamish layers are real but operationally empty

The `SammamishRoadAlerts_point` and `SammamishRoadAlerts_line` layers are live, but the only returned records are 2014 test entries:

- `AlertTitle: Test`
- `AlertDescription: This is only a test` / `Thisd is only as test`

That is strong evidence against using this as a production lane-06 source right now.

### 6. USGS lake-level data are real and current, but belong in lane 05

USGS site `12122000` for Lake Sammamish returned a current real-time value on Wednesday, July 29, 2026:

- variable: lake surface elevation above NGVD29
- value: `25.90`
- timestamp: `2026-07-29T11:15:00-07:00`

This is authoritative and machine-readable. It is also exactly the sort of raw hydrologic data that should remain owned by `05_FLOOD_CONDITIONS`, not lane 06. Lane 06 should only consume a derived impact if an official closure or infrastructure notice says lake or stream conditions are affecting the route.

### 7. USACE Lake Washington Ship Canal / Locks sources are not lane-06 MVP material for this GPX

Two things were true at once:

- official USACE pages clearly exist for Chittenden Locks and Lake Washington Ship Canal operations
- direct local requests from this environment returned `403 Access Denied` from `AkamaiGHost`

That matters operationally. Even before the relevance question, the source is not cleanly reachable from this local environment. The route relevance question is also weak:

- Ballard Locks are about `4.35` miles from the GPX at closest approach
- the canonical route does not use the Locks, Ballard Bridge, Fremont Bridge, or University Bridge
- Montlake Bridge is closer, about `0.21` miles from the GPX, but the route does not traverse it

So USACE lock operations and Lake Washington Ship Canal water-control notices are context for the broader region, not a primary route-status feed for this exact GPX.

### 8. WSDOT drawbridge data are not justified for this route

WSDOT's movable bridge page and bridge-opening API documentation were reachable, but they do not change the route decision:

- the route does not traverse a state-operated movable bridge
- the closest state-operated example is Montlake Bridge, near but not on the GPX
- the bridge-opening API is not presented as a simple unauthenticated production feed from the home page

For this route, local drawbridge operations are a reject, not an MVP input.

## Answers to the explicit questions

### 1. Is a dedicated sixth connector justified?

Yes, but only in a narrowed form.

If lane 06 means "all trail infrastructure," it duplicates lane 01 badly. If lane 06 means "waterway and crossing infrastructure impacts on the route," it becomes justified.

### 2. Does it duplicate `01_ROUTE_CONDITIONS` or `05_FLOOD_CONDITIONS`?

It will duplicate both unless scoped tightly.

- It duplicates `01_ROUTE_CONDITIONS` if it ingests every construction or closure notice.
- It duplicates `05_FLOOD_CONDITIONS` if it owns raw lake levels, river stages, or flood gauges.

### 3. What unique data belongs here?

Unique lane-06 data:

- culvert replacement and fish-passage projects that close or split the trail
- drainage projects that affect trail continuity or shoreline access
- bridge and crossing impacts on the actual GPX
- water-adjacent trail closures where the cause is structural water infrastructure
- facility-specific project pages for crossings, culverts, shoreline stabilization, spillways, or creek restoration where route access is directly affected

### 4. What data should remain in the other workstreams?

Remain in `01_ROUTE_CONDITIONS`:

- generic construction and maintenance
- general trail detours and route closures without water or crossing specificity
- citywide traffic alerts that are not bridge, drainage, shoreline, or culvert related

Remain in `05_FLOOD_CONDITIONS`:

- lake and river gauges
- water-surface elevation monitoring
- hydrologic thresholds and overtopping logic
- flood watches, flood warnings, flood stage interpretation

### 5. What should the user-facing label be?

Recommended label: `WATERWAY_AND_CROSSING_STATUS`

Why:

- `TRAIL_INFRASTRUCTURE_STATUS` is too broad and drifts into lane 01
- `WATERWAY_STATUS` sounds like hydrology or boating conditions and drifts into lane 05
- `WATER_INFRASTRUCTURE_STATUS` is close, but it underplays crossings and bridges
- `RIVER_AND_LAKE_TRAIL_STATUS` sounds geographic rather than operational
- `WATERWAY_AND_CROSSING_STATUS` tells the rider what kinds of impacts belong here

### 6. Should this workstream be implemented as a specialized connector or as a filtered view of existing route-closure sources?

Hybrid.

- Specialized connector behavior is justified.
- The data model should be lane-specific.
- The acquisition layer should largely be a filtered view of already-approved route-closure sources, plus a small number of specialized infrastructure sources.

That means:

- use King County trail pages as lane-06 inputs, but only publish items with water/crossing infrastructure semantics
- add Issaquah's GIS and Sammamish's George Davis pages as direct lane-06 sources
- keep lake-level and flood sources outside lane 06

### 7. What official sources provide enough data to support it?

MVP-capable for lane 06:

- King County Burke-Gilman Trail page
- King County Sammamish River Trail page
- King County East Lake Sammamish Trail page
- City of Sammamish George Davis Creek project-start update page
- City of Issaquah `PWProjectsCurrentYearConstructionPublic` ArcGIS service

Useful secondary inputs:

- City of Sammamish George Davis project page
- City of Redmond `Traffic/Alerts` FeatureServer, filtered heavily
- King County `KingCo_Bridges` ArcGIS layer as facility reference only

Explicit rejects or non-owners:

- USGS Lake Sammamish gage for lane 06 ownership
- USACE Chittenden Locks / Lake Washington Ship Canal pages for this GPX
- WSDOT movable bridge/opening sources for this GPX
- King County `SammamishRoadAlerts` test layers

## Recommended scope statement

Operational scope for lane 06:

- route-impacting culvert, drainage, fish-passage, shoreline, bridge, and crossing infrastructure status
- official closures or advisories on water-adjacent trail segments when the cause is that infrastructure
- no generic construction
- no raw hydrologic monitoring

## Most important surprise

The clearest lane-06 signal was not a USACE or lock source. It was a local trail-closure chain:

- King County trail closure page
- City of Sammamish project update
- City of Issaquah structured drainage project GIS

That pushes the lane away from canal operations and toward trail-adjacent water infrastructure.
