# ENV_AND_READINESS.md — 03_AIR_QUALITY

## Environment-variable scan result

I inspected project files and environment-variable names only. I did not print,
copy, or log any secret values in any deliverable.

Result:

- no existing `AIRNOW_API_KEY` variable name was found
- no connector in this lane requires a username/password or OAuth client pair
  based on the sources recommended here

## Recommended environment variables

| Source | Variable name | Secret type | Required or optional | Where to obtain it | Existing variable name present? | Testing completed without it? | Limitation without credential |
|---|---|---|---|---|---|---|---|
| `AIRNOW-01` | `AIRNOW_API_KEY` | API key | Optional | Request an account / key through AirNow API docs | No | Yes | No access to AirNow web services; must rely on `AIRNOW-02` file products instead |

## Readiness scoring

Scoring: `1` low / weak / hard, `5` high / strong / easy.

### `ECO-01`

| Metric | Score |
|---|---|
| Authority | 5 |
| Route relevance | 5 |
| Freshness | 5 |
| Reliability | 4 |
| Machine readability | 5 |
| Implementation effort | 4 |
| Maintenance burden | 4 |
| Historical stability | 4 |
| Licensing clarity | 4 |
| Outage resilience | 4 |

Readiness level: `ready_now`

Notes: Best current source in the lane. The only caution is environment-specific
TLS behavior observed between local clients; re-test once on the actual target
host before production.

### `ECO-02`

| Metric | Score |
|---|---|
| Authority | 5 |
| Route relevance | 5 |
| Freshness | 4 |
| Reliability | 4 |
| Machine readability | 5 |
| Implementation effort | 4 |
| Maintenance burden | 4 |
| Historical stability | 4 |
| Licensing clarity | 4 |
| Outage resilience | 4 |

Readiness level: `ready_now`

Notes: Best official smoke-outlook source. Strong geometry and clean semantics.

### `AIRNOW-01`

| Metric | Score |
|---|---|
| Authority | 5 |
| Route relevance | 2 |
| Freshness | 4 |
| Reliability | 4 |
| Machine readability | 4 |
| Implementation effort | 3 |
| Maintenance burden | 3 |
| Historical stability | 4 |
| Licensing clarity | 4 |
| Outage resilience | 4 |

Readiness level: `ready_with_credentials`

Notes: Credible and useful, but not worth blocking the MVP on because Ecology is
better for this specific route. Low route relevance score is about reporting-area
coarseness, not source quality.

### `AIRNOW-02`

| Metric | Score |
|---|---|
| Authority | 5 |
| Route relevance | 2 |
| Freshness | 4 |
| Reliability | 5 |
| Machine readability | 4 |
| Implementation effort | 5 |
| Maintenance burden | 5 |
| Historical stability | 5 |
| Licensing clarity | 4 |
| Outage resilience | 5 |

Readiness level: `ready_now`

Notes: Easiest AirNow path and a strong fallback, but too coarse for primary
route segmentation.

### `PSCAA-01`

| Metric | Score |
|---|---|
| Authority | 5 |
| Route relevance | 4 |
| Freshness | 4 |
| Reliability | 3 |
| Machine readability | 3 |
| Implementation effort | 2 |
| Maintenance burden | 2 |
| Historical stability | 3 |
| Licensing clarity | 3 |
| Outage resilience | 3 |

Readiness level: `ready_with_scraper`

Notes: Real and useful, but session bootstrap turns a simple GET into a stateful
interaction. Good secondary layer, not the cleanest first implementation.

### `PSCAA-02`

| Metric | Score |
|---|---|
| Authority | 5 |
| Route relevance | 4 |
| Freshness | 3 |
| Reliability | 4 |
| Machine readability | 2 |
| Implementation effort | 3 |
| Maintenance burden | 3 |
| Historical stability | 4 |
| Licensing clarity | 4 |
| Outage resilience | 4 |

Readiness level: `ready_with_scraper`

Notes: Official and directly relevant, but webpage-backed instead of feed-backed.

### `PSCAA-03`

| Metric | Score |
|---|---|
| Authority | 4 |
| Route relevance | 4 |
| Freshness | 4 |
| Reliability | 3 |
| Machine readability | 1 |
| Implementation effort | 1 |
| Maintenance burden | 2 |
| Historical stability | 2 |
| Licensing clarity | 3 |
| Outage resilience | 3 |

Readiness level: `needs_more_research`

Notes: The official-corrected low-cost-sensor concept is strong, but the
machine-readable access path is still unresolved. Do not promote it to MVP.

### `WASMOKE-01`

| Metric | Score |
|---|---|
| Authority | 4 |
| Route relevance | 3 |
| Freshness | 4 |
| Reliability | 4 |
| Machine readability | 4 |
| Implementation effort | 5 |
| Maintenance burden | 5 |
| Historical stability | 4 |
| Licensing clarity | 4 |
| Outage resilience | 4 |

Readiness level: `ready_now`

Notes: Best official prose smoke-outlook feed. It is intentionally secondary
because it is narrative, not geometry-first.

### `NWS-AQ-01`

| Metric | Score |
|---|---|
| Authority | 4 |
| Route relevance | 3 |
| Freshness | 5 |
| Reliability | 5 |
| Machine readability | 5 |
| Implementation effort | 5 |
| Maintenance burden | 5 |
| Historical stability | 5 |
| Licensing clarity | 4 |
| Outage resilience | 4 |

Readiness level: `ready_now`

Notes: Excellent alert feed. It is secondary because not every degraded air day
produces a formal alert.

### `KC-PH-01`

| Metric | Score |
|---|---|
| Authority | 4 |
| Route relevance | 2 |
| Freshness | 2 |
| Reliability | 4 |
| Machine readability | 1 |
| Implementation effort | 1 |
| Maintenance burden | 1 |
| Historical stability | 3 |
| Licensing clarity | 4 |
| Outage resilience | 4 |

Readiness level: `not_recommended`

Notes: Good reference copy, poor connector.

### `SEA-PH-01`

| Metric | Score |
|---|---|
| Authority | 4 |
| Route relevance | 1 |
| Freshness | 2 |
| Reliability | 4 |
| Machine readability | 1 |
| Implementation effort | 1 |
| Maintenance burden | 1 |
| Historical stability | 3 |
| Licensing clarity | 4 |
| Outage resilience | 4 |

Readiness level: `not_recommended`

Notes: Same issue as `KC-PH-01`, plus narrower geographic scope.

## Overall readiness conclusion

The workstream is implementable now without credentials.

Best near-term path:

- primary: `ECO-01`, `ECO-02`
- supplemental: `PSCAA-02`, `WASMOKE-01`, `NWS-AQ-01`
- optional later enhancement: `AIRNOW-01`, `PSCAA-01`

The only credential worth introducing at this stage is `AIRNOW_API_KEY`, and it
is optional rather than required.
