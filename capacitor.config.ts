import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.tofik.store',
  appName: 'Tofik Store',
  // The bundled Vite production build is copied into the native project.
  // No remote server URL: the app ships with its own assets.
  webDir: 'dist',
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
