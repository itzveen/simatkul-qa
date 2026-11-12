import { expect, type APIRequestContext, type Page, type TestInfo } from '@playwright/test';

export const API_URL = process.env.API_URL || 'https://simatkul-be.vercel.app';
export class QAData {
  readonly tag = `QA-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  readonly periods = new Set<number>();
  readonly evidence: unknown[] = [];
  token = '';
  constructor(readonly request: APIRequestContext, readonly info: TestInfo) {}
  async init() {
    const r = await this.request.post(`${API_URL}/api/auth/login`, { data: { username: process.env.QA_USERNAME || 'admin', password: process.env.QA_PASSWORD || 'admin123' } });
    expect(r.status(), 'Fixture login API').toBe(200);
    this.token = (await r.json()).token;
  }
  async raw(method: string, path: string, data?: unknown) {
    return this.request.fetch(API_URL + path, { method, data, headers: { Authorization: `Bearer ${this.token}` }, timeout: 20_000 });
  }
  async call(method: string, path: string, data?: unknown) {
    const r = await this.raw(method, path, data);
    const body = await r.json();
    this.evidence.push({ method, path, status: r.status(), body });
    expect(r.ok(), `${method} ${path}: ${JSON.stringify(body)}`).toBeTruthy();
    return body.data;
  }
  async period(suffix = '') {
    const data = await this.call('POST', '/api/master-data/kurikulum', { tahun_ajaran: 2098, semester: 'Ganjil', description: this.tag + suffix });
    expect(data?.id, 'Created period ID required for safe cleanup').toBeTruthy();
    this.periods.add(Number(data.id));
    return data;
  }
  async list(entity: string, period: number) {
    const data = await this.call('GET', `/api/master-data/${entity}/kurikulum/${period}`);
    const rows = Array.isArray(data) ? data : data?.data;
    expect(Array.isArray(rows), `List ${entity} must be an array`).toBeTruthy();
    return rows as any[];
  }
  async seed(period?: any) {
    const p = period || await this.period();
    const name = (kind: string, i: number) => `${this.tag}-${p.id}-${kind}${i}`;
    for (const i of [0, 1]) {
      const outcomes = await Promise.allSettled([
        this.call('POST', `/api/master-data/dosen/${p.id}`, { nama: name('D', i) }),
        this.call('POST', `/api/master-data/ruang/${p.id}`, { nama: name('R', i) }),
        this.call('POST', `/api/master-data/mata-kuliah/${p.id}`, { kode: String(801 + i), nama: name('MK', i), sks: 1, prodi: 'TRPL', semester: 1, jenis: 'Wajib', kelompok: 'Teori', tipe_kelas: 'MKK' }),
        this.call('POST', `/api/master-data/sesi/${p.id}`, { nama: i + 1, jam_mulai: i ? '09:00:00' : '07:00:00', jam_akhir: i ? '10:00:00' : '08:00:00' }),
      ]);
      for (const outcome of outcomes) if (outcome.status === 'rejected') throw outcome.reason;
    }
    await this.call('POST', `/api/master-data/kelas/${p.id}`, { prodi: 'TRPL', semester: 1, kelas_teori: 2, kelas_praktikum: 4 });
    const options = await this.call('GET', `/api/penjadwalan/form-options/${p.id}`);
    const mk = await this.list('mata-kuliah', p.id);
    return { p, options, mk };
  }
  payload(seed: any, index = 0, hari = 'Senin') {
    return { kurikulum_id: seed.p.id, matkul_id: seed.mk[index].id, ruang_id: seed.options.ruang[index].id, kelas_id: seed.options.kelas[index].id, hari, sesi_ids: [seed.options.sesi[0].id], dosen_ids: [seed.options.dosen[index].id] };
  }
  async schedules(id: number) {
    const data = await this.call('GET', `/api/penjadwalan/${id}`);
    const rows = Array.isArray(data) ? data : data?.jadwal;
    expect(Array.isArray(rows), 'Schedules response shape').toBeTruthy();
    return rows as any[];
  }
  async cleanup() {
    const failures: string[] = [];
    for (const id of [...this.periods].reverse()) {
      const r = await this.raw('DELETE', `/api/master-data/kurikulum/${id}`);
      this.evidence.push({ cleanupPeriod: id, status: r.status() });
      if (!r.ok() && r.status() !== 404) failures.push(`Period ${id}: HTTP ${r.status()}`);
    }
    await this.info.attach('api-evidence', { body: JSON.stringify(this.evidence, null, 2), contentType: 'application/json' });
    expect(failures, 'Cleanup failed; see owned IDs in api-evidence').toEqual([]);
  }
}

export async function masterTab(page: Page, id: number, tab: string) {
  const paths: Record<string, string> = { Kurikulum: 'kurikulum', Ruangan: 'ruangan', Dosen: 'dosen', Kelas: 'kelas', Sesi: 'sesi' };
  await page.goto(`/master-data/${id}/${paths[tab]}`);
  await expect(page.getByRole('button', { name: tab, exact: true })).toBeVisible();
}
export async function mutation(page: Page, method: string, path: string, action: () => Promise<unknown>) {
  const [r] = await Promise.all([
    page.waitForResponse(r => new URL(r.url()).pathname === path && r.request().method() === method),
    action(),
  ]);
  expect(r.ok(), `${method} ${path}: ${await r.text()}`).toBeTruthy();
  return r.json();
}
export async function schedulePage(page: Page, id: number) {
  await page.goto('/penjadwalan');
  const select = page.locator('select').first();
  await expect(select.locator(`option[value="${id}"]`)).toHaveCount(1);
  const response = page.waitForResponse(r => new URL(r.url()).pathname === `/api/penjadwalan/form-options/${id}`);
  await select.selectOption(String(id));
  expect((await response).ok()).toBeTruthy();
  await expect(page.getByRole('button', { name: /tambah jadwal/i })).toBeEnabled();
}
export async function fillSchedule(page: Page, seed: any, index = 0, hari = 'Senin') {
  await page.getByLabel('Hari', { exact: true }).selectOption(hari);
  await page.getByLabel('Sesi', { exact: true }).selectOption('1');
  await page.getByLabel('Mata Kuliah', { exact: true }).selectOption({ label: seed.mk[index].nama });
  await page.getByLabel('Dosen', { exact: true }).selectOption({ label: seed.options.dosen[index].nama });
  await page.getByLabel('Kelas', { exact: true }).selectOption({ label: seed.options.kelas[index].kode_kelas });
  await page.getByLabel('Ruang', { exact: true }).selectOption({ label: seed.options.ruang[index].nama });
}
export async function addSchedule(page: Page, seed: any, index = 0, hari = 'Senin') {
  await page.getByRole('button', { name: 'Tambah Jadwal', exact: true }).click();
  await fillSchedule(page, seed, index, hari);
  await mutation(page, 'POST', '/api/penjadwalan', () => page.getByRole('button', { name: 'Tambah Jadwal', exact: true }).last().click());
  await expect(page.getByRole('heading', { name: 'Tambah Jadwal', exact: true })).toBeHidden();
}
