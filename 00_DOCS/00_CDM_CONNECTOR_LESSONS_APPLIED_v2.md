# UW-Issaquah CDM Connector Lessons Applied (v2)

**Version note:** this is a v2, independently authored iteration of this register. A
differently-structured v1 already exists at
`00_CONNECTORS/00_CDM_CONNECTOR_LESSONS_APPLIED.md` from a separate, concurrent work
session. Per explicit project-owner instruction, this v2 does not replace or delete that
file — both currently exist. This v2 is grounded directly in a fresh, independent
read-only audit of the CDM repositories (file paths and line numbers cited per lesson),
not in the v1 file's own conclusions.

This is a **living register**, not a postmortem. CDM (both V1 and V2) is an active,
still-evolving project, not a closed case study. Every lesson below is classified as
exactly one of `VALIDATED`, `PROVISIONAL`, `OPEN`, or `REJECTED_APPROACH`. A lesson is
only `VALIDATED` when repository evidence demonstrates the actual behavior — architectural
preferences are never classified as validated lessons.

## Repositories inspected

- `/Users/jkbrookspersonal/LocalSiteBuildFiles/BTF_local_CDM_STATUS_PAGE_PROJECT` (V1,
  deployed to `cdm-status.biketourfrance.net`)
- `/Users/jkbrookspersonal/LocalSiteBuildFiles/BTF_local_CDM_STATUS_PAGE_PROJECT_V2_CONNECTOR_UI`
  (V2, deployed to `cdmstatus2.biketourfrance.net`)

Both were inspected strictly read-only. Neither was modified. Exact files opened are cited
per lesson below.

---

## Lesson register

### L01 — n8n Merge node `combine`/`combineAll` mode can silently corrupt records when branch item-counts differ

- **Classification:** VALIDATED
- **Concise lesson:** default to Merge node mode `append` for any multi-branch merge whose
  branch item-counts are not provably always equal; `combine`/`combineAll` broadcast-merges
  fields across mismatched counts rather than concatenating items.
- **Problem or observation:** three Merge nodes in the V1 Canal Status connector
  (`Merge Fetch Meta And Parsed Notices`, `Merge Normalize And Health`, `Merge Compat`)
  silently corrupted every downstream record's `recordKind` and other fields when one
  branch had 1 item and another had 14+.
- **Evidence repository:** V1
- **Evidence file:** `00_CONNECTORS/06_CANAL_STATUS/06_CANAL_STATUS_SOURCE_SHAPE_PROBE_REPORT.md`
- **Evidence location:** lines 185-192 (also corroborated in
  `06_CANAL_STATUS_CONNECTOR_LIVE_VALIDATION_NOTES.md:21`)
- **Observation date:** 2026-07-21
- **Reproducibility status:** confirmed empirically once, fix (switch to `append` mode)
  verified in the subsequent v0003 workflow; a working `combine`/`combineAll` case exists
  elsewhere in the same repo (03_AIR_QUALITY) specifically because that connector's
  branch counts are guaranteed equal — the failure is conditional on count mismatch, not
  universal to the merge mode itself.
- **Applicability to UW-Issy:** direct. Every one of the 03-07 workstreams' proposed
  architectures fetches multiple independent sources per connector and merges them before
  normalization.
- **Required action:** the shared build standard MUST require `append` mode by default for
  any merge whose branch counts cannot be structurally guaranteed equal at design time.
- **Affected connector phases:** Acquire, Normalize.
- **Confidence:** High.
- **Open follow-up:** none — this is a settled, reproduced fix pattern.

### L02 — `readWriteFile` node's `read` operation replaces `item.json` entirely, silently dropping upstream fields

- **Classification:** VALIDATED
- **Concise lesson:** never assume an upstream field (e.g. `targetPath`, `finalPath`,
  `shouldPublish`) survives a `readWriteFile` "read" operation — the node replaces
  `item.json` with its own file metadata (`fileName`, `fileSize`, etc.). Derive downstream
  labels from the node's own actual output fields, or re-attach the needed values via a
  separate branch/merge after the read.
- **Problem or observation:** this exact bug recurred independently across at least four
  V1 connectors, each time producing a label/validation failure (`Unexpected output label:
  unknown`, `stagingPath=unknown`/`finalPath=undefined`).
- **Evidence repository:** V1
- **Evidence file:** `00_BUILD_LOG.md` (root cause + fix), plus
  `00_CONNECTORS/04_WILDFIRE/04_WILDFIRE_CONNECTOR_RUN_2_ADDENDUM.md`,
  `00_CONNECTORS/05_FLOOD_CONDITIONS/05_FLOOD_CONDITIONS_CONNECTOR_RUN_2_ADDENDUM.md`,
  `00_CONNECTORS/07_GOVERNMENT_SAFETY_ALERTS/07_GOVERNMENT_SAFETY_ALERTS_CONNECTOR_RUN_2_ADDENDUM.md`
- **Evidence location:** `00_BUILD_LOG.md:774` (root cause); addenda lines 13, 20, and 55
  respectively for the three re-occurrences.
- **Observation date:** first fixed 2026-07-21; recurred in independent connectors through
  2026-07-29.
- **Reproducibility status:** reproduced independently at least four times across
  different connectors — this is a structural node-behavior fact, not a one-off.
- **Applicability to UW-Issy:** direct, if the eventual n8n implementation uses the same
  `readWriteFile` node for write/readback verification (the project's standard 9-step
  completion rule requires write/readback verification for every connector).
- **Required action:** the shared build standard's publication/readback contract MUST
  explicitly warn against depending on upstream `item.json` fields surviving a
  `readWriteFile` read, and MUST specify deriving readback identity from the node's own
  `fileName` output instead.
- **Affected connector phases:** Publish, Verify.
- **Confidence:** High.
- **Open follow-up:** none.

### L03 — `binaryDataMode: filesystem` makes `item.binary.data.data` a storage reference, not file content

- **Classification:** VALIDATED
- **Concise lesson:** never decode `item.binary.data.data` as raw base64 when the n8n
  instance runs `binaryDataMode: "filesystem"` — it is a `"filesystem-v2"` storage marker
  under that mode, not inline content. Use the mode-independent helper
  (`this.helpers.getBinaryDataBuffer(i, 'data')`) for any binary readback validation.
- **Problem or observation:** two independent connectors' `Validate Written * Files` nodes
  decoded this field directly with `Buffer.from(item.binary.data.data, 'base64')`,
  producing garbage (`Invalid JSON: Unexpected token '~'`) on every file.
- **Evidence repository:** V1
- **Evidence file:** `00_BUILD_LOG.md`
- **Evidence location:** line 773 (Air Quality, first occurrence and root-cause diagnosis);
  line 1725 (Route Conditions, independent recurrence)
- **Observation date:** 2026-07-21 and 2026-07-29 respectively.
- **Reproducibility status:** reproduced independently twice, same root cause, same fix.
- **Applicability to UW-Issy:** direct, wherever the eventual implementation writes and
  reads back binary/file content for validation, per the project's standing write/readback
  requirement.
- **Required action:** the shared build standard's execution-evidence/readback contract
  MUST specify the mode-independent binary-read helper, not raw base64 decode, whenever the
  target n8n instance's binary data mode is filesystem-based.
- **Affected connector phases:** Publish, Verify.
- **Confidence:** High.
- **Open follow-up:** confirm the actual target n8n instance's `binaryDataMode` setting
  before implementation (this project's own environment notes list
  `N8N_RESTRICT_FILE_ACCESS_TO`/`N8N_BLOCK_ENV_ACCESS_IN_NODE` but not the binary-data mode
  explicitly — see Open Decisions register).

### L04 — A workflow can be "active," import cleanly, and log successful scheduled executions while still never updating the real production output

- **Classification:** VALIDATED
- **Concise lesson:** static validation, successful n8n import, and even a run of
  successful scheduled executions do NOT prove the connector's actual assigned production
  file was updated. Completion criteria must include directly confirming the real output
  path changed, not just that the workflow "ran successfully."
- **Problem or observation:** the Air Quality connector's workflow was active with
  scheduled triggers reporting success on 2026-07-28/29, yet it was writing only to a
  staging path (`/files/cdm-status-output/airqual-cdm-stage/latest.json`) with no atomic
  promotion into the real production path (`03_air_quality.json`) — the production file
  sat stale at a 2026-07-28 04:24:25 timestamp the whole time. Verification had been done
  by polling a Cloudflare Pages preview URL, which also looked fine, masking the bug for
  an extended period.
- **Evidence repository:** V1
- **Evidence file:** `00_CONNECTORS/03_AIR_QUALITY/03_AIR_QUALITY_CONNECTOR_RUN_2_ADDENDUM.md`
- **Evidence location:** lines 9-21
- **Observation date:** discovered and fixed 2026-07-29.
- **Reproducibility status:** confirmed by direct file-timestamp inspection before and
  after the fix; single documented instance, but the underlying pattern (verify via a
  public-facing proxy rather than the actual assigned output path) is a systemic risk, not
  a one-off coincidence.
- **Applicability to UW-Issy:** this is the single most directly relevant lesson in this
  register — it is functionally identical to the project owner's own stated concern about
  workflows that pass every check yet perform a silent no-op.
- **Required action:** the shared build standard MUST require an explicit atomic
  staging → validate → promote publication stage as a first-class, separately-verified
  pipeline step (see Build Standard §D/§J), and the completion definition MUST require
  confirming the actual assigned production path's content and timestamp changed — never
  accept "workflow executions are succeeding" alone as evidence of a working connector.
- **Affected connector phases:** Publish, Verify, Record evidence.
- **Confidence:** High.
- **Open follow-up:** none — root cause and fix are both fully documented.

### L05 — Reject verifying publication success by polling a public site/preview URL instead of the connector's own assigned output path

- **Classification:** REJECTED_APPROACH
- **Concise lesson:** do not treat "the public site/preview URL looks correct" as proof a
  connector published correctly. It is a weaker, indirect signal that can mask a real
  failure (see L04) for an extended period.
- **Problem or observation:** same underlying incident as L04 — the verification method
  itself (URL polling) is the approach being rejected here, distinct from L04's specific
  bug.
- **Evidence repository:** V1
- **Evidence file:** `00_CONNECTORS/03_AIR_QUALITY/03_AIR_QUALITY_CONNECTOR_RUN_2_ADDENDUM.md`
- **Evidence location:** lines 9-11
- **Observation date:** 2026-07-29 (retrospective finding about an approach used since the
  original implementation).
- **Reproducibility status:** the failure mode this approach missed was reproduced and
  confirmed; the approach itself is being rejected prospectively, not empirically
  "disproven" in a controlled trial.
- **Applicability to UW-Issy:** direct — any future connector verification step must check
  the connector's own actual output artifact (path, content hash, timestamp), not a
  downstream consumer's rendering of it.
- **Required action:** the shared build standard's validation contract MUST explicitly
  prohibit "public URL looks fine" as a substitute for direct output-path verification.
- **Affected connector phases:** Verify, Record evidence.
- **Confidence:** High.
- **Open follow-up:** none.

### L06 — A prior claim of "last-known-good preservation verified" was later found to have never actually been tested, and was only closed by a real controlled-failure test

- **Classification:** VALIDATED
- **Concise lesson:** never accept "last-known-good preservation is verified" as true
  without an actual controlled-failure test (deliberately broken fetch against an isolated
  throwaway path, hash-compared before/after). Architecture alone does not prove behavior.
- **Problem or observation:** an earlier cycle's audit had claimed retention behavior was
  "verified" while separately admitting failure testing was never actually performed. A
  later cycle caught this and closed it with a real test: temporary workflow with a
  deliberately broken fetch node, run against an isolated throwaway path, confirmed the
  file's SHA-256 hash was unchanged before and after.
- **Evidence repository:** V1
- **Evidence file:** `00_BUILD_LOG.md`
- **Evidence location:** line 1739
- **Observation date:** 2026-07-29
- **Reproducibility status:** the corrective test itself is fully reproducible and
  documented step-by-step; the original false claim was a one-time documentation lapse now
  corrected.
- **Applicability to UW-Issy:** direct — this project's own standing rule ("Preserve
  last-known-good production data") needs the same evidentiary bar, not an architectural
  assertion.
- **Required action:** the shared build standard's completion definition MUST require an
  actual controlled-failure test as evidence before any connector may claim last-known-good
  preservation is working, and MUST reject unverified claims of "verified" behavior found
  during review.
- **Affected connector phases:** Validate, Record evidence.
- **Confidence:** High.
- **Open follow-up:** none.

### L07 — Stale-but-successful output was mislabeled `SUCCESS_WITH_WARNINGS` with `is_last_known_good` hardcoded `false`

- **Classification:** VALIDATED
- **Concise lesson:** a dedicated stale-serving state (e.g. `STALE_LAST_KNOWN_GOOD`)
  distinct from plain success is required, and the flag indicating "this is last-known-good
  data" must actually reflect reality, never be hardcoded.
- **Problem or observation:** the Flood Conditions connector's contract mislabeled stale
  runs as `SUCCESS_WITH_WARNINGS` and hardcoded `last_known_good.is_last_known_good` to
  `false` even while actively serving stale data.
- **Evidence repository:** V1
- **Evidence file:** `00_CONNECTORS/05_FLOOD_CONDITIONS/05_FLOOD_CONDITIONS_CONNECTOR_RUN_2_ADDENDUM.md`
- **Evidence location:** lines 21-33
- **Observation date:** 2026-07-29
- **Reproducibility status:** confirmed and fixed within the same connector.
- **Applicability to UW-Issy:** direct — every one of the 03-07 workstreams' proposed
  schemas includes a status/severity field that must distinguish current from stale data
  honestly.
- **Required action:** the shared envelope's `publication_state`/`overall_status`
  vocabulary MUST include an explicit stale-serving state, and any "is this last-known-good"
  flag MUST be computed from the actual data path taken, never a hardcoded constant.
- **Affected connector phases:** Publish, Normalize.
- **Confidence:** High.
- **Open follow-up:** none.

### L08 — A UI/consumer trusting a connector-supplied static freshness label (instead of computing age itself) can show badly stale data as "fresh"

- **Classification:** VALIDATED
- **Concise lesson:** a consumer (dashboard, Workflow 08, etc.) must compute freshness/age
  itself from a raw timestamp field, never trust a connector-supplied enum label like
  `"fresh"` verbatim.
- **Problem or observation:** V2's "Sources and connection status" table displayed a
  connector-supplied static `freshness` field verbatim; a source last checked over a week
  ago still displayed as "fresh." Fixed by computing freshness dynamically from
  `lastSuccessAt` with explicit thresholds (`<12h` Fresh, `12h-<24h` Recent, `24h-<7d`
  Stale, `>=7d` Outdated, missing/invalid/future timestamp Unknown).
- **Evidence repository:** V2
- **Evidence file:** `00_BUILD_LOG.md`
- **Evidence location:** lines 3152-3215; fix implemented in `app/route-display.mjs`
  (`classifySourceFreshness()`), covered by 17 new boundary tests in
  `tests/route-display.test.mjs`, all passing.
- **Observation date:** 2026-07-30
- **Reproducibility status:** confirmed via a fresh regression-test suite, not a one-off
  manual check.
- **Applicability to UW-Issy:** direct — this is a distinct failure mode from L04 (a
  display-layer trust bug, not a producer bug) and applies wherever Workflow 08 or the
  eventual site renders any connector's freshness.
- **Required action:** the shared envelope MUST expose a raw timestamp (`last_success_at`
  or equivalent), and the shared build standard MUST specify that freshness/staleness
  classification is a consumer-side computation against that raw timestamp, never a
  producer-supplied label trusted verbatim.
- **Affected connector phases:** (consumer-side, Workflow 08 / presentation, not a
  producer-phase issue).
- **Confidence:** High.
- **Open follow-up:** none — thresholds and implementation are fully documented and tested.

### L09 — Workflow naming-convention drift and three divergent name lineages for one logical connector

- **Classification:** VALIDATED
- **Concise lesson:** a documented naming convention is not self-enforcing — debug-suffix
  contamination, forbidden test-naming patterns, and entirely separate name lineages for
  the same logical connector all occurred despite an explicit written convention.
- **Problem or observation:** (a) a live-imported workflow was named with a
  `[ringer-live-check]` debug suffix; (b) a workflow named `RINGER TEST v0006 - Route
  Conditions Connector` — explicitly forbidden by project rules — was nonetheless the
  active production-candidate workflow for a period; (c) the taxonomy-name family
  (`v000N.03_AirQualityConnector`) and the actually-running-in-production workflow
  (`v0002.CDM_AirQualityTemperatureConnector`) were entirely different names for the same
  logical connector, with a third variant name found in a separate credential inventory.
- **Evidence repository:** V1
- **Evidence file:** `00_BUILD_LOG.md` (lines 613, 649, 750, 751);
  `00_DOCS/CDM_STATUS_SESSION2_WORKFLOW_BASELINE.md` (lines 28, 36);
  `00_DOCS/CDM_STATUS_WORKFLOW_RATIONALIZATION.md` (line 45);
  `00_DOCS/CDM_STATUS_CREDENTIAL_INVENTORY.md`
- **Evidence location:** see above; dates 2026-07-20/21/29.
- **Observation date:** 2026-07-20 through 2026-07-29 (recurring, not a single incident).
- **Reproducibility status:** multiple independent, corroborating instances across
  different documents and dates.
- **Applicability to UW-Issy:** direct — a written naming convention alone is
  insufficient; it needs an enforceable check.
- **Required action:** the shared build standard MUST require an automated naming-
  convention check as part of static validation, AND a separate cross-check confirming
  which workflow is actually active/scheduled in n8n matches the intended canonical name —
  never assume the correctly-named export file is the one actually running.
- **Affected connector phases:** Build, Validate, Record evidence.
- **Confidence:** High.
- **Open follow-up:** none.

### L10 — Only 3 of 7 connector categories followed the canonical numbered output-filename convention; the rest required dual-path legacy-fallback logic

- **Classification:** VALIDATED
- **Concise lesson:** decide and enforce one canonical output filename per connector from
  the very first implementation — retrofitting it later requires permanent dual-path
  fallback logic in every consumer.
- **Problem or observation:** category 04 wrote `wildfire-connector-output.json` instead
  of the canonical `04_wildfire.json`; category 07 wrote
  `government-safety-alerts-connector-output.json` instead of
  `07_government_safety_alerts.json`; `remote-build.sh` had to carry permanent
  canonical-then-legacy-filename fallback logic as a result.
- **Evidence repository:** V1
- **Evidence file:** `00_DOCS/CDM_STATUS_REMOTE_DATA_PATH_MAP.md` (lines 14-24);
  `00_DOCS/CDM_STATUS_REMOTE_BUILD_DEPLOY_RUNBOOK.md` (line 18); `00_BUILD_LOG.md`
  (line 1705)
- **Evidence location:** see above.
- **Observation date:** ongoing as of the most recent V1 entries reviewed (dated through
  2026-07-29); described as "a known Session 2 consolidation item," i.e. still unresolved
  in V1 at last inspection.
- **Reproducibility status:** directly observed in the path-mapping documentation itself,
  not inferred.
- **Applicability to UW-Issy:** direct and immediate — the connector manifest and directory
  contract (Build Standard §B/§M) must fix this decision before any of the five
  03-07 workstreams starts writing real output.
- **Required action:** the shared build standard MUST specify one canonical output
  filename pattern per connector, fixed before implementation begins, with no legacy-name
  fallback path built in from day one.
- **Affected connector phases:** Publish, all consumer phases.
- **Confidence:** High.
- **Open follow-up:** none — this is a "do it right from the start" lesson, not an
  unresolved question.

### L11 — Field-casing convention drifted (snake_case producer output vs. camelCase consumer expectations), requiring a dual-accept compatibility shim

- **Classification:** VALIDATED
- **Concise lesson:** decide one field-casing convention (camelCase or snake_case) before
  multiple independent workstreams start proposing schemas, or a permanent dual-accept
  shim becomes necessary.
- **Problem or observation:** Run 2 connector output used snake_case
  (`schema_version`, `connector_id`, `generated_at`) while the V2 adapter layer expected
  camelCase (`schemaVersion`, `connectorId`, `generatedAt`); the resolution was to accept
  both styles during migration and standardize the target contract on camelCase.
- **Evidence repository:** V1/V2 boundary
- **Evidence file:** `00_DOCS/CDM_STATUS_EIGHT_LANE_GITHUB_PIPELINE_BUILD_SPEC.md`
  (V1 document describing the V1→V2 contract); corroborated in V2's
  `scripts/connectors/lib/publication-framework.cjs` (`schemaVersion: 1`, confirming
  camelCase was the convention actually adopted going forward)
- **Evidence location:** build spec line 401; publication-framework.cjs line 15
- **Observation date:** documented as an active migration concern; V2's code confirms the
  camelCase resolution was carried through.
- **Reproducibility status:** directly observed as a real, acted-upon architectural
  decision, not a hypothetical risk.
- **Applicability to UW-Issy:** this is the exact same class of problem UW-Issy's own
  research just independently reproduced (03/05 proposed camelCase, 04/06/07 proposed
  snake_case — see `UW_ISSY_NORMALIZED_SCHEMAS_03_07.md`). CDM's own resolution went the
  opposite direction (camelCase) from this project's synthesis recommendation
  (snake_case) — this disagreement is intentionally NOT silently resolved here; see the
  Open Decisions register.
- **Required action:** the shared build standard MUST fix one casing convention before
  any of the 03-07 workstreams' connectors is implemented, explicitly informed by (but not
  necessarily bound to) CDM's own precedent.
- **Affected connector phases:** Normalize, Publish, all consumer phases.
- **Confidence:** High (on the CDM evidence itself); the cross-project casing choice
  remains genuinely open (see Open Decisions register, Decision D02).
- **Open follow-up:** UW-Issy must decide its own casing convention — see Open Decisions
  register.

### L12 — An undocumented endpoint returned an 18.3MB payload because corridor-filtering was skipped, and its own query-string filter parameters silently no-op

- **Classification:** VALIDATED
- **Concise lesson:** never assume a query-string filtering/geometry-suppression parameter
  works without directly testing the returned payload size and content — some endpoints
  silently ignore filter parameters and return the full unfiltered dataset regardless.
- **Problem or observation:** the Air Quality connector's combined output was ~18.3MB
  because corridor-to-ride-day geometry matching was skipped, emitting ~4,481 commune-level
  records instead of the ~311 corridor-filtered zones the design called for; separately,
  none of `properties=`, `propertyName=`, `fields=`, `geometry=false`, `returnGeometry=false`,
  or `exclude=geometry` had any effect on that specific endpoint's response.
- **Evidence repository:** V1
- **Evidence file:** `00_BUILD_LOG.md` (line 777);
  `00_CONNECTORS/03_AIR_QUALITY/03_AIR_QUALITY_ATMO_EPISODES_SIZE_PROBE_REPORT.md`
  (line 77); fix documented at `00_BUILD_LOG.md` lines 786-792.
- **Evidence location:** see above; dates 2026-07-21.
- **Observation date:** 2026-07-21
- **Reproducibility status:** confirmed via direct, repeated query testing with every
  candidate filter parameter tried individually.
- **Applicability to UW-Issy:** direct — several 03-07 workstreams rely on ArcGIS REST
  services (04, 05, 06) where the same class of silent-no-op filtering risk applies.
- **Required action:** the shared build standard's source-testing requirements MUST
  include verifying that any claimed server-side filter parameter actually changes the
  response (by comparing filtered vs. unfiltered payload size/content), not assuming
  documentation is accurate.
- **Affected connector phases:** Acquire.
- **Confidence:** High.
- **Open follow-up:** none.

### L13 — A short geographic/region code can mean two different things in the same API, causing silent misclassification

- **Classification:** VALIDATED
- **Concise lesson:** never assume a short code (department number, region ID, source
  abbreviation) is globally unique within a single API's response — verify the full
  compound key.
- **Problem or observation:** `code_zone=11` collided between department Aude and AASQA
  region Île-de-France in the same Atmo API; filtering on `code_zone=11` alone returned 15
  rows, 9 of them wrongly labeled with the wrong region. Fixed by adding a compound
  `aasqa` field to the filter, verified across all 7 real corridor departments with zero
  false positives afterward.
- **Evidence repository:** V1
- **Evidence file:** `00_BUILD_LOG.md`
- **Evidence location:** line 790
- **Observation date:** 2026-07-21
- **Reproducibility status:** confirmed and fixed with a verified zero-false-positive
  re-test across all real corridor departments.
- **Applicability to UW-Issy:** this is the exact same class of bug as UW-Issy's own
  already-discovered source-ID namespace collision (`KC-01`, `ISS-01` meaning different
  real sources in different workstreams — see
  `UW_ISSY_CONNECTOR_IMPLEMENTATION_MATRIX_03_07.md`). Two independent projects produced
  the same failure category, which raises confidence this is a structural risk class, not
  a one-off.
- **Required action:** the shared build standard's source-ID namespacing rule (Build
  Standard §A/§F) MUST treat every short source or event ID as workstream-scoped only,
  never globally unique, and MUST require compound keys wherever cross-workstream merging
  occurs.
- **Affected connector phases:** Normalize, Acquire.
- **Confidence:** High.
- **Open follow-up:** none.

### L14 — A cross-host test failure was initially misdiagnosed as an architecture (arm64/x86_64) issue; the real cause was an environment-variable difference

- **Classification:** VALIDATED
- **Concise lesson:** verify environment-variable parity between development and
  production hosts before attributing any cross-host behavioral difference to hardware or
  architecture — and re-test the actual candidate root cause directly rather than
  accepting the first plausible explanation.
- **Problem or observation:** a geographic test failed on the Hetzner (x86_64) host but
  passed on Mac (arm64); the real cause was that `ORS_API_KEY` existed in the Mac shell
  environment but not on Hetzner, so the two hosts queried entirely different geocoding
  services (OpenRouteService+Nominatim vs. Nominatim-only) and got different distance
  results relative to a fixed 5km threshold. Confirmed by hashing the shared route-geometry
  file identically on both hosts (ruling out data drift) and running the same code three
  times on one host (ruling out non-determinism).
- **Evidence repository:** V1
- **Evidence file:** `00_DOCS/CDM_STATUS_SESSION2_GEO_TEST_FIX.md`
- **Evidence location:** full document, dated 2026-07-29
- **Observation date:** 2026-07-29
- **Reproducibility status:** root cause directly confirmed by controlled hash-comparison
  and repeat-execution testing, not inferred.
- **Applicability to UW-Issy:** direct — this project's own 90 source tests this cycle
  were all run from local development, not the eventual production host, and 03_AIR_QUALITY
  already independently found one concrete local-vs-library TLS discrepancy (Ecology,
  `curl` exit 60 vs. Python `requests` succeeding) — the same general risk class.
- **Required action:** the shared build standard MUST require an explicit
  production-host environment-parity check (credentials, environment variables, and
  network path) before trusting any locally-tested source behavior as production-valid.
- **Affected connector phases:** Acquire, Validate.
- **Confidence:** High.
- **Open follow-up:** a companion documentation-drift risk was also observed — one
  runbook document retained the incorrect arm64/x86_64 explanation even after the correct
  root cause was found elsewhere — a caution to update all cross-referencing docs when a
  root cause is corrected, not just the primary investigation record.

### L15 — No evidence of client-side (browser-executed) merging of multiple sources in either CDM repo

- **Classification:** VALIDATED (as a documented architecture precedent, not a bug)
- **Concise lesson:** all cross-source merging in both CDM repositories happens
  server-side / build-time, never in the browser.
- **Problem or observation:** none — this is a positive precedent finding. n8n Merge
  nodes combine branches before write (V1); a Node build script with per-connector modes
  produces already-merged public JSON before it reaches the browser (V2). A direct grep of
  the V2 rendered app's source for merge logic returned no matches.
- **Evidence repository:** V1 and V2
- **Evidence file:** V1 `00_BUILD_LOG.md` (lines 635, 821); V2
  `scripts/connectors/build-v2-site-feeds-from-connectors.cjs`; V2 `app/page.tsx`
  (negative grep result)
- **Evidence location:** see above.
- **Observation date:** ongoing precedent across both repos' full history reviewed.
- **Reproducibility status:** confirmed by direct code inspection, including a negative
  search specifically for the absence of client-side merge logic.
- **Applicability to UW-Issy:** direct — this recommends the same pattern for UW-Issy's
  own cross-workstream event merging (see Hazard Ownership Matrix's joint-owned hazards).
- **Required action:** the shared build standard's event-identity/deduplication contract
  (§F) SHOULD require all merging — single-source, cross-source within a connector, and
  cross-workstream — to happen server-side/build-time, never in the browser.
- **Affected connector phases:** Normalize, and Workflow 08 assembly.
- **Confidence:** High.
- **Open follow-up:** none.

### L16 — `_routes.json` must exclude `/_next/*` or a Cloudflare Pages Worker silently 404s all script/asset requests while SSR HTML and API JSON still look correct

- **Classification:** VALIDATED
- **Concise lesson:** verifying a Cloudflare Pages deploy by checking HTTP 200 + HTML
  content + feed JSON is insufficient — actual script loading/hydration must be checked in
  a rendered browser, because the failure mode described here is invisible to every other
  check.
- **Problem or observation:** without `_routes.json` excluding `/_next/*`, every request in
  Pages advanced mode routes through `_worker.js`; the router 404s asset requests instead
  of proxying them to static assets, so no JavaScript ever loads and the page never
  hydrates — while SSR HTML and feed JSON both continue to serve fine, masking the failure
  since the very first Pages deploy until it was found.
- **Evidence repository:** V1
- **Evidence file:** `00_BUILD_LOG.md`
- **Evidence location:** lines 216-219, dated 2026-07-18
- **Observation date:** 2026-07-18 (present since the first Pages deploy, found later)
- **Reproducibility status:** root cause directly confirmed and fixed; this project's own
  memory of the CDM V1 site corroborates the same finding independently.
- **Applicability to UW-Issy:** directly relevant to Workflow 08 / website deployment
  (explicitly out of scope for the current job, but relevant for that later phase).
- **Required action:** the shared build standard's Workflow 08 handoff contract (§R)
  SHOULD note that Cloudflare Pages deploy verification must include a rendered-browser
  hydration check, not HTTP/content checks alone, whenever that phase is reached.
- **Affected connector phases:** (site-build/deploy phase, out of scope for 03-07
  connector implementation itself, but recorded for the later Workflow 08 phase).
- **Confidence:** High.
- **Open follow-up:** none for this job's scope; carry forward into the Workflow 08 job.

### L17 — Three separately-tracked validation gates (static, import, execution) should never be conflated into one PASS claim

- **Classification:** VALIDATED (positive/reusable methodology finding)
- **Concise lesson:** track static validation, n8n import status, and live execution
  status as three distinct, separately-reported gates — a PASS on one does not imply a
  PASS on another.
- **Problem or observation:** CDM connector build-log entries consistently report these
  as separate lines (e.g. "Static validation status: PASS," "n8n import status: PASS,"
  "n8n execution status: PASS on first attempt"), which is exactly what allowed the L04
  staging-only bug (static+import PASS, but real production output never updated) to be
  precisely diagnosed once it was investigated.
- **Evidence repository:** V1
- **Evidence file:** `00_BUILD_LOG.md`
- **Evidence location:** lines 828-831 (representative example); the same three-gate
  pattern recurs throughout the build log for every connector.
- **Observation date:** consistent practice throughout the reviewed history.
- **Reproducibility status:** this is a documentation/discipline pattern, directly
  observed as consistently applied, not a single reproducible technical bug.
- **Applicability to UW-Issy:** direct — this project's own standing 9-step
  workflow-completion rule already implies this separation; CDM's practice is direct
  evidence the separation is operationally necessary, not just a paperwork requirement.
- **Required action:** the shared build standard's completion definition (§Q) MUST keep
  these (and the additional UW-Issy-specific gates: publication validation, readback
  validation) as separately-tracked, separately-reportable states.
- **Affected connector phases:** Validate, Record evidence.
- **Confidence:** High.
- **Open follow-up:** none.

### L18 — Accidental credential exposure was self-disclosed in the build log with a rotation recommendation, not hidden

- **Classification:** VALIDATED (positive practice)
- **Concise lesson:** if a credential value is accidentally displayed during debugging,
  self-disclose it immediately in the build log along with a rotation recommendation.
- **Problem or observation:** a scratch-file read (needed because `rm -f` was denied by
  the harness's permission system) briefly displayed a plaintext API key in the session
  transcript; a separate debugging `echo` displayed two n8n API key values. Both incidents
  were self-disclosed in the build log rather than hidden, with a rotation recommendation
  recorded in the relevant connector's credentials file. A separate incident (V2) found a
  live Cloudflare API token for an unrelated project sitting in plaintext in a local
  settings file; the owner rotated it.
- **Evidence repository:** V1 and V2
- **Evidence file:** V1 `00_BUILD_LOG.md` (line 837); V2 `00_BUILD_LOG.md` (lines
  3137-3143)
- **Evidence location:** see above.
- **Observation date:** V1 incident undated precisely in the excerpt reviewed; V2 incident
  2026-07-30.
- **Reproducibility status:** these are disclosed incidents, not something to reproduce;
  the lesson is about disclosure discipline, which was directly observed as followed.
- **Applicability to UW-Issy:** direct — this project's own rules already require never
  printing secret values; this lesson adds the corollary of what to do if it happens
  anyway.
- **Required action:** the shared build standard's credentials section (§O) MUST require
  immediate build-log self-disclosure plus a rotation recommendation if any credential
  value is ever accidentally displayed, rather than silent correction.
- **Affected connector phases:** (cross-cutting; credentials handling).
- **Confidence:** High.
- **Open follow-up:** none.

### L19 — Per-source/per-producer failure isolation is the default pattern; cross-connector/site-level failure isolation is an explicit, owner-approved policy choice, not automatic

- **Classification:** VALIDATED
- **Concise lesson:** distinguish two different levels of failure isolation: individual
  source/producer failures are isolated by default (one bad source doesn't block others);
  whether a whole connector's degraded state should block a downstream site build/deploy
  is a separate, explicit policy decision requiring owner approval, not an automatic
  default.
- **Problem or observation:** multiple connectors document per-source or
  per-department failure isolation as the default behavior (e.g. "one department's site
  being down does not block the other five"). Separately, the eight-lane pipeline spec
  states site-level dual-deploy failure isolation ("one site may deploy when the other
  fails") requires explicit owner approval — otherwise both promotions stop when either
  fails validation.
- **Evidence repository:** V1
- **Evidence file:** `00_BUILD_LOG.md` (line 77); `00_AS-BUILT/07_GOVERNMENT_SAFETY_ALERTS/07_GOVERNMENT_SAFETY_ALERTS_AS_BUILT.md`
  (lines 293, 316); `00_CONNECTORS/05_FLOOD_CONDITIONS/05_FLOOD_CONDITIONS_SOURCE_SHAPE_PROBE_REPORT.md`
  (line 83); `00_CONNECTORS/06_CANAL_STATUS/06_CANAL_STATUS_SOURCE_SHAPE_PROBE_REPORT.md`
  (lines 139-147); `00_DOCS/CDM_STATUS_EIGHT_LANE_GITHUB_PIPELINE_BUILD_SPEC.md` (line
  712)
- **Evidence location:** see above.
- **Observation date:** consistent pattern across the reviewed history.
- **Reproducibility status:** directly observed as a consistent, deliberate architectural
  distinction, not a bug.
- **Applicability to UW-Issy:** direct — feeds Workflow 08's blocking-vs-non-blocking
  connector failure question (Build Standard §R).
- **Required action:** the shared build standard MUST keep per-source failure isolation as
  the connector-level default, and MUST require an explicit, documented owner decision
  before Workflow 08 is allowed to publish a degraded partial build (see Open Decisions
  register).
- **Affected connector phases:** Acquire (per-source isolation); Workflow 08 assembly
  (cross-connector isolation).
- **Confidence:** High.
- **Open follow-up:** the specific owner-approval mechanism for UW-Issy's own Workflow 08
  is genuinely open — see Open Decisions register, Decision D07.

### L20 — V2 proved a genuine git-push-triggers-CI-deploy pipeline works, but connector-data promotion/live-wiring was explicitly deferred out of that same pipeline

- **Classification:** OPEN
- **Concise lesson:** a working git-triggered deploy pipeline for a static UI shell does
  not, by itself, resolve how live connector data gets promoted into that same pipeline —
  CDM's own most recent evidence leaves this specific question unresolved, not just
  untested.
- **Problem or observation:** V2 stood up a real GitHub Actions pipeline (`checkout` →
  `npm ci` → `npm run build:ci` → Wrangler deploy), triggered only on push to `main` with a
  concurrency guard, and proved a real run succeeded with a live content spot-check.
  However, the same build-log entries explicitly state live connector-data promotion and
  the cross-connector merge layer were out of scope/deferred for that pipeline.
- **Evidence repository:** V2
- **Evidence file:** `00_BUILD_LOG.md`
- **Evidence location:** lines 3078-3150 (pipeline success), lines 3082-3084 and
  3144-3147 (explicit deferral of connector-data wiring)
- **Observation date:** 2026-07-30
- **Reproducibility status:** the pipeline's own success is reproducible/proven; the
  connector-data question is unaddressed by any evidence found in either repo.
- **Applicability to UW-Issy:** directly relevant to the still-open question of whether
  UW-Issy's own Workflow 08 / site deploy should be git-triggered, schedule-triggered, or
  both — CDM does not yet have a resolved precedent to copy.
- **Required action:** none yet — this is recorded as OPEN because no repository evidence
  resolves it either way. Do not assume a git-triggered pattern is suf ficient for
  connector-data freshness without a separate, explicit design decision.
- **Affected connector phases:** Workflow 08 assembly, deployment.
- **Confidence:** Medium (the pipeline evidence itself is high-confidence; the applicability
  conclusion is inherently open, hence the classification).
- **Open follow-up:** carry this question into the Open Decisions register (Decision D08)
  for explicit resolution before UW-Issy's own Workflow 08 job.

### L21 — General build-log path itself drifted between the two CDM repos' own governance files

- **Classification:** PROVISIONAL
- **Concise lesson:** even governance/rules files that are supposed to be authoritative
  can drift out of sync between related repos — cross-check them rather than trusting
  either one blindly.
- **Problem or observation:** V1's `CLAUDE.md` points at
  `/Users/jkbrookspersonal/JBLocal FilesTEMP/00_GENERAL_BUILDLOG.md` (note the space in
  "JBLocal FilesTEMP"); V2's own rules file explicitly warns not to use that path and
  instead use `/Users/jkbrookspersonal/JBLocalBuildLogs/00_GENERAL_BUILDLOG.md` — the two
  repos' canonical-rules files currently disagree.
- **Evidence repository:** V1 and V2
- **Evidence file:** V1 `CLAUDE.md`; V2 `00_PROJECT RULES.md`
- **Evidence location:** V2's "Build logs" section explicitly names the V1 path as wrong.
- **Observation date:** not independently dated in the excerpts reviewed.
- **Reproducibility status:** directly observed as a live disagreement between the two
  files at time of inspection; classified PROVISIONAL rather than VALIDATED because it is
  a single, narrow instance rather than a demonstrated recurring pattern across many files.
- **Applicability to UW-Issy:** general caution, not urgent — this project's own governance
  files (`CLAUDE.md`, `AGENTS.md`, `00_PROJECT_RULES.md`) should be spot-checked for
  similar internal disagreement periodically, per this project's own standing 10-interaction
  review order (see UW-Issy `CLAUDE.md`... note: UW-Issy's own top-level project does not
  currently have that specific 10-interaction review clause; it is a V2-only CDM practice
  worth considering, not yet adopted here).
- **Required action:** RECOMMENDED, not required: periodically cross-check this project's
  own governance files for internal path/naming disagreement.
- **Affected connector phases:** (cross-cutting; documentation discipline).
- **Confidence:** Medium.
- **Open follow-up:** none required for this job; a low-priority hygiene item.

### L22 — Wrangler deploy config can silently go stale after a build-output rename, invisible until an actual deploy attempt

- **Classification:** VALIDATED
- **Concise lesson:** treat deploy-config file paths as needing re-verification after any
  build-output directory restructuring — a stale redirect is invisible until a real deploy
  is attempted.
- **Problem or observation:** V2's `.wrangler/deploy/config.json` held a stale redirect to
  `dist/server/wrangler.json` after that file was renamed to `dist/server/wrangler.worker.json`;
  the Wrangler deploy cache was never updated after the rename, causing a deploy failure.
- **Evidence repository:** V2
- **Evidence file:** `00_BUILD_LOG.md`
- **Evidence location:** lines 1000-1013, dated 2026-07-22
- **Observation date:** 2026-07-22
- **Reproducibility status:** directly confirmed root cause and fix.
- **Applicability to UW-Issy:** relevant to the later Workflow 08 / deploy phase, out of
  scope for this job but worth carrying forward.
- **Required action:** SHOULD re-verify deploy-config paths explicitly whenever build
  output structure changes, when that phase is reached.
- **Affected connector phases:** (site-build/deploy phase, out of scope for 03-07
  connector implementation).
- **Confidence:** High.
- **Open follow-up:** none for this job; carry forward into the Workflow 08 job.

---

## Current register state

22 lessons: 18 `VALIDATED`, 1 `REJECTED_APPROACH`, 1 `OPEN`, 1 `PROVISIONAL` (L21 is the
only PROVISIONAL; L20 is the only OPEN; L05 is the only REJECTED_APPROACH; the remaining
19 are VALIDATED). No lesson in this register is classified `VALIDATED` on the strength of
architectural reasoning alone — every VALIDATED entry cites a specific file, location, and
(where available) date demonstrating the actual behavior.

## How to maintain this register

- Append new lessons; do not renumber or delete existing ones (append-only, matching this
  project's build-log discipline).
- Re-classify a lesson only when new repository evidence changes its status (e.g. an OPEN
  lesson becomes VALIDATED once a controlled test resolves it) — cite the new evidence
  when re-classifying, do not silently change a classification.
- Do not add a lesson based on a recommendation or architectural preference alone; it must
  cite repository evidence per the required fields above.
- This v2 and the pre-existing v1 (`00_CONNECTORS/00_CDM_CONNECTOR_LESSONS_APPLIED.md`)
  currently coexist. Reconciling them into one authoritative register is itself an open
  item for the project owner, not resolved by this document.
