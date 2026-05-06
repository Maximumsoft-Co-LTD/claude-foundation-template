import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts", "test/**/*.test.ts"],
    pool: "threads",
    poolOptions: { threads: { singleThread: true } },
  },
});
