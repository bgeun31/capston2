"use client"

import { Badge } from "@/components/ui/badge"
import { AlertTriangle, ArrowUpRight, Clock, FileWarning, Lock, Shield, UserX } from "lucide-react"

export function RecentEvents() {
  // 샘플 이벤트 데이터
  const events = [
    {
      id: "EVT-001",
      time: "14:23:45",
      message: "침입 시도가 방화벽에 의해 차단되었습니다",
      type: "security",
      icon: Shield,
    },
    {
      id: "EVT-002",
      time: "14:10:22",
      message: "비정상적인 아웃바운드 트래픽이 감지되었습니다",
      type: "traffic",
      icon: ArrowUpRight,
    },
    {
      id: "EVT-003",
      time: "13:55:17",
      message: "악성코드가 포함된 파일이 탐지되었습니다",
      type: "malware",
      icon: FileWarning,
    },
    {
      id: "EVT-004",
      time: "13:42:08",
      message: "관리자 계정에 대한 무단 접근 시도",
      type: "access",
      icon: UserX,
    },
    {
      id: "EVT-005",
      time: "13:30:55",
      message: "외부 IP에서 포트 스캔 시도",
      type: "scan",
      icon: AlertTriangle,
    },
    {
      id: "EVT-006",
      time: "13:15:33",
      message: "DDoS 공격 징후가 감지되었습니다",
      type: "attack",
      icon: AlertTriangle,
    },
    {
      id: "EVT-007",
      time: "13:05:21",
      message: "비정상적인 로그인 위치에서 접속 시도",
      type: "login",
      icon: Lock,
    },
  ]

  const getEventBadge = (type: string) => {
    switch (type) {
      case "security":
        return <Badge className="bg-red-500">보안</Badge>
      case "traffic":
        return <Badge className="bg-blue-500">트래픽</Badge>
      case "malware":
        return <Badge className="bg-purple-500">악성코드</Badge>
      case "access":
        return <Badge className="bg-orange-500">접근</Badge>
      case "scan":
        return <Badge className="bg-yellow-500">스캔</Badge>
      case "attack":
        return <Badge className="bg-red-500">공격</Badge>
      case "login":
        return <Badge className="bg-green-500">로그인</Badge>
      default:
        return <Badge>{type}</Badge>
    }
  }

  return (
    <div className="space-y-4">
      {events.slice(0, 5).map((event) => {
        const Icon = event.icon
        return (
          <div key={event.id} className="flex items-start gap-4 p-2 rounded-lg border">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
              <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">{event.message}</p>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex items-center text-xs text-muted-foreground">
                  <Clock className="mr-1 h-3 w-3" />
                  {event.time}
                </div>
                {getEventBadge(event.type)}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
