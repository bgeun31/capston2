import yaml
from netmiko import ConnectHandler
import re
import time
import sqlite3
import json
from pysnmp.hlapi import (
    getCmd, SnmpEngine, UdpTransportTarget,
    ContextData, ObjectType, ObjectIdentity, UsmUserData,
    usmHMACSHAAuthProtocol, usmAesCfb128Protocol
)

# 도메인 이름을 제거하는 함수 추가
def normalize_device_name(name):
    # 'SW2.capston.com'과 같은 형식에서 순수 호스트명만 추출
    if '.' in name:
        return name.split('.')[0]
    return name

def init_db(db_path="devices.db"):
    conn = sqlite3.connect(db_path)
    c = conn.cursor()

    # 모든 테이블 삭제
    c.execute("DROP TABLE IF EXISTS device")
    c.execute("DROP TABLE IF EXISTS link_info")
    c.execute("DROP TABLE IF EXISTS device_cache")

    # 테이블 재생성 (AUTOINCREMENT 초기화됨)
    c.execute('''
    CREATE TABLE IF NOT EXISTS device (
      device_id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      ip TEXT,
      vendor TEXT,
      username TEXT,
      password TEXT,
      auth_password TEXT,
      priv_password TEXT
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
    c.execute('''
    CREATE TABLE IF NOT EXISTS device_cache (
      device_id INTEGER PRIMARY KEY,
      json TEXT
    )
    ''')
    
    c.execute('''
    CREATE TABLE IF NOT EXISTS device_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id INTEGER,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      cpu_usage TEXT,
      mem_usage TEXT
    )
    ''')

    conn.commit()
    conn.close()

def insert_device(name, ip, vendor, username, password, auth_pw=None, priv_pw=None, db_path="devices.db"):
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    c.execute("""
        INSERT INTO device (name, ip, vendor, username, password, auth_password, priv_password)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (name, ip, vendor, username, password, auth_pw, priv_pw))
    device_id = c.lastrowid
    conn.commit()
    conn.close()
    return device_id

def insert_link(device_a, device_b, iface_a, iface_b, db_path="devices.db"):
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    c.execute("""
        INSERT INTO link_info (device_a, device_b, interface_a, interface_b)
        VALUES (?, ?, ?, ?)
    """, (device_a, device_b, iface_a, iface_b))
    conn.commit()
    conn.close()

def cache_device_details(device_id, name, ip, vendor, username, password, auth_pw=None, priv_pw=None, db_path="devices.db"):
    device_info = {
        "id": device_id,
        "name": name,
        "ip": ip,
        "vendor": vendor,
        "username": username
    }

    if auth_pw and priv_pw:
        try:
            snmp_data = fetch_snmpv3_info(ip, username, auth_pw, priv_pw)
            device_info.update(snmp_data)
        except Exception as e:
            print(f"[SNMPv3] {name} SNMP 오류: {e}")

    details = fetch_device_info_invoke(ip, username, password)
    status = fetch_status_info_invoke(ip, username, password)

    device_info.update(details)
    device_info.update(status)

    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    c.execute("REPLACE INTO device_cache (device_id, json) VALUES (?, ?)", (device_id, json.dumps(device_info)))
    conn.commit()
    conn.close()

def fetch_cli_info_invoke(ip, username, password):
    """
    CDP 이웃 정보를 Netmiko로 수집해
    (remoteDevice, localIf, remoteIf) 튜플 리스트를 반환
    """
    dev = {
        "device_type": "cisco_ios",
        "host": ip,
        "username": username,
        "password": password,
        "fast_cli": True,
    }

    try:
        with ConnectHandler(**dev) as conn:
            conn.send_command("terminal length 0", strip_prompt=False)
            output = conn.send_command("show cdp neighbors", expect_string=r"#")
    except Exception as e:
        print(f"[CLI] CDP fetch error on {ip}: {e}")
        return []                       # ← 실패 시 빈 리스트 반환

    # ── CDP 텍스트 파싱 ─────────────────────────────
    pattern = (
        r"(?P<remotedevice>\S+)\s+"            # 이웃 장비 ID
        r"(?P<localif>\S+\s+\S+)\s+\d+\s+\S+\s+\S+\s+"
        r"(?P<remoteif>\S+\s+\S+)"             # 이웃의 포트
    )
    matches = re.findall(pattern, output)

    # 호스트 이름 정규화 + 결과 리스트 구성
    normalized_matches = []
    for remotedevice, localif, remoteif in matches:
        normalized_name = normalize_device_name(remotedevice)
        normalized_matches.append((normalized_name, localif, remoteif))

    return normalized_matches              # ← 반드시 리스트 반환

def fetch_snmpv3_info(ip, username, auth_pw, priv_pw):
    result = {}
    oids = {
        "sysName": '1.3.6.1.2.1.1.5.0',
        "sysDescr": '1.3.6.1.2.1.1.1.0',
        "uptime": '1.3.6.1.2.1.1.3.0'
    }
    for key, oid in oids.items():
        iterator = getCmd(
            SnmpEngine(),
            UsmUserData(username, auth_pw, priv_pw,
                        authProtocol=usmHMACSHAAuthProtocol,
                        privProtocol=usmAesCfb128Protocol),
            UdpTransportTarget((ip, 161)),
            ContextData(),
            ObjectType(ObjectIdentity(oid))
        )
        errorIndication, errorStatus, errorIndex, varBinds = next(iterator)
        if errorIndication or errorStatus:
            print(f"[SNMPv3] {ip} OID {oid} fetch error: {errorIndication or errorStatus}")
            result[key] = "N/A"
        else:
            result[key] = str(varBinds[0][1])
    return result

def fill_missing_device_cache(db_path="devices.db"):
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    c.execute("SELECT device_id, name, ip, vendor, username, password FROM device")
    all_devices = c.fetchall()
    c.execute("SELECT device_id FROM device_cache")
    cached_ids = {row[0] for row in c.fetchall()}
    conn.close()

    for device in all_devices:
        device_id, name, ip, vendor, username, password = device

        # 0.0.0.0 같은 잘못된 IP는 건너뛴다
        if ip == "0.0.0.0":
            print(f"[cache:skip] {name} 은(는) 유효한 IP가 아니므로 캐시 생략")
            continue

        if device_id not in cached_ids:
            try:
                print(f"[cache:fill] {name} 캐시 누락 → 채우기")
                cache_device_details(device_id, name, ip, vendor, username, password)
            except Exception as e:
                print(f"[cache:fill] {name} 실패: {e}")

def extract_cpu_percentage(output: str):
    match = re.search(r"CPU utilization.*?(\d+)%", output)
    return match.group(1) + "%" if match else "N/A"

def extract_memory_percentage(output: str):
    match = re.search(r"Total:\s+(\d+)\s+Used:\s+(\d+)", output)
    if match:
        total = int(match.group(1))
        used = int(match.group(2))
        if total > 0:
            percent = (used / total) * 100
            return f"{int(percent)}%"
    return "N/A"

def fetch_status_info_invoke(ip, username, password):
    try:
        cisco = dict(
            device_type="cisco_ios",
            host=ip,
            username=username,
            password=password,
            fast_cli=True,
        )
        with ConnectHandler(**cisco) as conn:
            conn.send_command("terminal length 0", strip_prompt=False)

            cpu_raw = conn.send_command(
                "show processes cpu | include CPU utilization", expect_string=r"#"
            )
            mem_raw = conn.send_command(
                "show processes memory | include Processor", expect_string=r"#"
            )
            int_raw = conn.send_command(
                "show ip interface brief", expect_string=r"#"
            )

        return {
            "cpuUsage": extract_cpu_percentage(cpu_raw),
            "memoryUsage": extract_memory_percentage(mem_raw),
            "interfaces": parse_interface_status(int_raw),
        }

    except Exception as e:
        print(f"[fetch_status_info_invoke] {ip} → {e}")
        return {
            "cpuUsage": "N/A",
            "memoryUsage": "N/A",
            "interfaces": [],
        }

def fetch_device_info_invoke(ip, username, password):
    result = {
        "hostname": "N/A",
        "model": "N/A",
        "version": "N/A",
        "interfaceCount": 0,
    }

    try:
        cisco = dict(
            device_type="cisco_ios",
            host=ip,
            username=username,
            password=password,
            fast_cli=True,
        )
        with ConnectHandler(**cisco) as conn:
            conn.send_command("terminal length 0", strip_prompt=False)

            # show version
            ver_output = conn.send_command("show version", expect_string=r"#")

            if m := re.search(r"^(\S+)\s+uptime is", ver_output, re.M):
                result["hostname"] = m.group(1)

            if m := re.search(r"Version\s+([\d()\.A-Za-z]+)", ver_output):
                result["version"] = m.group(1)

            if m := re.search(r"Cisco\s+(\S+)\s+.*processor", ver_output, re.I):
                result["model"] = m.group(1)

            # interface count
            int_brief = conn.send_command("show ip interface brief", expect_string=r"#")
            lines = int_brief.strip().splitlines()
            result["interfaceCount"] = sum(
                1 for ln in lines if len(ln.split()) >= 6 and "Interface" not in ln
            )

    except Exception as e:
        print(f"[fetch_device_info_invoke] {ip} → {e}")

    return result

def parse_interface_status(output):
    interfaces = []
    lines = output.splitlines()
    for line in lines:
        if "Interface" in line or "unassigned" in line or "---" in line:
            continue
        parts = line.split()
        if len(parts) >= 6:
            interfaces.append({
                "name": parts[0],
                "ip": parts[1],
                "status": parts[4],
                "protocol": parts[5]
            })
    return interfaces

def main():
    init_db()

    conn = sqlite3.connect("devices.db")
    c = conn.cursor()
    c.execute("DELETE FROM link_info")
    c.execute("DELETE FROM device")
    c.execute("DELETE FROM device_cache")
    conn.commit()
    conn.close()

    with open("devices.yaml", "r", encoding="utf-8") as f:
        config = yaml.safe_load(f)

    # 최초 장비 목록 추가 (devices.yaml에서)
    device_id_map = {}  # 장비 이름 -> 장비 ID 매핑
    known_ips = {}      # 장비 IP -> 장비 ID 매핑 (IP가 있는 장비만)
    
    for dev in config["devices"]:
        name = normalize_device_name(dev["name"])  # 장비 이름 정규화
        ip = dev["ip"]
        vendor = dev.get("vendor", "unknown")
        d_id = insert_device(name, ip, vendor, dev["username"], dev["password"], dev.get("auth_password"), dev.get("priv_password"))
        device_id_map[name] = d_id
        
        if ip and ip != "0.0.0.0":
            known_ips[ip] = d_id

        try:
            cache_device_details(d_id, name, ip, vendor, dev["username"], dev["password"], dev.get("auth_password"), dev.get("priv_password"))
        except Exception as e:
            print(f"[cache] {name} failed: {e}")

        if dev.get("snmp", False):
            try:
                snmp_info = fetch_snmpv3_info(ip, dev["username"], dev["auth_password"], dev["priv_password"])
                print(f"[SNMPv3] {name} sysName = {snmp_info}")
            except Exception as e:
                print(f"[SNMPv3] error on {name}: {e}")

    # CDP로 이웃 장비 및 링크 정보 수집
    pending_links = []  # 링크 정보를 임시 저장 (장비 병합 후 처리)
    
    for dev in config["devices"]:
        name = normalize_device_name(dev["name"])
        ip = dev["ip"]
        d_id = device_id_map[name]
        
        if not dev.get("cli", False):
            continue
            
        try:
            neighbors = fetch_cli_info_invoke(ip, dev["username"], dev["password"])
            for (nbrName, localIf, remoteIf) in neighbors:
                normalized_nbr_name = normalize_device_name(nbrName)  # CDP에서 발견된 이웃 이름도 정규화
                
                # 이미 알고 있는 장비인지 확인
                if normalized_nbr_name in device_id_map:
                    # 이미 알려진 장비 ID 사용
                    nbr_id = device_id_map[normalized_nbr_name]
                    pending_links.append((d_id, nbr_id, localIf, remoteIf))
                else:
                    # 새로운 장비 등록 (IP가 없는 상태로)
                    nbr_id = insert_device(normalized_nbr_name, "0.0.0.0", "unknown", "dummy", "dummy")
                    device_id_map[normalized_nbr_name] = nbr_id
                    pending_links.append((d_id, nbr_id, localIf, remoteIf))
        except Exception as ex:
            print(f"[CLI] fetch failed for {name}({ip}): {ex}")
    
    # 링크 정보 저장 (중복 제거)
    unique_links = set()
    for d_id, nbr_id, localIf, remoteIf in pending_links:
        # 링크의 방향을 정규화 (작은 ID가 항상 앞에 오도록)
        if d_id > nbr_id:
            d_id, nbr_id = nbr_id, d_id
            localIf, remoteIf = remoteIf, localIf
            
        # 링크 핑거프린트 생성
        link_key = (d_id, nbr_id, localIf, remoteIf)
        if link_key not in unique_links:
            unique_links.add(link_key)
            insert_link(d_id, nbr_id, localIf, remoteIf)
            print(f"[LINK] Added: {d_id} <-> {nbr_id} ({localIf} <-> {remoteIf})")

    fill_missing_device_cache()
    print("=== Done fetching device/link info ===")