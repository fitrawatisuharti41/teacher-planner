-- ============================================================
-- Migration 008: Galeri & Info Kelas (wali kelas)
-- Jalankan di Supabase SQL Editor SETELAH migration-007
--
-- Tujuan: wali kelas bisa upload foto kegiatan/pembelajaran +
-- catatan singkat, dan orang tua bisa lihat di Portal Ortu.
-- ============================================================

create table if not exists class_gallery (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references teachers(id) on delete cascade,
  class_id uuid not null references classes(id) on delete cascade,
  tanggal date not null default current_date,
  judul text,               -- misal: "Kunjungan Museum", boleh kosong
  catatan text,              -- note informasi buat orang tua
  foto_url text,             -- link foto (Google Drive/Imgur/dll), boleh kosong kalau cuma note teks
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_class_gallery_owner on class_gallery(owner_id);
create index if not exists idx_class_gallery_class on class_gallery(class_id);

create trigger trg_class_gallery_updated_at
before update on class_gallery
for each row execute function set_updated_at();

alter table class_gallery enable row level security;

-- Guru (wali kelas) CRUD penuh ke galeri kelasnya sendiri
create policy "class_gallery_owner_crud" on class_gallery
  for all
  using (owner_id in (select id from teachers where auth_user_id = auth.uid()))
  with check (owner_id in (select id from teachers where auth_user_id = auth.uid()));

-- Orang tua/siswa (anon di Portal Ortu) boleh lihat — sama seperti
-- class_agenda & homeroom_documents, ini info kelas-wide, bukan data
-- pribadi per siswa, jadi aman untuk semua orang tua di kelas itu lihat.
create policy "class_gallery_public_read" on class_gallery
  for select to anon using (true);

-- ============================================================
-- SELESAI — migration 008
-- ============================================================
