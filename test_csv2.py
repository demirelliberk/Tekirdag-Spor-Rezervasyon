import urllib.request
import json

payload1 = {
    "rezervasyonlar": [
        {
            "id": "RES-1111",
            "facilityId": "facility-4",
            "date": "2026-05-18",
            "time": "10:00",
            "status": "confirmed"
        }
    ]
}

payload2 = {
    "rezervasyonlar": [
        {
            "id": "RES-CSV-15", # User B fetched the CSV BEFORE User A made their reservation, so User B doesn't have User A's reservation. User B only has old stuff.
            "facilityId": "facility-5",
            "date": "2026-05-18",
            "time": "09:00",
            "status": "confirmed"
        },
        {
            "id": "RES-2222", # Different ID, same slot as User A
            "facilityId": "facility-4",
            "date": "2026-05-18",
            "time": "10:00",
            "status": "confirmed"
        }
    ]
}

print("SENDING PAYLOAD 1...")
req1 = urllib.request.Request('http://localhost:8080/api/sync', data=json.dumps(payload1).encode('utf-8'), headers={'Content-Type': 'application/json'}, method='POST')
try:
    resp1 = urllib.request.urlopen(req1)
    print("SUCCESS 1:", resp1.read().decode())
except urllib.error.HTTPError as e:
    print("HTTP ERROR 1:", e.code, e.read().decode())

print("SENDING PAYLOAD 2...")
req2 = urllib.request.Request('http://localhost:8080/api/sync', data=json.dumps(payload2).encode('utf-8'), headers={'Content-Type': 'application/json'}, method='POST')
try:
    resp2 = urllib.request.urlopen(req2)
    print("SUCCESS 2:", resp2.read().decode())
except urllib.error.HTTPError as e:
    print("HTTP ERROR 2:", e.code, e.read().decode())
