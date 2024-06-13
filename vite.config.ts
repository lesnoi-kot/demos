import path from "node:path";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { visualizer } from "rollup-plugin-visualizer";
import solid from "vite-plugin-solid";

const root = "./src";
const resolveRoot = (e: string) => path.resolve(__dirname, root, e);

export default defineConfig({
  root,
  publicDir: path.resolve(__dirname, "public"),
  appType: "mpa",
  plugins: [tsconfigPaths(), solid(), visualizer()],
  build: {
    rollupOptions: {
      input: {
        main: resolveRoot("index.html"),
        hanoi: resolveRoot("pages/hanoi/index.html"),
      },
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/solid-js")) {
            return "solid-js";
          }

          if (id.includes("node_modules/three")) {
            return "three";
          }

          if (id.includes("node_modules")) {
            return "vendor";
          }
        },
      },
    },
    outDir: path.resolve(__dirname, "dist"),
    emptyOutDir: true,
  },
});
