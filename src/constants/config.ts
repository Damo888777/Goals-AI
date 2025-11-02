import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Detect if we're in development mode
const isDevelopment = __DEV__;

// Get the development server URL from Expo Constants
const getDevServerUrl = (): string | null => {
  if (!isDevelopment) return null;
  
  // In development, Expo provides the manifest with debuggerHost
  const debuggerHost = Constants.expoConfig?.hostUri?.split(':').shift();
  
  if (debuggerHost) {
    // Use the same host as the development server with port 8081 (Metro bundler default)
    return `http://${debuggerHost}:8081`;
  }
  
  // Fallback for local development
  if (Platform.OS === 'ios') {
    return 'http://localhost:8081';
  } else {
    return 'http://10.0.2.2:8081'; // Android emulator
  }
};

// Get Supabase URL from environment
const getProductionBaseUrl = (): string => {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    console.error('❌ EXPO_PUBLIC_SUPABASE_URL not configured');
    return '';
  }
  // Supabase Edge Functions URL format: https://[project-ref].supabase.co/functions/v1
  return `${supabaseUrl}/functions/v1`;
};

// API Configuration
export const API_CONFIG = {
  // Base URL for API endpoints
  baseUrl: isDevelopment ? getDevServerUrl() : getProductionBaseUrl(),
  
  // API endpoints
  endpoints: {
    whisper: '/api/whisper',
    gemini: '/api/gemini',
    generateImage: '/api/generate-image',
    sendNotification: '/api/send-notification',
  },
  
  // Helper to get full API URL
  getApiUrl: (endpoint: string): string => {
    const baseUrl = API_CONFIG.baseUrl || '';
    // In production, convert /api/xxx to /api-xxx for Supabase Edge Functions
    const productionEndpoint = isDevelopment ? endpoint : endpoint.replace('/api/', '/api-');
    return `${baseUrl}${productionEndpoint}`;
  },
};

// Development configuration
export const DEV_CONFIG = {
  isDevelopment,
  enableLogging: isDevelopment,
  debugMode: isDevelopment,
};

// Export for easy access
export const { getApiUrl } = API_CONFIG;
