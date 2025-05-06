# app.py (수정본 - 캐시 기반 + 데이터 없을 때 예외 처리 추가)

import sqlite3
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from fastapi import WebSocket, WebSocketDisconnect
from fastapi import Depends
from apscheduler.schedulers.background import BackgroundScheduler
from ssh_terminal import SSHTerminal
import paramiko
import fetch_topology_snmpv3
from fetch_topology_snmpv3 import normalize_device_name  # 호스트 이름 정규화 함수 임포트
import json
import os
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
import asyncio, subprocess     # ⬅️ 새로 추가

scheduler = BackgroundScheduler()

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

@app.get("/api/devices")
def get_device_list():
    conn = sqlite3.connect("devices.db")
    c = conn.cursor()
    c.execute("SELECT device_id, name FROM device")
    rows = c.fetchall()
    conn.close()

    return [{"id": r[0], "name": r[1]} for r in rows]

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
    c.execute("""
        SELECT name, ip, vendor, username, password, auth_password, priv_password
        FROM device
        WHERE device_id = ?
    """, (device_id,))
    row = c.fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail="장비 정보를 찾을 수 없습니다.")

    name, ip, vendor, username, password, auth_pw, priv_pw = row

    device_info = {
        "id": device_id,
        "name": name,
        "ip": ip,
        "vendor": vendor,
        "username": username,
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

    try:
        if auth_pw and priv_pw:
            snmp_info = fetch_topology_snmpv3.fetch_snmpv3_info(ip, username, auth_pw, priv_pw)
            device_info.update(snmp_info)
    except Exception as e:
        print(f"[SNMPv3] 실패: {e}")

    try:
        info = fetch_topology_snmpv3.fetch_device_info_invoke(ip, username, password)
        status = fetch_topology_snmpv3.fetch_status_info_invoke(ip, username, password)
        device_info.update(info)
        device_info.update(status)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"CLI 정보 수집 실패: {e}")

    return device_info

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

@app.websocket("/ws/terminal/{device_id}")
async def ssh_terminal_ws(websocket: WebSocket, device_id: int):
    # DB에서 IP, 계정, 비밀번호 조회
    conn = sqlite3.connect("devices.db")
    c = conn.cursor()
    c.execute("SELECT ip, username, password FROM device WHERE device_id = ?", (device_id,))
    row = c.fetchone()
    conn.close()

    if not row:
        await websocket.accept()
        await websocket.send_text("[ERROR] 장비 정보를 찾을 수 없습니다.")
        await websocket.close()
        return

    ip, username, password = row
    terminal = SSHTerminal(ip, username, password)

    try:
        await terminal.websocket_handler(websocket)
    except WebSocketDisconnect:
        print(f"[DISCONNECTED] Device {device_id}")

@app.get("/api/performance")
def get_performance(device_id: int = None):
    conn = sqlite3.connect("devices.db")
    c = conn.cursor()

    query = """
        SELECT strftime('%H:%M', timestamp),
               CAST(REPLACE(cpu_usage, '%', '') AS INTEGER),
               CAST(REPLACE(mem_usage, '%', '') AS INTEGER)
        FROM device_stats
    """
    params = []

    if device_id:
        query += " WHERE device_id = ?"
        params.append(device_id)

    query += """
        GROUP BY strftime('%Y-%m-%d %H:%M', timestamp)
        ORDER BY timestamp DESC
        LIMIT 10
    """

    c.execute(query, params)
    rows = c.fetchall()
    conn.close()

    return [
        {"time": r[0], "cpu": r[1], "memory": r[2]}
        for r in reversed(rows)
    ]

@app.get("/api/alerts")
def get_alerts():
    return [
        {
            "message": "의심스러운 로그인 시도",
            "level": "높음",
            "detail": "203.0.113.42에서 관리자 계정으로 여러 번 로그인 시도"
        },
        {
            "message": "비정상적인 트래픽 패턴",
            "level": "중간",
            "detail": "Core Router에서 DDoS 의심 트래픽 감지"
        },
        {
            "message": "포트 스캔 감지",
            "level": "낮음",
            "detail": "198.51.100.75에서 포트 스캔 시도 감지"
        }
    ]

@app.get("/api/events")
def get_events():
    return [
        {
            "title": "Core Router 재부팅 완료",
            "description": "펌웨어 업데이트 후 성공적으로 재부팅됨",
            "timestamp": "15분 전"
        },
        {
            "title": "Access Switch 2 포트 다운",
            "description": "GigabitEthernet1/0/12 포트가 다운됨",
            "timestamp": "32분 전"
        },
        {
            "title": "구성 변경 감지됨",
            "description": "방화벽에서 새로운 ACL 규칙이 추가됨",
            "timestamp": "1시간 전"
        },
        {
            "title": "새 장치 감지됨",
            "description": "새 IP 장치가 네트워크에 연결되었습니다.",
            "timestamp": "2시간 전"
        }
    ]

@app.get("/api/performance-summary")
def get_performance_summary():
    conn = sqlite3.connect("devices.db")
    c = conn.cursor()
    c.execute("SELECT json FROM device_cache")
    rows = c.fetchall()
    conn.close()

    cpu_total, mem_total, if_total, device_total = 0, 0, 0, 0

    for r in rows:
        try:
            data = json.loads(r[0])
            cpu = int(data.get("cpuUsage", "0%").replace("%", ""))
            mem = int(data.get("memoryUsage", "0%").replace("%", ""))
            interfaces = int(data.get("interfaceCount", 0))
            cpu_total += cpu
            mem_total += mem
            if_total += interfaces
            device_total += 1
        except:
            continue

    avg_cpu = round(cpu_total / device_total, 1) if device_total else 0
    avg_mem = round(mem_total / device_total, 1) if device_total else 0

    return {
        "avg_cpu": f"{avg_cpu}%",
        "avg_memory": f"{avg_mem}%",
        "total_interfaces": if_total,
        "devices": device_total
    }

def collect_all_stats():
    print("[STATS] CPU/MEM 정보 수집 시작")
    conn = sqlite3.connect("devices.db")
    c = conn.cursor()
    c.execute("SELECT device_id, ip, username, password FROM device")
    devices = c.fetchall()
    conn.close()

    for device_id, ip, username, password in devices:
        try:
            stats = fetch_topology_snmpv3.fetch_status_info_invoke(ip, username, password)
            cpu = stats["cpuUsage"]
            mem = stats["memoryUsage"]

            conn = sqlite3.connect("devices.db")
            c = conn.cursor()
            c.execute("""
                INSERT INTO device_stats (device_id, cpu_usage, mem_usage)
                VALUES (?, ?, ?)
            """, (device_id, cpu, mem))
            conn.commit()
            conn.close()

            print(f"[STATS] {ip} → CPU={cpu}, MEM={mem}")

        except Exception as e:
            print(f"[STATS] {ip} 수집 실패: {e}")

@app.websocket("/ws/snort-log")
async def snort_log_ws(ws: WebSocket):
    await ws.accept()
    # tail -F 로 파일 변경분 스트리밍
    proc = await asyncio.create_subprocess_exec(
        "tail", "-F", "/var/log/snort/snort.alert.fast",
        stdout=subprocess.PIPE,
    )
    try:
        while True:
            line = await proc.stdout.readline()
            if not line:               # 파일 끝(거의 안 옴)
                await asyncio.sleep(0.1)
                continue
            await ws.send_text(line.decode(errors="ignore"))
    except WebSocketDisconnect:
        pass
    finally:
        proc.kill()

# 서버 시작 시 스케줄러도 시작
@app.on_event("startup")
def start_background_scheduler():
    if not scheduler.running:
        scheduler.add_job(collect_all_stats, 'interval', minutes=1)
        scheduler.start()
        print("[SCHEDULER] 성능 정보 수집 스케줄러 시작됨")
