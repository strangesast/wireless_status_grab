import re
import sqlite3 as sqlite
import matplotlib
import datetime
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np
from scipy import integrate, interpolate
from matplotlib.dates import YearLocator, MonthLocator, DayLocator, HourLocator, DateFormatter
import matplotlib.gridspec as gridspec


sqlite_db_pathname = '/home/samuel/wireless_data.db'
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


def get_records_by_mac(mac, timerange=None):
    query = "select * from wireless_hosts where mac=?;"
    result = cursor.execute(query, (clean_mac(mac), )).fetchall()
    if result is not None:
        records = [dict(zip(wireless_hosts_header, map(str, host))) for host in result]
    else:
        records = None
    return records

mac = "3C:AB:8E:66:1A:54"

result = get_records_by_mac(mac)
result = simplify_records(result, 600)
data = result[-1]['pieces']

print(data[0])
x, y = zip(*data)

x = [datetime.datetime.fromtimestamp(elem) for elem in x]


fig = plt.figure()
ax = fig.add_subplot(111)
ax.plot(x, y)

ax.xaxis.set_major_locator(DayLocator())
ax.xaxis.set_major_formatter(DateFormatter('%b %d  -'))
ax.xaxis.set_minor_locator(HourLocator())
ax.xaxis.set_minor_formatter(DateFormatter('%H'))
for tick in ax.xaxis.get_major_ticks():
    tick.label.set_rotation('vertical')



fig.savefig('/home/samuel/Downloads/test.png')
