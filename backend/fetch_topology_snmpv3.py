# fetch_topology_snmpv3.py (전체 통합 수정본)

import yaml
import paramiko
import re
import time
import sqlite3
import json
from pysnmp.hlapi import (
    getCmd, SnmpEngine, UdpTransportTarget,
    ContextData, ObjectType, ObjectIdentity, UsmUserData,
    usmHMACSHAAuthProtocol, usmAesCfb128Protocol
)

def init_db(db_path="devices.db"):
    conn = sqlite3.connect(db_path)
    c = conn.cursor()

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
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(ip, username=username, password=password, timeout=5)

    channel = ssh.invoke_shell()
    time.sleep(1)
    channel.send("terminal length 0\n")
    time.sleep(1)
    channel.send("show cdp neighbors\n")
    time.sleep(1)
    output = channel.recv(65535).decode('utf-8', errors='ignore')
    ssh.close()

    pattern = r"(?P<remotedevice>\S+)\s+(?P<localif>\S+\s+\S+)\s+\d+\s+\S+\s+\S+\s+(?P<remoteif>\S+\s+\S+)"
    matches = re.findall(pattern, output)
    return matches

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


def fetch_status_info_invoke(ip, username, password):
    try:
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect(ip, username=username, password=password, timeout=5)
        channel = ssh.invoke_shell()
        time.sleep(1)
        channel.send("terminal length 0\n")
        time.sleep(1)
        channel.send("show processes cpu | include CPU utilization\n")
        time.sleep(1)
        out1 = channel.recv(65535).decode('utf-8', 'ignore')
        channel.send("show processes memory | include Processor\n")
        time.sleep(1)
        out2 = channel.recv(65535).decode('utf-8', 'ignore')
        channel.send("show ip interface brief\n")
        time.sleep(1)
        out3 = channel.recv(65535).decode('utf-8', 'ignore')
        ssh.close()
        return {
            "cpuUsage": out1.strip(),
            "memoryUsage": out2.strip(),
            "interfaces": parse_interface_status(out3)
        }
    except Exception as e:
        print(f"[CLI fetch_status_info_invoke] Error for {ip}: {e}")
        return {
            "cpuUsage": "N/A",
            "memoryUsage": "N/A",
            "interfaces": []
        }

def fetch_device_info_invoke(ip, username, password):
    result = {
        "hostname": "N/A",
        "model": "N/A",
        "version": "N/A",
        "interfaceCount": 0
    }
    try:
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect(ip, username=username, password=password, timeout=5)
        channel = ssh.invoke_shell()
        time.sleep(1)
        channel.send("terminal length 0\n")
        time.sleep(1)
        channel.send("show version\n")
        time.sleep(2)
        ver_output = channel.recv(65535).decode('utf-8', 'ignore')
        host_match = re.search(r"^(\S+)\s+uptime is", ver_output, re.MULTILINE)
        if host_match:
            result["hostname"] = host_match.group(1)
        ver_match = re.search(r"Version\s+([\d()\.A-Za-z]+)", ver_output)
        if ver_match:
            result["version"] = ver_match.group(1)
        model_match = re.search(r"Cisco\s+(\S+)\s+.*processor", ver_output, re.IGNORECASE)
        if model_match:
            result["model"] = model_match.group(1)
        channel.send("show ip interface brief\n")
        time.sleep(2)
        int_output = channel.recv(65535).decode('utf-8', 'ignore')
        lines = int_output.strip().splitlines()
        count = sum(1 for ln in lines if len(ln.split()) >= 6 and "Interface" not in ln)
        result["interfaceCount"] = count
        ssh.close()
    except Exception as e:
        print(f"[fetch_device_info_invoke] Error for {ip}: {e}")
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

    device_id_map = {}
    for dev in config["devices"]:
        name = dev["name"]
        ip = dev["ip"]
        vendor = dev.get("vendor", "unknown")
        d_id = insert_device(name, ip, vendor, dev["username"], dev["password"], dev.get("auth_password"), dev.get("priv_password"))
        device_id_map[name] = d_id

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

        if dev.get("cli", False):
            try:
                neighbors = fetch_cli_info_invoke(ip, dev["username"], dev["password"])
                for (nbrName, localIf, remoteIf) in neighbors:
                    if nbrName not in device_id_map:
                        nd_id = insert_device(nbrName, "0.0.0.0", "unknown", "dummy", "dummy")
                        device_id_map[nbrName] = nd_id
                    insert_link(d_id, device_id_map[nbrName], localIf, remoteIf)
            except Exception as ex:
                print(f"[CLI] fetch failed for {name}({ip}): {ex}")

    fill_missing_device_cache()
    print("=== Done fetching device/link info ===")