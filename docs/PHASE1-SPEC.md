# Teacher Planner (Free Forever Edition) — Phase 1: Analisis & Spesifikasi

## Tujuan
Aplikasi perencanaan mengajar pribadi untuk guru SMP di Indonesia. Gratis selamanya, mudah dipelihara bertahun-tahun, tanpa dependency yang berisiko deprecated.

## Profil guru

- **Nama:** Fitrawati Suharti, S.Tr.T (panggilan: Fita)
- **Mengajar:** IPA kelas 7A–7C & 8A, Prakarya kelas 7F–7I (roster kelas 7 masih menyusul, akan diacak & ditambah siswa baru)
- **Wali kelas:** 7C (tahun ajaran 2026/2027, 33 siswa)

## Kebutuhan non-fungsional

| Aspek | Requirement | Alasan |
|---|---|---|
| Biaya | Rp0 selamanya | Harus tetap dalam free tier Supabase: 500MB database, 1GB storage, 5GB egress/bulan, 50.000 monthly active users |
| Performa | Tanpa build step, tanpa framework berat | Device sering ganti (laptop pinjaman), koneksi sekolah kadang lambat |
| Kompatibilitas device | Laptop Windows + iPad Gen 9 | Wajib PWA (installable), wajib responsive di kedua form factor |
| Keamanan | RLS aktif di semua tabel | Data siswa (nama, nilai, kontak ortu) tidak boleh bocor lintas akun |
| Maintainability | Modular per file, native JS only | Menghindari breaking changes dari library pihak ketiga di masa depan |
| Efisiensi | Hindari polling, gunakan Realtime hanya jika perlu | Supabase free tier punya limit koneksi realtime concurrent |

## Spesifikasi fitur MVP

### 1. Login pengguna
- Email + password via Supabase Auth
- Session persist otomatis (tidak perlu login ulang tiap ganti device selama browser sama)
- Redirect ke dashboard setelah login sukses

### 2. Dashboard
- Greeting sesuai waktu (pagi/siang/sore)
- Jadwal mengajar hari ini (dari kalender)
- Daftar tugas yang mendekati deadline
- Ringkasan singkat: jumlah kelas, jumlah lesson plan draft

### 3. Kalender mengajar
- Tampilan bulan, minggu, hari
- CRUD event (judul, tanggal mulai/selesai, label warna)
- Tidak wajib drag-and-drop di MVP — bisa lewat form

### 4. Lesson Planner
- CRUD rencana pembelajaran per kelas & mata pelajaran
- Field: tujuan pembelajaran, materi, metode, media, asesmen, catatan
- Status: draft / final
- Filter berdasarkan kelas atau mapel

### 5. To-do List
- CRUD tugas pribadi (bukan tugas siswa)
- Prioritas (rendah/sedang/tinggi), deadline, checklist sederhana, progress %

### 6. Data kelas
- CRUD kelas (nama, tingkat, tahun ajaran)
- CRUD mata pelajaran

### 7. Data siswa
- CRUD siswa per kelas: nama, NIS, foto (opsional, via Supabase Storage), catatan perkembangan, kontak orang tua

### 8. Penilaian
- Input nilai siswa per asesmen
- Rekap nilai per kelas (rata-rata, distribusi sederhana)
- Tidak perlu analisis butir soal kompleks di MVP

### 9. Arsip materi
- Upload/simpan link file (PDF, dokumen, video, link eksternal)
- Tag dan pencarian sederhana

### 10. Refleksi mengajar
- Jurnal refleksi: harian, mingguan, semester
- Field: tanggal, tipe, konten teks bebas

### 11. Pengaturan
- Dark mode toggle
- Pilihan bahasa (ID/EN, opsional untuk MVP — boleh ID saja dulu)
- Notifikasi on/off

### 12. Portal Siswa (baru — akses tanpa akun)
- Siswa pilih nama + kelas sendiri (tanpa login) untuk masuk
- Lihat rekap kehadiran sendiri
- Lihat daftar nilai yang di bawah KKM
- Kerjakan remedial langsung di app: soal ditampilkan, siswa isi kolom jawaban, tersimpan ke database
- **Catatan keamanan:** karena tanpa autentikasi, identitas siswa tidak diverifikasi di level database — siapa pun yang tahu nama bisa memilihnya. Ini trade-off yang sama seperti app "Cek Tugas Saya" sebelumnya, diterima untuk MVP.

### 13. Modul Wali Kelas (baru — khusus kelas 7C)
- **Data Siswa 7C** — pakai tabel `students` yang sudah ada, ditambah kolom jenis_kelamin, asal_sekolah, nomor_hp
- **Agenda Kelas** — jadwal/kegiatan kelas per tanggal
- **Jurnal Wali Kelas** — catatan harian wali kelas
- **Kehadiran** — pakai tabel `attendance` yang sudah ada
- **Prestasi & Pelanggaran** — catatan per siswa, tipe prestasi/pelanggaran
- **Komunikasi Orang Tua** — log komunikasi per siswa (metode, ringkasan)
- **Administrasi Wali Kelas** — dokumen kelas (bebas kategori, terpisah dari arsip materi mengajar)
- **Dashboard Perkembangan Kelas** — ringkasan otomatis (persentase kehadiran, rata-rata nilai, jumlah prestasi/pelanggaran) lewat view `class_development_summary`

## Batasan teknis (wajib dipatuhi semua phase berikutnya)

- Tidak ada framework frontend (React/Vue/Angular/Next/Nuxt/Svelte/Tailwind/Bootstrap/jQuery)
- Tidak ada backend custom (Node/Express/PHP/Laravel) kecuali diminta eksplisit
- Semua akses data lewat Supabase REST API bawaan atau Supabase JS client resmi
- Query harus efisien — ambil data secukupnya (misal: siswa per kelas yang dibuka, bukan semua siswa sekaligus)
- Realtime Supabase hanya dipakai jika ada kebutuhan live update yang jelas (kemungkinan besar tidak diperlukan untuk single-user app)
- Semua kode modular per file sesuai domain (auth.js, calendar.js, dst.)

## Out of scope untuk MVP (bisa ditambah nanti)

- Multi-user / kolaborasi antar guru
- Analitik butir soal mendalam
- Import Excel otomatis (bisa manual dulu)
- Multi-bahasa penuh

## Checklist selesai Phase 1

- [x] 12 fitur MVP terdefinisi dengan sub-fungsi (termasuk Portal Siswa)
- [x] Profil guru & mata pelajaran yang diampu tercatat
- [x] Kebutuhan non-fungsional & batasan free-tier teridentifikasi
- [x] Batasan teknis (no-framework, no-backend-custom) terkunci
- [x] Model akses siswa (tanpa akun, pilih nama+kelas) dikunci
- [x] Scope MVP vs out-of-scope jelas
- [ ] Disetujui pengguna sebelum lanjut ke Phase 2
