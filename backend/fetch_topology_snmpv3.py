#fetch_topology_snmpv3.py

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
from db_multi import dual_commit, LocalSession
from sqlalchemy import text
from sqlalchemy import exc as sa_exc   # ← 맨 위 import 추가
import pymysql

# 도메인 이름을 제거하는 함수 추가
def normalize_device_name(name: str) -> str:
    """'SW2.capston.com' → 'SW2'"""
    return name.split('.')[0] if '.' in name else name

def init_db(db_path: str = "devices.db", *, reset: bool = True) -> None:
    """
    - 로컬 SQLite 파일과 RDS(MySQL)를 동시 초기화
    - reset=True  → 테이블 DROP 후 재생성
    - UNIQUE 인덱스, 중복 레코드 삭제까지 처리
    """
    import sqlite3, pymysql
    from db_multi import dual_commit
    from sqlalchemy import text
    from sqlalchemy.exc import OperationalError, ProgrammingError

    # ───────────────────── 테이블 정의 ──────────────────────
    TABLES = {
        "event_log": (
            """CREATE TABLE IF NOT EXISTS event_log (
                 id INTEGER PRIMARY KEY AUTOINCREMENT,
                 type TEXT, title TEXT, description TEXT,
                 severity TEXT, source TEXT,
                 timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)""",
            """CREATE TABLE IF NOT EXISTS event_log (
                 id INT AUTO_INCREMENT PRIMARY KEY,
                 type VARCHAR(20), title VARCHAR(255), description TEXT,
                 severity VARCHAR(10), source VARCHAR(50),
                 timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)"""
        ),
        "device": (
            """CREATE TABLE IF NOT EXISTS device (
                 device_id INTEGER PRIMARY KEY AUTOINCREMENT,
                 name TEXT, ip TEXT, vendor TEXT,
                 username TEXT, password TEXT,
                 auth_password TEXT, priv_password TEXT)""",
            """CREATE TABLE IF NOT EXISTS device (
                 device_id INT AUTO_INCREMENT PRIMARY KEY,
                 name VARCHAR(50), ip VARCHAR(45), vendor VARCHAR(20),
                 username VARCHAR(50), password VARCHAR(50),
                 auth_password VARCHAR(50), priv_password VARCHAR(50))"""
        ),
        "link_info": (
            """CREATE TABLE IF NOT EXISTS link_info (
                 link_id INTEGER PRIMARY KEY AUTOINCREMENT,
                 device_a INTEGER, device_b INTEGER,
                 interface_a TEXT, interface_b TEXT)""",
            """CREATE TABLE IF NOT EXISTS link_info (
                 link_id INT AUTO_INCREMENT PRIMARY KEY,
                 device_a INT, device_b INT,
                 interface_a VARCHAR(50), interface_b VARCHAR(50))"""
        ),
        "device_cache": (
            """CREATE TABLE IF NOT EXISTS device_cache (
                 device_id INTEGER PRIMARY KEY, json TEXT)""",
            """CREATE TABLE IF NOT EXISTS device_cache (
                 device_id INT PRIMARY KEY, json JSON)"""
        ),
        "device_stats": (
            """CREATE TABLE IF NOT EXISTS device_stats (
                 id INTEGER PRIMARY KEY AUTOINCREMENT,
                 device_id INTEGER,
                 timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                 cpu_usage TEXT, mem_usage TEXT)""",
            """CREATE TABLE IF NOT EXISTS device_stats (
                 id INT AUTO_INCREMENT PRIMARY KEY,
                 device_id INT,
                 timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                 cpu_usage VARCHAR(10), mem_usage VARCHAR(10))"""
        ),
    }

    # ───────────────────── SQLite 연결 ──────────────────────
    conn = sqlite3.connect(db_path)
    cur  = conn.cursor()

    # ───── 1) 필요 시 DROP ──────────────────────────────────
    if reset:
        for tbl in TABLES:
            cur.execute(f"DROP TABLE IF EXISTS {tbl}")
            dual_commit(f"DROP TABLE IF EXISTS {tbl}")

    # ───── 2) CREATE TABLES (두 DB 모두) ───────────────────
    for sql_lite, sql_my in TABLES.values():
        cur.execute(sql_lite)
        dual_commit(sql_my)

    # ───── 3) 중복 레코드 삭제 (공용 SQL) ─────
    DEDUP_SQL = """
    DELETE FROM event_log
    WHERE id NOT IN (
    SELECT id FROM (
        SELECT MIN(id) AS id
        FROM event_log
        GROUP BY source, type
    ) AS t
    )
    """
    cur.execute(DEDUP_SQL)      # SQLite
    conn.commit()               # 트랜잭션 종료
    dual_commit(DEDUP_SQL)      # MySQL

    # ───── 4) UNIQUE 인덱스 ───────────────────
    # 4-1) SQLite — IF NOT EXISTS 로 한 번만
    cur.execute("""
    CREATE UNIQUE INDEX IF NOT EXISTS uniq_event_src_type
    ON event_log(source, type)
    """)
    conn.commit()

    # 4-2) MySQL — 이미 있으면 1061 무시
    try:
        # dual_commit_mysql : 로컬 SQLite 쪽은 건너뛰도록 만든 작은 헬퍼
        def dual_commit_mysql(sql):
            dual_commit(sql, skip_sqlite=True)    # db_multi.py 쪽에 flag 한 줄 추가

        dual_commit_mysql("""
        CREATE UNIQUE INDEX uniq_event_src_type
        ON event_log(source, type)
        """)
    except sa_exc.ProgrammingError as e:
        # PyMySQL 1061 = Duplicate key name 'uniq_event_src_type'
        if isinstance(e.orig, pymysql.err.InternalError) and e.orig.args[0] == 1061:
            pass   # 이미 인덱스가 있으면 OK
        else:
            raise

    conn.commit()
    conn.close()

def _get_last_rowid() -> int:
    """Local SQLite 의 마지막 rowid 가져오기"""
    with LocalSession() as ses:
        return ses.execute(text("SELECT last_insert_rowid()")) .scalar()
    
def dedup_event_log(dialect: str = "sqlite"):
    if dialect == "sqlite":
        sql = """
        DELETE FROM event_log
        WHERE rowid NOT IN (
          SELECT MIN(rowid) FROM event_log
          GROUP BY source, type
        )
        """
    else:  # mysql
        sql = """
        DELETE e1 FROM event_log e1
        JOIN event_log e2
          ON e1.source = e2.source
         AND e1.type   = e2.type
         AND e1.id     > e2.id
        """
    dual_commit(sql)            # 두 DB 모두 실행

def insert_device(name: str, ip: str, vendor: str, username: str, password: str,
                  auth_pw: str | None = None, priv_pw: str | None = None) -> int:
    sql = """
        INSERT INTO device (name, ip, vendor, username, password, auth_password, priv_password)
        VALUES (:name, :ip, :vendor, :user, :pw, :auth, :priv)
    """
    dual_commit(sql, {
        "name": name,
        "ip": ip,
        "vendor": vendor,
        "user": username,
        "pw": password,
        "auth": auth_pw,
        "priv": priv_pw,
    })
    return _get_last_rowid()

def insert_link(device_a: int, device_b: int, iface_a: str, iface_b: str) -> None:
    dual_commit(
        """
        INSERT INTO link_info (device_a, device_b, interface_a, interface_b)
        VALUES (:a, :b, :ia, :ib)
        """,
        {"a": device_a, "b": device_b, "ia": iface_a, "ib": iface_b}
    )

def get_interface_states(ip, username, password):
    """{인터페이스: up/down} 딕셔너리 반환"""
    dev = dict(device_type="cisco_ios", host=ip,
               username=username, password=password, fast_cli=True)
    with ConnectHandler(**dev) as conn:
        conn.send_command("terminal length 0", strip_prompt=False)
        out = conn.send_command("show interfaces status", expect_string=r"#")
    states = {}
    for line in out.splitlines():
        parts = line.split()
        if len(parts) >= 4 and parts[0].startswith("Gi"):  # 예: Gi0/1
            iface, status = parts[0], parts[1].lower()
            states[iface] = "up" if status == "connected" else "down"
    return states



def cache_device_details(device_id: int, name: str, ip: str, vendor: str,
                          username: str, password: str,
                          auth_pw: str | None = None, priv_pw: str | None = None) -> None:
    device_info = {
        "id": device_id,
        "name": name,
        "ip": ip,
        "vendor": vendor,
        "username": username,
    }

    # SNMPv3
    if auth_pw and priv_pw:
        try:
            device_info.update(fetch_snmpv3_info(ip, username, auth_pw, priv_pw))
        except Exception as exc:
            print(f"[SNMPv3] {name} 오류: {exc}")

    # CLI 상세 정보
    device_info.update(fetch_device_info_invoke(ip, username, password))
    device_info.update(fetch_status_info_invoke(ip, username, password))

    # REPLACE → dual_commit
    dual_commit(
        "REPLACE INTO device_cache (device_id, json) VALUES (:id, :json)",
        {"id": device_id, "json": json.dumps(device_info)}
    )

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

    # RDS 도 비워주려면 dual_commit 으로 DELETE 실행
    for tbl in ("link_info", "device", "device_cache"):
        dual_commit(f"DELETE FROM {tbl}")

    with open("devices.yaml", encoding="utf-8") as f:
        config = yaml.safe_load(f)

    device_id_map: dict[str, int] = {}

    # 1) 장비 YAML → device 테이블
    for dev in config["devices"]:
        name = normalize_device_name(dev["name"])
        ip = dev["ip"]
        vendor = dev.get("vendor", "unknown")
        did = insert_device(name, ip, vendor, dev["username"], dev["password"],
                             dev.get("auth_password"), dev.get("priv_password"))
        device_id_map[name] = did

        try:
            cache_device_details(did, name, ip, vendor, dev["username"], dev["password"],
                                 dev.get("auth_password"), dev.get("priv_password"))
        except Exception as ex:
            print(f"[cache] {name} 실패: {ex}")

    # 2) CDP 링크 수집
    pending_links: list[tuple[int, int, str, str]] = []
    for dev in config["devices"]:
        if not dev.get("cli", False):
            continue
        name = normalize_device_name(dev["name"])
        ip   = dev["ip"]
        try:
            for nbr, local_if, remote_if in fetch_cli_info_invoke(ip, dev["username"], dev["password"]):
                nbr = normalize_device_name(nbr)
                if nbr not in device_id_map:
                    nbr_id = insert_device(nbr, "0.0.0.0", "unknown", "dummy", "dummy")
                    device_id_map[nbr] = nbr_id
                pending_links.append((device_id_map[name], device_id_map[nbr], local_if, remote_if))
        except Exception as ex:
            print(f"[CLI] {name}({ip}) 실패: {ex}")

    # 3) 링크 중복 제거 후 삽입
    unique: set[tuple[int, int, str, str]] = set()
    for d1, d2, if1, if2 in pending_links:
        if d1 > d2:
            d1, d2, if1, if2 = d2, d1, if2, if1
        key = (d1, d2, if1, if2)
        if key not in unique:
            unique.add(key)
            insert_link(d1, d2, if1, if2)
            print(f"[LINK] {d1}<->{d2}  {if1}<->{if2}")

    print("=== Done ===")

if __name__ == "__main__":
    main()