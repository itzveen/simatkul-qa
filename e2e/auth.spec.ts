import { test, expect } from "@playwright/test";
import { loginAsAdmin, clearSession } from "./helpers";

test.describe("Autentikasi", () => {
  // ── TC-AUTO-AUTH-001 ─────────────────────────────────────────
  test("TC-AUTO-AUTH-001 | Login berhasil redirect ke /master-data", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByPlaceholder(/masukkan username|username/i).fill("admin");
    await page.getByPlaceholder(/masukkan password|password/i).fill("admin123");
    await page.getByRole("button", { name: "Login", exact: true }).click();

    await page.waitForURL("**/master-data", { timeout: 15_000 });
    await expect(page).toHaveURL(/\/master-data/);
  });

  // ── TC-AUTO-AUTH-002 ─────────────────────────────────────────
  test("TC-AUTO-AUTH-002 | Akses /master-data tanpa login → redirect /login", async ({
    page,
  }) => {
    await clearSession(page);
    await page.goto("/master-data");
    await expect(page).toHaveURL(/\/login/);
  });

  // ── TC-AUTO-AUTH-004 ─────────────────────────────────────────
  test("TC-AUTO-AUTH-004 | Logout → redirect /login, token bersih", async ({
    page,
  }) => {
    await loginAsAdmin(page);

    const logoutBtn = page.getByRole("button", { name: /logout|keluar/i });
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
    } else {
      await page.locator('[data-testid="user-menu"], .profile-avatar, button:has-text("Admin")').first().click();
      await page.getByRole("button", { name: /logout|keluar/i }).click();
    }

    await expect(page).toHaveURL(/\/login/);

    const token = await page.evaluate(() => localStorage.getItem("simatkul_token"));
    expect(token).toBeNull();
  });

  // ── TC-AUTO-AUTH-005 ─────────────────────────────────────────
  test("TC-AUTO-AUTH-005 | Akses halaman internal setelah logout ditolak", async ({
    page,
  }) => {
    await loginAsAdmin(page);

    const logoutBtn = page.getByRole("button", { name: /logout|keluar/i });
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
    } else {
      await page.locator('[data-testid="user-menu"], .profile-avatar, button:has-text("Admin")').first().click();
      await page.getByRole("button", { name: /logout|keluar/i }).click();
    }
    await expect(page).toHaveURL(/\/login/);

    // Coba paksa akses kembali ke halaman master data setelah logout
    await page.goto("/master-data");

    // Sistem wajib menolak dan tetap melempar ke /login
    await expect(page).toHaveURL(/\/login/);
  });

  // ── TC-AUTO-AUTH-006 ─────────────────────────────────────────
  test("TC-AUTO-AUTH-006 | Login gagal — password salah", async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder(/masukkan username|username/i).fill("admin");
    await page.getByPlaceholder(/masukkan password|password/i).fill("passwordsalah999");
    await page.getByRole("button", { name: "Login", exact: true }).click();

    await expect(page).toHaveURL(/\/login/);

    await expect(
      page.getByText(/login gagal|invalid|salah|gagal/i).first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  // ── TC-AUTO-AUTH-007 ─────────────────────────────────────────
  test("TC-AUTO-AUTH-007 | Login gagal — username kosong", async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder(/masukkan password|password/i).fill("admin123");
    await page.getByRole("button", { name: "Login", exact: true }).click();

    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByText(/username wajib diisi/i)).toBeVisible();
  });

  // ── TC-AUTO-AUTH-008 ─────────────────────────────────────────
  test("TC-AUTO-AUTH-008 | Login gagal — semua field kosong", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "Login", exact: true }).click();

    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByText(/username wajib diisi/i)).toBeVisible();
  });
});
