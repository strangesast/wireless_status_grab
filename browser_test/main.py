from __future__ import division
import os
import re
import json
import time
import datetime
import sqlite3 as sqlite
from bottle import default_app, route, static_file, request, template

root = os.path.dirname(os.path.realpath(__file__))
root_parent = os.path.dirname(root)

sqlite_db_name = 'wireless_data.db'
sqlite_db_pathname = os.path.join(root_parent, sqlite_db_name)
sqlite_db_pathname = '/home/samuel/wireless_data.db'
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

def last_active(mac):
    query = 'select max(datetime) from wireless_hosts where mac=?'
    result = cursor.execute(query, (mac, )).fetchone()
    return result[0]

def get_all_last_active(threshold=None):
    """ threshold (int) how many seconds back should be considered "active"
    """
    if threshold is not None:
        query = 'select mac, datetime from wireless_hosts where datetime >= ? and datetime <= ? group by mac'
        result = cursor.execute(query, map(str, threshold)).fetchall()
    else:
        query = 'select mac, max(datetime) from wireless_hosts group by mac;'
        result = cursor.execute(query).fetchall()
    clean = [(str(x[0]), int(x[1])) for x in result]
    return clean

def get_records_in_range(timerange, mac):
    query = 'select * from wireless_hosts where datetime >= ? and datetime <= ? and mac = ?'
    result = cursor.execute(query, map(str, timerange + [mac])).fetchall()
    return result

def get_unique_macs():
    query = 'select distinct mac from wireless_hosts;'
    result = cursor.execute(query).fetchall()
    clean = [str(x[0]) for x in result]
    return clean

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
    else:
        host = dict(zip(arp_table_header, ['unknown' for x in range(len(arp_table_header))]))
        host['mac'] = mac
    return host

def get_records_by_mac(mac, timerange=None):
    query = "select * from wireless_hosts where mac=?;"
    result = cursor.execute(query, (clean_mac(mac), )).fetchall()
    if result is not None:
        records = [dict(zip(wireless_hosts_header, map(str, host))) for host in result]
    else:
        records = None
    return records

def date_to_string(date):
    return date.strftime('%m/%d/%y %H:%M:%S')

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
        elif i == record_count - 1:
            strengths = [x[1] for x in current_piece]
            times = [x[0] for x in current_piece]

            summary = {
                    'max_time' : max(times),
                    'min_time' : min(times),
                    'average_strength' : sum(strengths)/len(strengths),
                    'pieces' : current_piece}

            pieces.append(summary)
            current_piece = []

        if (diff >= max_gap or i == record_count - 1) and current_piece != []:
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
    uniquemacs = get_unique_macs()
    actives = get_all_last_active(None)
    actives_by_mac = dict(actives)
    hosts = get_host_table()
    macs = [x['mac'] for x in hosts]
    hosts += [{'mac' : mac, 'name' : 'unknown'} for mac in uniquemacs if mac not in macs]
    recent_actives = get_all_last_active((time.time() - 600, time.time()))
    print(recent_actives)
    # last active stuff
    for host in hosts:
        if host['mac'] in actives_by_mac:
            last_active = actives_by_mac[host['mac']]
            host['last_active'] = date_to_string(datetime.datetime.fromtimestamp(last_active))
        else:
            host['last_active'] = 'unknown'

    hosts = sorted(hosts, key=lambda x: x['last_active'], reverse=True)
    return template('index', host_list=hosts, active_macs=recent_actives)


@route('/time_slider', method="GET")
def time_slider():
    return template('time_slider')

@route('/records_in_range', method="POST")
def records_in_range():
    #return template('time_slider')
    body_raw = request.body.read()
    try:
        body_dict = json.loads(body_raw)
    except:
        body_dict = {}
    body_keys = body_dict.keys()
    query_dict = request.query
    query_params = query_dict.keys()
    t1 = 0
    t2 = int(time.time())
    try:
        if 't1' in query_params:
            t1 = int(query_dict['t1'])
        if 't2' in query_params:
            t2 = int(query_dict['t2'])
        if 't1' in body_keys:
            t1 = int(body_dict['t1'])
        if 't2' in body_keys:
            t2 = int(body_dict['t2'])
    except:
        return "malformed date"

    macs_in_range = [x[0] for x in get_all_last_active((t1, t2))] # (mac, last_active)
    response_dict = {}
    for mac in macs_in_range:
        records = get_records_in_range([t1, t2], mac)
        response_dict[mac] = records

    return json.dumps(response_dict)


@route('/host/<mac>')
def recalcuate(mac):
    mac = clean_mac(mac)
    if not mac == '':
        records = get_records_by_mac(mac)
        if len(records) < 1:
            return "no records for this mac"
        simplified = simplify_records(records, 60*10)
        hostname = get_host_by_mac(mac)
        host_data = {'host' : hostname, 'record_count' : len(records), 'sections' : len(simplified)}
        return template('host', host=host_data)
    else:
        return "bad mac!"


def get_by_day_hour_stuff(records):
    by_day_hour = [0 for i in range(24*7)]
    for record in records:
        t = record['time']
        d = datetime.datetime.fromtimestamp(float(t))
        h = d.weekday()*24 + d.hour
        by_day_hour[h] += 1
    return by_day_hour

@route('/host/<mac>', method="POST")
def host_summary(mac):
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

        #by_day_hour = [0 for i in range(24*7)]
        #for record in records:
        #    t = record['time']
        #    d = datetime.datetime.fromtimestamp(float(t))
        #    h = d.weekday()*24 + d.hour
        #    by_day_hour[h] += 1

        response = {'records' : records}
        response = {} # big

        if simplified:
            simplified = simplify_records(records, 60*15)
            response['simplified'] = simplified
            response['bydayhour'] = get_by_day_hour_stuff(records)


        return json.dumps(response)
    else:
        return json.dumps({'error' : "bad mac"})


@route('/active', method="POST")
@route('/active', method="GET")
def active_all():
    actives = get_all_last_active((time.time() - 600, time.time()))
    by_mac = dict(actives)
    return json.dumps(by_mac)


@route('/active/<mac>', method="POST")
@route('/active/<mac>', method="GET")
def active_host(mac):
    mac = clean_mac(mac)
    if not mac == '':
        return json.dumps(last_active(mac))
    else:
        return json.dumps({'error' : "bad mac"})

@route('/bdh/<mac>/week/<week_num>', method="GET")
def by_day_hour_getter(mac, week_num):
    mac = clean_mac(mac)
    assert week_num.isdigit()
    week_seconds = 60*60*24*7
    week_num = int(week_num)
    lower = week_seconds*week_num
    upper = week_seconds*(week_num+1)
    print(lower, upper)
    mintime = cursor.execute("SELECT MIN(datetime) from wireless_hosts where mac = ?", (mac, )).fetchone()[0]
    if mintime is None:
        return json.dumps([])
    mintime = int(mintime)
    params = [mintime + week_seconds*week_num, mintime + week_seconds*(week_num+1), mac]
    res = cursor.execute("SELECT datetime FROM wireless_hosts where datetime > ? and datetime < ? and mac = ?", map(str, params)).fetchall()
    if len(res) == 0:
        return json.dumps([])

    res = map(lambda x: x[0], res)

    return json.dumps(get_by_day_hour_stuff(map(lambda x: {'time': x}, res)))

@route('/bdh/<mac>/day/<day_num>', method="GET")
def by_day_hour_getter_two(mac, day_num):
    mac = clean_mac(mac)
    assert day_num.isdigit()
    day_seconds = 60*60*24
    week_seconds = day_seconds*7
    day_num = int(day_num)
    lower = day_seconds*day_num
    upper = day_seconds*(day_num+1)
    print(lower, upper)
    mintime = cursor.execute("SELECT MIN(datetime) from wireless_hosts where mac = ?", (mac, )).fetchone()[0]
    if mintime is None:
        return json.dumps([])
    mintime = int(mintime)
    params = [mintime + day_seconds*day_num, mintime + day_seconds*(day_num+1) + week_seconds, mac]
    res = cursor.execute("SELECT datetime FROM wireless_hosts where datetime > ? and datetime < ? and mac = ?", map(str, params)).fetchall()
    if len(res) == 0:
        return json.dumps([])

    res = map(lambda x: x[0], res)

    return json.dumps(get_by_day_hour_stuff(map(lambda x: {'time': x}, res)))




@route('/static/<filepath:path>')
def server_static(filepath):
    return static_file(filepath, root=root)


application = default_app()
application.run(host='0.0.0.0', port=3000, debug=True)
