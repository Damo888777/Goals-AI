const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add .fx as valid source extension
config.resolver.sourceExts.push('fx');

module.exports = config;