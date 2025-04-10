# fetch_topology_snmpv3.py

import yaml
import paramiko
import re
import time
import sqlite3
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

def fetch_cli_info_invoke(ip, username, password):
    """
    invoke_shell()로 대화형 세션을 열고, show cdp neighbors 실행
    """
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(ip, username=username, password=password, timeout=5)

    channel = ssh.invoke_shell()
    time.sleep(1)

    # (필요시 enable 모드 진입)
    # channel.send('enable\n')
    # time.sleep(1)
    # channel.send('your_enable_password\n')
    # time.sleep(1)

    channel.send("terminal length 0\n")
    time.sleep(1)

    # CDP 이웃 조회
    channel.send("show cdp neighbors\n")
    time.sleep(1)

    output = channel.recv(65535).decode('utf-8', errors='ignore')
    ssh.close()

    # 정규식 파싱
    pattern = r"(?P<remotedevice>\S+)\s+(?P<localif>\S+\s+\S+)\s+\d+\s+\S+\s+\S+\s+(?P<remoteif>\S+\s+\S+)"
    matches = re.findall(pattern, output)
    return matches

def fetch_snmpv3_info(ip, username, auth_pw, priv_pw):
    """
    SNMPv3 sysName, sysDescr, uptime
    """
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

def fetch_status_info_invoke(ip, username, password):
    """
    invoke_shell()로 CPU, Mem, Interfaces
    """
    try:
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect(ip, username=username, password=password, timeout=5)

        channel = ssh.invoke_shell()
        time.sleep(1)

        channel.send("terminal length 0\n")
        time.sleep(1)

        # CPU
        channel.send("show processes cpu | include CPU utilization\n")
        time.sleep(1)
        out1 = channel.recv(65535).decode('utf-8', 'ignore')

        # Memory
        channel.send("show processes memory | include Processor\n")
        time.sleep(1)
        out2 = channel.recv(65535).decode('utf-8', 'ignore')

        # Interfaces
        channel.send("show ip interface brief\n")
        time.sleep(1)
        out3 = channel.recv(65535).decode('utf-8', 'ignore')

        ssh.close()

        # 파싱
        result = {}
        result["cpuUsage"] = out1.strip()
        result["memoryUsage"] = out2.strip()
        result["interfaces"] = parse_interface_status(out3)
        return result

    except Exception as e:
        print(f"[CLI fetch_status_info_invoke] Error for {ip}: {e}")
        return {
            "cpuUsage": "N/A",
            "memoryUsage": "N/A",
            "interfaces": []
        }

def fetch_device_info_invoke(ip, username, password):
    """
    invoke_shell()로 show version, show ip interface brief
    => hostname, model, version, interfaceCount
    """
    import re
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

        # show version
        channel.send("show version\n")
        time.sleep(2)
        ver_output = channel.recv(65535).decode('utf-8', 'ignore')

        # hostname
        host_match = re.search(r"^(\S+)\s+uptime is", ver_output, re.MULTILINE)
        if host_match:
            result["hostname"] = host_match.group(1)

        # version
        ver_match = re.search(r"Version\s+([\d()\.A-Za-z]+)", ver_output)
        if ver_match:
            result["version"] = ver_match.group(1)

        # model
        model_match = re.search(r"Cisco\s+(\S+)\s+.*processor", ver_output, re.IGNORECASE)
        if model_match:
            result["model"] = model_match.group(1)

        # show ip interface brief -> interfaceCount
        channel.send("show ip interface brief\n")
        time.sleep(2)
        int_output = channel.recv(65535).decode('utf-8', 'ignore')

        lines = int_output.strip().splitlines()
        count = 0
        for ln in lines:
            if "Interface" in ln or "unassigned" in ln or "---" in ln:
                continue
            parts = ln.split()
            if len(parts) >= 6:
                count += 1
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

    # DB 초기화
    conn = sqlite3.connect("devices.db")
    c = conn.cursor()
    c.execute("DELETE FROM link_info")
    c.execute("DELETE FROM device")
    conn.commit()
    conn.close()

    with open("devices.yaml", "r", encoding="utf-8") as f:
        config = yaml.safe_load(f)

    device_id_map = {}
    for dev in config["devices"]:
        name   = dev["name"]
        ip     = dev["ip"]
        vendor = dev.get("vendor", "unknown")

        # insert device
        d_id = insert_device(
            name, ip, vendor,
            dev["username"], dev["password"],
            dev.get("auth_password"), dev.get("priv_password")
        )
        device_id_map[name] = d_id

        # SNMP (옵션)
        if dev.get("snmp", False):
            try:
                snmp_info = fetch_snmpv3_info(
                    ip,
                    dev["username"],
                    dev["auth_password"],
                    dev["priv_password"]
                )
                print(f"[SNMPv3] {name} sysName = {snmp_info}")
            except Exception as e:
                print(f"[SNMPv3] error on {name}: {e}")

        # CLI -> cdp neighbors
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

    print("=== Done fetching device/link info ===")
