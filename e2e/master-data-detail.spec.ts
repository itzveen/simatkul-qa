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
// MATA KULIAH / KURIKULUM (4 TC)
// ================================================================
test.describe("Master Data — Mata Kuliah", () => {
  test("TC-PW-MK-001 | Membuka tab Kurikulum dan menampilkan struktur tabel", async ({
    page,
  }) => {
    await goToTab(page, "Kurikulum");
    await expect(page).toHaveURL(/kurikulum/);
    await expect(page.getByRole("table")).toBeVisible();
  });

  test("TC-PW-MK-002 | Tambah Mata Kuliah baru dengan field valid", async ({
    page,
  }) => {
    await goToTab(page, "Kurikulum");
    await page.getByRole("button", { name: "Tambah Mata Kuliah" }).click();

    const uniqueKode = String(Math.floor(1000 + Math.random() * 9000));
    await page.getByPlaceholder(/contoh: Bahasa Inggris 1/i).fill("Basis Data Terdistribusi QA");
    await page.getByPlaceholder(/contoh: 101/i).fill(uniqueKode);
    await page.getByPlaceholder(/contoh: 2/i).fill("3");
    await page.getByRole("button", { name: "Tambah Mata Kuliah", exact: true }).last().click();

    // Verifikasi MK baru muncul di tabel
    await expect(page.getByText("Basis Data Terdistribusi QA").first()).toBeVisible({ timeout: 15_000 });
  });

  test("TC-PW-MK-003 | Validasi submit Mata Kuliah dengan field wajib kosong", async ({
    page,
  }) => {
    await goToTab(page, "Kurikulum");
    await page.getByRole("button", { name: "Tambah Mata Kuliah" }).click();
    await page.getByRole("button", { name: "Tambah Mata Kuliah", exact: true }).last().click();

    await expect(
      page.getByText(/tidak boleh kosong|harus diisi/i).first(),
    ).toBeVisible();
  });

  test("TC-PW-MK-004 | Validasi Bobot SKS di luar batas maksimum (> 10)", async ({
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
// RUANGAN (2 TC)
// ================================================================
test.describe("Master Data — Ruangan", () => {
  test("TC-PW-RUANG-001 | Tambah Ruangan baru dengan nama valid", async ({ page }) => {
    await goToTab(page, "Ruangan");
    await page.getByRole("button", { name: /tambah ruang/i }).click();
    await page.getByPlaceholder(/contoh: CU 205/i).fill("Lab PW Automation");
    await page.getByRole("button", { name: "Tambah Ruangan", exact: true }).last().click();

    // Baris baru muncul di tabel
    await expect(page.getByText("Lab PW Automation").first()).toBeVisible({ timeout: 15_000 });
  });

  test("TC-PW-RUANG-002 | Validasi nama ruangan kosong ditolak", async ({
    page,
  }) => {
    await goToTab(page, "Ruangan");
    await page.getByRole("button", { name: /tambah ruang/i }).click();
    await page.getByRole("button", { name: "Tambah Ruangan", exact: true }).last().click();

    await expect(
      page.getByText(/nama ruangan tidak boleh kosong/i),
    ).toBeVisible();
  });
});

// ================================================================
// DOSEN (2 TC)
// ================================================================
test.describe("Master Data — Dosen", () => {
  test("TC-PW-DOSEN-001 | Tambah Dosen baru dengan data valid", async ({ page }) => {
    await goToTab(page, "Dosen");
    await page.getByRole("button", { name: "Tambah Dosen" }).click();
    await page.getByPlaceholder(/masukan nama lengkap dosen/i).fill("Dr. QA Engineer");
    await page.getByPlaceholder(/masukan NIDN dosen/i).fill("12345678");
    await page.getByPlaceholder(/contoh: Lektor/i).fill("Lektor Kepala");
    await page.getByRole("button", { name: "Tambah Dosen", exact: true }).last().click();

    await expect(page.getByText("Dr. QA Engineer").first()).toBeVisible({ timeout: 15_000 });
  });

  test("TC-PW-DOSEN-002 | Validasi nama dosen kosong ditolak", async ({
    page,
  }) => {
    await goToTab(page, "Dosen");
    await page.getByRole("button", { name: "Tambah Dosen" }).click();
    await page.getByRole("button", { name: "Tambah Dosen", exact: true }).last().click();

    await expect(
      page.getByText(/nama dosen tidak boleh kosong/i),
    ).toBeVisible();
  });
});

// ================================================================
// KELAS (2 TC)
// ================================================================
test.describe("Master Data — Kelas", () => {
  test("TC-PW-KELAS-001 | Tampilan tabel Kelas dan filter Program Studi", async ({
    page,
  }) => {
    await goToTab(page, "Kelas");
    // Tab filter prodi tampil di toolbar
    await expect(page.getByRole("button", { name: "TRPL", exact: true })).toBeVisible();
  });

  test("TC-PW-KELAS-002 | Validasi form kelas wajib memilih semester", async ({
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
// SESI (3 TC)
// ================================================================
test.describe("Master Data — Sesi", () => {
  test("TC-PW-SESI-001 | Tampilan daftar slot waktu sesi perkuliahan", async ({
    page,
  }) => {
    await goToTab(page, "Sesi");
    await expect(page.getByRole("table")).toBeVisible();
  });

  test("TC-PW-SESI-002 | Validasi logika jam mulai lebih lambat dari jam akhir", async ({
    page,
  }) => {
    await goToTab(page, "Sesi");
    await page.getByRole("button", { name: "Tambah Sesi" }).click();

    const timeInputs = page.locator('input[placeholder="00.00 WIB"]');
    await timeInputs.nth(0).fill("10.00 WIB");
    await timeInputs.nth(1).fill("08.00 WIB");

    await page.getByRole("button", { name: "Tambah Sesi", exact: true }).last().click();

    await expect(
      page.getByText(/lebih awal daripada jam berakhir/i),
    ).toBeVisible();
  });

  test("TC-PW-SESI-003 | Validasi format jam tidak valid ditolak", async ({
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
