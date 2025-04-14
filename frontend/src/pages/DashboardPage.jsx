// pages/DashboardPage.jsx
import React, { useEffect, useState } from "react";
import MainLayout from "../components/layout/MainLayout";
import axios from "axios";
import {
  MonitorCheck,
  Link2,
  ShieldAlert,
  Cpu,
  MemoryStick
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
  const [alerts, setAlerts] = useState([]);
  const [events, setEvents] = useState([]);
  const [deviceList, setDeviceList] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);
  const [perfData, setPerfData] = useState([]);

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

    axios.get("/api/devices").then((res) => {
      setDeviceList(res.data);
      if (res.data.length > 0) {
        setSelectedDeviceId(res.data[0].id);
      }
    });

    axios.get("/api/alerts").then(res => {
      setAlerts(res.data);
    });

    axios.get("/api/events").then(res => {
      setEvents(res.data);
    });
  }, []);

  useEffect(() => {
    if (selectedDeviceId) {
      axios.get(`/api/performance?device_id=${selectedDeviceId}`).then((res) => setPerfData(res.data));
    }
  }, [selectedDeviceId]);

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
          <h3 className="text-lg font-semibold mb-4">장비별 성능 개요</h3>

          {/* 장비 선택 */}
          <div className="mb-4">
            <label className="text-sm text-gray-600 mr-2">장비 선택:</label>
            <select
              value={selectedDeviceId || ""}
              onChange={(e) => setSelectedDeviceId(e.target.value)}
              className="border px-3 py-1 rounded"
            >
              {deviceList.map((dev) => (
                <option key={dev.id} value={dev.id}>{dev.name}</option>
              ))}
            </select>
          </div>

          {/* 성능 그래프 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* CPU */}
            <div className="h-72">
              <h4 className="text-sm text-gray-600 font-medium mb-2">CPU 사용률 (%)</h4>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={perfData}>
                  <XAxis dataKey="time" />
                  <YAxis domain={[0, 100]} />
                  <CartesianGrid strokeDasharray="3 3" />
                  <Tooltip />
                  <Area type="monotone" dataKey="cpu" stroke="#3b82f6" fill="#bfdbfe" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Memory */}
            <div className="h-72">
              <h4 className="text-sm text-gray-600 font-medium mb-2">Memory 사용률 (%)</h4>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={perfData}>
                  <XAxis dataKey="time" />
                  <YAxis domain={[0, 100]} />
                  <CartesianGrid strokeDasharray="3 3" />
                  <Tooltip />
                  <Area type="monotone" dataKey="memory" stroke="#8b5cf6" fill="#ddd6fe" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}