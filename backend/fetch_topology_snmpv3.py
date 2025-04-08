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
      password TEXT
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


def insert_device(name, ip, vendor, username, password, db_path="devices.db"):
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    c.execute("""
        INSERT INTO device (name, ip, vendor, username, password)
        VALUES (?, ?, ?, ?, ?)
    """, (name, ip, vendor, username, password))
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

def fetch_cli_info(ip, username, password):
    """
    SSH로 'show cdp neighbors' → (neighborName, localIf, remoteIf) 리스트 반환
    """
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(ip, username=username, password=password, timeout=5)

    # 페이지 없이 전체 출력
    ssh.exec_command("terminal length 0")
    time.sleep(0.5)

    # show cdp neighbors
    stdin, stdout, stderr = ssh.exec_command("show cdp neighbors")
    cdp_out = stdout.read().decode('utf-8', errors='ignore')
    cdp_err = stderr.read().decode('utf-8', errors='ignore')
    ssh.close()

    print(f"[DEBUG] cdp neighbors stdout = {cdp_out.strip()}")
    print(f"[DEBUG] cdp neighbors stderr = {cdp_err.strip()}")

    pattern = r"(?P<remotedevice>\S+)\s+(?P<localif>\S+\s+\S+)\s+\d+\s+\S+\s+\S+\s+(?P<remoteif>\S+\s+\S+)"
    matches = re.findall(pattern, cdp_out)
    return matches

def fetch_snmpv3_info(ip, username, auth_pw, priv_pw):
    """
    SNMPv3로 sysName, sysDescr, uptime 등 가져오는 예시
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

def fetch_status_info(ip, username, password):
    """
    CPU/Memory/Interfaces 등 상태
    """
    try:
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect(ip, username=username, password=password, timeout=5)

        result = {}
        ssh.exec_command("terminal length 0")
        time.sleep(0.5)

        # CPU
        stdin, stdout, stderr = ssh.exec_command("show processes cpu | include CPU utilization")
        cpu_out = stdout.read().decode('utf-8', errors='ignore').strip()
        result["cpuUsage"] = cpu_out

        # Memory
        stdin, stdout, stderr = ssh.exec_command("show processes memory | include Processor")
        mem_out = stdout.read().decode('utf-8', errors='ignore').strip()
        result["memoryUsage"] = mem_out

        # Interfaces
        stdin, stdout, stderr = ssh.exec_command("show ip interface brief")
        int_out = stdout.read().decode('utf-8', errors='ignore')
        result["interfaces"] = parse_interface_status(int_out)

        ssh.close()
        return result

    except Exception as e:
        print(f"[CLI fetch_status_info] Error for {ip}: {e}")
        return {
            "cpuUsage": "N/A",
            "memoryUsage": "N/A",
            "interfaces": []
        }

def parse_interface_status(output):
    interfaces = []
    for line in output.splitlines():
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

def fetch_device_info(ip, username, password):
    """
    show version -> hostname, model, version
    show ip interface brief -> interfaceCount
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

        # terminal length
        ssh.exec_command("terminal length 0")
        time.sleep(0.5)

        # show version
        stdin, stdout, stderr = ssh.exec_command("show version")
        ver_output = stdout.read().decode('utf-8', errors='ignore')
        ssh_err = stderr.read().decode('utf-8', errors='ignore')

        # hostname ex) "R1 uptime is..."
        host_match = re.search(r"^(\S+)\s+uptime is", ver_output, re.MULTILINE)
        if host_match:
            result["hostname"] = host_match.group(1)

        # version ex) "Version 15.5(3)M2"
        ver_match = re.search(r"Version\s+([\d()\.A-Za-z]+)", ver_output)
        if ver_match:
            result["version"] = ver_match.group(1)

        # model ex) "Cisco 2911"...
        model_match = re.search(r"Cisco\s+(\S+)\s+.*processor", ver_output, re.IGNORECASE)
        if model_match:
            result["model"] = model_match.group(1)

        # show ip interface brief -> interface count
        stdin, stdout, stderr = ssh.exec_command("show ip interface brief")
        int_output = stdout.read().decode('utf-8', errors='ignore')
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
        print(f"[fetch_device_info] Error for {ip}: {e}")

    return result

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

        # DB에 device 저장
        d_id = insert_device(name, ip, vendor, dev["username"], dev["password"])
        device_id_map[name] = d_id

        # SNMP sysName 등 콘솔 출력 (DB 저장 X)
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

        # CLI -> CDP neighbors
        if dev.get("cli", False):
            try:
                neighbors = fetch_cli_info(ip, dev["username"], dev["password"])
                for (nbrName, localIf, remoteIf) in neighbors:
                    if nbrName not in device_id_map:
                        nd_id = insert_device(nbrName, "0.0.0.0", "unknown", "dummy", "dummy")
                        device_id_map[nbrName] = nd_id
                    insert_link(d_id, device_id_map[nbrName], localIf, remoteIf)
            except Exception as ex:
                print(f"[CLI] fetch failed for {name}({ip}): {ex}")

    print("=== Done fetching device/link info ===")

if __name__ == "__main__":
    main()
