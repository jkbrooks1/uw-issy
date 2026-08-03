# 20_STATUS_PUBLISHER — As Built

**n8n workflow:** `v0001.20_StatusPublisherConnector`, id `gp8WlccGwLydNWG7`, 36 nodes, `active: false`.
**Status:** Live-verified. Reads all 7 connectors' real published output, rolls it up, writes `/files/uw-issy-connectors/public/status.json`. Renumbered from `08_STATUS_PUBLISHER` on 2026-08-03 (same live workflow ID, renamed in place — see `00_PROJECT_BUILDLOG.md`).

Full data contract and architecture: see `00_AS-BUILT/README.md` ("Data contract: `public/status.json`"). This is the one file a dashboard should read.

## Notable fix

First build silently aggregated nulls for every lane with no error — `published/<lane>/current.json` is a pointer file, not the real content (see the pointer-file note in the master doc). Fixed by adding a second read step per lane that resolves the pointer before parsing.

## Planned

Will read lane 08 (`08_ROUTE_FACILITIES`) in addition to 01–07 once that lane is built — tracked separately, not yet done.
