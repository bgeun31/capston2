"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AlertTriangle, Eye, Filter, Search, Shield } from "lucide-react"

interface AlertsTableProps {
  showAll?: boolean
}

export function AlertsTable({ showAll = false }: AlertsTableProps) {
  const [searchTerm, setSearchTerm] = useState("")

  // 샘플 알림 데이터
  const alerts = [
    {
      id: "ALT-1234",
      timestamp: "2023-04-30 14:23:45",
      type: "침입 시도",
      source: "192.168.1.105",
      destination: "10.0.0.15",
      severity: "critical",
      status: "미해결",
    },
    {
      id: "ALT-1235",
      timestamp: "2023-04-30 14:10:22",
      type: "비정상 트래픽",
      source: "192.168.1.110",
      destination: "외부 IP",
      severity: "high",
      status: "조사 중",
    },
    {
      id: "ALT-1236",
      timestamp: "2023-04-30 13:55:17",
      type: "악성코드 탐지",
      source: "외부 IP",
      destination: "192.168.1.25",
      severity: "critical",
      status: "미해결",
    },
    {
      id: "ALT-1237",
      timestamp: "2023-04-30 13:42:08",
      type: "무단 접근",
      source: "192.168.1.115",
      destination: "10.0.0.5",
      severity: "medium",
      status: "해결됨",
    },
    {
      id: "ALT-1238",
      timestamp: "2023-04-30 13:30:55",
      type: "포트 스캔",
      source: "외부 IP",
      destination: "192.168.1.1",
      severity: "low",
      status: "해결됨",
    },
    {
      id: "ALT-1239",
      timestamp: "2023-04-30 13:15:33",
      type: "DDoS 공격",
      source: "다수의 IP",
      destination: "10.0.0.1",
      severity: "critical",
      status: "조사 중",
    },
    {
      id: "ALT-1240",
      timestamp: "2023-04-30 13:05:21",
      type: "비정상 로그인",
      source: "192.168.1.120",
      destination: "인증 서버",
      severity: "high",
      status: "미해결",
    },
  ]

  const displayAlerts = showAll ? alerts : alerts.slice(0, 5)

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "critical":
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            심각
          </Badge>
        )
      case "high":
        return (
          <Badge variant="destructive" className="bg-orange-500 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            높음
          </Badge>
        )
      case "medium":
        return (
          <Badge variant="outline" className="bg-yellow-500 text-yellow-950 flex items-center gap-1">
            <Shield className="h-3 w-3" />
            중간
          </Badge>
        )
      case "low":
        return (
          <Badge variant="outline" className="bg-blue-500 text-blue-950 flex items-center gap-1">
            <Shield className="h-3 w-3" />
            낮음
          </Badge>
        )
      default:
        return <Badge>{severity}</Badge>
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "미해결":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">
            미해결
          </Badge>
        )
      case "조사 중":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
            조사 중
          </Badge>
        )
      case "해결됨":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
            해결됨
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-4">
      {showAll && (
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="알림 검색..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      )}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">ID</TableHead>
              <TableHead>시간</TableHead>
              <TableHead>유형</TableHead>
              <TableHead>출발지</TableHead>
              <TableHead>목적지</TableHead>
              <TableHead>심각도</TableHead>
              <TableHead>상태</TableHead>
              <TableHead className="text-right">작업</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayAlerts.map((alert) => (
              <TableRow key={alert.id}>
                <TableCell className="font-medium">{alert.id}</TableCell>
                <TableCell>{alert.timestamp}</TableCell>
                <TableCell>{alert.type}</TableCell>
                <TableCell>{alert.source}</TableCell>
                <TableCell>{alert.destination}</TableCell>
                <TableCell>{getSeverityBadge(alert.severity)}</TableCell>
                <TableCell>{getStatusBadge(alert.status)}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon">
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
