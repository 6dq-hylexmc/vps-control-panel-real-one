import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

export interface VPS {
  id: string
  user_id: string
  name: string
  status: 'running' | 'stopped' | 'pending' | 'deploying' | 'error'
  container_id: string | null
  docker_image: string
  resources: {
    cpu: string
    ram: string
    disk: string
  }
  ip_address: string | null
  ports: number[]
  environment_vars: Record<string, string>
  created_at: string
  updated_at: string
  deployed_at: string | null
  last_started_at: string | null
  uptime_seconds: number
}

export interface VPSActivityLog {
  id: string
  vps_id: string
  action: string
  status: 'success' | 'error' | 'pending'
  details: Record<string, any> | null
  created_at: string
  created_by: string | null
}

export function useVPS() {
  const [vpsInstances, setVpsInstances] = useState<VPS[]>([])
  const [activityLogs, setActivityLogs] = useState<VPSActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // Fetch VPS instances
  const fetchVPSInstances = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('vps_instances')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setVpsInstances(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch VPS instances')
      toast({
        title: "Error",
        description: "Failed to load VPS instances",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Fetch activity logs
  const fetchActivityLogs = async (vpsId?: string) => {
    try {
      let query = supabase
        .from('vps_activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      if (vpsId) {
        query = query.eq('vps_id', vpsId)
      }

      const { data, error } = await query
      if (error) throw error
      setActivityLogs(data || [])
    } catch (err) {
      console.error('Failed to fetch activity logs:', err)
    }
  }

  // Deploy VPS
  const deployVPS = async (config: {
    name: string
    docker_image?: string
    resources?: VPS['resources']
    ports?: number[]
    environment_vars?: Record<string, string>
  }) => {
    try {
      setLoading(true)
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Check if user already has a VPS
      const { data: existingVPS } = await supabase
        .from('vps_instances')
        .select('id')
        .eq('user_id', user.id)

      if (existingVPS && existingVPS.length > 0) {
        throw new Error('You already have a VPS deployed. Only one VPS per user is allowed.')
      }

      // Create VPS record
      const { data: newVPS, error: insertError } = await supabase
        .from('vps_instances')
        .insert({
          user_id: user.id,
          name: config.name,
          status: 'deploying',
          docker_image: config.docker_image || 'ubuntu:22.04',
          resources: config.resources || { cpu: '2 cores', ram: '2GB', disk: '20GB SSD' },
          ports: config.ports || [],
          environment_vars: config.environment_vars || {}
        })
        .select()
        .single()

      if (insertError) throw insertError

      // Call docker-manager edge function
      const { data: dockerResult, error: dockerError } = await supabase.functions.invoke('docker-manager', {
        body: {
          action: 'deploy',
          vps_id: newVPS.id,
          config: {
            image: config.docker_image || 'ubuntu:22.04',
            resources: config.resources,
            ports: config.ports,
            environment: config.environment_vars
          }
        }
      })

      if (dockerError) throw dockerError

      // Update VPS with container details
      if (dockerResult.data) {
        await supabase
          .from('vps_instances')
          .update({
            container_id: dockerResult.data.container_id,
            ip_address: dockerResult.data.ip_address,
            deployed_at: new Date().toISOString()
          })
          .eq('id', newVPS.id)
      }

      await fetchVPSInstances()
      toast({
        title: "VPS Deployment Started",
        description: "Your VPS is being deployed. This may take a few minutes.",
      })

      return newVPS
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to deploy VPS')
      toast({
        title: "Deployment Failed",
        description: err instanceof Error ? err.message : 'Failed to deploy VPS',
        variant: "destructive",
      })
      throw err
    } finally {
      setLoading(false)
    }
  }

  // VPS Actions
  const performVPSAction = async (vpsId: string, action: 'start' | 'stop' | 'restart' | 'destroy') => {
    try {
      setLoading(true)

      const { data, error } = await supabase.functions.invoke('docker-manager', {
        body: {
          action,
          vps_id: vpsId
        }
      })

      if (error) throw error

      await fetchVPSInstances()
      toast({
        title: "Action Completed",
        description: `VPS ${action} operation completed successfully.`,
      })

      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${action} VPS`)
      toast({
        title: "Action Failed",
        description: err instanceof Error ? err.message : `Failed to ${action} VPS`,
        variant: "destructive",
      })
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Execute command in VPS terminal
  const executeCommand = async (vpsId: string, command: string, workingDirectory?: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('terminal-exec', {
        body: {
          vps_id: vpsId,
          command,
          working_directory: workingDirectory
        }
      })

      if (error) throw error
      return data.data
    } catch (err) {
      console.error('Command execution failed:', err)
      throw err
    }
  }

  // Real-time subscriptions
  useEffect(() => {
    fetchVPSInstances()
    fetchActivityLogs()

    // Subscribe to VPS changes
    const vpsSubscription = supabase
      .channel('vps_instances')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'vps_instances' },
        () => {
          fetchVPSInstances()
        }
      )
      .subscribe()

    // Subscribe to activity logs
    const logsSubscription = supabase
      .channel('vps_activity_logs')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'vps_activity_logs' },
        () => {
          fetchActivityLogs()
        }
      )
      .subscribe()

    return () => {
      vpsSubscription.unsubscribe()
      logsSubscription.unsubscribe()
    }
  }, [])

  return {
    vpsInstances,
    activityLogs,
    loading,
    error,
    deployVPS,
    performVPSAction,
    executeCommand,
    fetchVPSInstances,
    fetchActivityLogs
  }
}