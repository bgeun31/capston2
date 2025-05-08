"""
Ubuntu VM(192.168.20.6)에서 Snort 로그 및 IDS 이벤트 로그를 tail -F 하여
FastAPI 백엔드의 WebSocket으로 실시간 전송.

패키지: paramiko (pip install paramiko), aiofiles (pip install aiofiles)
"""

import asyncio
import paramiko
import aiofiles
from fastapi import WebSocket, WebSocketDisconnect
import os

# ──────────────── SSH 접속 정보 ────────────────
SSH_HOST = "192.168.20.6"
SSH_USER = "nms"
SSH_KEY  = r"C:\\Users\\NLab\\.ssh\\id_rsa"

# 로그 파일 경로
SNORT_LOG_PATH        = "/var/log/snort/alert"
IDS_EVENTS_LOG_PATH   = "/var/log/snort/ids-events.jsonl"
IDS_ALERTS_JSONL_PATH = "/var/log/snort/ids-alerts.jsonl"

# ──────────────────────────────────────────────────────
async def _ssh_tail(websocket: WebSocket, remote_path: str) -> None:
    """
    일반 Snort 로그(텍스트)를 SSH로 실시간 전송 (tail -F).
    """
    await websocket.accept()
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    try:
        ssh.connect(
            SSH_HOST,
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

# ──────────────────────────────────────────────────────
async def stream_snort_log(websocket: WebSocket) -> None:
    """Snort 일반 텍스트 로그 실시간 전송 (/var/log/snort/alert)"""
    await _ssh_tail(websocket, SNORT_LOG_PATH)

# ──────────────────────────────────────────────────────
async def stream_ids_alerts(websocket: WebSocket) -> None:
    """
    IDS 알림 로그 (JSONL)를 WebSocket으로 전송.
    1) 최근 5개 우선 전송
    2) 이후 실시간 tail -F
    """
    await websocket.accept()
    file_path = IDS_ALERTS_JSONL_PATH

    try:
        if os.path.exists(file_path):
            with open(file_path, "r", encoding="utf-8") as f:
                lines = f.readlines()
                for line in lines[-5:]:
                    line = line.strip()
                    if line:
                        await websocket.send_text(line)
    except Exception as e:
        await websocket.send_text(f"[초기 알림 읽기 오류] {e}")

    try:
        async with aiofiles.open(file_path, mode="r", encoding="utf-8") as f:
            await f.seek(0, os.SEEK_END)
            while True:
                line = await f.readline()
                if line:
                    await websocket.send_text(line.strip())
                await asyncio.sleep(0.1)
    except WebSocketDisconnect:
        pass
    except Exception as e:
        await websocket.send_text(f"[실시간 알림 스트리밍 오류] {e}")
        await websocket.close()

# ──────────────────────────────────────────────────────
async def stream_ids_events(websocket: WebSocket) -> None:
    """
    IDS 차단/해제 이벤트 로그 (JSONL)를 WebSocket으로 전송.
    1) 최근 5개 우선 전송
    2) 이후 실시간 tail -F
    """
    await websocket.accept()
    file_path = IDS_EVENTS_LOG_PATH

    try:
        if os.path.exists(file_path):
            with open(file_path, "r", encoding="utf-8") as f:
                lines = f.readlines()
                for line in lines[-5:]:
                    line = line.strip()
                    if line:
                        await websocket.send_text(line)
    except Exception as e:
        await websocket.send_text(f"[초기 이벤트 읽기 오류] {e}")

    try:
        async with aiofiles.open(file_path, mode="r", encoding="utf-8") as f:
            await f.seek(0, os.SEEK_END)
            while True:
                line = await f.readline()
                if line:
                    await websocket.send_text(line.strip())
                await asyncio.sleep(0.1)
    except WebSocketDisconnect:
        pass
    except Exception as e:
        await websocket.send_text(f"[실시간 이벤트 스트리밍 오류] {e}")
        await websocket.close()
