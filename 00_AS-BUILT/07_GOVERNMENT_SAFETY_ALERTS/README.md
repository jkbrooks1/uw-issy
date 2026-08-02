# 07_GOVERNMENT_SAFETY_ALERTS — As Built

**n8n workflow:** `v0001.07_GovernmentSafetyAlertsConnector`, id `08g3JNwQPVSxUl2H`, 48 nodes, `active: false`.
**Status:** Live-verified — real published artifact, clean `data_status: ok`.

## Sources (8)

| Source | Fetches |
|---|---|
| NWS-01 | NWS active alerts near the route |
| SEA-01 | City of Seattle alerts (WordPress REST API) |
| UW-01 | UW emergency management alerts (WordPress REST API) |
| SEAFD-01 | Seattle Fire Department incident feed |
| SEAPD-01 | Seattle Police blotter feed |
| DOH-02 | WA Dept of Health alert network |
| ST-01 | Sound Transit service alerts |
| KCMETRO-01 | King County Metro service alerts |

## Output

`published/07_GOVERNMENT_SAFETY_ALERTS/current.json` → pointer → real content at `published/07_GOVERNMENT_SAFETY_ALERTS/07_GOVERNMENT_SAFETY_ALERTS_published_<stamp>.json`.

## Known limitations / notable fixes

- `Aggregate Normalized Branches` never set `output_root`, `run_stamp`, or `metadata` at all — every downstream file path literally contained the string `"undefined"`. Fixed by adding all three.
- 8 copies of a `firstTimestamp()` date-parsing helper called `.toISOString()` on a possibly-invalid date without checking first; `.toISOString()` throws on an invalid date rather than returning a sentinel, so the intended fallback logic never ran. Fixed to check validity first.
- Uses its own route-relevance vocabulary (`confirmed_route_relevant`, not `confirmed_route_impact` like lanes 01/02/06) plus a separate `route_impact` field — see the cross-lane note in `00_AS-BUILT/README.md`.
