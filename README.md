# SNMP 및 SSH 장비 설정방법
1. 장비 내 SNMP 활성화
 - Router(config)# ```snmp-server community <커뮤니티_문자열> RO```

 - Router(config)# ```access-list <리스트 번호> permit <허용할 PC IP>```

 - Router(config)# ```snmp-server community <커뮤니티_문자열> RO <리스트 번호>```
***
2. SNMPv3 설정 및 암호 적용
 - Router(config)# ```snmp-server group <그룹명> v3 auth```

 - Router(config)# ```snmp-server user <사용자이름> <그룹명> v3 auth sha <암호> priv aes 128 <암호>```
***
3. Router SSH 설정
 - Router(config)# ```hostname <장비 이름>```

 - Router(config)# ```ip domain-name example.com```

 - Router(config)# ```crypto key generate rsa```

 - Router(config)# ```ip ssh version 2```

 - Router(config)# ```line vty 0 4```

 - Router(config-line)# ```transport input ssh```

 - Router(config-line)# ```login local```

 - Router(config-line)# ```exit```

 - Router(config)# ```username <사용자 이름> privilege 15 secret <비밀번호>```

 moudle 1024로 설정
 이유: ssh version 2 쓰려면 812이상의 모듈을 사용해야함.
 

# 현재 설정(2025-04-06)
 - Router(config)# ```snmp-server community capston RO```

 - Router(config)# ```access-list 10 permit 172.16.0.3```

 - Router(config)# ```snmp-server community capston RO 10```

 - Router(config)# ```snmp-server group nlab v3 auth```

 - Router(config)# ```snmp-server user song nlab v3 auth sha bonggeun priv aes 128 bonggeun```


 - Router(config)# ```hostname <장비 이름>```

 - Router(config)# ```ip domain-name example.com```

 - Router(config)# ```crypto key generate rsa```

 - Router(config)# ```ip ssh version 2```

 - Router(config)# ```line vty 0 4```

 - Router(config-line)# ```transport input ssh```

 - Router(config-line)# ```login local```

 - Router(config-line)# ```exit```

 - Router(config)# ```username song privilege 15 secret 1004```


# 백엔드, 프론트엔드 실행 명령어
 - 백엔드: ```uvicorn backend:app --reload --host 0.0.0.0 --port 8000 ```

 - 프론트엔드: ```npx expo start ```


# 초기 작업
 - python 설치, node.js 설치
 - cmd에서 python --version 으로 버전 잘 뜨는지 확인
 - visual studio code로 프로젝트 폴더 열기
 - 모듈 설치하기
 - cd backend -> pip install -r requirements.txt
 - cd topology-web -> npm install


# 방화벽 해제
 - 제어판 → 시스템 및 보안 → Windows Defender 방화벽 → 고급 설정
 - 왼쪽 메뉴에서 인바운드 규칙(Inbound Rules)을 선택
 - File and Printer Sharing (Echo Request - ICMPv4-In) 규칙 활성화
 - 혹은 파일 및 프린트 공유(Echo Request - ICMPv4-In) 규칙 활성화
 - 도메인, 개인 둘다 활성화
 - 방화벽 상태 확인 -> Windows Defender 방화벽 설정 또는 해제


# 주의사항
 - Router 게이트웨이 설정
 - community_string 코드 수정
 - pysnmp.hlapi를 사용하기 위해 pysnmp 라이브러리를 다운그레이드 해야함. (최신버전은 출시가 안됨.)
