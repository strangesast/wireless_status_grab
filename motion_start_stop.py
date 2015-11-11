import requests as req

auth = ('toast', 'toast')

pi_ip = '192.168.1.138:8080'
str_ip = '127.0.0.1:8080'
base_url= 'http://'
ips = [base_url + x for x in [pi_ip, str_ip]]
start_url = '/0/detection/start'
pause_url = '/0/detection/pause'

def one_action(start, base_url):
    url = base_url + start_url if start else base_url + pause_url
    r = req.get(url, auth=auth)
    sc = r.status_code
    if 400 <= sc < 500:
        result = 'bad'
    elif 200 <= sc < 400:
        result = 'good'
    else: #bad
        result = 'bad'

    return result

def action(start):
    rs = []
    for ip in ips:
        print(ip)
        rs.append(one_action(start, ip))
    return rs
