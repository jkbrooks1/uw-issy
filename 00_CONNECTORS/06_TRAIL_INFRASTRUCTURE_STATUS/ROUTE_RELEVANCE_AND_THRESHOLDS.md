# ROUTE_RELEVANCE_AND_THRESHOLDS.md

## Purpose

Lane 06 needs stricter relevance logic than a generic closure lane because many candidate sources are broad city or County project feeds. Keyword matching alone is not enough.

## Recommended route sections

Use the same 10-section route model already documented in `01_ROUTE_CONDITIONS`:

1. UW / U-District
2. Burke-Gilman - Seattle
3. Burke-Gilman - north Lake Washington / Kenmore
4. Burke-Gilman / connector - Bothell
5. Sammamish River Trail - Bothell / Woodinville
6. Sammamish River Trail - Redmond
7. Marymoor Park / Marymoor Connector
8. East Lake Sammamish Trail - Redmond
9. East Lake Sammamish Trail - Sammamish
10. Issaquah approach / terminus

## Primary relevance methods by source type

### HTML trail pages

Use:

- exact named-trail match
- exact facility / creek / road match
- human-readable location extraction

Do not use:

- municipality match alone

### ArcGIS project and alert layers

Use:

- bbox prefilter
- buffered route geometry intersection
- exact field-level keyword matching
- facility / crossing match

### Gauge or lake-level sources

Use:

- watershed / shoreline relation only as context

Do not classify a gauge record as a lane-06 route event by itself.

## Thresholds

### Point sources

- `<= 60 m` from the GPX line: treat as direct crossing / facility candidate
- `60 m to 150 m`: require exact facility, street, trail, or creek match
- `> 150 m`: normally reject unless the source explicitly names the trail segment

### Line and polygon sources

- prefilter with route bbox expanded by `250 m`
- final direct-impact test is intersection with a `75 m` buffered route line
- if no direct intersection but feature is within `250 m` and text names the route trail or crossing, classify as `possible_route_impact`

### Text-only notices

Promote to `confirmed_route_impact` only when one of these is true:

- exact named trail match
- exact crossing / bridge / creek / shoreline facility match
- exact route street match on the Issaquah or Sammamish shoreline approaches

Otherwise classify as `possible_route_impact` or `not_route_relevant`.

## Lane-06 named match list

Trail names:

- Burke-Gilman Trail
- Sammamish River Trail
- East Lake Sammamish Trail
- Marymoor Connector Trail

Water / crossing facility names:

- George Davis Creek
- Park Hill Creek
- East Lake Sammamish Parkway
- East Lake Sammamish Shore Lane NE
- Louis Thompson Rd NE
- NE Inglewood Hill Rd
- SE 51st St and ELSP
- NE 124th St bridge / crossing context

## Deterministic location-resolution rule for text-only alerts

1. Extract exact trail names first.
2. Extract exact street, creek, shoreline lane, bridge, or crossing names second.
3. Map those names to route sections using the canonical GPX and lane-01 section model.
4. If only a municipality is present, keep as `possible_route_impact` until a stronger location token appears.

## Special route decisions

### Ballard Locks

- Closest route approach measured in this session: about `4.35 mi`
- Rule: reject as route-relevance for this GPX

### Montlake Bridge

- Closest route approach measured in this session: about `0.21 mi`
- Rule: do not treat as on-route, because the canonical GPX does not traverse the bridge

### Lake Sammamish gage

- Closest route approach measured in this session: about `1.38 mi`
- Rule: context only; belongs to lane 05 ownership unless paired with an explicit closure or infrastructure notice

## Confidence levels

- `high`: geometry hit plus exact facility or trail match
- `medium`: exact facility or trail match without geometry
- `low`: municipality-only or vague nearby description

Lane 06 should only auto-publish `high` and `medium` events. `Low` should stay diagnostic or manual-review-only.
