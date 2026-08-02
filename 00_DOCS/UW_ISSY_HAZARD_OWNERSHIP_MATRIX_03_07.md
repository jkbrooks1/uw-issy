# UW-Issaquah Hazard Ownership and Deduplication Matrix (Workstreams 03-07)

Synthesized by the orchestrating session from each workstream's own `OVERLAP_NOTES.md`
(03_AIR_QUALITY, 04_WILDFIRE, 05_FLOOD_CONDITIONS, 06_TRAIL_INFRASTRUCTURE_STATUS,
07_GOVERNMENT_SAFETY_ALERTS), each written independently by its own research worker and
stating only that workstream's position. This document resolves the cross-workstream
matrix by reconciling all five positions where they overlap, and folds in references to
`01_ROUTE_CONDITIONS` and `02_WEATHER` wherever those established lanes were repeatedly
named as adjacent owners. No workstream position was overridden without a stated reason;
where two workstreams disagreed on scope, the disagreement is called out explicitly rather
than silently resolved.

## Quick-reference matrix

| Hazard | Owning workstream | Secondary / co-owner | Canonical source priority | Deduplication rule |
|---|---|---|---|---|
| Smoke advisory | `03_AIR_QUALITY` (consequence layer) | `04_WILDFIRE` (fire cause/plume geometry), `07` (corroboration only) | `ECO-02` (forecast polygon) > `WASMOKE-01` (outlook) > `ECO-01` (current) | 04 owns the fire cause/perimeter/source event; 03 owns the resulting air-quality state on the route. One card, cross-linked, not duplicated. |
| Red Flag Warning | `04_WILDFIRE` | `02_WEATHER` (product context), `07` (corroboration only) | `NWS-01` | One route-wide advisory per active NWS alert ID / event / effective window. |
| Fire Weather Watch | `04_WILDFIRE` | `02_WEATHER`, `07` (corroboration only) | `NWS-01` | Same as Red Flag Warning. |
| Flash Flood Warning | `05_FLOOD_CONDITIONS` | `02_WEATHER`, `07` (cross-list only if tied to evacuation/public-safety messaging) | `NWS-01` | 05 owns hydrologic interpretation; 07 does not duplicate unless evacuation language is attached. |
| Flood Watch | `05_FLOOD_CONDITIONS` | `02_WEATHER`, `07` (cross-list only) | `NWS-01` | Same as Flash Flood Warning. |
| Flood Advisory | `05_FLOOD_CONDITIONS` | `02_WEATHER`, `07` | `NWS-01` or `NWPS-01` | 05 owns hydrologic interpretation. |
| Trail closure due to flooding | `01_ROUTE_CONDITIONS` (closure record) **jointly with** `05_FLOOD_CONDITIONS` (flood-cause classification) | `06` (only if explicitly water-control/shoreline-structure-caused), `07` (only if emergency messaging accompanies it) | Route-owner closure source for the closure fact; `05` hydrologic source for the cause | One normalized event: closure state from the closure source, flood cause from the hydrologic source, one rider-facing card, not two. |
| Trail closure due to construction | `01_ROUTE_CONDITIONS` | `06_TRAIL_INFRASTRUCTURE_STATUS` (only when construction is culvert/drainage/bridge/shoreline/fish-passage infrastructure) | Route-owner closure source | 01 is canonical for generic construction; 06 only owns the waterway/crossing-infrastructure subset. |
| Trail closure due to fire | `01_ROUTE_CONDITIONS` (closure record) **jointly with** `04_WILDFIRE` (incident context) | `07` (only if emergency messaging is active) | Route-owner closure page first, wildfire incident/perimeter source for context | If a closure and a wildfire refer to the same event, the closure source owns closure status and the wildfire source owns incident context — one card. |
| Hazardous-material spill | `07_GOVERNMENT_SAFETY_ALERTS` | `01_ROUTE_CONDITIONS` (any resulting access closure), `02_WEATHER` (dispersion context only) | CAP identifier if present, then city/UW/local official feeds, then police/fire context | This is one of the clearest 07-owned hazards; 01 only co-owns if an actual closure results. |
| Police activity | `07_GOVERNMENT_SAFETY_ALERTS` (partial/shared) | `01_ROUTE_CONDITIONS` (actual access closure) | `SEA-01`/`UW-01` first, `SEAPD-01` second (corroboration only, noisy/text-only) | Canonicalize to the highest-authority local official source; treat police blotter as corroboration, not sole ownership. Only surface when route-relevant and actionable. |
| Evacuation | `07_GOVERNMENT_SAFETY_ALERTS` | `04_WILDFIRE`, `05_FLOOD_CONDITIONS` (cause context only) | `NWS-01` CAP if present, then local OEM/campus/county emergency-management source | CAP identifier first, otherwise normalized location + timing cluster. Wildfire/flood workstreams must not infer evacuation from proximity alone — only an official issuing authority creates the event. |
| Excessive heat warning | `02_WEATHER` | `07` (cross-list only if public-safety emergency messaging is layered on top) | `NWS-01` | Weather ownership is primary across every one of 03/04/05/06/07's own notes. |
| Severe thunderstorm warning | `02_WEATHER` | `07` (cross-list only if extraordinary civil-emergency treatment is needed) | `NWS-01` | Same as excessive heat. Flood workstream's only interest is downstream flooding the storm may cause, not the thunderstorm product itself. |
| High wind warning | `02_WEATHER` | `01_ROUTE_CONDITIONS` / `06_TRAIL_INFRASTRUCTURE_STATUS` (only if an official bridge/crossing notice separately closes the route) | `NWS-01` | Weather warning stays in 02; any resulting route closure is owned by 01 (or 06 if it's a named crossing structure). |
| Air-quality alert | `03_AIR_QUALITY` | `07` (corroboration only) | `NWS-AQ-01` when a formal Air Quality Alert exists; `PSCAA`/`Ecology` if a local agency posts official alert text; `ECO-01` as observation context only | If both NWS and a local air agency publish the same alert, keep one alert record keyed to the formal alert shell, enriched with monitor values, not two separate hazards. 04's wildfire connector must not publish a duplicate public AQ alert card. |
| Boil-water notice | `07_GOVERNMENT_SAFETY_ALERTS` | none strongly adjacent (05 explicitly disclaims ownership unless it is a flood-contamination notice) | Local/state health source (`DOH`) first, then city/utility cross-post | Dedup by issuing agency + locality + effective date. |
| Dam incident | `07_GOVERNMENT_SAFETY_ALERTS` (incident/public-warning ownership) **jointly with** `05_FLOOD_CONDITIONS` (only when it changes flood risk on the route) | `06_TRAIL_INFRASTRUCTURE_STATUS` (mirrors only if a trail/crossing structure impact is separately confirmed) | `NWS-01`/CAP if a CAP identifier exists, then local/state emergency source | 05 owns the flood-risk consequence; 07 owns the incident/public-warning framing; 06 only mirrors when a structural route impact is independently confirmed. |
| Bridge closure | `01_ROUTE_CONDITIONS` (generic passability record) **jointly with** `06_TRAIL_INFRASTRUCTURE_STATUS` (infrastructure-specific subset, when the bridge/crossing is on the canonical GPX) | `05_FLOOD_CONDITIONS` (adds flood causation if supported), `07` (only if public-warning messaging is primary) | Route-owner closure source first | 01 is canonical for the closure fact; 06 owns the bridge/crossing infrastructure detail; 05 adds cause only when flood-driven. |
| Waterway infrastructure closure | `06_TRAIL_INFRASTRUCTURE_STATUS` | `01_ROUTE_CONDITIONS` (generic closure record), `05_FLOOD_CONDITIONS` (only if explicitly flood-driven) | Official trail-owner / infrastructure-agency source | 06 is canonical when the closure is caused by culvert, fish-passage, drainage, shoreline, lock, spillway, or crossing infrastructure affecting the route; otherwise defer to 01 or 05. |
| Public-health advisory | `07_GOVERNMENT_SAFETY_ALERTS` (general) | `03_AIR_QUALITY` (only when specifically about air quality/smoke exposure), `05_FLOOD_CONDITIONS` (only for explicit flood-contamination notices) | `DOH` (state health) first, then local official cross-posts | Canonicalize to DOH when statewide/regional; use the local official issuer otherwise. Do not duplicate a smoke-exposure advisory that 03 already owns. |

## Notable disagreements or ambiguities surfaced during synthesis

These are flagged rather than silently resolved, per the research job's own "do not hide
uncertainty" requirement:

1. **Trail closure due to fire, trail closure due to flooding, bridge closure, dam
   incident, and waterway infrastructure closure are all genuinely joint-owned**, not
   single-owner. Every workstream that touched these was consistent about *why* (closure
   fact vs. causal classification are different pieces of truth), but implementation must
   deliberately merge them into one rider-facing card per event rather than trusting any
   single workstream's output in isolation. This is the single biggest cross-cutting
   implementation risk in the whole 03-07 research set.
2. **04_WILDFIRE and 06_TRAIL_INFRASTRUCTURE_STATUS both claim a role in fire-caused trail
   closures**, but 06's own `OVERLAP_NOTES.md` explicitly says fire-related trail closure
   "does not belong here" (deferring fully to 01/04), while 04's notes describe it as
   "shared" with 06. This matrix follows 06's more conservative (and more recently
   written) position: 06 is not listed as a co-owner of fire-caused closures above. If a
   future review disagrees, this is the specific line to revisit.
3. **07_GOVERNMENT_SAFETY_ALERTS already independently discovered a real, live scope
   leak**: a statewide NWS query returned live Air Quality Alerts during 07's own testing,
   which are real, but belong to 03, not 07. 07's own audit already treats this as a
   required implementation-time filter, not just a research note — carry it into the
   handoff prompt as a hard requirement, not an aspiration.
4. **01_ROUTE_CONDITIONS and 02_WEATHER were not re-researched in this cycle** — their
   ownership positions above are reconstructed entirely from how workstreams 03-07
   described them as adjacent owners, not from re-reading 01/02's own (already-completed)
   deliverables in this pass. Treat the 01/02 entries above as *inferred from context*,
   not independently re-verified this cycle.

## Escalation rule (applies across the whole matrix)

For any hazard above where two workstreams both have a legitimate claim (the "jointly
with" rows), the implementation must not publish two separate rider-facing cards for the
same real-world event. The recommended rule, consistent across every workstream that
discussed it:

1. Resolve closure/incident *fact* from the source that workstream's own research
   identifies as the closure-of-record (usually `01_ROUTE_CONDITIONS`, or the workstream
   marked "canonical" above).
2. Attach *cause* classification and severity from the causal workstream (flood, fire, or
   infrastructure lane).
3. Publish one normalized event with both fields populated, and reference both source IDs
   in `source_provenance` — never publish the same real-world event twice under two
   different workstream cards.
