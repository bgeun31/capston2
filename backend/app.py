# app.py

import sqlite3
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

# fetch_topology_snmpv3.py 에서 main() 함수를 import
import fetch_topology_snmpv3

app = FastAPI()

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 운영 시엔 특정 도메인만 허용하는 것이 안전
    allow_methods=["*"],
    allow_headers=["*"]
)

# 서버가 실행될 때마다 자동으로 호출되는 함수
@app.on_event("startup")
def startup_event():
    """
    FastAPI 서버 uvicorn 구동 시 자동 호출:
    - DB 초기화
    - devices.yaml 기반으로 SNMP/CLI 정보를 수집해 DB에 반영
    """
    print("=== Startup event triggered ===")
    fetch_topology_snmpv3.main()

@app.get("/api/topology")
def get_topology():
    """
    DB의 device, link_info 정보를 조회하여 전체 토폴로지를 반환
    """
    conn = sqlite3.connect("devices.db")
    c = conn.cursor()

    # 노드 조회
    nodes = []
    for row in c.execute("SELECT device_id, name, ip, vendor FROM device"):
        d = {
            "id": row[0],
            "name": row[1],
            "ip": row[2],
            "vendor": row[3]
        }
        nodes.append(d)

    # 링크 조회
    links = []
    for row in c.execute("SELECT link_id, device_a, device_b, interface_a, interface_b FROM link_info"):
        link = {
            "id": row[0],
            "source": row[1],
            "target": row[2],
            "ifaceA": row[3],
            "ifaceB": row[4]
        }
        links.append(link)

    conn.close()
    return {"nodes": nodes, "links": links}


@app.get("/api/device/{device_id}")
def get_device_detail(device_id: int):
    """
    특정 device_id에 대한 상세 정보를 조회하는 예시 엔드포인트
    """
    conn = sqlite3.connect("devices.db")
    c = conn.cursor()

    c.execute("SELECT device_id, name, ip, vendor FROM device WHERE device_id = ?", (device_id,))
    row = c.fetchone()
    if not row:
        conn.close()
        return {"error": "Device not found"}

    device_info = {
        "id": row[0],
        "name": row[1],
        "ip": row[2],
        "vendor": row[3]
        # 필요 시 추가 컬럼(예: sysName, cpuUsage 등)도 가져와서 여기에 넣을 수 있음
    }

    conn.close()
    return device_info
