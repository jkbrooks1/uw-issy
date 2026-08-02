# 02_WEATHER — As Built

**n8n workflow:** `v0001.02_WeatherConnector`, id `fA0ZjWH3Itl83aPC`, 40 nodes, `active: false`.
**Status:** Live-verified — real NWS data fetched, normalized, and published.

## Sources (6, all api.weather.gov)

| Source | Fetches |
|---|---|
| NWS-01 | Points metadata (resolves route points to forecast grid cells) |
| NWS-02 | 7-day / 12-hour forecast |
| NWS-03 | Hourly forecast |
| NWS-04 | Raw grid forecast data |
| NWS-05 | Nearby station observations (stations: SEAW1, KBFI, KRNT, KPAE) |
| NWS-06 | Active alerts (county, and 3 zone codes covering the route) |

Each source issues multiple real HTTP calls per run (one per route waypoint/station/zone, not one call total) — implemented as a Code node using `this.helpers.httpRequest`, not the native HTTP Request node, because the fan-out logic (loop over N waypoints, branch by source type) doesn't fit a single static HTTP Request node.

## Output

`published/02_WEATHER/current.json` → pointer → real content at `published/02_WEATHER/02_WEATHER_published_<stamp>.json`.

## Known limitations / notable fixes

- Originally used browser-only `fetch()`, which doesn't exist in this n8n instance's Code-node sandbox — replaced with `this.helpers.httpRequest` (see `00_PROJECT_BUILDLOG.md` for the fix and the exact n8n source citation used to verify the correct helper signature).
- Had a malformed connection graph (multiple output branches on a single-output node) and a `Parse Last Known Good` node that incorrectly had outgoing connections — both fixed; `Parse Last Known Good` is now correctly terminal, referenced only via `$()` expressions, matching the proven connector-01 pattern.
