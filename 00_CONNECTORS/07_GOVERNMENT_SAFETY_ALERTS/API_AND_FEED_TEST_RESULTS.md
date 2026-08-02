# API_AND_FEED_TEST_RESULTS

All tests below were run on Wednesday, July 29, 2026 from the local research
environment. The goal was not just HTTP reachability, but proof that the source
returned real usable data, a meaningful structured no-alert state, or a clearly
documented blocked state.

## Test 1 - Mise en place and route prerequisites
- Paths checked:
  - `/Users/jkbrookspersonal/LocalSiteBuildFiles/BTF_UW-Issy_Route_Monitor`
  - `/Users/jkbrookspersonal/LocalSiteBuildFiles/BTF_UW-Issy_Route_Monitor/data/route/UnivWA-Issaquah.gpx`
  - `/Users/jkbrookspersonal/LocalSiteBuildFiles/BTF_UW-Issy_Route_Monitor/00_CONNECTORS/07_GOVERNMENT_SAFETY_ALERTS`
- Result: all three existed and were readable.
- Reused route facts cited from completed work:
  - corrected canonical GPX distance: `33.83 mi`
  - corrected canonical GPX bbox: lat `47.55207` to `47.75889`, lon `-122.30570` to `-122.04414`
  - route monitoring points `WP1`-`WP8` from `00_CONNECTORS/02_WEATHER/ROUTE_WEATHER_POINT_MAPPING.md`

## Test 2 - NWS route-point active alert query
- URL: `https://api.weather.gov/alerts/active?point=47.6505,-122.3046`
- Status: `200`
- Content-Type: `application/geo+json`
- Payload reality check: valid FeatureCollection with `features: []`, `updated`, and title metadata.
- Timestamp fields present: top-level `updated`
- Geography present: route point itself is the query key
- Pagination: none observed
- Rate-limit/cache evidence: short public cache headers present
- Authentication: none
- Unattended use: yes
- Failure behavior: empty feature set is a valid no-alert state, not a connector failure

## Test 3 - NWS King County zone query
- URL: `https://api.weather.gov/alerts/active?zone=WAC033`
- Status: `200`
- Content-Type: `application/geo+json`
- Payload reality check: valid FeatureCollection with `features: []`
- Timestamp fields present: top-level `updated`
- Geography present: NWS zone code for King County
- Pagination: none observed
- Authentication: none
- Unattended use: yes
- Failure behavior: same as Test 2

## Test 4 - NWS statewide Washington query
- URL: `https://api.weather.gov/alerts/active?area=WA`
- Status: `200`
- Content-Type: `application/geo+json`
- Payload reality check: live data returned; `4` features were present at test time
- Sample live records observed:
  - `Air Quality Alert` issued by `NWS Spokane WA`
  - multiple alert ids sharing the same event type and time window
- Timestamp fields present: top-level `updated`; per-feature `sent`, `effective`, `onset`, `expires`, `ends`
- Geography present: SAME/UGC geocodes, `affectedZones`, and area descriptions
- Pagination: none observed
- Authentication: none
- Unattended use: yes
- Failure behavior: statewide query is a backstop, not the primary route filter

## Test 5 - NWS Atom feed and per-alert CAP XML
- URLs:
  - `https://api.weather.gov/alerts/active?area=WA` with `Accept: application/atom+xml`
  - first per-alert CAP URL returned by that Atom feed
- Status: `200` for both
- Content-Types: `application/atom+xml`, `application/cap+xml`
- Payload reality check:
  - Atom feed returned `4` current entries
  - per-alert CAP XML returned a real CAP `identifier`, `sent` timestamp, `event`, and `areaDesc`
- Sample CAP event observed: `Air Quality Alert`
- Authentication: none
- Unattended use: yes
- Deduplication relevance: confirms CAP identifier and reference chain are available for event identity

## Test 6 - Legacy NOAA alerts host
- URLs tested:
  - `https://alerts.weather.gov/cap/us.php?x=0`
  - `https://alerts.weather.gov/cap/wa.php?x=0`
- Result: DNS/host failure from this environment
- Payload reality check: none
- Authentication: none if it were reachable
- Interference: hostname itself failed from this environment
- Conclusion: reject in favor of the modern NWS stack

## Test 7 - AlertSeattle RSS
- URL: `https://alert.seattle.gov/feed/`
- Status: `200`
- Content-Type: `application/rss+xml; charset=UTF-8`
- Payload reality check: valid RSS with `10` items in the sampled response
- `lastBuildDate`: `Mon, 06 Jul 2026 19:10:10 +0000`
- Sample item titles:
  - `NEWS RELEASE FROM THE OFFICE OF EMERGENCY MANAGEMENT`
  - `NEWS RELEASE FROM THE OFFICE OF EMERGENCY MANAGEMENT`
- Geography: Seattle-specific but text-only
- Pagination: feed snapshot only
- Authentication: none
- Unattended use: yes

## Test 8 - AlertSeattle WordPress JSON
- URL: `https://alert.seattle.gov/wp-json/wp/v2/posts?per_page=5`
- Status: `200`
- Content-Type: `application/json; charset=UTF-8`
- Payload reality check: real current post list with recent July 2026 posts
- Sample records:
  - post `1707839`, slug `news-release-from-the-office-of-emergency-management-4`
  - post `1707821`, slug `news-release-from-the-office-of-emergency-management-3`
- Timestamp fields present: `date`, `date_gmt`, `modified`, `modified_gmt`
- Pagination: page-sized JSON list; no explicit `X-WP-Total` headers were surfaced in this probe
- Authentication: none
- Unattended use: yes

## Test 9 - Seattle Fire Department Fireline RSS
- URL: `https://fireline.seattle.gov/feed/`
- Status: `200`
- Content-Type: `application/rss+xml; charset=UTF-8`
- Payload reality check: valid RSS with `10` items
- `lastBuildDate`: `Tue, 21 Jul 2026 18:49:04 +0000`
- Sample item titles:
  - `2-alarm apartment building fire displaces residents in the Wallingford neighborhood`
  - `3-alarm fire destroys warehouse in the Industrial District`
- Geography: incident locations are in text only
- Pagination: feed snapshot only
- Authentication: none
- Unattended use: yes, but only as a secondary editorial signal

## Test 10 - Seattle Police Blotter RSS and Significant Incident Reports
- URLs:
  - `https://spdblotter.seattle.gov/feed/`
  - `https://spdblotter.seattle.gov/significant-incident-reports/`
- Status: `200` for both
- Content-Types: RSS XML and HTML
- Payload reality check:
  - RSS feed returned `10` items
  - Significant Incident Reports page returned a real current HTML page
- `lastBuildDate`: `Mon, 27 Jul 2026 08:08:41 +0000`
- Sample item titles:
  - `Gun Violence at Seattle Center Takes Three Lives`
  - `Three Women Injured in North Seattle Shooting`
- Geography: text-only
- Authentication: none
- Unattended use: technically yes, but route filtering must be strict

## Test 11 - UW Alert RSS
- URL: `https://emergency.uw.edu/feed/`
- Status: `200`
- Content-Type: `application/rss+xml; charset=UTF-8`
- Payload reality check: valid RSS with `10` items
- `lastBuildDate`: `Tue, 28 Jul 2026 18:38:58 +0000`
- Sample item titles:
  - `UW Advisory – Emergency response`
  - `UW Advisory: Rabid bat found Wednesday on University Way NE`
  - `UW Alert – Stabbing`
- Geography: naturally narrow because source scope is campus-centered
- Pagination: feed snapshot only
- Authentication: none
- Unattended use: yes

## Test 12 - UW Alert WordPress JSON
- URL: `https://emergency.uw.edu/wp-json/wp/v2/posts?per_page=5`
- Status: `200`
- Content-Type: `application/json; charset=UTF-8`
- Payload reality check: real recent post list
- Sample records:
  - post `4651`, slug `uw-advisory-emergency-response`
  - post `4641`, slug `uw-advisory-rabid-bat-found-wednesday-on-university-way-ne`
  - post `4625`, slug `uw-alert-stabbing`
- Timestamp fields present: `date`, `date_gmt`, `modified`, `modified_gmt`
- Pagination: `X-WP-Total: 192`, `X-WP-TotalPages: 39`
- Authentication: none
- Unattended use: yes

## Test 13 - ALERT King County public page
- URL: `https://kingcounty.gov/en/dept/executive-services/health-safety/safety-injury-prevention/emergency-preparedness/alert-king-county`
- Status: `200`
- Content-Type: HTML
- Payload reality check: official signup/information page only; no public incident payload
- Geography: countywide by design
- Authentication: signup required for message delivery
- Unattended use: no public read endpoint found

## Test 14 - Redmond emergency page, AlertCenter, RSS, and Everbridge widget
- URLs:
  - `https://www.redmond.gov/506/Emergency-Alerts`
  - `https://www.redmond.gov/AlertCenter.aspx`
  - `https://www.redmond.gov/RSSFeed.aspx?ModID=63&CID=Community-Alerts-4`
  - `https://eww.everbridge.net/web-widget/?o=h111V9K1&s=fwww9ZOw`
- Statuses: `200` for all four probes
- Content-Types: HTML and XML
- Payload reality check:
  - city page clearly documents AlertRedmond and embeds the Everbridge widget
  - AlertCenter page loaded but did not prove a current route-relevant emergency item
  - RSS was valid XML but contained `0` items
  - widget returned only a thin shell, not a stable incident payload
- Geography: citywide only, text-based
- Authentication: none
- Interference: client-side/widget behavior makes this source operationally risky from this environment
- Conclusion: partially verified only

## Test 15 - Bothell AlertCenter and RSS
- URLs:
  - `https://www.bothellwa.gov/AlertCenter.aspx?CID=Emergency-Alerts-5`
  - `https://www.bothellwa.gov/RSSFeed.aspx?ModID=63&CID=Emergency-Alerts-5`
- Status: `200` for both
- Content-Types: HTML, `text/xml; charset=utf-8`
- Payload reality check: real no-alert state in HTML; valid XML with `0` items in RSS
- `lastBuildDate`: `Wed, 29 Jul 2026 14:55:06 -0800`
- Geography: citywide, text-based
- Authentication: none
- Unattended use: mechanism is reachable but still unresolved until a live alert item is observed

## Test 16 - Woodinville AlertCenter and RSS
- URLs:
  - `https://www.woodinville.gov/AlertCenter.aspx?CID=Emergency-Alerts-6`
  - `https://www.woodinville.gov/RSSFeed.aspx?ModID=63&CID=Emergency-Alerts-6`
- Status: `200` for both
- Content-Types: HTML, `text/xml; charset=utf-8`
- Payload reality check: real no-alert state in HTML; valid XML with `0` items in RSS
- `lastBuildDate`: `Wed, 29 Jul 2026 12:55:07 -0800`
- Authentication: none
- Unattended use: reachable but unresolved for the same reason as Bothell

## Test 17 - Sammamish emergency-management page
- URL: `https://www.sammamish.us/our-community/emergency-management/`
- Status: `200`
- Content-Type: HTML
- Payload reality check: informational page directing users to Alert King County and preparedness resources
- Authentication: none
- Unattended use: no; no public feed/API recovered

## Test 18 - Issaquah AlertCenter, RSS, and Notify Me list
- URLs:
  - `https://www.issaquahwa.gov/AlertCenter.aspx?CID=Emergency-Alerts-8`
  - `https://www.issaquahwa.gov/RSSFeed.aspx?ModID=63&CID=Emergency-Alerts-8`
  - `https://www.issaquahwa.gov/list.aspx`
- Status: `200` for all three
- Content-Types: HTML and XML
- Payload reality check:
  - AlertCenter returned a real no-alert state
  - RSS was valid XML with `0` items
  - Notify Me list description explicitly named emergencies, flooding, severe winter weather, police notifications, and unplanned major road closures
- `lastBuildDate`: `Wed, 29 Jul 2026 14:55:08 -0800`
- Authentication: none for public pages and RSS
- Unattended use: mechanism is promising but still unresolved until a live alert item is observed

## Test 19 - Washington EMD alerts page
- URL: `https://mil.wa.gov/alerts`
- Status: `200`
- Content-Type: `text/html; charset=UTF-8`
- Payload reality check: statewide alerting directory and outbound-link hub, not a public live incident feed
- Authentication: none
- Unattended use: reject as an operational connector

## Test 20 - DOH Health and Safety Alerts landing page
- URL: `https://doh.wa.gov/emergencies/health-and-safety-alerts`
- Status: `200`
- Content-Type: HTML
- Payload reality check: stable structured landing page with outbound alert categories, but not a dedicated event feed
- Authentication: none
- Unattended use: not a primary feed; optional secondary helper surface only

## Test 21 - Washington Health Alert Network public table
- URL: `https://doh.wa.gov/public-health-provider-resources/washington-health-alert-network`
- Status: `200`
- Content-Type: `text/html; charset=UTF-8`
- Cache evidence: `cache-control: max-age=86400, public`
- Payload reality check: large public HTML table with current 2026 entries and archive links
- Sample visible date: `07/23/2026`
- Geography: statewide/regional text descriptions only
- Pagination: none observed
- Authentication: none
- Unattended use: yes, as a secondary HTML parser

## Test 22 - Sound Transit GTFS-realtime service alerts
- URL: `https://s3.amazonaws.com/st-service-alerts-prod/alerts_pb.json`
- Status: `200`
- Content-Type: `application/json`
- Payload reality check: real live GTFS-realtime payload with `5` entities in this sampled response
- Sample live records observed:
  - `East stairwell at South Bellevue Station Garage is closed`
  - `Starting Monday, March 16, Sound Transit will close Kent Station's northwest Sounder surface parking lot.`
- Timestamp fields present: GTFS header `timestamp`; per-alert active periods
- Geometry: none; route and stop identifiers only
- Pagination: none
- Authentication: none
- Unattended use: yes

## Test 23 - King County Metro GTFS-realtime service alerts
- URLs:
  - `https://s3.amazonaws.com/kcm-alerts-realtime-prod/alerts_enhanced.json`
  - `https://s3.amazonaws.com/kcm-alerts-realtime-prod/alerts_pb.json`
- Status: `200`
- Content-Type: `application/json`
- Payload reality check: real live GTFS-realtime payload with `98` entities in the enhanced JSON sample
- Sample live records observed:
  - route `239` reroute affecting UW Bothell / Cascadia College
  - stop closures and construction reroutes affecting eastside mobility
- Timestamp fields present: GTFS header `timestamp`; created/modified timestamps and active periods
- Geometry: none; route and stop identifiers only
- Pagination: none
- Authentication: none
- Unattended use: yes

## Test 24 - WSDOT Highway Alerts API without access code
- URL: `https://www.wsdot.wa.gov/traffic/api/HighwayAlerts/HighwayAlertsREST.svc/GetAlertsAsJson?AccessCode=`
- Status: `401`
- Content-Type: `text/html`
- Payload reality check: real auth failure page stating the supplied access code was missing or invalid
- Authentication: access code required
- Unattended use: yes only after credential provisioning
- Conclusion: blocked but genuine

## Test 25 - FEMA IPAWS archive feature service
- URLs:
  - `https://gis.fema.gov/arcgis/rest/services/FEMA/IPAWS_Archive/FeatureServer/1?f=json`
  - `https://gis.fema.gov/arcgis/rest/services/FEMA/IPAWS_Archive/FeatureServer/1/query?where=1%3D1&returnCountOnly=true&f=json`
- Status: `200` for both
- Content-Type: `application/json;charset=UTF-8`
- Payload reality check: ArcGIS metadata loaded correctly; count query returned `442914`
- Timestamps: archive records include CAP timing fields, but this test focused on metadata and count only
- Geometry: not confirmed in the tested table layer
- Authentication: none
- Unattended use: yes for audit/backfill only
- Conclusion: public and queryable, but delayed and therefore not a live-monitoring source

## Test 26 - FEMA IPAWS live-feed documentation page
- URL: `https://www.fema.gov/emergency-managers/practitioners/integrated-public-alert-warning-system/technology-developers`
- Status: `403`
- Content-Type: HTML
- Payload reality check: official page was not readable from this environment at fetch time
- Authentication/interference: access-model details were confirmed through prior official documentation references already cited in this folder; the live page itself was blocked in this direct probe
- Conclusion: live FEMA feed remains unresolved

## Test 27 - Washington State Patrol public site surfaces
- URLs:
  - `https://wsp.wa.gov/`
  - `https://wsp.wa.gov/missing-persons/`
  - `https://wsp.wa.gov/amber-alert/`
- Result: each request was intercepted by a `307` Sucuri JavaScript challenge page
- Payload reality check: official site shell only, not usable data
- Interference: bot protection / JavaScript challenge
- Authentication: no credential identified; a browser-capable runtime would be required just to clear the gate
- Conclusion: blocked for unattended connector purposes from this environment
