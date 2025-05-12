import React, { useState } from 'react';

export default function DowntimePage() {
  const [downtimeList, setDowntimeList] = useState([
    {
      id: 1,
      equipment: 'Catalyst 9200 스위치',
      startTime: '2024-04-01 08:10',
      endTime: '2024-04-01 09:25',
      reason: 'PoE 전원 공급 오류',
      action: '스위치 재부팅 및 펌웨어 업데이트'
    },
    {
      id: 2,
      equipment: 'Cisco ISR 4331 라우터',
      startTime: '2024-03-20 14:00',
      endTime: '2024-03-20 14:45',
      reason: 'BGP 세션 불안정',
      action: '인터페이스 재설정 및 BGP 리셋'
    }
  ]);

  // 입력 상태 관리
  const [equipment, setEquipment] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [reason, setReason] = useState('');
  const [action, setAction] = useState('');

  const handleAddDowntime = () => {
    if (!equipment || !startTime || !endTime || !reason || !action) {
      alert('모든 항목을 입력해주세요!');
      return;
    }

    const newEntry = {
      id: downtimeList.length + 1,
      equipment,
      startTime,
      endTime,
      reason,
      action
    };

    setDowntimeList([...downtimeList, newEntry]);

    // 입력 초기화
    setEquipment('');
    setStartTime('');
    setEndTime('');
    setReason('');
    setAction('');
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>📉 장애 이력 등록</h2>

      {/* 입력 폼 */}
      <div style={{ marginBottom: '20px' }}>
        <input type="text" placeholder="장비명" value={equipment} onChange={(e) => setEquipment(e.target.value)} style={{ marginRight: '10px' }} />
        <input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} style={{ marginRight: '10px' }} />
        <input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} style={{ marginRight: '10px' }} />
        <input type="text" placeholder="원인" value={reason} onChange={(e) => setReason(e.target.value)} style={{ marginRight: '10px' }} />
        <input type="text" placeholder="조치 내용" value={action} onChange={(e) => setAction(e.target.value)} style={{ marginRight: '10px' }} />
        <button onClick={handleAddDowntime}>➕ 이력 등록</button>
      </div>

      {/* 이력 테이블 */}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>장비</th>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>시작 시간</th>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>종료 시간</th>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>원인</th>
            <th style={{ border: '1px solid #ccc', padding: '8px' }}>조치</th>
          </tr>
        </thead>
        <tbody>
          {downtimeList.map(item => (
            <tr key={item.id}>
              <td style={{ border: '1px solid #ccc', padding: '8px' }}>{item.equipment}</td>
              <td style={{ border: '1px solid #ccc', padding: '8px' }}>{item.startTime}</td>
              <td style={{ border: '1px solid #ccc', padding: '8px' }}>{item.endTime}</td>
              <td style={{ border: '1px solid #ccc', padding: '8px' }}>{item.reason}</td>
              <td style={{ border: '1px solid #ccc', padding: '8px' }}>{item.action}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
