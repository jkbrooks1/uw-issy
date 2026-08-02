# RESEARCH_FINDINGS.md — 05_FLOOD_CONDITIONS

## Scope and route basis

This workstream researched current and forecast flooding, high water, urban flooding, standing water, and closure supplements for the UW -> Burke-Gilman -> Sammamish River -> Marymoor -> East Lake Sammamish -> Issaquah corridor.

I reused the already-established route facts from `01_ROUTE_CONDITIONS` and `02_WEATHER` rather than re-deriving the corridor from scratch: `33.83` miles, `1470` GPX track points, and bounding box lat `47.55207` to `47.75889` / lon `-122.3057` to `-122.04414`.

## What was searched and tested

The strongest official candidates fell into four buckets:

1. Direct hydrologic observations from USGS.
2. Official forecast and category products from NOAA NWPS and the NWS alert API.
3. Local interpretation layers from King County and the City of Issaquah.
4. Closure supplements from Redmond, King County road alerts, and WSDOT for cases where water leads to an actual route closure.

The route-relevant gauge sweep around the corridor found six nearby USGS sites:

- `12121600` Issaquah Creek near mouth near Issaquah.
- `12120600` Issaquah Creek near Hobart.
- `12122000` Sammamish Lake near Redmond.
- `12121570` North Fork Issaquah Creek at Issaquah.
- `12124490` Bear Creek at Union Hill Rd at Redmond.
- `12119690` Coal Creek below Coal Creek Parkway near Bellevue.

Only the first three returned usable live IV payloads on Wednesday, July 29, 2026. The other three returned HTTP 200 with zero time-series objects, which is exactly the kind of false-positive usability result the work order warned against.

## Main findings

### 1. The route has one clearly supported official flood-forecast location: Issaquah Creek near Issaquah

`NWPS-01` / `ISSW1` is the strongest forecast source in the whole workstream. It combines:

- official action / minor / moderate / major thresholds;
- observed status;
- seven-day forecast hydrograph data;
- ratings data; and
- direct linkage to USGS site `12121600`.

This is the only tested source that cleanly answers both “what is happening now?” and “what is the official forecast category?”

### 2. The City of Issaquah still matters because it defines the lead-time logic the federal products do not

The Issaquah flood page explicitly says the upstream Hobart gauge usually provides three to four hours of lead time and publishes the local phase thresholds:

- Phase I: 6.5 ft and rising.
- Phase II: 7.5 ft and rising.
- Phase III: 8.5 ft regardless of trend.
- Phase IV: 9.0 ft regardless of trend.

That makes `USGS-02` and `NWPS-02` valuable even though Hobart is about 10.9 km from the route and lacks official NWS forecast categories. It is an upstream lead indicator, not a direct route-flood observation.

### 3. Lake Sammamish is measurable, but not thresholded

`USGS-03` provides live lake elevation at `12122000`, and King County's internal app groups that gauge with Issaquah Creek. That is useful for shoreline context near Lake Sammamish State Park and the East Lake Sammamish Trail.

What I did not find was an official route-impact threshold such as “trail floods at lake elevation X.” Because of that, Lake Sammamish should support only:

- elevated-water context,
- trend interpretation,
- corroboration with closures or local alerts,

and should not independently trigger a “route closed” or “flood warning” state.

### 4. There is no verified live official gauge on the Sammamish River corridor itself in the tested set

This was the biggest hydrologic gap. The route spends many miles on the Sammamish River Trail and adjacent Marymoor lowlands, but the strongest tested live gauges were still:

- Issaquah Creek;
- Lake Sammamish; and
- local closure supplements.

Bear Creek would have been a useful Marymoor/Redmond proxy, but the tested USGS IV response was unusable on Wednesday, July 29, 2026.

### 5. King County's public flood app is informative, but it should not be the production backbone

The public app at `flood.kingcounty.gov` is modern, live, and clearly useful to residents. Its shipped JavaScript also exposes an undocumented county API that returns real threshold and gauge-grouping data.

That is still not enough to recommend it as the production connector backbone because:

- the API is not documented as a public integration contract;
- it depends on an app-shipped subscription key;
- the river-list call worked, but the obvious direct gauge path already threw a server-side failure during testing;
- the underlying USGS and NOAA feeds are independently reachable anyway.

The county app is therefore best treated as a corroborating product, not a source of first resort.

### 6. Closure confirmation needs to come from other systems, not from hydrologic height alone

The work order explicitly warned not to equate high water with a flooded trail. The live testing supported that warning.

The strongest closure supplements I found were:

- `REDM-01` Redmond `Traffic/Alerts` ArcGIS REST service;
- `KC-ROAD-01` King County unincorporated road-alert ArcGIS service;
- `WSDOT-01` Highway Alerts REST for state-highway crossings and detours;
- the existing route-conditions workstream outputs for trail-level closure interpretation.

These sources tell you when water has already translated into an actual travel restriction. They do not replace the hydrologic signals.

### 7. Bellevue, Sammamish, Seattle Public Utilities, and regional alert-signup systems were real but weak as unattended connectors

I directly fetched Bellevue, Sammamish, Seattle, Redmond, and Alert King County related pages. They mostly fell into one of two groups:

- preparedness pages with phone numbers and advice; or
- email/SMS alert sign-up systems with no public feed.

They are legitimate official resources for residents, but weak automation inputs for this connector.

## What surprised me

- The most useful King County-specific machine-readable result was hidden behind the flood app's client bundle rather than documented openly.
- The physically nearby Bear Creek, Coal Creek, and North Fork Issaquah Creek USGS sites all failed the “usable payload” test despite returning HTTP 200.
- The best closure supplement for flood-related eastside access issues was not a flood system at all, but Redmond's general traffic-alert ArcGIS service.
- WSDOT became materially more useful once the project's existing `WSDOT_TRAVELER_API_ACCESS_CODE` name was confirmed present and the correct REST paths were used.

## Rejected or downgraded sources

- `KCF-02` rejected for production use because it is an undocumented, key-bound app backend.
- `USGS-04`, `USGS-05`, and `USGS-06` rejected because the tested IV payloads were unusable.
- `REDM-02`, `BEL-01`, and `SAM-02` rejected because they are notification systems, not data feeds.
- `BEL-02`, `SAM-01`, and `SEA-01` rejected because they are preparedness or reporting pages, not live monitoring products.
- `ECO-01` rejected as a runtime connector, but retained as a static floodplain-reference lead for offline route-susceptibility work.

## Bottom line

The best production-grade flood-monitoring stack for this route is narrower than the candidate list:

- observed water from `USGS-01` and `USGS-02`;
- forecast and official categories from `NWPS-01`;
- flood and flash-flood alerts from `NWS-01`;
- Issaquah local phase semantics from `ISS-01`;
- optional shoreline context from `USGS-03`;
- closure confirmation from shared route-condition sources such as `REDM-01` and `WSDOT-01`.

That gives an honest route-aware distinction between elevated water, forecast flood risk, and confirmed travel impact.
