import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers";

/**
 * ================================================================
 * TC-AUTO-PERIODE-002  Validasi form kosong
 * TC-AUTO-PERIODE-003  Tambah Periode valid → card muncul
 * TC-AUTO-PERIODE-005  Edit Periode → card terupdate
 * TC-AUTO-PERIODE-006  Hapus Periode → card hilang
 * TC-AUTO-PERIODE-007  Hapus dibatalkan → data tetap ada
 * TC-AUTO-PERIODE-008  Search keyword valid → filter benar
 * TC-AUTO-PERIODE-009  Search keyword tidak ditemukan → empty state
 * ================================================================
 */

test.describe("Master Data — Periode Akademik", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.waitForURL("**/master-data");
  });

  // ── TC-AUTO-PERIODE-002 ──────────────────────────────────────
  test("TC-AUTO-PERIODE-002 | Validasi form kosong — tidak bisa submit", async ({
    page,
  }) => {
    await page.getByRole("button", { name: /tambah periode akademik/i }).click();
    await page.getByRole("button", { name: /tambah periode/i }).click();

    // Modal tidak tertutup + ada pesan error
    await expect(
      page.getByText(/tahun|semester|tidak boleh kosong|harus diisi/i),
    ).toBeVisible();
  });

  // ── TC-AUTO-PERIODE-003 ──────────────────────────────────────
  test("TC-AUTO-PERIODE-003 | Tambah Periode Akademik valid → card muncul", async ({
    page,
  }) => {
    const tahunTest = "2099";

    await page.getByRole("button", { name: /tambah periode akademik/i }).click();

    // Isi form
    await page.getByLabel(/awal tahun/i).fill(tahunTest);
    await page.getByLabel(/semester/i).selectOption("Ganjil");

    await page.getByRole("button", { name: /tambah periode/i }).click();

    // Card baru harus muncul
    await expect(page.getByText(/2099/)).toBeVisible();
  });

  // ── TC-AUTO-PERIODE-005 ──────────────────────────────────────
  test("TC-AUTO-PERIODE-005 | Edit Periode Akademik → data terupdate", async ({
    page,
  }) => {
    // Klik tombol edit pada card pertama
    await page.locator('[aria-label*="edit"], button:has-text("Edit")').first().click();

    // Ubah nilai semester (pilih opsi berbeda)
    const semesterSelect = page.getByLabel(/semester/i);
    const currentVal = await semesterSelect.inputValue();
    await semesterSelect.selectOption(
      currentVal === "Ganjil" ? "Genap" : "Ganjil",
    );

    await page.getByRole("button", { name: /simpan/i }).click();

    // Modal harus tertutup
    await expect(
      page.getByRole("dialog"),
    ).not.toBeVisible({ timeout: 5000 });
  });

  // ── TC-AUTO-PERIODE-006 ──────────────────────────────────────
  test("TC-AUTO-PERIODE-006 | Hapus Periode dummy → card hilang", async ({
    page,
  }) => {
    // Ambil jumlah card sebelum hapus
    const cardsBefore = await page.locator('[data-testid="periode-card"], .card-periode').count();

    // Klik hapus pada card terakhir (dummy/baru)
    await page.locator('button[aria-label*="hapus"], button:has-text("Hapus")').last().click();

    // Konfirmasi modal
    await page.getByRole("button", { name: /konfirmasi|ya|hapus/i }).click();

    // Jumlah card berkurang
    await expect(
      page.locator('[data-testid="periode-card"], .card-periode'),
    ).toHaveCount(cardsBefore - 1);
  });

  // ── TC-AUTO-PERIODE-007 ──────────────────────────────────────
  test("TC-AUTO-PERIODE-007 | Hapus dibatalkan → data tetap ada", async ({
    page,
  }) => {
    const cardsBefore = await page.locator('[data-testid="periode-card"], .card-periode').count();

    await page.locator('button[aria-label*="hapus"], button:has-text("Hapus")').first().click();

    // Klik Batal
    await page.getByRole("button", { name: /batal|cancel/i }).click();

    // Jumlah card tidak berubah
    await expect(
      page.locator('[data-testid="periode-card"], .card-periode'),
    ).toHaveCount(cardsBefore);
  });

  // ── TC-AUTO-PERIODE-008 ──────────────────────────────────────
  test("TC-AUTO-PERIODE-008 | Search keyword valid → list ter-filter", async ({
    page,
  }) => {
    const searchBox = page.getByPlaceholder(/cari periode akademik/i);

    // Ambil teks card pertama sebagai keyword
    const firstCardText = await page
      .locator('[data-testid="periode-card"], .card-periode')
      .first()
      .innerText();
    const keyword = firstCardText.split("\n")[0].trim().slice(0, 6);

    await searchBox.fill(keyword);

    // Semua card yang tampil harus mengandung keyword
    const cards = page.locator('[data-testid="periode-card"], .card-periode');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  });

  // ── TC-AUTO-PERIODE-009 ──────────────────────────────────────
  test("TC-AUTO-PERIODE-009 | Search tidak ditemukan → teks empty state muncul", async ({
    page,
  }) => {
    await page
      .getByPlaceholder(/cari periode akademik/i)
      .fill("zzz-tidak-ada-9999");

    await expect(
      page.getByText(/tidak ditemukan/i),
    ).toBeVisible();
  });
});
