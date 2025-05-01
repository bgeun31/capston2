"use client"

import { useState, useRef, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import {
  Play,
  Pause,
  Download,
  Filter,
  Search,
  Trash2,
  ChevronRight,
  ChevronDown,
  Settings,
  HelpCircle,
} from "lucide-react"

// 샘플 실시간 로그 데이터
const initialLogs = [
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

// 로그 파싱 함수
function parseLog(log) {
  const timestampMatch = log.match(/^(\d+\/\d+-\d+:\d+:\d+\.\d+)/)
  const ruleMatch = log.match(/(\[\d+:\d+:\d+\])/)
  const messageMatch = log.match(
    /([A-Z]+ [A-Za-z0-9 ]+attempt|[A-Z]+ Request|[A-Z]+ Query|ICMP Detected|SSH Login Attempt|Hello Packet|Hello $$state Standby$$)/,
  )
  const classificationMatch = log.match(/(\[Classification: [^\]]+\])/)
  const priorityMatch = log.match(/(\[Priority: \d+\])/)
  const protocolMatch = log.match(/(\{[A-Z0-9-]+\})/)
  const ipMatch = log.match(/(\d+\.\d+\.\d+\.\d+:\d+ -> \d+\.\d+\.\d+\.\d+:\d+|fe80::[a-f0-9:]+ -> ff02::16)/)

  const protocol = protocolMatch ? protocolMatch[0].replace(/[{}]/g, "") : "UNKNOWN"
  const priority = priorityMatch ? Number.parseInt(priorityMatch[0].match(/\d+/)[0]) : 0
  const timestamp = timestampMatch ? timestampMatch[0] : ""
  const source = ipMatch ? ipMatch[0].split(" -> ")[0] : ""
  const destination = ipMatch ? ipMatch[0].split(" -> ")[1] : ""
  const message = messageMatch ? messageMatch[0] : ""

  // 소스 및 대상 IP와 포트 분리
  const sourceIp = source ? source.split(":")[0] : ""
  const sourcePort = source ? source.split(":")[1] : ""
  const destinationIp = destination ? destination.split(":")[0] : ""
  const destinationPort = destination ? destination.split(":")[1] : ""

  return {
    timestamp,
    rule: ruleMatch ? ruleMatch[0] : "",
    message,
    classification: classificationMatch ? classificationMatch[0] : "",
    priority,
    protocol,
    source,
    destination,
    sourceIp,
    sourcePort,
    destinationIp,
    destinationPort,
    raw: log,
  }
}

// 프로토콜별 파스텔 색상 매핑
function getProtocolColor(protocol) {
  switch (protocol) {
    case "TCP":
      return "bg-green-100"
    case "UDP":
      return "bg-blue-100"
    case "IPv6-ICMP":
      return "bg-yellow-100"
    case "ICMP":
      return "bg-yellow-100"
    case "HTTP":
      return "bg-purple-100"
    case "DNS":
      return "bg-orange-100"
    case "SSH":
      return "bg-rose-100"
    case "TLSv1.2":
      return "bg-cyan-100"
    case "HSRP":
      return "bg-indigo-100"
    case "STP":
      return "bg-lime-100"
    default:
      return "bg-gray-100"
  }
}

// 우선순위별 테두리 색상 매핑
function getPriorityBorderColor(priority) {
  switch (priority) {
    case 0:
      return "border-green-300"
    case 1:
      return "border-red-300"
    case 2:
      return "border-orange-300"
    case 3:
      return "border-blue-300"
    default:
      return "border-gray-300"
  }
}

// 16진수 바이트 데이터 생성 (예시)
function generateHexData(length = 16) {
  const hexChars = "0123456789abcdef"
  let result = ""
  for (let i = 0; i < length; i++) {
    result += hexChars[Math.floor(Math.random() * 16)] + hexChars[Math.floor(Math.random() * 16)] + " "
  }
  return result.trim()
}

// 패킷 상세 정보 생성 (예시)
function generatePacketDetails(log) {
  const parsedLog = parseLog(log)

  return [
    {
      name: `Frame: 60 bytes on wire (480 bits), 60 bytes captured (480 bits)`,
      children: [
        { name: `Interface: eth0` },
        { name: `Interface name: eth0` },
        { name: `Encapsulation type: Ethernet (1)` },
        { name: `Arrival Time: ${parsedLog.timestamp}` },
        { name: `Frame Number: 1` },
        { name: `Frame Length: 60 bytes (480 bits)` },
        { name: `Capture Length: 60 bytes (480 bits)` },
        { name: `Frame is marked: False` },
        { name: `Frame is ignored: False` },
        { name: `Protocols in frame: eth:ip:${parsedLog.protocol.toLowerCase()}` },
      ],
    },
    {
      name: `Ethernet II, Src: VMware_c6:27:0b (00:0c:29:c6:27:0b), Dst: MicroStar_f7:5e:8c (00:d8:61:f7:5e:8c)`,
      children: [
        { name: `Destination: MicroStar_f7:5e:8c (00:d8:61:f7:5e:8c)` },
        { name: `Source: VMware_c6:27:0b (00:0c:29:c6:27:0b)` },
        { name: `Type: IPv4 (0x0800)` },
      ],
    },
    {
      name: `Internet Protocol Version 4, Src: ${parsedLog.sourceIp}, Dst: ${parsedLog.destinationIp}`,
      children: [
        { name: `Version: 4` },
        { name: `Header Length: 20 bytes (5)` },
        { name: `Differentiated Services Field: 0x00 (DSCP: CS0, ECN: Not-ECT)` },
        { name: `Total Length: 40` },
        { name: `Identification: 0x0000 (0)` },
        { name: `Flags: 0x02 (Don't Fragment)` },
        { name: `Fragment offset: 0` },
        { name: `Time to live: 128` },
        { name: `Protocol: ${parsedLog.protocol} (6)` },
        { name: `Header checksum: 0x0000 [validation disabled]` },
        { name: `Source: ${parsedLog.sourceIp}` },
        { name: `Destination: ${parsedLog.destinationIp}` },
      ],
    },
    {
      name: `${parsedLog.protocol} Protocol, Src Port: ${parsedLog.sourcePort || "?"}, Dst Port: ${parsedLog.destinationPort || "?"}`,
      children:
        parsedLog.protocol === "TCP"
          ? [
              { name: `Source Port: ${parsedLog.sourcePort || "?"}` },
              { name: `Destination Port: ${parsedLog.destinationPort || "?"}` },
              { name: `Sequence number: 1` },
              { name: `Acknowledgment number: 1` },
              { name: `Header Length: 20 bytes (5)` },
              { name: `Flags: 0x018 (PSH, ACK)` },
              { name: `Window size value: 501` },
              { name: `Checksum: 0x0000` },
              { name: `Urgent pointer: 0` },
            ]
          : parsedLog.protocol === "UDP"
            ? [
                { name: `Source Port: ${parsedLog.sourcePort || "?"}` },
                { name: `Destination Port: ${parsedLog.destinationPort || "?"}` },
                { name: `Length: 20` },
                { name: `Checksum: 0x0000` },
              ]
            : [{ name: `Protocol details not available` }],
    },
    {
      name: `Data (6 bytes)`,
      children: [{ name: `Data: ${generateHexData(6)}` }, { name: `[Length: 6]` }],
    },
  ]
}

// 패킷 트리 컴포넌트
function PacketTree({ data, level = 0 }) {
  const [expanded, setExpanded] = useState(level === 0)

  if (!data.children) {
    return (
      <div className="flex items-start pl-6 py-1 text-sm font-mono">
        <span>{data.name}</span>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center py-1 cursor-pointer hover:bg-gray-100" onClick={() => setExpanded(!expanded)}>
        {expanded ? (
          <ChevronDown size={16} className="mr-1 flex-shrink-0" />
        ) : (
          <ChevronRight size={16} className="mr-1 flex-shrink-0" />
        )}
        <span className="text-sm font-mono">{data.name}</span>
      </div>

      {expanded && (
        <div className="pl-4">
          {data.children.map((child, index) => (
            <PacketTree key={index} data={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function Home() {
  const [logs, setLogs] = useState(initialLogs)
  const [selectedLog, setSelectedLog] = useState(null)
  const [isCapturing, setIsCapturing] = useState(true)
  const [keepLogsOnResume, setKeepLogsOnResume] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterProtocol, setFilterProtocol] = useState("")
  const [activeTab, setActiveTab] = useState("packet-list")
  const captureIntervalRef = useRef(null)
  const scrollRef = useRef(null)

  // 새 로그 추가 함수
  const addNewLog = () => {
    // 실제 환경에서는 API 호출 등으로 새 로그를 가져옴
    // 여기서는 예시로 기존 로그 중 하나를 랜덤하게 선택하여 타임스탬프만 변경
    const randomIndex = Math.floor(Math.random() * initialLogs.length)
    const newLog = initialLogs[randomIndex].replace(
      /\d+\/\d+-\d+:\d+:\d+\.\d+/,
      `05/01-${String(new Date().getHours()).padStart(2, "0")}:${String(new Date().getMinutes()).padStart(2, "0")}:${String(new Date().getSeconds()).padStart(2, "0")}.${String(new Date().getMilliseconds()).padStart(3, "0")}`,
    )

    setLogs((prev) => [...prev, newLog])

    // 자동 스크롤 - DOM 요소에 직접 접근하여 스크롤
    if (scrollRef.current) {
      const scrollArea = scrollRef.current.querySelector("[data-radix-scroll-area-viewport]")
      if (scrollArea) {
        setTimeout(() => {
          scrollArea.scrollTop = scrollArea.scrollHeight
        }, 100)
      }
    }
  }

  // 캡처 시작/중지 함수
  const toggleCapture = () => {
    if (isCapturing) {
      // 캡처 중지
      if (captureIntervalRef.current) {
        clearInterval(captureIntervalRef.current)
        captureIntervalRef.current = null
      }
    } else {
      // 캡처 시작
      if (!keepLogsOnResume) {
        setLogs([])
      }
      captureIntervalRef.current = setInterval(addNewLog, 2000)
    }
    setIsCapturing(!isCapturing)
  }

  // 로그 다운로드 함수
  const downloadLogs = () => {
    const blob = new Blob([logs.join("\n")], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `snort_logs_${new Date().toISOString().replace(/[:.]/g, "-")}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // 로그 필터링
  const filteredLogs = logs.filter((log) => {
    const matchesSearch = searchTerm === "" || log.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesProtocol = filterProtocol === "" || log.includes(`{${filterProtocol}}`)
    return matchesSearch && matchesProtocol
  })

  // 컴포넌트 마운트 시 캡처 시작
  useEffect(() => {
    captureIntervalRef.current = setInterval(addNewLog, 2000)

    return () => {
      if (captureIntervalRef.current) {
        clearInterval(captureIntervalRef.current)
      }
    }
  }, [])

  // 파싱된 로그 목록
  const parsedLogs = filteredLogs.map((log) => parseLog(log))

  return (
    <div className="flex flex-col h-screen">
      {/* 상단 메뉴바 */}
      <div className="bg-gray-100 border-b p-1 flex items-center space-x-1">
        <div className="flex items-center space-x-1">
          <Button variant="ghost" size="icon" title="파일">
            <span className="text-xs">파일</span>
          </Button>
          <Button variant="ghost" size="icon" title="편집">
            <span className="text-xs">편집</span>
          </Button>
          <Button variant="ghost" size="icon" title="보기">
            <span className="text-xs">보기</span>
          </Button>
          <Button variant="ghost" size="icon" title="이동">
            <span className="text-xs">이동</span>
          </Button>
          <Button variant="ghost" size="icon" title="캡처">
            <span className="text-xs">캡처</span>
          </Button>
          <Button variant="ghost" size="icon" title="분석">
            <span className="text-xs">분석</span>
          </Button>
          <Button variant="ghost" size="icon" title="통계">
            <span className="text-xs">통계</span>
          </Button>
          <Button variant="ghost" size="icon" title="도움말">
            <span className="text-xs">도움말</span>
          </Button>
        </div>
      </div>

      {/* 툴바 */}
      <div className="bg-gray-100 border-b p-1 flex items-center space-x-1">
        <Button
          variant={isCapturing ? "destructive" : "default"}
          size="icon"
          onClick={toggleCapture}
          title={isCapturing ? "캡처 중지" : "캡처 시작"}
        >
          {isCapturing ? <Pause size={16} /> : <Play size={16} />}
        </Button>

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon" title="설정">
              <Settings size={16} />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>캡처 설정</DialogTitle>
            </DialogHeader>
            <div className="flex items-center space-x-2 py-4">
              <Switch id="keep-logs" checked={keepLogsOnResume} onCheckedChange={setKeepLogsOnResume} />
              <Label htmlFor="keep-logs">재시작 시 이전 로그 유지</Label>
            </div>
          </DialogContent>
        </Dialog>

        <Separator orientation="vertical" className="h-6" />

        <div className="flex items-center space-x-1">
          <Button variant="outline" size="icon" title="필터">
            <Filter size={16} />
          </Button>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input
              type="text"
              placeholder="검색..."
              className="pl-8 h-8 rounded-md border border-input bg-background px-3 py-1 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="h-8 rounded-md border border-input bg-background px-3 py-1 text-sm"
            value={filterProtocol}
            onChange={(e) => setFilterProtocol(e.target.value)}
          >
            <option value="">모든 프로토콜</option>
            <option value="TCP">TCP</option>
            <option value="UDP">UDP</option>
            <option value="IPv6-ICMP">IPv6-ICMP</option>
            <option value="ICMP">ICMP</option>
            <option value="HTTP">HTTP</option>
            <option value="DNS">DNS</option>
          </select>
        </div>

        <Separator orientation="vertical" className="h-6" />

        <Button variant="outline" size="icon" onClick={downloadLogs} title="로그 다운로드">
          <Download size={16} />
        </Button>

        <Button variant="outline" size="icon" onClick={() => setLogs([])} title="로그 지우기">
          <Trash2 size={16} />
        </Button>

        <Button variant="outline" size="icon" title="도움말">
          <HelpCircle size={16} />
        </Button>
      </div>

      {/* 메인 콘텐츠 영역 */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* 탭 메뉴 */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="bg-gray-100 border-b p-1 justify-start">
            <TabsTrigger value="packet-list" className="text-xs">
              패킷 목록
            </TabsTrigger>
            <TabsTrigger value="packet-details" className="text-xs">
              패킷 상세 분석
            </TabsTrigger>
          </TabsList>

          {/* 패킷 목록 탭 */}
          <TabsContent value="packet-list" className="flex-1 flex flex-col overflow-hidden p-0 m-0">
            {/* 패킷 목록 */}
            <div className="flex-1 overflow-hidden border-b">
              <ScrollArea ref={scrollRef} className="h-full">
                <Table>
                  <TableHeader className="bg-gray-100 sticky top-0">
                    <TableRow>
                      <TableHead className="w-[50px]">No.</TableHead>
                      <TableHead className="w-[150px]">Time</TableHead>
                      <TableHead className="w-[150px]">Source</TableHead>
                      <TableHead className="w-[150px]">Destination</TableHead>
                      <TableHead className="w-[100px]">Protocol</TableHead>
                      <TableHead className="w-[80px]">Priority</TableHead>
                      <TableHead>Info</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedLogs.map((log, index) => (
                      <TableRow
                        key={index}
                        className={cn(
                          "cursor-pointer",
                          selectedLog === index ? "bg-blue-100" : getProtocolColor(log.protocol),
                          index % 2 === 0 ? "" : "bg-opacity-70",
                        )}
                        onClick={() => setSelectedLog(index)}
                      >
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{log.timestamp}</TableCell>
                        <TableCell>{log.source}</TableCell>
                        <TableCell>{log.destination}</TableCell>
                        <TableCell>{log.protocol}</TableCell>
                        <TableCell>{log.priority}</TableCell>
                        <TableCell className="font-mono text-xs">{log.message}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>

            {/* 패킷 상세 정보 */}
            {selectedLog !== null && (
              <div className="h-1/3 overflow-hidden flex">
                {/* 패킷 상세 정보 트리 */}
                <div className="w-1/2 border-r overflow-auto">
                  <div className="p-2 bg-gray-50">
                    <h3 className="font-bold text-sm">패킷 상세 정보</h3>
                  </div>
                  <div className="p-2">
                    {generatePacketDetails(parsedLogs[selectedLog].raw).map((detail, index) => (
                      <div key={index} className="flex items-start mb-1">
                        <ChevronRight size={16} className="mt-1 mr-1 flex-shrink-0" />
                        <div className="text-sm">{detail.name}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 패킷 바이트 데이터 */}
                <div className="w-1/2 overflow-auto font-mono text-xs">
                  <div className="p-2 bg-gray-50">
                    <h3 className="font-bold text-sm">패킷 바이트 데이터</h3>
                  </div>
                  <div className="p-2">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div key={i} className="flex mb-1">
                        <span className="w-10 text-gray-500">{(i * 16).toString(16).padStart(4, "0")}</span>
                        <span className="flex-1">{generateHexData()}</span>
                        <span className="w-16 text-gray-500">{"........"}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          {/* 패킷 상세 분석 탭 */}
          <TabsContent value="packet-details" className="flex-1 flex flex-col overflow-hidden p-0 m-0">
            {selectedLog !== null ? (
              <div className="flex h-full">
                {/* 패킷 계층 구조 트리 */}
                <div className="w-1/2 border-r overflow-auto">
                  <div className="p-2 bg-gray-50 sticky top-0">
                    <h3 className="font-bold text-sm">패킷 계층 구조</h3>
                  </div>
                  <div className="p-2">
                    {generatePacketDetails(parsedLogs[selectedLog].raw).map((detail, index) => (
                      <PacketTree key={index} data={detail} />
                    ))}
                  </div>
                </div>

                {/* 패킷 바이트 데이터 */}
                <div className="w-1/2 overflow-auto">
                  <div className="p-2 bg-gray-50 sticky top-0">
                    <h3 className="font-bold text-sm">패킷 바이트 데이터</h3>
                  </div>
                  <div className="p-2 font-mono text-xs">
                    {Array.from({ length: 20 }).map((_, i) => (
                      <div key={i} className="flex mb-1">
                        <span className="w-10 text-gray-500">{(i * 16).toString(16).padStart(4, "0")}</span>
                        <span className="flex-1">{generateHexData()}</span>
                        <span className="w-16 text-gray-500">{"........"}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                패킷을 선택하면 상세 정보가 표시됩니다.
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* 상태 표시줄 */}
      <div className="bg-gray-100 border-t p-1 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-2">
          <span className={isCapturing ? "text-green-600 font-bold" : "text-gray-600"}>
            {isCapturing ? "캡처 중..." : "캡처 중지됨"}
          </span>
          <span>패킷: {logs.length}</span>
          <span>표시: {filteredLogs.length}</span>
          {selectedLog !== null && <span>선택: #{selectedLog + 1}</span>}
        </div>
        <div>
          <span>Snort 로그 모니터링 시스템</span>
        </div>
      </div>
    </div>
  )
}
