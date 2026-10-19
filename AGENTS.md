# AGENTS.md — Aturan Kerja untuk AI di Repo Ini

Repo ini membangun **Warehouse Temperature Report**, aplikasi web pencatatan suhu warehouse. Semua AI coding assistant atau agen yang bekerja di sini wajib mengikuti file ini.

## 1. Dokumen Sumber Kebenaran

| Dokumen | Isi | Prioritas |
| --- | --- | --- |
| `docs/PRD.md` | Fungsi, aturan bisnis, skema data, API, keamanan, pengujian | **Tertinggi.** Kode mengikuti PRD. |
| `docs/DESIGN.md` | Token, komponen, tata letak, bahasa antarmuka, aksesibilitas | Mengatur tampilan. Jika bertentangan dengan PRD, PRD menang. |
| `AGENTS.md` (file ini) | Cara AI bekerja | Mengikat proses kerja. |

**Sebelum mengerjakan tugas apa pun, baca bagian PRD yang relevan.** Untuk pekerjaan antarmuka, baca juga `docs/DESIGN.md`.

## 2. Stack yang Ditetapkan (Tidak Boleh Diganti)

* Kode sumber di GitHub; hosting frontend dan backend di **Vercel** (serverless API / full-stack).
* Database: **Google Sheets** lewat Google Sheets REST API v4, memakai Google Service Account dari backend.
* Foto bukti: **Google Drive** lewat Google Drive REST API v3, folder otomatis `Warehouse Temperature Report / [Kode — Nama WH] / YYYY / MM - NamaBulan/`.
* Notifikasi: **Fonnte API** dari backend Vercel.
* **Dilarang keras Google Apps Script** dalam bentuk apa pun (`Code.gs`, `doGet()`, `doPost()`, Web App Apps Script).
* Hanya ada 8 sheet: `USERS`, `MASTER_WAREHOUSE`, `USER_WAREHOUSE_ACCESS`, `MASTER_LOKASI`, `MASTER_PERIODE`, `SETTINGS`, `TRANSAKSI_SUHU`, `AUDIT_LOGS`. Jangan membuat sheet per bulan.

## 3. Aturan Mutlak

1. **Jangan menyimpang dari PRD.** Jangan mengubah stack, menambah sheet atau kolom di luar skema, mengubah nama atau kontrak endpoint, atau melanggar Business Rules BR-01 sampai BR-11.
2. **Jangan berasumsi sepihak.** Jika PRD tidak jelas atau ada dua tafsir, berhenti dan tanyakan. Catat di PRD Bagian 21.1 (Open Questions) setelah dijawab atau disetujui.
3. **Jangan menambah fitur diam-diam.** Fitur, field, atau perilaku yang tidak ada di PRD butuh persetujuan pemilik produk lebih dulu.
4. **Rahasia tidak boleh masuk repo.** Hanya boleh di Vercel Environment Variables:
   `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`, `GOOGLE_SHEET_ID`, `GOOGLE_DRIVE_ROOT_FOLDER_ID`, `JWT_SECRET_KEY`, `FONNTE_API_TOKEN`, `FONNTE_WA_GROUP_ID`, `SETUP_KEY` (kunci sementara untuk inisialisasi `/api/init`, wajib dihapus dari Vercel setelah selesai).
   Jangan menulis nilainya di kode, di `.env` yang ikut commit, di sheet `SETTINGS`, di log, atau di pesan error. Pastikan `.env*` masuk `.gitignore` dan sediakan `.env.example` berisi nama variabel saja.
5. **Otorisasi selalu di backend.** Menyembunyikan menu di UI bukan pengamanan. Setiap endpoint `/api/admin/*`, `PUT /api/transactions/[id]`, dan input tanggal selain hari ini memeriksa `role` dari token sesi.
6. **Password hanya di-hash dengan bcrypt** (minimal 10 salt rounds). Jangan pernah menyimpan atau mencatat password asli (akun awal `admin` / `admin123` hanya dibuat saat inisialisasi, FR-001).
7. **Zona waktu** semua penentuan "hari ini", folder Tahun/Bulan, dan waktu laporan memakai `Asia/Jakarta` di backend (NFR-03), bukan zona waktu perangkat atau server.
8. **Data kosong bukan nol.** Jangan pernah mengubah slot yang belum diinput menjadi `0` atau `0,0°C` (BR-09).
9. **Kamera perangkat.** Foto bukti diambil melalui pemicu kamera perangkat `capture="environment"` (BR-05 / FR-008 disesuaikan pada PRD v1.3). Jangan menyediakan galeri picker umum yang tidak mengarah ke kamera.
10. **GPS jujur.** Jangan membuat koordinat palsu atau default (BR-06). Catat `server_received_at` di server sebagai acuan audit.
11. **Jangan hapus data historis.** Lokasi dan jadwal yang sudah punya transaksi hanya boleh dinonaktifkan (BR-08).
12. **Kegagalan Fonnte tidak boleh menggagalkan penyimpanan transaksi** (FR-014).

## 4. Alur Jika Ada Perubahan atau Kebutuhan Baru

PRD adalah dokumen hidup. Setiap perubahan yang memengaruhi fungsi, aturan bisnis, skema, API, keamanan, atau UI mengikuti alur ini (PRD Bagian 22.2):

1. **Usulkan** perubahan beserta bagian PRD yang terdampak (ID FR/BR/AC/TS, skema, endpoint).
2. **Tunggu persetujuan** pemilik produk.
3. **Perbarui PRD** (semua bagian yang terdampak, bukan satu bagian saja) bersamaan atau sebelum kode.
4. **Isi Change Log** PRD Bagian 22.5: naikkan versi, tanggal, ringkasan, bagian terdampak.
5. **Baru implementasikan** kode mengikuti PRD yang sudah diperbarui.

Contoh dampak berantai: kolom baru di `TRANSAKSI_SUHU` berarti Bagian 10.5, Bagian 12 (API), Bagian 16 (jika memengaruhi laporan), dan Bagian 19 (skenario uji) ikut diperbarui.

Perubahan kecil tanpa dampak perilaku (perbaikan teks, refactor internal) tidak perlu mengubah PRD, tetapi tidak boleh melanggarnya.

Jika permintaan pengguna bertentangan dengan PRD: sebutkan bagian PRD yang bertentangan, lalu minta keputusan (ikuti PRD, atau ubah PRD dulu).

## 5. Pekerjaan Antarmuka

* Ikuti `docs/DESIGN.md` untuk token, komponen, tata letak, dan bahasa antarmuka. Jangan menulis hex, ukuran, atau jarak langsung di komponen; pakai token.
* Teks antarmuka memakai nama aksi baku dan pesan sistem dari DESIGN.md Bagian 7. Pesan BR-03 harus **persis** seperti di PRD.
* Hindari pola desain generik yang dilarang di DESIGN.md Bagian 9.
* Sebelum selesai, jalankan daftar periksa DESIGN.md Bagian 11 dan periksa tampilan di lebar 360 px, 768 px, dan 1440 px.

## 6. Cara Menulis Kode

* Ikuti struktur, bahasa, dan konvensi yang sudah ada di repo. Jangan memperkenalkan pustaka atau pola baru tanpa alasan yang disebut jelas di ringkasan akhir. Pustaka baru yang memengaruhi stack butuh persetujuan lebih dulu.
* Validasi semua input di backend (tanggal, suhu numerik, ukuran dan tipe foto, `idempotency_key`). Jangan percaya data dari klien.
* Operasi baca ke Google Sheets memakai `batchGet` bila memungkinkan agar tidak menembus kuota (PRD 21.2).
* Penulisan transaksi mengikuti mitigasi konkurensi PRD 15.1: cek sebelum unggah, cek sebelum tulis, verifikasi pascatulis, dan idempotency key.
* Pesan error ke klien tidak boleh membocorkan stack trace, kunci privat, atau token (PRD 14.5).
* Jangan menulis komentar yang hanya mengulang kode. Beri komentar untuk alasan di balik keputusan yang tidak jelas, dan rujuk ID PRD bila relevan (misal `// BR-03`).

## 7. Commit dan Pull Request

* Pesan commit dan judul PR mencantumkan ID PRD yang dikerjakan, contoh: `feat(transactions): tolak timpa data oleh Member [FR-011, BR-03]`.
* Satu PR untuk satu tujuan. PR yang mengubah perilaku wajib menyertakan perubahan `docs/PRD.md` dan Change Log di PR yang sama.
* Perubahan pada `docs/PRD.md` ditinjau pemilik produk sebelum digabung.

## 8. Definition of Done

Tugas selesai hanya jika semua poin terpenuhi:

* Hasil sesuai PRD terbaru: stack, skema, API, dan Business Rules tidak dilanggar.
* Jika perilaku berubah, PRD dan Change Log sudah diperbarui.
* Acceptance Criteria terkait (PRD Bagian 6 dan 18) dan skenario uji terkait (Bagian 19) sudah diperiksa, dan hasilnya disebut di ringkasan.
* Tidak ada rahasia di kode, repo, log, atau sheet `SETTINGS`.
* Untuk antarmuka: daftar periksa DESIGN.md Bagian 11 terpenuhi.
* **Ringkasan akhir** menyebut: apa yang dikerjakan, ID PRD yang dipenuhi, apa yang belum dikerjakan, dan pertanyaan terbuka yang muncul.

## 9. Kapan Harus Berhenti dan Bertanya

* PRD diam atau ambigu tentang hal yang memengaruhi data, keamanan, atau alur pengguna.
* Permintaan bertentangan dengan PRD.
* Pekerjaan memerlukan penggantian stack, penambahan layanan baru, atau akses ke kredensial.
* Ada keputusan yang masih tercatat sebagai Open Question (OQ-01 sampai OQ-03) dan pekerjaan bergantung padanya. Pakai opsi default sementara hanya jika pemilik produk sudah menyetujuinya.
