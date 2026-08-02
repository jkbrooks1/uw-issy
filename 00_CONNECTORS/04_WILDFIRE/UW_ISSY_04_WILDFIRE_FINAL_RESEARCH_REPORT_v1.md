# UW_ISSY_04_WILDFIRE_FINAL_RESEARCH_REPORT_v1

## Scope and route

This report covers source discovery, live testing, classification, route-relevance design, and implementation planning for wildfire-related monitoring along the University of Washington -> Burke-Gilman Trail -> Sammamish River Trail -> Marymoor Park -> East Lake Sammamish Trail -> Issaquah route.

No production workflow, deployment, or scheduled job was created.

Route facts reused from the corrected canonical GPX and completed project deliverables:

- distance: `33.83 miles`
- bbox: `47.55207-47.75889 / -122.3057 to -122.04414`

## Verified source landscape

### Best active incident point source

`NIFC-01` WFIGS Current Wildland Fire Locations

- official
- machine-readable
- incident type field present
- timestamps present
- coordinates present
- live Washington wildfire examples verified on July 29, 2026

### Best active perimeter source

`NIFC-02` WFIGS Current Interagency Fire Perimeters

- official
- machine-readable
- current Washington perimeter count verified on July 29, 2026
- best tested source for perimeter-route intersection logic

### Best fire-weather warning source

`NWS-01` NWS active alerts API

- correct home for Red Flag Warnings and Fire Weather Watches
- route fire zones already known from prior work: `WAZ654` and `WAZ657`
- healthy live responses verified even with zero active route alerts

### Best smoke geometry source

`NOAA-01` NOAA HMS smoke polygons

- current dated KML and shapefile files verified on July 29, 2026
- strong public archive
- suitable for polygon-route smoke relevance

### Best official burn-restriction source

`KC-01` King County Fire Safety Burn Bans

- live current Stage 1 status verified
- strongest route-wide county burn-ban source tested

## Verified secondary sources

- `DNR-01` current DNR fire statistics
- `DNR-02` wildfire danger / burn-ban polygons
- `EFR-01` Eastside Fire & Rescue burn restriction alert
- `INCIWEB-01` InciWeb RSS
- `KC-TRAIL-01` King County ELST page for fire-caused closure fallback
- `SEA-TRAIL-01` Seattle Burke-Gilman pages for fire-caused closure fallback

## Rejected or unresolved sources

- `DNR-03` Wildfire Portal Experience: useful official dashboard, wrong automation primitive
- `NASA-01` FIRMS: promising, but credential-blocked in this cycle
- `KC-02` ALERT King County: official signup system, not a public feed
- `WAEMD-01`: official guidance hub, not a data feed
- `WSPARKS-01`: official and current, but not route-owner-relevant
- `PULSEPOINT-01`: too noisy for an urban / suburban wildfire route monitor

## Route-relevance findings

The most important route-relevance conclusion from live testing was negative:

- county-only matching is not safe

Evidence:

- `DNR-01` returned `5` King County current-fire records on July 29, 2026
- `DNR-01` route-bbox query returned `0`

So the connector must use:

- point-to-route distance for incidents
- polygon-to-route intersection for perimeters and smoke
- zone / UGC matching for NWS fire-weather alerts
- named trail / route-owner closure confirmation for fire-caused closures

## Coverage gaps

The biggest unresolved gap is evacuation automation.

Official evacuation systems are real, but this cycle did not find a public unattended feed for the route corridor. That limitation should be documented honestly rather than hidden behind a weak pseudo-source.

## Conclusion

The route now has a credible official wildfire monitoring stack for:

- active wildfire points
- active wildfire perimeters
- smoke extent
- Red Flag Warnings / Fire Weather Watches
- county burn restrictions

The source landscape is strong enough to proceed to implementation planning and prototype normalization. The remaining hard gap is public unattended evacuation data, not wildfire detection.
