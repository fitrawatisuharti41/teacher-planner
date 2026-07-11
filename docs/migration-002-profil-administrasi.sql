-- ============================================================
-- Migration 002: Profil guru lengkap + kategori Administrasi Pembelajaran
-- Jalankan ini di Supabase SQL Editor (aman dijalankan ulang / idempotent)
-- ============================================================

-- 1. Tambah kolom profil ke teachers
alter table teachers add column if not exists foto_url text;
alter table teachers add column if not exists sekolah_nama text;
alter table teachers add column if not exists jabatan text;
alter table teachers add column if not exists mengajar_sejak int;
alter table teachers add column if not exists pendidikan text[];
alter table teachers add column if not exists kontak_whatsapp text;
alter table teachers add column if not exists wilayah text;
alter table teachers add column if not exists email_tampilan text;

-- 2. Tambah kolom kategori & class_id ke resources
alter table resources add column if not exists class_id uuid references classes(id) on delete set null;
alter table resources add column if not exists kategori text;

-- 3. Constraint kategori (dicek dulu biar gak error kalau sudah ada)
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'resources_kategori_check'
  ) then
    alter table resources add constraint resources_kategori_check
      check (kategori is null or kategori in ('modul_ajar', 'kktp', 'cp', 'atp', 'prota', 'promes', 'kaldik'));
  end if;
end $$;

-- 4. Index tambahan
create index if not exists idx_resources_class on resources(class_id);
create index if not exists idx_resources_kategori on resources(kategori);

-- 5. View ringkasan kelengkapan (aman di-replace)
create or replace view administrasi_summary as
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
-- SELESAI — migration 002
-- ============================================================
