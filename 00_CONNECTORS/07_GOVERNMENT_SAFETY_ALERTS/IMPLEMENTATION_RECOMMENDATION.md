# IMPLEMENTATION_RECOMMENDATION

## Recommended MVP source set

### MVP
- `NWS-01` - route-wide structured alert backbone
- `SEA-01` - Seattle emergency-management public feed
- `UW-01` - University of Washington public emergency feed

### Secondary
- `SEAFD-01` - official Seattle fire public-information feed
- `SEAPD-01` - official Seattle police public-information feed
- `DOH-02` - statewide public-health alert table
- `ST-01` - Sound Transit alternate-transport alert context
- `KCMETRO-01` - King County Metro alternate-transport alert context

### Explicit follow-up, not MVP
- `WSDOT-01` - high-value but credential-gated
- `REDM-01` - promising but widget access not stable here
- `BOTH-01`, `WOOD-01`, `ISS-01` - public mechanisms exist, but only zero-alert states were visible during testing
- `FEMA-01` - live all-hazards CAP feed is access-controlled

## Rejected sources and why

- `NOAA-LEGACY-01`: legacy host failed and is superseded by the modern NWS stack
- `KCEM-01`: authoritative subscriber system, not a public pull source
- `RPIN-LEGACY-01`: legacy naming, not a distinct connector
- `BEL-01`, `KIRK-01`, `SAM-01`: informational or signup-only surfaces, not unattended feeds
- `WAEMD-01`: statewide directory, not a live incident source
- `FEMA-02`: useful for retrospective audit only, not live monitoring
- `WSP-01`: official site blocked by JavaScript challenge from this environment

## Acquisition cadence

- `NWS-01`: every `5-15` minutes
- `SEA-01`: every `15` minutes
- `UW-01`: every `15` minutes
- `SEAFD-01`, `SEAPD-01`: every `15-30` minutes
- `DOH-02`: every `6` hours
- `ST-01`, `KCMETRO-01`: every `15` minutes, but publish in a separate alternate-transport block

## Freshness, failure, fallback, and last-known-good rules

### Freshness
- mark `NWS-01`, `SEA-01`, `UW-01`, `ST-01`, `KCMETRO-01` stale after `15` minutes beyond expected refresh
- mark `SEAFD-01` and `SEAPD-01` stale after `30` minutes for acute incidents
- mark `DOH-02` stale after `6` hours

### Failure detection
- HTTP non-200
- parse failure
- structurally valid response with obviously broken content
- stale timestamp beyond threshold

### Last-known-good policy
- preserve last successful normalized output for all public sources
- never silently replace good data with an empty error response
- attach pipeline-health diagnostics when a source fails

### Fallback policy
- if `SEA-01` fails, keep `UW-01`, `SEAFD-01`, and `SEAPD-01` running for Seattle-origin context
- if `UW-01` fails, rely on `SEA-01` plus the Seattle public-safety feeds
- if `NWS-01` fails, do not pretend the route is clear; surface degraded-state language and preserve the last known good alert set

## Deduplication strategy

### Source-native identity keys
- CAP-based sources: `cap_identifier`
- WordPress sources: `source_id + post_id`
- CivicPlus AlertCenter sources: `source_id + alert_id_or_link`
- GTFS alerts: `source_id + entity_id`

### Cross-source clustering keys
- normalized headline
- normalized event type
- normalized place token set
- effective-time bucket
- CAP references/update chain when available

### Priority order when the same event appears in multiple places
1. `NWS-01` when the event is a CAP/public-warning type and the CAP identifier exists
2. `UW-01` for campus-origin incidents
3. `SEA-01` for Seattle OEM-origin incidents
4. municipal city feeds when they add route-local specificity not present in NWS
5. `SEAFD-01` / `SEAPD-01` only as corroborating or early context, not as final canonical ownership

## High-level future n8n design

Do not build this in this assignment. The recommended future structure is:

1. Trigger on schedule
2. Fetch `NWS-01`, `SEA-01`, `UW-01`, and selected secondary sources
3. Normalize each source to a shared event shape
4. Apply lane-ownership event filters
5. Apply route-relevance logic by source class
6. Deduplicate by source-native ids, then by cross-source cluster keys
7. Build public summary plus diagnostic block
8. Validate schema and freshness
9. Atomically write the website-ready output while preserving the last known good result

## Production output recommendations

- one public card for government/public-safety alerts
- one separate alternate-transport block for `ST-01` and `KCMETRO-01`
- explicit labels for:
  - `no current alerts`
  - `stale data`
  - `partial data`
  - `manual review required`
  - `alternate transport impacted`

## Risks

- eastside municipal public coverage is still weaker than Seattle/UW coverage
- WSDOT adds real value but is still unresolved
- NWS will surface hazards owned by other lanes unless filters are strict
- police/fire editorial feeds are noisy and can over-alert if location parsing is loose

## Next implementation step

Implement the MVP only:
- `NWS-01`
- `SEA-01`
- `UW-01`

Then add:
- `SEAFD-01`
- `SEAPD-01`
- `DOH-02`

Only after that, spend effort on `WSDOT-01` and the weaker eastside city systems.
