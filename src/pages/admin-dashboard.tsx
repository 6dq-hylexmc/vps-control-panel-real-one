import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { VPSCard } from "@/components/vps/vps-card"
import { WebTerminal } from "@/components/terminal/web-terminal"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { StatusBadge } from "@/components/ui/status-badge"
import { Plus, Users, Server, Activity, Trash2, Eye } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface AdminDashboardProps {
  userName: string
  onLogout: () => void
}

interface User {
  id: string
  username: string
  createdAt: string
  hasVPS: boolean
  vpsStatus?: "running" | "stopped" | "pending"
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
  owner: string
  uptime?: string
}

export function AdminDashboard({ userName, onLogout }: AdminDashboardProps) {
  const [users, setUsers] = useState<User[]>([])
  const [allVPS, setAllVPS] = useState<VPS[]>([])
  const [terminalOpen, setTerminalOpen] = useState(false)
  const [selectedVPS, setSelectedVPS] = useState<VPS | null>(null)
  const [newUserDialog, setNewUserDialog] = useState(false)
  const [newUsername, setNewUsername] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const { toast } = useToast()

  // Load data
  useEffect(() => {
    loadUsers()
    loadAllVPS()
  }, [])

  const loadUsers = () => {
    const savedUsers = localStorage.getItem("admin_users")
    if (savedUsers) {
      setUsers(JSON.parse(savedUsers))
    } else {
      // Default demo users
      const defaultUsers: User[] = [
        {
          id: "1",
          username: "john_doe",
          createdAt: "2024-01-15",
          hasVPS: true,
          vpsStatus: "running"
        },
        {
          id: "2", 
          username: "jane_smith",
          createdAt: "2024-01-16",
          hasVPS: true,
          vpsStatus: "stopped"
        },
        {
          id: "3",
          username: "bob_wilson",
          createdAt: "2024-01-17",
          hasVPS: false
        }
      ]
      setUsers(defaultUsers)
      localStorage.setItem("admin_users", JSON.stringify(defaultUsers))
    }
  }

  const loadAllVPS = () => {
    const vpsInstances: VPS[] = []
    
    // Load VPS from all users
    const keys = Object.keys(localStorage)
    keys.forEach(key => {
      if (key.startsWith("vps_")) {
        const vpsData = localStorage.getItem(key)
        if (vpsData) {
          const vps = JSON.parse(vpsData)
          vpsInstances.push({
            ...vps,
            owner: key.replace("vps_", "")
          })
        }
      }
    })

    setAllVPS(vpsInstances)
  }

  const createUser = () => {
    if (!newUsername || !newPassword) return

    const newUser: User = {
      id: Date.now().toString(),
      username: newUsername,
      createdAt: new Date().toISOString().split('T')[0],
      hasVPS: false
    }

    const updatedUsers = [...users, newUser]
    setUsers(updatedUsers)
    localStorage.setItem("admin_users", JSON.stringify(updatedUsers))

    setNewUsername("")
    setNewPassword("")
    setNewUserDialog(false)

    toast({
      title: "User Created",
      description: `User ${newUsername} has been created successfully.`,
    })
  }

  const deleteVPS = (vpsId: string) => {
    const vps = allVPS.find(v => v.id === vpsId)
    if (!vps) return

    // Remove from localStorage
    localStorage.removeItem(`vps_${vps.owner}`)
    
    // Update users list
    const updatedUsers = users.map(user => 
      user.username === vps.owner 
        ? { ...user, hasVPS: false, vpsStatus: undefined }
        : user
    )
    setUsers(updatedUsers)
    localStorage.setItem("admin_users", JSON.stringify(updatedUsers))

    // Refresh VPS list
    loadAllVPS()

    toast({
      title: "VPS Deleted",
      description: `VPS for ${vps.owner} has been deleted.`,
    })
  }

  const handleVPSAction = async (action: string, vpsId: string) => {
    const vps = allVPS.find(v => v.id === vpsId)
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

    const updatedVps = { ...vps, status: newStatus }
    localStorage.setItem(`vps_${vps.owner}`, JSON.stringify(updatedVps))

    if (action === "restart") {
      await new Promise(resolve => setTimeout(resolve, 2000))
      const restartedVps = { ...updatedVps, status: "running" as const }
      localStorage.setItem(`vps_${vps.owner}`, JSON.stringify(restartedVps))
    }

    loadAllVPS()
    toast({
      title: "Action Completed",
      description: message,
    })
  }

  const openTerminal = (vps: VPS) => {
    setSelectedVPS(vps)
    setTerminalOpen(true)
  }

  const runningVPS = allVPS.filter(vps => vps.status === "running").length
  const totalVPS = allVPS.length

  return (
    <>
      <DashboardLayout
        title="Admin Dashboard"
        userRole="admin"
        userName={userName}
        onLogout={onLogout}
      >
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="flex items-center p-6">
                <Users className="h-8 w-8 text-primary mr-3" />
                <div>
                  <p className="text-2xl font-bold">{users.length}</p>
                  <p className="text-xs text-muted-foreground">Total Users</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="flex items-center p-6">
                <Server className="h-8 w-8 text-accent mr-3" />
                <div>
                  <p className="text-2xl font-bold">{totalVPS}</p>
                  <p className="text-xs text-muted-foreground">VPS Instances</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center p-6">
                <Activity className="h-8 w-8 text-success mr-3" />
                <div>
                  <p className="text-2xl font-bold">{runningVPS}</p>
                  <p className="text-xs text-muted-foreground">Running</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center p-6">
                <div className="h-8 w-8 rounded-full bg-warning/20 flex items-center justify-center mr-3">
                  <span className="text-warning font-bold">%</span>
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalVPS > 0 ? Math.round((runningVPS / totalVPS) * 100) : 0}%</p>
                  <p className="text-xs text-muted-foreground">Uptime</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Users Management */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Create and manage user accounts</CardDescription>
              </div>
              <Dialog open={newUserDialog} onOpenChange={setNewUserDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create User
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New User</DialogTitle>
                    <DialogDescription>
                      Add a new user to the VPS control panel
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        placeholder="Enter username"
                      />
                    </div>
                    <div>
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter password"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={createUser}>Create User</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>VPS Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.username}</TableCell>
                      <TableCell>{user.createdAt}</TableCell>
                      <TableCell>
                        {user.hasVPS ? (
                          <StatusBadge variant={user.vpsStatus || "stopped"}>
                            {user.vpsStatus || "Unknown"}
                          </StatusBadge>
                        ) : (
                          <Badge variant="secondary">No VPS</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                          {user.hasVPS && (
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => {
                                const vps = allVPS.find(v => v.owner === user.username)
                                if (vps) deleteVPS(vps.id)
                              }}
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Delete VPS
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* VPS Instances */}
          <Card>
            <CardHeader>
              <CardTitle>VPS Instances</CardTitle>
              <CardDescription>Monitor and manage all VPS instances</CardDescription>
            </CardHeader>
            <CardContent>
              {allVPS.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {allVPS.map((vps) => (
                    <VPSCard
                      key={vps.id}
                      vps={vps}
                      onStart={(id) => handleVPSAction("start", id)}
                      onStop={(id) => handleVPSAction("stop", id)}
                      onRestart={(id) => handleVPSAction("restart", id)}
                      onConsole={() => openTerminal(vps)}
                      onDelete={deleteVPS}
                      isAdmin={true}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Server className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No VPS instances deployed yet</p>
                </div>
              )}
            </CardContent>
          </Card>
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
        />
      )}
    </>
  )
}