# Final Acceptance Summary

Result:

- Route Status is primary.
- System Health is bottom-only.
- Public copy is deny-by-default through an approved-copy registry and allowlist validator.
- Whole-route `Closed` state is removed.
- Route-wide closure/status copy is absent.
- Localized closure remains localized as `Partial closure`.

Current closure facts shown:

- Closed section: East Lake Sammamish Trail.
- From: Louis Thompson Rd NE.
- To: NE Inglewood Hill Rd.
- Closed length: 0.11 mi.
- Detour: No.
- Closure hours: not shown.
- Expected reopening: End of 2026.
- Source: King County Parks - East Lake Sammamish Trail page.

Validation:

- Unit tests: 8 files passed, 107 tests passed.
- Typecheck: pass.
- Build: pass.
- Public package validation: pass.
- Route GPX validation: pass.
- Route GeoJSON validation: pass.
- Secret scan: pass.
- Public-copy allowlist: pass, 71 approved rows, 0 rejected, 0 pending, 0 unmapped, COPY-048 absent.
- Pages production verifier: pass, 27 of 27.
- Custom domain verifier: 26 of 27 due Cloudflare email-obfuscation rewriting the `mailto:` link on the custom domain; route/data/release checks pass.

Commits:

- `6325a3c` - Remediate UW-Issy route status taxonomy and copy governance.
- `57ba04a` - Fix route issue detail closure label parity.

Live URL:

- https://uw-issy.biketourfrance.net

Deployment URL:

- https://1f0e24cf.uw-issy.pages.dev

Proof ZIP:

- `/Users/jkbrookspersonal/Downloads/20260823-UWISSY_COMPLETE_ROUTE_STATUS_REMEDIATION_PROOF.zip`
