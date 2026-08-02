# RESEARCH_FINDINGS.md — 04_WILDFIRE

## Mise en place confirmed first

Before source research started, the following were verified and later recorded again in `SESSION_LOG.md`:

1. Project root exists: `/Users/jkbrookspersonal/LocalSiteBuildFiles/BTF_UW-Issy_Route_Monitor`
2. Canonical GPX exists and is readable: `/Users/jkbrookspersonal/LocalSiteBuildFiles/BTF_UW-Issy_Route_Monitor/data/route/UnivWA-Issaquah.gpx`
3. Assigned connector directory exists and initially contained only a placeholder `README.md`
4. Required project files were read: `CLAUDE.md`, `AGENTS.md`, `00_PROJECT_RULES.md`, `00_PROJECT_STATUS.md`
5. `00_CONNECTORS/01_ROUTE_CONDITIONS/` and `00_CONNECTORS/02_WEATHER/` were skimmed as the style and rigor template

## Route context reused from completed project work

This cycle did not re-derive the route geometry from scratch. It reused already-recorded project facts from the corrected canonical GPX and the completed route / weather deliverables:

- Route length: `33.83 miles`
- Bounding box: `lat 47.55207-47.75889 / lon -122.3057 to -122.04414`
- Operationally important route sections for wildfire relevance:
  - UW / Seattle Burke-Gilman
  - north Lake Washington / Kenmore edge
  - Bothell and Woodinville Sammamish River corridor
  - Redmond / Marymoor
  - East Lake Sammamish Trail through Redmond, Sammamish, and Issaquah

That geometry matters because wildfire signals that are useful at county scale can still be useless for this route unless they survive a route-distance or route-intersection test.

## What was searched and why

The research deliberately split the source landscape into seven connector types:

1. Official fire-incident point feeds
2. Official fire-perimeter polygon feeds
3. Official fire-weather / warning feeds
4. Official smoke-extent feeds
5. Official burn-restriction / burn-ban feeds
6. Official evacuation / emergency-notification feeds
7. Official route-owner closure pages that could carry fire-caused closure notices

The strongest candidate families were tested directly:

- WA DNR ArcGIS wildfire services
- NWS / NOAA alerts API
- NIFC WFIGS ArcGIS services
- InciWeb RSS
- NOAA HMS dated smoke files
- NASA FIRMS auth behavior
- King County Fire Marshal burn-ban page
- Eastside Fire & Rescue local burn-restriction alert
- Alert King County and WA EMD alert hubs
- Washington State Parks alerts page
- King County and Seattle trail-owner pages

## Main findings

### 1. The best active-fire point source is WFIGS, not DNR, but DNR is still useful

The strongest public active-fire point feed tested was `NIFC-01` (WFIGS Current Wildland Fire Locations):

- it is machine-readable;
- it carries incident type categories, timestamps, and coordinates;
- it is national rather than DNR-jurisdiction-limited;
- it returned live Washington wildfire examples on July 29, 2026 when queried by known incident names (`Skyo`, `Modrite`).

The Washington DNR current-fire layer (`DNR-01`) is still valuable, but as a secondary Washington-specific corroboration source:

- it had `750` statewide records in the current layer on July 29, 2026;
- it had `5` King County records;
- none of those 5 King County records intersected the UW-Issaquah route corridor.

That result is exactly why this workstream must not use county membership as a route-relevance rule for active fires.

### 2. The best active-perimeter source is WFIGS Current Interagency Fire Perimeters

`NIFC-02` was the strongest perimeter source tested:

- public ArcGIS REST;
- polygon geometry;
- incident identifiers that line up with the incident-locations service;
- documented refresh cadence from WFIGS;
- live Washington perimeter records confirmed by name on July 29, 2026.

This should be the canonical active-perimeter source for the route.

### 3. The best official fire-weather warning source is the NWS alerts API

For Red Flag Warnings and Fire Weather Watches, `NWS-01` is the correct connector:

- route fire weather zones are directly known from prior weather work:
  - `WAZ654` for the UW segment
  - `WAZ657` for the rest of the route
- the route county code is `WAC033`
- all three route-relevant queries returned healthy empty FeatureCollections on July 29, 2026

Important nuance: not every alert will provide polygon geometry. Some will require zone or UGC matching instead.

### 4. The best smoke-extent geometry source tested was NOAA HMS

The most practically useful official smoke-extent source found in this cycle was `NOAA-01`:

- same-day dated KML exists
- same-day shapefile ZIP exists
- archive structure is predictable by year / month / day
- smoke geometry can be tested directly against the route

What it is good for:

- showing whether wildfire smoke extent intersects the route
- distinguishing light / medium / heavy plume geometry after extraction
- supporting route-specific wildfire context

What it is not good for:

- replacing public-health AQ guidance
- declaring the route safe when the file is stale

That ownership line matters because smoke alerts overlap with `03_AIR_QUALITY`.

### 5. FIRMS is valuable, but not production-ready in this cycle

`NASA-01` remains worth documenting because it adds a unique capability: very early satellite hotspot detection.

But in this cycle:

- the area API returned `400 Invalid MAP_KEY.`
- no valid key was provisioned
- live route-area data could not be tested

So FIRMS is real and promising, but not ready-now. It belongs in the recommendation set as `ready_with_credentials`, not as an untested assumed MVP feed.

### 6. Burn restrictions need layered jurisdiction logic

No single burn-ban source is enough for this route.

The tested sources split cleanly:

- `KC-01` is the best official county burn-ban source, but only directly governs unincorporated King County
- `EFR-01` is highly relevant for the Sammamish / Issaquah end of the route because EF&R officially serves those communities
- `DNR-02` provides regional fire-danger and DNR-land restriction context, but not a general legal answer for the whole urban route

This means the production design should not flatten all burn restrictions into one generic countywide status. It should preserve jurisdiction and scope.

### 7. Official evacuation coverage is the biggest unattended-data gap

This cycle did not find a good public machine-readable evacuation feed for the route corridor.

What was confirmed:

- `KC-02` ALERT King County is real and official
- `WAEMD-01` is a real official hub for alerting and preparedness

What was not found:

- public RSS
- public JSON / CAP endpoint
- public unauthenticated feed suitable for unattended route-level evacuation monitoring

That is a real gap, not a research miss. The route can still monitor official wildfire, smoke, and fire-weather signals well, but evacuation automation remains materially weaker unless a local public-alert feed is identified later.

### 8. Route-owner closure pages matter, but they are not wildfire-primary connectors

The route still needs fire-caused trail-closure coverage, and the authoritative publishers are usually the trail owners:

- King County Parks for ELST and much of the regional trail corridor
- Seattle Parks / Seattle trail-owner pages for the Seattle Burke-Gilman segment

Those pages are not the primary wildfire-detection layer; they are the primary closure-confirmation layer. They should be shared with `01_ROUTE_CONDITIONS` and `06_TRAIL_INFRASTRUCTURE_STATUS`, not independently over-owned by wildfire logic.

### 9. PulsePoint and similar local incident streams are wrong for this route

PulsePoint was investigated because the work order explicitly named it.

It was rejected for a route wildfire dashboard because:

- the route is dense urban / suburban territory;
- routine medical calls, structure fires, and minor incidents would swamp the signal;
- no route-usable public official feed was confirmed in this session;
- even if a feed were available, strong filtering would still be required to suppress routine non-wildland fire events.

This workstream needs official wildfire, smoke, fire-weather, and route-closure signals, not general CAD exhaust.

## What surprised the research

1. The DNR route-point query was immediately useful.
   The route point near Marymoor cleanly returned a live DNR danger-area record with current restriction text. That made DNR more useful as a structured context source than the page-first research path suggested.

2. WFIGS initially looked like it had zero Washington coverage only because the wrong state-code form was used.
   The correct state value is `US-WA`, not `WA`. Once corrected, both incident and perimeter services returned live Washington records.

3. The WFIGS ArcGIS services are strong enough for MVP, but they can rate-limit burst traffic.
   The live `429` request-unit failure is a useful planning finding. The right answer is not to reject the source; it is to poll politely.

4. NOAA HMS is more production-usable than it first appears.
   The public dated-file directories are stable and current enough to automate, even though there is no simple `current.kml` alias.

5. The biggest high-stakes gap is evacuation, not wildfire detection.
   Fire points, perimeters, warnings, smoke polygons, and burn restrictions all have credible official sources. Evacuation notices do not yet have an equivalent unattended public feed for this route.

## Sources rejected and why

- `DNR-03`: official dashboard shell, but inferior to the underlying DNR ArcGIS services
- `KC-02`: official but signup-only
- `WAEMD-01`: official guidance hub, not a direct feed
- `WSPARKS-01`: official and current, but not route-owner-relevant
- `PULSEPOINT-01`: wrong signal shape for this route

## Sources kept but not promoted to MVP

- `DNR-01`: useful Washington corroboration, but too noisy to lead with
- `DNR-02`: valuable fire-danger and DNR burn-ban context, but not a route-wide legal restriction source
- `INCIWEB-01`: useful narrative enrichment, but weaker geometry
- `NASA-01`: potentially valuable after credentialing, but not ready now
- `EFR-01`: locally useful, but only for the Sammamish / Issaquah end of the route
- `KC-TRAIL-01` / `SEA-TRAIL-01`: authoritative closure owners, but shared overlap sources rather than wildfire-primary connectors

## Production recommendation, in one sentence

Use `NIFC-01`, `NIFC-02`, `NWS-01`, `NOAA-01`, and `KC-01` as the MVP connector set for wildfire / smoke / fire-weather / burn-ban monitoring, treat `DNR-01`, `DNR-02`, `EFR-01`, and `INCIWEB-01` as corroborating secondary sources, and document evacuation automation as an unresolved official-feed gap rather than faking certainty.
