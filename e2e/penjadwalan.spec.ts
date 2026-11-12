import { test, expect } from './fixtures';
import { loginAsAdmin } from './helpers';
import { schedulePage, addSchedule, fillSchedule, mutation } from './qa-data';

test.describe('Penjadwalan', () => {
  test.beforeEach(async ({ page }) => { await loginAsAdmin(page); });
  test('TC-PW-JADWAL-001 | Pilih periode dan tampilkan preview', async ({ page, qa }) => {
    const s = await qa.seed();
    await schedulePage(page, s.p.id);
    await expect(page.getByPlaceholder(/cari nama mata kuliah/i)).toBeVisible();
    await expect(page.getByText(/Senin/).first()).toBeVisible();
  });
  test('TC-PW-JADWAL-002 | Hari terbatas Senin sampai Jumat', async ({ page, qa }) => {
    const p = await qa.period();
    await schedulePage(page, p.id);
    await page.getByRole('button', { name: 'Tambah Jadwal', exact: true }).click();
    const options = await page.getByLabel('Hari', { exact: true }).locator('option').allTextContents();
    expect(options.map(s => s.trim()).filter(s => s && !/pilih|tentukan/i.test(s))).toEqual(['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat']);
  });
  test('TC-PW-JADWAL-003 | Form jadwal kosong ditolak', async ({ page, qa }) => {
    const p = await qa.period();
    await schedulePage(page, p.id);
    await page.getByRole('button', { name: 'Tambah Jadwal', exact: true }).click();
    await page.getByRole('button', { name: 'Tambah Jadwal', exact: true }).last().click();
    await expect(page.getByText(/semua field harus diisi/i)).toBeVisible();
    expect(await qa.schedules(p.id)).toHaveLength(0);
  });
  for (const [n, resource, key, optionKey] of [
    ['004', 'Dosen', 'dosen', 'nama'], ['005', 'Ruang', 'ruang', 'nama'], ['006', 'Kelas', 'kelas', 'kode_kelas'],
  ]) test(`TC-PW-JADWAL-${n} | Konflik ${resource} ditolak, slot kosong tetap bisa dipakai`, async ({ page, qa }) => {
    const s = await qa.seed();
    await qa.call('POST', '/api/penjadwalan', qa.payload(s));
    const before = await qa.schedules(s.p.id);
    await schedulePage(page, s.p.id);
    await page.getByRole('button', { name: 'Tambah Jadwal', exact: true }).click();
    // Select the occupied resource while still on a free day, then move to the occupied day.
    await fillSchedule(page, s, 1, 'Jumat');
    const name = s.options[key][0][optionKey];
    await page.getByLabel(resource, { exact: true }).selectOption({ label: name });
    await page.getByLabel('Hari', { exact: true }).selectOption('Senin');
    await expect(page.getByLabel(resource, { exact: true }).locator('option').filter({ hasText: name })).toBeDisabled();
    await page.getByRole('button', { name: 'Tambah Jadwal', exact: true }).last().click();
    await expect(page.getByText(new RegExp(`${resource}.*sudah|bentrok`, 'i')).first()).toBeVisible();
    await page.reload();
    expect(await qa.schedules(s.p.id)).toEqual(before);
    await schedulePage(page, s.p.id);
    await addSchedule(page, s, 1, 'Jumat');
    expect(await qa.schedules(s.p.id)).toHaveLength(2);
  });
  test('TC-PW-JADWAL-007 | Jadwal baru tersimpan dan muncul pada laporan', async ({ page, qa }) => {
    const s = await qa.seed();
    await schedulePage(page, s.p.id);
    await addSchedule(page, s);
    await schedulePage(page, s.p.id);
    await expect(page.getByRole('cell', { name: s.mk[0].nama, exact: true })).toBeVisible();
    const rows = await qa.schedules(s.p.id);
    expect(rows).toHaveLength(1);
    expect(Number(rows[0].matkul_id)).toBe(s.mk[0].id);
    for (const route of ['dosen', 'ruangan', 'kelas']) {
      await page.goto(`/laporan/${route}`);
      await page.getByLabel('Periode Akademik', { exact: true }).selectOption(String(s.p.id));
      await expect(page.getByText(s.mk[0].nama, { exact: false }).first()).toBeVisible();
    }
  });
  test('TC-PW-JADWAL-008 | Edit jadwal ke slot kosong tersimpan', async ({ page, qa }) => {
    const s = await qa.seed();
    await qa.call('POST', '/api/penjadwalan', qa.payload(s));
    const [original] = await qa.schedules(s.p.id);
    await schedulePage(page, s.p.id);
    await page.getByRole('button', { name: 'Edit Jadwal', exact: true }).click();
    await page.getByLabel('Hari', { exact: true }).selectOption('Jumat');
    await mutation(page, 'PUT', `/api/penjadwalan/${original.id}`, () => page.getByRole('button', { name: /simpan perubahan/i }).click());
    await schedulePage(page, s.p.id);
    const [updated] = await qa.schedules(s.p.id);
    expect(updated.id).toBe(original.id);
    expect(updated.hari.toLowerCase()).toBe('jumat');
    await expect(page.getByRole('row').filter({ hasText: s.mk[0].nama })).toContainText('Jumat');
  });
  test('TC-PW-JADWAL-009 | Hapus jadwal dan gunakan kembali slot', async ({ page, qa }) => {
    const s = await qa.seed();
    await qa.call('POST', '/api/penjadwalan', qa.payload(s));
    const [original] = await qa.schedules(s.p.id);
    await schedulePage(page, s.p.id);
    await page.getByRole('button', { name: 'Hapus Jadwal', exact: true }).click();
    await mutation(page, 'DELETE', `/api/penjadwalan/${original.id}`, () => page.getByRole('button', { name: 'Hapus Data', exact: true }).click());
    await schedulePage(page, s.p.id);
    expect(await qa.schedules(s.p.id)).toHaveLength(0);
    await addSchedule(page, s);
    const after = await qa.schedules(s.p.id);
    expect(after).toHaveLength(1);
    expect(after[0].id).not.toBe(original.id);
  });
  test('TC-PW-JADWAL-010 | Edit konflik tidak mengubah data sebagian', async ({ page, qa }) => {
    const s = await qa.seed();
    await qa.call('POST', '/api/penjadwalan', qa.payload(s));
    await qa.call('POST', '/api/penjadwalan', qa.payload(s, 1, 'Jumat'));
    const before = await qa.schedules(s.p.id);
    for (const [label, key, field] of [['Dosen', 'dosen', 'nama'], ['Ruang', 'ruang', 'nama'], ['Kelas', 'kelas', 'kode_kelas']]) {
      await schedulePage(page, s.p.id);
      await page.getByRole('row').filter({ hasText: s.mk[1].nama }).getByRole('button', { name: 'Edit Jadwal', exact: true }).click();
      await page.getByLabel(label, { exact: true }).selectOption({ label: s.options[key][0][field] });
      await page.getByLabel('Hari', { exact: true }).selectOption('Senin');
      await page.getByRole('button', { name: /simpan perubahan/i }).click();
      await expect(page.getByText(new RegExp(`${label}.*sudah|bentrok`, 'i')).first()).toBeVisible();
      await page.reload();
      expect(await qa.schedules(s.p.id)).toEqual(before);
    }
  });
  test('TC-PW-JADWAL-011 | Dropdown dan jadwal terisolasi antarperiode', async ({ page, qa }) => {
    const a = await qa.seed(); const b = await qa.seed();
    await qa.call('POST', '/api/penjadwalan', qa.payload(a));
    await schedulePage(page, a.p.id);
    await expect(page.getByRole('cell', { name: a.mk[0].nama, exact: true })).toBeVisible();
    await schedulePage(page, b.p.id);
    await expect(page.getByRole('cell', { name: a.mk[0].nama, exact: true })).toHaveCount(0);
    await page.getByRole('button', { name: 'Tambah Jadwal', exact: true }).click();
    for (const [label, key, field] of [['Dosen', 'dosen', 'nama'], ['Ruang', 'ruang', 'nama'], ['Mata Kuliah', 'mata_kuliah', 'nama']]) {
      const options = await page.getByLabel(label, { exact: true }).locator('option').allTextContents();
      expect(options).toContain(b.options[key][0][field]);
      expect(options).not.toContain(a.options[key][0][field]);
    }
    expect(await qa.schedules(b.p.id)).toHaveLength(0);
  });
});

test.describe('Hasil Penjadwalan / Laporan', () => {
  test('TC-PW-HASIL-001 | Navigasi tiga laporan dan filter periode', async ({ page, qa }) => {
    await loginAsAdmin(page);
    const p = await qa.period();
    await page.goto('/laporan/dosen');
    await page.getByLabel('Periode Akademik', { exact: true }).selectOption(String(p.id));
    for (const [label, route] of [['Jadwal Ruang', 'ruangan'], ['Jadwal Kelas', 'kelas'], ['Jadwal Dosen', 'dosen']]) {
      await page.getByRole('button', { name: label, exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`/laporan/${route}$`));
      await expect(page.getByLabel('Periode Akademik', { exact: true })).toHaveValue(String(p.id));
    }
  });
  test('TC-PW-HASIL-002 | Ekspor tersedia bagi Admin dengan periode aktif', async ({ page, qa }) => {
    await loginAsAdmin(page);
    const s = await qa.seed();
    await qa.call('POST', '/api/penjadwalan', qa.payload(s));
    await page.goto('/laporan/dosen');
    await page.getByLabel('Periode Akademik', { exact: true }).selectOption(String(s.p.id));
    await expect(page.getByRole('button', { name: /ekspor ke excel/i })).toBeEnabled();
  });
  test('TC-PW-HASIL-003 | Tombol ekspor tidak dirender untuk Guest sesuai requirement sheet', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /login as guest/i }).click();
    await expect(page).toHaveURL(/\/laporan\/dosen/);
    await expect(page.getByRole('button', { name: /ekspor ke excel/i })).toHaveCount(0);
  });
});
