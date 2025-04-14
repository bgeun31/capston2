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

  const fetchDeviceDetail = async (id) => {
    if (deviceCache[id]) {
      setSelectedDevice(deviceCache[id]);
    } else {
      const res = await axios.get(`/api/device/${id}`);
      setDeviceCache(prev => ({ ...prev, [id]: res.data }));
      setSelectedDevice(res.data);
    }
    const hist = await axios.get(`/api/device/${id}/cli-history`);
    setCliHistory(hist.data);
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
  }, []);

  const parsePercent = (val) => {
    if (!val || typeof val !== "string") return 0;
    return parseInt(val.replace("%", "")) || 0;
  };

  return (
    <MainLayout>
      <div className="flex gap-6">
        <svg ref={svgRef} width={800} height={600} className="border rounded" />

        <div className="w-[480px]">
          {selectedDevice ? (
            <Card className="p-4">
              <Tabs value={activeTab} onChange={(e, val) => setActiveTab(val)}>
                <Tab label="장비정보" value="info" />
                <Tab label="CLI 터미널" value="cli" />
              </Tabs>

              {activeTab === "info" && (
                <div className="text-sm mt-4 space-y-4">

                  {/* 원형 게이지 상단 배치 */}
                  <div className="flex justify-center gap-8">
                    {/* CPU */}
                    <div className="flex flex-col items-center">
                      <div className="w-20 h-20">
                        <CircularProgressbar
                          value={parsePercent(selectedDevice.cpuUsage)}
                          text={selectedDevice.cpuUsage}
                          styles={buildStyles({
                            textSize: "24px",
                            pathColor: "#3b82f6",
                            textColor: "#1f2937",
                            trailColor: "#d1d5db"
                          })}
                        />
                      </div>
                      <p className="mt-1 font-medium text-sm text-gray-700">CPU</p>
                    </div>

                    {/* Memory */}
                    <div className="flex flex-col items-center">
                      <div className="w-20 h-20">
                        <CircularProgressbar
                          value={parsePercent(selectedDevice.memoryUsage)}
                          text={selectedDevice.memoryUsage}
                          styles={buildStyles({
                            textSize: "24px",
                            pathColor: "#8b5cf6",
                            textColor: "#1f2937",
                            trailColor: "#d1d5db"
                          })}
                        />
                      </div>
                      <p className="mt-1 font-medium text-sm text-gray-700">Memory</p>
                    </div>
                  </div>

                  {/* 텍스트 정보는 아래로 */}
                  <div className="space-y-1 mt-4">
                    <p><b>IP:</b> {selectedDevice.ip}</p>
                    <p><b>Hostname:</b> {selectedDevice.hostname}</p>
                    <p><b>Model:</b> {selectedDevice.model}</p>
                    <p><b>Version:</b> {selectedDevice.version}</p>
                    <p><b>Interfaces:</b> {selectedDevice.interfaceCount}</p>
                  </div>
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
            <p>장비를 클릭하면 정보를 확인할 수 있습니다.</p>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
