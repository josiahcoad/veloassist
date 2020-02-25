from awsapp.chalicelib import db
import boto3

_STATIONS_DB = None

def get_media_db():
    global _STATIONS_DB
    if _STATIONS_DB is None:
        #pylint: disable=no-member
        _STATIONS_DB = db.DynamoStationsDB(
            boto3.resource('dynamodb').Table(
                'stations-query-StationsTable-12LTJH01XUL9K'))
    return _STATIONS_DB

id = 123456789
get_media_db().delete_station(id)
