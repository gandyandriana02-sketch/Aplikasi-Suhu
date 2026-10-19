# Modul 05: Dashboard Pemantauan Operasional

**Lokasi File Prototype:**
- **Versi Aktif (v1.1):** [`Desain tamplet/05-dashboard/index.html`](./index.html) *(Apple HIG Bento Grid, Slot Matrix & Harmonized Floating Island)*
- **Versi v1.0 (Arsip):** [`Desain tamplet/05-dashboard/v1/index.html`](./v1/index.html)

**Mapping Source Code Aplikasi Asli:** 
- `src/app/dashboard/page.tsx` *(Halaman dashboard utama)*
- `src/app/api/dashboard/route.ts` *(Endpoint agregasi metrik, ringkasan gabungan, & slot matrix)*

**PRD Acuan:**
- Bagian 6: **FR-015** (Dashboard Operasional: Ringkasan Slot, Suhu Tertinggi/Terendah, Overlimit, WA Status, & Feed Transaksi)
- Bagian 6: **FR-020** (Dashboard Gabungan & Detail: Mode Konsolidasi Multi-Warehouse untuk Admin vs Gudang Aktif untuk Member)
- Bagian 7: **BR-07** (Aturan Pemicu Peringatan Suhu: `suhu > batas_suhu_aktif`)
- Bagian 7: **BR-09** (Representasi Data Kosong: Slot Belum Diisi Tidak Boleh 0 atau 0,0°C)
- Bagian 11: **NFR-03** (Zona Waktu Operasional Terkunci pada Asia/Jakarta WIB)
- Dokumen Desain: **DESIGN.md Bagian 5.3** (Layout Dashboard Grid Matriks, Daftar Rapat Metrik, & Microcopy)

**Status Review:** 🟡 Menunggu Peninjauan & Persetujuan Pengguna (*Pending Approval v1.1*)

---

## 1. Identifikasi Modul (Tahap A)

- **Tujuan Modul:** Menyediakan pusat pemantauan visual (*operational command center*) yang memberikan gambaran seketika kepada petugas (Member) dan pengawas (Admin) mengenai kelengkapan pemeriksaan suhu hari ini, mendeteksi penyimpangan suhu chiller/gudang secara langsung (*early detection*), memverifikasi keandalan notifikasi WhatsApp Fonnte, serta memfasilitasi peninjauan rincian audit transaksi dan foto bukti GPS.
- **Pengguna Terlibat:**
  1. **Member (Petugas Lapangan):** Memantau progres pengisian shift hari ini pada warehouse aktifnya, memeriksa slot titik pantau yang belum terisi (*unfilled slots*), dan meninjau riwayat input tim.
  2. **Admin Gudang:** Memiliki akses ke *mode konsolidasi gabungan* seluruh warehouse aktif (FR-020), filter cepat antar-gudang (`CK01`, `CK02`), riwayat tanggal masa lalu (*date picker*), dan audit log transaksi.
- **Data yang Ditampilkan:**
  1. **Bento KPI Grid:**
     - *Hero Metric:* Kelengkapan Slot Pemeriksaan (`X/Y Slot` + persentase progres visual + counter sisa slot).
     - *Suhu Tertinggi:* Angka hero 32px (`35,5°C`) lengkap dengan lokasi dan jam terjadinya.
     - *Suhu Terendah:* Angka hero (`21,4°C`) dengan label lokasi & jam.
     - *Peringatan Suhu (Overlimit):* Jumlah kejadian suhu melebihi batas aktif beserta batas yang berlaku (`≤ 25,0°C`).
     - *WhatsApp Gateway:* Status pengiriman pesan peringatan real-time (`TERKIRIM` via Fonnte API).
  2. **Matriks Pemeriksaan Slot ("Hari Ini"):**
     - Tabel silang dua dimensi: Baris Jadwal Shift (`09.00`, `13.00`, `17.00`) × Kolom Titik Lokasi Pantau (`Inbound`, `Storage A`, `Storage B`, `D05 Cold`).
     - Sel interaktif: Hijau (`NORMAL`), Merah berdenyut (`OVER ▲`), Abu-abu (`KOSONG –`). Sesuai BR-09, slot kosong dilarang dikonversi menjadi angka 0.
  3. **Feed Transaksi Tersimpan Hari Ini:**
     - Deretan kartu inset grouped rapi yang mencantumkan nama lokasi, jam shift, nama petugas, suhu aktual, dan tombol pintas *"Lihat Foto Bukti ↗"*.
  4. **Modal Detail Transaksi (Apple Lightbox):**
     - Pop-up detail lengkap yang muncul saat sel matriks atau kartu transaksi diklik, menampilkan rincian audit: waktu server resmi (WIB), petugas, ID foto Google Drive, dan koordinat GPS asli (BR-06).

---

## 2. Usulan Desain: Apple HIG Bento Grid Experience (Tahap B)

Mengikuti prinsip resmi **Apple Human Interface Guidelines (HIG)**:
1. **Apple Bento KPI Grid (Bukan Kartu Identik Monoton):**
   - Kartu metrik disusun asimetris dan bermakna: Kartu *Kelengkapan Slot* menempati lebar penuh (*Hero Card*) dengan bar progres halus, diikuti oleh 4 kartu pendukung (Suhu Tertinggi, Suhu Terendah, Overlimit, WA Status).
   - Setiap kartu memiliki ikon SF Symbols dalam squircle berwarna cerah (Biru, Merah, Indigo, Oranye).
2. **Matriks Interaktif Layar Sentuh (*44px Touch Targets*):**
   - Seluruh sel suhu pada tabel matriks memiliki tinggi minimum 44px dengan efek tekan haptic (*active press scale 0.95*).
   - Penanda status tidak hanya warna: Suhu overlimit menampilkan warna merah + segitiga `▲` + label teks `OVER` (memenuhi aturan aksesibilitas DESIGN.md Bagian 2).
3. **Penyaring Gudang Segmented Control (Admin Multi-Warehouse):**
   - Khusus peran Admin, bilah atas menampilkan `UISegmentedControl` Apple proporsional untuk beralih antara `Semua Gudang`, `CK01 Cikupa 1`, dan `CK02 Annex` secara instan tanpa reload halaman.
4. **Navigasi Kapsul Melayang (*Floating Dynamic Island*):**
   - Menghubungkan alur kerja secara mulus antara Tab *Catat Suhu* (Modul 02), Tab *Dashboard* (Modul 05), dan Tab *Profil* (Modul 04).
5. **Harmonisasi Navigasi & Transisi Bebas Hentakan (*Zero-Jitter View Transition*):**
   - Menyamakan seluruh spesifikasi geometri, posisi (`bottom: 24px`), dan warna tab aktif (kapsul biru iOS) di semua modul sehingga navbar tidak pernah meloncat/bergeser saat berpindah halaman. Ruang gulir bawah diperluas menjadi `150px` agar matriks slot dan kartu riwayat tidak terhalang.

---

## 3. Fitur Interaktif pada Prototype (Tahap C)

1. **Toolbar Pengujian Cepat (Desktop Testing Bar):**
   - **Toggle Peran (Member vs Admin):** Menguji perbedaan tampilan Member (hanya melihat gudang aktifnya) dan Admin (muncul kontrol segmentasi gudang konsolidasi).
   - **Toggle Tanggal (Hari Ini vs Kemarin):** Beralih antara data operasional hari ini dan riwayat historis hari kemarin, lengkap dengan tombol *"Kembali ke Hari Ini"*.
   - **Simulasi Peringatan Suhu:** Membuka langsung modal detail untuk transaksi `35,5°C` pada Storage A guna memverifikasi tampilan alert overlimit.
2. **Interaktivitas Matriks Slot:**
   - Mengetuk sel hijau membuka pop-up status Normal.
   - Mengetuk sel merah membuka pop-up status Overlimit dengan rekomendasi tindakan.
   - Mengetuk sel kosong menampilkan pemberitahuan ramah bisnis bahwa slot belum diisi (BR-09).
3. **Interaktivitas Detail Modal & Bukti Foto:**
   - Pop-up rincian audit menampilkan waktu server resmi (WIB Asia/Jakarta), nama petugas pelapor, status pengiriman WA, dan verifikasi metadata foto Drive + GPS.

---

## 4. Pemeriksaan Kesesuaian PRD (Tahap D)

| Kebutuhan PRD / Source Code | Status di Prototype | Catatan Implementasi |
|---|---|---|
| **FR-015 (Dashboard Operasional)** | ✅ Terpenuhi | 5 Metrik Bento KPI, matriks lokasi × jadwal, dan feed transaksi hari ini |
| **FR-020 (Dashboard Gabungan & Detail)** | ✅ Terpenuhi | Admin memiliki kontrol segmented filter gudang (Semua vs CK01 vs CK02) |
| **BR-07 (Aturan Pemicu Suhu > Batas)** | ✅ Terpenuhi | Suhu 35,5°C berstatus Melebihi Batas (> 25,0°C) dengan penanda visual merah ▲ |
| **BR-09 (Data Kosong Bukan Nol)** | ✅ Terpenuhi | Slot unrecorded tampil sebagai sel tanda hubung "–" dan label "KOSONG", tidak pernah "0°C" |
| **NFR-03 (Zona Waktu Asia/Jakarta WIB)** | ✅ Terpenuhi | Waktu transaksi diformat WIB dan terkunci pada zona waktu operasional |
| **Apple HIG Bento Grid & Squircle** | ✅ Terpenuhi | Desain terinspirasi widget iOS/macOS dengan font SF Pro Tabular Numbers |
| **Zero Production Code Touched** | ✅ Terpenuhi | Seluruh pengerjaan hanya berada di dalam `Desain tamplet/` |
