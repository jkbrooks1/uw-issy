# OVERLAP_NOTES

This file states workstream `07_GOVERNMENT_SAFETY_ALERTS` positions only. It does
not attempt to resolve the full cross-workstream matrix.

## Ownership stance by hazard

| Hazard | 07 ownership stance | Adjacent workstreams that may also touch it | Canonical source priority from 07 side | Deduplication rule from 07 side | Notes |
|---|---|---|---|---|---|
| Smoke advisory | Does not belong here as primary owner | `03_AIR_QUALITY`, `04_WILDFIRE`, `02_WEATHER` | NWS only as corroboration if surfaced | If surfaced in `NWS-01`, cross-list only; do not own the card here | Primary meaning is air quality, not government safety |
| Red Flag Warning | Does not belong here as primary owner | `04_WILDFIRE`, `02_WEATHER` | NWS only as corroboration | Do not own here unless bundled into a broader civil emergency | Fire-weather ownership belongs elsewhere |
| Flash Flood Warning | Shared only when escalates to emergency/public-warning context | `05_FLOOD_CONDITIONS`, `02_WEATHER` | `NWS-01` | Let flood lane own; only cross-list here if tied to evacuation or public-safety closure messaging | Flood ownership belongs primarily to lane 05 |
| Flood Watch | Does not belong here as primary owner | `05_FLOOD_CONDITIONS`, `02_WEATHER` | `NWS-01` | Cross-list only if needed | Same reasoning as above |
| Trail closure due to flooding | Partial/shared | `01_ROUTE_CONDITIONS`, `05_FLOOD_CONDITIONS` | Official trail/closure source first, `NWS-01` second | Let route-closure lane own the operational closure record; 07 only references if emergency messaging accompanies it | Route-closure ownership is stronger than alert ownership here |
| Trail closure due to construction | Does not belong here | `01_ROUTE_CONDITIONS`, `06_TRAIL_INFRASTRUCTURE_STATUS` | Not applicable | Not a 07-owned hazard | Construction is not a government safety alert unless accompanied by emergency messaging |
| Trail closure due to fire | Shared only if emergency messaging is active | `01_ROUTE_CONDITIONS`, `04_WILDFIRE` | Official closure source first, wildfire lane second, `NWS-01` third | Cross-list only when evacuation or emergency language exists | Closure/wildfire lanes should own first |
| Hazardous-material spill | Primary 07 candidate | `01_ROUTE_CONDITIONS`, possibly `02_WEATHER` only for dispersion context | `NWS-01` if CAP exists, then city/UW/local official feeds, then police/fire context | Prefer CAP identifier when present; otherwise cluster by hazard type + location + time | This is one of the clearest 07-owned hazards |
| Police activity | Partial/shared | `01_ROUTE_CONDITIONS` for actual access closure | `SEA-01` or `UW-01` first, `SEAPD-01` second | Canonicalize to the highest-authority local official source; treat police blotter as corroboration unless it is the only official source | Use only when route-relevant and actionable |
| Evacuation | Primary 07 candidate | `04_WILDFIRE`, `05_FLOOD_CONDITIONS` may also touch cause | `NWS-01` CAP if present, then local OEM/campus sources | CAP identifier first; otherwise normalized location + timing cluster | Clear government/public-warning ownership |
| Excessive Heat Warning | Does not belong here as primary owner | `02_WEATHER` | NWS as weather lane source | Cross-list only if public-safety emergency messaging is layered on top | Weather ownership is primary |
| Severe Thunderstorm Warning | Does not belong here as primary owner | `02_WEATHER` | NWS as weather lane source | Cross-list only if extraordinary civil-emergency treatment is needed | Weather ownership is primary |
| High Wind Warning | Does not belong here as primary owner | `02_WEATHER` | NWS as weather lane source | Cross-list only if tied to infrastructure emergency language | Weather ownership is primary |
| Air-quality alert | Does not belong here as primary owner | `03_AIR_QUALITY` | `NWS-01` only as corroboration | Do not own here | Directly validated in this cycle via off-route NWS alerts |
| Boil-water notice | Primary 07 candidate | none strongly adjacent | local/state health source first, then city/utility/public-health cross-post | Dedup by issuing agency + locality + effective date | Public-health safety issue with clear rider relevance if route services/water access are affected |
| Dam incident | Primary 07 candidate | `05_FLOOD_CONDITIONS` may overlap | `NWS-01` if CAP exists, then local/state emergency source | CAP id first; otherwise location + incident type + timing | Public-warning ownership fits 07 |
| Bridge closure | Shared | `01_ROUTE_CONDITIONS`, `06_TRAIL_INFRASTRUCTURE_STATUS` | Closure owner first, emergency source second | Let route-closure lane own closure record unless public-warning messaging is primary | 07 should not own ordinary structural closures |
| Waterway infrastructure closure | Usually not 07-owned | `06_TRAIL_INFRASTRUCTURE_STATUS`, `01_ROUTE_CONDITIONS` | Not applicable unless emergency messaging is active | Cross-list only if public safety alerting is active | Ordinary infrastructure status belongs elsewhere |
| Public-health advisory | Partial/shared | `03_AIR_QUALITY` for AQ-specific cases, possibly `02_WEATHER` for heat-health overlap | `DOH-02` first, then `DOH-01`, then local official cross-posts | Canonicalize to DOH when statewide or regional; otherwise use local official issuer | Own only when it is truly public-health safety and not better owned by another lane |

## Bottom-line ownership summary for lane 07

Strongest 07 ownership candidates:
- hazardous-material spill
- evacuation
- civil emergency
- shelter-in-place / public-warning style event
- boil-water notice
- dam incident
- route-relevant police/public-safety incident only when the event is actionable as a public warning

Shared but not primary:
- police activity
- trail closure when emergency messaging accompanies the closure
- public-health advisory
- flood/fire-driven closures when the causal lane already owns the hazard

Not 07-owned in normal conditions:
- routine weather warnings
- air-quality alerts
- routine construction closures
- ordinary trail/bridge/infrastructure maintenance notices
