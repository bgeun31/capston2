import React from 'react';

// 임시 장비 데이터 (나중에 백엔드 API로 교체 가능)
const assetList = [
  {
    id: 'EQ001',
    name: 'CNC 머신',
    location: '1공장',
    status: '정상',
    installDate: '2023-01-10'
  },
  {
    id: 'EQ002',
    name: '레이저 커터기',
    location: '2공장',
    status: '고장',
    installDate: '2022-08-05'
  },
  {
    id: 'EQ003',
    name: '포장기',
    location: '3공장',
    status: '정상',
    installDate: '2024-03-12'
  }
];

export default function AssetPage() {
  return (
    <div style={{ padding: '20px' }}>
      <h2>📦 자산 관리 페이지</h2>
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
