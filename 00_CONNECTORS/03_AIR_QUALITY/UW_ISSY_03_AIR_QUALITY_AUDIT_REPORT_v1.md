# UW_ISSY_03_AIR_QUALITY_AUDIT_REPORT_v1

Prepared: July 29, 2026

## 1. Scope of this audit

This audit covers research/planning deliverables only for Lane `03_AIR_QUALITY`.
No production n8n workflow exists for this lane yet, so no import/run proof is
applicable in this cycle.

## 2. Files inspected before research

- Project root existed and was readable
- Canonical GPX existed and was readable:
  `data/route/UnivWA-Issaquah.gpx`
- Connector directory existed and originally contained only a starter
  `README.md`
- Read:
  - `CLAUDE.md`
  - `AGENTS.md`
  - `00_PROJECT_RULES.md`
  - `00_PROJECT_STATUS.md`
- Reviewed, read-only, as format/context templates:
  - `00_CONNECTORS/01_ROUTE_CONDITIONS/`
  - `00_CONNECTORS/02_WEATHER/`

## 3. Endpoints and sources directly tested

### AirNow

- `reportingarea.dat` — `200`
- `cityzipcodes.csv` — `200`
- auth-gated current-observation web service with invalid key — `401`

### Washington Ecology

- hourly-monitor service metadata — `200`
- hourly-monitor route query — `200`
- smoke-forecast metadata — `200`
- smoke-forecast route query — `200`

### PSCAA

- technical-tools discovery page — `200`
- sensor-map page — `200`
- burn-ban status page — `200`
- network-map `GetStations` — `200`
- network-map `Geometries` — `200`
- network-map `Aqi` without bootstrap — `200` functional failure (`Session was null`)
- network-map `Aqi` with bootstrap cookie — `200` success
- `ThreeTile` test — `500`

### Other official/adjacent sources

- Washington Smoke Blog RSS — `200`
- NWS Air Quality Alert GeoJSON feed — `200`
- King County guidance page — `200`
- Seattle guidance page — `200`

## 4. HTTP/results summary

The required MVP-classified sources were all tested live:

- `ECO-01`
- `ECO-02`

Key live results:

- `ECO-01` returned 4 route-near official monitors in the corridor bbox at the
  latest hour
- `ECO-02` returned a live route-intersecting summer smoke-forecast polygon
- `AIRNOW-02` returned real current rows for
  `Seattle-Bellevue-Kent Valley`
- `PSCAA-02` returned live burn-ban status HTML

## 5. JSON validation

Validated successfully:

- `SOURCE_REGISTRY.json`
- `UW_ISSY_03_AIR_QUALITY_FINAL_SOURCE_REGISTRY_v1.json`
- all JSON files saved under `sample-responses/`

`SOURCE_REGISTRY.json` and the final registry copy were also checked for source
ID agreement and matched exactly on the same 11 `source_id` values.

## 6. Required-file audit

Required working deliverables present:

- `README.md`
- `SOURCE_REGISTRY.md`
- `SOURCE_REGISTRY.json`
- `RESEARCH_FINDINGS.md`
- `API_AND_FEED_TEST_RESULTS.md`
- `SOURCE_GAPS.md`
- `IMPLEMENTATION_RECOMMENDATION.md`
- `ROUTE_RELEVANCE_AND_THRESHOLDS.md`
- `ENV_AND_READINESS.md`
- `NORMALIZED_SCHEMA_PROPOSAL.md`
- `OVERLAP_NOTES.md`
- `SESSION_LOG.md`

Required final polished deliverables present:

- `UW_ISSY_03_AIR_QUALITY_FINAL_RESEARCH_REPORT_v1.md`
- `UW_ISSY_03_AIR_QUALITY_IMPLEMENTATION_RECOMMENDATION_v1.md`
- `UW_ISSY_03_AIR_QUALITY_AUDIT_REPORT_v1.md`
- `UW_ISSY_03_AIR_QUALITY_FINAL_SOURCE_REGISTRY_v1.json`

Supporting material present:

- `sample-responses/` with small saved evidence artifacts

## 7. Placeholder / secret audit

- marker scan found no unfinished-work markers
- no credentials, cookies, tokens, or secret values were written into any file
  in this connector directory
- no France/CDM-specific endpoints or assumptions were copied into these lane
  deliverables

## 8. Downloads-copy validation

The four required polished files were **not** copied to
`/Users/jkbrookspersonal/Downloads` in this session because the runtime sandbox
does not grant write permission to `/Users/jkbrookspersonal/Downloads`.

This is a real environment limitation, not an omitted step. A direct copy
attempt failed with `PermissionError: [Errno 1] Operation not permitted`.
Accordingly, no SHA-256 source-vs-Downloads comparison could be completed in
this session.

## 9. Limitations

1. PM10 support exists structurally in the strongest current source, but the
   route-near live rows on July 29, 2026 had null PM10 values.
2. `PSCAA-01` is real but stateful; it is not as clean for unattended use as
   Ecology’s ArcGIS services.
3. `AIRNOW-02` is useful but coarse; it should not be the only route-segmentation
   source.
4. `PSCAA-03` remains unresolved because the corrected-sensor data export path
   was not fully verified this cycle.
5. The eventual production host should re-test Ecology once in that host’s own
   TLS environment even though the service clearly returned live data in this
   cycle.

## 10. Final status

PARTIAL
