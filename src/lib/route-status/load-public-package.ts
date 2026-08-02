import type {
  DashboardDataFile,
  PublicPackage,
  ReleaseManifestFile,
  RouteEventsFile,
  SystemHealthFile,
} from "./types";

/** Buildspec section 9.3 — same-origin browser URLs for the four public package files. */
export const PUBLIC_PACKAGE_URLS = {
  dashboardData: "/data/dashboard-data.json",
  routeEvents: "/data/route-events.geojson",
  systemHealth: "/data/system-health.json",
  releaseManifest: "/data/release-manifest.json",
} as const;

export type PublicPackageLoadSuccess = {
  ok: true;
  data: PublicPackage;
};

export type PublicPackageLoadFailure = {
  ok: false;
  errors: string[];
};

export type PublicPackageLoadResult = PublicPackageLoadSuccess | PublicPackageLoadFailure;

async function loadJsonFile<T>(
  fetchImpl: typeof fetch,
  url: string,
): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  try {
    const response = await fetchImpl(url, { headers: { accept: "application/json" } });
    if (!response.ok) {
      return { ok: false, error: `${url} responded with HTTP ${response.status}` };
    }
    const data = (await response.json()) as T;
    return { ok: true, data };
  } catch (cause) {
    const reason = cause instanceof Error ? cause.message : String(cause);
    return { ok: false, error: `${url} could not be loaded: ${reason}` };
  }
}

/**
 * Fetches the four public package files by same-origin relative URL (buildspec 9.3).
 * Returns a typed success with all four files, or a typed failure listing every
 * file that could not be loaded — never throws.
 */
export async function loadPublicPackage(
  fetchImpl: typeof fetch = fetch,
): Promise<PublicPackageLoadResult> {
  const [dashboardData, routeEvents, systemHealth, releaseManifest] = await Promise.all([
    loadJsonFile<DashboardDataFile>(fetchImpl, PUBLIC_PACKAGE_URLS.dashboardData),
    loadJsonFile<RouteEventsFile>(fetchImpl, PUBLIC_PACKAGE_URLS.routeEvents),
    loadJsonFile<SystemHealthFile>(fetchImpl, PUBLIC_PACKAGE_URLS.systemHealth),
    loadJsonFile<ReleaseManifestFile>(fetchImpl, PUBLIC_PACKAGE_URLS.releaseManifest),
  ]);

  const errors: string[] = [];
  if (!dashboardData.ok) errors.push(dashboardData.error);
  if (!routeEvents.ok) errors.push(routeEvents.error);
  if (!systemHealth.ok) errors.push(systemHealth.error);
  if (!releaseManifest.ok) errors.push(releaseManifest.error);

  if (
    !dashboardData.ok ||
    !routeEvents.ok ||
    !systemHealth.ok ||
    !releaseManifest.ok
  ) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    data: {
      dashboardData: dashboardData.data,
      routeEvents: routeEvents.data,
      systemHealth: systemHealth.data,
      releaseManifest: releaseManifest.data,
    },
  };
}
