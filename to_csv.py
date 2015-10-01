import sqlite3 as sqlite
import csv

connection = sqlite.connect('/home/samuel/wireless_data.db')
cursor = connection.cursor()

check_for_table = "SELECT name FROM sqlite_master WHERE type='table' AND name='wireless_hosts';"
assert cursor.execute(check_for_table).fetchone() is not None, 'table does not exist'

all = cursor.execute('SELECT * FROM wireless_hosts').fetchall()

hosts = set([x[0] for x in all])

print("unique hosts: {}".format(len(hosts)))

selection = [(x[0], x[8], x[9]) for x in all]

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
lens = []
for i, host in enumerate(hosts):
    lens.append(len(by_host[host]))


mess = []
mess.append([hosts[int(i/2)] if i%2==0 else "" for i in range(len(hosts)*2)])
for row_index in range(max(lens)):
    inst = []
    for host in hosts:
        all_of_host = by_host[host]
        if row_index < len(all_of_host):
            inst = inst + list(all_of_host[row_index])
        else:
            inst = inst + ["", ""]

with open('/home/samuel/Downloads/rows.csv', 'wb') as f:
    writer = csv.writer(f)
    writer.writerows(mess)
