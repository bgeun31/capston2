import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AdminLogin() {
  const [adminId, setAdminId] = useState('');
  const [adminPw, setAdminPw] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = () => {
    if (adminId === 'admin' && adminPw === '1234') {
      sessionStorage.setItem('isAdmin', 'true');
      navigate('/admin');
    } else {
      setError('❌ ID 또는 비밀번호가 틀렸습니다.');
    }
  };

  return (
    <div style={{ padding: '40px', maxWidth: '400px', margin: 'auto' }}>
      <h2>🔐 관리자 로그인</h2>
      <input
        type="text"
        placeholder="ID"
        value={adminId}
        onChange={(e) => setAdminId(e.target.value)}
        style={{ width: '100%', marginBottom: '10px', padding: '8px' }}
      />
      <input
        type="password"
        placeholder="비밀번호"
        value={adminPw}
        onChange={(e) => setAdminPw(e.target.value)}
        style={{ width: '100%', marginBottom: '10px', padding: '8px' }}
      />
      <button onClick={handleLogin} style={{ padding: '10px 20px' }}>
        로그인
      </button>
      {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
    </div>
  );
}
