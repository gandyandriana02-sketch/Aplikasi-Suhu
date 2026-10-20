# PRODUCT REQUIREMENTS DOCUMENT (PRD)

**Nama Produk:** Warehouse Temperature Report Web Application

**Versi Dokumen:** 2.6 (Dynamic Watermark Branding & Zero-Hardcoded Fallbacks)

**Tanggal Dokumen:** 20 Oktober 2026

**Status:** Disetujui (*Approved*)

---

## 1. Document Overview

Dokumen Product Requirements Document (PRD) ini mendefinisikan spesifikasi fungsional, teknis, aturan bisnis, skema data, keamanan, dan kriteria pengujian untuk pembangunan aplikasi **Warehouse Temperature Report**. Dokumen ini menjadi acuan tunggal (*Single Source of Truth*) bagi tim pengembang sebelum penulisan kode dimulai.

### Stack Teknologi Wajib (Mandatory Tech Stack)

| Komponen | Teknologi yang Ditetapkan | Ketentuan Arsitektur |
| --- | --- | --- |
| **Source Code & Version Control** | GitHub | Menyimpan seluruh kode sumber dan riwayat perubahan. Kredensial rahasia dilarang masuk ke repositori. |
| **Frontend & Backend Hosting** | Vercel (Next.js App Router dengan TypeScript) | Menjalankan antarmuka pengguna responsif dan seluruh endpoint API backend serverless terpadu. |
| **Database Utama** | Google Sheets (via Google Sheets REST API v4) | Diakses langsung dari backend Vercel menggunakan Google Service Account. |
| **Penyimpanan Bukti Foto** | Google Drive (via Google Drive REST API v3) | Menyimpan file fisik foto terkompresi dalam hierarki folder otomatis Tahun/Bulan. |
| **WhatsApp Gateway** | Fonnte API | Mengirimkan notifikasi peringatan suhu berlebih ke WhatsApp Group dari backend Vercel. |
| **Larangan Teknis** | **Tanpa Google Apps Script** | **Dilarang keras** menggunakan `Code.gs`, `doGet()`, `doPost()`, atau Web App Google Apps Script dalam bentuk apa pun. |

---

## 2. Product Vision and Objectives

### Visi Produk

Menyediakan sistem pencatatan, pemantauan, dan pelaporan suhu area warehouse secara digital, akurat, terverifikasi dengan bukti foto langsung, dan memiliki jejak audit (*audit trail*) yang utuh tanpa ketergantungan pada rekapitulasi manual setiap bulan.

### Tujuan Utama (Objectives)

1. **Kemudahan Operasional Lapangan:** Memudahkan petugas warehouse (Member) menginput suhu rutin dan mengambil foto bukti langsung dari kamera perangkat sesuai jadwal dan lokasi yang ditentukan.
2. **Keamanan & Integritas Data:** Menjamin hanya pengguna terautentikasi yang dapat mengakses sistem, mencegah manipulasi foto dari galeri, mencegah penimpaan data oleh petugas biasa, dan mencatat setiap perubahan di *Audit Log*.
3. **Respon Cepat Kondisi Abnormal:** Mengirimkan peringatan otomatis secara *real-time* ke grup WhatsApp melalui Fonnte setiap kali tercatat suhu yang melewati batas maksimal aktif.
4. **Otomatisasi Pelaporan Bulanan:** Menghasilkan laporan rekapitulasi matriks bulanan secara dinamis (termasuk penanda akhir pekan dan pembeda data kosong) yang siap dicetak ke PDF atau diekspor ke Excel (`.xlsx`) dan CSV tanpa harus membuat *sheet* baru setiap pergantian bulan.

---

## 3. Problem Statement

1. **Kerentanan Input Manual pada Spreadsheet Matriks:** Pengisian langsung ke tabel matriks Google Sheets melalui layar ponsel rawan salah pilih kolom tanggal, salah baris periode jam, atau tidak sengaja menghapus data petugas sebelumnya.
2. **Kurangnya Bukti Dokumentasi Terverifikasi:** Pencatatan angka suhu tanpa kewajiban foto kamera langsung menyulitkan verifikasi apakah pengecekan benar-benar dilakukan di lokasi dan waktu yang sesuai.
3. **Keterlambatan Informasi Suhu Berlebih:** Suhu ruangan yang melewati batas aman (misalnya > 30°C) tidak langsung diketahui oleh pihak terkait jika hanya dicatat di tabel tanpa sistem peringatan aktif ke grup komunikasi.
4. **Beban Administrasi Bulanan:** Pembuatan tabel baru setiap ganti bulan secara manual di Google Sheets menyita waktu dan menyulitkan penelusuran riwayat lintas bulan maupun pelacakan siapa yang mengubah angka tertentu.

---

## 4. Scope dan Out of Scope

### 4.1 In Scope (Termasuk dalam Ruang Lingkup Wajib)

* Dukungan Multi-Warehouse: Satu aplikasi mendukung beberapa warehouse (awal: `CK01` — Cikupa 1 dan `CK02` — Cikupa Annex) dengan pemisahan data operasional, master lokasi, jadwal, batas suhu, hak akses user per warehouse, dan folder Google Drive.
* Sistem autentikasi pengguna berbasis *username* dan *password* (hash) dengan pembagian peran `ADMIN` dan `MEMBER` serta penetapan hak akses warehouse per user.
* Pembuatan otomatis (*auto-seeding*) akun awal (`admin` / `admin123`), master lokasi awal (`Inbound`, `A04`, `D05`), jadwal awal (`09.00`, `13.00`, `17.00`), dan batas suhu awal (`30°C`) apabila belum tersedia di database.
* Manajemen penuh (*CRUD & Soft-Delete*) akun pengguna, master lokasi, jadwal pengecekan, batas suhu, serta aturan kunci hari libur/Minggu oleh Admin.
* Form input suhu untuk Member dan Admin dengan dua mode penyimpanan: **Simpan per Lokasi** dan **Simpan Semua**.
* Pengambilan foto langsung dari kamera perangkat (*live camera capture* tanpa akses galeri), pembubuhan *watermark* informasi (tanggal, waktu, lokasi, nama petugas, dan koordinat GPS jika tersedia), serta kompresi gambar sebelum diunggah.
* Pembuatan struktur folder tahun dan bulan secara otomatis di Google Drive (`Warehouse Temperature Report / [Kode — Nama WH] / YYYY / MM - NamaBulan /`).
* Pengiriman notifikasi peringatan ke WhatsApp Group melalui Fonnte saat suhu melebihi batas aktif, dilengkapi pencegahan duplikasi pesan dan mekanisme percobaan ulang (*retry*).
* Dashboard ringkasan operasional harian dan halaman **Rekap Bulanan** berformat tabel matriks dinamis lengkap dengan fitur cetak PDF serta ekspor `.xlsx` dan `.csv`.
* Pencatatan *Audit Log* untuk setiap perubahan data, pembukaan kunci tanggal, pengelolaan akun, dan perubahan konfigurasi.

### 4.2 Out of Scope (Di Luar Ruang Lingkup Saat Ini)

* Integrasi sensor suhu perangkat keras otomatis (IoT/Bluetooth Thermometer).
* Aplikasi *native* yang diunduh melalui Google Play Store atau Apple App Store (aplikasi dibangun sebagai *Responsive Web Application* yang diakses melalui *browser*).
* Pembuatan *tab/sheet* baru di Google Sheets setiap pergantian bulan (seluruh transaksi disimpan terpusat di sheet `TRANSAKSI_SUHU` dan dirender menjadi matriks oleh aplikasi).
* Pembatasan kunci akses input menggunakan pemindaian QR Code fisik atau *geofencing* pengunci tombol (GPS hanya dicatat sebagai informasi pada *watermark* dan metadata transaksi jika diizinkan pengguna).

---

## 5. User Roles and Permissions

Terdapat tepat dua peran pengguna di dalam sistem: **`ADMIN`** dan **`MEMBER`**. Seluruh validasi hak akses wajib diverifikasi oleh backend Vercel pada setiap permintaan API.

| Modul / Fitur | `MEMBER` | `ADMIN` |
| --- | --- | --- |
| Login ke dalam aplikasi | ✅ Wajib | ✅ Wajib |
| Melihat jadwal dan lokasi pengecekan aktif | ✅ Ya | ✅ Ya |
| Menginput suhu & foto pada tanggal **Hari Ini** (di luar hari yang dikunci) | ✅ Ya | ✅ Ya |
| Menginput suhu pada tanggal masa lalu/depan secara bebas | ❌ Ditolak (Kecuali tanggal dibuka Admin) | ✅ Ya |
| Menimpa/mengubah transaksi suhu yang sudah tersimpan | ❌ Ditolak | ✅ Ya (Dengan konfirmasi & Audit Log) |
| Menyimpan data per lokasi atau Simpan Semua | ✅ Ya | ✅ Ya |
| Melihat status seluruh lokasi pada hari berjalan (hari ini) serta riwayat penginputan milik sendiri | ✅ Ya | ✅ Ya |
| Mengelola akun pengguna (Tambah, Lihat, Ubah, Aktif/Nonaktif, Role, Reset Password) | ❌ Ditolak | ✅ Ya |
| Mengelola Master Warehouse (Tambah, Ubah, Nonaktifkan Kode & Nama WH) | ❌ Ditolak | ✅ Ya |
| Mengatur hak akses warehouse per user (`USER_WAREHOUSE_ACCESS`) | ❌ Ditolak | ✅ Ya |
| Berpindah warehouse aktif (Pindah Warehouse) | ✅ Ya (Hanya WH yang diizinkan) | ✅ Ya (Seluruh WH aktif) |
| Melihat dashboard gabungan seluruh warehouse | ❌ Ditolak | ✅ Ya |
| Mengelola Master Lokasi & Master Jadwal per warehouse | ❌ Ditolak | ✅ Ya |
| Mengubah batas suhu & pengaturan per warehouse | ❌ Ditolak | ✅ Ya |
| Membuka/menutup akses input hari Minggu, hari libur, dan tanggal tertentu | ❌ Ditolak | ✅ Ya |
| Memantau status pengiriman WhatsApp & melakukan *retry* notifikasi gagal | ❌ Ditolak | ✅ Ya |
| Melihat seluruh transaksi, foto bukti, dan *Audit Logs* | ❌ Ditolak | ✅ Ya |
| Mencetak laporan PDF & mengekspor data ke Excel (`.xlsx`) / CSV | ❌ Ditolak | ✅ Ya |

---

## 6. Functional Requirements

*Keterangan Prioritas: **Wajib (Mandatory)** = Harus tersedia agar aplikasi dinyatakan selesai sesuai kriteria penerimaan; **Tambahan (Enhancement)** = Peningkatan kenyamanan yang tidak mengubah aturan inti.*

| ID | Modul | Deskripsi Kebutuhan | Aktor | Aturan & Validasi Backend | Prioritas | Acceptance Criteria (Teruji) |
| --- | --- | --- | --- | --- | --- | --- |
| **FR-001** | Inisialisasi Sistem | Sistem memeriksa keberadaan 8 sheet utama dan data awal. Inisialisasi dijalankan via `POST /api/init` yang wajib menyertakan header `x-setup-key` yang cocok dengan Environment Variable `SETUP_KEY`. Jika `SETUP_KEY` belum diset atau salah, akses ditolak (`403 Forbidden`). Jika akun `admin` sudah ada, sistem menolak dengan `400 Bad Request` sebagai gembok permanen. `SETUP_KEY` wajib segera dihapus dari Vercel setelah inisialisasi sukses. Sistem membuat akun awal `admin` dengan password `admin123` (di-hash), lokasi (`Inbound`, `A04`, `D05`), jadwal (`09.00`, `13.00`, `17.00`), dan batas suhu `30°C`. | Sistem, Admin | Validasi header `x-setup-key`. Hanya dijalankan jika database belum pernah diinisialisasi. Tidak boleh menimpa data jika akun admin sudah ada. | Wajib | Inisialisasi dengan kunci valid membentuk 8 sheet dan akun admin awal; pemanggilan ulang atau tanpa kunci ditolak aman. |
| **FR-002** | Autentikasi & Kewajiban Ganti Password Awal | Pengguna login menggunakan `username` dan `password`. Nama petugas otomatis melekat pada sesi login. Jika pengguna adalah `admin` dan terdeteksi masih menggunakan password bawaan `admin123`, backend menetapkan status sesi `must_change_password: true`. Selama status ini aktif, backend memblokir seluruh endpoint lain dengan HTTP 403 Forbidden, kecuali endpoint ganti password dan logout. Password baru wajib minimal 8 karakter, tidak boleh sama dengan `admin123`, dan dicatat di `AUDIT_LOGS`. | Admin, Member | Backend memverifikasi hash password dan status `ACTIVE`. Backend menegakkan HTTP 403 jika `must_change_password` aktif tanpa perlu mengubah skema 8 sheet. | Wajib | Admin awal wajib mengganti password sebelum dapat mengakses menu apa pun; percobaan akses endpoint lain oleh admin dengan password default ditolak HTTP 403. |
| **FR-003** | Manajemen Akun (CRUD) | Admin dapat menambah akun baru, melihat daftar akun, mengubah nama/role, mengaktifkan/menonaktifkan akun, mengganti kredensial sendiri, dan mereset password pengguna yang lupa. | Admin | Password wajib disimpan dalam bentuk hash. Username harus unik. Semua aksi dicatat di `AUDIT_LOGS`. | Wajib | Admin berhasil membuat akun Member baru, menonaktifkannya (Member gagal login), dan mereset password-nya. |
| **FR-004** | Manajemen Master Lokasi | Admin dapat menambah lokasi baru (misal `B02`), mengubah nama/urutan lokasi, dan menonaktifkan lokasi. | Admin | Lokasi yang sudah memiliki riwayat transaksi di `TRANSAKSI_SUHU` dilarang dihapus permanen; hanya boleh diubah menjadi `INACTIVE`. | Wajib | Lokasi baru tampil di form input aktif; lokasi yang dinonaktifkan hilang dari form input baru namun tetap muncul pada laporan bulan lalu. |
| **FR-005** | Manajemen Master Jadwal | Admin dapat menambah jadwal jam pengecekan baru (misal `21.00`), mengubah urutan, dan menonaktifkan jadwal. | Admin | Jadwal yang sudah memiliki riwayat transaksi tidak boleh dihapus permanen (`Soft-Delete`). | Wajib | Jadwal baru muncul sebagai pilihan periode input; jadwal nonaktif tetap utuh pada histori laporan lama. |
| **FR-006** | Konfigurasi, Kunci Tanggal & Auto-Logout Sesi | Admin dapat mengubah batas suhu maksimal (awal `30°C`), mengunci/membuka akses hari Minggu, mengatur daftar hari libur, membuka kunci tanggal tertentu bagi Member, serta mengonfigurasi batas waktu tidak aktif pengguna (Auto-Logout saat Idle) dengan pilihan preset (Nonaktif/0, 15m, 30m, 1 jam, 2 jam) atau opsi Kustom/Lainnya (input menit/jam bebas). | Admin | Perubahan langsung disimpan ke sheet `SETTINGS` (termasuk kunci `idle_timeout_minutes` ber-scope `GLOBAL`) dan dicatat ke `AUDIT_LOGS`. Tanpa mengubah kode program. | Wajib | Admin mengatur batas idle 30 menit; jika pengguna tidak berinteraksi selama 29.5 menit, muncul peringatan hitung mundur 30 detik sebelum sesi ditutup otomatis dan diarahkan ke login. |
| **FR-007** | Validasi Tanggal Input | Member hanya dapat menginput pada tanggal hari ini, kecuali tanggal lain dibuka oleh Admin. Admin bebas memilih tanggal. | Member, Admin | Backend mengecek tanggal transaksi terhadap waktu server, pengaturan hari Minggu/libur, dan daftar tanggal yang dibuka Admin. | Wajib | Jika Member mencoba mengirim request API untuk tanggal kemarin yang terkunci, backend menolak dengan HTTP 403. |
| **FR-008** | Kamera Perangkat, Reverse-Geocode & Stempel Timemark Dinamis | Pengambilan foto bukti menggunakan kamera langsung browser (WebRTC) dengan stempel watermark digital kanvas presisi Timemark Sociolla atau kamera perangkat native (`capture="environment"`). Menyematkan logo brand dinamis dari `SETTINGS.app_name` (fallback `'sociolla'`), waktu digital besar + garis pemisah vertikal + hari & tanggal (WIB `Asia/Jakarta`), alamat geocoding lengkap otomatis (dengan fallback dinamis ke nama warehouse aktif jika offline/lokasi gagal), titik pantau, nama petugas, kotak transparan koordinat GPS, serta perisai dan kode foto anti-tamper 14-karakter. Foto dikompresi di sisi klien (maks. 1280px, kualitas 0.8, target < 350 KB) sebelum diunggah. | Member, Admin | Kompresi gambar dan pembubuhan watermark kanvas berjalan di browser sebelum diunggah ke Google Drive. Mendukung pemilih kamera perangkat OS jika dibutuhkan. | Wajib | Saat foto diambil, kanvas membakar stempel waktu Timemark (logo brand dinamis, jam, tanggal, alamat/fallback gudang, titik, petugas, koordinat, dan kode foto unik); pratinjau foto siap kirim tampil terkompresi < 350 KB. |
| **FR-009** | Simpan per Lokasi | Menyimpan angka suhu dan 1 foto dokumentasi untuk satu lokasi spesifik pada tanggal dan jadwal yang dipilih. | Member, Admin | Backend memvalidasi kelengkapan angka suhu & foto, mengunggah foto ke folder Drive Tahun/Bulan, lalu menyimpan baris transaksi ke `TRANSAKSI_SUHU`. | Wajib | Klik simpan pada 1 lokasi mengunggah foto ke folder bulan terkait di Drive dan mencatat 1 baris transaksi di Sheets. |
| **FR-010** | Simpan Semua (Batch) | Menyimpan seluruh lokasi yang sedang diisi sekaligus dalam satu periode jadwal. Pengiriman dari klien ke API dilakukan secara sekuensial satu per satu (1 request per lokasi secara otomatis di balik layar) untuk menjaga ukuran payload tetap ringan dan mengisolasi kegagalan. | Member, Admin | Memproses setiap lokasi yang terisi satu per satu dan mengembalikan status per lokasi (berhasil/gagal) agar lokasi yang gagal saja yang perlu diulang. | Wajib | Jika 2 lokasi berhasil dan 1 lokasi gagal unggah, UI menampilkan 2 sukses dan 1 gagal tanpa menggandakan data yang sudah sukses saat dicoba ulang. |
| **FR-011** | Pencegahan Timpa Data & Idempotensi | Setiap kombinasi `Tanggal + Lokasi + Jadwal` hanya boleh memiliki 1 transaksi aktif. Member dilarang menimpa data yang sudah ada. | Member, Admin | Jika kombinasi sudah ada dan pengirim adalah `MEMBER`, tolak dengan pesan sesuai standar bisnis. Gunakan kunci idempotensi saat *retry*. | Wajib | Saat Member mencoba menyimpan ulang lokasi `A04` jam `09.00` yang sudah terisi, muncul pesan penolakan standar dan data lama tidak berubah. |
| **FR-012** | Edit Transaksi oleh Admin | Admin dapat mengubah nilai suhu atau memperbarui foto pada transaksi yang sudah tersimpan setelah melakukan konfirmasi. | Admin | Wajib mencatat nilai sebelum (`before_value`), nilai sesudah (`after_value`), pelaku, waktu server, dan alasan di `AUDIT_LOGS`. | Wajib | Perubahan suhu oleh Admin memperbarui transaksi aktif dan menambahkan 1 baris riwayat lengkap di `AUDIT_LOGS`. |
| **FR-013** | Penyimpanan Hirarki Google Drive | Foto disimpan otomatis ke `Warehouse Temperature Report / [Kode — Nama WH] / YYYY / MM - NamaBulan /` dengan nama file `[YYYY-MM-DD]_[NamaLokasi]_[Jam].jpg`. | Sistem | Buat folder Tahun dan Bulan secara otomatis jika belum ada. Tambahkan sufiks unik jika nama file berpotensi bentrok. | Wajib | Transaksi tanggal `2026-10-17` di `A04` jam `09.00` pada gudang `CK01` menghasilkan file `2026-10-17_A04_09.00.jpg` di dalam folder `Warehouse Temperature Report/CK01 — Cikupa 1/2026/10 - Oktober/`. |
| **FR-014** | Notifikasi WhatsApp (Fonnte) | Mengirim pesan peringatan ke WhatsApp Group jika suhu melebihi batas suhu aktif saat transaksi disimpan. | Sistem, Admin | Kegagalan Fonnte tidak boleh menggagalkan penyimpanan transaksi suhu. Catat status (`SENT`/`FAILED`) dan pesan error. Sediakan fitur *retry* idempoten. | Wajib | Input suhu `35.5°C` (batas `30°C`) tetap tersimpan meski internet ke Fonnte terputus, berstatus `FAILED`, dan dapat dikirim ulang oleh Admin tanpa duplikat. |
| **FR-015** | Dashboard Operasional | Menampilkan ringkasan lokasi sudah/belum diperiksa, suhu tertinggi, jumlah transaksi melebihi batas, status notifikasi WA, dan transaksi terbaru. | Admin, Member | Data dihitung secara akurat berdasarkan master lokasi/jadwal aktif terhadap transaksi pada tanggal terkait. | Wajib | Dashboard menampilkan jumlah slot yang belum diperiksa secara tepat dan berkurang otomatis sesaat setelah petugas menyimpan data. |
| **FR-016** | Rekap Bulanan Matriks & Ekspor | Membentuk tabel matriks bulanan otomatis dari `TRANSAKSI_SUHU`, menandai Sabtu/Minggu dengan warna merah, membedakan data kosong dari `0°C`, serta menyediakan Print PDF, Export `.xlsx`, dan `.csv`. | Admin | Matriks dirender dinamis sesuai pilihan Bulan & Tahun tanpa membuat tab baru di Google Sheets. | Wajib | Memilih Oktober 2026 menampilkan tabel matriks sesuai format acuan, kolom akhir pekan berwarna merah, dan file `.xlsx`/`.csv`/PDF berhasil diunduh dengan rapi. |
| **FR-017** | Master Warehouse | Admin dapat menambah, melihat, mengubah, dan menonaktifkan warehouse (`CK01`, `CK02`, dll.). Kode warehouse wajib unik. Warehouse yang sudah memiliki riwayat transaksi dilarang dihapus permanen (`Soft-Delete`), hanya boleh diubah statusnya menjadi nonaktif. | Admin | Kode warehouse wajib unik. Validasi backend mencegah duplikasi kode atau penghapusan permanen baris sheet. | Wajib | Admin berhasil menambah CK01 dan CK02; penambahan kode yang sama ditolak dengan pesan error. |
| **FR-018** | Hak Akses & Default Warehouse User per Warehouse | Admin dapat menentukan warehouse yang boleh diakses setiap user pada sheet `USER_WAREHOUSE_ACCESS` serta menetapkan **Warehouse Default saat login** pada kolom `default_warehouse_id` di sheet `USERS`. Admin otomatis dapat mengakses semua warehouse aktif. Saat login, sistem otomatis mengaktifkan warehouse default user tersebut. Backend wajib memvalidasi hak akses pada setiap permintaan data/API. | Admin | Backend menolak akses (HTTP 403) jika user mengakses data warehouse di luar izinnya, meskipun parameter diubah manual. | Wajib | Member yang memiliki warehouse default CK01 otomatis masuk ke CK01 saat login; Member tanpa izin CK02 tidak dapat melihat lokasi atau transaksi CK02. |
| **FR-019** | Pindah Warehouse Eksklusif pada Menu Profil & Konteks Sesi | Perpindahan warehouse aktif dilakukan secara eksklusif melalui menu profil pengguna ("Pindah Warehouse"), tidak diletakkan sebagai tombol switcher di navbar header. Saat login pertama kali, sistem otomatis mengaktifkan warehouse default yang telah ditentukan Admin, namun pengguna tetap dapat berpindah ke warehouse aktif lain yang diizinkan untuknya kapan saja melalui menu profil. Sistem memperbarui konteks warehouse aktif di sesi dan memuat ulang lokasi, jadwal, batas suhu, transaksi, dashboard, dan laporan yang sesuai tanpa mengubah data transaksi lama. | Member, Admin | Pilihan hanya menampilkan warehouse aktif yang diizinkan untuk user tersebut. Berpindah warehouse tidak mengubah data transaksi lama. | Wajib | User yang memiliki izin CK01 dan CK02 dapat berpindah warehouse secara mulus melalui menu profil; form input langsung memuat titik milik warehouse terpilih. |
| **FR-020** | Dashboard Gabungan & Detail | Admin dapat melihat dashboard gabungan seluruh warehouse aktif (ringkasan slot diperiksa, overlimit, WA failed) atau memilih warehouse tertentu untuk melihat detail matriks. Member hanya melihat warehouse aktifnya. | Admin, Member | Data konsolidasian dihitung secara akurat dari seluruh transaksi warehouse aktif. Slot kosong tetap berstatus belum diperiksa (bukan nol). | Wajib | Dashboard Admin menampilkan metrik total dari kedua gudang dan dapat difilter per gudang. |
| **FR-021** | Konfigurasi per Warehouse | Batas maksimum suhu, master lokasi, jadwal shift, dan pembukaan/penguncian tanggal dapat dikonfigurasi berbeda untuk masing-masing warehouse. | Admin | Backend selalu menggunakan batas suhu warehouse bersangkutan saat mengevaluasi status transaksi dan pemicu WA. | Wajib | Batas suhu CK01 (30°C) dan CK02 (32°C) dievaluasi secara independen dan akurat. |
| **FR-022** | Pemisahan Transaksi & Drive | Setiap transaksi suhu menyimpan identitas warehouse (`warehouse_id`, `warehouse_code_snapshot`, `warehouse_name_snapshot`). Keunikan transaksi dihitung per warehouse. Foto disimpan di Google Drive dengan struktur: `Warehouse Temperature Report / [Kode — Nama WH] / YYYY / MM - NamaBulan /`. | Member, Admin | Keunikan dihitung dari `warehouse_id + tanggal + location_id + period_id`. File foto terunggah ke sub-folder warehouse yang tepat. | Wajib | Lokasi bernama sama `Inbound` di CK01 dan CK02 dapat diisi di jam yang sama tanpa bentrok, dan fotonya terpisah di folder masing-masing di Drive. |
| **FR-023** | Notifikasi WA Berlabel Warehouse | Kedua warehouse mengirim notifikasi peringatan suhu ke grup WhatsApp bersama dengan mencantumkan nama dan kode warehouse pada pesan. | Sistem, Admin | Pesan menyertakan `Warehouse: [Kode] — [Nama]`, lokasi, jam, suhu aktual, dan batas yang berlaku. Kegagalan WA tidak menggagalkan transaksi. | Wajib | Peringatan suhu dari CK02 terkirim ke grup WA dengan mencantumkan label "CK02 — Cikupa Annex". |
| **FR-024** | Audit Log Multi-Warehouse | Setiap aktivitas penting (tambah/edit warehouse, ubah izin akses, ganti batas suhu, koreksi transaksi) mencatat konteks warehouse terkait di `AUDIT_LOGS`. | Sistem, Admin | Kolom `warehouse_id` dicatat untuk melacak audit per warehouse. | Wajib | Perubahan batas suhu pada CK01 tercatat di Audit Log dengan referensi warehouse CK01. |

---

## 7. Business Rules

1. **BR-01 (Kewajiban Login & Identitas Otomatis):** Seluruh pengguna wajib login. Nama petugas (`petugas_name`) diambil secara otomatis dari profil akun yang sedang login pada sesi tersebut, tidak pernah diketik atau dipilih manual saat menginput suhu.
2. **BR-02 (Keunikan Transaksi Multi-Warehouse):** Kombinasi `ID Warehouse` + `Tanggal (YYYY-MM-DD)` + `ID Lokasi` + `Jadwal Jam` bersifat unik untuk satu transaksi aktif. Lokasi dengan nama yang sama di warehouse yang berbeda (misalnya `Inbound` di Cikupa 1 dan `Inbound` di Cikupa Annex) adalah dua entitas yang terpisah dan independen.
3. **BR-03 (Larangan Timpa Data bagi Member):** Jika suatu lokasi dan jam pada tanggal tersebut sudah memiliki transaksi aktif, Member dilarang mengubah atau menimpa data. Sistem wajib mengembalikan pesan persis berikut:

   > *"Data suhu untuk lokasi [X] pada jam [Y] sudah terisi. Silakan hubungi Admin jika diperlukan perubahan data."*

4. **BR-04 (Pembatasan Tanggal Member):** Secara default, Member hanya diizinkan menginput data untuk tanggal hari ini (mengikuti zona waktu operasional warehouse). Input untuk tanggal masa lalu atau masa depan maupun hari Minggu/hari libur yang dikunci hanya dapat dilakukan jika Admin telah membuka kunci tanggal tersebut di pengaturan.
5. **BR-05 (Kewajiban Bukti Foto Kamera & Stempel Watermark):** Setiap transaksi suhu aktif wajib menyertakan 1 foto dokumentasi fisik termometer yang diambil melalui kamera browser dengan stempel watermark standar Timemark Sociolla atau aplikasi kamera perangkat (`capture="environment"`). Stempel foto wajib memuat logo brand dinamis (`SETTINGS.app_name` atau default Sociolla), informasi waktu resmi (WIB, `Asia/Jakarta`), alamat geocoding lokasi riil (atau nama gudang aktif jika offline), nama titik pantau, nama petugas yang login, koordinat GPS, dan kode verifikasi foto anti-tamper.
6. **BR-06 (Kejujuran Data GPS & Waktu Audit):** Koordinat GPS hanya dicantumkan pada *watermark* foto dan metadata transaksi apabila perangkat berhasil memperoleh koordinat yang valid dan pengguna memberikan izin lokasi. Sistem dilarang membuat koordinat palsu/default. Waktu penerimaan resmi di server (`server_received_at`) wajib selalu dicatat sebagai acuan audit utama.
7. **BR-07 (Aturan Pemicu Peringatan Suhu):** Suatu transaksi berstatus `MELEBIHI_BATAS` apabila nilai `suhu > batas_suhu_aktif` (tepat sama dengan batas, misalnya `30.0°C` saat batas `30°C`, berstatus `NORMAL`).
8. **BR-08 (Perlindungan Data Historis / Non-Destructive Master):** Warehouse, lokasi, maupun jadwal pengecekan yang sudah pernah tercatat di `TRANSAKSI_SUHU` dilarang dihapus dari database. Penonaktifan (`is_active = FALSE`) hanya menyembunyikan item tersebut dari form input baru, namun tetap menampilkannya pada laporan historis di bulan-bulan tempat transaksi tersebut pernah terjadi.
9. **BR-09 (Representasi Data Kosong pada Laporan):** Slot lokasi dan jadwal yang belum diinput suhunya wajib ditampilkan sebagai sel kosong atau berpenanda khusus *"Belum Diinput"* dan **dilarang keras** dikonversi menjadi angka `0` atau `0,0°C` agar tidak merusak perhitungan maupun interpretasi suhu dingin.
10. **BR-10 (Validasi Hak Akses Warehouse):** Backend wajib memvalidasi bahwa pengguna memiliki hak akses aktif ke `warehouse_id` yang bersangkutan pada setiap permintaan pembacaan atau penulisan data/transaksi. Pilihan di frontend hanya pelengkap antarmuka dan bukan pengamanan.
11. **BR-11 (Isolasi Konfigurasi & Histori Warehouse):** Konfigurasi batas suhu, jadwal, hari libur, serta penonaktifan suatu warehouse tidak boleh memengaruhi atau merusak data operasional dan histori warehouse lainnya.

---

## 8. User Flow dan Use Cases

### 8.1 Alur Login & Penentuan Hak Akses

1. Pengguna membuka URL aplikasi web di *browser* ponsel atau desktop.
2. Sistem memeriksa keberadaan sesi login yang valid (HttpOnly Cookie JWT dengan masa berlaku 12 jam).
3. Jika belum login, pengguna diarahkan ke halaman Login dan memasukkan `username` serta `password`.
4. Backend Vercel memvalidasi kredensial ke sheet `USERS`:
   * Jika valid dan `is_active == TRUE`, backend menerbitkan token sesi bertanda tangan digital (HttpOnly Cookie JWT) dengan masa berlaku 12 jam (sesuai durasi 1 shift kerja) yang memuat `user_id`, `username`, `full_name`, dan `role`, lalu mencatat ke `AUDIT_LOGS` (jika relevan untuk audit).
   * Pengguna diarahkan ke halaman utama sesuai perannya (`MEMBER` ke Form Input & Dashboard Ringkas; `ADMIN` ke Dashboard Penuh & Menu Manajemen).
5. **Kewajiban Ganti Password Awal Admin:**
   * Jika akun yang login adalah `admin` dan terdeteksi masih memakai password bawaan `admin123`, backend menyematkan status sesi `must_change_password: true` pada token JWT.
   * Selama status ini aktif, backend menegakkan penolakan HTTP `403 Forbidden` pada seluruh endpoint selain `POST /api/auth/change-password` dan `POST /api/auth/logout`.
   * Di sisi antarmuka, seluruh menu diblokir dan Admin langsung diarahkan ke dialog "Wajib Ganti Password Awal" (minimal 8 karakter, bukan `admin123`). Setelah password berhasil diperbarui di database dan dicatat di `AUDIT_LOGS`, status gembok dicabut.
6. **Perlindungan Sesi Ganda (Dual-Layer Session Protection):**
   * Selain batas *hard expiry* JWT 12 jam (1 shift), sistem mematuhi konfigurasi `idle_timeout_minutes` pada sheet `SETTINGS`.
   * Jika diaktifkan (`> 0`), aplikasi memonitor interaksi pengguna (sentuhan layar ponsel, pergerakan mouse, klik, ketikan tombol).
   * 30 detik sebelum batas *idle* tercapai, antarmuka memunculkan dialog peringatan hitung mundur (*countdown modal*): *"Sesi Anda akan berakhir dalam 30 detik karena tidak ada aktivitas."* Pengguna dapat menekan tombol **"Tetap Masuk"** untuk me-reset timer atau **"Logout Sekarang"**.
   * Jika batas waktu habis tanpa ada aktivitas, sesi dibersihkan dan pengguna dialihkan ke `/login?reason=idle_timeout` disertai pesan penjelas. Jika diset `0`, auto-logout saat idle dinonaktifkan dan hanya mengandalkan batas 12 jam.

### 8.2 Alur Input Suhu & Kamera oleh Member

1. Member membuka halaman **Input Suhu**.
2. Tanggal otomatis terisi **Hari Ini** dan terkunci. Sistem memeriksa apakah hari ini adalah hari Minggu/libur yang sedang dikunci:
   * Jika terkunci, form menampilkan informasi bahwa akses input hari ini ditutup dan hanya dapat dibuka oleh Admin.
3. Member memilih **Jadwal Pengecekan** aktif (contoh: `09.00`, `13.00`, atau `17.00`).
4. Sistem memuat daftar **Lokasi Aktif** (`Inbound`, `A04`, `D05`) beserta statusnya pada tanggal & jam tersebut (pada hari berjalan, Member dapat melihat status seluruh lokasi agar mengetahui lokasi mana yang sudah/belum diisi tim, serta dapat melihat riwayat penginputan miliknya sendiri):
   * Lokasi yang **sudah terisi** menampilkan angka suhu tersimpan, nama penginput, pratinjau foto, dan berstatus **Terkunci** bagi Member.
   * Lokasi yang **belum terisi** menampilkan kolom input angka suhu (°C) dan tombol **"Ambil Foto Kamera"**.
5. Member mengetik angka suhu pada lokasi (misal `A04`: `35.5`) dan menekan **"Ambil Foto Kamera"**:
   * Aplikasi meminta izin kamera belakang (`environment`) dan GPS (`geolocation`).
   * Pengguna membidik termometer dan menekan tombol **Jepret**.
   * Aplikasi menggambar foto ke kanvas, membubuhkan *watermark* (`Tanggal & Jam`, `Lokasi: A04`, `Petugas: [Nama Login]`, serta `GPS` jika tersedia), lalu melakukan kompresi gambar JPEG.
6. Member memilih:
   * **Simpan per Lokasi:** Langsung mengunggah foto dan menyimpan transaksi untuk 1 lokasi tersebut.
   * **Simpan Semua:** Mengirimkan seluruh lokasi yang sudah lengkap (memiliki angka suhu + foto) secara sekuensial satu per satu di balik layar dan menampilkan hasil akhir per lokasi.

### 8.3 Alur Perubahan Data (Edit) oleh Admin

1. Admin memilih tanggal dan jadwal pengecekan (atau memilih transaksi dari halaman Rekap/Daftar Transaksi).
2. Pada lokasi yang sudah terisi, Admin menekan tombol **"Ubah Data"**.
3. Sistem menampilkan dialog konfirmasi yang menampilkan nilai suhu saat ini, kolom nilai suhu baru, opsi ganti foto kamera, serta kolom **Alasan Perubahan yang WAJIB diisi (mandatory, minimal alasan singkat seperti "Koreksi salah ketik")**. Tombol simpan dinonaktifkan jika kolom alasan masih kosong.
4. Setelah Admin mengonfirmasi, backend memperbarui baris di `TRANSAKSI_SUHU`, mengevaluasi ulang apakah perubahan suhu tersebut memicu peringatan WhatsApp baru, dan menyimpan rekaman sebelum/sesudah ke `AUDIT_LOGS`.

---

## 9. UI/UX Requirements

### 9.1 Prinsip Desain Antarmuka

* **Sederhana & Kontras Tinggi:** Dirancang agar mudah dibaca di lingkungan pencahayaan gudang (baik area terang maupun area dalam lorong rak), dengan ukuran tombol minimal `44x44 px` untuk kenyamanan layar sentuh ponsel.
* **Responsif Penuh:**
  * **Tampilan Ponsel (Mobile View):** Fokus pada kecepatan input satu tangan, kartu lokasi disusun vertikal dari atas ke bawah, dan jendela kamera tampil proporsional di layar.
  * **Tampilan Desktop (Admin/Supervisor View):** Mendukung tabel lebar untuk matriks bulanan (`1` s/d `31`), panel filter laporan, dan pengelolaan master data.

### 9.2 Indikator Visual Status Lokasi pada Form Input

Setiap kartu lokasi wajib menampilkan badge status yang berbeda secara visual:

1. ⚪ **Belum Diisi:** Border abu-abu netral, input suhu dan tombol kamera aktif.
2. 🟢 **Tersimpan (Normal):** Border hijau, menampilkan suhu tersimpan (`≤ Batas Suhu`), jam simpan, nama petugas, dan tautan foto.
3. 🔴 **Tersimpan (Melebihi Batas):** Border merah terang dengan ikon peringatan `⚠️`, menampilkan suhu yang melewati batas aktif (`> Batas Suhu`) beserta status pengiriman notifikasi WhatsApp.
4. 🟠 **Gagal Unggah / Gagal Simpan:** Border oranye/merah dengan pesan kesalahan spesifik dan tombol **"Coba Simpan Lagi"** (*Retry*) tanpa menghapus angka suhu maupun foto yang sudah dijepret di layar.

### 9.3 Pencegahan Klik Ganda & Umpan Balik Proses

* Saat tombol **Simpan Lokasi** atau **Simpan Semua** ditekan, tombol langsung dinonaktifkan (*disabled*) dan menampilkan indikator proses spesifik: `"Mengompres Foto..."` ➔ `"Mengunggah ke Drive..."` ➔ `"Menyimpan Transaksi..."`.
* Pada fitur **Simpan Semua**, antarmuka wajib menampilkan daftar status per lokasi secara individual (contoh: `Inbound: ✅ Tersimpan`, `A04: ✅ Tersimpan`, `D05: ❌ Gagal unggah foto - Klik untuk coba lagi`).

---

## 10. Database Schema dan Data Mapping (Google Sheets)

Seluruh data disimpan di dalam **1 file Google Spreadsheet** yang terdiri dari **8 Sheet (Tab)**. Tidak ada penambahan sheet baru setiap pergantian bulan.

### 10.1 Sheet `USERS`

| Kolom | Nama Atribut | Tipe Data | Aturan / Keterangan |
| --- | --- | --- | --- |
| **A** | `user_id` | String | Primary Key unik (contoh: `USR-001`). |
| **B** | `username` | String | Unik, *case-insensitive*, digunakan saat login (awal: `admin`). |
| **C** | `password_hash` | String | Hash Bcrypt (minimal 10 *salt rounds*). Dilarang menyimpan teks biasa. |
| **D** | `full_name` | String | Nama lengkap petugas yang otomatis dicatat pada transaksi & watermark. |
| **E** | `role` | Enum String | `ADMIN` atau `MEMBER`. |
| **F** | `is_active` | Boolean String | `TRUE` (aktif) atau `FALSE` (dinonaktifkan). |
| **G** | `created_at` | ISO-8601 | Waktu pembuatan akun (waktu server UTC/WIB). |
| **H** | `updated_at` | ISO-8601 | Waktu pembaruan terakhir. |
| **I** | `updated_by` | String | Username Admin yang membuat/mengubah. |
| **J** | `default_warehouse_id` | String | ID warehouse default pilihan Admin yang otomatis aktif saat pengguna login (referensi ke `MASTER_WAREHOUSE.warehouse_id`). |

### 10.2 Sheet `MASTER_WAREHOUSE`

| Kolom | Nama Atribut | Tipe Data | Aturan / Keterangan |
| --- | --- | --- | --- |
| **A** | `warehouse_id` | String | Primary Key unik (contoh: `WH-001`, `WH-002`). |
| **B** | `warehouse_code` | String | Unik, kode singkat warehouse (contoh: `CK01`, `CK02`). |
| **C** | `warehouse_name` | String | Nama warehouse (contoh: `Cikupa 1`, `Cikupa Annex`). |
| **D** | `is_active` | Boolean String | `TRUE` (aktif) atau `FALSE` (nonaktif / *soft-deleted*). |
| **E** | `created_at` | ISO-8601 | Waktu pembuatan data warehouse. |
| **F** | `updated_at` | ISO-8601 | Waktu pembaruan terakhir. |
| **G** | `updated_by` | String | Username Admin yang membuat/mengubah. |

### 10.3 Sheet `USER_WAREHOUSE_ACCESS`

| Kolom | Nama Atribut | Tipe Data | Aturan / Keterangan |
| --- | --- | --- | --- |
| **A** | `access_id` | String | Primary Key unik relasi (contoh: `UWA-001`, `UWA-002`). |
| **B** | `user_id` | String | Referensi ke `USERS.user_id`. |
| **C** | `warehouse_id` | String | Referensi ke `MASTER_WAREHOUSE.warehouse_id`. |
| **D** | `is_active` | Boolean String | `TRUE` (akses aktif) atau `FALSE` (akses dicabut). |
| **E** | `created_at` | ISO-8601 | Waktu hak akses diberikan. |
| **F** | `updated_at` | ISO-8601 | Waktu pembaruan status akses. |
| **G** | `updated_by` | String | Username Admin yang menetapkan akses. |

### 10.4 Sheet `MASTER_LOKASI`

| Kolom | Nama Atribut | Tipe Data | Aturan / Keterangan |
| --- | --- | --- | --- |
| **A** | `location_id` | String | Primary Key unik (contoh: `LOC-001`, `LOC-002`, `LOC-003`). |
| **B** | `warehouse_id` | String | Referensi ke `MASTER_WAREHOUSE.warehouse_id` (contoh: `WH-001`, `WH-002`). |
| **C** | `location_name` | String | Nama lokasi (contoh: `Inbound`, `A04`, `D05`). |
| **D** | `sort_order` | Integer | Urutan tampil pada form input dan baris tabel laporan (`1`, `2`, `3`). |
| **E** | `is_active` | Boolean String | `TRUE` (aktif di form input) atau `FALSE` (nonaktif / *soft-deleted*). |
| **F** | `created_at` | ISO-8601 | Waktu pembuatan lokasi. |
| **G** | `updated_at` | ISO-8601 | Waktu perubahan terakhir. |
| **H** | `updated_by` | String | Username Admin pengubah terakhir. |

### 10.5 Sheet `MASTER_PERIODE`

| Kolom | Nama Atribut | Tipe Data | Aturan / Keterangan |
| --- | --- | --- | --- |
| **A** | `period_id` | String | Primary Key unik (contoh: `PRD-001`, `PRD-002`, `PRD-003`). |
| **B** | `warehouse_id` | String | Referensi ke `MASTER_WAREHOUSE.warehouse_id` (contoh: `WH-001`, `WH-002`). |
| **C** | `period_label` | String | Jam jadwal pengecekan (awal: `09.00`, `13.00`, `17.00`). |
| **D** | `sort_order` | Integer | Urutan tampil jadwal (`1`, `2`, `3`). |
| **E** | `is_active` | Boolean String | `TRUE` atau `FALSE`. |
| **F** | `created_at` | ISO-8601 | Waktu pembuatan jadwal. |
| **G** | `updated_at` | ISO-8601 | Waktu perubahan terakhir. |
| **H** | `updated_by` | String | Username Admin pengubah terakhir. |

### 10.6 Sheet `SETTINGS`

*Catatan Keamanan: Sheet ini hanya menyimpan konfigurasi operasional non-rahasia. Token Fonnte dan kredensial Google dilarang disimpan di sini.*

| Kolom | Nama Atribut | Tipe Data | Aturan / Keterangan |
| --- | --- | --- | --- |
| **A** | `warehouse_id` | String | `GLOBAL` (berlaku seluruh sistem) atau ID spesifik warehouse (contoh: `WH-001`, `WH-002`). |
| **B** | `setting_key` | String | Kunci pengaturan (`app_name`, `app_icon`, `max_temp_limit`, `lock_sunday`, `holiday_dates`, `unlocked_dates`, `wa_notification_enabled`, `idle_timeout_minutes`, `signoff_*`). |
| **C** | `setting_value` | String | Nilai konfigurasi (teks, angka, boolean string, atau JSON array). |
| **D** | `description` | String | Keterangan fungsi pengaturan. |
| **E** | `updated_by` | String | Username Admin pengubah. |
| **F** | `updated_at` | ISO-8601 | Waktu perubahan terakhir. |

### 10.7 Sheet `TRANSAKSI_SUHU`

| Kolom | Nama Atribut | Tipe Data | Aturan / Keterangan |
| --- | --- | --- | --- |
| **A** | `transaction_id` | String | Kunci komposit unik: `YYYY-MM-DD_warehouseId_locationId_periodLabel` (contoh: `2026-10-18_WH-001_LOC-002_09.00`). |
| **B** | `idempotency_key` | String | UUID unik per aksi klik simpan untuk mencegah duplikasi saat *retry*. |
| **C** | `warehouse_id` | String | Referensi ke `MASTER_WAREHOUSE.warehouse_id` (contoh: `WH-001`, `WH-002`). |
| **D** | `warehouse_code_snapshot` | String | Snapshot kode warehouse saat transaksi dicatat (`CK01`, `CK02`). |
| **E** | `warehouse_name_snapshot` | String | Snapshot nama warehouse saat transaksi dicatat (`Cikupa 1`, `Cikupa Annex`). |
| **F** | `tanggal` | String | Tanggal transaksi teks berformat `YYYY-MM-DD`. |
| **G** | `tahun_bulan` | String | Indeks filter cepat rekap bulanan: `YYYY-MM` (contoh: `2026-10`). |
| **H** | `location_id` | String | Referensi ke `MASTER_LOKASI.location_id`. |
| **I** | `location_name_snapshot` | String | Nama lokasi saat transaksi disimpan (`Inbound`, `A04`, `D05`). |
| **J** | `period_id` | String | Referensi ke `MASTER_PERIODE.period_id`. |
| **K** | `period_label_snapshot` | String | Jam pengecekan saat transaksi disimpan (`09.00`, `13.00`, `17.00`). |
| **L** | `suhu` | Number (Float) | Nilai suhu dalam °C numerik murni bertitik (contoh: `35.5`), ditulis via Google Sheets API dengan `valueInputOption=RAW`. |
| **M** | `max_limit_snapshot` | Number (Float) | Nilai batas suhu aktif warehouse terkait pada saat transaksi terjadi (contoh: `30`). |
| **N** | `status_suhu` | Enum String | `NORMAL` (jika `suhu <= batas`) atau `MELEBIHI_BATAS` (jika `suhu > batas`). |
| **O** | `user_id` | String | ID pengguna yang menginput. |
| **P** | `petugas_name` | String | Nama lengkap petugas dari akun login. |
| **Q** | `client_captured_at` | String | Waktu pada perangkat saat foto dijepret. |
| **R** | `server_received_at` | ISO-8601 | Waktu resmi server Vercel menerima transaksi (acuan audit). |
| **S** | `gps_coordinates` | String | Koordinat `lat, lng (±accuracy m)` jika tersedia, atau `TIDAK_TERSEDIA`. |
| **T** | `drive_file_id` | String | ID File bukti foto di Google Drive. |
| **U** | `drive_file_name` | String | Nama file foto di Google Drive (`2026-10-18_Inbound_09.00.jpg`). |
| **V** | `drive_view_url` | String | Tautan untuk membuka/melihat foto di Google Drive. |
| **W** | `wa_notif_id` | String | ID unik notifikasi (`WA-[transaction_id]`) untuk cegah kirim ganda. |
| **X** | `wa_notif_status` | Enum String | `NOT_REQUIRED`, `PENDING`, `SENT`, atau `FAILED`. |
| **Y** | `wa_error_message` | String | Detail pesan gagal dari Fonnte (kosong jika sukses). |
| **Z** | `wa_sent_at` | ISO-8601 | Waktu notifikasi berhasil terkirim. |
| **AA** | `updated_by` | String | Username Admin jika transaksi pernah diubah. |
| **AB** | `updated_at` | ISO-8601 | Waktu perubahan transaksi terakhir. |

### 10.8 Sheet `AUDIT_LOGS`

| Kolom | Nama Atribut | Tipe Data | Aturan / Keterangan |
| --- | --- | --- | --- |
| **A** | `log_id` | String | ID unik log (`LOG-Timestamp-Random`). |
| **B** | `server_timestamp` | ISO-8601 | Waktu server saat aktivitas terjadi. |
| **C** | `actor_user_id` | String | ID pengguna pelaku aktivitas. |
| **D** | `actor_username` | String | Username pelaku. |
| **E** | `actor_role` | String | Role pelaku (`ADMIN` / `MEMBER`). |
| **F** | `action_category` | Enum String | `AUTH_LOGIN`, `TX_CREATE`, `TX_UPDATE`, `DATE_UNLOCK`, `USER_MGMT`, `MASTER_MGMT`, `SETTING_CHANGE`, `WA_RETRY`, `WH_SWITCH`, `WH_MGMT`, `WH_ACCESS_MGMT`. |
| **G** | `warehouse_id` | String | Konteks warehouse terkait (contoh: `WH-001`, `WH-002`, atau `GLOBAL`). |
| **H** | `target_reference` | String | ID objek yang dikenai aksi (misal `transaction_id`, `warehouse_id`, atau `user_id`). |
| **I** | `before_value` | JSON String | Ringkasan data sebelum diubah. |
| **J** | `after_value` | JSON String | Ringkasan data sesudah diubah. |
| **K** | `notes_or_reason` | String | Keterangan tambahan atau alasan perubahan data. |

---

## 11. Google Drive Folder Structure

### 11.1 Hierarki Folder Otomatis

Seluruh foto bukti pengecekan suhu disimpan di bawah satu folder induk (*Root Folder*) yang telah dibagikan (*shared*) khusus kepada email Google Service Account dengan izin **Editor**. Struktur folder dipisahkan berdasarkan identitas warehouse, tahun, dan bulan:

```text
Warehouse Temperature Report/                     <-- (Root Folder ID disimpan di Env Vercel)
├── CK01 — Cikupa 1/                             <-- Folder per Warehouse (Format: [Kode] — [Nama])
│   ├── 2026/                                     <-- Dibuat otomatis berdasarkan Tahun Transaksi
│   │   ├── 10 - Oktober/                         <-- Dibuat otomatis berdasarkan Bulan Transaksi
│   │   │   ├── 2026-10-18_Inbound_09.00.jpg
│   │   │   └── 2026-10-18_A04_13.00.jpg
│   │   └── 11 - November/
│   └── 2027/
└── CK02 — Cikupa Annex/                         <-- Folder Warehouse Kedua
    └── 2026/
        └── 10 - Oktober/
            └── 2026-10-18_Inbound_09.00.jpg
```

### 11.2 Aturan Penamaan Folder & File

1. **Penamaan Folder Warehouse:** Menggunakan format `[warehouse_code] — [warehouse_name]` (contoh: `CK01 — Cikupa 1`, `CK02 — Cikupa Annex`). Dibuat secara otomatis di bawah Root Folder jika belum ada.
2. **Penamaan Folder Bulan:** Menggunakan format 2 digit bulan diikuti tanda hubung dan nama bulan dalam Bahasa Indonesia:
   * `01 - Januari`, `02 - Februari`, `03 - Maret`, `04 - April`, `05 - Mei`, `06 - Juni`, `07 - Juli`, `08 - Agustus`, `09 - September`, `10 - Oktober`, `11 - November`, `12 - Desember`.
3. **Penentuan Lokasi Simpan:** Mengacu pada **Warehouse Aktif** dan **Tanggal Transaksi (`tanggal`)**, bukan tanggal hari server apabila Admin sedang menginput data tanggal bulan sebelumnya yang terlewat.
4. **Format Nama File Standar:** `[YYYY-MM-DD]_[NamaLokasiBersih]_[Jam].jpg`
   * Contoh: `2026-10-18_Inbound_09.00.jpg`
5. **Penanganan Benturan Nama File & Revisi Foto (Collision & Revision Handling):**
   * Jika pengguna melakukan *retry* dengan `idempotency_key` yang sama karena penyimpanan ke Sheets sempat tertunda padahal file sudah terunggah ke Drive, backend menggunakan kembali file yang sudah ada tanpa membuat file duplikat.
   * **Revisi Foto via Google Drive Manage Versions (Kelola Versi):** Jika Admin mengganti foto bukti pada transaksi yang diedit, sistem **tidak membuat file baru** bertanda `_REVISED.jpg` agar folder tidak dipenuhi file duplikat. Sistem memanfaatkan fitur native Google Drive **Manage Versions** (`PATCH ?uploadType=media&keepRevisionForever=true`). File di folder Google Drive tetap berjumlah satu dengan nama dan ID yang sama, tautan tidak berubah, sementara foto lama tetap tersimpan abadi di riwayat versi Google Drive (*Version History*) untuk kebutuhan audit fisik.
6. **Kebijakan Izin Akses Foto:**
   * Folder dan file foto **tidak dibuka bebas ke publik secara global**. Akses penayangan foto disajikan melalui **Halaman Peninjau Foto di Aplikasi Vercel** (`/photo/[fileId]`, terlindungi otentikasi login aplikasi) serta tautan langsung Google Drive bagi akun organisasi yang memiliki izin akses folder.

---

## 12. API Specification (Vercel Backend Endpoints)

Seluruh endpoint berada di bawah `/api/*` pada server Vercel. Endpoint selain `/api/auth/login` wajib memverifikasi token sesi pengguna di backend.

| Method & Endpoint | Akses Role | Deskripsi Fungsi | Request Payload Utama | Response & Kode Status |
| --- | --- | --- | --- | --- |
| `POST /api/init` | Setup Awal (via `SETUP_KEY`) | Membuat 8 sheet jika belum ada & *seeding* data awal (`admin`, warehouse `CK01` & `CK02`, hak akses, lokasi, jadwal, settings). Dilindungi header `x-setup-key`. Gembok permanen jika database sudah terisi. | Header: `x-setup-key: [SETUP_KEY]` | `200 OK`: Inisialisasi berhasil. `400 Bad Request`: Database sudah diinisialisasi. `403 Forbidden`: Setup key salah atau belum diset. `500`: Gagal koneksi Google API. |
| `POST /api/auth/login` | Publik | Memvalidasi username & password, menerbitkan HttpOnly session cookie (masa berlaku 12 jam, klaim `must_change_password: true` jika masih pakai default, memprioritaskan `default_warehouse_id` pengguna sebagai `active_warehouse_id`, dan daftar hak akses warehouse). | `{ username, password }` | `200 OK`: Profil user, role, & warehouse aktif (sesuai default). `401`: Kredensial salah / akun nonaktif. |
| `POST /api/auth/change-password` | `ADMIN`, `MEMBER` | Mengganti password akun sendiri (termasuk pemenuhan wajib ganti password awal admin). | `{ old_password, new_password }` | `200 OK`: Password diperbarui, status gembok dicabut, tercatat di `AUDIT_LOGS`. `400`: Password baru < 8 karakter atau sama dengan `admin123`. |
| `POST /api/auth/logout` | `ADMIN`, `MEMBER` | Menghapus sesi login aktif. | Kosong | `200 OK`: Sesi dihapus. |
| `GET /api/auth/me` | `ADMIN`, `MEMBER` | Mengambil profil akun yang sedang login, warehouse aktif saat ini, dan daftar warehouse yang diizinkan. | Cookie Sesi | `200 OK`: `{ user_id, username, full_name, role, active_warehouse_id, default_warehouse_id, allowed_warehouses }`. |
| `GET /api/warehouses` | `ADMIN`, `MEMBER` | Mengambil daftar warehouse aktif yang boleh diakses pengguna. | Cookie Sesi | `200 OK`: Array objek warehouse aktif yang diizinkan. |
| `POST /api/warehouses/switch` | `ADMIN`, `MEMBER` | Berpindah warehouse aktif pada sesi pengguna via menu profil (memvalidasi izin akses di backend). | `{ warehouse_id }` | `200 OK`: Context sesi diperbarui ke warehouse yang dipilih. `403`: Tidak memiliki hak akses ke warehouse tersebut. |
| `GET/POST/PUT /api/admin/warehouses` | `ADMIN` | CRUD data master warehouse (menambah, mengubah nama/kode, menonaktifkan warehouse tanpa hapus data fisik). | Data warehouse (`warehouse_code`, `warehouse_name`, `is_active`) | `200/201`: Warehouse berhasil disimpan/diperbarui + tercatat di `AUDIT_LOGS`. `409`: Kode warehouse sudah ada. |
| `GET/POST/PUT /api/admin/warehouse-access` | `ADMIN` | Mengelola pemetaan hak akses user ke warehouse (`USER_WAREHOUSE_ACCESS`) dan menetapkan `default_warehouse_id` di sheet `USERS`. | `{ user_id, warehouse_ids, default_warehouse_id }` | `200/201`: Hak akses & default warehouse berhasil diperbarui + tercatat di `AUDIT_LOGS`. |
| `GET /api/form-context` | `ADMIN`, `MEMBER` | Mengambil lokasi aktif, jadwal aktif, batas suhu, status kunci tanggal, & transaksi pada tanggal dan warehouse terkait (backend memvalidasi izin akses warehouse). | Query: `?tanggal=YYYY-MM-DD&warehouse_id=WH-001` | `200 OK`: Master aktif, aturan kunci, & daftar transaksi pada warehouse tersebut. `403`: Akses warehouse ditolak. |
| `POST /api/transactions` | `ADMIN`, `MEMBER` | Menyimpan 1 transaksi lokasi (pada mode Simpan Semua, dipanggil sekuensial 1 per 1 oleh klien), unggah foto ke Drive (folder warehouse terkait), simpan ke Sheets, dan picu Fonnte jika melebihi batas. | `{ idempotency_key, warehouse_id, tanggal, location_id, period_id, suhu, photo_base64, client_captured_at, gps_coordinates }` | `201 Created`: Data transaksi & status WA. `403 Forbidden`: Akses warehouse ditolak / tanggal terkunci. `409 Conflict`: Data sudah terisi (pesan standar BR-03). |
| `PUT /api/transactions/[id]` | `ADMIN` | Mengubah transaksi yang sudah ada (suhu dan/atau foto) dengan konfirmasi, alasan wajib diisi, dan mencatat ke `AUDIT_LOGS`. | `{ suhu, photo_base64?, reason }` (*`reason` wajib diisi*) | `200 OK`: Transaksi diperbarui & Audit Log tercatat. `400`: Alasan perubahan kosong. |
| `POST /api/notifications/retry` | `ADMIN` | Mencoba mengirim ulang notifikasi WhatsApp yang berstatus `FAILED` atau `PENDING`. | `{ transaction_id }` | `200 OK`: Status pengiriman terbaru (`SENT` / `FAILED`). |
| `POST /api/notifications/batch-alert` | `ADMIN`, `MEMBER` | Mengirim 1 pesan WhatsApp Rekap Gabungan untuk seluruh lokasi yang melebihi batas setelah eksekusi Simpan Semua (FR-010, Bagian 13.3) selesai dijalankan. | `{ warehouse_id, tanggal, period_id, transaction_ids }` | `200 OK`: `{ success: true, count, notifId, status }`. `400`: Data tidak valid. |
| `GET /api/reverse-geocode` | `ADMIN`, `MEMBER` | Mengonversi koordinat lintang & bujur (`lat, lng`) menjadi alamat lengkap terbalik (*reverse geocoding*) secara otomatis untuk stempel watermark foto menggunakan Google Maps Geocoding API dengan fallback OpenStreetMap Nominatim. | Query: `?lat=-6.2259&lng=106.5489` | `200 OK`: `{ success: true, address: "..." }`. `400`: Parameter koordinat tidak valid. |
| `GET /api/dashboard` | `ADMIN`, `MEMBER` | Mengambil metrik ringkasan harian (jumlah sudah/belum diperiksa, suhu tertinggi, jumlah overlimit, status WA, transaksi terbaru). Admin dapat memilih mode gabungan (`warehouse_id=all`) atau filter spesifik; Member terikat pada warehouse yang diizinkan. | Query: `?tanggal=YYYY-MM-DD&warehouse_id=...` | `200 OK`: Objek ringkasan dashboard. |
| `GET /api/reports/monthly` | `ADMIN` | Menghasilkan struktur data matriks bulanan (tanggal 1..31, penanda Sabtu/Minggu, status sel kosong vs terisi) untuk warehouse yang dipilih. | Query: `?year=2026&month=10&warehouse_id=WH-001` | `200 OK`: Struktur matriks siap tampil, cetak PDF, & ekspor `.xlsx`/`.csv`. |
| `GET/POST/PUT /api/admin/users` | `ADMIN` | CRUD akun pengguna, aktif/nonaktif akun, ubah role, dan reset password. | Data akun pengguna | `200/201`: Operasi berhasil + tercatat di `AUDIT_LOGS`. |
| `GET/POST/PUT /api/admin/master` | `ADMIN` | Menambah, mengubah, atau menonaktifkan Master Lokasi dan Master Jadwal Periode per warehouse. | Data lokasi / jadwal + `warehouse_id` | `200/201`: Master diperbarui + tercatat di `AUDIT_LOGS`. |
| `GET/PUT /api/admin/settings` | `ADMIN` | Mengubah batas suhu, aturan kunci hari Minggu/libur, dan pembukaan kunci tanggal per warehouse atau global. | Pasangan `setting_key`, `setting_value`, & `warehouse_id` | `200 OK`: Pengaturan diperbarui + tercatat di `AUDIT_LOGS`. |
| `GET /api/admin/audit-logs` | `ADMIN` | Mengambil daftar riwayat aktivitas dan perubahan data (dapat difilter per warehouse). | Query filter tanggal/kategori/warehouse | `200 OK`: Daftar `AUDIT_LOGS`. |

---

## 13. WhatsApp Integration Specification (Fonnte)

### 13.1 Konfigurasi Kredensial

Seluruh komunikasi ke API Fonnte dilakukan dari backend Vercel menggunakan Environment Variables:

* `FONNTE_API_TOKEN`: Token autentikasi perangkat WhatsApp di Fonnte.
* `FONNTE_WA_GROUP_ID`: ID Grup WhatsApp tujuan pengiriman peringatan bersama untuk seluruh warehouse.

### 13.2 Kondisi Pemicu (Trigger Condition)

Notifikasi dikirimkan secara otomatis apabila:

1. Pengaturan `wa_notification_enabled` pada warehouse bersangkutan bernilai `TRUE`.
2. Nilai suhu transaksi yang disimpan memenuhi kondisi **`suhu > max_temp_limit`** (melebihi batas aktif warehouse pada saat transaksi).

### 13.3 Format Pesan Standar

Format pesan WhatsApp peringatan suhu menggunakan gaya narasi ringkas, profesional, menyertakan identitas warehouse secara jelas di bagian kepala pesan, dan langsung ke data. Sesuai keputusan OQ-02, tautan foto bukti mengadopsi format ganda (Peninjau Aplikasi & Google Drive) serta tautan web aplikasi mengarah ke rute valid `/dashboard`:

**1. Format Peringatan 1 Lokasi (Simpan Tunggal / Single Alert):**
```text
*PERINGATAN SUHU WAREHOUSE*
Warehouse: [warehouse_code] — [warehouse_name]

Selamat siang, update suhu per 18 Oktober 2026 pukul 13.00. Ada 1 lokasi yang suhunya di atas batas 30°C:

1. Inbound: 31,5°C

Foto bukti:
- Peninjau Aplikasi: https://[domain-aplikasi]/dashboard
- Google Drive: https://drive.google.com/file/d/[drive_file_id]/view

Aplikasi: https://[domain-aplikasi]/dashboard
```

**2. Format Peringatan Rekap Gabungan (Simpan Semua / Batch Alert):**
```text
*PERINGATAN SUHU WAREHOUSE*
Warehouse: [warehouse_code] — [warehouse_name]

Selamat siang, update suhu per 18 Oktober 2026 pukul 13.00. Ada 3 lokasi yang suhunya di atas batas 30°C:

1. Inbound: 31,5°C
2. A04: 33,0°C
3. D05: 32,2°C

Foto bukti:
- Inbound: https://drive.google.com/file/d/[id1]/view
- A04: https://drive.google.com/file/d/[id2]/view
- D05: https://drive.google.com/file/d/[id3]/view

Aplikasi: https://[domain-aplikasi]/dashboard
```

*(Catatan pemformatan: Salam pembuka menggunakan deteksi waktu/jadwal dinamis: 'Selamat pagi' untuk jadwal pagi/pukul < 11.00, 'Selamat siang' untuk pukul 11.00–14.59, dan 'Selamat sore' untuk pukul ≥ 15.00. Angka desimal menggunakan koma sesuai bahasa Indonesia `31,5°C`, dan tanggal diformat menjadi `DD NamaBulan YYYY`).*

### 13.4 Idempotensi, Penanganan Kegagalan, dan Retry

1. **Isolasi Transaksi:** Apabila API Fonnte sedang gangguan (*timeout*, kuota habis, atau perangkat WhatsApp terputus), **transaksi suhu dan foto wajib tetap tersimpan dengan sukses** di Google Sheets dan Google Drive.
2. **Pencatatan Status & Error:** Jika pengiriman gagal, kolom `wa_notif_status` diisi `FAILED` dan alasan kegagalan dari Fonnte disimpan di kolom `wa_error_message`.
3. **Kunci Idempotensi Notifikasi (`wa_notif_id`):** Setiap transaksi memiliki `wa_notif_id` unik (`WA-[transaction_id]`).
   * Jika status sudah `SENT`, percobaan simpan ulang tidak akan memicu pengiriman pesan baru.
   * Jika Admin menekan tombol **Kirim Ulang WA (Retry)** pada transaksi berstatus `FAILED`, backend memeriksa apakah `wa_notif_status != SENT` sebelum mengirim ke Fonnte, lalu memperbarui status menjadi `SENT` setelah berhasil.
4. **Batas Waktu Panggilan WhatsApp (Fonnte Request Timeout):** Panggilan HTTP ke API Fonnte dari backend Vercel wajib menggunakan batas waktu (*timeout*) singkat maksimal **3000 ms (3 detik)**. Jika Fonnte mengalami latensi tinggi atau tidak merespons dalam 3 detik, backend langsung membatalkan permintaan dan menandai `wa_notif_status = FAILED` (`wa_error_message = 'Fonnte Gateway Timeout (3s)'`), sehingga penyimpanan transaksi dan pengembalian respons ke pengguna tidak tertunda.

---

## 14. Security Requirements

1. **Penyimpanan Kredensial Rahasia:**
   * Kredensial Google Service Account (`GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`), ID Spreadsheet/Drive (`GOOGLE_SHEET_ID`, `GOOGLE_DRIVE_ROOT_FOLDER_ID`), kunci sesi (`JWT_SECRET_KEY`), kredensial Fonnte (`FONNTE_API_TOKEN`, `FONNTE_WA_GROUP_ID`), serta kunci inisialisasi sementara (`SETUP_KEY`) **wajib hanya disimpan di Vercel Environment Variables**.
   * Dilarang keras menaruh nilai rahasia tersebut di kode frontend, repositori GitHub, maupun di dalam sel sheet `SETTINGS`.
   * **Penghapusan Kunci Setup:** Segera setelah endpoint `/api/init` berhasil dijalankan pertama kali, variabel `SETUP_KEY` wajib langsung dihapus dari dashboard Vercel oleh Pemilik Produk. Jika `SETUP_KEY` tidak ada atau salah, endpoint `/api/init` menolak seluruh permintaan tanpa membocorkan rincian sistem.
2. **Keamanan Password, Kewajiban Ganti Password Awal, & Mekanisme Lupa Password:**
   * Semua password wajib di-hash satu arah menggunakan algoritma `bcrypt` (minimal 10 *salt rounds*) sebelum disimpan ke sheet `USERS`.
   * **Penegakan Wajib Ganti Password Awal Admin di Backend:** Deteksi kewajiban ganti password dilakukan di sisi backend dengan mencocokkan hash password admin terhadap nilai default `admin123` saat login (tanpa menambah kolom baru di sheet `USERS` demi mempertahankan kesederhanaan skema 8 sheet). Jika terdeteksi masih default, token sesi disematkan klaim `must_change_password: true`. Selama klaim ini aktif, **seluruh endpoint API selain `/api/auth/change-password` dan `/api/auth/logout` wajib ditolak di backend dengan HTTP `403 Forbidden`**. Password baru wajib minimal 8 karakter, tidak boleh sama dengan `admin123`, dan perubahannya dicatat di `AUDIT_LOGS`.
   * Jika pengguna lupa password, pemulihan dilakukan melalui fitur **Reset Password oleh Admin** (Admin menetapkan password sementara baru yang langsung di-hash).
3. **Otorisasi Sisi Server & Masa Berlaku Sesi:**
   * Penyembunyian menu di tampilan antarmuka (UI) bukan merupakan pengamanan utama. Setiap endpoint `/api/admin/*`, perubahan transaksi (`PUT`), dan penginputan tanggal non-hari-ini wajib memeriksa peran (`role === 'ADMIN'`) dari token sesi di backend.
   * Masa berlaku sesi login (HttpOnly Cookie JWT) dibatasi tepat **12 jam** (mencakup 1 giliran kerja/shift operasional gudang). Setelah 12 jam, pengguna wajib login kembali. Saat endpoint logout dipanggil, cookie langsung dihapus (`Max-Age=0`).
4. **Prinsip Hak Akses Minimum Google Drive & Sheets:**
   * Google Service Account hanya diberikan akses ke 1 file Google Spreadsheet dan 1 folder utama `Warehouse Temperature Report/` di Google Drive, bukan akses penuh ke seluruh akun Google pemilik.
5. **Sanitasi Respons & Log:**
   * Pesan error yang dikirim ke frontend tidak boleh membocorkan *stack trace* internal, kunci privat, atau token Fonnte.

---

## 15. Error Handling dan Data Recovery

### 15.1 Keterbatasan Google Sheets pada Akses Bersamaan (Concurrency Limitation) & Mitigasi

Google Sheets API **bukan merupakan database relasional transaksional (ACID)** dan tidak memiliki fitur *row-level locking* atau *unique constraint* bawaan. Jika dua petugas menekan tombol Simpan untuk lokasi dan jam yang sama pada detik yang persis bersamaan, pemeriksaan baca-lalu-tulis (*read-before-write*) biasa masih berisiko menghasilkan dua baris dengan `transaction_id` yang sama (*race condition*).

**Strategi Mitigasi Tanpa Mengganti Teknologi:**

1. **Pemeriksaan Pra-Unggah & Pra-Tulis (Double Check):** Backend memeriksa keberadaan `transaction_id` sebelum mengunggah foto ke Drive, dan memeriksa sekali lagi tepat sebelum memanggil `spreadsheets.values.append`.
2. **Verifikasi Pasca-Tulis & Deduplikasi Deterministik (Post-Write Verification):**
   * Sesaat setelah baris ditulis ke `TRANSAKSI_SUHU`, backend membaca kembali kolom `transaction_id` dan `idempotency_key`.
   * Jika terdeteksi terdapat lebih dari satu baris dengan `transaction_id` yang sama akibat benturan milidetik, aturan deterministik berlaku: **baris dengan `server_received_at` paling awal (baris pertama) dianggap sebagai transaksi sah**, sedangkan baris kedua dibatalkan/dihapus dan pengirim kedua menerima respons konflik (`409 Conflict`: *"Data suhu untuk lokasi [X] pada jam [Y] sudah terisi..."*).
3. **Idempotency Key dari Klien:** Setiap sesi pengisian form di layar menghasilkan `idempotency_key` (UUID). Jika koneksi internet petugas terputus saat menunggu respons lalu petugas menekan "Coba Lagi", backend mengenali `idempotency_key` yang sama dan mengembalikan status sukses dari transaksi yang sebenarnya sudah masuk, tanpa menulis baris baru.

### 15.2 Pemulihan Kegagalan Parsial (Partial Failure Recovery)

| Skenario Kegagalan | Perilaku Sistem & Pemulihan |
| --- | --- |
| **1. Unggah Foto ke Google Drive Gagal** | Proses dihentikan sebelum menulis ke Google Sheets. Transaksi **tidak disimpan** setengah jalan. UI menampilkan status gagal unggah pada lokasi terkait dan menyediakan tombol **Coba Lagi** tanpa menghilangkan foto yang sudah dijepret di layar. |
| **2. Foto Berhasil Diunggah ke Drive, tetapi Simpan ke Google Sheets Gagal** | Backend mencatat kegagalan atau menyertakan referensi `idempotency_key`. Saat pengguna menekan **Coba Lagi**, sistem mendeteksi bahwa file untuk transaksi tersebut sudah ada di folder Drive bulan terkait (atau memperbarui tautannya) sehingga tidak menumpuk file sampah, lalu menyelesaikan penulisan ke Google Sheets. |
| **3. Simpan ke Drive & Sheets Berhasil, tetapi Pengiriman WA Fonnte Gagal** | Transaksi suhu dinyatakan **Berhasil Tersimpan** kepada petugas disertai peringatan kecil bahwa notifikasi WA tertunda (`wa_notif_status = FAILED`). Admin dapat melihat daftar notifikasi gagal di Dashboard dan menekan tombol **Kirim Ulang WA** kapan saja. |

---

## 16. Reporting Requirements

### 16.1 Tampilan Rekap Bulanan Matriks (Sesuai Format Acuan)

Sistem membentuk tabel matriks bulanan secara otomatis dari data `TRANSAKSI_SUHU` berdasarkan filter **Bulan** dan **Tahun** yang dipilih:

* **Judul Laporan:** Menampilkan Bulan dan Tahun (contoh: **Oktober 2026**) serta identitas warehouse aktif (`[warehouse_code] — [warehouse_name]`).
* **Struktur Tabel:**
  * Dikelompokkan berdasarkan blok **Periode Check** (`09.00`, `13.00`, `17.00`, serta jadwal lain yang aktif atau memiliki transaksi pada bulan tersebut).
  * Di dalam setiap baris lokasi, kolom menampilkan:
    1. **No** (`1, 2, 3...`) — Nomor urut baris (kolom sticky 1).
    2. **Location** (`Inbound`, `A04`, `D05`, dst.) — Nama titik pantau (kolom sticky 2).
    3. **Periode Check** — Badge pill jadwal shift independen per baris (kolom sticky 3, bebas dari risiko clipping teks vertikal) dengan aksen warna shift (Pagi/Siang/Sore).
    4. **Kolom Tanggal 1 s/d 28/29/30/31** — Menampilkan suhu numerik dengan format koma (misal `28,5`).
    5. **Kolom Ringkasan Min & Max** — Dua kolom ringkasan di ujung kanan tabel yang secara otomatis menghitung nilai suhu minimum (`Min`) dan maksimum (`Max`) yang tercatat pada baris lokasi tersebut sepanjang bulan berjalan.
* **Penandaan Visual Wajib:**
  * **Hari Sabtu & Minggu:** Header angka tanggal yang jatuh pada hari Sabtu atau Minggu wajib diberi **warna latar belakang merah** solid dengan teks putih (contoh pada Oktober 2026: tanggal `3, 4, 10, 11, 17, 18, 24, 25, 31`).
  * **Suhu Melebihi Batas:** Sel angka suhu yang berstatus `MELEBIHI_BATAS` diberi penanda teks tebal merah dengan latar `--over-tint` dan segitiga penanda `▲` agar tidak bergantung pada persepsi warna semata.
  * **Data Belum Diinput:** Sel untuk jadwal yang belum diinput ditampilkan sebagai tanda strip (`–`) dengan latar netral `--empty-tint` dan **dilarang keras** dikonversi menjadi angka `0` atau `0,0°C` (BR-09).
* **Interaktivitas Detail Transaksi:**
  * Saat Admin mengklik salah satu sel angka suhu pada tabel matriks di layar, muncul jendela detail (*modal lightbox*) yang menampilkan: **Nama Petugas**, **Waktu Input Server (WIB)**, **Status Notifikasi WA**, **Buka Foto Bukti (Google Drive)**, dan tombol **Ubah Data (Edit)**.

### 16.2 Spesifikasi Cetak PDF (A4 Landscape) & Kolom Pengesahan (Sign-off)

1. **Cetak PDF (Print-Ready Landscape A4):**
   * Menggunakan tata letak kertas **A4 Landscape** (`@page { size: A4 landscape; margin: 8mm; }`) dengan `table-layout: fixed`, ukuran font proporsional (`6.5pt` pada sel data), dan batas hairline tipis agar seluruh 31 kolom tanggal + Min/Max + 3 kolom identitas muat rapi dalam satu lembar melebar tanpa terpotong (*zero clipping*).
   * Warna merah pada header Sabtu/Minggu dipertahankan saat cetak menggunakan `-webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;`.
2. **Tiga Kolom Pengesahan Laporan Bulanan (Sign-off):**
   * Di bagian bawah lembar rekap bulanan, tersedia 3 kotak pengesahan formal yang dapat diatur sepenuhnya oleh Admin melalui Tab 5 Pengaturan (tanpa hardcode):
     * **Kolom 1 (Kiri): Dibuat Oleh** — Jabatan (`signoff_maker_title`) & Nama Pejabat (`signoff_maker_name`).
     * **Kolom 2 (Tengah): Diperiksa Oleh** — Jabatan (`signoff_checker_title`) & Nama Pejabat (`signoff_checker_name`).
     * **Kolom 3 (Kanan): Diketahui Oleh** — Jabatan (`signoff_approver_title`) & Nama Pejabat (`signoff_approver_name`).
   * Area tanda tangan (`.signoff-space`) dirancang bersih (tanpa teks tiruan paraf miring), siap dibubuhi tanda tangan basah, stempel resmi warehouse, atau tanda tangan elektronik, dengan aturan CSS `page-break-inside: avoid` agar tidak terpisah ke halaman berikutnya saat dicetak.
3. **Ekspor Excel (`.xlsx`) & CSV (`.csv`):**
   * File `.xlsx` menyediakan dua lembar (*worksheet*): (1) **Matriks Bulanan** sesuai tabel laporan lengkap dengan kolom Min & Max, dan (2) **Data Detail Transaksi** yang memuat kolom Tanggal, Lokasi, Jadwal, Suhu, Status Suhu, Nama Petugas, Waktu Server, dan Tautan Bukti Foto.

---

## 17. Non-Functional Requirements

1. **NFR-01 (Kinerja & Kompresi Gambar):** Foto yang diambil dari kamera perangkat wajib dikompresi di sisi klien (*browser*) menggunakan HTML5 Canvas ke format JPEG (resolusi sisi terpanjang maks. `1280px`, kualitas `0.75–0.80`, target ukuran `< 350 KB`) agar proses unggah melalui jaringan seluler gudang selesai dalam waktu `< 5 detik`. *(Catatan: Rentang waktu 2,5 – 4,2 detik merupakan perkiraan teoritis awal, bukan hasil uji coba terukur. Pengukuran waktu nyata di jaringan gudang dijadwalkan pada Tahap 5).*
2. **NFR-02 (Kompatibilitas Perangkat):** Aplikasi wajib berjalan dengan baik pada *browser* modern di perangkat mobile (Google Chrome Android & Safari iOS) maupun *browser* desktop (Chrome, Edge, Firefox).
3. **NFR-03 (Konsistensi Zona Waktu):** Seluruh penentuan "Tanggal Hari Ini", pembuatan folder Tahun/Bulan, dan pencatatan waktu laporan wajib dikunci menggunakan zona waktu operasional warehouse (`Asia/Jakarta` / WIB, UTC+7) di sisi backend, agar tidak terpengaruh pengaturan jam lokal perangkat atau server UTC Vercel.
4. **NFR-04 (Auditabilitas):** Seluruh perubahan pada master data, pengaturan batas suhu, pembukaan kunci tanggal, pengelolaan akun, dan pengeditan transaksi wajib menghasilkan jejak audit permanen di `AUDIT_LOGS`.
5. **NFR-05 (Konsistensi Format Data Numerik & Teks):** Nilai suhu disimpan secara numerik murni bertitik (`valueInputOption=RAW`) ke Google Sheets agar perhitungan analitik tidak terpengaruh locale spreadsheet, sedangkan penanggalan (`YYYY-MM-DD`) dan jam (`HH.MM`) disimpan eksplisit sebagai teks (bukan auto-date Sheets). Pada antarmuka pengguna dan pesan WhatsApp, angka desimal selalu diformat menggunakan koma (`35,5°C`) sesuai standar bahasa Indonesia.

---

## 18. Acceptance Criteria (Kriteria Penerimaan Keseluruhan)

Aplikasi dinyatakan siap digunakan (*Ready for Production*) hanya jika seluruh 12 kriteria berikut terpenuhi dan lulus verifikasi:

| ID | Kriteria Selesai | Indikator Kelulusan Terukur |
| --- | --- | --- |
| **AC-01** | Login & Hak Akses Admin/Member | Akun awal `admin`/`admin123` berfungsi; Member tidak bisa mengakses halaman maupun endpoint API Admin (`403 Forbidden`); nama petugas otomatis tercatat dari sesi login. |
| **AC-02** | Pengelolaan Master & Batas Suhu | Admin dapat menambah/mengubah/menonaktifkan lokasi, jadwal, dan batas suhu langsung dari UI tanpa mengubah kode program; item yang sudah punya transaksi tidak terhapus permanen. |
| **AC-03** | Input Suhu & Kamera Watermark | Member dapat mencatat suhu dengan kamera langsung (tanpa opsi galeri); hasil foto memiliki watermark Tanggal, Waktu, Lokasi, Nama Petugas, dan GPS (jika tersedia). |
| **AC-04** | Akurasi Penyimpanan Data & Foto | Data transaksi tersimpan lengkap di sheet `TRANSAKSI_SUHU` dan file foto tersimpan di Google Drive dengan tautan yang saling terhubung. |
| **AC-05** | Otomatisasi Folder Google Drive | Folder `[Kode — Nama WH]`, `Tahun (YYYY)`, dan `Bulan (MM - NamaBulan)` terbentuk otomatis di bawah `Warehouse Temperature Report/` dengan format nama file `YYYY-MM-DD_Lokasi_Jam.jpg`. |
| **AC-06** | Pencegahan Duplikat & Konkurensi | Kombinasi Warehouse + Tanggal + Lokasi + Jadwal yang sudah terisi menolak input ulang dari Member dengan pesan standar; pengujian akses bersamaan tidak menghasilkan transaksi ganda aktif. |
| **AC-07** | Peringatan WhatsApp Fonnte | Input suhu `> batas aktif` otomatis mengirim pesan sesuai format ke WhatsApp Group bersama dengan header identitas warehouse dan tautan foto bukti. |
| **AC-08** | Ketahanan Terhadap Kegagalan | Kegagalan Fonnte tidak menghilangkan data transaksi; kegagalan unggah foto menampilkan opsi *retry* tanpa membuat duplikat; fitur **Simpan Semua** melaporkan hasil per lokasi. |
| **AC-09** | Rekap Bulanan, PDF, & Ekspor | Matriks bulanan terbentuk otomatis per warehouse tanpa buat sheet baru, kolom Sabtu/Minggu berwarna merah, data kosong tidak dianggap `0°C`, serta fitur cetak PDF, ekspor `.xlsx`, dan `.csv` berjalan rapi. |
| **AC-10** | Audit Log & Keamanan Kredensial | Seluruh perubahan transaksi/pengaturan tercatat di `AUDIT_LOGS` (nilai sebelum & sesudah beserta konteks warehouse); tidak ada token Fonnte atau kredensial Google di kode frontend, GitHub, maupun sheet `SETTINGS`. |
| **AC-11** | Pemisahan, Perpindahan Multi-Warehouse, & Default Warehouse | Saat login pertama kali, sistem otomatis mengaktifkan warehouse default yang telah ditetapkan Admin untuk akun tersebut (`default_warehouse_id`); pengguna dapat berpindah warehouse aktif secara eksklusif melalui menu profil; backend memvalidasi hak akses pada setiap transaksi & pembacaan data; Member tanpa izin ditolak `403 Forbidden`. |
| **AC-12** | Kelangsungan Histori Transaksi Multi-Warehouse | Menonaktifkan warehouse atau mencabut akses user tidak menghapus baris transaksi historis; riwayat laporan bulanan tetap dapat diakses sesuai integritas data semula. |

---

## 19. Testing Scenarios

| ID Tes | Skenario Pengujian | Langkah Pengujian | Hasil yang Diharapkan |
| --- | --- | --- | --- |
| **TS-01** | Keamanan Bypass Endpoint Admin oleh Member | Login sebagai `MEMBER`, lalu kirim request `PUT /api/admin/settings` atau `PUT /api/transactions/[id]` secara langsung. | Server Vercel menolak request dengan status `403 Forbidden` dan tidak ada perubahan data di Google Sheets. |
| **TS-02** | Penolakan Timpa Data oleh Member | Lokasi `A04` jam `09.00` hari ini sudah diisi oleh Petugas A di warehouse CK01. Petugas B (Member) mencoba mengirim data untuk `A04` jam `09.00` hari ini pada CK01. | Sistem menolak penyimpanan dan menampilkan pesan: *"Data suhu untuk lokasi A04 pada jam 09.00 sudah terisi. Silakan hubungi Admin jika diperlukan perubahan data."* |
| **TS-03** | Pengujian Akses Bersamaan (Concurrency Test) | Dua perangkat Member menekan tombol **Simpan** untuk lokasi `Inbound` jam `13.00` pada tanggal yang sama di detik yang bersamaan. | Hanya 1 transaksi aktif yang dipertahankan untuk `Inbound` jam `13.00`; perangkat kedua menerima pesan bahwa data sudah terisi. |
| **TS-04** | Kamera Tanpa Galeri & Penolakan Izin GPS | Buka form input di ponsel, tekan ambil foto, dan tolak izin lokasi (GPS) pada browser. | Tidak ada opsi unggah dari galeri; kamera tetap dapat mengambil foto dengan watermark Tanggal, Waktu, Lokasi, dan Petugas (tanpa koordinat GPS palsu), serta transaksi tetap dapat disimpan. |
| **TS-05** | Kegagalan Sebagian pada "Simpan Semua" | Isi ke-3 lokasi (`Inbound`, `A04`, `D05`), lalu simulasikan kegagalan jaringan pada saat lokasi ke-3 (`D05`) sedang diunggah. | Aplikasi menampilkan `Inbound` dan `A04` berstatus **Tersimpan**, sedangkan `D05` berstatus **Gagal** dengan tombol *Coba Lagi* khusus untuk `D05`. |
| **TS-06** | Kegagalan Layanan Fonnte & Retry Idempoten | Gunakan token Fonnte yang sengaja dibuat salah/offline, lalu simpan suhu `35.5°C` (batas `30°C`). Setelah itu perbaiki token dan klik **Retry** di halaman Admin. | Transaksi `35.5°C` dan foto tetap tersimpan aman dengan `wa_notif_status = FAILED`. Saat Admin menekan Retry, pesan terkirim 1 kali ke WA Group dan status berubah menjadi `SENT`. |
| **TS-07** | Penonaktifan Lokasi yang Memiliki Riwayat | Admin menonaktifkan lokasi `D05` pada bulan November, lalu membuka menu Rekap Bulanan untuk bulan Oktober 2026. | Lokasi `D05` tidak lagi muncul pada form input baru di bulan November, tetapi seluruh baris dan angka suhu `D05` pada laporan Oktober 2026 tetap tampil utuh. |
| **TS-08** | Verifikasi Sel Kosong vs 0°C pada Laporan | Biarkan tanggal 19 Oktober kosong (belum diinput), lalu buka Rekap Bulanan, cetak PDF, dan unduh `.xlsx`. | Kolom tanggal 19 tampil kosong/berpenanda belum diinput, tidak bernilai `0` atau `0.0`, dan perhitungan suhu rata-rata/terendah tidak terdistorsi oleh angka nol. |
| **TS-09** | Validasi Pembuatan Warehouse & Kode Unik | Admin menambahkan warehouse `CK01` dan `CK02`. Admin mencoba menambahkan warehouse lain dengan kode `CK01` lagi. | Sistem berhasil menyimpan `CK01` dan `CK02`; pembuatan dengan kode duplikat ditolak dengan status `409 Conflict`. |
| **TS-10** | Penegakan Hak Akses Warehouse di Backend | User A hanya memiliki izin akses ke `CK01`. User A mencoba mengakses API `GET /api/form-context?warehouse_id=WH-002` atau mengirim transaksi ke `WH-002`. | Server Vercel menolak request dengan status `403 Forbidden` (*"Akses ke warehouse ini ditolak"*). |
| **TS-11** | Perpindahan Warehouse Aktif (Switching) | User B memiliki izin ke `CK01` dan `CK02`. User B berpindah ke `CK02` melalui menu profil. | Konteks warehouse aktif berubah menjadi `CK02`; form input dan dashboard seketika menampilkan master lokasi dan data transaksi milik `CK02`. Transaksi lama di `CK01` tidak berubah. |
| **TS-12** | Independensi Batas Suhu & Keunikan Transaksi | `CK01` memiliki batas suhu `30°C` dan lokasi `Inbound`. `CK02` memiliki batas suhu `32°C` dan lokasi `Inbound`. Petugas menginput suhu `31°C` pada keduanya. | Transaksi `CK01` dinyatakan `MELEBIHI_BATAS` dan memicu alert WA; transaksi `CK02` dinyatakan `NORMAL`. Kedua transaksi tersimpan terpisah tanpa saling menimpa. |
| **TS-13** | Hierarki Google Drive & Pesan WA Multi-Warehouse | Mengunggah foto transaksi pada `CK01` dan `CK02`, dengan salah satu transaksi melebihi batas suhu. | Foto tersimpan masing-masing di bawah folder `CK01 — Cikupa 1/...` dan `CK02 — Cikupa Annex/...`; pesan WA terkirim dengan identitas warehouse yang jelas di baris kedua. |
| **TS-14** | Kelangsungan Histori saat Warehouse Dinonaktifkan | Admin menonaktifkan `CK01`. Buka laporan rekap bulanan untuk periode sebelumnya di `CK01`. | Seluruh data transaksi historis `CK01` tetap dapat dibaca dan diekspor secara utuh; warehouse `CK01` hanya tidak muncul pada opsi penginputan baru bagi Member. |
| **TS-15** | Default Warehouse Saat Login & Pindah via Profil | Admin menetapkan `CK02` sebagai default warehouse untuk User B. User B login ke aplikasi. Setelah berada di `CK02`, User B membuka menu profil dan memilih Pindah Warehouse ke `CK01`. | Saat login berhasil, sesi awal User B langsung berada pada `CK02` tanpa harus memilih manual. Ketika User B memilih `CK01` di menu profil, sistem sukses beralih ke `CK01`. |

---

## 20. Implementation Roadmap

Pengerjaan dilakukan secara bertahap mengikuti 10 fase terstruktur:

1. **Tahap 1 — Finalisasi Struktur Database & Alur Kerja:** Persetujuan dokumen PRD ini, penguncian skema 8 sheet Google Sheets, dan aturan bisnis.
2. **Tahap 2 — Penyiapan Infrastruktur (GitHub, Vercel, Sheets, Drive):** Pembuatan repositori GitHub, konfigurasi proyek Vercel beserta *Environment Variables*, pembuatan Google Service Account, serta pembagian akses ke Google Spreadsheet dan folder utama `Warehouse Temperature Report/` di Google Drive.
3. **Tahap 3 — Pembangunan Autentikasi & Master Data:** Implementasi endpoint `/api/init` (8 sheet), sistem login JWT HttpOnly Cookie + Bcrypt, manajemen akun pengguna (CRUD), serta pengelolaan Master Lokasi, Master Jadwal, Master Warehouse, dan Hak Akses User-Warehouse.
4. **Tahap 4 — Pembangunan Form Suhu & Pengambilan Foto Kamera:** Implementasi UI form input responsif, validasi kunci tanggal/hari Minggu, pemicu kamera perangkat (`capture="environment"`), pratinjau thumbnail, serta kompresi gambar JPEG di sisi klien.
5. **Tahap 5 — Pembangunan Penyimpanan Google Drive & Transaksi Sheets:** Implementasi pembuatan otomatis folder Warehouse/Tahun/Bulan di Google Drive, penamaan file standar, pencegahan duplikasi/konkurensi di `TRANSAKSI_SUHU`, fitur *Simpan per Lokasi* & *Simpan Semua*, serta fitur Edit Transaksi oleh Admin beserta `AUDIT_LOGS`.
6. **Tahap 6 — Integrasi WhatsApp Gateway (Fonnte):** Implementasi pemicu otomatis peringatan suhu berlebih ke WhatsApp Group dengan header warehouse, pencatatan status pengiriman, dan fitur *Retry* notifikasi gagal tanpa duplikasi.
7. **Tahap 7 — Pembangunan Dashboard & Laporan Rekap Bulanan:** Implementasi metrik ringkasan Dashboard (gabungan & filter warehouse), tabel matriks bulanan dinamis dengan penanda merah Sabtu/Minggu, tata letak cetak PDF Landscape, serta ekspor `.xlsx` dan `.csv`.
8. **Tahap 8 — Pengujian Keamanan, Kegagalan Layanan, & Akses Bersamaan:** Pelaksanaan skenario pengujian (`TS-01` s/d `TS-08`), verifikasi isolasi kredensial, dan simulasi pemulihan error.
9. **Tahap 9 — Pengujian Multi-Warehouse Komprehensif:** Pelaksanaan skenario pengujian (`TS-09` s/d `TS-14`), verifikasi switching warehouse, isolasi Google Drive, dan deduplikasi transaksi.
10. **Tahap 10 — Uji Coba Operasional (User Acceptance Testing):** Uji coba langsung bersama petugas warehouse dan Admin sebelum digunakan secara rutin.

---

## 21. Open Questions dan Technical Risks

### 21.1 Keputusan Resmi atas Pertanyaan Terbuka (Approved Decisions)

Seluruh pertanyaan operasional minor berikut telah resmi disetujui dan ditetapkan oleh Pemilik Produk:

| No | Topik Keputusan | Dampak terhadap Sistem | Keputusan Resmi yang Ditetapkan |
| --- | --- | --- | --- |
| **OQ-01** | **Kewajiban Alasan saat Admin Mengedit Transaksi** | Menentukan validasi form konfirmasi edit transaksi pada sisi Admin dan kelengkapan kolom `notes_or_reason` di `AUDIT_LOGS`. | **Disetujui: Wajib Diisi (Mandatory)**, minimal alasan singkat (misal: *"Koreksi salah ketik"*). Tombol simpan perubahan nonaktif jika alasan kosong. |
| **OQ-02** | **Metode Akses Tautan Foto pada Pesan WhatsApp** | Menentukan jalur akses foto bukti di pesan WhatsApp peringatan suhu. | **Disetujui: Format Ganda**. Tautan di WA mengarah ke **Halaman Peninjau Foto di Aplikasi Vercel** (aman karena wajib login) sekaligus menyediakan tautan langsung Google Drive bagi akun yang memiliki akses folder. |
| **OQ-03** | **Cakupan Riwayat yang Dapat Dilihat oleh Member** | Menentukan tampilan kartu lokasi pada halaman Member dan filter riwayat transaksi untuk role `MEMBER`. | **Disetujui: Status Tim Hari Ini + Riwayat Sendiri**. Pada hari berjalan, Member dapat melihat status seluruh lokasi (agar tahu lokasi mana yang sudah/belum diisi tim), serta dapat melihat riwayat penginputan miliknya sendiri. |

### 21.2 Technical Risks & Mitigasi

1. **Risiko Kuota & Batas Kecepatan Google Sheets API (Rate Limit):**
   * *Risiko:* Google Sheets API memiliki batas kuota permintaan baca/tulis per menit per proyek.
   * *Mitigasi:* Menggunakan operasi baca rentang sekaligus (*batchGet*) saat memuat konteks halaman dan laporan bulanan, bukan membaca baris satu per satu, serta in-memory TTL caching (10 detik) untuk master data statis.
2. **Risiko Ukuran Payload Serverless Vercel:**
   * *Risiko:* Vercel Serverless Functions memiliki batas maksimal ukuran *body request* (`4.5 MB`). Jika foto kamera beresolusi tinggi dikirim mentah (5–10 MB), request akan ditolak oleh Vercel.
   * *Mitigasi:* Kompresi gambar di sisi klien (HTML5 Canvas ke JPEG `< 350 KB`) wajib dilakukan sebelum dikirim ke API, dan pada mode **Simpan Semua**, pengiriman dari klien ke API dilakukan secara sekuensial per lokasi (1 request per lokasi secara otomatis di balik layar) agar ukuran tiap request sangat ringan dan status berhasil/gagal per lokasi dapat dilacak secara presisi.
3. **Ketentuan Durasi & Timeout Serverless Vercel (Terverifikasi Resmi Vercel - Fluid Compute):**
   * *Ketentuan Resmi:* Berdasarkan dokumentasi resmi Vercel, batas durasi default eksekusi fungsi Vercel adalah 300 detik (5 menit) baik pada paket Hobby maupun Pro, dengan batas platform timeout untuk permintaan HTTP standar sebesar 120 detik.
   * *Mitigasi:* Meskipun batas platform sangat longgar (120 detik), sistem tetap menargetkan penyelesaian transaksi `< 5 detik` (NFR-01) demi kelancaran operasional petugas di lapangan, dan pemanggilan gateway Fonnte dibatasi timeout maksimal 3 detik.
4. **Ketentuan Lisensi Paket Vercel untuk Pemakaian Perusahaan (Commercial Use):**
   * *Ketentuan Resmi Vercel (ToS Section 4 & Fair Use Guidelines):* Paket gratis **Hobby** secara eksplisit dibatasi hanya untuk penggunaan personal/non-komersial. Seluruh implementasi yang digunakan untuk operasional resmi perusahaan diklasifikasikan sebagai penggunaan komersial dan mewajibkan langganan akun **Pro** ($20/bulan/seat) atau Enterprise.
   * *Tindakan Pemilik Produk:* Paket Hobby dapat digunakan selama masa pengembangan dan pengujian awal, namun Pemilik Produk wajib mengonfirmasi peningkatan ke paket Pro dengan pihak manajemen perusahaan sebelum aplikasi dipakai resmi di lingkungan operasional gudang.

---

## 22. AI Development Governance (Aturan Kepatuhan PRD bagi AI Developer)

Bagian ini mengikat setiap AI coding assistant atau agen AI yang dipakai membangun, memodifikasi, atau memelihara aplikasi ini. PRD adalah *Single Source of Truth*: kode mengikuti PRD, bukan sebaliknya.

### 22.1 Aturan Wajib bagi AI

1. **Baca PRD sebelum bekerja:** Sebelum mengerjakan tugas apa pun (fitur, perbaikan bug, refactor), AI wajib membaca bagian PRD yang relevan, termasuk Bagian 1 (stack & larangan), Bagian 7 (Business Rules), Bagian 10 (skema), dan Bagian 12 (API).
2. **Dilarang menyimpang dari PRD:** AI tidak boleh mengganti stack teknologi, menambah *sheet* atau kolom di luar skema, mengubah nama/kontrak endpoint, melanggar Business Rules (BR-01 s/d BR-11), atau menggunakan Google Apps Script dalam bentuk apa pun.
3. **Dilarang berasumsi sepihak:** Jika PRD tidak menjelaskan suatu hal, atau ada dua tafsir, AI wajib berhenti, bertanya ke pemilik produk, dan mencatatnya di Bagian 21.1 (Open Questions). AI tidak boleh memilih sendiri lalu langsung mengimplementasikannya.
4. **Larangan penambahan fitur diam-diam:** Fitur, field, atau perilaku baru yang tidak ada di PRD (*scope creep*) tidak boleh dibuat tanpa persetujuan pemilik produk.
5. **Konflik PRD vs permintaan:** Jika permintaan pengguna bertentangan dengan PRD, AI wajib menyebutkan bagian PRD yang bertentangan dan meminta keputusan: ikuti PRD, atau ubah PRD terlebih dahulu.

### 22.2 Prosedur Jika Ada Perubahan atau Kebutuhan Baru

Setiap perubahan yang memengaruhi fungsi, aturan bisnis, skema data, API, keamanan, atau UI wajib mengikuti alur berikut:

1. **Usulkan:** AI menjelaskan perubahan yang dibutuhkan beserta bagian PRD yang terdampak (ID FR/BR/AC/TS, skema, endpoint).
2. **Setujui:** Pemilik produk menyetujui atau menolak usulan.
3. **Perbarui PRD terlebih dahulu (atau bersamaan dengan kode):** AI memperbarui seluruh bagian PRD yang terdampak, bukan hanya satu bagian. Contoh: kolom baru di `TRANSAKSI_SUHU` berarti Bagian 10.7, Bagian 12, Bagian 16 (jika memengaruhi laporan), dan Bagian 19 (skenario uji) ikut diperbarui.
4. **Catat di Change Log (Bagian 22.5):** Naikkan nomor versi dokumen, tanggal, ringkasan perubahan, dan bagian yang terdampak.
5. **Implementasi:** Baru kemudian kode ditulis atau diubah mengikuti PRD yang sudah diperbarui.

Perubahan kecil yang tidak memengaruhi perilaku (misal: perbaikan teks, refactor internal tanpa dampak fungsi) tidak perlu mengubah PRD, tetapi tetap tidak boleh melanggar bagian mana pun di dalamnya.

### 22.3 Definition of Done (DoD) untuk Setiap Tugas AI

Sebuah tugas dinyatakan selesai hanya jika seluruh poin berikut terpenuhi:

* Hasil kerja sesuai dengan PRD terbaru, tanpa penyimpangan stack, skema, API, maupun Business Rules.
* Jika ada perubahan perilaku, PRD sudah diperbarui dan Change Log sudah diisi.
* Commit dan *Pull Request* mencantumkan ID PRD yang dikerjakan (contoh: `FR-017, BR-10`) sebagai jejak penelusuran (*traceability*).
* Acceptance Criteria (Bagian 6 dan 18) serta skenario uji terkait (Bagian 19) yang relevan sudah diperiksa.
* Tidak ada rahasia (token Fonnte, kredensial Google, `JWT_SECRET_KEY`) yang masuk ke kode, repositori, atau sheet `SETTINGS`.
* Ringkasan akhir dari AI menyebut secara eksplisit: apa yang dikerjakan, ID PRD yang dipenuhi, dan hal yang belum dikerjakan atau masih menjadi pertanyaan terbuka.

### 22.4 Penempatan PRD di Repositori dan Instruksi Agen

1. PRD disimpan di repositori GitHub sebagai `docs/PRD.md` dan menjadi bagian dari riwayat versi (*version control*) bersama kode.
2. Repositori wajib memiliki file instruksi agen di akar proyek (`AGENTS.md`) yang memuat ringkasan aturan Bagian 22 ini dan perintah untuk selalu membaca `docs/PRD.md` sebelum bekerja.
3. Perubahan pada `docs/PRD.md` hanya dilakukan melalui prosedur Bagian 22.2 dan harus ditinjau pemilik produk sebelum digabung (*merge*).
4. Seluruh pekerjaan antarmuka pengguna (UI/UX) wajib merujuk dan mematuhi panduan desain pada `docs/DESIGN.md` sebagai standar tampilan resmi.

### 22.5 Change Log Dokumen

| Versi | Tanggal | Perubahan | Bagian Terdampak | Disetujui Oleh |
| --- | --- | --- | --- | --- |
| 1.0 | 17 Oktober 2026 | Draft awal PRD lengkap. | 1–21 | Menunggu persetujuan |
| 1.0 (rev.) | 17 Oktober 2026 | Penambahan Bagian 22 (AI Development Governance). | 22 | Menunggu persetujuan |
| 1.1 | 17 Oktober 2026 | Dokumen disetujui; penetapan Next.js App Router; penguncian keputusan OQ-01 (alasan edit wajib), OQ-02 (tautan foto ganda), OQ-03 (cakupan riwayat Member); penetapan RAW desimal bertitik di Sheets (koma di UI/WA) & tanggal/jam teks; masa sesi JWT 12 jam; pengiriman sekuensial Simpan Semua; retensi foto lama di Drive; penambahan NFR-05; dan rujukan docs/DESIGN.md. | Status, 1, 5, 6 (FR-010), 8.1, 8.2, 8.3, 10.5, 11.2, 12, 13.3, 14, 17 (NFR-05), 21.1, 22.4, 22.5 | Pemilik Produk |
| 1.2 | 17 Oktober 2026 | Pengamanan /api/init via SETUP_KEY & petunjuk penghapusan; penegakan wajib ganti password awal admin di backend (HTTP 403) tanpa ubah skema; endpoint /api/auth/change-password; batas timeout panggilan Fonnte (3s); pembaruan data resmi Vercel Functions (Fluid Compute) & ketentuan ToS lisensi komersial; penandaan estimasi waktu simpan dan jadwal pengukuran riil di Tahap 5. | 6 (FR-001, FR-002), 8.1, 12, 13.4, 14, 17 (NFR-01), 21.2, 22.5 | Pemilik Produk |
| 1.3 | 17 Oktober 2026 | Perubahan mekanisme pengambilan foto bukti (FR-008, BR-05) dari WebRTC in-app browser ke pemanggilan kamera perangkat native OS via capture="environment", mengakomodasi penggunaan aplikasi kamera watermark/timestamp eksternal di ponsel petugas; kompresi sisi klien tetap dipertahankan. | 6 (FR-008), 7 (BR-05), 20 (Tahap 4), 22.5 | Pemilik Produk |
| 1.4 | 17 Oktober 2026 | Penyesuaian format penamaan file foto di Google Drive menjadi lebih ringkas: [YYYY-MM-DD]_[NamaLokasi]_[Jam].jpg (contoh: 2026-10-17_Inbound_09.00.jpg), menggantikan format lama yang menyertakan nama petugas dan titik waktu, demi keterbacaan dan kompatibilitas karakter file system. | 11.2, 22.5 | Pemilik Produk |
| 1.5 | 17 Oktober 2026 | Penyempurnaan template notifikasi WhatsApp menjadi format narasi profesional: salam otomatis (pagi/siang/sore), rangkuman lokasi overlimit bernomor, tautan foto langsung ke Google Drive, tautan web aplikasi ke beranda, penghapusan kalimat penutup, dan dukungan pesan rekap tunggal untuk mode Simpan Semua agar tidak membanjiri grup WA. | 13.3, 22.5 | Pemilik Produk |
| 1.6 | 17 Oktober 2026 | Penerapan fitur native Google Drive Manage Versions (Kelola Versi) dengan PATCH uploadType=media&keepRevisionForever=true saat Admin merevisi foto bukti, sehingga file di Google Drive tetap tunggal tanpa duplikat fisik, ID/URL tidak berubah, dan riwayat foto lama tetap tersimpan abadi di Version History. | 11.2, 22.5 | Pemilik Produk |
| 1.7 | 17 Oktober 2026 | Penyelesaian Pengujian Tahap 8: Eksekusi seluruh skenario uji penerimaan (TS-01 s/d TS-08 lulus 100%); implementasi mitigasi konkurensi pra-tulis & verifikasi pascatulis deterministik (Bagian 15.1); serta penyelesaian audit daftar periksa antarmuka DESIGN.md Bagian 11. | 15.1, 18, 19 (TS-01 s/d TS-08), 20 (Tahap 8), 22.5 | Pemilik Produk |
| 2.0 | 18 Oktober 2026 | Ekspansi Multi-Warehouse (Dokumen Spesifikasi v1.3): Pengelolaan Master Warehouse (CK01 Cikupa 1 & CK02 Cikupa Annex); Hak Akses User per Warehouse; Menu Pindah Warehouse pada Profil; Dashboard Gabungan (Admin) & Detail per Warehouse; Konfigurasi independen per warehouse; Pemisahan data transaksi (komposit warehouse_id); Pemisahan folder Google Drive per warehouse; Notifikasi WA bersama beridentitas warehouse; Skema 8 Sheet Google Sheets; penambahan FR-017 s/d FR-024, BR-10, BR-11, AC-11, AC-12, dan TS-09 s/d TS-14. | Seluruh Bagian (1, 4, 5, 6, 7, 8, 10, 11, 12, 13, 18, 19, 20, 22) | Pemilik Produk |
| 2.1 | 18 Oktober 2026 | Penetapan Default Warehouse per User oleh Admin (Kolom J pada sheet USERS); penentuan konteks warehouse aktif otomatis saat login berdasarkan default warehouse akun; pemindahan eksklusif kontrol Pindah Warehouse ke dalam Menu Profil (menghapus tombol switcher di navbar header); penyesuaian FR-018, FR-019, Skema USERS 10.1, API 12, AC-11, dan TS-15. | 6 (FR-018, FR-019), 10.1, 12, 18 (AC-11), 19 (TS-15), 22.5 | Pemilik Produk |
| 2.2 | 19 Oktober 2026 | Impeccable Audit & Production Polish: standardisasi penyebutan 8 sheet pada FR-001, FR-002, 14.2; penyeragaman folder Drive (Warehouse Temperature Report/[Kode — Nama WH]/YYYY/MM - NamaBulan/) & format file ([YYYY-MM-DD]_[NamaLokasi]_[Jam].jpg) pada FR-013 & 4.1; pendaftaran endpoint POST /api/notifications/batch-alert pada Bagian 12; penyelarasan template WA tautan ganda OQ-02 pada 13.3; dokumentasi Min/Max, shift pill independen, dan 3 kolom sign-off A4 Landscape pada 16.1 & 16.2. | 4.1, 6 (FR-001, FR-002, FR-013), 12, 13.3, 14.2, 16.1, 16.2, 22.5 | Pemilik Produk |
| 2.3 | 20 Oktober 2026 | Replikasi Stempel Watermark Timemark Sociolla Lapangan & Safe Master Deletion: Standardisasi tata letak watermark foto 1:1 mengikuti format Timemark asli Sociolla (Logo Sociolla, Jam besar + divider vertikal, Hari/Tanggal, Alamat lengkap reverse-geocoded, Titik & Petugas, Kotak transparan koordinat, Perisai + Kode Foto 14-karakter); pendaftaran endpoint GET /api/reverse-geocode dengan fallback Nominatim; perbaikan UX Master Titik & Shift serta pencegahan penghapusan item master yang memiliki riwayat transaksi (safe deletion otomatis ke is_active = FALSE per BR-08). | 6 (FR-002, FR-008), 7 (BR-05, BR-06, BR-08), 12, 22.5 | Pemilik Produk |
| 2.4 | 20 Oktober 2026 | TestSprite E2E Reliability & Flow Hardening: Penerapan exponential backoff retry (3x) dan stale-while-revalidate pada Google Sheets API mengeliminasi HTTP 429; non-fatal audit log saat login admin (FR-001); penyediaan tabel ringkasan konsolidasi antargudang (warehouses_summary) dan completion metrics pada Dashboard Gabungan Admin (FR-019); fallback feed aktivitas terbaru saat transaksi hari berjalan 0 (FR-004); indikator dan toast status visual konfirmasi instan pada ekspor PDF (FR-017) dan Excel (FR-018); perluasan filter kategori audit log MASTER_MGMT mencakup WH_MGMT dan WH_ACCESS_MGMT (FR-016). | 6 (FR-001, FR-004, FR-016, FR-017, FR-018, FR-019), 10.6, 12, 14.5, 15.1, 19, 22.5 | Pemilik Produk |
| 2.5 | 20 Oktober 2026 | Configurable Idle Auto-Logout & Custom Session Timeout: Penambahan pengaturan batas waktu tidak aktif pengguna (auto-logout saat idle) pada menu Pengaturan Admin dengan pilihan preset (Nonaktif/0, 15m, 30m, 60m, 120m) serta opsi Kustom/Lainnya untuk input bebas menit atau jam; penyimpanan di sheet SETTINGS (idle_timeout_minutes ber-scope GLOBAL); modal peringatan hitung mundur 30 detik sebelum logout otomatis di AppShell; dan spanduk informasi pada layar login saat sesi kedaluwarsa karena idle. | 6 (FR-006), 8.1, 10.6, 12, 14, 22.5 | Pemilik Produk |
| 2.6 | 20 Oktober 2026 | Dynamic Watermark Branding & Zero-Hardcoded Fallbacks: Menjadikan logo brand teks pada stempel foto kamera sepenuhnya dinamis mengikuti konfigurasi Brand / Nama Aplikasi (`app_name` di sheet `SETTINGS` dengan fallback `'sociolla'`), dan fallback alamat stempel foto dinamis mengikuti nama Warehouse aktif saat geocoding offline; serta eliminasi seluruh fallback string statis warehouse (`CK01` / `Cikupa 1`) pada endpoint API transaksi, dashboard, notifikasi, dan laporan agar dinamis mengikuti data baris gudang pertama yang tersedia (`whRows[0]`). | 6 (FR-008), 7 (BR-05), 10.6, 12, 13.3, 22.5 | Pemilik Produk |
