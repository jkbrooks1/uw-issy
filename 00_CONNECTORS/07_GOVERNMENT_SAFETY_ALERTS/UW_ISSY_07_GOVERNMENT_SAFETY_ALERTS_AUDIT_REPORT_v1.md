# UW_ISSY_07_GOVERNMENT_SAFETY_ALERTS_AUDIT_REPORT_v1

Prepared on Wednesday, July 29, 2026.

## Files inspected

- Project governance:
  - `CLAUDE.md`
  - `AGENTS.md`
  - `00_PROJECT_RULES.md`
  - `00_PROJECT_STATUS.md`
  - external canonical rules file:
    `/Users/jkbrookspersonal/LocalSiteBuildFiles/BTF_local_CDM_STATUS_PAGE_PROJECT_V2_CONNECTOR_UI/00_PROJECT RULES.md`
- Template/reference lanes:
  - `00_CONNECTORS/01_ROUTE_CONDITIONS/`
  - `00_CONNECTORS/02_WEATHER/`
- Canonical route:
  - `data/route/UnivWA-Issaquah.gpx`

## Endpoints tested

- NWS modern alerts:
  - route point
  - King County zone
  - Washington statewide
  - Atom
  - per-alert CAP XML
- AlertSeattle RSS and JSON
- Seattle Fire RSS
- Seattle Police RSS and Significant Incident Reports page
- UW Alert RSS and JSON
- ALERT King County page
- Redmond page, AlertCenter, RSS, and Everbridge widget
- Bothell AlertCenter and RSS
- Woodinville AlertCenter and RSS
- Sammamish emergency-management page
- Issaquah AlertCenter, RSS, and Notify Me list
- Washington EMD alerts page
- DOH Health and Safety Alerts landing page
- WA HAN public table
- Sound Transit alerts JSON
- King County Metro alerts JSON
- WSDOT Highway Alerts no-key probe
- FEMA IPAWS archive metadata and count query
- FEMA IPAWS live-feed documentation page
- WSP home, missing-persons, and amber-alert pages

## Validation performed

- required-file existence check
- JSON parse validation for:
  - `SOURCE_REGISTRY.json`
  - `UW_ISSY_07_GOVERNMENT_SAFETY_ALERTS_FINAL_SOURCE_REGISTRY_v1.json`
- source-id set comparison between those two JSON files
- placeholder-marker search across the connector directory

## Validation results summary

- required files present: yes
- source registry JSON validity: yes
- final source registry JSON validity: yes
- source-id parity between source registries: yes (`24` ids in each file, exact match)
- MVP live-testing requirement:
  - `NWS-01` tested live
  - `SEA-01` tested live
  - `UW-01` tested live
- placeholder-marker search in connector directory: no hits
- Downloads copies:
  - required copy step attempted
  - all four copy operations failed with `Operation not permitted`
  - no Downloads files existed afterward, so SHA-256 parity in Downloads could not be completed

## Known limitations

- `WSDOT-01` remains unresolved because this was a public unauthenticated research cycle
- eastside municipal emergency systems remain weaker than Seattle/UW public coverage
- `REDM-01` was not stable enough from this environment to reach MVP or even fully verified secondary status
- `WSP-01` was blocked by bot protection
- writing to `/Users/jkbrookspersonal/Downloads` is not permitted in this environment, which prevents satisfying the required copy-and-hash step from inside this run

## Honest audit position

This lane is not a failure. The core assignment was completed: sources were
researched, stronger candidates were tested live, route relevance was designed,
the normalized schema was proposed, and a clear implementation recommendation was
produced.

The overall status should remain `PARTIAL` if either of the following is true:
- Downloads copies cannot be created and SHA-matched from this environment
- the user wants every high-value official follow-up source fully closed before a
  pass-grade handoff

The overall status can still be a strong `PARTIAL` because the MVP source set is
fully verified and implementation-ready.

PARTIAL
