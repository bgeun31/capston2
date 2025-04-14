import React from "react";
import { Routes, Route } from "react-router-dom";
import DashboardPage from "./pages/DashboardPage";
import TopologyPage from "./pages/TopologyPage";
import TerminalPage from "./pages/TerminalPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/topology" element={<TopologyPage />} />
      <Route path="/terminal" element={<TerminalPage />} />
    </Routes>
  );
}
