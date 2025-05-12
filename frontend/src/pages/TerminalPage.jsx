// pages/TerminalPage.jsx
import React, { useEffect, useRef, useState } from "react";
import MainLayout from "../components/layout/MainLayout";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import "xterm/css/xterm.css";

import { apiClient } from "../api/apiConfig";   // ✅ 공통 axios 인스턴스
import { WS_BASE } from "../utils/WsBase";      // ✅ WebSocket 베이스 URL

export default function TerminalPage() {
  const terminalRef = useRef(null);
  const socketRef   = useRef(null);

  const [devices, setDevices]   = useState([]);
  const [selectedId, setSelectedId] = useState("");

  /* ───────── 장비 목록 로딩 ───────── */
  useEffect(() => {
    apiClient
      .get("/api/topology")
      .then(res => setDevices(res.data.nodes || []))
      .catch(err => console.error("토폴로지 로드 실패:", err));
  }, []);

  /* ───────── 장비 선택 → WebSocket 연결 ───────── */
  useEffect(() => {
    if (!selectedId) return;

    const term     = new Terminal({ fontSize: 14, cursorBlink: true });
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    term.open(terminalRef.current);
    fitAddon.fit();

    const ws = new WebSocket(`${WS_BASE}/ws/terminal/${selectedId}`);
    socketRef.current = ws;

    term.onData(data => ws.send(data));

    ws.onmessage = e => term.write(e.data);
    ws.onerror   = () => term.write("\r\n[WebSocket 오류 발생]\r\n");
    ws.onclose   = () => term.write("\r\n[세션 종료됨]\r\n");

    /* 정리(clean‑up) */
    return () => {
      ws.close();
      term.dispose();
    };
  }, [selectedId]);

  return (
    <MainLayout>
      <div className="space-y-4">
        {/* 장비 선택 드롭다운 */}
        <div className="flex gap-2 items-center">
          <label className="text-sm font-medium">장비 선택:</label>
          <select
            value={selectedId}
            onChange={e => setSelectedId(e.target.value)}
            className="border rounded p-1 text-sm"
          >
            <option value="" disabled>장비를 선택하세요</option>
            {devices.map(d => (
              <option key={d.id} value={d.id}>
                {d.name || d.ip}
              </option>
            ))}
          </select>
        </div>

        {/* 터미널 영역 */}
        <div
          ref={terminalRef}
          style={{ height: "500px", width: "100%", background: "#000" }}
        />
      </div>
    </MainLayout>
  );
}
