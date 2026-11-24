import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    env: {
      DATABASE_URL:
        "postgresql://postgres:password@localhost:5432/conduit_test",
    },
    globalSetup: "./test/global-setup.ts",
    fileParallelism: false,
  },
});
