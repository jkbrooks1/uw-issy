# WEATHER_THRESHOLD_RECOMMENDATIONS.md — Lane 02_WEATHER

Initial rider-relevant thresholds for the UW–Issaquah route. Every threshold
below is explicitly labeled as one of:

- **INHERITED (CDM)** — carried over unchanged from the CDM France-route
  connector's existing threshold pattern (`02_WEATHER_CONNECTOR_OUTPUT_CONTRACT.md`,
  observation-alert logic), because the underlying physical risk is not
  climate-specific.
- **WA-ADJUSTED** — a CDM-inherited concept, but the numeric value changed to
  fit Pacific Northwest / Seattle-area conditions and this specific route.
- **PROPOSED** — new, not present in the CDM pattern at all, proposed fresh for
  this cycling route.
- **UNRESOLVED** — requires project-owner approval or further research before
  being treated as policy; flagged explicitly, not silently finalized.

None of these are final policy. Per the work order, thresholds must not be
silently treated as final — the project owner should review and approve or
adjust every value below before it is encoded into a production connector.

## Wind

| Threshold | Value | Class | Rationale |
|---|---|---|---|
| Sustained wind caution | 15 mph (24 km/h) | PROPOSED | Trail sections along open lake/river frontage (Sammamish River Trail, East Lake Sammamish Trail) and Marymoor Park's open fields have minimal wind shelter; 15 mph sustained is a widely-used general cycling-caution point for crosswind handling, independent of NWS advisory thresholds. |
| Sustained wind advisory-aligned | 25 mph (40 km/h) | WA-ADJUSTED | CDM's inherited gust logic used ≥40 km/h as its single wind trigger; here it is split into a lower sustained-wind caution tier because sustained wind, not just gusts, matters for a multi-hour ride. 25 mph aligns with the low end of Wind Advisory conditions observed for the NWS Seattle (SEW) office in real issued advisories for this area (see Unresolved note below on exact criteria). |
| Wind gust caution | 30 mph (48 km/h) | WA-ADJUSTED | CDM inherited a single ≥40 km/h (~25 mph) gust trigger; raised slightly for this route since 25 mph gusts are common, non-hazardous Puget Sound conditions, and a lower bar would over-alert. |
| Wind gust high-risk | 45 mph (72 km/h) | WA-ADJUSTED | Real issued Wind Advisories for the Seattle/King County area have been observed with gusts in the 45-55 mph range (per real 2026 advisory examples found in this research cycle); 45 mph gusts are a reasonable high-risk cycling threshold, especially on the exposed Marymoor Park and lakefront trail sections. |
| **UNRESOLVED:** exact NWS SEW Wind Advisory / High Wind Warning numeric criteria | — | UNRESOLVED | This research cycle found real examples of issued advisories (sustained 20-35 mph / gusts up to 50 mph triggering Wind Advisory; gusts up to 55 mph triggering High Wind Warning) via general web search, but did NOT retrieve NWS SEW's own official, current criteria documentation/directive. Before finalizing, pull the exact criteria from NWS SEW's own public criteria page or the National Weather Service Instruction 10-513, rather than relying on inferred examples. |

## Temperature

| Threshold | Value | Class | Rationale |
|---|---|---|---|
| High-temperature caution | 85°F (29.4°C) | WA-ADJUSTED | CDM's inherited heat threshold was ≥30°C (86°F), tuned for southern-France summer heat and French acclimatization. Seattle-area riders are measurably less heat-acclimatized and air conditioning is far less common regionally; a slightly lower absolute threshold is proposed, while also recommending using NWS's own `heatRisk` field (confirmed present in the NWS-04 raw gridpoint payload) as the primary signal rather than a flat degree threshold, since `heatRisk` is itself a climate/population-adjusted NWS product. |
| High-temperature high-risk | 90°F (32.2°C) | PROPOSED | Genuinely rare and notable for this specific route/season; treat as a hard high-risk tier regardless of `heatRisk` field value. |
| Low-temperature / frost caution | 36°F (2.2°C) | PROPOSED | Standard frost-caution buffer above freezing, relevant especially at the Issaquah terminus (WP8) where foothill elevation and cold-air drainage plausibly produce colder mornings than the Seattle lowlands — not independently measured this cycle, flagged as a rationale to revisit once real seasonal data is available. |
| Low-temperature / ice high-risk | 32°F (0°C) | PROPOSED | Direct freezing threshold; combine with `iceAccumulation`/precipitation fields (NWS-04) for a freezing-rain/black-ice specific high-risk flag, not temperature alone. |
| Apparent temperature (heat index / wind chill) | Use NWS `apparentTemperature`/`heatIndex`/`windChill` fields directly, same numeric bands as above | PROPOSED | NWS already computes these; no separate CDM pattern existed for apparent temperature specifically (CDM's contract did not define a distinct apparent-temperature threshold), so this is a new proposal rather than an adjustment. |

## Precipitation

| Threshold | Value | Class | Rationale |
|---|---|---|---|
| Any precipitation caution | probabilityOfPrecipitation ≥ 50% OR quantitativePrecipitation > 0mm observed | WA-ADJUSTED | CDM's inherited observation-alert rule was simply "rain > 0mm" (any measured rain). For a Seattle-area route where light rain is routine and frequent, a flat >0mm trigger would over-alert constantly; the forecast-side probability threshold (≥50%) is proposed as the primary caution signal, with the CDM >0mm rule retained unchanged for confirmed/observed rain rather than forecast probability. |
| Heavy precipitation high-risk | quantitativePrecipitation ≥ 0.25 in/hr (6.35mm/hr) equivalent in the grid data's mm units | PROPOSED | Standard "heavy rain" threshold; relevant for visibility and trail-surface runoff on unpaved/gravel sections if any exist along the route (not independently confirmed this cycle — flag for Lane 01/06 cross-check on trail surface type). |
| Thunderstorm | probabilityOfThunder > 0% treated as caution; any `weather[]` entry coded `thunderstorms` treated as high-risk | PROPOSED | No CDM-equivalent field existed (Météo-France vigilance handles thunderstorm risk via its own color-coded vigilance system, not a raw probability field) — this is a new proposal built directly around the NWS-04 fields confirmed present in live testing. |
| Snow / freezing precipitation | Any non-zero `snowfallAmount` OR `iceAccumulation` OR `weather[]` entry coded `snow`/`freezing_rain`/`freezing_fog` | WA-ADJUSTED | CDM's inherited "adverse ground state" concept is retained, but the field mapping is entirely different (Météo-France's ground-state alert vs. NWS's `weather[]` phenomenon coding and `snowfallAmount`/`iceAccumulation` fields) since the underlying source schema is not comparable. |

## Visibility / fog

| Threshold | Value | Class | Rationale |
|---|---|---|---|
| Dense fog caution | visibility < 1 statute mile (1,609m) | WA-ADJUSTED | CDM's inherited threshold was <2km. The Sammamish River valley (Bothell/Woodinville, WP3/WP4) is a well-known regional radiation-fog pocket in fall/winter mornings; 1 mile (the standard US "Dense Fog Advisory" reference point used by many NWS offices) is proposed as a tighter, more US-convention-aligned threshold than the CDM 2km figure, while still being WA-ADJUSTED rather than a fresh invention since the underlying concept (a visibility-distance trigger) is directly inherited. |
| Dense fog high-risk | visibility < 0.25 statute mile (400m) | PROPOSED | Standard US "dense fog" reporting threshold; independent of any official NWS Dense Fog Advisory criteria confirmation for SEW specifically (not verified this cycle — same caveat as the wind-advisory line above). |

## Official watches, warnings, and advisories

| Rule | Class | Rationale |
|---|---|---|
| Any active NWS alert with `event` in a genuinely meteorological allowlist (Winter Storm Warning, Winter Weather Advisory, Wind Advisory, High Wind Warning, Dense Fog Advisory, Severe Thunderstorm Warning, Excessive Heat Warning/Watch, Heat Advisory, Freeze Warning/Watch, Frost Advisory, Flood-adjacent-but-weather-sourced advisories excluded per Lane 05) → published verbatim with official NWS severity/certainty/urgency preserved | WA-ADJUSTED | Directly mirrors the CDM/project-wide rule that "official warning levels and colors should be preserved in official-source fields" and route impact is represented separately (per project CLAUDE.md and `00_PROJECT_RULES.md`'s route-impact rule) — adapted from Météo-France's green/yellow/orange/red vigilance colors to NWS's `severity`/`certainty`/`urgency`/`event` fields, which is a structurally different but functionally equivalent official-source scheme. |
| Any active NWS alert with `event` in the Air Quality or Fire Weather families → excluded from Lane 02 publication, left to Lanes 03/04 | PROPOSED | Directly required by this cycle's live finding that the only real active alert encountered (statewide test) was an Air Quality Alert — see `SOURCE_GAPS.md` item 5. |
| No official alert exists → do not infer or invent a caution/warning state from raw grid data alone, beyond the numeric thresholds above | INHERITED (CDM) | Directly mirrors the project-wide philosophy (CLAUDE.md, "CDM Source and Status Philosophy") that route/condition status must not be escalated beyond what an official source explicitly supports. |

## Explicitly unresolved thresholds requiring user approval

1. Exact NWS SEW Wind Advisory / High Wind Warning numeric criteria (see Wind
   section) — needs direct retrieval from NWS's own criteria documentation,
   not inferred from news examples.
2. Exact NWS SEW Dense Fog Advisory criteria, if one is issued by this
   specific office (not confirmed to exist as a distinct product for SEW this
   cycle).
3. Whether the 85°F/90°F WA-adjusted heat thresholds should instead defer
   entirely to NWS's own `heatRisk` field values (a categorical scale) rather
   than a parallel degree-based threshold — both approaches are defensible;
   this document proposes running both in parallel initially and letting the
   project owner decide whether to simplify to `heatRisk` alone after seeing
   real output.
4. Whether trail-surface type (paved vs. gravel/unpaved) varies anywhere
   along the route in a way that changes the heavy-precipitation risk
   tier — flagged for cross-check with Lane 01/06, not resolved here.
