import { defineConfig } from "vite"; // Add this import
import react from "@vitejs/plugin-react";

export default defineConfig({
  // Use the imported function
  plugins: [react()],
  base: "/ChatVaani/",
  build: {
    outDir: "../dist",
    assetsDir: "assets",
    emptyOutDir: true,
    rollupOptions: {
      output: {
        assetFileNames: "assets/[name]-[hash][extname]",
        entryFileNames: "assets/[name]-[hash].js",
      },
    },
  },
});
