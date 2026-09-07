import { cloudflare } from "@cloudflare/vite-plugin";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import path from "node:path";

export default defineConfig({
  plugins: [react(), cloudflare()],
  resolve: {
    alias: {
      "@components": path.resolve(import.meta.dirname, "src/components"),
      "@shared": path.resolve(import.meta.dirname, "src/shared"),
      "@styles": path.resolve(import.meta.dirname, "src/styles"),
    },
  },
});
