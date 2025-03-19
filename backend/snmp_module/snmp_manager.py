# snmp_manager.py
import asyncio
from pysnmp.hlapi.v3arch.asyncio import (
    get_cmd,
    SnmpEngine,
    CommunityData,
    UdpTransportTarget,
    ContextData,
    ObjectType,
    ObjectIdentity
)

async def snmp_get(target_ip, community, oid):
    """
    특정 OID에 대해 SNMP GET 요청(비동기)
    """
    # 1) TransportTarget를 만들 때도 await가 필요
    transport = await UdpTransportTarget.create((target_ip, 161))
    
    # 2) get_cmd(...) 결과 또한 await해야 함
    #    이때, 반환값은 (errorIndication, errorStatus, errorIndex, varBinds) 형태의 튜플
    errorIndication, errorStatus, errorIndex, varBinds = await get_cmd(
        SnmpEngine(),
        CommunityData(community, mpModel=1),
        transport,
        ContextData(),
        ObjectType(ObjectIdentity(oid))
    )
    
    # 3) SNMP 응답 처리
    if errorIndication:
        return f"SNMP Error: {errorIndication}"
    elif errorStatus:
        return f"SNMP Error: {errorStatus.prettyPrint()} at {errorIndex}"
    else:
        # varBinds는 [(OID, Value), (OID, Value), ...] 형태
        for varBind in varBinds:
            return f"{varBind[0]} = {varBind[1]}"
