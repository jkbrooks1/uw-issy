# UW_ISSY_05_FLOOD_CONDITIONS_AUDIT_REPORT_v1

        ## 1. Files inspected and route basis

        - Project root confirmed: `/Users/jkbrookspersonal/LocalSiteBuildFiles/BTF_UW-Issy_Route_Monitor`
        - Canonical GPX confirmed readable: `/Users/jkbrookspersonal/LocalSiteBuildFiles/BTF_UW-Issy_Route_Monitor/data/route/UnivWA-Issaquah.gpx`
        - Connector directory confirmed: `/Users/jkbrookspersonal/LocalSiteBuildFiles/BTF_UW-Issy_Route_Monitor/00_CONNECTORS/05_FLOOD_CONDITIONS`
        - Instruction files read: `CLAUDE.md`, `AGENTS.md`, `00_PROJECT_RULES.md`, `00_PROJECT_STATUS.md`
        - Template directories skimmed: `00_CONNECTORS/01_ROUTE_CONDITIONS`, `00_CONNECTORS/02_WEATHER`

        ## 2. Endpoints tested

        Tested directly from this environment on Wednesday, July 29, 2026:

        - USGS site discovery and IV services
        - NOAA NWPS gauge metadata, stageflow, and ratings
        - NWS flood-alert queries
        - King County flood pages and internal river-list backend
        - City of Issaquah flood page
        - Redmond Traffic/Alerts ArcGIS REST
        - King County road-alert ArcGIS REST services
        - WSDOT Highway Alerts REST
        - Bellevue, Sammamish, Seattle/SPU, and alert-signup pages
        - Ecology flood-map viewer

        ## 3. Validation performed

        - `SOURCE_REGISTRY.json` parsed successfully as JSON.
        - `UW_ISSY_05_FLOOD_CONDITIONS_FINAL_SOURCE_REGISTRY_v1.json` parsed successfully as JSON.
        - Source ID sets match exactly between the two registry JSON files.
        - Required markdown deliverables were generated with no unresolved marker strings.
        - The four required Downloads copies could not all be created from this sandboxed environment; source files were still hashed locally and the failed copy attempts were recorded.

        ## 4. Downloads copy verification

        - `UW_ISSY_05_FLOOD_CONDITIONS_FINAL_RESEARCH_REPORT_v1.md`: copy not completed; source SHA-256 `7b93a54b2df384ee918c189978ab21c99081c077b08344c10c0225085b295234`; reason: PermissionError: [Errno 1] Operation not permitted: '/Users/jkbrookspersonal/Downloads/UW_ISSY_05_FLOOD_CONDITIONS_FINAL_RESEARCH_REPORT_v1.md'.
- `UW_ISSY_05_FLOOD_CONDITIONS_IMPLEMENTATION_RECOMMENDATION_v1.md`: copy not completed; source SHA-256 `6f1bce65cd960230fe09da2a0ef8fc316ba94a2a9532db1a08e2f30a82561f48`; reason: PermissionError: [Errno 1] Operation not permitted: '/Users/jkbrookspersonal/Downloads/UW_ISSY_05_FLOOD_CONDITIONS_IMPLEMENTATION_RECOMMENDATION_v1.md'.
- `UW_ISSY_05_FLOOD_CONDITIONS_AUDIT_REPORT_v1.md`: copy not completed; source SHA-256 `2ea6c71434347a08ce197211ed3038705a07ed53ba812e18f2cd0323f7f3ce21`; reason: PermissionError: [Errno 1] Operation not permitted: '/Users/jkbrookspersonal/Downloads/UW_ISSY_05_FLOOD_CONDITIONS_AUDIT_REPORT_v1.md'.
- `UW_ISSY_05_FLOOD_CONDITIONS_FINAL_SOURCE_REGISTRY_v1.json`: copy not completed; source SHA-256 `806154396b60c7da9e7df0cfcb344a1651167effb895aa66bc17fa7be8472122`; reason: PermissionError: [Errno 1] Operation not permitted: '/Users/jkbrookspersonal/Downloads/UW_ISSY_05_FLOOD_CONDITIONS_FINAL_SOURCE_REGISTRY_v1.json'.

        ## 5. Limitations

        1. No direct verified live Sammamish River gauge made the final runtime set.
        2. Lake Sammamish shoreline impact thresholds are not officially published.
        3. King County's internal flood backend is not a supported public contract.
        4. Bellevue, Sammamish, Seattle/SPU, and sign-up systems did not provide public machine-readable flood feeds.
        5. This sandbox could not write to `/Users/jkbrookspersonal/Downloads`, so the required final-copy step could not be completed here.

        ## 6. Honest final status

        All required local files exist, all MVP sources were tested live, and both registry JSON files validate. The audit is `PARTIAL` because the middle corridor still lacks a strong direct live river gauge and this sandbox could not complete the required `Downloads` copy step.

        PARTIAL
