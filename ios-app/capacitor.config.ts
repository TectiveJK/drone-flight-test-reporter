import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tective.droneflighttestreporter.ios',
  appName: 'Drone Flight Test Reporter',
  webDir: 'dist',
  bundledWebRuntime: false,
  ios: {
    contentInset: 'automatic'
  }
};

export default config;
