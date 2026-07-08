# Teacher Planner (Free Forever Edition)

Aplikasi perencanaan mengajar untuk Fitrawati Suharti, S.Tr.T — guru IPA (kelas 7 & 8) dan Prakarya (kelas 7).

## Tech Stack

- HTML5 + CSS3 + Vanilla JavaScript (ES6+), tanpa framework
- PWA (installable, app-shell caching via `service-worker.js`)
- Hosting: GitHub Pages
- Backend: Supabase (Auth, Postgres, Storage)

## Struktur Project

Lihat `docs/` untuk dokumen tahapan pengembangan:
- `PHASE1-SPEC.md` — analisis kebutuhan & spesifikasi fitur
- `schema.sql` — skema database awal (jalankan hanya untuk instalasi baru dari nol)
- `migration-002-profil-administrasi.sql` — migration tambahan (jalankan setelah `schema.sql`)

## Setup

1. Buat project baru di [supabase.com](https://supabase.com) (free tier)
2. Jalankan `docs/schema.sql` di SQL Editor, lalu jalankan migration di urutan nomornya
3. Isi `SUPABASE_URL` dan `SUPABASE_ANON_KEY` di `js/config/supabase.js`
4. Deploy folder ini ke GitHub Pages (branch `main`, root folder)

## Portal Siswa

Folder `portal-siswa/` bisa diakses tanpa login — siswa pilih nama & kelas untuk lihat kehadiran, nilai di bawah KKM, dan mengerjakan remedial.

## Status Pengembangan

Progress mengikuti 9 phase — lihat `docs/` untuk detail tiap phase yang sudah selesai.
