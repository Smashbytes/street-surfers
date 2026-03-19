import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("react-dom") || id.includes("react-router") || id.includes("react/")) return "vendor-react";
          if (id.includes("@supabase")) return "vendor-supabase";
          if (id.includes("leaflet") || id.includes("react-leaflet")) return "vendor-maps";
          if (id.includes("@radix-ui")) return "vendor-ui";
          return "vendor";
        },
      },
    },
  },
}));
