-- ============================================================
-- Migration 003: Modul Wali Kelas
-- Jalankan di Supabase SQL Editor SETELAH migration-002
-- ============================================================

-- 1. Tandai kelas mana yang diampu sebagai WALI KELAS (beda dari
--    teaching_assignments yang soal mata pelajaran)
alter table classes add column if not exists wali_kelas_id uuid references teachers(id);

-- 2. Data tambahan siswa (dari form MPLS: L/P, asal SD, no HP)
alter table students add column if not exists jenis_kelamin text; -- 'L' | 'P'
alter table students add column if not exists asal_sekolah text;
alter table students add column if not exists nomor_hp text;

-- ============================================================
-- 3. AGENDA KELAS
-- ============================================================
create table if not exists class_agenda (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references teachers(id) on delete cascade,
  class_id uuid not null references classes(id) on delete cascade,
  tanggal date not null,
  judul text not null,
  deskripsi text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_class_agenda_owner on class_agenda(owner_id);
create index if not exists idx_class_agenda_class on class_agenda(class_id);

create trigger trg_class_agenda_updated_at
before update on class_agenda
for each row execute function set_updated_at();

alter table class_agenda enable row level security;

create policy "class_agenda_owner_crud" on class_agenda
  for all
  using (owner_id in (select id from teachers where auth_user_id = auth.uid()))
  with check (owner_id in (select id from teachers where auth_user_id = auth.uid()));

-- ============================================================
-- 4. JURNAL WALI KELAS
-- ============================================================
create table if not exists homeroom_journals (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references teachers(id) on delete cascade,
  class_id uuid not null references classes(id) on delete cascade,
  tanggal date not null default current_date,
  catatan text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_homeroom_journals_owner on homeroom_journals(owner_id);
create index if not exists idx_homeroom_journals_class on homeroom_journals(class_id);

create trigger trg_homeroom_journals_updated_at
before update on homeroom_journals
for each row execute function set_updated_at();

alter table homeroom_journals enable row level security;

create policy "homeroom_journals_owner_crud" on homeroom_journals
  for all
  using (owner_id in (select id from teachers where auth_user_id = auth.uid()))
  with check (owner_id in (select id from teachers where auth_user_id = auth.uid()));

-- ============================================================
-- 5. PRESTASI & PELANGGARAN
-- ============================================================
create table if not exists student_achievements (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references teachers(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  tipe text not null, -- 'prestasi' | 'pelanggaran'
  judul text not null,
  deskripsi text,
  tanggal date not null default current_date,
  created_at timestamptz not null default now(),
  constraint student_achievements_tipe_check check (tipe in ('prestasi', 'pelanggaran'))
);
create index if not exists idx_achievements_owner on student_achievements(owner_id);
create index if not exists idx_achievements_student on student_achievements(student_id);

alter table student_achievements enable row level security;

create policy "student_achievements_owner_crud" on student_achievements
  for all
  using (owner_id in (select id from teachers where auth_user_id = auth.uid()))
  with check (owner_id in (select id from teachers where auth_user_id = auth.uid()));

-- ============================================================
-- 6. KOMUNIKASI ORANG TUA
-- ============================================================
create table if not exists parent_communications (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references teachers(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  tanggal date not null default current_date,
  metode text, -- 'whatsapp' | 'telepon' | 'tatap muka' | dll (bebas)
  ringkasan text not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_parentcomm_owner on parent_communications(owner_id);
create index if not exists idx_parentcomm_student on parent_communications(student_id);

alter table parent_communications enable row level security;

create policy "parent_communications_owner_crud" on parent_communications
  for all
  using (owner_id in (select id from teachers where auth_user_id = auth.uid()))
  with check (owner_id in (select id from teachers where auth_user_id = auth.uid()));

-- ============================================================
-- 7. ADMINISTRASI WALI KELAS (dokumen, terpisah dari `resources`
--    karena kategorinya beda konteks — administrasi kelas, bukan
--    administrasi mengajar per mapel)
-- ============================================================
create table if not exists homeroom_documents (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references teachers(id) on delete cascade,
  class_id uuid not null references classes(id) on delete cascade,
  judul text not null,
  kategori text, -- bebas, misal: 'buku_induk', 'denah_kelas', 'tata_tertib' — diisi belakangan
  tipe text, -- 'pdf' | 'word' | 'excel' | 'link' | dll
  url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_homeroom_docs_owner on homeroom_documents(owner_id);
create index if not exists idx_homeroom_docs_class on homeroom_documents(class_id);

create trigger trg_homeroom_documents_updated_at
before update on homeroom_documents
for each row execute function set_updated_at();

alter table homeroom_documents enable row level security;

create policy "homeroom_documents_owner_crud" on homeroom_documents
  for all
  using (owner_id in (select id from teachers where auth_user_id = auth.uid()))
  with check (owner_id in (select id from teachers where auth_user_id = auth.uid()));

-- ============================================================
-- 8. VIEW: Dashboard Perkembangan Kelas
--    Gabungan kehadiran, nilai rata-rata, prestasi & pelanggaran per kelas
-- ============================================================
create or replace view class_development_summary as
select
  c.id as class_id,
  c.owner_id,
  c.nama_kelas,
  (
    select round(
      100.0 * count(*) filter (where a.status = 'hadir') / nullif(count(*), 0), 1
    )
    from attendance a
    join students s on s.id = a.student_id
    where s.class_id = c.id
  ) as persentase_kehadiran,
  (
    select round(avg(ai.nilai), 1)
    from assessment_items ai
    join assessments ass on ass.id = ai.assessment_id
    where ass.class_id = c.id
  ) as rata_rata_nilai,
  (
    select count(*) from student_achievements sa
    join students s on s.id = sa.student_id
    where s.class_id = c.id and sa.tipe = 'prestasi'
  ) as jumlah_prestasi,
  (
    select count(*) from student_achievements sa
    join students s on s.id = sa.student_id
    where s.class_id = c.id and sa.tipe = 'pelanggaran'
  ) as jumlah_pelanggaran
from classes c;

alter view class_development_summary set (security_invoker = true);

-- ============================================================
-- SELESAI — migration 003
-- ============================================================
