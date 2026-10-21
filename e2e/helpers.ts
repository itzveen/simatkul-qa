/**
 * Helpers & konstanta yang dipakai bersama semua test SIMATKUL.
 */

export const BASE_URL = "http://localhost:5173";

export const ADMIN_CREDENTIALS = {
  username: "admin",
  password: "admin123",
};

/**
 * Login sebagai admin dan tunggu redirect ke /master-data.
 * Panggil di `test.beforeEach` untuk test yang butuh sesi login.
 */
export async function loginAsAdmin(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByPlaceholder(/username/i).fill(ADMIN_CREDENTIALS.username);
  await page.getByPlaceholder(/password/i).fill(ADMIN_CREDENTIALS.password);
  await page.getByRole("button", { name: /login/i }).click();
  await page.waitForURL("**/master-data");
}

/**
 * Hapus semua storage (localStorage + cookies) untuk simulasi guest/logout.
 */
export async function clearSession(page: import("@playwright/test").Page) {
  await page.context().clearCookies();
  await page.evaluate(() => localStorage.clear());
}
