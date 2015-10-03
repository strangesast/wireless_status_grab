import os
import json
import requests
from requests.auth import HTTPBasicAuth as auth
import sqlite3 as sqlite
import time

filepath = os.path.join(os.path.dirname(os.path.realpath(__file__)), 'settings.json')
with open(filepath) as f:
    # load from settings file
    settings = json.load(f)

username = settings['username']
password = settings['password']
myauth = auth(username, password)
url = settings['url']
hosts_url = settings['hosts_url']

def process_request(_url, auth):
    req = requests.get(_url, auth=myauth)
    status = req.status_code
    assert 200 <= status < 300

    responseText = req.text

    ugly_dict = dict(
        [tuple(map(str, y[0].split('::'))) # str over unicode
            for y in [
                x.split('}') for x in responseText.split('{')
            ] if not y[0] == ""
        ]
    )

    return ugly_dict


def wireless_quality(url, auth, dic=False):
    ugly = process_request(url, auth)

    #('C4:42:02:11:5B:19', 'eth1', '1 day,  7:37:53', '1M', '6M', '-54', '-88', '34', '490')
    active_wireless_raw = ugly['active_wireless'][1:-1].split("','")
    
    keys = ['mac', 'interface', 'uptime', 'tx_rate', 'rx_rate', 'signal', 'noise', 'snr', 'signal_strength']

    active_wireless = [active_wireless_raw[a:a+9] for a in range(0, len(active_wireless_raw), 9)]

    # convert some stuff to int, add time
    current_time = int(time.time())
    active_wireless = map(lambda l: l[:5] + map(int, l[5:]) + [current_time], active_wireless)

    if not dic: return active_wireless
    
    wireless_dicts = [dict(zip(keys, each)) for each in active_wireless]

    return wireless_dicts


def wireless_hosts(_url, auth):
    ugly = process_request(_url, auth)

    arps_raw = ugly['arp_table'].strip()[1:-1].split("','")
    arps = [arps_raw[a:a+4] for a in range(0, len(arps_raw), 4)]
    
    return dict(
        [(x.pop(2),
            {'hostname'         : x[0],
             'alias1'           : "",
             'alias2'           : "",
             'ip'               : x[1],
             'connection_count' : x[2],
             'time'             : int(time.time())
            }) for x in arps
        ])

arp_table = wireless_hosts(hosts_url, myauth)

macs = arp_table.keys()

connection = sqlite.connect('/home/samuel/wireless_data.db')
cursor = connection.cursor()

check_for_table = "SELECT name FROM sqlite_master WHERE type='table' AND name='wireless_arp_table';"
if cursor.execute(check_for_table).fetchone() is None:
    table_create = '''CREATE TABLE wireless_arp_table
                   (mac text primary key, hostname text, hostname_alias1 text, hostname_alias2 text,
                   last_ip text, datetime integer);'''

    cursor.execute(table_create)

# check for existing hosts
last_hosts_query = cursor.execute('SELECT * FROM wireless_arp_table').fetchall()

last_hosts_dict = dict([
        (str(x[0]), {
            'hostname' : x[1],
            'hostname_alias1' : x[2],
            'hostname_alias2' : x[3],
            'ip' : x[4],
            'time' : x[5]
            }) for x in last_hosts_query
        ])

last_hosts = last_hosts_dict.keys()

# if they are the same, do nothing.  else update or add

ordered = []
for mac in macs:
    if mac not in last_hosts:
        # check that they're different
        deets = arp_table[mac]
        ordered.append([mac, deets['hostname'], "", "", deets['ip'], deets['time']])
    else:
        previous = last_hosts_dict[mac]
        current = arp_table[mac]

        if not str(previous['hostname']) == str(current['hostname']):
            ordered.append([
                mac,
                deets['hostname'],
                previous['hostname'],
                previous['hostname_alias1'],
                deets['ip'],
                deets['time']
                ])

print("new hosts: {}".format(len(ordered)))

# insert or update those rows that are new or modified
cursor.executemany('INSERT OR REPLACE INTO wireless_arp_table (mac, hostname, hostname_alias1, hostname_alias2, last_ip, datetime) VALUES ( ?, ?, ?, ?, ?, ?);', ordered)

connection.commit()
