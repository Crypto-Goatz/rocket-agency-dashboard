/**
 * Supabase Client
 * 
 * Provides both a public client (for client-side) and
 * an admin client (for server-side with elevated privileges).
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Validate required env vars
if (!supabaseUrl) {
  console.warn('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
}

if (!supabaseAnonKey) {
  console.warn('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable')
}

/**
 * Public Supabase client (uses anon key)
 * Use for client-side operations with RLS
 */
export const supabase: SupabaseClient = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
)

/**
 * Admin Supabase client (uses service role key)
 * Use for server-side operations that bypass RLS
 * 
 * WARNING: Never expose this client to the browser!
 */
export const supabaseAdmin: SupabaseClient = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseServiceKey || supabaseAnonKey || 'placeholder',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
)

/**
 * Check if Supabase is properly configured
 */
export function isSupabaseConfigured(): boolean {
  return !!(supabaseUrl && supabaseAnonKey)
}

/**
 * Check if admin client is available (service key provided)
 */
export function isAdminConfigured(): boolean {
  return !!(supabaseUrl && supabaseServiceKey)
}

// Database types (generated from Supabase)
// These would normally be generated using `supabase gen types typescript`
export interface Database {
  public: {
    Tables: {
      skills: {
        Row: {
          id: string
          slug: string
          name: string
          description: string | null
          version: string
          author: string | null
          icon: string | null
          icon_url: string | null
          category: string
          manifest: any
          source_url: string | null
          is_marketplace: boolean
          is_active: boolean
          downloads: number
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['skills']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['skills']['Insert']>
      }
      skill_installations: {
        Row: {
          id: string
          user_id: string
          skill_id: string
          status: 'installing' | 'installed' | 'paused' | 'error' | 'uninstalling'
          config: any
          permissions_granted: any
          environment: any
          installed_at: string
          last_run: string | null
          error_message: string | null
        }
        Insert: Omit<Database['public']['Tables']['skill_installations']['Row'], 'id' | 'installed_at'>
        Update: Partial<Database['public']['Tables']['skill_installations']['Insert']>
      }
      skill_logs: {
        Row: {
          id: string
          installation_id: string
          action: string
          target: string
          before_state: any
          after_state: any
          metadata: any
          reversible: boolean
          reverted: boolean
          reverted_at: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['skill_logs']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['skill_logs']['Insert']>
      }
      skill_executions: {
        Row: {
          id: string
          installation_id: string
          status: 'running' | 'completed' | 'failed' | 'cancelled'
          input: any
          output: any
          progress: any
          current_step: number
          total_steps: number
          error_message: string | null
          started_at: string
          completed_at: string | null
          duration_ms: number | null
        }
        Insert: Omit<Database['public']['Tables']['skill_executions']['Row'], 'id' | 'started_at'>
        Update: Partial<Database['public']['Tables']['skill_executions']['Insert']>
      }
      mcp_servers: {
        Row: {
          id: string
          slug: string
          name: string
          description: string | null
          category: string
          endpoint: string
          connection_type: 'http' | 'stdio' | 'sse'
          auth_type: 'api_key' | 'oauth' | 'token' | 'pit' | 'none'
          auth_config: any
          tools: any
          logo: string | null
          website: string | null
          docs_url: string | null
          is_builtin: boolean
          is_enabled: boolean
          is_verified: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['mcp_servers']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['mcp_servers']['Insert']>
      }
      mcp_connections: {
        Row: {
          id: string
          user_id: string
          server_id: string
          status: 'connected' | 'disconnected' | 'error' | 'expired'
          credentials: any
          access_token: string | null
          refresh_token: string | null
          token_expires_at: string | null
          environment: any
          last_used_at: string | null
          total_calls: number
          last_error: string | null
          last_error_at: string | null
          connected_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['mcp_connections']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['mcp_connections']['Insert']>
      }
      mcp_call_logs: {
        Row: {
          id: string
          connection_id: string | null
          user_id: string
          server_slug: string
          tool_name: string
          params: any
          success: boolean
          response: any
          error_message: string | null
          duration_ms: number | null
          skill_id: string | null
          execution_id: string | null
          called_at: string
        }
        Insert: Omit<Database['public']['Tables']['mcp_call_logs']['Row'], 'id' | 'called_at'>
        Update: Partial<Database['public']['Tables']['mcp_call_logs']['Insert']>
      }
      rocket_sites: {
        Row: {
          id: string
          user_id: string
          deployment_id: string | null
          name: string
          type: 'business' | 'portfolio' | 'saas' | 'blog' | 'ecommerce' | null
          industry: string | null
          description: string | null
          vercel_project_id: string | null
          vercel_url: string | null
          custom_domain: string | null
          status: 'building' | 'deployed' | 'error' | 'deleted'
          pages: any
          components: any
          config: any
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['rocket_sites']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['rocket_sites']['Insert']>
      }
    }
  }
}

export default supabase
