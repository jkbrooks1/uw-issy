# No-Fabrication Validation

Closure facts:

- Closure length uses official source distance only.
- Endpoints use official/source-supported terms only.
- Detour uses official/source-supported `detour_available: false` plus King County page confirmation.
- Closure hours are not shown because unsupported.
- Expected reopening preserves source-level precision as `End of 2026`.
- Detour geometry is not mapped because no trusted detour geometry exists.

Whole-route closure model:

- `deriveRouteClosureScope` returns only `none` or `partial`.
- Overall `Closed` is not a possible Route Status state.
- Whole-route closure/status copy is absent from built output.

COPY-048:

- Weather/air/smoke no longer renders active-reading counts.
- Public-copy manifest reports `copy048Rendered: false`.

Raw payloads:

- Public-copy manifest reports `rawPayloadSummaryCount: 0`.
