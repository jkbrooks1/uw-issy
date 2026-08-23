# State Logic Analysis

Date: 2026-08-23

## Root Cause

The false first-glance whole-route `Closed` state was caused by UI presentation logic in `CurrentRouteState.astro`.

The public data contained localized closure/access events with `riderCanPass` set, and the component promoted any non-null `riderCanPass` closure/access event to top-level `CLOSED`.

That conflated:

- route-wide closure;
- localized / segment closure;
- passability unknown closure-like infrastructure notices.

The current public package does not report the full UW-Issaquah route closed. The mapped ELST closure has localized route evidence:

- title: East Lake Sammamish Trail closure for George Davis Creek culvert replacement.
- location: Between Louis Thompson Rd NE and NE Inglewood Hill Rd.
- route segment: East Lake Sammamish Trail
- geometry: LineString
- riderCanPass: no

## Fix

Added `src/lib/route-status/rider-state.ts` as the earliest shared UI model layer for rider state derivation.

The new model distinguishes:

- `none`
- `partial`
- `full`

Top-level rider state now becomes:

- `PARTIAL CLOSURE` when closure/access events have localized evidence and no explicit whole-route closure language;
- `CLOSED` only when a closure event explicitly refers to the whole/full/entire route without localized evidence;
- `CAUTION` for degraded or watch data without closure;
- `DATA STALE` for unavailable, failed, or unknown route-wide status.

The top card now states that localized route segments are closed and that the full route is not reported closed.

## Current Truth

Full route reported closed: NO

Localized closures reported in current public package: 4

Data confidence warning remains separate: 0 failed sources, 5 degraded sources.
