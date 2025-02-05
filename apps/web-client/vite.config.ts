import { reactRouter } from "@react-router/dev/vite";
import { cloudflareDevProxy } from "@react-router/dev/vite/cloudflare";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { getLoadContext } from "./load-context";

export default defineConfig(({ isSsrBuild }) => ({
  css: {
    transformer: "lightningcss",
    lightningcss: {
      targets: {
        chrome: 100,
      },
    },
  },
  build: {
    rollupOptions: isSsrBuild
      ? {
          input: "./workers/app.ts",
        }
      : undefined,
    cssMinify: "lightningcss",
  },
  ssr: {
    target: "webworker",
    noExternal: true,
    resolve: {
      conditions: ["workerd", "browser"],
    },
    optimizeDeps: {
      include: [
        "react",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "react-dom",
        "react-dom/server",
        "react-router",
      ],
      exclude: ["@editorjs/editorjs"],
    },
  },
  plugins: [
    cloudflareDevProxy({
      getLoadContext,
    }),
    tailwindcss(),
    reactRouter(),
    tsconfigPaths(),
  ],
}));
