import { test, expect } from './fixtures';
import { loginAsAdmin } from './helpers';
import { API_URL, masterTab, mutation } from './qa-data';
import { execFileSync } from 'node:child_process';

test.beforeEach(async ({ page }) => { await loginAsAdmin(page); });

test('TC-PW-PERIODE-007 | Copy periode dan ubah salinan tanpa merusak sumber', async ({ page, qa }) => {
  const s = await qa.seed();
  await page.goto('/master-data');
  await page.getByRole('button', { name: 'Tambah Periode Akademik' }).click();
  await page.getByPlaceholder(/contoh: 2026/i).fill('2098');
  await page.getByLabel('Semester', { exact: true }).selectOption('Genap');
  await page.getByPlaceholder(/contoh: Draft 1/i).fill(qa.tag + '-copy');
  await page.getByRole('button', { name: /salin dari/i }).click();
  await page.locator('select').filter({ has: page.locator(`option[value="${s.p.id}"]`) }).selectOption(String(s.p.id));
  const body = await mutation(page, 'POST', '/api/master-data/kurikulum', () => page.getByRole('button', { name: 'Tambah Periode', exact: true }).click());
  const copied = Number(body.data.id); qa.periods.add(copied);
  for (const entity of ['mata-kuliah', 'dosen', 'ruang', 'kelas', 'sesi']) {
    const original = await qa.list(entity, s.p.id);
    const copy = await qa.list(entity, copied);
    expect(copy.length, `Copy ${entity} count`).toBe(original.length);
    // Names/content must be copied, not only empty placeholder records.
    for (const item of original) expect(JSON.stringify(copy)).toContain(item.nama || item.kode_kelas || item.jam_mulai);
  }
  const [room] = await qa.list('ruang', copied);
  await masterTab(page, copied, 'Ruangan');
  await page.getByRole('row').filter({ hasText: room.nama }).getByRole('button', { name: 'Edit Ruangan', exact: true }).click();
  await page.getByPlaceholder(/contoh: CU 205/i).fill(qa.tag + '-copy-edit');
  await mutation(page, 'PUT', `/api/master-data/ruang/${room.id}`, () => page.getByRole('button', { name: /simpan perubahan/i }).click());
  await page.reload();
  await expect(page.getByText(qa.tag + '-copy-edit', { exact: true })).toBeVisible();
  expect((await qa.list('ruang', s.p.id)).map(r => r.nama)).toContain(room.nama);
  expect((await qa.list('ruang', s.p.id)).map(r => r.nama)).not.toContain(qa.tag + '-copy-edit');
});

test('TC-PW-PERIODE-008 | Hapus periode cascade tanpa mengubah kontrol', async ({ page, qa }) => {
  const s = await qa.seed(); const control = await qa.period('-control');
  await qa.call('POST', '/api/penjadwalan', qa.payload(s));
  const owned: Record<string, any[]> = {};
  for (const entity of ['mata-kuliah', 'dosen', 'ruang', 'kelas', 'sesi']) owned[entity] = await qa.list(entity, s.p.id);
  await page.goto('/master-data');
  const card = page.locator('div').filter({ has: page.getByText(s.p.nama, { exact: true }) }).filter({ has: page.locator('button[aria-label="Opsi lainnya"]') }).last();
  await card.getByRole('button', { name: 'Opsi lainnya' }).click();
  await page.getByText(/delete data/i).click();
  await mutation(page, 'DELETE', `/api/master-data/kurikulum/${s.p.id}`, () => page.getByRole('button', { name: 'Hapus Data', exact: true }).click());
  await page.reload();
  await expect(page.getByText(s.p.nama, { exact: true })).toHaveCount(0);
  expect((await qa.raw('GET', `/api/master-data/kurikulum/${s.p.id}`)).status()).toBe(404);
  for (const [entity, items] of Object.entries(owned)) for (const item of items) {
    const r = await qa.raw('GET', `/api/master-data/${entity}/${item.id}`);
    expect(r.status(), `Orphan ${entity}/${item.id}`).toBe(404);
  }
  expect((await qa.call('GET', `/api/master-data/kurikulum/${control.id}`)).description).toBe(qa.tag + '-control');
});

test('TC-PW-KELAS-003 | Generate teori dan praktikum tersimpan', async ({ page, qa }) => {
  const p = await qa.period();
  await masterTab(page, p.id, 'Kelas');
  await page.getByRole('button', { name: 'Tambah Kelas', exact: true }).click();
  await page.getByLabel('Semester', { exact: true }).selectOption('1');
  await page.getByLabel('Jumlah Kelas Teori', { exact: true }).selectOption('2');
  await page.getByLabel('Jumlah Kelas Praktikum', { exact: true }).selectOption('4');
  await mutation(page, 'POST', `/api/master-data/kelas/${p.id}`, () => page.getByRole('button', { name: 'Tambah Kelas', exact: true }).last().click());
  await page.reload();
  const rows = await qa.list('kelas', p.id);
  expect(rows).toHaveLength(6);
  expect(new Set(rows.map(r => r.kode_kelas)).size).toBe(6);
  for (const suffix of ['AA', 'BB', 'A1', 'A2', 'B1', 'B2']) expect(rows.some(r => r.kode_kelas.endsWith(suffix)), suffix).toBeTruthy();
  for (const row of rows) await expect(page.getByRole('cell', { name: row.kode_kelas, exact: true })).toBeVisible();
});

test('TC-PW-SESI-004 | Tambah sesi valid tersimpan setelah reload', async ({ page, qa }) => {
  const p = await qa.period();
  await masterTab(page, p.id, 'Sesi');
  await page.getByRole('button', { name: 'Tambah Sesi', exact: true }).click();
  await page.locator('input[placeholder="00.00 WIB"]').nth(0).fill('07.15 WIB');
  await page.locator('input[placeholder="00.00 WIB"]').nth(1).fill('08.55 WIB');
  await mutation(page, 'POST', `/api/master-data/sesi/${p.id}`, () => page.getByRole('button', { name: 'Tambah Sesi', exact: true }).last().click());
  await page.reload();
  const rows = await qa.list('sesi', p.id);
  expect(rows).toHaveLength(1);
  expect(rows[0].jam_mulai).toContain('07:15'); expect(rows[0].jam_akhir).toContain('08:55');
  await expect(page.getByRole('row').filter({ hasText: '07.15' })).toContainText('08.55');
});

test('TC-PW-RUANG-003 | Regresi duplikat ruang ditolak', async ({ page, qa }) => {
  const p = await qa.period(); const name = qa.tag + '-room';
  await qa.call('POST', `/api/master-data/ruang/${p.id}`, { nama: name });
  await masterTab(page, p.id, 'Ruangan');
  await page.getByRole('button', { name: 'Tambah Ruangan', exact: true }).click();
  await page.getByPlaceholder(/contoh: CU 205/i).fill(name);
  const [response] = await Promise.all([
    page.waitForResponse(r => new URL(r.url()).pathname === `/api/master-data/ruang/${p.id}` && r.request().method() === 'POST'),
    page.getByRole('button', { name: 'Tambah Ruangan', exact: true }).last().click(),
  ]);
  expect.soft(response.status(), 'Duplicate room must be rejected').toBe(400);
  await page.reload();
  expect((await qa.list('ruang', p.id)).filter(r => r.nama === name)).toHaveLength(1);
});

test('TC-PW-DOSEN-003 | Pencarian dosen memfilter tanpa blank page', async ({ page, qa }) => {
  const p = await qa.period(); const names = [qa.tag + '-A', qa.tag + '-B'];
  for (const nama of names) await qa.call('POST', `/api/master-data/dosen/${p.id}`, { nama });
  await masterTab(page, p.id, 'Dosen');
  const search = page.getByPlaceholder(/cari nama dosen/i);
  await search.fill(names[0]);
  await expect(page.getByRole('cell', { name: names[0], exact: true })).toBeVisible();
  await expect(page.getByRole('cell', { name: names[1], exact: true })).toHaveCount(0);
  await search.fill('NONEXISTENT_QA');
  await expect(page.getByText(/tidak ditemukan/i)).toBeVisible();
  await search.fill('');
  for (const name of names) await expect(page.getByRole('cell', { name, exact: true })).toBeVisible();
});

test('TC-PW-DOSEN-004 | Edit nama dosen tersimpan tanpa field lama', async ({ page, qa }) => {
  const p = await qa.period();
  await qa.call('POST', `/api/master-data/dosen/${p.id}`, { nama: qa.tag });
  const [dosen] = await qa.list('dosen', p.id);
  await masterTab(page, p.id, 'Dosen');
  await page.getByRole('button', { name: 'Edit Dosen', exact: true }).click();
  const input = page.getByPlaceholder(/masukan nama lengkap dosen/i);
  await expect(input).toHaveValue(qa.tag);
  await input.fill(qa.tag + '-edit');
  await mutation(page, 'PUT', `/api/master-data/dosen/${dosen.id}`, () => page.getByRole('button', { name: /simpan perubahan/i }).click());
  await page.reload();
  await expect(page.getByRole('cell', { name: qa.tag + '-edit', exact: true })).toBeVisible();
  expect((await qa.call('GET', `/api/master-data/dosen/${dosen.id}`)).nama).toBe(qa.tag + '-edit');
});

test('TC-PW-HASIL-004 | File Excel berisi jadwal periode aktif', async ({ page, qa }, info) => {
  const s = await qa.seed();
  await qa.call('POST', '/api/penjadwalan', qa.payload(s));
  for (const route of ['dosen', 'ruangan', 'kelas']) {
    await page.goto(`/laporan/${route}`);
    await page.getByLabel('Periode Akademik', { exact: true }).selectOption(String(s.p.id));
    const button = page.getByRole('button', { name: /ekspor ke excel/i });
    await expect(button).toBeEnabled();
    const [download] = await Promise.all([page.waitForEvent('download'), button.click()]);
    expect(await download.failure()).toBeNull();
    const path = info.outputPath(`${route}.xlsx`);
    await download.saveAs(path);
    await info.attach(`excel-${route}`, { path, contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    // Parse XML inside the XLSX zip, including shared strings; never accept an HTML error download.
    const text = execFileSync('python3', ['-c', 'import sys,zipfile,xml.etree.ElementTree as E\nz=zipfile.ZipFile(sys.argv[1])\nassert "[Content_Types].xml" in z.namelist()\nprint("\\n".join("".join(E.fromstring(z.read(n)).itertext()) for n in z.namelist() if n.startswith("xl/") and n.endswith(".xml")))', path], { encoding: 'utf8' });
    expect(text, `${route}: downloaded workbook must contain seeded course`).toContain(s.mk[0].nama);
    expect(text).toContain('Senin');
  }
});

test('TC-PW-AUTH-009 | Token expired ditolak saat mutasi', async ({ page, qa }) => {
  const token = process.env.QA_EXPIRED_TOKEN;
  test.skip(!token, 'Butuh JWT expired yang ditandatangani BE: set QA_EXPIRED_TOKEN. Token palsu bukan bukti expired.');
  const payload = JSON.parse(Buffer.from(token!.split('.')[1], 'base64url').toString());
  expect(payload.exp * 1000).toBeLessThan(Date.now());
  const p = await qa.period();
  await qa.call('POST', `/api/master-data/ruang/${p.id}`, { nama: qa.tag });
  await masterTab(page, p.id, 'Ruangan');
  await page.getByRole('button', { name: 'Edit Ruangan', exact: true }).click();
  await page.getByPlaceholder(/contoh: CU 205/i).fill(qa.tag + '-denied');
  await page.evaluate(value => localStorage.setItem('simatkul_token', value), token!);
  const [response] = await Promise.all([page.waitForResponse(r => r.request().method() === 'PUT' && r.url().startsWith(API_URL)), page.getByRole('button', { name: /simpan perubahan/i }).click()]);
  expect([401, 403]).toContain(response.status());
  expect((await qa.list('ruang', p.id))[0].nama).toBe(qa.tag);
  await expect(page.getByText(/unauthorized|forbidden|token|sesi|login|kedaluwarsa/i).first()).toBeVisible();
});
