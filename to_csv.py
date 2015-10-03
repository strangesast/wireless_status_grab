import sqlite3 as sqlite
import csv
import datetime

connection = sqlite.connect('/home/samuel/wireless_data.db')
cursor = connection.cursor()

check_for_table = "SELECT name FROM sqlite_master WHERE type='table' AND name='wireless_hosts';"
assert cursor.execute(check_for_table).fetchone() is not None, 'table does not exist'

_all = cursor.execute('SELECT * FROM wireless_hosts').fetchall()

hosts = set([x[0] for x in _all])

print("unique hosts: {}".format(len(hosts)))

selection = [(x[0], x[8], x[9]) for x in _all]

print("host instances: {}".format(len(selection)))

by_host = {}

for each in selection:
    host = each[0]
    qual = each[1]
    time = each[2]
    if host in by_host:
        by_host[host].append((qual, time))
    else:
        by_host[host] = [(qual, time)]

mess = []
hosts = list(hosts)
# get max len
#lens = []
#for i, host in enumerate(hosts):
#    lens.append(len(by_host[host]))
#mess = []
#mess.append([hosts[int(i/2)] if i%2==0 else "" for i in range(len(hosts)*2)])
#for row_index in range(max(lens)):
#    inst = []
#    for host in hosts:
#        if row_index < len(by_host[host]):
#            inst = inst + list(by_host[host][row_index])
#        else:
#            inst = inst + ["", ""]
#    mess.append(inst)

mess = []
mess.append(['time'] + hosts)

by_host_by_time = {}
for host in hosts:
    by_host_by_time[host] = dict([(a, b) for b, a in by_host[host]])

# get min/max time
mi = 10E10
ma = 0
for host in hosts:
    both = [time for strength, time in by_host[host]]
    if min(both) < mi: mi = min(both)
    if max(both) > mi: ma = max(both)

for time in range(mi, ma):
    row = ["" for i in range(len(mess[0]) + 1)]
    row[0] = time
    for i, host in enumerate(hosts):
        row[i+1] = by_host_by_time[host][time] if time in by_host_by_time[host] else ""

    if not all([x == '' for x in row[1:]]):
        mess.append(row)

_all = cursor.execute('SELECT * FROM wireless_arp_table').fetchall()
convert = dict([map(str, x[0:2]) for x in _all])

macs = mess[0][1:]

for i, x in enumerate(macs):
    if x in convert:
        mess[0][i+1] = convert[x]

for row in mess[1:]:
    row[0] = datetime.datetime.fromtimestamp(row[0]).strftime('%Y-%m-%d %H:%M:%S.%f')


filepath = '/home/samuel/Downloads/rows.csv'
print("writing to '{}'".format(filepath))
with open(filepath, 'wb') as f:
    writer = csv.writer(f)
    writer.writerows(mess)
