# app.py
import sqlite3
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
app.add_middleware(
    CORSMiddleware, 
    allow_origins=["*"],  # 필요 시 특정 도메인만
    allow_methods=["*"],
    allow_headers=["*"]
)

@app.get("/api/topology")
def get_topology():
    conn = sqlite3.connect("devices.db")
    c = conn.cursor()
    
    # 노드 목록
    nodes = []
    for row in c.execute("SELECT device_id, name, ip, vendor FROM device"):
        d = {
          "id": row[0],
          "name": row[1],
          "ip": row[2],
          "vendor": row[3]
        }
        nodes.append(d)
    
    # 링크(간선) 목록
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
