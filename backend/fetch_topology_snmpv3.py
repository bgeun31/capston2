
import yaml
import paramiko
import re
import sqlite3
from pysnmp.hlapi import (
    getCmd, SnmpEngine, UdpTransportTarget,
    ContextData, ObjectType, ObjectIdentity, UsmUserData, usmHMACSHAAuthProtocol,
    usmAesCfb128Protocol
)

# -- DB 초기화 함수 --
def init_db(db_path="devices.db"):
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
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(ip, port=22, username=username, password=password, timeout=5)
    stdin, stdout, stderr = ssh.exec_command("show cdp neighbors")
    output = stdout.read().decode('utf-8', errors='ignore')
    ssh.close()
    pattern = r"(?P<remotedevice>\S+)\s+(?P<localif>\S+\s+\S+)\s+\d+\s+\S+\s+\S+\s+(?P<remoteif>\S+\s+\S+)"
    matches = re.findall(pattern, output)
    return matches

def fetch_snmpv3_info(ip, username, auth_pw, priv_pw):
    iterator = getCmd(
        SnmpEngine(),
        UsmUserData(username, auth_pw, priv_pw,
                    authProtocol=usmHMACSHAAuthProtocol,
                    privProtocol=usmAesCfb128Protocol),
        UdpTransportTarget((ip, 161)),
        ContextData(),
        ObjectType(ObjectIdentity('1.3.6.1.2.1.1.5.0'))  # sysName
    )
    errorIndication, errorStatus, errorIndex, varBinds = next(iterator)
    if errorIndication or errorStatus:
        return None
    for varBind in varBinds:
        return str(varBind[1])

def main():
    init_db()
    with open("devices.yaml", "r", encoding="utf-8") as f:
        config = yaml.safe_load(f)

    device_id_map = {}

    for dev in config["devices"]:
        name = dev["name"]
        ip = dev["ip"]
        vendor = dev.get("vendor", "unknown")
        d_id = insert_device(name, ip, vendor)
        device_id_map[name] = d_id

        # SNMP 정보 수집
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

        # CLI 정보 수집 (연결 정보)
        if dev.get("cli", False):
            try:
                neighbors = fetch_cli_info(ip, dev["username"], dev["password"], vendor)
                for (nbrName, localIf, remoteIf) in neighbors:
                    if nbrName not in device_id_map:
                        nd_id = insert_device(nbrName, "0.0.0.0", "unknown")
                        device_id_map[nbrName] = nd_id
                    insert_link(d_id, device_id_map[nbrName], localIf, remoteIf)
            except Exception as ex:
                print(f"[CLI] fetch failed for {name}({ip}): {ex}")

    print("=== Done fetching device/link info ===")

if __name__ == "__main__":
    main()
