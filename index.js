import 'react-native-gesture-handler';
import { registerRootComponent } from 'expo';
import AsyncStorage from '@react-native-async-storage/async-storage';

import App from './App';

// Polyfill for expo-router navigation state persistence
const mockStorage = {
  setItem: async () => Promise.resolve(),
  getItem: async () => Promise.resolve(null),
  removeItem: async () => Promise.resolve(),
  getAllKeys: async () => Promise.resolve([]),
  multiGet: async () => Promise.resolve([]),
  multiSet: async () => Promise.resolve(),
  multiRemove: async () => Promise.resolve(),
};

// Ensure AsyncStorage is available globally before expo-router initializes
if (!global.AsyncStorage) {
  global.AsyncStorage = AsyncStorage;
}

// Enhanced polyfill for iOS native modules to prevent crashes
if (typeof global.setObjectForKey === 'undefined') {
  global.setObjectForKey = () => {};
}

// Polyfill UserDefaults iOS module
if (typeof global.UserDefaults === 'undefined') {
  global.UserDefaults = {
    setObjectForKey: () => {},
    objectForKey: () => null,
    removeObjectForKey: () => {},
  };
}

// Polyfill widget native modules
if (typeof global.WidgetModule === 'undefined') {
  global.WidgetModule = {
    updateWidgetData: () => Promise.resolve(),
    reloadAllTimelines: () => Promise.resolve(),
  };
}

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
