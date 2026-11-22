import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.tofik.store',
  appName: 'Tofik Store',
  // Vite's production build, copied into the native project for packaging.
  // The WebView loads server.url at runtime.
  webDir: 'dist',
  // Deliberate production shell: web deploys appear without shipping a new APK.
  // Capacitor normally documents server.url for live-reload development.
  server: {
    url: 'https://tofik.store',
    cleartext: false,
  },
  plugins: {
    SystemBars: {
      // The shop is always light, so keep dark status/navigation icons.
      style: 'LIGHT',
      insetsHandling: 'css',
      initialViewportFitValueHint: 'cover',
    },
  },
}

export default config
