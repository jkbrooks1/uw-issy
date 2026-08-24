# Taxonomy and Visibility Mapping

Route Status:

- RS-A drives the top Route Status state from route-impacting events and explicit closure fields.
- RS-B supports route facts through title, location, source-provided event context, geometry, and reported/effective dates.
- RS-C remains contextual through route name, facility labels, and static facility context.

System Status:

- SS-H renders only in the bottom `System health` section.
- SS-O is not rendered in public UI.
- SS-A is not rendered in public UI.

Implementation notes:

- `overallMessage` is now `null` in `dashboard-data.json` to avoid system-run prose in primary Route Status.
- `sourceState` and lane health remain data contract fields, but public UI maps them only to approved System Health vocabulary.
- Release IDs, hashes, run IDs, workflow state, validation paths, dedupe keys, and artifact paths are not rendered in public UI.
