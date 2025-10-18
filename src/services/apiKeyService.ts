import { supabase } from '../lib/supabase'

interface ApiKeys {
  openai_api_key?: string
  google_api_key?: string
  revenuecat_api_key?: string
}

class ApiKeyService {
  private cachedKeys: ApiKeys | null = null
  private cacheExpiry: number = 0
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  // Get API keys from Supabase Edge Function
  async getApiKeys(): Promise<ApiKeys> {
    // Return cached keys if still valid
    if (this.cachedKeys && Date.now() < this.cacheExpiry) {
      return this.cachedKeys
    }

    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }

      // Get current session for authentication
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('User not authenticated')
      }

      // Call the edge function with GET method
      const { data, error } = await supabase.functions.invoke('get-api-keys', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      if (error) {
        throw new Error(`Failed to fetch API keys: ${error.message}`)
      }

      // Cache the keys
      this.cachedKeys = data as ApiKeys
      this.cacheExpiry = Date.now() + this.CACHE_DURATION

      return this.cachedKeys
    } catch (error) {
      console.error('Error fetching API keys:', error)
      throw error
    }
  }

  // Get OpenAI API key
  async getOpenAIApiKey(): Promise<string | null> {
    try {
      const keys = await this.getApiKeys()
      return keys.openai_api_key || null
    } catch (error) {
      console.error('Error getting OpenAI API key:', error)
      return null
    }
  }

  // Get Google API key
  async getGoogleApiKey(): Promise<string | null> {
    try {
      const keys = await this.getApiKeys()
      return keys.google_api_key || null
    } catch (error) {
      console.error('Error getting Google API key:', error)
      return null
    }
  }

  // Get RevenueCat API key
  async getRevenueCatApiKey(): Promise<string | null> {
    try {
      const keys = await this.getApiKeys()
      return keys.revenuecat_api_key || null
    } catch (error) {
      console.error('Error getting RevenueCat API key:', error)
      return null
    }
  }

  // Clear cache (useful for testing or when keys are updated)
  clearCache(): void {
    this.cachedKeys = null
    this.cacheExpiry = 0
  }

  // Check if API keys are available
  async hasApiKeys(): Promise<{ hasOpenAI: boolean; hasGoogle: boolean; hasRevenueCat: boolean }> {
    try {
      const keys = await this.getApiKeys()
      return {
        hasOpenAI: !!keys.openai_api_key,
        hasGoogle: !!keys.google_api_key,
        hasRevenueCat: !!keys.revenuecat_api_key,
      }
    } catch (error) {
      console.error('Error checking API keys availability:', error)
      return {
        hasOpenAI: false,
        hasGoogle: false,
        hasRevenueCat: false,
      }
    }
  }
}

// Export singleton instance
export const apiKeyService = new ApiKeyService()

// React import for the hook
import { useState } from 'react'

// Hook for React components
export const useApiKeys = () => {
  const [keys, setKeys] = useState<ApiKeys | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchKeys = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const fetchedKeys = await apiKeyService.getApiKeys()
      setKeys(fetchedKeys)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch API keys')
    } finally {
      setIsLoading(false)
    }
  }

  return {
    keys,
    isLoading,
    error,
    fetchKeys,
    hasOpenAI: !!keys?.openai_api_key,
    hasGoogle: !!keys?.google_api_key,
    hasRevenueCat: !!keys?.revenuecat_api_key,
  }
}
