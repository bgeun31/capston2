import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import axios from "axios";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { Tabs, Tab } from "@mui/material";

function App() {
  const svgRef = useRef(null);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, text: "" });
  const [activeTab, setActiveTab] = useState("info");
  const [deviceCache, setDeviceCache] = useState({});

  useEffect(() => {
    axios.get("http://localhost:8000/api/topology").then(res => {
      const { nodes, links } = res.data;
      drawGraph(nodes, links);
    });

    function drawGraph(nodes, links) {
      const svg = d3.select(svgRef.current);
      svg.selectAll("*").remove();
      const width = 800, height = 600;

      const container = svg.append("g");

      svg.call(
        d3.zoom().on("zoom", (event) => {
          container.attr("transform", event.transform);
        })
      );

      const sim = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id(d => d.id).distance(120))
        .force("charge", d3.forceManyBody().strength(-400))
        .force("center", d3.forceCenter(width / 2, height / 2));

      const link = container.selectAll(".link")
        .data(links)
        .enter()
        .append("line")
        .attr("stroke", "#aaa")
        .attr("stroke-width", 2)
        .on("mouseover", (e, d) => {
          setTooltip({
            visible: true,
            x: e.pageX,
            y: e.pageY,
            text: `Interface: ${d.ifaceA} ↔ ${d.ifaceB}`
          });
        })
        .on("mouseout", () => setTooltip({ visible: false, x: 0, y: 0, text: "" }));

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
        link
          .attr("x1", d => d.source.x)
          .attr("y1", d => d.source.y)
          .attr("x2", d => d.target.x)
          .attr("y2", d => d.target.y);

        node
          .attr("cx", d => d.x)
          .attr("cy", d => d.y);

        label
          .attr("x", d => d.x)
          .attr("y", d => d.y);
      });
    }
  }, []);

  const fetchDeviceDetail = async (id) => {
    if (deviceCache[id]) {
      setSelectedDevice(deviceCache[id]);
      setActiveTab("info");
      return;
    }
  
    const res = await axios.get(`http://localhost:8000/api/device/${id}`);
    const data = res.data;
    setDeviceCache(prev => ({ ...prev, [id]: data }));
    setSelectedDevice(data);
    setActiveTab("info");
  };
  
  

  const getPercentageFromCPU = (text) => {
    if (!text || typeof text !== "string") return 0;
    const match = text.match(/(\d+)%/);
    return match ? parseInt(match[1]) : 0;
  };

  const formatUptime = (secondsStr) => {
    const seconds = parseInt(secondsStr);
    if (isNaN(seconds)) return "N/A";
    const days = Math.floor(seconds / (3600 * 24));
    const hours = Math.floor((seconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}일 ${hours}시간 ${minutes}분`;
  };

  return (
    <div style={{ display: "flex", flexDirection: "row" }}>
      <div style={{ margin: "20px" }}>
        <h2>네트워크 토폴로지</h2>
        <svg
          ref={svgRef}
          width={800}
          height={600}
          style={{ border: "1px solid #ccc" }}
        />
        {tooltip.visible && (
          <div
            style={{
              position: "absolute",
              left: tooltip.x + 15,
              top: tooltip.y + 15,
              backgroundColor: "rgba(0,0,0,0.7)",
              color: "#fff",
              padding: "5px",
              borderRadius: "4px",
              pointerEvents: "none"
            }}
          >
            {tooltip.text}
          </div>
        )}
      </div>

      <div style={{ margin: "20px", width: "500px" }}>
        <h3>장비 정보</h3>
        {selectedDevice ? (
          <>
            <Tabs
              value={activeTab}
              onChange={(e, newVal) => setActiveTab(newVal)}
              indicatorColor="primary"
              textColor="primary"
              variant="fullWidth"
            >
              <Tab label="장비정보" value="info" />
              <Tab label="상태요약" value="status" />
            </Tabs>

            {activeTab === "info" && (
              <div style={{ padding: "10px", lineHeight: "1.8em" }}>
                <p><strong>ID:</strong> {selectedDevice.id}</p>
                <p><strong>IP:</strong> {selectedDevice.ip}</p>
                <p><strong>Vendor:</strong> {selectedDevice.vendor || "N/A"}</p>

                <p><strong>sysName:</strong> {selectedDevice.sysName || "N/A"}</p>

                <p><strong>sysDescr:</strong><br />
                  <span style={{ whiteSpace: "pre-wrap" }}>
                    {selectedDevice.sysDescr || "N/A"}
                  </span>
                </p>

                <p><strong>Uptime:</strong> {formatUptime(selectedDevice.uptime)}</p>

                <p><strong>Hostname:</strong> {selectedDevice.hostname || "N/A"}</p>
                <p><strong>Model:</strong> {selectedDevice.model || "N/A"}</p>
                <p><strong>Version:</strong> {selectedDevice.version || "N/A"}</p>
                <p><strong>Interface Count:</strong> {selectedDevice.interfaceCount || "N/A"}</p>
              </div>
            )}

            {activeTab === "status" && (
              <div style={{ padding: "10px" }}>
                <div style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
                  <div style={{ width: 100, height: 100 }}>
                    <CircularProgressbar
                      value={getPercentageFromCPU(selectedDevice.cpuUsage)}
                      text={"CPU"}
                      styles={buildStyles({ pathColor: "#f88", textColor: "#333" })}
                    />
                  </div>
                  <div style={{ width: 100, height: 100 }}>
                    <CircularProgressbar
                      value={getPercentageFromCPU(selectedDevice.memoryUsage)}
                      text={"MEM"}
                      styles={buildStyles({ pathColor: "#3e98c7", textColor: "#333" })}
                    />
                  </div>
                </div>

                <h4>인터페이스 상태</h4>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th>Interface</th>
                      <th>IP</th>
                      <th>Status</th>
                      <th>Protocol</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedDevice.interfaces?.map((iface, i) => (
                      <tr key={i}>
                        <td>{iface.name}</td>
                        <td>{iface.ip}</td>
                        <td>
                          <span style={{
                            color: iface.status === "up" ? "green" : "red",
                            fontWeight: "bold"
                          }}>
                            {iface.status}
                          </span>
                        </td>
                        <td>
                          <span style={{
                            color: iface.protocol === "up" ? "green" : "red",
                            fontWeight: "bold"
                          }}>
                            {iface.protocol}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : (
          <p>디바이스를 클릭하면 장비 정보가 표시됩니다.</p>
        )}
      </div>
    </div>
  );
}

export default App;
