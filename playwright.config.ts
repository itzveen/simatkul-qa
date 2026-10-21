import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright Configuration — SIMATKUL FE
 *
 * Base URL : http://localhost:5173 (Vite dev server)
 * Browser  : Chromium only (sesuai kebutuhan testing)
 */
export default defineConfig({
  testDir: "./e2e",

  /* Jalankan semua test secara paralel */
  fullyParallel: false,

  /* Gagalkan CI kalau ada test.only yang tertinggal */
  forbidOnly: !!process.env.CI,

  /* Retry 1x di CI jika gagal */
  retries: process.env.CI ? 1 : 0,

  /* 1 worker agar tidak bentrok state login */
  workers: 1,

  /* Format laporan: HTML (buka dengan npx playwright show-report) */
  reporter: [["html", { outputFolder: "playwright-report", open: "never" }]],

  use: {
    /* Base URL FE dev server */
    baseURL: "http://localhost:5173",

    /* Simpan trace saat retry */
    trace: "on-first-retry",

    /* Screenshot saat gagal */
    screenshot: "only-on-failure",

    /* Timeout per action */
    actionTimeout: 10_000,
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  /* Jalankan FE dev server otomatis sebelum test */
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: true,
    timeout: 30_000,
  },
});
