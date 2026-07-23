-- ============================================================
-- Data Import: Jadwal Mengajar Mingguan
-- Aman dijalankan ulang (hapus dulu punya guru ini, baru insert lagi)
-- ============================================================

delete from weekly_schedule where owner_id = (select id from teachers limit 1);

insert into weekly_schedule (owner_id, class_id, hari, jam_mulai, jam_selesai, mapel)
select
  (select id from teachers limit 1),
  (select id from classes where nama_kelas = j.kelas and owner_id = (select id from teachers limit 1)),
  j.hari, j.jam_mulai::time, j.jam_selesai::time, j.mapel
from (values
  -- Senin
  ('senin', '08:00', '09:20', 'IPA', '7B'),
  ('senin', '11:10', '11:50', 'IPA', '8A'),
  ('senin', '12:35', '13:55', 'IPA', '8A'),
  -- Selasa
  ('selasa', '07:15', '07:55', 'Prakarya', '7G'),
  ('selasa', '08:35', '09:55', 'Prakarya', '7F'),
  ('selasa', '10:25', '11:45', 'IPA', '8A'),
  ('selasa', '12:30', '14:20', 'Prakarya', '7H'),
  -- Rabu
  ('rabu', '07:55', '09:55', 'Prakarya', '7I'),
  ('rabu', '11:10', '11:50', 'IPA', '7C'),
  ('rabu', '12:35', '13:55', 'IPA', '7C'),
  ('rabu', '13:50', '14:30', 'Prakarya', '7F'),
  -- Kamis
  ('kamis', '07:15', '08:35', 'Prakarya', '7G'),
  ('kamis', '08:35', '09:55', 'IPA', '7A'),
  ('kamis', '10:25', '11:05', 'IPA', '7A'),
  ('kamis', '13:10', '14:30', 'IPA', '7C'),
  -- Jumat
  ('jumat', '07:30', '09:30', 'IPA', '7B'),
  ('jumat', '10:00', '11:20', 'IPA', '7A')
) as j(hari, jam_mulai, jam_selesai, mapel, kelas);

-- ============================================================
-- SELESAI — jadwal mingguan terisi
-- ============================================================
