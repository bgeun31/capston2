import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Settings } from "lucide-react"

export default function SettingsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 flex h-16 items-center gap-4 border-b bg-background px-6 dark:border-gray-800">
        <div className="flex items-center gap-2 font-semibold">
          <Settings className="h-6 w-6 text-gray-500" />
          <span>시스템 설정</span>
        </div>
      </header>
      <main className="flex-1 space-y-4 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">시스템 설정</h1>
          <Button variant="default" size="sm" className="h-8">
            변경사항 저장
          </Button>
        </div>

        <Tabs defaultValue="general">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="general">일반</TabsTrigger>
            <TabsTrigger value="security">보안</TabsTrigger>
            <TabsTrigger value="notifications">알림</TabsTrigger>
            <TabsTrigger value="database">데이터베이스</TabsTrigger>
            <TabsTrigger value="users">사용자</TabsTrigger>
          </TabsList>
          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>일반 설정</CardTitle>
                <CardDescription>시스템의 기본 설정을 관리합니다.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="system-name">시스템 이름</Label>
                  <Input id="system-name" defaultValue="IDS 시스템" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="log-retention">로그 보존 기간 (일)</Label>
                  <Input id="log-retention" type="number" defaultValue="90" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="dark-mode">다크 모드</Label>
                    <p className="text-sm text-muted-foreground">시스템 테마를 어둡게 설정합니다.</p>
                  </div>
                  <Switch id="dark-mode" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="auto-update">자동 업데이트</Label>
                    <p className="text-sm text-muted-foreground">시스템 업데이트를 자동으로 설치합니다.</p>
                  </div>
                  <Switch id="auto-update" defaultChecked />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>보안 설정</CardTitle>
                <CardDescription>시스템 보안 설정을 관리합니다.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="two-factor">2단계 인증</Label>
                    <p className="text-sm text-muted-foreground">모든 사용자에게 2단계 인증을 요구합니다.</p>
                  </div>
                  <Switch id="two-factor" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="ip-blocking">자동 IP 차단</Label>
                    <p className="text-sm text-muted-foreground">의심스러운 IP를 자동으로 차단합니다.</p>
                  </div>
                  <Switch id="ip-blocking" defaultChecked />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-policy">비밀번호 정책</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="min-length" className="text-sm">
                        최소 길이
                      </Label>
                      <Input id="min-length" type="number" defaultValue="12" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="expiry-days" className="text-sm">
                        만료 기간 (일)
                      </Label>
                      <Input id="expiry-days" type="number" defaultValue="90" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>알림 설정</CardTitle>
                <CardDescription>알림 및 경고 설정을 관리합니다.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email-alerts">이메일 알림</Label>
                    <p className="text-sm text-muted-foreground">중요한 알림을 이메일로 전송합니다.</p>
                  </div>
                  <Switch id="email-alerts" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="sms-alerts">SMS 알림</Label>
                    <p className="text-sm text-muted-foreground">심각한 알림을 SMS로 전송합니다.</p>
                  </div>
                  <Switch id="sms-alerts" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="alert-threshold">알림 임계값</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="critical-threshold" className="text-sm">
                        심각 임계값
                      </Label>
                      <Input id="critical-threshold" type="number" defaultValue="90" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="warning-threshold" className="text-sm">
                        경고 임계값
                      </Label>
                      <Input id="warning-threshold" type="number" defaultValue="70" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="database">
            <Card>
              <CardHeader>
                <CardTitle>데이터베이스 설정</CardTitle>
                <CardDescription>데이터베이스 연결 및 설정을 관리합니다.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="db-host">데이터베이스 호스트</Label>
                  <Input id="db-host" defaultValue="localhost" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="db-port">데이터베이스 포트</Label>
                  <Input id="db-port" defaultValue="5432" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="db-name">데이터베이스 이름</Label>
                  <Input id="db-name" defaultValue="ids_system" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="backup-schedule">백업 일정</Label>
                  <Input id="backup-schedule" defaultValue="0 0 * * *" placeholder="Cron 표현식" />
                  <p className="text-xs text-muted-foreground">매일 자정에 백업 (Cron: 0 0 * * *)</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>사용자 관리</CardTitle>
                <CardDescription>시스템 사용자 및 권한을 관리합니다.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="user-registration">사용자 등록 허용</Label>
                    <p className="text-sm text-muted-foreground">새 사용자 등록을 허용합니다.</p>
                  </div>
                  <Switch id="user-registration" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="admin-approval">관리자 승인 필요</Label>
                    <p className="text-sm text-muted-foreground">새 계정에 관리자 승인이 필요합니다.</p>
                  </div>
                  <Switch id="admin-approval" defaultChecked />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="session-timeout">세션 타임아웃 (분)</Label>
                  <Input id="session-timeout" type="number" defaultValue="30" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
