import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import axios from "axios";

function App() {
  const svgRef = useRef(null);
  const [selectedDevice, setSelectedDevice] = useState(null); // 선택된 노드
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, text: "" });

  // 초기 로드 시 토폴로지 불러오기
  useEffect(() => {
    axios.get("http://localhost:8000/api/topology")
      .then(res => {
        const { nodes, links } = res.data;
        drawGraph(nodes, links);
      })
      .catch(err => {
        console.error("Failed to fetch topology:", err);
      });

    function drawGraph(nodes, links) {
      const svg = d3.select(svgRef.current);
      const width = 800, height = 600;

      // 기존 요소 정리
      svg.selectAll("*").remove();

      // forceSimulation 세팅
      const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id(d => d.id).distance(120))
        .force("charge", d3.forceManyBody().strength(-400))
        .force("center", d3.forceCenter(width / 2, height / 2));

      // 링크(간선)
      const link = svg.selectAll(".link")
        .data(links)
        .enter()
        .append("line")
        .attr("class", "link")
        .attr("stroke", "#aaa")
        .attr("stroke-width", 2)
        .on("mouseover", (event, d) => {
          setTooltip({
            visible: true,
            x: event.pageX,
            y: event.pageY,
            text: `Interface: ${d.ifaceA} ↔ ${d.ifaceB}`
          });
        })
        .on("mouseout", () => {
          setTooltip({ visible: false, x: 0, y: 0, text: "" });
        });

      // 노드
      const node = svg.selectAll(".node")
        .data(nodes)
        .enter()
        .append("circle")
        .attr("class", "node")
        .attr("r", 20)
        .attr("fill", "#69b3a2")
        .on("click", (event, d) => {
          fetchDeviceDetail(d.id); // 노드 클릭 시 상세정보 호출
        });

      // 라벨
      const label = svg.selectAll(".label")
        .data(nodes)
        .enter()
        .append("text")
        .attr("class", "label")
        .text(d => d.name)
        .attr("text-anchor", "middle")
        .attr("dy", -30)
        .style("font-size", "14px");

      // tick 이벤트
      simulation.on("tick", () => {
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

  // 개별 디바이스 상세 조회
  const fetchDeviceDetail = async (deviceId) => {
    try {
      const res = await axios.get(`http://localhost:8000/api/device/${deviceId}`);
      setSelectedDevice(res.data);
    } catch (error) {
      console.error("Failed to fetch device detail:", error);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "row" }}>
      {/* 왼쪽: D3 그래프 */}
      <div style={{ margin: "20px" }}>
        <h2>네트워크 토폴로지</h2>
        <svg ref={svgRef} width={800} height={600} style={{ border: "1px solid #ccc" }}></svg>

        {/* 링크 Tooltip */}
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

      {/* 오른쪽: 디바이스 상세정보 */}
      <div style={{ margin: "20px", width: "300px" }}>
        <h3>디바이스 상세</h3>
        {selectedDevice ? (
          <div>
            <p><strong>ID:</strong> {selectedDevice.id}</p>
            <p><strong>Name:</strong> {selectedDevice.name}</p>
            <p><strong>IP:</strong> {selectedDevice.ip}</p>
            <p><strong>Vendor:</strong> {selectedDevice.vendor}</p>
            {/* 필요 시 추가 정보 */}
          </div>
        ) : (
          <p>디바이스를 클릭하면 상세 정보가 표시됩니다.</p>
        )}
      </div>
    </div>
  );
}

export default App;
