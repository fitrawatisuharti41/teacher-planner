-- ============================================================
-- Migration 019: Link Gamifikasi di Bank Soal
-- (Terpisah dari migration-018 karena itu sudah pernah dijalankan —
-- kalau migration-018 di-run ulang, bagian policy-nya bakal error
-- "already exists". Ini aman dijalankan sendiri.)
-- ============================================================

alter table practice_sets add column if not exists link_gamifikasi text; -- Wordwall/Quizizz/Educaplay/dsb

-- ============================================================
-- SELESAI — migration 019
-- ============================================================
