# UW_ISSY_04_WILDFIRE_IMPLEMENTATION_RECOMMENDATION_v1

## MVP recommendation

Build the first production wildfire connector around these sources:

1. `NIFC-01` WFIGS Current Wildland Fire Locations
2. `NIFC-02` WFIGS Current Interagency Fire Perimeters
3. `NWS-01` NWS active alerts API
4. `NOAA-01` NOAA HMS smoke polygons
5. `KC-01` King County Fire Safety Burn Bans

This gives the route a practical first-pass answer for:

- active wildfire near the route
- active wildfire perimeter near the route
- Red Flag Warning / Fire Weather Watch
- wildfire smoke extent intersecting the route
- county burn restrictions

## Secondary recommendation

Layer these in after MVP:

- `DNR-01` for Washington-specific corroboration
- `DNR-02` for DNR fire-danger context
- `EFR-01` for Sammamish / Issaquah local burn restrictions
- `INCIWEB-01` for narrative enrichment
- `KC-TRAIL-01` and `SEA-TRAIL-01` for fire-caused closure confirmation

Enable later with credentials:

- `NASA-01` FIRMS

## Thresholds

Recommended inclusion thresholds:

- active fire point: `<= 5 miles` from route line
- active fire perimeter: intersects `10-mile` route buffer
- evacuation zone: intersects route line or `1-mile` route buffer
- smoke plume: intersects `5-mile` route buffer
- Red Flag Warning / Fire Weather Watch: any alert affecting `WAZ654` or `WAZ657`
- countywide burn restriction: any active King County burn restriction
- fire-related route closure: exact named segment match or closure geometry within `0.25 mile`

## Freshness and stale behavior

- WFIGS / NWS: stale after `15 minutes`
- NOAA HMS smoke polygons: stale after `24 hours`
- burn-ban pages: stale after `6 hours`
- InciWeb: stale after `30 minutes`

If a source fails:

- keep last-known-good
- mark source stale or errored
- do not imply the route is clear

## High-level workflow design

Recommended future prototype sequence:

1. fetch MVP sources on source-specific cadence
2. normalize source payloads
3. apply route buffer / zone / named-trail logic
4. dedupe WFIGS points and perimeters by incident ID
5. assign route severity and public summary
6. publish compact public JSON and richer diagnostics JSON
7. preserve last-known-good atomically

## Risks and unresolved items

Main unresolved item:

- no verified unattended public evacuation feed for this route

Main operational risks:

- WFIGS request-unit throttling under burst traffic
- HTML template drift on county / local burn pages
- NOAA HMS dated-file discovery instead of stable current alias
- FIRMS still credential-blocked

## Next step

Proceed to a non-production prototype that fetches only the MVP source set, applies the thresholds above, and emits one normalized example file plus one diagnostics file. That is the correct next technical phase.
