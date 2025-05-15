import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();

  const menuItems = [
    {
      title: '📦 장비 관리',
      desc: '네트워크 장비 등록 및 상태 관리',
      path: '/assets'
    },
    {
      title: '👨‍💻 직원 관리',
      desc: '관리자/운영자 정보 관리',
      path: '/employees'
    },
    {
      title: '🕒 장애 이력',
      desc: '장비 고장 기록 및 조치 내역',
      path: '/downtime'
    },
    {
      title: '📡 센서 데이터',
      desc: '온도/CPU 상태 실시간 확인',
      path: '/monitoring'
    }
  ];

  return (
    <div style={{
      padding: '60px 40px',
      fontFamily: 'Segoe UI, sans-serif',
      background: 'linear-gradient(to right, #f0f4f8, #ffffff)',
      minHeight: '100vh'
    }}>
      <h1 style={{ fontSize: '2.8rem', marginBottom: '15px', color: '#222' }}>
        🚀 장비 감시 ERP 시스템
      </h1>
      <p style={{ fontSize: '1.2rem', color: '#666', marginBottom: '50px' }}>
        Cisco 기반 네트워크 환경을 위한 고급 통합 모니터링 도구
      </p>

      {/* 카드 메뉴 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '30px'
      }}>
        {menuItems.map((item, index) => (
          <div key={index} style={{
            borderRadius: '18px',
            padding: '25px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
            backgroundColor: '#fff',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            cursor: 'pointer'
          }}
          onClick={() => navigate(item.path)}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-5px)';
            e.currentTarget.style.boxShadow = '0 15px 30px rgba(0,0,0,0.15)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.08)';
          }}
          >
            <h3 style={{ marginBottom: '10px', fontSize: '1.3rem', color: '#333' }}>
              {item.title}
            </h3>
            <p style={{ color: '#777', fontSize: '0.95rem' }}>{item.desc}</p>
            <div style={{
              marginTop: '20px',
              display: 'inline-block',
              padding: '8px 16px',
              backgroundColor: '#007bff',
              color: '#fff',
              borderRadius: '8px',
              fontSize: '0.9rem',
              transition: 'background-color 0.2s ease'
            }}>
              바로가기 →
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
