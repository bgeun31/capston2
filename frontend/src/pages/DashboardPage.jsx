// pages/DashboardPage.jsx
import React, { useEffect, useState } from "react";
import MainLayout from "../components/layout/MainLayout";
import axios from "axios";
import {
  MonitorCheck,
  Link2,
  ShieldAlert
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

export default function DashboardPage() {
  const [deviceCount, setDeviceCount] = useState(null);
  const [linkCount, setLinkCount] = useState(null);
  const [routerCount, setRouterCount] = useState(null);
  const [switchCount, setSwitchCount] = useState(null);
  const [apCount, setApCount] = useState(null);
  const [firewallCount, setFirewallCount] = useState(null);
  const [trafficData, setTrafficData] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    axios.get("/api/topology").then(res => {
      const nodes = res.data.nodes || [];
      const links = res.data.links || [];
      setDeviceCount(nodes.length);
      setLinkCount(links.length);

      const typeMap = { router: 0, switch: 0, ap: 0, firewall: 0 };
      nodes.forEach(n => {
        const type = (n.type || "").toLowerCase();
        if (type.includes("router")) typeMap.router++;
        else if (type.includes("switch")) typeMap.switch++;
        else if (type.includes("ap")) typeMap.ap++;
        else if (type.includes("firewall")) typeMap.firewall++;
      });
      setRouterCount(typeMap.router);
      setSwitchCount(typeMap.switch);
      setApCount(typeMap.ap);
      setFirewallCount(typeMap.firewall);
    });

    axios.get("/api/performance").then(res => {
      setTrafficData(res.data);
    });

    axios.get("/api/alerts").then(res => {
      setAlerts(res.data);
    });

    axios.get("/api/events").then(res => {
      setEvents(res.data);
    });
  }, []);

  const displayOrNA = (val) => val === null || val === undefined ? "N/A" : val;

  return (
    <MainLayout>
      <div className="space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          <div className="bg-white shadow-md border rounded-lg p-4 flex items-center gap-4">
            <div className="p-3 bg-gray-100 rounded-full">
              <MonitorCheck className="text-blue-500" size={28} />
            </div>
            <div>
              <h4 className="text-sm text-gray-600 font-medium">총 장비 수</h4>
              <p className="text-2xl font-bold text-gray-800 mt-1">{displayOrNA(deviceCount)}</p>
            </div>
          </div>
          <div className="bg-white shadow-md border rounded-lg p-4 flex items-center gap-4">
            <div className="p-3 bg-gray-100 rounded-full">
              <Link2 className="text-green-500" size={28} />
            </div>
            <div>
              <h4 className="text-sm text-gray-600 font-medium">활성 링크</h4>
              <p className="text-2xl font-bold text-gray-800 mt-1">{displayOrNA(linkCount)}</p>
            </div>
          </div>
          <div className="bg-white shadow-md border rounded-lg p-4 flex items-center gap-4">
            <div className="p-3 bg-gray-100 rounded-full">
              <ShieldAlert className="text-red-500" size={28} />
            </div>
            <div>
              <h4 className="text-sm text-gray-600 font-medium">보안 경고</h4>
              <p className="text-2xl font-bold text-gray-800 mt-1">{alerts.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">네트워크 요약</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-500">라우터</p>
              <p className="text-xl font-bold">{displayOrNA(routerCount)} <span className="text-green-600 text-xs ml-2">모두 온라인</span></p>
            </div>
            <div>
              <p className="text-sm text-gray-500">스위치</p>
              <p className="text-xl font-bold">{displayOrNA(switchCount)} <span className="text-yellow-600 text-xs ml-2">1개 오프라인</span></p>
            </div>
            <div>
              <p className="text-sm text-gray-500">무선 AP</p>
              <p className="text-xl font-bold">{displayOrNA(apCount)} <span className="text-green-600 text-xs ml-2">모두 온라인</span></p>
            </div>
            <div>
              <p className="text-sm text-gray-500">방화벽</p>
              <p className="text-xl font-bold">{displayOrNA(firewallCount)} <span className="text-green-600 text-xs ml-2">모두 온라인</span></p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">보안 경고</h3>
          <ul className="space-y-2">
            {alerts.map((a, i) => (
              <li key={i} className="text-sm text-gray-700">
                <strong>{a.message}</strong> ({a.level})<br />
                <span className="text-xs text-gray-500">{a.detail}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white rounded-lg border p-4 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">최근 이벤트</h3>
          <ul className="space-y-2">
            {events.map((e, i) => (
              <li key={i} className="text-sm text-gray-800">
                <strong>{e.title}</strong>
                <div className="text-xs text-gray-500">{e.description} - {e.timestamp}</div>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white rounded-lg border p-4 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">성능 개요 (트래픽)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trafficData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTraffic" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
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
      </div>
    </MainLayout>
  );
}