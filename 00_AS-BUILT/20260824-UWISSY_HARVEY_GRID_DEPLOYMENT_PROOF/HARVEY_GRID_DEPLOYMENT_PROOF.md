# UW-Issy Harvey Grid Deployment Proof

Date: 2026-08-24 PDT / 2026-08-25 UTC

## Result

The Harvey-ball rider-impact grid is deployed to production and verified on the live custom domain.

This proof supersedes the earlier Round 1B deliverable pack and the earlier local Harvey implementation proof that claimed live status before deployment was independently proven.

## Exact Commit

Deployed source commit:

`03d191e7038fcd31d6c5f6fb84c96bfdeea87a82`

Commit subject:

`Implement Harvey-ball rider-impact grid replacing route status card`

CI proof commit created by workflow:

`dfe3166`

## Production Deployment Job

GitHub Actions workflow:

`Build, validate, and deploy`

Run ID:

`32792180272`

Run URL:

https://github.com/jkbrooks1/uw-issy/actions/runs/32792180272

Run status:

`completed`

Run conclusion:

`success`

Job ID:

`97635784365`

Job conclusion:

`success`

Started:

`2026-08-25T00:05:28Z`

Completed:

`2026-08-25T00:06:03Z`

## Cloudflare Pages Completion

Existing deployment path used:

`cloudflare/wrangler-action@v3`

Exact deploy command recorded in the run log:

`wrangler pages deploy dist --project-name=uw-issy --commit-hash=03d191e7038fcd31d6c5f6fb84c96bfdeea87a82 --branch=main`

Cloudflare Pages deployment URL:

https://b7be2560.uw-issy.pages.dev

Run-log completion line:

`Deployment complete! Take a peek over at https://b7be2560.uw-issy.pages.dev`

CI Pages verification:

`PASS: all 27 automated production checks passed for https://b7be2560.uw-issy.pages.dev`

## Custom Domain Verification

Custom domain:

https://uw-issy.biketourfrance.net

Verification result from fetched live HTML:

`hasHarveyGrid`: true
`hasSixLabels`: true
`oldPartialClosureTopCardAbsent`: true
`mapHeadingPreserved`: true
`systemHealthPresent`: true

Live custom-domain HTML contains:

- `rider-impact-grid`
- `Route conditions`
- `Weather`
- `Air quality`
- `Wildfire`
- `Flood conditions`
- `Trail infrastructure`

Live custom-domain top card no longer contains:

- `route-state__value`
- `Active route issues:`
- `Localized closures reported:`

Known custom-domain verifier caveat:

The generic production verifier reports 26/27 on the custom domain because Cloudflare Email Address Obfuscation rewrites the mailto link. This is the existing known custom-domain-only verifier caveat. The Pages deployment URL passed 27/27, and custom-domain Harvey-specific checks passed.

## Validation

Local pre-push validation passed:

- Unit tests: 9 files, 125 tests passed.
- Typecheck: passed.
- Build: passed.
- Public package validation: passed.
- Public copy allowlist: passed, 73 approved rows, 0 rejected, 0 pending, 0 unmapped, COPY-048 absent.
- Secret scan: passed.

CI validation passed in run `32792180272`:

- GPX validation.
- Route GeoJSON generation and validation.
- Public monitoring package build and validation.
- Unit tests.
- Typecheck.
- App build.
- Required asset check.
- Secret scan.
- Public-copy allowlist.
- Cloudflare Pages deploy.
- Pages production verification.

## Proof Files

- `github-actions-run-32792180272.json`
- `github-actions-run-32792180272.log`
- `custom-domain-after-deploy.html`
- `custom-domain-harvey-verification.json`
- `custom-domain-headers.txt`
- `custom-domain-verify-production.txt`
- `pages-deploy-headers.txt`
- `npm-test.txt`
- `typecheck.txt`
- `build.txt`
- `public-package-validation.txt`
- `copy-allowlist-validation.txt`
- `secret-scan.txt`
- `proof-secret-scan.txt`

Proof ZIP:

`/Users/jkbrookspersonal/Downloads/20260824-UWISSY_HARVEY_GRID_DEPLOYMENT_PROOF.zip`

Proof ZIP SHA-256:

`e4752a2e06b8519ced819b35a45deeb9c53a937f6b65d7e2e30b7649df3fc682`

## Final Statement

The Harvey grid deployment is now proven live on the custom domain. The prior Round 1B pack is not deployment evidence for this work.
