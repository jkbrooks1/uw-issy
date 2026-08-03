# 30_ALERT_MONITOR — As Built

**n8n workflow:** `v0001.30_AlertMonitorConnector`, id `KhbGg5gBn7Rbne68`, 41 nodes, `active: false`.
**Status:** Live-verified twice — a real email sent on first run (Gmail message id `19fc34bc6a2b9552`), correctly no duplicate sent on an immediate second run against the same unchanged data. Renumbered from `09_ALERT_MONITOR` on 2026-08-03 (same live workflow ID, renamed in place — see `00_PROJECT_BUILDLOG.md`).

Full data contract and architecture: see `00_AS-BUILT/README.md` ("Data contract: alert email").

## Design notes

- Independent of workflow 20 — reads the 7 connectors directly, not `public/status.json`, so a bug in one workflow can't take down the other.
- Alert trigger is a uniform, safe signal (a new `event_id` since the last check), not an attempt to judge route-impact severity per lane — the 7 lanes use genuinely different, non-uniform vocabularies for that (documented in the master doc). Sends email via the existing `GMAIL OAUTH LODGING PROP MON` credential, to `john@biketourfrance.net`.
- Avoids n8n's `If`/`Switch`/`Filter` branching nodes (a real source of bugs found elsewhere in this project) — the detection node itself returns zero items when nothing is new, so the email node simply doesn't execute that run.

## Known active risk (2026-08-03)

Lane 01's `event_id` embeds a `content_hash` that changes on nearly every fetch even for the same real-world event. This workflow's dedup is an exact `Set.has(event_id)` check with no fuzzy matching, so it treats each new hash as a genuinely new event — confirmed to have caused a real duplicate-email incident while both this workflow and 08_STATUS_PUBLISHER were unexpectedly left active for ~24 hours. Both were deactivated on discovery. The underlying lane-01 hash bug itself is a separate, not-yet-fixed issue — see `00_PROJECT_BUILDLOG.md`, 2026-08-03 entries, for full detail.
