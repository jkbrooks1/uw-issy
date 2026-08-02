import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const REPO_ROOT = join(__dirname, "..", "..");
const VALIDATE_SCRIPT = join(REPO_ROOT, "scripts", "validate-route-source.mjs");
const CONVERT_SCRIPT = join(REPO_ROOT, "scripts", "convert-route-gpx-to-geojson.mjs");
const REAL_GPX = join(REPO_ROOT, "data", "route", "UnivWA-Issaquah.gpx");

function runNode(script: string, args: string[]): { status: number; stdout: string; stderr: string } {
  try {
    const stdout = execFileSync("node", [script, ...args], { encoding: "utf8" });
    return { status: 0, stdout, stderr: "" };
  } catch (err) {
    const e = err as { status: number; stdout: string; stderr: string };
    return { status: e.status, stdout: e.stdout?.toString() ?? "", stderr: e.stderr?.toString() ?? "" };
  }
}

function writeFixture(dir: string, name: string, contents: string): string {
  const path = join(dir, name);
  writeFileSync(path, contents, "utf8");
  return path;
}

const VALID_GPX = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1"><metadata><name>fixture</name></metadata>
<trk><name>track-1</name><trkseg>
<trkpt lat="47.60" lon="-122.20"><ele>10</ele></trkpt>
<trkpt lat="47.61" lon="-122.21"><ele>11</ele></trkpt>
</trkseg></trk></gpx>`;

const INVALID_XML_GPX = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1"><trk><name>broken</trk><trkseg>
<trkpt lat="47.60" lon="-122.20"></trkpt>
</trkseg></gpx>`;

const EMPTY_ROUTE_GPX = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1"><trk><name>empty</name><trkseg>
</trkseg></trk></gpx>`;

const BAD_LATITUDE_GPX = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1"><trk><name>bad-lat</name><trkseg>
<trkpt lat="97.00" lon="-122.20"></trkpt>
<trkpt lat="47.61" lon="-122.21"></trkpt>
</trkseg></trk></gpx>`;

const BAD_LONGITUDE_GPX = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1"><trk><name>bad-lon</name><trkseg>
<trkpt lat="47.60" lon="-190.20"></trkpt>
<trkpt lat="47.61" lon="-122.21"></trkpt>
</trkseg></trk></gpx>`;

const IMPLAUSIBLE_BOUNDS_GPX = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1"><trk><name>far-away</name><trkseg>
<trkpt lat="10.00" lon="10.00"></trkpt>
<trkpt lat="10.01" lon="10.01"></trkpt>
</trkseg></trk></gpx>`;

const MULTI_TRACK_GPX = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1"><metadata><name>multi</name></metadata>
<trk><name>segment-a</name><trkseg>
<trkpt lat="47.60" lon="-122.20"><ele>10</ele></trkpt>
<trkpt lat="47.61" lon="-122.21"><ele>11</ele></trkpt>
</trkseg></trk>
<trk><name>segment-b</name><trkseg>
<trkpt lat="47.62" lon="-122.22"><ele>12</ele></trkpt>
<trkpt lat="47.63" lon="-122.23"><ele>13</ele></trkpt>
</trkseg></trk></gpx>`;

describe("validate-route-source.mjs", () => {
  it("fails when the GPX file does not exist", () => {
    const result = runNode(VALIDATE_SCRIPT, [join(tmpdir(), "does-not-exist.gpx")]);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/does not exist/);
  });

  it("passes for a valid GPX fixture", () => {
    const dir = mkdtempSync(join(tmpdir(), "route-test-"));
    try {
      const path = writeFixture(dir, "valid.gpx", VALID_GPX);
      const result = runNode(VALIDATE_SCRIPT, [path]);
      expect(result.status).toBe(0);
      expect(result.stdout).toMatch(/^PASS:/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("fails on invalid XML", () => {
    const dir = mkdtempSync(join(tmpdir(), "route-test-"));
    try {
      const path = writeFixture(dir, "invalid.gpx", INVALID_XML_GPX);
      const result = runNode(VALIDATE_SCRIPT, [path]);
      expect(result.status).not.toBe(0);
      expect(result.stderr).toMatch(/not valid XML/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("fails on an empty route", () => {
    const dir = mkdtempSync(join(tmpdir(), "route-test-"));
    try {
      const path = writeFixture(dir, "empty.gpx", EMPTY_ROUTE_GPX);
      const result = runNode(VALIDATE_SCRIPT, [path]);
      expect(result.status).not.toBe(0);
      expect(result.stderr).toMatch(/no usable route/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("fails on a bad latitude", () => {
    const dir = mkdtempSync(join(tmpdir(), "route-test-"));
    try {
      const path = writeFixture(dir, "bad-lat.gpx", BAD_LATITUDE_GPX);
      const result = runNode(VALIDATE_SCRIPT, [path]);
      expect(result.status).not.toBe(0);
      expect(result.stderr).toMatch(/invalid latitude/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("fails on a bad longitude", () => {
    const dir = mkdtempSync(join(tmpdir(), "route-test-"));
    try {
      const path = writeFixture(dir, "bad-lon.gpx", BAD_LONGITUDE_GPX);
      const result = runNode(VALIDATE_SCRIPT, [path]);
      expect(result.status).not.toBe(0);
      expect(result.stderr).toMatch(/invalid longitude/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("fails when bounds are implausible for the UW-Issaquah route", () => {
    const dir = mkdtempSync(join(tmpdir(), "route-test-"));
    try {
      const path = writeFixture(dir, "far-away.gpx", IMPLAUSIBLE_BOUNDS_GPX);
      const result = runNode(VALIDATE_SCRIPT, [path]);
      expect(result.status).not.toBe(0);
      expect(result.stderr).toMatch(/not plausible/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("passes for a GPX with multiple tracks", () => {
    const dir = mkdtempSync(join(tmpdir(), "route-test-"));
    try {
      const path = writeFixture(dir, "multi.gpx", MULTI_TRACK_GPX);
      const result = runNode(VALIDATE_SCRIPT, [path]);
      expect(result.status).toBe(0);
      expect(result.stdout).toMatch(/2 track\(s\)/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("passes for the real canonical GPX with the expected UW-Issaquah bounds", () => {
    const result = runNode(VALIDATE_SCRIPT, [REAL_GPX]);
    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(/plausible for UW-Issaquah/);
    const boundsMatch = result.stdout.match(
      /bounds \[([\d.-]+), ([\d.-]+)\] to \[([\d.-]+), ([\d.-]+)\]/,
    );
    expect(boundsMatch).not.toBeNull();
    const [, minLat, minLon, maxLat, maxLon] = boundsMatch as unknown as string[];
    expect(Number(minLat)).toBeGreaterThan(47);
    expect(Number(maxLat)).toBeLessThan(48);
    expect(Number(minLon)).toBeLessThan(-121.9);
    expect(Number(maxLon)).toBeGreaterThan(-122.4);
  });
});

describe("convert-route-gpx-to-geojson.mjs", () => {
  it("fails when the source GPX is invalid", () => {
    const dir = mkdtempSync(join(tmpdir(), "convert-test-"));
    try {
      const inPath = writeFixture(dir, "invalid.gpx", INVALID_XML_GPX);
      const outPath = join(dir, "out.geojson");
      const result = runNode(CONVERT_SCRIPT, [inPath, outPath]);
      expect(result.status).not.toBe(0);
      expect(result.stderr).toMatch(/not valid XML/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("fails and produces no output for an empty route", () => {
    const dir = mkdtempSync(join(tmpdir(), "convert-test-"));
    try {
      const inPath = writeFixture(dir, "empty.gpx", EMPTY_ROUTE_GPX);
      const outPath = join(dir, "out.geojson");
      const result = runNode(CONVERT_SCRIPT, [inPath, outPath]);
      expect(result.status).not.toBe(0);
      expect(result.stderr).toMatch(/no usable track segment/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("converts a valid single-segment GPX to a LineString feature", () => {
    const dir = mkdtempSync(join(tmpdir(), "convert-test-"));
    try {
      const inPath = writeFixture(dir, "valid.gpx", VALID_GPX);
      const outPath = join(dir, "out.geojson");
      const result = runNode(CONVERT_SCRIPT, [inPath, outPath]);
      expect(result.status).toBe(0);
      const geojson = JSON.parse(readFileSync(outPath, "utf8"));
      expect(geojson.type).toBe("FeatureCollection");
      expect(geojson.features).toHaveLength(1);
      expect(geojson.features[0].geometry.type).toBe("LineString");
      expect(geojson.features[0].geometry.coordinates).toHaveLength(2);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("converts a multi-track GPX to a MultiLineString feature without inventing segments", () => {
    const dir = mkdtempSync(join(tmpdir(), "convert-test-"));
    try {
      const inPath = writeFixture(dir, "multi.gpx", MULTI_TRACK_GPX);
      const outPath = join(dir, "out.geojson");
      const result = runNode(CONVERT_SCRIPT, [inPath, outPath]);
      expect(result.status).toBe(0);
      const geojson = JSON.parse(readFileSync(outPath, "utf8"));
      const geometry = geojson.features[0].geometry;
      expect(geometry.type).toBe("MultiLineString");
      expect(geometry.coordinates).toHaveLength(2);
      expect(geometry.coordinates[0]).toHaveLength(2);
      expect(geometry.coordinates[1]).toHaveLength(2);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("produces the expected bounds and point count for the real canonical GPX", () => {
    const dir = mkdtempSync(join(tmpdir(), "convert-test-"));
    try {
      const outPath = join(dir, "out.geojson");
      const result = runNode(CONVERT_SCRIPT, [REAL_GPX, outPath]);
      expect(result.status).toBe(0);
      const geojson = JSON.parse(readFileSync(outPath, "utf8"));
      const coords = geojson.features[0].geometry.coordinates as number[][];
      expect(coords.length).toBeGreaterThan(1000);
      const lats: number[] = coords.map((c) => c[1]!);
      const lons: number[] = coords.map((c) => c[0]!);
      expect(Math.min(...lats)).toBeGreaterThan(47);
      expect(Math.max(...lats)).toBeLessThan(48);
      expect(Math.min(...lons)).toBeLessThan(-121.9);
      expect(Math.max(...lons)).toBeGreaterThan(-122.4);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("produces byte-identical output when run twice on the same input (repeatable)", () => {
    const dir = mkdtempSync(join(tmpdir(), "convert-test-"));
    try {
      const inPath = writeFixture(dir, "valid.gpx", VALID_GPX);
      const outPath1 = join(dir, "out1.geojson");
      const outPath2 = join(dir, "out2.geojson");
      runNode(CONVERT_SCRIPT, [inPath, outPath1]);
      runNode(CONVERT_SCRIPT, [inPath, outPath2]);
      const bytes1 = readFileSync(outPath1);
      const bytes2 = readFileSync(outPath2);
      expect(bytes1.equals(bytes2)).toBe(true);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
