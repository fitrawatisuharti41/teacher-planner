-- ============================================================
-- Migration 021: Upload gambar langsung untuk Arsip Materi Umum
-- (sebelumnya cuma bisa isi link, sekarang bisa upload file gambar)
-- ============================================================

insert into storage.buckets (id, name, public)
values ('arsip-materi', 'arsip-materi', true)
on conflict (id) do nothing;

do $$
begin
  if not exists (
    select 1 from pg_policies where tablename = 'objects' and policyname = 'arsip_materi_teacher_upload'
  ) then
    create policy "arsip_materi_teacher_upload" on storage.objects
      for insert to authenticated
      with check (
        bucket_id = 'arsip-materi'
        and (storage.foldername(name))[1] in (select id::text from teachers where auth_user_id = auth.uid())
      );
  end if;

  if not exists (
    select 1 from pg_policies where tablename = 'objects' and policyname = 'arsip_materi_teacher_delete'
  ) then
    create policy "arsip_materi_teacher_delete" on storage.objects
      for delete to authenticated
      using (
        bucket_id = 'arsip-materi'
        and (storage.foldername(name))[1] in (select id::text from teachers where auth_user_id = auth.uid())
      );
  end if;

  if not exists (
    select 1 from pg_policies where tablename = 'objects' and policyname = 'arsip_materi_public_read'
  ) then
    create policy "arsip_materi_public_read" on storage.objects
      for select to public
      using (bucket_id = 'arsip-materi');
  end if;
end $$;

-- ============================================================
-- SELESAI — migration 021
-- ============================================================
