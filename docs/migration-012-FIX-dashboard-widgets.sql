-- ============================================================
-- Migration 012 (FIX): Widget Ringkasan Dashboard Wali Kelas
-- Perbaikan: drop view dulu sebelum create, karena Postgres gak
-- bisa CREATE OR REPLACE VIEW kalau susunan kolomnya berubah.
-- Aman dijalankan ulang meski migration-012 asli sempat gagal di tengah.
-- ============================================================

-- 1. Kolom baru yang dibutuhkan widget dashboard (aman diulang)
alter table students add column if not exists tanggal_lahir date;
alter table parent_communications add column if not exists perlu_follow_up boolean not null default false;

-- 2. Mood Kelas Hari Ini (aman diulang)
create table if not exists class_mood (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references teachers(id) on delete cascade,
  class_id uuid not null references classes(id) on delete cascade,
  tanggal date not null default current_date,
  mood text not null,
  created_at timestamptz not null default now(),
  unique (class_id, tanggal)
);
alter table class_mood enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where tablename = 'class_mood' and policyname = 'class_mood_owner_crud'
  ) then
    create policy "class_mood_owner_crud" on class_mood
      for all
      using (owner_id in (select id from teachers where auth_user_id = auth.uid()))
      with check (owner_id in (select id from teachers where auth_user_id = auth.uid()));
  end if;
end $$;

-- 3. DROP dulu baru CREATE (ini kunci perbaikannya)
drop view if exists class_development_summary;

create view class_development_summary as
select
  c.id as class_id,
  c.owner_id,
  c.nama_kelas,
  (select count(*) from students s where s.class_id = c.id) as jumlah_siswa,
  (select count(*) from students s where s.class_id = c.id and s.jenis_kelamin = 'L') as jumlah_putra,
  (select count(*) from students s where s.class_id = c.id and s.jenis_kelamin = 'P') as jumlah_putri,
  (
    select round(100.0 * count(*) filter (where a.status = 'hadir') / nullif(count(*), 0), 1)
    from attendance a join students s on s.id = a.student_id
    where s.class_id = c.id
  ) as persentase_kehadiran,
  (
    select round(avg(ai.nilai), 1)
    from assessment_items ai join assessments ass on ass.id = ai.assessment_id
    where ass.class_id = c.id
  ) as rata_rata_nilai,
  (
    select count(*) from student_achievements sa join students s on s.id = sa.student_id
    where s.class_id = c.id and sa.tipe = 'prestasi'
  ) as jumlah_prestasi,
  (
    select count(*) from student_achievements sa join students s on s.id = sa.student_id
    where s.class_id = c.id and sa.tipe = 'pelanggaran'
  ) as jumlah_pelanggaran,
  (
    select count(*) from students s
    where s.class_id = c.id and s.tanggal_lahir is not null
      and extract(month from s.tanggal_lahir) = extract(month from current_date)
  ) as ulang_tahun_bulan_ini,
  (
    select count(*) from attendance a join students s on s.id = a.student_id
    where s.class_id = c.id and a.tanggal = current_date and a.status = 'izin'
  ) as izin_hari_ini,
  (
    select count(*) from attendance a join students s on s.id = a.student_id
    where s.class_id = c.id and a.tanggal = current_date and a.status = 'terlambat'
  ) as terlambat_hari_ini,
  (
    select count(*) from class_announcements ca
    where ca.class_id = c.id and ca.tanggal >= current_date - interval '30 days'
  ) as pengumuman_aktif,
  (
    select count(*) from class_agenda ag
    where ag.class_id = c.id and ag.tanggal = current_date
  ) as agenda_hari_ini,
  (
    select count(*) from parent_communications pc join students s on s.id = pc.student_id
    where s.class_id = c.id and pc.perlu_follow_up = true
  ) as ortu_perlu_dihubungi,
  (
    select count(*) from homeroom_documents hd where hd.class_id = c.id
  ) as dokumen_administrasi,
  (
    select cm.mood from class_mood cm where cm.class_id = c.id and cm.tanggal = current_date
  ) as mood_hari_ini
from classes c;

alter view class_development_summary set (security_invoker = true);

-- ============================================================
-- SELESAI — migration 012 (fixed)
-- ============================================================
