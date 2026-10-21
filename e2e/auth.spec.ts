import { test, expect } from "@playwright/test";
import { loginAsAdmin, clearSession } from "./helpers";

/**
 * ================================================================
 * TC-AUTO-AUTH-001  Login berhasil dengan kredensial valid
 * TC-AUTO-AUTH-002  Session Guard — akses tanpa login → redirect
 * TC-AUTO-AUTH-004  Logout → redirect /login + token bersih
 * TC-AUTO-AUTH-005  Tombol Back tidak bisa kembali setelah logout
 * TC-AUTO-AUTH-006  Login gagal — password salah
 * TC-AUTO-AUTH-007  Login gagal — username kosong
 * TC-AUTO-AUTH-008  Login gagal — semua field kosong
 * ================================================================
 */

test.describe("Autentikasi", () => {
  // ── TC-AUTO-AUTH-001 ─────────────────────────────────────────
  test("TC-AUTO-AUTH-001 | Login berhasil redirect ke /master-data", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByPlaceholder(/username/i).fill("admin");
    await page.getByPlaceholder(/password/i).fill("admin123");
    await page.getByRole("button", { name: /login/i }).click();

    await expect(page).toHaveURL(/\/master-data/);
    await expect(
      page.getByRole("heading", { name: /master data/i }),
    ).toBeVisible();
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

    // Klik tombol logout
    await page.getByRole("button", { name: /logout/i }).click();

    await expect(page).toHaveURL(/\/login/);

    // Verifikasi localStorage bersih
    const token = await page.evaluate(() => localStorage.getItem("token"));
    expect(token).toBeNull();
  });

  // ── TC-AUTO-AUTH-005 ─────────────────────────────────────────
  test("TC-AUTO-AUTH-005 | Tombol Back tidak bisa kembali setelah logout", async ({
    page,
  }) => {
    await loginAsAdmin(page);
    await page.getByRole("button", { name: /logout/i }).click();
    await expect(page).toHaveURL(/\/login/);

    await page.goBack();

    // Harus tetap di /login
    await expect(page).toHaveURL(/\/login/);
  });

  // ── TC-AUTO-AUTH-006 ─────────────────────────────────────────
  test("TC-AUTO-AUTH-006 | Login gagal — password salah", async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder(/username/i).fill("admin");
    await page.getByPlaceholder(/password/i).fill("passwordsalah999");
    await page.getByRole("button", { name: /login/i }).click();

    // Harus tetap di /login
    await expect(page).toHaveURL(/\/login/);

    // Harus ada pesan error
    await expect(
      page.getByText(/invalid|salah|gagal|incorrect/i),
    ).toBeVisible();
  });

  // ── TC-AUTO-AUTH-007 ─────────────────────────────────────────
  test("TC-AUTO-AUTH-007 | Login gagal — username kosong", async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder(/password/i).fill("admin123");
    await page.getByRole("button", { name: /login/i }).click();

    await expect(page).toHaveURL(/\/login/);
  });

  // ── TC-AUTO-AUTH-008 ─────────────────────────────────────────
  test("TC-AUTO-AUTH-008 | Login gagal — semua field kosong", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /login/i }).click();

    await expect(page).toHaveURL(/\/login/);
  });
});
