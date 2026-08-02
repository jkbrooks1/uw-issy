# NORMALIZED_SCHEMA_PROPOSAL.md — 04_WILDFIRE

## Goals

The wildfire connector output should be:

- compact enough for direct website use
- explicit about freshness and confidence
- able to represent both incidents and advisories
- able to keep public-facing and diagnostic fields separate
- small enough to store atomically and preserve last-known-good state

## Proposed top-level contract

```json
{
  "schema_version": "1.0",
  "workstream_id": "04_WILDFIRE",
  "generated_at": "ISO-8601 timestamp",
  "source_retrieved_at": {
    "source_id": "ISO-8601 timestamp"
  },
  "overall_status": "ok | warning | impacted | stale | partial | error",
  "severity": "none | low | moderate | high | extreme",
  "route_summary": {},
  "route_segment_impacts": [],
  "events": [],
  "advisories": [],
  "source_provenance": [],
  "geographic_relevance": {},
  "freshness": {},
  "confidence": {},
  "pipeline_health": {},
  "stale_data_state": {},
  "errors": [],
  "last_successful_update": "ISO-8601 timestamp",
  "diagnostics": {}
}
```

## Public-facing fields

These should be safe to hand directly to the site:

- `schema_version`
- `workstream_id`
- `generated_at`
- `overall_status`
- `severity`
- `route_summary`
- `route_segment_impacts`
- `events`
- `advisories`
- `freshness.public_age_minutes`
- `confidence.public_level`
- `last_successful_update`

## Diagnostic-only fields

Keep these out of the default public card unless expanded:

- `source_retrieved_at`
- `source_provenance`
- `geographic_relevance`
- `pipeline_health`
- `stale_data_state`
- `errors`
- `diagnostics`

## Recommended field shapes

### `route_summary`

```json
{
  "headline": "short rider-facing summary",
  "primary_reason": "fire_perimeter | smoke | fire_weather | burn_restriction | closure | evacuation | none",
  "affected_sections": ["section ids or names"],
  "recommended_action": "ride_ok | caution | reroute | avoid_route | manual_review"
}
```

### `route_segment_impacts[]`

```json
{
  "segment_id": "string",
  "segment_name": "string",
  "status": "clear | nearby_fire | smoke_affected | warning_area | burn_restriction_context | closed | evacuation_related",
  "severity": "none | low | moderate | high | extreme",
  "reason_codes": ["string"],
  "event_ids": ["string"],
  "advisory_ids": ["string"]
}
```

### `events[]`

Use for active fire incidents, perimeters, closures, and evacuations.

```json
{
  "event_id": "stable internal id",
  "source_id": "string",
  "event_type": "wildfire | prescribed_burn | fire_related_closure | evacuation",
  "title": "string",
  "status": "active | monitoring | contained | closed | unknown",
  "severity": "low | moderate | high | extreme",
  "route_relevance": "confirmed_route_impact | near_route | contextual_only | not_route_relevant",
  "route_distance_miles": 0.0,
  "route_match_method": "point_distance | polygon_intersection | named_trail_match | municipality_match | manual_review",
  "location_label": "string",
  "started_at": "ISO-8601 or null",
  "updated_at": "ISO-8601 or null",
  "geometry_type": "point | polygon | none",
  "public_note": "short public summary"
}
```

### `advisories[]`

Use for smoke plumes, Red Flag Warnings, Fire Weather Watches, and burn restrictions.

```json
{
  "advisory_id": "stable internal id",
  "source_id": "string",
  "advisory_type": "smoke_plume | red_flag_warning | fire_weather_watch | burn_restriction",
  "title": "string",
  "severity": "low | moderate | high | extreme",
  "route_relevance": "confirmed_route_impact | route_wide | segment_specific | contextual_only",
  "effective_at": "ISO-8601 or null",
  "expires_at": "ISO-8601 or null",
  "route_match_method": "polygon_intersection | fire_zone_match | county_match | service_area_match",
  "public_note": "short public summary"
}
```

## Illustrative example only

This is not a live record.

```json
{
  "schema_version": "1.0",
  "workstream_id": "04_WILDFIRE",
  "generated_at": "2026-07-29T12:40:32-07:00",
  "source_retrieved_at": {
    "NIFC-01": "2026-07-29T12:30:00-07:00",
    "NIFC-02": "2026-07-29T12:30:20-07:00",
    "NWS-01": "2026-07-29T12:31:00-07:00",
    "NOAA-01": "2026-07-29T12:05:00-07:00",
    "KC-01": "2026-07-29T12:10:00-07:00"
  },
  "overall_status": "warning",
  "severity": "moderate",
  "route_summary": {
    "headline": "Fire-weather and smoke context require caution on the Eastside sections.",
    "primary_reason": "smoke",
    "affected_sections": [
      "ELST_SAMMAMISH",
      "ELST_ISSAQUAH"
    ],
    "recommended_action": "caution"
  },
  "route_segment_impacts": [
    {
      "segment_id": "ELST_SAMMAMISH",
      "segment_name": "East Lake Sammamish Trail - Sammamish",
      "status": "smoke_affected",
      "severity": "moderate",
      "reason_codes": [
        "SMOKE_POLYGON_INTERSECTION"
      ],
      "event_ids": [],
      "advisory_ids": [
        "adv_smoke_example_1"
      ]
    }
  ],
  "events": [
    {
      "event_id": "evt_fire_example_1",
      "source_id": "NIFC-01",
      "event_type": "wildfire",
      "title": "Illustrative wildfire event",
      "status": "active",
      "severity": "moderate",
      "route_relevance": "near_route",
      "route_distance_miles": 3.8,
      "route_match_method": "point_distance",
      "location_label": "Illustrative Eastside foothills location",
      "started_at": "2026-07-29T08:10:00-07:00",
      "updated_at": "2026-07-29T12:25:00-07:00",
      "geometry_type": "point",
      "public_note": "Illustrative example only."
    }
  ],
  "advisories": [
    {
      "advisory_id": "adv_smoke_example_1",
      "source_id": "NOAA-01",
      "advisory_type": "smoke_plume",
      "title": "Illustrative smoke polygon",
      "severity": "moderate",
      "route_relevance": "segment_specific",
      "effective_at": "2026-07-29T11:00:00-07:00",
      "expires_at": null,
      "route_match_method": "polygon_intersection",
      "public_note": "Illustrative example only."
    }
  ],
  "source_provenance": [
    {
      "source_id": "NOAA-01",
      "source_name": "NOAA HMS smoke polygons",
      "source_url": "https://ospo.noaa.gov/products/land/hms.html"
    }
  ],
  "geographic_relevance": {
    "route_fire_zones": [
      "WAZ654",
      "WAZ657"
    ],
    "route_county": "WAC033"
  },
  "freshness": {
    "public_age_minutes": 10,
    "all_primary_sources_fresh": true
  },
  "confidence": {
    "public_level": "medium",
    "notes": [
      "Illustrative example only."
    ]
  },
  "pipeline_health": {
    "primary_sources_ok": 5,
    "primary_sources_total": 5
  },
  "stale_data_state": {
    "is_stale": false,
    "stale_sources": []
  },
  "errors": [],
  "last_successful_update": "2026-07-29T12:40:32-07:00",
  "diagnostics": {
    "dedupe_groups": [
      "evt_fire_example_1"
    ]
  }
}
```
