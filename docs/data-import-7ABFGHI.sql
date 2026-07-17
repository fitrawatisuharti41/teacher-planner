-- ============================================================
-- Data Import: Siswa Kelas 7A, 7B, 7F, 7G, 7H, 7I (roster final TP 2026/2027)
-- Sumber: DAFTAR_KELAS_7_TP_2627.xlsx (resmi, SMPN 8 Kota Tangerang)
-- Kelasnya sendiri sudah ada (dibuat kosong di data-import-8A.sql),
-- migration ini cuma isi siswanya. Aman dijalankan berkali-kali.
-- ============================================================

-- Kelas 7A: 34 siswa
insert into students (class_id, owner_id, nama, nis, jenis_kelamin)
select kelas_7a.id, kelas_7a.owner_id, siswa_baru.nama, siswa_baru.nis, siswa_baru.jenis_kelamin
from (values
  ('ABDURAHMAN WAHIDIN', '3131607659', 'L'),
  ('ABINAYA ZAHDAN FAHREZA', '3147680544', 'L'),
  ('AFIQA PUTRI SETYAWAN', '0148637261', 'P'),
  ('AGAM ANUGRAH PRATAMA', '3146889514', 'L'),
  ('ALMAHYRA FAZZILET RAHAYU DHIYANTO', '0147802424', 'P'),
  ('ANANG TRIONO', '3145795832', 'L'),
  ('ANGGITA BR SIJABAT', '0145047686', 'P'),
  ('ARIEF HARDIANSYAH', '3130246582', 'L'),
  ('ARKAN PUTRA PRATAMA', '0134063108', 'L'),
  ('ARKAN ZAHID ALGHANI', '3148590828', 'L'),
  ('AZAHRA AL YASMIN', '0138928759', 'P'),
  ('AZIZZAH HULWAH FARROSAH', '3133716696', 'P'),
  ('BAGAS EGI PRATAMA', '3142539107', 'L'),
  ('CALLISTA EVALENT HERDISHA', '0132936523', 'P'),
  ('CHRISTABEL FIDELIA SITIO', '0143514250', 'P'),
  ('DHEREN RAFKHA ABIZAR', '3139236968', 'L'),
  ('DYAH AYU PERMATASARI', '0142619132', 'P'),
  ('DZAKY ALMAIR AZZAMY', '3148927727', 'L'),
  ('FATHIR MUWAHID CHAIRUL AZAM', '3132858564', 'L'),
  ('GINA KAMILA', '3148585145', 'P'),
  ('GITA AULIA IZZATUNNISA', '0132628633', 'P'),
  ('HAFIZAH FITRIANI', '3136814805', 'P'),
  ('IVANUR ISFANA', '3130693052', 'P'),
  ('MUHAMAD HARUN EL-RASYID', '3134674036', 'L'),
  ('MUHAMAD NAUVAL AL''KHALEFA', '3135099273', 'L'),
  ('MUHAMMAD FARIZ DEWA PUTRA', '3138472140', 'L'),
  ('NATHA ZARQA KHALIEFAWATI', '3132631915', 'P'),
  ('NEJAMUDIN FEBIANO', '3136252510', 'L'),
  ('PALSYA SELBIA AVNUR', '0136711159', 'P'),
  ('PANCA ADY WIJAYANTO', '3149982392', 'L'),
  ('RAFA ALTAFIAN', '3147360293', 'L'),
  ('RAFILLAH ELYSIA MURTABA', '0144622736', 'P'),
  ('RASYA BRATA WIMANTARA', '0139792709', 'L'),
  ('SHAFIRA RAMADHANI', '0136463725', 'P')
) as siswa_baru(nama, nis, jenis_kelamin)
cross join (
  select id, owner_id from classes where nama_kelas = '7A' order by created_at asc limit 1
) as kelas_7a
where not exists (
  select 1 from students s where s.nis = siswa_baru.nis and s.class_id = kelas_7a.id
);

-- Kelas 7B: 34 siswa
insert into students (class_id, owner_id, nama, nis, jenis_kelamin)
select kelas_7b.id, kelas_7b.owner_id, siswa_baru.nama, siswa_baru.nis, siswa_baru.jenis_kelamin
from (values
  ('ABID FHADIL ABIYAN', '3132442725', 'L'),
  ('ADAM ANDRIAN DARMAWAN', '0141210450', 'L'),
  ('AINA TALITA ZAHRAN', '3135548906', 'P'),
  ('AL MAIRA IZDIHAR NAZMI', '0143899725', 'P'),
  ('AZKA SATRIA WICAKSANA', '0143064171', 'L'),
  ('AZZAM FAIZ ABDILLAH', '3142661255', 'L'),
  ('CHANDRA RIZQI PRATAMA', '3137008838', 'L'),
  ('DAFFA ADITYA SYAHPUTRA', '0134531400', 'L'),
  ('DEMA ABYAN MUZAKI', '3136458849', 'L'),
  ('DEVI RATNA AYU', '3130011483', 'P'),
  ('DI AUFAR SEPTIAN AL FAJAR', '3137847997', 'L'),
  ('DIAN SUKMA FITRIANI', '0135347026', 'P'),
  ('DIRGA AINNURACHMAN', '0138418386', 'L'),
  ('DWI PUTRI AQILA AL-ZAHRA', '0146032058', 'P'),
  ('FAIRUZ ZAIDATUS SHULUHIYAH', '3133683447', 'P'),
  ('FAKHRI ZIYAD RAMADHAN', '3137665375', 'L'),
  ('FERDIAN PUTRA RAMADHAN', '0135061507', 'L'),
  ('FREDA NASMIRAMAHESWARI CAHYAGAMA', '3147523346', 'P'),
  ('HAIKAL PRATAMA SANTOSO', '3133320838', 'L'),
  ('HANA AISH SALMA', '0141323794', 'P'),
  ('HAURA NAZIFA RAHMA', '3141518898', 'P'),
  ('KENZO XAVIER SITUMORANG', '0132805687', 'L'),
  ('KEZIA ANDRIYANI PUTRI', '3138862701', 'P'),
  ('KHAYLA ALMIRA MARITZA', '3147394807', 'P'),
  ('MUHAMAD FAHRI ADITIA', '0148939778', 'L'),
  ('MUHAMMAD DAFFA ABDULLAH', '3135314335', 'L'),
  ('MUHAMMAD MOZA HAKIKI', '3139897762', 'L'),
  ('NADHIFA KEISHA ZAHIRANI', '0137544782', 'P'),
  ('RAUDOTU DINAR', '0137907805', 'P'),
  ('RUZHAIN JIRAHUL WAFIDI', '3139870770', 'L'),
  ('TRI WIJAYA KUSUMA ATMADJA', '3120193104', 'L'),
  ('YASYFA GURUH PERMATA PUTRY', '3134828531', 'P'),
  ('YUNI WILLDANIA', '3142942741', 'P'),
  ('ZEIN BILAL AL-BANTANI', '3134394026', 'L')
) as siswa_baru(nama, nis, jenis_kelamin)
cross join (
  select id, owner_id from classes where nama_kelas = '7B' order by created_at asc limit 1
) as kelas_7b
where not exists (
  select 1 from students s where s.nis = siswa_baru.nis and s.class_id = kelas_7b.id
);

-- Kelas 7F: 34 siswa
insert into students (class_id, owner_id, nama, nis, jenis_kelamin)
select kelas_7f.id, kelas_7f.owner_id, siswa_baru.nama, siswa_baru.nis, siswa_baru.jenis_kelamin
from (values
  ('ALBY PRATAMA ISKANDAR', '3138760056', 'L'),
  ('ALIN NURCAHYADI', '0137458350', 'P'),
  ('ALVARO SABILAH HIDAYAT', '3138808734', 'L'),
  ('ANANDA ELIVA FASYA', '0144909583', 'P'),
  ('AQILA ZAHRA OKTAVIANI', '3131776391', 'P'),
  ('AQILLA SYAH MIDA RIFFA', '3135625070', 'P'),
  ('ARIEL YUSUF', '3132209961', 'L'),
  ('ARJUNA GILAR SHAUM ABRISAM', '3148020323', 'L'),
  ('ARJUNA IBRAHIM WAHYU NUGROHO', '0148752273', 'L'),
  ('ATHALLA YUDHISTIRA WINANDAR', '3144965467', 'L'),
  ('AYU APRIANTI', '3132708509', 'P'),
  ('AZHILLA MAURA SHEERA', '3134914347', 'P'),
  ('AZKA AKHMAWAN HARIZON', '3135968899', 'L'),
  ('AZKA RAFIF SAVA', '0137306745', 'L'),
  ('ERISKA DWI RAMADHANI', '0131156607', 'P'),
  ('FARREL KEANDRA ARWIYANTO', '0148986796', 'L'),
  ('HAIKAL ALVIANSAH', '3144884436', 'L'),
  ('MELODY INDRIA DEANALOVA', '0144106616', 'P'),
  ('MUTIA DWI ARIYANTI', '0144435783', 'P'),
  ('NADHYRA AL FHATIN WIBOWO', '3139396392', 'P'),
  ('NATHANIELA AGUSTINE PAMUDJI', '0132293098', 'P'),
  ('NAURA AZQILYA ASHARI', '3134133478', 'P'),
  ('NEO ANDIKA PUTRA', '0141366481', 'L'),
  ('NEYMAR ASHRAFF AL-HAKAM', '3131272862', 'L'),
  ('RAFIF FIKRI RIZQULLAH', '0144324828', 'L'),
  ('REHAN PUTRA PRIYANTO', '0133768645', 'L'),
  ('RIZA ABIDZAR RAMADHAN', '0146750806', 'L'),
  ('SALWA DIYANAH TRIKURNIA', '0135606389', 'P'),
  ('SILVIA ANINDYA PUTRI', '3141670522', 'P'),
  ('SYAHLA QAFISHAQURRATUL''AIN', '3146883129', 'P'),
  ('TALITA DARIATUL JANNAH', '3130507969', 'P'),
  ('THIRFA MUFIDA KHUMAIROH', '3143474019', 'P'),
  ('TIKLAMAH JAZILA KALANI', '3144868721', 'P'),
  ('ZETTY NURIYANSYAH PUTRA', '3135192041', 'L')
) as siswa_baru(nama, nis, jenis_kelamin)
cross join (
  select id, owner_id from classes where nama_kelas = '7F' order by created_at asc limit 1
) as kelas_7f
where not exists (
  select 1 from students s where s.nis = siswa_baru.nis and s.class_id = kelas_7f.id
);

-- Kelas 7G: 34 siswa
insert into students (class_id, owner_id, nama, nis, jenis_kelamin)
select kelas_7g.id, kelas_7g.owner_id, siswa_baru.nama, siswa_baru.nis, siswa_baru.jenis_kelamin
from (values
  ('AUFA NUR AZHAR', '3136923806', 'P'),
  ('AURHA CANTIKA', '0143829396', 'P'),
  ('AZZAHRA PUTRI NURIMAN', '3137635353', 'P'),
  ('DAFFA NUR RIZQY', '0132458105', 'L'),
  ('DAVA HAMUDI', '3133006712', 'L'),
  ('ELVALENA KHANZA', '3137617073', 'P'),
  ('ERLEND AERINDA NUR MAYSATAMA', '0135954706', 'P'),
  ('EVAN RAHMAT LAKSANA', '3138633289', 'L'),
  ('ILAL NUR SYAEFI', '3145125435', 'L'),
  ('JERYCHO EFRAIM SIMANJUNTAK', '0147659071', 'L'),
  ('LINTANG LANGIT RAMADHAN', '3135188804', 'L'),
  ('LUTFIA ZAHRA TALITA', '3148099849', 'P'),
  ('MUFLIHAH NUR NAJIAH', '0138749887', 'P'),
  ('MUHAMAD FAQIH AL RASYID', '0135034212', 'L'),
  ('MUHAMMAD AZKA AL GHIFARI', '3147806426', 'L'),
  ('MUHAMMAD DAFIR NUR FAUZI', '3139188426', 'L'),
  ('MUHAMMAD DALFA SYAHREZA', '3132849668', 'L'),
  ('MUHAMMAD HASBI SUTISNA', '3138337887', 'L'),
  ('MUHAMMAD TUBAGUS INDRA', '3140906442', 'L'),
  ('MUHAMMAD ZIDAN SAPUTRA', '3145966363', 'L'),
  ('NADYA PUTRI ARDANI', '3136149047', 'P'),
  ('NAILA ROYIJATUN NISA', '3141219245', 'P'),
  ('NAZWA AZZAHRA MILUDI', '0132495223', 'P'),
  ('NURANISSA', '0114626440', 'P'),
  ('RIO RAZABBANI', '0135199727', 'L'),
  ('SABRINA ADIBA NUR''ANI', '3133108431', 'P'),
  ('SALWAH', '3136053269', 'P'),
  ('SHAKIRA ADELIA ARTHA HABI', '0148312359', 'P'),
  ('SITI HALIMATU SADIAH', '3142705270', 'P'),
  ('SUCI NUR AFIFAH GUNAWAN', '3147396770', 'P'),
  ('TUBAGUS FIQI ALBANTANI', '3133509537', 'L'),
  ('WILLI ELLFANDER TINAMBUNAN', '0139226483', 'L'),
  ('ZAHIRA MARYAM SHAFA MAISA', '3135057038', 'P'),
  ('ZIA CALLISTA PUTRI', '0137514974', 'P')
) as siswa_baru(nama, nis, jenis_kelamin)
cross join (
  select id, owner_id from classes where nama_kelas = '7G' order by created_at asc limit 1
) as kelas_7g
where not exists (
  select 1 from students s where s.nis = siswa_baru.nis and s.class_id = kelas_7g.id
);

-- Kelas 7H: 34 siswa
insert into students (class_id, owner_id, nama, nis, jenis_kelamin)
select kelas_7h.id, kelas_7h.owner_id, siswa_baru.nama, siswa_baru.nis, siswa_baru.jenis_kelamin
from (values
  ('ADHI PRAMUDIYA', '3134577794', 'L'),
  ('ADRIAN HAFIZ SENTONO', '3149337906', 'L'),
  ('AFNIA NUR HAFIZA', '0136372396', 'P'),
  ('AHMAD RAMA ADITYA SAPUTRA', '3134996955', 'L'),
  ('AQILA AZZAHRA OKTAVIA', '3130339065', 'P'),
  ('AQILA PUTRI RAMADHANI', '3133226111', 'P'),
  ('ARNESYA AJENG LARASATI', '3139178034', 'P'),
  ('ARYA', '3137038431', 'L'),
  ('ASMIRANDA PUTRI YUDHA', '3147707457', 'P'),
  ('DWI PUTRA ARLANDO', '0133564546', 'L'),
  ('FADLAN FATAN NUGRAHA', '0138324036', 'L'),
  ('FAJAR AGUNG PRASETYA', '0132096695', 'L'),
  ('HILWAH ZAKIYA ZAHRA', '3136619028', 'P'),
  ('ILHAM ABDI DJAYA', '0133239787', 'L'),
  ('INDAH DWI RAMADHANI', '3132739945', 'P'),
  ('LETISYA NAOMI PUTRI', '3133146681', 'P'),
  ('LUTFI DWI AL RIFSI', '0138667607', 'P'),
  ('MILA RAHMAWATI', '3135027604', 'P'),
  ('MOHAMAD ZULFIAN FIKRI', '3143766857', 'L'),
  ('MUCHAMMAD ALFARENJI MARTADILLAH', '0132328942', 'L'),
  ('MUHAMAD ARYA FATUROHMAN', '3144779463', 'L'),
  ('MUHAMAD ILHAM ARSIL', '3143936096', 'L'),
  ('MUHAMMAD GALANG ALFATIH', '3144204421', 'L'),
  ('MUHAMMAD RIDWAN IRWANSYAH', '3135213373', 'L'),
  ('MUHAMMAD SOHIBUN NAZAR', '3131708768', 'L'),
  ('MUTIARA ERLIANI', '3136073970', 'P'),
  ('NAUFAN ADITYA SAPUTRA', '3136433050', 'L'),
  ('NAYLA AULIA PUTRI', '3140711895', 'P'),
  ('NAYLA FITRIA ANJANI', '0137054561', 'P'),
  ('QUEENZHA RISTONIA AQILLA ZIDNEY', '3139941275', 'P'),
  ('SHIDKIA PUTRI', '3139416988', 'P'),
  ('SIFA MAULIDA', '0132591374', 'P'),
  ('SILVIA LUDIYA KHASANAH', '3143570576', 'P'),
  ('ZAHRA AMALIA PUTRI', '0149352448', 'P')
) as siswa_baru(nama, nis, jenis_kelamin)
cross join (
  select id, owner_id from classes where nama_kelas = '7H' order by created_at asc limit 1
) as kelas_7h
where not exists (
  select 1 from students s where s.nis = siswa_baru.nis and s.class_id = kelas_7h.id
);

-- Kelas 7I: 33 siswa
insert into students (class_id, owner_id, nama, nis, jenis_kelamin)
select kelas_7i.id, kelas_7i.owner_id, siswa_baru.nama, siswa_baru.nis, siswa_baru.jenis_kelamin
from (values
  ('ADELIA INTAN NUR''AINI', '0147862267', 'P'),
  ('ADIBA SAIRIRA ARIFIN', '3136565697', 'P'),
  ('AGMA SATRIA SETYAWAN', '3142784268', 'L'),
  ('AL BAIHAQI KAIJAN', '3136874629', 'L'),
  ('ANNISA SUKMA MELATI', '3133230564', 'P'),
  ('AYUNDA KIRANA NAORA DEWI', '3149901089', 'P'),
  ('BAGAS DWI PERMANA', '0138466393', 'L'),
  ('BILQIS FAIHA RIFDA', '0144343503', 'P'),
  ('DEANI NANDARA', '0123382599', 'P'),
  ('FABIANCA ANINDYA NURIEL', '3141241200', 'P'),
  ('FAIZA ALYA AZIZA', '0149847021', 'P'),
  ('KEN WISANG JATI', '0135007135', 'L'),
  ('LELY MAULIDA', '3145460391', 'P'),
  ('MUHAMAD FAIZ DZIKRILLAH', '3134139780', 'L'),
  ('MUHAMAD GILANG DARMAWAN', '3140046324', 'L'),
  ('MUHAMMAD ALVIN AL-ZAIDAN', '0134468624', 'L'),
  ('MUSTAJI IRINA', '0134046355', 'P'),
  ('NABILA SYAKILA WIJAYA', '3137933019', 'P'),
  ('NILA ANJANI', '0142031362', 'P'),
  ('RAIHAN CIELO NUGROHO', '3138344556', 'L'),
  ('RIO CHANDRA QIRANA', '0125773658', 'L'),
  ('ROHMAT', '3144300321', 'L'),
  ('SETIA AULIA RAHMADANI', '3138533351', 'P'),
  ('SYADEWA PURNAMA', '3130361762', 'L'),
  ('SYAHIRA MAULIDA', '3143875286', 'P'),
  ('SYAKILA SEPTIA MUDITA', '0133249255', 'P'),
  ('TEGUH GILANG GUMILAR', '3133883935', 'L'),
  ('TSALSA TSAMROTUL SIDQIYA', '3148348942', 'P'),
  ('VADIN RAFARDHAN ATHALLA SURYANTO', '3130526692', 'L'),
  ('YURVIRA AIDIA CANDRA DINMA', '3135074630', 'P'),
  ('YUVALEN SAYDEN FATIKHAH', '3136127293', 'P'),
  ('ZAYN JAVAD MALIK', '0144820451', 'L'),
  ('ZIDAN FATUR ROHMAN', '0138489551', 'L')
) as siswa_baru(nama, nis, jenis_kelamin)
cross join (
  select id, owner_id from classes where nama_kelas = '7I' order by created_at asc limit 1
) as kelas_7i
where not exists (
  select 1 from students s where s.nis = siswa_baru.nis and s.class_id = kelas_7i.id
);

-- Jaga-jaga: pastikan wali_kelas_id 7C ke-set ke guru ini (kalau belum)
update classes set wali_kelas_id = owner_id
where nama_kelas = '7C' and wali_kelas_id is null;

-- ============================================================
-- SELESAI
-- ============================================================