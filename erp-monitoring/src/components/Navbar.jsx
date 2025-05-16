import React from 'react';
import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: '#333',
      padding: '10px 20px'
    }}>
      <div>
        <Link to="/" style={linkStyle}>홈</Link>
        <Link to="/assets" style={linkStyle}>장비</Link>
        <Link to="/employees" style={linkStyle}>인사</Link>
        <Link to="/downtime" style={linkStyle}>시간</Link>
        <Link to="/monitoring" style={linkStyle}>데이터</Link>
      </div>

      <div>
        <Link to="/admin-login" style={{ ...linkStyle, backgroundColor: '#007bff', padding: '6px 12px', borderRadius: '6px' }}>
          관리자
        </Link>
      </div>
    </nav>
  );
}

const linkStyle = {
  color: '#fff',
  marginRight: '15px',
  textDecoration: 'none',
  fontSize: '1rem'
};
