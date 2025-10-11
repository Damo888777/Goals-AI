const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Füge .fx als gültige Source-Extension hinzu
config.resolver.sourceExts.push('fx');

// Wende NativeWind Config an
module.exports = withNativeWind(config, { input: './global.css' });