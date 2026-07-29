# UW–Issaquah Route Conditions Dashboard

Route-monitoring dashboard for the University of Washington to Issaquah cycling route using:

- Burke-Gilman Trail
- Sammamish River Trail
- East Lake Sammamish Trail

## Project root

`/Users/jkbrookspersonal/LocalSiteBuildFiles/BTF_UW-Issy_Route_Monitor`

## Canonical route source

`data/route/UnivWA-Issaquah.gpx`

## Monitoring workstreams

1. `01_ROUTE_CONDITIONS`
2. `02_WEATHER`
3. `03_AIR_QUALITY`
4. `04_WILDFIRE`
5. `05_FLOOD_CONDITIONS`
6. `06_TRAIL_INFRASTRUCTURE_STATUS`
7. `07_GOVERNMENT_SAFETY_ALERTS`

## Architecture principle

Reuse the proven CDM Status Map architecture, workflow discipline, normalized schemas, route-corridor filtering, source-health reporting, testing, build, and deployment patterns.

Do not reuse France-specific connectors, credentials, geography, department codes, station mappings, or production data.
