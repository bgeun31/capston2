// pages/LogPage.jsx
import React, { useEffect, useState } from "react";
import MainLayout from "../components/layout/MainLayout";

export default function LogPage() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const ws = new WebSocket("ws://192.168.20.6:8000/ws/snort-log"); // VM IP 확인 필요
    ws.onmessage = (e) => {
      setLogs(prev => [...prev.slice(-49), e.data]);
    };
    ws.onerror = () => {
      setLogs(prev => [...prev, "[WebSocket 연결 실패]"]);
    };
    return () => ws.close();
  }, []);

  return (
    <MainLayout>
      <div className="text-lg font-bold mb-4">📄 실시간 Snort 로그</div>
      <div className="bg-black text-green-400 p-4 rounded h-[480px] overflow-auto font-mono text-sm shadow border">
        {[...logs].reverse().map((line, i) => (
          <div key={i}>{line}</div>
        ))}
      </div>
    </MainLayout>
  );
}
