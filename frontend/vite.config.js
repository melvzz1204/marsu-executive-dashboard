import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

const reactPath = fileURLToPath(
  new URL("./node_modules/react", import.meta.url),
);
const reactDomPath = fileURLToPath(
  new URL("./node_modules/react-dom", import.meta.url),
);

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    dedupe: ["react", "react-dom"],
    alias: {
      react: reactPath,
      "react-dom": reactDomPath,
    },
  },
  optimizeDeps: {
    include: ["react", "react-dom", "framer-motion"],
    force: true,
  },
});
