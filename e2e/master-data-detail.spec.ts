import { test, expect } from "./fixtures";
import { loginAsAdmin } from "./helpers";
import { QAData, masterTab } from "./qa-data";

/**
 * Helper: masuk ke halaman Master Data, buka periode pertama, lalu pindah tab.
 */
async function goToTab(page: import("@playwright/test").Page, qa: QAData, tabName: "Kurikulum" | "Ruangan" | "Dosen" | "Kelas" | "Sesi") {
  await loginAsAdmin(page);
  const period = await qa.period();
  await masterTab(page, period.id, tabName);
  return period;
}

// ================================================================
// MATA KULIAH / KURIKULUM (4 TC)
// ================================================================
test.describe("Master Data — Mata Kuliah", () => {
  test("TC-PW-MK-001 | Membuka tab Kurikulum dan menampilkan struktur tabel", async ({
    page, qa,
  }) => {
    await goToTab(page, qa, "Kurikulum");
    await expect(page).toHaveURL(/kurikulum/);
    await expect(page.getByRole("table")).toBeVisible();
  });

    test("TC-PW-MK-002 | Tambah Mata Kuliah baru dengan field valid", async ({
    page, qa,
  }) => {
    await goToTab(page, qa, "Kurikulum");
    await page.getByRole("button", { name: "Tambah Mata Kuliah" }).click();

    const uniqueKode = "802";
    await page.getByPlaceholder(/contoh: Bahasa Inggris 1/i).fill("Basis Data Terdistribusi QA");
    await page.getByPlaceholder(/contoh: 101/i).fill(uniqueKode);
    await page.getByPlaceholder(/contoh: 2/i).fill("3");

    // Isi seluruh dropdown wajib.
    await page.getByLabel("Semester").selectOption("1");
    await page.getByLabel("Tipe Kelas").selectOption("MKK");
    await page.getByLabel("Jenis").selectOption("Wajib");
    await page.getByLabel("Kelompok").selectOption("Teori");

    await page.getByRole("button", { name: "Tambah Mata Kuliah", exact: true }).last().click();

    await expect(page.getByText("Basis Data Terdistribusi QA").first()).toBeVisible({ timeout: 15_000 });
    await page.reload();
    await expect(page.getByText("Basis Data Terdistribusi QA").first()).toBeVisible({ timeout: 15_000 });
  });

  test("TC-PW-MK-003 | Validasi submit Mata Kuliah dengan field wajib kosong", async ({
    page, qa,
  }) => {
    await goToTab(page, qa, "Kurikulum");
    await page.getByRole("button", { name: "Tambah Mata Kuliah" }).click();
    await page.getByRole("button", { name: "Tambah Mata Kuliah", exact: true }).last().click();

    await expect(
      page.getByText(/tidak boleh kosong|harus diisi/i).first(),
    ).toBeVisible();
  });

  test("TC-PW-MK-004 | Validasi Bobot SKS di luar batas maksimum (> 10)", async ({
    page, qa,
  }) => {
    await goToTab(page, qa, "Kurikulum");
    await page.getByRole("button", { name: "Tambah Mata Kuliah" }).click();
    await page.getByPlaceholder(/contoh: Bahasa Inggris 1/i).fill("MK Validasi SKS");
    await page.getByPlaceholder(/contoh: 101/i).fill("101");

    // SKS diisi 15 (melebihi 10)
    await page.getByPlaceholder(/contoh: 2/i).fill("15");
    await page.getByRole("button", { name: "Tambah Mata Kuliah", exact: true }).last().click();

    await expect(
      page.getByText(/angka 1 sampai 10/i).first(),
    ).toBeVisible();
  });
});

// ================================================================
// RUANGAN (2 TC)
// ================================================================
test.describe("Master Data — Ruangan", () => {
  test("TC-PW-RUANG-001 | Tambah Ruangan baru dengan nama valid", async ({ page, qa }) => {
    await goToTab(page, qa, "Ruangan");
    await page.getByRole("button", { name: /tambah ruang/i }).click();
    await page.getByPlaceholder(/contoh: CU 205/i).fill("Lab PW Automation");
    await page.getByRole("button", { name: "Tambah Ruangan", exact: true }).last().click();

    // Baris baru muncul di tabel
    await expect(page.getByText("Lab PW Automation").first()).toBeVisible({ timeout: 15_000 });
    await page.reload();
    await expect(page.getByText("Lab PW Automation").first()).toBeVisible({ timeout: 15_000 });
  });

  test("TC-PW-RUANG-002 | Validasi nama ruangan kosong ditolak", async ({
    page, qa,
  }) => {
    await goToTab(page, qa, "Ruangan");
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
  test("TC-PW-DOSEN-001 | Tambah Dosen baru dengan data valid", async ({ page, qa }) => {
    await goToTab(page, qa, "Dosen");
    await page.getByRole("button", { name: "Tambah Dosen" }).click();
    await page.getByPlaceholder(/masukan nama lengkap dosen/i).fill("Dr. QA Engineer");
    await page.getByPlaceholder(/masukan NIDN dosen/i).fill("12345678");
    await page.getByPlaceholder(/contoh: Lektor/i).fill("Lektor Kepala");
    await page.getByRole("button", { name: "Tambah Dosen", exact: true }).last().click();

    await expect(page.getByText("Dr. QA Engineer").first()).toBeVisible({ timeout: 15_000 });
    await page.reload();
    await expect(page.getByText("Dr. QA Engineer").first()).toBeVisible({ timeout: 15_000 });
  });

  test("TC-PW-DOSEN-002 | Validasi nama dosen kosong ditolak", async ({
    page, qa,
  }) => {
    await goToTab(page, qa, "Dosen");
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
    page, qa,
  }) => {
    const period = await goToTab(page, qa, "Kelas");
    for (const prodi of ["TRPL", "TRE"]) await qa.call("POST", `/api/master-data/kelas/${period.id}`, { prodi, semester: 1, kelas_teori: 2, kelas_praktikum: 4 });
    await page.reload();
    const classes = await qa.list("kelas", period.id);
    for (const prodi of ["TRE", "TRPL"]) {
      await page.getByRole("button", { name: new RegExp(prodi) }).click();
      for (const item of classes) {
        const row = page.getByRole("cell", { name: item.kode_kelas, exact: true });
        if (item.prodi === prodi) await expect(row).toBeVisible();
        else await expect(row).toHaveCount(0);
      }
    }
  });

  test("TC-PW-KELAS-002 | Validasi form kelas wajib memilih semester", async ({
    page, qa,
  }) => {
    await goToTab(page, qa, "Kelas");
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
    page, qa,
  }) => {
    await goToTab(page, qa, "Sesi");
    await expect(page.getByRole("table")).toBeVisible();
  });

  test("TC-PW-SESI-002 | Validasi logika jam mulai lebih lambat dari jam akhir", async ({
    page, qa,
  }) => {
    await goToTab(page, qa, "Sesi");
    await page.getByRole("button", { name: "Tambah Sesi" }).click();

    // Ambil kedua input jam — harus pakai label parent biar gak ke-mix
    const jamMulaiInput = page.locator('input[placeholder="00.00 WIB"]').nth(0);
    const jamBerakhirInput = page.locator('input[placeholder="00.00 WIB"]').nth(1);

    // Isi Jam Mulai: klik, clear, lalu ketik pelan
    await jamMulaiInput.click();
    await jamMulaiInput.fill("");
    await jamMulaiInput.pressSequentially("10.00 WIB", { delay: 50 });

    // Klik di luar dulu untuk "commit" input pertama
    await jamMulaiInput.press("Tab");


    // Isi Jam Berakhir: klik, clear, lalu ketik pelan
    await jamBerakhirInput.click();
    await jamBerakhirInput.fill("");
    await jamBerakhirInput.pressSequentially("08.00 WIB", { delay: 50 });

    // Submit
    await page.getByRole("button", { name: "Tambah Sesi", exact: true }).last().click();

    // Harus membuktikan validasi urutan jam, bukan field kosong.
    await expect(
      page.getByText(/jam mulai harus lebih awal daripada jam berakhir/i),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("TC-PW-SESI-003 | Validasi format jam tidak valid ditolak", async ({
    page, qa,
  }) => {
    await goToTab(page, qa, "Sesi");
    await page.getByRole("button", { name: "Tambah Sesi" }).click();

    const jamMulaiInput = page.locator('input[placeholder="00.00 WIB"]').nth(0);
    const jamBerakhirInput = page.locator('input[placeholder="00.00 WIB"]').nth(1);

    // Isi Jam Mulai dengan format invalid
    await jamMulaiInput.click();
    await jamMulaiInput.fill("");
    await jamMulaiInput.pressSequentially("99:99", { delay: 50 });

    // Klik di luar dulu
    await jamMulaiInput.press("Tab");


    // Isi Jam Berakhir
    await jamBerakhirInput.click();
    await jamBerakhirInput.fill("");
    await jamBerakhirInput.pressSequentially("08.00 WIB", { delay: 50 });

    await page.getByRole("button", { name: "Tambah Sesi", exact: true }).last().click();

    await expect(
      page.getByText(/format jam mulai tidak valid/i),
    ).toBeVisible({ timeout: 10_000 });
  });
});
