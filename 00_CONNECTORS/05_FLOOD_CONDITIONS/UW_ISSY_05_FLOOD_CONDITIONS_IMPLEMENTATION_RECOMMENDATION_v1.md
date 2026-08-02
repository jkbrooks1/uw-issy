# UW_ISSY_05_FLOOD_CONDITIONS_IMPLEMENTATION_RECOMMENDATION_v1

## Recommended build target

Start with a compact MVP using:

- `USGS-01`
- `USGS-02`
- `NWPS-01`
- `NWS-01`
- `ISS-01`

Add these after the base logic is stable:

- `USGS-03`
- `REDM-01`
- `KC-ROAD-01`
- `WSDOT-01`

## Runtime logic

Use source roles, not one blended bucket:

- **Observed water:** `USGS-01`, `USGS-02`
- **Forecast/category:** `NWPS-01`
- **Official alerts:** `NWS-01`
- **Local semantics:** `ISS-01`
- **Closure truth:** shared route-condition sources

## Severity model

- `elevated_water`
- `advisory`
- `watch`
- `warning`
- `observed_flooding`
- `forecast_flooding`
- `confirmed_route_closure`
- `probable_route_impact`
- `no_known_route_impact`

## Threshold model

Use official thresholds where they exist:

- Hobart local phases from `ISS-01`
- flow categories from `NWPS-01`

Use derived heuristics only for Lake Sammamish context, and never treat them as official flood stages.

## Failure and fallback

- Preserve last known good per source.
- Surface per-source health.
- Never claim “clear” when a primary source is stale or failed.
- If the closure supplements fail, keep hydrologic monitoring active but downgrade closure confidence.

## Main risks

1. The route middle lacks a strong direct river gauge.
2. Lake Sammamish trail-impact thresholds are not officially published.
3. The King County app backend is tempting but unsupported.

## Next step

Implement only the normalized fetch/parse/classify flow for the MVP set first, then run a dedicated follow-up cycle on middle-corridor flood proxies and shared closure integration.
