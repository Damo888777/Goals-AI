// Database configuration for Expo Go compatibility
export const DB_CONFIG = {
  // Set to false for Expo Go, true for development builds with native modules
  USE_WATERMELON: true,
  
  // Mock data storage for Expo Go (uses AsyncStorage)
  MOCK_STORAGE_KEY: '@goalz_ai_mock_data',
}

export const isExpoGo = () => {
  // Check if running in Expo Go environment
  return !DB_CONFIG.USE_WATERMELON;
}
