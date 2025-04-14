// pages/TerminalPage.jsx
import React, { useEffect, useRef, useState } from "react";
import MainLayout from "../components/layout/MainLayout";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import "xterm/css/xterm.css";
import axios from "axios";

export default function TerminalPage() {
  const terminalRef = useRef(null);
  const socketRef = useRef(null);
  const [devices, setDevices] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    axios.get("/api/topology").then(res => {
      setDevices(res.data.nodes || []);
    });
  }, []);

  useEffect(() => {
    if (!selectedId) return;

    const term = new Terminal({ fontSize: 14, cursorBlink: true });
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    fitAddon.fit();

    const ws = new WebSocket(`ws://localhost:8000/ws/terminal/${selectedId}`);
    socketRef.current = ws;

    term.onData(data => ws.send(data));

    ws.onmessage = e => term.write(e.data);
    ws.onerror = () => term.write("\r\n[WebSocket 오류 발생]\r\n");
    ws.onclose = () => term.write("\r\n[세션 종료됨]\r\n");

    return () => {
      ws.close();
      term.dispose();
    };
  }, [selectedId]);

  return (
    <MainLayout>
      <div className="space-y-4">
        <div className="flex gap-2 items-center">
          <label className="text-sm font-medium">장비 선택:</label>
          <select
            value={selectedId || ""}
            onChange={e => setSelectedId(e.target.value)}
            className="border rounded p-1 text-sm"
          >
            <option value="" disabled>장비를 선택하세요</option>
            {devices.map(d => (
              <option key={d.id} value={d.id}>{d.name || d.ip}</option>
            ))}
          </select>
        </div>

        <div ref={terminalRef} style={{ height: "500px", width: "100%", background: "#000" }} />
      </div>
    </MainLayout>
  );
}