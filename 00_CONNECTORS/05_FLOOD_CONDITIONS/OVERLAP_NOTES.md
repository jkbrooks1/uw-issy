# OVERLAP_NOTES.md — 05_FLOOD_CONDITIONS

## Workstream ownership position

| Hazard | 05 position | Adjacent workstreams likely to touch it | Canonical-source priority / dedup rule |
| --- | --- | --- | --- |
| Flood Watch | Own | 02_WEATHER, 07_GOVERNMENT_SAFETY_ALERTS | `NWS-01` is canonical. Do not duplicate under 07 if 05 already publishes it. |
| Flood Warning | Own | 02_WEATHER, 07_GOVERNMENT_SAFETY_ALERTS | `NWS-01` or `NWPS-01` for official category; 05 owns the hydrologic interpretation. |
| Flash Flood Warning | Own | 02_WEATHER, 07_GOVERNMENT_SAFETY_ALERTS | `NWS-01` is canonical. 07 may surface general emergency context, but 05 owns route flood semantics. |
| Flood Advisory | Own | 02_WEATHER, 07_GOVERNMENT_SAFETY_ALERTS | `NWS-01` canonical. |
| Trail closure due to flooding | Shared | 01_ROUTE_CONDITIONS | 01 owns closure confirmation; 05 owns the flood cause classification. Publish one closure event with shared provenance. |
| Road closure due to flooding | Shared | 01_ROUTE_CONDITIONS, 07_GOVERNMENT_SAFETY_ALERTS | Use the closure source for closure truth and 05 for flood-cause truth. |
| Dam incident / water-control issue | Partial | 06_TRAIL_INFRASTRUCTURE_STATUS, 07_GOVERNMENT_SAFETY_ALERTS | 05 should only own it when it changes flood risk on the route. Otherwise 07 or 06 should lead. |
| Waterway infrastructure closure | Partial | 06_TRAIL_INFRASTRUCTURE_STATUS, 01_ROUTE_CONDITIONS | 05 only if the closure is explicitly flood-driven. |
| Evacuation | Not owned | 07_GOVERNMENT_SAFETY_ALERTS | 05 can reference evacuations as context but should not own them. |
| Smoke advisory | Not owned | 03_AIR_QUALITY, 04_WILDFIRE | Not a flood hazard. |
| Red Flag Warning | Not owned | 04_WILDFIRE | Not a flood hazard. |
| Trail closure due to construction | Not owned | 01_ROUTE_CONDITIONS, 06_TRAIL_INFRASTRUCTURE_STATUS | Flood workstream should not claim it unless flooding is explicitly the cause. |
| Trail closure due to fire | Not owned | 04_WILDFIRE, 01_ROUTE_CONDITIONS | Not a flood hazard. |
| Hazardous-material spill | Not owned | 07_GOVERNMENT_SAFETY_ALERTS | Only mention if it is inside a flood warning context, not as primary ownership. |
| Police activity | Not owned | 07_GOVERNMENT_SAFETY_ALERTS | Not a flood hazard. |
| Excessive heat warning | Not owned | 02_WEATHER | Not a flood hazard. |
| Severe thunderstorm warning | Not owned by default | 02_WEATHER, 07_GOVERNMENT_SAFETY_ALERTS | Only flood workstream concern is downstream flooding caused by storm rainfall, not the thunderstorm product itself. |
| High wind warning | Not owned | 02_WEATHER | Not a flood hazard. |
| Air-quality alert | Not owned | 03_AIR_QUALITY | Not a flood hazard. |
| Boil-water notice | Not owned | 07_GOVERNMENT_SAFETY_ALERTS | Public-health / utility hazard, not route flooding. |
| Bridge closure | Shared only when flood-caused | 01_ROUTE_CONDITIONS, 06_TRAIL_INFRASTRUCTURE_STATUS | Closure owner should be 01; 05 adds flood causation if supported. |
| Public-health advisory | Not owned | 07_GOVERNMENT_SAFETY_ALERTS | Not a flood hazard unless explicitly a flood contamination notice. |

## Deduplication rule I recommend

- Let `05_FLOOD_CONDITIONS` own hydrologic hazard labels.
- Let `01_ROUTE_CONDITIONS` own closure truth.
- When both workstreams detect the same real-world event, merge into a single normalized event with:
  - closure state from the closure source;
  - flood cause from the hydrologic source;
  - one rider-facing card, not two.
