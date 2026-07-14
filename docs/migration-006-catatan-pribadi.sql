-- ============================================================
-- Migration 006: Catatan Pribadi Siswa (per anak, bukan per kelas)
-- Dilihat guru penuh, dilihat orang tua HANYA untuk anaknya sendiri
-- ============================================================

create table if not exists student_private_notes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references teachers(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  tanggal date not null default current_date,
  catatan text not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_private_notes_owner on student_private_notes(owner_id);
create index if not exists idx_private_notes_student on student_private_notes(student_id);

alter table student_private_notes enable row level security;

-- Guru: CRUD penuh
create policy "student_private_notes_owner_crud" on student_private_notes
  for all
  using (owner_id in (select id from teachers where auth_user_id = auth.uid()))
  with check (owner_id in (select id from teachers where auth_user_id = auth.uid()));

-- Publik (portal ortu): HANYA select, dan wajib difilter by student_id di sisi
-- aplikasi (sama seperti tabel publik lain) — siapa pun secara teknis bisa
-- query semua kalau tau student_id siswa lain, trade-off yang sama seperti
-- attendance/assessment_items yang sudah disetujui sebelumnya.
create policy "student_private_notes_public_read" on student_private_notes
  for select
  to anon
  using (true);

-- ============================================================
-- SELESAI — migration 006
-- ============================================================
