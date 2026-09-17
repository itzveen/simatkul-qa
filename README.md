# SIMATKUL QA

Repository dokumentasi & automation testing untuk **SIMATKUL** — sistem penjadwalan mata kuliah (menggantikan proses manual spreadsheet) untuk Departemen Teknik Elektro dan Informatika UGM.

Repo ini dikelola oleh QA Automation sebagai bagian dari tim capstone (PM, Backend, Frontend, UI/UX, QA) yang bekerja secara paralel per sprint mingguan.

## Status

🟡 **Test Case Documentation** — in progress
⚪ **Test Automation (Playwright)** — belum dimulai, menunggu progress Backend/Frontend

## Struktur Repo

```
simatkul-qa/
├── docs/
│   └── TestCase_Management_SIMATKUL.xlsx   # dokumentasi test case (functional, master data, penjadwalan, laporan, API)
├── tests/                                   # (akan diisi setelah testing mulai)
│   ├── e2e/                                 # Playwright UI automation (Page Object Model)
│   └── api/                                 # Playwright/Postman API testing
├── playwright.config.ts                     # (akan ditambahkan)
└── .github/workflows/ci.yml                 # (akan ditambahkan)
```

## Dokumentasi Test Case

Lihat [`docs/TestCase_Management_SIMATKUL.xlsx`](docs/TestCase_Management_SIMATKUL.xlsx) — berisi:

- **Test Case** — functional test case per modul (Autentikasi, Master Data, Penjadwalan, Laporan)
- **API Test Case** — test case level endpoint (masih draft/asumsi, menunggu kontrak API resmi dari BE)
- **Bug Report** — pelaporan bug (kosong, karena development belum berjalan)
- **Dashboard** & **Recap Test Case / Recap Bug** — rekap otomatis via formula

Baris berwarna kuning pada dokumen = asumsi yang masih perlu dikonfirmasi ke tim BE/FE/PM.

## QA Stack

| Area | Tools |
|---|---|
| Automation framework | Playwright |
| Design pattern | Page Object Model (POM) |
| Test documentation | Excel (Test Case & Bug Management) |
| Scope | Functional (Manual), API Testing, UI Automation, Security Testing |

## Cara Kerja

1. Test case didokumentasikan lebih dulu di `docs/` sebelum automation ditulis.
2. Setiap kali melakukan testing, hasil (Passed/Failed) diupdate di file test case, dan perubahan di-push ke repo ini.
3. Commit mengikuti format [Conventional Commits](https://www.conventionalcommits.org/), contoh:
   ```
   test(auth): implement TC-AUTH-002 negative login case
   docs: update recap test case setelah revisi kontrak API
   fix(api): update TC-API-JADWAL-002 sesuai kontrak API resmi
   ```
4. Bug yang ditemukan selama testing dicatat di tab **Bug Report** pada file test case.

## Terkait

- Backend: Express
- Frontend: React/Next.js
- QA stack independen dari keputusan tech stack BE/FE di atas.
