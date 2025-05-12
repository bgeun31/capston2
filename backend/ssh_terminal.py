import asyncio
from netmiko import ConnectHandler
from fastapi import WebSocket, WebSocketDisconnect


class SSHTerminal:
    def __init__(self, ip: str, username: str, password: str):
        self.dev_info = {
            "device_type": "cisco_ios",
            "host": ip,
            "username": username,
            "password": password,
            "fast_cli": True,
        }
        self.conn = None
        self.channel = None

    def connect(self):
        self.conn = ConnectHandler(**self.dev_info)
        self.channel = self.conn.remote_conn      # ← 여기!
        self.channel.settimeout(0.0)              # non‑blocking
        self.conn.write_channel("terminal length 0\n")

    def disconnect(self):
        if self.conn:
            self.conn.disconnect()

    def _read_from_ssh(self) -> str:
        try:
            if self.channel.recv_ready():
                return self.channel.recv(4096).decode(errors="ignore")
        except Exception as e:
            print("[SSH read error]", e)
        return ""

    def _write_to_ssh(self, data: str):
        try:
            self.conn.write_channel(data)
        except Exception as e:
            print("[SSH write error]", e)

    async def websocket_handler(self, websocket: WebSocket):
        await websocket.accept()
        self.connect()
        print("[SSH‑WS] connection open")

        async def ssh_to_web():
            while True:
                await asyncio.sleep(0.05)
                out = self._read_from_ssh()
                if out:
                    await websocket.send_text(out)

        async def web_to_ssh():
            try:
                while True:
                    data = await websocket.receive_text()
                    self._write_to_ssh(data)
            except WebSocketDisconnect:
                print("[SSH‑WS] client disconnected")

        try:
            await asyncio.gather(ssh_to_web(), web_to_ssh())
        finally:
            self.disconnect()
            print("[SSH‑WS] SSH session closed")
