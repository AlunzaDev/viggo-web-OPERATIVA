import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

const getManualChunk = (id: string) => {
  if (!id.includes('node_modules')) return undefined;

  if (
    id.includes('react-dom') ||
    id.includes('react-router') ||
    id.includes('/react/')
  ) {
    return 'vendor-react';
  }

  if (id.includes('leaflet') || id.includes('react-leaflet')) {
    return 'vendor-maps';
  }

  if (id.includes('sweetalert2')) {
    return 'vendor-alerts';
  }

  if (id.includes('react-hot-toast')) {
    return 'vendor-toast';
  }

  if (id.includes('framer-motion')) {
    return 'vendor-motion';
  }

  if (id.includes('axios')) {
    return 'vendor-network';
  }

  if (id.includes('react-icons') || id.includes('lucide-react')) {
    return 'vendor-icons';
  }

  if (id.includes('@react-pdf/renderer')) {
    return 'vendor-pdf';
  }

  if (id.includes('exceljs') || id.includes('file-saver')) {
    return 'vendor-export';
  }

  if (id.includes('socket.io-client')) {
    return 'vendor-socket';
  }

  return 'vendor-misc';
};

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
    build: {
      chunkSizeWarningLimit: 650,
      rollupOptions: {
        output: {
          manualChunks: getManualChunk,
        },
      },
    },
  };
})
