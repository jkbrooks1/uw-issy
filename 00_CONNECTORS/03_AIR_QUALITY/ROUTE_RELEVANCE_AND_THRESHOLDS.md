# ROUTE_RELEVANCE_AND_THRESHOLDS.md — 03_AIR_QUALITY

## Route facts reused

Using the corrected canonical GPX and the already-validated route facts from
`01_ROUTE_CONDITIONS` and `02_WEATHER`:

- total route distance: `33.83 mi`
- bbox: lat `47.55207-47.75889`, lon `-122.3057 to -122.04414`
- weather-lane operational points `WP1-WP8` reused as route anchors

## Explicit answer: should this route use more than one air-quality point?

Yes.

### Why the answer is yes

1. The route spans materially different environments:
   - UW / dense Seattle start
   - north Lake Washington shore
   - Sammamish River valley
   - Eastside inland corridor
   - Issaquah foothill / lake-terminus area
2. Live official monitor data on July 29, 2026 was not identical even on a
   generally clean day:
   - Seattle-NE 127th AQI 9
   - Lake Forest Park-Town Center AQI 16
   - Bellevue-SE 12th AQI 17
   - Issaquah-Lake Sammamish AQI 22
3. Wildfire smoke and inversion events can create sharper local splits than
   those values showed on this particular day.
4. Official source availability is good enough to support a multi-point design.

## Recommended point design

### Minimum viable design — 3 points

Use 3 corridor buckets if the first implementation must stay simple:

| Bucket | Primary source point | Route sections covered |
|---|---|---|
| AQP1 north/west | Seattle-NE 127th | UW -> Burke-Gilman west / north Seattle |
| AQP2 eastside mid-corridor | Bellevue-SE 12th | Bothell / Woodinville / Redmond / Marymoor / north Sammamish proxy |
| AQP3 south terminus | Issaquah-Lake Sammamish | south Sammamish / Issaquah terminus |

This is acceptable for an MVP, but it compresses the Kenmore/Lake Forest Park
segment more than ideal.

### Preferred production design — 4 official monitor points

| Point | Official monitor | Approx. role |
|---|---|---|
| AQP1 | Seattle-NE 127th | Seattle / Burke-Gilman west-north urban-lakeshore segment |
| AQP2 | Lake Forest Park-Town Center | Kenmore / north-shore / Bothell handoff |
| AQP3 | Bellevue-SE 12th | Woodinville / Redmond / Marymoor / Eastside middle |
| AQP4 | Issaquah-Lake Sammamish | south East Lake Sammamish Trail / Issaquah |

This is the preferred design because the route already has 4 live official
monitor points inside the corridor bbox. There is no good reason to flatten
those to 1 point in production.

## Deterministic route-relevance method by source type

### 1. Official monitor points (`ECO-01`, optionally `PSCAA-01`)

Method:

- use point-to-route distance first
- then assign the point to the nearest named route section
- use the nearest official monitor within a practical corridor radius

Recommended rule:

- primary eligibility: monitor point within `8` straight-line miles of the
  route and on the same practical airshed side of Lake Washington / Sammamish
  corridor
- assignment by nearest section centroid or nearest weather-lane point (`WPx`)

For this route, the selected monitor-to-section mapping is:

| Route section | Primary monitor |
|---|---|
| UW / Burke-Gilman west-north Seattle | Seattle-NE 127th |
| Lake Forest Park / Kenmore / Bothell handoff | Lake Forest Park-Town Center |
| Woodinville / Redmond / Marymoor / north Sammamish | Bellevue-SE 12th |
| South Sammamish / Issaquah | Issaquah-Lake Sammamish |

### 2. Forecast polygons (`ECO-02`, `PSCAA-01` geometries)

Method:

- bounding-box prefilter
- then actual polygon-route intersection

Do not use city-name matching alone. The forecast polygon is the authoritative
geographic object.

For this route, the July 29, 2026 Ecology route query intersected the summer
polygon `Seattle-Bellevue-Kent Valley`.

### 3. Reporting areas and ZIP mapping (`AIRNOW-02`)

Method:

- ZIP centroid / reporting-area lookup only as a fallback
- do not treat reporting-area centroid distance as equivalent to a route monitor

Reason:

- AirNow reporting areas are public-facing AQI regions, not precise monitor
  geometry
- on this route, the live AirNow data mostly collapsed to one metro bucket

### 4. Alert/advisory feeds (`NWS-AQ-01`)

Method:

- first match Washington / King County / route-relevant geocodes or area
  description
- if geometry exists, do a real route intersection
- if geometry is null, use county/zone/geocode/text location resolution

Confidence limitation:

- when NWS omits alert geometry and only gives `areaDesc`, route relevance is
  still deterministic at the county/zone level, but less spatially precise than
  a polygon intersection

### 5. Text-only smoke outlook (`WASMOKE-01`)

Method:

- free-text location extraction against an official lookup table:
  - `Seattle`
  - `Bellevue`
  - `Eastside`
  - `King County`
  - `Issaquah`
  - `Cascade foothills`
  - `Seattle-Bellevue-Kent Valley`
- if no route-related location appears, treat as statewide context only

Confidence limitation:

- this is a narrative outlook feed, not a geometry feed; keep it as context or
  attribution, not as the sole route-classification source

## Recommended decision thresholds

Use official EPA AQI categories as the rider-facing thresholds. Do not invent a
new category system.

| AQI | EPA category | Rider-facing implication |
|---|---|---|
| 0-50 | Good | Normal ride conditions from an air-quality perspective |
| 51-100 | Moderate | Sensitive riders should reduce intensity or shorten ride |
| 101-150 | Unhealthy for Sensitive Groups | Sensitive groups should avoid the route; general riders should reconsider hard efforts |
| 151-200 | Unhealthy | Default recommendation: postpone or avoid strenuous outdoor riding |
| 201-300 | Very Unhealthy | Do not ride |
| 301+ | Hazardous | Do not ride; severe condition |

## How to combine current observations, forecast, and advisories

### Current status

- based on `ECO-01` current route-near monitor assignments

### Outlook

- based on `ECO-02` polygon forecast
- optionally enriched by `WASMOKE-01`

### Formal advisory state

- based on `NWS-AQ-01` and/or explicit official air-quality alert text

### Burn-ban state

- based on `PSCAA-02`

## Dominant-pollutant handling

Use pollutant-specific AQI fields when present:

- if `AQI_PM25` is highest, label the segment as PM2.5-driven
- if `AQI_O3` is highest, label the segment as ozone-driven
- if `AQI_PM10` is highest and non-null, label as PM10-driven

If a smoke-related source (`ECO-02` / `WASMOKE-01`) indicates wildfire smoke,
add `wildfire_smoke_related: true` for the affected segment. That is a lane-03
health-consequence flag, not lane-04 fire-incident ownership.

## Staleness thresholds

- current official observations: stale after `90 minutes`
- smoke forecast polygon: stale after `12 hours` in smoke season
- smoke blog RSS: stale after `12 hours` in smoke season
- burn-ban page: stale after `24 hours`
- NWS air-quality alerts: stale after `15 minutes`

## Final recommendation

Ship with more than one point.

- minimum viable: 3 points
- preferred production: 4 official monitor points plus polygon forecast overlay

That is the smallest honest design that respects actual route geography and the
official source landscape.
