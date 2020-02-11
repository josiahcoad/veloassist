import math
import numpy as np
from scipy.spatial.distance import cdist
import json

# Distance between two lat/lng points in meters
def haversine(coord1, coord2):
    R = 6372800  # Earth radius in meters
    lat1, lon1 = coord1
    lat2, lon2 = coord2

    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)

    a = math.sin(dphi/2)**2 + \
        math.cos(phi1)*math.cos(phi2)*math.sin(dlambda/2)**2

    return 2*R*math.atan2(math.sqrt(a), math.sqrt(1 - a))


# JSON Serialize Numpy
class NpEncoder(json.JSONEncoder):
    # pylint: disable=method-hidden
    def default(self, obj):
        if isinstance(obj, np.integer):
            return int(obj)
        elif isinstance(obj, np.floating):
            return float(obj)
        elif isinstance(obj, np.ndarray):
            return obj.tolist()
        else:
            return super(NpEncoder, self).default(obj)


def np_dumps(data):
    return json.loads(json.dumps(data, cls=NpEncoder))


# Core functionality
def tag_bikes(stations, buffers, bikes):
    buffers = np.array(buffers).reshape(-1, 1)
    dists = cdist(stations, bikes, haversine)
    in_buffer = dists <= buffers
    masked = np.where(in_buffer, dists, np.Inf)
    outliers = ~np.any(in_buffer, axis=0)
    closest_stations = np.argmin(masked, axis=0)
    bike_tags = np.where(outliers, -1, closest_stations)
    return bike_tags


def get_station_counts(bike_tags):
    count = np.zeros(max(bike_tags)+1).astype(np.int64)
    for x in bike_tags:
        if x != -1:  # -1 is the tag for an outlier
            count[x] += 1
    return count


def get_full_stations(stations, buffers, bikes, thresholds):
    bike_tags = tag_bikes(stations, buffers, bikes)
    station_counts = get_station_counts(bike_tags)
    return station_counts >= thresholds
