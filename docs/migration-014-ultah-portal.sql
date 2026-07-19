-- ============================================================
-- Migration 014: Expose tanggal_lahir di students_public
-- (buat nampilin banner ulang tahun di Portal Ortu/Siswa)
-- ============================================================

drop view if exists students_public;

create view students_public as
  select id, class_id, nama, tanggal_lahir, catatan_perkembangan
  from students;

alter view students_public set (security_invoker = true);

-- ============================================================
-- SELESAI — migration 014
-- ============================================================
