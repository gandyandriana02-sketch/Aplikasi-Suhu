# Modul 03: Overlay Kamera Bukti & Watermark GPS

**Lokasi File Prototype:**
- **Versi Aktif (v1.0):** [`Desain tamplet/03-kamera-watermark/index.html`](./index.html) *(Apple HIG Camera Viewfinder & Watermark Canvas)*
- **Versi v1.0 (Arsip):** [`Desain tamplet/03-kamera-watermark/v1/index.html`](./v1/index.html)

**Mapping Source Code Aplikasi Asli:** `src/components/CameraCaptureModal.tsx`  
**PRD Acuan:**
- Bagian 6: **FR-008** (Pemicu Kamera Perangkat, Kompresi Klien, Watermark Otomatis)
- Bagian 7: **BR-05** (Kamera Perangkat Wajib, Tanpa Galeri Umum), **BR-06** (GPS Jujur Tanpa Fabrikasi)
- Bagian 11: **NFR-01** (Kompresi Citra Klien Maksimal 1280px & Target Ukuran < 350 KB, batas absolut < 1 MB)
- Bagian 11: **NFR-03** (Zona Waktu Asia/Jakarta WIB)
- Bagian 13: **DESIGN.md Bagian 5.2** (Camera & Watermark Component UX)

**Status Review:** 🟡 Menunggu Peninjauan & Persetujuan Pengguna (*Pending Approval v1.0*)

---

## 1. Identifikasi Modul (Tahap A)

- **Tujuan Modul:** Memberikan antarmuka jendela bidik (*viewfinder*) kamera perangkat yang imersif dan ergonomis bagi petugas lapangan untuk memotret layar termometer digital ruangan chiller/gudang secara langsung, membakar (*draw*) watermark permanen anti-fraud pada kanvas foto, memvalidasi koordinat GPS, serta mengompresi gambar sebelum dikirim ke Google Drive via API v3.
- **Pengguna Terlibat:** Petugas Lapangan (Member) dan Admin Gudang saat melakukan pencatatan suhu rutin.
- **Data yang Ditampilkan & Dibakar pada Watermark:**
  1. **Waktu:** Format `DD Mon YYYY, HH:mm:ss WIB` zona waktu resmi Asia/Jakarta.
  2. **Lokasi:** Nama titik pantau suhu aktif (misal: `Storage Chiller A`).
  3. **Petugas:** Nama lengkap akun login yang bertugas (misal: `Budi Santoso`).
  4. **GPS:** Koordinat latitude, longitude riil dari `navigator.geolocation` (misal: `-6.1751, 106.8650`), atau status *"Lokasi tidak dicantumkan"* jika izin GPS ditolak/tidak aktif (BR-06).
- **Alur Kerja Pengguna:**
  1. Klik *"Buka Kamera Perangkat"* pada Form Catat Suhu (Modul 02).
  2. Viewfinder kamera terbuka layar penuh (*full-screen camera overlay*).
  3. Arahkan bingkai lensa ke angka termometer digital (tersedia grid framing rule of thirds dan fokus optik kuning).
  4. Tekan tombol Shutter Apple (lingkaran putih 76px).
  5. Sistem merender watermark kanvas secara otomatis dan mengompresi citra ke format JPEG 80% (maks 1280px, ~200-300 KB).
  6. Masuk ke mode Review: Petugas dapat memilih *"Ulangi Foto"* atau *"Gunakan Foto ↗"*.
  7. Foto terverifikasi dikembalikan ke form untuk disimpan.

---

## 2. Usulan Desain: Apple HIG Camera Experience (Tahap B)

Mengikuti bahasa desain resmi **Apple iOS Camera App**:
1. **Layar Penuh Gelap Murni (True Black `#000000`):** Mengurangi distraksi visual dan memfokuskan mata petugas pada angka termometer digital.
2. **Top Translucent HUD:**
   - Tombol Batal/Tutup melingkar di kiri atas (`✕`).
   - Pill Indikator GPS dinamis di kanan atas: hijau jika GPS akurat tervalidasi, kuning jika sedang mencari sinyal, abu-abu jika GPS tidak tersedia.
3. **Viewfinder Optik:**
   - Garis bantu tipis komposisi (*Rule of Thirds grid*).
   - Animasi kotak fokus kuning berdenyut lembut khas iOS Camera.
   - Pill panduan melayang: *"Arahkan ke layar termometer digital"*.
4. **Ergonomic Bottom Thumb Deck:**
   - **Shutter Apple:** Lingkaran tombol putih ganda dengan tactile click animation.
   - **Tombol Flip Kamera:** Beralih antara kamera belakang (`environment`) dan depan (`user`).
   - **Tombol Flash/Torch:** Simulasi senter penerangan ruangan gelap.
   - **State Review (Pasca-Jepret):** Menampilkan tombol kapsul ganda seimbang: tombol *"Ulangi Foto"* (outline lembut) dan tombol *"Gunakan Foto"* (biru kapsul vibran).
   - **Chip Spesifikasi Citra:** Menampilkan ukuran kompresi aktual secara real-time (misal: `214 KB • Target < 350 KB`).

---

## 3. Fitur Interaktif yang Disimulasikan (Tahap C)

1. **Uji Kamera Asli vs Mock Simulator:**
   - Tersedia toolbar penguji di bagian atas layar desktop untuk beralih antara kamera webcam/HP fisik (`Kamera Asli`) atau simulator kanvas termometer gudang (`Mock Termometer`) agar prototype dapat diuji di mana saja tanpa webcam.
2. **Simulasi Penolakan Izin Kamera:**
   - Klik `[ Izin Ditolak ]`: Menampilkan kartu peringatan ramah pengguna dengan tombol coba lagi sesuai amanat BR-05.
3. **Simulasi GPS Aktif vs Ditolak (BR-06):**
   - Klik `[ GPS Aktif ]`: Koordinat `-6.1751, 106.8650` tercantum pada pill HUD dan dibakar pada watermark.
   - Klik `[ GPS Ditolak ]`: Status berubah menjadi *"Lokasi tidak dicantumkan"* secara jujur tanpa membuat koordinat palsu (BR-06).
4. **Auto Snap & Watermark Generator:**
   - Klik `[ ⚡ Auto Snap & Watermark ]`: Menjalankan alur pemotretan otomatis dan langsung menampilkan hasil kanvas watermark beresolusi tinggi lengkap dengan ukuran file hasil kompresi JPEG.

---

## 4. Pemeriksaan Kesesuaian (Tahap D)

| Kebutuhan PRD / Source Code | Status di Prototype | Catatan Implementasi |
|---|---|---|
| **FR-008 & BR-05 (Kamera Perangkat Wajib)** | ✅ Terpenuhi | Menggunakan media stream `environment`, tidak ada picker galeri file umum |
| **BR-06 (GPS Jujur Tanpa Fabrikasi)** | ✅ Terpenuhi | Koordinat riil dibakar pada kanvas; jika nonaktif tercatat tidak dicantumkan |
| **NFR-01 (Kompresi Klien Maks 1280px & < 350 KB)** | ✅ Terpenuhi | Skala otomatis sisi terpanjang 1280px, rasio kompresi JPEG 0.8, counter KB nyata |
| **NFR-03 (WIB Asia/Jakarta)** | ✅ Terpenuhi | Watermark waktu diformat dengan timeZone `Asia/Jakarta` |
| **Apple HIG Shutter & Review Flow** | ✅ Terpenuhi | Transisi shutter button ke dua tombol aksi jempol (Ulangi / Gunakan) |
| **Error Handling Ramah Pengguna** | ✅ Terpenuhi | Card instruksi izin kamera ramah operasional |
