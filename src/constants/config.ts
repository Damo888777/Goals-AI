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

// API Configuration
export const API_CONFIG = {
  // Base URL for API endpoints
  baseUrl: isDevelopment ? getDevServerUrl() : '',
  
  // API endpoints
  endpoints: {
    whisper: '/api/whisper',
    gemini: '/api/gemini',
    generateImage: '/api/generate-image',
  },
  
  // Helper to get full API URL
  getApiUrl: (endpoint: string): string => {
    const baseUrl = API_CONFIG.baseUrl || '';
    return `${baseUrl}${endpoint}`;
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
