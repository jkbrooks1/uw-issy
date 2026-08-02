# NORMALIZED_SCHEMA_PROPOSAL

Goal: a compact website-ready output contract for workstream
`07_GOVERNMENT_SAFETY_ALERTS` that separates public-facing fields from
diagnostic-only fields and never embeds large raw payloads.

## Top-level fields

### Public-facing
- `schema_version`
- `workstream_id`
- `generated_at`
- `status`
- `summary`
- `severity`
- `route_summary`
- `route_segment_impacts`
- `events`
- `advisories`
- `freshness`

### Diagnostic-only
- `source_retrieved_at`
- `source_provenance`
- `confidence`
- `pipeline_health`
- `stale_data_state`
- `errors`
- `last_successful_update`

## Proposed structure

```json
{
  "schema_version": "1.0.0",
  "workstream_id": "07_GOVERNMENT_SAFETY_ALERTS",
  "generated_at": "ISO-8601 timestamp",
  "status": "ok | degraded | stale | error",
  "summary": {
    "headline": "short public summary",
    "severity": "none | info | advisory | watch | warning | emergency",
    "active_event_count": 0,
    "alternate_transport_event_count": 0
  },
  "route_summary": {
    "overall_route_impact": "none | possible | partial | major | closed",
    "affected_sections": ["WP1-UW", "WP8-Issaquah"],
    "public_note": "short rider-facing text"
  },
  "route_segment_impacts": [
    {
      "segment_id": "WP1-UW",
      "status": "clear | caution | impacted | closed | alternate_only",
      "impact_summary": "short segment text",
      "confidence": "low | medium | high"
    }
  ],
  "events": [
    {
      "event_id": "normalized event id",
      "canonical_source_id": "NWS-01",
      "event_type": "civil_emergency | police_activity | evacuation | hazmat | public_health | infrastructure_emergency | alternate_transport",
      "severity": "info | advisory | watch | warning | emergency",
      "title": "public title",
      "effective_at": "ISO-8601 timestamp or null",
      "expires_at": "ISO-8601 timestamp or null",
      "route_relevance": {
        "classification": "confirmed_route_relevant | possible_route_relevant | alternate_transport_only",
        "method": "point_query | cap_geometry | geocode_match | text_landmark_match | route_stop_mapping",
        "matched_tokens": ["Burke-Gilman Trail", "University Way NE"]
      },
      "location_summary": "short location text",
      "segment_ids": ["WP1-UW"],
      "public_action": "brief rider-facing action text",
      "cross_listed_to": ["03_AIR_QUALITY"],
      "source_links": [
        {
          "source_id": "NWS-01",
          "url": "https://example"
        }
      ]
    }
  ],
  "advisories": [
    {
      "advisory_id": "secondary item id",
      "source_id": "ST-01",
      "type": "alternate_transport",
      "title": "service advisory title",
      "summary": "short advisory text"
    }
  ],
  "freshness": {
    "overall_state": "fresh | aging | stale",
    "oldest_source_age_minutes": 0
  },
  "source_retrieved_at": {
    "NWS-01": "ISO-8601 timestamp",
    "SEA-01": "ISO-8601 timestamp"
  },
  "source_provenance": [
    {
      "source_id": "NWS-01",
      "source_name": "NWS modern alerts API and CAP products",
      "retrieval_status": "ok | empty | blocked | error",
      "verification_state": "VERIFIED | PARTIALLY_VERIFIED | BLOCKED"
    }
  ],
  "confidence": {
    "overall": "low | medium | high",
    "notes": ["short diagnostic note"]
  },
  "pipeline_health": {
    "failed_sources": [],
    "degraded_sources": [],
    "warnings": []
  },
  "stale_data_state": {
    "is_stale": false,
    "stale_sources": []
  },
  "errors": [],
  "last_successful_update": "ISO-8601 timestamp"
}
```

## Illustrative example only

This is an illustrative example of field names and shape only. It is not a live
incident record.

```json
{
  "schema_version": "1.0.0",
  "workstream_id": "07_GOVERNMENT_SAFETY_ALERTS",
  "generated_at": "2026-07-29T15:00:00-07:00",
  "status": "ok",
  "summary": {
    "headline": "No current route-relevant government safety alerts.",
    "severity": "none",
    "active_event_count": 0,
    "alternate_transport_event_count": 1
  },
  "route_summary": {
    "overall_route_impact": "none",
    "affected_sections": [],
    "public_note": "Official emergency and public-safety feeds are fresh with no route-relevant active alerts."
  },
  "route_segment_impacts": [],
  "events": [],
  "advisories": [
    {
      "advisory_id": "advisory-st-01-example",
      "source_id": "ST-01",
      "type": "alternate_transport",
      "title": "Example transit advisory",
      "summary": "Fallback transit may be affected even when the route itself is clear."
    }
  ],
  "freshness": {
    "overall_state": "fresh",
    "oldest_source_age_minutes": 8
  },
  "source_retrieved_at": {
    "NWS-01": "2026-07-29T14:52:00-07:00",
    "SEA-01": "2026-07-29T14:54:00-07:00",
    "UW-01": "2026-07-29T14:55:00-07:00"
  },
  "source_provenance": [
    {
      "source_id": "NWS-01",
      "source_name": "NWS modern alerts API and CAP products",
      "retrieval_status": "empty",
      "verification_state": "VERIFIED"
    },
    {
      "source_id": "SEA-01",
      "source_name": "AlertSeattle public feed and WordPress API",
      "retrieval_status": "ok",
      "verification_state": "VERIFIED"
    }
  ],
  "confidence": {
    "overall": "high",
    "notes": [
      "No route-relevant CAP alerts matched any route point or King County zone query.",
      "Seattle and UW public feeds were fresh at the time of generation."
    ]
  },
  "pipeline_health": {
    "failed_sources": [],
    "degraded_sources": [],
    "warnings": []
  },
  "stale_data_state": {
    "is_stale": false,
    "stale_sources": []
  },
  "errors": [],
  "last_successful_update": "2026-07-29T15:00:00-07:00"
}
```
