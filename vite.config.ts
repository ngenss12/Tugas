import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

const worldMonitorProxy = {
  target: "https://worldmonitor.app",
  changeOrigin: true,
  secure: true,
};

const newsApiProxy = {
  target: "https://newsapi.org",
  changeOrigin: true,
  secure: true,
};

const gNewsProxy = {
  target: "https://gnews.io",
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
      "/api/newsapi": {
        ...newsApiProxy,
        rewrite: (path) => path.replace(/^\/api\/newsapi/, ""),
      },
      "/api/gnews": {
        ...gNewsProxy,
        rewrite: (path) => path.replace(/^\/api\/gnews/, ""),
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
      "/api/newsapi": {
        ...newsApiProxy,
        rewrite: (path) => path.replace(/^\/api\/newsapi/, ""),
      },
      "/api/gnews": {
        ...gNewsProxy,
        rewrite: (path) => path.replace(/^\/api\/gnews/, ""),
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
