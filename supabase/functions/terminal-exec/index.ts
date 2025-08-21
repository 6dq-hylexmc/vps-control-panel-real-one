import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ExecRequest {
  vps_id: string
  command: string
  working_directory?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    const { vps_id, command, working_directory = '/root' }: ExecRequest = await req.json()

    // Get VPS instance and verify ownership
    const { data: vps, error: vpsError } = await supabase
      .from('vps_instances')
      .select('*, users!inner(role)')
      .eq('id', vps_id)
      .single()

    if (vpsError || !vps) {
      throw new Error('VPS instance not found')
    }

    // Check permissions
    if (vps.user_id !== user.id && vps.users.role !== 'admin') {
      throw new Error('Insufficient permissions')
    }

    if (vps.status !== 'running') {
      throw new Error('VPS is not running')
    }

    // Execute command (simulated)
    const result = await executeCommand(vps.container_id, command, working_directory)

    // Log command execution
    await supabase
      .from('vps_activity_logs')
      .insert({
        vps_id,
        action: 'exec',
        status: result.exit_code === 0 ? 'success' : 'error',
        details: {
          command,
          working_directory,
          exit_code: result.exit_code,
          output_length: result.output.length
        }
      })

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Terminal exec error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Internal server error' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})

async function executeCommand(container_id: string, command: string, workingDir: string) {
  // Simulate command execution with realistic responses
  console.log(`Executing command in ${container_id}: ${command}`)
  
  const timestamp = new Date().toISOString()
  let output = ""
  let exit_code = 0

  // Simulate different commands
  switch (command.toLowerCase().trim()) {
    case 'ls':
    case 'ls -la':
      output = `total 48
drwx------ 1 root root 4096 ${new Date().toDateString()} .
drwxr-xr-x 1 root root 4096 ${new Date().toDateString()} ..
-rw-r--r-- 1 root root  571 Apr 10  2021 .bashrc
-rw-r--r-- 1 root root  161 Jul  9  2019 .profile
drwxr-xr-x 2 root root 4096 ${new Date().toDateString()} .ssh
-rw-r--r-- 1 root root 1024 ${new Date().toDateString()} .vimrc`
      break

    case 'pwd':
      output = workingDir
      break

    case 'whoami':
      output = 'root'
      break

    case 'date':
      output = new Date().toString()
      break

    case 'uptime':
      const uptime = Math.floor(Math.random() * 86400)
      const hours = Math.floor(uptime / 3600)
      const minutes = Math.floor((uptime % 3600) / 60)
      output = `${hours}:${minutes.toString().padStart(2, '0')} up ${hours}h ${minutes}m, 1 user, load average: 0.${Math.floor(Math.random() * 50)}, 0.${Math.floor(Math.random() * 30)}, 0.${Math.floor(Math.random() * 20)}`
      break

    case 'free -h':
      output = `              total        used        free      shared  buff/cache   available
Mem:           2.0G        ${Math.floor(Math.random() * 800 + 200)}M        1.${Math.floor(Math.random() * 5)}G         12M        ${Math.floor(Math.random() * 400 + 200)}M        1.${Math.floor(Math.random() * 5)}G
Swap:          1.0G          0B        1.0G`
      break

    case 'df -h':
      const usedSpace = Math.floor(Math.random() * 10 + 2)
      const availSpace = 20 - usedSpace
      const usagePercent = Math.floor((usedSpace / 20) * 100)
      output = `Filesystem      Size  Used Avail Use% Mounted on
/dev/sda1        20G  ${usedSpace}.${Math.floor(Math.random() * 10)}G   ${availSpace}G  ${usagePercent}% /
tmpfs           1.0G     0  1.0G   0% /dev/shm
tmpfs           5.0M     0  5.0M   0% /run/lock`
      break

    case 'ps aux':
      output = `USER       PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND
root         1  0.0  0.1  18236  3152 ?        Ss   ${new Date().toTimeString().slice(0,5)}   0:00 /bin/bash
root        15  0.0  0.1  34400  2896 ?        R    ${new Date().toTimeString().slice(0,5)}   0:00 ps aux`
      break

    case 'top':
      output = `top - ${new Date().toTimeString().slice(0,8)} up  2:15,  1 user,  load average: 0.08, 0.03, 0.05
Tasks:   2 total,   1 running,   1 sleeping,   0 stopped,   0 zombie
%Cpu(s):  ${Math.floor(Math.random() * 20)}.0 us,  ${Math.floor(Math.random() * 10)}.0 sy,  0.0 ni, ${Math.floor(Math.random() * 20 + 70)}.0 id,  0.0 wa,  0.0 hi,  0.0 si,  0.0 st
MiB Mem :   2048.0 total,   ${Math.floor(Math.random() * 800 + 1000)}.0 free,    ${Math.floor(Math.random() * 400 + 200)}.0 used,    ${Math.floor(Math.random() * 400 + 200)}.0 buff/cache
MiB Swap:   1024.0 total,   1024.0 free,      0.0 used.   ${Math.floor(Math.random() * 600 + 1200)}.0 avail Mem

  PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND
    1 root      20   0   18236   3152   2688 S   0.0   0.2   0:00.01 bash`
      break

    case 'clear':
      output = ''
      break

    case 'help':
      output = `Available commands:
Basic: ls, pwd, whoami, date, uptime, clear
System: free -h, df -h, ps aux, top
Files: cat, touch, mkdir, rm, cp, mv
Network: ping, wget, curl
Package: apt update, apt install
Note: This is a simulated environment. Some commands may have limited functionality.`
      break

    default:
      if (command.startsWith('cat ')) {
        const filename = command.slice(4).trim()
        if (filename === '/etc/os-release') {
          output = `NAME="Ubuntu"
VERSION="22.04.3 LTS (Jammy Jellyfish)"
ID=ubuntu
ID_LIKE=debian
PRETTY_NAME="Ubuntu 22.04.3 LTS"
VERSION_ID="22.04"
HOME_URL="https://www.ubuntu.com/"
SUPPORT_URL="https://help.ubuntu.com/"
BUG_REPORT_URL="https://bugs.launchpad.net/ubuntu/"
PRIVACY_POLICY_URL="https://www.ubuntu.com/legal/terms-and-policies/privacy-policy"
VERSION_CODENAME=jammy
UBUNTU_CODENAME=jammy`
        } else {
          output = `cat: ${filename}: No such file or directory`
          exit_code = 1
        }
      } else if (command.startsWith('echo ')) {
        output = command.slice(5)
      } else if (command.startsWith('mkdir ')) {
        const dirname = command.slice(6).trim()
        output = `Directory '${dirname}' created`
      } else if (command.startsWith('touch ')) {
        const filename = command.slice(6).trim()
        output = `File '${filename}' created`
      } else if (command.includes('install') || command.includes('update')) {
        output = `Simulated package operation: ${command}
This is a demo environment. Package management is simulated.`
      } else {
        output = `bash: ${command}: command not found`
        exit_code = 127
      }
  }

  // Add some realistic delay
  await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 300))

  return {
    output,
    exit_code,
    executed_at: timestamp,
    working_directory: workingDir
  }
}