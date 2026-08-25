# UW-Issy Four-Category Harvey Grid Acceptance Summary

Status: complete.

## Implemented Public Categories

- Trail Conditions
- Weather
- Air Quality
- Safety Alerts

## Removed From Public Harvey Grid

- Route Conditions
- Wildfire
- Flood Conditions
- Trail Infrastructure

Internal monitoring lanes remain unchanged.

## Layout

Desktop/tablet:

`Trail Conditions | ball | Weather | ball`

`Air Quality | ball | Safety Alerts | ball`

Mobile:

One label/status pair per row.

## Live Colors

Verified on `https://uw-issy.biketourfrance.net`:

- Trail Conditions: red
- Weather: green
- Air Quality: green
- Safety Alerts: green

Trail Conditions is red because the current qualified East Lake Sammamish Trail closure is a confirmed rider-impacting condition.

## Validation

- Unit tests: 9 files, 125 tests passed.
- Typecheck: passed.
- Production build: passed.
- Public package validation: passed.
- Copy allowlist validation: passed.
- Secret scan: passed.
- Built HTML verification: exactly four Harvey balls and four approved labels; removed grid categories absent.
- GitHub Actions production run: `32793473638`, success.
- Cloudflare Pages deployment: `https://2ae03f25.uw-issy.pages.dev`.
- CI production verifier: 27/27 passed on the Pages deployment URL.
- Live custom domain verified directly: `https://uw-issy.biketourfrance.net`.

## Deployment

- Implementation commit: `dd59108483053223dbfd9041de8a0980ac15850f`.
- Copy-gate correction commit: `eac1a6836c08f843597bc80f13b152766bd81b42`.
- CI build-log proof commit: `2eec9a2`.
- Failed pre-deploy gate: GitHub Actions run `32793357862`; deploy was not reached because `Air Quality` was still listed as rejected in the validator despite being newly approved.
- Successful deploy gate: GitHub Actions run `32793473638`.
- Existing approved deployment path used: GitHub Actions workflow `Build, validate, and deploy`, Cloudflare Wrangler Pages deploy.
- Exact deploy command from CI log: `wrangler pages deploy dist --project-name=uw-issy --commit-hash=eac1a6836c08f843597bc80f13b152766bd81b42 --branch=main`.
- Cloudflare Pages completion: deployment complete at `https://2ae03f25.uw-issy.pages.dev`.

## Live Acceptance

- Public grid contains exactly four Harvey categories.
- Labels are exactly `Trail Conditions`, `Weather`, `Air Quality`, `Safety Alerts`.
- Desktop layout uses four columns across two rows.
- Label-to-ball spacing is compact via `max-content 20px max-content 20px` grid columns.
- Harvey-ball columns align.
- `Route Conditions`, `Wildfire`, `Flood Conditions`, and `Trail Infrastructure` are absent from the public Harvey grid.
- Colors derive from rider impact, not monitor/source health.
- Current route issue details remain.
- `UW-Issaquah Cycling Route` map remains.
- System Health remains separate.
- No unapproved public copy was introduced.

## Proof

- Proof folder: `00_AS-BUILT/20260824-UWISSY_PUBLIC_HARVEY_GRID_FOUR_CATEGORY_MODEL/`.
- Live desktop screenshot: `after-live-four-category-harvey-desktop.png`.
- Custom-domain verification: `custom-domain-four-category-verification.txt`.
- GitHub Actions proof: `github-actions-run-32793473638.log` and `github-actions-run-32793473638.json`.
