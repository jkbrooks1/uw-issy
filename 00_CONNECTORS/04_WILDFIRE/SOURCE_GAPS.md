# SOURCE_GAPS.md — 04_WILDFIRE

## Gap 1 — No verified unattended public evacuation feed for the route

- Why it matters: evacuation notices are in scope and are high-severity cyclist-decision signals.
- What was found: `ALERT King County` and WA EMD guidance pages are official, but they are signup / hub pages rather than public machine-readable feeds.
- What would close it:
  - a public county or city CAP / RSS / JSON alert feed;
  - or a verified official public endpoint from King County OEM or route-city emergency management;
  - or explicit confirmation that NWS/CAP is the canonical public evacuation surface for this corridor.

## Gap 2 — Local burn-restriction coverage is fragmented by jurisdiction

- Why it matters: county, DNR, and local fire-agency restrictions do not mean the same thing.
- What was found:
  - `KC-01` is county official but unincorporated only
  - `DNR-02` is official but DNR-land-specific
  - `EFR-01` covers Sammamish / Issaquah but not the full route
- What would close it:
  - a verified route-jurisdiction table mapping which burn authority governs each route segment;
  - and additional direct testing of city-specific fire-marshal sources where they materially differ from King County or EF&R.

## Gap 3 — FIRMS remains credential-blocked in this cycle

- Why it matters: FIRMS is the best candidate for very early hotspot detection before formal incident publication.
- What was found: the area API returned `400 Invalid MAP_KEY.`
- What would close it:
  - provision a real NASA FIRMS `MAP_KEY`
  - live-test a route-bbox or route-buffer query
  - confirm usable field coverage, transaction cost, and false-positive handling

## Gap 4 — NOAA HMS has no stable current alias

- Why it matters: the files are good, but implementation must build or discover the date-specific URL every day.
- What was found: daily dated KML and ZIP files exist publicly, but guessed `current.kml` aliases returned `404`.
- What would close it:
  - either a confirmed stable current alias from NOAA documentation;
  - or acceptance of the dated-file pattern as the canonical implementation path.

## Gap 5 — DNR current-fire layer is useful but noisy

- Why it matters: it can catch Washington incidents that matter, but it also contains many very small fires far from the route.
- What was found: on July 29, 2026 the layer contained `5` King County incidents and none were route-relevant.
- What would close it:
  - exact route-buffer geometry testing in implementation;
  - severity / acreage / cause filters after route-distance filtering;
  - optional corroboration against WFIGS before public-facing escalation.

## Gap 6 — No direct machine-readable fire-caused trail-closure feed

- Why it matters: route closure due to fire is in scope.
- What was found:
  - route-owner pages exist and are authoritative
  - but those pages are HTML and not wildfire-specific
- What would close it:
  - a future normalized shared closure feed from workstreams `01_ROUTE_CONDITIONS` and `06_TRAIL_INFRASTRUCTURE_STATUS`
  - or discovery of an official parks / trail closure API not found in this cycle

## Gap 7 — Seattle trail-owner page body retrieval is still weaker than desired

- Why it matters: the Seattle Burke-Gilman segment still needs an authoritative closure fallback.
- What was found: both Seattle pages were reachable, but the repair page still returned shell-heavy markup.
- What would close it:
  - a browser-rendered or DOM-inspected retrieval pass
  - or a more direct Seattle Parks project / alert feed discovered in a future cycle
