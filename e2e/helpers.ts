import { Page } from "@playwright/test";

export const ADMIN_CREDENTIALS = {
  username: "admin",
  password: "admin123",
};

/**
 * Login sebagai Admin melalui UI.
 */
export async function loginAsAdmin(page: Page) {
  await page.goto("/login");
  await page.getByPlaceholder(/masukkan username|username/i).fill(ADMIN_CREDENTIALS.username);
  await page.getByPlaceholder(/masukkan password|password/i).fill(ADMIN_CREDENTIALS.password);
  // Gunakan exact: true agar tidak bentrok dengan 'Login as Guest'
  await page.getByRole("button", { name: "Login", exact: true }).click();
  await page.waitForURL("**/master-data");
}

/**
 * Bersihkan sesi (token & cookies).
 */
export async function clearSession(page: Page) {
  await page.context().clearCookies();
  await page.goto("/login");
  await page.evaluate(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {}
  });
}
