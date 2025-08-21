import { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Server, Users, LogOut, Terminal, Settings } from "lucide-react"

interface DashboardLayoutProps {
  children: ReactNode
  title: string
  userRole: "admin" | "user"
  userName: string
  onLogout: () => void
}

export function DashboardLayout({ children, title, userRole, userName, onLogout }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Server className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold">VPS Control</h1>
            </div>
            <div className="h-6 w-px bg-border" />
            <h2 className="text-lg font-semibold text-muted-foreground">{title}</h2>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {userName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{userName}</span>
                <span className="text-xs text-muted-foreground capitalize">{userRole}</span>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      {userRole === "admin" && (
        <nav className="border-b border-border bg-card/30">
          <div className="flex space-x-8 px-6 py-3">
            <Button variant="ghost" size="sm" className="text-primary">
              <Users className="h-4 w-4 mr-2" />
              Users
            </Button>
            <Button variant="ghost" size="sm">
              <Server className="h-4 w-4 mr-2" />
              VPS Instances
            </Button>
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </nav>
      )}

      {/* Main Content */}
      <main className="p-6">
        {children}
      </main>
    </div>
  )
}