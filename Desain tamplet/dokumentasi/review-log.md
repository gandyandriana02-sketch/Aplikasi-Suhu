# Log Review & Persetujuan Desain Prototype

Dokumen ini mencatat riwayat versi, pengajuan review, catatan umpan balik, dan status persetujuan eksplisit dari Product Owner sesuai aturan **MASTER INSTRUCTION — HTML PROTOTYPE FIRST, APPROVAL-BASED DEVELOPMENT**.

---

## Tabel Status Modul

| No | Modul | File Prototype | Versi | Status Review | Tanggal Pengajuan | Tanggal Disetujui | Catatan / Tindak Lanjut |
|---|---|---|---|---|---|---|---|
| **01** | **Halaman Login & Ganti Password** | `Desain tamplet/01-login/index.html` | **v2.1** | 🟢 **Disetujui (Approved)** | 18 Okt 2026 | 18 Okt 2026 | Mobile-First Minimalist disetujui pengguna; status bar dan label cold chain dihapus bersih. Menjadi acuan produksi. |
| **02** | **Form Catat Suhu (Member & Admin)** | `Desain tamplet/02-catat-suhu/index.html` | **v2.3** | 🟢 **Disetujui (Approved)** | 18 Okt 2026 | 18 Okt 2026 | Standarisasi Apple HIG, segmented control 4-kolom, font SF Pro, icon SF Symbols, dan pewarnaan tematik dinamis shift (Pagi Amber, Siang Biru, Sore Indigo) disetujui pengguna. Menjadi acuan produksi. |
| **03** | **Overlay Kamera Bukti & Watermark** | `Desain tamplet/03-kamera-watermark/index.html` | **v1.0** | 🟢 **Disetujui (Approved)** | 18 Okt 2026 | 18 Okt 2026 | Jendela bidik kamera iOS, auto-watermark kanvas WIB/GPS, dan kompresi JPEG disetujui pengguna ("lanjut"). Menjadi acuan produksi. |
| **04** | **Modal Pindah Warehouse (Menu Profil)** | `Desain tamplet/04-pindah-warehouse/index.html` | **v1.0** | 🟢 **Disetujui (Approved)** | 18 Okt 2026 | 18 Okt 2026 | Lembar aksi Apple HIG profil pengguna, warehouse switching (FR-019), penegakan akses tunggal (BR-04), dan ganti password mandiri disetujui pengguna ("lanjjut"). Menjadi acuan produksi. |
| **05** | **Dashboard Pemantauan Operasional** | `Desain tamplet/05-dashboard/index.html` | **v1.1** | 🟢 **Disetujui (Approved)** | 18 Okt 2026 | 19 Okt 2026 | Bento KPI grid visual, matriks slot 2D lokasi × jadwal (BR-09), segmented filter gudang Admin (FR-020), lightbox audit GPS, dan standarisasi floating island navbar disetujui pengguna ("lanjut"). Menjadi acuan produksi. |
| **06** | **Rekapitulasi Suhu Bulanan & Cetak** | `Desain tamplet/06-rekap-bulanan/index.html` | **v1.2** | 🟢 **Disetujui (Approved)** | 19 Okt 2026 | 19 Okt 2026 | Matriks 31 hari horizontal terkelompok shift, eliminasi bug clipping sticky, penanda akhir pekan merah & shading vertikal, shift pill badges tematik, cetak A4 landscape, ekspor Excel/CSV disetujui pengguna ("lanjut"). Menjadi acuan produksi. |
| **07** | **Panel Administrasi Master & Audit** | `Desain tamplet/07-admin-panel/index.html` | **v1.0** | 🟢 **Disetujui (Approved)** | 19 Okt 2026 | 19 Okt 2026 | Panel Administrasi Master Apple HIG disetujui pengguna ("lanjut"). Seluruh 7 modul prototype telah selesai 100% dan disetujui sebagai acuan produksi. |

---

## Log Riwayat Pengajuan & Keputusan

### Pengajuan 15 — Modul 07: Panel Administrasi Master Data, Batas Suhu, Akun & Audit Logs (Versi 1.0)
* **Tanggal:** 19 Oktober 2026
* **Keputusan Pengguna:** Disetujui (Approved) ("lanjut").
* **Alasan Pengerjaan:** Melanjutkan alur kerja prototype setelah Modul 06 disetujui pengguna ("lanjut").
* **Cakupan Modul 07 (v1.0):**
  1. **Navigasi Sidebar Desktop & Mobile Tab Switcher:** Menu samping konsisten Apple HIG dengan 6 sub-modul terpadu: (1) Master Gudang & Akses, (2) Master Lokasi & Jadwal, (3) Manajemen Pengguna, (4) Pengaturan & Batas Suhu, (5) Notifikasi WhatsApp & Retry, (6) Audit Logs.
  2. **Master Gudang & Hak Akses Multi-Warehouse (FR-003, FR-004, BR-08, BR-10):**
     - Tabel master warehouse (`CK01`, `CK02`) dengan status aktif/nonaktif.
     - Tambah gudang baru dan ubah nama/kode tanpa menghapus data historis (BR-08).
     - Modal penetapan akses user ke gudang dan penetapan `default_warehouse_id`.
  3. **Master Lokasi & Jadwal Shift Terstruktur (FR-005, FR-006, BR-08):**
     - Filter berdasarkan warehouse aktif.
     - Pengelolaan titik pantau (`Inbound`, `Storage A`, `Storage B`, `D05 Cold`) lengkap dengan urutan tampilan dan tombol aktif/nonaktifkan.
     - Pengelolaan jadwal shift (`09.00`, `13.00`, `17.00`) dengan jam mulai/selesai operasional.
  4. **Manajemen Akun Pengguna & Keamanan (FR-001, FR-002, BR-01):**
     - Tabel akun pengguna: Username, Nama Lengkap, Peran (`ADMIN` / `MEMBER`), Default Warehouse, Status (`AKTIF` / `NONAKTIF`).
     - Tambah Pengguna Baru, Ubah Profil Akun, Nonaktifkan Akun, dan Reset Password (ke password default terenkripsi bcrypt).
  5. **Pengaturan Batas Suhu, Jam Operasional & Pembukaan Tanggal (FR-007, FR-011):**
     - Pengaturan batas suhu chiller/ambient per warehouse (contoh: `25,0°C`).
     - Gembok Hari Minggu & Libur Nasional.
     - Fitur Buka Kunci Tanggal Tertentu (`DATE_UNLOCK`) untuk input data susulan oleh Member dengan isian wajib alasan (OQ-01 / AUDIT_LOGS).
  6. **Notifikasi WhatsApp & Antrean Retry Fonnte (FR-014, TS-06):**
     - Tabel antrean pengiriman WhatsApp Fonnte: status `SENT`, `PENDING`, `FAILED`.
     - Tombol aksi *"Kirim Ulang WA"* untuk retry idempoten tanpa duplikasi pengiriman.
  7. **Audit Logs Komprehensif (FR-012, BR-11, NFR-04):**
     - Jejak rekam seluruh aktivitas sistem: Timestamp (Asia/Jakarta WIB), Aktor & Peran, Kategori Aksi, Konteks Warehouse, Objek Target.
     - Modal inspeksi detail nilai Sebelum (`before_value`) vs Sesudah (`after_value`) dan alasan perubahan data (`notes_or_reason`).
* **Status:** Disetujui (Approved v1.0). Menjadi acuan produksi.

---

### Pengajuan 14 — Modul 06: Rekapitulasi Suhu Bulanan (Versi 1.2 — Penyempurnaan Total Tabel Matriks)
* **Tanggal:** 19 Oktober 2026
* **Keputusan Pengguna:** Disetujui (Approved) untuk lanjut ke Modul 07 ("lanjut").
* **Alasan Pengerjaan:** Respons terhadap arahan perbaikan tabel: *"perbaiki tabel nya"*.
* **Penyempurnaan Total Tabel Matriks pada v1.2:**
  1. **Eliminasi Bug Rowspan Sticky (Bebas Potong Angka / Zero Clipping):** Sebelumnya, `col-sticky-3` menggunakan `rowspan="4"` yang menyebabkan browser Chromium/Safari tidak merender latar sticky pada baris 2-4 sehingga angka tanggal terpotong saat digulir. Kini setiap baris memiliki sel sticky mandiri dengan pill badge shift tematik (`☀️ 09.00`, `🌤️ 13.00`, `🌙 17.00`) yang terkunci solid dan rapi.
  2. **Sinkronisasi Warna Shift Sesuai Modul 02 & 05:** Menambahkan aksen bar berwarna pada kolom `No` sesuai shift: Shift Pagi Amber (`#F59E0B`), Shift Siang Biru (`#0071E3`), Shift Sore Indigo (`#6366F1`).
  3. **Garis Pemisah Antar-Shift (*Shift Divider Break*):** Menambahkan garis pembatas horizontal tegas (`border-top: 2.5px solid #64748B`) yang memisahkan blok shift pagi, siang, dan sore secara instan.
  4. **Pewarnaan Kolom Vertikal Akhir Pekan (*Weekend Tinting*):** Selain header Sabtu & Minggu berwarna merah tegas, seluruh sel body di bawah kolom akhir pekan kini diberi arsiran lembut (`#FFF8F8`) untuk memandu mata auditor saat membaca tabel 31 hari.
  5. **Pemisahan Kolom Ringkasan (*Double Border Separator*):** Kolom ringkasan `Min` dan `Max` diberi garis pemisah ganda tebal dari matriks tanggal, dengan angka `Min` beraksen biru sejuk dan `Max` beraksen merah jika melebihi batas.
  6. **Elevation Shadow Kolom Sticky:** Menambahkan bayangan lembut (`box-shadow: 4px 0 10px rgba(0,0,0,0.05)`) di sisi kanan kolom sticky agar data tanggal mengalir natural di bawahnya.
  7. **Perbaikan Pemilih Tahun (*Year Selector Reactive Fix*):** Mengaktifkan event listener `switchYear()` pada dropdown tahun agar pilihan tahun (2025/2026) langsung mengubah kalender dan status akhir pekan secara real-time.
* **Status:** Diajukan ke pengguna untuk peninjauan dan persetujuan.

---

### Pengajuan 13 — Modul 06: Rekapitulasi Suhu Bulanan (Versi 1.1 — Pembersihan Total Elemen Tanda Merah)
* **Tanggal:** 19 Oktober 2026
* **Alasan Pengerjaan:** Respons terhadap instruksi pengguna: *"hapus yang saya tandain merah"* pada screenshot `media_1792343915426_bede65d6.png`.
* **Pembersihan yang Dilakukan pada v1.1:**
  1. **Penghapusan Eyebrow Perusahaan:** Menghapus teks `.company-eyebrow` (*"PT LOGISTIK MAKMUR JAYA • SISTEM MONITORING COLD CHAIN & AMBIENT"*) di atas judul utama.
  2. **Penghapusan Sub-Meta Pill Strip:** Menghapus pill badge berulang (*"Bulan: ... Warehouse: ... Batas Suhu: ... Zona Waktu: ..."*) di bawah judul utama agar area header bersih dan bernuansa Apple minimalist.
  3. **Penyederhanaan Bento KPI Strip (Hanya Menyisakan 2 Kartu Hero):**
     - Menghapus kartu *KELENGKAPAN DATA* (`78 / 186 Slot`).
     - Menghapus kartu *SUHU RATA-RATA* (`23,4°C`).
     - Menghapus kartu *PENYIMPANGAN (OVERLIMIT)* (`12 Kejadian ▲`).
     - **Dipertahankan:** Kartu **Suhu Tertinggi** (merah) dan **Suhu Terendah** (biru) dengan layout 2 kolom responsif.
  4. **Pembersihan Kolom Ringkasan Matriks Bulanan:**
     - Menghapus kolom **Avg** (Rata-rata) dari tabel dan subheader.
     - Menghapus kolom **Over** (Penyimpangan) dari tabel dan subheader.
     - Mengubah `colspan="4"` menjadi `colspan="2"` di bawah header *RINGKASAN*.
     - **Dipertahankan:** Kolom **Min** dan **Max**.
  5. **Sinkronisasi Mesin Ekspor CSV:** Menghapus kolom `Avg (C)` dan `Over (Jml)` dari file CSV hasil unduhan sehingga data ekspor konsisten dengan tampilan tabel.
* **Status:** Diajukan ke pengguna untuk peninjauan dan persetujuan.

---

### Pengajuan 12 — Modul 06: Rekapitulasi Suhu Bulanan, Cetak A4 Landscape & Ekspor Excel/CSV (Versi 1.0)
* **Tanggal:** 19 Oktober 2026
* **Alasan Pengerjaan:** Melanjutkan alur kerja prototype setelah Modul 05 disetujui pengguna ("lanjut").
* **Cakupan Modul 06 (v1.0):**
  1. **Matriks Suhu Bulanan 31 Hari Terkelompok Shift (FR-016, BR-09, DESIGN.md 5.3):** Tabel matriks dinamis horizontal yang mengelompokkan baris berdasarkan jadwal shift (`09.00`, `13.00`, `17.00`). Kolom `No`, `Titik Lokasi`, dan `Periode Check` menempel (*sticky*) di sisi kiri saat tabel digulir ke samping.
  2. **Penandaan Header Akhir Pekan Merah Solid (PRD 16.1):** Kolom tanggal yang jatuh pada hari Sabtu dan Minggu (misal pada Oktober 2026: tgl 3, 4, 10, 11, 17, 18, 24, 25, 31) otomatis berwarna merah solid (`#FF3B30`) dengan teks tebal putih, baik di layar maupun saat dicetak.
  3. **Penegakan Aturan Data Kosong Bukan Nol (BR-09):** Sel jadwal yang belum diinput suhunya konsisten bertanda strip (`–`). Dilarang keras bernilai `0` atau `0,0°C` agar tidak merusak interpretasi analitik suhu chiller.
  4. **Penandaan Suhu Melebihi Batas (BR-07):** Suhu di atas batas aktif (misal `35,5°C`) berlatar merah muda lembut dengan ikon segitiga `▲` agar tidak bergantung hanya pada warna.
  5. **Mesin Cetak Format A4 Landscape (FR-017 & NFR-05):** Tombol *"Cetak PDF (A4)"* yang memicu `window.print()` dengan `@page { size: A4 landscape; margin: 8mm 6mm; }`, menyembunyikan bilah tester/tombol aksi, dan memastikan ke-31 kolom tanggal pas tercetak dalam satu halaman lebar (*zero clipping*).
  6. **Kolom Pengesahan Tanda Tangan Fisik (Audit Compliance):** 3 kolom tanda tangan resmi di bagian bawah laporan: Dibuat oleh (QC Checker), Diperiksa oleh (Supervisor Logistik), dan Diketahui oleh (Warehouse Manager) lengkap dengan cap waktu resmi WIB.
  7. **Mesin Ekspor Excel (.xlsx via SheetJS) & CSV:** Unduh instan spreadsheet Excel berekstensi `.xlsx` asli dengan format tabel utuh, serta opsi ekspor CSV berstandar RFC 4180 dengan UTF-8 BOM (`\uFEFF`).
  8. **Modal Detail Audit & Koreksi Transaksi (FR-012):** Mengklik sel suhu membuka pop-up lightbox yang memuat foto fisik Google Drive dengan watermark GPS, status Fonnte WA, dan formulir koreksi suhu khusus Admin dengan isian wajib alasan perubahan (mandatory).
  9. **Pengalih Tampilan Desktop vs Mobile:** Memungkinkan pengujian tabel matriks dalam mode Desktop Lebar Penuh (1360px) maupun simulator Mobile Shell (440px) dengan scroll horizontal dan navbar floating island.
* **Status:** Diajukan ke pengguna untuk peninjauan dan persetujuan.

---

### Pengajuan 11 — Penyelarasan Total Navigasi Kapsul Melayang & Transisi Antar-Modul (Modul 02 ↔ Modul 05 ↔ Modul 04)
* **Tanggal:** 19 Oktober 2026
* **Keputusan Pengguna:** Disetujui (Approved) untuk lanjut ke Modul 06 ("lanjut").
* **Alasan Pengerjaan:** Respons terhadap arahan pengguna: *"ini atara catatan suhu bagusan yang punya dasboar dan pastikan semua singkron pas perpindahan biar cocok"*.
* **Penyelarasan Komprehensif Antar-Modul:**
  1. **Standarisasi Apple Floating Bottom Island:** Seluruh modul (`02-catat-suhu`, `05-dashboard`, dan `04-pindah-warehouse`) kini menggunakan spesifikasi kapsul navbar melayang yang 100% identik: `bottom: 24px`, `border-radius: 34px`, `background: rgba(255, 255, 255, 0.88)`, `backdrop-filter: blur(25px)`, dan tab aktif konsisten menggunakan aksen kapsul biru khas iOS (`#0071E3` / `#E0F2FE`).
  2. **Transisi Halus Bebas Hentakan (*Zero-Jitter View Transitions*):** Mengeliminasi perpindahan visual yang kaku. Konten tiap halaman memiliki animasi masuk halus (`appleViewEnter 0.22s var(--apple-smooth)`), sementara posisi bar navigasi tetap terkunci statis di koordinat yang sama persis sehingga terasa seperti navigasi aplikasi iOS native tunggal.
  3. **Penyempurnaan Ruang Gulir Bawah (*Bottom Clearance 150px*):** Menambah `padding-bottom: 150px` pada seluruh `.device-shell` agar Matriks Slot 2D dan feed transaksi pada Modul 05 maupun kartu lokasi pada Modul 02 dapat di-scroll tuntas tanpa terhalang navbar melayang.
  4. **Sinkronisasi Tab Akses Administrator:** Tombol tab navigasi `[ ⚙️ Admin ]` otomatis sinkron muncul pada navbar bawah di seluruh modul saat peran dialihkan ke Administrator pada bilah penguji.
* **Status:** Diajukan ke pengguna untuk peninjauan dan persetujuan.

---

### Pengajuan 10 — Modul 05: Dashboard Pemantauan Operasional (Versi 1.0 — Apple HIG Bento Grid & Slot Matrix)
* **Tanggal:** 18 Oktober 2026
* **Alasan Pengerjaan:** Melanjutkan alur kerja prototype setelah Modul 04 disetujui pengguna ("lanjjut").
* **Cakupan Modul 05 (v1.0):**
  1. **Apple HIG Bento KPI Grid:** Tata letak metrik asimetris dan bermakna: Kartu Hero *Kelengkapan Slot Hari Ini* dengan progress track visual (`7/12 Slot • 58% Selesai`), kartu heroik *Suhu Tertinggi* (`35,5°C`), kartu *Suhu Terendah* (`21,4°C`), kartu *Peringatan Suhu Overlimit*, dan kartu status koneksi *WhatsApp Gateway Fonnte*.
  2. **Matriks Pemeriksaan Slot Interaktif (FR-015, BR-09, DESIGN.md 5.3):** Tabel silang 2D Jadwal Shift (`09.00`, `13.00`, `17.00`) × Titik Pantau Lokasi (`Inbound`, `Storage A`, `Storage B`, `D05 Cold`). Sel dapat diketuk (tinggi 44px) dengan status berkontras tinggi (Hijau Normal, Merah Berdenyut Overlimit ▲, dan Abu-abu Kosong –). Data kosong tidak pernah dikonversi menjadi angka nol (BR-09).
  3. **Segmented Control Filter Gudang Konsolidasi (FR-020):** Khusus peran Administrator, tersedia kontrol segmentasi Apple untuk memfilter antara `Semua Gudang (Konsolidasi)`, `CK01 Cikupa 1`, dan `CK02 Annex` secara instan.
  4. **Feed Riwayat Transaksi Tersimpan:** Kartu transaksi terkompresi yang mencantumkan nama titik, jam shift, nama petugas pelapor, suhu aktual, dan tombol pintas *"Lihat Foto Bukti ↗"*.
  5. **Modal Detail Transaksi (Apple Lightbox):** Menampilkan rincian audit lengkap saat sel matriks atau kartu transaksi diklik: waktu server resmi (WIB Asia/Jakarta), nama petugas, batas suhu aktif, status WhatsApp, dan verifikasi metadata foto Drive + GPS.
  6. **Toolbar Pengujian Cepat:** Beralih antara Member vs Admin, Hari Ini vs Kemarin, serta pemicu cepat simulasi peringatan overlimit.
* **Status:** Diajukan ke pengguna untuk peninjauan dan persetujuan.

---

### Pengajuan 9 — Modul 04: Modal Pindah Warehouse & Menu Profil Pengguna (Versi 1.0 — Apple HIG Action Sheet)
* **Tanggal:** 18 Oktober 2026
* **Keputusan Pengguna:** Disetujui (Approved) untuk lanjut ke Modul 05.
* **Alasan Pengerjaan:** Melanjutkan alur kerja prototype setelah Modul 03 disetujui pengguna ("lanjut").
* **Cakupan Modul 04 (v1.0):**
  1. **Apple HIG Action Sheet Presentation:** Lembar aksi profil pengguna yang dipicu dari avatar kanan atas header (`.bg-user-pill`), mengadopsi kurva pegas Apple (`cubic-bezier(0.2, 0.9, 0.25, 1)`), grabber pill handle, backdrop blur (`16px`), dan tombol tutup melingkar (`✕`).
  2. **Profile Hero ID Card:** Kartu identitas petugas lengkap dengan inisial avatar (`BS` / `AD`), Nama Lengkap (`full_name`), Username unik, ID Pengguna, dan badge peran berkontras tinggi (`Member Lapangan` vs `Administrator Master`).
  3. **Pindah Warehouse Eksklusif pada Menu Profil (FR-019, FR-018, BR-10):** Menampilkan daftar gudang aktif yang diizinkan untuk pengguna tersebut (`CK01`, `CK02`, `SBY01`) dengan kode badge, status hijau `✓ Aktif`, serta tombol `Pilih` yang memicu pembaruan konteks sesi dan form latar belakang secara seketika.
  4. **Penegakan Hak Akses Tunggal (BR-04 / FR-018):** Menyediakan skenario "Akses Tunggal" pada toolbar penguji, yang mengunci perpindahan gudang jika petugas hanya ditugaskan pada 1 cabang dan menampilkan kotak informasi ramah pengguna.
  5. **Sub-Modal Ganti Password Mandiri (FR-002):** Lembar ganti kata sandi terpadu dengan validasi minimal 8 karakter, larangan memakai password default `admin123`, tombol intip password, serta rekaman audit log.
  6. **Informasi Operasional & Zona Waktu (NFR-03):** Indikator zona waktu operasional terkunci pada `Asia/Jakarta (WIB)` dan kontak supervisor gudang bertugas.
  7. **Konfirmasi Keluar / Logout Destruktif:** Tombol merah Apple System Red (`#FF3B30`) dengan dialog konfirmasi dua opsi.
* **Status:** Disetujui (Approved v1.0). Menjadi acuan produksi.

---

### Pengajuan 8 — Modul 03: Overlay Kamera Bukti & Watermark GPS (Versi 1.0 — Apple HIG Viewfinder)
* **Tanggal:** 18 Oktober 2026
* **Keputusan Pengguna:** Disetujui (Approved) untuk lanjut ke Modul 04.
* **Alasan Pengerjaan:** Melanjutkan alur kerja prototype setelah Modul 02 disetujui pengguna ("lanjut").
* **Cakupan Modul 03 (v1.0):**
  1. **Apple Camera HIG Viewfinder:** Layar penuh gelap (`#000000`), kisi pandu komposisi (*Rule of Thirds grid*), reticle fokus kuning berdenyut lembut, dan pill panduan melayang (*"Arahkan ke layar termometer digital"*).
  2. **Top Translucent HUD:** Tombol Batal/Tutup melingkar transparan (`✕`) di kiri atas, nama lokasi aktif (`Storage Chiller A`), dan status live GPS (`🟢 GPS: -6.1751, 106.8650` atau `⚪ Tidak Tersedia`).
  3. **Watermark Canvas Real-Time (FR-008, NFR-03, BR-06):** Rendering kanvas permanen di atas citra: Tanggal & Waktu (WIB, `Asia/Jakarta`), Lokasi Gudang/Chiller, Nama Petugas Login, dan Koordinat GPS.
  4. **Kompresi Klien Standar PRD (NFR-01):** Batas dimensi maksimal 1280px sisi terpanjang, kualitas JPEG 80%, dan indikator ukuran riil (< 350 KB).
  5. **Ergonomic Bottom Thumb Deck:** Tombol shutter Apple (lingkaran putih ganda 76px), tombol pembalik kamera (*flip environment/user*), tombol torch/senter, serta transisi ke dua tombol aksi pasca-jepret (*"Ulangi Foto"* & *"Gunakan Foto ↗"*).
  6. **Toolbar Pengujian Cepat:** Beralih antara Kamera Asli (webcam/HP), Mock Termometer Digital (offline/desktop), Izin Kamera Ditolak, serta toggle GPS Aktif vs Ditolak.
* **Status:** Disetujui (Approved v1.0). Menjadi acuan produksi.

---

### Pengajuan 7 — Modul 02: Form Catat Suhu Utama (Versi 2.3 — Apple HIG Segmented Control & Header Clean)
* **Tanggal:** 18 Oktober 2026
* **Alasan Revisi:** Respons terhadap screenshot pengguna:
  1. Kotak Merah: Hapus warehouse dropdown pill di kiri atas.
  2. Kotak Kuning: Revisi filter chips yang terpotong di tepi kanan layar.
  3. Standarisasi desain ke pedoman resmi Apple Human Interface Guidelines (HIG) (`developer.apple.com/design/`).
* **Perubahan Utama pada v2.3:**
  1. **Penghapusan Pill Warehouse (Kotak Merah):** Menghapus elemen `.warehouse-selector-pill` di header atas. Header kini menampilkan Apple Large Title yang tegas (*Catat Suhu*), sub-meta tanggal & gudang aktif (`Senin, 19 Oktober 2026 • WH-JKT-01 (4 Titik Pantau)`), dan avatar profil di kanan atas. Sesuai PRD FR-004, pemilihan gudang dikhususkan pada modal profil akun (Modul 04).
  2. **Apple Native Segmented Control (Kotak Kuning):** Mengganti `.filter-rail` scroll horizontal dengan `UISegmentedControl` Apple 4 kolom proporsional seimbang 100% (`Semua (4)`, `Belum (2)`, `Normal (1)`, `Over (1)`). Teks dan badge angka pas di layar mobile 360px–430px tanpa terpotong (*zero clipping*) dan tanpa scroll horizontal.
  3. **Adopsi Apple HIG Tokens:** Memperbarui `shared/tokens.css`, `shared/components.css`, dan `docs/DESIGN.md` untuk mengkodifikasi Apple System Colors, kurva pegas Apple (`cubic-bezier(0.16, 1, 0.3, 1)`), squircle radius, dan SF Pro Tabular Numbers.
  4. **Penyelarasan Font & Icon Selevel iOS:** Memuat webfont resmi `SF Pro Display` & `Inter` CDN untuk menghapus fallback paksa ke Segoe UI di Windows, menormalkan seluruh ukuran font pecahan (`11.5px` dsb) ke skala integer HIG (10px–30px), serta menyeragamkan seluruh icon SVG dengan stroke 1.85, ujung melengkung, dan pembungkus `.sf-icon-wrap` yang presisi di garis tengah vertikal.
* **Status:** Diajukan ke pengguna untuk peninjauan dan persetujuan.

---

### Pengajuan 6 — Modul 02: Form Catat Suhu Utama (Versi 2.2 — Layout Refinement & Silky Smooth Accordion)
* **Tanggal:** 18 Oktober 2026
* **Alasan Revisi:** Umpan balik pengguna: *"masih banyak layout yang kurang pas atau kurang di posisinya pas ada perpindahan kurang smoote"*.
* **Perubahan Utama pada v2.2:**
  1. **Hero Temperature Input Group (Kartu 3):** Menghilangkan kotak input 140px yang tampak canggung di sisi kiri. Menggantinya dengan kartu input suhu penuh yang seimbang dan simetris, dilengkapi tombol stepper cepat `[-] 0.5` dan `[+] 0.5`, serta chip preset suhu instan (`23,2°C`, `24,8°C`, `26,5°C`).
  2. **Visual Mini Progress Bar pada Kartu Shift:** Kartu Shift Pagi, Siang, dan Sore kini memiliki bar indikator progres visual (`50%`, `0%`, `0%`) di samping teks `2/4 Selesai`.
  3. **Header Apple iOS Large Title:** Posisi warehouse selector pill di kiri atas dan avatar pengguna di kanan atas, diikuti oleh teks judul besar *Catat Suhu* (32px bold) dan konteks tanggal + jumlah titik pantau secara rapi tanpa pergeseran baris canggung.
  4. **Accordion Filter Smooth Transition:** Menghilangkan `display: none` yang memicu hentakan (*jump*). Kartu yang difilter keluar kini menyusut dengan mulus menggunakan animasi akordeon (`max-height: 0; opacity: 0; transform: scale(0.96) translateY(-10px); margin: 0; padding: 0; transition: all 0.38s cubic-bezier(0.16, 1, 0.3, 1)`). Kartu yang tersisa meluncur naik secara alami.
  5. **Staggered Shift Switching:** Pergantian antar-shift menggunakan efek masuk bertingkat (*staggered entrance*) 45ms per kartu dengan kurva pegas Apple (*Apple spring physics*), bukan sekadar blanking opacity singkat.
  6. **Dynamic Overlimit Alert Accordion:** Banner peringatan suhu tinggi meluncur turun secara proporsional saat suhu > 25,0°C.
  7. **Modal Lightbox Bukti Foto:** Menambahkan pratinjau bukti foto termometer digital interaktif lengkap dengan watermark tanggal, jam, petugas, dan koordinat GPS (BR-05 / FR-008).
  8. **Floating Dynamic Island Navigation:** Navigasi kapsul melayang dengan padding bawah yang cukup (140px) sehingga tidak menutupi isi kartu paling bawah saat di-scroll.
* **Status:** Diajukan ke pengguna untuk peninjauan dan persetujuan.

---

### Pengajuan 5 — Modul 02: Form Catat Suhu Utama (Versi 2.0 — Apple Store Flow Sesuai Mobbin)
* **Tanggal:** 18 Oktober 2026
* **Alasan Revisi:** Pengguna memberikan tautan referensi Mobbin resmi flow produk Apple Store iOS (`https://mobbin.com/flows/7067a093-3c76-452b-a23c-1ffc02f91e34`).
* **Perubahan pada v2.0:**
  1. **Header iOS Bersih:** Judul halaman besar (*Large Title*) "Catat Suhu" dengan avatar inisial petugas (`BS`) dan pill gudang minimalis.
  2. **Category Cards Rail untuk Shift:** Shift Pagi, Siang, dan Sore disajikan dalam deretan kartu rounded horizontal (`20px`) berlatar putih dengan badge status progres mandiri.
  3. **Filter Chips Aksesori:** Chip horizontal untuk memfilter status kartu lokasi secara instan (*Semua (4)*, *Belum Diisi (2)*, *Normal (1)*, *Melebihi Batas (1)*).
  4. **Product Showcase Cards untuk Lokasi:** Kartu rounded lapang (`24px`), tipografi angka suhu besar, dan tombol kapsul *Simpan Lokasi* (seperti tombol *Buy* di Apple Store).
  5. **Floating Island Bottom Navigation (Dynamic Island Style):** Bar navigasi bawah melayang transparan (*glassmorphism*) berbentuk kapsul, berdampingan dengan tombol melayang *Simpan Semua*.
  6. **Version Switcher:** Bilah atas untuk membandingkan langsung antara v1 (Standard) dan v2 (Apple Store Flow).
* **Status:** Diarsipkan sebagai rintisan awal flow v2.

---

### Pengajuan 4 — Modul 02: Form Catat Suhu Utama (Versi 1.0 — Standard Mobile Card)
* **Tanggal:** 18 Oktober 2026
* **Cakupan:**
  1. Header operasional: Pill pemilihan gudang aktif (`WH-JKT-01`), indikator tanggal hari ini, dan date picker untuk Admin.
  2. Tab navigasi shift (Pagi, Siang, Sore) dengan counter `X/Y selesai` dan progress track visual.
  3. Kartu lokasi dengan 3 status: Normal (hijau), Melebihi Batas (merah + badge WA SENT), dan Belum Diisi (input aktif).
  4. Input suhu numerik decimal dengan deteksi overlimit (> 25°C) real-time dan peringatan otomatis WhatsApp darurat.
  5. Pemicu kamera perangkat (`capture="environment"`) dengan preview foto dan verifikasi GPS.
  6. Sticky Batch Save Bar melayang di atas navigasi bawah untuk simpan massal (FR-010).
  7. Immutability untuk Member (BR-03) dan tombol Ubah Data + modal audit alasan untuk Admin (FR-012).
* **Status:** Diajukan ke pengguna untuk peninjauan dan persetujuan.

---

### Pengajuan 3 — Modul 01: Login & Ganti Password (Versi 2.1 — Pembersihan Status Bar & Footer)
* **Tanggal:** 18 Oktober 2026
* **Keputusan Pengguna:** Disetujui (Approved) untuk lanjut ke Modul 02.
* **Alasan Revisi:**
  1. Pengguna meminta penghapusan bilah status tiruan (`9:41`, sinyal seluler, wifi, baterai) yang terlihat artifisial.
  2. Pengguna meminta penghapusan frasa *"Cold Chain & Ambient"* beserta ikon logonya di bawah tombol *"Bantuan & Kontak Supervisor"*.
* **Perubahan pada v2.1:**
  1. Menghapus markup `<div class="status-bar">...</div>` dan seluruh style CSS terkait.
  2. Menghapus ikon SVG dan teks *"Cold Chain & Ambient • "* di bawah tombol bantuan, menyisakan teks minimalis *"Gudang Logistik"*.
  3. Menyesuaikan padding atas `.screen-content` (`44px 24px 20px 24px`) dan posisi `.toast` (`top: 20px`) agar proporsional dan tidak terpotong.
  4. Menambahkan responsivitas `@media (max-width: 480px)` agar saat diuji langsung pada perangkat mobile fisik, antarmuka otomatis memenuhi layar 100% tanpa batas frame simulator.
* **Status:** Diajukan ke pengguna untuk peninjauan dan persetujuan.

---

### Pengajuan 2 — Modul 01: Login & Ganti Password (Versi 2.0 — Mobile-First Minimalist)
* **Tanggal:** 18 Oktober 2026
* **Alasan Revisi:** Pengguna mengirimkan referensi visual baru berupa antarmuka mobile login Instagram/Mobbin dan meminta pembuatan prototype dengan gaya tersebut.
* **Perubahan pada v2.0:**
  1. Mengubah struktur dari desktop-card menjadi tata letak aplikasi mobile penuh (*full-screen viewport* dengan simulator frame iPhone 390×844px di desktop).
  2. Menempatkan App Icon termometer bergradien biru industri (`76×76px`) di sepertiga atas layar.
  3. Menggunakan dua kolom input bertumpuk rapi dengan sudut membulat 14px dan background putih/bersih.
  4. Mengubah tombol Masuk menjadi bentuk kapsul (*pill-shape*) dengan sudut lengkung 24px melingkar penuh dan bayangan kedalaman.
  5. Menempatkan tombol *outline* sekunder (*"Bantuan & Kontak Supervisor"*) dan atribusi sistem di bagian bawah tepat di atas *Home Indicator* iPhone.
  6. Menyediakan bilah *Version Switcher* di bagian atas layar agar pengguna dapat membandingkan langsung antara v1 (Enterprise Card) dan v2 (Mobile Minimalist).
* **Status:** Direvisi ke v2.1 atas arahan pengguna.

---

### Pengajuan 1 — Modul 01: Login & Ganti Password (Versi 1.0 — Enterprise Card)
* **Tanggal:** 18 Oktober 2026
* **Hasil:** Diarsipkan di `Desain tamplet/01-login/v1/index.html` untuk perbandingan versi.
