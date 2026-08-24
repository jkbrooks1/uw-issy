# Health Scoring Rule Audit

The current published health package marks a lane degraded when one or more configured source checks remain in `failed` state in the Lane 20 source summary.

Evidence:

- Route conditions is degraded with three failed sources out of four.
- Wildfire is degraded in the current diagnosis with one failed source.
- Government safety alerts remains current despite multiple `empty_but_valid` sources, supporting that empty results are not automatically failures.

Round 1 did not change this scoring rule.
