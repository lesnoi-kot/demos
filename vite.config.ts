import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import solid from "vite-plugin-solid";

export default defineConfig({
  appType: "mpa",
  plugins: [tsconfigPaths(), solid()],
  build: {
    rollupOptions: {
      input: {
        main: "./index.html",
        hanoi: "./src/pages/hanoi/index.html",
      },
    },
    emptyOutDir: true,
  },
});
