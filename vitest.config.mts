import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  test: { environment: "node" },
  resolve: {
    // Faz o import "@/..." funcionar nos testes, igual ao Next.
    alias: { "@": fileURLToPath(new URL("./", import.meta.url)) },
  },
});
