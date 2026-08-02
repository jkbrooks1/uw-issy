# ROUTE_RELEVANCE_AND_THRESHOLDS

Route context reused from prior completed lanes:
- route distance: `33.83 mi`
- bbox: lat `47.55207` to `47.75889`, lon `-122.30570` to `-122.04414`
- route points: `WP1` UW, `WP2` Kenmore/Lake Forest Park, `WP3` Bothell, `WP4` Woodinville, `WP5` Redmond, `WP6` Marymoor / ELST head, `WP7` Sammamish, `WP8` Issaquah

## Core principle

Do not use keyword matching alone. Route relevance should be decided by source
class using the strongest deterministic geometry or geographic signal available.

## Source-class relevance rules

### 1. CAP / NWS structured alerts

Primary method:
- query `NWS-01` by each of the `8` route points
- also query `WAC033` King County zone and `WA` statewide as backstops

Relevance decision order:
1. positive route-point query -> route relevant
2. CAP geometry intersects a `0.5 mi` route buffer -> route relevant
3. if geometry is null, `UGC`, `SAME`, `affectedZones`, and `areaDesc` must resolve to King County or a route municipality
4. if still ambiguous, require a text match to a route municipality, trail, or landmark

Recommended thresholds:
- polygon or line intersection with `0.5 mi` buffered route = `confirmed_route_relevant`
- point event within `0.5 mi` of route line = `confirmed_route_relevant`
- point event `0.5-1.0 mi` from route line = `possible_route_relevant`
- beyond `1.0 mi` with no named route feature match = `not_route_relevant`

### 2. Seattle OEM, UW, Seattle Fire, Seattle Police

These are text-first sources.

Deterministic location-resolution method:
- extract official place names, block references, facility names, and route landmarks
- map those tokens to a maintained gazetteer containing:
  - University of Washington
  - Rainier Vista
  - University Way NE
  - Kane Hall
  - Burke-Gilman Trail
  - NE Pacific St
  - NE 45th St
  - U-District
  - Bothell Landing
  - Marymoor Park
  - East Lake Sammamish Trail

Recommended thresholds:
- explicit match to a route trail/facility/street/landmark = `confirmed_route_relevant`
- Seattle citywide post with no route token = `not_route_relevant`
- post naming a location within `1.0 mi` of the Seattle route segment after geocoding = `possible_route_relevant` pending manual review

Special UW rule:
- anything clearly inside UW Seattle campus core or on the route origin egress streets should be treated as route relevant unless the post itself says the impact is internal-only and not affecting public movement

### 3. Municipal CivicPlus AlertCenter feeds

Applies to:
- `BOTH-01`
- `WOOD-01`
- `ISS-01`

Decision order:
1. city must intersect the route
2. alert text must name a route street, trail, park, or facility, or be citywide emergency language
3. if only generic citywide language is present, keep as `possible_route_relevant` until the detail page confirms the location

Route street and feature tokens to maintain:
- `Burke-Gilman Trail`
- `Sammamish River Trail`
- `Marymoor Park`
- `Marymoor Connector Trail`
- `East Lake Sammamish Trail`
- `East Lake Sammamish Parkway NE`
- `East Lake Sammamish Lane NE`
- `University of Washington`
- `University Way NE`
- `Bothell Landing`

Recommended thresholds:
- exact route-feature or route-street token match = `confirmed_route_relevant`
- citywide emergency without location details = `possible_route_relevant`
- city alert with no route feature and no citywide emergency language = `not_route_relevant`

### 4. WSDOT highway alerts

Do not use WSDOT statewide output naively.

Precompute a fixed crossing and detour watchlist:
- SR-522 / Bothell Way context near the Kenmore-Bothell portion of the corridor
- I-405 / SR-522 interchange context near the Sammamish River Trail
- I-90 / Issaquah access context near the terminus and fallback travel routes

Decision order:
1. named highway segment matches the precomputed crossing/detour watchlist
2. structured start/end roadway location or KML geometry intersects a `1.0 mi` route-access buffer
3. if only free text is available, require named crossing or detour-facility match

Recommended thresholds:
- roadway geometry or structured location intersects `1.0 mi` route-access buffer = `confirmed_route_relevant`
- named highway only with no close crossing/detour relation = `not_route_relevant`

### 5. DOH public-health alerts

Decision order:
1. event type must be relevant to outdoor rider safety or public health
2. location must be statewide in a way that truly affects King County, or directly mention King County / Issaquah / Seattle / UW / Redmond / Bothell / Woodinville / Sammamish
3. provider-only notices with no rider-action implication should stay out of the public hazard card

Recommended thresholds:
- statewide health advisory with clear outdoor exposure or public-water/public-safety implications = `possible_route_relevant`
- King County- or route-municipality-specific advisory = `confirmed_route_relevant`
- provider-only technical bulletin = `not_route_relevant`

### 6. GTFS alternate-transport alerts

These should not be treated as direct route hazards.

Decision order:
1. route id or stop id must belong to a corridor-relevant fallback service
2. display in a separate alternate-transport block

Recommended route-set starter list:
- UW/U-District connections
- eastside Redmond/Bellevue connectors
- Issaquah bus options

## Bounding-box and geometry guidance

Use bbox only as a prefilter.

Recommended workflow:
1. bbox prefilter around the corrected GPX
2. real geometry test against route line or route buffer
3. only then classify `confirmed_route_relevant`

Recommended buffers:
- `0.5 mi` for direct emergency points, polygons, and lines
- `1.0 mi` for WSDOT route-access or detour context

## Confidence limitations

- CivicPlus city feeds were only observed in zero-alert states during this cycle, so live-item field structure is still partly inferred from platform conventions
- Seattle police/fire and UW/Seattle OEM are text-first; they need good location extraction and conservative publication rules
- NWS CAP alerts can carry null geometry, forcing geocode and text interpretation
- DOH alerts often lack route-local geographic precision
