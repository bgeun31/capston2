import React, { useState } from 'react';

export default function MonitoringPage() {
  const [sensorData, setSensorData] = useState([
    {
      id: 'SW002',
      name: 'Catalyst 9200 스위치',
      temperature: 43,
      cpuUsage: 78,
      status: '경고'
    },
    {
      id: 'RTR001',
      name: 'Cisco ISR 4331 라우터',
      temperature: 36,
      cpuUsage: 52,
      status: '정상'
    }
  ]);

  const [name, setName] = useState('');
  const [temperature, setTemperature] = useState('');
  const [cpuUsage, setCpuUsage] = useState('');
  const [status, setStatus] = useState('');

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

    // 입력 초기화
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
