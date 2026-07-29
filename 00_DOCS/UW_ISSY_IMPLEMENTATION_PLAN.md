# UW–Issaquah Route Monitor — Implementation Plan

## Phase 1 — Route foundation

- Validate canonical GPX
- Generate GeoJSON
- Calculate distance and elevation
- Segment route operationally
- Identify trail owners and jurisdictions
- Define monitoring corridor

## Phase 2 — Source registry

- Research official sources for all seven workstreams
- Classify each source by access method
- Map sources to route sections
- Define freshness and failure rules
- Select MVP sources

## Phase 3 — Connector contracts

- Define canonical normalized-event schema
- Define source-health schema
- Define route-impact classifications
- Define output paths
- Create fixtures and validation tests

## Phase 4 — Workflow implementation

- Build connectors
- Test raw acquisition
- Test normalization
- Test route filtering
- Test stale and failure behavior
- Export validated workflows

## Phase 5 — Dashboard adaptation

- Adapt CDM UI patterns
- Add route sections
- Add map layers
- Add severity indicators
- Add source-health reporting
- Validate mobile layout

## Phase 6 — Deployment

- Build locally
- Run automated tests
- Deploy to Cloudflare Pages
- Verify production assets
- Document operations and recovery
