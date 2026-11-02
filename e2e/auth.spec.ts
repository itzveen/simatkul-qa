import { test, expect } from "@playwright/test";
import { loginAsAdmin, clearSession } from "./helpers";

test.describe("Autentikasi", () => {
  // ── TC-PW-AUTH-001 ─────────────────────────────────────────
  test("TC-PW-AUTH-001 | Login Admin dengan kredensial valid", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByPlaceholder(/masukkan username|username/i).fill("admin");
    await page.getByPlaceholder(/masukkan password|password/i).fill("admin123");
    await page.getByRole("button", { name: "Login", exact: true }).click();

    await page.waitForURL("**/master-data", { timeout: 15_000 });
    await expect(page).toHaveURL(/\/master-data/);
  });

  // ── TC-PW-AUTH-002 ─────────────────────────────────────────
  test("TC-PW-AUTH-002 | Login sebagai Guest tanpa JWT", async ({ page }) => {
    await clearSession(page);
    await page.getByRole("button", { name: /login as guest/i }).click();

    await page.waitForURL("**/laporan/dosen", { timeout: 15_000 });
    await expect(page).toHaveURL(/\/laporan\/dosen/);

    const token = await page.evaluate(() => localStorage.getItem("simatkul_token"));
    expect(token).toBeNull();
  });

  // ── TC-PW-AUTH-003 ─────────────────────────────────────────
  test("TC-PW-AUTH-003 | Logout mengakhiri sesi dan hapus token", async ({
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

  // ── TC-PW-AUTH-004 ─────────────────────────────────────────
  test("TC-PW-AUTH-004 | Session Guard memblokir akses langsung tanpa login", async ({
    page,
  }) => {
    await clearSession(page);
    await page.goto("/master-data");
    await expect(page).toHaveURL(/\/login/);
  });

  // ── TC-PW-AUTH-005 ─────────────────────────────────────────
  test("TC-PW-AUTH-005 | Akses halaman internal setelah logout ditolak", async ({
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

    // Coba akses kembali ke halaman master data setelah logout
    await page.goto("/master-data");
    await expect(page).toHaveURL(/\/login/);
  });

  // ── TC-PW-AUTH-006 ─────────────────────────────────────────
  test("TC-PW-AUTH-006 | Login gagal dengan password salah", async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder(/masukkan username|username/i).fill("admin");
    await page.getByPlaceholder(/masukkan password|password/i).fill("wrongpassword");
    await page.getByRole("button", { name: "Login", exact: true }).click();

    await expect(page).toHaveURL(/\/login/);
    await expect(
      page.getByText(/login gagal|invalid|salah|gagal/i).first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  // ── TC-PW-AUTH-007 ─────────────────────────────────────────
  test("TC-PW-AUTH-007 | Login gagal dengan username tidak terdaftar", async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder(/masukkan username|username/i).fill("unknown_admin");
    await page.getByPlaceholder(/masukkan password|password/i).fill("password123");
    await page.getByRole("button", { name: "Login", exact: true }).click();

    await expect(page).toHaveURL(/\/login/);
    await expect(
      page.getByText(/login gagal|invalid|salah|gagal/i).first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  // ── TC-PW-AUTH-008 ─────────────────────────────────────────
  test("TC-PW-AUTH-008 | Validasi submit login saat field kosong dicegah", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "Login", exact: true }).click();

    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByText(/username wajib diisi/i)).toBeVisible();
  });
});
