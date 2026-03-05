import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

const worldMonitorProxy = {
  target: "https://worldmonitor.app",
  changeOrigin: true,
  secure: true,
};

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    proxy: {
      "/api/worldmonitor/news": {
        ...worldMonitorProxy,
        rewrite: (path) =>
          path.replace(/^\/api\/worldmonitor\/news/, "/api/news/v1/list-feed-digest"),
      },
      "/api/worldmonitor/youtube/live": {
        ...worldMonitorProxy,
        rewrite: (path) =>
          path.replace(/^\/api\/worldmonitor\/youtube\/live/, "/api/youtube/live"),
      },
    },
  },
  preview: {
    proxy: {
      "/api/worldmonitor/news": {
        ...worldMonitorProxy,
        rewrite: (path) =>
          path.replace(/^\/api\/worldmonitor\/news/, "/api/news/v1/list-feed-digest"),
      },
      "/api/worldmonitor/youtube/live": {
        ...worldMonitorProxy,
        rewrite: (path) =>
          path.replace(/^\/api\/worldmonitor\/youtube\/live/, "/api/youtube/live"),
      },
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
