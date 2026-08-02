# SOURCE_GAPS.md — Lane 02_WEATHER

## 1. Sparse full-featured observation coverage, eastern two-thirds of route

**Gap:** Only three genuinely full-featured (METAR/ASOS) observation stations
exist within a useful radius of the entire 33.83-mile route: `KBFI` (Boeing
Field), `KRNT` (Renton Municipal Airport), `KPAE` (Everett/Snohomish County).
No such station is within 10 miles of WP4 (Woodinville), WP5 (Redmond), WP7
(Sammamish), or WP8 (Issaquah). The station API-nearest to most of the route's
midpoint, `SEAW1` (NWS Seattle office's own Sand Point sensor), is confirmed
to report only temperature and wind — not visibility, textual conditions, or
a raw METAR string.

**Impact:** Real-time "what is it doing right now" confirmation is materially
weaker for the Woodinville-through-Issaquah half of the route than the
forecast/hourly/grid-data coverage, which is uniformly strong (all 8 points,
all 6 NWS endpoints, HTTP 200). This mostly affects observation-based
freshness/confirmation logic (e.g. "has it actually started raining at
Issaquah yet"), not forecast-based rider planning, which is fully covered.

**Recommended mitigation:** Treat NWS-04 (raw gridpoint forecast data,
including its near-term/first-period values) as the primary "current
conditions" proxy for WP4/WP5/WP7/WP8, clearly labeled as forecast-model-
derived rather than directly observed, and pair it with the nearest available
station (even if 10-16 miles away, e.g. `KRNT` for WP7/WP8) as a lower-
confidence corroborating signal rather than a primary one. Do not claim a
"current conditions, station-confirmed" status for these 4 points without
this caveat.

## 2. WSDOT RWIS route-relevance unresolved (authentication wall)

**Gap:** WSDOT's Traveler Information API (`WeatherInformation`/
`WeatherStations`, source `WSDOT-01`) requires a free-registration
`AccessCode` for every call, including the station list itself. This research
cycle confirmed the API is live and correctly implemented (clean HTTP 401,
not a broken endpoint) but could not determine whether any RWIS station is
materially on or near this specific route.

**Why this matters:** RWIS stations report road-surface/pavement condition,
which no other source in this registry provides at all, and are physically
sited at highway locations this route crosses or runs alongside (SR-522/
Bothell Way through Kenmore, the I-405/SR-522 interchange near Bothell/
Woodinville, and the I-90 corridor near the Issaquah terminus — all
independently confirmed as real route-adjacent WSDOT infrastructure by
Lane 01's WSDOT-01 crossing-zone research).

**Recommended mitigation:** Project owner registers a free WSDOT Traveler
Information API AccessCode at `https://wsdot.wa.gov/traffic/api/`. Once
obtained, a follow-up research pass should re-query the `WeatherStations`
endpoint, geometry-filter station locations against the corrected GPX (line-
buffer, not bounding-box — per the same lesson Lane 01 learned from King
County's KC-06 Cottage Lake false positive), and re-classify WSDOT-01 as MVP,
SECONDARY, or REJECT based on what is actually found. This is explicitly
**not** performed in this cycle because no AccessCode was available and
creating one was judged outside a research-only assignment's authority.

## 3. No source provides road-surface/pavement condition

**Gap:** None of the 8 verified/tested sources in this registry directly
reports pavement condition (wet, icy, snow-covered) as measured at the road
surface. NWS's `iceAccumulation`/`snowfallAmount`/`snowLevel` fields (NWS-04)
are forecast-model outputs, not surface-sensor measurements.

**Impact:** For a cycling-safety use case, "is the trail/road surface
actually icy right now" is a materially different and more actionable signal
than "the forecast model predicts sub-freezing temperatures." This gap can
only be closed by WSDOT RWIS (see Gap 2, itself unresolved) or a future
citizen/volunteer-report mechanism, which is out of scope for this
connector's official-source mandate.

**Recommended mitigation:** Document this explicitly in any published
weather status as a known limitation ("temperature-based frost/ice risk
estimate, not a direct road-surface measurement") rather than implying
surface confirmation that does not exist.

## 4. NWS observation `qualityControl` code table incomplete

**Gap:** Only the `"V"` (verified) quality-control code was directly observed
in live data this cycle, across all 4 tested stations. The full NWS QC code
table (e.g. what `"S"`, `"Z"`, or other codes mean, and which should be
treated as lower-confidence or excluded) was not independently retrieved.

**Impact:** Low for now (all live samples were `"V"`), but a production
fetcher that only ever sees `"V"` during testing could mishandle a
non-`"V"` code in production if it isn't defensively coded.

**Recommended mitigation:** Before production build, retrieve and document
the full NWS observation quality-control code table from NWS's own metadata/
documentation (not fabricated here) and add explicit handling for non-`"V"`
codes (e.g. treat as lower-confidence, still publish but flag).

## 5. Lane overlap: Air Quality Alerts appear in the NWS alert feed

**Not a gap in coverage — a gap in filtering, if unaddressed.** The only live
NWS alert observed during this research cycle (via a statewide test query)
was an Air Quality Alert, which is Lane 03's primary responsibility per the
work order's connector taxonomy, not Lane 02's. If Lane 02's future
implementation ingests `NWS-06` (active alerts) without filtering on `event`
type, it will duplicate Lane 03 content. This is documented here as an
implementation requirement, not left implicit — see
`IMPLEMENTATION_RECOMMENDATION.md` and `WEATHER_THRESHOLD_RECOMMENDATIONS.md`
for the specific event-type allowlist recommended.

Fire Weather Watches (a genuinely NWS-issued alert type, tied to the
`fireWeatherZone` field resolved for all 8 points — `WAZ654`/`WAZ657`) present
a similar overlap risk with Lane 04 (Wildfire) and should be filtered the
same way: NWS-issued, but routed to Lane 04's domain rather than published
twice.

## 6. No live route-relevant alert was available to exercise the alert code path end-to-end

**Gap:** 2026-07-29 was a quiet-weather day for this route — zero active NWS
alerts for WP1's point query, the WAZ314 zone, or WAC033 county. The full
alert JSON schema was confirmed instead via a live statewide query with
different, non-route geography.

**Impact:** Low — the schema is confirmed and identical regardless of which
zone triggered it (this is standard NWS CAP-derived alert structure, not
Seattle-specific). But no route-relevant alert's exact `event`/`severity`/
`instruction` combination has been directly observed for this corridor.

**Recommended mitigation:** No action needed beyond normal production
monitoring; flag for the audit report that this specific code path is
schema-verified but not live-route-exercised as of this research cycle.
