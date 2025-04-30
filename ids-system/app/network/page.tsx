import { NetworkChart } from "@/components/network-chart"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Globe, RefreshCcw, Wifi } from "lucide-react"

export default function NetworkPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 flex h-16 items-center gap-4 border-b bg-background px-6 dark:border-gray-800">
        <div className="flex items-center gap-2 font-semibold">
          <Globe className="h-6 w-6 text-blue-500" />
          <span>네트워크 모니터링</span>
        </div>
      </header>
      <main className="flex-1 space-y-4 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">네트워크 모니터링</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-8">
              <RefreshCcw className="mr-2 h-4 w-4" />
              새로고침
            </Button>
            <Button variant="default" size="sm" className="h-8">
              보고서 생성
            </Button>
          </div>
        </div>

        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">개요</TabsTrigger>
            <TabsTrigger value="traffic">트래픽 분석</TabsTrigger>
            <TabsTrigger value="devices">장치</TabsTrigger>
            <TabsTrigger value="topology">네트워크 토폴로지</TabsTrigger>
          </TabsList>
          <TabsContent value="overview">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">총 트래픽</CardTitle>
                  <Wifi className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">1.2 TB</div>
                  <p className="text-xs text-muted-foreground">지난 24시간 동안</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">활성 장치</CardTitle>
                  <Wifi className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">42</div>
                  <p className="text-xs text-muted-foreground">현재 연결됨</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">평균 대역폭</CardTitle>
                  <Wifi className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">850 Mbps</div>
                  <p className="text-xs text-muted-foreground">지난 1시간 동안</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">비정상 트래픽</CardTitle>
                  <Wifi className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">5.2%</div>
                  <p className="text-xs text-muted-foreground">총 트래픽 대비</p>
                </CardContent>
              </Card>
            </div>

            <Card className="mt-4">
              <CardHeader>
                <CardTitle>네트워크 활동</CardTitle>
                <CardDescription>실시간 네트워크 트래픽 모니터링</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <NetworkChart fullSize={true} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="traffic">
            <Card>
              <CardHeader>
                <CardTitle>트래픽 분석</CardTitle>
                <CardDescription>네트워크 트래픽 상세 분석</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[500px]">
                  <NetworkChart fullSize={true} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="devices">
            <Card>
              <CardHeader>
                <CardTitle>네트워크 장치</CardTitle>
                <CardDescription>연결된 모든 장치 목록</CardDescription>
              </CardHeader>
              <CardContent>
                <p>장치 목록 컴포넌트가 여기에 표시됩니다.</p>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="topology">
            <Card>
              <CardHeader>
                <CardTitle>네트워크 토폴로지</CardTitle>
                <CardDescription>네트워크 구조 시각화</CardDescription>
              </CardHeader>
              <CardContent>
                <p>네트워크 토폴로지 시각화가 여기에 표시됩니다.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
