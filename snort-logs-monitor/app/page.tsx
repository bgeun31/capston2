"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"

// 샘플 실시간 로그 데이터를 더 다양한 형태로 수정
const sampleLogs = [
  "05/01-21:43:50.301816 [**] [1:1917:6] SCAN UPnP service discover attempt [**] [Classification: Detection of a Network Scan] [Priority: 3] {UDP} 192.168.20.7:53985 -> 239.255.255.250:1900",
  "05/01-21:43:47.348225 [**] [1:1917:6] SCAN UPnP service discover attempt [**] [Classification: Detection of a Network Scan] [Priority: 3] {UDP} 192.168.20.7:53985 -> 239.255.255.250:1900",
  "05/01-21:43:44.335634 [**] [1:1917:6] SCAN UPnP service discover attempt [**] [Classification: Detection of a Network Scan] [Priority: 3] {UDP} 192.168.20.7:53985 -> 239.255.255.250:1900",
  "05/01-21:42:59.313796 [**] [1:1917:6] SCAN UPnP service discover attempt [**] [Classification: Detection of a Network Scan] [Priority: 3] {UDP} 192.168.20.7:53985 -> 239.255.255.250:1900",
  "05/01-21:42:56.300040 [**] [1:1917:6] SCAN UPnP service discover attempt [**] [Classification: Detection of a Network Scan] [Priority: 3] {UDP} 192.168.20.7:53985 -> 239.255.255.250:1900",
  "05/01-21:42:53.294377 [**] [1:1917:6] SCAN UPnP service discover attempt [**] [Classification: Detection of a Network Scan] [Priority: 3] {UDP} 192.168.20.7:53985 -> 239.255.255.250:1900",
  "05/01-21:42:50.257359 [**] [1:1917:6] SCAN UPnP service discover attempt [**] [Classification: Detection of a Network Scan] [Priority: 3] {UDP} 192.168.20.7:53985 -> 239.255.255.250:1900",
  "05/01-21:42:47.243685 [**] [1:1917:6] SCAN UPnP service discover attempt [**] [Classification: Detection of a Network Scan] [Priority: 3] {UDP} 192.168.20.7:53985 -> 239.255.255.250:1900",
  "05/01-21:42:44.240324 [**] [1:1917:6] SCAN UPnP service discover attempt [**] [Classification: Detection of a Network Scan] [Priority: 3] {UDP} 192.168.20.7:53985 -> 239.255.255.250:1900",
  "05/01-21:42:44.229877 [**] [1:1000001:1] [LOCAL] ICMP Detected [**] [Priority: 0] {IPv6-ICMP} fe80::b4b9:4a54:a1c9:b37f -> ff02::16",
  "05/01-21:42:44.200415 [**] [1:1000001:1] [LOCAL] ICMP Detected [**] [Priority: 0] {IPv6-ICMP} fe80::b4b9:4a54:a1c9:b37f -> ff02::16",
  "05/01-21:42:44.192288 [**] [1:1000001:1] [LOCAL] ICMP Detected [**] [Priority: 0] {IPv6-ICMP} fe80::b4b9:4a54:a1c9:b37f -> ff02::16",
  "05/01-21:42:44.119788 [**] [1:1000001:1] [LOCAL] ICMP Detected [**] [Priority: 0] {IPv6-ICMP} fe80::b4b9:4a54:a1c9:b37f -> ff02::16",
  "05/01-21:42:44.118334 [**] [1:1000001:1] [LOCAL] ICMP Detected [**] [Priority: 0] {IPv6-ICMP} fe80::b4b9:4a54:a1c9:b37f -> ff02::16",
  "05/01-21:42:43.123456 [**] [1:2000123:2] [LOCAL] SSH Login Attempt [**] [Classification: Potential Corporate Privacy Violation] [Priority: 1] {TCP} 192.168.20.15:58796 -> 192.168.20.1:22",
  "05/01-21:42:42.987654 [**] [1:2500001:1] [LOCAL] HTTP Request [**] [Classification: Web Application Attack] [Priority: 2] {TCP} 192.168.20.25:60123 -> 104.18.20.45:80",
  "05/01-21:42:41.654321 [**] [1:3000234:1] [LOCAL] DNS Query [**] [Classification: Potentially Bad Traffic] [Priority: 2] {UDP} 192.168.20.5:53214 -> 8.8.8.8:53",
]

// 샘플 테이블 로그 데이터
const sampleTableLogs = [
  {
    no: 1,
    time: "0.347943",
    source: "192.168.20.7",
    destination: "104.18.18.125",
    protocol: "TCP",
    length: 54,
    info: "24249 → 443 [FIN, ACK] Seq=1 Ack=1 Win=511 Len=0",
  },
  {
    no: 2,
    time: "0.347943",
    source: "192.168.20.7",
    destination: "104.18.18.125",
    protocol: "TCP",
    length: 54,
    info: "24249 → 443 [FIN, ACK] Seq=1 Ack=1 Win=511 Len=0",
  },
  {
    no: 3,
    time: "0.347961",
    source: "192.168.20.7",
    destination: "104.18.18.125",
    protocol: "TCP",
    length: 54,
    info: "[TCP Retransmission] 24249 → 443 [FIN, ACK] Seq=1 Ack=1 Win=511 Len=0",
  },
  {
    no: 4,
    time: "0.358251",
    source: "104.18.18.125",
    destination: "192.168.20.7",
    protocol: "TCP",
    length: 60,
    info: "443 → 24249 [FIN, ACK] Seq=1 Ack=2 Win=10 Len=0",
  },
  {
    no: 5,
    time: "0.358291",
    source: "192.168.20.7",
    destination: "104.18.18.125",
    protocol: "TCP",
    length: 54,
    info: "24249 → 443 [ACK] Seq=2 Ack=2 Win=511 Len=0",
  },
  {
    no: 6,
    time: "0.358296",
    source: "192.168.20.7",
    destination: "104.18.18.125",
    protocol: "TCP",
    length: 54,
    info: "[TCP Dup ACK 5#1] 24249 → 443 [ACK] Seq=2 Ack=2 Win=511 Len=0",
  },
  {
    no: 7,
    time: "0.717819",
    source: "192.168.20.7",
    destination: "104.18.18.125",
    protocol: "TLSv1.2",
    length: 143,
    info: "Application Data",
  },
  {
    no: 8,
    time: "0.717829",
    source: "192.168.20.7",
    destination: "104.18.18.125",
    protocol: "TCP",
    length: 483,
    info: "[TCP Retransmission] 19667 → 443 [PSH, ACK] Seq=1 Ack=1 Win=510 Len=429",
  },
  {
    no: 9,
    time: "0.717987",
    source: "192.168.20.7",
    destination: "104.18.18.125",
    protocol: "TLSv1.2",
    length: 85,
    info: "Application Data",
  },
  {
    no: 10,
    time: "0.717993",
    source: "192.168.20.7",
    destination: "104.18.18.125",
    protocol: "TCP",
    length: 85,
    info: "[TCP Retransmission] 19667 → 443 [PSH, ACK] Seq=430 Ack=1 Win=510 Len=31",
  },
  {
    no: 11,
    time: "0.725921",
    source: "104.18.18.125",
    destination: "192.168.20.7",
    protocol: "TCP",
    length: 60,
    info: "443 → 19667 [ACK] Seq=1 Ack=461 Win=196 Len=0",
  },
  {
    no: 12,
    time: "0.756974",
    source: "192.168.20.3",
    destination: "239.255.255.250",
    protocol: "SSDP",
    length: 179,
    info: "M-SEARCH * HTTP/1.1",
  },
  {
    no: 13,
    time: "0.960335",
    source: "104.18.18.125",
    destination: "192.168.20.7",
    protocol: "TLSv1.2",
    length: 135,
    info: "Application Data",
  },
  {
    no: 14,
    time: "0.995706",
    source: "192.168.20.2",
    destination: "224.0.0.5",
    protocol: "OSPF",
    length: 94,
    info: "Hello Packet",
  },
  {
    no: 15,
    time: "1.009307",
    source: "192.168.20.7",
    destination: "104.18.18.125",
    protocol: "TCP",
    length: 54,
    info: "19667 → 443 [ACK] Seq=461 Ack=82 Win=510 Len=0",
  },
  {
    no: 16,
    time: "1.009314",
    source: "192.168.20.7",
    destination: "104.18.18.125",
    protocol: "TCP",
    length: 54,
    info: "[TCP Dup ACK 15#1] 19667 → 443 [ACK] Seq=461 Ack=82 Win=510 Len=0",
  },
  {
    no: 17,
    time: "1.104152",
    source: "192.168.20.1",
    destination: "224.0.0.2",
    protocol: "HSRP",
    length: 62,
    info: "Hello (state Standby)",
  },
]

// 패킷 상세 정보 샘플 데이터
const packetDetails = [
  "Frame 1: 60 bytes on wire (480 bits), 60 bytes captured (480 bits) on interface \\Device",
  "IEEE 802.3 Ethernet",
  "Logical-link Control",
  "Spanning Tree Protocol",
]

// 파스텔 톤 로그 색상 매핑 함수
function getLogColors(log, index) {
  // 기본 색상 설정 (파스텔 톤)
  let bgColor = "bg-gray-100"
  let textColor = "text-gray-800"
  let borderColor = "border-gray-300"

  // 프로토콜에 따른 파스텔 색상 설정
  if (log.includes("{UDP}")) {
    if (log.includes("UPnP")) {
      bgColor = "bg-blue-100"
      borderColor = "border-blue-200"
    } else if (log.includes("DNS")) {
      bgColor = "bg-orange-100"
      borderColor = "border-orange-200"
    } else {
      bgColor = "bg-cyan-100"
      borderColor = "border-cyan-200"
    }
  } else if (log.includes("{TCP}")) {
    if (log.includes("SSH")) {
      bgColor = "bg-rose-100"
      borderColor = "border-rose-200"
    } else if (log.includes("HTTP")) {
      bgColor = "bg-purple-100"
      borderColor = "border-purple-200"
    } else {
      bgColor = "bg-green-100"
      borderColor = "border-green-200"
    }
  } else if (log.includes("{IPv6-ICMP}")) {
    bgColor = "bg-yellow-100"
    borderColor = "border-yellow-200"
  }

  // 우선순위에 따른 추가 스타일링 (파스텔 톤)
  if (log.includes("[Priority: 3]")) {
    borderColor = "border-blue-300"
  } else if (log.includes("[Priority: 2]")) {
    borderColor = "border-orange-300"
  } else if (log.includes("[Priority: 1]")) {
    borderColor = "border-rose-300"
    textColor = "text-rose-800"
  } else if (log.includes("[Priority: 0]")) {
    borderColor = "border-green-300"
  }

  // 짝수/홀수 행에 따른 명암 조절
  const rowShade = index % 2 === 0 ? "" : "opacity-90"

  return { bgColor, textColor, borderColor, rowShade }
}

// 테이블 행 파스텔 색상 매핑 함수
function getTableRowColors(protocol) {
  switch (protocol) {
    case "TCP":
      return "bg-green-100"
    case "TLSv1.2":
      return "bg-blue-100"
    case "SSDP":
      return "bg-yellow-100"
    case "OSPF":
      return "bg-orange-100"
    case "HSRP":
      return "bg-purple-100"
    default:
      return "bg-gray-50"
  }
}

export default function Home() {
  const [activeTab, setActiveTab] = useState("live")
  const [selectedPacket, setSelectedPacket] = useState<number | null>(null)

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">실시간 Snort 로그</h1>

      <Tabs defaultValue="live" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="live">실시간 로그</TabsTrigger>
          <TabsTrigger value="table">로그 목록</TabsTrigger>
        </TabsList>

        <TabsContent value="live" className="border rounded-md">
          <ScrollArea className="h-[500px] w-full bg-white font-mono text-sm p-4">
            {sampleLogs.map((log, index) => {
              const { bgColor, textColor, borderColor, rowShade } = getLogColors(log, index)

              return (
                <div
                  key={index}
                  className={`whitespace-pre-wrap mb-1 p-2 rounded ${bgColor} ${textColor} ${rowShade} border-l-4 ${borderColor} shadow-sm`}
                >
                  {log}
                </div>
              )
            })}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="table">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-3">
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader className="bg-gray-200 text-gray-700">
                    <TableRow>
                      <TableHead className="w-[50px]">No.</TableHead>
                      <TableHead className="w-[100px]">Time</TableHead>
                      <TableHead className="w-[150px]">Source</TableHead>
                      <TableHead className="w-[150px]">Destination</TableHead>
                      <TableHead className="w-[100px]">Protocol</TableHead>
                      <TableHead className="w-[80px]">Length</TableHead>
                      <TableHead>Info</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sampleTableLogs.map((log) => (
                      <TableRow
                        key={log.no}
                        className={cn(
                          "cursor-pointer hover:bg-gray-100",
                          selectedPacket === log.no ? "bg-blue-100" : "",
                          getTableRowColors(log.protocol),
                        )}
                        onClick={() => setSelectedPacket(log.no)}
                      >
                        <TableCell className="font-medium">{log.no}</TableCell>
                        <TableCell>{log.time}</TableCell>
                        <TableCell>{log.source}</TableCell>
                        <TableCell>{log.destination}</TableCell>
                        <TableCell className="font-medium">{log.protocol}</TableCell>
                        <TableCell>{log.length}</TableCell>
                        <TableCell className="font-mono text-xs">{log.info}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {selectedPacket && (
              <div className="md:col-span-3">
                <div className="border rounded-md p-4 bg-gray-50 shadow-sm">
                  <h3 className="font-bold mb-2">패킷 상세 정보</h3>
                  <div className="font-mono text-sm">
                    {packetDetails.map((detail, index) => (
                      <div key={index} className="mb-1 p-1 bg-white rounded">
                        {detail}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
