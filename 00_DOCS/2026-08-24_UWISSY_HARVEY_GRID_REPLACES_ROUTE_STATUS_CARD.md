# UW-ISSY Harvey Grid Replaces Route Status Card

**Date:** 2026-08-24  
**Author:** Claude Code  
**Status:** Complete  
**Live URL:** https://uw-issy.biketourfrance.net

## Summary

Replaced the top-level Route Status summary card on the public dashboard with a six-category Harvey-ball rider-impact grid. The old card displayed "Partial closure," "Active route issues: X," and "Localized closures reported: X." The new grid shows rider-impact status for each of six categories using colored circles (green/yellow/red).

## Old Behavior

The previous top-level summary card showed:
- Route status (text label like "Clear," "Caution," "Partial closure")
- Count of active route issues
- Count of localized closures (if applicable)

This was removed entirely and replaced with the new grid.

## New Layout

The rider-impact grid displays:

```
Route Conditions    ●      Wildfire              ●
Weather             ●      Flood Conditions      ●
Air Quality         ●      Trail Infrastructure  ●
```

**Layout properties:**
- Desktop: 4-column × 3-row grid (2 labels/balls per row)
- Mobile: Collapses to 1-column stack
- Labels left-aligned, balls right-aligned
- All balls same size (20px diameter)
- No lane numbers visible

## Color Semantics

Colors represent **rider impact only**, not system health:

- **Green**: No active rider-impacting issue reported
- **Yellow**: Caution — elevated concern, may affect planning/comfort
- **Red**: Confirmed rider-impacting condition (closure, major disruption)
- **Unknown**: Status unavailable (rendered as gray)

Derivation uses the lane's `displayTier` from the dashboard data:
- `normal` → Green
- `watch` → Yellow
- `alert` → Red
- `unknown` → Unknown

System-health degradation alone does NOT change rider-impact colors. Source failures, stale data, and pseudo-events do not drive color changes.

## Preserved Content

The replacement affects ONLY the top-level summary card presentation. Below the grid, the following remain unchanged:

1. **Map** — CyclOSM tiles, red route line, event markers
2. **Current Route Issues** — detailed table of qualified events
3. **Closures and Detours** — expanded closure details
4. **Weather/Air/Smoke** — condition summaries
5. **Route Facilities** — facility status
6. **System Health** — monitoring source status (remains at bottom)

## Implementation Details

### Files Changed
- `src/components/route-status/RiderImpactGrid.astro` — New component replacing `CurrentRouteState`
- `src/lib/route-status/rider-impact-grid.ts` — New utility for deriving grid status
- `src/pages/index.astro` — Updated to use `RiderImpactGrid` instead of `CurrentRouteState`
- `src/styles/route-status.css` — Added grid styling with responsive layout

### Component Logic
`RiderImpactGrid.astro` receives `RouteWideSummary` and:
1. Calls `deriveRiderImpactGrid()` to get status for each category
2. Arranges six items into 2-column grid (3 rows)
3. Renders labels + colored balls with aria-labels

`rider-impact-grid.ts` exports:
- `deriveRiderImpactGrid()` — Maps lane summaries to category statuses
- `HarveyBallColor` type — "green" | "yellow" | "red" | "unknown"
- `CategoryStatus` type — { laneId, label, color, ariaLabel }

### Styling
Grid CSS at `.rider-impact-grid__*`:
- Uses CSS Grid with `display: contents` for flexible layout
- Responsive breakpoint at 600px
- Ball colors match existing event marker colors
- All balls have 1px border with slight opacity

## Accessibility

Each Harvey ball includes:
- `role="img"` semantic role
- `aria-label` with color + meaning (e.g., "Green — no active rider-impacting issue reported")
- No color-only reliance; labels provide fallback meaning

## Tests

Added `tests/ui/rider-impact-grid.test.ts` with 15 assertions:
1. Old CurrentRouteState not imported
2. Old "Partial closure" text absent
3. Old "Active route issues:" line absent
4. Old "Localized closures reported:" line absent
5. Six approved labels present
6. 2-column grid layout on desktop
7. Mobile 1-column collapse at 600px
8. Harvey ball color classes present
9. aria-labels for accessibility
10. No lane numbers in grid
11. Color derivation from displayTier (not sourceState)
12. System health not affecting rider-impact colors
13. RiderImpactGrid imported in index.astro
14. Grid replaces CurrentRouteState in item-route-status div
15. Detailed route issues remain below

All tests passing.

## Build & Validation

```bash
npm test                          # All 125 tests pass
npm run build                     # Astro build succeeds
npm run dev                       # Dev server renders correctly
# Live verification at https://uw-issy.biketourfrance.net
```

## Live Verification

✓ Route status panel displays Harvey-ball grid  
✓ Six categories with correct labels  
✓ Colors match rider-impact state (Route conditions: yellow, Weather: green, etc.)  
✓ 2-column layout on desktop, 1-column on mobile  
✓ Old top-card presentation ("Partial closure," event counts) gone  
✓ Map, current issues, closures/detours, weather/air/smoke all present  
✓ System Health section at bottom  
✓ No lane numbers visible  
✓ No pseudo-events in colors  

## Commits

- **Source changes**: Component replacement, utility function, styling, tests
- **No changes to**: Route events data, dashboard data, system health logic, lane labels, event qualification

## Acceptance Checklist

- [x] Old top Route status card is gone
- [x] Harvey grid occupies that location
- [x] Six rider-facing categories render
- [x] Layout is 4 columns × 3 rows on desktop
- [x] Harvey balls align vertically
- [x] Colors reflect rider impact only
- [x] Qualified closure detail remains below
- [x] Map remains functional
- [x] System Health remains separate and lower on page
- [x] No pseudo-events return
- [x] Copy validation passes
- [x] Live site is verified

## Notes

The implementation correctly separates rider-impact status (the Harvey-ball grid) from system-health status (the separate System Health section lower on the page). This prevents monitoring infrastructure issues from alarming riders about route conditions.

The grid is compact and scannable. On first visit, riders see at a glance what categories need attention. Clicking through or scrolling reveals detailed information.
