# UW–Issaquah Route Monitor — Current Architecture

## Status

Initial project mise en place only.

## Intended architecture

Seven independent route-monitoring workstreams produce normalized data for a route-specific dashboard.

The system will reuse the proven CDM Status Map patterns for:

- route-corridor filtering
- event normalization
- source-health reporting
- freshness calculations
- manual review
- atomic output
- last-known-good preservation
- testing
- build
- Cloudflare deployment

Washington-specific sources and jurisdiction mappings have not yet been selected.
