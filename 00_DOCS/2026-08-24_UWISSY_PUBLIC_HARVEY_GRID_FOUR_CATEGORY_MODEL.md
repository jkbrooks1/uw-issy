# UW-Issy Public Harvey Grid Four-Category Model

Date: 2026-08-24

## Executive Result

The public Harvey-ball rider-impact grid was simplified from six lane-like categories to four rider-relevant public categories:

- Trail Conditions
- Weather
- Air Quality
- Safety Alerts

The public grid no longer mirrors internal monitoring lanes. Internal lanes remain available for source collection, System Health, and downstream data processing.

## Why Public Categories No Longer Mirror Internal Lanes

The prior six-category Harvey grid exposed categories that were too close to the internal monitoring architecture:

- Route Conditions
- Weather
- Air Quality
- Wildfire
- Flood Conditions
- Trail Infrastructure

That made monitoring lanes look like equivalent rider-facing conditions. The four-category model separates public rider impact from internal monitoring source structure.

System Health remains the place to show monitoring completeness and source reliability. The Harvey grid answers only: what rider-impact conditions exist?

## Final Four Public Categories

| Public category | Purpose |
| --- | --- |
| Trail Conditions | Rider-impact conditions affecting the trail route. |
| Weather | Current riding-relevant weather conditions. |
| Air Quality | Rider-relevant AQI/smoke condition. |
| Safety Alerts | Qualified current safety alerts materially affecting riders. |

## Trail Conditions Aggregation

Trail Conditions combines rider-facing trail-impact facts from the qualified public event set.

It may use relevant qualified events from:

- Lane 01 — Route Conditions
- Lane 06 — Trail Infrastructure Status

Duplicate underlying reports are de-duplicated by `duplicateGroupKey` where available, and by a stable real-world issue key otherwise. The displayed color uses the highest confirmed rider-impact severity:

Red > Yellow > Green

For the current closure, Trail Conditions is red because the qualified public event indicates a segment closure and `riderCanPass: "no"`.

## Wildfire to Air Quality Relationship

Wildfire remains an internal monitoring lane.

Wildfire is no longer a public Harvey category.

Wildfire data only affects the public Air Quality category when it produces a qualified rider-relevant smoke/AQI/particulate condition. A regional wildfire record by itself does not create a public Harvey warning.

## Flood Conditions Internal-Only Rationale

Flood Conditions remains an internal monitoring lane.

Flood Conditions is no longer a public Harvey category.

Flood source data only affects the public grid when it becomes a qualified rider-impact issue, such as a trail closure, passability restriction, or material safety condition. Gauge observations or source data alone do not create a public Harvey warning.

## Safety Alerts Mapping

Safety Alerts uses qualified current Government Safety Alerts data where it produces a genuine rider-impacting condition.

Generic notices, empty records, source warnings, and monitoring failures do not change the Safety Alerts Harvey color.

## Spacing and Alignment Change

The grid now uses a compact label/ball pairing:

`[label] [ball]      [label] [ball]`

Implementation:

- Desktop/tablet grid columns: `max-content 20px max-content 20px`
- Label-to-ball spacing: `14px`
- Right-side label gets `36px` left margin to separate the two pairs.
- Harvey balls remain in aligned columns.
- Mobile collapses to `max-content 20px`, one label/status pair per row.

## Color Semantics

Harvey colors represent rider impact only.

| Color | Meaning |
| --- | --- |
| Green | No active rider-impacting issue reported. |
| Yellow | Caution. |
| Red | Confirmed rider-impacting condition. |
| Unknown | Underlying public data unavailable. |

The grid does not use `sourceState`, connector health, workflow health, system health, lane degradation, failed-source count, or last-known-good state to set rider-impact color.

## Tests

Unit tests were updated to prove:

- Exactly four public Harvey categories.
- Exact approved labels.
- Removed categories are not Harvey categories.
- Desktop layout is label, ball, label, ball.
- Label-to-ball spacing is compact.
- Ball columns align.
- Trail Conditions aggregates qualified trail-impact data.
- Duplicate underlying reports do not change the real-world issue result.
- Wildfire source data alone does not create a public warning.
- Flood source data alone does not create a public warning.
- Source/system degradation alone does not change Harvey color.
- Current route issue detail remains below.
- Map remains.
- System Health remains separate.
- Accessibility labels remain.

Validation:

- Unit tests: 9 files, 125 tests passed.
- Typecheck: passed.
- Production build: passed.
- Public package validation: passed.
- Public-copy allowlist: passed with 77 approved rows.
- Secret scan: passed.

## Deployment Result

Deployment completed through the existing canonical GitHub Actions / Cloudflare Pages path.

- Implementation commit: `dd59108483053223dbfd9041de8a0980ac15850f`
- Copy-gate correction commit: `eac1a6836c08f843597bc80f13b152766bd81b42`
- CI build-log proof commit: `2eec9a2`
- Successful GitHub Actions run: `32793473638`
- Cloudflare Pages deployment: `https://2ae03f25.uw-issy.pages.dev`
- CI production verification: 27/27 passed on the Pages deployment URL.
- Live custom domain verified: `https://uw-issy.biketourfrance.net`

Custom-domain verification confirms exactly four public Harvey categories, the approved labels, compact label/ball pairing, live colors of Trail Conditions red and Weather/Air Quality/Safety Alerts green, preserved current issue detail, preserved map, and separate System Health.

Proof is recorded in:

`00_AS-BUILT/20260824-UWISSY_PUBLIC_HARVEY_GRID_FOUR_CATEGORY_MODEL/`
