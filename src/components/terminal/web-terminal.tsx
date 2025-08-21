import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X, Maximize2, Minimize2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface WebTerminalProps {
  vpsId: string
  vpsName: string
  isOpen: boolean
  onClose: () => void
  onExecuteCommand?: (vpsId: string, command: string, workingDirectory?: string) => Promise<any>
}

export function WebTerminal({ vpsId, vpsName, isOpen, onClose, onExecuteCommand }: WebTerminalProps) {
  const [isMaximized, setIsMaximized] = useState(false)
  const [command, setCommand] = useState("")
  const [history, setHistory] = useState<Array<{ type: "command" | "output"; content: string }>>([
    { type: "output", content: `Connected to ${vpsName} (${vpsId})` },
    { type: "output", content: "Ubuntu 22.04.3 LTS" },
    { type: "output", content: "Welcome to your VPS instance!" },
    { type: "output", content: "" },
  ])
  const terminalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [history])

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault()
    if (!command.trim()) return

    // Add command to history
    setHistory(prev => [...prev, { type: "command", content: `root@${vpsId.slice(0, 8)}:~# ${command}` }])

    // Simulate command execution
    setTimeout(() => {
      let output = ""
      switch (command.toLowerCase()) {
        case "ls":
          output = "bin  boot  dev  etc  home  lib  media  mnt  opt  proc  root  run  sbin  srv  sys  tmp  usr  var"
          break
        case "pwd":
          output = "/root"
          break
        case "whoami":
          output = "root"
          break
        case "date":
          output = new Date().toString()
          break
        case "uptime":
          output = "up 2 days, 14:30, 1 user, load average: 0.15, 0.10, 0.05"
          break
        case "free -h":
          output = `              total        used        free      shared  buff/cache   available
Mem:           2.0G        456M        1.2G         12M        356M        1.4G
Swap:          1.0G          0B        1.0G`
          break
        case "df -h":
          output = `Filesystem      Size  Used Avail Use% Mounted on
/dev/sda1        20G  3.2G   16G  17% /
tmpfs           1.0G     0  1.0G   0% /dev/shm`
          break
        case "clear":
          setHistory([{ type: "output", content: `Connected to ${vpsName} (${vpsId})` }])
          setCommand("")
          return
        default:
          if (command.includes("help")) {
            output = "Available commands: ls, pwd, whoami, date, uptime, free -h, df -h, clear"
          } else {
            output = `bash: ${command}: command not found`
          }
      }
      
      setHistory(prev => [...prev, { type: "output", content: output }, { type: "output", content: "" }])
    }, 100 + Math.random() * 200)

    setCommand("")
  }

  if (!isOpen) return null

  return (
    <div className={cn(
      "fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur",
      isMaximized && "p-0"
    )}>
      <Card className={cn(
        "w-full max-w-4xl h-96 flex flex-col",
        isMaximized && "max-w-none h-full rounded-none"
      )}>
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-2 border-b">
          <CardTitle className="text-base font-mono">
            Terminal - {vpsName} ({vpsId.slice(0, 12)})
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMaximized(!isMaximized)}
            >
              {isMaximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 p-0 bg-terminal-bg">
          <div
            ref={terminalRef}
            className="h-full overflow-y-auto p-4 font-mono text-sm text-terminal-text"
          >
            {history.map((entry, index) => (
              <div key={index} className={cn(
                entry.type === "command" && "text-primary font-semibold",
                entry.type === "output" && "whitespace-pre-wrap"
              )}>
                {entry.content}
              </div>
            ))}
            
            <form onSubmit={handleCommand} className="flex items-center mt-2">
              <span className="text-primary font-semibold mr-2">
                root@{vpsId.slice(0, 8)}:~#
              </span>
              <Input
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                className="flex-1 bg-transparent border-none text-terminal-text font-mono focus-visible:ring-0 focus-visible:ring-offset-0 p-0"
                placeholder="Enter command..."
                autoFocus
              />
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}