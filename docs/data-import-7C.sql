-- ============================================================
-- Data Import: Kelas 7C (dari daftar MPLS "Pasar Lama" 2026/2027)
-- Versi AMAN DIULANG — bisa di-run berkali-kali tanpa bikin data dobel.
-- ============================================================

-- 1. Buat kelas 7C HANYA KALAU BELUM ADA untuk guru ini
insert into classes (owner_id, nama_kelas, tingkat, wali_kelas_id)
select
  t.id, '7C', '7', t.id
from teachers t
where not exists (
  select 1 from classes c where c.nama_kelas = '7C' and c.owner_id = t.id
)
limit 1;

-- 2. Import 33 siswa (nomor HP & asal sekolah TIDAK disertakan — pertimbangan privasi data anak)
--    HANYA insert siswa yang NIS-nya belum ada di kelas 7C (aman diulang)
insert into students (class_id, owner_id, nama, nis, jenis_kelamin)
select
  kelas_7c.id,
  kelas_7c.owner_id,
  siswa_baru.nama, siswa_baru.nis, siswa_baru.jenis_kelamin
from (values
  ('ABDURAHMAN WAHIDIN', '3131607659', 'L'),
  ('ABINAYA ZAHDAN FAHREZA', '3147680544', 'L'),
  ('AL MAIRA IZDIHAR NAZMI', '0143899725', 'P'),
  ('AQILLA SYAH MIDA RIFFA', '3135625070', 'P'),
  ('ARJUNA IBRAHIM WAHYU NUGROHO', '0148752273', 'L'),
  ('ARKAN PUTRA PRATAMA', '0134063108', 'L'),
  ('AUFA NUR AZHAR', '3136923806', 'P'),
  ('AURHA CANTIKA', '0143829396', 'P'),
  ('AZKA SATRIA WICAKSANA', '0143064171', 'L'),
  ('AZZAHRA PUTRI NURIMAN', '3137635353', 'P'),
  ('AZZAM FAIZ ABDILLAH', '3142661255', 'L'),
  ('CHANDRA RIZQI PRATAMA', '3137008838', 'L'),
  ('DEVI RATNA AYU', '3130011483', 'P'),
  ('DHEREN RAFKHA ABIZAR', '3139236968', 'L'),
  ('DWI PUTRI AQILA AL-ZAHRA', '0146032058', 'P'),
  ('ELVALENA KHANZA', '3137617073', 'P'),
  ('ERLEND AERINDA NUR MAYSATAMA', '0135954706', 'P'),
  ('FAKHRI ZIYAD RAMADHAN', '3137665375', 'L'),
  ('GITA AULIA IZZATUNNISA', '0132628633', 'P'),
  ('KENZO XAVIER SITUMORANG', '0132805687', 'L'),
  ('KHANZA MAHARANI SITI AZ ZAHRA', '3145185042', 'P'),
  ('LELY MAULIDA', '3145460391', 'P'),
  ('MOHAMAD ZULFIAN FIKRI', '3143766857', 'L'),
  ('MUHAMMAD DAFFA ABDULLAH', '3135314335', 'L'),
  ('MUHAMMAD MOZA HAKIKI', '3139897762', 'L'),
  ('NADHIFA KEISHA ZAHIRANI', '0137544782', 'P'),
  ('NADYA PUTRI ARDANI', '3136149047', 'P'),
  ('SIFA MAULIDA', '3132591374', 'P'),
  ('TEGUH GILANG GUMILAR', '3133883935', 'L'),
  ('TRI WIJAYA KUSUMA ATMADJA', '3120193104', 'L'),
  ('YASYFA GURUH PERMATA PUTRY', '3134828531', 'P'),
  ('ZAHRA AMALIA PUTRI', '0149352448', 'P'),
  ('ZEIN BILAL AL-BANTANI', '3134394026', 'L')
) as siswa_baru(nama, nis, jenis_kelamin)
cross join (
  select id, owner_id from classes where nama_kelas = '7C' order by created_at asc limit 1
) as kelas_7c
where not exists (
  select 1 from students s where s.nis = siswa_baru.nis and s.class_id = kelas_7c.id
);

-- ============================================================
-- SELESAI — aman dijalankan ulang kapan saja
-- ============================================================
