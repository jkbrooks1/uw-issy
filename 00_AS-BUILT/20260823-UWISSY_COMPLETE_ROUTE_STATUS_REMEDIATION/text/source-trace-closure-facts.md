# Source Trace for Closure Facts

Source checked during remediation:

- King County Parks East Lake Sammamish Trail page
- URL: https://kingcounty.gov/en/dept/dnrp/nature-recreation/parks-recreation/king-county-parks/trails/leafline-trails/east-lake-sammamish
- Fetch proof: local curl capture `/tmp/kc-elst.html`, searched for `Louis Thompson`, `Inglewood`, `detour`, `closed`, `closure`, `2026`, and `George Davis`.

Supported facts rendered:

- Closed section: East Lake Sammamish Trail.
- From: Louis Thompson Rd NE.
- To: NE Inglewood Hill Rd.
- Closed length: 0.11 mi.
- Detour: No.
- Closure hours: not rendered because no supported hour limit was found.
- Expected reopening: End of 2026.
- Source: King County Parks - East Lake Sammamish Trail page.

Evidence notes:

- The official King County page states the ELST closure begins June 1, 2026 and lasts through the rest of 2026.
- The official King County page locates the closure between Louis Thompson Rd NE and NE Inglewood Hill Rd.
- The official King County page states the trail closure area is 600 ft.
- The official King County page states there is no detour around the construction closure.

No-fabrication decisions:

- Closure hours were not rendered.
- No detour geometry was rendered.
- The existing affected LineString remains the canonical route-section fallback geometry already documented by the public-package builder; it is not used to calculate the closure length because the official source supplies distance.
