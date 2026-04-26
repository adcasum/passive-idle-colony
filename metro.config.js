const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Honor package.json `exports` field — required by @metaplex-foundation/umi
// subpath imports (e.g. "@metaplex-foundation/umi/serializers").
config.resolver.unstable_enablePackageExports = true;
config.resolver.unstable_conditionNames = ["require", "react-native", "default"];

config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules || {}),
  crypto: require.resolve("expo-crypto"),
  buffer: require.resolve("buffer"),
};

module.exports = withNativeWind(config, { input: "./global.css" });
