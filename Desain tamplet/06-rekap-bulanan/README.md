# Modul 06: Rekapitulasi Suhu Bulanan, Cetak A4 Landscape & Ekspor Excel/CSV

**Lokasi File Prototype:**
- **Versi Aktif (v1.2):** [`Desain tamplet/06-rekap-bulanan/index.html`](./index.html) *(Apple HIG Pixel-Perfect Matrix, Zero-Clipping Sticky Columns, Shift Theming Badges, Weekend Tint, A4 Landscape Print, Excel & CSV Export)*
- **Versi v1.0 (Arsip):** [`Desain tamplet/06-rekap-bulanan/v1/index.html`](./v1/index.html)

**Mapping Source Code Aplikasi Asli:** 
- `src/app/reports/monthly/page.tsx` *(Halaman rekapitulasi bulanan)*
- `src/app/api/reports/monthly/route.ts` *(Endpoint matriks bulanan & ekspor)*

**PRD Acuan:**
- Bagian 6: **FR-016** (Rekap Bulanan Matriks & Ekspor)
- Bagian 6: **FR-017** (Master Warehouse Contextual Reporting)
- Bagian 6: **FR-018** (Ekspor Data ke Format Excel `.xlsx` dan CSV)
- Bagian 7: **BR-07** (Aturan Pemicu Suhu > Batas: Penanda Merah ▲)
- Bagian 7: **BR-09** (Representasi Data Kosong: Selalu Berupa Strip "–", Dilarang Keras Angka 0 atau 0,0°C)
- Bagian 11: **NFR-03** (Zona Waktu Operasional Terkunci pada Asia/Jakarta WIB)
- Bagian 11: **NFR-05** (Format Cetak A4 Landscape Rapi & Bebas Terpotong)
- Dokumen Desain: **DESIGN.md Bagian 5.3 & 5.4** (Tabel Matriks Bulanan, Cetak PDF Landscape, dan Ekspor)

**Status Review:** 🟡 Menunggu Peninjauan & Persetujuan Pengguna (*Pending Approval v1.2*)

---

## 1. Identifikasi Modul (Tahap A)

- **Tujuan Modul:** Menyediakan sarana pelaporan resmi bagi manajemen gudang, auditor mutu (QA/QC), dan pengawas cold chain untuk meninjau rekaman suhu seluruh titik pantau selama 1 bulan penuh (tanggal 1 s/d 28/29/30/31), mencetak dokumen fisik resmi bertanda tangan (format A4 Landscape), serta mengekspor data ke format spreadsheet (.xlsx dan .csv) tanpa perlu membuat sheet terpisah setiap bulan.
- **Pengguna Terlibat:**
  1. **Administrator / Supervisor:** Memilih bulan & tahun, menyaring gudang, meninjau ringkasan statistik (suhu min/max), mengoreksi data transaksi (FR-012), mencetak laporan fisik A4, dan mengekspor data.
  2. **Member (Petugas Lapangan):** Memiliki hak akses peninjauan (*read-only*) untuk melihat histori penginputan bulanan tim pada gudang yang diizinkan.
- **Data yang Ditampilkan (Revisi v1.2 Penyempurnaan Total Tabel Matriks):**
  1. **Header Minimalis:** Judul utama *"Rekapitulasi Suhu Bulanan"* dengan tombol aksi cepat (Cetak PDF A4, Ekspor Excel .xlsx, Ekspor CSV).
  2. **Dua Kartu KPI Fokus Ekstrem:** Menampilkan 2 metrik utama: **Suhu Tertinggi** (merah) dan **Suhu Terendah** (biru) lengkap dengan rincian tanggal, titik lokasi, dan jadwal shift.
  3. **Matriks Suhu 31 Hari (Penyempurnaan v1.2 Bebas Glitch):**
     - **Eliminasi Bug Rowspan Sticky:** Setiap baris memiliki sel `col-sticky-3` mandiri dengan pill badge shift tematik (`☀️ 09.00`, `🌤️ 13.00`, `🌙 17.00`), sehingga saat digulir ke samping, sel tanggal tidak pernah terpotong atau tergelincir di balik kolom sticky (*zero clipping*).
     - **Pewarnaan Aksen Shift:** Garis aksen vertikal di kolom nomor urut (`No`) dengan warna tema shift: Amber (`#F59E0B`), Biru (`#0071E3`), dan Indigo (`#6366F1`), serta garis pembatas horizontal tegas antar-shift (`shift-break`).
     - **Penandaan Vertikal Akhir Pekan:** Kolom hari Sabtu dan Minggu memiliki header merah tegas (`#FF3B30`) sekaligus shading merah muda lembut (`#FFF8F8`) di sepanjang kolom tabel body untuk memudahkan scanning mata.
     - **Kolom Ringkasan Bersih:** Hanya menampilkan **Min (°C)** (aksen biru) dan **Max (°C)** (aksen merah jika overlimit) dengan garis pembatas ganda yang membedakannya dari matriks tanggal.
     - **Elevation Shadow:** Efek bayangan halus pada kolom sticky kanan (`box-shadow: 4px 0 10px rgba(0,0,0,0.05)`) memberikan kedalaman visual natural saat digulir.
  4. **Bagian Tanda Tangan Fisik (Sign-off Section):**
     - Kolom 1: *Dibuat Oleh* (Petugas Lapangan / QC Checker).
     - Kolom 2: *Diperiksa Oleh* (Supervisor Logistik & Cold Chain).
     - Kolom 3: *Diketahui Oleh* (Warehouse & Operational Manager).
     - Tanggal pengesahan dan metadata waktu cetak resmi WIB.

---

## 2. Usulan Desain: Apple HIG Matrix & Print-Ready (Tahap B)

1. **Tata Letak Desktop-First Responsif:**
   - Menyediakan tampilan optimal untuk layar lebar/desktop (`max-width: 1360px`) agar ke-31 kolom tanggal dapat ditinjau sekaligus tanpa sesak.
   - Tersedia tombol pengalih ke **Tampilan Mobile (440px)** dengan horizontal scroll dan bar navigasi bawah melayang (*Apple Dynamic Island*) yang tersinkronisasi.
2. **Penegakan Aturan Bisnis BR-09 (Data Kosong Bukan Nol):**
   - Sel jadwal yang belum diisi suhunya konsisten ditampilkan sebagai strip `"–"`. Tidak pernah dikonversi menjadi `0` atau `0,0°C` agar tidak merusak perhitungan analitik rata-rata.
3. **Penanda Visual Suhu Melebihi Batas (BR-07 & DESIGN.md 5.3):**
   - Suhu overlimit (misal `35,5°C`) diberi warna teks merah tebal, latar belakang merah muda lembut (`#FEEBEA`), dan ikon segitiga `▲` agar mudah dikenali tanpa bergantung semata pada persepsi warna.
4. **Header Akhir Pekan Merah Solid (PRD 16.1):**
   - Kolom yang jatuh pada hari Sabtu dan Minggu otomatis diwarnai merah solid (`#FF3B30`) dengan teks putih tebal, baik pada tampilan layar maupun saat dicetak ke printer / PDF.
5. **Cetak Standar A4 Landscape (@media print):**
   - Menggunakan `@page { size: A4 landscape; margin: 8mm 6mm; }` dan `-webkit-print-color-adjust: exact;` sehingga ke-31 kolom tanggal pas memenuhi 1 lembar halaman kertas horizontal tanpa ada kolom yang terpotong. Bilah penguji, navigasi, dan tombol aksi otomatis disembunyikan saat mencetak.

---

## 3. Fitur Interaktif pada Prototype (Tahap C)

1. **Mesin Cetak PDF A4 Landscape:**
   - Mengetuk tombol *"Cetak PDF (A4)"* langsung memicu dialog cetak browser (`window.print()`) dengan stylesheet yang dioptimalkan untuk kertas A4 mendatar.
2. **Mesin Ekspor Excel Asli (.xlsx via SheetJS):**
   - Mengetuk tombol *"Ekspor Excel (.xlsx)"* secara cerdas menghasilkan file spreadsheet berekstensi `.xlsx` asli dengan judul lembar kerja, header tanggal, dan angka suhu yang terformat rapi.
3. **Mesin Ekspor CSV (RFC 4180 dengan UTF-8 BOM):**
   - Mengetuk tombol *"Ekspor CSV"* mengunduh file `.csv` dengan penanda UTF-8 BOM (`\uFEFF`) agar aplikasi Microsoft Excel di Windows dapat langsung membuka data dengan karakter koma desimal Indonesia secara tepat.
4. **Interaksi Detail Transaksi (Apple Lightbox):**
   - Mengklik sel suhu mana pun membuka jendela pop-up rincian audit: foto termometer fisik, watermark WIB & GPS asli, status WhatsApp Fonnte, nama petugas, dan jalur folder Google Drive.
5. **Form Koreksi Transaksi Admin (FR-012):**
   - Khusus akun Administrator, tersedia tombol *"Ubah Data Transaksi"* di dalam modal detail lengkap dengan isian wajib alasan perubahan (mandatory) untuk jejak `AUDIT_LOGS`.
6. **Pengalih Bulan Dinamis (31, 30, 28 Hari):**
   - Memilih Oktober 2026 menghasilkan 31 hari (Sabtu/Minggu: tgl 3, 4, 10, 11, 17, 18, 24, 25, 31).
   - Memilih September 2026 menghasilkan 30 hari.
   - Memilih Februari 2026 menghasilkan 28 hari. Seluruh header dan kolom menyesuaikan seketika tanpa reload halaman.

---

## 4. Pemeriksaan Kesesuaian PRD (Tahap D)

| Kebutuhan PRD / Source Code | Status di Prototype | Catatan Implementasi |
|---|---|---|
| **FR-016 (Rekap Bulanan Matriks)** | ✅ Terpenuhi | Matriks 31 hari terkelompok per periode shift (`09.00`, `13.00`, `17.00`) |
| **FR-017 (Cetak A4 Landscape)** | ✅ Terpenuhi | Format cetak A4 landscape dengan header akhir pekan merah dan blok tanda tangan |
| **FR-018 (Ekspor .xlsx & .csv)** | ✅ Terpenuhi | Ekspor instan ke Excel murni (.xlsx) via SheetJS dan CSV UTF-8 |
| **BR-07 (Penanda Overlimit ▲)** | ✅ Terpenuhi | Suhu melebihi batas (35,5°C) berlatar merah muda dengan segitiga ▲ |
| **BR-09 (Data Kosong Bukan Nol)** | ✅ Terpenuhi | Slot unrecorded konsisten tampil sebagai sel tanda hubung "–" |
| **NFR-03 (Zona Waktu Asia/Jakarta)** | ✅ Terpenuhi | Laporan dan metadata waktu terkunci pada zona waktu resmi WIB |
| **NFR-05 (Format Cetak Rapi)** | ✅ Terpenuhi | `@media print` presisi tanpa terpotong (*no clipping*) pada kertas A4 |
| **Zero Production Code Touched** | ✅ Terpenuhi | Seluruh pengerjaan hanya berada di dalam `Desain tamplet/` |
