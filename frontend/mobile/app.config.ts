const APP_NAME = 'NgoenSai';
const APP_SLUG = 'ngoensai';
const APP_SCHEME = 'ngoensai';
const BUNDLE_ID = 'com.ngoensai.app';
const PACKAGE_NAME = 'com.ngoensai.app';

export default {
  name: APP_NAME,
  slug: APP_SLUG,
  scheme: APP_SCHEME,
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  userInterfaceStyle: 'light',
  splash: {
    image: './assets/images/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#1A8CFF',
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    bundleIdentifier: BUNDLE_ID,
    supportsTablet: true,
    infoPlist: {
      NSCameraUsageDescription: 'Camera is used to scan QR codes for pickup verification and to take recipient photos.',
      NSPhotoLibraryUsageDescription: 'Photo library access is used to upload receipt images.',
    },
    associatedDomains: [`applinks:${APP_SLUG}.com`],
  },
  android: {
    package: PACKAGE_NAME,
    adaptiveIcon: {
      foregroundImage: './assets/images/adaptive-icon.png',
      backgroundColor: '#1A8CFF',
    },
    intentFilters: [
      {
        action: 'VIEW',
        autoVerify: true,
        data: [{ scheme: APP_SCHEME, host: '*', pathPrefix: '/' }],
        category: ['BROWSABLE', 'DEFAULT'],
      },
    ],
  },
  web: {
    favicon: './assets/images/favicon.png',
    bundler: 'metro',
  },
  plugins: [
    'expo-notifications',
    'expo-secure-store',
    [
      'expo-camera',
      {
        cameraPermission: 'Camera is used to scan QR codes for pickup verification and to take recipient photos.',
      },
    ],
    'expo-local-authentication',
  ],
  extra: {
    eas: {
      projectId: 'your-eas-project-id',
    },
  },
};
