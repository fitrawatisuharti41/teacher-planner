-- ============================================================
-- Migration 013: Absensi Harian
-- Jalankan di Supabase SQL Editor SETELAH migration-012
--
-- Nambah constraint unik supaya 1 siswa cuma punya 1 status per
-- tanggal (dan bisa di-upsert dari halaman absensi baru).
-- ============================================================

alter table attendance
  add constraint attendance_student_tanggal_unique unique (student_id, tanggal);

-- ============================================================
-- SELESAI — migration 013
-- ============================================================
