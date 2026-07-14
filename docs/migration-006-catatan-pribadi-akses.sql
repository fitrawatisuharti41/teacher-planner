-- ============================================================
-- Migration 006: Akses publik ke student_notes (Catatan Pribadi per anak)
-- Sama pola dengan tabel publik lain: SELECT dibuka, tapi query di app
-- selalu difilter by student_id spesifik (bukan tampilkan semua).
-- ============================================================

create policy "student_notes_public_read" on student_notes
  for select
  to anon
  using (true);
