#! /usr/bin/python
import os
import requests
from requests.auth import HTTPBasicAuth as auth
import json
import sqlite3 as sqlite
import time
from motion_start_stop import action


### Router connection settings
filepath = os.path.join(os.path.dirname(os.path.realpath(__file__)), 'settings.json')
with open(filepath) as f:
    # load from settings file
    settings = json.load(f)

username = settings['username']
password = settings['password']
url = settings['url']


### Sqlite db setup
connection = sqlite.connect('/home/samuel/wireless_data.db')
cursor = connection.cursor()

check_for_table = "SELECT name FROM sqlite_master WHERE type='table' AND name='wireless_hosts';"
if cursor.execute(check_for_table).fetchone() is None:
    table_create = '''CREATE TABLE wireless_hosts
                   (mac text, interface text, uptime text, tx_rate text, rx_rate text,
                   signal integer, noise integer, snr integer, signal_strength integer,
                   datetime integer);'''

    cursor.execute(table_create)


### Functionality
def probe_router(url, auth, dic=False):
    req = requests.get(url, auth=myauth)
    status = req.status_code
    assert 200 <= status < 300
    
    responseText = req.text
    
    # if this fails it's malformed
    ugly_dict = dict(
        [tuple(map(str, y[0].split('::'))) # str over unicode
            for y in [
                x.split('}') for x in responseText.split('{')
            ] if not y[0] == ""
        ]
    )

    #('C4:42:02:11:5B:19', 'eth1', '1 day,  7:37:53', '1M', '6M', '-54', '-88', '34', '490')
    active_wireless_raw = ugly_dict['active_wireless'][1:-1].split("','")
    
    keys = ['mac', 'interface', 'uptime', 'tx_rate', 'rx_rate', 'signal', 'noise', 'snr', 'signal_strength']

    active_wireless = [active_wireless_raw[a:a+9] for a in range(0, len(active_wireless_raw), 9)]

    # convert some stuff to int, add time
    current_time = int(time.time())
    active_wireless = map(lambda l: l[:5] + map(int, l[5:]) + [current_time], active_wireless)

    if not dic: return active_wireless
    
    wireless_dicts = [dict(zip(keys, each)) for each in active_wireless]

    return wireless_dicts


### Tests
myauth = auth(username, password)

probe = probe_router(url, myauth)
mac_set = set([x[0].lower() for x in probe])
special_mac = 'FC:C2:DE:AA:B5:E9'.lower()

try:
    if special_mac in mac_set:
        print(action(False))
    else:
        print(action(True))
except Exception as e:
    print('bad')

cursor.executemany('insert into wireless_hosts values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', probe) 
res = connection.commit()
print(res)

print('completed successfully')
