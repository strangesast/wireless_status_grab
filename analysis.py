import sqlite3 as sqlite
import matplotlib
matplotlib.use('Agg')
from matplotlib import pyplot as plt

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


### Plotting
fig = plt.figure()
plt.title('Hosts: Strength vs Time')
plt.xlabel('Strength')
plt.ylabel('Time')
ax = plt.subplot(111)

for host in hosts:
    y = [x[1] for x in by_host[host]]
    x = [x[0] for x in by_host[host]]

    ax.plot(x, y, label=str(host))

fig.savefig('out.png', bbox_inches='tight')
