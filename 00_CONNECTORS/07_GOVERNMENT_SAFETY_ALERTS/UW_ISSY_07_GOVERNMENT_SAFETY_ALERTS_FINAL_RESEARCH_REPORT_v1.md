# UW_ISSY_07_GOVERNMENT_SAFETY_ALERTS_FINAL_RESEARCH_REPORT_v1

Prepared on Wednesday, July 29, 2026 for workstream
`07_GOVERNMENT_SAFETY_ALERTS`.

## Executive finding

The strongest official monitoring stack for government/public-safety alerts along
the UW -> Burke-Gilman -> Sammamish River Trail -> Marymoor -> East Lake
Sammamish Trail -> Issaquah corridor is:
- `NWS-01` for route-wide structured CAP-style public alerts
- `SEA-01` for Seattle OEM alerts
- `UW-01` for campus-origin incidents

The best supporting sources are:
- `SEAFD-01`
- `SEAPD-01`
- `DOH-02`
- `ST-01`
- `KCMETRO-01`

The biggest remaining gaps are:
- eastside municipal emergency systems are still weak public connectors
- `WSDOT-01` is credential-gated
- `FEMA-01` is onboarding-gated
- `WSP-01` is blocked by bot protection from this environment

## Sources actually verified live

Verified with usable payloads or meaningful structured states on Wednesday,
July 29, 2026:
- `NWS-01`
- `SEA-01`
- `SEAFD-01`
- `SEAPD-01`
- `UW-01`
- `DOH-01`
- `DOH-02`
- `ST-01`
- `KCMETRO-01`
- `FEMA-02`

Verified only as informational/signup surfaces:
- `KCEM-01`
- `RPIN-LEGACY-01`
- `BEL-01`
- `KIRK-01`
- `SAM-01`
- `WAEMD-01`

Partially verified:
- `REDM-01`
- `BOTH-01`
- `WOOD-01`
- `ISS-01`

Blocked:
- `NOAA-LEGACY-01`
- `WSDOT-01`
- `FEMA-01`
- `WSP-01`

## Most important route-relevance conclusions

- `NWS-01` should drive route-wide emergency/civil-alert discovery through route
  point queries plus county/state backstops.
- `SEA-01` and `UW-01` are the only strong local public-safety sources for the
  Seattle/UW start of the route.
- Eastside city emergency systems are not strong enough yet to replace a broader
  NWS-first strategy.
- Transit alerts belong in a separate alternate-transport block, not in the same
  hazard card as route safety alerts.

## Rejected or downgraded sources

- `NOAA-LEGACY-01`: obsolete and unreachable here
- `KCEM-01`: authoritative but push-only
- `RPIN-LEGACY-01`: legacy naming, not a standalone connector
- `BEL-01`, `KIRK-01`, `SAM-01`: informational or signup-only
- `WAEMD-01`: statewide directory, not a live alert feed
- `FEMA-02`: delayed archive only
- `WSP-01`: official site challenge blocks unattended access from this environment

## High-value unresolved follow-ups

1. `WSDOT-01` because state-highway incidents and detours can matter materially to
   this corridor.
2. `REDM-01` because Redmond is a major route owner and its official alert system
   appears real but unstable from this environment.
3. `BOTH-01`, `WOOD-01`, and `ISS-01` because each has a real public mechanism,
   but none exposed a live alert item during this cycle.
4. `FEMA-01` only if the project wants a non-weather federal CAP layer badly
   enough to justify formal onboarding.

## Bottom line

The route can be monitored responsibly for this lane without waiting for every
gap to close. The defensible production-first move is to implement the verified
MVP stack now and explicitly leave eastside municipal and credential-gated
sources as documented follow-up work.
