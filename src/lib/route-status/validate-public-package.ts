import type { PublicPackage, RouteEventFeature } from "./types";

const VALID_GEOMETRY_TYPES = new Set([
  "Point",
  "LineString",
  "MultiLineString",
  "Polygon",
  "MultiPolygon",
]);

export type PackageFileName =
  | "dashboard-data.json"
  | "route-events.geojson"
  | "system-health.json"
  | "release-manifest.json";

export type PackageProblem = {
  file: PackageFileName;
  code: string;
  message: string;
};

function checkRequiredFields(
  file: PackageFileName,
  record: Record<string, unknown>,
  requiredFields: readonly string[],
): PackageProblem[] {
  const problems: PackageProblem[] = [];
  for (const field of requiredFields) {
    if (!(field in record) || record[field] === undefined) {
      problems.push({
        file,
        code: "missing_required_field",
        message: `${file} is missing required field "${field}"`,
      });
    }
  }
  return problems;
}

function validateEventGeometry(file: PackageFileName, feature: RouteEventFeature): PackageProblem[] {
  const problems: PackageProblem[] = [];
  const geometry = feature.geometry;
  if (geometry === null) {
    return problems;
  }
  if (!VALID_GEOMETRY_TYPES.has(geometry.type)) {
    problems.push({
      file,
      code: "bad_event_geometry",
      message: `Event "${feature.id}" has unsupported geometry type "${geometry.type}" (buildspec 23.4)`,
    });
  }
  return problems;
}

/**
 * Checks that the four loaded public package files satisfy the buildspec
 * section 9 contract. Returns a typed list of problems; never throws.
 */
export function validatePublicPackage(pkg: PublicPackage): PackageProblem[] {
  const problems: PackageProblem[] = [];

  problems.push(
    ...checkRequiredFields(
      "dashboard-data.json",
      pkg.dashboardData as unknown as Record<string, unknown>,
      ["schemaVersion", "releaseId", "assembledAt", "routeId", "routeName", "displayTier", "activeEventCount"],
    ),
  );

  problems.push(
    ...checkRequiredFields(
      "system-health.json",
      pkg.systemHealth as unknown as Record<string, unknown>,
      ["schemaVersion", "releaseId", "assembledAt", "lanes", "assemblyState", "publicationState"],
    ),
  );

  problems.push(
    ...checkRequiredFields(
      "release-manifest.json",
      pkg.releaseManifest as unknown as Record<string, unknown>,
      ["releaseId", "assembledAt", "schemaVersion", "sourceGitCommit"],
    ),
  );

  if (pkg.routeEvents.type !== "FeatureCollection" || !Array.isArray(pkg.routeEvents.features)) {
    problems.push({
      file: "route-events.geojson",
      code: "invalid_feature_collection",
      message: "route-events.geojson is not a valid GeoJSON FeatureCollection",
    });
  } else {
    for (const feature of pkg.routeEvents.features) {
      problems.push(...validateEventGeometry("route-events.geojson", feature));
    }
  }

  // Buildspec 32.3 — the release ID must match across all four files.
  const releaseIds = new Set([
    pkg.dashboardData.releaseId,
    pkg.systemHealth.releaseId,
    pkg.releaseManifest.releaseId,
    pkg.routeEvents.releaseId,
  ]);
  if (releaseIds.size > 1) {
    problems.push({
      file: "release-manifest.json",
      code: "mismatched_release_id",
      message: `Release IDs do not match across the four files: ${Array.from(releaseIds).join(", ")}`,
    });
  }

  return problems;
}
