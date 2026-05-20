import urllib.request
import json
import urllib.error

payload = {
    'rezervasyonlar': [
        {'id': 'RES-3333', 'facilityId': 'facility-4', 'date': '2026-05-19', 'time': '12:00', 'status': 'confirmed', 'userId': 'test1'},
        {'id': 'RES-4444', 'facilityId': 'facility-4', 'date': '2026-05-19', 'time': '12:00', 'status': 'confirmed', 'userId': 'test2'}
    ]
}

req = urllib.request.Request('http://localhost:8080/api/sync', data=json.dumps(payload).encode('utf-8'), headers={'Content-Type': 'application/json'}, method='POST')
try:
    resp = urllib.request.urlopen(req)
    print('SUCCESS:', resp.read().decode())
except urllib.error.HTTPError as e:
    print('HTTP ERROR:', e.code, e.read().decode())
