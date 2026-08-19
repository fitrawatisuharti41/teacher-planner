-- ============================================================
-- Migration 020: Arsip Materi Umum — pisah per tingkat, kelompok per Bab
-- Jalankan di Supabase SQL Editor SETELAH migration-019
--
-- Sebelumnya arsip umum cuma dipisah per mapel (IPA/Prakarya), padahal
-- guru ini ngajar IPA di kelas 7 DAN 8 — jadi materinya kecampur. Juga
-- belum ada cara ngelompokkan banyak file/video jadi 1 "Bab" (kayak
-- playlist YouTube per bab).
-- ============================================================

alter table resources add column if not exists tingkat_umum text; -- '7' | '8', khusus arsip umum (kategori null)
alter table resources add column if not exists bab text;          -- judul bab/topik, buat ngelompokkan beberapa file/video

-- ============================================================
-- SELESAI — migration 020
-- ============================================================
