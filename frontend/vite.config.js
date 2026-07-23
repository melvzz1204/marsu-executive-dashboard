import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // Proxies any request starting with /api to your backend server
      "/api": {
        target: "http://localhost:5000", // Change 5000 to your actual backend server port (e.g., 8000 for Laravel/PHP, 5000/3000 for Express)
        changeOrigin: true,
        secure: false,
      },
    },
  },
});