import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function DowntimePage() {
  const [stats, setStats] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:8000/api/device-stats/latest')
      .then(res => setStats(res.data))
      .catch(err => console.error("데이터 로드 실패:", err));
  }, []);

  return (
    <div style={{ padding: '30px' }}>
      <h2>📉 최근 성능 데이터 (최대 50개)</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: '#f0f0f0' }}>
            <th style={thStyle}>장비 ID</th>
            <th style={thStyle}>시간</th>
            <th style={thStyle}>CPU 사용률</th>
            <th style={thStyle}>메모리 사용률</th>
          </tr>
        </thead>
        <tbody>
          {stats.map((row, index) => (
            <tr key={index} style={{ textAlign: 'center' }}>
              <td style={tdStyle}>{row.device_id}</td>
              <td style={tdStyle}>{row.timestamp}</td>
              <td style={tdStyle}>{row.cpu_usage}</td>
              <td style={tdStyle}>{row.mem_usage}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const thStyle = {
  padding: '10px',
  border: '1px solid #ccc'
};

const tdStyle = {
  padding: '8px',
  border: '1px solid #ddd'
};
