import asyncio
import paramiko
from fastapi import WebSocket, WebSocketDisconnect

# ──────────────── SSH 접속 정보 ────────────────
SSH_HOST = "192.168.20.6"
SSH_USER = "nms"
SSH_KEY  = r"C:\\Users\\NLab\\.ssh\\id_rsa"

# 로그 파일 경로
SNORT_LOG_PATH        = "/var/log/snort/alert"
IDS_EVENTS_LOG_PATH   = "/var/log/snort/ids-events.log"
IDS_ALERTS_JSONL_PATH = "/var/log/snort/ids-alerts.jsonl"

# ──────────────────────────────────────────────────────
async def _ssh_tail(websocket: WebSocket, remote_path: str) -> None:
    """
    지정된 경로에 대해 SSH를 통한 tail -F 수행 (Ubuntu 쪽 로그 실시간 스트리밍)
    """
    await websocket.accept()
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    try:
        ssh.connect(
            hostname=SSH_HOST,
            username=SSH_USER,
            key_filename=SSH_KEY,
            look_for_keys=False,
            allow_agent=False,
        )
    except Exception as e:
        await websocket.send_text(f"[SSH 연결 오류] {e}")
        await websocket.close()
        return

    chan = ssh.get_transport().open_session()
    chan.exec_command(f"tail -n 10 -F {remote_path}")  # 최근 10개 + 실시간

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

# ──────────────────────────────────────────────────────
async def stream_snort_log(websocket: WebSocket) -> None:
    """Snort 일반 텍스트 로그 실시간 전송"""
    await _ssh_tail(websocket, SNORT_LOG_PATH)

async def stream_ids_alerts(websocket: WebSocket) -> None:
    """IDS 알림 로그 실시간 전송"""
    await _ssh_tail(websocket, IDS_ALERTS_JSONL_PATH)

async def stream_ids_events(websocket: WebSocket) -> None:
    """IDS 이벤트 로그 실시간 전송"""
    await _ssh_tail(websocket, IDS_EVENTS_LOG_PATH)
