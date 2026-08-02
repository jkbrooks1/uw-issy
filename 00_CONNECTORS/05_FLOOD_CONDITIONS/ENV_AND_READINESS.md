# ENV_AND_READINESS.md — 05_FLOOD_CONDITIONS

Environment inspection was performed by name only. No secret values are reproduced below.

## Authentication variables

| Source | Variable name | Secret type | Required or optional | Where to obtain it | Existing variable name present | Testing completed without it | Limitations without credential |
| --- | --- | --- | --- | --- | --- | --- | --- |
| WSDOT-01 | WSDOT_TRAVELER_API_ACCESS_CODE | token | Optional | WSDOT Traveler Information API registration page | yes | no | Only documentation and unauthenticated help pages are reachable; live alerts cannot be queried. |
| KCF-02 | KING_COUNTY_FLOODWARNING_SUBSCRIPTION_KEY | API key | Not recommended | No public issuance path documented. The public web app ships an embedded APIM key, which should not be mirrored into project configuration. | no | n/a | Treat the public app as a webpage, not as a supported API contract. |

## Readiness scoring

| Source | Authority | Route relevance | Freshness | Reliability | Machine readability | Implementation effort | Maintenance burden | Historical stability | Licensing clarity | Outage resilience | Readiness |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| USGS-01 | 5 | 5 | 5 | 5 | 5 | 4 | 4 | 5 | 4 | 4 | ready_now |
| USGS-02 | 5 | 4 | 5 | 5 | 5 | 4 | 4 | 5 | 4 | 4 | ready_now |
| USGS-03 | 5 | 3 | 5 | 5 | 5 | 4 | 4 | 5 | 4 | 4 | ready_now |
| NWPS-01 | 5 | 5 | 5 | 5 | 5 | 4 | 4 | 5 | 4 | 4 | ready_now |
| NWPS-02 | 5 | 4 | 5 | 5 | 5 | 4 | 4 | 5 | 4 | 4 | ready_now |
| NWS-01 | 5 | 4 | 5 | 5 | 5 | 4 | 4 | 5 | 4 | 4 | ready_now |
| ISS-01 | 5 | 5 | 3 | 4 | 2 | 2 | 2 | 4 | 4 | 3 | ready_with_scraper |
| REDM-01 | 4 | 4 | 4 | 4 | 5 | 4 | 4 | 4 | 4 | 3 | ready_now |
| KC-ROAD-01 | 4 | 2 | 4 | 4 | 5 | 4 | 4 | 4 | 4 | 3 | ready_now |
| KC-ROAD-02 | 4 | 3 | 1 | 1 | 5 | 4 | 4 | 2 | 4 | 3 | needs_more_research |
| WSDOT-01 | 5 | 2 | 4 | 4 | 5 | 3 | 4 | 4 | 4 | 4 | ready_with_credentials |

## Confidence notes

- `USGS-01`: Best direct observed route-end signal. Distance to route end is about 264 m and both stage and flow are populated.
- `USGS-02`: Upstream lead-time source endorsed by the City of Issaquah, but not physically on-route and not an official NWS forecast point.
- `USGS-03`: Useful shoreline context for East Lake Sammamish Trail and Lake Sammamish State Park, but no official flood threshold was found.
- `NWPS-01`: Best official forecast and category source for the route end because it provides action/minor/moderate/major thresholds plus forecast hydrograph data.
- `NWPS-02`: Observed-only companion to Hobart. Valuable for corroboration, but no forecast and no defined flood categories.
- `NWS-01`: Best official regional alert layer for Flood Watch, Flood Warning, Flash Flood Warning, and Flood Advisory. Geometry and CAP metadata support deterministic route filtering.
- `ISS-01`: The best official explanation of Issaquah-specific phase semantics and lead-time. Use it as a policy/configuration source and occasional corroboration, not as the primary live data feed.
- `REDM-01`: Excellent closure supplement around West Lake Sammamish Parkway and NE 24th, but it is not flood-specific and must never be used as a proxy for hydrologic severity.
- `KC-ROAD-01`: Technically strong, geographically weak for this corridor because the route is mostly in incorporated cities.
- `KC-ROAD-02`: The schema is real, but the only available Sammamish records were 2014 test entries. Do not rely on it until live content is observed.
- `WSDOT-01`: Now fully testable in this project because the access-code name is already present, but flood relevance is limited to highway crossing closures rather than the trail itself.
