import json
database_uri = 'stations.json'


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
