import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/integration.test.ts"],
    reporters: ["./vitest-table-reporter.ts"],
    testTimeout: 120000, // 2 minutes for API calls
    retry: 0, // Don't retry integration tests
  },
});
