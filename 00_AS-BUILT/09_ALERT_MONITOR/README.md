# 09_ALERT_MONITOR — As Built

**n8n workflow:** `v0001.09_AlertMonitorConnector`, id `KhbGg5gBn7Rbne68`, 41 nodes, `active: false`.
**Status:** Live-verified twice — a real email sent on first run (Gmail message id `19fc34bc6a2b9552`), correctly no duplicate sent on an immediate second run against the same unchanged data.

Full data contract and architecture: see `00_AS-BUILT/README.md` ("Data contract: alert email").

## Design notes

- Independent of workflow 08 — reads the 7 connectors directly, not `public/status.json`, so a bug in one workflow can't take down the other.
- Alert trigger is a uniform, safe signal (a new `event_id` since the last check), not an attempt to judge route-impact severity per lane — the 7 lanes use genuinely different, non-uniform vocabularies for that (documented in the master doc). Sends email via the existing `GMAIL OAUTH LODGING PROP MON` credential, to `john@biketourfrance.net`.
- Avoids n8n's `If`/`Switch`/`Filter` branching nodes (a real source of bugs found elsewhere in this project) — the detection node itself returns zero items when nothing is new, so the email node simply doesn't execute that run.
