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
          // Match exact react packages using node_modules path segments
          if (
            id.includes("/node_modules/react/") ||
            id.includes("/node_modules/react-dom/") ||
            id.includes("/node_modules/react-router") ||
            id.includes("/node_modules/scheduler/") ||
            id.includes("/node_modules/next-themes/")
          ) return "vendor-react";
          if (id.includes("/@supabase/") || id.includes("/node_modules/@supabase/")) return "vendor-supabase";
          if (id.includes("/node_modules/leaflet/") || id.includes("/node_modules/react-leaflet/")) return "vendor-maps";
          if (id.includes("/@radix-ui/") || id.includes("/node_modules/@radix-ui/")) return "vendor-ui";
          return "vendor";
        },
      },
    },
  },
}));
