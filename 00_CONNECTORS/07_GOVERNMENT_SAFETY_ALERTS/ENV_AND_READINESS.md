# ENV_AND_READINESS

Environment-variable inspection in this cycle was limited to name-only checks for
relevant credential patterns. No secret value is printed or copied anywhere in
this folder.

## Credential recommendations

| Source | Variable name | Secret type | Required or optional | Where to obtain it | Existing variable name appears present | Testing completed without it | Limitation without credential |
|---|---|---|---|---|---|---|---|
| WSDOT-01 | `WSDOT_TRAVELER_API_ACCESS_CODE` | API key / access code | Required | WSDOT traveler API registration | Yes | Yes | No live WSDOT payload could be retrieved; only a clean 401 auth-failure response was verified |
| FEMA-01 | `FEMA_IPAWS_USERNAME` | Username | Required if pursuing FEMA live feed | FEMA IPAWS onboarding / MOA process | No | Yes | No live FEMA all-hazards feed testing possible |
| FEMA-01 | `FEMA_IPAWS_PASSWORD` | Password | Required if pursuing FEMA live feed | FEMA IPAWS onboarding / MOA process | No | Yes | Same as above |
| FEMA-01 | `FEMA_IPAWS_PIN` | Additional feed secret / PIN | Optional but likely needed depending on final FEMA provisioning path | FEMA IPAWS onboarding / operator instructions | No | Yes | Same as above |

## Readiness scoring

Scale:
- `1` = weak
- `5` = strong

Readiness levels:
- `ready_now`
- `ready_with_credentials`
- `ready_with_scraper`
- `needs_more_research`
- `not_recommended`

| Source | Authority | Route relevance | Freshness | Reliability | Machine readability | Implementation effort | Maintenance burden | Historical stability | Licensing clarity | Outage resilience | Overall readiness | Notes |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|---|
| NWS-01 | 5 | 5 | 5 | 5 | 5 | 2 | 2 | 5 | 5 | 4 | `ready_now` | Strongest source in the lane; CAP ids and geocodes support robust deduplication |
| SEA-01 | 5 | 4 | 4 | 4 | 4 | 2 | 2 | 4 | 4 | 3 | `ready_now` | Best local city feed for the Seattle segment |
| UW-01 | 5 | 5 | 4 | 4 | 4 | 2 | 2 | 4 | 4 | 3 | `ready_now` | Narrow campus scope keeps relevance high |
| SEAFD-01 | 4 | 3 | 3 | 4 | 4 | 2 | 3 | 4 | 4 | 3 | `ready_now` | Secondary only; editorial incident feed |
| SEAPD-01 | 4 | 3 | 3 | 4 | 4 | 2 | 3 | 4 | 4 | 3 | `ready_now` | Secondary only; noisy and text-only |
| DOH-02 | 5 | 2 | 3 | 4 | 2 | 3 | 3 | 4 | 4 | 3 | `ready_with_scraper` | Strong public-health context, but HTML-table parsing is required and locality is coarse |
| ST-01 | 5 | 2 | 5 | 5 | 5 | 2 | 2 | 4 | 4 | 4 | `ready_now` | Use only for alternate-transport context |
| KCMETRO-01 | 5 | 3 | 5 | 5 | 5 | 2 | 2 | 4 | 4 | 4 | `ready_now` | Use only for alternate-transport context |
| WSDOT-01 | 5 | 4 | 5 | 4 | 5 | 3 | 3 | 4 | 4 | 4 | `ready_with_credentials` | High-value if credentialed, but not verified live this cycle |
| REDM-01 | 4 | 4 | 4 | 2 | 2 | 4 | 4 | 3 | 3 | 2 | `needs_more_research` | Official but widget retrieval was not stable here |
| BOTH-01 | 4 | 3 | 4 | 3 | 3 | 3 | 3 | 3 | 4 | 3 | `needs_more_research` | Mechanism exists; needs first live item capture |
| WOOD-01 | 4 | 3 | 4 | 3 | 3 | 3 | 3 | 3 | 4 | 3 | `needs_more_research` | Same as Bothell |
| ISS-01 | 4 | 4 | 4 | 3 | 3 | 3 | 3 | 3 | 4 | 3 | `needs_more_research` | Mechanism exists and is route-relevant by description, but still needs first live item capture |
| FEMA-01 | 5 | 4 | 5 | 4 | 5 | 5 | 4 | 4 | 3 | 4 | `ready_with_credentials` | Valuable but outside MVP because onboarding is nontrivial |
| FEMA-02 | 5 | 2 | 1 | 4 | 5 | 2 | 2 | 4 | 4 | 4 | `not_recommended` | Audit/backfill only, not operational |

## Medium- and low-confidence recommendation notes

- `DOH-02` is worth keeping, but it is not a route-first emergency source. It is
  secondary because the lane only needs public-health alerts that materially
  affect outdoor riding.
- `REDM-01` is the most important municipal follow-up. The official page is real
  and clearly meant for emergency alerts, but the widget behavior from this
  environment was not trustworthy enough for MVP.
- `BOTH-01`, `WOOD-01`, and `ISS-01` are honest `needs_more_research` cases
  rather than rejections because the public feed mechanisms are real. The missing
  piece is a captured live alert item.
- `WSDOT-01` and `FEMA-01` are not low-authority sources; they are unresolved only
  because of access constraints.
