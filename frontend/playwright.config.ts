import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  timeout: 60000,
  retries: 0,
  webServer: process.env.CI
    ? {
        command: "npm run preview -- --port 4173",
        url: "http://127.0.0.1:4173",
        timeout: 30000,
      }
    : undefined,
  use: {
    baseURL: process.env.TERRAINX_BASE_URL ?? "http://127.0.0.1:5173",
    channel: process.env.TERRAINX_BROWSER_CHANNEL ?? "chrome",
    headless: true,
    viewport: { width: 1568, height: 1003 },
    screenshot: "only-on-failure",
    launchOptions: {
      args: ["--enable-unsafe-swiftshader", "--disable-dev-shm-usage"],
    },
  },
  reporter: [["list"]],
  outputDir: "../artifacts/qa/test-results",
});
