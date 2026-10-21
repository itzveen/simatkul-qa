# SIMATKUL QA

Repository automation testing untuk **SIMATKUL** — Sistem Informasi Pengaturan Mata Kuliah, Departemen Teknik Elektro dan Informatika UGM.


## Status

| Layer | Tool | Jumlah TC | Status |
|---|---|---|---|
| Manual Testing | Screenshot / Observasi | 46 TC | On Progress |
| UI Automation | Playwright | 32 TC | On Progress |
| API Testing | Postman | 79 TC | Done |

## Struktur Repo

```
simatkul-qa/
├── e2e/                                    # Playwright UI E2E Automation
│   ├── helpers.ts                          # Login helper & shared utilities
│   ├── auth.spec.ts                        # TC Auth (7 TC)
│   ├── master-data-periode.spec.ts         # TC Periode Akademik (7 TC)
│   └── master-data-detail.spec.ts          # TC MK, Ruangan, Dosen, Kelas, Sesi, Hak Akses (18 TC)
├── postman/
│   └── simatkul-postman-collection.json    # 79 API Test Case (Postman)
├── playwright.config.ts                    # Konfigurasi Playwright
├── package.json
└── .gitignore
```

## Environment

| Variabel | Nilai |
|---|---|
| Base URL FE | `http://localhost:5173` |
| Base URL BE | `https://simatkul-be.vercel.app` |
| Admin credentials | `admin` / `admin123` |

## Cara Jalankan Playwright

```bash
# Install dependencies
npm install
npx playwright install chromium

# Jalankan semua test
npm test

# Jalankan per modul
npm run test:auth
npm run test:master-data

# Lihat laporan HTML
npm run test:report

# Mode visual (browser terlihat)
npm run test:ui
```

> Pastikan FE dev server (`npm run dev`) sudah berjalan di `http://localhost:5173` sebelum test dijalankan. Playwright akan otomatis mendeteksi server yang sudah berjalan.

## Cara Jalankan Postman

1. Buka Postman
2. Import `postman/simatkul-postman-collection.json`
3. Jalankan collection (Run Collection)

## QA Stack

| Area | Tool |
|---|---|
| UI Automation | Playwright (TypeScript) |
| API Testing | Postman |
| Manual Testing | Google Sheets + Screenshot |
| Browser | Chromium |

## Commit Convention

```
test(auth): add TC-AUTO-AUTH-006 failed login case
test(master-data): add periode akademik CRUD automation
fix(e2e): update selector after FE component change
docs: update test status after BE recovery
```
