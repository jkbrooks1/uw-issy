# SOURCE_GAPS

## Gap 1 - No strong public municipal emergency feed for the eastside corridor

Affected route sections:
- WP3 Bothell
- WP4 Woodinville
- WP5-WP6 Redmond / Marymoor
- WP7 Sammamish
- WP8 Issaquah

What was found:
- Bothell, Woodinville, and Issaquah each expose public CivicPlus AlertCenter/RSS surfaces
- Redmond exposes an official AlertRedmond page with an embedded Everbridge widget

Why the gap remains:
- Bothell, Woodinville, and Issaquah showed only zero-alert states on Wednesday, July 29, 2026
- Redmond's widget did not return a stable incident payload from this environment
- Sammamish did not expose a public machine-readable municipal alert source at all

What would close it:
- capture and validate one real alert item each from `BOTH-01`, `WOOD-01`, and `ISS-01`
- test Redmond's Everbridge widget from the eventual production host or a browser-capable runtime

## Gap 2 - WSDOT remains high-value but untested with credentials

Affected route sections:
- SR-522 / Kenmore-Bothell crossing context
- I-405 / SR-522 interchange context
- Issaquah / I-90 detour context

What was found:
- official API exists
- structured formats are documented
- no-key call returned a clean `401`

Why the gap remains:
- no live credentialed payload was retrieved in this cycle

What would close it:
- test `WSDOT-01` with the provisioned access code from a clean implementation step
- confirm exact field set, paging behavior, and route-highway crossing relevance

## Gap 3 - No anonymous public FEMA live all-hazards feed

Affected route sections:
- all sections for rare civil-emergency, evacuation, hazmat, or wireless-emergency-style alerts

What was found:
- live FEMA IPAWS feed is documented but access-controlled
- public FEMA archive is delayed and unsuitable for live monitoring

Why the gap remains:
- no anonymous live federal all-hazards CAP source was recoverable

What would close it:
- only a formal FEMA IPAWS onboarding effort

## Gap 4 - WSP cannot be treated as an unattended source from this environment

Affected route sections:
- all sections, but mostly only for rare law-enforcement or missing-person events

What was found:
- official WSP URLs exist
- direct probes triggered a Sucuri JavaScript challenge

Why the gap remains:
- no stable non-browser payload was retrievable

What would close it:
- a browser-capable fetch path that can honestly clear the challenge, or a different official WSP data surface

## Gap 5 - Public-health locality remains coarse

Affected route sections:
- all sections

What was found:
- `DOH-02` is a good statewide public table
- `DOH-01` is a stable statewide landing page

Why the gap remains:
- health alerts are often statewide or provider-oriented rather than route-specific
- geometry is not supplied

What would close it:
- a consistent way to cross-reference DOH notices with King County or municipal public-health cross-posts when they exist

## Gap 6 - Cross-lane ownership must be enforced in implementation

Affected route sections:
- all sections

What was found:
- NWS statewide query returned live Air Quality Alerts on Wednesday, July 29, 2026
- those are real alerts, but they belong primarily to `03_AIR_QUALITY`, not to this lane

Why the gap remains:
- any route-wide official alert source will surface overlapping hazard types

What would close it:
- strict event-type ownership filters in the future workflow
- explicit cross-listing rules only when intended and labeled
