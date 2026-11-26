import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    env: {
      DATABASE_URL:
        "postgresql://postgres:password@localhost:5432/conduit_test",
      JWT_SECRET: "test-jwt-secret-must-be-at-least-32-chars-long",
    },
    globalSetup: "./test/global-setup.ts",
    fileParallelism: false,
  },
});
