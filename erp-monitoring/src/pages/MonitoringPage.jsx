import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function MonitoringPage() {
  const [sensorData, setSensorData] = useState([]);
  const [name, setName] = useState('');
  const [temperature, setTemperature] = useState('');
  const [cpuUsage, setCpuUsage] = useState('');
  const [status, setStatus] = useState('');

  // ✅ 1. 마운트 시 백엔드에서 데이터 로딩
  useEffect(() => {
    axios.get('http://localhost:8000/api/performance-summary')
      .then(res => {
        const data = res.data;
        const newList = [
          {
            id: 'summary',
            name: '전체 평균',
            temperature: data.avg_memory?.replace('%', '') || 0,
            cpuUsage: data.avg_cpu?.replace('%', '') || 0,
            status: '정상'
          }
        ];
        setSensorData(newList);
      })
      .catch(err => console.error(err));
  }, []);
  

  const handleAddSensor = () => {
    if (!name || !temperature || !cpuUsage || !status) {
      alert('모든 항목을 입력해주세요!');
      return;
    }

    const newSensor = {
      id: `SENSOR${sensorData.length + 1}`,
      name,
      temperature: parseInt(temperature),
      cpuUsage: parseInt(cpuUsage),
      status
    };

    setSensorData([...sensorData, newSensor]);

    setName('');
    setTemperature('');
    setCpuUsage('');
    setStatus('');
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>📡 센서 데이터 등록</h2>

      {/* 입력 폼 */}
      <div style={{ marginBottom: '20px' }}>
        <input type="text" placeholder="장비명" value={name} onChange={(e) => setName(e.target.value)} style={{ marginRight: '10px' }} />
        <input type="number" placeholder="온도 (°C)" value={temperature} onChange={(e) => setTemperature(e.target.value)} style={{ marginRight: '10px' }} />
        <input type="number" placeholder="CPU 사용률 (%)" value={cpuUsage} onChange={(e) => setCpuUsage(e.target.value)} style={{ marginRight: '10px' }} />
        <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ marginRight: '10px' }}>
          <option value="">상태 선택</option>
          <option value="정상">정상</option>
          <option value="경고">경고</option>
        </select>
        <button onClick={handleAddSensor}>➕ 센서 등록</button>
      </div>

      {/* 센서 카드 목록 */}
      {sensorData.map(item => (
        <div key={item.id} style={{
          border: '1px solid #ccc',
          borderRadius: '10px',
          marginBottom: '15px',
          padding: '15px',
          backgroundColor: item.status === '경고' ? '#fff3cd' : '#e6ffed'
        }}>
          <h4>{item.name}</h4>
          <p><strong>온도:</strong> {item.temperature}°C</p>
          <p><strong>CPU 사용률:</strong> {item.cpuUsage}%</p>
          <p><strong>상태:</strong> {item.status}</p>
        </div>
      ))}
    </div>
  );
}
