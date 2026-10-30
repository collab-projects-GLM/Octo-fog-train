const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const { buildPalette } = require('./scripts/build-palette');

// Keep src/style/palette.generated.ts in step with src/style/brand.css.
buildPalette();

const config = getDefaultConfig(__dirname);

// 3D models for the map puck (`require("…/avatar.glb")`).
config.resolver.assetExts.push('glb');

// VRM avatars (`require("…/avatar.vrm")`), streamed into the WebView viewer.
config.resolver.assetExts.push('vrm');

module.exports = withNativeWind(config, { input: './src/style/global.css' });
