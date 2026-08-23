# Final Acceptance Summary

Date: 2026-08-23

## Requested Fixes

PASS: top route state no longer says only `Closed` for the localized ELST closure.

PASS: top route state is `Partial closure`.

PASS: supporting text says one or more localized route segments are closed and the full route is not reported closed.

PASS: data confidence remains separate from route-closure state.

PASS: canonical full route line is red.

PASS: incident symbols are triangles.

PASS: triangle marker visual children do not intercept pointer events; marker click/tap reaches the Leaflet marker and opens event detail.

PASS: marker color is derived from rider impact/severity, not source lane.

PASS: current major/closure markers are red.

PASS: green/yellow rules are implemented and unit-tested without inventing unsupported active production severity.

PASS: BTF logo size is exactly 25% larger:

- desktop CSS height: 40px -> 50px
- mobile CSS height: 34px -> 42.5px
- image attributes: 160x40 -> 200x50

PASS: 390 px and 320 px screenshots show no header clipping or horizontal overflow.

## Files Changed

- `src/lib/route-status/rider-state.ts`
- `src/lib/route-status/event-marker.ts`
- `src/components/route-status/CurrentRouteState.astro`
- `src/components/route-status/RouteMap.svelte`
- `src/components/route-status/EventTable.astro`
- `src/components/route-status/EventListMobile.astro`
- `src/components/site/SiteHeader.astro`
- `src/styles/route-status.css`
- `tests/route-status/rider-state.test.ts`
- `tests/route-status/event-marker.test.ts`
- `tests/ui/dashboard-layout.test.ts`

## Proof Screenshots

- `screenshots/pre-change-live-desktop.png`
- `screenshots/pre-change-live-mobile-390.png`
- `screenshots/pre-change-live-mobile-320.png`
- `screenshots/post-change-local-desktop.png`
- `screenshots/post-change-local-mobile-390.png`
- `screenshots/post-change-local-mobile-320.png`

## Verification Files

- `test-output.txt`
- `typecheck-output.txt`
- `build-output.txt`
- `public-package-rebuild.txt`
- `public-package-validation.txt`
- `route-source-validation.txt`
- `route-geojson-validation.txt`
- `secret-scan-output.txt`
- `before-after-render-values.json`

Production verification is recorded after deployment in `production-verification.txt`.

## Final Production Result

Final deploy commit: `4eec1fb`

Final GitHub Actions run: `32669948655`

Final Cloudflare Pages deployment URL: `https://132badbc.uw-issy.pages.dev`

Live custom domain: `https://uw-issy.biketourfrance.net`

Targeted Cloudflare cache purge was run for the custom-domain root and public data URLs after deployment so the plain live URL served the final shell.

Final custom-domain shell check:

- `Partial closure`: true
- whole-route `Closed` headline: false
- `width="200" height="50"` logo attributes: true
- localized/full-route explanatory copy: true
- final RouteMap bundle: `RouteMap.DvEOadl9.js`

Final marker popup proof: `final-live-marker-popup-proof.json`

- red triangle markers: 4
- legacy ring markers: 0
- route strokes sampled from live DOM: `#C72B20`
- marker center-click opened useful popup detail

Final production verifier:

- Pages deploy URL: PASS, 27/27
- Custom domain: 26/27, with the one failure being the pre-existing Cloudflare Email Address Obfuscation mailto rewrite. The route-status, route-map, public data, release ID, secret scan, and mock-content checks passed.
