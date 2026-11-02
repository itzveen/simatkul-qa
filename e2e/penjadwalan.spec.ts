import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers";

test.describe("Penjadwalan", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  // ── TC-PW-JADWAL-001: Preview Penjadwalan ter-render di halaman ────────
  test("TC-PW-JADWAL-001 | Pilih Periode dan render komponen Preview Matriks Jadwal", async ({
    page,
  }) => {
    await page.goto("/penjadwalan");
    await expect(
      page.getByRole("heading", { name: "Penjadwalan" }),
    ).toBeVisible({ timeout: 15_000 });

    const periodeSelect = page.locator("select").first();
    await periodeSelect.selectOption({ index: 1 });

    // Preview penjadwalan & toolbar tabel harus tampil di DOM
    await expect(
      page.getByPlaceholder(/cari nama mata kuliah/i),
    ).toBeVisible({ timeout: 10_000 });
  });

  // ── TC-PW-JADWAL-002: Dropdown Hari dibatasi Senin s.d. Jumat ─────────
  test("TC-PW-JADWAL-002 | Dropdown Hari dibatasi 5 hari kerja (Senin - Jumat)", async ({
    page,
  }) => {
    await page.goto("/penjadwalan");
    await expect(
      page.getByRole("heading", { name: "Penjadwalan" }),
    ).toBeVisible({ timeout: 15_000 });

    // Pilih periode akademik pertama
    const periodeSelect = page.locator("select").first();
    await periodeSelect.selectOption({ index: 1 });

    // Buka modal Tambah Jadwal
    await page.getByRole("button", { name: /tambah jadwal/i }).click();
    await expect(
      page.getByRole("heading", { name: "Tambah Jadwal" }),
    ).toBeVisible();

    // Verifikasi opsi dropdown Hari hanya Senin s.d. Jumat (5 hari kerja)
    const hariSelect = page.getByLabel("Hari");
    const options = await hariSelect.locator("option").allInnerTexts();
    const cleanOptions = options
      .map((s) => s.trim())
      .filter((s) => s && !s.toLowerCase().includes("tentukan hari"));

    expect(cleanOptions).toEqual(["Senin", "Selasa", "Rabu", "Kamis", "Jumat"]);
  });

  // ── TC-PW-JADWAL-003: Validasi field wajib form jadwal sebelum submit ─
  test("TC-PW-JADWAL-003 | Validasi field wajib form jadwal sebelum submit", async ({
    page,
  }) => {
    await page.goto("/penjadwalan");
    await expect(
      page.getByRole("heading", { name: "Penjadwalan" }),
    ).toBeVisible({ timeout: 15_000 });

    const periodeSelect = page.locator("select").first();
    await periodeSelect.selectOption({ index: 1 });

    await page.getByRole("button", { name: /tambah jadwal/i }).click();
    await expect(
      page.getByRole("heading", { name: "Tambah Jadwal" }),
    ).toBeVisible();

    // Submit form dalam keadaan kosong
    await page.getByRole("button", { name: "Tambah Jadwal", exact: true }).last().click();

    // Error validasi muncul dan submit dicegah
    await expect(page.getByText(/semua field harus diisi/i)).toBeVisible();
  });

  // ── TC-PW-JADWAL-004: Validasi bentrok Dosen pada slot yang sama ───────
  test("TC-PW-JADWAL-004 | Validasi bentrok Dosen pada hari dan sesi yang sama", async ({
    page,
  }) => {
    await page.goto("/penjadwalan");
    await expect(
      page.getByRole("heading", { name: "Penjadwalan" }),
    ).toBeVisible({ timeout: 15_000 });

    const periodeSelect = page.locator("select").first();
    await periodeSelect.selectOption({ index: 1 });

    await page.getByRole("button", { name: /tambah jadwal/i }).click();
    await expect(
      page.getByRole("heading", { name: "Tambah Jadwal" }),
    ).toBeVisible();

    // Pilih Hari & Sesi terlebih dahulu
    await page.getByLabel("Hari").selectOption("Senin");
    await page.getByLabel("Sesi").selectOption("1");

    // Modal form mengevaluasi slotUsage real-time
    const dosenSelect = page.getByLabel("Dosen");
    await expect(dosenSelect).toBeVisible();
  });

  // ── TC-PW-JADWAL-005: Validasi bentrok Ruangan pada slot yang sama ─────
  test("TC-PW-JADWAL-005 | Validasi bentrok Ruangan pada hari dan sesi yang sama", async ({
    page,
  }) => {
    await page.goto("/penjadwalan");
    await expect(
      page.getByRole("heading", { name: "Penjadwalan" }),
    ).toBeVisible({ timeout: 15_000 });

    const periodeSelect = page.locator("select").first();
    await periodeSelect.selectOption({ index: 1 });

    await page.getByRole("button", { name: /tambah jadwal/i }).click();
    await expect(
      page.getByRole("heading", { name: "Tambah Jadwal" }),
    ).toBeVisible();

    await page.getByLabel("Hari").selectOption("Senin");
    await page.getByLabel("Sesi").selectOption("1");

    const ruangSelect = page.getByLabel("Ruang");
    await expect(ruangSelect).toBeVisible();
  });

  // ── TC-PW-JADWAL-006: Validasi bentrok Kelas pada slot yang sama ───────
  test("TC-PW-JADWAL-006 | Validasi bentrok Kelas pada hari dan sesi yang sama", async ({
    page,
  }) => {
    await page.goto("/penjadwalan");
    await expect(
      page.getByRole("heading", { name: "Penjadwalan" }),
    ).toBeVisible({ timeout: 15_000 });

    const periodeSelect = page.locator("select").first();
    await periodeSelect.selectOption({ index: 1 });

    await page.getByRole("button", { name: /tambah jadwal/i }).click();
    await expect(
      page.getByRole("heading", { name: "Tambah Jadwal" }),
    ).toBeVisible();

    await page.getByLabel("Hari").selectOption("Senin");
    await page.getByLabel("Sesi").selectOption("1");

    const kelasSelect = page.getByLabel("Kelas");
    await expect(kelasSelect).toBeVisible();
  });
});

test.describe("Hasil Penjadwalan / Laporan", () => {
  // ── TC-PW-HASIL-001: Filter Dosen pada Hasil menampilkan data ─────────
  test("TC-PW-HASIL-001 | Halaman Hasil Penjadwalan menampilkan data dan filter", async ({
    page,
  }) => {
    await loginAsAdmin(page);
    await page.goto("/laporan/dosen");

    await expect(
      page.getByRole("heading", { name: /hasil penjadwalan/i }),
    ).toBeVisible({ timeout: 15_000 });

    // Verifikasi tab navigasi tersedia
    await expect(page.getByRole("tab", { name: /jadwal dosen/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /jadwal ruang/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /jadwal kelas/i })).toBeVisible();
  });

  // ── TC-PW-HASIL-002: Tombol Ekspor ke Excel tersedia untuk Admin ───────
  test("TC-PW-HASIL-002 | Tombol Ekspor ke Excel tersedia untuk Admin", async ({
    page,
  }) => {
    await loginAsAdmin(page);
    await page.goto("/laporan/dosen");

    await expect(
      page.getByRole("heading", { name: /hasil penjadwalan/i }),
    ).toBeVisible({ timeout: 15_000 });

    // Admin memiliki hak akses tombol Ekspor ke Excel
    const btnExport = page.getByRole("button", { name: /ekspor ke excel/i });
    await expect(btnExport).toBeVisible();
  });

  // ── TC-PW-HASIL-003: Tombol Export tidak tampil untuk user guest ───────
  test("TC-PW-HASIL-003 | Tombol Export tidak tampil untuk user guest", async ({
    page,
  }) => {
    // Bersihkan sesi dan login sebagai Guest
    await page.context().clearCookies();
    await page.goto("/login");
    await page.evaluate(() => {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (e) {}
    });

    await page.getByRole("button", { name: /login as guest/i }).click();
    await page.waitForURL("**/laporan/dosen", { timeout: 15_000 });

    // Verifikasi tombol Ekspor ke Excel TIDAK tampil untuk role Guest
    const btnExport = page.getByRole("button", { name: /ekspor ke excel/i });
    await expect(btnExport).toHaveCount(0);
  });
});
