import requests
from requests.auth import HTTPBasicAuth as auth
import json

with open('settings.json') as f:
    # load from settings file
    settings = json.load(f)

username = settings['username']
password = settings['password']
url = settings['url']

myauth = auth(username, password)

req = requests.get(url, auth=myauth)
status = req.status_code

assert 200 <= status < 300

responseText = req.text

# if this fails it's malformed
ugly_dict = dict([tuple(map(str, y[0].split('::'))) for y in [x.split('}') for x in responseText.split('{')] if not y[0] == ""])


#('C4:42:02:11:5B:19', 'eth1', '1 day,  7:37:53', '1M', '6M', '-54', '-88', '34', '490')
active_wireless_raw = ugly_dict['active_wireless'][1:-1].split("','")

keys = ['mac', 'interface', 'uptime', 'tx_rate', 'rx_rate', 'signal', 'noise', 'snr', 'signal_strength']

active_wireless = [tuple(active_wireless_raw[a:a+9]) for a in range(0, len(active_wireless_raw), 9)]

wireless_dict = [dict(zip(keys, each)) for each in active_wireless]

for a in wireless_dict:
    print(a)
