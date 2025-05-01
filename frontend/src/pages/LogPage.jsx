// pages/LogPage.jsx
import React, { useEffect, useState } from "react";
import MainLayout from "../components/layout/MainLayout";

export default function LogPage() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const ws = new WebSocket("ws://192.168.20.8:8000/ws/snort-log"); // VM IP 확인 필요
    ws.onmessage = (e) => {
      setLogs(prev => [...prev.slice(-49), e.data]);
    };
    ws.onerror = () => {
      setLogs(prev => [...prev, "[WebSocket 연결 실패]"]);
    };
    return () => ws.close();
  }, []);

  // 파스텔 톤 로그 색상 매핑 함수
  function getLogColors(log) {
    // 기본 색상 설정
    let bgColor = "bg-gray-100";
    let textColor = "text-gray-800";
    let borderColor = "border-l-4 border-gray-300";

    // UPnP service 관련 로그 (파란색)
    if (log.includes("UPnP service discover") && log.includes("[Priority: 3]")) {
      bgColor = "bg-blue-100";
      borderColor = "border-l-4 border-blue-300";
      return { bgColor, textColor, borderColor };
    }
    
    // ICMP Detected 로그 (노란색)
    if (log.includes("ICMP Detected") && log.includes("[Priority: 0]")) {
      bgColor = "bg-yellow-100";
      borderColor = "border-l-4 border-yellow-300";
      return { bgColor, textColor, borderColor };
    }
    
    // SSH Login Attempt 로그 (분홍색)
    if (log.includes("SSH Login Attempt") && log.includes("[Priority: 1]")) {
      bgColor = "bg-pink-100";
      borderColor = "border-l-4 border-pink-300";
      return { bgColor, textColor, borderColor };
    }
    
    // HTTP Request 로그 (보라색)
    if (log.includes("HTTP Request") && log.includes("[Priority: 2]")) {
      bgColor = "bg-purple-100";
      borderColor = "border-l-4 border-purple-300";
      return { bgColor, textColor, borderColor };
    }
    
    // DNS Query 로그 (주황색)
    if (log.includes("DNS Query")) {
      bgColor = "bg-orange-100";
      borderColor = "border-l-4 border-orange-300";
      return { bgColor, textColor, borderColor };
    }

    // 나머지 우선순위에 따른 기본 색상
    if (log.includes("[Priority: 3]")) {
      bgColor = "bg-blue-50";
      borderColor = "border-l-4 border-blue-200";
    } else if (log.includes("[Priority: 2]")) {
      bgColor = "bg-orange-50";
      borderColor = "border-l-4 border-orange-200";
    } else if (log.includes("[Priority: 1]")) {
      bgColor = "bg-rose-50";
      borderColor = "border-l-4 border-rose-200";
    } else if (log.includes("[Priority: 0]")) {
      bgColor = "bg-green-50";
      borderColor = "border-l-4 border-green-200";
    }

    return { bgColor, textColor, borderColor };
  }

  return (
    <MainLayout>
      <div className="text-2xl font-bold mb-4">실시간 Snort 로그</div>
      <div className="border rounded-md shadow-sm">
        <div className="h-[500px] w-full bg-white font-mono text-sm p-4 overflow-auto">
          {[...logs].reverse().map((log, index) => {
            const { bgColor, textColor, borderColor } = getLogColors(log);
            
            return (
              <div
                key={index}
                className={`whitespace-pre-wrap mb-1.5 p-2.5 rounded-md ${bgColor} ${textColor} ${borderColor}`}
              >
                {log}
              </div>
            );
          })}
        </div>
      </div>
    </MainLayout>
  );
}
