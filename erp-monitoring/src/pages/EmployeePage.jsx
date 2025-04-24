import React, { useState } from 'react';

export default function EmployeePage() {
  const [employeeList, setEmployeeList] = useState([
    {
      id: 'NET001',
      name: '최재원',
      department: '네트워크팀',
      phone: '010-1111-2222',
      assignedEquip: 'Cisco ISR 4331 라우터'
    },
    {
      id: 'NET002',
      name: '박규빈',
      department: '보안팀',
      phone: '010-3333-4444',
      assignedEquip: 'ASA 5506-X 방화벽'
    },
    {
      id: 'NET003',
      name: '전민주',
      department: '인프라팀',
      phone: '010-5555-6666',
      assignedEquip: 'Catalyst 9200 스위치'
    }
  ]);

  // 입력 상태 저장
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [phone, setPhone] = useState('');
  const [assignedEquip, setAssignedEquip] = useState('');

  const handleAddEmployee = () => {
    if (!name || !department || !phone || !assignedEquip) {
      alert('모든 항목을 입력해주세요!');
      return;
    }

    const newEmployee = {
      id: `NET00${employeeList.length + 1}`,
      name,
      department,
      phone,
      assignedEquip
    };

    setEmployeeList([...employeeList, newEmployee]);

    // 입력 폼 초기화
    setName('');
    setDepartment('');
    setPhone('');
    setAssignedEquip('');
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>👨‍💻 네트워크 관리자 등록</h2>

      {/* 입력 폼 */}
      <div style={{ marginBottom: '20px' }}>
        <input type="text" placeholder="이름" value={name} onChange={(e) => setName(e.target.value)} style={{ marginRight: '10px' }} />
        <input type="text" placeholder="부서" value={department} onChange={(e) => setDepartment(e.target.value)} style={{ marginRight: '10px' }} />
        <input type="text" placeholder="연락처" value={phone} onChange={(e) => setPhone(e.target.value)} style={{ marginRight: '10px' }} />
        <input type="text" placeholder="담당 장비" value={assignedEquip} onChange={(e) => setAssignedEquip(e.target.value)} style={{ marginRight: '10px' }} />
        <button onClick={handleAddEmployee}>➕ 등록</button>
      </div>

      {/* 직원 카드 목록 */}
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        {employeeList.map((emp) => (
          <div key={emp.id} style={{
            border: '1px solid #ccc',
            borderRadius: '10px',
            padding: '15px',
            width: '250px',
            backgroundColor: '#f9f9f9'
          }}>
            <h4>{emp.name}</h4>
            <p><strong>직원 ID:</strong> {emp.id}</p>
            <p><strong>부서:</strong> {emp.department}</p>
            <p><strong>연락처:</strong> {emp.phone}</p>
            <p><strong>담당 장비:</strong> {emp.assignedEquip}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
