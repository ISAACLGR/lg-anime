const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const config = getDefaultConfig(__dirname);

// Add NativeWind cache to watchFolders
config.watchFolders = [
  ...(config.watchFolders || []),
  path.resolve(__dirname, "node_modules/react-native-css-interop/.cache"),
];

module.exports = withNativeWind(config, {
  input: "./global.css",
  forceWriteFileSystem: true,
});
