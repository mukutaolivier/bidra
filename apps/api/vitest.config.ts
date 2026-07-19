import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  root: path.resolve(__dirname),
  test: {
    include: ["src/**/*.spec.ts"],
    environment: "node",
    globals: false,
    passWithNoTests: false,
  },
});
