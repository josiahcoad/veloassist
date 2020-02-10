from slackclient import SlackClient
from flask import Flask, jsonify, request
import numpy as np
from scipy.spatial.distance import cdist
import json
app = Flask(__name__)

database_uri = 'stations.json'

slack_token = "xoxb-940798258294-938614448069-Zh1bacFPLBDaWRhBDauqh4Jn"
sc = SlackClient(slack_token)


def build_notification_text(station):
    return "Too many bikes at " + station


def post_slack_message(text):
    sc.api_call(
        "chat.postMessage",
        channel="#bike-share",
        text=text)


def tag_bikes(stations, buffers, bikes):
    buffers = np.array(buffers).reshape(-1, 1)
    dists = cdist(stations, bikes)
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


def read_database():
    with open(database_uri) as file:
        return json.loads(file.read())


def write_database(data):
    with open(database_uri, 'w') as file:
        file.write(data)


def update_database(update):
    items = read_database()
    new_items = [item if item.id != update.id else update for item in items]
    write_database(new_items)


def get_stations():
    stations = read_database()
    return jsonify({'data': stations}), 200


def write_stations(stations):
    write_database(stations)
    return jsonify({'success': True}), 200


def update_station(station):
    update_database(station)
    return jsonify({'success': True}), 200


@app.route('/')
def test():
    return 'working'


@app.route('/stations', methods=['GET', 'POST', 'PUT'])
def stations():
    if request.method == 'GET':
        return get_stations()
    elif request.method == 'POST':
        stations = request.json
        return write_stations(stations)
    elif request.method == 'PUT':
        station = request.json
        return update_station(station)


@app.route('/bike_tags', methods=['POST'])
def bike_tags():
    data = request.json
    stations, buffers, bikes = data['stations'], data['buffers'], data['bikes']
    bike_tags = tag_bikes(stations, buffers, bikes)
    return bike_tags


@app.route('/station_counts', methods=['POST'])
def station_counts():
    data = request.json
    stations, buffers, bikes = data['stations'], data['buffers'], data['bikes']
    bike_tags = tag_bikes(stations, buffers, bikes)
    return get_station_counts(bike_tags)
