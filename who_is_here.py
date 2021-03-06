import os
import json
import csv
import requests
from requests.auth import HTTPBasicAuth as auth
import sqlite3 as sqlite
import time
import datetime

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

connection = sqlite.connect('/home/samuel/wireless_data.db')

def check_for_table(_cursor, table_name):
    ''' return True if table exists, false otherwise
    '''
    test = _cursor.execute(
            """SELECT name FROM sqlite_master \
            WHERE type='table' AND name=?;"""
            , (table_name, )).fetchone()

    return test is not None

cursor = connection.cursor()


def check_update_hosts(cursor):
    current_hosts_dict = wireless_hosts(hosts_url, myauth)
    current_hosts = [mac for mac in current_hosts_dict]

    if not check_for_table(cursor, 'wireless_arp_table'):
        table_create = '''CREATE TABLE wireless_arp_table
                       (mac text primary key, hostname text, hostname_alias1 text, hostname_alias2 text,
                       last_ip text, datetime integer);'''
    
        cursor.execute(table_create)

    # check for existing hosts
    last_hosts_query = cursor.execute('SELECT * FROM wireless_arp_table').fetchall()

    headers = ['hostname', 'hostname_alias1', 'hostname_alias2', 'ip', 'time']
    last_hosts_dict = dict([(str(row[0]), dict(zip(headers, map(str, row[1:])))) for row in last_hosts_query])

    last_hosts = last_hosts_dict.keys()

    new_hosts = [host for host in current_hosts if host not in last_hosts]
    changed_hosts = [
            host for host in current_hosts
            if host in last_hosts
            and current_hosts_dict[host]['hostname'] != last_hosts_dict[host]['hostname']
            ]

    changes = []
    for host in changed_hosts:
        row = [host] + [last_hosts_dict[host][x] for x in headers]
        if not (row[1] != "" and current_hosts_dict[host]['hostname'] == "*"):
          row[3] = row[2] # shift alias 1 to alias 2
          row[2] = row[1] # shift host to alias 1
          row[1] = current_hosts_dict[host]['hostname']
          changes.append(row)

    for host in new_hosts:
        parts = current_hosts_dict[host]
        row = [host, parts['hostname'], '', '', parts['ip'], parts['time']]
        changes.append(row)

    result = cursor.executemany(
    '''INSERT OR REPLACE INTO wireless_arp_table
    (mac, hostname, hostname_alias1, hostname_alias2, last_ip, datetime)
    VALUES ( ?, ?, ?, ?, ?, ?);''', changes).fetchone()

    return new_hosts, changed_hosts, result


newh, chah, res = check_update_hosts(cursor)
print("new hosts:     {}".format(len(newh)))
print("changed hosts: {}".format(len(chah)))
connection.commit()


query = cursor.execute('SELECT * FROM wireless_arp_table').fetchall()

headers = ['hostname', 'hostname_alias1', 'hostname_alias2', 'ip', 'time']
last_hosts_dict = dict([(str(row[0]), dict(zip(headers, map(str, row[1:])))) for row in query])


by_mac = {}
query = cursor.execute('SELECT * FROM wireless_hosts').fetchall()

for inst in query:
    stringed = map(str, inst[0:5]) + list(inst[5:])
    mac = stringed[0]
    if mac in last_hosts_dict:
        name = last_hosts_dict[mac]['hostname']
        hostname = "{} ({})".format(mac, name)
    else:
        hostname = mac

    if hostname not in by_mac:
        by_mac[hostname] = [stringed[1:]]

    else:
        by_mac[hostname].append(stringed[1:])

broken_by_mac = {}

for hostname in by_mac:
    sections = []
    current = []
    instances = by_mac[hostname]
    for i in range(len(instances)-1):
        strength, _time = instances[i][7:]
        if abs(_time - instances[i+1][7:][1]) < 60*10:
            current.append((_time, strength))
        else:
            sections.append(current)
            current = [(_time, strength)]

    broken_by_mac[hostname] = sections
    

out = {}
for host in broken_by_mac:
    print("HOST: {}".format(host))
    sec = []
    for section in broken_by_mac[host]:
        if len(section) == 0: continue
        justs = [strength for _time, strength in section]
        justt = [_time for _time, strength in section]
        avg = sum(justs)/len(justs)
        
        diff = max(justt) - min(justt)

        sec.append([(_time, avg) for _time, strength in section])

        #m, s = divmod(diff, 60)
        #h, m = divmod(m, 60)

        #print("{}:{}:{}".format(h, m, s), avg)

    out[host] = sec 

keys = out.keys()
test = out["68:AE:20:39:C4:5C (JonathansiPhone)"]

csvout = []
csvout.append(['time', 'strength'])
for section in test:
    for inst in section:
        _time, strength = inst
        _time = datetime.datetime.fromtimestamp(_time).strftime('%Y-%m-%d %H:%M:%S')
        csvout.append((_time, strength))



filepath = "/home/samuel/Downloads/broken.csv"
with open(filepath, 'wb') as f:
    writer = csv.writer(f)
    writer.writerows(csvout)
