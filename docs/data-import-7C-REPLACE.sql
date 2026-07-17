-- ============================================================
-- Data Import: GANTI roster Kelas 7C dengan data resmi final
-- Sumber: DAFTAR_KELAS_7_TP_2627.xlsx
--
-- PERINGATAN: 7C sudah pernah diisi 33 siswa dari draft lama
-- ("MPLS Pasar Lama") yang HANYA 1 nama-nya sama dengan file resmi
-- ini. Script ini akan MENGHAPUS 33 siswa lama itu beserta SEMUA
-- data yang menempel ke mereka (presensi, nilai, prestasi/
-- pelanggaran, catatan pribadi, komunikasi ortu — semua ke-cascade
-- delete lewat foreign key), lalu isi 34 siswa dari roster resmi.
--
-- JANGAN jalankan kalau belum yakin. Backup dulu kalau perlu:
--   select * from students where class_id = (select id from classes where nama_kelas = '7C' limit 1);
-- ============================================================

delete from students
where class_id = (select id from classes where nama_kelas = '7C' order by created_at asc limit 1);

-- Isi ulang dengan 34 siswa dari roster resmi
insert into students (class_id, owner_id, nama, nis, jenis_kelamin)
select kelas_7c.id, kelas_7c.owner_id, siswa_baru.nama, siswa_baru.nis, siswa_baru.jenis_kelamin
from (values
  ('ABYAN FACHRY ANINDITO', '3132116042', 'L'),
  ('AHMAD DAFA AL-KAHFI FAUZI', '3136590188', 'L'),
  ('AHMAD FARIZ ARROSYID', '3131036940', 'L'),
  ('ANDRIANSYAH HERMAWAN', '3135750125', 'L'),
  ('AQILA TALITA HERMAWAN', '0135010590', 'P'),
  ('ARI SETYAWAN', '3142011640', 'L'),
  ('ARJUNA PERWIRA VIRENDRA NAKHLA', '3133814309', 'L'),
  ('ARJUNA QIANDRA AL-BANNA HERMAN', '3143638029', 'L'),
  ('HIKMAH AZ-ZAHRA', '0149321496', 'P'),
  ('JAHRA AISYATUN KHOERUN NISA', '0134395812', 'P'),
  ('KHANZA MAHARANI SITI AZ ZAHRA', '3145185042', 'P'),
  ('LIYANA ZAHIRA ARSAD', '3148438555', 'P'),
  ('LUKMAN MAULANA ALFARIZI', '3130250029', 'L'),
  ('MAULANA MALIK', '3139259779', 'L'),
  ('MUHAMAD REFAN SUGALIH', '3135392971', 'L'),
  ('MUHAMMAD RIFQI AL GHIFARI', '3138639117', 'L'),
  ('MUHAMMAD SATRIADI PRAYITNO', '3138822385', 'L'),
  ('NABILA TRI ANANDA EKA PUTRI', '3135824853', 'P'),
  ('NADILA NURLAILLA', '0154588108', 'P'),
  ('NADIN FELLYNDA', '3142575695', 'P'),
  ('NADINE ZAHWA PUTRI', '3127336654', 'P'),
  ('NANDA SHIDQIA PUTRI SULAIMAN', '0137647680', 'P'),
  ('NAOMI LATISHA AQUINA', '3147205885', 'P'),
  ('NAYAKA RAMADHAN PRATAMA', '3135725909', 'L'),
  ('NAYLA DESTIANTY', '3131329971', 'P'),
  ('NAYSILLA SITI SALSABILA', '0146335987', 'P'),
  ('QORI ZULFAHMY', '0131107455', 'L'),
  ('RAHMA MAULIDA NUFUS', '0141657297', 'P'),
  ('SHONAJI AL ASKOLANI', '0137084530', 'L'),
  ('SITI CHOIRUNNISA ALJABBAR', '0142367364', 'P'),
  ('SYAFA AYUNDA FEBRIYANTI', '3147312536', 'P'),
  ('TRISNO AJI', '3137154277', 'L'),
  ('YUNITA AZZAHRA', '3133415055', 'P'),
  ('ZILFA ADIBA KAHFI', '0142691990', 'P')
) as siswa_baru(nama, nis, jenis_kelamin)
cross join (
  select id, owner_id from classes where nama_kelas = '7C' order by created_at asc limit 1
) as kelas_7c;

-- ============================================================
-- SELESAI
-- ============================================================