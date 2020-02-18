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


def get_bikes_core(lat, lng):
    header = {'Authorization': 'Bearer eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiIxOjU1MzQiLCJpYXQiOjE1Nzk5OTUzMTgsImV4cCI6MTU4Nzc3MTMxOH0.NNuurt6awK2ub3Athx0AqlIVNzTiWhZo_Xdi6zlrGXqDSJ17H2UIHpR8jtCiWC_XXgkQSWvpEsqgcesaSVlSnQ'}
    url = f'https://manhattan-host.veoride.com:8444/api/customers/vehicles?lat={lat}&lng={lng}'
    response = requests.get(url, headers=header)
    if response.status_code != 200:
        raise Exception('Error in calling veoride api')
    return response.json()['data']


@app.route('/bikes', methods=['GET'])
def get_bikes():
    lat = request.args.get('lat')
    lng = request.args.get('lng')
    if lat is None or lng is None:
        return jsonify({'error': 'Must provide lat and lng in query params'}), 400
    try:
        bikes = get_bikes_core(lat, lng)
    except Exception as e:
        return jsonify({'error': e}), 500
    return jsonify({'data': bikes}), 200


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
    # get bikes in College Station
    cs = (30.617592, -96.338644)
    bikes = get_bikes_core(*cs)
    # get stations
    stations = db.read_database()
    # tag bikes
    centers = [(s['lat'], s['lng']) for s in stations]
    buffers = [s['radius'] for s in stations]
    loc_bikes = [(b['location']['lat'], b['location']['lng']) for b in bikes]
    bike_tags = vr.tag_bikes(centers, buffers, loc_bikes)
    # get station occupancies
    station_ids = [s['id'] for s in stations]
    occupancies = vr.get_station_occupancies(bike_tags, station_ids)
    # add data to objects
    bikes = [{**b, 'station': tag} for b, tag in zip(bikes, bike_tags)]
    stations = [{**s, 'occupancy': occ}
                for s, occ in zip(stations, occupancies)]
    return jsonify({'data': vr.np_dumps({'bikes': bikes, 'stations': stations})}), 200
