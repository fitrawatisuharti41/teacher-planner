-- ============================================================
-- Migration 004: Bank Soal Latihan (interaktif, untuk SEMUA siswa
-- di kelas tsb — beda dari remedial yang cuma untuk siswa di bawah KKM)
-- ============================================================

-- 1. Set soal latihan (dikelompokkan per kelas + mapel)
create table if not exists practice_sets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references teachers(id) on delete cascade,
  class_id uuid not null references classes(id) on delete cascade,
  mapel text not null,
  judul text not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_practice_sets_owner on practice_sets(owner_id);
create index if not exists idx_practice_sets_class on practice_sets(class_id);

alter table practice_sets enable row level security;

create policy "practice_sets_owner_crud" on practice_sets
  for all
  using (owner_id in (select id from teachers where auth_user_id = auth.uid()))
  with check (owner_id in (select id from teachers where auth_user_id = auth.uid()));

create policy "practice_sets_public_read" on practice_sets
  for select
  to anon
  using (true);

-- 2. Soal per set
create table if not exists practice_questions (
  id uuid primary key default gen_random_uuid(),
  practice_set_id uuid not null references practice_sets(id) on delete cascade,
  nomor int not null,
  soal text not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_practice_questions_set on practice_questions(practice_set_id);

alter table practice_questions enable row level security;

create policy "practice_questions_owner_crud" on practice_questions
  for all
  using (
    practice_set_id in (
      select id from practice_sets where owner_id in (select id from teachers where auth_user_id = auth.uid())
    )
  )
  with check (
    practice_set_id in (
      select id from practice_sets where owner_id in (select id from teachers where auth_user_id = auth.uid())
    )
  );

create policy "practice_questions_public_read" on practice_questions
  for select
  to anon
  using (true);

-- 3. Jawaban siswa (publik hanya boleh INSERT, sama seperti remedial_answers)
create table if not exists practice_answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references practice_questions(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  jawaban text not null,
  submitted_at timestamptz not null default now()
);
create index if not exists idx_practice_answers_question on practice_answers(question_id);
create index if not exists idx_practice_answers_student on practice_answers(student_id);

alter table practice_answers enable row level security;

create policy "practice_answers_owner_read" on practice_answers
  for select
  using (
    question_id in (
      select pq.id from practice_questions pq
      join practice_sets ps on ps.id = pq.practice_set_id
      where ps.owner_id in (select id from teachers where auth_user_id = auth.uid())
    )
  );

create policy "practice_answers_public_insert" on practice_answers
  for insert
  to anon
  with check (true);

-- ============================================================
-- SELESAI — migration 004
-- ============================================================
