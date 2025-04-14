# ssh_terminal.py

import asyncio
import paramiko
from fastapi import WebSocket, WebSocketDisconnect

class SSHTerminal:
    def __init__(self, ip: str, username: str, password: str):
        self.ip = ip
        self.username = username
        self.password = password
        self.ssh_client = None
        self.channel = None

    def connect(self):
        self.ssh_client = paramiko.SSHClient()
        self.ssh_client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        self.ssh_client.connect(self.ip, username=self.username, password=self.password)
        self.channel = self.ssh_client.invoke_shell()
        self.channel.settimeout(0.0)  # non-blocking

    def disconnect(self):
        if self.channel:
            self.channel.close()
        if self.ssh_client:
            self.ssh_client.close()

    def _read_from_ssh(self) -> str:
        try:
            if self.channel.recv_ready():
                return self.channel.recv(1024).decode("utf-8", errors="ignore")
        except Exception as e:
            print("[SSH read error]", e)
        return ""

    def _write_to_ssh(self, data: str):
        try:
            if self.channel.send_ready():
                self.channel.send(data)
        except Exception as e:
            print("[SSH write error]", e)

    async def websocket_handler(self, websocket: WebSocket):
        await websocket.accept()
        self.connect()
        print("connection open")

        async def ssh_to_web():
            while True:
                await asyncio.sleep(0.1)
                output = self._read_from_ssh()
                if output:
                    await websocket.send_text(output)

        async def web_to_ssh():
            try:
                while True:
                    data = await websocket.receive_text()
                    self._write_to_ssh(data)
            except WebSocketDisconnect:
                print("[Disconnected]")

        try:
            await asyncio.gather(ssh_to_web(), web_to_ssh())
        finally:
            self.disconnect()
            print("[SSH Terminal Closed]")
