# UW_ISSY_03_AIR_QUALITY_FINAL_RESEARCH_REPORT_v1

Prepared: July 29, 2026

## Scope

This cycle researched, tested, classified, and documented official air-quality
sources for the UW -> Burke-Gilman Trail -> Sammamish River Trail -> Marymoor
Park -> East Lake Sammamish Trail -> Issaquah route. No production workflow was
built.

## Best verified source landscape

### Primary

- `ECO-01` — WA Ecology hourly-monitor ArcGIS REST
- `ECO-02` — WA Ecology smoke-forecast ArcGIS REST

### Strong secondary

- `AIRNOW-02` — AirNow file products
- `WASMOKE-01` — Washington Smoke Blog RSS
- `NWS-AQ-01` — NWS Air Quality Alert API
- `PSCAA-01` — session-backed PSCAA network-map backend
- `PSCAA-02` — PSCAA burn-ban status page

### Rejected for connector use

- King County and Seattle smoke-guidance pages as live connectors

## Most important route-specific result

This route should not use a single air-quality point. Four route-near official
monitor locations were live inside the corridor bbox on July 29, 2026:

- Seattle-NE 127th
- Lake Forest Park-Town Center
- Bellevue-SE 12th
- Issaquah-Lake Sammamish

Measured AQI values at 12:00 PDT that day were `9`, `16`, `17`, and `22`
respectively. All were `Good`, but they were not identical. That was enough to
confirm that a one-point design would over-compress real variation.

## AirNow finding

AirNow was live and well-documented, but the public route data mostly collapsed
into the reporting area `Seattle-Bellevue-Kent Valley`. That is useful as a
fallback and cross-check, but it is too coarse to be the only route source.

## PSCAA finding

PSCAA’s technical tools are real and useful, but the best station-detail JSON
endpoint requires session bootstrap. That makes PSCAA a strong secondary layer,
not the cleanest first implementation.

## Wildfire-smoke outlook finding

The best official structured outlook source is Ecology’s smoke-forecast polygon
service. The best official narrative outlook feed is Washington Smoke Blog RSS.
They complement each other rather than duplicating each other.

## Burn-ban finding

The best official burn-ban status source found for this corridor was PSCAA’s
Air Quality Burn Ban Status page. It was live and clearly parseable as a status
page on July 29, 2026, but no documented feed/API equivalent was confirmed in
this cycle.

## Clear answer to the owner’s “one point or many?” question

Yes, Seattle-area and Issaquah-area conditions along this route can differ
enough to justify more than one monitoring point.

- minimum viable design: 3 corridor points
- preferred production design: 4 official monitor points

## Final research conclusion

The cleanest production strategy is Washington-first:

1. current official monitor observations from Ecology
2. official smoke forecast polygons from Ecology
3. official burn-ban status from PSCAA
4. AirNow / Washington Smoke Blog / NWS as enrichment and fallback

That provides better route fidelity than a national reporting-area-only design
and keeps the lane anchored on official Washington sources.
