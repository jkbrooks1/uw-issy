# UW-Issy John Note Table Layout Repair

Status: complete.

## Result

The live `Current route issues` section is restored to the compact five-column table layout.

The matched event row remains:

`Event | Affected section | Reported | Status | Segment passability`

The John Note now renders as a separate full-width row immediately below the matched event row.

## Live Acceptance

- PASS — Current route issues restored to compact five-column layout.
- PASS — no event-detail dump in Event column.
- PASS — John Note appears as a full-width row immediately below matched event.
- PASS — exact John Note text visible.
- PASS — map popup parity preserved through the matched geolocated issue title-to-note payload.
- PASS — production deployed.

## Deployment

- Commit: `d69fbc51e44ab2b05cb0a42f758f421baf50fa0f`
- GitHub Actions run: `32798597437`
- Live URL: `https://uw-issy.biketourfrance.net`

## Proof

- Screenshot: `live-compact-current-route-issues-john-note.png`
- Live HTML proof: `live-table-layout-verification.txt`
- Map parity proof: `live-map-popup-parity-verification.txt`
- CI log: `github-actions-run-32798597437.log`

The screenshot shows the restored compact row and the full-width John Note row. `Closures and detours` no longer contains the John Note.

## Validation

- Unit tests: 12 files, 145 tests passed.
- Typecheck: passed.
- Production build: passed.
- Public package validation: passed.
- Copy allowlist validation: passed.
- Secret scan: passed.
- Proof-folder secret scan: passed.

Known caveat: the generic custom-domain production verifier still reports the pre-existing Cloudflare email-obfuscation rewrite of the mailto link. This is unrelated to John Note placement.
