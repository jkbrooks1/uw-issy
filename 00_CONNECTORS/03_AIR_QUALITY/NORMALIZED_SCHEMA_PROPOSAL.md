# NORMALIZED_SCHEMA_PROPOSAL.md — 03_AIR_QUALITY

## Goals

The normalized lane output should support:

- website-ready route summary
- route-segment impacts
- current conditions vs. outlook vs. formal advisories
- source provenance and freshness
- stale-data and failure visibility
- a compact public payload without raw source dumps

## Proposed top-level structure

```json
{
  "schemaVersion": "1.0.0",
  "workstreamId": "03_AIR_QUALITY",
  "generatedAt": "ISO-8601 UTC",
  "overallStatus": "ok | degraded | failed",
  "severity": "good | moderate | usg | unhealthy | very_unhealthy | hazardous | unknown",
  "routeSummary": {},
  "segmentImpacts": [],
  "events": [],
  "advisories": [],
  "sourceProvenance": [],
  "diagnostics": {}
}
```

## Public-facing fields

```json
{
  "schemaVersion": "1.0.0",
  "workstreamId": "03_AIR_QUALITY",
  "generatedAt": "ISO-8601 UTC",
  "overallStatus": "ok | degraded | failed",
  "severity": "good | moderate | usg | unhealthy | very_unhealthy | hazardous | unknown",
  "routeSummary": {
    "currentCategory": "Good",
    "currentAqiMax": 22,
    "dominantPollutant": "ozone",
    "wildfireSmokeRelated": false,
    "forecastCategoryWorst": "Good",
    "burnBanStatus": "no_ban | stage_1 | stage_2 | unknown",
    "formalAlertActive": false,
    "message": "Short rider-facing summary"
  },
  "segmentImpacts": [
    {
      "segmentId": "aqp4_issaquah",
      "segmentName": "East Lake Sammamish Trail south / Issaquah",
      "sourceMonitorId": "ECO-01:19",
      "currentAqi": 22,
      "currentCategory": "Good",
      "dominantPollutant": "ozone",
      "pollutants": {
        "pm25": {
          "aqi": 9,
          "value": 1.6,
          "units": "ug/m3"
        },
        "pm10": null,
        "ozone": {
          "aqi": 22,
          "value": 0.027,
          "units": "ppm"
        }
      },
      "forecastCategoryWorst": "Good",
      "wildfireSmokeRelated": false,
      "formalAlertActive": false,
      "freshnessMinutes": 30,
      "confidence": "high"
    }
  ],
  "events": [
    {
      "eventType": "smoke_forecast | air_quality_alert | burn_ban",
      "title": "Short event title",
      "status": "current | forecast | expired",
      "severity": "good | moderate | usg | unhealthy | very_unhealthy | hazardous | unknown",
      "effectiveAt": "ISO-8601 with offset or null",
      "expiresAt": "ISO-8601 with offset or null",
      "areas": [
        "Seattle-Bellevue-Kent Valley"
      ],
      "routeRelevant": true,
      "sourceId": "ECO-02"
    }
  ],
  "advisories": [
    {
      "advisoryType": "sensitive_groups | no_ride | burn_ban | formal_alert",
      "message": "Short rider-facing advisory",
      "sourceId": "NWS-AQ-01"
    }
  ],
  "sourceProvenance": [
    {
      "sourceId": "ECO-01",
      "sourceName": "WA Ecology Hourly Results",
      "retrievedAt": "ISO-8601 UTC",
      "sourceTimestamp": "ISO-8601 UTC or source-local timestamp",
      "status": "ok | stale | failed",
      "stale": false
    }
  ]
}
```

## Diagnostic-only fields

Keep these out of the public UI by default, but store them in the connector
output:

```json
{
  "diagnostics": {
    "pipelineHealth": {
      "status": "ok | degraded | failed",
      "errors": [],
      "warnings": []
    },
    "staleDataState": {
      "hasStaleSource": false,
      "staleSourceIds": []
    },
    "lastSuccessfulUpdate": "ISO-8601 UTC",
    "sourceHealth": [
      {
        "sourceId": "ECO-01",
        "httpStatus": 200,
        "recordCount": 4,
        "contentType": "text/plain; charset=UTF-8",
        "retrievedAt": "ISO-8601 UTC",
        "sourceTimestamp": "2026-07-29T19:00:00Z",
        "status": "ok",
        "error": null
      }
    ]
  }
}
```

## Modeling rules

1. `current` and `forecast` must stay distinct.
2. Formal advisories/alerts must stay distinct from observation-driven severity.
3. `wildfireSmokeRelated` should only be `true` when an official smoke forecast,
   smoke blog, or formal smoke-related advisory supports that attribution.
4. `segmentImpacts` should be the main driver of route visualization.
5. No raw source payloads should be embedded in this contract.

## Illustrative example only

This is an example shape, not a live incident record.

```json
{
  "schemaVersion": "1.0.0",
  "workstreamId": "03_AIR_QUALITY",
  "generatedAt": "2026-07-29T20:00:00Z",
  "overallStatus": "ok",
  "severity": "good",
  "routeSummary": {
    "currentCategory": "Good",
    "currentAqiMax": 22,
    "dominantPollutant": "ozone",
    "wildfireSmokeRelated": false,
    "forecastCategoryWorst": "Good",
    "burnBanStatus": "no_ban",
    "formalAlertActive": false,
    "message": "Route air quality is currently Good across all official corridor monitors."
  },
  "segmentImpacts": [
    {
      "segmentId": "aqp1_seattle",
      "segmentName": "Burke-Gilman west / north Seattle",
      "sourceMonitorId": "ECO-01:453",
      "currentAqi": 9,
      "currentCategory": "Good",
      "dominantPollutant": "pm25",
      "pollutants": {
        "pm25": {
          "aqi": 9,
          "value": 1.7,
          "units": "ug/m3"
        },
        "pm10": null,
        "ozone": null
      },
      "forecastCategoryWorst": "Good",
      "wildfireSmokeRelated": false,
      "formalAlertActive": false,
      "freshnessMinutes": 30,
      "confidence": "high"
    },
    {
      "segmentId": "aqp4_issaquah",
      "segmentName": "East Lake Sammamish south / Issaquah",
      "sourceMonitorId": "ECO-01:19",
      "currentAqi": 22,
      "currentCategory": "Good",
      "dominantPollutant": "ozone",
      "pollutants": {
        "pm25": {
          "aqi": 9,
          "value": 1.6,
          "units": "ug/m3"
        },
        "pm10": null,
        "ozone": {
          "aqi": 22,
          "value": 0.027,
          "units": "ppm"
        }
      },
      "forecastCategoryWorst": "Good",
      "wildfireSmokeRelated": false,
      "formalAlertActive": false,
      "freshnessMinutes": 30,
      "confidence": "high"
    }
  ],
  "events": [
    {
      "eventType": "smoke_forecast",
      "title": "Ecology smoke forecast",
      "status": "forecast",
      "severity": "good",
      "effectiveAt": "2026-07-29T07:00:00-07:00",
      "expiresAt": null,
      "areas": [
        "Seattle-Bellevue-Kent Valley"
      ],
      "routeRelevant": true,
      "sourceId": "ECO-02"
    }
  ],
  "advisories": [],
  "sourceProvenance": [
    {
      "sourceId": "ECO-01",
      "sourceName": "WA Ecology Hourly Results",
      "retrievedAt": "2026-07-29T19:35:00Z",
      "sourceTimestamp": "2026-07-29T19:00:00Z",
      "status": "ok",
      "stale": false
    },
    {
      "sourceId": "ECO-02",
      "sourceName": "WA Ecology Smoke Forecast",
      "retrievedAt": "2026-07-29T19:36:00Z",
      "sourceTimestamp": "2026-07-29T07:00:00-07:00",
      "status": "ok",
      "stale": false
    }
  ],
  "diagnostics": {
    "pipelineHealth": {
      "status": "ok",
      "errors": [],
      "warnings": []
    },
    "staleDataState": {
      "hasStaleSource": false,
      "staleSourceIds": []
    },
    "lastSuccessfulUpdate": "2026-07-29T19:36:00Z",
    "sourceHealth": [
      {
        "sourceId": "ECO-01",
        "httpStatus": 200,
        "recordCount": 4,
        "contentType": "text/plain; charset=UTF-8",
        "retrievedAt": "2026-07-29T19:35:00Z",
        "sourceTimestamp": "2026-07-29T19:00:00Z",
        "status": "ok",
        "error": null
      }
    ]
  }
}
```
