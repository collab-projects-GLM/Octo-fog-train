const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// 3D models for the map puck (`require("…/avatar.glb")`).
config.resolver.assetExts.push('glb');

module.exports = withNativeWind(config, { input: './src/style/global.css' });
