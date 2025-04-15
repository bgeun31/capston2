// pages/TopologyPage.jsx
import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import axios from "axios";
import { Tabs, Tab } from "@mui/material";
import SshTerminal from "../components/SshTerminal";
import { Card } from "../components/ui/card";
import MainLayout from "../components/layout/MainLayout";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

export default function TopologyPage() {
  const svgRef = useRef(null);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [deviceCache, setDeviceCache] = useState({});
  const [activeTab, setActiveTab] = useState("info");
  const [cliCommand, setCliCommand] = useState("");
  const [cliOutput, setCliOutput] = useState("");
  const [cliHistory, setCliHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pendingDeviceName, setPendingDeviceName] = useState("");

  const fetchDeviceDetail = async (id) => {
    setLoading(true);
    try {
      const allNodes = await axios.get("/api/topology");
      const clickedNode = allNodes.data.nodes.find(n => n.id === id);
      const name = clickedNode?.name || `ID ${id}`;
      setPendingDeviceName(name);

      const res = await axios.get(`/api/device/${id}`);
      setDeviceCache(prev => ({ ...prev, [id]: res.data }));
      setSelectedDevice(res.data);

      const hist = await axios.get(`/api/device/${id}/cli-history`);
      setCliHistory(hist.data);
    } catch (err) {
      console.error("장비 정보를 불러오지 못했습니다:", err);
    } finally {
      setLoading(false);
    }
  };  

  const handleCliExecute = async () => {
    if (!cliCommand.trim()) return;
    try {
      const res = await axios.post("/api/device/cli", {
        device_id: selectedDevice.id,
        command: cliCommand
      });
      setCliOutput(res.data.output);
      setCliCommand("");
      const hist = await axios.get(`/api/device/${selectedDevice.id}/cli-history`);
      setCliHistory(hist.data);
    } catch (err) {
      setCliOutput("명령 실행 중 오류 발생: " + err.message);
    }
  };

  useEffect(() => {
    axios.get("/api/topology").then(res => {
      const { nodes, links } = res.data;
      drawGraph(nodes, links);
    });

    function drawGraph(nodes, links) {
      const svg = d3.select(svgRef.current);
      svg.selectAll("*").remove();
      const width = 800, height = 600;

      const container = svg.append("g");
      svg.call(d3.zoom().on("zoom", (event) => container.attr("transform", event.transform)));

      const sim = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id(d => d.id).distance(120))
        .force("charge", d3.forceManyBody().strength(-400))
        .force("center", d3.forceCenter(width / 2, height / 2));

      const link = container.selectAll(".link")
        .data(links)
        .enter()
        .append("line")
        .attr("stroke", "#aaa")
        .attr("stroke-width", 2);

      const node = container.selectAll(".node")
        .data(nodes)
        .enter()
        .append("circle")
        .attr("r", 20)
        .attr("fill", "#69b3a2")
        .on("click", (e, d) => fetchDeviceDetail(d.id));

      const label = container.selectAll(".label")
        .data(nodes)
        .enter()
        .append("text")
        .text(d => d.name)
        .attr("text-anchor", "middle")
        .attr("dy", -30)
        .style("font-size", "14px");

      sim.on("tick", () => {
        link.attr("x1", d => d.source.x).attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x).attr("y2", d => d.target.y);

        node.attr("cx", d => d.x).attr("cy", d => d.y);
        label.attr("x", d => d.x).attr("y", d => d.y);
      });
    }

    svgRef.current.style.backgroundColor = "#ffffff";
  }, []);

  const parsePercent = (val) => {
    if (!val || typeof val !== "string") return 0;
    return parseInt(val.replace("%", "")) || 0;
  };

  return (
    <MainLayout>
      <div className="flex gap-6 h-[600px]">
        <div className="flex flex-col bg-white p-4 rounded shadow-md">
          <div className="text-xl font-bold mb-2">네트워크 토폴로지</div>
          <svg ref={svgRef} width={800} height={600} className="border border-gray-300 rounded-lg" />
        </div>
        <div className="w-[480px] h-full">
          {loading ? (
            <Card className="p-6 h-full flex flex-col items-center justify-center text-center text-gray-600 space-y-4">
              <div className="flex items-center gap-2 animate-pulse">
                <svg className="animate-spin h-6 w-6 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                <span className="text-base font-medium">{pendingDeviceName} 장비 정보를 불러오는 중...</span>
              </div>
              <div className="text-sm text-gray-400">SSH 및 SNMP 실시간 수집 중입니다</div>
            </Card>
          ) : selectedDevice ? (
            <Card className="p-4 h-full overflow-y-auto bg-white">
              <Tabs value={activeTab} onChange={(e, val) => setActiveTab(val)}>
                <Tab label="장비정보" value="info" />
                <Tab label="CLI 터미널" value="cli" />
              </Tabs>

              {activeTab === "info" && (
                <div className="text-sm mt-4 space-y-4">
                  <div className="flex justify-center gap-8">
                    <div className="flex flex-col items-center">
                      <div className="w-20 h-20">
                        <CircularProgressbar
                          value={parsePercent(selectedDevice.cpuUsage)}
                          text={selectedDevice.cpuUsage}
                          styles={buildStyles({ textSize: "24px", pathColor: "#3b82f6", textColor: "#1f2937", trailColor: "#d1d5db" })}
                        />
                      </div>
                      <p className="mt-1 font-medium text-sm text-gray-700">CPU</p>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-20 h-20">
                        <CircularProgressbar
                          value={parsePercent(selectedDevice.memoryUsage)}
                          text={selectedDevice.memoryUsage}
                          styles={buildStyles({ textSize: "24px", pathColor: "#8b5cf6", textColor: "#1f2937", trailColor: "#d1d5db" })}
                        />
                      </div>
                      <p className="mt-1 font-medium text-sm text-gray-700">Memory</p>
                    </div>
                  </div>

                  <div className="space-y-1 mt-4">
                    <p><b>IP:</b> {selectedDevice.ip}</p>
                    <p><b>Hostname:</b> {selectedDevice.hostname}</p>
                    <p><b>Model:</b> {selectedDevice.model}</p>
                    <p><b>Version:</b> {selectedDevice.version}</p>
                    <p><b>Interfaces:</b> {selectedDevice.interfaceCount}</p>
                  </div>

                  {/* 인터페이스 상태 표 */}
                  {selectedDevice.interfaces && (
                    <div className="mt-4">
                      <h4 className="text-sm font-semibold mb-2 text-gray-700">인터페이스 상태</h4>
                      <table className="w-full text-sm border text-left">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="py-2 px-3 border-b">Interface</th>
                            <th className="py-2 px-3 border-b">IP</th>
                            <th className="py-2 px-3 border-b">Status</th>
                            <th className="py-2 px-3 border-b">Protocol</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedDevice.interfaces.map((intf, idx) => (
                            <tr key={idx} className="border-t">
                              <td className="py-1 px-3">{intf.name}</td>
                              <td className="py-1 px-3">{intf.ip}</td>
                              <td className={`py-1 px-3 ${intf.status === 'up' ? 'text-green-600' : 'text-red-500'}`}>{intf.status}</td>
                              <td className={`py-1 px-3 ${intf.protocol === 'up' ? 'text-green-600' : 'text-red-500'}`}>{intf.protocol}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "cli" && (
                <div className="mt-4 space-y-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="border rounded px-3 py-2 flex-1"
                      placeholder="예: show ip interface brief"
                      value={cliCommand}
                      onChange={(e) => setCliCommand(e.target.value)}
                    />
                    <button
                      onClick={handleCliExecute}
                      className="bg-blue-600 text-white px-4 rounded hover:bg-blue-700"
                    >
                      실행
                    </button>
                  </div>
                  <div className="bg-black text-green-300 font-mono text-sm p-3 rounded h-40 overflow-auto">
                    {cliOutput || "명령어를 입력 후 실행 결과가 여기에 표시됩니다."}
                  </div>
                  <div className="text-xs text-gray-500 font-medium mt-6">최근 실행 기록</div>
                  <ul className="text-sm list-disc pl-4 space-y-1">
                    {cliHistory.map((item, idx) => (
                      <li key={idx}><b>{item.command}</b> — <span className="text-gray-500">{item.timestamp}</span></li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              장비를 클릭하면 정보를 확인할 수 있습니다.
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );  
}
