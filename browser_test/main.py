import os
import re
import sqlite3 as sqlite
from bottle import default_app, route, static_file, request, template

root = os.path.dirname(os.path.realpath(__file__))
root_parent = os.path.dirname(root)

sqlite_db_name = 'wireless_data.db'
sqlite_db_pathname = os.path.join(root_parent, sqlite_db_name)

#notice that comma
print("connecting to '{}'...".format(sqlite_db_pathname)),

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

arp_table_header = ['mac', 'name', 'alias1', 'alias2', 'last_ip', 'last_updated']
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

wireless_hosts_header = ['mac', 'interface', 'a', 'b', 'c', 'd', 'e', 'f', 'strength', 'time']
def get_records_by_mac(mac, timerange=None):

    query = "select * from wireless_hosts where mac=?;"

    result = cursor.execute(query, (clean_mac(mac), )).fetchall()
    if result is not None:
        records = [dict(zip(wireless_hosts_header, map(str, host))) for host in result]
    else:
        records = None

    return records


@route('/')
def hello_world():
    hosts = get_host_table()
    return template('index', host_list=hosts)

    #return static_file('index.html', root=root)


@route('/host/<mac>')
def recalcuate(mac):
    mac = clean_mac(mac)
    if not mac == '':
        records = get_records_by_mac(mac)
        hostname = get_host_by_mac(mac)
        host_data = {'host' : hostname, 'records' : records}
        return template('host', host=host_data)

    else:
        return "bad mac!"

#@route('/static/<filepath:path>')
#def server_static(filepath):
#    return static_file(filepath, root=absolute_path)


application = default_app()
application.run(host='0.0.0.0', port=3000, debug=True)
