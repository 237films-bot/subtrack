import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

// Type definitions for database tables
export type Database = {
  public: {
    Tables: {
      subscriptions: {
        Row: {
          id: string
          user_id: string
          name: string
          logo: string
          color: string
          total_credits: number
          used_credits: number
          reset_day: number
          reset_type: 'monthly' | 'weekly' | 'yearly' | 'custom'
          custom_reset_days: number | null
          url: string | null
          notes: string | null
          enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['subscriptions']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['subscriptions']['Insert']>
      }
      credit_history: {
        Row: {
          id: string
          user_id: string
          subscription_id: string
          previous_used: number
          new_used: number
          change: number
          date: string
          note: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['credit_history']['Row'], 'created_at'>
        Update: Partial<Database['public']['Tables']['credit_history']['Insert']>
      }
    }
  }
}
