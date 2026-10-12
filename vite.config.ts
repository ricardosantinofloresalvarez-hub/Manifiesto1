import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { applySeoToHtml } from "./shared/seo";

const seoHtmlPlugin = {
  name: "route-seo-html",
  transformIndexHtml: {
    order: "pre" as const,
    handler(html: string, context: { path: string }) {
      const pathname = new URL(context.path, "http://localhost").pathname;
      return applySeoToHtml(html, pathname);
    },
  },
  configureServer(server: {
    middlewares: {
      use: (handler: (req: { url?: string }, res: { setHeader: (name: string, value: string) => void }, next: () => void) => void) => void;
    };
  }) {
    server.middlewares.use((req, res, next) => {
      const pathname = new URL(req.url || "/", "http://localhost").pathname;
      if (
        pathname === "/verify" ||
        /^\/(found|label)\/[^/]+\/?$/.test(pathname)
      ) {
        res.setHeader("X-Robots-Tag", "noindex");
      }
      next();
    });
  },
};

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    seoHtmlPlugin,
    // ❌ cartographer DESACTIVADO (causaba traverse is not a function)
  ],

  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },

  root: path.resolve(import.meta.dirname, "client"),

  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },

  server: {
    host: true,
    port: 5173,
    strictPort: true,
    allowedHosts: [
      ".replit.dev",
      ".worf.replit.dev",
    ],
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },

});
