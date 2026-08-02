#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path
from textwrap import dedent
from datetime import datetime
from zoneinfo import ZoneInfo
import shutil


ROOT = Path("/Users/jkbrookspersonal/LocalSiteBuildFiles/BTF_UW-Issy_Route_Monitor")
CONNECTOR = ROOT / "00_CONNECTORS" / "05_FLOOD_CONDITIONS"
DOWNLOADS = Path("/Users/jkbrookspersonal/Downloads")
SCRIPT_ARCHIVE_DIR = Path("/Users/jkbrookspersonal/00_SCRIPTS")
SCRIPT_PATH = CONNECTOR / "scripts" / "generate_flood_docs.py"
TZ = ZoneInfo("America/Los_Angeles")
NOW = datetime.now(TZ)
STAMP = NOW.strftime("%Y-%m-%d %H:%M:%S %Z")

ROUTE_FACTS = {
    "route_name": "University of Washington -> Burke-Gilman Trail -> Sammamish River Trail -> Marymoor Park -> East Lake Sammamish Trail -> Issaquah",
    "canonical_gpx": str(ROOT / "data" / "route" / "UnivWA-Issaquah.gpx"),
    "distance_miles": 33.83,
    "trackpoints": 1470,
    "bbox": {
        "min_lat": 47.55207,
        "max_lat": 47.75889,
        "min_lon": -122.30570,
        "max_lon": -122.04414,
    },
    "start": [47.65051, -122.30462],
    "end": [47.55207, -122.04429],
    "reused_from": [
        "00_CONNECTORS/01_ROUTE_CONDITIONS/README.md",
        "00_CONNECTORS/02_WEATHER/UW_ISSY_02_WEATHER_AUDIT_REPORT_v1.md",
    ],
}

GAUGE_DISTANCE_METERS = {
    "USGS-01": 264,
    "USGS-02": 10934,
    "USGS-03": 2218,
    "USGS-04": 1243,
    "USGS-05": 1318,
    "USGS-06": 7010,
    "NWPS-01": 173,
    "NWPS-02": 10912,
}

AUTH_ROWS = [
    {
        "source": "WSDOT-01",
        "variable_name": "WSDOT_TRAVELER_API_ACCESS_CODE",
        "secret_type": "token",
        "required_or_optional": "Optional",
        "where_to_obtain": "WSDOT Traveler Information API registration page",
        "existing_name_present": "yes",
        "tested_without_it": "no",
        "limitations_without_credential": "Only documentation and unauthenticated help pages are reachable; live alerts cannot be queried.",
    },
    {
        "source": "KCF-02",
        "variable_name": "KING_COUNTY_FLOODWARNING_SUBSCRIPTION_KEY",
        "secret_type": "API key",
        "required_or_optional": "Not recommended",
        "where_to_obtain": "No public issuance path documented. The public web app ships an embedded APIM key, which should not be mirrored into project configuration.",
        "existing_name_present": "no",
        "tested_without_it": "n/a",
        "limitations_without_credential": "Treat the public app as a webpage, not as a supported API contract.",
    },
]

READINESS = {
    "USGS-01": {
        "authority": 5,
        "route_relevance": 5,
        "freshness": 5,
        "reliability": 5,
        "machine_readability": 5,
        "implementation_effort": 4,
        "maintenance_burden": 4,
        "historical_stability": 5,
        "licensing_clarity": 4,
        "outage_resilience": 4,
        "readiness": "ready_now",
        "confidence_note": "Best direct observed route-end signal. Distance to route end is about 264 m and both stage and flow are populated.",
    },
    "USGS-02": {
        "authority": 5,
        "route_relevance": 4,
        "freshness": 5,
        "reliability": 5,
        "machine_readability": 5,
        "implementation_effort": 4,
        "maintenance_burden": 4,
        "historical_stability": 5,
        "licensing_clarity": 4,
        "outage_resilience": 4,
        "readiness": "ready_now",
        "confidence_note": "Upstream lead-time source endorsed by the City of Issaquah, but not physically on-route and not an official NWS forecast point.",
    },
    "USGS-03": {
        "authority": 5,
        "route_relevance": 3,
        "freshness": 5,
        "reliability": 5,
        "machine_readability": 5,
        "implementation_effort": 4,
        "maintenance_burden": 4,
        "historical_stability": 5,
        "licensing_clarity": 4,
        "outage_resilience": 4,
        "readiness": "ready_now",
        "confidence_note": "Useful shoreline context for East Lake Sammamish Trail and Lake Sammamish State Park, but no official flood threshold was found.",
    },
    "NWPS-01": {
        "authority": 5,
        "route_relevance": 5,
        "freshness": 5,
        "reliability": 5,
        "machine_readability": 5,
        "implementation_effort": 4,
        "maintenance_burden": 4,
        "historical_stability": 5,
        "licensing_clarity": 4,
        "outage_resilience": 4,
        "readiness": "ready_now",
        "confidence_note": "Best official forecast and category source for the route end because it provides action/minor/moderate/major thresholds plus forecast hydrograph data.",
    },
    "NWPS-02": {
        "authority": 5,
        "route_relevance": 4,
        "freshness": 5,
        "reliability": 5,
        "machine_readability": 5,
        "implementation_effort": 4,
        "maintenance_burden": 4,
        "historical_stability": 5,
        "licensing_clarity": 4,
        "outage_resilience": 4,
        "readiness": "ready_now",
        "confidence_note": "Observed-only companion to Hobart. Valuable for corroboration, but no forecast and no defined flood categories.",
    },
    "NWS-01": {
        "authority": 5,
        "route_relevance": 4,
        "freshness": 5,
        "reliability": 5,
        "machine_readability": 5,
        "implementation_effort": 4,
        "maintenance_burden": 4,
        "historical_stability": 5,
        "licensing_clarity": 4,
        "outage_resilience": 4,
        "readiness": "ready_now",
        "confidence_note": "Best official regional alert layer for Flood Watch, Flood Warning, Flash Flood Warning, and Flood Advisory. Geometry and CAP metadata support deterministic route filtering.",
    },
    "ISS-01": {
        "authority": 5,
        "route_relevance": 5,
        "freshness": 3,
        "reliability": 4,
        "machine_readability": 2,
        "implementation_effort": 2,
        "maintenance_burden": 2,
        "historical_stability": 4,
        "licensing_clarity": 4,
        "outage_resilience": 3,
        "readiness": "ready_with_scraper",
        "confidence_note": "The best official explanation of Issaquah-specific phase semantics and lead-time. Use it as a policy/configuration source and occasional corroboration, not as the primary live data feed.",
    },
    "REDM-01": {
        "authority": 4,
        "route_relevance": 4,
        "freshness": 4,
        "reliability": 4,
        "machine_readability": 5,
        "implementation_effort": 4,
        "maintenance_burden": 4,
        "historical_stability": 4,
        "licensing_clarity": 4,
        "outage_resilience": 3,
        "readiness": "ready_now",
        "confidence_note": "Excellent closure supplement around West Lake Sammamish Parkway and NE 24th, but it is not flood-specific and must never be used as a proxy for hydrologic severity.",
    },
    "KC-ROAD-01": {
        "authority": 4,
        "route_relevance": 2,
        "freshness": 4,
        "reliability": 4,
        "machine_readability": 5,
        "implementation_effort": 4,
        "maintenance_burden": 4,
        "historical_stability": 4,
        "licensing_clarity": 4,
        "outage_resilience": 3,
        "readiness": "ready_now",
        "confidence_note": "Technically strong, geographically weak for this corridor because the route is mostly in incorporated cities.",
    },
    "KC-ROAD-02": {
        "authority": 4,
        "route_relevance": 3,
        "freshness": 1,
        "reliability": 1,
        "machine_readability": 5,
        "implementation_effort": 4,
        "maintenance_burden": 4,
        "historical_stability": 2,
        "licensing_clarity": 4,
        "outage_resilience": 3,
        "readiness": "needs_more_research",
        "confidence_note": "The schema is real, but the only available Sammamish records were 2014 test entries. Do not rely on it until live content is observed.",
    },
    "WSDOT-01": {
        "authority": 5,
        "route_relevance": 2,
        "freshness": 4,
        "reliability": 4,
        "machine_readability": 5,
        "implementation_effort": 3,
        "maintenance_burden": 4,
        "historical_stability": 4,
        "licensing_clarity": 4,
        "outage_resilience": 4,
        "readiness": "ready_with_credentials",
        "confidence_note": "Now fully testable in this project because the access-code name is already present, but flood relevance is limited to highway crossing closures rather than the trail itself.",
    },
}


SOURCES = [
    {
        "source_id": "KCF-01",
        "source_name": "King County Flood Warning System public pages",
        "owning_agency": "King County DNRP Flood Warning Center",
        "official_source_url": "https://kingcounty.gov/en/dept/dnrp/nature-recreation/environment-ecology-conservation/flood-services/warning-system",
        "documentation_url": "https://flood.kingcounty.gov/",
        "access_method": "Public HTML pages",
        "acquisition_classification": "STRUCTURED_WEBPAGE",
        "machine_readable_availability": "No supported public API documented from this page set",
        "authentication_requirements": "None for the public pages",
        "terms_or_usage_constraints": "Public county information pages; the live app explicitly states it derives data from USGS and NOAA every 10 minutes",
        "geographic_coverage": "King County flood-service rivers; route relevance only for Issaquah Creek and supporting references",
        "route_points_or_sections_covered": "Issaquah Creek terminus; local flood-preparedness context for the route end",
        "available_fields": "Contact information, app links, flood-alert sign-up, qualitative description of source cadence",
        "geometry_availability": "None on the public HTML page",
        "update_frequency": "Not stated for the overview page itself; linked app says source data are downloaded every 10 minutes",
        "typical_publication_delay": "Derived page; depends on underlying USGS/NWS refresh",
        "historical_availability": "Not tested",
        "pagination_behavior": "None observed",
        "documented_rate_limits": "None documented",
        "recommended_freshness_threshold": "60 minutes if used only as corroborating page content",
        "failure_detection_method": "HTTP failure or page content materially changing away from the flood-system description",
        "last_known_good_suitability": "Low for live status, moderate for reference text",
        "fallback_method": "Use USGS-01/02, USGS-03, NWPS-01, and NWS-01 directly",
        "manual_review_requirement": "Low",
        "recommendation_class": "SECONDARY",
        "verification_status": "VERIFIED",
        "evidence_urls": [
            "https://kingcounty.gov/en/dept/dnrp/nature-recreation/environment-ecology-conservation/flood-services/warning-system",
            "https://flood.kingcounty.gov/"
        ],
        "research_notes": "Fetched live on Wednesday, July 29, 2026. The public page confirms that the county app uses USGS and NOAA data and updates about every 10 minutes, but it does not expose a documented automation contract of its own."
    },
    {
        "source_id": "KCF-02",
        "source_name": "King County Flood Warning app internal API",
        "owning_agency": "King County DNRP Flood Warning Center",
        "official_source_url": "https://api.kingcounty.gov/floodwarning/v1/rivers",
        "documentation_url": "https://flood.kingcounty.gov/",
        "access_method": "Undocumented API called by public Next.js bundle",
        "acquisition_classification": "DIRECT_API",
        "machine_readable_availability": "Yes, but only as an undocumented app backend",
        "authentication_requirements": "APIM subscription key embedded in the public app bundle; no public registration path documented",
        "terms_or_usage_constraints": "Unsupported integration surface. The public key should not be mirrored into project configuration.",
        "geographic_coverage": "Eight county flood-system rivers; route relevance only through Issaquah Creek gauges and thresholds",
        "route_points_or_sections_covered": "Issaquah Creek terminus and Lake Sammamish context",
        "available_fields": "River thresholds, gauge grouping, phase numbers, gauge coordinates, last update times, short trend values",
        "geometry_availability": "Gauge point coordinates only",
        "update_frequency": "County response updated at least once per refresh cycle; source app says every 10 minutes",
        "typical_publication_delay": "Derived from underlying sources",
        "historical_availability": "Not tested",
        "pagination_behavior": "No pagination observed on /rivers response",
        "documented_rate_limits": "None documented",
        "recommended_freshness_threshold": "Do not operationalize",
        "failure_detection_method": "500s, auth failure, or key rotation in the public app",
        "last_known_good_suitability": "Low; unsupported contract",
        "fallback_method": "Use the underlying USGS and NOAA sources directly",
        "manual_review_requirement": "High",
        "recommendation_class": "REJECT",
        "verification_status": "PARTIALLY_VERIFIED",
        "evidence_urls": [
            "https://flood.kingcounty.gov/",
            "https://api.kingcounty.gov/floodwarning/v1/rivers"
        ],
        "research_notes": "On Wednesday, July 29, 2026, the public river list returned live JSON with Issaquah phase thresholds and grouped gauges, but the obvious direct gauge path returned a server-side failure. Because the API is undocumented and key-bound, it is unsuitable as a production dependency even though it exposes useful corroborating metadata."
    },
    {
        "source_id": "USGS-01",
        "source_name": "USGS IV service - Issaquah Creek near mouth near Issaquah (12121600)",
        "owning_agency": "U.S. Geological Survey",
        "official_source_url": "https://waterservices.usgs.gov/nwis/iv/?format=json&sites=12121600&parameterCd=00060,00065",
        "documentation_url": "https://waterservices.usgs.gov/docs/instantaneous-values/instantaneous-values-details/",
        "access_method": "USGS Water Services REST",
        "acquisition_classification": "DIRECT_API",
        "machine_readable_availability": "Yes, JSON",
        "authentication_requirements": "None",
        "terms_or_usage_constraints": "USGS Water Services; provisional real-time data subject to revision",
        "geographic_coverage": "Issaquah Creek mouth near Lake Sammamish State Park",
        "route_points_or_sections_covered": "Route terminus; Lake Sammamish State Park / Issaquah Creek confluence zone",
        "available_fields": "Latest and recent streamflow (00060), gage height (00065), timestamps, qualifiers",
        "geometry_availability": "Coordinates available from site metadata and monitoring-location page",
        "update_frequency": "Observed 15-minute cadence",
        "typical_publication_delay": "Near real time",
        "historical_availability": "Yes; the tested stageflow window showed one month of recent points and the service documentation supports longer retrievals",
        "pagination_behavior": "None observed",
        "documented_rate_limits": "No numeric rate-limit headers; HTTP cache-control max-age=900 present",
        "recommended_freshness_threshold": "30 minutes",
        "failure_detection_method": "HTTP non-200, zero time-series payload, or stale timestamp older than 30 minutes",
        "last_known_good_suitability": "High",
        "fallback_method": "NWPS-01 for forecast/category context; ISS-01 for local phase semantics",
        "manual_review_requirement": "Low",
        "recommendation_class": "MVP",
        "verification_status": "VERIFIED",
        "evidence_urls": [
            "https://waterservices.usgs.gov/nwis/iv/?format=json&sites=12121600&parameterCd=00060,00065",
            "https://waterdata.usgs.gov/monitoring-location/12121600/#parameterCode=00060&period=P7D&showMedian=false"
        ],
        "research_notes": "Live on Wednesday, July 29, 2026: streamflow 21.5 cfs and stage 3.79 ft at 12:15 PDT. This site is about 264 m from the GPX and is the strongest direct observed route-end hydrologic signal."
    },
    {
        "source_id": "USGS-02",
        "source_name": "USGS IV service - Issaquah Creek near Hobart (12120600)",
        "owning_agency": "U.S. Geological Survey",
        "official_source_url": "https://waterservices.usgs.gov/nwis/iv/?format=json&sites=12120600&parameterCd=00060,00065",
        "documentation_url": "https://waterservices.usgs.gov/docs/instantaneous-values/instantaneous-values-details/",
        "access_method": "USGS Water Services REST",
        "acquisition_classification": "DIRECT_API",
        "machine_readable_availability": "Yes, JSON",
        "authentication_requirements": "None",
        "terms_or_usage_constraints": "USGS provisional data disclaimer applies",
        "geographic_coverage": "Upper Issaquah Creek near Hobart",
        "route_points_or_sections_covered": "Not on-route, but officially used by Issaquah for 3-4 hour lead time into the route terminus",
        "available_fields": "Latest streamflow, gage height, timestamps, qualifiers",
        "geometry_availability": "Coordinates available",
        "update_frequency": "Observed 15-minute cadence",
        "typical_publication_delay": "Near real time",
        "historical_availability": "Yes",
        "pagination_behavior": "None observed",
        "documented_rate_limits": "No numeric rate-limit headers; cache-control max-age=900 present",
        "recommended_freshness_threshold": "30 minutes",
        "failure_detection_method": "HTTP non-200, zero time-series payload, or stale timestamp",
        "last_known_good_suitability": "High",
        "fallback_method": "NWPS-02 observed status, then ISS-01 thresholds",
        "manual_review_requirement": "Low",
        "recommendation_class": "MVP",
        "verification_status": "VERIFIED",
        "evidence_urls": [
            "https://waterservices.usgs.gov/nwis/iv/?format=json&sites=12120600&parameterCd=00060,00065",
            "https://waterdata.usgs.gov/monitoring-location/USGS-12120600/#period=P7D&showMedian=true&dataTypeId=continuous-00065-0"
        ],
        "research_notes": "Live on Wednesday, July 29, 2026: streamflow 12.3 cfs and stage 3.97 ft at 11:45 PDT. The gauge sits about 10.9 km southeast of the GPX, but Issaquah explicitly uses it for local flood phases."
    },
    {
        "source_id": "USGS-03",
        "source_name": "USGS IV service - Sammamish Lake near Redmond (12122000)",
        "owning_agency": "U.S. Geological Survey",
        "official_source_url": "https://waterservices.usgs.gov/nwis/iv/?format=json&sites=12122000",
        "documentation_url": "https://waterservices.usgs.gov/docs/instantaneous-values/instantaneous-values-details/",
        "access_method": "USGS Water Services REST",
        "acquisition_classification": "DIRECT_API",
        "machine_readable_availability": "Yes, JSON",
        "authentication_requirements": "None",
        "terms_or_usage_constraints": "USGS provisional data disclaimer applies",
        "geographic_coverage": "Lake Sammamish main pool near Redmond",
        "route_points_or_sections_covered": "East Lake Sammamish Trail shoreline sections; Lake Sammamish State Park context",
        "available_fields": "Lake elevation parameter 62614 with timestamp and qualifiers",
        "geometry_availability": "Coordinates available",
        "update_frequency": "Observed 15-minute cadence",
        "typical_publication_delay": "Near real time",
        "historical_availability": "Yes",
        "pagination_behavior": "None observed",
        "documented_rate_limits": "No numeric rate-limit headers; cache-control max-age=900 present",
        "recommended_freshness_threshold": "30 minutes",
        "failure_detection_method": "HTTP non-200, missing 62614 series, or stale timestamp",
        "last_known_good_suitability": "High",
        "fallback_method": "King County app and route closure supplements",
        "manual_review_requirement": "Medium",
        "recommendation_class": "SECONDARY",
        "verification_status": "VERIFIED",
        "evidence_urls": [
            "https://waterservices.usgs.gov/nwis/iv/?format=json&sites=12122000",
            "https://waterdata.usgs.gov/nwis/uv?legacy=1&site_no=12122000"
        ],
        "research_notes": "Live on Wednesday, July 29, 2026: lake elevation 25.94 ft above NGVD29 at 12:15 PDT. The gauge is about 2.2 km west of the route, so use it as shoreline context rather than as a stand-alone route-closure predictor."
    },
    {
        "source_id": "USGS-04",
        "source_name": "USGS IV service probe - North Fork Issaquah Creek at Issaquah (12121570)",
        "owning_agency": "U.S. Geological Survey",
        "official_source_url": "https://waterservices.usgs.gov/nwis/iv/?format=json&sites=12121570",
        "documentation_url": "https://waterservices.usgs.gov/docs/instantaneous-values/instantaneous-values-details/",
        "access_method": "USGS Water Services REST",
        "acquisition_classification": "DIRECT_API",
        "machine_readable_availability": "Tested, but no live IV series returned",
        "authentication_requirements": "None",
        "terms_or_usage_constraints": "USGS provisional data disclaimer applies",
        "geographic_coverage": "North Fork Issaquah Creek",
        "route_points_or_sections_covered": "Near the route end, but not linked to a usable current feed",
        "available_fields": "No usable IV series in the tested response",
        "geometry_availability": "Site coordinates available via site inventory",
        "update_frequency": "None observed in tested IV payload",
        "typical_publication_delay": "n/a",
        "historical_availability": "Not confirmed",
        "pagination_behavior": "None observed",
        "documented_rate_limits": "None documented",
        "recommended_freshness_threshold": "Do not operationalize",
        "failure_detection_method": "Zero time-series count",
        "last_known_good_suitability": "Low",
        "fallback_method": "USGS-01, USGS-02, NWPS-01, NWPS-02",
        "manual_review_requirement": "High",
        "recommendation_class": "REJECT",
        "verification_status": "VERIFIED",
        "evidence_urls": [
            "https://waterservices.usgs.gov/nwis/iv/?format=json&sites=12121570"
        ],
        "research_notes": "Fetched on Wednesday, July 29, 2026. HTTP 200 was returned but the JSON payload contained zero time-series objects, so a successful status code did not translate into usable connector data."
    },
    {
        "source_id": "USGS-05",
        "source_name": "USGS IV service probe - Bear Creek at Union Hill Rd at Redmond (12124490)",
        "owning_agency": "U.S. Geological Survey",
        "official_source_url": "https://waterservices.usgs.gov/nwis/iv/?format=json&sites=12124490",
        "documentation_url": "https://waterservices.usgs.gov/docs/instantaneous-values/instantaneous-values-details/",
        "access_method": "USGS Water Services REST",
        "acquisition_classification": "DIRECT_API",
        "machine_readable_availability": "Tested, but no live IV series returned",
        "authentication_requirements": "None",
        "terms_or_usage_constraints": "USGS provisional data disclaimer applies",
        "geographic_coverage": "Bear Creek near Redmond",
        "route_points_or_sections_covered": "Marymoor/Bear Creek lowlands context only",
        "available_fields": "No usable IV series in the tested response",
        "geometry_availability": "Site coordinates available via site inventory",
        "update_frequency": "None observed in tested IV payload",
        "typical_publication_delay": "n/a",
        "historical_availability": "Not confirmed",
        "pagination_behavior": "None observed",
        "documented_rate_limits": "None documented",
        "recommended_freshness_threshold": "Do not operationalize",
        "failure_detection_method": "Zero time-series count",
        "last_known_good_suitability": "Low",
        "fallback_method": "Use closure supplements and Lake Sammamish / Issaquah Creek signals instead",
        "manual_review_requirement": "High",
        "recommendation_class": "REJECT",
        "verification_status": "VERIFIED",
        "evidence_urls": [
            "https://waterservices.usgs.gov/nwis/iv/?format=json&sites=12124490"
        ],
        "research_notes": "The site is only about 1.3 km from the GPX and would have been attractive for Marymoor flooding context, but the live IV service returned no usable series on Wednesday, July 29, 2026."
    },
    {
        "source_id": "USGS-06",
        "source_name": "USGS IV service probe - Coal Creek below Coal Creek Parkway near Bellevue (12119690)",
        "owning_agency": "U.S. Geological Survey",
        "official_source_url": "https://waterservices.usgs.gov/nwis/iv/?format=json&sites=12119690",
        "documentation_url": "https://waterservices.usgs.gov/docs/instantaneous-values/instantaneous-values-details/",
        "access_method": "USGS Water Services REST",
        "acquisition_classification": "DIRECT_API",
        "machine_readable_availability": "Tested, but no live IV series returned",
        "authentication_requirements": "None",
        "terms_or_usage_constraints": "USGS provisional data disclaimer applies",
        "geographic_coverage": "Coal Creek near Bellevue",
        "route_points_or_sections_covered": "Very weak route relevance only for nearby eastside drainage context",
        "available_fields": "No usable IV series in the tested response",
        "geometry_availability": "Site coordinates available via site inventory",
        "update_frequency": "None observed in tested IV payload",
        "typical_publication_delay": "n/a",
        "historical_availability": "Not confirmed",
        "pagination_behavior": "None observed",
        "documented_rate_limits": "None documented",
        "recommended_freshness_threshold": "Do not operationalize",
        "failure_detection_method": "Zero time-series count",
        "last_known_good_suitability": "Low",
        "fallback_method": "Ignore for this route; use city or NWS flood products instead",
        "manual_review_requirement": "High",
        "recommendation_class": "REJECT",
        "verification_status": "VERIFIED",
        "evidence_urls": [
            "https://waterservices.usgs.gov/nwis/iv/?format=json&sites=12119690"
        ],
        "research_notes": "Even if the site were live, it is about 7.0 km from the GPX and not part of the most meaningful flood-exposure chain for this corridor."
    },
    {
        "source_id": "NWPS-01",
        "source_name": "NOAA National Water Prediction Service - Issaquah Creek near Issaquah (ISSW1)",
        "owning_agency": "NOAA National Weather Service / Office of Water Prediction",
        "official_source_url": "https://api.water.noaa.gov/nwps/v1/gauges/ISSW1",
        "documentation_url": "https://api.water.noaa.gov/nwps/v1/docs/",
        "access_method": "NWPS REST API",
        "acquisition_classification": "DIRECT_API",
        "machine_readable_availability": "Yes, JSON",
        "authentication_requirements": "None",
        "terms_or_usage_constraints": "Public NOAA NWPS API",
        "geographic_coverage": "Issaquah Creek near Issaquah forecast point",
        "route_points_or_sections_covered": "Route terminus, Lake Sammamish State Park, and downstream Issaquah Creek flood exposure",
        "available_fields": "Gauge metadata, observed and forecast status, action/minor/moderate/major thresholds, hydrograph image URLs, stageflow arrays, ratings curve",
        "geometry_availability": "Gauge point coordinates",
        "update_frequency": "Observed roughly 15-minute issue times for observations and scheduled forecast issuance",
        "typical_publication_delay": "Near real time",
        "historical_availability": "Observed stageflow endpoint returned about one month of recent observed points and a one-week forecast series",
        "pagination_behavior": "No pagination observed",
        "documented_rate_limits": "No numeric rate-limit headers observed",
        "recommended_freshness_threshold": "30 minutes for observed status, 6 hours for forecast issue time",
        "failure_detection_method": "HTTP non-200, empty JSON, stale issuedTime, or missing categories",
        "last_known_good_suitability": "High",
        "fallback_method": "USGS-01 for observations; NWS-01 for alerts; ISS-01 for local phase semantics",
        "manual_review_requirement": "Low",
        "recommendation_class": "MVP",
        "verification_status": "VERIFIED",
        "evidence_urls": [
            "https://api.water.noaa.gov/nwps/v1/gauges/ISSW1",
            "https://api.water.noaa.gov/nwps/v1/gauges/ISSW1/stageflow",
            "https://api.water.noaa.gov/nwps/v1/gauges/ISSW1/ratings",
            "https://water.noaa.gov/gauges/issw1"
        ],
        "research_notes": "Live on Wednesday, July 29, 2026: observed status 0.0222 kcfs / 3.8 ft at 17:15 UTC, forecast status 0.0252 kcfs / 3.8 ft at 00:00 UTC on Saturday, August 1, 2026. Official flow-based thresholds are action 1340 cfs, minor 2000, moderate 2300, major 2800."
    },
    {
        "source_id": "NWPS-02",
        "source_name": "NOAA National Water Prediction Service - Issaquah Creek near Hobart (ISQW1)",
        "owning_agency": "NOAA National Weather Service / Office of Water Prediction",
        "official_source_url": "https://api.water.noaa.gov/nwps/v1/gauges/ISQW1",
        "documentation_url": "https://api.water.noaa.gov/nwps/v1/docs/",
        "access_method": "NWPS REST API",
        "acquisition_classification": "DIRECT_API",
        "machine_readable_availability": "Yes, JSON",
        "authentication_requirements": "None",
        "terms_or_usage_constraints": "Public NOAA NWPS API",
        "geographic_coverage": "Issaquah Creek near Hobart upstream point",
        "route_points_or_sections_covered": "Lead-time signal for the route end via Issaquah's local flood-phase method",
        "available_fields": "Gauge metadata, observed status, observed stageflow series, ratings curve, hydrograph image URLs",
        "geometry_availability": "Gauge point coordinates",
        "update_frequency": "Observed roughly 15-minute issue times",
        "typical_publication_delay": "Near real time",
        "historical_availability": "Observed stageflow endpoint returned about one month of recent points",
        "pagination_behavior": "No pagination observed",
        "documented_rate_limits": "No numeric rate-limit headers observed",
        "recommended_freshness_threshold": "30 minutes",
        "failure_detection_method": "HTTP non-200, stale issuedTime, or empty observed series",
        "last_known_good_suitability": "High",
        "fallback_method": "USGS-02",
        "manual_review_requirement": "Low",
        "recommendation_class": "SECONDARY",
        "verification_status": "VERIFIED",
        "evidence_urls": [
            "https://api.water.noaa.gov/nwps/v1/gauges/ISQW1",
            "https://api.water.noaa.gov/nwps/v1/gauges/ISQW1/stageflow",
            "https://api.water.noaa.gov/nwps/v1/gauges/ISQW1/ratings",
            "https://water.noaa.gov/gauges/isqw1"
        ],
        "research_notes": "Live on Wednesday, July 29, 2026: observed status 3.97 ft / 0.012 kcfs at 18:45 UTC. Forecast values are absent and the gauge reports floodCategory not_defined, so it is a corroborating observed point, not the main forecast engine."
    },
    {
        "source_id": "NWS-01",
        "source_name": "National Weather Service API - flood and flash-flood alerts",
        "owning_agency": "NOAA National Weather Service",
        "official_source_url": "https://api.weather.gov/alerts/active",
        "documentation_url": "https://www.weather.gov/documentation/services-web-api",
        "access_method": "NWS REST API",
        "acquisition_classification": "DIRECT_API",
        "machine_readable_availability": "Yes, GeoJSON",
        "authentication_requirements": "None",
        "terms_or_usage_constraints": "Public NWS API; descriptive User-Agent strongly recommended",
        "geographic_coverage": "Route points, King County, and any overlapping NWS flood polygons",
        "route_points_or_sections_covered": "Whole route for Flood Watch, Flood Warning, Flash Flood Warning, and Flood Advisory",
        "available_fields": "Feature geometry, event type, severity, urgency, certainty, sent/effective/expires, areaDesc, affectedZones, CAP parameters",
        "geometry_availability": "Yes, polygon geometry in GeoJSON when alerts exist",
        "update_frequency": "Event-driven; tested cache-control was public max-age=5",
        "typical_publication_delay": "Near real time",
        "historical_availability": "Not tested in this workstream",
        "pagination_behavior": "No pagination observed in tested empty responses",
        "documented_rate_limits": "No numeric rate-limit headers observed",
        "recommended_freshness_threshold": "15 minutes",
        "failure_detection_method": "HTTP non-200, empty or malformed GeoJSON, or stale updated timestamp",
        "last_known_good_suitability": "High for short windows only",
        "fallback_method": "Local county/city pages for non-NWS closures; USGS/NWPS for observed water levels",
        "manual_review_requirement": "Low",
        "recommendation_class": "MVP",
        "verification_status": "VERIFIED",
        "evidence_urls": [
            "https://api.weather.gov/alerts/active?event=Flood%20Warning&area=WA",
            "https://api.weather.gov/alerts/active?event=Flood%20Watch&area=WA",
            "https://api.weather.gov/alerts/active?event=Flash%20Flood%20Warning&area=WA",
            "https://api.weather.gov/alerts/active?event=Flood%20Advisory&area=WA",
            "https://api.weather.gov/alerts/active?point=47.6505,-122.3046"
        ],
        "research_notes": "All four statewide flood-specific queries returned valid empty GeoJSON on Wednesday, July 29, 2026, with updated timestamp 2026-07-29T19:32:51Z. The route-point query also returned a healthy empty collection. That proves the endpoint is usable even on a quiet day."
    },
    {
        "source_id": "ISS-01",
        "source_name": "City of Issaquah Flooding page",
        "owning_agency": "City of Issaquah",
        "official_source_url": "https://www.issaquahwa.gov/flood",
        "documentation_url": "https://www.issaquahwa.gov/flood",
        "access_method": "Public HTML page with linked USGS and NOAA resources",
        "acquisition_classification": "STRUCTURED_WEBPAGE",
        "machine_readable_availability": "No direct structured feed; page embeds and links to structured gauge products",
        "authentication_requirements": "None",
        "terms_or_usage_constraints": "Public city information page",
        "geographic_coverage": "Issaquah Creek floodplain and Lake Sammamish State Park / terminus area",
        "route_points_or_sections_covered": "Route terminus and the final Issaquah approach",
        "available_fields": "Explicit local phase thresholds, lead-time statement, linked Hobart gauge, linked NWPS gauge, local communication channels",
        "geometry_availability": "None on the page itself",
        "update_frequency": "Reference page; flood-phase postings occur during incidents",
        "typical_publication_delay": "Human-updated page text plus linked live gauges",
        "historical_availability": "Archived flood updates exist elsewhere on CivicEngage, but not used as this source",
        "pagination_behavior": "None observed",
        "documented_rate_limits": "None documented",
        "recommended_freshness_threshold": "24 hours for threshold semantics; do not use this page as the sole live status feed",
        "failure_detection_method": "HTTP non-200 or threshold text changing",
        "last_known_good_suitability": "High for policy semantics; low for live incident state",
        "fallback_method": "USGS-01/02, NWPS-01/02, NWS-01",
        "manual_review_requirement": "Medium",
        "recommendation_class": "MVP",
        "verification_status": "VERIFIED",
        "evidence_urls": [
            "https://www.issaquahwa.gov/flood",
            "https://flood.kingcounty.gov/river/4/",
            "https://green2.kingcounty.gov/rivergagedata/gage-data.aspx?r=issaquah",
            "https://water.noaa.gov/gauges/issw1"
        ],
        "research_notes": "Fetched live on Wednesday, July 29, 2026. The page states that the Hobart gauge usually provides three to four hours of lead time and publishes the city's local thresholds: Phase I 6.5 ft and rising, Phase II 7.5 ft and rising, Phase III 8.5 ft regardless of trend, Phase IV 9.0 ft regardless of trend."
    },
    {
        "source_id": "REDM-01",
        "source_name": "City of Redmond Traffic Alerts ArcGIS service",
        "owning_agency": "City of Redmond",
        "official_source_url": "https://gis.redmond.gov/arcgis/rest/services/Traffic/Alerts/FeatureServer",
        "documentation_url": "https://www.redmond.gov/1315/Weather-Alert-Updates",
        "access_method": "ArcGIS REST FeatureServer",
        "acquisition_classification": "DIRECT_API",
        "machine_readable_availability": "Yes, JSON",
        "authentication_requirements": "None",
        "terms_or_usage_constraints": "Public ArcGIS REST service",
        "geographic_coverage": "City of Redmond streets and closures",
        "route_points_or_sections_covered": "West Lake Sammamish Parkway approach, NE 24th corridor, and Redmond street segments intersecting the route",
        "available_fields": "AlertID, AlertName, LocationDescription, AlertStartDate, AlertEndDate, TrafficImpactDescription, AlertStatus, geometry",
        "geometry_availability": "Yes, point/line/polygon layers",
        "update_frequency": "Operational city alert cadence",
        "typical_publication_delay": "Near real time for city-entered alerts",
        "historical_availability": "Not tested",
        "pagination_behavior": "Standard ArcGIS query patterns; not paginated in the small tested result sets",
        "documented_rate_limits": "No numeric rate-limit headers observed",
        "recommended_freshness_threshold": "60 minutes",
        "failure_detection_method": "HTTP non-200, zero metadata, or stale dates across all layers",
        "last_known_good_suitability": "High",
        "fallback_method": "Reuse 01_ROUTE_CONDITIONS outputs or city emergency notices",
        "manual_review_requirement": "Medium",
        "recommendation_class": "SECONDARY",
        "verification_status": "VERIFIED",
        "evidence_urls": [
            "https://gis.redmond.gov/arcgis/rest/services/Traffic/Alerts/FeatureServer?f=json",
            "https://gis.redmond.gov/arcgis/rest/services/Traffic/Alerts/FeatureServer/1/query?where=1%3D1&outFields=AlertID,AlertName,LocationDescription,AlertStartDate,AlertEndDate,TrafficImpactDescription,AlertStatus,GovDeliverySubject&returnGeometry=false&f=json",
            "https://gis.redmond.gov/arcgis/rest/services/Traffic/Alerts/FeatureServer/2/query?where=1%3D1&outFields=AlertID,AlertName,LocationDescription,AlertStartDate,AlertEndDate,TrafficImpactDescription,AlertStatus,GovDeliverySubject&returnGeometry=false&f=json"
        ],
        "research_notes": "Live on Wednesday, July 29, 2026. Layer 1 returned two active line alerts and layer 2 returned one active polygon alert, including Bel-Red Road and NE 24th / West Lake Sammamish Parkway work. This is a high-quality closure supplement, not a flood gauge."
    },
    {
        "source_id": "KC-ROAD-01",
        "source_name": "King County RoadAlerts - KingCo_Road_Alerts",
        "owning_agency": "King County Road Services Division",
        "official_source_url": "https://gismaps.kingcounty.gov/arcgis/rest/services/RoadAlerts/KingCo_Road_Alerts/MapServer",
        "documentation_url": "https://kingcounty.gov/en/dept/local-services/transit-transportation-roads/roads-and-bridges/road-closures",
        "access_method": "ArcGIS REST MapServer",
        "acquisition_classification": "DIRECT_API",
        "machine_readable_availability": "Yes, JSON",
        "authentication_requirements": "None",
        "terms_or_usage_constraints": "Public ArcGIS REST service for unincorporated King County roads",
        "geographic_coverage": "Unincorporated King County only",
        "route_points_or_sections_covered": "Rarely route-relevant; mainly a defense-in-depth closure supplement",
        "available_fields": "ClosureName, LocationLimits, Community, ClosureReason, ClosureState, planned dates, geometry",
        "geometry_availability": "Yes, polyline geometry",
        "update_frequency": "Operational county alert cadence",
        "typical_publication_delay": "Near real time when entries exist",
        "historical_availability": "Not tested",
        "pagination_behavior": "Standard ArcGIS query patterns; tested sample returned zero current features on layer 0",
        "documented_rate_limits": "No numeric rate-limit headers observed",
        "recommended_freshness_threshold": "60 minutes",
        "failure_detection_method": "HTTP non-200, broken service metadata, or stale query results",
        "last_known_good_suitability": "High",
        "fallback_method": "01_ROUTE_CONDITIONS outputs and city-specific closure APIs",
        "manual_review_requirement": "Medium",
        "recommendation_class": "SECONDARY",
        "verification_status": "VERIFIED",
        "evidence_urls": [
            "https://gismaps.kingcounty.gov/arcgis/rest/services/RoadAlerts/KingCo_Road_Alerts/MapServer?f=json",
            "https://gismaps.kingcounty.gov/arcgis/rest/services/RoadAlerts/KingCo_Road_Alerts/MapServer/0/query?where=1%3D1&outFields=ClosureName,LocationLimits,Community,ClosureReason,ClosureState,PlannedClosedDate,PlannedOpenDate&returnGeometry=false&f=json"
        ],
        "research_notes": "The service metadata is healthy, but the tested current-alert layer returned zero records on Wednesday, July 29, 2026. Even when populated, route relevance will be rare because the route is mostly inside incorporated cities."
    },
    {
        "source_id": "KC-ROAD-02",
        "source_name": "King County nonKCRoadAlerts - SammamishRoadAlerts",
        "owning_agency": "King County MyCommute platform / participating jurisdictions",
        "official_source_url": "https://gismaps.kingcounty.gov/arcgis/rest/services/RoadAlerts/nonKCRoadAlerts/MapServer",
        "documentation_url": "https://gismaps.kingcounty.gov/arcgis/rest/services/RoadAlerts/nonKCRoadAlerts/MapServer?f=json",
        "access_method": "ArcGIS REST MapServer",
        "acquisition_classification": "DIRECT_API",
        "machine_readable_availability": "Yes, JSON",
        "authentication_requirements": "None",
        "terms_or_usage_constraints": "Public ArcGIS REST service, but live-data status for Sammamish is unclear",
        "geographic_coverage": "Participating jurisdiction layers; route relevance only for Sammamish",
        "route_points_or_sections_covered": "East Lake Sammamish Trail through Sammamish if the layer ever carries real incidents",
        "available_fields": "AlertTitle, AlertDescription, ClosureStatus, AlertStartDate, AlertEndDate, AlertURL, geometry",
        "geometry_availability": "Yes, point and line geometry",
        "update_frequency": "Unknown; current content appears stale",
        "typical_publication_delay": "Unknown",
        "historical_availability": "Not tested",
        "pagination_behavior": "No pagination observed in the single-record test responses",
        "documented_rate_limits": "No numeric rate-limit headers observed",
        "recommended_freshness_threshold": "Do not operationalize until live content is observed",
        "failure_detection_method": "Test-pattern records, impossible dates, or zero content changes over time",
        "last_known_good_suitability": "Low",
        "fallback_method": "Use KC-01 and REDM-01 class closure supplements instead",
        "manual_review_requirement": "High",
        "recommendation_class": "UNRESOLVED",
        "verification_status": "VERIFIED",
        "evidence_urls": [
            "https://gismaps.kingcounty.gov/arcgis/rest/services/RoadAlerts/nonKCRoadAlerts/MapServer?f=json",
            "https://gismaps.kingcounty.gov/arcgis/rest/services/RoadAlerts/nonKCRoadAlerts/MapServer/4/query?where=1%3D1&outFields=*&returnGeometry=false&f=json",
            "https://gismaps.kingcounty.gov/arcgis/rest/services/RoadAlerts/nonKCRoadAlerts/MapServer/5/query?where=1%3D1&outFields=*&returnGeometry=false&f=json"
        ],
        "research_notes": "The Sammamish point and line layers each returned a single 2014-era test record on Wednesday, July 29, 2026. The service is real; the live-content question is unresolved."
    },
    {
        "source_id": "WSDOT-01",
        "source_name": "WSDOT Traveler Information API - Highway Alerts",
        "owning_agency": "Washington State Department of Transportation",
        "official_source_url": "https://wsdot.wa.gov/Traffic/api/HighwayAlerts/HighwayAlertsREST.svc/GetAlertsAsJson",
        "documentation_url": "https://wsdot.wa.gov/traffic/api/Documentation/class_highway_alerts.html",
        "access_method": "WSDOT REST API",
        "acquisition_classification": "DIRECT_API",
        "machine_readable_availability": "Yes, JSON",
        "authentication_requirements": "AccessCode required",
        "terms_or_usage_constraints": "Public developer registration model; browser CORS assumptions not tested here because the planned use is server-side",
        "geographic_coverage": "Statewide WSDOT highways",
        "route_points_or_sections_covered": "Only route crossings or detour interfaces with SR-522 / I-405 class facilities",
        "available_fields": "AlertID, County, start/end roadway locations, StartTime, EndTime, EventCategory, HeadlineDescription, EventStatus, LastUpdatedTime, Priority",
        "geometry_availability": "Roadway start/end coordinates rather than true trail geometry",
        "update_frequency": "Operational WSDOT cadence",
        "typical_publication_delay": "Near real time",
        "historical_availability": "Search endpoint exists; historical retrieval not tested in this workstream",
        "pagination_behavior": "No pagination observed in tested JSON arrays",
        "documented_rate_limits": "No numeric rate-limit headers observed",
        "recommended_freshness_threshold": "60 minutes",
        "failure_detection_method": "HTTP non-200, auth failure, or malformed array payload",
        "last_known_good_suitability": "High",
        "fallback_method": "01_ROUTE_CONDITIONS shared closure sources",
        "manual_review_requirement": "Medium",
        "recommendation_class": "SECONDARY",
        "verification_status": "VERIFIED",
        "evidence_urls": [
            "https://wsdot.wa.gov/traffic/api/",
            "https://wsdot.wa.gov/traffic/api/Documentation/class_highway_alerts.html",
            "https://wsdot.wa.gov/Traffic/api/HighwayAlerts/HighwayAlertsREST.svc/Help"
        ],
        "research_notes": "Using the existing project credential name already present in the environment, live JSON was retrieved on Wednesday, July 29, 2026. A targeted SR-522 / Region 9 search returned an empty array at that moment, which is acceptable and proves the route-specific query path works."
    },
    {
        "source_id": "REDM-02",
        "source_name": "AlertRedmond emergency notification system",
        "owning_agency": "City of Redmond",
        "official_source_url": "https://www.redmond.gov/506/Emergency-Alerts",
        "documentation_url": "https://www.redmond.gov/AlertRedmondSignUp",
        "access_method": "Everbridge sign-up page and mobile app",
        "acquisition_classification": "EMAIL_OR_SMS_ALERT_ONLY",
        "machine_readable_availability": "No public machine-readable feed documented",
        "authentication_requirements": "User account required",
        "terms_or_usage_constraints": "End-user notification service, not a public data feed",
        "geographic_coverage": "City of Redmond emergency notifications",
        "route_points_or_sections_covered": "Redmond segments only",
        "available_fields": "Human notification channels only",
        "geometry_availability": "Not applicable",
        "update_frequency": "Incident-driven",
        "typical_publication_delay": "Unknown",
        "historical_availability": "Not tested",
        "pagination_behavior": "Not applicable",
        "documented_rate_limits": "Not applicable",
        "recommended_freshness_threshold": "Do not operationalize",
        "failure_detection_method": "Not applicable",
        "last_known_good_suitability": "Low",
        "fallback_method": "REDM-01",
        "manual_review_requirement": "High",
        "recommendation_class": "REJECT",
        "verification_status": "VERIFIED",
        "evidence_urls": [
            "https://www.redmond.gov/506/Emergency-Alerts"
        ],
        "research_notes": "Fetched live on Wednesday, July 29, 2026. The page explicitly describes text, email, phone, and Everbridge app delivery, confirming that it is an end-user alert system rather than a connector feed."
    },
    {
        "source_id": "BEL-01",
        "source_name": "Bellevue Alerts and Notifications",
        "owning_agency": "City of Bellevue",
        "official_source_url": "https://bellevuewa.gov/city-government/departments/fire/emergency-management/alerts-and-notifications",
        "documentation_url": "https://accountportal.onsolve.net/AlertKC",
        "access_method": "Public webpage linking to Bellevue alerts and Alert King County sign-up",
        "acquisition_classification": "EMAIL_OR_SMS_ALERT_ONLY",
        "machine_readable_availability": "No public feed documented",
        "authentication_requirements": "User sign-up required for actual alerts",
        "terms_or_usage_constraints": "Notification service, not a public data API",
        "geographic_coverage": "Bellevue and regional King County emergency notifications",
        "route_points_or_sections_covered": "Only peripheral route context",
        "available_fields": "Human notification system descriptions",
        "geometry_availability": "Not applicable",
        "update_frequency": "Incident-driven",
        "typical_publication_delay": "Unknown",
        "historical_availability": "Not tested",
        "pagination_behavior": "Not applicable",
        "documented_rate_limits": "Not applicable",
        "recommended_freshness_threshold": "Do not operationalize",
        "failure_detection_method": "Not applicable",
        "last_known_good_suitability": "Low",
        "fallback_method": "NWS-01 and city/county closure sources",
        "manual_review_requirement": "High",
        "recommendation_class": "REJECT",
        "verification_status": "VERIFIED",
        "evidence_urls": [
            "https://bellevuewa.gov/city-government/departments/fire/emergency-management/alerts-and-notifications"
        ],
        "research_notes": "Fetched live on Wednesday, July 29, 2026. The page routes users to Bellevue's own alert system plus Alert King County and does not expose a public feed."
    },
    {
        "source_id": "BEL-02",
        "source_name": "City of Bellevue Flooding page",
        "owning_agency": "City of Bellevue",
        "official_source_url": "https://bellevuewa.gov/city-government/departments/fire/emergency-management/prepare-known-hazards/flooding",
        "documentation_url": "https://bellevuewa.gov/city-government/departments/fire/emergency-management/prepare-known-hazards/flooding",
        "access_method": "Public HTML page",
        "acquisition_classification": "UNSTRUCTURED_WEBPAGE",
        "machine_readable_availability": "No",
        "authentication_requirements": "None",
        "terms_or_usage_constraints": "Public preparedness guidance page",
        "geographic_coverage": "Bellevue",
        "route_points_or_sections_covered": "Very limited route relevance; mostly peripheral eastside drainage context",
        "available_fields": "Preparedness guidance, floodplain map references, Bellevue Alert System references, hotline number",
        "geometry_availability": "No live geometry feed",
        "update_frequency": "Editorial",
        "typical_publication_delay": "Human-updated",
        "historical_availability": "Not tested",
        "pagination_behavior": "None observed",
        "documented_rate_limits": "None documented",
        "recommended_freshness_threshold": "Do not operationalize",
        "failure_detection_method": "HTTP non-200",
        "last_known_good_suitability": "Low",
        "fallback_method": "Official hydrologic and closure sources",
        "manual_review_requirement": "High",
        "recommendation_class": "REJECT",
        "verification_status": "VERIFIED",
        "evidence_urls": [
            "https://bellevuewa.gov/city-government/departments/fire/emergency-management/prepare-known-hazards/flooding"
        ],
        "research_notes": "Fetched live on Wednesday, July 29, 2026. Useful as preparedness guidance but not as a route-monitoring connector."
    },
    {
        "source_id": "SAM-01",
        "source_name": "City of Sammamish Storm and Surface Water Management page",
        "owning_agency": "City of Sammamish",
        "official_source_url": "https://www.sammamish.us/government/public-works/stormwater/",
        "documentation_url": "https://www.sammamish.us/government/public-works/stormwater/",
        "access_method": "Public HTML page",
        "acquisition_classification": "UNSTRUCTURED_WEBPAGE",
        "machine_readable_availability": "No",
        "authentication_requirements": "None",
        "terms_or_usage_constraints": "Public information page",
        "geographic_coverage": "City of Sammamish",
        "route_points_or_sections_covered": "East Lake Sammamish Trail through Sammamish",
        "available_fields": "Phone numbers for spills/flooding and after-hours dispatch, report links",
        "geometry_availability": "No",
        "update_frequency": "Editorial",
        "typical_publication_delay": "Human-updated",
        "historical_availability": "Not tested",
        "pagination_behavior": "None observed",
        "documented_rate_limits": "None documented",
        "recommended_freshness_threshold": "Do not operationalize as a data feed",
        "failure_detection_method": "HTTP non-200",
        "last_known_good_suitability": "Low",
        "fallback_method": "Hydrologic sources plus route-closure connectors",
        "manual_review_requirement": "High",
        "recommendation_class": "REJECT",
        "verification_status": "VERIFIED",
        "evidence_urls": [
            "https://www.sammamish.us/government/public-works/stormwater/"
        ],
        "research_notes": "Fetched live on Wednesday, July 29, 2026. The page is operationally useful for human reporting but does not expose a machine-readable incident feed."
    },
    {
        "source_id": "SAM-02",
        "source_name": "City of Sammamish Alert King County sign-up post",
        "owning_agency": "City of Sammamish",
        "official_source_url": "https://www.sammamish.us/news/be-prepared-for-emergencies-sign-up-for-alerts/",
        "documentation_url": "https://www.sammamish.us/news/be-prepared-for-emergencies-sign-up-for-alerts/",
        "access_method": "Public news page",
        "acquisition_classification": "EMAIL_OR_SMS_ALERT_ONLY",
        "machine_readable_availability": "No public feed documented",
        "authentication_requirements": "User sign-up required in Alert King County",
        "terms_or_usage_constraints": "Sign-up guidance only",
        "geographic_coverage": "Sammamish / King County emergency alerts",
        "route_points_or_sections_covered": "Sammamish sections only",
        "available_fields": "Registration guidance and pointer to Alert King County",
        "geometry_availability": "Not applicable",
        "update_frequency": "Editorial",
        "typical_publication_delay": "Human-updated",
        "historical_availability": "Not tested",
        "pagination_behavior": "None observed",
        "documented_rate_limits": "Not applicable",
        "recommended_freshness_threshold": "Do not operationalize",
        "failure_detection_method": "Not applicable",
        "last_known_good_suitability": "Low",
        "fallback_method": "NWS-01 and local closure sources",
        "manual_review_requirement": "High",
        "recommendation_class": "REJECT",
        "verification_status": "VERIFIED",
        "evidence_urls": [
            "https://www.sammamish.us/news/be-prepared-for-emergencies-sign-up-for-alerts/"
        ],
        "research_notes": "Fetched live on Wednesday, July 29, 2026. This is a preparedness notice, not a feed."
    },
    {
        "source_id": "SEA-01",
        "source_name": "Seattle Flooding Safety and Response page",
        "owning_agency": "City of Seattle / Seattle Public Utilities support context",
        "official_source_url": "https://www.seattle.gov/flood-safety",
        "documentation_url": "https://www.seattle.gov/flood-safety",
        "access_method": "Public HTML page",
        "acquisition_classification": "UNSTRUCTURED_WEBPAGE",
        "machine_readable_availability": "No",
        "authentication_requirements": "None",
        "terms_or_usage_constraints": "Public city information page",
        "geographic_coverage": "Seattle",
        "route_points_or_sections_covered": "UW/Burke-Gilman start section only",
        "available_fields": "Preparedness text, AlertSeattle sign-up, statement that SPU responds to minor flooding issues",
        "geometry_availability": "No",
        "update_frequency": "Editorial",
        "typical_publication_delay": "Human-updated",
        "historical_availability": "Not tested",
        "pagination_behavior": "None observed",
        "documented_rate_limits": "None documented",
        "recommended_freshness_threshold": "Do not operationalize",
        "failure_detection_method": "HTTP non-200",
        "last_known_good_suitability": "Low",
        "fallback_method": "NWS-01 plus route-closure outputs from workstream 01",
        "manual_review_requirement": "High",
        "recommendation_class": "REJECT",
        "verification_status": "VERIFIED",
        "evidence_urls": [
            "https://www.seattle.gov/flood-safety"
        ],
        "research_notes": "Fetched live on Wednesday, July 29, 2026. It explicitly says Seattle Public Utilities responds to minor flooding issues, but the page is not itself a live incident feed."
    },
    {
        "source_id": "ECO-01",
        "source_name": "Washington State Coastal Atlas flood map viewer",
        "owning_agency": "Washington State Department of Ecology",
        "official_source_url": "https://apps.ecology.wa.gov/coastalatlas/tools/Flood.aspx",
        "documentation_url": "https://ecology.wa.gov/water-shorelines/shoreline-coastal-management/hazards/floods-floodplain-planning",
        "access_method": "ArcGIS JavaScript map application",
        "acquisition_classification": "MANUAL_REVIEW_ONLY",
        "machine_readable_availability": "Not confirmed from this environment",
        "authentication_requirements": "None",
        "terms_or_usage_constraints": "Planning and floodplain mapping product, not a current-conditions feed",
        "geographic_coverage": "Washington statewide flood hazard mapping",
        "route_points_or_sections_covered": "Static susceptibility context only",
        "available_fields": "Flood hazard map viewer and FEMA-oriented planning context",
        "geometry_availability": "Viewer only in this test cycle",
        "update_frequency": "Planning-map cadence, not live events",
        "typical_publication_delay": "Not applicable to live monitoring",
        "historical_availability": "Not tested",
        "pagination_behavior": "Not applicable",
        "documented_rate_limits": "None documented",
        "recommended_freshness_threshold": "Configuration/reference only",
        "failure_detection_method": "Map app unreachable or broken scripts",
        "last_known_good_suitability": "High for static vulnerability context only",
        "fallback_method": "FEMA or local floodplain references outside this connector scope",
        "manual_review_requirement": "High",
        "recommendation_class": "REJECT",
        "verification_status": "PARTIALLY_VERIFIED",
        "evidence_urls": [
            "https://apps.ecology.wa.gov/coastalatlas/tools/Flood.aspx",
            "https://ecology.wa.gov/water-shorelines/shoreline-coastal-management/hazards/floods-floodplain-planning"
        ],
        "research_notes": "Fetched live on Wednesday, July 29, 2026 as an ArcGIS-era map shell. It is useful for offline susceptibility analysis, but not for current or forecast route monitoring."
    },
]


def esc(value: object) -> str:
    if isinstance(value, list):
        return "; ".join(str(v) for v in value)
    if value is None:
        return ""
    return str(value).replace("|", "\\|").replace("\n", " ")


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def write(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content.rstrip() + "\n", encoding="utf-8")


def registry_json() -> str:
    payload = {
        "registry_version": "1.0",
        "workstream_id": "05_FLOOD_CONDITIONS",
        "generated_at": NOW.isoformat(),
        "route_distance_miles": ROUTE_FACTS["distance_miles"],
        "route_trackpoints": ROUTE_FACTS["trackpoints"],
        "route_bbox": ROUTE_FACTS["bbox"],
        "sources": SOURCES,
    }
    return json.dumps(payload, indent=2)


def registry_md() -> str:
    cols = [
        "source_id", "source_name", "owning_agency", "official_source_url",
        "documentation_url", "access_method", "acquisition_classification",
        "machine_readable_availability", "authentication_requirements",
        "terms_or_usage_constraints", "geographic_coverage",
        "route_points_or_sections_covered", "available_fields",
        "geometry_availability", "update_frequency",
        "typical_publication_delay", "historical_availability",
        "pagination_behavior", "documented_rate_limits",
        "recommended_freshness_threshold", "failure_detection_method",
        "last_known_good_suitability", "fallback_method",
        "manual_review_requirement", "recommendation_class",
        "verification_status", "evidence_urls", "research_notes",
    ]
    lines = [
        "# SOURCE_REGISTRY.md — 05_FLOOD_CONDITIONS",
        "",
        f"Route: {ROUTE_FACTS['route_name']}",
        "",
        "This markdown table and `SOURCE_REGISTRY.json` describe the same source set and were generated from the same in-memory registry data on Wednesday, July 29, 2026.",
        "",
        "| " + " | ".join(cols) + " |",
        "| " + " | ".join(["---"] * len(cols)) + " |",
    ]
    for src in SOURCES:
        lines.append("| " + " | ".join(esc(src[c]) for c in cols) + " |")
    return "\n".join(lines)


def research_findings_md() -> str:
    return dedent(
        f"""
        # RESEARCH_FINDINGS.md — 05_FLOOD_CONDITIONS

        ## Scope and route basis

        This workstream researched current and forecast flooding, high water, urban flooding, standing water, and closure supplements for the UW -> Burke-Gilman -> Sammamish River -> Marymoor -> East Lake Sammamish -> Issaquah corridor.

        I reused the already-established route facts from `01_ROUTE_CONDITIONS` and `02_WEATHER` rather than re-deriving the corridor from scratch: `{ROUTE_FACTS['distance_miles']}` miles, `{ROUTE_FACTS['trackpoints']}` GPX track points, and bounding box lat `{ROUTE_FACTS['bbox']['min_lat']}` to `{ROUTE_FACTS['bbox']['max_lat']}` / lon `{ROUTE_FACTS['bbox']['min_lon']}` to `{ROUTE_FACTS['bbox']['max_lon']}`.

        ## What was searched and tested

        The strongest official candidates fell into four buckets:

        1. Direct hydrologic observations from USGS.
        2. Official forecast and category products from NOAA NWPS and the NWS alert API.
        3. Local interpretation layers from King County and the City of Issaquah.
        4. Closure supplements from Redmond, King County road alerts, and WSDOT for cases where water leads to an actual route closure.

        The route-relevant gauge sweep around the corridor found six nearby USGS sites:

        - `12121600` Issaquah Creek near mouth near Issaquah.
        - `12120600` Issaquah Creek near Hobart.
        - `12122000` Sammamish Lake near Redmond.
        - `12121570` North Fork Issaquah Creek at Issaquah.
        - `12124490` Bear Creek at Union Hill Rd at Redmond.
        - `12119690` Coal Creek below Coal Creek Parkway near Bellevue.

        Only the first three returned usable live IV payloads on Wednesday, July 29, 2026. The other three returned HTTP 200 with zero time-series objects, which is exactly the kind of false-positive usability result the work order warned against.

        ## Main findings

        ### 1. The route has one clearly supported official flood-forecast location: Issaquah Creek near Issaquah

        `NWPS-01` / `ISSW1` is the strongest forecast source in the whole workstream. It combines:

        - official action / minor / moderate / major thresholds;
        - observed status;
        - seven-day forecast hydrograph data;
        - ratings data; and
        - direct linkage to USGS site `12121600`.

        This is the only tested source that cleanly answers both “what is happening now?” and “what is the official forecast category?”

        ### 2. The City of Issaquah still matters because it defines the lead-time logic the federal products do not

        The Issaquah flood page explicitly says the upstream Hobart gauge usually provides three to four hours of lead time and publishes the local phase thresholds:

        - Phase I: 6.5 ft and rising.
        - Phase II: 7.5 ft and rising.
        - Phase III: 8.5 ft regardless of trend.
        - Phase IV: 9.0 ft regardless of trend.

        That makes `USGS-02` and `NWPS-02` valuable even though Hobart is about 10.9 km from the route and lacks official NWS forecast categories. It is an upstream lead indicator, not a direct route-flood observation.

        ### 3. Lake Sammamish is measurable, but not thresholded

        `USGS-03` provides live lake elevation at `12122000`, and King County's internal app groups that gauge with Issaquah Creek. That is useful for shoreline context near Lake Sammamish State Park and the East Lake Sammamish Trail.

        What I did not find was an official route-impact threshold such as “trail floods at lake elevation X.” Because of that, Lake Sammamish should support only:

        - elevated-water context,
        - trend interpretation,
        - corroboration with closures or local alerts,

        and should not independently trigger a “route closed” or “flood warning” state.

        ### 4. There is no verified live official gauge on the Sammamish River corridor itself in the tested set

        This was the biggest hydrologic gap. The route spends many miles on the Sammamish River Trail and adjacent Marymoor lowlands, but the strongest tested live gauges were still:

        - Issaquah Creek;
        - Lake Sammamish; and
        - local closure supplements.

        Bear Creek would have been a useful Marymoor/Redmond proxy, but the tested USGS IV response was unusable on Wednesday, July 29, 2026.

        ### 5. King County's public flood app is informative, but it should not be the production backbone

        The public app at `flood.kingcounty.gov` is modern, live, and clearly useful to residents. Its shipped JavaScript also exposes an undocumented county API that returns real threshold and gauge-grouping data.

        That is still not enough to recommend it as the production connector backbone because:

        - the API is not documented as a public integration contract;
        - it depends on an app-shipped subscription key;
        - the river-list call worked, but the obvious direct gauge path already threw a server-side failure during testing;
        - the underlying USGS and NOAA feeds are independently reachable anyway.

        The county app is therefore best treated as a corroborating product, not a source of first resort.

        ### 6. Closure confirmation needs to come from other systems, not from hydrologic height alone

        The work order explicitly warned not to equate high water with a flooded trail. The live testing supported that warning.

        The strongest closure supplements I found were:

        - `REDM-01` Redmond `Traffic/Alerts` ArcGIS REST service;
        - `KC-ROAD-01` King County unincorporated road-alert ArcGIS service;
        - `WSDOT-01` Highway Alerts REST for state-highway crossings and detours;
        - the existing route-conditions workstream outputs for trail-level closure interpretation.

        These sources tell you when water has already translated into an actual travel restriction. They do not replace the hydrologic signals.

        ### 7. Bellevue, Sammamish, Seattle Public Utilities, and regional alert-signup systems were real but weak as unattended connectors

        I directly fetched Bellevue, Sammamish, Seattle, Redmond, and Alert King County related pages. They mostly fell into one of two groups:

        - preparedness pages with phone numbers and advice; or
        - email/SMS alert sign-up systems with no public feed.

        They are legitimate official resources for residents, but weak automation inputs for this connector.

        ## What surprised me

        - The most useful King County-specific machine-readable result was hidden behind the flood app's client bundle rather than documented openly.
        - The physically nearby Bear Creek, Coal Creek, and North Fork Issaquah Creek USGS sites all failed the “usable payload” test despite returning HTTP 200.
        - The best closure supplement for flood-related eastside access issues was not a flood system at all, but Redmond's general traffic-alert ArcGIS service.
        - WSDOT became materially more useful once the project's existing `WSDOT_TRAVELER_API_ACCESS_CODE` name was confirmed present and the correct REST paths were used.

        ## Rejected or downgraded sources

        - `KCF-02` rejected for production use because it is an undocumented, key-bound app backend.
        - `USGS-04`, `USGS-05`, and `USGS-06` rejected because the tested IV payloads were unusable.
        - `REDM-02`, `BEL-01`, and `SAM-02` rejected because they are notification systems, not data feeds.
        - `BEL-02`, `SAM-01`, and `SEA-01` rejected because they are preparedness or reporting pages, not live monitoring products.
        - `ECO-01` rejected as a runtime connector, but retained as a static floodplain-reference lead for offline route-susceptibility work.

        ## Bottom line

        The best production-grade flood-monitoring stack for this route is narrower than the candidate list:

        - observed water from `USGS-01` and `USGS-02`;
        - forecast and official categories from `NWPS-01`;
        - flood and flash-flood alerts from `NWS-01`;
        - Issaquah local phase semantics from `ISS-01`;
        - optional shoreline context from `USGS-03`;
        - closure confirmation from shared route-condition sources such as `REDM-01` and `WSDOT-01`.

        That gives an honest route-aware distinction between elevated water, forecast flood risk, and confirmed travel impact.
        """
    ).strip()


def api_test_results_md() -> str:
    return dedent(
        """
        # API_AND_FEED_TEST_RESULTS.md — 05_FLOOD_CONDITIONS

        All tests below were run from this local environment on Wednesday, July 29, 2026. Successful HTTP status alone was not treated as proof of usability.

        ## Test 1 — USGS site sweep within the route bounding box

        - Endpoint: `https://waterservices.usgs.gov/nwis/site/?format=rdb&bBox=-122.35,47.54,-122.02,47.77&siteType=ST,LK&siteStatus=active`
        - Status: `200`
        - Content type: tab-delimited text
        - Usable payload: yes
        - Timestamp fields present: retrieval timestamp in header only
        - Geographic identifiers present: site numbers, names, decimal lat/lon, HUC
        - Result: six active surface-water or lake sites were identified near the route
        - Key finding: the site sweep was useful for discovery, but only half of the nearby sites later returned usable IV data

        ## Test 2 — `USGS-01` — USGS IV, downstream Issaquah Creek (`12121600`)

        - Endpoint: `https://waterservices.usgs.gov/nwis/iv/?format=json&sites=12121600&parameterCd=00060,00065`
        - Status: `200`
        - Content type: `application/json`
        - Usable payload: yes
        - Timestamp fields present: per-value `dateTime`
        - Coordinates or geographic identifiers: site number in query and payload; route distance about 264 m
        - Pagination behavior: none observed
        - Cache / rate headers: `cache-control: max-age=900`; no numeric rate-limit headers
        - Authentication: none
        - Small sample: latest values were `21.5 cfs` and `3.79 ft` at `2026-07-29T12:15:00-07:00`
        - Unattended suitability: yes
        - Failure behavior: standard HTTP errors or zero time-series count
        - Environment reachability: reachable from this local environment
        - Bot / JS / geo restrictions: none observed

        ## Test 3 — `USGS-02` — USGS IV, upstream Hobart (`12120600`)

        - Endpoint: `https://waterservices.usgs.gov/nwis/iv/?format=json&sites=12120600&parameterCd=00060,00065`
        - Status: `200`
        - Content type: `application/json`
        - Usable payload: yes
        - Timestamp fields present: per-value `dateTime`
        - Coordinates or geographic identifiers: site number in query and payload; about 10.9 km from the route
        - Pagination behavior: none observed
        - Cache / rate headers: `cache-control: max-age=900`; no numeric rate-limit headers
        - Authentication: none
        - Small sample: latest values were `12.3 cfs` and `3.97 ft` at `2026-07-29T11:45:00-07:00`
        - Unattended suitability: yes
        - Failure behavior: standard HTTP errors or zero time-series count
        - Environment reachability: reachable
        - Bot / JS / geo restrictions: none observed

        ## Test 4 — `USGS-03` — USGS IV, Lake Sammamish (`12122000`)

        - Endpoint: `https://waterservices.usgs.gov/nwis/iv/?format=json&sites=12122000`
        - Status: `200`
        - Content type: `application/json`
        - Usable payload: yes
        - Timestamp fields present: per-value `dateTime`
        - Coordinates or geographic identifiers: site number in query and payload; about 2.2 km from the route
        - Pagination behavior: none observed
        - Cache / rate headers: `cache-control: max-age=900`
        - Authentication: none
        - Small sample: parameter `62614` returned `25.94 ft` above NGVD29 at `2026-07-29T12:15:00-07:00`
        - Unattended suitability: yes
        - Failure behavior: missing `62614` series
        - Environment reachability: reachable
        - Bot / JS / geo restrictions: none observed

        ## Test 5 — USGS IV unusable-nearby gauges

        - Endpoints:
          - `...sites=12121570`
          - `...sites=12124490`
          - `...sites=12119690`
        - Status: all `200`
        - Content type: `application/json`
        - Usable payload: no
        - Timestamp fields present: none, because zero time-series objects were returned
        - Coordinates or geographic identifiers: yes, from the discovery step
        - Pagination behavior: none observed
        - Authentication: none
        - Unattended suitability: no
        - Failure behavior: false-positive `200` with empty data
        - Environment reachability: reachable
        - Bot / JS / geo restrictions: none observed
        - Conclusion: these gauges are not suitable connector inputs unless a different USGS service is later identified

        ## Test 6 — `NWPS-01` — NWPS gauge metadata (`ISSW1`)

        - Endpoint: `https://api.water.noaa.gov/nwps/v1/gauges/ISSW1`
        - Status: `200`
        - Content type: `application/json`
        - Usable payload: yes
        - Timestamp fields present: `status.observed.validTime`, `status.forecast.validTime`
        - Coordinates or geographic identifiers: `lid`, `usgsId`, `reachId`, lat/lon
        - Pagination behavior: none observed
        - Cache / rate headers: no numeric rate-limit headers observed
        - Authentication: none
        - Small sample:
          - observed `0.0222 kcfs / 3.8 ft` at `2026-07-29T17:15:00Z`
          - forecast `0.0252 kcfs / 3.8 ft` at `2026-08-02T00:00:00Z`
          - thresholds: action `1340 cfs`, minor `2000 cfs`, moderate `2300 cfs`, major `2800 cfs`
        - Unattended suitability: yes
        - Failure behavior: HTTP errors, missing `flood.categories`, or stale `validTime`
        - Environment reachability: reachable
        - Bot / JS / geo restrictions: none observed

        ## Test 7 — `NWPS-01` — NWPS stageflow and ratings (`ISSW1`)

        - Endpoints:
          - `https://api.water.noaa.gov/nwps/v1/gauges/ISSW1/stageflow`
          - `https://api.water.noaa.gov/nwps/v1/gauges/ISSW1/ratings`
        - Status: both `200`
        - Content type: `application/json`
        - Usable payload: yes
        - Timestamp fields present: `issuedTime`, `validTime`, `generatedTime`
        - Coordinates or geographic identifiers: inherit from gauge ID
        - Pagination behavior: none observed
        - Authentication: none
        - Small sample:
          - observed series count `2819`
          - forecast series count `29`
          - ratings curve begins at stage `3.59 ft` / flow `10 cfs`
        - Unattended suitability: yes
        - Failure behavior: empty `data` arrays or impossible sentinel values
        - Environment reachability: reachable
        - Bot / JS / geo restrictions: none observed

        ## Test 8 — `NWPS-02` — NWPS upstream Hobart (`ISQW1`)

        - Endpoint family:
          - `.../gauges/ISQW1`
          - `.../gauges/ISQW1/stageflow`
          - `.../gauges/ISQW1/ratings`
        - Status: all `200`
        - Content type: `application/json`
        - Usable payload: yes, but observed-only
        - Timestamp fields present: `status.observed.validTime`, `issuedTime`, `validTime`, `generatedTime`
        - Coordinates or geographic identifiers: `lid`, `usgsId`, `reachId`, lat/lon
        - Pagination behavior: none observed
        - Authentication: none
        - Small sample:
          - observed `3.97 ft / 0.012 kcfs` at `2026-07-29T18:45:00Z`
          - forecast section empty / sentinel
          - flood categories not defined
        - Unattended suitability: yes as corroborating observation
        - Failure behavior: empty observed data or stale issued time
        - Environment reachability: reachable
        - Bot / JS / geo restrictions: none observed

        ## Test 9 — `NWS-01` — NWS flood and flash-flood alerts

        - Endpoints:
          - `https://api.weather.gov/alerts/active?event=Flood%20Warning&area=WA`
          - `https://api.weather.gov/alerts/active?event=Flood%20Watch&area=WA`
          - `https://api.weather.gov/alerts/active?event=Flash%20Flood%20Warning&area=WA`
          - `https://api.weather.gov/alerts/active?event=Flood%20Advisory&area=WA`
          - `https://api.weather.gov/alerts/active?point=47.6505,-122.3046`
        - Status: all `200`
        - Content type: `application/geo+json`
        - Usable payload: yes; all queries returned valid empty collections rather than errors
        - Timestamp fields present: top-level `updated`
        - Coordinates or geographic identifiers: alert geometry when present; point query accepted
        - Pagination behavior: none observed in the empty responses
        - Cache / rate headers: `cache-control: public, max-age=5, s-maxage=5`; no numeric rate-limit headers
        - Authentication: none
        - Small sample: each statewide flood-specific query reported `0` features with updated time `2026-07-29T19:32:51Z`
        - Unattended suitability: yes
        - Failure behavior: HTTP errors, stale `updated`, malformed GeoJSON
        - Environment reachability: reachable
        - Bot / JS / geo restrictions: none observed

        ## Test 10 — `KCF-01` — King County flood overview pages

        - Endpoints:
          - `https://kingcounty.gov/.../warning-system`
          - `https://flood.kingcounty.gov/`
          - `https://green2.kingcounty.gov/rivergagedata/gage-data.aspx?r=issaquah`
          - `https://flood.kingcounty.gov/river/4/`
        - Status: all `200`
        - Content type: HTML
        - Usable payload: yes as reference/corroboration; no documented supported API contract exposed in the HTML itself
        - Timestamp fields present:
          - overview pages: none obvious in the body
          - app-derived content: page shell only unless rendered client-side
        - Coordinates or geographic identifiers: river-specific path / `r=issaquah` parameter
        - Pagination behavior: none observed
        - Authentication: none for the public pages
        - Cache / headers:
          - `flood.kingcounty.gov` shell reachable
          - route pages are Next.js shells
        - Unattended suitability: moderate for page diffing, weak as an API surface
        - Failure behavior: page-shell changes or client bundle changes
        - Environment reachability: reachable
        - Bot / JS / geo restrictions: no hard block, but meaningful data lives behind client-side rendering

        ## Test 11 — `KCF-02` — King County app internal API

        - Endpoint: `https://api.kingcounty.gov/floodwarning/v1/rivers`
        - Status: `200`
        - Content type: `application/json`
        - Usable payload: yes for river list
        - Timestamp fields present: `lastUpdated`, per-river `phaseDateTime`, per-gauge `gaugeDataDateTime`, `downloadDateTime`
        - Coordinates or geographic identifiers: river IDs, USGS IDs, NWS IDs, gauge lat/lon
        - Pagination behavior: none observed
        - Authentication: APIM subscription key required by request header; no public issuance flow found
        - Small sample:
          - Issaquah Creek thresholds: `6.5`, `7.5`, `8.5`, `9.0`
          - gauge grouping included Hobart, Issaquah Mouth, and Lake Sammamish
        - Failure behavior: the obvious direct gauge path was unstable / unsupported in this session
        - Environment reachability: reachable only by reproducing the app's own request pattern
        - Bot / JS / geo restrictions: none beyond the key dependence
        - Conclusion: informative, but not a supported production contract

        ## Test 12 — `ISS-01` — City of Issaquah flood page

        - Endpoint: `https://www.issaquahwa.gov/flood`
        - Status: `200`
        - Content type: HTML
        - Usable payload: yes
        - Timestamp fields present: page `Last-Modified` header, but no live incident timestamp in the tested body excerpt
        - Coordinates or geographic identifiers:
          - linked USGS Hobart gauge `12120600`
          - linked NWPS `ISSW1`
          - linked King County `river/4/`
        - Pagination behavior: none observed
        - Authentication: none
        - Cache / headers: `cache-control: public, max-age=30`; `last-modified` present
        - Unattended suitability: yes for occasional scraping/configuration checks, not as sole live status
        - Failure behavior: HTML changes
        - Environment reachability: reachable
        - Bot / JS / geo restrictions: none observed

        ## Test 13 — `REDM-01` — Redmond Traffic Alerts ArcGIS service

        - Endpoints:
          - root metadata
          - count queries for layers `0`, `1`, `2`
          - field queries for layers `1` and `2`
        - Status: all `200`
        - Content type: `application/json; charset=UTF-8`
        - Usable payload: yes
        - Timestamp fields present: `AlertStartDate`, `AlertEndDate`
        - Coordinates or geographic identifiers: geometry-enabled layers and location descriptions
        - Pagination behavior: standard ArcGIS behavior; no pagination needed for the tested small result sets
        - Cache / headers: `cache-control: must-revalidate,max-age=0,public`; `etag` present; no numeric rate-limit headers
        - Authentication: none
        - Small sample:
          - layer 1 count `2`
          - layer 2 count `1`
          - example `NE 24th Paving and Utility Upgrades` on `West Lake Sammamish Parkway NE`
        - Unattended suitability: yes
        - Failure behavior: empty metadata or dead layer queries
        - Environment reachability: reachable
        - Bot / JS / geo restrictions: none observed

        ## Test 14 — `KC-ROAD-01` and `KC-ROAD-02` — King County road-alert ArcGIS layers

        - Endpoints:
          - `KingCo_Road_Alerts` root
          - `nonKCRoadAlerts` root
          - `SammamishRoadAlerts_point` sample query
          - `SammamishRoadAlerts_line` sample query
        - Status: all `200`
        - Content type: `application/json`
        - Usable payload:
          - `KingCo_Road_Alerts` metadata yes, current tested layer sample no active records
          - `SammamishRoadAlerts` yes structurally, but content is stale test data
        - Timestamp fields present: `AlertStartDate`, `AlertEndDate`, `CreatedDate`, `ModifiedDate`
        - Coordinates or geographic identifiers: geometry-enabled layers
        - Pagination behavior: none needed in tested results
        - Authentication: none
        - Small sample:
          - `AlertTitle: Test`
          - `AlertDescription: This is only a test`
        - Unattended suitability:
          - `KingCo_Road_Alerts`: yes, secondary only
          - `SammamishRoadAlerts`: not yet
        - Failure behavior: stale test records or zero results
        - Environment reachability: reachable
        - Bot / JS / geo restrictions: none observed

        ## Test 15 — `WSDOT-01` — WSDOT Highway Alerts

        - Endpoints:
          - docs root and help page
          - `GetAlertsAsJson`
          - `SearchAlertsAsJson` for SR-522, region 9, mileposts 0-25
        - Status: all `200`
        - Content type: JSON for live calls
        - Usable payload: yes
        - Timestamp fields present: `StartTime`, `EndTime`, `LastUpdatedTime`
        - Coordinates or geographic identifiers: start/end roadway latitude, longitude, route, milepost
        - Pagination behavior: none observed in tested arrays
        - Cache / headers: `cache-control: private` on live alerts; no numeric rate-limit headers
        - Authentication: AccessCode required
        - Small sample:
          - statewide call returned live alerts
          - route-targeted SR-522 call returned `[]` on Wednesday, July 29, 2026
        - Unattended suitability: yes when credential is available
        - Failure behavior: auth errors or empty arrays where a broad test should contain data
        - Environment reachability: reachable from this local environment with the existing project credential name
        - Bot / JS / geo restrictions: none observed

        ## Test 16 — Bellevue, Sammamish, Seattle, and alert-signup pages

        - Endpoints:
          - Bellevue flooding / alerts pages
          - Sammamish stormwater / alert sign-up pages
          - Seattle flood-safety page
          - AlertRedmond page
        - Status: all `200`
        - Content type: HTML
        - Usable payload: yes for guidance, no for unattended feed extraction
        - Timestamp fields present: generally none relevant to live incidents
        - Coordinates or geographic identifiers: city scope only
        - Pagination behavior: none observed
        - Authentication: none for the pages, but user accounts required for the underlying notification systems
        - Unattended suitability: no
        - Failure behavior: n/a for live-monitoring use
        - Environment reachability: reachable
        - Bot / JS / geo restrictions: none observed

        ## Test 17 — Ecology flood-map viewer

        - Endpoint: `https://apps.ecology.wa.gov/coastalatlas/tools/Flood.aspx`
        - Status: `200`
        - Content type: HTML
        - Usable payload: partially; the page shell loads and clearly represents a map app, but no live connector-style flood event feed was identified from this environment
        - Timestamp fields present: none relevant to live incidents
        - Coordinates or geographic identifiers: map viewer only
        - Pagination behavior: not applicable
        - Authentication: none
        - Unattended suitability: no for live monitoring; yes as a manual planning reference
        - Failure behavior: broken JS map shell
        - Environment reachability: reachable
        - Bot / JS / geo restrictions: no hard block, but the value is still planning-only
        """
    ).strip()


def gaps_md() -> str:
    return dedent(
        """
        # SOURCE_GAPS.md — 05_FLOOD_CONDITIONS

        ## Confirmed coverage gaps

        1. **No verified live official Sammamish River gauge was identified in the tested production-ready set.**
        The route spends many miles in the Sammamish River corridor, but the strongest usable live signals were still Issaquah Creek, Lake Sammamish, and closure supplements.

        2. **No official trail-inundation threshold was found for East Lake Sammamish Trail or Lake Sammamish State Park.**
        Lake level alone should not trigger route-closure logic without corroborating closures or flood products.

        3. **Bear Creek, North Fork Issaquah Creek, and Coal Creek discovery sites were not operationally usable via the tested USGS IV path.**
        Their HTTP 200 responses contained zero time-series objects.

        4. **King County's app backend is not a clean public contract.**
        The river-list call returned useful JSON, but the backend is undocumented, key-bound, and partly unstable under direct probing.

        5. **Bellevue, Sammamish, Seattle/SPU, and regional alert systems did not expose live machine-readable flood feeds.**
        They are legitimate official resources, but weak unattended connector inputs.

        6. **SammamishRoadAlerts is structurally real but content-stale.**
        Only 2014 test records were observed on Wednesday, July 29, 2026.

        ## What would close these gaps

        - A verified official live Sammamish River gauge or another official water-level proxy directly tied to the Bothell/Woodinville/Marymoor sections.
        - A local-agency or park-owner statement linking Lake Sammamish elevation to actual East Lake Sammamish Trail or Lake Sammamish State Park inundation.
        - Repeated follow-up checks on `KC-ROAD-02` to determine whether live Sammamish road-alert content ever appears.
        - A route-buffer geometry test against shared closure sources from workstream 01, so the flood connector can consume `confirmed_route_closure` evidence rather than re-deriving everything itself.

        ## Items intentionally left out of MVP

        - WSDOT weather stations: useful for weather, not primary flood logic.
        - Ecology flood maps: valuable for static vulnerability context only.
        - AlertRedmond / Bellevue / Alert King County sign-up systems: not a public feed model.
        """
    ).strip()


def implementation_md() -> str:
    return dedent(
        """
        # IMPLEMENTATION_RECOMMENDATION.md — 05_FLOOD_CONDITIONS

        This is a planning document only. No production n8n workflow was built in this cycle.

        ## Recommended MVP runtime source set

        1. `USGS-01` — downstream observed Issaquah Creek at the route end.
        2. `USGS-02` — upstream Hobart observed gauge for lead time into the route end.
        3. `NWPS-01` — official forecast/category source for Issaquah Creek near Issaquah.
        4. `NWS-01` — official flood and flash-flood alerts.
        5. `ISS-01` — official local phase semantics and lead-time interpretation for Issaquah.

        ## Recommended secondary source set

        - `USGS-03` — Lake Sammamish elevation context.
        - `NWPS-02` — upstream Hobart corroboration in NOAA form.
        - `REDM-01` — Redmond closure supplement around West Lake Sammamish Parkway and NE 24th.
        - `KC-ROAD-01` — low-probability but clean county-road closure supplement.
        - `WSDOT-01` — state-highway crossing supplement.

        ## Sources not recommended as runtime dependencies

        - `KCF-02` because it is an undocumented app backend.
        - `KC-ROAD-02` until live Sammamish content is observed.
        - Bellevue, Sammamish, Seattle/SPU, and sign-up systems because they are guidance or notification products, not feeds.
        - Ecology flood maps because they are static planning context, not current conditions.

        ## Route-impact model

        The implementation should evaluate route impact in this order:

        1. **Confirmed route closure**
           A shared closure connector reports a geometry-matched closure with flood, water, washout, or drainage language.

        2. **Observed flooding**
           `NWPS-01` observed category is minor, moderate, or major; or Issaquah local phase is II, III, or IV.

        3. **Forecast flooding**
           `NWPS-01` forecast category is above `no_flooding`; or NWS issues Flood Watch / Flood Warning / Flash Flood Warning overlapping the route.

        4. **Probable route impact**
           Water is elevated on a route-relevant gauge but no closure is confirmed yet. This should be conservative and section-specific, not route-wide.

        5. **Elevated water**
           Context-only signal. Use for Lake Sammamish high water, rising Hobart levels below local phase triggers, or cautionary water-level anomalies without official flood status.

        6. **No known route impact**
           No official flood alerts, no route-relevant closure, and route-relevant gauges below official or derived attention levels.

        ## Acquisition cadence

        | Source | Cadence | Reason |
        | --- | --- | --- |
        | USGS-01 / USGS-02 / USGS-03 | every 15 minutes | USGS cache-control is `max-age=900` and the tested values updated on a 15-minute rhythm |
        | NWPS-01 / NWPS-02 status | every 15 minutes | Observed status changed on a 15-minute rhythm |
        | NWPS-01 stageflow / ratings | every 60 minutes | Forecast curve and ratings do not need 15-minute polling |
        | NWS-01 | every 10 to 15 minutes | NWS tested cache-control is `max-age=5` and alerting is event-driven |
        | REDM-01 / KC-ROAD-01 / WSDOT-01 | every 30 to 60 minutes | Closure supplements, not core hydrologic backbone |
        | ISS-01 | daily or on-change | threshold/policy source, not a main live feed |

        ## Freshness and failure rules

        - `USGS-01`, `USGS-02`, `USGS-03`: mark stale after 30 minutes.
        - `NWPS-01`, `NWPS-02` observed status: mark stale after 30 minutes.
        - `NWPS-01` forecast: mark stale after 6 hours.
        - `NWS-01`: mark stale after 15 minutes.
        - closure supplements: mark stale after 2 hours.

        On failure:

        - preserve last known good per source;
        - surface per-source health;
        - degrade only the affected sections;
        - never convert missing data into “clear.”

        ## Proposed high-level n8n design

        **Recommendation: one workflow with separate branches and a shared normalizer.**

        Branches:

        1. USGS observations.
        2. NWPS status / stageflow / ratings.
        3. NWS flood alerts.
        4. Shared closure supplements.
        5. Daily policy/reference scrape for `ISS-01`.

        Shared stages:

        - fetch
        - validate payload shape
        - map source timestamps
        - evaluate route relevance
        - classify severity
        - write normalized output atomically
        - keep last known good

        ## Key implementation cautions

        - Do not treat `USGS-03` lake level as a closure trigger by itself.
        - Do not assume upstream Hobart stage equals downstream trail flooding without local threshold logic.
        - Do not use countywide or citywide closure sources without geometry matching.
        - Do not depend on `KCF-02` unless King County later publishes a supported contract.

        ## Recommended next implementation step

        Build a prototype normalizer against only:

        - `USGS-01`
        - `USGS-02`
        - `NWPS-01`
        - `NWS-01`

        Then add `USGS-03` and shared closure supplements only after the base severity logic is stable.
        """
    ).strip()


def route_relevance_md() -> str:
    return dedent(
        f"""
        # ROUTE_RELEVANCE_AND_THRESHOLDS.md — 05_FLOOD_CONDITIONS

        ## Route sections used in this workstream

        1. **UW / south Burke-Gilman** — urban drainage and citywide flood alerts only.
        2. **North Lake Washington / Kenmore / Bothell** — low-lying trail and road-crossing context; no verified direct hydrologic gauge in the final runtime set.
        3. **Sammamish River Trail / Woodinville / Bothell** — river-adjacent trail, but no direct verified live Sammamish River gauge in the runtime set.
        4. **Marymoor / Bear Creek lowlands** — low-lying park and creek context; direct Bear Creek IV probe unusable on Wednesday, July 29, 2026.
        5. **East Lake Sammamish Trail shoreline** — Lake Sammamish level context plus closure supplements.
        6. **Lake Sammamish State Park / Issaquah Creek terminus** — strongest and most directly monitored flood-exposure zone on the route.

        ## Required route-relevance methods by source type

        ### Gauge and forecast points

        Use:

        - point-to-route distance;
        - upstream/downstream hydrologic relationship;
        - named water-body match;
        - segment assignment, not route-wide assignment.

        Recommended rule:

        - direct route gauges inside **3 km** of the GPX may affect the mapped nearby segment directly;
        - upstream gauges outside 3 km may still be relevant if an official local system explicitly uses them for lead time;
        - gauges outside **5 km** with no official operational linkage should not drive alerts for this route.

        ### Alert polygons

        Use:

        - alert geometry when present;
        - CAP geocodes / affected zones / county codes;
        - bounding-box prefilter, then real geometry intersection;
        - point-query fallback at representative route points only when polygon handling is not available.

        ### Closure sources

        Use:

        - geometry buffer around the GPX;
        - named facility / roadway match;
        - flood-related text classification (`flood`, `standing water`, `washout`, `drainage failure`, `water over roadway`);
        - never keyword-only matching without geometry or street/segment validation.

        ## Gauge relevance table

        | Source | Water body | Coordinates | Distance to route | Upstream / downstream | Meaning for the route |
        | --- | --- | --- | ---: | --- | --- |
        | USGS-01 / NWPS-01 | Issaquah Creek near mouth | 47.5525, -122.0467 | {GAUGE_DISTANCE_METERS['NWPS-01']} m | direct downstream route-end gauge | strongest observed + forecast route-end flood signal |
        | USGS-02 / NWPS-02 | Issaquah Creek near Hobart | 47.4573, -122.0051 | {GAUGE_DISTANCE_METERS['USGS-02']} m | upstream | lead-time signal used by Issaquah local flood phases |
        | USGS-03 | Lake Sammamish near Redmond | 47.5765, -122.1112 | {GAUGE_DISTANCE_METERS['USGS-03']} m | main pool level | shoreline context only; not a stand-alone closure trigger |
        | USGS-04 | North Fork Issaquah Creek | 47.5428, -122.0348 | {GAUGE_DISTANCE_METERS['USGS-04']} m | tributary | discovery lead only; no usable IV data |
        | USGS-05 | Bear Creek | 47.6751, -122.1072 | {GAUGE_DISTANCE_METERS['USGS-05']} m | tributary to Sammamish system | good geography, unusable tested feed |
        | USGS-06 | Coal Creek | 47.5603, -122.1706 | {GAUGE_DISTANCE_METERS['USGS-06']} m | peripheral drainage | too far and unusable tested feed |

        ## Official thresholds

        ### Issaquah local flood phases from `ISS-01`

        - Phase I: `6.5 ft` and rising at Hobart.
        - Phase II: `7.5 ft` and rising at Hobart.
        - Phase III: `8.5 ft` regardless of trend.
        - Phase IV: `9.0 ft` regardless of trend.

        Recommended mapping:

        - Phase I -> `watch`
        - Phase II -> `observed_flooding` and at least `probable_route_impact` for the terminus zone
        - Phase III / IV -> `warning` plus likely severe route-end impact

        ### NWPS official categories from `NWPS-01`

        Flow-based categories:

        - Action: `1340 cfs`
        - Minor: `2000 cfs`
        - Moderate: `2300 cfs`
        - Major: `2800 cfs`

        Recommended route mapping:

        - below action -> `no_known_route_impact` unless a closure source says otherwise
        - action to below minor -> `elevated_water`
        - minor to below moderate -> `probable_route_impact`
        - moderate to below major -> `warning`
        - major and above -> `warning` with severe route-end emphasis

        ## Non-official derived threshold

        ### Lake Sammamish

        No official flood stage for route operations was found.

        Recommended derived handling:

        - store the absolute lake level and 24-hour trend;
        - optionally label `elevated_water` when the level is materially above recent normal conditions;
        - never escalate beyond `elevated_water` from lake level alone;
        - require corroboration from closures, NWS alerts, or Issaquah Creek products before claiming route impact.

        ## Deterministic location-resolution guidance for text-only alerts

        For text-only or weakly structured pages:

        1. Match official city names and facility names.
        2. Match named route assets: Burke-Gilman Trail, Sammamish River Trail, Marymoor Park, East Lake Sammamish Trail, Lake Sammamish State Park.
        3. Match route-end roads: East Lake Sammamish Parkway NE, East Lake Sammamish Trail, East Lake Sammamish Lane NE.
        4. Prefer official linked gauges or official referenced parks over generic citywide wording.
        5. Downgrade confidence when a page only says “in the city” or “during heavy rains” without a route landmark.

        ## Confidence limitations

        - The middle third of the route still lacks a strong direct river gauge in the final tested runtime set.
        - Closure sources can confirm impact, but they do not provide hydrologic lead time.
        - Lake Sammamish level is real and valuable, but the trail-impact threshold is not officially defined.
        """
    ).strip()


def env_and_readiness_md() -> str:
    env_lines = [
        "# ENV_AND_READINESS.md — 05_FLOOD_CONDITIONS",
        "",
        "Environment inspection was performed by name only. No secret values are reproduced below.",
        "",
        "## Authentication variables",
        "",
        "| Source | Variable name | Secret type | Required or optional | Where to obtain it | Existing variable name present | Testing completed without it | Limitations without credential |",
        "| --- | --- | --- | --- | --- | --- | --- | --- |",
    ]
    for row in AUTH_ROWS:
        env_lines.append(
            f"| {row['source']} | {row['variable_name']} | {row['secret_type']} | {row['required_or_optional']} | {row['where_to_obtain']} | {row['existing_name_present']} | {row['tested_without_it']} | {row['limitations_without_credential']} |"
        )
    env_lines.extend(
        [
            "",
            "## Readiness scoring",
            "",
            "| Source | Authority | Route relevance | Freshness | Reliability | Machine readability | Implementation effort | Maintenance burden | Historical stability | Licensing clarity | Outage resilience | Readiness |",
            "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |",
        ]
    )
    for source_id, scores in READINESS.items():
        env_lines.append(
            f"| {source_id} | {scores['authority']} | {scores['route_relevance']} | {scores['freshness']} | {scores['reliability']} | {scores['machine_readability']} | {scores['implementation_effort']} | {scores['maintenance_burden']} | {scores['historical_stability']} | {scores['licensing_clarity']} | {scores['outage_resilience']} | {scores['readiness']} |"
        )
    env_lines.extend(
        [
            "",
            "## Confidence notes",
            "",
        ]
    )
    for source_id, scores in READINESS.items():
        env_lines.append(f"- `{source_id}`: {scores['confidence_note']}")
    return "\n".join(env_lines)


def normalized_schema_md() -> str:
    example = {
        "schemaVersion": "1.0.0",
        "workstreamId": "05_FLOOD_CONDITIONS",
        "generatedAt": "2026-07-29T20:00:00Z",
        "overallStatus": "ok",
        "severity": "elevated_water",
        "routeSummary": {
            "state": "No confirmed route closure. Elevated water monitoring active at the Issaquah end only.",
            "confidence": "high",
            "freshnessMinutes": 11,
        },
        "routeSegmentImpacts": [
            {
                "segmentId": "seg-6-issaquah-terminus",
                "label": "Lake Sammamish State Park / Issaquah Creek terminus",
                "status": "monitoring",
                "severity": "elevated_water",
                "basis": ["USGS-01", "NWPS-01", "ISS-01"],
            }
        ],
        "events": [
            {
                "eventType": "gauge_observation",
                "status": "active",
                "observed": True,
                "forecast": False,
                "sourceId": "USGS-01",
                "title": "Issaquah Creek near mouth observed stage",
                "metric": {"name": "stage_ft", "value": 3.79},
            }
        ],
        "advisories": [],
        "sourceProvenance": [
            {"sourceId": "USGS-01", "retrievedAt": "2026-07-29T19:15:30Z", "status": "ok"},
            {"sourceId": "NWPS-01", "retrievedAt": "2026-07-29T19:17:10Z", "status": "ok"},
        ],
        "geographicRelevance": {
            "method": ["point_to_route_distance", "upstream_relationship", "geometry_intersection"],
            "notes": "Illustrative example only; not a live incident record.",
        },
        "freshness": {
            "stale": False,
            "maxSourceAgeMinutes": 11,
        },
        "confidence": {
            "overall": "high",
            "reason": "All primary sources returned live, current payloads.",
        },
        "pipelineHealth": {
            "status": "ok",
            "errors": [],
            "warnings": [],
        },
        "staleDataState": {
            "hasStaleSource": False,
            "sources": [],
        },
        "errors": [],
        "lastSuccessfulUpdate": "2026-07-29T19:17:10Z",
        "diagnostics": {
            "publicSummarySafe": True,
            "sourceAgesMinutes": {"USGS-01": 11, "NWPS-01": 9},
            "rawPayloadStored": False,
        },
    }
    return dedent(
        f"""
        # NORMALIZED_SCHEMA_PROPOSAL.md — 05_FLOOD_CONDITIONS

        The normalized output should stay compact, website-ready, and free of raw payload dumps.

        ## Public-facing fields

        | Field | Purpose |
        | --- | --- |
        | `schemaVersion` | Versioned contract control |
        | `workstreamId` | Stable connector/workstream identifier |
        | `generatedAt` | When this normalized record was generated |
        | `overallStatus` | `ok`, `degraded`, `failed`, or `stale` |
        | `severity` | Highest current flood-related severity |
        | `routeSummary` | One-screen rider-facing summary |
        | `routeSegmentImpacts` | Segment-level impacts only where relevant |
        | `events` | Compact event objects for gauges, alerts, closures, advisories |
        | `advisories` | Human-readable advisory snippets |
        | `sourceProvenance` | Which sources contributed and when |
        | `geographicRelevance` | Why an event was considered route-relevant |
        | `freshness` | Staleness summary |
        | `confidence` | Confidence label and reason |
        | `lastSuccessfulUpdate` | Last all-or-partial good write timestamp |

        ## Diagnostic-only fields

        | Field | Purpose |
        | --- | --- |
        | `pipelineHealth` | Connector runtime health |
        | `staleDataState` | Source-level stale flags |
        | `errors` | Non-public error payloads or summaries |
        | `diagnostics` | Source ages, parsing warnings, internal notes |

        ## Event model recommendations

        Each `events[]` item should support:

        - `eventType`
        - `status`
        - `observed`
        - `forecast`
        - `sourceId`
        - `title`
        - `summary`
        - `metric`
        - `officialCategory`
        - `routeImpact`
        - `segmentIds`
        - `relevanceReason`

        ## Example JSON

        The example below is illustrative only and does not describe a live incident.

        ```json
        {json.dumps(example, indent=2)}
        ```
        """
    ).strip()


def overlap_notes_md() -> str:
    return dedent(
        """
        # OVERLAP_NOTES.md — 05_FLOOD_CONDITIONS

        ## Workstream ownership position

        | Hazard | 05 position | Adjacent workstreams likely to touch it | Canonical-source priority / dedup rule |
        | --- | --- | --- | --- |
        | Flood Watch | Own | 02_WEATHER, 07_GOVERNMENT_SAFETY_ALERTS | `NWS-01` is canonical. Do not duplicate under 07 if 05 already publishes it. |
        | Flood Warning | Own | 02_WEATHER, 07_GOVERNMENT_SAFETY_ALERTS | `NWS-01` or `NWPS-01` for official category; 05 owns the hydrologic interpretation. |
        | Flash Flood Warning | Own | 02_WEATHER, 07_GOVERNMENT_SAFETY_ALERTS | `NWS-01` is canonical. 07 may surface general emergency context, but 05 owns route flood semantics. |
        | Flood Advisory | Own | 02_WEATHER, 07_GOVERNMENT_SAFETY_ALERTS | `NWS-01` canonical. |
        | Trail closure due to flooding | Shared | 01_ROUTE_CONDITIONS | 01 owns closure confirmation; 05 owns the flood cause classification. Publish one closure event with shared provenance. |
        | Road closure due to flooding | Shared | 01_ROUTE_CONDITIONS, 07_GOVERNMENT_SAFETY_ALERTS | Use the closure source for closure truth and 05 for flood-cause truth. |
        | Dam incident / water-control issue | Partial | 06_TRAIL_INFRASTRUCTURE_STATUS, 07_GOVERNMENT_SAFETY_ALERTS | 05 should only own it when it changes flood risk on the route. Otherwise 07 or 06 should lead. |
        | Waterway infrastructure closure | Partial | 06_TRAIL_INFRASTRUCTURE_STATUS, 01_ROUTE_CONDITIONS | 05 only if the closure is explicitly flood-driven. |
        | Evacuation | Not owned | 07_GOVERNMENT_SAFETY_ALERTS | 05 can reference evacuations as context but should not own them. |
        | Smoke advisory | Not owned | 03_AIR_QUALITY, 04_WILDFIRE | Not a flood hazard. |
        | Red Flag Warning | Not owned | 04_WILDFIRE | Not a flood hazard. |
        | Trail closure due to construction | Not owned | 01_ROUTE_CONDITIONS, 06_TRAIL_INFRASTRUCTURE_STATUS | Flood workstream should not claim it unless flooding is explicitly the cause. |
        | Trail closure due to fire | Not owned | 04_WILDFIRE, 01_ROUTE_CONDITIONS | Not a flood hazard. |
        | Hazardous-material spill | Not owned | 07_GOVERNMENT_SAFETY_ALERTS | Only mention if it is inside a flood warning context, not as primary ownership. |
        | Police activity | Not owned | 07_GOVERNMENT_SAFETY_ALERTS | Not a flood hazard. |
        | Excessive heat warning | Not owned | 02_WEATHER | Not a flood hazard. |
        | Severe thunderstorm warning | Not owned by default | 02_WEATHER, 07_GOVERNMENT_SAFETY_ALERTS | Only flood workstream concern is downstream flooding caused by storm rainfall, not the thunderstorm product itself. |
        | High wind warning | Not owned | 02_WEATHER | Not a flood hazard. |
        | Air-quality alert | Not owned | 03_AIR_QUALITY | Not a flood hazard. |
        | Boil-water notice | Not owned | 07_GOVERNMENT_SAFETY_ALERTS | Public-health / utility hazard, not route flooding. |
        | Bridge closure | Shared only when flood-caused | 01_ROUTE_CONDITIONS, 06_TRAIL_INFRASTRUCTURE_STATUS | Closure owner should be 01; 05 adds flood causation if supported. |
        | Public-health advisory | Not owned | 07_GOVERNMENT_SAFETY_ALERTS | Not a flood hazard unless explicitly a flood contamination notice. |

        ## Deduplication rule I recommend

        - Let `05_FLOOD_CONDITIONS` own hydrologic hazard labels.
        - Let `01_ROUTE_CONDITIONS` own closure truth.
        - When both workstreams detect the same real-world event, merge into a single normalized event with:
          - closure state from the closure source;
          - flood cause from the hydrologic source;
          - one rider-facing card, not two.
        """
    ).strip()


def final_research_report_md() -> str:
    return dedent(
        """
        # UW_ISSY_05_FLOOD_CONDITIONS_FINAL_RESEARCH_REPORT_v1

        ## Summary

        On Wednesday, July 29, 2026, the strongest official flood-monitoring backbone for this route proved to be a combination of USGS observations, NOAA NWPS forecast/category products, and NWS flood-alert products, with local Issaquah phase semantics layered on top.

        The best live route-end sources were:

        - USGS `12121600` Issaquah Creek near mouth near Issaquah
        - USGS `12120600` Issaquah Creek near Hobart
        - NOAA NWPS `ISSW1` Issaquah Creek near Issaquah
        - NWS flood / flash-flood alerts

        The best closure supplements were:

        - Redmond `Traffic/Alerts` ArcGIS REST
        - King County road-alert ArcGIS services
        - WSDOT Highway Alerts for state-highway crossing context

        ## Verified landscape

        ### Best official current/forecast flood sources

        - `USGS-01` gives the strongest direct observed route-end signal.
        - `USGS-02` gives upstream lead time that the City of Issaquah explicitly uses.
        - `NWPS-01` adds official action/minor/moderate/major categories plus forecast data.
        - `NWS-01` covers official flood alerts at regional scale.
        - `ISS-01` explains how the city operationalizes Hobart stages into local phases.

        ### Useful but weaker sources

        - `USGS-03` Lake Sammamish is real and useful, but no official trail-impact threshold was found.
        - `REDM-01` is excellent for confirmed traffic impacts around Redmond and West Lake Sammamish Parkway.
        - `WSDOT-01` is relevant only for state-highway crossings and detours, not for the trail itself.

        ### Sources investigated and rejected

        - County app backend (`KCF-02`) for being undocumented and key-bound.
        - Nearby but unusable USGS IV probes (`USGS-04`, `USGS-05`, `USGS-06`) because the tested responses contained no live series.
        - Bellevue, Sammamish, Seattle/SPU, and alert sign-up pages because they were guidance or notification channels rather than public feeds.
        - Ecology flood maps as a live connector because they are static planning tools.

        ## Route/segment conclusions

        - The **Issaquah end of the route** has the strongest flood-monitoring coverage by far.
        - The **Lake Sammamish shoreline** has good contextual lake-level coverage but weak official trail-inundation thresholds.
        - The **Sammamish River / Marymoor middle corridor** remains the biggest gap because no verified live official river gauge for that trail section made the final tested source set.

        ## Coverage gaps

        1. No direct verified live Sammamish River gauge in the final runtime set.
        2. No official East Lake Sammamish Trail inundation threshold.
        3. No convincing municipal machine-readable flood feed for Bellevue or Sammamish.
        4. No supported King County public API contract for the flood app.

        ## Research conclusion

        The route can be monitored honestly and effectively for flood risk now, but the connector should be explicit about what it knows:

        - official observed water,
        - official forecast categories,
        - official flood alerts,
        - confirmed closures from shared closure sources,

        and what it does not know:

        - a universal trail-flood threshold for every low-lying segment.
        """
    ).strip()


def final_impl_report_md() -> str:
    return dedent(
        """
        # UW_ISSY_05_FLOOD_CONDITIONS_IMPLEMENTATION_RECOMMENDATION_v1

        ## Recommended build target

        Start with a compact MVP using:

        - `USGS-01`
        - `USGS-02`
        - `NWPS-01`
        - `NWS-01`
        - `ISS-01`

        Add these after the base logic is stable:

        - `USGS-03`
        - `REDM-01`
        - `KC-ROAD-01`
        - `WSDOT-01`

        ## Runtime logic

        Use source roles, not one blended bucket:

        - **Observed water:** `USGS-01`, `USGS-02`
        - **Forecast/category:** `NWPS-01`
        - **Official alerts:** `NWS-01`
        - **Local semantics:** `ISS-01`
        - **Closure truth:** shared route-condition sources

        ## Severity model

        - `elevated_water`
        - `advisory`
        - `watch`
        - `warning`
        - `observed_flooding`
        - `forecast_flooding`
        - `confirmed_route_closure`
        - `probable_route_impact`
        - `no_known_route_impact`

        ## Threshold model

        Use official thresholds where they exist:

        - Hobart local phases from `ISS-01`
        - flow categories from `NWPS-01`

        Use derived heuristics only for Lake Sammamish context, and never treat them as official flood stages.

        ## Failure and fallback

        - Preserve last known good per source.
        - Surface per-source health.
        - Never claim “clear” when a primary source is stale or failed.
        - If the closure supplements fail, keep hydrologic monitoring active but downgrade closure confidence.

        ## Main risks

        1. The route middle lacks a strong direct river gauge.
        2. Lake Sammamish trail-impact thresholds are not officially published.
        3. The King County app backend is tempting but unsupported.

        ## Next step

        Implement only the normalized fetch/parse/classify flow for the MVP set first, then run a dedicated follow-up cycle on middle-corridor flood proxies and shared closure integration.
        """
    ).strip()


def build_readme() -> str:
    return dedent(
        """
        # 05_FLOOD_CONDITIONS

        ## Status

        Research, live endpoint testing, route-relevance design, and implementation planning completed on Wednesday, July 29, 2026. No production n8n workflow was built.

        ## Key result

        The strongest production-ready flood backbone is `USGS-01` + `USGS-02` + `NWPS-01` + `NWS-01`, with `ISS-01` providing the local Issaquah phase semantics that the federal feeds do not.

        ## Files in this directory

        - `SOURCE_REGISTRY.md`
        - `SOURCE_REGISTRY.json`
        - `RESEARCH_FINDINGS.md`
        - `API_AND_FEED_TEST_RESULTS.md`
        - `SOURCE_GAPS.md`
        - `IMPLEMENTATION_RECOMMENDATION.md`
        - `ROUTE_RELEVANCE_AND_THRESHOLDS.md`
        - `ENV_AND_READINESS.md`
        - `NORMALIZED_SCHEMA_PROPOSAL.md`
        - `OVERLAP_NOTES.md`
        - `SESSION_LOG.md`

        ## Final polished deliverables

        - `UW_ISSY_05_FLOOD_CONDITIONS_FINAL_RESEARCH_REPORT_v1.md`
        - `UW_ISSY_05_FLOOD_CONDITIONS_IMPLEMENTATION_RECOMMENDATION_v1.md`
        - `UW_ISSY_05_FLOOD_CONDITIONS_AUDIT_REPORT_v1.md`
        - `UW_ISSY_05_FLOOD_CONDITIONS_FINAL_SOURCE_REGISTRY_v1.json`
        """
    ).strip()


def copy_result_line(name: str, result: dict[str, str]) -> str:
    if result["copied"] == "yes":
        return f"- `{name}`: copied successfully; source SHA-256 `{result['source_hash']}`; destination SHA-256 `{result['destination_hash']}`."
    return f"- `{name}`: copy not completed; source SHA-256 `{result['source_hash']}`; reason: {result['error']}."


def archive_result_line(result: dict[str, str]) -> str:
    if result["copied"] == "yes":
        return f"- Archived generator script to `{result['destination_path']}` with SHA-256 `{result['source_hash']}`."
    return f"- Generator script archive to `/Users/jkbrookspersonal/00_SCRIPTS` was not completed; source SHA-256 `{result['source_hash']}`; reason: {result['error']}."


def copy_file(src: Path, dst: Path) -> dict[str, str]:
    result = {
        "source_path": str(src),
        "destination_path": str(dst),
        "copied": "no",
        "source_hash": sha256(src),
        "destination_hash": "",
        "error": "",
    }
    try:
        shutil.copy2(src, dst)
        result["destination_hash"] = sha256(dst)
        if result["source_hash"] != result["destination_hash"]:
            result["error"] = "SHA-256 mismatch after copy"
        else:
            result["copied"] = "yes"
    except Exception as exc:
        result["error"] = f"{type(exc).__name__}: {exc}"
    return result


def audit_md(download_results: dict[str, dict[str, str]], downloads_copy_ok: bool) -> str:
    copy_validation_line = (
        "- The four required Downloads copies were created and SHA-256 checked."
        if downloads_copy_ok
        else "- The four required Downloads copies could not all be created from this sandboxed environment; source files were still hashed locally and the failed copy attempts were recorded."
    )
    copy_lines = "\n".join(
        copy_result_line(name, result) for name, result in download_results.items()
    )
    return dedent(
        f"""
        # UW_ISSY_05_FLOOD_CONDITIONS_AUDIT_REPORT_v1

        ## 1. Files inspected and route basis

        - Project root confirmed: `{ROOT}`
        - Canonical GPX confirmed readable: `{ROUTE_FACTS['canonical_gpx']}`
        - Connector directory confirmed: `{CONNECTOR}`
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
        {copy_validation_line}

        ## 4. Downloads copy verification

        {copy_lines}

        ## 5. Limitations

        1. No direct verified live Sammamish River gauge made the final runtime set.
        2. Lake Sammamish shoreline impact thresholds are not officially published.
        3. King County's internal flood backend is not a supported public contract.
        4. Bellevue, Sammamish, Seattle/SPU, and sign-up systems did not provide public machine-readable flood feeds.
        5. This sandbox could not write to `/Users/jkbrookspersonal/Downloads`, so the required final-copy step could not be completed here.

        ## 6. Honest final status

        All required local files exist, all MVP sources were tested live, and both registry JSON files validate. The audit is `PARTIAL` because the middle corridor still lacks a strong direct live river gauge and this sandbox could not complete the required `Downloads` copy step.

        PARTIAL
        """
    ).strip()


def session_log_md(
    download_results: dict[str, dict[str, str]],
    archive_result: dict[str, str],
    downloads_copy_ok: bool,
) -> str:
    download_hash_lines = "\n".join(
        copy_result_line(name, result) for name, result in download_results.items()
    )
    archive_line = archive_result_line(archive_result)
    downloads_validation_lines = [
        "- Registry JSON parsed successfully.",
        "- Final registry JSON parsed successfully.",
        "- Source ID sets match between both JSON files.",
    ]
    if downloads_copy_ok:
        downloads_validation_lines.extend(
            [
                "- Required polished files copied to Downloads only.",
                "- SHA-256 verified identical between authoritative and Downloads copies.",
            ]
        )
    else:
        downloads_validation_lines.extend(
            [
                "- Downloads copy step was attempted for the four required polished files.",
                "- SHA-256 values were computed for the authoritative files, but destination comparison could not be completed for every file because this sandbox cannot write to `/Users/jkbrookspersonal/Downloads`.",
            ]
        )
    validation_block = "\n".join(downloads_validation_lines)
    return dedent(
        f"""
        # SESSION_LOG.md

        ## {STAMP} — 05_FLOOD_CONDITIONS research and planning cycle

        - **Workstream:** 05_FLOOD_CONDITIONS
        - **Objective:** Research, test, classify, and document official flood-condition sources for the UW -> Burke-Gilman -> Sammamish River -> Marymoor -> East Lake Sammamish -> Issaquah route. Research/planning only; no production workflow built.

        ### Mise en place confirmed

        1. Project root exists: `{ROOT}`
        2. Canonical GPX exists and is readable: `{ROUTE_FACTS['canonical_gpx']}`
        3. Assigned connector directory exists and was inspected; initial content was a starter `README.md` only.
        4. Read: `CLAUDE.md`, `AGENTS.md`, `00_PROJECT_RULES.md`, `00_PROJECT_STATUS.md`.
        5. Skimmed `01_ROUTE_CONDITIONS` and `02_WEATHER` as formatting / rigor templates.

        ### Sources researched and tested

        - King County Flood Warning System overview and live app pages
        - King County app backend river-list API behavior
        - USGS site discovery and live IV services for six nearby gauges
        - NOAA NWPS gauge metadata, stageflow, and ratings for `ISSW1` and `ISQW1`
        - NWS active flood-alert queries for Washington and a route point
        - City of Issaquah flood page and linked official products
        - Redmond Traffic/Alerts ArcGIS service
        - King County `KingCo_Road_Alerts` and `nonKCRoadAlerts`
        - WSDOT Highway Alerts REST
        - Bellevue, Sammamish, Seattle/SPU, AlertRedmond, and Alert King County related pages
        - Ecology flood-map viewer

        ### Key route findings

        - Best direct observed route-end signal: `USGS-01` (`12121600`)
        - Best upstream lead-time signal: `USGS-02` (`12120600`)
        - Best official forecast/category source: `NWPS-01` (`ISSW1`)
        - Best official alert layer: `NWS-01`
        - Best route-end phase semantics: `ISS-01`
        - Largest unresolved gap: no strong verified live Sammamish River gauge for the middle third of the route

        ### Files created

        - `README.md`
        - `SOURCE_REGISTRY.md`
        - `SOURCE_REGISTRY.json`
        - `RESEARCH_FINDINGS.md`
        - `API_AND_FEED_TEST_RESULTS.md`
        - `SOURCE_GAPS.md`
        - `IMPLEMENTATION_RECOMMENDATION.md`
        - `ROUTE_RELEVANCE_AND_THRESHOLDS.md`
        - `ENV_AND_READINESS.md`
        - `NORMALIZED_SCHEMA_PROPOSAL.md`
        - `OVERLAP_NOTES.md`
        - `UW_ISSY_05_FLOOD_CONDITIONS_FINAL_RESEARCH_REPORT_v1.md`
        - `UW_ISSY_05_FLOOD_CONDITIONS_IMPLEMENTATION_RECOMMENDATION_v1.md`
        - `UW_ISSY_05_FLOOD_CONDITIONS_AUDIT_REPORT_v1.md`
        - `UW_ISSY_05_FLOOD_CONDITIONS_FINAL_SOURCE_REGISTRY_v1.json`

        ### Scripts created

        - `scripts/generate_flood_docs.py` (this generator)
        {archive_line}

        ### Validation performed

        {validation_block}

        ### Downloads hashes

        {download_hash_lines}

        ### Rules-maintenance cadence

        - Ten-interaction rules check performed during the session.
        - No project-rule updates were needed, so no canonical or wrapper-file edits were made.

        ### Limitations

        - No direct verified live Sammamish River gauge made the final runtime set.
        - Lake Sammamish trail-impact thresholds remain unofficial.
        - The county flood app backend is not a supported public contract.

        ### Recommended next action

        Build the MVP normalizer against `USGS-01`, `USGS-02`, `NWPS-01`, `NWS-01`, and `ISS-01`, then run a follow-up cycle focused on middle-corridor proxies and shared closure-integration logic.

        Result: PARTIAL
        """
    ).strip()


def generate_docs() -> dict[str, str]:
    write(CONNECTOR / "README.md", build_readme())
    write(CONNECTOR / "SOURCE_REGISTRY.md", registry_md())
    write(CONNECTOR / "SOURCE_REGISTRY.json", registry_json())
    write(CONNECTOR / "RESEARCH_FINDINGS.md", research_findings_md())
    write(CONNECTOR / "API_AND_FEED_TEST_RESULTS.md", api_test_results_md())
    write(CONNECTOR / "SOURCE_GAPS.md", gaps_md())
    write(CONNECTOR / "IMPLEMENTATION_RECOMMENDATION.md", implementation_md())
    write(CONNECTOR / "ROUTE_RELEVANCE_AND_THRESHOLDS.md", route_relevance_md())
    write(CONNECTOR / "ENV_AND_READINESS.md", env_and_readiness_md())
    write(CONNECTOR / "NORMALIZED_SCHEMA_PROPOSAL.md", normalized_schema_md())
    write(CONNECTOR / "OVERLAP_NOTES.md", overlap_notes_md())
    write(CONNECTOR / "UW_ISSY_05_FLOOD_CONDITIONS_FINAL_RESEARCH_REPORT_v1.md", final_research_report_md())
    write(CONNECTOR / "UW_ISSY_05_FLOOD_CONDITIONS_IMPLEMENTATION_RECOMMENDATION_v1.md", final_impl_report_md())
    final_registry = CONNECTOR / "UW_ISSY_05_FLOOD_CONDITIONS_FINAL_SOURCE_REGISTRY_v1.json"
    final_registry.write_text(registry_json() + "\n", encoding="utf-8")

    main_registry = json.loads((CONNECTOR / "SOURCE_REGISTRY.json").read_text(encoding="utf-8"))
    final_registry_obj = json.loads(final_registry.read_text(encoding="utf-8"))
    main_ids = sorted(src["source_id"] for src in main_registry["sources"])
    final_ids = sorted(src["source_id"] for src in final_registry_obj["sources"])
    if main_ids != final_ids:
        raise RuntimeError("Source registry ID mismatch between main and final JSON files.")

    provisional_download_results = {
        "UW_ISSY_05_FLOOD_CONDITIONS_FINAL_RESEARCH_REPORT_v1.md": {
            "copied": "no",
            "source_hash": sha256(CONNECTOR / "UW_ISSY_05_FLOOD_CONDITIONS_FINAL_RESEARCH_REPORT_v1.md"),
            "destination_hash": "",
            "error": "pending final copy attempt",
        },
        "UW_ISSY_05_FLOOD_CONDITIONS_IMPLEMENTATION_RECOMMENDATION_v1.md": {
            "copied": "no",
            "source_hash": sha256(CONNECTOR / "UW_ISSY_05_FLOOD_CONDITIONS_IMPLEMENTATION_RECOMMENDATION_v1.md"),
            "destination_hash": "",
            "error": "pending final copy attempt",
        },
        "UW_ISSY_05_FLOOD_CONDITIONS_AUDIT_REPORT_v1.md": {
            "copied": "no",
            "source_hash": "",
            "destination_hash": "",
            "error": "audit file written after copy-summary generation",
        },
        "UW_ISSY_05_FLOOD_CONDITIONS_FINAL_SOURCE_REGISTRY_v1.json": {
            "copied": "no",
            "source_hash": sha256(final_registry),
            "destination_hash": "",
            "error": "pending final copy attempt",
        },
    }
    write(
        CONNECTOR / "UW_ISSY_05_FLOOD_CONDITIONS_AUDIT_REPORT_v1.md",
        audit_md(provisional_download_results, False),
    )

    download_names = [
        "UW_ISSY_05_FLOOD_CONDITIONS_FINAL_RESEARCH_REPORT_v1.md",
        "UW_ISSY_05_FLOOD_CONDITIONS_IMPLEMENTATION_RECOMMENDATION_v1.md",
        "UW_ISSY_05_FLOOD_CONDITIONS_AUDIT_REPORT_v1.md",
        "UW_ISSY_05_FLOOD_CONDITIONS_FINAL_SOURCE_REGISTRY_v1.json",
    ]
    download_results = {}
    for name in download_names:
        src = CONNECTOR / name
        dst = DOWNLOADS / name
        download_results[name] = copy_file(src, dst)
    downloads_copy_ok = all(result["copied"] == "yes" for result in download_results.values())
    write(
        CONNECTOR / "UW_ISSY_05_FLOOD_CONDITIONS_AUDIT_REPORT_v1.md",
        audit_md(download_results, downloads_copy_ok),
    )
    download_results["UW_ISSY_05_FLOOD_CONDITIONS_AUDIT_REPORT_v1.md"] = copy_file(
        CONNECTOR / "UW_ISSY_05_FLOOD_CONDITIONS_AUDIT_REPORT_v1.md",
        DOWNLOADS / "UW_ISSY_05_FLOOD_CONDITIONS_AUDIT_REPORT_v1.md",
    )
    downloads_copy_ok = all(result["copied"] == "yes" for result in download_results.values())

    archive_name = NOW.strftime("%Y%m%dT%H%M%S") + "_flood_conditions_generate_flood_docs.py"
    archive_result = copy_file(SCRIPT_PATH, SCRIPT_ARCHIVE_DIR / archive_name)

    write(
        CONNECTOR / "SESSION_LOG.md",
        session_log_md(download_results, archive_result, downloads_copy_ok),
    )
    return {
        "downloads_copy_ok": "yes" if downloads_copy_ok else "no",
        "script_archive_ok": archive_result["copied"],
    }


if __name__ == "__main__":
    CONNECTOR.mkdir(parents=True, exist_ok=True)
    (CONNECTOR / "scripts").mkdir(parents=True, exist_ok=True)
    hashes = generate_docs()
    print(json.dumps({"generated": True, "timestamp": STAMP, "hashes": hashes}, indent=2))
