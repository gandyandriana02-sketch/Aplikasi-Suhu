# Modul 02: Form Catat Suhu Utama (Member & Admin)

**Lokasi File Prototype:**
- **Versi Aktif (v2.3):** [`Desain tamplet/02-catat-suhu/index.html`](./index.html) *(Apple HIG Segmented Control & Header Clean)*
- **Versi v2.3 (Arsip):** [`Desain tamplet/02-catat-suhu/v2/index.html`](./v2/index.html)
- **Versi v1:** [`Desain tamplet/02-catat-suhu/v1/index.html`](./v1/index.html) *(Standard Mobile Card)*

**Mapping Source Code Aplikasi Asli:** `src/app/page.tsx`  
**PRD Acuan:**
- Bagian 6 (FR-007, FR-008, FR-009, FR-010, FR-011, FR-012, FR-014)
- Bagian 7 (Business Rules: BR-01, BR-02, BR-03, BR-04, BR-05, BR-06, BR-09)
- Bagian 10 (Skema Data `TRANSAKSI_SUHU`, `MASTER_LOKASI`, `MASTER_PERIODE`, `SETTINGS`)
- Bagian 12 (Endpoint `GET /api/transactions`, `POST /api/transactions`, `PUT /api/transactions/[id]`)
- Bagian 14 (Keamanan & Akses)

**Status Review:** 🟢 **Disetujui (Approved v2.3)** — Menjadi acuan resmi implementasi Modul 02.

---

## 1. Evolusi Desain: Dari v1 ke v2.3 (Standarisasi Apple HIG & Respons Masukan Pengguna)

Berdasarkan masukan pengguna pada screenshot tinjauan layout:
1. **Kotak Merah (Hapus Pill Warehouse di Kiri Atas):** Pill dropdown warehouse `[ • WH-JKT-01 Central Gudang v ]` dihapus sepenuhnya dari header. Berdasarkan PRD FR-004, perpindahan gudang ditempatkan di modal profil akun (Modul 04). Large Title iOS *Catat Suhu* kini langsung sejajar di sisi kiri dengan sub-meta tanggal & konteks gudang (`Senin, 19 Oktober 2026 • WH-JKT-01 (4 Titik Pantau)`), serta avatar profil petugas di sisi kanan atas.
2. **Kotak Kuning (Revisi Filter Chips Rail yang Terpotong):** Filter rail horizontal lama yang sebelumnya terpotong di tepi kanan layar (`Melebihi...`) digantikan dengan **Apple iOS Native Segmented Control** (`UISegmentedControl` pattern). Memiliki 4 kolom proporsional seimbang 100% lebar layar (`Semua (4)`, `Belum (2)`, `Normal (1)`, `Over (1)`) dengan indikator badge counter Apple HIG. Tidak ada teks terpotong dan tidak memerlukan scroll horizontal yang kikuk pada layar ponsel (360px–430px).
3. **Standarisasi Apple Human Interface Guidelines (HIG):**
   - Mengadopsi palet Apple System Colors (`#0071E3`, `#34C759`, `#FF3B30`, `#F5F5F7`, `#1D1D1F`, `#86868B`).
   - Kurva animasi pegas Apple (`--apple-smooth: cubic-bezier(0.16, 1, 0.3, 1)`).
   - Border radius squircle Apple (`24px` card, `16px` inner container, `12px` segmented track).
   - Tipografi SF Pro dengan Tabular Numbers (`font-variant-numeric: tabular-nums`) untuk konsistensi angka desimal suhu.
4. **Penyelarasan Font & Icon Selevel iOS (Cross-Platform Optical Harmony):**
   - **Font Fallback Teratasi:** Mengimpor webfont resmi `SF Pro Display` & `Inter` CDN sehingga pengguna yang membuka via Windows PC atau Android tidak lagi dipaksa melihat *Segoe UI* atau *Roboto* yang renggang dan kaku.
   - **Penghapusan Font Pecahan Subpixel:** Menghapus seluruh pecahan font (`11.5px`, `9.5px`, `10.5px`, `12.5px`, `13.5px`) dan menormalkannya ke skala diskret integer Apple HIG (10px, 11px, 12px, 13px, 14px, 15px, 17px, 20px, 30px) agar teks tampil tajam dan bebas dari blur antialiasing di layar non-Retina.
   - **Standarisasi SF Symbols:** Seluruh icon SVG diseragamkan ketebalannya ke `stroke-width="1.85"` dengan `stroke-linecap="round"` `stroke-linejoin="round"`, dibungkus `.sf-icon-wrap` flex-centered, dan icon tab bar bawah diperbarui dengan sudut squircle membulat (`rx="2.2"`) yang seimbang.

---

## 2. Identifikasi Modul (Tahap A)

- **Tujuan Halaman:** Sebagai ruang kerja utama harian bagi petugas lapangan (Member) dan Admin untuk mencatat, memvalidasi bukti kamera, dan memantau pemenuhan pencatatan suhu per lokasi dan per shift di gudang logistik yang aktif.
- **Pengguna Terlibat:**
  1. **Member (Petugas Lapangan):** Mencatat suhu lokasi pada hari ini, memicu kamera perangkat untuk foto bukti termometer, dan menyimpan transaksi (per lokasi atau sekaligus via *Simpan Semua*). Data yang sudah tersimpan otomatis terkunci (BR-03).
  2. **Admin:** Memiliki hak penuh yang sama dengan Member, ditambah kemampuan memilih tanggal historis, mengoreksi data transaksi yang keliru via modal audit (*Alasan Wajib Diisi* - FR-012), serta mengirim ulang notifikasi WhatsApp jika gagal (*Retry WA* - FR-014).
- **Data yang Ditampilkan:**
  - Gudang aktif terpilih (misal: `WH-JKT-01 — Central Gudang`).
  - Tanggal pemeriksaan (default: hari ini, WIB).
  - Pilihan shift pemeriksaan (Pagi, Siang, Sore) dengan counter progress (`X/Y selesai`) dan visual progress bar.
  - Kartu per lokasi: status badge (`BELUM DIISI`, `NORMAL`, `MELEBIHI BATAS`), input suhu hero dengan stepper, trigger kamera perangkat (`capture="environment"`), preview foto siap simpan, dan riwayat tersimpan lengkap (suhu, jam, petugas, status WA).
  - Bilah simpan massal melayang (*Floating Batch Save Banner*) di bagian bawah.

---

## 3. Fitur Interaktif yang Disimulasikan dalam Prototype (Tahap C)

1. **Simulasi Penggantian Role (Member vs Admin):**
   - Klik `[ Member ]`: Kartu yang sudah tersimpan menampilkan badge *"Terkunci untuk Member (BR-03)"*.
   - Klik `[ Admin ]`: Kartu yang sudah tersimpan menampilkan tombol **"Ubah Data (Audit)"** untuk membuka modal koreksi transaksi (FR-012).
2. **Pergantian Shift Berjenjang (Pagi, Siang, Sore):**
   - Klik kartu Shift: Kartu-kartu lokasi di bawahnya meluncur masuk dengan animasi berjenjang (*staggered entrance*).
3. **Filter Status Akordeon (Semua, Belum Diisi, Normal, Melebihi Batas):**
   - Klik chip filter: Kartu yang tidak sesuai menyusut (*collapse*) secara anggun tanpa ada pergeseran layar mendadak.
4. **Input Suhu Responsif & Quick Stepper (Kartu 3):**
   - Tekan `[-]` atau `[+]` untuk mengubah suhu per 0,5°C, atau klik tombol preset (`23,2°C`, `24,8°C`, `26,5°C`).
   - Jika > 25,0°C: Banner peringatan merah meluncur turun dan badge otomatis berubah menjadi `MELEBIHI BATAS`.
5. **Simulasi Foto Kamera & Watermark GPS:**
   - Klik *"Buka Kamera Perangkat"* untuk membuat kanvas termometer virtual.
   - Pratinjau foto langsung muncul dengan informasi ukuran kompresi dan koordinat GPS.
6. **Simulasi Simpan Per Lokasi (FR-009):**
   - Klik *"Simpan Lokasi Ini"*: Muncul loading spinner, form input otomatis bertransformasi menjadi spesifikasi tersimpan, dan progress Shift Pagi bertambah menjadi `3/4 Selesai` (75%).
7. **Lightbox Bukti Foto (Kartu 1 & 2):**
   - Klik *"Lihat Foto ↗"* untuk membuka modal pratinjau termometer digital beresolusi tinggi lengkap dengan overlay watermark.
8. **Modal Koreksi Data oleh Admin (FR-012):**
   - Klik *"Ubah Data (Audit)"* untuk memasukkan suhu baru dan alasan perubahan data untuk audit trail.

---

## 4. Pemeriksaan Kesesuaian (Tahap D)

| Kebutuhan PRD / Source Code | Status di Prototype | Catatan |
|---|---|---|
| **FR-007 (Gudang, Tanggal, Shift)** | ✅ Terpenuhi | Tab shift responsif, progress counter, Admin switch |
| **FR-008 (Input Suhu & Foto Kamera)** | ✅ Terpenuhi | Stepper decimal, dynamic alert > 25°C, simulasi kamera HP & watermark |
| **FR-009 (Simpan Per Lokasi)** | ✅ Terpenuhi | Tombol simpan mandiri dengan animasi loading dan morphing |
| **FR-010 (Simpan Semua / Batch)** | ✅ Terpenuhi | Floating save banner melayang di atas navigasi bawah |
| **FR-011 & BR-03 (Immutability Member)** | ✅ Terpenuhi | Member dilarang menimpa data tersimpan |
| **FR-012 (Koreksi Admin + Alasan)** | ✅ Terpenuhi | Modal dialog audit dengan validasi alasan wajib |
| **FR-014 (Status Notifikasi WhatsApp)** | ✅ Terpenuhi | Banner SENT darurat tersimulasi pada kartu overlimit |
| **Zero Fake Status Bar** | ✅ Terpenuhi | Tidak ada status bar jam/baterai tiruan sesuai arahan |
| **Mobile-First Responsiveness** | ✅ Terpenuhi | Didesain khusus untuk viewport ponsel logistik & desktop tester frame |
