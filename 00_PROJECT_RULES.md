# UW–Issaquah Route Monitor — Project Rules

## Project identity

This is a separate project from every BikeTourFrance France-route monitoring dashboard.

Project root:

`/Users/jkbrookspersonal/LocalSiteBuildFiles/BTF_UW-Issy_Route_Monitor`

## Canonical route

The canonical route source is:

`data/route/UnivWA-Issaquah.gpx`

Derived route assets must be reproducible from the canonical GPX.

## Workstreams

1. `01_ROUTE_CONDITIONS`
2. `02_WEATHER`
3. `03_AIR_QUALITY`
4. `04_WILDFIRE`
5. `05_FLOOD_CONDITIONS`
6. `06_TRAIL_INFRASTRUCTURE_STATUS`
7. `07_GOVERNMENT_SAFETY_ALERTS`

## Build-log rule

Every material execution, structural change, connector change, workflow change, test, build, or deployment must be recorded in:

`00_PROJECT_BUILDLOG.md`

## Source rule

Use official public sources whenever available. Each source must be documented with:

- owning agency
- source URL or endpoint
- access method
- geographic scope
- route-section relevance
- refresh frequency
- freshness rule
- failure behavior
- manual-review requirements

## Route-impact rule

Events must be distinguished as:

- confirmed route impact
- possible route impact
- nearby but not route-impacting
- irrelevant

## Route Status / System Status rule

Public Route Status must be driven by route condition facts, not monitoring
machinery. System Health belongs at the bottom of the public page. System
operations and system assurance details are internal-only unless the owner
explicitly approves a separate operator view.

The public overall Route Status model must not produce a whole-route
`Closed` state. Localized closures stay localized and may produce
`Partial closure` only when supported by evidence.

## Public copy governance rule

Unless public-facing copy is expressly approved by the owner, it is not
approved and must not render. Approval is exact; no paraphrase, similarity,
fallback convenience, or prior existence creates approval.

The canonical project allowlist is:

`00_DOCS/2026-08-23_UWISSY_APPROVED_PUBLIC_COPY_REGISTRY.md`

Only rows with `Approval status = APPROVED` may render publicly. Rejected,
pending, unlisted, unmapped, proposed, paraphrased, or generated substitute
copy must be suppressed or submitted for owner approval before release.

## Output rule

Production outputs must use atomic writes and preserve the last known good output when a connector fails.

## Project-separation rule

Do not copy or reuse:

- French API endpoints
- French credentials
- department codes
- AASQA mappings
- Météo-France assumptions
- VNF canal assumptions
- Vigicrues station mappings
- prefecture sources
- Bordeaux-to-Sète route mappings
