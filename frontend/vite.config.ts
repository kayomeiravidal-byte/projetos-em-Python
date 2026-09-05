import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // host.docker.internal: permite testar o dev server a partir de outro
  // container Docker (ex.: navegador headless rodando isolado).
  server: { port: 5173, allowedHosts: ["host.docker.internal"] },
});
