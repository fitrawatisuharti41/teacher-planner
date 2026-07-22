-- ============================================================
-- Migration 016: Hubungkan Lesson Planner ke Modul Ajar (Arsip & Administrasi)
-- Biar guru gak perlu nulis ulang tujuan/materi/metode/dst di 2 tempat.
-- ============================================================

alter table lesson_plans add column if not exists modul_ajar_id uuid references resources(id) on delete set null;

-- Arsip Materi Umum juga perlu tau mapelnya, biar bisa dipisah IPA vs Prakarya di Portal Ortu
alter table resources add column if not exists mapel_umum text; -- 'IPA' | 'Prakarya', khusus untuk arsip umum (kategori null)

-- ============================================================
-- SELESAI — migration 016
-- ============================================================
