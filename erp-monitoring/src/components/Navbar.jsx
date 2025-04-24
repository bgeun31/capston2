import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav style={{ padding: '10px', backgroundColor: '#333', color: '#fff' }}>
      <Link to="/" style={{ marginRight: '15px', color: '#fff', textDecoration: 'none' }}>홈</Link>
      <Link to="/assets" style={{ marginRight: '15px', color: '#fff', textDecoration: 'none' }}>자산</Link>
      <Link to="/employees" style={{ marginRight: '15px', color: '#fff', textDecoration: 'none' }}>인력</Link>
      <Link to="/downtime" style={{ marginRight: '15px', color: '#fff', textDecoration: 'none' }}>시간</Link>
      <Link to="/monitoring" style={{ color: '#fff', textDecoration: 'none' }}>데이터</Link>
    </nav>
  );
};

export default Navbar;
