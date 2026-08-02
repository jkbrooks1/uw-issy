# OVERLAP_NOTES.md — 04_WILDFIRE

This file records the wildfire workstream's position only. It does not attempt to finalize the full cross-workstream ownership matrix.

## Hazards this workstream should own

### Red Flag Warning

- Position: `04_WILDFIRE` should own
- Adjacent workstreams: `02_WEATHER`, `07_GOVERNMENT_SAFETY_ALERTS`
- Canonical source priority: `NWS-01`
- Deduplication rule: one route-wide advisory per active NWS alert ID / event / effective window

### Fire Weather Watch

- Position: `04_WILDFIRE` should own
- Adjacent workstreams: `02_WEATHER`, `07_GOVERNMENT_SAFETY_ALERTS`
- Canonical source priority: `NWS-01`
- Deduplication rule: one route-wide advisory per active NWS alert ID / event / effective window

### Burn ban / outdoor burning restriction

- Position: `04_WILDFIRE` should own
- Adjacent workstreams: none materially primary
- Canonical source priority:
  1. county / local fire authority for legal local restriction
  2. DNR for DNR-land context
- Deduplication rule: do not collapse all restrictions into one generic state; keep separate records by authority and jurisdiction

## Hazards this workstream should partially own

### Smoke advisory

- Position: shared, not sole-owned here
- Adjacent workstreams: `03_AIR_QUALITY`, `02_WEATHER`, `07_GOVERNMENT_SAFETY_ALERTS`
- Canonical source priority:
  1. public health / AQ alert source for public advisory ownership
  2. `NWS-01` when the alert itself is official and route-relevant
  3. `NOAA-01` for geometry / wildfire context only
- Deduplication rule: `03_AIR_QUALITY` should own the public air-quality warning card; `04_WILDFIRE` should enrich with wildfire-source context and smoke geometry

### Evacuation

- Position: shared
- Adjacent workstreams: `07_GOVERNMENT_SAFETY_ALERTS`
- Canonical source priority:
  1. official local emergency management / county alert system
  2. NWS or CAP public warning only when it clearly carries the evacuation message
- Deduplication rule: one evacuation record per official issuing authority and area; wildfire workstream should not create inferred evacuation events from fire proximity

### Fire-related trail closure

- Position: shared
- Adjacent workstreams: `01_ROUTE_CONDITIONS`, `06_TRAIL_INFRASTRUCTURE_STATUS`
- Canonical source priority:
  1. route-owner closure page or normalized closure feed
  2. wildfire incident / perimeter source for context only
- Deduplication rule: if a closure and a wildfire refer to the same event, the closure source owns closure status and the wildfire source owns incident context

### Air-quality alert

- Position: shared, but `03_AIR_QUALITY` should be primary
- Adjacent workstreams: `03_AIR_QUALITY`, `07_GOVERNMENT_SAFETY_ALERTS`
- Canonical source priority:
  1. air-quality / health authority
  2. `NWS-01` when the official alert appears there
  3. wildfire connector uses it only to explain wildfire cause or smoke context
- Deduplication rule: wildfire connector should not publish a duplicate public AQ alert card if `03_AIR_QUALITY` already owns it

## Hazards that do not belong here

- Flash Flood Warning: belongs to flood / weather workstreams, not wildfire
- Flood Watch: belongs to flood / weather workstreams
- Trail closure due to flooding: belongs to route conditions / flood infrastructure ownership
- Trail closure due to construction: belongs to route conditions / infrastructure ownership
- Hazardous-material spill: belongs elsewhere; not wildfire
- Police activity: not wildfire
- Excessive Heat Warning: weather ownership
- Severe Thunderstorm Warning: weather ownership
- High Wind Warning: weather ownership
- Boil-water notice: public health / utility ownership
- Dam incident: flood / infrastructure ownership
- Bridge closure: route conditions / infrastructure ownership
- Waterway infrastructure closure: not wildfire
- Public-health advisory: shared only when clearly wildfire-smoke-caused; otherwise not wildfire
