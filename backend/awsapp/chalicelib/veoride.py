import math
import numpy as np
import json
import requests
from collections import Counter
# Distance between two lat/lng points in meters

import numpy as np


def dist(X, Y):
    dists = np.sqrt(-2 * np.dot(X, Y.T)
                    + np.sum(Y ** 2, axis=1)
                    + np.sum(X ** 2, axis=1)[:, np.newaxis])
    return dists


def latlng2xy(coords):
    lat, lng = coords.T
    R = 147000
    x = R*np.cos(lat)*np.cos(lng)
    y = R*np.cos(lat)*np.sin(lng)
    return np.array([x, y]).T


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


# ----------- Math -----------
def tag_bikes_core(stations, buffers, bikes):
    """Return the tag as an 0-based index into the stations array"""
    buffers = np.array(buffers).reshape(-1, 1)
    xystations = latlng2xy(np.array(stations))
    xybikes = latlng2xy(np.array(bikes))
    dists = dist(xystations, xybikes)
    in_buffer = dists <= buffers
    masked = np.where(in_buffer, dists, np.Inf)
    outliers = ~np.any(in_buffer, axis=0)
    closest_stations = np.argmin(masked, axis=0)
    bike_tags = np.where(outliers, -1, closest_stations)
    return bike_tags


def tag_bikes(stations, bikes):
    centers = [(s['lat'], s['lng']) for s in stations]
    buffers = [s['radius'] for s in stations]
    loc_bikes = [(b['location']['lat'], b['location']['lng']) for b in bikes]
    bike_tags = tag_bikes_core(centers, buffers, loc_bikes)
    return [None if tag == -1 else stations[tag]['id'] for tag in bike_tags]


def get_station_occupancies(bike_tags, stations):
    c = Counter(bike_tags)
    return [{**s, 'occupancy': c.get(s['id'], 0)} for s in stations]


def get_station_fill(stations):
    def f(s): return s['occupancy'] / s['capacity'] if s['capacity'] else 0
    return [{**s, 'fill': f(s)} for s in stations]


# Veoride API
def get_bikes_core(lat, lng):
    header = {'Authorization': 'Bearer eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiIxOjU1MzQiLCJpYXQiOjE1Nzk5OTUzMTgsImV4cCI6MTU4Nzc3MTMxOH0.NNuurt6awK2ub3Athx0AqlIVNzTiWhZo_Xdi6zlrGXqDSJ17H2UIHpR8jtCiWC_XXgkQSWvpEsqgcesaSVlSnQ'}
    url = f'https://manhattan-host.veoride.com:8444/api/customers/vehicles?lat={lat}&lng={lng}'
    response = requests.get(url, headers=header)
    if response.status_code != 200:
        raise Exception('Error in calling veoride api')
    return response.json()['data']
