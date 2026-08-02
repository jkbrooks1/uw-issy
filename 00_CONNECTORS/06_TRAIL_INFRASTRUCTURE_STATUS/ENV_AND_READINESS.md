# ENV_AND_READINESS.md

## Credential review

Most viable lane-06 sources are public and unauthenticated. Only one relevant candidate in this research pass clearly benefits from a credential.

| Source | Variable name | Secret type | Required or optional | Where to obtain it | Variable name appears present now | Testing completed without it | Limitation without credential |
|---|---|---|---|---|---|---|---|
| WSDOT traveler / bridge-opening APIs | `WSDOT_TRAVELER_API_ACCESS_CODE` | token / access code | Optional for this lane, required only if WSDOT bridge-opening or other traveler APIs are later used | WSDOT Traveler Information API signup page | Yes | Yes | Live WSDOT traveler payloads were not confirmed for this lane; docs were reachable but the route does not justify the source today |

## Existing environment-variable name check

Names only, no values were printed. Relevant finding:

- `WSDOT_TRAVELER_API_ACCESS_CODE` already appears to exist in the current environment by name

## Readiness scoring

Scoring scale:

- `5` = strong
- `1` = weak

Recommended connector-level candidates only are scored below.

| Source ID | Authority | Route relevance | Freshness | Reliability | Machine readability | Implementation effort | Maintenance burden | Historical stability | Licensing clarity | Outage resilience | Overall readiness |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| KC-01 | 5 | 4 | 3 | 4 | 2 | 3 | 3 | 4 | 4 | 4 | `ready_with_scraper` |
| KC-02 | 5 | 4 | 3 | 4 | 2 | 3 | 3 | 4 | 4 | 4 | `ready_with_scraper` |
| KC-03 | 5 | 5 | 4 | 4 | 2 | 3 | 3 | 4 | 4 | 4 | `ready_with_scraper` |
| SAM-02 | 4 | 5 | 4 | 4 | 2 | 3 | 3 | 3 | 4 | 4 | `ready_with_scraper` |
| ISS-01 | 5 | 5 | 4 | 5 | 5 | 2 | 2 | 4 | 4 | 5 | `ready_now` |
| SAM-01 | 4 | 4 | 2 | 4 | 2 | 3 | 3 | 4 | 4 | 4 | `needs_more_research` |
| REDM-01 | 5 | 3 | 4 | 5 | 5 | 2 | 2 | 4 | 4 | 5 | `needs_more_research` |
| KC-04 | 5 | 3 | 2 | 5 | 5 | 2 | 2 | 4 | 4 | 5 | `needs_more_research` |

## Confidence notes

### KC-01 / KC-02 / KC-03

Medium confidence operationally, high confidence institutionally.

- These are official owner pages and are clearly route-relevant.
- They are still HTML pages without stable event IDs or machine-readable alert records.
- They are suitable for production only with whole-page or section-level diffing and clear stale-data handling.

### SAM-02

Medium confidence.

- The source is operationally valuable right now because it directly names the active George Davis closure mechanics.
- It is still a news/article page, not a structured feed.

### ISS-01

High confidence.

- This is the cleanest lane-06 source found in the entire session.
- It is public, structured, geometry-capable, and directly route-relevant.

### SAM-01

Medium-to-low confidence as a monitoring source.

- It is excellent context for a known project.
- It is less clearly an ongoing alert/update channel than SAM-02.

### REDM-01

Medium confidence.

- The service quality is strong.
- The semantic fit is weak unless future alerts explicitly touch drainage, shoreline, culverts, or crossings near the route.

### KC-04

Low confidence as a public-status source, medium confidence as a facility-reference source.

- The data are clean.
- The data are not a live status feed.

## Recommended readiness summary

- Build first against `ISS-01`, `KC-03`, and `SAM-02`.
- Add `KC-01` and `KC-02` once the scraper/diff pattern is proven.
- Treat `SAM-01`, `REDM-01`, and `KC-04` as supplementary, not first-wave production dependencies.
