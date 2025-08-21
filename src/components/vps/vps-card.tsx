import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/ui/status-badge"
import { Badge } from "@/components/ui/badge"
import { Play, Square, RotateCcw, Terminal, Trash2, Settings } from "lucide-react"
import { cn } from "@/lib/utils"

interface VPSCardProps {
  vps: {
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
  onStart: (id: string) => void
  onStop: (id: string) => void
  onRestart: (id: string) => void
  onConsole: (id: string) => void
  onRedeploy?: (id: string) => void
  onDelete?: (id: string) => void
  isAdmin?: boolean
}

export function VPSCard({ vps, onStart, onStop, onRestart, onConsole, onRedeploy, onDelete, isAdmin }: VPSCardProps) {
  const isRunning = vps.status === "running"
  const isPending = vps.status === "pending"

  return (
    <Card className={cn(
      "transition-all duration-200 hover:shadow-lg border-border/50",
      isRunning && "shadow-[0_0_20px_-10px] shadow-success/20",
      vps.status === "stopped" && "opacity-75"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">{vps.name}</CardTitle>
          <StatusBadge variant={vps.status === "pending" ? "deploying" : vps.status}>
            {vps.status === "pending" ? "Deploying" : vps.status}
          </StatusBadge>
        </div>
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <span>ID: {vps.containerId.slice(0, 12)}</span>
          {vps.ipAddress && (
            <>
              <span>•</span>
              <span>{vps.ipAddress}</span>
            </>
          )}
          {vps.uptime && isRunning && (
            <>
              <span>•</span>
              <span>Uptime: {vps.uptime}</span>
            </>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Resources */}
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center">
            <div className="text-xs text-muted-foreground">CPU</div>
            <Badge variant="secondary" className="text-xs">{vps.resources.cpu}</Badge>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground">RAM</div>
            <Badge variant="secondary" className="text-xs">{vps.resources.ram}</Badge>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground">Disk</div>
            <Badge variant="secondary" className="text-xs">{vps.resources.disk}</Badge>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          {!isRunning && !isPending && (
            <Button 
              size="sm" 
              onClick={() => onStart(vps.id)}
              className="bg-success hover:bg-success/90 text-success-foreground"
            >
              <Play className="h-3 w-3 mr-1" />
              Start
            </Button>
          )}
          
          {isRunning && (
            <Button 
              size="sm" 
              variant="secondary"
              onClick={() => onStop(vps.id)}
            >
              <Square className="h-3 w-3 mr-1" />
              Stop
            </Button>
          )}
          
          {!isPending && (
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => onRestart(vps.id)}
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Restart
            </Button>
          )}
          
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => onConsole(vps.id)}
            disabled={!isRunning}
          >
            <Terminal className="h-3 w-3 mr-1" />
            Console
          </Button>

          {isAdmin && (
            <>
              {onRedeploy && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => onRedeploy(vps.id)}
                >
                  <Settings className="h-3 w-3 mr-1" />
                  Redeploy
                </Button>
              )}
              
              {onDelete && (
                <Button 
                  size="sm" 
                  variant="destructive"
                  onClick={() => onDelete(vps.id)}
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Delete
                </Button>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}