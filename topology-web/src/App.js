import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import axios from "axios";

export default function App() {
  const svgRef = useRef(null);

  useEffect(() => {
    axios.get("http://localhost:8000/api/topology")
      .then(res => {
        const { nodes, links } = res.data;
        drawGraph(nodes, links);
      });

    function drawGraph(nodes, links) {
      const svg = d3.select(svgRef.current);
      const width = 800, height = 600;

      const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id(d => d.id).distance(120))
        .force("charge", d3.forceManyBody().strength(-400))
        .force("center", d3.forceCenter(width / 2, height / 2));

      const link = svg.selectAll(".link")
        .data(links)
        .enter().append("line")
        .attr("stroke", "#aaa");

      const node = svg.selectAll(".node")
        .data(nodes)
        .enter().append("circle")
        .attr("r", 20)
        .attr("fill", "#69b3a2");

      const label = svg.selectAll(".label")
        .data(nodes)
        .enter().append("text")
        .text(d => d.name)
        .attr("text-anchor", "middle")
        .attr("dy", -30);

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

  return (
    <div style={{ padding: 20 }}>
      <h2>네트워크 토폴로지</h2>
      <svg ref={svgRef} width={800} height={600}></svg>
    </div>
  );
}
