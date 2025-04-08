# app.py

import sqlite3
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import paramiko
import fetch_topology_snmpv3
from fetch_topology_snmpv3 import fetch_snmpv3_info, fetch_status_info, fetch_device_info

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

@app.on_event("startup")
def startup_event():
    # 서버 부팅 시 DB초기화 + SNMP/CLI 토폴로지 수집
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
    conn = sqlite3.connect("devices.db")
    c = conn.cursor()
    c.execute("SELECT ip, username, password FROM device WHERE device_id = ?", (req.device_id,))
    row = c.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Device not found")

    ip, username, password = row

    try:
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect(ip, username=username, password=password, timeout=5)
        stdin, stdout, stderr = ssh.exec_command(req.command)
        output = stdout.read().decode('utf-8', errors='ignore')
        ssh.close()

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

    # 1) 기본 정보 (SNMP 값은 재조회X => N/A or DB저장X)
    device_info = {
        "id": dev_id,
        "name": name,
        "ip": ip,
        "vendor": vendor,
        "sysName": "N/A",
        "sysDescr": "N/A",
        "uptime": "N/A"
    }

    # 2) hostname, model, version, interfaceCount
    dev_details = fetch_topology_snmpv3.fetch_device_info(ip, username, password)
    device_info.update(dev_details)

    # 3) CPU, mem, interfaces
    status = fetch_status_info(ip, username, password)
    device_info.update(status or {})

    # (선택) SNMP로 sysName etc 재조회하려면
    #  auth_pw, priv_pw도 DB에 있어야 가능

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
    return [{"command": r[0], "output": r[1], "timestamp": r[2]} for r in rows]
