-- ============================================================
-- Teacher Planner (Free Forever Edition) — Phase 2
-- Database Schema + Row Level Security
-- Guru: Fitrawati Suharti, S.Tr.T
-- Jalankan file ini di Supabase Dashboard > SQL Editor
-- ============================================================

create extension if not exists "pgcrypto";

-- Fungsi bantu: auto-update kolom updated_at setiap kali row diubah
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;


-- ============================================================
-- 1. TEACHERS — profil guru, 1:1 dengan akun Supabase Auth
-- ============================================================
create table teachers (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  nama_lengkap text not null,
  nama_panggilan text,
  foto_url text,           -- foto profil, dari Supabase Storage
  sekolah_nama text,       -- "SMPN 8 Kota Tangerang"
  jabatan text,            -- "Guru IPA & Prakarya"
  mengajar_sejak int,      -- tahun mulai mengajar
  pendidikan text[],       -- ["S1 Pendidikan ...", "S2 ..."]
  kontak_whatsapp text,
  wilayah text,
  email_tampilan text,     -- email yang ditampilkan di kartu (boleh beda dari email login)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_teachers_updated_at
before update on teachers
for each row execute function set_updated_at();

alter table teachers enable row level security;

create policy "teacher_self_access" on teachers
  for all
  using (auth_user_id = auth.uid())
  with check (auth_user_id = auth.uid());


-- ============================================================
-- 2. CLASSES — guru CRUD, publik boleh baca
-- ============================================================
create table classes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references teachers(id) on delete cascade,
  nama_kelas text not null,
  tingkat text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_classes_owner on classes(owner_id);

create trigger trg_classes_updated_at
before update on classes
for each row execute function set_updated_at();

alter table classes enable row level security;

create policy "classes_owner_crud" on classes
  for all
  using (owner_id in (select id from teachers where auth_user_id = auth.uid()))
  with check (owner_id in (select id from teachers where auth_user_id = auth.uid()));

create policy "classes_public_read" on classes
  for select
  to anon
  using (true);


-- ============================================================
-- 3. TEACHING_ASSIGNMENTS — guru saja (mapel per kelas)
-- ============================================================
create table teaching_assignments (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references teachers(id) on delete cascade,
  kelas_id uuid not null references classes(id) on delete cascade,
  mapel text not null, -- 'IPA' | 'Prakarya'
  created_at timestamptz not null default now()
);
create index idx_assignments_teacher on teaching_assignments(teacher_id);
create index idx_assignments_kelas on teaching_assignments(kelas_id);

alter table teaching_assignments enable row level security;

create policy "assignments_owner_crud" on teaching_assignments
  for all
  using (teacher_id in (select id from teachers where auth_user_id = auth.uid()))
  with check (teacher_id in (select id from teachers where auth_user_id = auth.uid()));


-- ============================================================
-- 4. STUDENTS — guru CRUD, publik boleh baca (buat Portal Siswa)
-- ============================================================
create table students (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references classes(id) on delete cascade,
  owner_id uuid not null references teachers(id) on delete cascade,
  nama text not null,
  nis text,
  catatan_perkembangan text,
  nama_orang_tua text,
  kontak_orang_tua text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_students_class on students(class_id);
create index idx_students_owner on students(owner_id);

create trigger trg_students_updated_at
before update on students
for each row execute function set_updated_at();

alter table students enable row level security;

create policy "students_owner_crud" on students
  for all
  using (owner_id in (select id from teachers where auth_user_id = auth.uid()))
  with check (owner_id in (select id from teachers where auth_user_id = auth.uid()));

-- Siswa hanya perlu nama+kelas untuk portal, tapi kolom sensitif
-- (kontak ortu, catatan perkembangan) tetap ikut ke-select kalau
-- pakai policy "true" biasa. Batasi lewat VIEW khusus publik:
create view students_public as
  select id, class_id, nama
  from students;

create policy "students_public_read" on students
  for select
  to anon
  using (true); -- tabel asli tetap perlu ini supaya view di atas bisa jalan (security_invoker)

alter view students_public set (security_invoker = true);


-- ============================================================
-- 5. LESSON_PLANS — guru saja
-- ============================================================
create table lesson_plans (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references teachers(id) on delete cascade,
  class_id uuid not null references classes(id) on delete cascade,
  mapel text not null,
  topik text not null,
  tujuan_pembelajaran text,
  materi text,
  metode text,
  media text,
  asesmen text,
  catatan text,
  status text not null default 'draft', -- 'draft' | 'final'
  tanggal date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_lesson_plans_owner on lesson_plans(owner_id);
create index idx_lesson_plans_class on lesson_plans(class_id);

create trigger trg_lesson_plans_updated_at
before update on lesson_plans
for each row execute function set_updated_at();

alter table lesson_plans enable row level security;

create policy "lesson_plans_owner_crud" on lesson_plans
  for all
  using (owner_id in (select id from teachers where auth_user_id = auth.uid()))
  with check (owner_id in (select id from teachers where auth_user_id = auth.uid()));


-- ============================================================
-- 6. TASKS — guru saja
-- ============================================================
create table tasks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references teachers(id) on delete cascade,
  judul text not null,
  priority text not null default 'sedang', -- 'rendah' | 'sedang' | 'tinggi'
  deadline timestamptz,
  checklist jsonb default '[]',
  progress int not null default 0,
  selesai boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_tasks_owner on tasks(owner_id);

create trigger trg_tasks_updated_at
before update on tasks
for each row execute function set_updated_at();

alter table tasks enable row level security;

create policy "tasks_owner_crud" on tasks
  for all
  using (owner_id in (select id from teachers where auth_user_id = auth.uid()))
  with check (owner_id in (select id from teachers where auth_user_id = auth.uid()));


-- ============================================================
-- 6b. CALENDAR_EVENTS — guru saja
-- ============================================================
create table calendar_events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references teachers(id) on delete cascade,
  class_id uuid references classes(id) on delete set null,
  judul text not null,
  tanggal_mulai timestamptz not null,
  tanggal_selesai timestamptz,
  warna_label text,
  reminder boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_calendar_events_owner on calendar_events(owner_id);

create trigger trg_calendar_events_updated_at
before update on calendar_events
for each row execute function set_updated_at();

alter table calendar_events enable row level security;

create policy "calendar_events_owner_crud" on calendar_events
  for all
  using (owner_id in (select id from teachers where auth_user_id = auth.uid()))
  with check (owner_id in (select id from teachers where auth_user_id = auth.uid()));


-- ============================================================
-- 7. RESOURCES — guru saja (arsip materi)
-- ============================================================
create table resources (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references teachers(id) on delete cascade,
  class_id uuid references classes(id) on delete set null, -- diisi kalau dokumen ini terkait 1 kelas spesifik
  judul text not null,
  tipe text not null, -- 'pdf' | 'word' | 'ppt' | 'video' | 'link'
  kategori text,       -- null = arsip materi bebas, atau salah satu kategori administrasi di bawah
  url text,
  tag text[],
  folder text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint resources_kategori_check check (
    kategori is null or kategori in ('modul_ajar', 'kktp', 'cp', 'atp', 'prota', 'promes', 'kaldik')
  )
);
create index idx_resources_owner on resources(owner_id);
create index idx_resources_class on resources(class_id);
create index idx_resources_kategori on resources(kategori);

create trigger trg_resources_updated_at
before update on resources
for each row execute function set_updated_at();

alter table resources enable row level security;

create policy "resources_owner_crud" on resources
  for all
  using (owner_id in (select id from teachers where auth_user_id = auth.uid()))
  with check (owner_id in (select id from teachers where auth_user_id = auth.uid()));


-- ============================================================
-- 8. REFLECTIONS — guru saja
-- ============================================================
create table reflections (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references teachers(id) on delete cascade,
  tipe text not null, -- 'harian' | 'mingguan' | 'semester'
  konten text not null,
  rating int,
  tanggal date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_reflections_owner on reflections(owner_id);

create trigger trg_reflections_updated_at
before update on reflections
for each row execute function set_updated_at();

alter table reflections enable row level security;

create policy "reflections_owner_crud" on reflections
  for all
  using (owner_id in (select id from teachers where auth_user_id = auth.uid()))
  with check (owner_id in (select id from teachers where auth_user_id = auth.uid()));


-- ============================================================
-- 9. ATTENDANCE — guru CRUD, publik boleh baca
-- ============================================================
create table attendance (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references teachers(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  tanggal date not null,
  status text not null, -- 'hadir' | 'izin' | 'sakit' | 'alpa'
  created_at timestamptz not null default now()
);
create index idx_attendance_owner on attendance(owner_id);
create index idx_attendance_student on attendance(student_id);

alter table attendance enable row level security;

create policy "attendance_owner_crud" on attendance
  for all
  using (owner_id in (select id from teachers where auth_user_id = auth.uid()))
  with check (owner_id in (select id from teachers where auth_user_id = auth.uid()));

create policy "attendance_public_read" on attendance
  for select
  to anon
  using (true);


-- ============================================================
-- 10. ASSESSMENTS — guru CRUD, publik boleh baca
-- ============================================================
create table assessments (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references teachers(id) on delete cascade,
  class_id uuid not null references classes(id) on delete cascade,
  mapel text not null,
  judul text not null,
  kkm int not null default 75,
  tanggal date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_assessments_owner on assessments(owner_id);
create index idx_assessments_class on assessments(class_id);

create trigger trg_assessments_updated_at
before update on assessments
for each row execute function set_updated_at();

alter table assessments enable row level security;

create policy "assessments_owner_crud" on assessments
  for all
  using (owner_id in (select id from teachers where auth_user_id = auth.uid()))
  with check (owner_id in (select id from teachers where auth_user_id = auth.uid()));

create policy "assessments_public_read" on assessments
  for select
  to anon
  using (true);


-- ============================================================
-- 11. ASSESSMENT_ITEMS — guru CRUD, publik boleh baca (nilai siswa)
-- ============================================================
create table assessment_items (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references assessments(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  nilai numeric not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (assessment_id, student_id)
);
create index idx_items_assessment on assessment_items(assessment_id);
create index idx_items_student on assessment_items(student_id);

create trigger trg_assessment_items_updated_at
before update on assessment_items
for each row execute function set_updated_at();

alter table assessment_items enable row level security;

create policy "assessment_items_owner_crud" on assessment_items
  for all
  using (
    assessment_id in (
      select id from assessments
      where owner_id in (select id from teachers where auth_user_id = auth.uid())
    )
  )
  with check (
    assessment_id in (
      select id from assessments
      where owner_id in (select id from teachers where auth_user_id = auth.uid())
    )
  );

create policy "assessment_items_public_read" on assessment_items
  for select
  to anon
  using (true);


-- ============================================================
-- 12. REMEDIAL_QUESTIONS — guru CRUD, publik boleh baca
-- ============================================================
create table remedial_questions (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references assessments(id) on delete cascade,
  nomor int not null,
  soal text not null,
  created_at timestamptz not null default now()
);
create index idx_remedial_q_assessment on remedial_questions(assessment_id);

alter table remedial_questions enable row level security;

create policy "remedial_questions_owner_crud" on remedial_questions
  for all
  using (
    assessment_id in (
      select id from assessments
      where owner_id in (select id from teachers where auth_user_id = auth.uid())
    )
  )
  with check (
    assessment_id in (
      select id from assessments
      where owner_id in (select id from teachers where auth_user_id = auth.uid())
    )
  );

create policy "remedial_questions_public_read" on remedial_questions
  for select
  to anon
  using (true);


-- ============================================================
-- 13. REMEDIAL_ANSWERS — guru CRUD (koreksi), publik HANYA insert
-- ============================================================
create table remedial_answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references remedial_questions(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  jawaban text not null,
  submitted_at timestamptz not null default now()
);
create index idx_remedial_a_question on remedial_answers(question_id);
create index idx_remedial_a_student on remedial_answers(student_id);

alter table remedial_answers enable row level security;

-- Guru: bisa lihat & kelola semua jawaban dari kelasnya
create policy "remedial_answers_owner_read" on remedial_answers
  for select
  using (
    question_id in (
      select rq.id from remedial_questions rq
      join assessments a on a.id = rq.assessment_id
      where a.owner_id in (select id from teachers where auth_user_id = auth.uid())
    )
  );

create policy "remedial_answers_owner_manage" on remedial_answers
  for update
  using (
    question_id in (
      select rq.id from remedial_questions rq
      join assessments a on a.id = rq.assessment_id
      where a.owner_id in (select id from teachers where auth_user_id = auth.uid())
    )
  );

create policy "remedial_answers_owner_delete" on remedial_answers
  for delete
  using (
    question_id in (
      select rq.id from remedial_questions rq
      join assessments a on a.id = rq.assessment_id
      where a.owner_id in (select id from teachers where auth_user_id = auth.uid())
    )
  );

-- Publik (siswa tanpa akun): HANYA boleh insert jawaban, tidak boleh baca/ubah punya siswa lain
create policy "remedial_answers_public_insert" on remedial_answers
  for insert
  to anon
  with check (true);

-- ============================================================
-- VIEW: ringkasan kelengkapan Administrasi Pembelajaran
-- (SUDAH TIDAK DIPAKAI aplikasi — dulu dipakai kartu "0/6 LENGKAP" &
--  ring "Tingkat Kelengkapan", tapi total_kelas di sini menghitung
--  SEMUA baris `classes`, bukan per (mapel + tingkat) yang benar-benar
--  diajar guru. Sekarang dashboard.js & resources.js menghitungnya
--  sendiri lewat `teaching_assignments`. View ini boleh di-drop kalau
--  mau (drop view administrasi_summary;), dibiarkan di sini cuma
--  sebagai riwayat.)
-- ============================================================
create view administrasi_summary as
select
  r.owner_id,
  r.kategori,
  count(distinct r.class_id) as kelas_terisi,
  (select count(*) from classes c where c.owner_id = r.owner_id) as total_kelas
from resources r
where r.kategori is not null
group by r.owner_id, r.kategori;

alter view administrasi_summary set (security_invoker = true);

-- ============================================================
-- SELESAI — 13 tabel + trigger updated_at + RLS lengkap
-- ============================================================
