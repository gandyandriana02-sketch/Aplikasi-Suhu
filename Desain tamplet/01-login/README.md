# Modul 01: Halaman Login & Ganti Password Awal

**Lokasi File Prototype:**
- **Versi Aktif (v2.1):** [`Desain tamplet/01-login/index.html`](./index.html) *(Mobile-First Minimalist — Status Bar Artificial Dihapus)*
- **Versi v2.1:** [`Desain tamplet/01-login/v2/index.html`](./v2/index.html)
- **Versi v1:** [`Desain tamplet/01-login/v1/index.html`](./v1/index.html) *(Enterprise Card)*

**Mapping Source Code Aplikasi Asli:** `src/app/login/page.tsx` & `src/components/ChangePasswordModal.tsx`  
**PRD Acuan:** Bagian 6 (FR-001, FR-002, FR-003), Bagian 12 (API Login), dan Bagian 14 (Keamanan).  
**Status Review:** Menunggu Persetujuan Pengguna (*Pending Approval v2.1*)

---

## 1. Evolusi Desain: Dari v1 ke v2.1 (Berdasarkan Feedback Pengguna)

Pengguna memberikan referensi antarmuka mobile modern (tata letak login aplikasi mobile seperti Instagram / Mobbin) dan kemudian meminta menghapus status bar artificial (9:41, sinyal, baterai) agar tampilan bersih dan alami:
1. **Pembersihan Status Bar:** Status bar tiruan (`9:41`, ikon baterai/wifi) telah dihapus total. Ruang vertikal atas menjadi lebih lapang dan natural saat dibuka di browser ponsel atau desktop.
2. **Layar Penuh Ponsel:** Tanpa bingkai kotak desktop di tengah; antarmuka mengisi layar perangkat secara alami dengan padding sisi yang lapang.
3. **Ikon Aplikasi Utama di Sepertiga Atas:** Ikon aplikasi bergradien dengan sudut membulat halus (*squircle* 22px) dan siluet termometer industri.
4. **Kolom Input Ramping (*Stacked Clean Inputs*):** Dua input bertumpuk rapi dengan border halus 1.5px, radius 14px, dan tombol intip mata (*Eye Toggle*) terintegrasi.
5. **Tombol Masuk Berbentuk Kapsul (*Pill Button*):** Tombol primer biru vibran dengan radius 24px melingkar penuh (*pill-shape*) dan state loading spinner.
6. **Bagian Bawah yang Terjangkau (*Bottom Pinned Action*):** Tombol *outline* sekunder untuk *"Bantuan & Kontak Supervisor"* dan atribusi sistem di atas *Home Indicator* iPhone.

---

## 2. Perbandingan Versi

| Karakteristik | Versi 1 (Enterprise Card) | Versi 2 (Mobile-First Minimalist — Rekomendasi) |
|---|---|---|
| **Tata Letak** | Kotak kartu putih di atas latar abu-abu | *Full-viewport* mobile app dengan hierarki vertikal bersih |
| **Ikon Brand** | Badge kotak hitam 42×42px di atas judul | App Icon 76×76px bergradien biru termometer dengan bayangan kedalaman |
| **Bentuk Tombol** | Kotak dengan radius 8px | Kapsul melingkar penuh (*pill-shape* radius 24px) |
| **Posisi Aksi Bawah** | Teks biasa di bawah form | Tombol *outline* sekunder diposisikan di bagian bawah layar |
| **Navigasi Versi** | - | Tersedia bilah pengalih versi (*Version Switcher*) di bagian atas |

---

## 3. Fitur Interaktif yang Disimulasikan

1. **Intip Password (Eye Toggle):** Klik ikon mata untuk melihat karakter password secara nyata.
2. **Skenario Password Salah:** Menampilkan banner error merah yang bergetar lembut (*subtle shake animation*) dengan pesan resmi PRD: *"Username atau password salah. Periksa lagi, lalu coba masuk kembali."*
3. **Skenario Wajib Ganti Password (FR-002):** Login dengan `admin` / `admin123` otomatis membuka dialog modal ganti password dengan validasi minimal 8 karakter dan larangan `admin123`.
4. **Bantuan Supervisor:** Klik *"Lupa password?"* atau tombol *"Bantuan & Kontak Supervisor"* memunculkan *bottom sheet* kontak operasional.
5. **Toolbar Pengujian Cepat:** Tersedia 4 tombol instan di bagian bawah untuk menguji seluruh skenario tanpa perlu mengetik manual.
