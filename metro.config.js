const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add .fx as valid source extension
config.resolver.sourceExts.push('fx');

// Add support for Lottie files
config.resolver.assetExts.push('lottie');

module.exports = config;