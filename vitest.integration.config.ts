import { defineConfig } from "vitest/config";
import path from "node:path";
export default defineConfig({
  resolve: { alias: { "@": path.resolve("src") } },
  test: {
    include: ["tests/integration/**/*.test.ts"],
    globalSetup: ["tests/integration/setup.ts"],
    fileParallelism: false,
    testTimeout: 30000,
    hookTimeout: 30000,
    env: {
      DATABASE_URL:
        process.env.TEST_DATABASE_URL ||
        "postgresql://postgres:postgres@127.0.0.1:54330/postgres",
      AUTH_SECRET: "test-auth-secret-with-more-than-32-characters",
      AUDIT_SECRET: "test-audit-secret-with-more-than-32-characters",
      PG_POOL_MAX: "1",
    },
  },
});
