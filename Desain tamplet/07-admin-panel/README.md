# Modul 07: Panel Administrasi Master Data, Batas Suhu, Akun & Audit Logs

**Lokasi File Prototype:**
- **Versi Aktif (v1.0):** [`Desain tamplet/07-admin-panel/index.html`](./index.html) *(Apple HIG Executive Admin Suite, 6 Sub-Modul Terpadu, Multi-Warehouse Context, Reactive Logs & Fonnte Retry)*
- **Versi v1.0 (Arsip):** [`Desain tamplet/07-admin-panel/v1/index.html`](./v1/index.html)

**Mapping Source Code Aplikasi Asli:** 
- `src/app/admin/page.tsx` *(Halaman utama panel administrasi)*
- `src/app/api/admin/warehouses/route.ts` *(Endpoint master warehouse)*
- `src/app/api/admin/warehouse-access/route.ts` *(Endpoint pemetaan hak akses warehouse & default warehouse)*
- `src/app/api/admin/master/route.ts` *(Endpoint master lokasi & master periode per warehouse)*
- `src/app/api/admin/users/route.ts` *(Endpoint manajemen akun pengguna)*
- `src/app/api/admin/settings/route.ts` *(Endpoint pengaturan batas suhu & kunci tanggal)*
- `src/app/api/admin/audit-logs/route.ts` *(Endpoint jejak audit sistem)*
- `src/app/api/notifications/retry/route.ts` *(Endpoint kirim ulang notifikasi Fonnte WA)*

**PRD Acuan:**
- Bagian 6: **FR-001** (Akun Default Awal `admin` / `admin123` & Manajemen Akun)
- Bagian 6: **FR-002** (Ganti Password Mandiri & Enkripsi Bcrypt ≥ 10 salt rounds)
- Bagian 6: **FR-003** (Master Warehouse Contextual Architecture)
- Bagian 6: **FR-004** (Pemetaan Akses Warehouse Pengguna & Penetapan `default_warehouse_id`)
- Bagian 6: **FR-005** (Master Lokasi Pemantauan Suhu per Warehouse)
- Bagian 6: **FR-006** (Master Jadwal Shift Periode per Warehouse)
- Bagian 6: **FR-007** (Pengaturan Batas Suhu Chiller/Ambient & Gembok Hari Libur)
- Bagian 6: **FR-011** (Fitur Buka Kunci Tanggal Khusus untuk Input Susulan Member)
- Bagian 6: **FR-012** (Pencatatan Otomatis Jejak Rekam ke Sheet `AUDIT_LOGS`)
- Bagian 6: **FR-014** (Monitoring WhatsApp Gateway Fonnte & Fitur Retry TS-06)
- Bagian 7: **BR-01** (Inisialisasi Database & Password Default)
- Bagian 7: **BR-04** (Penegakan Akses Tunggal vs Multi-Warehouse)
- Bagian 7: **BR-08** (Data Historis Tidak Boleh Dihapus — Hanya Boleh Dinonaktifkan)
- Bagian 7: **BR-11** (Integritas Jejak Audit Abadi & Tidak Boleh Dimanipulasi)
- Bagian 11: **NFR-03** (Zona Waktu Operasional Terkunci Asia/Jakarta WIB)
- Bagian 11: **NFR-04** (Auditabilitas Menyeluruh Seluruh Perubahan Data)
- Bagian 21: **OQ-01** (Kewajiban Alasan / Mandatory Notes saat Perubahan Data Dilakukan)
- Dokumen Desain: **DESIGN.md Bagian 5 & 7** (Tata Letak Sidebar Desktop, Microcopy Baku, & Token Apple HIG)

**Status Review:** 🟡 Menunggu Peninjauan & Persetujuan Pengguna (*Pending Approval v1.0*)

---

## 1. Identifikasi Modul (Tahap A)

- **Tujuan Modul:** Menyediakan satu pintu pusat kendali bagi Administrator untuk mengelola seluruh data master sistem (gudang, titik pantau, jadwal shift), mengelola akun pengguna dan hak akses, mengatur ambang batas suhu pemicu notifikasi WhatsApp, membuka kunci tanggal lampau secara aman, menguji serta meretry notifikasi WhatsApp, dan menginspeksi jejak audit rekaman perubahan data (*audit trail*) secara transparan.
- **Pengguna Terlibat:**
  1. **Administrator Master:** Memiliki wewenang mutlak untuk mengubah konfigurasi, menambah gudang/lokasi/jadwal, mereset password akun pengguna, dan meninjau seluruh log aktivitas.
  2. **Member (Petugas Lapangan):** Tidak memiliki akses ke modul ini (dilindungi pengamanan backend `role === 'ADMIN'`, TS-01).
- **Data & Entitas yang Dikelola (Sesuai 8 Sheet PRD Bagian 10):**
  1. **Sheet `MASTER_WAREHOUSE`:** `warehouse_id`, `warehouse_code` (`CK01`, `CK02`), `warehouse_name`, `address`, `max_temp_limit`, `is_active`.
  2. **Sheet `USER_WAREHOUSE_ACCESS`:** Relasi `user_id` ↔ `warehouse_id` dan penetapan `default_warehouse_id` di sheet `USERS`.
  3. **Sheet `MASTER_LOKASI`:** `location_id`, `warehouse_id`, `location_name` (`Inbound`, `Storage A`, `Storage B`, `D05 Cold`), `sort_order`, `is_active`.
  4. **Sheet `MASTER_PERIODE`:** `period_id`, `warehouse_id`, `period_label` (`09.00`, `13.00`, `17.00`), `start_time`, `end_time`, `sort_order`, `is_active`.
  5. **Sheet `USERS`:** `user_id`, `username`, `full_name`, `role` (`ADMIN` / `MEMBER`), `default_warehouse_id`, `password_hash`, `is_active`.
  6. **Sheet `SETTINGS`:** Pasangan kunci konfigurasi (`CK01_max_limit`, `CK02_max_limit`, `lock_sunday`, `lock_holidays`, `unlocked_dates_json`).
  7. **Sheet `AUDIT_LOGS`:** `log_id`, `server_timestamp` (WIB), `actor_user_id`, `actor_username`, `actor_role`, `action_category`, `warehouse_id`, `target_reference`, `before_value`, `after_value`, `notes_or_reason`.

---

## 2. Usulan Desain: Apple HIG Executive Admin Suite (Tahap B)

1. **Tata Letak Sidebar Desktop Bersih & Modern:**
   - Mengadopsi struktur aplikasi desktop Apple macOS/iPadOS dengan bilah navigasi samping kiri tetap (`width: 280px`, background `#F8FAFC`, border halus `1px solid rgba(0,0,0,0.08)`).
   - Navigasi dikelompokkan logis: **Master Data** (Gudang, Lokasi & Jadwal, Pengguna) dan **Konfigurasi** (Batas Suhu, Notifikasi WA, Audit Logs).
   - Indikator tab aktif menggunakan aksen kapsul biru iOS (`#0071E3`) dengan bayangan elevasi halus.
2. **Mode Tampilan Ganda (Desktop vs Mobile Shell):**
   - Tersedia tombol pengalih di bilah penguji atas: **🖥️ Desktop Lebar (1380px)** untuk pengalaman administrasi penuh, dan **📱 Mobile View (440px)** dengan menu segmentasi horizontal bergulir dan *Floating Dynamic Island Navbar* di bagian bawah yang sinkron dengan Modul 02, 04, 05, 06.
3. **Penegakan Aturan Bisnis BR-08 (Data Historis Tidak Boleh Dihapus):**
   - Tidak ada tombol "Hapus Data Fisik" (Delete/Drop) pada master gudang, lokasi, jadwal, maupun user. Seluruh penonaktifan hanya mengubah status menjadi `NONAKTIF` (`is_active = FALSE`) sehingga transaksi historis di bulan-bulan sebelumnya tetap utuh dan valid saat diaudit.
4. **Pencatatan Audit Otomatis (BR-11, NFR-04, OQ-01):**
   - Setiap kali Admin mengubah batas suhu, membuka kunci tanggal, mengubah master lokasi/jadwal, atau mereset password, sistem seketika memicu penambahan baris baru di sheet `AUDIT_LOGS` lengkap dengan snapshot perbandingan nilai sebelum (*before*) dan sesudah (*after*).
5. **Tipografi & Microcopy Baku (DESIGN.md Bagian 7):**
   - Tombol dan dialog menggunakan kata kerja baku: *"Tambah Gudang"*, *"Tambah Pengguna"*, *"Buka Kunci Tanggal"*, *"Kirim Ulang WA"*, *"Reset Sandi"*, *"Nonaktifkan"*.

---

## 3. Fitur Interaktif pada Prototype (Tahap C)

1. **Sub-Modul 1: Master Gudang & Hak Akses:**
   - Tabel interaktif daftar cabang (`CK01`, `CK02`).
   - Tombol *"Tambah Gudang"* membuka modal isian kode, nama fasilitas, alamat, dan batas suhu awal.
   - Tombol *"Atur Akses"* membuka modal checklist gudang yang diizinkan untuk setiap petugas serta pemilihan gudang default saat pertama login (FR-004).
2. **Sub-Modul 2: Master Lokasi & Jadwal Shift:**
   - Filter pemilih konteks warehouse (`CK01` / `CK02`) di bagian atas.
   - Mengelola 4 titik lokasi suhu di CK01 dan 3 titik di CK02.
   - Mengelola jadwal shift operasional (`09.00`, `13.00`, `17.00`) dengan jam mulai & selesai.
   - Tombol aktifkan / nonaktifkan seketika memperbarui status tabel dan mencatat log audit.
3. **Sub-Modul 3: Manajemen Akun Pengguna:**
   - Menampilkan daftar akun aktif (`admin`, `budi_santoso`, `ahmad_fauzi`, `hendra_g`) dengan indikator bcrypt hash.
   - Tambah akun baru dengan penetapan role (`ADMIN` / `MEMBER`) dan password default otomatis `admin123`.
   - Tombol *"Reset Sandi"* mereset kata sandi akun target ke default `admin123` dengan klaim wajib ganti sandi saat login berikutnya (FR-001).
4. **Sub-Modul 4: Batas Suhu & Kunci Tanggal:**
   - Input numerik batas suhu maksimal chiller untuk CK01 (`25,0°C`) dan CK02 (`26,0°C`).
   - Toggle switch Apple HIG untuk gembok hari Minggu dan hari libur nasional.
   - Modal *"Buka Kunci Tanggal"* (`DATE_UNLOCK`): Admin memilih tanggal lampau (misal `2026-10-15`), memilih gudang, durasi izin (12/24/48 jam), dan **wajib menginput alasan perubahan** (OQ-01).
5. **Sub-Modul 5: Notifikasi WhatsApp Fonnte & Retry (TS-06):**
   - Menampilkan status gateway Fonnte terhubung.
   - Tabel transaksi overlimit dengan status `SENT` dan `FAILED`.
   - Tombol interaktif **"Kirim Ulang WA"** pada transaksi berstatus FAILED: mengklik tombol memicu simulasi pengiriman ulang ke Fonnte, mengubah status seketika menjadi `SENT (Terkirim)`, dan menghilangkan badge peringatan merah di sidebar.
6. **Sub-Modul 6: Inspeksi Audit Logs Komprehensif:**
   - Filter cepat berdasarkan Kategori Aksi dan Konteks Gudang.
   - Tombol *"Lihat JSON ↗"* pada setiap baris log membuka modal inspektor yang menampilkan kode JSON perbandingan **Before Value** (merah) vs **After Value** (hijau) secara terperinci.

---

## 4. Pemeriksaan Kesesuaian PRD (Tahap D)

| Kebutuhan PRD / Source Code | Status di Prototype | Catatan Implementasi |
|---|---|---|
| **FR-001 (Manajemen Akun & Role)** | ✅ Terpenuhi | CRUD akun pengguna, role ADMIN/MEMBER, default warehouse, password hash bcrypt |
| **FR-002 (Reset Password)** | ✅ Terpenuhi | Aksi reset password mandiri ke `admin123` dengan jejak rekaman di AUDIT_LOGS |
| **FR-003 (Master Warehouse)** | ✅ Terpenuhi | Kelola data gudang (`CK01`, `CK02`), kode, nama, dan batas suhu terisolasi |
| **FR-004 (Hak Akses Multi-Warehouse)** | ✅ Terpenuhi | Pemetaan akses pengguna ke warehouse & penentuan `default_warehouse_id` |
| **FR-005 & FR-006 (Lokasi & Jadwal)** | ✅ Terpenuhi | Manajemen titik pantau dan jadwal shift dengan filter warehouse kontekstual |
| **FR-007 (Pengaturan Batas Suhu)** | ✅ Terpenuhi | Atur ambang batas maksimal pemicu notifikasi WhatsApp Fonnte per warehouse |
| **FR-011 (Buka Kunci Tanggal)** | ✅ Terpenuhi | Buka kunci tanggal susulan untuk Member lengkap dengan isian wajib alasan (OQ-01) |
| **FR-012 (Sheet AUDIT_LOGS)** | ✅ Terpenuhi | Log permanen dengan timestamp WIB, username aktor, aksi, before/after JSON |
| **FR-014 / TS-06 (Fonnte WA & Retry)** | ✅ Terpenuhi | Monitoring status pengiriman WA dan tombol "Kirim Ulang WA" idempoten |
| **BR-08 (Data Historis Aman)** | ✅ Terpenuhi | Tidak ada opsi penghapusan fisik; seluruh penonaktifan berstatus `NONAKTIF` |
| **BR-11 (Integritas Audit Abadi)** | ✅ Terpenuhi | Audit logs terlindungi, tidak dapat diedit atau dihapus oleh siapa pun |
| **Zero Production Code Touched** | ✅ Terpenuhi | Seluruh pengerjaan hanya berada di dalam `Desain tamplet/` |

---

## 5. Ringkasan Milestone Prototype

Dengan selesainya Modul 07, **seluruh 7 modul antarmuka pengguna** telah tuntas dirancang sebagai prototype HTML interaktif:
* **Modul 01:** Halaman Login & Ganti Password — **Approved (v2.1)**
* **Modul 02:** Form Catat Suhu Utama — **Approved (v2.3)**
* **Modul 03:** Overlay Kamera & Watermark GPS — **Approved (v1.0)**
* **Modul 04:** Modal Pindah Warehouse & Menu Profil — **Approved (v1.0)**
* **Modul 05:** Dashboard Pemantauan Operasional — **Approved (v1.1)**
* **Modul 06:** Rekapitulasi Suhu Bulanan & Cetak A4 Landscape — **Approved (v1.2)**
* **Modul 07:** Panel Administrasi Master & Audit — **Ready for Review (v1.0)**
