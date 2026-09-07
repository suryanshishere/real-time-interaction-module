import { cloudflareTest, readD1Migrations } from "@cloudflare/vitest-pool-workers";
import { defineConfig } from "vitest/config";

const migrations = await readD1Migrations("./migrations");

export default defineConfig({
  plugins: [
    cloudflareTest({
      wrangler: { configPath: "./wrangler.jsonc" },
      miniflare: {
        bindings: {
          GOOGLE_CLIENT_ID: "test-google-client",
          SESSION_SECRET: "test-session-secret-that-is-long-enough-for-hmac",
          TEST_MIGRATIONS: migrations,
        },
      },
    }),
  ],
  test: {
  },
});
