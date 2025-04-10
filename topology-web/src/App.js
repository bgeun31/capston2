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

  useEffect(() => {
    // 1) 서버에서 토폴로지 정보(nodes, links) 받아와서 D3로 그리기
    axios.get("http://localhost:8000/api/topology")
      .then(res => {
        const { nodes, links } = res.data;
        drawGraph(nodes, links);
      });

    function drawGraph(nodes, links) {
      const svg = d3.select(svgRef.current);
      svg.selectAll("*").remove();
      const width = 800, height = 600;

      // D3 force 시뮬레이션
      const sim = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id(d => d.id).distance(120))
        .force("charge", d3.forceManyBody().strength(-400))
        .force("center", d3.forceCenter(width / 2, height / 2));

      // 링크 그리기
      const link = svg.selectAll(".link")
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

      // 노드(장비) 그리기
      const node = svg.selectAll(".node")
        .data(nodes)
        .enter()
        .append("circle")
        .attr("r", 20)
        .attr("fill", "#69b3a2")
        .on("click", (e, d) => fetchDeviceDetail(d.id));  // 클릭 시 장비 상세 요청

      // 노드 라벨
      const label = svg.selectAll(".label")
        .data(nodes)
        .enter()
        .append("text")
        .text(d => d.name)
        .attr("text-anchor", "middle")
        .attr("dy", -30)
        .style("font-size", "14px");

      // 매 프레임마다 위치 업데이트
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

  // 2) 특정 장비 클릭 시 상세정보 가져옴
  const fetchDeviceDetail = async (id) => {
    const res = await axios.get(`http://localhost:8000/api/device/${id}`);
    setSelectedDevice(res.data);
    setActiveTab("info");
  };

  // 3) CPU 값에서 퍼센트만 추출하는 헬퍼
  const getPercentageFromCPU = (text) => {
    if (!text || typeof text !== "string") return 0;
    // 예: "CPU utilization for five seconds: 5%/0%; one minute: 3%; five minutes: 4%"
    // 여기서 첫 번째 (\d+)%를 찾아서 정수 변환
    const match = text.match(/(\d+)%/);
    return match ? parseInt(match[1]) : 0;
  };

  return (
    <div style={{ display: "flex", flexDirection: "row" }}>
      {/* 왼쪽: D3 토폴로지 시각화 */}
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

      {/* 오른쪽: 장비 상세/상태 */}
      <div style={{ margin: "20px", width: "500px" }}>
        <h3>장비 정보</h3>
        {selectedDevice ? (
          <>
            {/* 탭: 장비정보 / 상태요약 */}
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

            {/* 1) 장비정보 탭 */}
            {activeTab === "info" && (
              <div style={{ padding: "10px" }}>
                <p><strong>ID:</strong> {selectedDevice.id}</p>
                <p><strong>IP:</strong> {selectedDevice.ip}</p>
                <p><strong>Vendor:</strong> {selectedDevice.vendor || "N/A"}</p>

                {/* SNMP 정보 (백엔드에서 제대로 받아오면 표시됨) */}
                <p><strong>sysName:</strong> {selectedDevice.sysName || "N/A"}</p>
                <p><strong>sysDescr:</strong> {selectedDevice.sysDescr || "N/A"}</p>
                <p><strong>Uptime:</strong> {selectedDevice.uptime || "N/A"}</p>

                {/* 기타 정보 (원하면 백엔드에서 추가) */}
                <p><strong>Hostname:</strong> {selectedDevice.hostname || "N/A"}</p>
                <p><strong>Model:</strong> {selectedDevice.model || "N/A"}</p>
                <p><strong>Version:</strong> {selectedDevice.version || "N/A"}</p>
                <p><strong>Interface Count:</strong> {selectedDevice.interfaceCount || "N/A"}</p>
              </div>
            )}

            {/* 2) 상태요약 탭 */}
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
