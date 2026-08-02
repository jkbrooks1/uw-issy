# ROUTE_RELEVANCE_AND_THRESHOLDS.md — 04_WILDFIRE

## Route-relevance method

The wildfire connector should use a strict geometry-first relevance pipeline:

1. Filter by incident class first.
2. Apply a cheap bounding-box prefilter only to reduce work.
3. Apply the real route rule:
   - point-to-route distance
   - polygon-to-route intersection
   - route fire-zone match
   - county membership only where the source itself is countywide by design
   - named trail / road / facility match for closure pages
4. Only after that, assign severity.

## Source-specific route relevance

### `NIFC-01` WFIGS incident points

- Primary method: point-to-route distance
- Secondary method: incident ID linkage to `NIFC-02`
- Do not use county membership alone

### `NIFC-02` WFIGS perimeters

- Primary method: polygon-to-route buffered intersection
- Secondary method: same-incident linkage to `NIFC-01`

### `NWS-01` NWS alerts

- If polygon exists: polygon-to-route intersection
- If geometry is null:
  - match `affectedZones` / `UGC` to route fire zones `WAZ654` and `WAZ657`
  - match county code `WAC033`
- For Red Flag Warning / Fire Weather Watch:
  - zone match is enough because the route is fully inside the two known route fire zones

### `NOAA-01` NOAA HMS smoke polygons

- Primary method: polygon-to-route buffered intersection
- Secondary method: density-aware severity once intersection is confirmed

### `KC-01` King County burn ban

- Method: county membership
- Interpretation caveat: countywide relevance for rider decision support, but direct legal effect mainly where route touches unincorporated county rules

### `EFR-01` Eastside Fire

- Method: service-area membership plus route-section match
- Only relevant to the Sammamish / Issaquah end of the route

### `KC-TRAIL-01` and `SEA-TRAIL-01`

- Method: named trail match and closure-text parsing
- If a fire-caused closure is posted here, treat it as canonical closure confirmation even if wildfire detection came from a different source

## Incident-type classification rules

## Wildfire incident

Treat as wildfire when one of these is true:

- WFIGS `IncidentTypeCategory = WF`
- DNR `FIREEVNT_CLASS_LABEL_NM = WF`
- InciWeb description says `type of incident is Wildfire`

## Prescribed burn

Treat as prescribed burn when one of these is true:

- WFIGS `IncidentTypeCategory = RX`
- incident title or description explicitly says prescribed fire / pile burn / Rx

Default handling:

- keep separate from wildfire
- lower default severity
- only escalate if smoke plume, route closure, or official warning also affects the route

## Structure fire

Default rule:

- exclude from the wildfire connector

Exception:

- only include if an official route-closure source, official evacuation source, or official warning source directly links the event to route impact

## Brush / vegetation fire

Default rule:

- only include when the source is an official wildfire / wildland source
- do not ingest routine city fire-dispatch incident streams for this route

## Smoke advisory

Default rule:

- official alert ownership stays shared with `03_AIR_QUALITY`
- this workstream uses smoke for wildfire context and plume geometry, not for sole public-health authority

## Fire-weather alert

Default rule:

- `NWS-01` owns Red Flag Warning / Fire Weather Watch detection

## Burn ban

Default rule:

- keep county / local / DNR restrictions separate
- do not flatten them into one generic yes/no field

## Evacuation

Default rule:

- require official local or county emergency source, or an official public warning feed carrying the evacuation message
- do not infer evacuation from proximity to a wildfire alone

## Fire-related route closure

Default rule:

- require route-owner closure text or a normalized closure feed from the closure workstreams
- do not infer route closure from perimeter proximity alone

## Threshold recommendations

| Signal type | Primary rule | Recommended threshold | Why |
|---|---|---|---|
| Active fire point | Point-to-route distance | Include at `<= 5 miles`; raise to high priority at `<= 2 miles` | Tight enough to suppress remote county noise; wide enough to catch foothill / Eastside fires that can affect smoke and access |
| Active fire perimeter | Polygon-to-route buffer intersection | Include when perimeter intersects a `10-mile` route buffer; high priority when it intersects a `2-mile` route buffer or the route line | Perimeters represent broader operational footprint and can matter before direct route contact |
| Evacuation zone | Polygon-to-route intersection | Include only when evacuation polygon intersects the route line or a `1-mile` route buffer; if no geometry, require named route city / trail / landmark match | Evacuations are high severity and should not be widened casually |
| Smoke plume | Polygon-to-route buffer intersection | Include when smoke polygon intersects a `5-mile` route buffer; high severity when `medium` or `heavy` plume intersects the route line | Smoke is broader than fire points, but still should not trigger from distant statewide plumes |
| Red Flag Warning polygon / fire zone | Polygon or zone match | Any active Red Flag / Fire Weather Watch affecting `WAZ654` or `WAZ657` is route-relevant | The route is fully inside those two fire zones |
| Countywide burn restriction | County membership | Any active King County burn restriction is route-relevant as rider context | Entire route sits in King County |
| Fire-related route closure | Named segment or geometry match | Exact named trail / road segment match, or closure geometry within `0.25 mile` of the route line | Closure claims need much tighter matching than general wildfire context |

## Special thresholds for secondary sources

### `DNR-01`

- Use the same `5-mile` point rule as `NIFC-01`
- Do not treat a King County record as route-relevant without a distance test

### `NASA-01`

- Do not publish raw FIRMS detections as rider-facing wildfire incidents
- If enabled later, use only as a pre-incident or corroboration layer
- Suggested future inclusion threshold: `<= 2 miles` from route line unless a second official source corroborates the event

## Route-wide decision summary logic

Recommended route-wide public summary priority:

1. route closure due to fire
2. evacuation touching route
3. perimeter within 2 miles or crossing route buffer
4. active wildfire point within 2 miles
5. medium / heavy smoke plume on route
6. Red Flag Warning or Fire Weather Watch for route fire zone
7. county or local burn restriction
8. secondary-only context

This order keeps the dashboard focused on cyclist decisions instead of raw incident abundance.
