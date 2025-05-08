// ✅ IDSPage.jsx (React 프론트엔드)
import React, { useState, useEffect } from "react";
import { AlertTriangle, Filter, Eye, Shield, Search } from "lucide-react";
import MainLayout from "../components/layout/MainLayout";
import axios from "axios"; // axios 사용

export default function IDSPage() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setLoading(true);
        const response = await axios.get("http://localhost:8000/api/ids/alerts");
        setAlerts(response.data);
        setLoading(false);
      } catch (err) {
        setError("경고 데이터를 가져오는 중 오류가 발생했습니다.");
        setLoading(false);
      }
    };

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleResolveAll = () => {
    setAlerts(alerts.map(alert => ({ ...alert, status: "해결됨" })));
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

  const filteredAlerts = alerts.filter(alert => {
    if (activeTab !== "all" && activeTab !== alert.severity) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        alert.id.toLowerCase().includes(term) ||
        alert.type.toLowerCase().includes(term) ||
        alert.source.toLowerCase().includes(term) ||
        alert.destination.toLowerCase().includes(term)
      );
    }
    return true;
  });

  if (loading) return <MainLayout><div className="p-6">로딩 중...</div></MainLayout>;
  if (error) return <MainLayout><div className="p-6 text-red-600">{error}</div></MainLayout>;

  return (
    <MainLayout>
      <div className="space-y-4 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <AlertTriangle className="text-red-500" />알림 관리
          </h1>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium shadow-sm hover:bg-gray-50">
              <Filter className="h-4 w-4" />필터
            </button>
            <button onClick={handleResolveAll} className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700">
              모두 해결됨으로 표시
            </button>
          </div>
        </div>

        <div className="border-b border-gray-200">
          <nav className="flex space-x-4" aria-label="Tabs">
            {["all", "critical", "high", "medium", "low"].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-3 py-2 text-sm font-medium ${
                  activeTab === tab ? "border-b-2 border-blue-500 text-blue-600" : "text-gray-500 hover:border-b-2 hover:border-gray-300 hover:text-gray-700"
                }`}>
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
                <input type="search" placeholder="알림 검색..." className="w-full rounded-md border border-gray-300 py-2 pl-10 pr-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              <button className="rounded-md border border-gray-300 p-2">
                <Filter className="h-4 w-4 text-gray-400" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">시간</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">유형</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">출발지</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">목적지</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">심각도</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">작업</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {filteredAlerts.length > 0 ? (
                    filteredAlerts.map(alert => (
                      <tr key={alert.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">{alert.id}</td>
                        <td className="px-4 py-4 text-sm text-gray-500 whitespace-nowrap">{alert.timestamp}</td>
                        <td className="px-4 py-4 text-sm text-gray-500 whitespace-nowrap">{alert.type}</td>
                        <td className="px-4 py-4 text-sm text-gray-500 whitespace-nowrap">{alert.source}</td>
                        <td className="px-4 py-4 text-sm text-gray-500 whitespace-nowrap">{alert.destination}</td>
                        <td className="px-4 py-4 text-sm text-gray-500 whitespace-nowrap">{getSeverityBadge(alert.severity)}</td>
                        <td className="px-4 py-4 text-sm text-gray-500 whitespace-nowrap">{getStatusBadge(alert.status)}</td>
                        <td className="px-4 py-4 text-sm text-right font-medium whitespace-nowrap">
                          <button className="text-gray-400 hover:text-gray-500">
                            <Eye className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-gray-500">검색 결과가 없습니다</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
