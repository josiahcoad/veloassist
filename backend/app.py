from slackclient import SlackClient
from flask import Flask, jsonify, request
import numpy as np
from scipy.spatial.distance import cdist
app = Flask(__name__)


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


def get_stations():
    try:
        with open("stations.csv") as file:
            data = [[float(num) for num in line.split(',')] for line in file.readlines()]
            return jsonify({'data': data}), 200
    except Exception as e:
        return jsonify({'error': e}), 500

def write_stations(stations):
    print(stations)
    with open("stations.csv", "w") as file:
        file.write(stations)
    return jsonify({'success': True}), 200


@app.route('/')
def test():
    return 'working'


@app.route('/stations', methods=['GET', 'POST'])
def stations():
    if request.method == 'GET':
        return get_stations()
    else:
        stations = request.json
        return write_stations(stations)


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
