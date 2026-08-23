# Marker Severity Mapping

Date: 2026-08-23

Implementation: `src/lib/route-status/event-marker.ts`

Marker color is based on rider impact, not monitoring lane/source identity.

## Rule

Red triangle (`#C72B20`) = major issue:

- `riderCanPass === "no"`;
- severity is `high`, `major`, `severe`, `closure`, `closed`, or `critical`;
- current status is `closed`, `closure`, or `active closure`;
- display tier is `alert`.

Yellow triangle (`#D99100`) = caution:

- severity is `medium`, `moderate`, `watch`, `caution`, `degraded`, or `advisory`;
- `riderCanPass === "unknown"`;
- display tier is `watch`.

Green triangle (`#2D7A30`) = clear / resolved:

- severity is `low`, `minor`, `normal`, `clear`, `resolved`, `informational`, or `info`;
- current status is `resolved`, `clear`, `cleared`, `reopened`, or `open`;
- display tier is `normal`.

Fallback: caution.

## Current Package Outcome

The current mappable active events are high/closed/passability-impacting, so their incident symbols are red triangles.

No yellow or green active production marker is forced where the current event data does not support one.

## Clickability Fix

The triangle marker's visual child uses `pointer-events: none`, so click/tap events reach Leaflet's marker element and open the bound event popup.
