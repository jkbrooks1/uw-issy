# BikeTourFrance.net UW–Issy Route Status Dashboard
## Unified Product, UI, Data, Build, and Deployment Specification

**File name:** `v.01.UI_UWISSY_Status_Buildspec.md`  
**Document version:** v.01  
**Document status:** Canonical build specification for Ringer handoff  
**Project:** UW–Issy Route Monitor  
**Product:** Public UW–Issy Route Status Dashboard  
**Public brand:** BikeTourFrance.net  
**Project root:** `/Users/jkbrookspersonal/LocalSiteBuildFiles/BTF_UW-Issy_Route_Monitor`  
**Canonical document home:** `00_DOCS/v.01.UI_UWISSY_Status_Buildspec.md`  
**Default timezone:** `America/Los_Angeles`  
**Monitoring runtime:** Self-hosted n8n on Hetzner  
**Source control and build trigger:** GitHub  
**Public hosting:** Cloudflare Pages  
**Last revised:** August 2, 2026

---

# 1. Purpose and authority

This document is the full build specification for the BikeTourFrance.net UW–Issy Route Status Dashboard.

It is intended to be handed to Ringer as the main build authority for the dashboard UI, route-map layer, public-data integration, build checks, deployment, and production proof.

This specification replaces all earlier dashboard mockups, draft page code, mock JSON feeds, sample route names, and partial implementation notes.

Earlier visual work may be used only as a reference for broad layout intent. It is not a source of truth for:

- Brand wording
- Route geometry
- Event data
- Lane state
- Route state
- Public links
- Segment names
- Feed paths
- Build paths
- Deployment flow
- Runtime ownership

The build is complete only when the dashboard is built from the real project assets, uses the real assembled monitoring outputs, deploys through the approved GitHub and Cloudflare Pages path, and passes production checks.

---

# 2. Canonical project identity

## 2.1 Project root

The canonical local project root is:

```text
/Users/jkbrookspersonal/LocalSiteBuildFiles/BTF_UW-Issy_Route_Monitor
```

All relative paths in this document resolve from that root unless a path is stated as an external runtime path.

## 2.2 Canonical document path

This specification belongs at:

```text
/Users/jkbrookspersonal/LocalSiteBuildFiles/BTF_UW-Issy_Route_Monitor/00_DOCS/v.01.UI_UWISSY_Status_Buildspec.md
```

## 2.3 Public product name

Use:

```text
BikeTourFrance.net UW–Issy Route Status
```

The main page heading should use:

```text
UW–Issy Route Status
```

The browser title must use:

```text
UW–Issy Route Status | BikeTourFrance.net
```

## 2.4 Public brand rules

The public brand name is:

```text
BikeTourFrance.net
```

Do not use these forms in public text:

- BTF
- Bike Tour France
- BikeTourFrance
- bike tour france
- TrailPulse

`BTF` is allowed only in internal paths, code, logs, staff notes, and existing project names.

---

# 3. Governing sources and precedence

The build must comply with these sources, in this order:

1. The current UW–Issy autonomous connector and deployment architecture.
2. The attached UW–Issy as-built monitoring specifications for workflows 01–09.
3. This UI build specification.
4. The BikeTourFrance.net Unified Style and Positioning Guide.
5. Current repository conventions and build-log rules.
6. Prior UI mockups only where they do not conflict with items 1–5.

When two sources conflict, the higher item wins.

Mock records, mock coordinates, mock route parts, and sample dashboard code do not override real project data or this specification.

---

# 4. Product goal

The dashboard gives riders a clear, current, route-based view of conditions on the University of Washington–Issaquah cycling route.

A rider should be able to answer these questions fast:

- What is the route-wide state?
- Are there active route events?
- Where are those events?
- What kind of event is each one?
- Which route parts are affected?
- When was the data last updated?
- Is the data current?
- Did any source fail?
- Is last-known-good data in use?
- Is there enough data to trust the route-wide state?

The page must remain useful when:

- The map fails to load
- JavaScript fails
- One or more lanes fail
- A lane is stale
- The assembled feed is stale
- No route-related events exist
- Last-known-good data is in use
- An event lacks geometry
- Route-part data is not available
- The user is on a phone or weak network

---

# 5. Product principles

The dashboard must feel:

- Calm
- Clear
- Practical
- Rider-oriented
- Stable
- Well informed
- Easy to scan
- Easy to trust
- Low pressure
- Grounded in fact

The dashboard must not feel like:

- A startup SaaS app
- An admin console
- A race or fitness app
- A social feed
- A data lab
- A dark-mode tech demo
- A gamified tool
- A luxury travel page
- An AI-made visual collage

When a choice is unclear, choose:

- Clarity over novelty
- Text plus icon over icon alone
- Proof over vague claims
- Honest unknown states over false certainty
- Same-origin assets over added runtime links
- Server or build-time work over needless browser work
- Rider use over staff ease
- Calm structure over visual force

---

# 6. Locked system architecture

## 6.1 Production chain

The production chain is:

```text
Official source systems
→ autonomous n8n connector lanes 01–07 on Hetzner
→ validated lane artifacts
→ Workflow 08 Status Publisher
→ assembled public data package
→ GitHub repository update
→ GitHub Actions validation and site build
→ Cloudflare Pages deployment
→ production verification
```

## 6.2 Browser boundaries

The browser must not:

- Call the seven official data sources
- Read raw connector outputs
- Follow lane pointer files
- Scan the Hetzner file system
- Perform cross-lane deduplication
- Recompute source freshness from raw records
- Compute the route-wide state
- Depend on JB’s Mac
- Load route geometry from JB’s Mac
- Load the route from `raw.githubusercontent.com`
- Require n8n to answer a live browser request

## 6.3 Monitoring lanes

The seven canonical lane IDs are:

```text
01_ROUTE_CONDITIONS
02_WEATHER
03_AIR_QUALITY
04_WILDFIRE
05_FLOOD_CONDITIONS
06_TRAIL_INFRASTRUCTURE_STATUS
07_GOVERNMENT_SAFETY_ALERTS
```

Public labels are:

| Internal lane ID | Public label |
|---|---|
| `01_ROUTE_CONDITIONS` | Route conditions |
| `02_WEATHER` | Weather |
| `03_AIR_QUALITY` | Air quality |
| `04_WILDFIRE` | Wildfire |
| `05_FLOOD_CONDITIONS` | Flood conditions |
| `06_TRAIL_INFRASTRUCTURE_STATUS` | Trail infrastructure |
| `07_GOVERNMENT_SAFETY_ALERTS` | Government safety alerts |

Raw lane IDs must not be the main public labels.

## 6.4 Workflow roles

### Workflows 01–07

Each lane workflow owns:

- Source fetch
- Raw landing
- Lane normalization
- Route relevance logic assigned to that lane
- Lane validation
- Candidate output
- Published lane output
- Source-health state
- Freshness state
- Last-known-good logic
- Handoff record
- Execution evidence

### Workflow 08 — Status Publisher

Workflow 08 is the only authority for the assembled public dashboard package.

It owns:

- Reading registered lane handoffs
- Resolving lane outputs
- Schema checks
- Freshness checks
- Last-known-good rules
- Lane state rollup
- Cross-lane ownership
- Cross-lane deduplication
- Route-wide state
- Public event list
- Map-ready geometry
- System-health summary
- Release manifest
- Material-change detection
- Approved GitHub publication

### Workflow 09 — Alert Monitor

Workflow 09 is for staff or operator alerting.

It must not be used as a public dashboard feed.

---

# 7. Runtime and storage ownership

## 7.1 Mac

JB’s Mac is a working checkout and source-edit environment.

It is not part of the live runtime.

The site must work when the Mac is:

- Off
- Asleep
- Offline
- Away from the network
- Not logged in

## 7.2 GitHub

GitHub is the persistent source and release history for:

- Dashboard source code
- Canonical route GPX
- Build scripts
- Schemas
- Tests
- Static assets
- Generated public monitoring files written through the approved release path
- GitHub Actions
- Project docs
- Build and deploy records stored in the repo

## 7.3 Hetzner

Hetzner is the runtime home for:

- n8n
- Raw source landings
- Normalized lane data
- Candidate artifacts
- Published lane artifacts
- Last-known-good artifacts
- Source-health files
- Handoff records
- Logs
- Execution evidence
- Workflow 08 assembly work before GitHub publication

The browser must not use Hetzner as a direct data or route-file host in the first release.

## 7.4 Cloudflare Pages

Cloudflare Pages is the public host for:

- The dashboard app
- The deployed route GeoJSON
- Public monitoring JSON
- Public monitoring GeoJSON
- CSS
- JavaScript
- Icons and site assets

The dashboard, route file, and public monitoring files should load from one origin.

## 7.5 Cloudflare R2

R2 is not needed for the UW–Issy route file in the first release.

R2 may host shared brand assets, such as the approved logo.

The route is stored in GitHub and deployed with the site.

---

# 8. Canonical route geometry

## 8.1 Source of truth

The sole source of truth for route geometry is:

```text
data/route/UnivWA-Issaquah.gpx
```

Its current local path is:

```text
/Users/jkbrookspersonal/LocalSiteBuildFiles/BTF_UW-Issy_Route_Monitor/data/route/UnivWA-Issaquah.gpx
```

The file must be tracked in GitHub.

The local path and repo path are the same tracked source, not two route sources.

## 8.2 Production route chain

```text
Canonical GPX in GitHub
→ GitHub Actions validation
→ deterministic GPX-to-GeoJSON conversion
→ public route GeoJSON
→ Cloudflare Pages
→ browser map
```

## 8.3 Derived route asset

The preferred built asset is:

```text
public/routes/UnivWA-Issaquah.geojson
```

The public browser URL is:

```text
/routes/UnivWA-Issaquah.geojson
```

A public GPX copy may also be made if needed:

```text
public/routes/UnivWA-Issaquah.gpx
```

The browser must use GeoJSON by default.

## 8.4 Derived-file rules

Generated route assets:

- Must be made by the build
- Must be deterministic
- Must not be edited by hand
- Must come only from the canonical GPX
- Must preserve route order
- Must keep useful names and metadata
- Must use valid WGS84 coordinates
- Must fail the build when conversion fails
- Must never fall back to mock geometry

## 8.5 Route validation

The build must confirm:

- The GPX exists
- The file is readable
- XML is valid
- At least one useful track or route exists
- At least two valid points exist
- Latitudes are from `-90` through `90`
- Longitudes are from `-180` through `180`
- Bounds are plausible for the UW–Issaquah route
- Converted GeoJSON is valid
- Converted geometry is not empty
- Conversion is repeatable

## 8.6 Map bounds

The initial map view must fit the real route bounds.

Do not use fixed sample coordinates or a fixed sample zoom.

Use route-derived bounds with set padding.

---

# 9. Public monitoring package

## 9.1 Required files

Workflow 08 must publish the app-facing package as at least:

```text
dashboard-data.json
route-events.geojson
system-health.json
release-manifest.json
```

The dashboard must use this four-file contract.

It must not use the old mock `statusData` object or an invented one-file feed.

## 9.2 Preferred repo layout

Unless the current repo has another approved path, use:

```text
public/
  data/
    dashboard-data.json
    route-events.geojson
    system-health.json
    release-manifest.json
```

## 9.3 Browser URLs

The deployed app should load:

```text
/data/dashboard-data.json
/data/route-events.geojson
/data/system-health.json
/data/release-manifest.json
/routes/UnivWA-Issaquah.geojson
```

## 9.4 File roles

### `dashboard-data.json`

Must hold rider-facing state such as:

- Route ID
- Route name
- Assembly time
- Display tier
- Route-wide summary
- Active event count
- Lane summaries
- Route impacts
- Public messages
- Event references
- Freshness notes

### `route-events.geojson`

Must hold map-ready event geometry and display properties:

- Stable event ID
- Lane ID
- Public lane label
- Title
- Summary
- Display tier
- Route effect
- Time fields
- Source fields
- Last-known-good mark
- Stale mark
- Point, line, or area geometry

### `system-health.json`

Must hold:

- Lane source state
- Lane freshness
- Failed lanes
- Degraded lanes
- Last-known-good use
- Stale disclosure
- Assembly state
- Publication state

### `release-manifest.json`

Must hold:

- Release ID
- Assembly time
- Lane run IDs
- Lane checksums
- File checksums
- Schema versions
- Material-change hash
- Source Git commit
- Build state
- Deploy state
- Production proof state, when available

## 9.5 Forbidden reads

The UI must not read:

```text
published/<LANE>/current.json
```

The UI must not scan:

```text
/files/uw-issy-connectors/
```

The UI must not resolve lane pointers.

Workflow 08 must do that before the public package is made.

---

# 10. State and truth model

## 10.1 Route display tiers

The canonical public route display tiers are:

```text
normal
watch
alert
unknown
```

## 10.2 Public labels

| Tier | Public label | Meaning |
|---|---|---|
| `normal` | Normal | No known route-wide issue calls for added care |
| `watch` | Watch | One or more conditions should be checked |
| `alert` | Alert | One or more active events may affect the ride |
| `unknown` | Status unknown | There is not enough current data for a sound route-wide state |

The UI must not invent `clear`, `critical`, or `closure` as direct route-wide states unless Workflow 08 publishes a reviewed mapping.

## 10.3 Route-wide state authority

The route-wide state comes from Workflow 08.

The browser must not derive it from:

- Event count
- Marker color
- One lane
- The most severe row
- Source-health state
- A stale prior value without disclosure

## 10.4 Hazard state and source health

Keep these apart:

1. Route event state
2. Source-health state
3. Freshness state
4. Last-known-good use
5. Package health

A failed source does not prove no event exists.

A healthy source can still report an alert.

A stale lane must not appear fresh.

## 10.5 Lane source states

Support at least:

```text
ok
degraded
stale
no_relevant_events
failed_validation
failed_fetch
blocked
using_last_known_good
unavailable
unknown
```

Public text mapping:

| Internal state | Public text |
|---|---|
| `ok` | Current |
| `degraded` | Partial data |
| `stale` | Data may be out of date |
| `no_relevant_events` | No route-related events |
| `failed_validation` | Source data could not be confirmed |
| `failed_fetch` | Source could not be checked |
| `blocked` | Source check was blocked |
| `using_last_known_good` | Showing last known data |
| `unavailable` | Source unavailable |
| `unknown` | Source state unknown |

## 10.6 Empty versus failed

A lane may say “No route-related events” only when:

- Fetch worked
- Validation passed
- Data was fresh enough
- Route relevance was checked
- No qualifying event was found

Do not show “No alerts” for a fetch, validation, or access failure.

## 10.7 Last-known-good

When last-known-good data is used:

- Keep the useful data visible
- Mark the lane
- Show the original data time
- Show that the live check failed or was stale
- Do not blend it with fresh data without a note

---

# 11. Normalized event adapter

Lane output shapes may differ.

Page components must consume one normalized UI model.

## 11.1 Required event type

```ts
type DashboardEvent = {
  id: string;
  laneId: MonitoringLaneId;
  laneLabel: string;
  title: string;
  summary: string | null;
  locationLabel: string | null;
  routeSegmentId: string | null;
  routeSegmentLabel: string | null;
  displayTier: "normal" | "watch" | "alert" | "unknown";
  routeEffect: string | null;
  reportedAt: string | null;
  effectiveFrom: string | null;
  effectiveUntil: string | null;
  geometry: GeoJSON.Geometry | null;
  sourceName: string | null;
  sourceUrl: string | null;
  confidence: string | null;
  isLastKnownGood: boolean;
  isStale: boolean;
};
```

## 11.2 Adapter duties

Each adapter must define how to derive:

- Title
- Summary
- Location
- Route part
- Display tier
- Route effect
- Report time
- Start time
- End time
- Geometry
- Source
- Confidence
- Stale state
- Last-known-good state

## 11.3 No silent inference

When a field cannot be derived:

- Use `null`
- Omit the line in the UI
- Do not invent coordinates
- Do not guess a route part
- Do not make up an end time
- Do not infer a closure from a lane type
- Do not turn an unknown state into Normal

## 11.4 Route relevance

The browser must not decide route relevance.

Route relevance must be set by:

- The lane connector
- Workflow 08
- Or a reviewed deterministic adapter based on fields published for that use

Any missing data needed for safe route relevance must be logged as a build gap.

---

# 12. Cross-lane handling

Workflow 08 owns cross-lane deduplication.

The browser must not use fuzzy logic to merge events.

The UI must trust the assembled event set and stable IDs.

When Workflow 08 merges records:

- Use one public event ID
- Keep source links when useful
- Keep lane ownership clear
- Keep the strongest valid route effect
- Do not hide conflicts
- Make the active count match the assembled set

---

# 13. Brand and visual system

## 13.1 Approved logo

Use:

```text
https://pub-40b24fc600d44d828529b84a0d97ded7.r2.dev/BTF_LOGO_White_on_Transparent.png
```

Rules:

- White on transparent
- Top-left in the green header
- Preserve aspect ratio
- No recolor
- No inversion
- No glow
- No shadow
- No white box
- No border
- No gradient

Desktop height:

```text
40px to 46px
```

Mobile height:

```text
34px to 40px
```

## 13.2 Main colors

```css
--btf-green: #2D5016;
--btf-dark-green: #1F3D11;
--btf-pressed-green: #17300C;
--btf-warm-beige: #F5F0E8;
--btf-muted-blue: #1B4F72;
--btf-white: #FFFFFF;
```

## 13.3 Neutral colors

```css
--text-main: #172018;
--text-soft: #4B554D;
--border-light: #D9DED8;
--panel-soft: #FAFBF9;
--row-divider: #E7EAE5;
--disabled-bg: #F0F2EF;
--disabled-text: #6C756E;
```

## 13.4 Typography

Use:

```css
font-family: Montserrat, system-ui, sans-serif;
```

Weights:

| Use | Weight |
|---|---:|
| Main heading | 700 |
| Section heading | 600 |
| Button | 600 |
| Body | 400 |
| Small UI | 500 |

Rules:

- Sentence case
- No routine all caps
- No novelty font
- No luxury serif
- No narrow font
- No huge hero slogan
- No tiny body text

## 13.5 Page frame

```css
width: calc(100% - 40px);
max-width: 1280px;
margin: 0 auto;
```

Preferred readable width:

```text
1200px
```

Hard upper limit:

```text
1280px
```

Page background:

```css
background: #FFFFFF;
```

Do not use:

- Dark mode
- Glass effects
- Neon color
- Large gradients
- Heavy shadows
- Full-page image backdrops
- Strong texture
- Visual clutter

---

# 14. Header

## 14.1 Band

Use a full-width green header:

```css
background: #2D5016;
min-height: 72px;
```

Desktop target height:

```text
72px
```

## 14.2 Header content

Only these visible items are allowed:

1. BikeTourFrance.net logo
2. Email link
3. Main site button

Desktop:

```text
[ BikeTourFrance.net logo ]                         [ Email ] [ Main site ]
```

Do not add:

- Overview
- Dashboard
- Alerts
- Segments
- Lanes
- About
- Settings
- Meeting link
- Overnight Destinations
- Hamburger menu
- Hidden nav drawer

## 14.3 Logo link

The logo may link to:

```text
https://biketourfrance.net
```

Accessible name:

```text
BikeTourFrance.net main site
```

## 14.4 Email link

Visible label:

```text
Email
```

URL:

```text
mailto:contact@biketourfrance.net
```

Required behavior:

- Works without JavaScript
- White text
- Minimum 44px target
- Underline on hover
- Visible focus
- May have a mail icon
- Must not be icon-only

Accessible name:

```text
Email BikeTourFrance.net
```

## 14.5 Main site button

Visible label:

```text
Main site
```

URL:

```text
https://biketourfrance.net
```

Style:

```css
min-height: 44px;
padding: 10px 18px;
border: 1px solid #FFFFFF;
border-radius: 6px;
background: #FFFFFF;
color: #2D5016;
font-weight: 600;
text-decoration: none;
```

Hover:

```css
background: #F5F0E8;
color: #1F3D11;
transform: translateY(-1px);
```

Pressed:

```css
background: #E8E1D6;
color: #17300C;
transform: translateY(0);
```

Accessible name:

```text
Go to the BikeTourFrance.net main site
```

Open in the same tab.

## 14.6 Mobile header

Preferred:

```text
[ Logo ] [ Email ] [ Main site ]
```

When that does not fit:

```text
Row 1: [ Logo ]
Row 2: [ Email ] [ Main site ]
```

Do not hide either action.

---

# 15. Page heading and update state

## 15.1 Main heading

Use:

```text
UW–Issy Route Status
```

Desktop style:

```css
font-size: 34px;
font-weight: 700;
line-height: 1.15;
color: #17300C;
```

Mobile size:

```text
28px
```

## 15.2 Route label

Use:

```text
University of Washington to Issaquah
```

Do not use mock route-part names.

## 15.3 Last update

Show the public package assembly time in Pacific time.

Example:

```text
Last updated: Aug 2, 2026 at 10:00 AM PDT
```

Also show text such as:

```text
Current
```

or:

```text
Data may be out of date
```

Do not use a color dot as the sole status sign.

## 15.4 Schedule badge

Use:

```text
Checked twice daily
```

only after the live schedule has been activated and proven.

Before that, use:

```text
Latest published update
```

Do not claim an automated cadence that is not live.

---

# 16. Layout

## 16.1 Desktop

```css
display: grid;
grid-template-columns: 330px minmax(0, 1fr);
gap: 24px;
```

Left rail:

1. Current route state
2. Monitoring sources
3. Route impacts

Right area:

1. Route map
2. Current route alerts

## 16.2 Tablet

When space allows:

```css
grid-template-columns: 290px minmax(0, 1fr);
gap: 20px;
```

## 16.3 Mobile order

1. Current route state
2. Freshness or source notice
3. Route map
4. Current route alerts
5. Monitoring sources
6. Route impacts
7. Footer

---

# 17. Shared panel rules

```css
background: #FFFFFF;
border: 1px solid #D9DED8;
border-radius: 8px;
box-shadow: 0 1px 2px rgba(20, 40, 20, 0.05);
padding: 20px;
```

Section heading:

```css
font-size: 18px;
font-weight: 600;
color: #172018;
margin-bottom: 20px;
```

Do not use:

- Nested cards
- Glass blur
- Dark panels
- Glow
- Strong shadow
- Gradient cards
- Very round cards
- Floating SaaS tiles

---

# 18. Current route state panel

Heading:

```text
Current route state
```

Show:

- Route-wide tier
- Active route event count
- Freshness note when needed

Main labels:

```text
Normal
Watch
Alert
Status unknown
```

Suggested icon mapping:

| State | Icon |
|---|---|
| Normal | Shield with check |
| Watch | Eye or amber caution mark |
| Alert | Warning triangle |
| Status unknown | Question mark in circle |

Main value:

```css
font-size: 30px;
font-weight: 700;
```

Active count label:

```text
Active route events
```

The count must come from Workflow 08.

When state is unknown, show the reason when supplied.

---

# 19. Freshness and source notices

## 19.1 Current

Show:

```text
Current
```

with the assembly time.

## 19.2 Aging

Show:

```text
Update due soon
```

when near the stale limit.

## 19.3 Stale

Show:

```text
Data may be out of date. The page is showing the last known route status from Aug 2, 2026 at 10:00 AM PDT.
```

## 19.4 Partial source failure

Show:

```text
Some route sources could not be checked. Available route data is shown below.
```

List affected public lane names.

## 19.5 No current package

Show:

```text
Current route status data is not available.
```

When last-known-good public data exists:

```text
Showing the last known route status from Aug 2, 2026 at 10:00 AM PDT.
```

When no prior data exists:

- Use `Status unknown`
- Do not show `Normal`
- Keep route geometry if it loads
- Show system-health detail

---

# 20. Monitoring sources panel

Heading:

```text
Monitoring sources
```

Show all seven lanes.

Each row may include:

- Lane marker
- Public label
- Active event count
- Source state
- Last-known-good mark

Examples:

```text
Weather
1 active route event
Current
```

```text
Wildfire
Source could not be checked
Showing last known data
```

Do not animate lane marks.

## 20.1 Lane colors

```json
{
  "01_ROUTE_CONDITIONS": "#4C9F38",
  "02_WEATHER": "#1976C9",
  "03_AIR_QUALITY": "#7A3CC2",
  "04_WILDFIRE": "#F46B13",
  "05_FLOOD_CONDITIONS": "#8B5C21",
  "06_TRAIL_INFRASTRUCTURE_STATUS": "#168B8C",
  "07_GOVERNMENT_SAFETY_ALERTS": "#C72B20"
}
```

Color must not be the only sign of lane identity or state.

---

# 21. Route impacts panel

Heading:

```text
Route impacts
```

Do not hard-code sample segments.

Render route parts only when `dashboard-data.json` supplies reviewed route-part data.

Each row may show:

- Route-part label
- State
- Short effect note
- Linked event count

Supported public route-part state should use the canonical tier model when possible:

```text
Normal
Watch
Alert
Unknown
```

When no route-part data exists, show:

```text
No route-part breakdown is available in this update.
```

Do not infer route parts from map place names.

---

# 22. Astro and Leaflet implementation

## 22.1 Approved pattern

The dashboard may use:

- Astro for the page shell
- Astro components for server-rendered content
- A small Svelte or plain client component for Leaflet
- Leaflet for the interactive map

The page must render useful content before Leaflet loads.

## 22.2 Client-only map load

Leaflet must load only in the browser.

Use a dynamic import or isolated client component so server rendering does not access:

- `window`
- `document`
- Leaflet browser globals

## 22.3 Approved map inputs

The map must load:

```text
/routes/UnivWA-Issaquah.geojson
/data/route-events.geojson
```

The browser must not load or parse the canonical GPX.

## 22.4 No `leaflet-gpx` in production

Do not include `leaflet-gpx` in the production browser bundle.

The GPX is converted during the GitHub Actions build.

## 22.5 Safe popup content

Do not place feed text in raw HTML strings without safe escaping.

Use one of:

- Framework-rendered popup nodes
- DOM node construction with `textContent`
- A reviewed sanitizer

Do not trust source text as HTML.

## 22.6 Map component boundaries

The map component may:

- Load the route GeoJSON
- Load event GeoJSON
- Fit route bounds
- Draw route and events
- Manage map controls
- Open event detail
- Report map load or map failure

The map component must not:

- Parse lane-specific raw schemas
- Compute route relevance
- Deduplicate events
- Compute route-wide state
- Compute freshness
- Read raw lane files
- Contain mock production data

---

# 23. Route map

## 23.1 Size

Desktop:

```css
height: 590px;
width: 100%;
```

Tablet:

```text
430px to 500px
```

Mobile:

```text
360px to 420px
```

## 23.2 Base map

Use a light road-and-terrain base layer with:

- Pale beige land
- Pale green parks and hills
- Soft blue water
- Light gray roads
- Low-noise labels
- Visible attribution

Do not use dark tiles or satellite view by default.

## 23.3 Route style

Default route:

```json
{
  "color": "#167A31",
  "weight": 5,
  "opacity": 0.95
}
```

Reviewed route-part styles:

Watch:

```json
{
  "color": "#C87900",
  "weight": 5,
  "opacity": 0.95
}
```

Alert:

```json
{
  "color": "#C72B20",
  "weight": 6,
  "opacity": 0.95,
  "dashArray": "8 6"
}
```

Unknown:

```json
{
  "color": "#657067",
  "weight": 5,
  "opacity": 0.8,
  "dashArray": "4 6"
}
```

Do not recolor the full route because one point event exists unless the data marks a route-wide or route-part effect.

## 23.4 Event geometry

Support:

- Point
- LineString
- MultiLineString
- Polygon
- MultiPolygon

Do not turn each event into an invented point.

Events with no geometry must still appear in text.

## 23.5 Point markers

Use ring markers:

- White center
- Lane-colored border
- 18px to 24px wide
- No pulse
- No flashing
- No large shadow
- Clear hover
- Clear selected state
- Clear focus state

## 23.6 Clusters

Clustering may be used when points overlap.

Rules:

- Show a count
- Use a calm neutral or brand-green style
- Do not hide high-impact events in a vague cluster
- Let users zoom or open the cluster
- Keep keyboard access when the library permits it

## 23.7 Controls

Include:

- Zoom in
- Zoom out
- Fit full route
- Reset route view

Each control must:

- Be a real button
- Be at least 44px high
- Have a visible focus state
- Have a screen-reader label
- Use a white background
- Use a thin border
- Use a dark icon

Do not add user geolocation in v.01.

## 23.8 Event popup

May show:

- Lane
- Title
- Summary
- Location
- Route part
- Route effect
- Report time
- Effective range
- Source
- Source link
- Stale mark
- Last-known-good mark

Omit missing fields.

## 23.9 Loading state

Show:

```text
Loading route map
```

Keep the event list visible.

## 23.10 Failure state

Show:

```text
The route map could not be loaded. Current route events are listed below.
```

The rest of the page must still work.

---

# 24. Current route alerts

Heading:

```text
Current route alerts
```

When all sources are valid and no events exist:

```text
No active route events were found in the latest valid update.
```

When no events exist but one or more sources failed:

```text
No active route events were returned, but one or more sources could not be checked.
```

Do not say `No hazards` when source coverage is incomplete.

## 24.1 Desktop table

Use a real semantic table.

Columns:

1. Event
2. Source type
3. Location or route part
4. Time
5. State

Optional fields:

- Effective through
- Source

Do not make the table too dense.

## 24.2 Sort order

Use Workflow 08 order when supplied.

Otherwise use:

1. Display tier
2. Route effect
3. Effective or report time
4. Route order
5. Stable event ID

## 24.3 Mobile

Use stacked event items.

Example:

```text
High wind may affect the exposed route section

Weather
Near East Lake Sammamish
Reported 9:30 AM PDT
Alert
```

Use a clear detail button or link.

Do not make an unlabeled whole card act as a hidden click target.

---

# 25. Footer

Use a full-width green footer:

```css
background: #2D5016;
color: #FFFFFF;
```

Use short copy such as:

- Safe routes
- Well-informed riders
- Better bike tours

A footer link may say:

```text
Visit BikeTourFrance.net
```

and link to:

```text
https://biketourfrance.net
```

Do not add a second large CTA.

---

# 26. Accessibility

The page must meet WCAG AA.

Required:

- Semantic header
- Semantic main
- Clear heading order
- Semantic sections
- Real desktop table
- Header scope on table columns
- Text form of every map event
- Keyboard access to map controls
- Keyboard access to markers when supported
- Visible focus
- At least 2px focus offset
- At least 44px touch targets
- No color-only meaning
- Logo alt text
- Clear link names
- Reduced-motion support
- No keyboard trap
- No flashing or pulsing
- No auto-pan after the user begins use
- Useful error text
- Support for 200% zoom

Map description:

```text
Interactive map showing the UW–Issy cycling route and current route events. A full text list appears below the map.
```

---

# 27. Responsive rules

Test at:

```text
1280px
1024px
768px
390px
320px
```

Mobile rules:

- No page-wide side scroll
- No tiny controls
- No forced desktop table
- No hidden Email link
- No hidden Main site button
- No hamburger menu
- No key UI text below 14px
- No fixed viewport-height page layout
- No clipped long event text
- No map taller than the screen by default

---

# 28. Performance

The page must show useful text before the map loads.

Required:

- Server-render header
- Server-render route state
- Server-render freshness notice
- Server-render lane list
- Server-render event list
- Lazy-load map code
- Set image dimensions
- Cache logo
- Cache route GeoJSON
- Keep JavaScript small
- Avoid a full icon pack for a few icons
- Avoid browser work that Workflow 08 or the build can do
- Avoid browser calls to GitHub raw files
- Avoid browser calls to Hetzner

The map is an enhancement, not the only route-status view.

---

# 29. Suggested project structure

Preserve the current repo structure when it already has an approved layout.

A suitable target is:

```text
src/
  pages/
    index.astro
    route-status.astro

  components/
    site/
      SiteHeader.astro
      SiteFooter.astro

    route-status/
      DashboardHeading.astro
      FreshnessNotice.astro
      CurrentRouteState.astro
      MonitoringSources.astro
      RouteImpacts.astro
      RouteMap.svelte
      EventTable.astro
      EventListMobile.astro
      EventDetail.astro
      SystemHealthDisclosure.astro

  lib/
    route-status/
      types.ts
      load-public-package.ts
      validate-public-package.ts
      normalize-dashboard-data.ts
      normalize-route-events.ts
      format-time.ts
      lane-labels.ts
      lane-colors.ts
      display-tier.ts
      source-health.ts

  styles/
    route-status.css

data/
  route/
    UnivWA-Issaquah.gpx

public/
  routes/
    UnivWA-Issaquah.geojson

  data/
    dashboard-data.json
    route-events.geojson
    system-health.json
    release-manifest.json

scripts/
  validate-route-source.mjs
  convert-route-gpx-to-geojson.mjs
  validate-public-package.mjs
  verify-built-assets.mjs
```

---

# 30. Mock data ban

Mock data may exist only in:

- Tests
- Fixtures
- Story files
- A clearly marked local preview mode

Production must not contain sample records from the old draft, such as:

- Loose gravel on sharp curve
- High wind near coastal viewpoint
- AQI moderate — slight haze
- Controlled burn nearby
- Minor pooling water
- Water fountain at station 4
- Flash detour setup

Production must not include sample route parts such as:

- Canyon Climb
- Coastal Link
- Valley Loop

unless those names are later approved as real route parts.

---

# 31. GitHub Actions build contract

The workflow must:

1. Check out the repo.
2. Install from the lock file.
3. Confirm the canonical GPX exists.
4. Validate the GPX.
5. Convert GPX to GeoJSON.
6. Validate the route GeoJSON.
7. Validate `dashboard-data.json`.
8. Validate `route-events.geojson`.
9. Validate `system-health.json`.
10. Validate `release-manifest.json`.
11. Confirm cross-file IDs match.
12. Confirm release IDs match.
13. Run unit tests.
14. Run app build.
15. Confirm required built assets exist.
16. Check public output for secret-like content.
17. Deploy to Cloudflare Pages.
18. Check the public page.
19. Check all public route and data URLs.
20. Record build and production proof in the approved project log.

The build must fail when:

- GPX is missing
- GPX is invalid
- Conversion fails
- Route GeoJSON is empty
- Public JSON is invalid
- Event GeoJSON is invalid
- A required file is missing
- Cross-file IDs conflict
- Release IDs conflict
- App build fails
- Production page fails
- Route asset fails
- Any public package file fails
- Secret-like content is found in public output

---

# 32. Cache and release consistency

## 32.1 Route geometry

The route may use long cache life because it changes with a site release.

Preferred for a hashed route asset:

```text
Cache-Control: public, max-age=31536000, immutable
```

If a stable route file name is used, each Pages deploy must replace it as one release.

## 32.2 Monitoring files

Do not give year-long immutable cache to:

```text
dashboard-data.json
route-events.geojson
system-health.json
release-manifest.json
```

Use a cache rule that lets each new publish appear fast.

## 32.3 Same release

The app and four public files must come from one deploy.

Do not mix:

- New UI with old dashboard data
- New event GeoJSON with old system health
- New manifest with old dashboard summary

The app release ID must match the manifest.

---

# 33. Security and privacy

Do not expose:

- n8n API keys
- GitHub tokens
- Cloudflare tokens
- Connector credentials
- Private host names
- Raw private source data
- Hetzner internal paths
- Candidate files
- Quarantine files
- Internal logs
- Internal execution proof
- Staff email contents

Do not:

- Ask for user location
- Track rider path
- Store route history
- Use ad tracking
- Require cookies for core use

Keep these fixed:

```text
mailto:contact@biketourfrance.net
https://biketourfrance.net
```

---

# 34. Error handling

## 34.1 Public package failure

Show:

```text
Current route status data could not be loaded.
```

Show last-known-good data when available and mark its time.

## 34.2 Route geometry failure

Show:

```text
The route line could not be loaded. Current route events are still listed below.
```

## 34.3 Bad event geometry

- Skip the bad geometry
- Keep the text event
- Log the issue
- Do not break the full map

## 34.4 Unknown lane

Use:

```text
Other route source
```

Log the unknown ID.

Do not drop an otherwise valid event without a reviewed rule.

## 34.5 Unknown tier

Map to:

```text
Status unknown
```

Never map to Normal.

---

# 35. Tests

## 35.1 Route tests

Test:

- GPX exists
- Valid GPX
- Invalid XML
- Empty route
- Bad latitude
- Bad longitude
- Multiple tracks
- Conversion
- Empty GeoJSON
- Expected bounds
- Repeatable output

## 35.2 Public-package tests

Test:

- All four files valid
- Missing file
- Wrong schema
- Mismatched release ID
- Missing event reference
- Bad geometry
- Missing lane
- Unknown lane
- Unknown tier
- Failed source
- Degraded source
- Last-known-good source
- Stale package
- No route-related events
- Zero events with healthy sources
- Zero events with a failed source

## 35.3 UI tests

Test:

- Normal
- Watch
- Alert
- Unknown
- Stale notice
- Partial source failure
- Last-known-good notice
- Map loading
- Map failure
- Long title
- Missing location
- Missing geometry
- Many points
- No route-impact data
- Email link
- Main site button
- Logo link

## 35.4 Accessibility tests

Test:

- Keyboard only
- Visible focus
- Link names
- Table headers
- Marker labels
- Text event fallback
- 200% zoom
- Reduced motion
- Contrast
- Touch target size
- Mobile reading order
- No color-only state

## 35.5 Browser tests

At minimum:

- Current Chrome
- Current Safari
- Current Firefox
- Current Edge
- iOS Safari
- Android Chrome

---

# 36. Production verification

A local build is not completion.

A successful GitHub Actions run is not completion.

The release is complete only after checks confirm:

- Main page returns success
- Approved logo loads
- Email link is correct
- Main site link is correct
- Route GeoJSON returns success
- Dashboard data returns success
- Event GeoJSON returns success
- System health returns success
- Release manifest returns success
- Release IDs match
- Map renders the real route
- No mock route appears
- No mock events appear
- Mobile layout works
- Stale state works
- Failure state works
- No secret-like content appears
- Cloudflare Pages serves the expected Git commit

---

# 37. Ringer build boundaries

Ringer must:

1. Inspect the repo first.
2. Read the architecture.
3. Read the as-built monitoring specs.
4. Read this document.
5. Read the current build log.
6. Find the current public-data paths.
7. Preserve approved files.
8. Use the real canonical GPX.
9. Build against Workflow 08 outputs.
10. Keep the browser out of raw connector data.
11. Add normalized adapters where needed.
12. Log any missing fields that block safe UI mapping.
13. Validate before deploy.
14. Commit and push only approved work.
15. Verify production.
16. Update the project build log after clear progress and at closeout.

Ringer must not:

- Treat the Mac as a runtime host
- Use R2 as a required route host
- Use GitHub raw URLs in the browser
- Read raw connector files in the browser
- Invent route parts
- Invent alert points
- Treat failed fetch as no event
- Claim all lanes are healthy without proof
- Show mock records as real
- Add more top links
- Add a hamburger menu
- Activate n8n workflows unless the task grants that right
- Create a second deploy path

---

# 38. Build log

Ringer must find the project’s canonical build log before running change commands.

Preferred project log:

```text
/Users/jkbrookspersonal/LocalSiteBuildFiles/BTF_UW-Issy_Route_Monitor/00_BUILD_LOG.md
```

If that file does not exist and no more specific project log is found, use:

```text
/Users/jkbrookspersonal/JBLocal FilesTEMP/00_GENERAL_BUILDLOG.md
```

Each clear round of progress must record:

- Date and time
- Scope
- Files changed
- Checks run
- Result
- Open gaps
- Next safe step
- Commit
- Build
- Deploy
- Production proof

---

# 39. Acceptance criteria

## 39.1 Brand

- Public text uses BikeTourFrance.net.
- Public text does not use BTF.
- Approved logo is at upper left.
- Header is `#2D5016`.
- Montserrat is the main font.
- No dark mode.
- No glass effect.
- No neon style.
- No startup SaaS look.

## 39.2 Header

- Only Email and Main site are visible actions.
- Email uses `mailto:contact@biketourfrance.net`.
- Main site uses `https://biketourfrance.net`.
- Main site looks like a button.
- Logo may link to the main site.
- No hamburger menu.
- Both links work without JavaScript.
- Both have 44px targets.
- Both have visible focus.

## 39.3 Route

- Canonical GPX is `data/route/UnivWA-Issaquah.gpx`.
- GPX is tracked in GitHub.
- The Mac is not in the runtime.
- GitHub Actions validates GPX.
- GitHub Actions makes GeoJSON.
- Browser loads same-origin GeoJSON.
- Derived route is not hand-edited.
- R2 is not required.
- GitHub raw URLs are not used.
- Map fits real route bounds.

## 39.4 Monitoring data

- UI uses Workflow 08 outputs.
- UI does not read lane pointer files.
- UI does not scan Hetzner.
- Hazard state and source health are separate.
- Last-known-good is marked.
- Failed fetch is not shown as no event.
- Event count matches Workflow 08.
- Browser does not redo cross-lane deduplication.
- Unknown never becomes Normal.

## 39.5 UI

- Desktop uses the two-column layout.
- Mobile uses one clear column.
- Map is the main visual.
- Every mapped event also exists in text.
- Events without geometry stay in text.
- Route parts are not invented.
- Mock production data is absent.
- Page works when map fails.
- Core page works when JavaScript fails.

## 39.6 Accessibility

- WCAG AA contrast passes.
- Keyboard access works.
- Focus is visible.
- Touch targets are at least 44px.
- Icons have text meaning.
- No state relies on color alone.
- Map does not trap focus.
- Desktop events use a semantic table.
- Mobile events have a clear reading order.

## 39.7 Build and deploy

- GPX passes checks.
- GeoJSON passes checks.
- All four public files pass checks.
- App builds in GitHub Actions.
- Cloudflare Pages deploys the same commit.
- Production asset checks pass.
- Release IDs match.
- Build log is updated.
- Production is verified.

---

# 40. Final implementation rule

The live system is:

```text
Seven monitored lanes on Hetzner
→ Workflow 08
→ four validated public files
→ GitHub
→ GitHub Actions
→ canonical GPX validation
→ GPX-to-GeoJSON conversion
→ Astro dashboard build
→ Cloudflare Pages
→ production verification
```

The route source is:

```text
data/route/UnivWA-Issaquah.gpx
```

The top header is:

```text
BikeTourFrance.net logo | Email | Main site
```

The map implementation is:

```text
Astro page shell
→ server-rendered status and alert text
→ client-loaded Leaflet map
→ same-origin route GeoJSON
→ same-origin route-events GeoJSON
```

The Mac is not part of the live runtime.

R2 is not required for the route.

The browser must use the route asset and public monitoring package from the same Cloudflare Pages release.
