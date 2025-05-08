# snort_log_streamer.py
"""
Ubuntu VM(192.168.20.6)에서 Snort 로그를 tail -F 하여
Windows FastAPI 백엔드의 WebSocket (/ws/snort-log) 으로 실시간 전송.

패키지: paramiko (pip install paramiko)
"""

import asyncio
import paramiko
from fastapi import WebSocket, WebSocketDisconnect

# ──────────────── SSH 접속 정보 ────────────────
SSH_HOST = "192.168.20.6"            # Ubuntu VM IP
SSH_USER = "nms"                     # 앞서 만든 계정
SSH_KEY  = r"C:\Users\NLab\.ssh\id_rsa"  # 개인키 경로
# SSH_PW = "1234"                    # 키 대신 비밀번호 사용 시 주석 해제

# Snort alert 파일 경로
SNORT_LOG_PATH = "/var/log/snort/alert"


async def stream_snort_log(websocket: WebSocket) -> None:
    """
    WebSocket 접속이 수립되면 Ubuntu VM에 SSH로 접속하여
    tail -F 로 Snort 로그를 스트리밍한다.
    """
    await websocket.accept()

    # ── 1) SSH 접속 ────────────────────────────────────────
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    try:
        ssh.connect(
            SSH_HOST,
            username=SSH_USER,
            key_filename=SSH_KEY,
            # password=SSH_PW,      # 키 대신 비밀번호 사용 시
            look_for_keys=False,
            allow_agent=False,
        )
    except Exception as e:
        await websocket.send_text(f"[SSH 연결 오류] {e}")
        await websocket.close()
        return

    # ── 2) tail -F 세션 열기 ──────────────────────────────
    chan = ssh.get_transport().open_session()
    chan.exec_command(f"tail -n 0 -F {SNORT_LOG_PATH}")

    try:
        while True:
            if chan.recv_ready():
                data = chan.recv(4096).decode(errors="ignore")
                # 여러 줄이 한 번에 올 수 있으므로 splitlines
                for line in data.splitlines():
                    await websocket.send_text(line)

            # 에러 출력도 함께 전송(원한다면 주석 해제)
            # if chan.recv_stderr_ready():
            #     err = chan.recv_stderr(4096).decode(errors="ignore")
            #     await websocket.send_text(f"[STDERR] {err}")

            await asyncio.sleep(0.1)

    except WebSocketDisconnect:
        pass
    finally:
        chan.close()
        ssh.close()
