import urllib.request
import json

payload = {
    "rezervasyonlar": [
        {
            "id": "RES-1111",
            "facilityId": "facility-4",
            "date": "2026-05-18",
            "time": "10:00",
            "status": "confirmed"
        },
        {
            "id": "RES-2222",
            "facilityId": "facility-4",
            "date": "2026-05-18",
            "time": "10:00",
            "status": "confirmed"
        }
    ]
}

req = urllib.request.Request('http://localhost:8080/api/sync', data=json.dumps(payload).encode('utf-8'), headers={'Content-Type': 'application/json'}, method='POST')

try:
    resp = urllib.request.urlopen(req)
    print("SUCCESS:", resp.read().decode())
except urllib.error.HTTPError as e:
    print("HTTP ERROR:", e.code, e.read().decode())
