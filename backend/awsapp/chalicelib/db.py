from functools import reduce
import simplejson as json
from boto3.dynamodb.conditions import Attr
from decimal import Decimal


class StationsDB(object):
    def list_stations(self, label=None):
        pass

    def add_station(self, name, station_type, labels=None):
        pass

    def get_station(self, name):
        pass

    def delete_station(self, name):
        pass


class DynamoStationsDB(StationsDB):
    def __init__(self, table_resource):
        self._table = table_resource

    def list_stations(self, station_type=None):
        scan_params = {}
        filter_expression = None
        if station_type is not None:
            filter_expression = self._add_to_filter_expression(
                filter_expression, Attr('type').eq(station_type)
            )
        if filter_expression:
            scan_params['FilterExpression'] = filter_expression
        response = self._table.scan(**scan_params)
        return json.loads(json.dumps(response['Items'], use_decimal=True))

    def add_station(self, station):
        # station must have id
        station = json.loads(json.dumps(station), parse_float=Decimal)
        self._table.put_item(Item=station)

    def get_station(self, id):
        response = self._table.get_item(
            Key={
                'id': id,
            },
        )
        return json.loads(json.dumps(response.get('Item'), use_decimal=True))

    def delete_station(self, id):
        self._table.delete_item(
            Key={
                'id': id,
            }
        )

    def _add_to_filter_expression(self, expression, condition):
        if expression is None:
            return condition
        return expression & condition
