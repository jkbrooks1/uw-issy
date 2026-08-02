# ROUTE_WEATHER_POINT_MAPPING.md — Lane 02_WEATHER

Prepared 2026-07-29. Route-point design for weather monitoring along the UW–Issaquah
corridor, derived directly from the corrected canonical GPX
(`data/route/UnivWA-Issaquah.gpx`) parsed in this research cycle.

## GPX facts used (this cycle, directly re-derived, not carried over from Lane 01)

- Track points: 1,470
- Total route distance: **33.83 mi** (haversine sum over all `<trkpt>` pairs)
- Bounding box: lat 47.55207–47.75889, lon -122.3057 to -122.04414
- Route start (mile 0.0): 47.65051, -122.30462 (UW campus, Rainier Vista area)
- Route end (mile 33.83): 47.55207, -122.04429 (Issaquah)

These figures match the distance and bounding box independently confirmed in
`00_CONNECTORS/01_ROUTE_CONDITIONS/SOURCE_REGISTRY.json` (33.83 mi; same bbox),
which corroborates that both lanes are working from the same corrected `v2` GPX.

## Method

The full track was walked mile-by-mile (haversine cumulative distance) to identify
where the route crosses named-trail-segment and jurisdiction boundaries described in
Lane 01's `ROUTE_SECTION_SOURCE_MAPPING.md` (UW, Burke-Gilman/Seattle, Burke-Gilman/
Kenmore–Lake Forest Park, Bothell, Sammamish River Trail/Woodinville, Sammamish River
Trail/Redmond, Marymoor Park, East Lake Sammamish Trail/Sammamish, Issaquah
approach). One weather point was placed per distinct segment/jurisdiction identified,
using an actual on-route GPX coordinate at or near the segment's midpoint — not an
estimated city-center coordinate — so every point is directly evidence-based.

Eight points were judged the minimum useful set: fewer would blur real segment
differences (the route crosses at least three distinct NWS forecast zones and two
fire-weather zones); more would create redundant queries against forecast grid cells
that often do not materially differ from a neighboring point already covered (NWS
gridpoints are ~2.5 km resolution, and several adjacent mile-markers on this route
fall inside the same or an immediately adjacent grid cell).

## Recommended weather monitoring points

| Point ID | Name | Lat | Lon | Route mile (approx.) | Route section(s) represented |
|---|---|---|---|---|---|
| WP1 | UW / Seattle (Burke-Gilman start) | 47.65051 | -122.30462 | 0.0 | UW campus; Burke-Gilman Trail, Seattle city segment |
| WP2 | North Lake Washington / Kenmore–Lake Forest Park | 47.70489 | -122.27521 | 6.0 | Burke-Gilman Trail, King County segment north of NE 145th St through Lake Forest Park/Kenmore |
| WP3 | Bothell (Burke-Gilman/Sammamish River Trail junction) | 47.74617 | -122.28401 | 9.0 | Burke-Gilman Trail terminus / Sammamish River Trail head, Bothell Landing/Blyth Park area |
| WP4 | Woodinville | 47.75031 | -122.21119 | 13.0 | Sammamish River Trail through Woodinville |
| WP5 | Redmond (Sammamish River Trail, Marymoor approach) | 47.72964 | -122.14268 | 18.0 | Sammamish River Trail, Redmond segment, approaching Marymoor Park |
| WP6 | Marymoor Park / East Lake Sammamish Trail head | 47.66129 | -122.11027 | 24.0 | Marymoor Park; Marymoor Connector Trail; East Lake Sammamish Trail head |
| WP7 | Sammamish (East Lake Sammamish Trail) | 47.61894 | -122.06796 | 28.0 | East Lake Sammamish Trail, City of Sammamish segment |
| WP8 | Issaquah approach/terminus | 47.55207 | -122.04429 | 33.83 | East Lake Sammamish Trail terminus; Issaquah approach streets |

## Per-point detail

### WP1 — UW / Seattle
- **Rationale:** Route origin; urban/marine-influenced microclimate distinct from the inland points further east; UW campus is a high-traffic segment where riders decide whether to start.
- **Nearest forecast grid:** NWS office `SEW`, gridpoint `126,70` (`https://api.weather.gov/gridpoints/SEW/126,70`)
- **Forecast zone:** `WAZ315` ("City of Seattle") — **Verification status: VERIFIED**
- **County zone:** `WAC033` (King)
- **Fire weather zone:** `WAZ654`
- **Nearest observation station (any type):** `SEAW1` (NWS Seattle Forecast Office rooftop sensor, Sand Point), 3.46 mi away — temperature/wind only, no METAR-grade fields (see gap note below).
- **Nearest full-featured (METAR/ASOS) station:** `KBFI` Boeing Field, 7.27 mi away.
- **Fallback station:** `KRNT` Renton Municipal Airport, 11.53 mi.
- **Verification status (point as a whole):** VERIFIED — `/points/47.6505,-122.3046` returned HTTP 200 and a complete metadata set in this research cycle (see `API_AND_FEED_TEST_RESULTS.md`).

### WP2 — North Lake Washington / Kenmore–Lake Forest Park
- **Rationale:** Represents the King County-managed Burke-Gilman segment along the north shore of Lake Washington; this is the segment Lane 01 identifies as owned by King County Parks with Kenmore/Lake Forest Park as adjacent jurisdictions.
- **Nearest forecast grid:** `SEW` `127,72`
- **Forecast zone:** `WAZ315` ("City of Seattle") — note: the NWS zone polygon extends to cover this point even though it is geographically at Kenmore, not Seattle; this is a real NWS zone-boundary characteristic, not a routing error (zones are coarse public-forecast polygons, not city boundaries).
- **County zone:** `WAC033`
- **Fire weather zone:** `WAZ657`
- **Nearest observation station:** `SEAW1`, 1.76 mi (closest of all 8 points to this sensor, but still temperature/wind-only).
- **Nearest full-featured station:** `KBFI`, 11.17 mi.
- **Fallback station:** `KPAE` Everett/Snohomish County, 15.10 mi.
- **Verification status:** VERIFIED.

### WP3 — Bothell
- **Rationale:** Marks the Burke-Gilman-to-Sammamish-River-Trail handoff point (Bothell Landing/Blyth Park), a known localized fog/cold-air-pooling area in the Sammamish River valley lowland.
- **Nearest forecast grid:** `SEW` `127,74`
- **Forecast zone:** `WAZ313` ("Shoreline / Lynnwood / South Everett Area") — a coarse zone polygon that reaches south to include Bothell; documented as returned, not reinterpreted.
- **County zone:** `WAC033`
- **Fire weather zone:** `WAZ657`
- **Nearest observation station:** `SEAW1`, 4.48 mi.
- **Nearest full-featured station:** `KPAE`, 12.24 mi.
- **Fallback station:** `KBFI`, 13.94 mi.
- **Verification status:** VERIFIED.

### WP4 — Woodinville
- **Rationale:** Represents the Sammamish River Trail's Woodinville segment; inland valley location with different frost/fog risk than the Seattle lakefront points.
- **Nearest forecast grid:** `SEW` `130,74`
- **Forecast zone:** `WAZ314` ("Eastside")
- **County zone:** `WAC033`
- **Fire weather zone:** `WAZ657`
- **Nearest observation station:** `SEAW1`, 4.86 mi.
- **Nearest full-featured station:** `KPAE`, 12.41 mi.
- **Fallback station:** `KBFI`, 14.95 mi.
- **Verification status:** VERIFIED.

### WP5 — Redmond (Sammamish River Trail, Marymoor approach)
- **Rationale:** Distinct point from Woodinville and from Marymoor itself; covers the Redmond-owned river-trail segment identified in Lane 01 (segment 6).
- **Nearest forecast grid:** `SEW` `132,73`
- **Forecast zone:** `WAZ314`
- **County zone:** `WAC033`
- **Fire weather zone:** `WAZ657`
- **Nearest observation station:** `SEAW1`, 5.90 mi.
- **Nearest full-featured station:** `KBFI`, 15.03 mi (`KRNT` 16.55 mi close second).
- **Verification status:** VERIFIED.

### WP6 — Marymoor Park / East Lake Sammamish Trail head
- **Rationale:** Marymoor Park is an explicit named waypoint in the work order and a major regional park where the route's character changes from river-valley trail to lake-edge trail; also the corrected-GPX segment (Marymoor Connector Trail) that replaced the prior route's inaccurate jog.
- **Nearest forecast grid:** `SEW` `132,69`
- **Forecast zone:** `WAZ314`
- **County zone:** `WAC033`
- **Fire weather zone:** `WAZ657`
- **Nearest observation station:** `SEAW1`, 6.76 mi.
- **Nearest full-featured station:** `KBFI`, 12.44 mi (`KRNT` 12.47 mi, effectively tied).
- **Verification status:** VERIFIED.

### WP7 — Sammamish (East Lake Sammamish Trail)
- **Rationale:** Covers the City of Sammamish segment of the East Lake Sammamish Trail, including the area of the confirmed active KC-03 trail closure documented in Lane 01 (Louis Thompson Rd NE to NE Inglewood Hill Rd).
- **Nearest forecast grid:** `SEW` `133,67`
- **Forecast zone:** `WAZ314`
- **County zone:** `WAC033`
- **Fire weather zone:** `WAZ657`
- **Nearest observation station:** `SEAW1`, 9.68 mi.
- **Nearest full-featured station:** `KRNT`, 10.95 mi.
- **Verification status:** VERIFIED.

### WP8 — Issaquah approach/terminus
- **Rationale:** Route terminus; foothill location at the base of the Issaquah Alps/Cascade front, where orographic lift typically produces measurably higher precipitation and different fog behavior than the Seattle lowlands — the most distinct microclimate on the route.
- **Nearest forecast grid:** `SEW` `133,64`
- **Forecast zone:** `WAZ314`
- **County zone:** `WAC033`
- **Fire weather zone:** `WAZ657`
- **Nearest observation station (any type):** `E6690` ("Maple Valley", a CWOP/citizen-weather-station-class sensor), 7.73 mi — unofficial-grade, see gap note.
- **Nearest full-featured station:** `KRNT` Renton Municipal Airport, 8.86 mi.
- **Verification status:** VERIFIED.

## Forecast vs. observation point sets — determination

**Forecast, hourly forecast, raw gridpoint data, and alerts should be queried per all
8 WPx points/gridpoints** — each resolves to its own NWS gridpoint and this is a
zero-cost, no-rate-limit-documented public API, so there is no reason to consolidate.

**Observations should use a separate, smaller, station-ID-keyed set**, not a
per-point derivation, because full-featured (METAR/ASOS) stations are sparse relative
to the 8 forecast points: only three exist within a useful radius of the entire
33.83-mile route (`KBFI` Boeing Field, `KRNT` Renton Municipal Airport, `KPAE`
Everett/Snohomish County), plus the NWS Seattle office's own limited-field rooftop
sensor (`SEAW1`, temperature/wind only). Recommended observation station set:

| Station ID | Name | Type | Nearest WPx points it best serves |
|---|---|---|---|
| `SEAW1` | NWS Seattle WFO (Sand Point) | Limited (temp, wind; no METAR/visibility/rawMessage) | WP1, WP2, WP3 |
| `KBFI` | Boeing Field / King County Intl | Full ASOS/METAR | WP1, WP2, WP5, WP6 |
| `KRNT` | Renton Municipal Airport | Full ASOS/METAR | WP6, WP7, WP8 |
| `KPAE` | Everett / Snohomish County | Full ASOS/METAR | WP3, WP4 |

No full-featured station is within 10 miles of WP4 (Woodinville), WP5 (Redmond), or
WP7/WP8 (Sammamish/Issaquah) — see `SOURCE_GAPS.md` for the full discussion of this
observation-density gap and why it does not block an MVP (forecast/hourly/grid data
and alerts are fully covered; only point-in-time observation confirmation is thin
in the eastern two-thirds of the route).

## Verification status summary

All 8 points are **VERIFIED**: each was independently resolved via a direct,
successful `GET https://api.weather.gov/points/{lat},{lon}` call in this research
cycle (see `API_AND_FEED_TEST_RESULTS.md` for exact HTTP status, timestamps, and
returned gridpoint/zone/station data). No point relies on an inferred or
un-tested coordinate.
