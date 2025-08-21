import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          username: string
          role: 'admin' | 'user'
          created_at: string
          updated_at: string
          is_active: boolean
        }
        Insert: {
          id: string
          username: string
          role?: 'admin' | 'user'
          is_active?: boolean
        }
        Update: {
          username?: string
          role?: 'admin' | 'user'
          is_active?: boolean
        }
      }
      vps_instances: {
        Row: {
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
        Insert: {
          user_id: string
          name: string
          status?: 'running' | 'stopped' | 'pending' | 'deploying' | 'error'
          container_id?: string | null
          docker_image?: string
          resources?: {
            cpu: string
            ram: string
            disk: string
          }
          ip_address?: string | null
          ports?: number[]
          environment_vars?: Record<string, string>
          deployed_at?: string | null
          last_started_at?: string | null
          uptime_seconds?: number
        }
        Update: {
          name?: string
          status?: 'running' | 'stopped' | 'pending' | 'deploying' | 'error'
          container_id?: string | null
          docker_image?: string
          resources?: {
            cpu: string
            ram: string
            disk: string
          }
          ip_address?: string | null
          ports?: number[]
          environment_vars?: Record<string, string>
          deployed_at?: string | null
          last_started_at?: string | null
          uptime_seconds?: number
        }
      }
      vps_activity_logs: {
        Row: {
          id: string
          vps_id: string
          action: string
          status: 'success' | 'error' | 'pending'
          details: Record<string, any> | null
          created_at: string
          created_by: string | null
        }
        Insert: {
          vps_id: string
          action: string
          status: 'success' | 'error' | 'pending'
          details?: Record<string, any> | null
          created_by?: string | null
        }
        Update: {
          status?: 'success' | 'error' | 'pending'
          details?: Record<string, any> | null
        }
      }
      resource_usage: {
        Row: {
          id: string
          vps_id: string
          cpu_usage_percent: number | null
          memory_usage_mb: number | null
          disk_usage_mb: number | null
          network_in_mb: number | null
          network_out_mb: number | null
          recorded_at: string
        }
        Insert: {
          vps_id: string
          cpu_usage_percent?: number | null
          memory_usage_mb?: number | null
          disk_usage_mb?: number | null
          network_in_mb?: number | null
          network_out_mb?: number | null
        }
        Update: {
          cpu_usage_percent?: number | null
          memory_usage_mb?: number | null
          disk_usage_mb?: number | null
          network_in_mb?: number | null
          network_out_mb?: number | null
        }
      }
      system_settings: {
        Row: {
          key: string
          value: any
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          key: string
          value: any
          updated_by?: string | null
        }
        Update: {
          value?: any
          updated_by?: string | null
        }
      }
    }
  }
}