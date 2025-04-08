# app.py

import sqlite3
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import paramiko
import fetch_topology_snmpv3
from fetch_topology_snmpv3 import (
    fetch_snmpv3_info,
    fetch_status_info_invoke,
    fetch_device_info_invoke
)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

@app.on_event("startup")
def startup_event():
    # 부팅 시 DB 초기화 + CDP link
    fetch_topology_snmpv3.main()

@app.get("/api/topology")
def get_topology():
    conn = sqlite3.connect("devices.db")
    c = conn.cursor()
    nodes = [
        {"id": row[0], "name": row[1], "ip": row[2], "vendor": row[3]}
        for row in c.execute("SELECT device_id, name, ip, vendor FROM device")
    ]
    links = [
        {"id": row[0], "source": row[1], "target": row[2], "ifaceA": row[3], "ifaceB": row[4]}
        for row in c.execute("SELECT link_id, device_a, device_b, interface_a, interface_b FROM link_info")
    ]
    conn.close()
    return {"nodes": nodes, "links": links}

class CLIRequest(BaseModel):
    device_id: int
    command: str

@app.post("/api/device/cli")
def execute_cli(req: CLIRequest):
    """
    임의 CLI 명령어
    """
    conn = sqlite3.connect("devices.db")
    c = conn.cursor()
    c.execute("SELECT ip, username, password FROM device WHERE device_id = ?", (req.device_id,))
    row = c.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Device not found")

    ip, username, password = row
    conn.close()

    # invoke_shell()로 임의 명령 실행
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

        # 히스토리 저장
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
    """
    장비 정보 + 상태 요약
    """
    conn = sqlite3.connect("devices.db")
    c = conn.cursor()
    c.execute("""
        SELECT device_id, name, ip, vendor, username, password
        FROM device
        WHERE device_id = ?
    """, (device_id,))
    row = c.fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail="Device not found")

    dev_id, name, ip, vendor, username, password = row

    # SNMP는 DB에 SNMP pw 없으므로 재조회X → N/A
    device_info = {
        "id": dev_id,
        "name": name,
        "ip": ip,
        "vendor": vendor,
        "sysName": "N/A",
        "sysDescr": "N/A",
        "uptime": "N/A"
    }

    # invoke_shell()로 Hostname/Model/Version/InterfaceCount
    dev_details = fetch_topology_snmpv3.fetch_device_info_invoke(ip, username, password)
    device_info.update(dev_details)

    # invoke_shell()로 CPU/메모리/Interfaces
    status_info = fetch_topology_snmpv3.fetch_status_info_invoke(ip, username, password)
    device_info.update(status_info)

    return device_info

@app.get("/api/device/{device_id}/cli-history")
def get_cli_history(device_id: int):
    conn = sqlite3.connect("devices.db")
    c = conn.cursor()
    c.execute('''
        SELECT command, output, timestamp
        FROM cli_history
        WHERE device_id = ?
        ORDER BY timestamp DESC
        LIMIT 20
    ''', (device_id,))
    rows = c.fetchall()
    conn.close()

    return [
        {"command": r[0], "output": r[1], "timestamp": r[2]}
    for r in rows
    ]
