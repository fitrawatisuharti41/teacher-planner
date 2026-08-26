-- =========================================================================
-- TAMBAH KUNCI JAWABAN ke practice_questions (Bank Soal / Gamifikasi)
-- Sebelumnya tabel ini cuma punya kolom pertanyaan (soal) tanpa opsi/kunci
-- sama sekali. Ditambah 2 kolom baru, keduanya NULLABLE supaya soal lama
-- yang sudah ada (tanpa kunci) tidak error/rusak.
--
-- Desain: PG biasa (satu jawaban benar), sama seperti soal PG di fitur
-- ulangan — konsisten dengan pola yang sudah ada di bank_soal_ulangan.
-- Kalau ternyata bentuk soalnya beda (isian, dsb), kasih tahu saya setelah
-- saya lihat kode bank-soal.html, tinggal saya sesuaikan lagi.
-- =========================================================================

alter table practice_questions
  add column if not exists opsi jsonb,            -- ["opsi A", "opsi B", "opsi C", "opsi D"]
  add column if not exists kunci_jawaban integer;  -- index jawaban benar (0-based), null = belum diisi

-- Cek hasil:
-- select column_name, data_type from information_schema.columns where table_name = 'practice_questions';
