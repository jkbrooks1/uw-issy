# UW–Issaquah Route Monitor — Project Status

**Last updated:** 2026-08-03 04:21 UTC (2026-08-02 21:21 PDT)

## Current phase

The full chain is built and live: all 7 connector lanes plus the status-publisher (08) and alert-monitor (09) workflows are imported, live-verified, and now **active on real schedules**. A public dashboard reads a snapshot of workflow 08's output and is deployed to production on Cloudflare Pages. **GitHub Actions CI/CD is now fully working end-to-end**, proven with a real run against the live Cloudflare account — every push to `main` validates, builds, deploys, and verifies production automatically. The repository is on GitHub at `https://github.com/jkbrooks1/uw-issy` (`main` branch, currently at commit `38284da`).

**Live production dashboard:** `https://uw-issy.pages.dev` and `https://uw-issy.biketourfrance.net`

## Project root

`/Users/jkbrookspersonal/LocalSiteBuildFiles/BTF_UW-Issy_Route_Monitor`

## Canonical route

Canonical GPX:

`data/route/UnivWA-Issaquah.gpx`

Derived route GeoJSON (built during the site build, not checked in as a separate source of truth):

`public/routes/UnivWA-Issaquah.geojson`

## Connector status — all 7 lanes plus 08/09

| Lane | n8n workflow ID | Active | Schedule | Live-verified |
|---|---|---|---|---|
| 01 Route Conditions | `RR7cLSV9oGngrJdA` | **true** | every 30 min | yes — multiple real executions, LKG read/serve proven |
| 02 Weather | `fA0ZjWH3Itl83aPC` | **true** | every 60 min | yes — real NWS fetches, real published artifact |
| 03 Air Quality | `qlM2XIv2BbFSh3in` | **true** | every 60 min | yes — real degraded status from a genuine source HTTP 404 |
| 04 Wildfire | `w6xnelPQeRFZk8BG` | **true** | every 24 h | yes — passed on first live execution |
| 05 Flood Conditions | `4RiNqOKD9BCZFH6P` | **true** | every 24 h | yes — 10 real sources landed |
| 06 Trail Infrastructure Status | `poGV37VLUGIUxfGK` | **true** | every 24 h | yes — real published artifact after validation-ordering fix |
| 07 Government Safety Alerts | `08g3JNwQPVSxUl2H` | **true** | every 24 h | yes — real published artifact, `data_status: ok` |
| 08 Status Publisher | `gp8WlccGwLydNWG7` | false | — | yes — real aggregated feed written and read back |
| 09 Alert Monitor | `KhbGg5gBn7Rbne68` | false | — | yes — real email sent (Gmail msg `19fc34bc6a2b9552`), duplicate correctly suppressed on re-run |

All 7 lane connectors were migrated off the deprecated `n8n-nodes-base.cron` node (whose stored params never matched what this n8n version actually expects — schedules would never have fired) onto `n8n-nodes-base.scheduleTrigger`, then activated and confirmed running unattended on Hetzner. Workflows 08 and 09 remain inactive/unscheduled by design — the dashboard currently builds from one checked-in real snapshot of workflow 08's output rather than a live feed (see "Known gap" below).

Canonical, correct workflow exports (matching what is actually live and proven) are in `00_WORKFLOWS/`. The lane-local `00_CONNECTORS/0X_*/0X_*_v1.json` (or `_v4.json` for lane 01) files are the source of truth these exports were generated from.

## Dashboard

Astro + Svelte static site in this same repo (`src/`, `scripts/`, `public/`). Renders the real route line and event markers on a Leaflet map, current route state, monitoring-source health, and a text fallback table/list for events without usable geometry.

- **Data source for this build:** one real, checked-in capture of workflow 08's combined output, `data/connectors/evidence/workflow08-status-snapshot-20260802T162329Z.json`, split into the four approved public files (`public/data/dashboard-data.json`, `route-events.geojson`, `system-health.json`, `release-manifest.json`) by `scripts/build-public-package-snapshot.mjs`. Of the snapshot's 12 active events, 5 carry real source-native point geometry (lane 05); the other 7 are correctly geometry-`null` and shown as text-only.
- **CI/CD:** `.github/workflows/deploy.yml` implements the full validate → build → deploy → verify-production → log-proof contract on every push to `main`. **Working end-to-end**, proven with a real run: `CLOUDFLARE_API_TOKEN` was added as a repo secret, run `30783250154` (commit `dd5812f`) completed all 18 steps successfully, deployed to `https://1678c35d.uw-issy.pages.dev`, and its own `verify-production.mjs` step logged 27/27 automated checks passing.
- **Cloudflare Pages project:** `uw-issy`, account `84f228323707bc1d08ba30d9f76146be`. Custom domain `uw-issy.biketourfrance.net` already attached.
- **Current live deployment:** commit `38284da` (workflow-only change on top of `dd5812f`; app content unchanged since `0cf7832`), verified independently with 27/27 automated checks on `uw-issy.pages.dev` and 26/27 on `uw-issy.biketourfrance.net` (see "Known gap" below for the one difference), plus a direct DOM check confirming `.leaflet-map-pane` renders with `position: absolute` (the prior CSS-scoping fault has not regressed).

## Known gap — not silently worked around

**The custom domain's email link is rewritten by a Cloudflare zone setting, not by this app.** `uw-issy.biketourfrance.net` serves the literal `mailto:contact@biketourfrance.net` link as `/cdn-cgi/l/email-protection#...` because Cloudflare's **Email Address Obfuscation** (Scrape Shield) is active on the `biketourfrance.net` zone. Confirmed by diffing the two domains' raw HTML (byte-identical apart from that one line) and by matching `releaseId`/`assembledAt` in both domains' `release-manifest.json` — same deploy, same content, only the zone-level rewrite differs. The link still resolves for real users (Cloudflare's own decode script); this only affects an automated check looking for the literal `mailto:` string. Not fixed in this round since it's a Cloudflare zone setting, not a deploy or app fault, and changing zone-level settings was outside this task's boundary — the project owner can disable Email Obfuscation for this subdomain in the Cloudflare dashboard (Scrape Shield settings) if the literal link text matters for automated checks.

**The map's live visual render could not be confirmed via automated browser check in the most recent verification session** (2026-08-03). The automation tab's `document.visibilityState` was persistently `"hidden"`, which throttles `requestAnimationFrame` — Leaflet's tile/vector layer setup depends on it internally, stalling the map at "Loading route map" with no rendered tiles. Ruled out as a real defect: manually replaying the exact same load sequence (import → fetch → `tileLayer.addTo()` → `geoJSON.addTo()` → `getBounds()`) against the same live production data, in the same tab, completed instantly with correct bounds. This is a browser-automation tooling limitation, not a site regression — a normal foregrounded browser tab does not hit this. A full visual re-check (real tiles/route line/markers rendering) is recommended next time a stable, foregrounded browser session is available.

**The dashboard's monitoring data is not yet live-refreshing.** It builds from the one workflow-08 snapshot captured 2026-08-02T16:23:29Z, the same approved input used since the dashboard-foundation round. Workflow 08 itself remains inactive and has no path that publishes to GitHub or anywhere the dashboard build can pull from automatically. Wiring a real, periodic refresh (workflow 08 → some fetchable location → dashboard rebuild) is a separate, not-yet-scoped follow-on.

## What live qualification found and fixed (connectors)

Every lane except 01 (already fixed in an earlier session) needed at least one real bug found only by executing it against the live n8n instance — none of these were caught by static file checks:

- **Missing `alwaysOutputData` on the LKG read node** (all 7 lanes): on a first-ever run with no last-known-good file yet, the read node silently returned zero items and starved the entire rest of the pipeline with no error. Fixed everywhere.
- **Malformed connection graphs** (lanes 02, 05, 07): a single-output Code node given multiple connection branches instead of one branch with multiple targets, and a Merge node's inputs not uniquely indexed.
- **Browser-only `fetch()` used inside a Code node** (lane 02): this n8n instance's Code-node sandbox has no `fetch`; replaced with the real `this.helpers.httpRequest` helper.
- **Truncated node-name references** (lane 02): `$('Fetch NWS-01')` instead of the node's real full name — a silent runtime lookup failure.
- **Non-string `notes` field** (lane 03): rejected by the n8n import API.
- **Wrong raw-landing subdirectory convention** (lanes 03, 05, 07): used a per-source subfolder instead of the proven shared `landings/` folder.
- **Premature validation requirements** (lanes 03, 06, 07): the validator required fields before the pipeline stage that computes them, guaranteeing wrongly quarantined runs. Reordered.
- **Missing `metadata` field entirely** (lanes 03, 07).
- **Missing `hashString` helper** (lane 05, all 10 sources): real `ReferenceError` on live execution.
- **Blocked `$env` access inside a Code node** (lane 05): replaced a diagnostic-only WSDOT flag with a hardcoded value.
- **Unescaped raw newline inside a JS string literal** (lanes 02, 03, 06, 07).
- **`.toISOString()` called on an invalid Date without checking first** (lane 07, 8 occurrences).
- **Missing `quarantine/` directory tier on the server** (infrastructure, affected all lanes).
- **Deprecated `n8n-nodes-base.cron` node** (all 7 lanes): stored params (`{unit, value}`) never matched this n8n version's real expected shape (`{triggerTimes:{item:[]}}`) — schedules would never have fired. Migrated to `n8n-nodes-base.scheduleTrigger` and proven live with a real 1-minute-interval test showing two real trigger executions 60s apart.

Every fix was verified two ways: the lane's own fixture test harness and a real execution against the live n8n instance with actual output files read back over SSH.

## What live verification found and fixed (dashboard)

- TypeScript intersection bug (`types.ts`): `&` doesn't override a shared property, silently narrowing `DashboardEventWithUnknownLane`'s `laneId` back to the strict 7-lane union. Fixed with `Omit`.
- Strict indexed-access typing gap in the GPX pipeline test.
- `build-public-package-snapshot.mjs` only checked a literal `event.geometry` field that no lane publishes, discarding real source-native coordinates. Fixed with a `location.{latitude,longitude}` fallback, used only when both values are valid finite numbers.
- `index.astro` data-loading path bug: `import.meta.url`-based path resolution resolved to the wrong directory under Astro's build, silently nulling all dashboard data. Fixed with a `process.cwd()`-based path.
- CSS Grid auto-placement bug: wrapper divs' `order` property reset at the desktop breakpoint, misplacing the map panel into the narrow rail column. Fixed by flattening the DOM and using explicit `grid-template-areas`.
- Leaflet map rendered the wrong geographic area: root cause was Leaflet's stylesheet imported inside `RouteMap.svelte`'s Svelte `<style>` block, which Svelte scopes to template-created elements only — Leaflet's imperatively-created panes never received the scoping attribute, so essential pane-positioning CSS silently never applied. Fixed by importing the stylesheet from the script section instead.

## Architecture status

- shared connector standard: `00_CONNECTORS/00_SHARED_AUTONOMOUS_CONNECTOR_BUILD_STANDARD.md`
- runtime structure (quarantine/, public/, alerts/ tiers) approved and present under `data/connectors/` (local mirror) and `/files/uw-issy-connectors/` (live server)
- `DEC-009` (cross-lane severity mapping) and `DEC-013` (notification channel) resolved
- Cloudflare deployment: **resolved and live** (see "Dashboard" above)
- the public dashboard now exists and consumes a snapshot of workflow 08's feed

## Approved runtime structure

- Hetzner runtime root: `/srv/uw-issy-route-monitor`
- live n8n container output root: `/files/uw-issy-connectors/`
- local repository mirror: `data/connectors/`
- aggregated site-facing status feed: `/files/uw-issy-connectors/public/status.json`, owned only by workflow `08`
- alert state: `/files/uw-issy-connectors/alerts/last_alerted_state.json`, owned only by workflow `09`
- dashboard public data package: `public/data/{dashboard-data.json,route-events.geojson,system-health.json,release-manifest.json}`, built from a workflow-08 snapshot by `scripts/build-public-package-snapshot.mjs`

## Next phase

1. Decide whether to disable Cloudflare Email Obfuscation for `uw-issy.biketourfrance.net` (see "Known gap").
2. Get a full live-browser visual confirmation of the map (tiles/route/markers) from a normal foregrounded session (see "Known gap").
3. Decide on and build a real, periodic bridge from workflow 08's live output into the dashboard's public data package, replacing the single frozen snapshot currently in use.
4. Decide whether workflows 08/09 should be activated/scheduled now that the dashboard consumes their output shape.
5. Consider refining workflow 09's alert trigger to use each lane's native route-impact classification once/if a reliable cross-lane approach is worked out.
