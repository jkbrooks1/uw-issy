# UW_ISSY_07_GOVERNMENT_SAFETY_ALERTS_IMPLEMENTATION_RECOMMENDATION_v1

Prepared on Wednesday, July 29, 2026.

## MVP recommendation

Implement only these three sources first:
- `NWS-01`
- `SEA-01`
- `UW-01`

They are all:
- official
- public
- live-tested in this cycle
- machine-readable enough for unattended operation

## Secondary additions after MVP stabilization

- `SEAFD-01`
- `SEAPD-01`
- `DOH-02`
- `ST-01`
- `KCMETRO-01`

Implementation note:
- `SEAFD-01` and `SEAPD-01` should be treated as Seattle-only corroborating
  incident context
- `ST-01` and `KCMETRO-01` should be rendered in a separate alternate-transport
  section, not mixed into the public hazard card

## Deferred follow-up sources

- `WSDOT-01`: add only after credentialed testing
- `REDM-01`: retest from the eventual production host or a browser-capable runtime
- `BOTH-01`, `WOOD-01`, `ISS-01`: add only after capturing one real alert item each
- `FEMA-01`: only if the project later wants formal IPAWS onboarding

## Freshness and failure rules

- `NWS-01`, `SEA-01`, `UW-01`, `ST-01`, `KCMETRO-01`: stale after `15` minutes
- `SEAFD-01`, `SEAPD-01`: stale after `30` minutes for acute incidents
- `DOH-02`: stale after `6` hours

Failure behavior:
- preserve the last known good normalized output
- mark the lane `degraded` instead of implying route safety
- show which source failed

## Route-relevance rules

- CAP/NWS: point query first, then county/state backstop, then geometry or geocode matching
- Seattle/UW/Fire/Police: route-landmark and street-name extraction, not generic citywide keywording
- WSDOT: only via named crossing/detour watchlist plus structured location match
- Transit: alternate-transport only

## Deduplication rule

Use source-native ids first:
- CAP identifier
- WordPress post id
- CivicPlus alert id or unique link
- GTFS entity id

Then cluster across sources by:
- normalized headline
- normalized event type
- normalized place tokens
- effective-time bucket

Priority order:
1. `NWS-01`
2. `UW-01` for campus-origin incidents
3. `SEA-01` for Seattle OEM incidents
4. municipal/local corroboration
5. Seattle police/fire contextual feeds

## Recommended next implementation step

Build a research-only prototype normalizer for:
- `NWS-01`
- `SEA-01`
- `UW-01`

Validate route relevance and deduplication against known July 2026 examples before
adding secondary feeds.
