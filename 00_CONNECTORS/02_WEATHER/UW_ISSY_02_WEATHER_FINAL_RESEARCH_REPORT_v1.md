# UW–Issaquah Connector 02 (Weather) — Final Research Report v1

**Prepared:** 2026-07-29
**Lane:** `02_WEATHER`
**Route:** University of Washington → Burke-Gilman Trail → Sammamish River Trail → Marymoor Park → East Lake Sammamish Trail → Issaquah
**Status:** Research and source-verification phase COMPLETE (first cycle). No production n8n workflow built — research/planning only, per work order.

## 1. Corrected-route analysis

The canonical GPX (`data/route/UnivWA-Issaquah.gpx`) was parsed directly for
this research cycle: 1,470 track points, summed via haversine distance to
**33.83 miles**, bounding box lat 47.55207–47.75889 / lon -122.3057 to
-122.04414, start point (mile 0.0) at 47.65051, -122.30462 (UW campus), end
point (mile 33.83) at 47.55207, -122.04429 (Issaquah). These figures were
computed independently in this cycle, not copied from Lane 01, and they match
Lane 01's previously-reported figures for the same corrected `v2` GPX exactly
— cross-confirming both lanes are working from the same route source.

A mile-by-mile walk of the track was used to place weather-monitoring points
at genuine segment/jurisdiction transitions identified against Lane 01's
10-segment route model (UW, Burke-Gilman/Seattle, Burke-Gilman/Kenmore–Lake
Forest Park, Bothell, Sammamish River Trail/Woodinville, Sammamish River
Trail/Redmond, Marymoor Park, East Lake Sammamish Trail/Sammamish, Issaquah
approach).

## 2. Recommended weather monitoring points

Eight points (minimum useful set, evidence-based, all directly GPX-derived):

| ID | Name | Lat | Lon | Mile | NWS Grid | Forecast Zone |
|---|---|---|---|---|---|---|
| WP1 | UW / Seattle | 47.65051 | -122.30462 | 0.0 | SEW 126,70 | WAZ315 |
| WP2 | North Lake WA / Kenmore–LFP | 47.70489 | -122.27521 | 6.0 | SEW 127,72 | WAZ315 |
| WP3 | Bothell | 47.74617 | -122.28401 | 9.0 | SEW 127,74 | WAZ313 |
| WP4 | Woodinville | 47.75031 | -122.21119 | 13.0 | SEW 130,74 | WAZ314 |
| WP5 | Redmond | 47.72964 | -122.14268 | 18.0 | SEW 132,73 | WAZ314 |
| WP6 | Marymoor Park | 47.66129 | -122.11027 | 24.0 | SEW 132,69 | WAZ314 |
| WP7 | Sammamish | 47.61894 | -122.06796 | 28.0 | SEW 133,67 | WAZ314 |
| WP8 | Issaquah (terminus) | 47.55207 | -122.04429 | 33.83 | SEW 133,64 | WAZ314 |

All 8 points resolve to a single NWS Weather Forecast Office (`SEW`,
Seattle/Tacoma) and a single county (`WAC033`, King County) — a materially
simpler jurisdictional picture for weather than Lane 01 found for route-
conditions data, since NWS coverage is geographic (gridpoints), not
trail-ownership-based. Full per-point rationale, nearest stations, and
verification evidence: `ROUTE_WEATHER_POINT_MAPPING.md`.

**Forecast vs. observation point sets:** forecast/hourly/grid-data/alerts use
all 8 points directly. Observations use a separate, smaller 4-station set
(`SEAW1`, `KBFI`, `KRNT`, `KPAE`) because full-featured stations are far
sparser than forecast gridpoints along this corridor (see §5).

## 3. Source-discovery method

1. Re-derived route facts directly from the corrected GPX (not reused
   uncritically from Lane 01).
2. Tested the National Weather Service API (`api.weather.gov`) exhaustively
   against all 8 points, per the work order's required NWS API analysis
   checklist: points resolution, 7-day forecast, hourly forecast, raw
   gridpoint data, observation stations, latest observations, active alerts
   by point/zone/county.
3. Investigated both Washington-specific candidates named in the work order:
   WSDOT road-weather (RWIS) stations and University of Washington's own
   weather observations.
4. Read-only reviewed the reference CDM project's `02_WEATHER` connector
   architecture (output contract, degraded-source handling, freshness logic,
   atomic-write/last-known-good convention) to reuse proven architectural
   patterns — no French endpoint, credential, department code, or
   Météo-France-specific assumption was copied into this project.

## 4. Verified source landscape

All 6 core NWS API endpoints are **VERIFIED / MVP**, tested live 2026-07-29
against every one of the 8 route points, all returning HTTP 200:

| Source ID | Endpoint | Purpose |
|---|---|---|
| NWS-01 | `/points/{lat},{lon}` | Gridpoint/zone/station metadata resolution |
| NWS-02 | `/gridpoints/{office}/{x},{y}/forecast` | 7-day/12-hour text forecast |
| NWS-03 | `/gridpoints/{office}/{x},{y}/forecast/hourly` | Hourly forecast |
| NWS-04 | `/gridpoints/{office}/{x},{y}` | Raw numeric gridpoint forecast data |
| NWS-05 | `/gridpoints/.../stations`, `/stations/{id}/observations/latest` | Observation stations + latest readings |
| NWS-06 | `/alerts/active` (point/zone/county) | Official active weather alerts |

No authentication is required for any of the six — only a descriptive
`User-Agent` header, used throughout testing:
`(BTF-UW-Issaquah-Weather-Research, john@biketourfrance.net)`.

## 5. NWS API findings

- **Coordinate canonicalization is mandatory to handle** — every `/points`
  call against a raw GPX coordinate returned HTTP 301 to a rounded
  4-decimal coordinate before HTTP 200; a fetcher must follow redirects.
- **`updateTime`, not `generatedAt`, is the correct forecast-freshness
  field** — directly confirmed by comparing both in a live response
  (`updateTime` reflected the actual forecast-product build time;
  `generatedAt` only reflected the HTTP response's own build time).
- **Only the raw gridpoint endpoint (NWS-04) provides true numeric wind
  speed/gust** — the forecast endpoints (NWS-02/03) return wind as a
  formatted string (`"2 mph"`), unsuitable for numeric thresholds without
  fragile parsing.
- **Null-safe parsing is required** — fields such as `temperatureTrend`,
  `heatIndex`, `windChill`, `iceAccumulation` are present as explicit `null`
  values when inapplicable, not omitted, confirmed directly across multiple
  live payloads.
- **`validTime` interval durations vary within the same field** (`PT1H` to
  `P1DT6H` observed in one payload) — a parser must expand ISO-8601
  intervals, not assume fixed hourly rows.
- **No documented numeric rate limit** — NWS's own documentation states a
  "generous" undisclosed limit, ~5-second retry guidance on exceedance, and
  a `User-Agent` header as the sole identification mechanism. No stronger
  guarantee is claimed anywhere in this research.

**Observation-station findings:** only 3 full-featured (METAR/ASOS) stations
exist within a useful radius of the entire route (`KBFI`, `KRNT`, `KPAE`).
The station nominally nearest most of the route (`SEAW1`, the NWS Seattle
office's own Sand Point sensor) is confirmed **limited-field**: temperature
and wind only, no visibility/textDescription/rawMessage. No full-featured
station sits within 10 miles of WP4 (Woodinville), WP5 (Redmond), WP7
(Sammamish), or WP8 (Issaquah) — a real, structural observation-density gap
for the eastern two-thirds of the route, distinct from (and better than)
Lane 01's much sparser closure-data coverage of the same segments.

**Alert findings:** zero active NWS alerts existed for this route at test
time (2026-07-29). The live alert schema was confirmed instead via a
statewide query, which returned 4 real active Air Quality Alerts — none
on-route, but directly demonstrating a genuine overlap risk: an NWS-issued
alert's `event` type (Air Quality Alert) can belong to another lane's
primary responsibility (Lane 03). A production alert filter on `event` type
is required (see Implementation Recommendation report). `geometry` was
`null` on the sampled alert (relies on `affectedZones`/`geocode.UGC`
instead); `severity`/`certainty`/`urgency` were all `"Unknown"` — a
connector must treat `"Unknown"` as valid, not an error.

## 6. Rejected and unresolved sources

- **WSDOT-01 (WSDOT Traveler Information API, RWIS stations) — UNRESOLVED /
  BLOCKED.** Confirmed live and correctly implemented (clean HTTP 401,
  `"The supplied access code was missing or invalid."`) but fully
  access-gated behind free developer registration, including the station
  list itself. Real potential value given the route's proximity to
  SR-522/Bothell Way, the I-405/SR-522 interchange, and I-90 near Issaquah
  (all independently confirmed real WSDOT-adjacent infrastructure in Lane
  01's registry) — but route-relevance cannot be confirmed without a key.
  No AccessCode was created in this cycle (judged outside a research-only
  assignment's authority); recommended as a project-owner follow-up action.
- **UW-01 (UW Atmospheric Sciences rooftop station) — REJECT.** Real,
  active, directly on-route (WP1) station, but its only public interface is
  a JavaScript plot portal and a legacy department-internal shell-command
  system, not a stable public JSON/REST API. NWS-04/NWS-05 already cover
  this exact location with genuine machine-readable data, so this source
  adds no unique MVP value. Retained in the registry (not deleted) to avoid
  future re-discovery of the same dead end.

## 7. Coverage gaps (full detail: `SOURCE_GAPS.md`)

1. Sparse full-featured observation coverage for WP4/WP5/WP7/WP8.
2. WSDOT RWIS route-relevance unresolved pending free registration.
3. No source in this registry provides direct road-surface/pavement
   condition — only WSDOT RWIS (if unlocked) could add this, and only at
   specific station locations.
4. NWS observation `qualityControl` code table incompletely retrieved (only
   `"V"` directly observed in live data).
5. Air Quality Alerts (and, by the same mechanism, Fire Weather Watches)
   appear in the NWS alert feed and require explicit filtering to avoid
   duplicating Lanes 03/04.
6. No live route-relevant alert existed to exercise the alert code path
   end-to-end this cycle (schema confirmed via a non-route statewide query
   instead).

## 8. Project-separation confirmation

No Météo-France endpoints, credentials, department-code mappings, AASQA
mappings, VNF canal assumptions, Vigicrues station mappings, or prefecture
sources were referenced, copied, or reused. The CDM reference project was
inspected read-only for its general connector architecture pattern only;
none of its France-specific data entered this project's sources, thresholds,
or route-point coordinates.
