// ✅ IDSPage.jsx
import React, { useState, useEffect } from "react";
import { AlertTriangle, Filter, Eye, Shield, Search } from "lucide-react";
import MainLayout from "../components/layout/MainLayout";
import { WS_BASE } from "../utils/WsBase";
import axios from "axios";

export default function IDSPage() {
  const [alerts, setAlerts] = useState([]);
  const [events, setEvents] = useState([]);
  const [loadingAlerts, setLoadingAlerts] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [errorAlerts, setErrorAlerts] = useState(null);
  const [errorEvents, setErrorEvents] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [unblocking, setUnblocking] = useState({});

  // ✅ IDS 알림 WebSocket 구독
useEffect(() => {
  const ws = new WebSocket(`${WS_BASE}/ws/ids-alerts`);
  console.log("🔌 [IDS 알림] WebSocket 연결 시도...");

  ws.onopen = () => {
    console.log("🟢 [IDS 알림] WebSocket 연결 완료");
    setLoadingAlerts(false);
  };

  ws.onmessage = (e) => {
    try {
      const parsed = JSON.parse(e.data);
  
      // ⚠️ 오류 메시지일 경우, 별도 처리
      if (parsed?.type === "error") {
        console.warn("⚠️ IDS 오류 메시지:", parsed.message);
        setErrorAlerts(parsed.message); // 또는 setEvents([...events, parsed.message]);
        return;
      }
  
      // ✅ 정상 알림 데이터 처리
      if (!parsed?.id || !parsed?.timestamp) {
        console.warn("❗ 필수 필드 누락:", parsed);
        return;
      }
  
      setAlerts((prev) =>
        prev.some((a) => a.id === parsed.id) ? prev : [...prev, parsed]
      );
    } catch (err) {
      console.error("❌ JSON 파싱 실패:", e.data, err);
      setErrorAlerts("알림 처리 오류 (JSON 파싱 실패)");
    }
  };
  

  ws.onerror = (err) => {
    console.error("🚨 [IDS 알림] WebSocket 오류:", err);
    setErrorAlerts("알림 연결 오류");
  };

  ws.onclose = () => {
    console.warn("🔴 [IDS 알림] WebSocket 연결 종료됨");
  };

  return () => {
    console.log("🔌 [IDS 알림] WebSocket 연결 해제");
    ws.close();
  };
}, []);

// ✅ IDS 이벤트 WebSocket 구독
useEffect(() => {
  const ws2 = new WebSocket(`${WS_BASE}/ws/ids-events`);
  console.log("🔌 [IDS 이벤트] WebSocket 연결 시도...");

  ws2.onopen = () => {
    console.log("🟢 [IDS 이벤트] WebSocket 연결 완료");
    setLoadingEvents(false);
  };

  ws2.onmessage = (e) => {
    console.log("📥 [IDS 이벤트] 수신 데이터:", e.data);
    setEvents((prev) => [...prev, e.data]);
  };

  ws2.onerror = (err) => {
    console.error("🚨 [IDS 이벤트] WebSocket 오류:", err);
    setErrorEvents("이벤트 연결 오류");
  };

  ws2.onclose = () => {
    console.warn("🔴 [IDS 이벤트] WebSocket 연결 종료됨");
  };

  return () => {
    console.log("🔌 [IDS 이벤트] WebSocket 연결 해제");
    ws2.close();
  };
}, []);


  const handleResolveAll = () => {
    setAlerts(alerts.map((alert) => ({ ...alert, status: "해결됨" })));
  };

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case "critical":
        return <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-800"><AlertTriangle className="h-3 w-3" />심각</span>;
      case "high":
        return <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-1 text-xs font-semibold text-orange-800"><AlertTriangle className="h-3 w-3" />높음</span>;
      case "medium":
        return <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-1 text-xs font-semibold text-yellow-800"><Shield className="h-3 w-3" />중간</span>;
      case "low":
        return <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800"><Shield className="h-3 w-3" />낮음</span>;
      default:
        return <span className="rounded-full px-2 py-1 text-xs">{severity}</span>;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "미해결":
        return <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-800 border border-red-300">미해결</span>;
      case "조사 중":
        return <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs font-semibold text-yellow-800 border border-yellow-300">조사 중</span>;
      case "해결됨":
        return <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800 border border-green-300">해결됨</span>;
      default:
        return <span className="rounded-full bg-gray-100 px-2 py-1 text-xs">{status}</span>;
    }
  };

  const filteredAlerts = alerts.filter((alert) => {
    if (activeTab !== "all" && alert.severity !== activeTab) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return [alert.id, alert.type, alert.source, alert.destination].some((f) =>
        f.toLowerCase().includes(term)
      );
    }
    return true;
  });

  // 차단 해제/재차단 토글 함수
  const handleUnblock = async (alert) => {
    if (unblocking[alert.id]) return; // 중복 클릭 방지
    setUnblocking((prev) => ({ ...prev, [alert.id]: true }));
    try {
      if (alert.status === "해결됨") {
        // 재차단 (상태를 '미해결'로 변경)
        setAlerts((prev) => prev.map((a) => a.id === alert.id ? { ...a, status: "미해결" } : a));
      } else {
        // 차단 해제 (상태를 '해결됨'으로 변경)
        setAlerts((prev) => prev.map((a) => a.id === alert.id ? { ...a, status: "해결됨" } : a));
      }
    } catch (err) {
      alert("차단/해제에 실패했습니다.");
    } finally {
      setUnblocking((prev) => ({ ...prev, [alert.id]: false }));
    }
  };

  // '미해결'만 필터링 (차단 목록)
  const unresolvedAlerts = filteredAlerts.filter(a => a.status !== "해결됨");
  // '해결됨'만 필터링 (차단해제 목록)
  const resolvedAlerts = alerts.filter(a => a.status === "해결됨");

  return (
    <MainLayout>
      <div className="space-y-4 p-6">
        {/* 알림 섹션 UI 개선 */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <AlertTriangle className="text-red-500" />
            알림 관리
          </h1>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium shadow-sm hover:bg-gray-50">
              <Filter className="h-4 w-4" />
              필터
            </button>
            <button onClick={handleResolveAll} className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700">
              모두 해결됨으로 표시
            </button>
          </div>
        </div>

        <div className="border-b border-gray-200">
          <nav className="flex space-x-4" aria-label="Tabs">
            {["all", "critical", "high", "medium", "low"].map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-3 py-2 text-sm font-medium ${activeTab === tab
                  ? "border-b-2 border-blue-500 text-blue-600"
                  : "text-gray-500 hover:border-b-2 hover:border-gray-300 hover:text-gray-700"}`}>
                {tab === "all" ? "모든 알림" :
                  tab === "critical" ? "심각" :
                    tab === "high" ? "높음" :
                      tab === "medium" ? "중간" : "낮음"}
              </button>
            ))}
          </nav>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white shadow">
          <div className="px-6 py-5 border-b border-gray-200">
            <h2 className="text-lg font-semibold">
              {activeTab === "all" ? "모든 알림" :
                activeTab === "critical" ? "심각한 알림" :
                  activeTab === "high" ? "높은 수준의 알림" :
                    activeTab === "medium" ? "중간 수준의 알림" : "낮은 수준의 알림"}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {activeTab === "all" ? "시스템에서 탐지된 모든 알림 및 위협" :
                activeTab === "critical" ? "즉시 조치가 필요한 심각한 위협" :
                  activeTab === "high" ? "주의가 필요한 높은 수준의 위협" :
                    activeTab === "medium" ? "모니터링이 필요한 중간 수준의 위협" : "낮은 우선순위의 알림"}
            </p>
          </div>

          <div className="p-6">
            <div className="mb-4 flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input type="search" placeholder="알림 검색..." className="w-full rounded-md border border-gray-300 py-2 pl-10 pr-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              <button className="rounded-md border border-gray-300 p-2">
                <Filter className="h-4 w-4 text-gray-400" />
              </button>
            </div>

            <div className="overflow-x-auto mb-8">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase">해제</th>
                    {['ID', '시간', '유형', '출발지', '목적지', '심각도', '상태', '작업'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {unresolvedAlerts.length > 0 ? unresolvedAlerts.map(a => (
                    <tr key={a.id} className="hover:bg-gray-50">
                      <td className="px-2 py-4 text-center">
                        <input
                          type="checkbox"
                          checked={false}
                          disabled={unblocking[a.id]}
                          onChange={() => handleUnblock(a)}
                          className="w-5 h-5 accent-blue-500 cursor-pointer"
                          title="차단 해제"
                        />
                      </td>
                      <td className="px-4 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">{a.id}</td>
                      <td className="px-4 py-4 text-sm text-gray-500 whitespace-nowrap">{a.timestamp}</td>
                      <td className="px-4 py-4 text-sm text-gray-500 whitespace-nowrap">{a.type}</td>
                      <td className="px-4 py-4 text-sm text-gray-500 whitespace-nowrap">{a.source}</td>
                      <td className="px-4 py-4 text-sm text-gray-500 whitespace-nowrap">{a.destination}</td>
                      <td className="px-4 py-4 text-sm whitespace-nowrap">{getSeverityBadge(a.severity)}</td>
                      <td className="px-4 py-4 text-sm whitespace-nowrap">{getStatusBadge(a.status)}</td>
                      <td className="px-4 py-4 text-sm text-right whitespace-nowrap">
                        <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-gray-500">검색 결과가 없습니다</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* 차단해제 목록 테이블 */}
            <div className="overflow-x-auto mb-8">
              <h2 className="text-xl font-bold mb-2">차단해제 목록</h2>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase">차단</th>
                    {['ID', '시간', '유형', '출발지', '목적지', '심각도', '상태', '작업'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {resolvedAlerts.length > 0 ? resolvedAlerts.map(a => (
                    <tr key={a.id} className="hover:bg-gray-50">
                      <td className="px-2 py-4 text-center">
                        <input
                          type="checkbox"
                          checked={true}
                          disabled={unblocking[a.id]}
                          onChange={() => handleUnblock(a)}
                          className="w-5 h-5 accent-blue-500 cursor-pointer"
                          title="재차단"
                        />
                      </td>
                      <td className="px-4 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">{a.id}</td>
                      <td className="px-4 py-4 text-sm text-gray-500 whitespace-nowrap">{a.timestamp}</td>
                      <td className="px-4 py-4 text-sm text-gray-500 whitespace-nowrap">{a.type}</td>
                      <td className="px-4 py-4 text-sm text-gray-500 whitespace-nowrap">{a.source}</td>
                      <td className="px-4 py-4 text-sm text-gray-500 whitespace-nowrap">{a.destination}</td>
                      <td className="px-4 py-4 text-sm whitespace-nowrap">{getSeverityBadge(a.severity)}</td>
                      <td className="px-4 py-4 text-sm whitespace-nowrap">{getStatusBadge(a.status)}</td>
                      <td className="px-4 py-4 text-sm text-right whitespace-nowrap">
                        <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-gray-500">차단해제된 알림이 없습니다</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 차단/해제 이벤트 로그 (기존 스타일 유지) */}
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2"><AlertTriangle className="text-orange-500" />차단/해제 이벤트 로그</h2>
          <div className="mt-2 rounded-lg border bg-white shadow p-4">
            {loadingEvents ? (
              <div>로딩 중...</div>
            ) : errorEvents ? (
              <div className="text-red-600">{errorEvents}</div>
            ) : (
              <ul className="h-64 overflow-auto font-mono text-sm">
                {events.length > 0 ? events.map((line, i) => <li key={i}>{line}</li>) : <li className="text-gray-500">이벤트 로그가 없습니다.</li>}
              </ul>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
