# UW–Issaquah Route Monitor — Project Rules

## Project identity

This is a separate project from every BikeTourFrance France-route monitoring dashboard.

Project root:

`/Users/jkbrookspersonal/LocalSiteBuildFiles/BTF_UW-Issy_Route_Monitor`

## Canonical route

The canonical route source is:

`data/route/UnivWA-Issaquah.gpx`

Derived route assets must be reproducible from the canonical GPX.

## Workstreams

1. `01_ROUTE_CONDITIONS`
2. `02_WEATHER`
3. `03_AIR_QUALITY`
4. `04_WILDFIRE`
5. `05_FLOOD_CONDITIONS`
6. `06_TRAIL_INFRASTRUCTURE_STATUS`
7. `07_GOVERNMENT_SAFETY_ALERTS`

## Build-log rule

Every material execution, structural change, connector change, workflow change, test, build, or deployment must be recorded in:

`00_PROJECT_BUILDLOG.md`

## Source rule

Use official public sources whenever available. Each source must be documented with:

- owning agency
- source URL or endpoint
- access method
- geographic scope
- route-section relevance
- refresh frequency
- freshness rule
- failure behavior
- manual-review requirements

## Route-impact rule

Events must be distinguished as:

- confirmed route impact
- possible route impact
- nearby but not route-impacting
- irrelevant

## Output rule

Production outputs must use atomic writes and preserve the last known good output when a connector fails.

## Project-separation rule

Do not copy or reuse:

- French API endpoints
- French credentials
- department codes
- AASQA mappings
- Météo-France assumptions
- VNF canal assumptions
- Vigicrues station mappings
- prefecture sources
- Bordeaux-to-Sète route mappings
