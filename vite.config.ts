import { defineConfig } from "vite";
import { resolve } from "path";
import fs from "fs";

export default defineConfig({
  build: {
    outDir: "dist",
    emptyOutDir: true,

    rollupOptions: {
      input: {
        background: resolve(__dirname, "src/background.ts"),
        popup: resolve(__dirname, "src/popup/index.html"),
      },
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]",
      },
    },
  },

  plugins: [
    {
      name: "copy-manifest",
      closeBundle() {
        fs.copyFileSync(
          resolve(__dirname, "src/manifest.json"),
          resolve(__dirname, "dist/manifest.json"),
        );
      },
    },
    {
      name: "copy-icons",
      closeBundle() {
        const srcDir = resolve(__dirname, "src/icons");
        const distDir = resolve(__dirname, "dist/icons");

        if (!fs.existsSync(srcDir)) return;

        fs.mkdirSync(distDir, { recursive: true });
        for (const file of fs.readdirSync(srcDir)) {
          fs.copyFileSync(resolve(srcDir, file), resolve(distDir, file));
        }
      },
    },
    {
      name: "fix-popup-path",
      closeBundle() {
        const from = resolve(__dirname, "dist/src/popup");
        const to = resolve(__dirname, "dist/popup");

        if (!fs.existsSync(from)) return;

        fs.mkdirSync(to, { recursive: true });

        for (const file of fs.readdirSync(from)) {
          fs.renameSync(resolve(from, file), resolve(to, file));
        }

        fs.rmSync(resolve(__dirname, "dist/src"), {
          recursive: true,
          force: true,
        });
      },
    },
  ],
});
