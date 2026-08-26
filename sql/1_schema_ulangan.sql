-- =========================================================================
-- SCHEMA v2: Fitur Ulangan Anti-Cheating — terintegrasi ke assessments/
-- assessment_items yang SUDAH ADA di Teacher Planner (bukan tabel baru
-- "penilaian"). Siswa TIDAK punya akun Supabase Auth (sama seperti
-- practice_answers) — identitas siswa = students.id yang dipilih dari
-- dropdown nama, bukan auth.uid().
-- Jalankan berurutan dari atas ke bawah di Supabase SQL Editor.
-- Idempotent: aman dijalankan ulang.
-- =========================================================================

-- 1) SESI ULANGAN ---------------------------------------------------------
-- Terhubung ke assessment yang SUDAH ADA (assessments) — bukan bikin
-- judul/kelas/mapel sendiri. Nilai akhir otomatis masuk ke assessment ini.
create table if not exists sesi_ulangan (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references assessments(id) on delete cascade,
  durasi_menit int not null default 40,
  status text not null default 'draft' check (status in ('draft','aktif','selesai')),
  owner_id uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now()
);

-- 2) BANK SOAL --------------------------------------------------------------
-- kunci_jawaban TIDAK BOLEH pernah dikirim ke client siswa.
-- Siswa hanya boleh akses lewat view `soal_untuk_siswa` (lihat bagian 6).
create table if not exists bank_soal_ulangan (
  id uuid primary key default gen_random_uuid(),
  sesi_id uuid not null references sesi_ulangan(id) on delete cascade,
  urutan int not null default 1,
  tipe_soal text not null check (tipe_soal in ('pg_biasa','pg_kompleks','benar_salah','menjodohkan','isian_singkat','uraian')),
  pertanyaan text not null,
  opsi jsonb,               -- pg_biasa / pg_kompleks / benar_salah: ["opsi A", "opsi B", ...]
  kiri jsonb,                -- menjodohkan: ["item1", "item2", ...]
  kanan jsonb,               -- menjodohkan: ["pasangan1", "pasangan2", ...]
  kunci_jawaban jsonb,       -- SENSITIF — lihat catatan di atas
  bobot numeric not null default 10,
  is_hots boolean not null default false,
  rubrik text,               -- catatan penilaian buat soal uraian
  owner_id uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now()
);

-- Batasi maksimal 5 soal HOTS per sesi
create or replace function cek_maksimal_hots()
returns trigger as $$
begin
  if new.is_hots then
    if (select count(*) from bank_soal_ulangan
        where sesi_id = new.sesi_id and is_hots = true and id <> coalesce(new.id, gen_random_uuid())) >= 5 then
      raise exception 'Maksimal 5 soal HOTS per sesi ulangan';
    end if;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_cek_maksimal_hots on bank_soal_ulangan;
create trigger trg_cek_maksimal_hots
  before insert or update on bank_soal_ulangan
  for each row execute function cek_maksimal_hots();

-- 3) JAWABAN SISWA -----------------------------------------------------------
-- siswa_id -> students.id (BUKAN auth.users), karena siswa tidak login
-- pakai Supabase Auth. Pola ini sama seperti practice_answers.student_id.
create table if not exists jawaban_siswa (
  id uuid primary key default gen_random_uuid(),
  sesi_id uuid not null references sesi_ulangan(id) on delete cascade,
  soal_id uuid not null references bank_soal_ulangan(id) on delete cascade,
  siswa_id uuid not null references students(id) on delete cascade,
  jawaban jsonb,
  skor numeric,
  status text not null default 'auto' check (status in ('auto','pending_manual','dinilai_manual')),
  dinilai_oleh uuid references auth.users(id),
  submitted_at timestamptz not null default now(),
  unique (sesi_id, soal_id, siswa_id)
);

-- 4) LOG PELANGGARAN (anti-cheat) --------------------------------------------
create table if not exists log_pelanggaran (
  id uuid primary key default gen_random_uuid(),
  sesi_id uuid not null references sesi_ulangan(id) on delete cascade,
  siswa_id uuid not null references students(id) on delete cascade,
  jenis text not null check (jenis in ('tab_switch','fullscreen_exit')),
  ke_berapa int not null,
  waktu timestamptz not null default now()
);

-- 5) INDEX ---------------------------------------------------------------
create index if not exists idx_soal_sesi on bank_soal_ulangan(sesi_id);
create index if not exists idx_jawaban_sesi_siswa on jawaban_siswa(sesi_id, siswa_id);
create index if not exists idx_log_sesi_siswa on log_pelanggaran(sesi_id, siswa_id);

-- 6) VIEW SOAL UNTUK SISWA (tanpa kunci_jawaban) -----------------------------
create or replace view soal_untuk_siswa as
select id, sesi_id, urutan, tipe_soal, pertanyaan, opsi, kiri, kanan, bobot, is_hots
from bank_soal_ulangan;

-- 7) VIEW INFO SESI UNTUK SISWA (gabungan sesi + assessment + kelas) --------
-- Dipakai ulangan.html supaya cukup 1 query buat dapat judul, mapel, kelas,
-- dan daftar siswa yang boleh mengerjakan.
create or replace view info_sesi_ulangan as
select
  su.id as sesi_id,
  su.durasi_menit,
  su.status,
  a.id as assessment_id,
  a.judul,
  a.mapel,
  a.kkm,
  a.class_id,
  c.nama_kelas
from sesi_ulangan su
join assessments a on a.id = su.assessment_id
join classes c on c.id = a.class_id;

-- =========================================================================
-- 8) ROW LEVEL SECURITY
-- =========================================================================
alter table sesi_ulangan enable row level security;
alter table bank_soal_ulangan enable row level security;
alter table jawaban_siswa enable row level security;
alter table log_pelanggaran enable row level security;

-- Guru: kelola sesi & soal miliknya sendiri (owner_id = auth.uid(), guru MEMANG
-- login pakai Supabase Auth, beda dari siswa)
drop policy if exists "guru kelola sesi sendiri" on sesi_ulangan;
create policy "guru kelola sesi sendiri" on sesi_ulangan
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

drop policy if exists "guru kelola soal sendiri" on bank_soal_ulangan;
create policy "guru kelola soal sendiri" on bank_soal_ulangan
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- Publik (anon): boleh baca sesi yang statusnya 'aktif' saja (siswa tidak
-- punya sesi login, jadi aksesnya lewat anon key + status check ini)
drop policy if exists "publik lihat sesi aktif" on sesi_ulangan;
create policy "publik lihat sesi aktif" on sesi_ulangan
  for select using (status = 'aktif');

drop policy if exists "publik lihat soal sesi aktif" on bank_soal_ulangan;
create policy "publik lihat soal sesi aktif" on bank_soal_ulangan
  for select using (exists (select 1 from sesi_ulangan s where s.id = sesi_id and s.status = 'aktif'));

-- Jawaban siswa: publik boleh insert (tidak ada auth siswa untuk dibatasi
-- lebih ketat dari ini — sama seperti practice_answers), tapi HANYA kalau
-- sesi-nya aktif. Baca & update hanya guru pemilik sesi.
drop policy if exists "publik insert jawaban di sesi aktif" on jawaban_siswa;
create policy "publik insert jawaban di sesi aktif" on jawaban_siswa
  for insert with check (exists (select 1 from sesi_ulangan s where s.id = sesi_id and s.status = 'aktif'));

drop policy if exists "guru lihat semua jawaban di sesi miliknya" on jawaban_siswa;
create policy "guru lihat semua jawaban di sesi miliknya" on jawaban_siswa
  for select using (exists (select 1 from sesi_ulangan s where s.id = sesi_id and s.owner_id = auth.uid()));

drop policy if exists "guru update skor manual" on jawaban_siswa;
create policy "guru update skor manual" on jawaban_siswa
  for update using (exists (select 1 from sesi_ulangan s where s.id = sesi_id and s.owner_id = auth.uid()));

-- Log pelanggaran: publik insert (sama alasannya), guru baca punya sesi miliknya
drop policy if exists "publik insert log di sesi aktif" on log_pelanggaran;
create policy "publik insert log di sesi aktif" on log_pelanggaran
  for insert with check (exists (select 1 from sesi_ulangan s where s.id = sesi_id and s.status = 'aktif'));

drop policy if exists "guru lihat log sesi miliknya" on log_pelanggaran;
create policy "guru lihat log sesi miliknya" on log_pelanggaran
  for select using (exists (select 1 from sesi_ulangan s where s.id = sesi_id and s.owner_id = auth.uid()));

-- Izinkan publik (anon) baca id+nama siswa per kelas untuk dropdown "pilih nama"
-- di ulangan.html — kalau tabel `students` sudah punya policy publik serupa
-- (kemungkinan besar sudah ada karena portal-ortu juga butuh ini), baris di
-- bawah ini aman dijalankan ulang (DROP IF EXISTS dulu).
drop policy if exists "publik lihat siswa untuk pilih nama" on students;
create policy "publik lihat siswa untuk pilih nama" on students
  for select using (true);

-- =========================================================================
-- 9) TRIGGER: SINKRON OTOMATIS KE assessment_items
-- =========================================================================
create or replace function sync_ulangan_ke_assessment_items()
returns trigger as $$
declare
  v_siswa_id uuid;
  v_sesi_id uuid;
  v_masih_pending int;
  v_total_skor numeric;
  v_total_bobot numeric;
  v_assessment_id uuid;
  v_nilai numeric;
begin
  v_siswa_id := new.siswa_id;
  v_sesi_id := new.sesi_id;

  -- masih ada soal uraian yang belum dinilai guru? kalau ya, tunda sinkronisasi
  select count(*) into v_masih_pending
  from jawaban_siswa
  where sesi_id = v_sesi_id and siswa_id = v_siswa_id and status = 'pending_manual';

  if v_masih_pending > 0 then
    return new;
  end if;

  select coalesce(sum(js.skor),0), coalesce(sum(bs.bobot),0)
  into v_total_skor, v_total_bobot
  from jawaban_siswa js
  join bank_soal_ulangan bs on bs.id = js.soal_id
  where js.sesi_id = v_sesi_id and js.siswa_id = v_siswa_id;

  select assessment_id into v_assessment_id from sesi_ulangan where id = v_sesi_id;
  v_nilai := round((v_total_skor / nullif(v_total_bobot,0)) * 100, 1);

  -- upsert manual (tanpa bergantung ke unique constraint yang mungkin belum ada)
  update assessment_items
    set nilai = v_nilai, updated_at = now()
    where assessment_id = v_assessment_id and student_id = v_siswa_id;

  if not found then
    insert into assessment_items (assessment_id, student_id, nilai)
    values (v_assessment_id, v_siswa_id, v_nilai);
  end if;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_sync_ke_assessment_items on jawaban_siswa;
create trigger trg_sync_ke_assessment_items
  after insert or update on jawaban_siswa
  for each row execute function sync_ulangan_ke_assessment_items();
