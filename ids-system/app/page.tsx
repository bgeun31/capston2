import { AlertsTable } from "@/components/alerts-table"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertTriangle, Filter } from "lucide-react"
import Link from "next/link"

export default function AlertsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 flex h-16 items-center gap-4 border-b bg-background px-6 dark:border-gray-800">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <AlertTriangle className="h-6 w-6 text-red-500" />
          <span>IDS 시스템</span>
        </Link>
        <nav className="hidden flex-1 items-center gap-6 md:flex">
          <Link
            href="/dashboard"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            대시보드
          </Link>
          <Link href="/" className="text-sm font-medium text-primary">
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
            <AlertTriangle className="h-4 w-4" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
              3
            </span>
          </Button>
        </div>
      </header>
      <main className="flex-1 space-y-4 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">알림 관리</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-8">
              <Filter className="mr-2 h-4 w-4" />
              필터
            </Button>
            <Button variant="default" size="sm" className="h-8">
              모두 해결됨으로 표시
            </Button>
          </div>
        </div>

        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">모든 알림</TabsTrigger>
            <TabsTrigger value="critical">심각</TabsTrigger>
            <TabsTrigger value="high">높음</TabsTrigger>
            <TabsTrigger value="medium">중간</TabsTrigger>
            <TabsTrigger value="low">낮음</TabsTrigger>
          </TabsList>
          <TabsContent value="all">
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
          <TabsContent value="critical">
            <Card>
              <CardHeader>
                <CardTitle>심각한 알림</CardTitle>
                <CardDescription>즉시 조치가 필요한 심각한 위협</CardDescription>
              </CardHeader>
              <CardContent>
                <AlertsTable showAll={true} />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="high">
            <Card>
              <CardHeader>
                <CardTitle>높은 수준의 알림</CardTitle>
                <CardDescription>주의가 필요한 높은 수준의 위협</CardDescription>
              </CardHeader>
              <CardContent>
                <AlertsTable showAll={true} />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="medium">
            <Card>
              <CardHeader>
                <CardTitle>중간 수준의 알림</CardTitle>
                <CardDescription>모니터링이 필요한 중간 수준의 위협</CardDescription>
              </CardHeader>
              <CardContent>
                <AlertsTable showAll={true} />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="low">
            <Card>
              <CardHeader>
                <CardTitle>낮은 수준의 알림</CardTitle>
                <CardDescription>낮은 우선순위의 알림</CardDescription>
              </CardHeader>
              <CardContent>
                <AlertsTable showAll={true} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
