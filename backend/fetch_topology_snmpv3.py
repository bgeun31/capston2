# fetch_topology_snmpv3.py

import yaml
import paramiko
import re
import sqlite3
from pysnmp.hlapi import (
    getCmd, SnmpEngine, UdpTransportTarget,
    ContextData, ObjectType, ObjectIdentity, UsmUserData, usmHMACSHAAuthProtocol,
    usmAesCfb128Protocol
)

def init_db(db_path="devices.db"):
    """
    DB 초기화: device, link_info 테이블이 없으면 생성
    """
    conn = sqlite3.connect(db_path)
    c = conn.cursor()

    c.execute('''
    CREATE TABLE IF NOT EXISTS device (
      device_id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      ip TEXT,
      vendor TEXT
    )
    ''')

    c.execute('''
    CREATE TABLE IF NOT EXISTS link_info (
      link_id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_a INTEGER,
      device_b INTEGER,
      interface_a TEXT,
      interface_b TEXT
    )
    ''')

    conn.commit()
    conn.close()

def insert_device(name, ip, vendor, db_path="devices.db"):
    """
    device 테이블에 신규 장비 등록
    (중복 방지를 위해 UNIQUE 키 등을 걸고 싶다면 schema/쿼리 수정)
    """
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    c.execute("INSERT INTO device (name, ip, vendor) VALUES (?, ?, ?)", (name, ip, vendor))
    device_id = c.lastrowid
    conn.commit()
    conn.close()
    return device_id

def insert_link(device_a, device_b, iface_a, iface_b, db_path="devices.db"):
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    c.execute("INSERT INTO link_info (device_a, device_b, interface_a, interface_b) VALUES (?, ?, ?, ?)",
              (device_a, device_b, iface_a, iface_b))
    conn.commit()
    conn.close()

def fetch_cli_info(ip, username, password, vendor):
    """
    SSH로 접속하여 show cdp neighbors 결과를 파싱
    """
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(ip, port=22, username=username, password=password, timeout=5)
    stdin, stdout, stderr = ssh.exec_command("show cdp neighbors")
    output = stdout.read().decode('utf-8', errors='ignore')
    ssh.close()

    # 단순 정규식으로 "이웃장비명, 로컬인터페이스, 리모트인터페이스" 추출
    pattern = r"(?P<remotedevice>\S+)\s+(?P<localif>\S+\s+\S+)\s+\d+\s+\S+\s+\S+\s+(?P<remoteif>\S+\s+\S+)"
    matches = re.findall(pattern, output)
    return matches

def fetch_snmpv3_info(ip, username, auth_pw, priv_pw):
    """
    SNMPv3로 sysName(1.3.6.1.2.1.1.5.0)을 가져오는 예시
    """
    iterator = getCmd(
        SnmpEngine(),
        UsmUserData(username, auth_pw, priv_pw,
                    authProtocol=usmHMACSHAAuthProtocol,
                    privProtocol=usmAesCfb128Protocol),
        UdpTransportTarget((ip, 161)),
        ContextData(),
        ObjectType(ObjectIdentity('1.3.6.1.2.1.1.5.0'))
    )
    errorIndication, errorStatus, errorIndex, varBinds = next(iterator)
    if errorIndication or errorStatus:
        return None
    for varBind in varBinds:
        return str(varBind[1])

def main():
    """
    fetch_topology_snmpv3의 핵심 함수
    - DB 초기화
    - devices.yaml 로드
    - 각 장비에 대해 SNMP / CLI 데이터 수집
    - device / link_info 테이블에 insert
    """
    init_db()  # 없으면 테이블 생성

    with open("devices.yaml", "r", encoding="utf-8") as f:
        config = yaml.safe_load(f)

    device_id_map = {}

    for dev in config["devices"]:
        name = dev["name"]
        ip = dev["ip"]
        vendor = dev.get("vendor", "unknown")

        # device 테이블에 insert
        d_id = insert_device(name, ip, vendor)
        device_id_map[name] = d_id

        # SNMP 수집 (sysName 등)
        if dev.get("snmp", False):
            try:
                sysname = fetch_snmpv3_info(
                    ip,
                    dev["username"],
                    dev["auth_password"],
                    dev["priv_password"]
                )
                if sysname:
                    print(f"[SNMPv3] {name} sysName = {sysname}")
                else:
                    print(f"[SNMPv3] fail to get sysName from {ip}")
            except Exception as e:
                print(f"[SNMPv3] error on {name}: {e}")

        # CLI 수집 (CDP neighbors) → link_info 테이블 작성
        if dev.get("cli", False):
            try:
                neighbors = fetch_cli_info(ip, dev["username"], dev["password"], vendor)
                for (nbrName, localIf, remoteIf) in neighbors:
                    if nbrName not in device_id_map:
                        # 아직 DB에 없는 neighbor 라면 임시 등록
                        nd_id = insert_device(nbrName, "0.0.0.0", "unknown")
                        device_id_map[nbrName] = nd_id
                    insert_link(d_id, device_id_map[nbrName], localIf, remoteIf)
            except Exception as ex:
                print(f"[CLI] fetch failed for {name}({ip}): {ex}")

    print("=== Done fetching device/link info ===")


# 단독 실행 시
if __name__ == "__main__":
    main()
