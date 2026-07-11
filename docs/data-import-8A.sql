-- ============================================================
-- Data Import: Kelas 8A (IPA) + kerangka kelas 7A-7C & 7F-7I
-- Aman dijalankan berkali-kali (idempotent, sama pola dengan data-import-7C.sql)
-- ============================================================

-- 1. Buat kelas 8A kalau belum ada
insert into classes (owner_id, nama_kelas, tingkat)
select t.id, '8A', '8'
from teachers t
where not exists (select 1 from classes c where c.nama_kelas = '8A' and c.owner_id = t.id)
limit 1;

-- 2. Penugasan mengajar: IPA di 8A
insert into teaching_assignments (teacher_id, kelas_id, mapel)
select t.id, c.id, 'IPA'
from teachers t
join classes c on c.nama_kelas = '8A' and c.owner_id = t.id
where not exists (
  select 1 from teaching_assignments ta where ta.teacher_id = t.id and ta.kelas_id = c.id and ta.mapel = 'IPA'
)
limit 1;

-- 3. Import 36 siswa 8A (kolom NISN & asal sekolah tidak disertakan, konsisten dengan 7C)
insert into students (class_id, owner_id, nama, nis, jenis_kelamin)
select
  kelas_8a.id, kelas_8a.owner_id,
  siswa_baru.nama, siswa_baru.nis, siswa_baru.jenis_kelamin
from (values
  ('ADAM PUTRA RAIHAN', '25267003', 'L'),
  ('AHSAN AL FALIS', '25267011', 'L'),
  ('AIRA AULIA', '25267012', 'P'),
  ('AIRA EKA RAMADHANI', '25267013', 'P'),
  ('AL''AZZAM DZAKWAN SANTOSO', '25267023', 'L'),
  ('ALEA RIZKYTA KANASYABILLA', '25267024', 'P'),
  ('ALGHIZA FATHIA', '25267025', 'P'),
  ('ALLEA ZAVIRA ANDWILIANI', '25267029', 'P'),
  ('ALYA JAZILA', '25267031', 'P'),
  ('ANNISA LUTHFIAH RAMADHANI', '25267042', 'P'),
  ('ARCELIA KAYLA BATARI', '25267046', 'P'),
  ('ARYANTI AZZAHRA', '25267053', 'P'),
  ('ARYASATYA NUR MAJID', '25267054', 'L'),
  ('BAYU PRASETIYO', '25267067', 'L'),
  ('BINTANG SATRIA PRADANA', '25267072', 'L'),
  ('CHIKAL ALVINO ATMOJO', '25267078', 'L'),
  ('CIKLET ALVARO', '25267079', 'L'),
  ('CLARISSA MARCSA FAKHIRA', '25267084', 'P'),
  ('CLEO ASZKHA SUBROTO', '25267085', 'L'),
  ('DHINI ASFAN NADA', '25267093', 'P'),
  ('ERLAND FARREL FIRJATULLAH', '25267105', 'L'),
  ('GALIH ADITYA MANURUNG', '25267126', 'L'),
  ('HANIFAH TALITA SAKHI', '25267135', 'P'),
  ('JUWITA FITRI NURDINIAH', '25267144', 'P'),
  ('KATARINA CENINDITA PASKALIS', '25267146', 'P'),
  ('KHAMITA PUTRI KHOTIJA', '25267153', 'P'),
  ('MARISA SYAHPUTRI', '25267167', 'P'),
  ('MAWAR ZAKIA INTAN', '25267171', 'P'),
  ('MILA ASTI MULYATI', '25267175', 'P'),
  ('MUHAMAD ZIDAN DWI ALVARO', '25267193', 'L'),
  ('MUHAMMAD AL HABSYE HIDAYAT', '25267197', 'L'),
  ('MUHAMMAD RAFFI RIVANO', '25267217', 'L'),
  ('NAYLA AULIA', '25267237', 'P'),
  ('RAKA SUGEMA', '25267264', 'L'),
  ('RAZKHA KEANO AFRIZAL', '25267267', 'L'),
  ('SUSANA', '25267306', 'P')
) as siswa_baru(nama, nis, jenis_kelamin)
cross join (
  select id, owner_id from classes where nama_kelas = '8A' order by created_at asc limit 1
) as kelas_8a
where not exists (
  select 1 from students s where s.nis = siswa_baru.nis and s.class_id = kelas_8a.id
);

-- ============================================================
-- 4. Kerangka kelas 7A-7C (IPA) dan 7F-7I (Prakarya) — KOSONG,
--    siswa menyusul setelah roster final. Aman diulang.
-- ============================================================
insert into classes (owner_id, nama_kelas, tingkat)
select t.id, k.nama_kelas, '7'
from teachers t
cross join (values ('7A'), ('7B'), ('7C'), ('7F'), ('7G'), ('7H'), ('7I')) as k(nama_kelas)
where not exists (
  select 1 from classes c where c.nama_kelas = k.nama_kelas and c.owner_id = t.id
);

insert into teaching_assignments (teacher_id, kelas_id, mapel)
select t.id, c.id, 'IPA'
from teachers t
join classes c on c.owner_id = t.id and c.nama_kelas in ('7A', '7B', '7C')
where not exists (
  select 1 from teaching_assignments ta where ta.teacher_id = t.id and ta.kelas_id = c.id and ta.mapel = 'IPA'
);

insert into teaching_assignments (teacher_id, kelas_id, mapel)
select t.id, c.id, 'Prakarya'
from teachers t
join classes c on c.owner_id = t.id and c.nama_kelas in ('7F', '7G', '7H', '7I')
where not exists (
  select 1 from teaching_assignments ta where ta.teacher_id = t.id and ta.kelas_id = c.id and ta.mapel = 'Prakarya'
);

-- ============================================================
-- SELESAI — 8A + 36 siswa terisi, kerangka 7A-7C & 7F-7I siap diisi nanti
-- ============================================================
