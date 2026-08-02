# NORMALIZED_SCHEMA_PROPOSAL.md — 05_FLOOD_CONDITIONS

        The normalized output should stay compact, website-ready, and free of raw payload dumps.

        ## Public-facing fields

        | Field | Purpose |
        | --- | --- |
        | `schemaVersion` | Versioned contract control |
        | `workstreamId` | Stable connector/workstream identifier |
        | `generatedAt` | When this normalized record was generated |
        | `overallStatus` | `ok`, `degraded`, `failed`, or `stale` |
        | `severity` | Highest current flood-related severity |
        | `routeSummary` | One-screen rider-facing summary |
        | `routeSegmentImpacts` | Segment-level impacts only where relevant |
        | `events` | Compact event objects for gauges, alerts, closures, advisories |
        | `advisories` | Human-readable advisory snippets |
        | `sourceProvenance` | Which sources contributed and when |
        | `geographicRelevance` | Why an event was considered route-relevant |
        | `freshness` | Staleness summary |
        | `confidence` | Confidence label and reason |
        | `lastSuccessfulUpdate` | Last all-or-partial good write timestamp |

        ## Diagnostic-only fields

        | Field | Purpose |
        | --- | --- |
        | `pipelineHealth` | Connector runtime health |
        | `staleDataState` | Source-level stale flags |
        | `errors` | Non-public error payloads or summaries |
        | `diagnostics` | Source ages, parsing warnings, internal notes |

        ## Event model recommendations

        Each `events[]` item should support:

        - `eventType`
        - `status`
        - `observed`
        - `forecast`
        - `sourceId`
        - `title`
        - `summary`
        - `metric`
        - `officialCategory`
        - `routeImpact`
        - `segmentIds`
        - `relevanceReason`

        ## Example JSON

        The example below is illustrative only and does not describe a live incident.

        ```json
        {
  "schemaVersion": "1.0.0",
  "workstreamId": "05_FLOOD_CONDITIONS",
  "generatedAt": "2026-07-29T20:00:00Z",
  "overallStatus": "ok",
  "severity": "elevated_water",
  "routeSummary": {
    "state": "No confirmed route closure. Elevated water monitoring active at the Issaquah end only.",
    "confidence": "high",
    "freshnessMinutes": 11
  },
  "routeSegmentImpacts": [
    {
      "segmentId": "seg-6-issaquah-terminus",
      "label": "Lake Sammamish State Park / Issaquah Creek terminus",
      "status": "monitoring",
      "severity": "elevated_water",
      "basis": [
        "USGS-01",
        "NWPS-01",
        "ISS-01"
      ]
    }
  ],
  "events": [
    {
      "eventType": "gauge_observation",
      "status": "active",
      "observed": true,
      "forecast": false,
      "sourceId": "USGS-01",
      "title": "Issaquah Creek near mouth observed stage",
      "metric": {
        "name": "stage_ft",
        "value": 3.79
      }
    }
  ],
  "advisories": [],
  "sourceProvenance": [
    {
      "sourceId": "USGS-01",
      "retrievedAt": "2026-07-29T19:15:30Z",
      "status": "ok"
    },
    {
      "sourceId": "NWPS-01",
      "retrievedAt": "2026-07-29T19:17:10Z",
      "status": "ok"
    }
  ],
  "geographicRelevance": {
    "method": [
      "point_to_route_distance",
      "upstream_relationship",
      "geometry_intersection"
    ],
    "notes": "Illustrative example only; not a live incident record."
  },
  "freshness": {
    "stale": false,
    "maxSourceAgeMinutes": 11
  },
  "confidence": {
    "overall": "high",
    "reason": "All primary sources returned live, current payloads."
  },
  "pipelineHealth": {
    "status": "ok",
    "errors": [],
    "warnings": []
  },
  "staleDataState": {
    "hasStaleSource": false,
    "sources": []
  },
  "errors": [],
  "lastSuccessfulUpdate": "2026-07-29T19:17:10Z",
  "diagnostics": {
    "publicSummarySafe": true,
    "sourceAgesMinutes": {
      "USGS-01": 11,
      "NWPS-01": 9
    },
    "rawPayloadStored": false
  }
}
        ```
