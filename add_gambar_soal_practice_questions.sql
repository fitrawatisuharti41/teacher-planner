-- =========================================================================
-- TAMBAH gambar_url ke practice_questions — untuk gambar pendamping soal
-- (misal gambar organ pencernaan seperti contoh Quizizz), bukan gambar LKM
-- di level set (itu sudah ada di practice_sets.gambar_url).
-- Nullable, jadi soal lama tanpa gambar tetap aman.
--
-- Sekaligus tambah tipe_soal, supaya soal Esai (tanpa opsi/kunci jawaban)
-- juga bisa dibuat di Bank Soal, bukan cuma PG.
-- =========================================================================

alter table practice_questions
  add column if not exists gambar_url text,
  add column if not exists tipe_soal text not null default 'pg' check (tipe_soal in ('pg', 'esai'));
