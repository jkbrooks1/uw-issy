# ENV_AND_READINESS.md — 04_WILDFIRE

## Existing project naming pattern check

The project and current shell environment show an existing uppercase underscore naming style for credentials. A directly relevant existing variable name was found by name only:

- `WSDOT_TRAVELER_API_ACCESS_CODE`

No wildfire-specific credential variable name for NASA FIRMS appeared to already be present by name in this environment.

## Authentication variables

Only one researched wildfire source actually needs a credential for the recommended roadmap.

| Source | Variable name | Secret type | Required or optional | Where to obtain it | Name already appears present? | Testing completed without it? | Limitations without credential |
|---|---|---|---|---|---|---|---|
| `NASA-01` FIRMS | `NASA_FIRMS_MAP_KEY` | API key | Optional for MVP, required to enable FIRMS | Request a free MAP_KEY from NASA FIRMS / EOSDIS | No | Partially | Area API returns `400 Invalid MAP_KEY.` and live hotspot data cannot be tested or used |

## Readiness scoring

Scoring scale:

- `5` = strongest
- `1` = weakest / highest burden

Readiness values:

- `ready_now`
- `ready_with_credentials`
- `ready_with_scraper`
- `needs_more_research`
- `not_recommended`

| Source ID | Authority | Route relevance | Freshness | Reliability | Machine readability | Implementation effort | Maintenance burden | Historical stability | Licensing clarity | Outage resilience | Readiness |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| `NIFC-01` | 5 | 4 | 5 | 4 | 5 | 3 | 3 | 4 | 5 | 4 | `ready_now` |
| `NIFC-02` | 5 | 5 | 5 | 4 | 5 | 3 | 3 | 4 | 5 | 4 | `ready_now` |
| `NWS-01` | 5 | 5 | 5 | 5 | 5 | 2 | 2 | 5 | 5 | 5 | `ready_now` |
| `NOAA-01` | 5 | 4 | 4 | 4 | 4 | 3 | 3 | 5 | 5 | 4 | `ready_now` |
| `KC-01` | 5 | 4 | 3 | 4 | 2 | 3 | 3 | 4 | 5 | 3 | `ready_with_scraper` |
| `DNR-01` | 5 | 3 | 4 | 4 | 5 | 3 | 3 | 4 | 5 | 4 | `ready_now` |
| `DNR-02` | 5 | 3 | 3 | 4 | 5 | 2 | 2 | 4 | 5 | 4 | `ready_now` |
| `EFR-01` | 4 | 3 | 3 | 3 | 2 | 3 | 3 | 3 | 4 | 3 | `ready_with_scraper` |
| `INCIWEB-01` | 4 | 3 | 4 | 4 | 3 | 3 | 3 | 4 | 4 | 4 | `ready_now` |
| `NASA-01` | 5 | 4 | 5 | 3 | 5 | 4 | 4 | 5 | 4 | 3 | `ready_with_credentials` |
| `KC-TRAIL-01` | 5 | 4 | 3 | 4 | 2 | 3 | 3 | 4 | 5 | 3 | `ready_with_scraper` |
| `SEA-TRAIL-01` | 5 | 3 | 3 | 2 | 1 | 4 | 4 | 3 | 5 | 2 | `needs_more_research` |

## Confidence notes for medium- or low-confidence recommendations

### `KC-01`

Medium confidence. The page is authoritative and live, but it is still HTML-only and its legal scope is unincorporated King County rather than the entire mostly incorporated route.

### `EFR-01`

Medium confidence. It is route-relevant for Sammamish and Issaquah, but it is not route-wide and no working public feed was confirmed beyond the HTML alert surfaces.

### `NOAA-01`

Medium confidence for public rider messaging, high confidence for smoke geometry. The files are strong, but they are a smoke-extent product, not a health-clearance product.

### `NASA-01`

Low current confidence only because live data access was blocked by the missing key. The source itself is real and documented, but this project has not yet proven a usable production query path.

### `SEA-TRAIL-01`

Low-to-medium confidence. The page family is official, but the direct fetches still returned shell-heavy HTML and this makes unattended extraction fragile until a browser-rendered or DOM-inspected pass is done.
