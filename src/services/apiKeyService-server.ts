import { supabaseServer } from '../lib/supabase-server'

/**
 * Server-side API Key Service for use in API routes
 * Fetches API keys from Supabase Edge Function without AsyncStorage dependencies
 */
class ServerApiKeyService {
  private cache: Map<string, { key: string; expires: number }> = new Map()
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  /**
   * Get OpenAI API key from Supabase Edge Function (server-side)
   */
  async getOpenAIApiKey(): Promise<string | null> {
    return this.getApiKey('openai')
  }

  /**
   * Get Google API key from Supabase Edge Function (server-side)
   */
  async getGoogleApiKey(): Promise<string | null> {
    return this.getApiKey('google')
  }

  /**
   * Get OneSignal API key from Supabase Edge Function (server-side)
   */
  async getOneSignalApiKey(): Promise<string | null> {
    return this.getApiKey('onesignal')
  }

  /**
   * Generic method to fetch API keys from Supabase Edge Function
   */
  private async getApiKey(provider: 'openai' | 'google' | 'onesignal'): Promise<string | null> {
    const cacheKey = `${provider}_api_key`
    
    // Check cache first
    const cached = this.cache.get(cacheKey)
    if (cached && Date.now() < cached.expires) {
      return cached.key
    }

    try {
      console.log(`[Server API Key Service] Calling get-api-keys edge function for ${provider}...`)
      
      // Call Supabase Edge Function to get API keys (GET request)
      const { data, error } = await supabaseServer.functions.invoke('get-api-keys', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
          'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
        }
      })

      console.log(`[Server API Key Service] Edge function response:`, { data, error })

      if (error) {
        console.error(`[Server API Key Service] Error fetching ${provider} API key:`, error)
        return null
      }

      if (!data) {
        console.error(`[Server API Key Service] No data returned from edge function`)
        return null
      }

      console.log(`[Server API Key Service] Available keys in response:`, Object.keys(data))

      const apiKey = provider === 'openai' ? data.openai_api_key : 
                     provider === 'google' ? data.google_api_key : 
                     data.onesignal_api_key

      console.log(`[Server API Key Service] Looking for ${provider} key, found:`, !!apiKey)

      if (!apiKey) {
        console.error(`[Server API Key Service] ${provider} API key not found in response`)
        console.error(`[Server API Key Service] Response data:`, data)
        return null
      }

      // Cache the key
      this.cache.set(cacheKey, {
        key: apiKey,
        expires: Date.now() + this.CACHE_DURATION
      })

      console.log(`[Server API Key Service] Successfully fetched ${provider} API key`)
      return apiKey

    } catch (error) {
      console.error(`[Server API Key Service] Exception fetching ${provider} API key:`, error)
      return null
    }
  }

  /**
   * Clear the cache (useful for testing or forced refresh)
   */
  clearCache(): void {
    this.cache.clear()
  }
}

// Export singleton instance for server-side usage
export const serverApiKeyService = new ServerApiKeyService()
