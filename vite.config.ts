import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

const INDIGO_PROXY_PREFIX = "/indigo-proxy";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const indigoProxyTarget = env.INDIGO_PROXY_TARGET || "http://localhost:8001";

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      port: 5173,
      proxy: {
        [INDIGO_PROXY_PREFIX]: {
          target: indigoProxyTarget,
          changeOrigin: true,
          secure: false,
          rewrite: (pathValue) =>
            pathValue.startsWith(INDIGO_PROXY_PREFIX)
              ? pathValue.slice(INDIGO_PROXY_PREFIX.length)
              : pathValue,
        },
      },
    },
  };
});
