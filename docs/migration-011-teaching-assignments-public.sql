-- ============================================================
-- Migration 011: Akses publik ke teaching_assignments
-- Jalankan di Supabase SQL Editor SETELAH migration-010
--
-- Dibutuhkan supaya Portal Siswa/Ortu bisa tahu mapel apa yang
-- diajarkan di suatu kelas (buat label "Ringkasan nilai IPA" /
-- "Ringkasan nilai Prakarya" di menu Penilaian, bukan generik
-- "semua mata pelajaran"). Isinya cuma mapel+kelas, bukan data
-- pribadi, jadi aman dibaca publik — sama seperti `classes`.
-- ============================================================

create policy "teaching_assignments_public_read" on teaching_assignments
  for select to anon using (true);

-- ============================================================
-- SELESAI — migration 011
-- ============================================================
