from slackclient import SlackClient
import numpy as np
from os import environ
from chalice import Chalice
import json
from chalicelib import db
from chalicelib import veoride as vr


app = Chalice(app_name='veloassist')
app.debug = True

# slack_token = environ.get('SLACK_API_KEY')
# assert slack_token is not None, 'Must supply a SLACK_API_KEY.'
slack_token = "xoxb-940798258294-949827533862-tPo6OQ9jNUwzu0pSS6yHnVl7"
sc = SlackClient(slack_token)


# API Endpoints
@app.route('/')
def hello_world():
    return {'hello': 'world'}


@app.route('/station', methods=['GET', 'POST'])
def station():
    request = app.current_request
    if request.method == 'GET':
        id = request.json_body
        station = db.read_database_single(id)
        return {'data': station}
    elif request.method == 'POST':
        station = request.json_body
        db.update_database(station)
        return {'success': True}


@app.route('/slack_message', methods=['POST'])
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
@app.route('/bikes_stations', methods=['GET'])
def get_bikes_and_stations():
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
    response = {'data': vr.np_dumps({'bikes': bikes, 'stations': stations})}
    return response

