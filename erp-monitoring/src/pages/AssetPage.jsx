import React, { useState } from 'react';

export default function AssetPage() {
  const [assetList, setAssetList] = useState([
    {
      id: 'RTR001',
      name: 'Cisco ISR 4331 라우터',
      location: '서버실 1층',
      status: '정상',
      installDate: '2023-04-15'
    },
    {
      id: 'SW002',
      name: 'Catalyst 9200 스위치',
      location: '서버실 2층 404',
      status: '고장',
      installDate: '2022-11-20'
    },
    {
      id: 'FW003',
      name: 'ASA 5506-X 방화벽',
      location: '공학관 네트워크실',
      status: '정상',
      installDate: '2023-01-02'
    }
  ]);

  // 입력 상태 저장
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [installDate, setInstallDate] = useState('');
  const [status, setStatus] = useState('');

  const handleAddAsset = () => {
    if (!name || !location || !installDate || !status) {
      alert('모든 항목을 입력해주세요!');
      return;
    }

    const newAsset = {
      id: `ASSET${assetList.length + 1}`,
      name,
      location,
      installDate,
      status
    };

    setAssetList([...assetList, newAsset]);

    // 입력 초기화
    setName('');
    setLocation('');
    setInstallDate('');
    setStatus('');
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>📦 네트워크 장비 등록</h2>

      {/* 입력 폼 */}
      <div style={{ marginBottom: '20px' }}>
        <input type="text" placeholder="장비명" value={name} onChange={(e) => setName(e.target.value)} style={{ marginRight: '10px' }} />
        <input type="text" placeholder="설치 위치" value={location} onChange={(e) => setLocation(e.target.value)} style={{ marginRight: '10px' }} />
        <input type="date" value={installDate} onChange={(e) => setInstallDate(e.target.value)} style={{ marginRight: '10px' }} />
        <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ marginRight: '10px' }}>
          <option value="">상태 선택</option>
          <option value="정상">정상</option>
          <option value="고장">고장</option>
        </select>
        <button onClick={handleAddAsset}>➕ 등록</button>
      </div>

      {/* 장비 카드 */}
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        {assetList.map((asset) => (
          <div key={asset.id} style={{
            border: '1px solid #ccc',
            borderRadius: '10px',
            padding: '15px',
            width: '250px',
            backgroundColor: asset.status === '고장' ? '#ffe0e0' : '#e0f7ff'
          }}>
            <h4>{asset.name}</h4>
            <p><strong>장비 ID:</strong> {asset.id}</p>
            <p><strong>설치 위치:</strong> {asset.location}</p>
            <p><strong>설치일:</strong> {asset.installDate}</p>
            <p><strong>상태:</strong> {asset.status}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
