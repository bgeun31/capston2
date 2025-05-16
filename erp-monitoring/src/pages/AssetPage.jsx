import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function AssetPage() {
  const [assetList, setAssetList] = useState([]);

  useEffect(() => {
    const fetchAssets = () => {
      axios.get('http://localhost:8000/api/rds-devices')
        .then(res => setAssetList(res.data))
        .catch(err => console.error("데이터 로드 실패:", err));
    };

    fetchAssets(); // 처음 한 번 실행
    const interval = setInterval(fetchAssets, 5000); // 5초마다 반복
    return () => clearInterval(interval); // 컴포넌트 종료 시 정리
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <h2>📦 네트워크 장비 목록 (MySQL 캐스트)</h2>
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        {assetList.map((asset) => (
          <div key={asset.id} style={{
            border: '1px solid #ccc',
            borderRadius: '10px',
            padding: '15px',
            width: '250px',
            backgroundColor: '#e0f7ff'
          }}>
            <h4>{asset.name || '이름 없음'}</h4>
            <p><strong>장비 ID:</strong> {asset.id}</p>
            <p><strong>IP 주소:</strong> {asset.ip || '없음'}</p>
            <p><strong>제조사:</strong> {asset.vendor || '알 수 없음'}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
