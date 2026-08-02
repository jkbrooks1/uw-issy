# RESEARCH_FINDINGS.md — 03_AIR_QUALITY

## What I searched

I started from the work order’s required source list and tested the strongest
official candidates directly:

- EPA AirNow API documentation and public file products
- Washington State Department of Ecology current-monitor and smoke-forecast
  systems
- Puget Sound Clean Air Agency monitoring tools, sensor-map docs, and burn-ban
  status
- Washington Smoke Blog feed
- NWS Air Quality Alert feed
- King County and Seattle public-health guidance pages

I also reused this project’s corrected route facts and the weather lane’s
existing corridor point model (`WP1`-`WP8`) so the air-quality design would fit
the same operational route segmentation rather than inventing a different one.

## Main findings

### 1. Ecology is the strongest official machine-readable source for this lane

The Washington Department of Ecology ArcGIS hourly-monitor service is the best
current official source found for this corridor. It is genuinely structured,
unauthenticated, and route-relevant:

- live metadata and live query responses succeeded
- latest-hour route query returned 4 official route-near stations on
  July 29, 2026
- the payload included overall AQI plus pollutant-specific PM2.5 / ozone /
  PM10 / NO2 fields when present
- point geometry was present, which makes route-segment assignment
  deterministic rather than keyword-based

This is materially better than relying on a citywide webpage or on a coarse
national reporting area.

### 2. The route should not be treated as a single air-quality point

Today’s tested route-near official-monitor values were all in the `Good`
category, but they were not identical:

- Seattle-NE 127th: AQI 9 at 12:00 PDT on July 29, 2026
- Lake Forest Park-Town Center: AQI 16
- Bellevue-SE 12th: AQI 17
- Issaquah-Lake Sammamish: AQI 22

That 13-point spread is still within one EPA category, so it is not a strong
same-day health split by itself. But it does show real spatial variation across
the corridor even on a relatively clean day.

More importantly, the official source landscape itself supports multiple points:

- Ecology exposes 4 route-near official monitors inside the corridor bbox
- Ecology’s smoke-forecast polygon is route-intersectable
- PSCAA explicitly explains that local variation can produce red circles next to
  green circles on its sensor map
- Washington Smoke Blog guidance says one portion of a forecast area can be
  `Unhealthy for Sensitive Groups` while another remains `Good`

Conclusion: a one-point design would erase real route differences too often to
be the preferred production design.

### 3. Minimum viable and preferred point designs are different

The best practical split is:

- minimum viable: 3 air-quality points
  - north/west route segment
  - eastside mid-corridor
  - Issaquah / south terminus
- preferred production: 4 official monitor points
  - Seattle-NE 127th
  - Lake Forest Park-Town Center
  - Bellevue-SE 12th
  - Issaquah-Lake Sammamish

This is the clearest answer to the work order’s “one point or more than one?”
question: more than one, with 4 preferred if the connector is meant to inform
actual ride decisions.

### 4. AirNow is useful, but too coarse to be the only route source

The public AirNow file feeds were live and well-documented. They are a good
fallback. But the corridor mostly collapsed into one reporting area during the
live test:

- `Seattle-Bellevue-Kent Valley` was the only live route-area reporting row in
  `reportingarea.dat`
- `cityzipcodes.csv` showed some southeast ZIPs mapped to `Cascade foothills of
  King County`, but that reporting area did not have current rows in the live
  file test

That means AirNow is valuable for national normalization and fallback, but not
for precise route segmentation by itself.

### 5. PSCAA has real data, but the cleanest endpoints are session-backed

This was the most important “looks simple until tested” result of the cycle.

PSCAA’s public pages point to useful technical tools, and the network map really
does expose JSON:

- `GetStations` returned station IDs
- `Geometries` returned AQI polygons
- `Aqi?stationId=...` returned rich station detail

But `Aqi` only worked after first loading the network-map page and receiving an
ASP.NET session cookie. A direct stateless request returned:

- `{"success":false,"message":"Session was null, refresh the page."}`

That makes PSCAA a good secondary source, not the cleanest MVP connector.

### 6. The strongest official outlook source is split across two Washington sources

For smoke outlook / forecast use cases:

- `ECO-02` is the best structured official polygon forecast
- `WASMOKE-01` is the best official prose/RSS smoke outlook feed

They should not be treated as duplicates:

- the ArcGIS polygon gives deterministic route intersection
- the blog/RSS gives human-meaningful explanation, smoke attribution, and
  context about what is driving the forecast

### 7. Burn-ban data exists, but not as a clean feed

PSCAA’s burn-ban status page was live and clearly usable as a status source,
with `No Ban` blocks present on July 29, 2026. I did not find a documented JSON
or RSS equivalent in this cycle.

So burn-ban coverage is available, but webpage-backed rather than a clean feed.

### 8. Guidance pages are not connectors

King County and Seattle both publish useful smoke-health guidance. Those pages
are good references for rider-facing copy or static health text, but they are
not current monitoring sources. They should not be treated as production
connectors.

## What surprised me

1. The state source was materially stronger than the local agency source for
   unattended automation. I expected PSCAA to be the easiest primary source for
   this route because the route is entirely inside PSCAA jurisdiction. In
   practice, Ecology’s ArcGIS services were easier to automate cleanly.
2. AirNow’s public file products were easier to use than AirNow’s branded web
   services, but they were less route-specific than expected.
3. The route-near monitor network is better than the reporting-area map. There
   are enough official monitors to justify a 4-point preferred design.
4. PM10 support is structurally present in the strongest current source, but the
   route-near stations tested on July 29, 2026 had null PM10 values. That is a
   real data-availability nuance, not a missing field.

## Rejected or downgraded ideas

- Single-city / single-point design: rejected. It would flatten route
  differences too aggressively.
- Guidance pages as connectors: rejected. They do not provide live monitoring.
- Raw PurpleAir or other community-sensor data as a primary source: rejected by
  policy and by the agencies’ own caveats. Only officially corrected/QC’d sensor
  layers are candidates, and even those remain secondary.
- AirNow as sole MVP source: rejected. Its live corridor resolution was too
  coarse relative to available state monitor data.

## Final production-shaping conclusion

For this route, the clean production path is to anchor the lane on official
Washington state monitor and forecast data first, then enrich with:

- PSCAA burn-ban status
- Washington Smoke Blog RSS
- optionally AirNow and NWS as backup/alert layers

That gives the route both current station evidence and official smoke outlooks
without forcing the entire corridor into one metro bucket.
