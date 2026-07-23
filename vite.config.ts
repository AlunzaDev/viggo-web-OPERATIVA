import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  const devProxyTarget =
    env.VITE_DEV_PROXY_TARGET ||
    env.VITE_DEV_API_URL ||
    "http://localhost:3000";

  return {
    plugins: [react()],
    server: {
      port: Number(env.VITE_DEV_PORT || 3002),
      strictPort: true,
      proxy: {
        "/api": {
          target: devProxyTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    preview: {
      port: Number(env.VITE_DEV_PORT || 3002),
      strictPort: true,
    },
  };
})
