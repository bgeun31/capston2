// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import AssetPage from './pages/AssetPage';
import EmployeePage from './pages/EmployeePage';
import DowntimePage from './pages/DowntimePage';
import MonitoringPage from './pages/MonitoringPage';

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/assets" element={<AssetPage />} />
        <Route path="/employees" element={<EmployeePage />} />
        <Route path="/downtime" element={<DowntimePage />} />
        <Route path="/monitoring" element={<MonitoringPage />} />
      </Routes>
    </Router>
  );
}

export default App;
