import sqlite3 as sqlite
import matplotlib
matplotlib.use('Agg')
from matplotlib import pyplot as plt
import mpld3

connection = sqlite.connect('wireless_data.db')
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
plt.xlabel('Time')
plt.xticks(rotation='vertical')
plt.ylabel('Strength')
ax = plt.subplot(111, aspect=0.00008)
ax.xaxis.set_major_locator(matplotlib.dates.HourLocator())
ax.xaxis.set_major_formatter(matplotlib.dates.DateFormatter('%I (%H)')) # formatted 12 hour clock
#ax.xaxis.set_minor_locator(months)

ordered_hosts = []
for host in hosts:
    ordered_hosts.append(host)
    y = [x[0] for i, x in enumerate(by_host[host]) if i%8 == 0]
    x = [x[1] for i, x in enumerate(by_host[host]) if i%8 == 0]

    ax.plot(matplotlib.dates.num2date(matplotlib.dates.epoch2num(x)), y, label=str(host))
    #fig.savefig('/home/samuel/Downloads/test_{}.png'.format(host), bbox_inches='tight', figsize=(8, 6), dpi=100)
    #ax.cla()

#ax.legend(
#  loc='upper center',
#  bbox_to_anchor=(0.5, -0.1),
#  fancybox = True,
#  ncol = 2
#)
#fig.savefig('/home/samuel/Downloads/test_all.svg', bbox_inches='tight', figsize=(10, 6), dpi=400)

tooltip = mpld3.plugins.PointLabelTooltip(fig, labels=ordered_hosts)
mpld3.plugins.connect(fig, tooltip)

mpld3.show()
