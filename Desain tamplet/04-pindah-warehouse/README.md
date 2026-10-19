# Modul 04: Modal Pindah Warehouse & Menu Profil Pengguna

**Lokasi File Prototype:**
- **Versi Aktif (v1.0):** [`Desain tamplet/04-pindah-warehouse/index.html`](./index.html) *(Apple HIG Action Sheet / Inset Grouped)*
- **Versi v1.0 (Arsip):** [`Desain tamplet/04-pindah-warehouse/v1/index.html`](./v1/index.html)

**Mapping Source Code Aplikasi Asli:** 
- `src/components/WarehouseSwitchModal.tsx` *(Modal switcher warehouse)*
- `src/app/page.tsx` *(Navbar profile pill trigger)*
- `src/app/api/warehouses/route.ts` & `src/app/api/warehouses/switch/route.ts` *(API switching context)*

**PRD Acuan:**
- Bagian 6: **FR-002** (Autentikasi & Kewajiban Ganti Password Awal / Mandiri)
- Bagian 6: **FR-018** (Hak Akses & Default Warehouse User per Warehouse)
- Bagian 6: **FR-019** (Pindah Warehouse Eksklusif pada Menu Profil & Konteks Sesi)
- Bagian 7: **BR-04** (Pembatasan Hak Akses Gudang bagi Member)
- Bagian 7: **BR-10** (Validasi Hak Akses Warehouse di Backend)
- Bagian 11: **NFR-03** (Zona Waktu Operasional Terkunci pada Asia/Jakarta WIB)
- Bagian 18: **AC-11** (Pemisahan, Perpindahan Multi-Warehouse, & Default Warehouse)
- Dokumen Desain: **DESIGN.md Bagian 3, 5, & 7** (Apple HIG Modal, Action Sheet, Inset Grouped List, & Microcopy)

**Status Review:** 🟡 Menunggu Peninjauan & Persetujuan Pengguna (*Pending Approval v1.0*)

---

## 1. Identifikasi Modul (Tahap A)

- **Tujuan Modul:** Menyediakan lembar aksi (*Action Sheet / Modal*) yang terintegrasi rapi pada avatar profil pengguna di sudut kanan atas header. Modul ini menjadi pintu gerbang eksklusif bagi petugas (Member) maupun Admin untuk melihat status akun, berpindah gudang aktif (*warehouse switching*) sesuai izin akses yang dimiliki, memperbarui kata sandi secara mandiri (FR-002), melihat kontak supervisor darurat, serta mengakhiri sesi kerja (*logout*).
- **Pengguna Terlibat:**
  1. **Member (Petugas Lapangan):** Melihat identitas akun, berpindah ke cabang gudang lain yang diizinkan untuknya (misal `CK01` ke `CK02`), atau melihat status hak akses tunggal jika hanya ditugaskan pada 1 gudang (BR-04).
  2. **Admin Gudang:** Memiliki wewenang otomatis untuk berpindah ke seluruh warehouse aktif di sistem secara instan tanpa hambatan.
- **Data yang Ditampilkan:**
  1. **Hero Profil:** Foto inisial/avatar, Nama Lengkap (`full_name`), Username unik (`username`), ID Pengguna (`user_id`), dan badge Role (`Member Lapangan` vs `Administrator Master`).
  2. **Daftar Warehouse:** Kode unik (`CK01`, `CK02`, `SBY01`), Nama Warehouse, deskripsi titik pantau & batas suhu operasional, indikator status hijau `✓ Aktif`, serta tombol `Pilih` untuk gudang lain yang diizinkan.
  3. **Keamanan & Kredensial:** Aksi "Ganti Password" (FR-002) dan indikator zona waktu operasional `Asia/Jakarta (WIB)` (NFR-03).
  4. **Bantuan & Operasional:** Kontak supervisor gudang dan status koneksi WhatsApp Group Fonnte API (FR-014).
  5. **Aksi Keluar:** Tombol merah destruktif Apple untuk mengakhiri sesi login aman (JWT Cookie).

---

## 2. Usulan Desain: Apple HIG Action Sheet Experience (Tahap B)

Mengikuti prinsip resmi **Apple Human Interface Guidelines (HIG)**:
1. **Penyajian Lembar Aksi (*Action Sheet Presentation*):**
   - **Tampilan Ponsel (360px – 430px):** Menggunakan pola *Bottom Sheet* dengan sudut atas membulat (`border-radius: 28px 28px 0 0`), bilah pegangan geser (*drag handle grabber pill* `36×5 px`), dan tombol tutup melingkar (`✕`).
   - **Latar Belakang (*Backdrop Blur*):** Lapisan semi-transparan ber-efek kaca buram (`rgba(0, 0, 0, 0.42)` dengan `backdrop-filter: blur(16px)`).
2. **Pola Daftar Inset Terkelompok (*Apple Inset Grouped Pattern*):**
   - Mengelompokkan fungsi menjadi kartu putih (`#FFFFFF`) di atas kanvas abu-abu iOS (`#F2F2F7`).
   - Setiap baris memiliki ikon berwarna dalam squircle 32px (Oranye untuk Ganti Password, Biru untuk Zona Waktu, Hijau untuk Kontak Supervisor, Ungu untuk WA Gateway, Merah untuk Logout).
   - Garis pemisah halus (*hairline divider*) berjarak indentasi 56px dari kiri sesuai kaidah desain iOS.
3. **Indikator Gudang Aktif Berkontras Tinggi:**
   - Gudang yang sedang aktif memiliki sorotan latar belakang halus, ikon biru solid, dan badge hijau Apple System Green `✓ Aktif`.
   - Gudang lain menampilkan tombol aksi `Pilih` dengan micro-feedback seketika.
4. **Penegakan Hak Akses Tunggal (BR-04):**
   - Jika pengguna hanya memiliki izin ke 1 gudang (skenario single warehouse), daftar hanya menampilkan 1 gudang tersebut disertai kotak pemberitahuan ramah (*Info Callout Box*) yang menjelaskan batasan operasional tanpa pesan error yang membingungkan.
5. **Sub-Modal Ganti Password Terpadu (FR-002):**
   - Dialog ganti password dapat dibuka langsung di atas sheet tanpa meninggalkan halaman, dilengkapi fitur intip password (*eye reveal button*) dan validasi minimal 8 karakter serta larangan memakai `admin123`.
6. **Dialog Konfirmasi Logout Destruktif:**
   - Mengadopsi dialog konfirmasi gaya Apple Action Sheet dengan tombol merah tegas (*Apple System Red `#FF3B30`*) dan tombol batal biru.

---

## 3. Fitur Interaktif yang Disimulasikan (Tahap C)

1. **Toolbar Pengujian Cepat (Desktop Testing Bar):**
   - **Toggle Peran:** Beralih antara `Member (Petugas)` dan `Admin` untuk melihat perubahan nama, inisial avatar (`BS` vs `AD`), dan badge peran.
   - **Toggle Skenario Hak Akses:**
     - `Multi Gudang`: Menampilkan akses ke `CK01`, `CK02`, dan `SBY01`.
     - `Akses Tunggal (BR-04)`: Mensimulasikan pengguna yang hanya memiliki wewenang pada `CK01`, mengunci opsi gudang lain dan menampilkan catatan kebijakan keamanan.
   - **Tombol Buka/Tutup Sheet:** Membuka lembar aksi kapan saja.
2. **Simulasi Perpindahan Gudang Nyata (*Realtime Context Switch*):**
   - Mengetuk tombol `Pilih` pada `CK02 (Cikupa Annex)` menampilkan indikator pemrosesan Apple Spinner halus, memperbarui badge aktif ke `CK02`, memunculkan notifikasi Apple Floating Toast, serta secara otomatis memperbarui konteks gudang aktif, nama titik pantau, dan batas suhu pada form latar belakang.
3. **Simulasi Ganti Password (FR-002):**
   - Membuka form ganti password mandiri, menguji validasi password < 8 karakter, validasi password default `admin123`, dan kecocokan konfirmasi password dengan umpan balik visual.
4. **Simulasi Dialog Logout:**
   - Mengetuk "Keluar dari Akun" menampilkan dialog konfirmasi penutupan sesi yang aman.

---

## 4. Pemeriksaan Kesesuaian (Tahap D)

| Kebutuhan PRD / Source Code | Status di Prototype | Catatan Implementasi |
|---|---|---|
| **FR-019 (Pindah Warehouse Eksklusif di Menu Profil)** | ✅ Terpenuhi | Pemilihan gudang tidak diletakkan di header sebagai switch umum, melainkan eksklusif di dalam profil pengguna |
| **FR-018 & BR-10 (Hak Akses per Pengguna)** | ✅ Terpenuhi | Hanya menampilkan gudang yang diizinkan untuk pengguna terkait |
| **BR-04 (Penegakan Akses Tunggal)** | ✅ Terpenuhi | Skenario single access membatasi opsi pindah dan memberikan informasi ramah |
| **FR-002 (Ganti Password Mandiri)** | ✅ Terpenuhi | Sub-modal ganti password dengan validasi minimal 8 karakter dan larangan `admin123` |
| **NFR-03 (Zona Waktu Asia/Jakarta WIB)** | ✅ Terpenuhi | Tercantum sebagai informasi operasional terkunci pada profil |
| **Apple HIG Sheet & Inset Grouped** | ✅ Terpenuhi | Menggunakan kurva pegas iOS, grabber handle, dan inset grouped list dengan squircle icons |
| **Zero Production Code Touched** | ✅ Terpenuhi | Seluruh pengerjaan hanya berada di dalam `Desain tamplet/` |
