import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

// Database types for TypeScript
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          user_id: string
          email: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          email?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          email?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      goals: {
        Row: {
          id: string
          user_id: string
          title: string
          feelings: string[] | null
          vision_image_url: string | null
          notes: string | null
          is_completed: boolean
          completed_at: string | null
          creation_source: 'spark' | 'manual'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          feelings?: string[] | null
          vision_image_url?: string | null
          notes?: string | null
          is_completed?: boolean
          completed_at?: string | null
          creation_source?: 'spark' | 'manual'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          feelings?: string[] | null
          vision_image_url?: string | null
          notes?: string | null
          is_completed?: boolean
          completed_at?: string | null
          creation_source?: 'spark' | 'manual'
          created_at?: string
          updated_at?: string
        }
      }
      milestones: {
        Row: {
          id: string
          user_id: string
          goal_id: string
          title: string
          target_date: string | null
          is_complete: boolean
          creation_source: 'spark' | 'manual'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          goal_id: string
          title: string
          target_date?: string | null
          is_complete?: boolean
          creation_source?: 'spark' | 'manual'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          goal_id?: string
          title?: string
          target_date?: string | null
          is_complete?: boolean
          creation_source?: 'spark' | 'manual'
          created_at?: string
          updated_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          user_id: string
          goal_id: string | null
          milestone_id: string | null
          title: string
          notes: string | null
          scheduled_date: string | null
          is_frog: boolean
          is_complete: boolean
          creation_source: 'spark' | 'manual'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          goal_id?: string | null
          milestone_id?: string | null
          title: string
          notes?: string | null
          scheduled_date?: string | null
          is_frog?: boolean
          is_complete?: boolean
          creation_source?: 'spark' | 'manual'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          goal_id?: string | null
          milestone_id?: string | null
          title?: string
          notes?: string | null
          scheduled_date?: string | null
          is_frog?: boolean
          is_complete?: boolean
          creation_source?: 'spark' | 'manual'
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
