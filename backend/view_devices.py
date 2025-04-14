import sqlite3

def print_devices():
    conn = sqlite3.connect("devices.db")
    c = conn.cursor()

    print("\n📌 device 테이블:")
    for row in c.execute("SELECT * FROM device"):
        print(row)

    print("\n🔗 link_info 테이블:")
    for row in c.execute("SELECT * FROM link_info"):
        print(row)

    print("\n📦 device_cache 테이블:")
    for row in c.execute("SELECT device_id, json FROM device_cache"):
        print(f"ID: {row[0]}, Cached JSON 길이: {len(row[1])}")

    conn.close()

if __name__ == "__main__":
    print_devices()
