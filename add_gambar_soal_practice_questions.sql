-- =========================================================================
-- TAMBAH gambar_url ke practice_questions — untuk gambar pendamping soal
-- (misal gambar organ pencernaan seperti contoh Quizizz), bukan gambar LKM
-- di level set (itu sudah ada di practice_sets.gambar_url).
-- Nullable, jadi soal lama tanpa gambar tetap aman.
-- =========================================================================

alter table practice_questions
  add column if not exists gambar_url text;
