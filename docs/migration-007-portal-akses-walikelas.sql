-- ============================================================
-- Migration 007: Akses publik untuk fitur Wali Kelas di Portal Ortu
-- ============================================================

create policy "class_agenda_public_read" on class_agenda
  for select to anon using (true);

create policy "student_achievements_public_read" on student_achievements
  for select to anon using (true);

create policy "parent_communications_public_read" on parent_communications
  for select to anon using (true);

create policy "homeroom_documents_public_read" on homeroom_documents
  for select to anon using (true);

-- ============================================================
-- SELESAI — migration 007
-- ============================================================
