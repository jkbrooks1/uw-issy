# UW-Issaquah Connector Environment Requirements (Workstreams 03-07)

Consolidated from each workstream's own `ENV_AND_READINESS.md`. Every workstream inspected
environment-variable **names only** — no secret value was ever printed, copied, or logged
in any research deliverable, in this document, or anywhere in this synthesis pass.

## Consolidated credential table

| Source (workstream) | Variable name | Secret type | Required or optional | Where to obtain it | Already present in this environment? | Tested without it? | Limitation without credential |
|---|---|---|---|---|---|---|---|
| `AIRNOW-01` (03) | `AIRNOW_API_KEY` | API key | Optional | AirNow API docs / account request | No | Yes | No access to AirNow web services; project relies on `AIRNOW-02` file products instead |
| `NASA-01` FIRMS (04) | `NASA_FIRMS_MAP_KEY` | API key | Optional for MVP, required to enable FIRMS | Free MAP_KEY request via NASA FIRMS / EOSDIS | No | Partially — Area API returned `400 Invalid MAP_KEY.` | Live hotspot detection data cannot be tested or used at all |
| `WSDOT-01` (05, 06, 07) | `WSDOT_TRAVELER_API_ACCESS_CODE` | Token / access code | Optional for 05 and 06 (limited relevance); required to unlock 07's WSDOT-01 | WSDOT Traveler Information API registration page | **Yes — name already present in this environment** | Yes — clean `401`/access-restricted response confirmed the endpoint is live and correctly gated | Only documentation/unauthenticated help pages are reachable; no live WSDOT payload could be retrieved in any of the three workstreams that looked at it |
| `KCF-02` (05) | `KING_COUNTY_FLOODWARNING_SUBSCRIPTION_KEY` | API key | **Not recommended** | No public issuance path documented — the public web app ships an embedded APIM key that should not be mirrored into project configuration | No | n/a | Treat the King County flood-warning public app as a webpage, not a supported API contract — do not attempt to extract or reuse its embedded key |
| `FEMA-01` IPAWS (07) | `FEMA_IPAWS_USERNAME` | Username | Required if pursuing the FEMA live feed | FEMA IPAWS onboarding / Memorandum of Agreement process | No | Yes (feed inaccessible without it) | No live FEMA all-hazards CAP feed testing possible |
| `FEMA-01` IPAWS (07) | `FEMA_IPAWS_PASSWORD` | Password | Required if pursuing the FEMA live feed | Same FEMA IPAWS onboarding process | No | Yes | Same as above |
| `FEMA-01` IPAWS (07) | `FEMA_IPAWS_PIN` | Additional feed secret / PIN | Optional, likely needed depending on final provisioning path | FEMA IPAWS onboarding / operator instructions | No | Yes | Same as above |

## Cross-workstream note: one credential unlocks three workstreams

`WSDOT_TRAVELER_API_ACCESS_CODE` is the single highest-leverage credential in this
research cycle — it was independently identified as relevant by **three separate
workstreams** (05_FLOOD_CONDITIONS for highway-crossing flood context, 06 for
bridge-opening data if ever needed, and 07_GOVERNMENT_SAFETY_ALERTS for its MVP-adjacent
`WSDOT-01` traveler alerts). It already exists by name in this environment but has never
been tested against a live payload in any of the three research cycles. **Recommended
action: test this one credential first** — it is the only credential in this entire
research cycle that is both already present and has three independent consumers waiting
on it.

## No credential required for any MVP source

Every one of the 21 sources in each workstream's actual MVP set (see
`UW_ISSY_CONNECTOR_IMPLEMENTATION_MATRIX_03_07.md`) requires **no authentication at all**.
All credential-gated sources in the table above are secondary or explicitly
unresolved/blocked — none of them block the recommended first production build. This
matches the project-wide preference (stated in each workstream's own instructions) for
public official endpoints over credentialed ones when they provide equivalent quality.

## Do not create

- No workstream recommends creating a new credential beyond the ones listed above.
- No workstream found or suggested reusing any BikeTourFrance-France-project credential
  (ATMO France, Météo-France, VNF, Vigicrues, or prefecture credentials) — each
  independently confirmed no France-specific assumptions were copied in, per
  `00_PROJECT_RULES.md`'s project-separation rule.
