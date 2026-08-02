# RESEARCH_FINDINGS.md — Lane 02_WEATHER

Research and source-verification cycle completed 2026-07-29. This is the first
research cycle for Connector 02 (prior status: "Connector planning has not
started"). No production n8n workflow has been built. This directory contains
research, verification, and planning deliverables only, per the assigned work
order.

## Scope confirmation

Lane 02 covers current conditions, hourly/near-term/7-day forecast, precipitation
(probability, type, amount), temperature and apparent temperature, wind
(sustained/gust/direction), visibility, thunderstorm/lightning risk, snow/
freezing precipitation, frost/ice potential, excessive heat, dense fog, high
wind, severe weather, official meteorological alerts, and observation/forecast
freshness. Lane 02 explicitly excludes air quality (03), wildfire (04), flood
conditions (05), trail infrastructure status (06), and general government/
public-safety alerts (07) — see "Overlap findings" below for the one confirmed
real overlap encountered during live testing.

## Discovery method

1. Re-derived route facts directly from the corrected canonical GPX
   (`data/route/UnivWA-Issaquah.gpx`, 1,470 track points) rather than reusing
   Lane 01's figures uncritically — the independently-computed distance
   (33.83 mi) and bounding box matched Lane 01's figures exactly, cross-
   confirming both lanes are reading the same corrected `v2` GPX.
2. Walked the route mile-by-mile to place 8 weather-monitoring points at
   genuine segment/jurisdiction transitions (see `ROUTE_WEATHER_POINT_MAPPING.md`
   for full rationale and per-point data).
3. Tested the National Weather Service API (`api.weather.gov`) directly and
   exhaustively against all 8 points per the work order's "Required NWS API
   Analysis" checklist — points resolution, 7-day forecast, hourly forecast,
   raw gridpoint data, observation stations, latest observations, and active
   alerts (point/zone/county). All results are real, live HTTP responses
   captured 2026-07-29 (see `API_AND_FEED_TEST_RESULTS.md`).
4. Investigated the two Washington-specific candidates explicitly named in the
   work order: WSDOT road-weather (RWIS) stations, and University of
   Washington's own weather observations.
5. Reviewed (read-only) the reference CDM project's `02_WEATHER` connector
   architecture (output contract, freshness/staleness pattern, degraded-source
   handling, atomic-write and last-known-good conventions) to reuse proven
   architectural patterns without copying any French endpoint, credential,
   department-code, or Météo-France-specific assumption — see
   `IMPLEMENTATION_RECOMMENDATION.md` for exactly which patterns were reused
   and which were replaced with Washington-specific equivalents.

## Verified source landscape

**A single NWS Weather Forecast Office (SEW, Seattle/Tacoma) has authoritative
responsibility for the entire 33.83-mile route.** All 8 tested points resolved
to `gridId: SEW` and `county: WAC033` (King County). This is a materially
simpler jurisdictional picture than Lane 01 found for route-conditions sources
(which span UW, Seattle, King County Parks, and five separate incorporated
cities) — weather data does not fragment by city/trail-ownership boundary the
way closure/construction data does, because NWS's mandate is geographic
(gridpoints), not jurisdictional.

Six NWS API endpoints were tested and are all **VERIFIED / MVP**: points
resolution (NWS-01), 7-day forecast (NWS-02), hourly forecast (NWS-03), raw
gridpoint data (NWS-04), observation stations/latest observations (NWS-05),
and active alerts (NWS-06). Every one of the 8 route points returned HTTP 200
on every endpoint tested. No authentication is required for any of them — only
a descriptive `User-Agent` header, which was used throughout this research
cycle (`(BTF-UW-Issaquah-Weather-Research, john@biketourfrance.net)`).

## NWS API findings (see `API_AND_FEED_TEST_RESULTS.md` for full detail)

- **Coordinate canonicalization is mandatory to handle.** Every `/points`
  request against a raw GPX-derived coordinate returned an HTTP 301 redirect
  to a rounded 4-decimal-place coordinate before the real HTTP 200 response.
  A fetcher that does not follow redirects will silently fail on every call.
- **`updateTime` (forecast-product freshness), not `generatedAt` (response-
  build time), is the correct field for staleness checks** on the forecast
  endpoints — this distinction is easy to get wrong and was directly confirmed
  by comparing both fields in a live response.
- **The raw gridpoint endpoint (NWS-04) is the only source of true numeric,
  unit-tagged wind speed/gust** — the two forecast endpoints (NWS-02/03) only
  provide wind as a formatted string (e.g. `"2 mph"`), which is unsuitable for
  numeric threshold evaluation without fragile string parsing.
- **Null-safe parsing is required, not optional.** Fields like
  `temperatureTrend`, `heatIndex`, `windChill`, and `iceAccumulation` are
  present as explicit JSON keys with `null` values when inapplicable, not
  omitted — confirmed directly across multiple endpoints in live payloads.
- **`validTime` intervals vary in duration within the same field**, from
  `PT1H` to `P1DT6H` in one observed gridpoint-data payload. A parser must
  expand ISO-8601 intervals rather than assume a fixed hourly cadence.
- **No documented numeric rate limit exists.** The official NWS API
  documentation (fetched directly this cycle) states a "generous" undisclosed
  limit, ~5-second retry guidance on exceedance, and recommends the
  `User-Agent` header as the sole identification mechanism (stated to be
  "replaced with an API key in the future" — not yet true as of this
  research). No numeric SLA or guarantee is claimed anywhere in this registry
  beyond what the documentation itself states.

## Observation-station findings

Only three genuinely full-featured (METAR/ASOS) stations exist within a useful
radius of the entire 33.83-mile route: `KBFI` (Boeing Field), `KRNT` (Renton
Municipal Airport), and `KPAE` (Everett/Snohomish County) — all clustered
toward the route's western/southern edges. The station nominally nearest most
of the route's midpoint (`SEAW1`, the NWS Seattle office's own Sand Point
sensor) is confirmed **limited-field**: it reports temperature and wind with a
valid quality-control flag, but not `textDescription`, visibility, or
`rawMessage` — it cannot substitute for a true METAR-grade observation. This
means the eastern two-thirds of the route (Woodinville, Redmond, Sammamish,
Issaquah — WP4, WP5, WP7, WP8) has **no full-featured observation station
within 10 miles**, even though forecast/hourly/grid data and alerts are fully
covered there by NWS-02 through NWS-06. This is documented as a real,
structural gap, not a research shortfall — see `SOURCE_GAPS.md`.

## Alert findings

Zero active NWS alerts existed for any part of this route at test time
(2026-07-29). To confirm the live alert schema and field behavior anyway, a
statewide query (`?area=WA`) was run and returned 4 real, currently-active
alerts — all **Air Quality Alerts** for eastern/central Washington counties,
none intersecting this route. This directly demonstrates the work order's
flagged overlap risk: an NWS-issued alert's `event` type can belong to another
lane's primary responsibility (Air Quality → Lane 03) even though the alert
itself comes from a meteorological source. A production Lane 02 alert filter
must include only genuinely weather-phenomenon `event` values (Winter Storm
Warning, Wind Advisory, Dense Fog Advisory, Severe Thunderstorm Warning,
Excessive Heat Warning, Freeze Warning, etc.) and must not re-publish Air
Quality Alerts or Fire Weather Watches, which belong to Lanes 03/04.

## Rejected and unresolved sources

- **WSDOT-01 (WSDOT Traveler Information API, RWIS stations) — UNRESOLVED.**
  Real, correctly-implemented API confirmed via a clean HTTP 401
  ("The supplied access code was missing or invalid.") — not broken, just
  access-gated behind free developer registration. Could not confirm whether
  any RWIS station sits on or near this specific route without the
  AccessCode; plausible given the route's proximity to SR-522/Bothell Way, the
  I-405/SR-522 interchange, and I-90 near Issaquah (all independently
  confirmed as real route-adjacent WSDOT infrastructure in Lane 01's registry).
  No AccessCode was created in this cycle — recommend the project owner
  register one (see `IMPLEMENTATION_RECOMMENDATION.md`).
- **UW-01 (UW Atmospheric Sciences rooftop station) — REJECT.** Real, active,
  directly on-route (WP1/UW campus) station with genuinely useful sensor
  coverage per the department's own documentation, but its only public
  interface is a JavaScript plot portal and a legacy department-internal
  shell-command system — not a stable, publicly pollable JSON/REST API. NWS-04
  and NWS-05 already cover this exact location with a real machine-readable
  API, so this source adds no unique MVP value. Retained in the registry
  (not deleted) to prevent future re-discovery of the same dead end.

## Coverage gaps (see `SOURCE_GAPS.md` for full detail)

1. Full-featured observation-station coverage is sparse for the eastern
   two-thirds of the route (Woodinville through Issaquah).
2. WSDOT RWIS route-relevance is unresolved pending free developer
   registration.
3. No official source in this registry provides road-surface/pavement
   condition directly — only WSDOT RWIS (if unlocked) would fill this, and
   even then only at specific station locations, not continuously along the
   route.
4. The `qualityControl` code table for NWS observations was not fully
   retrieved this cycle (only the `"V"` code was directly observed in live
   data).

## Project-separation confirmation

No Météo-France endpoints, credentials, department-code mappings, AASQA
mappings, VNF canal assumptions, Vigicrues station mappings, or prefecture
sources were referenced, copied, or reused at any point in this research
cycle. The CDM reference project was inspected read-only for its **general
connector architecture pattern** (output contract shape, degraded-source
handling, freshness/staleness logic, atomic-write convention) — none of its
France-specific data was carried into this project's sources, thresholds, or
route-point coordinates, all of which were derived independently from
Washington/NWS sources and the corrected UW–Issaquah GPX.
