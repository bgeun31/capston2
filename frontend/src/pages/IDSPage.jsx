import React, { useState, useEffect } from "react";
import { apiClient } from "../api/apiConfig";
import { Shield, AlertTriangle, CheckCircle } from "lucide-react";
import MainLayout from "../components/layout/MainLayout";

export default function IDSPage() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setLoading(true);
        // 실제 API 연동 시 이 부분을 수정해야 합니다.
        // const response = await apiClient.get("/api/ids/alerts");
        // setAlerts(response.data);
        
        // 샘플 데이터
        setAlerts([
          { id: 1, timestamp: "2023-10-25T14:32:10", level: "high", source_ip: "192.168.1.105", destination_ip: "192.168.30.1", protocol: "TCP", message: "의심스러운 SSH 로그인 시도", status: "open" },
          { id: 2, timestamp: "2023-10-25T13:22:45", level: "medium", source_ip: "192.168.1.98", destination_ip: "192.168.20.1", protocol: "HTTP", message: "비정상적인 HTTP 요청 패턴", status: "open" },
          { id: 3, timestamp: "2023-10-25T11:45:12", level: "low", source_ip: "192.168.1.103", destination_ip: "192.168.20.1", protocol: "ICMP", message: "과도한 ICMP 패킷", status: "closed" },
          { id: 4, timestamp: "2023-10-24T22:15:33", level: "high", source_ip: "192.168.1.110", destination_ip: "192.168.30.1", protocol: "HTTPS", message: "의심스러운 SSL 인증서", status: "closed" },
          { id: 5, timestamp: "2023-10-24T19:07:18", level: "medium", source_ip: "192.168.1.115", destination_ip: "192.168.20.1", protocol: "DNS", message: "비정상적인 DNS 쿼리", status: "open" },
        ]);
        setLoading(false);
      } catch (err) {
        setError("경고 데이터를 가져오는 중 오류가 발생했습니다.");
        setLoading(false);
        console.error("Error fetching alerts:", err);
      }
    };
장성진바보
    fetchAlerts();
    // 5초마다 업데이트
    const interval = setInterval(fetchAlerts, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleResolve = (id) => {
    setAlerts(alerts.map(alert => 
      alert.id === id ? { ...alert, status: "closed" } : alert
    ));
  };

  // 경고 수준에 따른 색상 지정
  const getLevelColor = (level) => {
    switch(level) {
      case "high": return "text-red-600 bg-red-100";
      case "medium": return "text-orange-600 bg-orange-100";
      case "low": return "text-yellow-600 bg-yellow-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  if (loading) return (
    <MainLayout>
      <div className="p-6">로딩 중...</div>
    </MainLayout>
  );
  
  if (error) return (
    <MainLayout>
      <div className="p-6 text-red-600">{error}</div>
    </MainLayout>
  );

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="text-blue-500" />
            침입 탐지 시스템 (IDS)
          </h1>
          <div className="flex items-center gap-2">
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">
              보호 중
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-4">최근 경고</h2>
          {alerts.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              <CheckCircle className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2">감지된 경고가 없습니다</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">시간</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">수준</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">소스 IP</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">대상 IP</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">프로토콜</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">메시지</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">상태</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">작업</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {alerts.map((alert) => (
                    <tr key={alert.id}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(alert.timestamp).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getLevelColor(alert.level)}`}>
                          {alert.level === "high" ? "높음" : alert.level === "medium" ? "중간" : "낮음"}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{alert.source_ip}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{alert.destination_ip}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{alert.protocol}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{alert.message}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          alert.status === "open" ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
                        }`}>
                          {alert.status === "open" ? "열림" : "해결됨"}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                        {alert.status === "open" && (
                          <button 
                            onClick={() => handleResolve(alert.id)} 
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            해결
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold mb-4">공격 유형 통계</h2>
            <div className="h-64 flex items-center justify-center">
              <p className="text-gray-500">여기에 차트가 표시됩니다</p>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold mb-4">최근 공격 소스 IP</h2>
            <div className="h-64 flex items-center justify-center">
              <p className="text-gray-500">여기에 지도 또는 목록이 표시됩니다</p>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
} 