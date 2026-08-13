import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import type { ProxyOptions } from 'vite'

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
  const meshCentralProxyTarget =
    env.VITE_MESHCENTRAL_PROXY_TARGET ||
    "https://192.168.200.39:8086";
  const meshCentralProxyOrigin = new URL(meshCentralProxyTarget).origin;

  const meshCentralProxy: ProxyOptions = {
    target: meshCentralProxyTarget,
    changeOrigin: true,
    secure: false,
    ws: true,
    configure: (proxy) => {
      proxy.on("proxyReq", (proxyReq) => {
        proxyReq.setHeader("origin", meshCentralProxyOrigin);
        proxyReq.setHeader("referer", `${meshCentralProxyOrigin}/`);
      });
      proxy.on("proxyReqWs", (proxyReq) => {
        proxyReq.setHeader("origin", meshCentralProxyOrigin);
        proxyReq.setHeader("referer", `${meshCentralProxyOrigin}/`);
      });
      proxy.on("proxyRes", (proxyRes) => {
        delete proxyRes.headers["x-frame-options"];
        delete proxyRes.headers["content-security-policy"];
        delete proxyRes.headers["content-security-policy-report-only"];

        const cookies = proxyRes.headers["set-cookie"];
        if (Array.isArray(cookies)) {
          proxyRes.headers["set-cookie"] = cookies.map((cookie) =>
            cookie
              .replace(/;\s*secure/gi, "")
              .replace(/;\s*samesite=(strict|lax|none)/gi, "; SameSite=Lax")
              .replace(/;\s*domain=[^;]+/gi, ""),
          );
        }
      });
    },
  };

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
        "/meshcentral": {
          ...meshCentralProxy,
          rewrite: (path: string) => path.replace(/^\/meshcentral/, "") || "/",
        },
        "/commander.ashx": meshCentralProxy,
        "/control.ashx": meshCentralProxy,
        "/control-redirect.ashx": meshCentralProxy,
        "/meshrelay.ashx": meshCentralProxy,
        "/meshdesktopmultiplex.ashx": meshCentralProxy,
        "/relay.ashx": meshCentralProxy,
        "/webrelay.ashx": meshCentralProxy,
        "/ipkvm.ashx": meshCentralProxy,
        "/mstscrelay.ashx": meshCentralProxy,
        "/sshrelay.ashx": meshCentralProxy,
        "/sshterminalrelay.ashx": meshCentralProxy,
        "/sshfilesrelay.ashx": meshCentralProxy,
        "/devicefile.ashx": meshCentralProxy,
        "/devicepowerevents.ashx": meshCentralProxy,
        "/downloadfile.ashx": meshCentralProxy,
        "/uploadfile.ashx": meshCentralProxy,
        "/uploadfilebatch.ashx": meshCentralProxy,
        "/uploadnodefile.ashx": meshCentralProxy,
        "/serverpic.ashx": meshCentralProxy,
        "/userimage.ashx": meshCentralProxy,
        "/refresh.ashx": meshCentralProxy,
        "/meshsettings.ashx": meshCentralProxy,
        "/meshuser.ashx": meshCentralProxy,
        "/meshagents.ashx": meshCentralProxy,
        "/meshagents": meshCentralProxy,
        "/meshsettings": meshCentralProxy,
        "/styles": meshCentralProxy,
        "/scripts": meshCentralProxy,
        "/js": meshCentralProxy,
        "/images": meshCentralProxy,
        "/sounds": meshCentralProxy,
        "/novnc": meshCentralProxy,
        "/mstsc": meshCentralProxy,
        "/favicon.ico": meshCentralProxy,
        "/MeshServerRootCert.cer": meshCentralProxy,
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
