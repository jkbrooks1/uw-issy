# OVERLAP_NOTES.md — 03_AIR_QUALITY

This document states only the Lane 03 position for the later cross-workstream
deduplication matrix.

## Hazards this workstream should own or partially own

### Smoke advisory

- Lane 03 position: `partial-own`
- Why: the route-relevant consequence is degraded air quality / AQI / health
  category, which belongs here
- Adjacent lanes: `04_WILDFIRE`, `07_GOVERNMENT_SAFETY_ALERTS`
- Canonical-source priority:
  1. `ECO-02` for route-intersecting forecast polygon
  2. `WASMOKE-01` for official smoke-outlook explanation
  3. `ECO-01` for current measured consequence
- Dedup rule: Lane 04 owns the fire cause/perimeter/source event; Lane 03 owns
  the resulting air-quality state on the route

### Air-quality alert

- Lane 03 position: `own`
- Why: this is directly the lane’s subject matter
- Adjacent lanes: `07_GOVERNMENT_SAFETY_ALERTS`
- Canonical-source priority:
  1. `NWS-AQ-01` when a formal Air Quality Alert exists
  2. `PSCAA` or `Ecology` if a local agency posts the official alert text
  3. `ECO-01` only as observation context, not as the formal alert source
- Dedup rule: if both NWS and a local air agency publish the same air-quality
  alert, keep one alert record keyed to the formal alert shell and enrich it
  with monitor values rather than publishing two separate hazards

### Public-health advisory

- Lane 03 position: `partial-own`
- Why: only when the advisory is specifically about air quality / smoke exposure
- Adjacent lanes: `07_GOVERNMENT_SAFETY_ALERTS`
- Canonical-source priority:
  1. formal agency alert/advisory source if one exists
  2. then public-health guidance page as supporting text only
- Dedup rule: use the advisory issuer as the canonical event source; do not
  duplicate separate “guidance page” hazards

### Burn-ban status driven by air quality

- Lane 03 position: `partial-own`
- Why: the work order explicitly asked for burn-ban or air-quality-driven
  outdoor-activity advisories where an official agency issues them
- Adjacent lanes: none primary; `04_WILDFIRE` may mention fire-safety burn bans
- Canonical-source priority:
  1. `PSCAA-02` for air-quality burn bans in this corridor
- Dedup rule: Lane 03 covers air-quality burn bans; wildfire fire-safety burn
  bans belong elsewhere

## Hazards in the later matrix that should not belong here

- `Red Flag Warning` — fire weather / ignition risk, not current AQI
- `Flash Flood Warning` — not an air-quality topic
- `Flood Watch` — not an air-quality topic
- `trail closure due to flooding` — route-conditions / flood lane, not AQ
- `trail closure due to construction` — route-conditions lane
- `trail closure due to fire` — wildfire / route-conditions lane
- `hazardous-material spill` — government safety / route-conditions, not normal AQ lane
- `police activity` — government safety lane
- `evacuation` — wildfire / government safety lane
- `excessive heat warning` — weather lane
- `severe thunderstorm warning` — weather lane
- `high wind warning` — weather lane
- `boil-water notice` — water/public health, not air
- `dam incident` — flood / government safety
- `bridge closure` — route-conditions lane
- `waterway infrastructure closure` — route-conditions / flood / infrastructure

## Key deduplication principle from Lane 03

Separate:

- the cause (`fire`, `weather pattern`, `wood-smoke inversion`)
- from the consequence on the route (`AQI`, `health category`, `air-quality
  alert`)

Lane 03 should own the consequence layer, not every possible upstream cause.
