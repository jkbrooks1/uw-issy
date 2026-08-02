# UW_ISSY_05_FLOOD_CONDITIONS_FINAL_RESEARCH_REPORT_v1

## Summary

On Wednesday, July 29, 2026, the strongest official flood-monitoring backbone for this route proved to be a combination of USGS observations, NOAA NWPS forecast/category products, and NWS flood-alert products, with local Issaquah phase semantics layered on top.

The best live route-end sources were:

- USGS `12121600` Issaquah Creek near mouth near Issaquah
- USGS `12120600` Issaquah Creek near Hobart
- NOAA NWPS `ISSW1` Issaquah Creek near Issaquah
- NWS flood / flash-flood alerts

The best closure supplements were:

- Redmond `Traffic/Alerts` ArcGIS REST
- King County road-alert ArcGIS services
- WSDOT Highway Alerts for state-highway crossing context

## Verified landscape

### Best official current/forecast flood sources

- `USGS-01` gives the strongest direct observed route-end signal.
- `USGS-02` gives upstream lead time that the City of Issaquah explicitly uses.
- `NWPS-01` adds official action/minor/moderate/major categories plus forecast data.
- `NWS-01` covers official flood alerts at regional scale.
- `ISS-01` explains how the city operationalizes Hobart stages into local phases.

### Useful but weaker sources

- `USGS-03` Lake Sammamish is real and useful, but no official trail-impact threshold was found.
- `REDM-01` is excellent for confirmed traffic impacts around Redmond and West Lake Sammamish Parkway.
- `WSDOT-01` is relevant only for state-highway crossings and detours, not for the trail itself.

### Sources investigated and rejected

- County app backend (`KCF-02`) for being undocumented and key-bound.
- Nearby but unusable USGS IV probes (`USGS-04`, `USGS-05`, `USGS-06`) because the tested responses contained no live series.
- Bellevue, Sammamish, Seattle/SPU, and alert sign-up pages because they were guidance or notification channels rather than public feeds.
- Ecology flood maps as a live connector because they are static planning tools.

## Route/segment conclusions

- The **Issaquah end of the route** has the strongest flood-monitoring coverage by far.
- The **Lake Sammamish shoreline** has good contextual lake-level coverage but weak official trail-inundation thresholds.
- The **Sammamish River / Marymoor middle corridor** remains the biggest gap because no verified live official river gauge for that trail section made the final tested source set.

## Coverage gaps

1. No direct verified live Sammamish River gauge in the final runtime set.
2. No official East Lake Sammamish Trail inundation threshold.
3. No convincing municipal machine-readable flood feed for Bellevue or Sammamish.
4. No supported King County public API contract for the flood app.

## Research conclusion

The route can be monitored honestly and effectively for flood risk now, but the connector should be explicit about what it knows:

- official observed water,
- official forecast categories,
- official flood alerts,
- confirmed closures from shared closure sources,

and what it does not know:

- a universal trail-flood threshold for every low-lying segment.
