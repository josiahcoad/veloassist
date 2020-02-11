from slackclient import SlackClient
from flask import Flask, jsonify, request
import numpy as np
from os import environ
import json
import requests
from . import db
from . import veoride as vr

app = Flask(__name__)

slack_token = environ.get('SLACK_API_KEY')
assert slack_token is not None, 'Must supply a SLACK_API_KEY.'
sc = SlackClient(slack_token)

# API Endpoints
@app.route('/stations', methods=['GET', 'POST'])
def stations():
    if request.method == 'GET':
        stations = db.read_database()
        return jsonify({'data': stations}), 200
    elif request.method == 'POST':
        stations = request.json
        db.write_database(stations)
        return jsonify({'success': True}), 200


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


@app.route('/bike_tags', methods=['POST'])
def bike_tags():
    data = request.json
    # parse
    stations = data['stations']
    bikes = [(b['location']['lat'], b['location']['lng'])
             for b in data['bikes']]
    buffers = [station['radius'] for station in stations]
    centers = [(s['lat'], s['lng']) for s in stations]
    # compute
    bike_tags = vr.tag_bikes(centers, buffers, bikes)
    return jsonify({'data': vr.np_dumps(bike_tags)}), 200


@app.route('/station_counts', methods=['POST'])
def station_counts():
    data = request.json
    station_counts = vr.get_station_counts(data)
    return jsonify({'data': vr.np_dumps(station_counts)}), 200


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
