from slackclient import SlackClient
import numpy as np
import os
from chalice import Chalice
import json
import boto3
from chalicelib import db
from chalicelib import veoride as vr
from decimal import Decimal

app = Chalice(app_name='veloassist')
app.debug = True

_STATIONS_DB = None


def get_media_db():
    global _STATIONS_DB
    if _STATIONS_DB is None:
        #pylint: disable=no-member
        _STATIONS_DB = db.DynamoStationsDB(
            boto3.resource('dynamodb').Table(
                os.environ['STATIONS_TABLE_NAME']))
    return _STATIONS_DB


slack_token = os.environ.get('SLACK_API_KEY')
sc = SlackClient(slack_token)


# API Endpoints
@app.route('/', cors=True)
def hello_world():
    return {'hello': 'world'}


@app.route('/station/{id}', methods=['GET', 'POST', 'DELETE'], cors=True)
def station(id):
    request = app.current_request
    if request.method == 'GET':
        try:
            station = get_media_db().get_station(id)
            return {'data': station}
        except Exception as e:
            return {'error': str(e)}
    elif request.method == 'POST':
        station = request.json_body
        get_media_db().add_station(station)
        return {'success': True}
    elif request.method == 'DELETE':
        get_media_db().delete_station(id)
        return {'success': True}


@app.route('/slack_message', methods=['POST'], cors=True)
def post_slack_message():
    request = app.current_request
    data = request.json_body
    try:
        response = sc.api_call(
            "chat.postMessage",
            channel="#bike-share",
            text=data['text'])
        if not response['ok']:
            return {'success': False, 'error': response['error']}
    except Exception as e:
        return {'success': False, 'error': e}
    return {'success': True}


# API Endpoint Highlevel
@app.route('/bikes_stations', methods=['GET'], cors=True)
def get_bikes_and_stations_http():
    # get bikes in College Station
    cs = (30.617592, -96.338644)
    bikes = vr.get_bikes_core(*cs)
    # get stations
    stations = get_media_db().list_stations()
    # tag bikes
    bike_tags = vr.tag_bikes(stations, bikes)
    # get/set station occupancies
    stations = vr.get_station_occupancies(bike_tags, stations)
    # get/set station fills
    stations = vr.get_station_fill(stations)
    # add data to objects
    bikes = [{**b, 'station': tag} for b, tag in zip(bikes, bike_tags)]
    response = {'data': vr.np_dumps({'bikes': bikes, 'stations': stations})}
    return response
