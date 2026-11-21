import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        index: fileURLToPath(new URL("./index.html", import.meta.url)),
        "report-preview": fileURLToPath(new URL("./report-preview.html", import.meta.url)),
      },
    },
  },
});
