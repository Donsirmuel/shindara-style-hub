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
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
