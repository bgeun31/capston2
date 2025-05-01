"use client"

import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Database, Globe, HardDrive, Layers, Lock, Server, Shield, Wifi, XCircle } from "lucide-react"

interface SystemStatusProps {
  showAll?: boolean
}

export function SystemStatus({ showAll = false }: SystemStatusProps) {
  // 샘플 시스템 데이터
  const systems = [
    {
      id: "SYS-001",
      name: "방화벽",
      type: "보안",
      status: "정상",
      load: 42,
      icon: Shield,
    },
    {
      id: "SYS-002",
      name: "데이터베이스 서버",
      type: "서버",
      status: "정상",
      load: 68,
      icon: Database,
    },
    {
      id: "SYS-003",
      name: "웹 서버",
      type: "서버",
      status: "정상",
      load: 75,
      icon: Globe,
    },
    {
      id: "SYS-004",
      name: "네트워크 스위치",
      type: "네트워크",
      status: "정상",
      load: 35,
      icon: Wifi,
    },
    {
      id: "SYS-005",
      name: "백업 시스템",
      type: "스토리지",
      status: "정상",
      load: 22,
      icon: HardDrive,
    },
    {
      id: "SYS-006",
      name: "인증 서버",
      type: "보안",
      status: "경고",
      load: 88,
      icon: Lock,
    },
    {
      id: "SYS-007",
      name: "로그 서버",
      type: "모니터링",
      status: "정상",
      load: 45,
      icon: Layers,
    },
    {
      id: "SYS-008",
      name: "애플리케이션 서버",
      type: "서버",
      status: "오류",
      load: 95,
      icon: Server,
    },
  ]

  const displaySystems = showAll ? systems : systems.slice(0, 5)

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "정상":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case "경고":
        return <CheckCircle2 className="h-4 w-4 text-yellow-500" />
      case "오류":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return null
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "정상":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
            정상
          </Badge>
        )
      case "경고":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
            경고
          </Badge>
        )
      case "오류":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">
            오류
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getLoadColor = (load: number) => {
    if (load < 50) return "bg-green-500"
    if (load < 80) return "bg-yellow-500"
    return "bg-red-500"
  }

  return (
    <div className="space-y-4">
      {displaySystems.map((system) => {
        const Icon = system.icon
        return (
          <div key={system.id} className="flex items-center gap-4 p-2 rounded-lg border">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium leading-none">{system.name}</p>
                {getStatusIcon(system.status)}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {system.type}
                </Badge>
                {getStatusBadge(system.status)}
              </div>
            </div>
            <div className="w-[100px]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs">부하</span>
                <span className="text-xs font-medium">{system.load}%</span>
              </div>
              <Progress value={system.load} className={getLoadColor(system.load)} />
            </div>
          </div>
        )
      })}
    </div>
  )
}
