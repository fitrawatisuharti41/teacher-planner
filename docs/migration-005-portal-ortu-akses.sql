-- ============================================================
-- Migration 005: Akses publik untuk Portal Siswa & Orang Tua
-- (arsip materi umum + profil wali kelas untuk kontak)
-- ============================================================

-- 1. Arsip materi umum (kategori null) boleh dibaca publik.
--    Dokumen administrasi ber-kategori (modul_ajar, kktp, dst) TETAP privat.
create policy "resources_public_read_general" on resources
  for select
  to anon
  using (kategori is null);

-- 2. Profil guru dasar (buat kartu "Hubungi Wali Kelas") — kolom terbatas via view
create policy "teachers_public_read_base" on teachers
  for select
  to anon
  using (true);

create view teachers_public as
  select id, nama_lengkap, nama_panggilan, sekolah_nama, jabatan, kontak_whatsapp, foto_url
  from teachers;

alter view teachers_public set (security_invoker = true);

-- ============================================================
-- SELESAI — migration 005
-- ============================================================
