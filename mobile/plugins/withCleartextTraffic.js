const { withAndroidManifest } = require('@expo/config-plugins');

/**
 * Expo Config Plugin to safely enable cleartext HTTP traffic on Android
 * for local LAN development and testing (e.g. http://192.168.1.45:5000).
 */
module.exports = function withCleartextTraffic(config) {
  return withAndroidManifest(config, (config) => {
    const androidManifest = config.modResults.manifest;
    if (androidManifest && androidManifest.application && androidManifest.application[0]) {
      androidManifest.application[0].$['android:usesCleartextTraffic'] = 'true';
    }
    return config;
  });
};
