import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers";

/**
 * Helper: navigasi ke tab tertentu dari Periode Akademik pertama.
 * tab: "kurikulum" | "ruangan" | "dosen" | "kelas" | "sesi"
 */
async function goToTab(
  page: import("@playwright/test").Page,
  tab: "kurikulum" | "ruangan" | "dosen" | "kelas" | "sesi",
) {
  await loginAsAdmin(page);
  // Klik Buka pada card Periode pertama
  await page.getByRole("button", { name: /buka|open|kelola/i }).first().click();
  await page.waitForURL(/\/master-data\/.+\//);
  // Klik tab yang sesuai
  await page.getByRole("link", { name: new RegExp(tab, "i") }).click();
  await page.waitForURL(new RegExp(tab));
}

// ================================================================
// MATA KULIAH
// ================================================================
test.describe("Master Data — Mata Kuliah", () => {
  test("TC-AUTO-MK-001 | Membuka tab Mata Kuliah — tabel tampil", async ({
    page,
  }) => {
    await goToTab(page, "kurikulum");
    await expect(page).toHaveURL(/kurikulum/);
    await expect(page.getByRole("table")).toBeVisible();
  });

  test("TC-AUTO-MK-002 | Tambah MK valid → baris baru di tabel", async ({
    page,
  }) => {
    await goToTab(page, "kurikulum");
    await page.getByRole("button", { name: /tambah mata kuliah/i }).click();

    await page.getByLabel(/nama mata kuliah/i).fill("MK Test Playwright");
    await page.getByLabel(/kode mk/i).fill("9999");
    await page.getByLabel(/bobot sks/i).fill("2");
    await page.getByLabel(/semester/i).selectOption("1");
    // Pilih Tipe Kelas, Jenis, Kelompok
    await page.getByLabel(/tipe kelas/i).selectOption({ index: 1 });
    await page.getByLabel(/jenis/i).selectOption({ index: 1 });
    await page.getByLabel(/kelompok/i).selectOption({ index: 1 });

    await page.getByRole("button", { name: /tambah mata kuliah/i }).click();

    await expect(page.getByText("MK Test Playwright")).toBeVisible();
  });

  test("TC-AUTO-MK-003 | Tambah MK field wajib kosong → validasi muncul", async ({
    page,
  }) => {
    await goToTab(page, "kurikulum");
    await page.getByRole("button", { name: /tambah mata kuliah/i }).click();
    await page.getByRole("button", { name: /tambah mata kuliah/i }).last().click();

    await expect(
      page.getByText(/tidak boleh kosong|harus diisi|harus berupa/i),
    ).toBeVisible();
  });

  test("TC-AUTO-MK-006 | Search MK → tabel ter-filter", async ({ page }) => {
    await goToTab(page, "kurikulum");
    await page.getByPlaceholder(/cari/i).fill("zzz-tidak-ada-9999");
    // Tabel tidak punya baris data
    const rows = page.getByRole("row").filter({ hasText: /zzz-tidak-ada/i });
    await expect(rows).toHaveCount(0);
  });
});

// ================================================================
// RUANGAN
// ================================================================
test.describe("Master Data — Ruangan", () => {
  test("TC-AUTO-RUANG-001 | Membuka tab Ruangan — tabel tampil", async ({
    page,
  }) => {
    await goToTab(page, "ruangan");
    await expect(page).toHaveURL(/ruangan/);
    await expect(page.getByRole("table")).toBeVisible();
  });

  test("TC-AUTO-RUANG-002 | Tambah Ruangan valid → baris baru di tabel", async ({
    page,
  }) => {
    await goToTab(page, "ruangan");
    await page.getByRole("button", { name: /tambah ruang/i }).click();
    await page.getByLabel(/nama ruangan/i).fill("Ruang Test PW");
    await page.getByRole("button", { name: /tambah ruangan/i }).click();
    await expect(page.getByText("Ruang Test PW")).toBeVisible();
  });

  test("TC-AUTO-RUANG-003 | Tambah Ruangan field kosong → validasi muncul", async ({
    page,
  }) => {
    await goToTab(page, "ruangan");
    await page.getByRole("button", { name: /tambah ruang/i }).click();
    await page.getByRole("button", { name: /tambah ruangan/i }).click();
    await expect(
      page.getByText(/tidak boleh kosong|harus diisi/i),
    ).toBeVisible();
  });
});

// ================================================================
// DOSEN
// ================================================================
test.describe("Master Data — Dosen", () => {
  test("TC-AUTO-DOS-001 | Membuka tab Dosen — tabel tampil", async ({
    page,
  }) => {
    await goToTab(page, "dosen");
    await expect(page).toHaveURL(/dosen/);
    await expect(page.getByRole("table")).toBeVisible();
  });

  test("TC-AUTO-DOS-002 | Tambah Dosen valid → baris baru di tabel", async ({
    page,
  }) => {
    await goToTab(page, "dosen");
    await page.getByRole("button", { name: /tambah dosen/i }).click();
    await page.getByLabel(/nama/i).fill("Dosen Test Playwright");
    await page.getByLabel(/jabatan/i).selectOption({ index: 1 });
    await page.getByRole("button", { name: /tambah dosen/i }).last().click();
    await expect(page.getByText("Dosen Test Playwright")).toBeVisible();
  });

  test("TC-AUTO-DOS-003 | Tambah Dosen nama kosong → validasi muncul", async ({
    page,
  }) => {
    await goToTab(page, "dosen");
    await page.getByRole("button", { name: /tambah dosen/i }).click();
    await page.getByRole("button", { name: /tambah dosen/i }).last().click();
    await expect(
      page.getByText(/tidak boleh kosong|harus diisi/i),
    ).toBeVisible();
  });
});

// ================================================================
// KELAS
// ================================================================
test.describe("Master Data — Kelas", () => {
  test("TC-AUTO-KLS-001 | Membuka tab Kelas — tabel tampil", async ({
    page,
  }) => {
    await goToTab(page, "kelas");
    await expect(page).toHaveURL(/kelas/);
    await expect(page.getByRole("table")).toBeVisible();
  });

  test("TC-AUTO-KLS-002 | Tambah Kelas valid → baris baru di tabel", async ({
    page,
  }) => {
    await goToTab(page, "kelas");
    await page.getByRole("button", { name: /tambah kelas/i }).click();
    await page.getByLabel(/semester/i).selectOption("1");
    await page.getByLabel(/jumlah kelas teori/i).selectOption("1");
    await page.getByLabel(/jumlah kelas praktikum/i).selectOption("1");
    await page.getByRole("button", { name: /tambah kelas/i }).last().click();
    // Verifikasi tidak ada error message
    await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 5000 });
  });

  test("TC-AUTO-KLS-003 | Tambah Kelas field kosong → validasi muncul", async ({
    page,
  }) => {
    await goToTab(page, "kelas");
    await page.getByRole("button", { name: /tambah kelas/i }).click();
    await page.getByRole("button", { name: /tambah kelas/i }).last().click();
    await expect(
      page.getByText(/harus dipilih|tidak boleh kosong/i),
    ).toBeVisible();
  });
});

// ================================================================
// SESI
// ================================================================
test.describe("Master Data — Sesi", () => {
  test("TC-AUTO-SESI-001 | Membuka tab Sesi — tabel tampil", async ({
    page,
  }) => {
    await goToTab(page, "sesi");
    await expect(page).toHaveURL(/sesi/);
    await expect(page.getByRole("table")).toBeVisible();
  });

  test("TC-AUTO-SESI-002 | Tambah Sesi valid → baris baru di tabel", async ({
    page,
  }) => {
    await goToTab(page, "sesi");
    await page.getByRole("button", { name: /tambah sesi/i }).click();
    await page.getByLabel(/jam mulai/i).fill("07:15");
    await page.getByLabel(/jam berakhir|jam selesai/i).fill("08:55");
    await page.getByRole("button", { name: /tambah sesi/i }).last().click();
    await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 5000 });
  });

  test("TC-AUTO-SESI-003 | Tambah Sesi field kosong → validasi muncul", async ({
    page,
  }) => {
    await goToTab(page, "sesi");
    await page.getByRole("button", { name: /tambah sesi/i }).click();
    await page.getByRole("button", { name: /tambah sesi/i }).last().click();
    await expect(
      page.getByText(/tidak boleh kosong|harus diisi/i),
    ).toBeVisible();
  });
});

// ================================================================
// HAK AKSES
// ================================================================
test.describe("Hak Akses", () => {
  test("TC-AUTO-AKSES-001 | Guest akses /laporan/dosen tanpa login", async ({
    page,
  }) => {
    await page.context().clearCookies();
    await page.evaluate(() => localStorage.clear());
    await page.goto("/laporan/dosen");
    await expect(page).toHaveURL(/laporan\/dosen/);
  });

  test("TC-AUTO-AKSES-002 | Guest tidak bisa akses /master-data", async ({
    page,
  }) => {
    await page.context().clearCookies();
    await page.evaluate(() => localStorage.clear());
    await page.goto("/master-data");
    await expect(page).toHaveURL(/\/login/);
  });
});
