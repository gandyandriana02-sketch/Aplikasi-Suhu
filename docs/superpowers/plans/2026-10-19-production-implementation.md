# Rencana Implementasi Produksi (Production Implementation Plan)
## Penerapan 7 Modul Desain Prototype Apple HIG ke Next.js (`src/*`)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

---

### Ringkasan & Latar Belakang

Seluruh 7 modul prototype visual dan interaksi pada direktori `Desain tamplet/` telah selesai dibangun dan **100% disetujui (Approved)** oleh Product Owner:
1. **Modul 01:** Halaman Login & Ganti Password Awal (Approved v2.1)
2. **Modul 02:** Form Catat Suhu Utama (Approved v2.3)
3. **Modul 03:** Overlay Kamera Bukti & Watermark GPS (Approved v1.0)
4. **Modul 04:** Modal Pindah Warehouse & Menu Profil Pengguna (Approved v1.0)
5. **Modul 05:** Dashboard Pemantauan Operasional Bento Grid (Approved v1.1)
6. **Modul 06:** Rekapitulasi Suhu Bulanan, Cetak A4 Landscape & Ekspor (Approved v1.2)
7. **Modul 07:** Panel Administrasi Master Data, Akun & Audit Logs (Approved v1.0)

Rencana kerja ini menjabarkan langkah-langkah implementasi terstruktur untuk mentranslasikan desain prototype tersebut ke dalam kode aplikasi produksi Next.js (`src/*`), dengan tetap mempertahankan seluruh logika bisnis PRD (BR-01 s/d BR-11), integritas skema data Google Sheets, Google Drive REST API v3, Fonnte WA Gateway, dan isolasi kredensial.

---

### Struktur File yang Dikerjakan

```
src/
├── app/
│   ├── globals.css                       (Task 1: Apple HIG Design Tokens & Theme Foundation)
│   ├── layout.tsx                        (Task 1: Metadata, font stack, dan shell wrapper)
│   ├── login/
│   │   └── page.tsx                      (Task 2: Porting Modul 01 Login & Ganti Password)
│   ├── page.tsx                          (Task 3: Porting Modul 02 Form Catat Suhu Utama)
│   ├── dashboard/
│   │   └── page.tsx                      (Task 5: Porting Modul 05 Dashboard Bento & Matriks)
│   ├── reports/
│   │   └── page.tsx                      (Task 6: Porting Modul 06 Rekap Bulanan & Cetak A4)
│   └── admin/
│       └── page.tsx                      (Task 7: Porting Modul 07 Panel Administrasi Master)
└── components/
    ├── AppShell.tsx                      (Task 1: Frame aplikasi responsif desktop/mobile)
    ├── AppHeader.tsx                     (Task 1 & 4: Apple Glassmorphism Header & Profil Pill)
    ├── BottomNav.tsx                     (Task 1: Apple Floating Bottom Island Navbar)
    ├── CameraCaptureModal.tsx            (Task 3: Porting Modul 03 Camera HUD & Watermark)
    ├── WarehouseSwitchModal.tsx          (Task 4: Porting Modul 04 Action Sheet Pindah WH)
    ├── ChangePasswordModal.tsx           (Task 4: Porting Modul 04 Sub-Modal Ganti Sandi)
    └── admin/
        ├── AdminWarehousesTab.tsx        (Task 7: Master Gudang & Akses)
        └── AdminWarehouseAccessTab.tsx   (Task 7: Matriks Hak Akses User)
```

---

### Rincian Tugas (Tasks)

#### Task 1: Fondasi Desain Tokens Apple HIG & Navigasi Kapsul Melayang (Floating Bottom Island)
- [x] **File:** `src/app/globals.css`
  - Perbarui token CSS dengan standar Apple HIG: font stack SF Pro (`-apple-system`, `BlinkMacSystemFont`), background `--surface: #F2F2F7`, border radius Apple (16px card, 34px island capsule, 10px control), dan kurva transisi halus `cubic-bezier(0.2, 0.9, 0.25, 1)`.
  - Tambahkan utilitas `.apple-view-enter`, `.apple-blur-island`, dan styling print A4 landscape `@page`.
- [x] **File:** `src/components/BottomNav.tsx`
  - Terapkan standarisasi Apple Floating Bottom Island: `bottom: 24px`, `border-radius: 34px`, backdrop blur `25px`, aksen biru iOS `#0071E3`, clearance bottom padding `150px`.
  - Sinkronkan 4 tab: Dashboard (`/dashboard`), Catat Suhu (`/`), Rekap Bulanan (`/reports`), dan Admin (`/admin`, khusus role ADMIN).
- [x] **File:** `src/components/AppShell.tsx` & `src/components/AppHeader.tsx`
  - Pastikan header menggunakan frosted glass blur, pill profil di kanan atas, dan pembatasan lebar responsif yang rapi.
- [x] **Verifikasi:** Uji server `http://localhost:3001` pada ukuran 390px (mobile) dan 1200px (desktop), pastikan navbar melayang rapi dan bebas jitter.

---

#### Task 2: Modul 01 — Halaman Login & Ganti Password Awal
- [x] **File:** `src/app/login/page.tsx`
  - Terapkan layout Mobile-First Minimalist dari `Desain tamplet/01-login/index.html` (v2.1).
  - Terapkan tombol intip password (ikon mata SF Symbols), efek getar error (shake animation), dan pembersihan status bar/label cold chain berlebih.
  - Integrasikan penanganan HTTP 403 saat pengguna pertama kali login dengan password default `admin123` untuk memicu formulir Ganti Password Wajib (FR-001, FR-002, BR-01).
- [x] **Verifikasi:** Uji alur login pada browser, pastikan validasi error dan form ganti sandi berfungsi mulus.

---

#### Task 3: Modul 02 & 03 — Form Catat Suhu Utama & Overlay Kamera Watermark
- [x] **File:** `src/app/page.tsx` (Form Catat Suhu Utama)
  - Terapkan segmented control jadwal shift 4-kolom dari `Desain tamplet/02-catat-suhu/index.html` (v2.3).
  - Terapkan pewarnaan dinamis adaptif per shift: Shift Pagi Amber (`#F59E0B`), Shift Siang Biru (`#0071E3`), Shift Sore Indigo (`#6366F1`).
  - Hubungkan kartu input suhu per lokasi, input numerik besar dengan tombol stepper Apple, dan dua opsi penyimpanan: Simpan per Lokasi dan Simpan Semua (batch save).
- [x] **File:** `src/components/CameraCaptureModal.tsx` (Overlay Kamera & Watermark)
  - Terapkan Apple Camera HIG Viewfinder dari `Desain tamplet/03-kamera-watermark/index.html` (v1.0): frame gelap, grid pandu komposisi optik, kotak fokus berdenyut, dan tombol shutter ganda Apple 76px.
  - Terapkan pembubuhan watermark kanvas permanen: Waktu WIB (`Asia/Jakarta`), Nama Lokasi, Nama Petugas, Koordinat GPS, dan kompresi JPEG sisi klien < 350 KB (NFR-01, BR-06).
- [x] **Verifikasi:** Uji input suhu, tombol kamera, pembubuhan watermark pada kanvas, dan alur simpan ke Google Drive/Sheets.

---

#### Task 4: Modul 04 — Modal Pindah Warehouse & Menu Profil Pengguna
- [x] **File:** `src/components/WarehouseSwitchModal.tsx`
  - Terapkan Apple HIG Action Sheet (slide-up bottom sheet dengan spring animation) dari `Desain tamplet/04-pindah-warehouse/index.html` (v1.0).
  - Tampilkan profil hero petugas (avatar inisial, username, role badge).
  - Tampilkan daftar gudang aktif yang diizinkan untuk pengguna tersebut, tombol pilih gudang, dan penegakan Hak Akses Tunggal (BR-04).
  - Hubungkan tombol Buka Modal Ganti Password Mandiri dan Tombol Logout Merah dengan konfirmasi.
- [x] **File:** `src/components/ChangePasswordModal.tsx`
  - Terapkan formulir ganti password mandiri (FR-002) dengan validasi sandi minimal 8 karakter dan larangan password default.
- [x] **Verifikasi:** Buka menu profil dari header kanan atas, uji perpindahan gudang aktif, dan uji buka modal ganti sandi.

---

#### Task 5: Modul 05 — Dashboard Pemantauan Operasional
- [x] **File:** `src/app/dashboard/page.tsx`
  - Terapkan Bento KPI Grid dari `Desain tamplet/05-dashboard/index.html` (v1.1): kartu progres kelengkapan slot (`7/12 Slot`), kartu hero suhu tertinggi & terendah, kartu alert overlimit berdenyut, dan kartu live WhatsApp Fonnte gateway.
  - Terapkan Matriks Pemeriksaan Slot Interaktif 2D: Jadwal Shift × Titik Lokasi. Sel interaktif dapat diklik, data kosong bertanda strip `-` (BR-09, tidak pernah `0`), dan warna sel adaptif.
  - Terapkan Segmented Control Filter Gudang Konsolidasi khusus Administrator (`Semua Gudang`, `CK01`, `CK02`) (FR-020).
  - Terapkan Feed Transaksi Terkini dan Lightbox Detail Audit Transaksi dengan foto fisik Google Drive & metadata GPS.
- [x] **Verifikasi:** Buka `/dashboard`, uji filter gudang, klik sel matriks untuk memicu lightbox modal audit.

---

#### Task 6: Modul 06 — Rekapitulasi Suhu Bulanan, Cetak A4 Landscape & Ekspor
- [x] **File:** `src/app/reports/page.tsx` (atau `src/app/reports/monthly/page.tsx`)
  - Terapkan Matriks Suhu Bulanan 31 Hari Terkelompok Shift dari `Desain tamplet/06-rekap-bulanan/index.html` (v1.2).
  - Hilangkan bug clipping sticky: setiap baris memiliki sel sticky mandiri dengan badge shift tematik dan garis pembatas shift tegas.
  - Terapkan header akhir pekan merah solid dan arsiran lembut kolom vertikal Sabtu/Minggu.
  - Terapkan kolom ringkasan Min & Max (Avg dan Over ditiadakan sesuai arahan pengguna).
  - Terapkan tombol Cetak PDF Format A4 Landscape (`@page { size: A4 landscape; margin: 8mm 6mm; }`) dengan 3 kolom tanda tangan pengesahan audit (QC, Spv, Manager).
  - Integrasikan mesin ekspor Excel (.xlsx via SheetJS) dan CSV (RFC 4180 BOM).
- [x] **Verifikasi:** Uji buka `/reports`, filter bulan/tahun, uji tombol Cetak PDF (preview print dialog), dan uji unduh file `.xlsx` / `.csv`.

---

#### Task 7: Modul 07 — Panel Administrasi Master Data, Akun & Audit Logs
- [x] **File:** `src/app/admin/page.tsx` & komponen sub-tab
  - Terapkan tata letak Apple HIG Executive Admin Suite dari `Desain tamplet/07-admin-panel/index.html` (v1.0) dengan 6 sub-modul:
    1. **Master Gudang & Hak Akses:** CRUD gudang, aktif/nonaktifkan (BR-08), modal pemetaan akses user ke gudang.
    2. **Master Lokasi & Jadwal Shift:** Pengelolaan titik sensor & jadwal per gudang aktif.
    3. **Manajemen Akun Pengguna:** Pengelolaan user, role, status aktif, dan modal reset password ke default ter-hash bcrypt.
    4. **Pengaturan Batas Suhu & Kunci Tanggal:** Pengaturan batas suhu per gudang, toggle gembok hari libur, dan fitur Buka Kunci Tanggal (`DATE_UNLOCK`, FR-011) dengan isian wajib alasan (OQ-01).
    5. **Notifikasi WhatsApp & Retry:** Status gateway Fonnte, monitoring pesan overlimit `SENT`/`FAILED`, dan tombol aksi Kirim Ulang WA (TS-06).
    6. **Audit Logs Komprehensif:** Tabel jejak rekam WIB dan modal inspeksi nilai Sebelum vs Sesudah (JSON).
- [x] **Verifikasi:** Login sebagai Admin, jelajahi ke-6 tab administrasi, pastikan seluruh aksi berjalan dan tercatat di `AUDIT_LOGS`.

---

#### Task 8: Pengujian Menyeluruh (Verification & End-to-End Build)
- [x] Jalankan `npm run build` untuk memverifikasi tidak ada error TypeScript, linting, atau kegagalan kompilasi Next.js.
- [x] Verifikasi kepatuhan seluruh aturan bisnis PRD (BR-01 s/d BR-11).
- [x] Jalankan daftar periksa `docs/DESIGN.md` Bagian 11 untuk responsivitas viewport 360px, 768px, dan 1440px.
