# NORMALIZED_SCHEMA_PROPOSAL.md

## Goal

Provide a compact, website-ready lane-06 output contract for `06_TRAIL_INFRASTRUCTURE_STATUS` with clear separation between public fields and diagnostics.

## Proposed structure

```json
{
  "schema_version": "1.0.0",
  "workstream_id": "06_TRAIL_INFRASTRUCTURE_STATUS",
  "generated_at": "ISO-8601",
  "source_retrieved_at": "ISO-8601",
  "status": "ok | partial | stale | error",
  "severity": "none | low | moderate | high | critical",
  "label": "WATERWAY_AND_CROSSING_STATUS",
  "route_summary": {
    "headline": "string",
    "summary": "string",
    "affected_sections": ["string"],
    "manual_review_required": false
  },
  "route_segment_impacts": [
    {
      "segment_id": "string",
      "segment_name": "string",
      "impact_level": "none | possible | confirmed",
      "summary": "string",
      "facility_names": ["string"],
      "location_text": "string"
    }
  ],
  "events": [
    {
      "event_id": "string",
      "source_id": "string",
      "event_type": "culvert | drainage | bridge | crossing | shoreline | fish_passage | other",
      "status": "planned | active | restricted | closed | reopened | unknown",
      "severity": "low | moderate | high | critical | unknown",
      "title": "string",
      "summary": "string",
      "effective_start": "ISO-8601 or null",
      "effective_end": "ISO-8601 or null",
      "route_relevance": {
        "classification": "confirmed_route_impact | possible_route_impact | nearby_not_confirmed | not_route_relevant",
        "method": "geometry_intersection | named_trail_match | facility_match | text_location_match",
        "confidence": "high | medium | low"
      },
      "geometry_context": {
        "has_geometry": true,
        "geometry_type": "point | line | polygon | none",
        "nearest_route_distance_m": 0,
        "affected_sections": ["string"]
      },
      "source": {
        "name": "string",
        "agency": "string",
        "url": "string"
      }
    }
  ],
  "advisories": [
    {
      "type": "stale_source | overlap_notice | manual_review",
      "message": "string"
    }
  ],
  "freshness": {
    "max_source_age_hours": 0,
    "stale": false,
    "last_successful_update": "ISO-8601 or null"
  },
  "pipeline_health": {
    "source_count_total": 0,
    "source_count_ok": 0,
    "source_count_failed": 0,
    "source_count_stale": 0
  },
  "diagnostics": {
    "failed_sources": [
      {
        "source_id": "string",
        "error": "string"
      }
    ],
    "notes": ["string"]
  }
}
```

## Public-facing fields

- `schema_version`
- `workstream_id`
- `generated_at`
- `status`
- `severity`
- `label`
- `route_summary`
- `route_segment_impacts`
- `events`
- `advisories`
- `freshness.last_successful_update`

## Diagnostic-only fields

- `source_retrieved_at`
- `freshness.max_source_age_hours`
- full `pipeline_health`
- full `diagnostics`
- per-event internal route relevance method metadata if the site UI does not need to display it

## Notes

- Do not include raw HTML, raw ArcGIS features, or large payload fragments.
- For HTML-only sources, `event_id` should be a stable hash of `source_id + extracted_text_block`.
- For ArcGIS features, prefer a source object ID plus source ID.
- `status` and `severity` at the top level should be derived from the worst active confirmed event, not from source health alone.

## Illustrative example

This is an illustrative example only, not a live record.

```json
{
  "schema_version": "1.0.0",
  "workstream_id": "06_TRAIL_INFRASTRUCTURE_STATUS",
  "generated_at": "2026-07-29T16:00:00-07:00",
  "source_retrieved_at": "2026-07-29T15:58:00-07:00",
  "status": "ok",
  "severity": "high",
  "label": "WATERWAY_AND_CROSSING_STATUS",
  "route_summary": {
    "headline": "Waterway infrastructure is affecting one shoreline trail segment.",
    "summary": "One confirmed culvert-related trail closure is active on the East Lake Sammamish corridor; other route segments have no confirmed waterway or crossing impacts.",
    "affected_sections": [
      "East Lake Sammamish Trail - Sammamish"
    ],
    "manual_review_required": false
  },
  "route_segment_impacts": [
    {
      "segment_id": "09",
      "segment_name": "East Lake Sammamish Trail - Sammamish",
      "impact_level": "confirmed",
      "summary": "A water-infrastructure project is interrupting route continuity on this segment.",
      "facility_names": [
        "George Davis Creek",
        "East Lake Sammamish Trail"
      ],
      "location_text": "Between two named access roads on the Sammamish shoreline segment."
    }
  ],
  "events": [
    {
      "event_id": "KC-03_example_hash",
      "source_id": "KC-03",
      "event_type": "culvert",
      "status": "closed",
      "severity": "high",
      "title": "Trail closure for culvert replacement",
      "summary": "Official trail-owner notice describing a closure caused by culvert replacement and related fish-passage work.",
      "effective_start": "2026-06-01T00:00:00-07:00",
      "effective_end": null,
      "route_relevance": {
        "classification": "confirmed_route_impact",
        "method": "named_trail_match",
        "confidence": "high"
      },
      "geometry_context": {
        "has_geometry": false,
        "geometry_type": "none",
        "nearest_route_distance_m": 0,
        "affected_sections": [
          "East Lake Sammamish Trail - Sammamish"
        ]
      },
      "source": {
        "name": "King County East Lake Sammamish Trail page",
        "agency": "King County Parks",
        "url": "https://cd10-prod.kingcounty.gov/en/dept/dnrp/nature-recreation/parks-recreation/king-county-parks/trails/leafline-trails/east-lake-sammamish"
      }
    }
  ],
  "advisories": [
    {
      "type": "overlap_notice",
      "message": "Raw lake-level monitoring remains owned by 05_FLOOD_CONDITIONS."
    }
  ],
  "freshness": {
    "max_source_age_hours": 6,
    "stale": false,
    "last_successful_update": "2026-07-29T15:58:00-07:00"
  },
  "pipeline_health": {
    "source_count_total": 5,
    "source_count_ok": 5,
    "source_count_failed": 0,
    "source_count_stale": 0
  },
  "diagnostics": {
    "failed_sources": [],
    "notes": [
      "Illustrative example only."
    ]
  }
}
```
