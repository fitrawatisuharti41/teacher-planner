-- ============================================================
-- Migration 009: Storage bucket untuk upload foto Galeri Kelas
-- Jalankan di Supabase SQL Editor SETELAH migration-008
--
-- Sebelumnya foto galeri cuma bisa ditempel link manual (Google Drive dll).
-- Migration ini bikin bucket storage sendiri supaya wali kelas bisa upload
-- foto langsung dari HP/komputer, tanpa perlu upload ke tempat lain dulu.
--
-- Struktur path file: galeri-kelas/{class_id}/{nama_file_unik}
-- ============================================================

-- 1. Bucket-nya, public=true supaya foto bisa diakses langsung lewat URL
--    publik tanpa perlu login (dibutuhkan buat Portal Ortu yang anonim).
insert into storage.buckets (id, name, public)
values ('galeri-kelas', 'galeri-kelas', true)
on conflict (id) do nothing;

-- 2. Guru (wali kelas) hanya boleh upload ke folder kelas yang dia ampu
--    sebagai wali kelas (folder pertama di path = class_id).
create policy "galeri_kelas_teacher_upload" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'galeri-kelas'
    and (storage.foldername(name))[1] in (
      select c.id::text from classes c
      join teachers t on t.id = c.wali_kelas_id
      where t.auth_user_id = auth.uid()
    )
  );

-- 3. Guru hanya boleh hapus foto di folder kelas yang dia ampu
create policy "galeri_kelas_teacher_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'galeri-kelas'
    and (storage.foldername(name))[1] in (
      select c.id::text from classes c
      join teachers t on t.id = c.wali_kelas_id
      where t.auth_user_id = auth.uid()
    )
  );

-- 4. Siapa pun (termasuk Portal Ortu yang anonim) boleh lihat/download foto
create policy "galeri_kelas_public_read" on storage.objects
  for select to public
  using (bucket_id = 'galeri-kelas');

-- ============================================================
-- SELESAI — migration 009
-- ============================================================
