# app.py (수정본 - 캐시 기반 + 데이터 없을 때 예외 처리 추가)

import sqlite3
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import paramiko
import fetch_topology_snmpv3
import json
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

@app.on_event("startup")
def startup_event():
    if os.path.exists("devices.yaml"):
        fetch_topology_snmpv3.main()
    else:
        print("[WARNING] devices.yaml 파일이 없어 초기화가 생략됩니다.")

@app.get("/api/topology")
def get_topology():
    if not os.path.exists("devices.db"):
        return {"nodes": [], "links": []}

    conn = sqlite3.connect("devices.db")
    c = conn.cursor()
    try:
        nodes = [
            {"id": row[0], "name": row[1], "ip": row[2], "vendor": row[3]}
            for row in c.execute("SELECT device_id, name, ip, vendor FROM device")
        ]
        links = [
            {"id": row[0], "source": row[1], "target": row[2], "ifaceA": row[3], "ifaceB": row[4]}
            for row in c.execute("SELECT link_id, device_a, device_b, interface_a, interface_b FROM link_info")
        ]
    except Exception as e:
        nodes, links = [], []
    conn.close()
    return {"nodes": nodes, "links": links}

class CLIRequest(BaseModel):
    device_id: int
    command: str

@app.post("/api/device/cli")
def execute_cli(req: CLIRequest):
    conn = sqlite3.connect("devices.db")
    c = conn.cursor()
    c.execute("SELECT ip, username, password FROM device WHERE device_id = ?", (req.device_id,))
    row = c.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Device not found")

    ip, username, password = row
    conn.close()

    try:
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect(ip, username=username, password=password, timeout=5)
        channel = ssh.invoke_shell()
        import time
        time.sleep(1)
        channel.send("terminal length 0\n")
        time.sleep(1)
        channel.send(req.command + "\n")
        time.sleep(2)
        output = channel.recv(65535).decode('utf-8', 'ignore')
        ssh.close()

        conn = sqlite3.connect("devices.db")
        c = conn.cursor()
        c.execute('''
            CREATE TABLE IF NOT EXISTS cli_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                device_id INTEGER,
                command TEXT,
                output TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        c.execute("INSERT INTO cli_history (device_id, command, output) VALUES (?, ?, ?)",
                  (req.device_id, req.command, output))
        conn.commit()
        conn.close()

        return {"output": output}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/device/{device_id}")
def get_device_detail(device_id: int):
    if not os.path.exists("devices.db"):
        raise HTTPException(status_code=404, detail="Device DB not found")

    conn = sqlite3.connect("devices.db")
    c = conn.cursor()
    try:
        c.execute("SELECT json FROM device_cache WHERE device_id = ?", (device_id,))
        row = c.fetchone()
    except Exception:
        row = None
    conn.close()

    if not row or not row[0]:
        return {
            "id": device_id,
            "name": f"장비 {device_id}",
            "ip": "0.0.0.0",
            "vendor": "unknown",
            "sysName": "N/A",
            "sysDescr": "N/A",
            "uptime": "N/A",
            "hostname": "N/A",
            "model": "N/A",
            "version": "N/A",
            "interfaceCount": 0,
            "cpuUsage": "N/A",
            "memoryUsage": "N/A",
            "interfaces": []
        }

    return json.loads(row[0])

@app.get("/api/device/{device_id}/cli-history")
def get_cli_history(device_id: int):
    if not os.path.exists("devices.db"):
        return []

    conn = sqlite3.connect("devices.db")
    c = conn.cursor()
    try:
        c.execute('''
            SELECT command, output, timestamp
            FROM cli_history
            WHERE device_id = ?
            ORDER BY timestamp DESC
            LIMIT 20
        ''', (device_id,))
        rows = c.fetchall()
    except Exception:
        rows = []
    conn.close()

    return [
        {"command": r[0], "output": r[1], "timestamp": r[2]}
        for r in rows
    ]