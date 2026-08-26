-- =========================================================================
-- PATCH: perbaiki owner_id di sesi_ulangan & bank_soal_ulangan supaya
-- mengacu ke teachers(id) — BUKAN auth.users(id). teachers.id beda dari
-- auth.uid(); penghubungnya adalah teachers.auth_user_id.
-- Aman dijalankan berkali-kali. Jalankan SEKALI, tidak perlu reset tabel.
-- =========================================================================

-- Helper: ambil teachers.id milik user yang sedang login
create or replace function current_teacher_id()
returns uuid language sql stable as $$
  select id from teachers where auth_user_id = auth.uid()
$$;

-- --- sesi_ulangan.owner_id ---
alter table sesi_ulangan drop constraint if exists sesi_ulangan_owner_id_fkey;
alter table sesi_ulangan alter column owner_id drop default;
alter table sesi_ulangan alter column owner_id set default current_teacher_id();
alter table sesi_ulangan add constraint sesi_ulangan_owner_id_fkey foreign key (owner_id) references teachers(id);

-- --- bank_soal_ulangan.owner_id ---
alter table bank_soal_ulangan drop constraint if exists bank_soal_ulangan_owner_id_fkey;
alter table bank_soal_ulangan alter column owner_id drop default;
alter table bank_soal_ulangan alter column owner_id set default current_teacher_id();
alter table bank_soal_ulangan add constraint bank_soal_ulangan_owner_id_fkey foreign key (owner_id) references teachers(id);

-- --- jawaban_siswa.dinilai_oleh (kolom guru yang menilai uraian manual) ---
alter table jawaban_siswa drop constraint if exists jawaban_siswa_dinilai_oleh_fkey;
alter table jawaban_siswa add constraint jawaban_siswa_dinilai_oleh_fkey foreign key (dinilai_oleh) references teachers(id);

-- --- RLS: perbaiki semua policy yang tadinya pakai auth.uid() langsung ---
drop policy if exists "guru kelola sesi sendiri" on sesi_ulangan;
create policy "guru kelola sesi sendiri" on sesi_ulangan
  for all using (owner_id = current_teacher_id()) with check (owner_id = current_teacher_id());

drop policy if exists "guru kelola soal sendiri" on bank_soal_ulangan;
create policy "guru kelola soal sendiri" on bank_soal_ulangan
  for all using (owner_id = current_teacher_id()) with check (owner_id = current_teacher_id());

drop policy if exists "guru lihat semua jawaban di sesi miliknya" on jawaban_siswa;
create policy "guru lihat semua jawaban di sesi miliknya" on jawaban_siswa
  for select using (exists (select 1 from sesi_ulangan s where s.id = sesi_id and s.owner_id = current_teacher_id()));

drop policy if exists "guru update skor manual" on jawaban_siswa;
create policy "guru update skor manual" on jawaban_siswa
  for update using (exists (select 1 from sesi_ulangan s where s.id = sesi_id and s.owner_id = current_teacher_id()));

drop policy if exists "guru lihat log sesi miliknya" on log_pelanggaran;
create policy "guru lihat log sesi miliknya" on log_pelanggaran
  for select using (exists (select 1 from sesi_ulangan s where s.id = sesi_id and s.owner_id = current_teacher_id()));

-- Cek hasil:
-- select conname, confrelid::regclass from pg_constraint where conrelid in ('sesi_ulangan'::regclass, 'bank_soal_ulangan'::regclass) and contype='f';
-- harus muncul owner_id -> teachers, bukan lagi -> users
