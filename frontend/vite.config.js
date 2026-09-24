import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // The backend's CORS allow-list (CLIENT_ORIGIN) expects this exact port.
    port: 5173,
    strictPort: true,
  },
});
