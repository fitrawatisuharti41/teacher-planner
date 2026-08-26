-- =========================================================================
-- LATIHAN BERULANG + SKORING: tabel practice_attempts + kolom tambahan di
-- practice_answers, supaya siswa bisa coba berkali-kali dan lihat progres.
-- =========================================================================

create table if not exists practice_attempts (
  id uuid primary key default gen_random_uuid(),
  practice_set_id uuid not null references practice_sets(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  skor numeric not null default 0,
  skor_maksimal numeric not null default 0,
  submitted_at timestamptz not null default now()
);

create index if not exists idx_attempts_set_student on practice_attempts(practice_set_id, student_id);

-- Hubungkan tiap jawaban ke percobaan tertentu (biar tidak campur antar
-- percobaan), dan catat benar/salah per soal PG (null untuk esai).
alter table practice_answers
  add column if not exists attempt_id uuid references practice_attempts(id) on delete cascade,
  add column if not exists benar boolean;

-- RLS untuk tabel baru: siswa (tanpa auth) boleh insert bebas, guru pemilik
-- set soal boleh lihat semua percobaan siswanya (pola sama seperti fitur
-- ulangan — pakai current_teacher_id() yang sudah dibuat sebelumnya).
alter table practice_attempts enable row level security;

drop policy if exists "publik insert percobaan" on practice_attempts;
create policy "publik insert percobaan" on practice_attempts
  for insert with check (true);

drop policy if exists "publik lihat percobaan sendiri" on practice_attempts;
create policy "publik lihat percobaan sendiri" on practice_attempts
  for select using (true);

drop policy if exists "guru lihat percobaan di set miliknya" on practice_attempts;
create policy "guru lihat percobaan di set miliknya" on practice_attempts
  for select using (exists (
    select 1 from practice_sets ps where ps.id = practice_set_id and ps.owner_id = current_teacher_id()
  ));
