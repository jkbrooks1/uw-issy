# SOURCE_GAPS.md — 05_FLOOD_CONDITIONS

## Confirmed coverage gaps

1. **No verified live official Sammamish River gauge was identified in the tested production-ready set.**
The route spends many miles in the Sammamish River corridor, but the strongest usable live signals were still Issaquah Creek, Lake Sammamish, and closure supplements.

2. **No official trail-inundation threshold was found for East Lake Sammamish Trail or Lake Sammamish State Park.**
Lake level alone should not trigger route-closure logic without corroborating closures or flood products.

3. **Bear Creek, North Fork Issaquah Creek, and Coal Creek discovery sites were not operationally usable via the tested USGS IV path.**
Their HTTP 200 responses contained zero time-series objects.

4. **King County's app backend is not a clean public contract.**
The river-list call returned useful JSON, but the backend is undocumented, key-bound, and partly unstable under direct probing.

5. **Bellevue, Sammamish, Seattle/SPU, and regional alert systems did not expose live machine-readable flood feeds.**
They are legitimate official resources, but weak unattended connector inputs.

6. **SammamishRoadAlerts is structurally real but content-stale.**
Only 2014 test records were observed on Wednesday, July 29, 2026.

## What would close these gaps

- A verified official live Sammamish River gauge or another official water-level proxy directly tied to the Bothell/Woodinville/Marymoor sections.
- A local-agency or park-owner statement linking Lake Sammamish elevation to actual East Lake Sammamish Trail or Lake Sammamish State Park inundation.
- Repeated follow-up checks on `KC-ROAD-02` to determine whether live Sammamish road-alert content ever appears.
- A route-buffer geometry test against shared closure sources from workstream 01, so the flood connector can consume `confirmed_route_closure` evidence rather than re-deriving everything itself.

## Items intentionally left out of MVP

- WSDOT weather stations: useful for weather, not primary flood logic.
- Ecology flood maps: valuable for static vulnerability context only.
- AlertRedmond / Bellevue / Alert King County sign-up systems: not a public feed model.
