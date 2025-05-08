# snort_log_streamer.py
"""
Ubuntu VM(192.168.20.6)에서 Snort 로그 및 IDS 이벤트 로그를 tail -F 하여
FastAPI 백엔드의 WebSocket으로 실시간 전송.

패키지: paramiko (pip install paramiko), aiofiles (pip install aiofiles)
"""

import asyncio
import paramiko
from fastapi import WebSocket, WebSocketDisconnect

# ──────────────── SSH 접속 정보 ────────────────
SSH_HOST = "192.168.20.6"            # Ubuntu VM IP
SSH_USER = "nms"                     # 앞서 만든 계정
SSH_KEY  = r"C:\\Users\\NLab\\.ssh\\id_rsa"  # 개인키 경로
# SSH_PW = "1234"                    # 키 대신 비밀번호 사용 시 주석 해제

# 로그 파일 경로
SNORT_LOG_PATH      = "/var/log/snort/alert"
IDS_EVENTS_LOG_PATH = "/var/log/snort/ids-events.log"

async def _ssh_tail(websocket: WebSocket, remote_path: str) -> None:
    """
    SSH로 원격 tail -F 세션을 열어 WebSocket으로 스트리밍.
    """
    await websocket.accept()
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    try:
        ssh.connect(
            SSH_HOST,
            username=SSH_USER,
            key_filename=SSH_KEY,
            # password=SSH_PW,      # 비밀번호 사용 시
            look_for_keys=False,
            allow_agent=False,
        )
    except Exception as e:
        await websocket.send_text(f"[SSH 연결 오류] {e}")
        await websocket.close()
        return

    chan = ssh.get_transport().open_session()
    chan.exec_command(f"tail -n 0 -F {remote_path}")

    try:
        while True:
            if chan.recv_ready():
                data = chan.recv(4096).decode(errors="ignore")
                for line in data.splitlines():
                    await websocket.send_text(line)
            await asyncio.sleep(0.1)
    except WebSocketDisconnect:
        pass
    finally:
        chan.close()
        ssh.close()

async def stream_snort_log(websocket: WebSocket) -> None:
    """
    Snort alert 텍스트 로그를 WebSocket으로 전송.
    """
    await _ssh_tail(websocket, SNORT_LOG_PATH)

async def stream_ids_events(websocket: WebSocket) -> None:
    """
    IDS 차단/해제 이벤트 로그를 WebSocket으로 전송.
    """
    await _ssh_tail(websocket, IDS_EVENTS_LOG_PATH)
