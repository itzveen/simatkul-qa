import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers";

test.describe("Master Data — Periode Akademik", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.waitForURL("**/master-data", { timeout: 15_000 });
  });

  // ── TC-PW-PERIODE-002: Form kosong ───────────────────────────
  test("TC-PW-PERIODE-002 | Validasi form kosong tidak bisa submit", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Tambah Periode Akademik" }).click();
    await page.getByRole("button", { name: "Tambah Periode", exact: true }).click();

    // Dialog modal tetap terbuka karena validasi gagal
    await expect(page.getByRole("heading", { name: "Tambah periode baru" })).toBeVisible({ timeout: 5000 });
  });

  // ── TC-PW-PERIODE-003: Tambah periode valid ───────────────────
  test("TC-PW-PERIODE-003 | Tambah Periode Akademik baru valid", async ({
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

  // ── TC-PW-PERIODE-004: Edit Periode ──────────────────────────
  test("TC-PW-PERIODE-004 | Edit Periode Akademik existing", async ({
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

  // ── TC-PW-PERIODE-005: Dialog Konfirmasi Hapus ────────────────
  test("TC-PW-PERIODE-005 | Dialog konfirmasi hapus muncul dan bisa dibatalkan", async ({
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

  // ── TC-PW-PERIODE-008: Search Keyword ────────────────────────
  test("TC-PW-PERIODE-008 | Pencarian Periode Akademik ter-filter", async ({
    page,
  }) => {
    const searchInput = page.getByPlaceholder(/cari periode akademik/i);
    await searchInput.fill("2026");

    // Card yang tampil harus sesuai filter
    await expect(page.getByText(/2026/).first()).toBeVisible({ timeout: 5000 });
  });

  // ── TC-PW-PERIODE-009: Search tidak ditemukan ────────────────
  test("TC-PW-PERIODE-009 | Search keyword fiktif menampilkan empty state", async ({
    page,
  }) => {
    const searchInput = page.getByPlaceholder(/cari periode akademik/i);
    await searchInput.fill("zzz-tidak-ada-9999");

    // Pesan data tidak ditemukan muncul
    await expect(page.getByText(/tidak ditemukan/i)).toBeVisible({ timeout: 5000 });
  });
});
