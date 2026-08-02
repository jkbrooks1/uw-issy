# UW_ISSY_03_AIR_QUALITY_IMPLEMENTATION_RECOMMENDATION_v1

Prepared: July 29, 2026

## MVP recommendation

Ship the first version with:

- `ECO-01` — current official route-near monitor observations
- `ECO-02` — official smoke forecast polygons
- `PSCAA-02` — burn-ban status

This is the minimum credible official set that covers current conditions,
forecast/outlook, and burn-ban status without credentials.

## Preferred production recommendation

Add:

- `AIRNOW-02` for public/national fallback
- `WASMOKE-01` for official smoke-outlook explanation
- `NWS-AQ-01` for formal air-quality alerts
- optionally `PSCAA-01` if the implementation is willing to manage a cookie
  bootstrap flow
- optionally `AIRNOW-01` if an AirNow API key is obtained

## Route-point recommendation

Do not treat the route as one AQ point.

Preferred production design:

1. Seattle-NE 127th
2. Lake Forest Park-Town Center
3. Bellevue-SE 12th
4. Issaquah-Lake Sammamish

Compressed MVP fallback:

1. north/west route
2. eastside mid-corridor
3. south / Issaquah

## Operational rules

- current status comes from `ECO-01`
- outlook comes from `ECO-02`
- formal alerts come from `NWS-AQ-01`
- burn-ban status comes from `PSCAA-02`
- smoke attribution/context comes from `WASMOKE-01`
- AirNow is fallback / cross-check, not the primary route segment engine

## Freshness rules

- observations stale after `90 minutes`
- smoke forecast stale after `12 hours`
- burn-ban page stale after `24 hours`
- NWS alert feed stale after `15 minutes`

## Failure and fallback

- preserve last-known-good data per source
- publish degraded output rather than empty output when one source fails
- if `ECO-01` fails, keep stale last-known-good and optionally cross-check
  `AIRNOW-02`
- if `ECO-02` fails, keep stale last-known-good and supplement with
  `WASMOKE-01`
- if `PSCAA-02` fails, mark burn-ban state as `unknown` and preserve the last
  known value

## Risks that should be called out before implementation

1. PM10 is not guaranteed at every route-near official monitor.
2. PSCAA’s rich detail endpoint is session-backed and more brittle than
   Ecology’s plain REST queries.
3. AirNow’s public files are too coarse to replace route-local monitor logic.
4. Ecology should be re-tested once from the future production host for TLS
   sanity, even though the service itself is clearly live.

## Next step

Build a fetch-only prototype against the MVP set and validate it against the
normalized schema proposed in `NORMALIZED_SCHEMA_PROPOSAL.md` before adding any
secondary enrichment layers.
