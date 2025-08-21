import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { VPSCard } from "@/components/vps/vps-card"
import { WebTerminal } from "@/components/terminal/web-terminal"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Server, Activity, HardDrive, Cpu, Monitor, Settings } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useVPS, VPS } from "@/hooks/useVPS"
import { useAuth } from "@/hooks/useAuth"

interface UserDashboardProps {
  userName: string
  onLogout: () => void
}

export function UserDashboard({ userName, onLogout }: UserDashboardProps) {
  const [terminalOpen, setTerminalOpen] = useState(false)
  const [selectedVPS, setSelectedVPS] = useState<VPS | null>(null)
  const { toast } = useToast()
  const { userProfile } = useAuth()
  const { 
    vpsInstances, 
    loading, 
    deployVPS, 
    performVPSAction, 
    executeCommand,
    activityLogs 
  } = useVPS()

  // Get user's VPS (users can only have one)
  const userVPS = vpsInstances.find(vps => vps.user_id === userProfile?.id)

  const handleDeployVPS = async () => {
    if (!userProfile) return
    
    try {
      await deployVPS({
        name: `${userName}-vps`,
        docker_image: 'ubuntu:22.04',
        resources: {
          cpu: "2 cores",
          ram: "2GB", 
          disk: "20GB SSD"
        },
        ports: [22, 80, 443],
        environment_vars: {
          USER: userName,
          HOME: '/root'
        }
      })
    } catch (error) {
      console.error('Deployment failed:', error)
    }
  }

  const handleVPSAction = async (action: 'start' | 'stop' | 'restart', id: string) => {
    try {
      await performVPSAction(id, action)
    } catch (error) {
      console.error(`${action} action failed:`, error)
    }
  }

  const openTerminal = (vps: VPS) => {
    setSelectedVPS(vps)
    setTerminalOpen(true)
  }

  return (
    <>
      <DashboardLayout
        title="My VPS"
        userRole="user"
        userName={userName}
        onLogout={onLogout}
      >
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="flex items-center p-6">
                <Server className="h-8 w-8 text-primary mr-3" />
                <div>
                  <p className="text-2xl font-bold">{userVPS ? 1 : 0}</p>
                  <p className="text-xs text-muted-foreground">VPS Deployed</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="flex items-center p-6">
                <Activity className="h-8 w-8 text-success mr-3" />
                <div>
                  <p className="text-2xl font-bold">{userVPS?.status === "running" ? 1 : 0}</p>
                  <p className="text-xs text-muted-foreground">Running</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center p-6">
                <Cpu className="h-8 w-8 text-accent mr-3" />
                <div>
                  <p className="text-2xl font-bold">{userVPS?.resources.cpu || "0"}</p>
                  <p className="text-xs text-muted-foreground">CPU Cores</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center p-6">
                <HardDrive className="h-8 w-8 text-warning mr-3" />
                <div>
                  <p className="text-2xl font-bold">{userVPS?.resources.ram || "0"}</p>
                  <p className="text-xs text-muted-foreground">Memory</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* VPS Management */}
          {!userVPS ? (
            <Card className="text-center">
              <CardHeader>
                <CardTitle className="flex items-center justify-center space-x-2">
                  <Server className="h-6 w-6" />
                  <span>Deploy Your VPS</span>
                </CardTitle>
                <CardDescription>
                  You have 1 VPS slot available. Deploy your virtual private server to get started.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={handleDeployVPS}
                  disabled={loading}
                  size="lg"
                  className="bg-primary hover:bg-primary/90"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {loading ? "Deploying..." : "Deploy VPS"}
                </Button>
                
                <div className="mt-6 text-sm text-muted-foreground">
                  <p className="mb-2">Your VPS will include:</p>
                  <div className="flex justify-center space-x-4">
                    <Badge variant="secondary">2 CPU Cores</Badge>
                    <Badge variant="secondary">2GB RAM</Badge>
                    <Badge variant="secondary">20GB SSD</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <VPSCard
                vps={userVPS}
                onStart={(id) => handleVPSAction("start", id)}
                onStop={(id) => handleVPSAction("stop", id)}
                onRestart={(id) => handleVPSAction("restart", id)}
                onConsole={() => openTerminal(userVPS)}
              />
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => openTerminal(userVPS)}
                    disabled={userVPS.status !== "running"}
                  >
                    <Server className="h-4 w-4 mr-2" />
                    Open Web Console
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    disabled={userVPS.status !== "running"}
                  >
                    <Monitor className="h-4 w-4 mr-2" />
                    Resource Monitor
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    disabled={userVPS.status !== "running"}
                  >
                    <Activity className="h-4 w-4 mr-2" />
                    Activity Logs
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    VPS Settings
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Activity Logs */}
          {activityLogs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Activity</CardTitle>
                <CardDescription>Latest actions performed on your VPS</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {activityLogs.slice(0, 10).map((log) => (
                    <div key={log.id} className="flex items-center justify-between text-sm p-2 rounded border">
                      <span className="capitalize">{log.action}</span>
                      <Badge variant={log.status === 'success' ? 'default' : 'destructive'}>
                        {log.status}
                      </Badge>
                      <span className="text-muted-foreground">
                        {new Date(log.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DashboardLayout>

      {selectedVPS && (
        <WebTerminal
          vpsId={selectedVPS.id}
          vpsName={selectedVPS.name}
          isOpen={terminalOpen}
          onClose={() => {
            setTerminalOpen(false)
            setSelectedVPS(null)
          }}
          onExecuteCommand={executeCommand}
        />
      )}
    </>
  )
}