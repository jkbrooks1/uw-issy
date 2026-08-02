# UW–Issaquah Route Monitor — As-Built System Reference

**Last updated:** 2026-08-02 PDT
**Status:** All 9 workflows built, imported into n8n, and independently live-verified against real data sources. All 9 remain `active: false` — nothing runs on a schedule yet.

This is the accurate, current record of what is actually running, replacing the pre-build `EXECUTABLE_BUILD_SPECIFICATION` docs (which describe original intent, not final implementation — real bugs found during live qualification changed real behavior in ways those specs don't reflect). For the full history of what broke and how it was fixed, see `00_PROJECT_BUILDLOG.md`. This doc is the reference; that log is the story.

## System shape

Nine n8n workflows, one Hetzner-hosted n8n instance (`https://n8n.biketourfrance.net`), no shared code — each workflow is fully self-contained (own copies of helper functions, own file I/O), by design, matching the pattern proven on connector 01.

```
7 source connectors (01–07)          workflow 08                workflow 09
  each: fetch → normalize   ──write──▶  Status Publisher  ──read──▶  Alert Monitor
  → validate → publish                 (aggregate + roll up)        (diff + email)
  to its own lane directory            → public/status.json         → emails new events only
```

Connectors 01–07 do not know about 08 or 09. 08 and 09 both read the connectors' own published output directly and independently of each other — a bug in one cannot silently break the other.

## The 9 workflows

| # | Name | n8n workflow ID | Nodes | Sources |
|---|---|---|---|---|
| 01 | Route Conditions | `RR7cLSV9oGngrJdA` | 32 | 4 |
| 02 | Weather | `fA0ZjWH3Itl83aPC` | 40 | 6 |
| 03 | Air Quality | `qlM2XIv2BbFSh3in` | 48 | 8 |
| 04 | Wildfire | `w6xnelPQeRFZk8BG` | 36 | 5 |
| 05 | Flood Conditions | `4RiNqOKD9BCZFH6P` | 56 | 10 |
| 06 | Trail Infrastructure Status | `poGV37VLUGIUxfGK` | 48 | 8 |
| 07 | Government Safety Alerts | `08g3JNwQPVSxUl2H` | 48 | 8 |
| 08 | Status Publisher | `gp8WlccGwLydNWG7` | 36 | reads 01–07 |
| 09 | Alert Monitor | `KhbGg5gBn7Rbne68` | 41 | reads 01–07 + own state |

Per-lane sources, URLs, and known limitations are in each `00_AS-BUILT/0X_*/README.md`.

## Runtime paths (live server, inside the n8n container)

All under `/files/uw-issy-connectors/`:

| Tier | Written by | Contents |
|---|---|---|
| `raw/<LANE>/landings/` | connectors 01–07 | one file per source per run, unmodified fetch response |
| `normalized/<LANE>/` | connectors 01–07 | per-run normalized intermediate |
| `candidate/<LANE>/` | connectors 01–07 | pre-validation candidate artifact |
| `published/<LANE>/` | connectors 01–07 | the real output — see pointer-file note below |
| `last_known_good/<LANE>/` | connectors 01–07 | most recent successful snapshot per source, served when a live fetch fails |
| `quarantine/<LANE>/` | connectors 01–07 | written only when validation fails; publication is suppressed that run |
| `health/`, `logs/`, `handoff/` | connectors 01–07 | supporting tiers, not typically needed by a dashboard |
| `public/status.json` | workflow 08 only | the single aggregated feed — **this is what a dashboard should read** |
| `alerts/last_alerted_state.json` | workflow 09 only | internal state, not dashboard-relevant |

The local repo mirrors this under `data/connectors/` with the same tier names.

### The pointer-file gotcha

`published/<LANE>/current.json` is **not** the real content — it's a small pointer:
```json
{ "run_id": "01_ROUTE_CONDITIONS-...-001", "artifact": "/files/uw-issy-connectors/published/01_ROUTE_CONDITIONS/01_ROUTE_CONDITIONS_published_<stamp>.json" }
```
The actual data lives at the path in `artifact`. This tripped up workflow 08's first build (silently aggregated nulls, no error) — any new consumer reading `published/<lane>/current.json` directly needs to follow this pointer, not treat it as the payload.

**You don't need to deal with this if you're building the dashboard**: workflow 08 already resolves it for all 7 lanes and writes the real, resolved content to `public/status.json`. Read that one file.

## Data contract: `public/status.json` (workflow 08's output — read this for the dashboard)

```json
{
  "schema_version": "1.0.0",
  "connector_id": "08_STATUS_PUBLISHER",
  "generated_at": "<ISO 8601 UTC>",
  "run_id": "08_STATUS_PUBLISHER-<stamp>-001",
  "overall": {
    "display_severity": "normal | watch | alert | unknown",
    "message": "<human-readable one-liner>"
  },
  "lanes": {
    "01_ROUTE_CONDITIONS": {
      "lane_label": "Route Conditions",
      "available": true,
      "display_severity": "normal | watch | alert | unknown",
      "data_status": "ok | degraded | stale | no_relevant_events | failed_validation | failed_fetch | blocked | using_last_known_good | null",
      "freshness": { "overall_state": "fresh | stale | unknown", "computed_at": "...", "stale_source_ids": [] },
      "published_at": "<ISO 8601 UTC or null>",
      "generated_at": "<ISO 8601 UTC or null>",
      "connector_health": { "status": "...", "used_last_known_good": true, "error_count": 0, "warning_count": 0, ... },
      "event_count": 1,
      "events": [ /* full lane-native event objects, verbatim — see per-lane docs for each lane's event shape */ ]
    },
    "02_WEATHER": { "...": "same shape" },
    "...": "...through 07_GOVERNMENT_SAFETY_ALERTS"
  },
  "severity_mapping_note": "display_severity is a workflow-08-only display tier; each lane's native data_status and events are preserved verbatim above."
}
```

**`display_severity` mapping** (workflow-08-only display tier, per architecture decision `DEC-009` — never overwrites each lane's own real `data_status`):
- `alert` — `data_status: blocked`
- `watch` — `data_status` is `degraded`, `stale`, `failed_fetch`, `using_last_known_good`, or `failed_validation`
- `normal` — `data_status` is `ok` or `no_relevant_events`
- `unknown` — the lane hasn't published anything yet (`available: false`)

`overall.display_severity` is the worst of all 7 lanes' `display_severity`.

**Important for a dashboard**: `events` arrays are lane-native and **not uniform across lanes**. Each lane has its own event schema — different field sets, different route-relevance vocabulary. There is no single shared "is this a confirmed closure" field across all 7 lanes today. If the dashboard needs to render event severity/impact consistently, either (a) render per-lane with lane-specific logic, or (b) treat this as a known gap to design around — see "Known gaps" below.

## Data contract: individual connector published envelope (deeper detail, if needed)

Each connector's real published file (after following the pointer) has this common shape — present in all 7 lanes, field names verified identical:

```
schema_version, connector_id, connector_name, connector_version, lane, run_id,
generated_at, published_at, data_status, freshness{}, manifest_ref{},
source_health[] (per-source status, retrieved_at, record_count, http_status, warnings, errors),
events[] (lane-native shape, see per-lane docs), connector_health{}, provenance{}
```

`source_health[].status` values: `ok`, `empty_but_valid`, `failed`, `using_last_known_good`.

## Data contract: alert email (workflow 09)

Plain-text email, subject `UW-Issy Route Alert: N new event(s)`, sent to `john@biketourfrance.net` only when `N > 0`. Body lists each new event as `[Lane Label] summary (severity: X)` plus detail. "New" means: an `event_id` (globally unique, lane-prefixed, e.g. `01_ROUTE_CONDITIONS:KC-03:hash_7f6bfcb8`) that wasn't already in `alerts/last_alerted_state.json` the last time this workflow ran. Not a route-impact-severity judgment — see "Known gaps."

## Known gaps (deliberate, documented — not oversights)

- **No public-facing site yet.** Workflow 08 writes `public/status.json` on the server; nothing serves it to a browser. The Cloudflare/deployment decision that would enable this remains open in `00_CONNECTORS/00_OPEN_CONNECTOR_ARCHITECTURE_DECISIONS.md`.
- **No uniform cross-lane route-impact field.** Confirmed during workflow 09's build: lane 01/02/06 use `event.route_relevance.classification` with value `confirmed_route_impact`; lane 07 uses a *different* value (`confirmed_route_relevant`) plus a separate `route_impact` field; lane 03 uses a boolean `event.route_relevant`; lane 04 uses a plain string with values like `route_wide`/`contextual_only` that don't map to "confirmed" at all; lane 05 has no relevance classification, only a match-confidence field. Workflow 09 deliberately avoids trying to unify these for its alert trigger (new `event_id` only). A dashboard wanting a single "is this actually route-impacting" flag per event will need to build a per-lane translation layer — there is no shortcut here without real per-lane judgment calls.
- **Nothing is scheduled.** All 9 workflows are `active: false`. Someone needs to decide and set real schedules before this runs unattended.
- **`event_id`s never expire from `alerts/last_alerted_state.json`.** It only grows. Fine for now; will eventually need pruning for events that resolved long ago.

## Verification note

Every workflow above was proven by real execution against the live n8n instance and independent readback of the actual output files/emails — not accepted on a worker's, or a single execution's, word alone. Full evidence trail is in `00_PROJECT_BUILDLOG.md` (search for "independently re-verified" and the per-workflow entries dated 2026-08-01 through 2026-08-02).
