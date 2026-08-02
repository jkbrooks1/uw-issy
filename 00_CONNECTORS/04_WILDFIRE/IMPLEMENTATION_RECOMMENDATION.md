# IMPLEMENTATION_RECOMMENDATION.md — 04_WILDFIRE

## Recommended MVP source set

Use these five sources for the first production implementation:

1. `NIFC-01` — WFIGS Current Wildland Fire Locations
2. `NIFC-02` — WFIGS Current Interagency Fire Perimeters
3. `NWS-01` — NOAA / NWS active alerts API
4. `NOAA-01` — NOAA HMS smoke polygons
5. `KC-01` — King County Fire Safety Burn Bans

Why this is the MVP:

- it covers the core signal classes the work order required:
  - active fire point
  - active fire perimeter
  - Red Flag Warning / Fire Weather Watch
  - smoke extent
  - county burn restriction
- every MVP source was tested live in this environment
- every MVP source is official
- only one MVP source (`KC-01`) is HTML-only; the rest are structured feeds or downloads

## Recommended secondary sources

- `DNR-01` — Washington-specific incident corroboration and small-fire context
- `DNR-02` — route-point fire-danger and DNR burn-ban context
- `EFR-01` — local Sammamish / Issaquah burn-restriction context
- `INCIWEB-01` — official incident narrative enrichment and incident-page URLs
- `KC-TRAIL-01` — authoritative fire-caused closure fallback for ELST sections
- `SEA-TRAIL-01` — authoritative fire-caused closure fallback for the Seattle Burke-Gilman section
- `NASA-01` — enable later only after credentialing and live retesting

## Rejected sources

- `DNR-03` — official dashboard shell, but the underlying DNR services are the better automation targets
- `KC-02` — official but signup-only
- `WAEMD-01` — official guidance hub, not a direct feed
- `WSPARKS-01` — route not dependent on a Washington State Park segment
- `PULSEPOINT-01` — wrong signal shape for an urban wildfire route monitor

## Acquisition cadence

Recommended poll / fetch cadence:

- Every 15 minutes:
  - `NIFC-01`
  - `NIFC-02`
  - `NWS-01`
- Every 60 minutes:
  - `NOAA-01`
- Every 6 hours:
  - `KC-01`
  - `DNR-02`
  - `EFR-01`
  - route-owner closure fallbacks
- Every 30 minutes:
  - `INCIWEB-01`
- Disabled until credentials are added:
  - `NASA-01`

Important WFIGS implementation note:

- do not burst parallel queries against both WFIGS services at high volume
- the live tests hit an ArcGIS Online request-unit `429`
- serialize route queries and reuse incident IDs instead of spraying ad hoc lookups

## Route-relevance logic

Use a geometry-first relevance pipeline:

1. Apply source-specific incident-type filtering before distance filtering.
2. Apply a route-bbox prefilter only to reduce network / compute cost.
3. Apply the real route-distance or route-intersection rule from `ROUTE_RELEVANCE_AND_THRESHOLDS.md`.
4. Only then classify severity.

Never use these as the sole route-relevance rule:

- county membership alone
- city name alone
- keyword matching alone
- source presence in Washington alone

## Freshness, failure, and fallback behavior

### Freshness

- `NIFC-01`, `NIFC-02`, `NWS-01`: stale after 15 minutes
- `NOAA-01`: stale after 24 hours
- `KC-01`, `DNR-02`, `EFR-01`: stale after 6 hours
- `INCIWEB-01`: stale after 30 minutes

### Failure behavior

If one source fails:

- keep the last-known-good normalized output for that source
- mark the source `stale` or `error`
- do not infer "no wildfire issue" from a failed source

If a primary source family fails:

- WFIGS locations fail: keep perimeters + NWS + DNR context; reduce confidence on new-point detection
- WFIGS perimeters fail: keep locations + InciWeb + DNR; reduce confidence on perimeter-based impact
- NWS fails: keep WFIGS + burn-ban pages + smoke polygons, but do not publish a clean fire-weather state
- HMS fails: keep warning and incident layers, but remove smoke-extent confidence
- King County burn-ban page fails: preserve last-known-good county restriction and lower confidence

### Last-known-good behavior

- Preserve last successful normalized output atomically.
- Add explicit fields for `stale_data`, `source_errors`, and `last_successful_update`.
- Never auto-clear an active fire / warning / closure only because one poll failed.

## Proposed high-level n8n design

This is planning only. No workflow was built in this cycle.

Recommended node groups:

1. Trigger
   - Cron nodes with split cadences: 15-minute, hourly, 6-hour
2. Fetch
   - HTTP Request nodes for WFIGS, NWS, DNR, King County, EFR, InciWeb
   - optional later branch for FIRMS
3. Parse
   - JSON parse for ArcGIS and NWS
   - XML parse for RSS
   - HTML extraction for county / local burn pages
   - dated-file discovery for NOAA HMS
4. Normalize
   - convert each source into a common event / advisory shape
5. Route relevance
   - route buffer test for points / polygons
   - zone / UGC matching for NWS alerts with null geometry
   - trail / street / facility matching for closure pages
6. Deduplication
   - join `NIFC-01` and `NIFC-02` by `UniqueFireIdentifier`
   - join `INCIWEB-01` to WFIGS by incident name and Washington state code
   - keep burn restrictions separate from active fire incidents
7. Severity and freshness
   - assign route severity, freshness, confidence, and public summary
8. Publish
   - write compact public JSON
   - write diagnostic JSON
   - preserve last-known-good on write failure

## Production output recommendation

The normalized wildfire output should emphasize:

- route summary first
- route-segment impacts second
- active wildfire events and smoke / warning advisories separately
- explicit freshness and confidence
- source provenance per event

Do not ship:

- raw ArcGIS feature dumps
- full KML blobs
- full HTML bodies
- uncorroborated satellite detections as rider-facing wildfire incidents

## Key risks

1. Evacuation automation remains weak because no good public feed was found.
2. HTML-only burn-ban and closure pages can change template structure.
3. WFIGS can rate-limit burst traffic.
4. NOAA HMS has stable dated files, not a stable current alias.
5. FIRMS is still untested with a real key.

## Next implementation step

The next concrete step should be a non-production prototype that does only this:

1. fetch `NIFC-01`, `NIFC-02`, `NWS-01`, `NOAA-01`, and `KC-01`
2. apply the route-threshold rules from `ROUTE_RELEVANCE_AND_THRESHOLDS.md`
3. emit one normalized JSON sample and one diagnostics JSON sample
4. confirm polite WFIGS polling does not trigger the `429` request-unit limit
