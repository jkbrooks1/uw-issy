# WHOLE-JOB WORK ORDER: UW–Issaquah Connector 02 Weather Source Research

## OBJECTIVE

Research, test, classify, and document the best official monitoring sources for:

`02_WEATHER`

for the UW–Issaquah cycling route:

University of Washington → Burke-Gilman Trail → Sammamish River Trail → Marymoor Park → East Lake Sammamish Trail → Issaquah.

This assignment is for source discovery, source testing, route-point design, and implementation planning.

Do not build the production n8n workflow during this assignment.

## PROJECT LOCATIONS

Project root:

`/Users/jkbrookspersonal/LocalSiteBuildFiles/BTF_UW-Issy_Route_Monitor`

Assigned connector directory:

`/Users/jkbrookspersonal/LocalSiteBuildFiles/BTF_UW-Issy_Route_Monitor/00_CONNECTORS/02_WEATHER`

Canonical corrected GPX:

`/Users/jkbrookspersonal/LocalSiteBuildFiles/BTF_UW-Issy_Route_Monitor/data/route/UnivWA-Issaquah.gpx`

Reference CDM project:

`/Users/jkbrookspersonal/LocalSiteBuildFiles/BTF_local_CDM_STATUS_PAGE_PROJECT`

Project build log:

`/Users/jkbrookspersonal/LocalSiteBuildFiles/BTF_UW-Issy_Route_Monitor/00_PROJECT_BUILDLOG.md`

Downloads directory:

`/Users/jkbrookspersonal/Downloads`

Read and follow:

`/Users/jkbrookspersonal/LocalSiteBuildFiles/BTF_UW-Issy_Route_Monitor/CLAUDE.md`

Also inspect:

`/Users/jkbrookspersonal/LocalSiteBuildFiles/BTF_UW-Issy_Route_Monitor/AGENTS.md`

`/Users/jkbrookspersonal/LocalSiteBuildFiles/BTF_UW-Issy_Route_Monitor/00_PROJECT_RULES.md`

`/Users/jkbrookspersonal/LocalSiteBuildFiles/BTF_UW-Issy_Route_Monitor/00_PROJECT_STATUS.md`

Use the corrected canonical GPX currently present in the project. Do not rely on route analysis derived from an older GPX.

Do not modify the reference CDM project.

Do not ask the user to manually create, edit, move, rename, combine, or copy deliverables.

## CONNECTOR 02 SCOPE

Connector 02 covers weather conditions that materially affect cycling along the route.

Research monitoring capabilities for:

- current conditions
- hourly forecast
- near-term forecast
- precipitation probability
- precipitation type and amount
- temperature
- apparent temperature or heat index
- wind speed
- wind gusts
- wind direction
- visibility
- thunderstorms
- lightning-related alerts
- snow or freezing precipitation
- frost or ice potential
- excessive heat
- dense fog
- high wind
- severe weather
- official weather alerts
- observation freshness
- forecast freshness

Do not duplicate the primary responsibilities of:

- `03_AIR_QUALITY`
- `04_WILDFIRE`
- `05_FLOOD_CONDITIONS`
- `07_GOVERNMENT_SAFETY_ALERTS`

Weather alerts may be acquired in this lane when they originate from an official meteorological source. Document any overlap with other lanes.

## FIRST: VERIFY THE MISE EN PLACE

Before beginning web research:

1. Confirm the project root exists.
2. Confirm the corrected canonical GPX exists and is readable.
3. Confirm the Connector 02 directory exists.
4. Inspect all existing Connector 02 files.
5. Inspect the reference CDM project for reusable:
   - weather connector architecture
   - route-point matching
   - threshold logic
   - freshness handling
   - source-health reporting
   - atomic output
   - last-known-good preservation
   - testing conventions
   - audit formats
6. Do not copy Météo-France endpoints, credentials, geographic assumptions, station mappings, or production data.
7. Append the initial inspection result to the project build log.

## ROUTE-POINT DESIGN

Analyze the corrected canonical GPX and recommend the minimum useful set of weather monitoring points.

The design must capture meaningful weather variation without creating unnecessary requests.

Evaluate likely representative points around:

- University of Washington / Seattle
- north Lake Washington / Kenmore or Bothell
- Woodinville or Sammamish River Trail
- Redmond / Marymoor Park
- East Lake Sammamish / Sammamish
- Issaquah

Do not assume these are the correct final points.

For each recommended point, record:

- point ID
- point name
- latitude
- longitude
- route mile or approximate route position
- route sections represented
- rationale
- nearest forecast grid
- nearest useful observation station
- fallback station or point
- verification status

Determine whether separate forecast and observation point sets are needed.

## PRIMARY SOURCE TARGETS

Research official sources first, including:

- National Weather Service API
- National Weather Service Seattle/Tacoma forecast office
- api.weather.gov
- NWS forecast-grid endpoints
- NWS hourly forecast endpoints
- NWS active-alert endpoints
- NWS station and observation endpoints
- NOAA services where materially useful
- Washington State official meteorological or road-weather sources when relevant
- University of Washington weather observations when official, stable, and useful
- WSDOT road-weather stations only where they provide material route value

Third-party commercial weather services must not be recommended as primary sources unless official sources leave a documented, material gap.

## REQUIRED NWS API ANALYSIS

At minimum, evaluate and test:

- `/points/{latitude},{longitude}`
- forecast URL returned by the points endpoint
- hourly forecast URL returned by the points endpoint
- forecast-grid data URL
- observation-station listing
- recent station observations
- active alerts by point
- active alerts by zone
- alert geometry and affected-area fields

Determine:

- required headers
- recommended User-Agent format
- response formats
- stable identifiers
- pagination behavior
- rate-limit guidance
- caching guidance
- update frequency
- publication delay
- timestamp fields
- expiration fields
- grid-office assignments
- forecast-zone assignments
- county-zone assignments
- fire-weather-zone assignments
- station availability
- missing-data behavior
- stale-observation behavior
- alert lifecycle behavior

Do not claim a rate limit or service guarantee unless it is documented.

## WEATHER FIELD EVALUATION

Determine whether the recommended official source set can reliably provide:

- observation timestamp
- observation station
- temperature
- dew point
- relative humidity
- heat index
- wind chill
- wind direction
- sustained wind
- wind gust
- visibility
- barometric pressure
- precipitation
- current textual conditions
- hourly temperature
- hourly precipitation probability
- hourly wind
- forecast periods
- alert event type
- alert severity
- alert urgency
- alert certainty
- alert onset
- alert effective time
- alert expiration
- alert instruction
- alert description
- alert geometry or affected zones

Document unavailable, inconsistent, or derived fields.

## CYCLING THRESHOLDS

Recommend initial rider-relevant thresholds for the UW–Issaquah route.

At minimum, assess thresholds for:

- sustained wind
- wind gusts
- high temperature
- low temperature
- apparent temperature
- precipitation probability
- precipitation amount
- visibility
- thunderstorms
- snow or freezing precipitation
- dense fog
- official watches, warnings, and advisories

Reuse CDM threshold patterns only where they remain appropriate for Seattle-area cycling.

Clearly distinguish:

- inherited CDM threshold
- Washington-specific adjustment
- proposed threshold
- unresolved threshold requiring user approval

Do not silently treat thresholds as final policy.

## SOURCE EVALUATION FIELDS

For every credible source, record:

- monitoring lane
- source ID
- source name
- owning agency
- official source URL
- documentation URL
- access method
- acquisition classification
- machine-readable availability
- authentication requirements
- terms or usage constraints
- geographic coverage
- route points or sections covered
- available fields
- geometry availability
- update frequency
- typical publication delay
- historical availability
- pagination behavior
- documented rate limits
- recommended freshness threshold
- failure-detection method
- last-known-good suitability
- fallback method
- manual-review requirement
- recommendation class
- verification status
- evidence URLs
- research notes

Use one acquisition classification:

- `DIRECT_API`
- `DOCUMENTED_FEED`
- `OPEN_DATA_DOWNLOAD`
- `STRUCTURED_WEBPAGE`
- `UNSTRUCTURED_WEBPAGE`
- `PDF_OR_DOCUMENT_NOTICE`
- `EMAIL_OR_SMS_ALERT_ONLY`
- `MANUAL_REVIEW_ONLY`
- `UNUSABLE`

Use one recommendation class:

- `MVP`
- `SECONDARY`
- `REJECT`
- `UNRESOLVED`

Use one verification state:

- `VERIFIED`
- `PARTIALLY_VERIFIED`
- `UNVERIFIED`
- `BLOCKED`
- `REQUIRES_MANUAL_REVIEW`

## ACCESS TESTING

Test candidate sources directly.

Where applicable:

1. Record tested URL or endpoint.
2. Record HTTP status.
3. Record response content type.
4. Confirm command-line acquisition works.
5. Identify required headers.
6. Identify timestamps.
7. Identify stable IDs.
8. Identify coordinates and geometry.
9. Identify pagination.
10. Identify stale-data behavior.
11. Identify missing-data behavior.
12. Save only small sanitized samples when useful.
13. Do not save large redundant datasets.
14. Do not save credentials, cookies, tokens, or secret-bearing responses.

Test multiple representative points along the corrected route.

## PROPOSED CONNECTOR ARCHITECTURE

Recommend a future n8n architecture for Connector 02, but do not implement it yet.

The recommendation must address:

- schedule cadence
- forecast-point acquisition
- hourly forecast acquisition
- observations
- alert acquisition
- route-point iteration
- normalization
- threshold evaluation
- route-section assignment
- source-health output
- stale-data handling
- partial source failure
- last-known-good preservation
- atomic JSON writing
- deduplication
- alert expiration
- logging
- validation
- production output files
- test fixtures

Determine whether forecast, observations, and alerts should be:

- one workflow
- separate workflows
- separate acquisition branches inside one workflow

Explain the tradeoffs and recommend one design.

## REQUIRED INTERNAL DELIVERABLES

Create or update these authoritative files in:

`/Users/jkbrookspersonal/LocalSiteBuildFiles/BTF_UW-Issy_Route_Monitor/00_CONNECTORS/02_WEATHER`

Required files:

- `README.md`
- `SOURCE_REGISTRY.md`
- `SOURCE_REGISTRY.json`
- `RESEARCH_FINDINGS.md`
- `API_AND_FEED_TEST_RESULTS.md`
- `SOURCE_GAPS.md`
- `IMPLEMENTATION_RECOMMENDATION.md`
- `ROUTE_WEATHER_POINT_MAPPING.md`
- `WEATHER_THRESHOLD_RECOMMENDATIONS.md`

Create supporting directories only when materially useful:

- `sample-responses/`
- `schemas/`
- `scripts/`
- `tests/`

Do not create empty decorative directories.

The Markdown and JSON registries must agree.

Validate all JSON.

## FINAL POLISHED DELIVERABLES

Create these authoritative polished reports in the Connector 02 directory:

- `UW_ISSY_02_WEATHER_FINAL_RESEARCH_REPORT_v1.md`
- `UW_ISSY_02_WEATHER_IMPLEMENTATION_RECOMMENDATION_v1.md`
- `UW_ISSY_02_WEATHER_AUDIT_REPORT_v1.md`

The final research report must consolidate:

- corrected-route analysis
- recommended weather points
- source-discovery method
- verified source landscape
- NWS API findings
- observation-station findings
- alert findings
- rejected and unresolved sources
- coverage gaps

The implementation recommendation must consolidate:

- recommended MVP source set
- secondary sources
- recommended route points
- acquisition cadence
- normalized data model
- thresholds
- freshness rules
- failure behavior
- fallback behavior
- last-known-good behavior
- proposed n8n design
- production output recommendations
- risks
- next implementation step

The audit report must document:

- files inspected
- endpoints tested
- representative points tested
- HTTP results
- JSON validation
- file validation
- Downloads-copy validation
- limitations
- unresolved issues
- final status of `PASS`, `PARTIAL`, `BLOCKED`, or `FAIL`

Create this polished source registry only when useful for direct review:

- `UW_ISSY_02_WEATHER_FINAL_SOURCE_REGISTRY_v1.json`

## DOWNLOADS RULE

Copy only these polished files to:

`/Users/jkbrookspersonal/Downloads`

Required:

- `UW_ISSY_02_WEATHER_FINAL_RESEARCH_REPORT_v1.md`
- `UW_ISSY_02_WEATHER_IMPLEMENTATION_RECOMMENDATION_v1.md`
- `UW_ISSY_02_WEATHER_AUDIT_REPORT_v1.md`

Optional only when produced and useful:

- `UW_ISSY_02_WEATHER_FINAL_SOURCE_REGISTRY_v1.json`

Do not copy working notes, samples, schemas, scripts, internal registries, README files, logs, fixtures, drafts, or temporary files to Downloads.

Verify Downloads copies against the authoritative project files using SHA-256.

## SCRIPT RULE

Place project-specific scripts under either:

`/Users/jkbrookspersonal/LocalSiteBuildFiles/BTF_UW-Issy_Route_Monitor/scripts`

or:

`/Users/jkbrookspersonal/LocalSiteBuildFiles/BTF_UW-Issy_Route_Monitor/00_CONNECTORS/02_WEATHER/scripts`

Copy every new or materially revised script to:

`/Users/jkbrookspersonal/00_SCRIPTS`

Do not copy scripts to Downloads.

Every execution script must append an execution record to the project build log.

## BUILD LOG

Append all material progress and the final result to:

`/Users/jkbrookspersonal/LocalSiteBuildFiles/BTF_UW-Issy_Route_Monitor/00_PROJECT_BUILDLOG.md`

Record:

- timestamp
- connector
- objective
- route file used
- sources researched
- endpoints tested
- files created or revised
- scripts created
- validation performed
- Downloads copies created
- result
- limitations
- recommended next action

Do not overwrite existing history.

## VALIDATION BEFORE COMPLETION

Before reporting completion:

1. Confirm the corrected canonical GPX was used.
2. Confirm all required Connector 02 files exist.
3. Confirm all recommended weather points have evidence-based coordinates.
4. Confirm all MVP endpoints were tested.
5. Confirm source URLs remain accessible.
6. Validate all JSON.
7. Confirm Markdown and JSON registries agree.
8. Confirm no credentials or secrets were saved.
9. Confirm no Météo-France production assumptions were copied.
10. Confirm only approved polished deliverables entered Downloads.
11. Confirm Downloads copies match using SHA-256.
12. Confirm the project build log was appended.
13. Provide a concise final status report.

## EXECUTION AUTHORITY

You are authorized to:

- inspect the UW–Issaquah project
- inspect the reference CDM project without modifying it
- process the corrected canonical GPX
- search the public web
- access public official APIs
- run command-line endpoint tests
- create and revise Connector 02 files
- create scripts and tests
- copy scripts to `/Users/jkbrookspersonal/00_SCRIPTS`
- copy only approved final reports to Downloads
- update the project build log

Do not build the production n8n workflow during this assignment.

Proceed autonomously through inspection, research, testing, documentation, validation, file placement, Downloads copying, and build-log updates. Do not stop for clarification when a reasonable evidence-based decision can be made. Document assumptions, failures, and unresolved gaps honestly.
