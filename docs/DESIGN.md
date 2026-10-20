# DESIGN.md — Panduan UI/UX Warehouse Temperature Report

**Status:** Pendamping PRD (`docs/PRD.md`). Jika ada pertentangan, **PRD menang**. Dokumen ini hanya mengatur *bagaimana tampilannya*, bukan *apa yang dilakukan sistem*. Perubahan perilaku harus lewat prosedur PRD Bagian 22.2.

**Pembaca utama:** AI yang mendesain dan membangun antarmuka, serta manusia yang meninjaunya.

---

## 1. Arah Desain (Design Brief)

**Produk:** aplikasi web responsif untuk mencatat suhu warehouse dengan bukti foto kamera, notifikasi WhatsApp saat melewati batas, dan rekap bulanan.

**Pengguna dan konteks nyata:**

* **Member (petugas lapangan):** berdiri di lorong rak atau area terang, satu tangan memegang ponsel, tangan lain membidik termometer. Sinyal seluler gudang bisa lambat. Mereka butuh cepat, jelas, dan tidak boleh salah lokasi atau jam.
* **Admin/Supervisor:** duduk di desktop, memeriksa rekap, mengoreksi data, mengelola master. Mereka butuh tabel lebar yang rapi dan jejak audit yang mudah dibaca.

**Pekerjaan utama antarmuka:** membuat angka suhu dan statusnya terbaca sekilas, dan membuat setiap lokasi serta jam jelas sudah terisi atau belum.

**Satu hal yang dibuat memorable:** **angka suhu itu sendiri**. Angka suhu ditampilkan besar, tebal, dan sejajar (*tabular numerals*) seperti bacaan di alat ukur. Semua elemen lain sengaja tenang dan disiplin agar angka dan statusnya menonjol.

**Nuansa:** seperti buku catatan pemeriksaan di lapangan yang rapi, tenang, dan dapat dipercaya. Bukan dashboard "SaaS" yang dekoratif.

---

## 2. Prinsip

1. **Status tidak pernah hanya warna.** Setiap status memakai warna + ikon + kata. Gudang terang, mata lelah, dan sebagian pengguna buta warna.
2. **Satu tangan dulu.** Layar ponsel dirancang dari 360 px; aksi utama di bagian bawah layar yang terjangkau ibu jari.
3. **Kontras tinggi, dekorasi minimal.** Tidak ada gradien, bayangan dekoratif, atau ornamen. Struktur (garis, batas, label) hanya dipakai jika membawa informasi.
4. **Jangan hilangkan kerja pengguna.** Foto dan angka yang sudah dijepret/diketik tidak boleh hilang saat gagal simpan (PRD 9.2 dan 15.2).
5. **Tabel adalah warga kelas satu.** Rekap bulanan harus nyaman dibaca di desktop dan benar saat dicetak.
6. **Bahasa sederhana.** Kata yang dipakai petugas gudang, bukan istilah teknis sistem.

---

## 3. Standarisasi Desain: Apple Human Interface Guidelines (HIG)

Sesuai arahan resmi pemilik produk untuk menjaga konsistensi visual dan interaksi ke depan, seluruh komponen antarmuka aplikasi mengadopsi standar **Apple Human Interface Guidelines (HIG)** (`https://developer.apple.com/design/`):
1. **Dynamic System Colors:** Memakai palet Apple System Blue (`#0071E3`), System Green (`#34C759`), System Red (`#FF3B30`), Grouped Background (`#F5F5F7`), dan High-Contrast Labels (`#1D1D1F` & `#86868B`).
2. **Typography Hierarchy (SF Pro System):** Mengikuti skala resmi Apple (Large Title 34pt, Title 20-28pt, Headline 17pt, Body 17pt, Footnote 13pt) dengan `font-variant-numeric: tabular-nums` untuk akurasi pembacaan suhu dan waktu.
3. **Corner Radii & Materials:** Menggunakan squircle curvature berjenjang (kartu `20-24px`, kontrol `14-16px`, pill kapsul `9999px`) dan material kaca buram (*Frosted / Liquid Glass* `backdrop-filter: blur(25px)`).
4. **Motion & Transitions:** Menghindari pergeseran layar mendadak (*zero layout snap*); setiap transisi, akordeon, dan perpindahan shift menggunakan kurva perlambatan alami Apple (`--apple-smooth: cubic-bezier(0.16, 1, 0.3, 1)`) dan kurva pegas interaktif (`--apple-spring: cubic-bezier(0.2, 0.9, 0.25, 1)`).
5. **Ergonomic Touch Targets:** Seluruh kontrol yang dapat diketuk memenuhi standar minimum **44×44 pt** dengan umpan balik sentuh (*active press scale* 0.96).

Semua nilai di bawah adalah sumber kebenaran. Implementasi memakai CSS variables (atau konfigurasi tema framework yang dipilih), tidak boleh menulis hex atau ukuran langsung di komponen.

### 3.1 Warna (Apple HIG Dynamic System Palette)

| Nama token | Hex / Value | Dipakai untuk | Rasio Kontras WCAG |
| --- | --- | --- | --- |
| `--ink` (System Label Primary) | `#1D1D1F` | Teks utama, angka suhu bacaan | **16,1:1** di atas putih (Lolos AAA) |
| `--ink-muted` (System Label Secondary) | `#6E6E73` | Teks sekunder, label, status "Belum diisi" | **4,61:1** di atas putih (Lolos AA) |
| `--surface` (Grouped Background) | `#F5F5F7` | Latar halaman kanvas | Netral dingin Apple |
| `--surface-raised` | `#FFFFFF` | Kartu konten, tabel, dialog | Kontras tinggi |
| `--line` (Hairline Border) | `rgba(0, 0, 0, 0.08)` | Batas kartu, pembatas sel tabel | Presisi 1px tanpa bayangan statis |
| `--primary` (System Blue) | `#0071E3` | Tombol utama, tautan aktif, fokus | **4,53:1** di atas putih (Lolos AA) |
| `--primary-hover` | `#0066CC` | Keadaan hover & active tombol utama | Kontras tinggi |
| `--primary-ink` | `#FFFFFF` | Teks di atas primary | **4,53:1** |
| `--ok` (System Green) | `#1B7F4B` / `#34C759` | Status Normal | **4,58:1** |
| `--ok-tint` | `#E3F4EA` | Latar badge status Normal | Lembut, tidak menyilaukan |
| `--over` (System Red) | `#C62828` / `#FF3B30` | Status Melebihi batas, header Sabtu/Minggu | **5,9:1** |
| `--over-tint` | `#FDECEA` | Latar badge status Melebihi batas | Jelas & tegas |
| `--fail` (System Orange) | `#B8560A` | Status Gagal unggah/simpan | **4,7:1** |
| `--fail-tint` | `#FFF1E3` | Latar badge status Gagal | Peringatan operasional |
| `--empty-tint` | `#EEF1F3` | Latar sel/kartu belum diisi | Netral abu-abu muda |

**Aturan warna:**

* Verifikasi kontras dengan alat (target minimum **4,5:1** untuk teks biasa, **3:1** untuk teks besar dan komponen UI). Token `--ink-muted` menggunakan `#6E6E73` demi memenuhi standar kontras 4,5:1 pada latar putih.
* Merah dipakai untuk dua hal yang tidak boleh tertukar: **header tanggal akhir pekan** (blok solid merah, teks putih, hanya di header tabel) dan **suhu melebihi batas** (teks tebal merah di atas `--over-tint`, hanya di sel data/kartu). Keduanya tidak pernah muncul di elemen yang sama.
* Hapus polusi warna shift: Tidak boleh mewarnai latar halaman atau border kartu lokasi dengan warna shift (Amber/Indigo). Warna shift hanya menjadi aksen kecil pada badge/ikon tab jadwal pengecekan.

### 3.2 Tipografi (Apple SF Pro System & Tabular Numerals)

* **Font Stack Resmi:** `-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Inter", system-ui, sans-serif`.
* **Angka:** Wajib `font-variant-numeric: tabular-nums` untuk seluruh angka suhu, tanggal, jam, dan sel tabel matriks agar lebar karakter sejajar secara vertikal.
* **Letter-Spacing:** Menggunakan negative letter-spacing (`-0.015em` s/d `-0.02em`) pada angka suhu hero dan judul halaman agar tipografi terlihat tajam dan rapat.
* **Font-Weight Hygiene:** Hindari font-weight 500 pada teks body (gunakan `400` untuk body text dan `600`/`700` untuk judul dan penekanan).
* **Tidak ada huruf kapital semua** untuk label panjang. Pakai *sentence case*.
* **Tidak ada font monospace** untuk label data kecil.

| Peran | Ukuran / berat | Letter-spacing | Line-height |
| --- | --- | --- | --- |
| Angka suhu input (hero) | 34 px / 700 | -0.02em | 1,1 |
| Angka suhu statistik dashboard | 40 px / 700 | -0.02em | 1,1 |
| Judul halaman (Title) | 22 px / 700 | -0.015em | 1,25 |
| Judul kartu (Headline) | 17 px / 600 | -0.01em | 1,3 |
| Isi dan input (Body) | 16 px / 400 (minimal 16 px agar iOS tidak auto-zoom saat fokus) | normal | 1,5 |
| Teks sekunder (Footnote) | 13 px / 400 | normal | 1,45 |
| Keterangan kecil (Caption) | 11 px / 600 | 0.02em | 1,4 |

Panjang baris teks maksimum sekitar 70 karakter.

### 3.3 Jarak, Sudut Squircle, Material Frosted Glass

* **Jarak (skala 4 px):** 4, 8, 12, 16, 20, 24, 32, 48.
* **Sudut membulat berjenjang (Apple Squircle Scale):**
  * Kontrol interaktif, input, dan tombol: `12px` (`--radius-control`).
  * Kartu konten: `20px` (`--radius-card`).
  * Dialog modal dan Action Sheet: `24px` (`--radius-sheet`).
  * Badge kapsul: `9999px` atau `8px` (`--radius-badge`).
* **Material Kaca Buram (Frosted Glass):**
  * `backdrop-filter: saturate(180%) blur(20px); -webkit-backdrop-filter: saturate(180%) blur(20px);`
  * Diterapkan pada `AppHeader`, Floating Bottom Island Navbar, Sticky Action Bar, dan Modal Backdrop.
* **Bayangan (Zero Decorative Shadow):**
  * Kartu statis dan tabel **tidak menggunakan drop-shadow**; hanya menggunakan hairline border `1px solid rgba(0, 0, 0, 0.08)`.
  * Bayangan lembut hanya diberikan pada elemen yang benar-benar melayang di atas kanvas (*floating layers*): dialog modal, bottom nav island, dan popup detail.
* **Area sentuh ergonomis:** Minimal **44×44 px** untuk semua kontrol yang dapat diketuk, dengan umpan balik sentuh (*active press*) `transform: scale(0.96)`.

### 3.4 Potongan CSS Dasar

```css
:root {
  /* Apple HIG Semantic Tokens */
  --ink: #1D1D1F;
  --ink-muted: #6E6E73;
  --surface: #F5F5F7;
  --surface-raised: #FFFFFF;
  --line: rgba(0, 0, 0, 0.08);
  --primary: #0071E3;
  --primary-hover: #0066CC;
  --primary-ink: #FFFFFF;
  --ok: #1B7F4B;      --ok-tint: #E3F4EA;
  --over: #C62828;    --over-tint: #FDECEA;
  --fail: #B8560A;    --fail-tint: #FFF1E3;
  --empty-tint: #EEF1F3;

  /* Apple HIG Squircle Radii */
  --radius-control: 12px;
  --radius-card: 20px;
  --radius-sheet: 24px;
  --radius-badge: 8px;

  /* Apple Natural Curves */
  --apple-smooth: cubic-bezier(0.16, 1, 0.3, 1);
  --apple-spring: cubic-bezier(0.2, 0.9, 0.25, 1);
}

body {
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Inter", system-ui, sans-serif;
  color: var(--ink);
  background: var(--surface);
  font-size: 16px;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}

.num {
  font-variant-numeric: tabular-nums;
}

:focus-visible {
  outline: 3px solid var(--primary);
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  * { animation: none !important; transition: none !important; }
}
```

---

## 4. Komponen Inti

### 4.1 Badge status lokasi (PRD 9.2)

Badge berbentuk persegi membulat 6 px, berisi **ikon SVG + kata**. Jangan memakai emoji sebagai ikon di antarmuka (render berbeda antar perangkat).

| Status | Border kartu | Latar badge | Ikon + kata |
| --- | --- | --- | --- |
| Belum diisi | `--line` 1 px | `--empty-tint` | Lingkaran kosong + "Belum diisi" |
| Tersimpan, normal | `--ok` 2 px | `--ok-tint` | Centang + "Normal" |
| Tersimpan, melebihi batas | `--over` 2 px | `--over-tint` | Segitiga peringatan + "Melebihi batas" |
| Gagal unggah atau simpan | `--fail` 2 px | `--fail-tint` | Tanda seru dalam lingkaran + "Gagal simpan" |

### 4.2 Kartu lokasi pada form input

Urutan dari atas ke bawah, satu kolom di ponsel:

```text
┌───────────────────────────────────────────┐
│ A04                         [ Belum diisi ]│
│                                           │
│  Suhu (°C)                                │
│  ┌─────────────────────────┐              │
│  │          35,5           │  ← 32px/600  │
│  └─────────────────────────┘              │
│                                           │
│  [ Ambil Foto Kamera ]                    │
│                                           │
│  [ Simpan lokasi ]                        │
└───────────────────────────────────────────┘
```

Setelah foto diambil, tombol kamera berubah menjadi pratinjau kecil foto dengan aksi "Ulangi foto". Kartu yang sudah tersimpan menampilkan: angka suhu besar, jam simpan, nama petugas, "Lihat foto", dan (untuk Member) keterangan "Terkunci". Jika melebihi batas, tampilkan status WA ("Terkirim", "Gagal terkirim", "Menunggu").

### 4.3 Tombol

* **Primer** (`--primary`, teks putih): satu per area, untuk aksi utama (Simpan lokasi, Simpan semua, Masuk).
* **Sekunder** (garis `--primary`, latar putih): aksi pendukung (Ambil Foto Kamera, Ulangi foto).
* **Bahaya** (`--over`): hanya untuk aksi yang menonaktifkan atau mengubah data penting, selalu lewat dialog konfirmasi.
* Saat proses berjalan: tombol `disabled`, label berubah sesuai tahap (lihat Bagian 7), dan ada indikator berputar kecil. Tidak ada klik ganda (PRD 9.3).
* Tidak ada tanda panah `→` pada label tombol.

### 4.4 Kontrol pilihan jadwal

Kontrol segmen horizontal (`09.00`, `13.00`, `17.00`), tinggi 48 px, pilihan aktif berlatar `--primary`. Jika jadwal lebih dari 4, kontrol bisa digulir horizontal.

### 4.5 Input angka suhu

* `inputmode="decimal"`, menerima koma dan titik, ditampilkan dengan koma (35,5) di antarmuka sesuai PRD 13.3.
* Satuan "°C" tetap terlihat di label, bukan hanya placeholder.
* Validasi di tempat: pesan di bawah input dalam teks, bukan hanya warna merah.

---

## 5. Layar dan Tata Letak

Struktur navigasi mengikuti peran di PRD Bagian 5 dan 8.1.

| Layar | Peran | Catatan tata letak |
| --- | --- | --- |
| Login | Semua | Satu kolom, ruang kosong lega, tanpa ilustrasi dekoratif. Nama aplikasi di atas, dua kolom isian, satu tombol "Masuk". |
| Input Suhu | Member, Admin | Mobile-first. Lihat 5.1. |
| Dashboard | Member (ringkas), Admin (penuh) | Lihat 5.2. |
| Rekap Bulanan | Admin | Desktop-first. Lihat 5.3. |
| Notifikasi WhatsApp | Admin | Tabel transaksi dengan status `PENDING` dan `FAILED`, aksi "Kirim Ulang WA" per baris. |
| Master Lokasi dan Jadwal | Admin | Tabel dengan urutan yang bisa diubah, status aktif/nonaktif, tombol "Tambah". |
| Pengguna | Admin | Tabel pengguna, aksi Ubah, Nonaktifkan, Reset password. |
| Pengaturan | Admin | Batas suhu, kunci hari Minggu, daftar hari libur, tanggal yang dibuka. |
| Audit Log | Admin | Tabel dengan filter tanggal dan kategori, baris bisa dibuka untuk melihat nilai sebelum dan sesudah. |

**Navigasi:**

* **Ponsel (Member & Admin):** Bilah atas dilengkapi tombol hamburger (☰) yang membuka laci menu samping (*Side Menu Drawer*) meluncur mulus dari sisi kiri layar. Laci menu menyajikan profil pengguna, badge gudang aktif, link operasional (Dashboard, Catat Suhu, Rekap Bulanan), pintasan modul Admin (jika role Admin), dan tombol Keluar. Tab bar bawah melayang ditiadakan sehingga area vertikal ponsel bersih dan leluasa tanpa elemen yang menutupi konten.
* **Desktop, Admin:** Sidebar kiri tetap dengan daftar halaman, konten di kanan dengan lebar proporsional untuk tabel operasional.

### 5.1 Layar Input Suhu (ponsel)

```text
┌───────────────────────────────┐
│ Warehouse Temperature   [Budi]│
├───────────────────────────────┤
│ Hari ini                      │
│ Sabtu, 17 Oktober 2026   🔒   │
│                               │
│ [ 09.00 ][ 13.00 ][ 17.00 ]   │
│                               │
│ 2 dari 3 lokasi terisi        │
│                               │
│ ┌ Inbound ──────── Normal ──┐ │
│ │ 28,5 °C  09.14  Budi      │ │
│ │ Lihat foto      Terkunci  │ │
│ └───────────────────────────┘ │
│ ┌ A04 ────── Melebihi batas ┐ │
│ │ 35,5 °C  WA: Terkirim     │ │
│ └───────────────────────────┘ │
│ ┌ D05 ─────── Belum diisi ──┐ │
│ │ Suhu (°C) [          ]    │ │
│ │ [ Ambil Foto Kamera ]     │ │
│ └───────────────────────────┘ │
├───────────────────────────────┤
│ [ Simpan semua (1) ]          │  ← sticky, bawah layar
├───────────────────────────────┤
│ Input suhu │ Dashboard        │
└───────────────────────────────┘
```

Aturan:

* Tanggal terkunci tampil sebagai teks dengan ikon gembok kecil, bukan kolom isian. Jika hari itu dikunci (Minggu/libur), tampilkan blok informasi di atas daftar kartu: "Input hari ini ditutup. Hubungi Admin untuk membukanya."
* Bilah "Simpan semua" menempel di atas navigasi bawah, menampilkan jumlah lokasi yang siap disimpan (angka suhu + foto lengkap). Nonaktif jika jumlahnya 0.
* Saat Simpan semua berjalan, setiap kartu menampilkan status prosesnya sendiri (PRD 9.3).

### 5.2 Layar Kamera

* Layar penuh, tampilan kamera belakang memenuhi layar, kontrol di bawah dalam area ibu jari.
* Kontrol: tombol tutup di kiri atas, tombol **Jepret** besar (minimal 72 px) di tengah bawah. Tidak ada tombol galeri dalam bentuk apa pun (BR-05).
* Setelah jepret: pratinjau foto lengkap dengan watermark sebagaimana akan disimpan, dua aksi: "Ulangi foto" dan "Gunakan foto".
* Jika izin kamera ditolak: pesan jelas apa yang terjadi dan cara memperbaikinya (lihat Bagian 7). Jika izin lokasi ditolak: lanjutkan tanpa GPS dan beri keterangan kecil "Lokasi GPS tidak dicantumkan".
* **Watermark pada foto:** blok teks di pojok kiri bawah, latar hitam semi-transparan di belakang teks putih agar terbaca di foto terang maupun gelap. Isi, per baris: tanggal dan jam, lokasi, petugas, GPS (hanya jika tersedia). Ukuran teks menyesuaikan lebar gambar (sekitar 2,5% dari sisi terpendek) agar tetap terbaca setelah kompresi.

### 5.3 Dashboard

Elemen yang menonjol adalah **grid "hari ini"**: matriks kecil lokasi × jadwal yang menunjukkan status tiap slot dengan badge yang sama seperti kartu lokasi. Ini menjawab pertanyaan utama "apa yang belum diperiksa" sekilas.

Di bawah grid, ringkasan angka disusun sebagai daftar rapat (bukan deretan kartu identik):

* Slot belum diperiksa
* Suhu tertinggi hari ini (angka 40 px, dengan lokasi dan jam)
* Transaksi melebihi batas
* Notifikasi WA gagal (hanya Admin, dengan tautan ke halaman Notifikasi WhatsApp)

Lalu daftar "Transaksi terbaru" sebagai tabel ringkas.

### 5.4 Rekap Bulanan

```text
Oktober 2026      [Bulan ▾] [Tahun ▾]    [Cetak PDF] [Ekspor Excel] [Ekspor CSV]

 No │ Location │ Periode │ 1 │ 2 │ 3█│ 4█│ 5 │ 6 │ … │ 31█
────┼──────────┼─────────┼───┼───┼───┼───┼───┼───┼───┼────
 1  │ Inbound  │         │28 │29 │ – │ – │28 │ … │   │ –
 2  │ A04      │  09.00  │29 │28 │ – │ – │35▲│ … │   │ –
 3  │ D05      │         │ – │29 │ – │ – │ – │ … │   │ –
```

(█ = header merah akhir pekan, ▲ = melebihi batas, – = belum diinput.)

Aturan:

* Tiga kolom pertama (No, Location, Periode Check) menempel (*sticky*) saat tabel digulir ke samping. Header tanggal menempel saat digulir ke bawah.
* Sel "Periode Check" digabung vertikal per kelompok jam (PRD 16.1).
* Lebar kolom tanggal seragam dan sempit (angka tabular), tinggi baris cukup untuk diketuk (minimal 40 px di desktop).
* Sel melebihi batas: angka tebal merah di atas `--over-tint` **plus** penanda kecil ▲ agar tidak bergantung warna. Sel belum diinput: "–" dengan `--empty-tint`. Tidak pernah menampilkan 0 (BR-09).
* Klik sel terisi membuka dialog detail: Nama Petugas, Waktu Input Server, Status Notifikasi WA, "Buka foto bukti", tombol "Ubah Data". Di ponsel, dialog ini menjadi *bottom sheet*.
* **Cetak PDF:**

```css
@page { size: A4 landscape; margin: 8mm; }
@media print {
  nav, .filters, .actions { display: none !important; }
  .matrix { font-size: 7.5pt; }
  .matrix th.weekend {
    background: var(--over) !important;
    color: #fff !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
}
```

Ke-31 kolom harus muat dalam satu halaman lebar tanpa terpotong. Judul laporan menampilkan "Oktober 2026".

### 5.5 Dialog Ubah Data (Admin)

Menampilkan suhu saat ini (hanya baca), isian suhu baru, aksi "Ganti foto" (membuka kamera), isian **Alasan perubahan**, serta aksi "Batal" dan "Simpan perubahan". Tombol simpan nonaktif sampai alasan terisi jika keputusan OQ-01 (alasan wajib) disetujui.

---

## 6. Interaksi dan Gerak

* **Gerak hanya sebagai respons terhadap tindakan pengguna:** dialog membuka, kartu berubah status setelah simpan, indikator proses saat simpan. Durasi 150–200 ms.
* **Tidak ada animasi masuk** pada halaman atau bagian, tidak ada efek hover dekoratif pada setiap kartu.
* Hormati `prefers-reduced-motion`.
* **Fokus keyboard selalu terlihat** (cincin 3 px `--primary`, jarak 2 px). Urutan tab mengikuti urutan visual. Dialog menjebak fokus dan bisa ditutup dengan Esc.
* **Umpan balik proses penyimpanan** mengikuti PRD 9.3: tombol langsung nonaktif, label berganti `Mengompres Foto...` lalu `Mengunggah ke Drive...` lalu `Menyimpan Transaksi...`.
* **Gagal dengan aman:** saat gagal, kartu berstatus "Gagal simpan", angka suhu dan foto tetap ada, tombol "Coba Simpan Lagi" tersedia.
* **Jaringan lambat:** indikator proses tidak boleh membeku tanpa kabar; jika lebih dari 10 detik, tampilkan keterangan "Koneksi lambat, masih mencoba" tanpa membatalkan proses.

---

## 7. Bahasa Antarmuka (Microcopy)

Aturan: bahasa Indonesia sehari-hari, *sentence case*, kata kerja aktif, tanpa basa-basi. Satu aksi punya satu nama di seluruh alur: tombol "Simpan lokasi" menghasilkan notifikasi "Lokasi tersimpan".

### 7.1 Nama aksi baku

Nama dari PRD dipakai persis. Nama lain mengikuti pola yang sama.

| Konteks | Teks |
| --- | --- |
| Masuk akun | Masuk |
| Ambil foto | Ambil Foto Kamera |
| Simpan satu lokasi | Simpan per Lokasi (judul bagian), tombol di kartu: "Simpan lokasi" |
| Simpan banyak | Simpan Semua |
| Ulang setelah gagal | Coba Simpan Lagi |
| Edit transaksi | Ubah Data |
| Kirim ulang notifikasi | Kirim Ulang WA |
| Konfirmasi ubah | Simpan perubahan |
| Batalkan | Batal |

### 7.2 Pesan sistem

Kesalahan menjelaskan **apa yang terjadi** dan **apa yang harus dilakukan**, dalam suara antarmuka (tidak meminta maaf, tidak samar).

| Situasi | Pesan |
| --- | --- |
| Data sudah terisi (BR-03, wajib persis) | Data suhu untuk lokasi [X] pada jam [Y] sudah terisi. Silakan hubungi Admin jika diperlukan perubahan data. |
| Login salah | Username atau password salah. Periksa lagi, lalu coba masuk kembali. |
| Akun nonaktif | Akun ini dinonaktifkan. Hubungi Admin untuk mengaktifkannya. |
| Tanggal terkunci | Input hari ini ditutup. Hubungi Admin untuk membukanya. |
| Izin kamera ditolak | Kamera belum diizinkan. Buka pengaturan browser, izinkan akses kamera untuk situs ini, lalu muat ulang halaman. |
| Izin lokasi ditolak | Lokasi GPS tidak dicantumkan pada foto. Anda tetap bisa menyimpan data. |
| Gagal unggah foto | Foto belum terunggah. Foto dan angka suhu Anda masih tersimpan di layar. Ketuk "Coba Simpan Lagi". |
| WA gagal (setelah simpan berhasil) | Data tersimpan. Notifikasi WhatsApp belum terkirim dan akan dicoba lagi oleh Admin. |
| Suhu tidak valid | Masukkan angka suhu, misalnya 28,5. |
| Foto belum ada | Ambil foto termometer sebelum menyimpan. |

### 7.3 Kondisi kosong

* Belum ada transaksi di hari itu: "Belum ada data suhu hari ini. Pilih jadwal lalu isi lokasi pertama."
* Rekap tanpa data di bulan itu: "Belum ada data untuk Oktober 2026. Data muncul di sini setelah petugas menyimpan suhu."
* Tidak ada notifikasi gagal: "Semua notifikasi WhatsApp terkirim."

### 7.4 Dialog konfirmasi tindakan penting

Judul menyebut objeknya, isi menjelaskan akibatnya, tombol memakai kata kerja yang sama dengan aksi.

* "Nonaktifkan lokasi D05?" / "D05 tidak muncul lagi di form input baru. Data lama dan laporan bulan lalu tetap utuh." / [Batal] [Nonaktifkan]
* "Reset password Marlina?" / "Anda akan membuat password sementara. Marlina perlu menggantinya setelah masuk." / [Batal] [Reset password]

---

## 8. Aksesibilitas (Lantai Kualitas)

Wajib terpenuhi sebelum sebuah layar dinyatakan selesai:

* Kontras teks 4,5:1, komponen UI 3:1 (diverifikasi dengan alat).
* Status selalu memakai ikon + kata, bukan warna saja.
* Semua kontrol bisa dioperasikan dengan keyboard; fokus terlihat.
* Setiap input punya `label` terhubung; pesan kesalahan terhubung lewat `aria-describedby`; perubahan status penting (berhasil, gagal) diumumkan lewat `aria-live`.
* Tabel rekap memakai elemen tabel semantik (`th` dengan `scope`), sel gabungan memakai `rowspan` yang benar.
* Gambar foto bukti punya teks alternatif yang menyebut lokasi dan jam.
* Responsif tanpa gulir horizontal halaman pada lebar 360 px (kecuali di dalam kontainer tabel rekap).
* Hormati `prefers-reduced-motion`.

---

## 9. Hal yang Dilarang (Pola Desain Generik)

Pola berikut sering menandai desain yang dibuat otomatis tanpa pertimbangan. Hindari kecuali ada alasan yang dicatat.

* Gradien atau latar berwarna sebagai dekorasi.
* Semua elemen dibungkus kartu yang sama persis (sudut sama, bayangan sama).
* Label kecil huruf kapital berjarak di atas setiap judul.
* Penomoran dekoratif (01, 02, 03) pada konten yang bukan urutan.
* Menyorot satu kata di judul dengan warna atau miring.
* Animasi masuk dan efek hover pada setiap bagian.
* Teks berpisah titik tengah ("A · B · C") atau tanda panah `→` pada tombol dan tautan.
* Emoji sebagai ikon antarmuka.
* Palet krem dengan aksen terakota. Palet proyek ini sudah ditetapkan di Bagian 3.1.
* Ilustrasi atau foto stok yang tidak membawa informasi.

---

## 10. Cara AI Mengerjakan Desain

Urutan kerja untuk setiap layar atau komponen:

1. **Baca** `docs/PRD.md` bagian yang relevan dan dokumen ini.
2. **Rencanakan singkat:** token yang dipakai, wireframe ASCII tata letak ponsel dan desktop, dan keadaan yang harus ada (kosong, memuat, berhasil, gagal, terkunci).
3. **Tinjau terhadap brief:** apakah ada bagian yang terlihat seperti default generik? Jika ya, ubah dan catat alasannya.
4. **Bangun** memakai token, bukan nilai langsung.
5. **Periksa tampilan** pada lebar 360 px, 768 px, dan 1440 px (ambil tangkapan layar jika lingkungan mendukung), termasuk tampilan cetak untuk Rekap Bulanan.
6. **Kritik diri:** cabut satu hiasan yang tidak melayani tujuan. Pastikan angka suhu dan status tetap yang paling menonjol.
7. **Laporkan:** layar apa yang dibuat, ID PRD yang dipenuhi, keputusan desain yang diambil, dan pertanyaan terbuka.

Jika desain membutuhkan perilaku baru (field, alur, atau aturan yang belum ada di PRD), **berhenti dan usulkan perubahan PRD** sesuai Bagian 22.2. Jangan menambahkannya diam-diam lewat antarmuka.

---

## 11. Daftar Periksa Sebelum Selesai

* [ ] Angka suhu dan status terbaca sekilas di layar 360 px di bawah cahaya terang (kontras terverifikasi).
* [ ] Setiap status memakai ikon + kata + warna.
* [ ] Tidak ada jalur galeri di mana pun pada alur foto.
* [ ] Kartu dan rekap tidak pernah menampilkan 0 untuk data kosong.
* [ ] Foto dan angka tidak hilang saat gagal simpan.
* [ ] Tombol dan area sentuh minimal 44×44 px.
* [ ] Rekap Bulanan tercetak A4 landscape, 31 kolom muat, header Sabtu/Minggu merah tercetak.
* [ ] Pesan BR-03 persis seperti PRD.
* [ ] Semua teks antarmuka mengikuti nama aksi baku dan sentence case.
* [ ] Tidak ada elemen dari daftar larangan Bagian 9.
* [ ] Tidak ada hex, ukuran, atau jarak yang ditulis di luar token.

---

## 12. Riwayat Dokumen

| Versi | Tanggal | Perubahan |
| --- | --- | --- |
| 1.0 | 17 Oktober 2026 | Draf awal panduan desain, selaras dengan PRD 1.0 (rev.). |
| 1.1 | 19 Oktober 2026 | Penyelarasan penuh ke token Apple HIG (Dynamic System Palette, SF Pro Typography, squircle, frosted glass), perbaikan rasio kontras WCAG AA (--ink-muted #6E6E73), penghapusan polusi warna shift, dan spesifikasi cetak A4 Landscape. |
