// metro.config.js
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { getDefaultConfig } = require('expo/metro-config');

// metro-config 0.83+ uses Array.prototype.toReversed (Node 20+).
// Polyfill for environments still on Node 18.
if (!Array.prototype.toReversed) {
  // eslint-disable-next-line no-extend-native
  Array.prototype.toReversed = function () {
    return [...this].reverse();
  };
}

const config = getDefaultConfig(__dirname);

module.exports = config;
