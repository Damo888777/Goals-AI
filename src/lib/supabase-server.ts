import { createClient } from '@supabase/supabase-js'
import type { Database } from './supabase'

// Server-only Supabase client without AsyncStorage
// This is safe to use in API routes and server-side code
export const supabaseServer = createClient<Database>(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      // Disable automatic session management for server-side usage
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  }
)

// Helper function to create authenticated server client
export const createAuthenticatedServerClient = (accessToken: string) => {
  return createClient<Database>(
    process.env.EXPO_PUBLIC_SUPABASE_URL!,
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      },
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    }
  )
}
