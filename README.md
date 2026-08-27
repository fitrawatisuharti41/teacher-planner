# Teacher Planner — Update Bundle

Struktur folder di zip ini SUDAH mengikuti struktur repo GitHub kamu — tinggal
salin masing-masing ke path yang sama persis di repo `teacher-planner`.

## 1. Fitur Ulangan (anti-cheat, auto-grading)
- `ulangan.html` → taruh di **root** repo
- `supabase/functions/grade-ulangan/index.ts` → deploy lewat Supabase Dashboard
  → Edge Functions → Deploy via Editor (bukan lewat GitHub)
- `sql/0_reset_ulangan_tables.sql` sampai `sql/3_insert_soal_bab1_ipa8.sql`
  → jalankan berurutan sesuai nomornya di Supabase SQL Editor

⚠️ Cek dulu URL Edge Function di dashboard Supabase kamu — kalau slug-nya
BUKAN `grade-ulangan`, buka `ulangan.html`, cari baris `EDGE_FUNCTION_URL`,
sesuaikan dengan slug asli yang ada di dashboard.

## 2. Bank Soal (latihan berulang + skor + riwayat)
- `bank-soal.html` (root ini) → taruh di **root** repo (halaman guru, kelola soal)
- `js/bank-soal.js` → taruh di **`js/`** (logic guru: buat set, tambah soal PG/Esai)
- `portal-ortu/bank-soal.html` → taruh di **`portal-ortu/`** (halaman siswa,
  mengerjakan + lihat skor + riwayat percobaan)
- `sql/4_add_kunci_jawaban_practice_questions.sql`,
  `sql/5_add_gambar_soal_practice_questions.sql`,
  `sql/6_add_practice_attempts.sql` → jalankan berurutan di Supabase SQL Editor

⚠️ Dua file `bank-soal.html` di zip ini BEDA — satu di root (guru), satu di
`portal-ortu/` (siswa). Jangan sampai tertukar/tercampur seperti kejadian
kemarin.

## 3. Arsip Materi (sampul gambar asli, bukan ikon)
- `portal-ortu/arsip.html` → taruh di **`portal-ortu/`** (menimpa yang lama)

## Urutan disarankan kalau mulai dari nol
1. Jalankan semua file di `sql/` sesuai urutan angkanya
2. Upload semua file HTML/JS ke path masing-masing (lihat di atas)
3. Deploy Edge Function `grade-ulangan` lewat Supabase Dashboard
4. Aktifkan sesi ulangan (`UPDATE sesi_ulangan SET status='aktif' ...`)
5. Tes dari sisi siswa: ulangan dulu, baru bank soal
