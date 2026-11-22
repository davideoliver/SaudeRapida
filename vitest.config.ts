import path from "node:path";
import { defineConfig } from "vitest/config";

// O alias "@" precisa ser igual ao do tsconfig.json do Next ("@/*" -> raiz do projeto),
// senão os testes não conseguem resolver imports como "@/types/unidade".
export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname) },
  },
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts"],
  },
});
