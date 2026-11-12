import { test, expect } from './fixtures';
import { loginAsAdmin } from './helpers';
import { mutation } from './qa-data';

test.describe('Master Data — Periode Akademik', () => {
  test.beforeEach(async ({ page }) => { await loginAsAdmin(page); });
  test('TC-PW-PERIODE-001 | Tambah periode kosong tersimpan setelah reload', async ({ page, qa }) => {
    await page.getByRole('button', { name: 'Tambah Periode Akademik' }).click();
    await page.getByPlaceholder(/contoh: 2026/i).fill('2098');
    await page.getByLabel('Semester', { exact: true }).selectOption('Ganjil');
    await page.getByPlaceholder(/contoh: Draft 1/i).fill(qa.tag);
    await page.getByRole('button', { name: /mulai kosong/i }).click();
    const body = await mutation(page, 'POST', '/api/master-data/kurikulum', () => page.getByRole('button', { name: 'Tambah Periode', exact: true }).click());
    qa.periods.add(Number(body.data.id));
    const p = await qa.call("GET", `/api/master-data/kurikulum/${body.data.id}`);
    await page.reload();
    await expect(page.getByText(p.nama, { exact: true })).toBeVisible();
    expect((await qa.call('GET', `/api/master-data/kurikulum/${body.data.id}`)).description).toBe(qa.tag);
  });
  test('TC-PW-PERIODE-002 | Edit nilai periode dan verifikasi persistence', async ({ page, qa }) => {
    const p = await qa.period();
    await page.reload();
    const card = page.locator('div').filter({ has: page.getByText(p.nama, { exact: true }) }).filter({ has: page.locator('button[aria-label="Opsi lainnya"]') }).last();
    await card.getByRole('button', { name: 'Opsi lainnya' }).click();
    await page.getByText(/edit data/i).click();
    await page.getByPlaceholder(/contoh: Draft 1/i).fill(qa.tag + '-edited');
    await page.getByLabel('Semester', { exact: true }).selectOption('Genap');
    await mutation(page, 'PUT', `/api/master-data/kurikulum/${p.id}`, () => page.getByRole('button', { name: /simpan perubahan/i }).click());
    await page.reload();
    const updated = await qa.call('GET', `/api/master-data/kurikulum/${p.id}`);
    await expect(page.getByText(updated.nama, { exact: true })).toBeVisible();
    expect(updated.semester).toBe('Genap');
    expect((await qa.call('GET', `/api/master-data/kurikulum/${p.id}`)).description).toBe(qa.tag + '-edited');
  });
  test('TC-PW-PERIODE-003 | Batal hapus mempertahankan data periode', async ({ page, qa }) => {
    const p = await qa.period();
    await page.reload();
    const card = page.locator('div').filter({ has: page.getByText(p.nama, { exact: true }) }).filter({ has: page.locator('button[aria-label="Opsi lainnya"]') }).last();
    await card.getByRole('button', { name: 'Opsi lainnya' }).click();
    await page.getByText(/delete data/i).click();
    await expect(page.getByText(/hapus data ini/i)).toBeVisible();
    await page.getByRole('button', { name: /batal/i }).click();
    await page.reload();
    await expect(page.getByText(p.nama, { exact: true })).toBeVisible();
    expect((await qa.call('GET', `/api/master-data/kurikulum/${p.id}`)).id).toBe(p.id);
  });
  test('TC-PW-PERIODE-004 | Search periode memfilter seluruh kartu', async ({ page, qa }) => {
    const p = await qa.period();
    await page.reload();
    await page.getByPlaceholder(/cari periode akademik/i).fill(p.nama);
    await expect(page.getByText(p.nama, { exact: true })).toBeVisible();
    await expect(page.locator('button[aria-label="Buka periode"]')).toHaveCount(1);
  });
  test('TC-PW-PERIODE-005 | Form periode kosong ditolak', async ({ page }) => {
    await page.getByRole('button', { name: 'Tambah Periode Akademik' }).click();
    await page.getByRole('button', { name: 'Tambah Periode', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Tambah periode baru' })).toBeVisible();
  });
  test('TC-PW-PERIODE-006 | Search periode fiktif menampilkan empty state', async ({ page }) => {
    await page.getByPlaceholder(/cari periode akademik/i).fill('XYZ999NONEXISTENT');
    await expect(page.getByText(/tidak ditemukan/i)).toBeVisible();
    await expect(page.locator('button[aria-label="Buka periode"]')).toHaveCount(0);
  });
});
