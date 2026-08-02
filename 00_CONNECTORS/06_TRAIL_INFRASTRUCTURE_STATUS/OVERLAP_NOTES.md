# OVERLAP_NOTES.md

Lane 06 position: this workstream should own infrastructure-caused waterway and crossing impacts on the route, not generic hazards and not raw hydrology.

| Hazard | Lane 06 position | Adjacent workstreams likely involved | Canonical-source priority / dedupe rule |
|---|---|---|---|
| Smoke advisory | Does not belong here | 03_AIR_QUALITY, 04_WILDFIRE, 07_GOVERNMENT_SAFETY_ALERTS | Lane 03 owns air-quality source-of-truth |
| Red Flag Warning | Does not belong here | 04_WILDFIRE, 07_GOVERNMENT_SAFETY_ALERTS | Lane 04 or 07 owns |
| Flash Flood Warning | Does not belong here | 05_FLOOD_CONDITIONS, 07_GOVERNMENT_SAFETY_ALERTS | Lane 05 owns hydrologic interpretation |
| Flood Watch | Does not belong here | 05_FLOOD_CONDITIONS, 07_GOVERNMENT_SAFETY_ALERTS | Lane 05 owns |
| Trail closure due to flooding | Partial owner only when closure notice explicitly ties to a water-control or shoreline structure; otherwise no | 01_ROUTE_CONDITIONS, 05_FLOOD_CONDITIONS | Lane 05 owns the flood condition; lane 06 may own the infrastructure closure only if the official notice is structure-specific |
| Trail closure due to construction | Shared only when construction is culvert, drainage, bridge, shoreline, or fish-passage infrastructure | 01_ROUTE_CONDITIONS | Lane 01 owns generic construction; lane 06 owns waterway/crossing infrastructure subset |
| Trail closure due to fire | Does not belong here | 01_ROUTE_CONDITIONS, 04_WILDFIRE, 07_GOVERNMENT_SAFETY_ALERTS | Lane 04 or 01 owns depending source |
| Hazardous-material spill | Does not belong here | 01_ROUTE_CONDITIONS, 07_GOVERNMENT_SAFETY_ALERTS | Lane 07 or 01 owns |
| Police activity | Does not belong here | 01_ROUTE_CONDITIONS, 07_GOVERNMENT_SAFETY_ALERTS | Lane 07 or 01 owns |
| Evacuation | Does not belong here | 04_WILDFIRE, 07_GOVERNMENT_SAFETY_ALERTS | Lane 07 or 04 owns |
| Excessive heat warning | Does not belong here | 02_WEATHER, 07_GOVERNMENT_SAFETY_ALERTS | Lane 02 owns |
| Severe thunderstorm warning | Does not belong here | 02_WEATHER, 07_GOVERNMENT_SAFETY_ALERTS | Lane 02 owns |
| High wind warning | Does not belong here, unless an official bridge/crossing notice separately closes the route | 02_WEATHER, 01_ROUTE_CONDITIONS | Weather warning stays in lane 02; route closure stays in lane 01 unless a crossing structure notice is lane 06-specific |
| Air-quality alert | Does not belong here | 03_AIR_QUALITY, 04_WILDFIRE, 07_GOVERNMENT_SAFETY_ALERTS | Lane 03 owns |
| Boil-water notice | Does not belong here | 07_GOVERNMENT_SAFETY_ALERTS | Lane 07 owns |
| Dam incident | Usually does not belong here for this route; only partial if official route-access impact is explicitly stated | 05_FLOOD_CONDITIONS, 07_GOVERNMENT_SAFETY_ALERTS | Lane 05 or 07 owns the incident; lane 06 only mirrors if a trail/crossing structure impact is separately confirmed |
| Bridge closure | Shared owner when the bridge or crossing is on the canonical GPX | 01_ROUTE_CONDITIONS | Lane 06 owns bridge/crossing infrastructure subset; lane 01 owns generic passability summary |
| Waterway infrastructure closure | Primary owner | 01_ROUTE_CONDITIONS, 05_FLOOD_CONDITIONS | Lane 06 should be canonical if the closure is caused by culvert, fish-passage, drainage, shoreline, lock, spillway, or crossing infrastructure affecting the route |
| Public-health advisory | Does not belong here | 07_GOVERNMENT_SAFETY_ALERTS | Lane 07 owns |

## Deduplication rule summary

- If the cause is generic construction, lane 01 is canonical.
- If the cause is raw water level, flood stage, or hydrologic condition, lane 05 is canonical.
- If the cause is a route-impacting culvert, drainage, shoreline, bridge, or crossing structure, lane 06 is canonical.
- If a single event spans multiple lanes, lane 06 should publish only the infrastructure-specific rider impact, and link back to the canonical hazard lane when appropriate.
