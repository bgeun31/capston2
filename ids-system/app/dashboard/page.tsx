import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertTriangle, BarChart3, Bell, Clock, HardDrive, Settings, Shield, Wifi } from "lucide-react"
import { NetworkChart } from "@/components/network-chart"
import { AlertsTable } from "@/components/alerts-table"
import { SystemStatus } from "@/components/system-status"
import { RecentEvents } from "@/components/recent-events"

export default function Dashboard() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 flex h-16 items-center gap-4 border-b bg-background px-6 dark:border-gray-800">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Shield className="h-6 w-6 text-red-500" />
          <span>IDS 시스템</span>
        </Link>
        <nav className="hidden flex-1 items-center gap-6 md:flex">
          <Link href="/dashboard" className="text-sm font-medium text-primary">
            대시보드
          </Link>
          <Link href="/" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
            알림
          </Link>
          <Link
            href="/network"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            네트워크
          </Link>
          <Link href="/logs" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
            로그
          </Link>
          <Link
            href="/settings"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            설정
          </Link>
        </nav>
        <div className="flex items-center gap-4 md:ml-auto">
          <Button variant="outline" size="icon" className="relative">
            <Bell className="h-4 w-4" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
              3
            </span>
          </Button>
          <Button variant="outline" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </header>
      <main className="flex-1 space-y-4 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">보안 대시보드</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-8">
              <Clock className="mr-2 h-4 w-4" />
              실시간
            </Button>
            <Button variant="outline" size="sm" className="h-8">
              <BarChart3 className="mr-2 h-4 w-4" />
              리포트
            </Button>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-red-200 dark:border-red-900">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">심각한 위협</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">7</div>
              <p className="text-xs text-muted-foreground">지난 24시간 동안 3건 증가</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">의심스러운 활동</CardTitle>
              <Shield className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24</div>
              <p className="text-xs text-muted-foreground">지난 24시간 동안 12건 증가</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">모니터링 시스템</CardTitle>
              <HardDrive className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">42</div>
              <p className="text-xs text-muted-foreground">모든 시스템 정상 작동 중</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">네트워크 트래픽</CardTitle>
              <Wifi className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1.2 GB/s</div>
              <p className="text-xs text-muted-foreground">평균 대비 5% 증가</p>
            </CardContent>
          </Card>
        </div>
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">개요</TabsTrigger>
            <TabsTrigger value="alerts">알림</TabsTrigger>
            <TabsTrigger value="network">네트워크</TabsTrigger>
            <TabsTrigger value="systems">시스템</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <Card className="lg:col-span-4">
                <CardHeader>
                  <CardTitle>네트워크 활동</CardTitle>
                  <CardDescription>실시간 네트워크 트래픽 모니터링</CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                  <NetworkChart />
                </CardContent>
              </Card>
              <Card className="lg:col-span-3">
                <CardHeader>
                  <CardTitle>최근 이벤트</CardTitle>
                  <CardDescription>최근 보안 이벤트 및 알림</CardDescription>
                </CardHeader>
                <CardContent>
                  <RecentEvents />
                </CardContent>
              </Card>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <Card className="lg:col-span-4">
                <CardHeader>
                  <CardTitle>알림 목록</CardTitle>
                  <CardDescription>최근 탐지된 위협 및 알림</CardDescription>
                </CardHeader>
                <CardContent>
                  <AlertsTable />
                </CardContent>
              </Card>
              <Card className="lg:col-span-3">
                <CardHeader>
                  <CardTitle>시스템 상태</CardTitle>
                  <CardDescription>모니터링 중인 시스템 상태</CardDescription>
                </CardHeader>
                <CardContent>
                  <SystemStatus />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="alerts">
            <Card>
              <CardHeader>
                <CardTitle>모든 알림</CardTitle>
                <CardDescription>시스템에서 탐지된 모든 알림 및 위협</CardDescription>
              </CardHeader>
              <CardContent>
                <AlertsTable showAll={true} />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="network">
            <Card>
              <CardHeader>
                <CardTitle>네트워크 모니터링</CardTitle>
                <CardDescription>네트워크 트래픽 및 활동 분석</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <NetworkChart fullSize={true} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="systems">
            <Card>
              <CardHeader>
                <CardTitle>시스템 모니터링</CardTitle>
                <CardDescription>모든 시스템 및 장치 상태</CardDescription>
              </CardHeader>
              <CardContent>
                <SystemStatus showAll={true} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
