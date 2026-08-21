import json
import math

ROUTE_PATH = "/Users/jkbrookspersonal/LocalSiteBuildFiles/BTF_UW-Issy_Route_Monitor/public/routes/UnivWA-Issaquah.geojson"

R_EARTH = 6371000.0

def load_route():
    d = json.load(open(ROUTE_PATH))
    coords = d["features"][0]["geometry"]["coordinates"]
    return [(c[0], c[1]) for c in coords]

def to_local_xy(lon, lat, lon0, lat0):
    # equirectangular local projection, meters, valid for small regional extents
    x = math.radians(lon - lon0) * math.cos(math.radians(lat0)) * R_EARTH
    y = math.radians(lat - lat0) * R_EARTH
    return x, y

def point_segment_distance(px, py, ax, ay, bx, by):
    abx, aby = bx - ax, by - ay
    apx, apy = px - ax, py - ay
    ab2 = abx * abx + aby * aby
    if ab2 == 0:
        t = 0.0
    else:
        t = (apx * abx + apy * aby) / ab2
        t = max(0.0, min(1.0, t))
    cx, cy = ax + t * abx, ay + t * aby
    dx, dy = px - cx, py - cy
    return math.hypot(dx, dy)

def min_distance_to_route(lon, lat, route):
    lon0, lat0 = lon, lat
    px, py = 0.0, 0.0
    best = float("inf")
    prev = None
    for (rlon, rlat) in route:
        rx, ry = to_local_xy(rlon, rlat, lon0, lat0)
        if prev is not None:
            d = point_segment_distance(px, py, prev[0], prev[1], rx, ry)
            if d < best:
                best = d
        prev = (rx, ry)
    return best

def main():
    route = load_route()
    candidates = [
        ("Matthews Beach Bathhouse", -122.273312, 47.696373),
        ("Pathways Park", -122.281052, 47.667397),
        ("Gas Works Park", -122.333662, 47.646260),
        ("Magnuson Park - Sports Meadow", -122.253461, 47.680972),
        ("Magnuson Park - Beach", -122.246923, 47.680510),
        ("Magnuson Park - Play Area (CLOSED)", -122.258539, 47.681762),
        ("Laurelhurst Playfield / CC", -122.277867, 47.659076),
        ("University Playground", -122.319716, 47.664443),
        ("Ravenna Park Upper CS", -122.305605, 47.671526),
        ("Ravenna Park Lower SH", -122.302920, 47.669220),
        ("Tracy Owen Station / Log Boom Park", -122.26519773951055, 47.757809491886199),
        ("Rhododendron Park", -122.24839166194674, 47.751931177043566),
        ("Blyth Park", -122.20894995246699, 47.750530002208684),
        ("Park at Bothell Landing", -122.20721796131076, 47.758235518921872),
        ("Wilmot Gateway Park", -122.16660421621036, 47.753421964267062),
        ("Marymoor - pt1 (-122.119,47.662)", -122.119, 47.662),
        ("Marymoor - pt2 (-122.106,47.661)", -122.106, 47.661),
        ("Marymoor - pt3 (-122.113,47.665)", -122.113, 47.665),
        ("Marymoor - pt4 BEST/concessions (-122.114,47.665)", -122.114, 47.665),
        ("Marymoor - pt5 (-122.126,47.664)", -122.126, 47.664),
        ("Marymoor - pt6 (-122.121,47.666)", -122.121, 47.666),
        ("Marymoor - pt7 (-122.121,47.665)", -122.121, 47.665),
        ("Marymoor - pt8 (-122.117,47.663)", -122.117, 47.663),
        ("Marymoor - pt9 (-122.117,47.661)", -122.117, 47.661),
        ("Northshore Athletic Fields", -122.146, 47.735),
        ("Sixty Acres Park (park access pt, reduced confidence)", -122.140898, 47.704065),
    ]
    print(f"{'Candidate':45s} {'dist_m':>10s} {'dist_km':>9s}")
    for name, lon, lat in candidates:
        d = min_distance_to_route(lon, lat, route)
        print(f"{name:45s} {d:10.1f} {d/1000:9.3f}")

if __name__ == "__main__":
    main()
