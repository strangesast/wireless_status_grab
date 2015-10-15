from __future__ import division
import os
import re
import json
import sqlite3 as sqlite
from bottle import default_app, route, static_file, request, template

root = os.path.dirname(os.path.realpath(__file__))
root_parent = os.path.dirname(root)

sqlite_db_name = 'wireless_data.db'
sqlite_db_pathname = os.path.join(root_parent, sqlite_db_name)

#notice that end comma
print("connecting to '{}'...".format(sqlite_db_pathname)),

arp_table_header = ['mac', 'name', 'alias1', 'alias2', 'last_ip', 'last_updated']
wireless_hosts_header = ['mac', 'interface', 'a', 'b', 'c', 'd', 'e', 'f', 'strength', 'time']

try:
    connection = sqlite.connect(sqlite_db_pathname)
    cursor = connection.cursor()
    print('SUCCESS')
except:
    connection = None
    print('FAILED')


def clean_mac(unclean_mac):
    mac = re.sub(r'[^0-9A-Za-z:]', '', unclean_mac)
    return mac


def get_host_table():
    query = "select * from wireless_arp_table;"
    cursor.execute(query)
    hosts_raw = cursor.fetchall()
    hosts = [dict(zip(arp_table_header, map(str, host))) for host in hosts_raw]

    return hosts


def get_host_by_mac(mac):
    query = "select * from wireless_arp_table where mac=?;"
    host = cursor.execute(query, (clean_mac(mac), )).fetchone()
    if host is not None:
        host = dict(zip(arp_table_header, map(str, host)))
    return host;


def get_records_by_mac(mac, timerange=None):

    query = "select * from wireless_hosts where mac=?;"

    result = cursor.execute(query, (clean_mac(mac), )).fetchall()
    if result is not None:
        records = [dict(zip(wireless_hosts_header, map(str, host))) for host in result]
    else:
        records = None

    return records


def simplify_records(records, max_gap):
    """ records (array) record array of record objects,
        max_gap (int) max time in seconds between records
    """
    if len(records) < 1:
        return [];

    record_count = len(records)
    pieces = []
    current_piece = []
    first_record = records[0]
    first_time = int(first_record['time'])
    first_strength = float(first_record['strength'])

    current_piece.append((first_time, first_strength))

    last_time = first_time
    last_strength = first_strength

    for i in range(1, record_count):
        current_record = records[i]
        current_time = int(current_record['time'])
        current_strength = float(current_record['strength'])

        diff = current_time - last_time
        if diff < max_gap:
            current_piece.append((current_time, current_strength))
        else:
            strengths = [x[1] for x in current_piece] 
            times = [x[0] for x in current_piece] 

            summary = {
                    'max_time' : max(times),
                    'min_time' : min(times),
                    'average_strength' : sum(strengths)/len(strengths),
                    'pieces' : current_piece}

            pieces.append(summary)
            current_piece = []
            current_piece.append((current_time, current_strength))

        last_time = current_time
        last_strength = current_strength

    return pieces


@route('/')
def hello_world():
    hosts = get_host_table()
    return template('index', host_list=hosts)


@route('/host/<mac>')
def recalcuate(mac):
    mac = clean_mac(mac)
    if not mac == '':
        records = get_records_by_mac(mac)
        simplified = simplify_records(records, 60*15)
        hostname = get_host_by_mac(mac)
        host_data = {'host' : hostname, 'record_count' : len(records), 'sections' : len(simplified)}
        return template('host', host=host_data)

    else:
        return "bad mac!"


@route('/host/<mac>', method="POST")
def post_host(mac):
    body_raw = request.body.read()#.get('params'))
    try:
        body = json.loads(body_raw)
        params = body['params']
    except:
        body = None
        params = []
    mac = clean_mac(mac)

    if not mac == '':
        simplified = True if 'simplified' in params else False
        records = get_records_by_mac(mac)

        response = {'records' : records}

        if simplified:
            simplified = simplify_records(records, 60*15)
            response['simplified'] = simplified


        return json.dumps(response)
    else:
        return json.dumps({'error' : "bad mac"})


@route('/static/<filepath:path>')
def server_static(filepath):
    return static_file(filepath, root=root)


application = default_app()
application.run(host='0.0.0.0', port=3000, debug=True)
