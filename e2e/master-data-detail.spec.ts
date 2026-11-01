import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers";

/**
 * Helper: masuk ke halaman Master Data, buka periode pertama, lalu pindah tab.
 */
async function goToTab(
  page: import("@playwright/test").Page,
  tabName: "Kurikulum" | "Ruangan" | "Dosen" | "Kelas" | "Sesi",
) {
  await loginAsAdmin(page);
  await page.waitForURL("**/master-data", { timeout: 15_000 });

  // Klik tombol Buka Periode (icon panah kanan atas) pada card periode pertama
  await page.locator('button[aria-label="Buka periode"]').first().click();
  await page.waitForURL(/\/master-data\/\d+\//, { timeout: 15_000 });

  // Klik tab yang sesuai
  await page.getByRole("button", { name: tabName, exact: true }).click();
  await page.waitForTimeout(1000);
}

// ================================================================
// MATA KULIAH / KURIKULUM
// ================================================================
test.describe("Master Data — Mata Kuliah", () => {
  test("TC-PW-KURIKULUM-001 | Membuka tab Mata Kuliah — tabel tampil", async ({
    page,
  }) => {
    await goToTab(page, "Kurikulum");
    await expect(page).toHaveURL(/kurikulum/);
    await expect(page.getByRole("table")).toBeVisible();
  });

  test("TC-PW-KURIKULUM-004 | Tambah MK field wajib kosong dicegah submit", async ({
    page,
  }) => {
    await goToTab(page, "Kurikulum");
    await page.getByRole("button", { name: "Tambah Mata Kuliah" }).click();
    await page.getByRole("button", { name: "Tambah Mata Kuliah", exact: true }).last().click();

    await expect(
      page.getByText(/tidak boleh kosong|harus diisi/i).first(),
    ).toBeVisible();
  });

  test("TC-PW-KURIKULUM-005 | Validasi bobot SKS tidak boleh angka di luar batas", async ({
    page,
  }) => {
    await goToTab(page, "Kurikulum");
    await page.getByRole("button", { name: "Tambah Mata Kuliah" }).click();
    await page.getByPlaceholder(/contoh: Bahasa Inggris 1/i).fill("MK Validasi SKS");
    await page.getByPlaceholder(/contoh: 101/i).fill("101");

    // SKS diisi 15 (melebihi 10)
    await page.getByPlaceholder(/contoh: 2/i).fill("15");
    await page.getByRole("button", { name: "Tambah Mata Kuliah", exact: true }).last().click();

    await expect(
      page.getByText(/angka 1 sampai 10|harus diisi/i).first(),
    ).toBeVisible();
  });
});

// ================================================================
// RUANGAN
// ================================================================
test.describe("Master Data — Ruangan", () => {
  test("TC-PW-RUANGAN-001 | Validasi nama ruangan tidak boleh kosong", async ({
    page,
  }) => {
    await goToTab(page, "Ruangan");
    await page.getByRole("button", { name: /tambah ruang/i }).click();
    await page.getByRole("button", { name: "Tambah Ruangan", exact: true }).last().click();

    await expect(
      page.getByText(/nama ruangan tidak boleh kosong/i),
    ).toBeVisible();
  });

  test("TC-PW-RUANGAN-002 | Tambah ruangan baru valid", async ({ page }) => {
    await goToTab(page, "Ruangan");
    await page.getByRole("button", { name: /tambah ruang/i }).click();
    await page.getByPlaceholder(/contoh: CU 205/i).fill("Lab PW Automation");
    await page.getByRole("button", { name: "Tambah Ruangan", exact: true }).last().click();

    // Baris baru muncul di tabel
    await expect(page.getByText("Lab PW Automation").first()).toBeVisible({ timeout: 15_000 });
  });
});

// ================================================================
// DOSEN
// ================================================================
test.describe("Master Data — Dosen", () => {
  test("TC-PW-DOSEN-001 | Validasi nama dosen tidak boleh kosong", async ({
    page,
  }) => {
    await goToTab(page, "Dosen");
    await page.getByRole("button", { name: "Tambah Dosen" }).click();
    await page.getByRole("button", { name: "Tambah Dosen", exact: true }).last().click();

    await expect(
      page.getByText(/nama dosen tidak boleh kosong/i),
    ).toBeVisible();
  });

  test("TC-PW-DOSEN-002 | Tambah dosen baru valid", async ({ page }) => {
    await goToTab(page, "Dosen");
    await page.getByRole("button", { name: "Tambah Dosen" }).click();
    await page.getByPlaceholder(/masukan nama lengkap dosen/i).fill("Dosen Test Playwright");
    await page.getByPlaceholder(/masukan NIDN dosen/i).fill("12345678");
    await page.getByPlaceholder(/contoh: Lektor/i).fill("Lektor Kepala");
    await page.getByRole("button", { name: "Tambah Dosen", exact: true }).last().click();

    await expect(page.getByText("Dosen Test Playwright").first()).toBeVisible({ timeout: 15_000 });
  });
});

// ================================================================
// KELAS
// ================================================================
test.describe("Master Data — Kelas", () => {
  test("TC-PW-KELAS-001 | Validasi form kelas wajib memilih semester", async ({
    page,
  }) => {
    await goToTab(page, "Kelas");
    await page.getByRole("button", { name: "Tambah Kelas" }).click();
    await page.getByRole("button", { name: "Tambah Kelas", exact: true }).last().click();

    await expect(
      page.getByText(/semester harus dipilih/i),
    ).toBeVisible();
  });
});

// ================================================================
// SESI
// ================================================================
test.describe("Master Data — Sesi", () => {
  test("TC-PW-SESI-001 | Validasi jam mulai lebih lambat dari jam akhir ditolak", async ({
    page,
  }) => {
    await goToTab(page, "Sesi");
    await page.getByRole("button", { name: "Tambah Sesi" }).click();

    // Ambil kedua input jam di modal form secara berurutan
    const timeInputs = page.locator('input[placeholder="00.00 WIB"]');
    await timeInputs.nth(0).fill("10.00 WIB");
    await timeInputs.nth(1).fill("08.00 WIB");

    await page.getByRole("button", { name: "Tambah Sesi", exact: true }).last().click();

    await expect(
      page.getByText(/lebih awal daripada jam berakhir/i),
    ).toBeVisible();
  });

  test("TC-PW-SESI-002 | Validasi format jam salah ditolak", async ({
    page,
  }) => {
    await goToTab(page, "Sesi");
    await page.getByRole("button", { name: "Tambah Sesi" }).click();

    const timeInputs = page.locator('input[placeholder="00.00 WIB"]');
    await timeInputs.nth(0).fill("99:99");
    await timeInputs.nth(1).fill("08.00 WIB");

    await page.getByRole("button", { name: "Tambah Sesi", exact: true }).last().click();

    await expect(
      page.getByText(/format jam mulai tidak valid/i),
    ).toBeVisible();
  });
});

// ================================================================
// HAK AKSES GUEST
// ================================================================
test.describe("Hak Akses Guest", () => {
  test("TC-PW-HASIL-003 | Login as Guest berhasil diarahkan ke laporan", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /login as guest/i }).click();

    await page.waitForURL("**/laporan/dosen", { timeout: 10_000 });
    await expect(page).toHaveURL(/laporan\/dosen/);
  });
});
