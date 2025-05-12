CREATE TABLE device (
      device_id INTEGER PRIMARY KEY AUTO_INCREMENT,
      name TEXT,
      ip TEXT,
      vendor TEXT,
      username TEXT,
      password TEXT,
      auth_password TEXT,
      priv_password TEXT
    );
INSERT INTO device VALUES(1,'R1','192.168.20.2','cisco','nlabs','1004','capstondesign','capstondesign');
INSERT INTO device VALUES(2,'R2','192.168.20.1','cisco','nlabs','1004','capstondesign','capstondesign');
INSERT INTO device VALUES(3,'R3','192.168.30.2','cisco','nlabs','1004','capstondesign','capstondesign');
INSERT INTO device VALUES(4,'R4','192.168.30.1','cisco','nlabs','1004','capstondesign','capstondesign');
INSERT INTO device VALUES(5,'R5','10.0.0.1','cisco','nlabs','1004','capstondesign','capstondesign');
INSERT INTO device VALUES(6,'SW1','192.168.10.3','cisco','nlabs','1004','capstondesign','capstondesign');
INSERT INTO device VALUES(7,'SW2','192.168.10.5','cisco','nlabs','1004','capstondesign','capstondesign');
INSERT INTO device VALUES(8,'SW3','0.0.0.0','unknown','dummy','dummy',NULL,NULL);
INSERT INTO device VALUES(9,'SW4','0.0.0.0','unknown','dummy','dummy',NULL,NULL);
INSERT INTO device VALUES(10,'SW5','0.0.0.0','unknown','dummy','dummy',NULL,NULL);
INSERT INTO device VALUES(11,'Eng_5F-1','0.0.0.0','unknown','dummy','dummy',NULL,NULL);
CREATE TABLE link_info (
      link_id INTEGER PRIMARY KEY AUTO_INCREMENT,
      device_a INTEGER,
      device_b INTEGER,
      interface_a TEXT,
      interface_b TEXT
    );
INSERT INTO link_info VALUES(1,1,8,'Gig 0/0','WS-C2950G Fas');
INSERT INTO link_info VALUES(2,1,7,'Gig 0/1','WS-C3560X Gig');
INSERT INTO link_info VALUES(3,2,8,'Gig 0/0','WS-C2950G Fas');
INSERT INTO link_info VALUES(4,2,7,'Gig 0/1','WS-C3560X Gig');
INSERT INTO link_info VALUES(5,3,9,'Gig 0/1','WS-C3560- Fas');
INSERT INTO link_info VALUES(6,3,10,'Gig 0/0','WS-C2950G Fas');
INSERT INTO link_info VALUES(7,4,9,'Gig 0/1','WS-C3560- Fas');
INSERT INTO link_info VALUES(8,4,10,'Gig 0/0','WS-C2950G Fas');
INSERT INTO link_info VALUES(9,5,6,'Gig 0/1','I  WS-C3560X');
INSERT INTO link_info VALUES(10,5,6,'Gig 0/2','I  WS-C3560X');
INSERT INTO link_info VALUES(11,5,11,'Gig 0/0','WS-C2960X Gig');
INSERT INTO link_info VALUES(12,6,7,'Gig 0/2','WS-C3560X Gig');
INSERT INTO link_info VALUES(13,6,9,'Gig 0/3','WS-C3560- Fas');
INSERT INTO link_info VALUES(14,5,6,'S I','Gig 0/1');
INSERT INTO link_info VALUES(15,5,6,'S I','Gig 0/5');
INSERT INTO link_info VALUES(16,6,7,'I  WS-C3560X','Gig 0/1');
INSERT INTO link_info VALUES(17,2,7,'S  CISCO2901','Gig 0/3');
INSERT INTO link_info VALUES(18,1,7,'S  CISCO2901','Gig 0/2');
CREATE TABLE device_cache (
      device_id INTEGER PRIMARY KEY,
      json TEXT
    );
INSERT INTO device_cache VALUES(1,'{"id": 1, "name": "R1", "ip": "192.168.20.2", "vendor": "cisco", "username": "nlabs", "sysName": "R1.capston.com", "sysDescr": "Cisco IOS Software, C2900 Software (C2900-UNIVERSALK9-M), Version 15.5(3)M2, RELEASE SOFTWARE (fc1)\r\nTechnical Support: http://www.cisco.com/techsupport\r\nCopyright (c) 1986-2016 by Cisco Systems, Inc.\r\nCompiled Sun 07-Feb-16 03:45 by prod_rel_team", "uptime": "84566402", "hostname": "R1", "model": "N/A", "version": "15.5(3)M2", "interfaceCount": 6, "cpuUsage": "1%", "memoryUsage": "34%", "interfaces": [{"name": "GigabitEthernet0/0", "ip": "192.168.20.2", "status": "up", "protocol": "up"}, {"name": "GigabitEthernet0/1", "ip": "192.168.10.2", "status": "up", "protocol": "up"}, {"name": "NVI0", "ip": "192.168.20.2", "status": "up", "protocol": "up"}]}');
INSERT INTO device_cache VALUES(2,'{"id": 2, "name": "R2", "ip": "192.168.20.1", "vendor": "cisco", "username": "nlabs", "sysName": "R2.capston.com", "sysDescr": "Cisco IOS Software, C2900 Software (C2900-UNIVERSALK9-M), Version 15.5(3)M2, RELEASE SOFTWARE (fc1)\r\nTechnical Support: http://www.cisco.com/techsupport\r\nCopyright (c) 1986-2016 by Cisco Systems, Inc.\r\nCompiled Sun 07-Feb-16 03:45 by prod_rel_team", "uptime": "84567308", "hostname": "R2", "model": "N/A", "version": "15.5(3)M2", "interfaceCount": 6, "cpuUsage": "0%", "memoryUsage": "35%", "interfaces": [{"name": "GigabitEthernet0/0", "ip": "192.168.20.1", "status": "up", "protocol": "up"}, {"name": "GigabitEthernet0/1", "ip": "192.168.10.1", "status": "up", "protocol": "up"}, {"name": "NVI0", "ip": "192.168.20.1", "status": "up", "protocol": "up"}]}');
INSERT INTO device_cache VALUES(3,'{"id": 3, "name": "R3", "ip": "192.168.30.2", "vendor": "cisco", "username": "nlabs", "sysName": "R3.capston.com", "sysDescr": "Cisco IOS Software, C2900 Software (C2900-UNIVERSALK9-M), Version 15.1(4)M4, RELEASE SOFTWARE (fc1)\r\nTechnical Support: http://www.cisco.com/techsupport\r\nCopyright (c) 1986-2012 by Cisco Systems, Inc.\r\nCompiled Tue 20-Mar-12 18:57 by prod_rel_team", "uptime": "84570996", "hostname": "R3", "model": "N/A", "version": "15.1(4)M4", "interfaceCount": 8, "cpuUsage": "4%", "memoryUsage": "8%", "interfaces": [{"name": "GigabitEthernet0/0", "ip": "192.168.40.2", "status": "up", "protocol": "up"}, {"name": "GigabitEthernet0/1", "ip": "192.168.30.2", "status": "up", "protocol": "up"}]}');
INSERT INTO device_cache VALUES(4,'{"id": 4, "name": "R4", "ip": "192.168.30.1", "vendor": "cisco", "username": "nlabs", "sysName": "R4.capston.com", "sysDescr": "Cisco IOS Software, C2900 Software (C2900-UNIVERSALK9-M), Version 15.1(4)M4, RELEASE SOFTWARE (fc1)\r\nTechnical Support: http://www.cisco.com/techsupport\r\nCopyright (c) 1986-2012 by Cisco Systems, Inc.\r\nCompiled Tue 20-Mar-12 18:57 by prod_rel_team", "uptime": "84570480", "hostname": "R4", "model": "N/A", "version": "15.1(4)M4", "interfaceCount": 6, "cpuUsage": "1%", "memoryUsage": "8%", "interfaces": [{"name": "GigabitEthernet0/0", "ip": "192.168.40.1", "status": "up", "protocol": "up"}, {"name": "GigabitEthernet0/1", "ip": "192.168.30.1", "status": "up", "protocol": "up"}]}');
INSERT INTO device_cache VALUES(5,'{"id": 5, "name": "R5", "ip": "10.0.0.1", "vendor": "cisco", "username": "nlabs", "sysName": "R5.capston.com", "sysDescr": "Cisco IOS Software, C2900 Software (C2900-UNIVERSALK9-M), Version 15.4(3)M3, RELEASE SOFTWARE (fc2)\r\nTechnical Support: http://www.cisco.com/techsupport\r\nCopyright (c) 1986-2015 by Cisco Systems, Inc.\r\nCompiled Fri 05-Jun-15 13:24 by prod_rel_team", "uptime": "84569003", "hostname": "R5", "model": "N/A", "version": "15.4(3)M3", "interfaceCount": 6, "cpuUsage": "0%", "memoryUsage": "20%", "interfaces": [{"name": "Any", "ip": "interface", "status": "OK?", "protocol": "value"}, {"name": "GigabitEthernet0/0", "ip": "210.119.103.173", "status": "up", "protocol": "up"}, {"name": "GigabitEthernet0/1", "ip": "10.0.0.1", "status": "up", "protocol": "up"}, {"name": "GigabitEthernet0/2", "ip": "10.0.1.1", "status": "up", "protocol": "up"}]}');
INSERT INTO device_cache VALUES(6,'{"id": 6, "name": "SW1", "ip": "192.168.10.3", "vendor": "cisco", "username": "nlabs", "sysName": "SW1.capston.com", "sysDescr": "Cisco IOS Software, C3560E Software (C3560E-UNIVERSALK9-M), Version 12.2(55)SE8, RELEASE SOFTWARE (fc2)\r\nTechnical Support: http://www.cisco.com/techsupport\r\nCopyright (c) 1986-2013 by Cisco Systems, Inc.\r\nCompiled Wed 26-Jun-13 10:58 by prod_rel_team", "uptime": "84574363", "hostname": "SW1", "model": "WS-C3560X-24", "version": "12.2(55)SE8", "interfaceCount": 36, "cpuUsage": "15%", "memoryUsage": "14%", "interfaces": [{"name": "Vlan100", "ip": "192.168.10.3", "status": "up", "protocol": "up"}, {"name": "Vlan200", "ip": "192.168.30.3", "status": "up", "protocol": "up"}, {"name": "Vlan300", "ip": "10.0.0.3", "status": "up", "protocol": "up"}, {"name": "Vlan400", "ip": "10.0.1.3", "status": "up", "protocol": "up"}]}');
INSERT INTO device_cache VALUES(7,'{"id": 7, "name": "SW2", "ip": "192.168.10.5", "vendor": "cisco", "username": "nlabs", "sysName": "SW2.capston.com", "sysDescr": "Cisco IOS Software, C3560E Software (C3560E-UNIVERSALK9-M), Version 12.2(55)SE8, RELEASE SOFTWARE (fc2)\r\nTechnical Support: http://www.cisco.com/techsupport\r\nCopyright (c) 1986-2013 by Cisco Systems, Inc.\r\nCompiled Wed 26-Jun-13 10:58 by prod_rel_team", "uptime": "84571752", "hostname": "SW2", "model": "WS-C3560X-24", "version": "12.2(55)SE8", "interfaceCount": 33, "cpuUsage": "7%", "memoryUsage": "13%", "interfaces": [{"name": "Vlan100", "ip": "192.168.10.5", "status": "up", "protocol": "up"}]}');
CREATE TABLE device_stats (
      id INTEGER PRIMARY KEY AUTO_INCREMENT,
      device_id INTEGER,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      cpu_usage TEXT,
      mem_usage TEXT
    );
INSERT INTO device_stats VALUES(1,1,'2025-05-08 05:21:02','1%','34%');
INSERT INTO device_stats VALUES(2,2,'2025-05-08 05:21:03','9%','35%');
INSERT INTO device_stats VALUES(3,3,'2025-05-08 05:21:04','0%','8%');
INSERT INTO device_stats VALUES(4,4,'2025-05-08 05:21:04','0%','8%');
INSERT INTO device_stats VALUES(5,5,'2025-05-08 05:21:05','1%','20%');
INSERT INTO device_stats VALUES(6,6,'2025-05-08 05:21:07','7%','14%');
INSERT INTO device_stats VALUES(7,7,'2025-05-08 05:21:08','7%','13%');
INSERT INTO device_stats VALUES(8,8,'2025-05-08 05:21:08','N/A','N/A');
INSERT INTO device_stats VALUES(9,9,'2025-05-08 05:21:08','N/A','N/A');
INSERT INTO device_stats VALUES(10,10,'2025-05-08 05:21:08','N/A','N/A');
INSERT INTO device_stats VALUES(11,11,'2025-05-08 05:21:08','N/A','N/A');
COMMIT;
