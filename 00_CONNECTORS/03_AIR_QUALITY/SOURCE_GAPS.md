# SOURCE_GAPS.md — 03_AIR_QUALITY

## 1. PM10 field support exists, but route-near live PM10 values were absent

`ECO-01` includes PM10 fields structurally, which is good news. But during the
latest-hour route query on July 29, 2026, the 4 route-near official monitors
all returned `null` PM10 values.

This means:

- the connector can support PM10 without a schema change
- live route-near PM10 coverage may often be sparse or absent
- PM10 should be treated as opportunistic rather than guaranteed at every route
  point

**What would close it:** repeated testing across smoke/dust events, or
identification of a separate official PM10-heavy monitor set near the corridor.

## 2. AirNow is not route-granular enough to stand alone

The public AirNow files were live and useful, but route ZIPs mostly collapsed
into one metro reporting area, `Seattle-Bellevue-Kent Valley`, during the live
test. That makes AirNow valuable as a national fallback and public-facing cross
check, but weak as the sole segmentation source for this 33.83-mile corridor.

**What would close it:** a decision to accept reporting-area coarseness, or a
valid AirNow API key plus tested monitor-site endpoints if those add usable
route-local station granularity.

## 3. PSCAA detail is real, but still operationally brittle

PSCAA’s backend is more usable than it first appears, but it is not cleanly
stateless:

- `GetStations` and `Geometries` work directly
- `Aqi?stationId=...` only works after session bootstrap
- `ThreeTile` returned `500` on the test call

So PSCAA is not blocked, but it is not the cleanest primary connector.

**What would close it:** a fuller reverse-engineering pass of the session model
and export endpoints, or a documented agency endpoint that avoids cookie/state
requirements.

## 4. Official corrected low-cost sensor access is still unresolved

The work order explicitly allowed official low-cost sensor layers only if an
official agency treats them as corrected/calibrated. PSCAA clearly does that in
its docs. But this cycle did not confirm a stable unattended export/feed for the
sensor layer itself.

So the official policy/quality side is good, but the automation side is still
open.

**What would close it:** a verified machine-readable dashboard export, or a
documented API/feed from PSCAA or AirNow Fire and Smoke.

## 5. Burn-ban status exists, but not as a documented feed

PSCAA’s burn-ban page is live and usable. I did not find a clean JSON or RSS
equivalent in this cycle.

That does not block coverage, but it does mean burn-ban status currently sits in
the `webpage-backed but scrapeable` bucket rather than the `documented feed`
bucket.

**What would close it:** a discovered official endpoint, or a production decision
that webpage extraction is acceptable for this use case.

## 6. Formal route-local air-quality alerts were not active on the route today

The route had no King County air-quality alert at test time. I still verified
`NWS-AQ-01` against live Washington alerts from other counties, so the schema is
proven. But the exact “live route event” path was not exercised end-to-end on
July 29, 2026 because there was no route-local event to fetch.

**What would close it:** a future smoke/inversion event affecting King County.

## 7. Ecology TLS behavior should be re-tested on the eventual production host

An important operational nuance:

- Python `requests` with default verification succeeded against Ecology
- default `curl` from this local environment failed with exit `60`

That smells like a client CA-store issue rather than a dead source, but it is
still something production should verify explicitly on the future n8n/Hetzner
host before this becomes a “set and forget” connector.

**What would close it:** one production-like test from the actual target host.

## 8. No official corridor monitor sits exactly at the UW start

The best route-near official Seattle monitor in the tested corridor set is
`Seattle-NE 127th`, which is route-relevant but not at the UW start point
itself. This is not a blocker, but it is a real gap in perfect spatial
alignment.

**What would close it:** a closer official public monitor, or explicit owner
approval of the 4-point corridor design recommended here.
