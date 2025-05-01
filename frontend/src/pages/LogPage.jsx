// pages/LogPage.jsx
import React, { useEffect, useState, useRef } from "react";
import MainLayout from "../components/layout/MainLayout";

export default function LogPage() {
  const [logs, setLogs] = useState([]);
  const [activeTab, setActiveTab] = useState("live");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterProtocol, setFilterProtocol] = useState("");
  const [selectedLog, setSelectedLog] = useState(null);
  const [isCapturing, setIsCapturing] = useState(true);
  const scrollRef = useRef(null);
  const captureIntervalRef = useRef(null);
  const shouldScrollToBottom = useRef(true); // 스크롤을 하단으로 내릴지 여부를 제어하는 플래그

  // 스크롤을 최신 로그로 이동시키는 함수
  const scrollToBottom = () => {
    if (scrollRef.current && activeTab === "live" && shouldScrollToBottom.current) {
      setTimeout(() => {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }, 100);
    }
  };

  // 스크롤을 최상단으로 이동시키는 함수
  const scrollToTop = () => {
    if (scrollRef.current) {
      setTimeout(() => {
        scrollRef.current.scrollTop = 0;
      }, 100);
    }
  };

  useEffect(() => {
    const ws = new WebSocket("ws://192.168.20.8:8000/ws/snort-log"); // VM IP 확인 필요
    
    ws.onmessage = (e) => {
      if (isCapturing) {
        setLogs(prev => [...prev.slice(-49), e.data]);
      }
    };
    
    ws.onerror = () => {
      setLogs(prev => [...prev, "[WebSocket 연결 실패]"]);
    };
    
    return () => ws.close();
  }, [isCapturing]);

  // 로그가 변경되면 스크롤을 아래로 이동
  useEffect(() => {
    scrollToBottom();
  }, [logs, activeTab]);

  // 컴포넌트가 마운트 되었을 때 한번 스크롤 아래로 이동
  useEffect(() => {
    scrollToBottom();
  }, []);
  
  // 캡처 시작/중지 토글
  const toggleCapture = () => {
    // 캡처 상태를 변경하기 전에 일시적으로 자동 스크롤 비활성화
    shouldScrollToBottom.current = false;
    
    // 캡처 상태 변경
    setIsCapturing(!isCapturing);
    
    // 스크롤을 맨 위로 이동
    scrollToTop();
    
    // 일정 시간 후 자동 스크롤 다시 활성화 (새 로그가 들어올 때는 정상적으로 동작하도록)
    setTimeout(() => {
      shouldScrollToBottom.current = true;
    }, 500);
  };
  
  // 로그 다운로드 함수
  const downloadLogs = () => {
    const blob = new Blob([logs.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `snort_logs_${new Date().toISOString().replace(/[:.]/g, "-")}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  // 로그 지우기
  const clearLogs = () => {
    setLogs([]);
    setSelectedLog(null);
  };

  // 프로토콜 별 파스텔 톤 로그 색상 매핑 함수
  function getLogColors(log) {
    // 기본 색상 설정
    let bgColor = "bg-gray-100";
    let textColor = "text-gray-700";
    let borderColor = "border-l-4 border-gray-300";

    // 프로토콜 기반 색상 설정
    // IPv6-ICMP 프로토콜 (연한 녹색)
    if (log.includes("{IPv6-ICMP}") || (log.includes("[로컬]") && log.includes("ICMP") && log.includes("fe80::"))) {
      bgColor = "bg-green-50";
      textColor = "text-green-700";
      borderColor = "border-l-4 border-green-300";
      return { bgColor, textColor, borderColor };
    }
    
    // ICMP 프로토콜 (연한 민트색)
    if (log.includes("{ICMP}") || (log.includes("[로컬]") && log.includes("ICMP 패킷 탐지됨"))) {
      bgColor = "bg-teal-50";
      textColor = "text-teal-700";
      borderColor = "border-l-4 border-teal-300";
      return { bgColor, textColor, borderColor };
    }
    
    // HTTP 프로토콜 (연한 푸른색)
    if (log.includes("HTTP") || log.includes("HTTP 요청 탐지됨")) {
      bgColor = "bg-blue-50";
      textColor = "text-blue-700";
      borderColor = "border-l-4 border-blue-300";
      return { bgColor, textColor, borderColor };
    }
    
    // TCP 프로토콜 (연한 자주색)
    if (log.includes("{TCP}") || log.includes("TCP")) {
      bgColor = "bg-purple-50";
      textColor = "text-purple-700";
      borderColor = "border-l-4 border-purple-300";
      return { bgColor, textColor, borderColor };
    }
    
    // UDP 프로토콜 (연한 주황색)
    if (log.includes("{UDP}") || log.includes("UDP")) {
      bgColor = "bg-orange-50";
      textColor = "text-orange-700";
      borderColor = "border-l-4 border-orange-300";
      return { bgColor, textColor, borderColor };
    }
    
    // DNS 프로토콜 (연한 노란색)
    if (log.includes("DNS")) {
      bgColor = "bg-yellow-50";
      textColor = "text-yellow-700";
      borderColor = "border-l-4 border-yellow-300";
      return { bgColor, textColor, borderColor };
    }

    // 우선순위에 따른 보조 스타일링
    if (log.includes("[Priority: 3]") || log.includes("[Priority: 0]")) {
      borderColor = "border-l-4 border-blue-200";
    } else if (log.includes("[Priority: 2]")) {
      borderColor = "border-l-4 border-orange-200";
    } else if (log.includes("[Priority: 1]")) {
      borderColor = "border-l-4 border-rose-200";
    }

    return { bgColor, textColor, borderColor };
  }

  // 로그 파싱 함수
  function parseLog(log) {
    const timestampMatch = log.match(/^(\d+\/\d+-\d+:\d+:\d+\.\d+)/);
    const priorityMatch = log.match(/\[Priority: (\d+)\]/);
    const protocolMatch = log.match(/\{([A-Z0-9-]+)\}/);
    const ipMatch = log.match(/(\d+\.\d+\.\d+\.\d+(?::\d+)? -> \d+\.\d+\.\d+\.\d+(?::\d+)?|fe80::[a-f0-9:]+ -> [a-f0-9:]+)/);
    
    const source = ipMatch ? ipMatch[0].split(" -> ")[0] : "";
    const destination = ipMatch ? ipMatch[0].split(" -> ")[1] : "";
    
    return {
      timestamp: timestampMatch ? timestampMatch[1] : "",
      priority: priorityMatch ? priorityMatch[1] : "",
      protocol: protocolMatch ? protocolMatch[1] : "UNKNOWN",
      source,
      destination,
      raw: log
    };
  }
  
  // 검색 및 필터링된 로그
  const filteredLogs = logs.filter(log => {
    const matchesSearch = searchTerm === "" || log.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProtocol = filterProtocol === "" || 
                            (filterProtocol === "TCP" && log.includes("{TCP}")) || 
                            (filterProtocol === "UDP" && log.includes("{UDP}")) || 
                            (filterProtocol === "ICMP" && (log.includes("{ICMP}") || log.includes("ICMP 패킷 탐지됨"))) || 
                            (filterProtocol === "IPv6-ICMP" && log.includes("{IPv6-ICMP}")) || 
                            (filterProtocol === "HTTP" && log.includes("HTTP")) || 
                            (filterProtocol === "DNS" && log.includes("DNS"));
    return matchesSearch && matchesProtocol;
  });
  
  // 파싱된 로그
  const parsedLogs = filteredLogs.map(log => parseLog(log));

  return (
    <MainLayout>
      <div className="text-2xl font-bold mb-4">실시간 Snort 로그</div>
      
      {/* 툴바 */}
      <div className="bg-gray-100 border rounded-md p-2 mb-4 flex items-center space-x-2">
        <button 
          className={`px-3 py-1 rounded-md ${isCapturing ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}
          onClick={toggleCapture}
        >
          {isCapturing ? '캡처 중지' : '캡처 시작'}
        </button>
        
        <div className="flex-1"></div>
        
        <div className="relative">
          <input
            type="text"
            placeholder="검색..."
            className="pl-8 h-8 rounded-md border border-gray-300 bg-white px-3 py-1 text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500">🔍</span>
        </div>
        
        <select
          className="h-8 rounded-md border border-gray-300 bg-white px-3 py-1 text-sm"
          value={filterProtocol}
          onChange={(e) => setFilterProtocol(e.target.value)}
        >
          <option value="">모든 프로토콜</option>
          <option value="TCP">TCP</option>
          <option value="UDP">UDP</option>
          <option value="IPv6-ICMP">IPv6-ICMP</option>
          <option value="ICMP">ICMP</option>
          <option value="HTTP">HTTP</option>
          <option value="DNS">DNS</option>
        </select>
        
        <button 
          className="px-3 py-1 bg-blue-500 text-white rounded-md"
          onClick={downloadLogs}
        >
          다운로드
        </button>
        
        <button 
          className="px-3 py-1 bg-gray-500 text-white rounded-md"
          onClick={clearLogs}
        >
          지우기
        </button>
      </div>
      
      {/* 탭 메뉴 */}
      <div className="flex border-b mb-4">
        <button 
          className={`px-4 py-2 ${activeTab === 'live' ? 'border-b-2 border-blue-500 font-bold' : 'text-gray-500'}`}
          onClick={() => setActiveTab('live')}
        >
          실시간 로그
        </button>
        <button 
          className={`px-4 py-2 ${activeTab === 'table' ? 'border-b-2 border-blue-500 font-bold' : 'text-gray-500'}`}
          onClick={() => setActiveTab('table')}
        >
          로그 테이블
        </button>
      </div>
      
      {/* 실시간 로그 탭 */}
      {activeTab === 'live' && (
        <div className="border rounded-md shadow-sm">
          <div 
            ref={scrollRef}
            className="h-[500px] w-full bg-white font-mono text-sm p-4 overflow-auto"
          >
            {[...filteredLogs].reverse().map((log, index) => {
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
      )}
      
      {/* 로그 테이블 탭 */}
      {activeTab === 'table' && (
        <div className="border rounded-md shadow-sm">
          <div className="h-[500px] w-full bg-white overflow-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No.</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">시간</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">출발지</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">도착지</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">프로토콜</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">중요도</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {parsedLogs.map((log, index) => {
                  let bgColor = "bg-white";
                  if (log.protocol === "TCP") bgColor = "bg-purple-50";
                  else if (log.protocol === "UDP") bgColor = "bg-orange-50";
                  else if (log.protocol === "IPv6-ICMP") bgColor = "bg-green-50";
                  else if (log.protocol === "ICMP") bgColor = "bg-teal-50";
                  else if (log.protocol === "HTTP") bgColor = "bg-blue-50";
                  else if (log.protocol === "DNS") bgColor = "bg-yellow-50";
                  
                  return (
                    <tr 
                      key={index} 
                      className={`${bgColor} cursor-pointer hover:bg-gray-100 ${selectedLog === index ? 'bg-blue-100' : ''}`}
                      onClick={() => setSelectedLog(index)}
                    >
                      <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{index + 1}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{log.timestamp}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{log.source}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{log.destination}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{log.protocol}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{log.priority}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {/* 선택된 로그 상세 정보 */}
          {selectedLog !== null && (
            <div className="border-t p-4 font-mono text-sm bg-gray-50">
              <div className="font-bold mb-2">패킷 상세 정보</div>
              <div className="whitespace-pre-wrap">{parsedLogs[selectedLog].raw}</div>
            </div>
          )}
        </div>
      )}
      
      {/* 상태 표시줄 */}
      <div className="mt-2 text-sm text-gray-500 flex justify-between">
        <div>
          <span className={isCapturing ? "text-green-600 font-bold" : "text-gray-600"}>
            {isCapturing ? "캡처 중..." : "캡처 중지됨"}
          </span>
          <span className="ml-2">패킷: {logs.length}</span>
          <span className="ml-2">표시: {filteredLogs.length}</span>
          {selectedLog !== null && <span className="ml-2">선택: #{selectedLog + 1}</span>}
        </div>
        <div>Snort 로그 모니터링 시스템</div>
      </div>
    </MainLayout>
  );
}
