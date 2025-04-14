// pages/DashboardPage.jsx
import React, { useEffect, useState } from "react";
import { MonitorCheck, ShieldAlert, Link2 } from "lucide-react";
import axios from "axios";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import MainLayout from "../components/layout/MainLayout";

export default function DashboardPage() {
  const [deviceCount, setDeviceCount] = useState(0);
  const [linkCount, setLinkCount] = useState(0);

  useEffect(() => {
    axios.get("/api/topology").then(res => {
      setDeviceCount(res.data.nodes.length);
      setLinkCount(res.data.links.length);
    });
  }, []);

  const cards = [
    {
      title: "총 장비 수",
      value: deviceCount,
      icon: <MonitorCheck className="text-blue-500" size={28} />, 
    },
    {
      title: "활성 링크",
      value: linkCount,
      icon: <Link2 className="text-green-500" size={28} />,
    },
    {
      title: "보안 경고",
      value: "2",
      icon: <ShieldAlert className="text-red-500" size={28} />,
    },
  ];

  const performanceData = [
    { time: "00:00", traffic: 120, cpu: 40 },
    { time: "04:00", traffic: 100, cpu: 35 },
    { time: "08:00", traffic: 160, cpu: 50 },
    { time: "12:00", traffic: 240, cpu: 60 },
    { time: "16:00", traffic: 320, cpu: 65 },
    { time: "20:00", traffic: 280, cpu: 55 },
    { time: "22:00", traffic: 220, cpu: 50 },
  ];

  const recentEvents = [
    {
      title: "Core Router 재부팅 완료",
      desc: "펌웨어 업데이트 후 성공적으로 재부팅됨",
      time: "15분 전"
    },
    {
      title: "Access Switch 2 포트 다운",
      desc: "GigabitEthernet1/0/12 포트 다운됨",
      time: "32분 전"
    },
    {
      title: "구성 변경 감지됨",
      desc: "방화벽에서 새로운 ACL 규칙이 추가됨",
      time: "1시간 전"
    },
    {
      title: "새 장치 감지됨",
      desc: "새 IP 장치가 네트워크에 연결됨",
      time: "2시간 전"
    },
  ];

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* 상단 카드 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {cards.map((card, idx) => (
            <div
              key={idx}
              className="bg-white shadow-md border rounded-lg p-4 flex items-center gap-4 transition hover:shadow-lg"
            >
              <div className="p-3 bg-gray-100 rounded-full">
                {card.icon}
              </div>
              <div>
                <h4 className="text-sm text-gray-600 font-medium">{card.title}</h4>
                <p className="text-2xl font-bold text-gray-800 mt-1">{card.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* 네트워크 요약 & 보안 경고 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 네트워크 요약 */}
          <div className="bg-white border shadow-sm rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">네트워크 요약</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">라우터</p>
                <p className="text-xl font-bold">8 <span className="text-green-600 text-xs ml-2">모두 온라인</span></p>
              </div>
              <div>
                <p className="text-gray-500">스위치</p>
                <p className="text-xl font-bold">12 <span className="text-yellow-600 text-xs ml-2">1개 오프라인</span></p>
              </div>
              <div>
                <p className="text-gray-500">방화벽</p>
                <p className="text-xl font-bold">2 <span className="text-green-600 text-xs ml-2">모두 온라인</span></p>
              </div>
              <div>
                <p className="text-gray-500">무선 AP</p>
                <p className="text-xl font-bold">6 <span className="text-green-600 text-xs ml-2">모두 온라인</span></p>
              </div>
            </div>
          </div>

          {/* 보안 경고 */}
          <div className="bg-white border shadow-sm rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">보안 경고</h3>
            <ul className="space-y-3 text-sm">
              <li className="p-3 rounded bg-red-50 border border-red-200">
                <p className="font-semibold text-red-600">의심스러운 로그인 시도 <span className="text-xs">(높음)</span></p>
                <p className="text-gray-700">203.0.113.42에서 관리자 계정으로 여러 번 로그인 시도</p>
                <p className="text-xs text-gray-500 mt-1">10분 전, 방화벽</p>
              </li>
              <li className="p-3 rounded bg-yellow-50 border border-yellow-200">
                <p className="font-semibold text-yellow-700">비정상적인 트래픽 패턴 <span className="text-xs">(중간)</span></p>
                <p className="text-gray-700">Core Router에서 DDoS 의심 트래픽 감지</p>
                <p className="text-xs text-gray-500 mt-1">35분 전, IDS</p>
              </li>
              <li className="p-3 rounded bg-blue-50 border border-blue-200">
                <p className="font-semibold text-blue-700">포트 스캔 감지 <span className="text-xs">(낮음)</span></p>
                <p className="text-gray-700">198.51.100.75에서 포트 스캔 시도 감지</p>
                <p className="text-xs text-gray-500 mt-1">1시간 전, IPS</p>
              </li>
            </ul>
          </div>
        </div>

        {/* 성능 개요 & 최근 이벤트 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border shadow-sm rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">성능 개요 (트래픽)</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={performanceData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTraffic" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" stroke="#666" />
                  <YAxis stroke="#999" />
                  <CartesianGrid strokeDasharray="3 3" />
                  <Tooltip />
                  <Area type="monotone" dataKey="traffic" stroke="#3b82f6" fillOpacity={1} fill="url(#colorTraffic)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white border shadow-sm rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">최근 이벤트</h3>
            <ul className="space-y-3 text-sm">
              {recentEvents.map((event, idx) => (
                <li key={idx} className="border-b pb-3 last:border-none">
                  <p className="font-medium text-gray-800">{event.title}</p>
                  <p className="text-gray-600 text-sm">{event.desc}</p>
                  <p className="text-xs text-gray-400 mt-1">{event.time}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}