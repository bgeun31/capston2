import sqlite3
import json

conn = sqlite3.connect("devices.db")
cur = conn.cursor()

cur.execute("SELECT device_id, json FROM device_cache")
rows = cur.fetchall()

for device_id, json_str in rows:
    print(f"📌 Device ID: {device_id}")
    data = json.loads(json_str)
    print(f"CPU Usage: {data.get('cpuUsage')}")
    print(f"Memory Usage: {data.get('memoryUsage')}")
    print("-" * 50)

conn.close()
