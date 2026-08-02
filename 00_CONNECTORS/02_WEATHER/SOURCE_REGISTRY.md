# SOURCE_REGISTRY.md — Lane 02_WEATHER

Human-readable registry. Content agrees field-for-field with `SOURCE_REGISTRY.json`
(registry version 1.0, generated 2026-07-29). If the two ever diverge, the JSON is
authoritative for machine consumption and this file should be regenerated from it.

Route: University of Washington → Burke-Gilman Trail → Sammamish River Trail →
Marymoor Park → East Lake Sammamish Trail → Issaquah (33.83 mi, per the corrected
canonical GPX).

## Summary table

| Source ID | Name | Owning agency | Classification | Recommendation | Verification |
|---|---|---|---|---|---|
| NWS-01 | Points Metadata Resolution | NWS (NOAA) | DIRECT_API | MVP | VERIFIED |
| NWS-02 | 7-Day/12-Hour Text Forecast | NWS (NOAA), SEW office | DIRECT_API | MVP | VERIFIED |
| NWS-03 | Hourly Forecast | NWS (NOAA), SEW office | DIRECT_API | MVP | VERIFIED |
| NWS-04 | Raw Gridpoint Forecast Data | NWS (NOAA), SEW office | DIRECT_API | MVP | VERIFIED |
| NWS-05 | Observation Stations + Latest Observations | NWS (NOAA) / FAA | DIRECT_API | MVP | VERIFIED |
| NWS-06 | Active Alerts (point/zone/county) | NWS (NOAA) | DIRECT_API | MVP | VERIFIED |
| WSDOT-01 | Traveler Information API — WeatherInformation (RWIS) | WSDOT | DIRECT_API | UNRESOLVED | BLOCKED |
| UW-01 | Atmospheric Sciences rooftop/campus station | University of Washington | UNSTRUCTURED_WEBPAGE | REJECT | PARTIALLY_VERIFIED |

## NWS-01 — Points Metadata Resolution

- **URL:** `https://api.weather.gov/points/{latitude},{longitude}`
- **Docs:** `https://www.weather.gov/documentation/services-web-api`
- **Access:** Unauthenticated HTTPS GET; requires a descriptive `User-Agent` header (identification, not authentication)
- **Auth required:** No
- **Terms:** Open data, free for any purpose; undisclosed reasonable rate limit
- **Coverage:** All 8 route points (WP1–WP8), all resolve to NWS office `SEW`
- **Fields:** `gridId`, `gridX`, `gridY`, `cwa`, `forecastOffice`, `forecast`, `forecastHourly`, `forecastGridData`, `observationStations`, `forecastZone`, `county`, `fireWeatherZone`, `timeZone`, `radarStation`
- **Geometry:** Point only
- **Update frequency:** Static per coordinate; NWS notes grid assignments can occasionally change
- **Publication delay:** N/A (metadata lookup)
- **Historical data:** No
- **Pagination:** N/A
- **Rate limits:** Undisclosed numeric threshold; "generous" per NWS docs, ~5s retry on exceedance
- **Freshness threshold:** Cache indefinitely; re-validate periodically (e.g. weekly)
- **Failure detection:** HTTP status != 200 after following the mandatory 301 redirect
- **Last-known-good suitable:** Yes
- **Fallback:** None needed
- **Manual review:** No
- **Recommendation / Verification:** MVP / VERIFIED
- **Notes:** Every one of the 8 route points required following a 301 redirect from the raw 5-decimal GPX coordinate to a canonical 4-decimal coordinate. This is a required implementation detail, not optional. See `API_AND_FEED_TEST_RESULTS.md` §1.

## NWS-02 — 7-Day/12-Hour Text Forecast

- **URL:** `https://api.weather.gov/gridpoints/SEW/{gridX},{gridY}/forecast`
- **Access:** Unauthenticated HTTPS GET, `User-Agent` required
- **Auth required:** No
- **Coverage:** All 8 gridpoints, HTTP 200 confirmed on every one
- **Fields:** `number`, `name`, `startTime`, `endTime`, `isDaytime`, `temperature`, `temperatureUnit`, `temperatureTrend`, `probabilityOfPrecipitation`, `windSpeed` (string), `windDirection`, `icon`, `shortForecast`, `detailedForecast`, plus top-level `updateTime`, `validTimes`, `units`
- **Geometry:** No
- **Update frequency:** `updateTime` observed ~7-8 min before fetch in live test; not benchmarked over a longer window
- **Freshness threshold:** 1 hour, keyed off `updateTime` (not `generatedAt`)
- **Failure detection:** HTTP status != 200; missing periods array
- **Last-known-good suitable:** Yes
- **Fallback:** NWS-03 or NWS-04 for numeric fields
- **Recommendation / Verification:** MVP / VERIFIED

## NWS-03 — Hourly Forecast

- **URL:** `https://api.weather.gov/gridpoints/SEW/{gridX},{gridY}/forecast/hourly`
- **Coverage:** All 8 gridpoints, HTTP 200 confirmed on every one
- **Fields:** Adds `dewpoint`, `relativeHumidity` versus NWS-02; `windSpeed` remains a formatted string
- **Freshness threshold:** 1 hour
- **Fallback:** NWS-04 raw gridpoint data
- **Recommendation / Verification:** MVP / VERIFIED
- **Notes:** `name` and `detailedForecast` were empty strings at hourly granularity in the sampled period.

## NWS-04 — Raw Gridpoint Forecast Data

- **URL:** `https://api.weather.gov/gridpoints/SEW/{gridX},{gridY}`
- **Coverage:** All 8 gridpoints, HTTP 200 confirmed on every one
- **Fields:** `temperature`, `dewpoint`, `maxTemperature`, `minTemperature`, `relativeHumidity`, `apparentTemperature`, `heatIndex`, `windChill`, `windDirection`, `windSpeed` (raw numeric), `windGust`, `skyCover`, `weather` (coded phenomena), `probabilityOfPrecipitation`, `quantitativePrecipitation`, `iceAccumulation`, `snowfallAmount`, `snowLevel`, `ceilingHeight`, `visibility`, `probabilityOfThunder`, `hazards`
- **Geometry:** No
- **Freshness threshold:** 1 hour
- **Failure detection:** HTTP status != 200; missing expected keys
- **Recommendation / Verification:** MVP / VERIFIED
- **Notes:** This is the correct source for a normalized/thresholded connector — numeric, unit-tagged time series, not prose. Each field's values carry their own `validTime` interval (variable duration, e.g. `PT1H` to `P1DT6H` within the same payload); a parser must expand intervals rather than assume fixed-cadence rows.

## NWS-05 — Observation Stations and Latest Observations

- **URLs:** `https://api.weather.gov/gridpoints/SEW/{gridX},{gridY}/stations`; `https://api.weather.gov/stations/{stationId}/observations/latest`
- **Coverage:** Recommended 4-station set — `SEAW1` (limited-field), `KBFI`, `KRNT`, `KPAE` (full ASOS/METAR); see gap note for WP4/WP5/WP7/WP8
- **Fields:** `timestamp`, `textDescription`, `temperature`, `dewpoint`, `windDirection`, `windSpeed`, `windGust`, `barometricPressure`, `seaLevelPressure`, `visibility`, `relativeHumidity`, `windChill`, `heatIndex`, `rawMessage`, `qualityControl`
- **Geometry:** Yes (station point)
- **Update frequency:** Sub-hourly for full ASOS stations (~10-15 min observed spacing)
- **Freshness threshold:** 90 minutes for KBFI/KRNT/KPAE; do not rely on SEAW1 alone for fields it does not populate
- **Failure detection:** HTTP status != 200; null-valued fields with populated `unitCode`/`qualityControl` (confirmed null-field, not missing-key, pattern)
- **Last-known-good suitable:** Yes
- **Manual review:** Recommended for the `qualityControl` code table (not fully retrieved this cycle)
- **Recommendation / Verification:** MVP / VERIFIED
- **Notes:** `SEAW1` (nearest station to WP1/WP2/WP3) is confirmed limited-field: temperature and wind only, no `textDescription`/visibility/`rawMessage`. `KBFI`/`KRNT`/`KPAE` are confirmed full ASOS. No full-featured station exists within 10 miles of WP4, WP5, WP7, or WP8 — a real, documented observation-density gap (see `SOURCE_GAPS.md`).

## NWS-06 — Active Alerts (point, zone, county)

- **URLs:** `https://api.weather.gov/alerts/active?point={lat},{lon}`; `https://api.weather.gov/alerts/active/zone/{zoneId}`
- **Coverage:** All 8 WPx points and zones `WAZ315`/`WAZ313`/`WAZ314`/county `WAC033` tested
- **Fields:** `id`, `areaDesc`, `geocode` (SAME/UGC), `affectedZones`, `sent`, `effective`, `onset`, `expires`, `ends`, `status`, `messageType`, `category`, `severity`, `certainty`, `urgency`, `event`, `headline`, `description`, `instruction`, `response`, `parameters`, `geometry` (nullable)
- **Geometry:** Present in schema but nullable per-alert; the sampled live alert had `geometry: null` and relied on `affectedZones`/`geocode.UGC`
- **Update frequency:** Real-time/event-driven
- **Freshness threshold:** 15 minutes
- **Failure detection:** HTTP status != 200; malformed FeatureCollection
- **Manual review:** Recommended for Watch/Warning-tier events before any auto-published route-impact claim
- **Recommendation / Verification:** MVP / VERIFIED
- **Notes:** Zero active alerts on-route at test time (2026-07-29). Live schema confirmed via a statewide query instead: 4 real Air Quality Alerts, none on-route. **The only live alert type observed was Air Quality Alert — Lane 03's primary responsibility, not Lane 02's** — confirms the overlap risk named in the work order is real; a production filter on NWS `event` type is required. `severity`/`certainty`/`urgency` were all `"Unknown"` on the sampled alert; a connector must treat `"Unknown"` as valid.

## WSDOT-01 — WSDOT Traveler Information API (WeatherInformation / RWIS)

- **URL:** `https://wsdot.wa.gov/Traffic/api/WeatherInformation/WeatherInformationREST.svc/GetCurrentWeatherInformationAsJson`
- **Docs:** `https://wsdot.wa.gov/traffic/api/Documentation/index.html`
- **Access:** HTTPS GET, requires a free-registration `AccessCode` query parameter
- **Auth required:** Yes — free self-service registration at `https://wsdot.wa.gov/traffic/api/`
- **Coverage:** Statewide RWIS network; specific on-route station presence NOT confirmed this cycle (station list itself is auth-gated)
- **Fields:** Not confirmed — blocked by the authentication wall
- **Failure detection:** Confirmed clean HTTP 401 with plain-text error `"The supplied access code was missing or invalid."` — a well-formed auth error, not a broken endpoint
- **Fallback:** NWS-04 partially substitutes for visibility/precipitation/wind, but not pavement/road-temperature fields that only RWIS would provide
- **Manual review:** Yes, once/if a key is obtained
- **Recommendation / Verification:** UNRESOLVED / BLOCKED
- **Notes:** No AccessCode was available or created in this research cycle (registering a new WSDOT developer account was judged outside this research-only assignment's authority; left as a recommended project-owner action). Real potential value: the route crosses/runs alongside SR-522/Bothell Way (Kenmore) and the I-405/SR-522 interchange (Bothell/Woodinville), and the Issaquah terminus is near I-90 — all plausible RWIS locations per Lane 01's independently-confirmed WSDOT-01 crossing-zone findings. No French/CDM WSDOT-equivalent assumptions were reused.

## UW-01 — UW Atmospheric Sciences Rooftop/Campus Weather Station

- **URL:** `https://a.atmos.washington.edu/weather/more.shtml`
- **Docs:** `https://atmos.washington.edu/weather/wx_manual.html`
- **Access:** HTML/JS portal + legacy shell-login command-line tools
- **Auth required:** No for the portal page; yes (department login) for the full data-access system, which is not intended for public use
- **Coverage:** Single point, directly on WP1 (UW campus)
- **Fields:** Documented (not machine-confirmed) — temperature, dewpoint, RH, wind dir/speed/gust, pressure, precipitation, solar radiation, updated every minute
- **Failure detection:** N/A — no stable API response obtained
- **Last-known-good suitable:** No
- **Fallback:** NWS-04/NWS-05 fully substitute for this exact location
- **Recommendation / Verification:** REJECT / PARTIALLY_VERIFIED
- **Notes:** Real, active, on-route station, but no public JSON/REST interface exists or is realistically obtainable for unattended polling. Retained in the registry (not deleted) to prevent future re-discovery of the same dead end, matching the KC-04 REJECT-documentation pattern in Lane 01's registry.
