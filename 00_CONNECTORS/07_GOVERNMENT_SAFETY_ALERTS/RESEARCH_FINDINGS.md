# RESEARCH_FINDINGS

## Scope and method

This lane covered authoritative government alert sources that could materially
affect a cyclist traveling the canonical University of Washington ->
Burke-Gilman Trail -> Sammamish River Trail -> Marymoor Park -> East Lake
Sammamish Trail -> Issaquah route.

The assignment was limited to:
- source discovery
- live testing
- route-relevance design
- deduplication planning
- implementation planning

It did not include:
- building an n8n workflow
- deploying anything
- activating any schedule

Route facts were reused from completed lanes rather than re-derived:
- corrected canonical GPX distance: `33.83 mi`
- corrected canonical GPX bbox: lat `47.55207` to `47.75889`, lon `-122.30570` to `-122.04414`
- route monitoring points `WP1`-`WP8` from `00_CONNECTORS/02_WEATHER/ROUTE_WEATHER_POINT_MAPPING.md`

The strongest candidates were tested directly with live HTTP requests from this
environment. A `200` was treated as insufficient unless the returned body
contained either:
- real current data,
- a clearly structured no-alert state, or
- a meaningful blocked/auth-gated response proving the connector was real.

## What worked best

### 1. NWS is the strongest structured backbone

`NWS-01` is the clear MVP anchor for this lane.

Verified on Wednesday, July 29, 2026:
- route-point query at UW returned a valid zero-alert GeoJSON response
- King County zone query returned a valid zero-alert GeoJSON response
- Washington statewide query returned `4` live alerts
- Atom output worked from the same modern API
- per-alert CAP XML retrieval worked from the same alert ids

Why that matters:
- CAP identifier is available for event identity
- SAME and UGC geocodes are available for deterministic filtering
- local no-alert states and off-route active-alert states were both proven in one cycle
- this is the only route-wide public structured CAP-capable source that fully worked today without credentials

### 2. Seattle and UW provide the best local public-safety coverage

`SEA-01` and `UW-01` both returned live, current, public machine-readable data.

AlertSeattle:
- public RSS worked
- public WordPress JSON worked
- recent July 2026 OEM posts were visible

UW Alert:
- public RSS worked
- public WordPress JSON worked
- recent route-origin-relevant examples were visible, including campus emergency response and public-health/public-safety notices

These two sources materially improve the route's weakest area for government
safety alerts: the UW / U-District / Seattle origin.

### 3. Official Seattle fire and police feeds exist, but only as secondary context

The work order explicitly asked for official police/fire public-information feeds
where automatable.

The direct results were:
- `SEAFD-01` Seattle Fire Fireline RSS: official, live, automatable
- `SEAPD-01` Seattle Police Blotter RSS: official, live, automatable

Why they are not MVP:
- both are editorial incident feeds rather than canonical emergency-alert systems
- both are text-only and citywide
- both are noisy enough that route filtering must be strict

They are still worth keeping as secondary surfaces for the Seattle-origin segment.

### 4. Public-health coverage is real, but secondary

The best state-health surface found was `DOH-02`, the public Washington Health
Alert Network table. It is not a feed in the same class as NWS or WordPress JSON,
but it is still:
- official
- public
- structured enough to parse deterministically
- visibly current as of Wednesday, July 29, 2026

`DOH-01` remains a weaker landing/index page and is not as implementation-ready.

### 5. Transit alerts are useful context, not ownership sources

Two official GTFS-realtime sources tested well:
- `ST-01` Sound Transit service alerts
- `KCMETRO-01` King County Metro service alerts

They matter because a rider may need a fallback mode if a route segment becomes
unsafe or inaccessible. They do not own route hazards themselves and should not
be displayed as the same class of signal as NWS, Seattle OEM, or UW Alert.

## What did not hold up

### 1. Most eastside municipal emergency systems are still weak public connectors

The route's eastside municipal emergency picture remains thin.

Observed on Wednesday, July 29, 2026:
- `REDM-01` was promising but operationally unstable from this environment because the embedded Everbridge widget did not return a usable alert payload
- `BOTH-01`, `WOOD-01`, and `ISS-01` all exposed public AlertCenter/RSS mechanisms, but only zero-alert states were visible during testing
- `SAM-01` was informational only and pointed outward rather than exposing a public feed

This means the eastside corridor still lacks a strong public municipal equivalent
to AlertSeattle.

### 2. WSDOT remains important, but credential-gated

`WSDOT-01` is a real and potentially valuable source for:
- SR-522 crossing and detour issues
- I-405/SR-522 interchange disruptions
- I-90 / Issaquah access issues

But on Wednesday, July 29, 2026:
- the no-key request returned a clean `401`
- no live usable alert payload was retrieved in this cycle

So it stays unresolved rather than recommended.

### 3. FEMA all-hazards CAP is not publicly anonymous

This lane explicitly tested the federal CAP question instead of assuming NWS was
the entire answer.

Result:
- `FEMA-01` live IPAWS all-hazards feed is real in documentation, but not public-anonymous
- `FEMA-02` archive is public and queryable, but delayed and therefore not operationally live

So the practical live backbone stays:
- NWS structured CAP/weather-adjacent alerts
- local public official feeds

not anonymous FEMA live CAP.

### 4. WSP is official but not practically reachable here

`WSP-01` was investigated because the work order named Washington State Patrol.
Direct probes hit a Sucuri JavaScript challenge on the home page, missing-persons
page, and amber-alert page. That does not prove WSP lacks useful content. It does
mean it is not an unattended connector from this environment.

## Recommendation headline

The most defensible production posture for this lane is:
- own route-wide civil/emergency normalization with `NWS-01`
- own Seattle-local emergency/public-safety context with `SEA-01`
- own campus-origin emergency/public-safety context with `UW-01`
- supplement Seattle-only incident context with `SEAFD-01` and `SEAPD-01`
- supplement public-health context with `DOH-02`
- supplement alternate-transport context with `ST-01` and `KCMETRO-01`
- leave `WSDOT-01`, `REDM-01`, `BOTH-01`, `WOOD-01`, `ISS-01`, and `FEMA-01` as explicit follow-up items rather than pretending they are production-ready today
