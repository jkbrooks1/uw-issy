# ROUTE_RELEVANCE_AND_THRESHOLDS.md — 05_FLOOD_CONDITIONS

## Route sections used in this workstream

1. **UW / south Burke-Gilman** — urban drainage and citywide flood alerts only.
2. **North Lake Washington / Kenmore / Bothell** — low-lying trail and road-crossing context; no verified direct hydrologic gauge in the final runtime set.
3. **Sammamish River Trail / Woodinville / Bothell** — river-adjacent trail, but no direct verified live Sammamish River gauge in the runtime set.
4. **Marymoor / Bear Creek lowlands** — low-lying park and creek context; direct Bear Creek IV probe unusable on Wednesday, July 29, 2026.
5. **East Lake Sammamish Trail shoreline** — Lake Sammamish level context plus closure supplements.
6. **Lake Sammamish State Park / Issaquah Creek terminus** — strongest and most directly monitored flood-exposure zone on the route.

## Required route-relevance methods by source type

### Gauge and forecast points

Use:

- point-to-route distance;
- upstream/downstream hydrologic relationship;
- named water-body match;
- segment assignment, not route-wide assignment.

Recommended rule:

- direct route gauges inside **3 km** of the GPX may affect the mapped nearby segment directly;
- upstream gauges outside 3 km may still be relevant if an official local system explicitly uses them for lead time;
- gauges outside **5 km** with no official operational linkage should not drive alerts for this route.

### Alert polygons

Use:

- alert geometry when present;
- CAP geocodes / affected zones / county codes;
- bounding-box prefilter, then real geometry intersection;
- point-query fallback at representative route points only when polygon handling is not available.

### Closure sources

Use:

- geometry buffer around the GPX;
- named facility / roadway match;
- flood-related text classification (`flood`, `standing water`, `washout`, `drainage failure`, `water over roadway`);
- never keyword-only matching without geometry or street/segment validation.

## Gauge relevance table

| Source | Water body | Coordinates | Distance to route | Upstream / downstream | Meaning for the route |
| --- | --- | --- | ---: | --- | --- |
| USGS-01 / NWPS-01 | Issaquah Creek near mouth | 47.5525, -122.0467 | 173 m | direct downstream route-end gauge | strongest observed + forecast route-end flood signal |
| USGS-02 / NWPS-02 | Issaquah Creek near Hobart | 47.4573, -122.0051 | 10934 m | upstream | lead-time signal used by Issaquah local flood phases |
| USGS-03 | Lake Sammamish near Redmond | 47.5765, -122.1112 | 2218 m | main pool level | shoreline context only; not a stand-alone closure trigger |
| USGS-04 | North Fork Issaquah Creek | 47.5428, -122.0348 | 1243 m | tributary | discovery lead only; no usable IV data |
| USGS-05 | Bear Creek | 47.6751, -122.1072 | 1318 m | tributary to Sammamish system | good geography, unusable tested feed |
| USGS-06 | Coal Creek | 47.5603, -122.1706 | 7010 m | peripheral drainage | too far and unusable tested feed |

## Official thresholds

### Issaquah local flood phases from `ISS-01`

- Phase I: `6.5 ft` and rising at Hobart.
- Phase II: `7.5 ft` and rising at Hobart.
- Phase III: `8.5 ft` regardless of trend.
- Phase IV: `9.0 ft` regardless of trend.

Recommended mapping:

- Phase I -> `watch`
- Phase II -> `observed_flooding` and at least `probable_route_impact` for the terminus zone
- Phase III / IV -> `warning` plus likely severe route-end impact

### NWPS official categories from `NWPS-01`

Flow-based categories:

- Action: `1340 cfs`
- Minor: `2000 cfs`
- Moderate: `2300 cfs`
- Major: `2800 cfs`

Recommended route mapping:

- below action -> `no_known_route_impact` unless a closure source says otherwise
- action to below minor -> `elevated_water`
- minor to below moderate -> `probable_route_impact`
- moderate to below major -> `warning`
- major and above -> `warning` with severe route-end emphasis

## Non-official derived threshold

### Lake Sammamish

No official flood stage for route operations was found.

Recommended derived handling:

- store the absolute lake level and 24-hour trend;
- optionally label `elevated_water` when the level is materially above recent normal conditions;
- never escalate beyond `elevated_water` from lake level alone;
- require corroboration from closures, NWS alerts, or Issaquah Creek products before claiming route impact.

## Deterministic location-resolution guidance for text-only alerts

For text-only or weakly structured pages:

1. Match official city names and facility names.
2. Match named route assets: Burke-Gilman Trail, Sammamish River Trail, Marymoor Park, East Lake Sammamish Trail, Lake Sammamish State Park.
3. Match route-end roads: East Lake Sammamish Parkway NE, East Lake Sammamish Trail, East Lake Sammamish Lane NE.
4. Prefer official linked gauges or official referenced parks over generic citywide wording.
5. Downgrade confidence when a page only says “in the city” or “during heavy rains” without a route landmark.

## Confidence limitations

- The middle third of the route still lacks a strong direct river gauge in the final tested runtime set.
- Closure sources can confirm impact, but they do not provide hydrologic lead time.
- Lake Sammamish level is real and valuable, but the trail-impact threshold is not officially defined.
