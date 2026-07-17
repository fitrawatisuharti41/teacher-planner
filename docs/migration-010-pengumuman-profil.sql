-- ============================================================
-- Migration 010: Pengumuman Kelas + Profil Guru (foto & pendidikan)
-- Jalankan di Supabase SQL Editor SETELAH migration-009
-- ============================================================

-- 1. PENGUMUMAN KELAS — mirip class_agenda, kelas-wide, publik boleh baca
create table if not exists class_announcements (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references teachers(id) on delete cascade,
  class_id uuid not null references classes(id) on delete cascade,
  tanggal date not null default current_date,
  judul text not null,
  isi text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_class_announcements_owner on class_announcements(owner_id);
create index if not exists idx_class_announcements_class on class_announcements(class_id);

create trigger trg_class_announcements_updated_at
before update on class_announcements
for each row execute function set_updated_at();

alter table class_announcements enable row level security;

create policy "class_announcements_owner_crud" on class_announcements
  for all
  using (owner_id in (select id from teachers where auth_user_id = auth.uid()))
  with check (owner_id in (select id from teachers where auth_user_id = auth.uid()));

create policy "class_announcements_public_read" on class_announcements
  for select to anon using (true);

-- 2. teachers_public — tambah kolom `pendidikan` supaya bio guru bisa
--    ditampilkan di Portal Ortu (foto_url sudah ada dari migration 005)
create or replace view teachers_public as
  select id, nama_lengkap, nama_panggilan, sekolah_nama, jabatan, kontak_whatsapp, foto_url, pendidikan
  from teachers;

alter view teachers_public set (security_invoker = true);

-- 3. Storage bucket untuk foto profil guru
insert into storage.buckets (id, name, public)
values ('profil-guru', 'profil-guru', true)
on conflict (id) do nothing;

-- Guru cuma boleh upload/update/hapus foto di folder miliknya sendiri
-- (folder pertama di path = teacher.id)
create policy "profil_guru_owner_upload" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'profil-guru'
    and (storage.foldername(name))[1] in (select id::text from teachers where auth_user_id = auth.uid())
  );

create policy "profil_guru_owner_update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'profil-guru'
    and (storage.foldername(name))[1] in (select id::text from teachers where auth_user_id = auth.uid())
  );

create policy "profil_guru_owner_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'profil-guru'
    and (storage.foldername(name))[1] in (select id::text from teachers where auth_user_id = auth.uid())
  );

create policy "profil_guru_public_read" on storage.objects
  for select to public
  using (bucket_id = 'profil-guru');

-- ============================================================
-- SELESAI — migration 010
-- ============================================================
