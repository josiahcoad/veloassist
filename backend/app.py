from slackclient import SlackClient
from flask import Flask, jsonify, request
import numpy as np
from os import environ
import json
from . import db
from . import veoride as vr
from time import perf_counter

app = Flask(__name__)

slack_token = environ.get('SLACK_API_KEY')
assert slack_token is not None, 'Must supply a SLACK_API_KEY.'
sc = SlackClient(slack_token)


@app.route('/station', methods=['GET', 'POST'])
def station():
    if request.method == 'GET':
        id = request.json
        station = db.read_database_single(id)
        return jsonify({'data': station}), 200
    elif request.method == 'POST':
        station = request.json
        db.update_database(station)
        return jsonify({'success': True}), 200


@app.route('/slack_message', methods=['POST'])
def post_slack_message():
    data = request.json
    try:
        response = sc.api_call(
            "chat.postMessage",
            channel="#bike-share",
            text=data['text'])
        if not response['ok']:
            return jsonify({'success': False, 'error': response['error']}), 500
    except Exception as e:
        return jsonify({'success': False, 'error': e}), 500
    return jsonify({'success': True}), 200


# API Endpoint Highlevel
@app.route('/bikes_stations', methods=['GET'])
def get_bikes_and_stations():
    start = perf_counter()
    # get bikes in College Station
    cs = (30.617592, -96.338644)
    bikes = vr.get_bikes_core(*cs)
    # get stations
    stations = db.read_database()
    # tag bikes
    bike_tags = vr.tag_bikes(stations, bikes)
    # get/set station occupancies
    stations = vr.get_station_occupancies(bike_tags, stations)
    # get/set station fills
    stations = vr.get_station_fill(stations)
    # add data to objects
    bikes = [{**b, 'station': tag} for b, tag in zip(bikes, bike_tags)]
    end = perf_counter()
    print("Time is:", round(end-start, 2))
    return jsonify({'data': vr.np_dumps({'bikes': bikes, 'stations': stations})}), 200
