import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  build: {
    outDir: "dist",
    emptyOutDir: false, // 🔥 중요: 앞 빌드 결과 유지

    lib: {
      entry: resolve(__dirname, "src/content.ts"),
      name: "ContentScript",
      formats: ["iife"],
      fileName: () => "content.js",
    },

    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
});
