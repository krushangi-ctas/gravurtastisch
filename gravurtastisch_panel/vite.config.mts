import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgrPlugin from "vite-plugin-svgr";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      jsxImportSource: "@emotion/react",
    }),
    tsconfigPaths({
      parseNative: true,
    }),
    svgrPlugin(),
    {
      name: "custom-hmr-control",
      apply: "serve",
      handleHotUpdate({ file, server }) {
        if (file.includes("src/configs/") || file.includes("src/app/configs/")) {
          server.ws.send({
            type: "full-reload",
          });
          return [];
        }
      },
    },
    tailwindcss(),
  ],
  build: {
    outDir: "dist",
    target: "esnext",
    minify: "esbuild",
    cssCodeSplit: true,
    chunkSizeWarningLimit: 2500,
    rollupOptions: {
      treeshake: false,
    },
  },
  server: {
    host: "0.0.0.0",
    open: true,
    strictPort: false,
    port: 7052,
    allowedHosts: ["panel.reviewsnapp.com", "panel.gravurstastich.com", "localhost"],
  },
  define: {
    "import.meta.env.VITE_PORT": JSON.stringify(process.env.PORT || 7052),
    global: "window",
  },
  resolve: {
    alias: {
      "src": path.resolve(__dirname, "./src"),
      "@": path.resolve(__dirname, "./src"),
      "@fuse": path.resolve(__dirname, "./src/@fuse"),
      "@auth": path.resolve(__dirname, "./src/@auth"),
      "@history": path.resolve(__dirname, "./src/@history"),
      "@lodash": path.resolve(__dirname, "./src/@lodash"),
      "@mock-api": path.resolve(__dirname, "./src/@mock-api"),
      "@mock-utils": path.resolve(__dirname, "./src/@mock-utils"),
      "@schema": path.resolve(__dirname, "./src/@schema"),
      "app/store": path.resolve(__dirname, "./src/app/store"),
      "app/shared-components": path.resolve(__dirname, "./src/app/shared-components"),
      "app/configs": path.resolve(__dirname, "./src/configs"),
      "app/theme-layouts": path.resolve(__dirname, "./src/components/theme-layouts"),
      "app/AppContext": path.resolve(__dirname, "./src/contexts/AppContext"),
    },
  },
  optimizeDeps: {
    include: [
      "@mui/icons-material",
      "@mui/material",
      "@mui/base",
      "@mui/styles",
      "@mui/system",
      "@mui/utils",
      "@emotion/cache",
      "@emotion/react",
      "@emotion/styled",
      "date-fns",
      "lodash",
    ],
    exclude: [],
    esbuildOptions: {
      loader: {
        ".js": "jsx",
      },
    },
  },
});
