import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers";

test.describe("Master Data — Periode Akademik", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.waitForURL("**/master-data", { timeout: 15_000 });
  });

  // ── TC-PW-PERIODE-001: Tambah periode valid ───────────────────
  test("TC-PW-PERIODE-001 | Tambah Periode Akademik baru valid (Mulai Kosong)", async ({
    page,
  }) => {
    const tahunTest = "2099";

    await page.getByRole("button", { name: "Tambah Periode Akademik" }).click();

    // 1. Isi Awal Tahun
    await page.getByPlaceholder(/contoh: 2026/i).fill(tahunTest);

    // 2. Pilih Semester Ganjil
    await page.locator("select").first().selectOption("Ganjil");

    // 3. PENTING: Klik opsi 'Mulai kosong' agar tidak mewajibkan dropdown periode sumber
    await page.getByRole("button", { name: /mulai kosong/i }).click();

    // 4. Klik Tambah Periode
    await page.getByRole("button", { name: "Tambah Periode", exact: true }).click();

    // Modal tertutup dan card baru 2099 muncul di halaman
    await expect(page.getByText(/2099/).first()).toBeVisible({ timeout: 15_000 });
  });

  // ── TC-PW-PERIODE-002: Edit Periode ──────────────────────────
  test("TC-PW-PERIODE-002 | Edit data Periode Akademik existing", async ({
    page,
  }) => {
    // Buka menu titik tiga pada card pertama
    await page.locator('button[aria-label="Opsi lainnya"]').first().click();
    await page.getByText(/edit data/i).click();

    // Modal Edit terbuka
    await expect(page.getByText(/edit periode akademik/i)).toBeVisible();

    await page.getByRole("button", { name: /simpan perubahan/i }).click();

    // Modal tertutup kembali
    await expect(page.getByText(/edit periode akademik/i)).not.toBeVisible({ timeout: 10_000 });
  });

  // ── TC-PW-PERIODE-003: Dialog Konfirmasi Hapus & Batal ────────
  test("TC-PW-PERIODE-003 | Aksi Batal pada dialog konfirmasi hapus periode", async ({
    page,
  }) => {
    await page.locator('button[aria-label="Opsi lainnya"]').first().click();
    await page.getByText(/delete data/i).click();

    // Modal konfirmasi hapus muncul
    await expect(page.getByText(/hapus data ini/i)).toBeVisible();

    // Klik Batal
    await page.getByRole("button", { name: /batal|cancel/i }).click();

    // Modal tertutup dan data tidak terhapus
    await expect(page.getByText(/hapus data ini/i)).not.toBeVisible({ timeout: 5000 });
  });

  // ── TC-PW-PERIODE-004: Search Keyword Valid ──────────────────
  test("TC-PW-PERIODE-004 | Pencarian kartu Periode Akademik dengan keyword valid", async ({
    page,
  }) => {
    const searchInput = page.getByPlaceholder(/cari periode akademik/i);
    await searchInput.fill("2026");

    // Card yang tampil harus sesuai filter
    await expect(page.getByText(/2026/).first()).toBeVisible({ timeout: 5000 });
  });

  // ── TC-PW-PERIODE-005: Form kosong ───────────────────────────
  test("TC-PW-PERIODE-005 | Validasi form periode kosong tidak bisa disubmit", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Tambah Periode Akademik" }).click();
    await page.getByRole("button", { name: "Tambah Periode", exact: true }).click();

    // Dialog modal tetap terbuka karena validasi gagal
    await expect(page.getByRole("heading", { name: "Tambah periode baru" })).toBeVisible({ timeout: 5000 });
  });

  // ── TC-PW-PERIODE-006: Search tidak ditemukan ────────────────
  test("TC-PW-PERIODE-006 | Pencarian kartu Periode dengan keyword fiktif", async ({
    page,
  }) => {
    const searchInput = page.getByPlaceholder(/cari periode akademik/i);
    await searchInput.fill("XYZ999NONEXISTENT");

    // Pesan data tidak ditemukan muncul
    await expect(page.getByText(/tidak ditemukan/i)).toBeVisible({ timeout: 5000 });
  });
});
