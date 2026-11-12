import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright Configuration — SIMATKUL FE
 *
 * Base URL : http://localhost:5173 (Vite dev server)
 * Browser  : Chromium only (sesuai kebutuhan testing)
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 90_000,

  /* Jalankan semua test secara paralel */
  fullyParallel: false,

  /* Gagalkan CI kalau ada test.only yang tertinggal */
  forbidOnly: true,

  /* Retry 1x di CI jika gagal */
  retries: process.env.CI ? 1 : 0,

  /* 1 worker agar tidak bentrok state login */
  workers: 1,

  /* Format laporan: HTML (buka dengan npx playwright show-report) */
  reporter: [["list"], ["html", { outputFolder: "playwright-report", open: "never" }], ["json", { outputFile: "test-results/results.json" }]],

  use: {
    /* Base URL FE dev server */
    baseURL: process.env.BASE_URL || "http://localhost:5173",

    /* Simpan trace saat retry */
    trace: "on",

    /* Screenshot di akhir setiap test (untuk bukti weekly report) */
    screenshot: "on",

    /* Rekam video setiap test (untuk bukti weekly report) */
    video: "on",

    /* Timeout per action */
    actionTimeout: 10_000,
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  // Repo QA tidak memiliki script dev. Server opsional harus ditentukan eksplisit.
  webServer: process.env.FE_DIR ? {
    command: process.env.FE_COMMAND || "npm run dev -- --host 127.0.0.1 --port 5173 --strictPort",
    cwd: process.env.FE_DIR,
    url: process.env.BASE_URL || "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  } : undefined,
});
