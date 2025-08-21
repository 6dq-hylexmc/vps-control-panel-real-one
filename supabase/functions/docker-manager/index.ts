import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DockerAction {
  action: 'deploy' | 'start' | 'stop' | 'restart' | 'destroy' | 'status'
  vps_id: string
  config?: {
    image?: string
    resources?: {
      cpu?: string
      memory?: string
      disk?: string
    }
    ports?: number[]
    environment?: Record<string, string>
  }
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    
    // Set the auth token
    supabase.auth.session = { access_token: token } as any

    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    const { action, vps_id, config }: DockerAction = await req.json()

    // Get VPS instance
    const { data: vps, error: vpsError } = await supabase
      .from('vps_instances')
      .select('*')
      .eq('id', vps_id)
      .single()

    if (vpsError || !vps) {
      throw new Error('VPS instance not found')
    }

    // Check permissions (user owns VPS or is admin)
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (vps.user_id !== user.id && userProfile?.role !== 'admin') {
      throw new Error('Insufficient permissions')
    }

    let result: any = {}

    // Simulate Docker operations (replace with actual Docker API calls)
    switch (action) {
      case 'deploy':
        result = await deployContainer(vps, config)
        await updateVPSStatus(supabase, vps_id, 'deploying')
        
        // Simulate deployment time
        setTimeout(async () => {
          await updateVPSStatus(supabase, vps_id, 'running')
          await logActivity(supabase, vps_id, 'deploy', 'success', { container_id: result.container_id })
        }, 3000)
        break

      case 'start':
        result = await startContainer(vps.container_id)
        await updateVPSStatus(supabase, vps_id, 'running')
        await logActivity(supabase, vps_id, 'start', 'success')
        break

      case 'stop':
        result = await stopContainer(vps.container_id)
        await updateVPSStatus(supabase, vps_id, 'stopped')
        await logActivity(supabase, vps_id, 'stop', 'success')
        break

      case 'restart':
        result = await restartContainer(vps.container_id)
        await updateVPSStatus(supabase, vps_id, 'pending')
        
        setTimeout(async () => {
          await updateVPSStatus(supabase, vps_id, 'running')
          await logActivity(supabase, vps_id, 'restart', 'success')
        }, 2000)
        break

      case 'destroy':
        result = await destroyContainer(vps.container_id)
        await supabase
          .from('vps_instances')
          .delete()
          .eq('id', vps_id)
        await logActivity(supabase, vps_id, 'destroy', 'success')
        break

      case 'status':
        result = await getContainerStatus(vps.container_id)
        break

      default:
        throw new Error('Invalid action')
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Docker operation error:', error)
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

// Helper functions (simulate Docker operations)
async function deployContainer(vps: any, config: any = {}) {
  const container_id = `vps_${Math.random().toString(36).substr(2, 16)}`
  const ip_address = `172.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 254) + 1}`
  
  // In a real implementation, this would call Docker API
  console.log(`Deploying container ${container_id} for VPS ${vps.id}`)
  
  return {
    container_id,
    ip_address,
    image: config.image || 'ubuntu:22.04',
    status: 'deploying'
  }
}

async function startContainer(container_id: string) {
  console.log(`Starting container ${container_id}`)
  return { container_id, status: 'running', started_at: new Date().toISOString() }
}

async function stopContainer(container_id: string) {
  console.log(`Stopping container ${container_id}`)
  return { container_id, status: 'stopped', stopped_at: new Date().toISOString() }
}

async function restartContainer(container_id: string) {
  console.log(`Restarting container ${container_id}`)
  return { container_id, status: 'restarting', restarted_at: new Date().toISOString() }
}

async function destroyContainer(container_id: string) {
  console.log(`Destroying container ${container_id}`)
  return { container_id, status: 'destroyed', destroyed_at: new Date().toISOString() }
}

async function getContainerStatus(container_id: string) {
  console.log(`Getting status for container ${container_id}`)
  return { 
    container_id, 
    status: 'running',
    uptime: Math.floor(Math.random() * 86400), // Random uptime in seconds
    resource_usage: {
      cpu: Math.floor(Math.random() * 100),
      memory: Math.floor(Math.random() * 2048),
      disk: Math.floor(Math.random() * 20480)
    }
  }
}

async function updateVPSStatus(supabase: any, vps_id: string, status: string) {
  const updates: any = { status, updated_at: new Date().toISOString() }
  
  if (status === 'running') {
    updates.last_started_at = new Date().toISOString()
  }

  await supabase
    .from('vps_instances')
    .update(updates)
    .eq('id', vps_id)
}

async function logActivity(supabase: any, vps_id: string, action: string, status: string, details: any = {}) {
  await supabase
    .from('vps_activity_logs')
    .insert({
      vps_id,
      action,
      status,
      details,
      created_at: new Date().toISOString()
    })
}