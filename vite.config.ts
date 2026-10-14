import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

const repoName = "shindara-style-hub";
const isGitHubPages = process.env.GITHUB_PAGES === "true";

// https://vitejs.dev/config/
export default defineConfig(() => ({
  base: isGitHubPages ? `/${repoName}/` : "/",
  server: {
    host: "::",
    port: 8080,
    // Dev only: the API runs separately (npm run dev:api, port 3000), so
    // forward same-origin /api + /uploads calls to it. Production serves
    // both from one process, so no proxy is needed there.
    proxy: {
      "/api": {
        target: process.env.API_PROXY ?? "http://127.0.0.1:3000",
        changeOrigin: true,
      },
      "/uploads": {
        target: process.env.API_PROXY ?? "http://127.0.0.1:3000",
        changeOrigin: true,
      },
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
