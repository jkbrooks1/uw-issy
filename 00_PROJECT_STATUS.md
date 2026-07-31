# UW–Issaquah Route Monitor — Project Status

**Last updated:** 2026-07-31 PDT

## Current phase

Architecture documentation and repository mise-en-place are approved for the first executable connector build specification.

## Project root

`/Users/jkbrookspersonal/LocalSiteBuildFiles/BTF_UW-Issy_Route_Monitor`

## Canonical route

Canonical GPX:

`data/route/UnivWA-Issaquah.gpx`

## Architecture status

- shared connector standard exists in `00_CONNECTORS/00_SHARED_AUTONOMOUS_CONNECTOR_BUILD_STANDARD.md`
- six connector implementation decisions are now approved and recorded in `00_CONNECTORS/00_OPEN_CONNECTOR_ARCHITECTURE_DECISIONS.md`
- the repository runtime structure is approved under `data/connectors/`
- the first executable connector build specification may now proceed
- `02_WEATHER` remains the intended first executable specification
- Cloudflare deployment decisions remain deferred
- workflow-08 deployment and notification decisions remain deferred

## Approved runtime structure

- Hetzner runtime root: `/srv/uw_issy_route_monitor/`
- local repository mirror: `data/connectors/`
- site-facing public output remains `public/data/`, owned only by workflow `08`

## Current status

- governance and connector architecture documents are in place
- lane research corpus exists for connectors `01` through `07`
- approved empty connector runtime directories now exist locally
- no n8n workflow was created or modified in this task
- no deployment was performed in this task

## Next phase

1. Author the first executable connector build specification for `02_WEATHER`.
2. Keep WSDOT optional and non-blocking in that first Weather specification.
3. Define executable manifests, validators, and evidence outputs against the approved `data/connectors/` structure.
4. Leave Cloudflare and workflow-08 deployment design deferred until their remaining open decisions are resolved.
