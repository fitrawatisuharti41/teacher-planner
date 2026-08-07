-- ============================================================
-- Migration 018: Upload gambar LKM (Lembar Kerja Murid) di Bank Soal
-- Guru bisa upload foto LKM per set soal, siswa bisa lihat/download.
-- Struktur path: bank-soal/{practice_set_id-sementara-pakai-owner}/{file}
-- ============================================================

-- 1. Kolom gambar di practice_sets (satu LKM per set soal)
alter table practice_sets add column if not exists gambar_url text;
alter table practice_sets add column if not exists link_gamifikasi text; -- Wordwall/Quizizz/Educaplay/dsb

-- 2. Bucket storage, public=true (dibutuhkan Portal Ortu yang anonim)
insert into storage.buckets (id, name, public)
values ('bank-soal', 'bank-soal', true)
on conflict (id) do nothing;

-- 3. Guru hanya boleh upload ke folder miliknya sendiri (folder pertama = teacher_id)
create policy "bank_soal_teacher_upload" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'bank-soal'
    and (storage.foldername(name))[1] in (
      select id::text from teachers where auth_user_id = auth.uid()
    )
  );

-- 4. Guru hanya boleh hapus punya sendiri
create policy "bank_soal_teacher_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'bank-soal'
    and (storage.foldername(name))[1] in (
      select id::text from teachers where auth_user_id = auth.uid()
    )
  );

-- 5. Siapa pun (Portal Ortu anonim) boleh lihat/download gambar LKM
create policy "bank_soal_public_read" on storage.objects
  for select to public
  using (bucket_id = 'bank-soal');

-- ============================================================
-- SELESAI — migration 018
-- ============================================================
