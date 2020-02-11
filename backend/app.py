from slackclient import SlackClient
from flask import Flask, jsonify, request
import numpy as np
from scipy.spatial.distance import cdist
import math
from os import environ
import json
import requests
app = Flask(__name__)

database_uri = 'stations.json'

slack_token = environ.get('SLACK_API_KEY')
assert slack_token is not None, 'Must supply a SLACK_API_KEY.'
sc = SlackClient(slack_token)


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


# Database Utils
def read_database():
    with open(database_uri) as file:
        content = file.read()
    return json.loads(content or '{}')


def read_database_single(id):
    items = read_database()
    matched = [item for item in items if item['id'] == id]
    return matched[0] if len(matched) > 0 else None


def write_database(data):
    with open(database_uri, 'w') as file:
        file.write(data)


def update_database(update):
    items = read_database()
    new_items = [update if item['id'] ==
                 update['id'] else item for item in items]
    write_database(json.dumps(new_items, indent=2))


# API Endpoints
@app.route('/stations', methods=['GET', 'POST'])
def stations():
    if request.method == 'GET':
        stations = read_database()
        return jsonify({'data': stations}), 200
    elif request.method == 'POST':
        stations = request.json
        write_database(stations)
        return jsonify({'success': True}), 200


@app.route('/station', methods=['GET', 'POST'])
def station():
    if request.method == 'GET':
        id = request.json
        station = read_database_single(id)
        return jsonify({'data': station}), 200
    elif request.method == 'POST':
        station = request.json
        update_database(station)
        return jsonify({'success': True}), 200


@app.route('/bikes', methods=['GET'])
def get_bikes():
    lat = request.args.get('lat')
    lng = request.args.get('lng')
    if lat is None or lng is None:
        return jsonify({'error': 'Must provide lat and lng in query params'}), 400
    header = {'Authorization': 'Bearer eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiIxOjU1MzQiLCJpYXQiOjE1Nzk5OTUzMTgsImV4cCI6MTU4Nzc3MTMxOH0.NNuurt6awK2ub3Athx0AqlIVNzTiWhZo_Xdi6zlrGXqDSJ17H2UIHpR8jtCiWC_XXgkQSWvpEsqgcesaSVlSnQ'}
    url = f'https://manhattan-host.veoride.com:8444/api/customers/vehicles?lat={lat}&lng={lng}'
    response = requests.get(url, headers=header)
    if response.status_code != 200:
        return jsonify({'error': 'Error in calling veoride api'}), 500
    body = response.json()
    return jsonify({'data': body['data']}), 200


def get_bike_tags(data):
    # parse
    stations = data['stations']
    bikes = [(b['location']['lat'], b['location']['lng'])
             for b in data['bikes']]
    buffers = [station['radius'] for station in stations]
    centers = [(s['lat'], s['lng']) for s in stations]
    # compute
    return tag_bikes(centers, buffers, bikes)


@app.route('/bike_tags', methods=['POST'])
def bike_tags():
    data = request.json
    bike_tags = get_bike_tags(data)
    return jsonify({'data': np_dumps(bike_tags)}), 200


@app.route('/station_counts', methods=['POST'])
def station_counts():
    data = request.json
    station_counts = get_station_counts(data)
    return jsonify({'data': np_dumps(station_counts)}), 200


@app.route('/slack_message', methods=['POST'])
def post_slack_message():
    data = request.json
    try:
        response = sc.api_call(
            "chat.postMessage",
            channel="#bike-share",
            text="Too many bikes at " + data['station'])
        if not response['ok']:
            return jsonify({'success': False, 'error': response['error']}), 500
    except Exception as e:
        return jsonify({'success': False, 'error': e}), 500
    return jsonify({'success': True}), 200
