import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { VPSCard } from "@/components/vps/vps-card"
import { WebTerminal } from "@/components/terminal/web-terminal"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Server, Activity, HardDrive, Cpu } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface UserDashboardProps {
  userName: string
  onLogout: () => void
}

interface VPS {
  id: string
  name: string
  status: "running" | "stopped" | "pending"
  containerId: string
  resources: {
    cpu: string
    ram: string
    disk: string
  }
  ipAddress: string
  uptime?: string
}

export function UserDashboard({ userName, onLogout }: UserDashboardProps) {
  const [vps, setVps] = useState<VPS | null>(null)
  const [terminalOpen, setTerminalOpen] = useState(false)
  const [isDeploying, setIsDeploying] = useState(false)
  const { toast } = useToast()

  // Simulate fetching user's VPS
  useEffect(() => {
    const savedVps = localStorage.getItem(`vps_${userName}`)
    if (savedVps) {
      setVps(JSON.parse(savedVps))
    }
  }, [userName])

  const handleDeployVPS = async () => {
    setIsDeploying(true)
    
    const newVps: VPS = {
      id: `vps_${Date.now()}`,
      name: `${userName}-vps`,
      status: "pending",
      containerId: `container_${Math.random().toString(36).substr(2, 16)}`,
      resources: {
        cpu: "2 cores",
        ram: "2GB",
        disk: "20GB SSD"
      },
      ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`
    }

    setVps(newVps)
    localStorage.setItem(`vps_${userName}`, JSON.stringify(newVps))

    // Simulate deployment process
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    const runningVps = { ...newVps, status: "running" as const, uptime: "0h 0m" }
    setVps(runningVps)
    localStorage.setItem(`vps_${userName}`, JSON.stringify(runningVps))
    
    setIsDeploying(false)
    toast({
      title: "VPS Deployed Successfully",
      description: "Your VPS is now running and ready to use.",
    })
  }

  const handleVPSAction = async (action: string, id: string) => {
    if (!vps) return

    let newStatus: VPS["status"]
    let message = ""

    switch (action) {
      case "start":
        newStatus = "running"
        message = "VPS started successfully"
        break
      case "stop":
        newStatus = "stopped"
        message = "VPS stopped successfully"
        break
      case "restart":
        newStatus = "pending"
        message = "VPS is restarting..."
        break
      default:
        return
    }

    const updatedVps = { 
      ...vps, 
      status: newStatus,
      uptime: newStatus === "running" ? "0h 0m" : undefined
    }
    setVps(updatedVps)
    localStorage.setItem(`vps_${userName}`, JSON.stringify(updatedVps))

    if (action === "restart") {
      await new Promise(resolve => setTimeout(resolve, 2000))
      const restartedVps = { ...updatedVps, status: "running" as const, uptime: "0h 0m" }
      setVps(restartedVps)
      localStorage.setItem(`vps_${userName}`, JSON.stringify(restartedVps))
    }

    toast({
      title: "Action Completed",
      description: message,
    })
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
                  <p className="text-2xl font-bold">{vps ? 1 : 0}</p>
                  <p className="text-xs text-muted-foreground">VPS Deployed</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="flex items-center p-6">
                <Activity className="h-8 w-8 text-success mr-3" />
                <div>
                  <p className="text-2xl font-bold">{vps?.status === "running" ? 1 : 0}</p>
                  <p className="text-xs text-muted-foreground">Running</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center p-6">
                <Cpu className="h-8 w-8 text-accent mr-3" />
                <div>
                  <p className="text-2xl font-bold">{vps?.resources.cpu || "0"}</p>
                  <p className="text-xs text-muted-foreground">CPU Cores</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center p-6">
                <HardDrive className="h-8 w-8 text-warning mr-3" />
                <div>
                  <p className="text-2xl font-bold">{vps?.resources.ram || "0"}</p>
                  <p className="text-xs text-muted-foreground">Memory</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* VPS Management */}
          {!vps ? (
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
                  disabled={isDeploying}
                  size="lg"
                  className="bg-primary hover:bg-primary/90"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {isDeploying ? "Deploying..." : "Deploy VPS"}
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
                vps={vps}
                onStart={(id) => handleVPSAction("start", id)}
                onStop={(id) => handleVPSAction("stop", id)}
                onRestart={(id) => handleVPSAction("restart", id)}
                onConsole={() => setTerminalOpen(true)}
              />
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => setTerminalOpen(true)}
                    disabled={vps.status !== "running"}
                  >
                    <Server className="h-4 w-4 mr-2" />
                    Open Web Console
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    disabled={vps.status !== "running"}
                  >
                    <Activity className="h-4 w-4 mr-2" />
                    View Monitoring
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                  >
                    <HardDrive className="h-4 w-4 mr-2" />
                    Manage Storage
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </DashboardLayout>

      {vps && (
        <WebTerminal
          vpsId={vps.id}
          vpsName={vps.name}
          isOpen={terminalOpen}
          onClose={() => setTerminalOpen(false)}
        />
      )}
    </>
  )
}