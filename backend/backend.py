from typing import List
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from pysnmp.hlapi.v3arch.asyncio import (
    get_cmd, SnmpEngine, CommunityData, UdpTransportTarget,
    ContextData, ObjectType, ObjectIdentity
)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 필요에 따라 도메인 제한
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 개별 OID에 대해 SNMP GET (비동기)
async def snmp_get(target_ip: str, community: str, oid: str):
    transport = await UdpTransportTarget.create((target_ip, 161), 5, 2)
    errorIndication, errorStatus, errorIndex, varBinds = await get_cmd(
        SnmpEngine(),
        CommunityData(community, mpModel=1),
        transport,
        ContextData(),
        ObjectType(ObjectIdentity(oid))
    )
    if errorIndication:
        return {"oid": oid, "error": str(errorIndication)}
    elif errorStatus:
        return {"oid": oid, "error": f"{errorStatus.prettyPrint()} at {errorIndex}"}
    else:
        return {
            "oid": str(varBinds[0][0]),
            "value": str(varBinds[0][1])
        }

@app.get("/snmp/multi")
async def get_snmp_multi():
    """
    여러 OID를 동시에 조회하는 예시.
    실제로는 OID를 쿼리 파라미터나 JSON 바디로 받아 처리할 수도 있습니다.
    """
    device_ip = "210.119.103.254"  # 실제 Cisco 라우터 IP
    community_string = "test"

    # 조회할 OID 목록 (예: sysDescr, sysUpTime, sysContact, sysName, sysLocation)
    oids = [
        "1.3.6.1.2.1.1.1.0",  # sysDescr
        "1.3.6.1.2.1.1.3.0",  # sysUpTime
        "1.3.6.1.2.1.1.4.0",  # sysContact
        "1.3.6.1.2.1.1.5.0",  # sysName
        "1.3.6.1.2.1.1.6.0",  # sysLocation
    ]

    results = []
    for oid in oids:
        res = await snmp_get(device_ip, community_string, oid)
        results.append(res)

    return {"results": results}
