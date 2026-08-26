-- =========================================================================
-- INSERT SOAL: Ulangan Bab 1 IPA Kelas 8 — Gizi, Sistem Pencernaan, dan
-- Sistem Peredaran Darah (46 soal: 20 PG, 10 PGK, 5 B/S, 1 Menjodohkan
-- berisi 5 pasangan, 5 Isian Singkat, 5 Uraian HOTS)
--
-- Jalankan SETELAH schema_ulangan.sql (v2) selesai dijalankan.
--
-- Sesi ini disambungkan ke assessment yang SUDAH ADA di Teacher Planner kamu:
--   "Nasi Piringku, Giziku, Sehatku" — IPA, KKM 75
--   (id: fed1e0a3-016b-4df5-9c4f-a9ea2d8fdd33)
-- Nilai otomatis akan masuk ke assessment_items milik assessment ini.
-- ⚠️ Kalau ternyata assessment yang dituju BUKAN ini, ganti UUID di baris
-- "WHERE id = '...'" di bawah dengan id assessment yang benar sebelum run.
-- owner_id TIDAK perlu diisi manual lagi — otomatis diambil dari assessment
-- yang sudah ada (menghindari masalah auth.uid() NULL di SQL Editor).
-- =========================================================================

WITH target_assessment AS (
  SELECT id AS assessment_id, owner_id
  FROM assessments
  WHERE id = 'fed1e0a3-016b-4df5-9c4f-a9ea2d8fdd33'
),
new_sesi AS (
  INSERT INTO sesi_ulangan (assessment_id, durasi_menit, status, owner_id)
  SELECT assessment_id, 90, 'draft', owner_id FROM target_assessment
  RETURNING id, owner_id
)
INSERT INTO bank_soal_ulangan
  (sesi_id, urutan, tipe_soal, pertanyaan, opsi, kiri, kanan, kunci_jawaban, bobot, is_hots, rubrik, owner_id)
SELECT ns.id, v.urutan, v.tipe_soal, v.pertanyaan, v.opsi, v.kiri, v.kanan, v.kunci_jawaban, v.bobot, v.is_hots, v.rubrik, ns.owner_id
FROM new_sesi ns,
(VALUES
  (1, 'pg_biasa', 'Zat gizi yang berfungsi sebagai sumber tenaga utama bagi tubuh adalah ...', '["Karbohidrat", "Protein", "Vitamin", "Air"]'::jsonb, NULL::jsonb, NULL::jsonb, '0'::jsonb, 1, false, NULL),
  (2, 'pg_biasa', 'Doni ingin memperbaiki sel-sel tubuhnya yang rusak setelah sakit. Makanan yang paling tepat ia tambahkan adalah ...', '["Nasi", "Telur", "Air putih", "Permen"]'::jsonb, NULL::jsonb, NULL::jsonb, '1'::jsonb, 1, false, NULL),
  (3, 'pg_biasa', 'Berdasarkan tabel, sayur dan buah bermanfaat untuk ...', '["Sumber tenaga utama", "Menjaga daya tahan tubuh", "Membentuk otot besar", "Mengganti darah yang hilang"]'::jsonb, NULL::jsonb, NULL::jsonb, '1'::jsonb, 1, false, NULL),
  (4, 'pg_biasa', 'Berdasarkan pedoman Isi Piringku, satu piring makan sebaiknya diisi oleh ...', '["Nasi saja", "Sayur, buah, makanan pokok, dan lauk-pauk", "Lauk-pauk saja", "Gorengan dan es teh manis"]'::jsonb, NULL::jsonb, NULL::jsonb, '1'::jsonb, 1, false, NULL),
  (5, 'pg_biasa', 'Rani makan siang dengan nasi, ayam goreng, dan kerupuk, tanpa sayur maupun buah. Menurut pedoman Isi Piringku, yang perlu Rani tambahkan adalah ...', '["Nasi tambahan", "Sayur dan buah", "Kerupuk tambahan", "Ayam goreng tambahan"]'::jsonb, NULL::jsonb, NULL::jsonb, '1'::jsonb, 1, false, NULL),
  (6, 'pg_biasa', 'Selain mengatur makanan, pedoman Isi Piringku juga menganjurkan agar seseorang ...', '["Tidur sepanjang hari", "Bergerak aktif/berolahraga setiap hari", "Menghindari minum air putih", "Makan hanya satu kali sehari"]'::jsonb, NULL::jsonb, NULL::jsonb, '1'::jsonb, 1, false, NULL),
  (7, 'pg_biasa', 'Manakah pasangan makanan yang paling sesuai dengan prinsip Isi Piringku dalam satu porsi makan?', '["Nasi, ayam, tempe, dan bayam", "Nasi dan kerupuk saja", "Mi instan dan es krim", "Keripik dan minuman bersoda"]'::jsonb, NULL::jsonb, NULL::jsonb, '0'::jsonb, 1, false, NULL),
  (8, 'pg_biasa', 'Urutan organ pencernaan yang tepat setelah makanan masuk ke mulut adalah ...', '["Mulut - Lambung - Kerongkongan - Usus Halus", "Mulut - Kerongkongan - Lambung - Usus Halus", "Mulut - Usus Halus - Lambung - Kerongkongan", "Mulut - Anus - Lambung - Usus Halus"]'::jsonb, NULL::jsonb, NULL::jsonb, '1'::jsonb, 1, false, NULL),
  (9, 'pg_biasa', 'Organ tempat penyerapan sari-sari makanan ke dalam pembuluh darah adalah ...', '["Kerongkongan", "Lambung", "Usus halus", "Anus"]'::jsonb, NULL::jsonb, NULL::jsonb, '2'::jsonb, 1, false, NULL),
  (10, 'pg_biasa', 'Fungsi utama usus besar dalam sistem pencernaan adalah ...', '["Mengunyah makanan", "Menyerap sari makanan", "Memadatkan sisa makanan menjadi feses", "Menghasilkan air liur"]'::jsonb, NULL::jsonb, NULL::jsonb, '2'::jsonb, 1, false, NULL),
  (11, 'pg_biasa', 'Di dalam mulut, makanan dicerna secara mekanik dengan bantuan ...', '["Asam lambung", "Gigi", "Usus halus", "Feses"]'::jsonb, NULL::jsonb, NULL::jsonb, '1'::jsonb, 1, false, NULL),
  (12, 'pg_biasa', 'Made jarang mengunyah makanannya dengan baik, jarang minum air putih, dan jarang makan sayur, lalu mengalami sembelit. Penyebab utamanya adalah ...', '["Terlalu banyak makan sayur", "Kurang minum air putih dan kurang makan sayur (kurang serat)", "Terlalu banyak minum air putih", "Terlalu sering mengunyah makanan"]'::jsonb, NULL::jsonb, NULL::jsonb, '1'::jsonb, 1, false, NULL),
  (13, 'pg_biasa', 'Saran yang paling tepat untuk membantu mengatasi masalah Made adalah ...', '["Mengurangi minum air putih", "Memperbanyak makan sayur, buah, dan minum air putih yang cukup", "Makan lebih terburu-buru", "Berhenti makan sama sekali"]'::jsonb, NULL::jsonb, NULL::jsonb, '1'::jsonb, 1, false, NULL),
  (14, 'pg_biasa', 'Kebiasaan mengunyah makanan dengan baik (tidak terburu-buru) bermanfaat untuk ...', '["Membuat makanan lebih mudah dicerna oleh lambung", "Membuat makanan langsung menjadi feses", "Mengurangi rasa lapar selamanya", "Menghentikan produksi air liur"]'::jsonb, NULL::jsonb, NULL::jsonb, '0'::jsonb, 1, false, NULL),
  (15, 'pg_biasa', 'Fungsi utama jantung dalam tubuh manusia adalah ...', '["Mencerna makanan", "Memompa darah ke seluruh tubuh", "Menyaring udara pernapasan", "Menghasilkan air liur"]'::jsonb, NULL::jsonb, NULL::jsonb, '1'::jsonb, 1, false, NULL),
  (16, 'pg_biasa', 'Jumlah ruang pada jantung manusia adalah ...', '["Dua ruang", "Tiga ruang", "Empat ruang", "Lima ruang"]'::jsonb, NULL::jsonb, NULL::jsonb, '2'::jsonb, 1, false, NULL),
  (17, 'pg_biasa', 'Darah yang dipompa oleh jantung mengalir ke seluruh tubuh melalui ...', '["Usus halus", "Pembuluh darah", "Lambung", "Paru-paru saja"]'::jsonb, NULL::jsonb, NULL::jsonb, '1'::jsonb, 1, false, NULL),
  (18, 'pg_biasa', 'Komponen darah yang bertugas mengangkut oksigen ke seluruh tubuh adalah ...', '["Sel darah merah", "Sel darah putih", "Keping darah", "Plasma darah"]'::jsonb, NULL::jsonb, NULL::jsonb, '0'::jsonb, 1, false, NULL),
  (19, 'pg_biasa', 'Ketika tangan kita terluka dan berdarah, darah lama-kelamaan akan membeku. Komponen darah yang berperan dalam proses ini adalah ...', '["Sel darah merah", "Sel darah putih", "Keping darah", "Plasma darah"]'::jsonb, NULL::jsonb, NULL::jsonb, '2'::jsonb, 1, false, NULL),
  (20, 'pg_biasa', 'Saat tubuh terkena flu, komponen darah yang bertugas melawan kuman penyebab flu adalah ...', '["Sel darah merah", "Sel darah putih", "Keping darah", "Plasma darah"]'::jsonb, NULL::jsonb, NULL::jsonb, '1'::jsonb, 1, false, NULL),
  (21, 'pg_kompleks', 'Sinta jarang sarapan, sering jajan makanan manis, jarang makan sayur/buah, dan jarang bergerak aktif. Kebiasaan Sinta yang TIDAK sesuai pola hidup sehat adalah ... (pilih semua yang sesuai)', '["Jarang sarapan", "Sering makan makanan manis berlebihan", "Rutin makan sayur dan buah", "Jarang bergerak aktif"]'::jsonb, NULL::jsonb, NULL::jsonb, '[0, 1, 3]'::jsonb, 2, false, NULL),
  (22, 'pg_kompleks', 'Jika kebiasaan Sinta terus berlanjut, ia berisiko mengalami ... (pilih semua yang sesuai)', '["Kekurangan zat gizi seimbang", "Gangguan pencernaan seperti sembelit", "Badan menjadi lebih bugar", "Kelebihan gula yang tidak baik bagi tubuh"]'::jsonb, NULL::jsonb, NULL::jsonb, '[0, 1, 3]'::jsonb, 2, false, NULL),
  (23, 'pg_kompleks', 'Saran yang tepat untuk memperbaiki kebiasaan Sinta adalah ... (pilih semua yang sesuai)', '["Membiasakan sarapan sehat", "Menambah porsi sayur dan buah", "Terus mengonsumsi minuman manis setiap hari", "Rutin bergerak aktif/berolahraga"]'::jsonb, NULL::jsonb, NULL::jsonb, '[0, 1, 3]'::jsonb, 2, false, NULL),
  (24, 'pg_kompleks', 'Organ-organ berikut yang termasuk bagian dari saluran pencernaan manusia adalah ... (pilih semua yang sesuai)', '["Mulut", "Lambung", "Jantung", "Usus halus"]'::jsonb, NULL::jsonb, NULL::jsonb, '[0, 1, 3]'::jsonb, 2, false, NULL),
  (25, 'pg_kompleks', 'Berikut ini yang merupakan fungsi lambung dalam pencernaan adalah ... (pilih semua yang sesuai)', '["Mengaduk makanan", "Mencerna makanan dengan bantuan asam lambung", "Menyerap seluruh sari makanan", "Menghasilkan air liur"]'::jsonb, NULL::jsonb, NULL::jsonb, '[0, 1]'::jsonb, 2, false, NULL),
  (26, 'pg_kompleks', 'Kebiasaan berikut yang dapat menjaga kesehatan sistem pencernaan adalah ... (pilih semua yang sesuai)', '["Makan tepat waktu", "Mengunyah makanan sampai halus", "Menahan buang air besar terlalu lama", "Minum air putih yang cukup"]'::jsonb, NULL::jsonb, NULL::jsonb, '[0, 1, 3]'::jsonb, 2, false, NULL),
  (27, 'pg_kompleks', 'Pak Budi (50 th) tekanan darah tinggi, disarankan dokter mengurangi makanan asin/berlemak dan rutin olahraga ringan. Saran dokter bertujuan untuk ... (pilih semua yang sesuai)', '["Menurunkan risiko tekanan darah semakin tinggi", "Menjaga kesehatan jantung dan pembuluh darah", "Menambah kadar garam dalam tubuh", "Membantu tubuh tetap bugar"]'::jsonb, NULL::jsonb, NULL::jsonb, '[0, 1, 3]'::jsonb, 2, false, NULL),
  (28, 'pg_kompleks', 'Kebiasaan yang sebaiknya dihindari oleh Pak Budi adalah ... (pilih semua yang sesuai)', '["Sering makan makanan asin", "Sering makan gorengan berlemak", "Rutin berolahraga ringan", "Jarang bergerak/kurang aktivitas fisik"]'::jsonb, NULL::jsonb, NULL::jsonb, '[0, 1, 3]'::jsonb, 2, false, NULL),
  (29, 'pg_kompleks', 'Bagian tubuh yang berkaitan langsung dengan pengukuran tekanan darah adalah sistem ...', '["Peredaran darah", "Jantung dan pembuluh darah", "Pencernaan", "Otot lengan saja"]'::jsonb, NULL::jsonb, NULL::jsonb, '[1]'::jsonb, 2, false, NULL),
  (30, 'pg_kompleks', 'Pernyataan berikut yang benar tentang pentingnya menjaga tekanan darah adalah ... (pilih semua yang sesuai)', '["Tekanan darah yang terlalu tinggi berisiko bagi kesehatan jantung", "Pola makan sehat dapat membantu menjaga tekanan darah tetap normal", "Tekanan darah tidak berkaitan dengan kebiasaan makan", "Olahraga ringan dan teratur bermanfaat bagi kesehatan jantung"]'::jsonb, NULL::jsonb, NULL::jsonb, '[0, 1, 3]'::jsonb, 2, false, NULL),
  (31, 'benar_salah', 'Karbohidrat adalah zat gizi yang berfungsi sebagai sumber tenaga utama.', '["Benar", "Salah"]'::jsonb, NULL::jsonb, NULL::jsonb, '0'::jsonb, 1, false, NULL),
  (32, 'benar_salah', 'Pencernaan makanan dimulai dari lambung, bukan dari mulut.', '["Benar", "Salah"]'::jsonb, NULL::jsonb, NULL::jsonb, '1'::jsonb, 1, false, NULL),
  (33, 'benar_salah', 'Usus halus adalah tempat utama penyerapan sari-sari makanan.', '["Benar", "Salah"]'::jsonb, NULL::jsonb, NULL::jsonb, '0'::jsonb, 1, false, NULL),
  (34, 'benar_salah', 'Jantung manusia memiliki empat ruang.', '["Benar", "Salah"]'::jsonb, NULL::jsonb, NULL::jsonb, '0'::jsonb, 1, false, NULL),
  (35, 'benar_salah', 'Kurang makan sayur dan buah dapat menyebabkan gangguan pencernaan seperti sembelit.', '["Benar", "Salah"]'::jsonb, NULL::jsonb, NULL::jsonb, '0'::jsonb, 1, false, NULL),
  (36, 'menjodohkan', 'Jodohkan istilah pada Kolom A dengan keterangan yang tepat pada Kolom B.', NULL::jsonb, '["Karbohidrat", "Lambung", "Usus halus", "Jantung", "Sel darah merah"]'::jsonb, '["Organ tempat penyerapan sari makanan", "Zat gizi sumber tenaga utama", "Organ pencernaan yang menghasilkan asam lambung", "Komponen darah yang mengangkut oksigen", "Organ yang memompa darah ke seluruh tubuh"]'::jsonb, '{"0": 1, "1": 2, "2": 0, "3": 4, "4": 3}'::jsonb, 15, false, NULL),
  (37, 'isian_singkat', 'Organ pertama yang dilalui makanan dalam sistem pencernaan adalah ...', NULL::jsonb, NULL::jsonb, NULL::jsonb, '["mulut"]'::jsonb, 2, false, NULL),
  (38, 'isian_singkat', 'Zat gizi yang berfungsi membangun dan mengganti sel-sel tubuh yang rusak adalah ...', NULL::jsonb, NULL::jsonb, NULL::jsonb, '["protein"]'::jsonb, 2, false, NULL),
  (39, 'isian_singkat', 'Sisa makanan yang tidak dapat diserap tubuh akan dipadatkan menjadi feses di organ ...', NULL::jsonb, NULL::jsonb, NULL::jsonb, '["usus besar"]'::jsonb, 2, false, NULL),
  (40, 'isian_singkat', 'Komponen darah yang berfungsi melawan kuman penyakit adalah ...', NULL::jsonb, NULL::jsonb, NULL::jsonb, '["sel darah putih", "leukosit"]'::jsonb, 2, false, NULL),
  (41, 'isian_singkat', 'Menurut pedoman Isi Piringku, aktivitas fisik dianjurkan dilakukan minimal ... menit setiap hari.', NULL::jsonb, NULL::jsonb, NULL::jsonb, '["30", "30 menit"]'::jsonb, 2, false, NULL),
  (42, 'uraian', 'Andi jarang sarapan, jarang makan sayur dan buah, serta sering jajan makanan cepat saji. a) Menurutmu, apa yang akan terjadi pada tubuh Andi jika kebiasaan ini berlangsung terus-menerus? Sebutkan minimal dua akibatnya. b) Berikan alasanmu mengapa hal tersebut bisa terjadi, dikaitkan dengan zat gizi yang kurang ia dapatkan.', NULL::jsonb, NULL::jsonb, NULL::jsonb, NULL::jsonb, 4, true, 'Poin penting: tubuh kekurangan tenaga/mudah lemas (kurang karbohidrat/sarapan), daya tahan tubuh menurun (kurang vitamin dari sayur-buah), atau gangguan pencernaan seperti sembelit (kurang serat). Jawaban baik menyebutkan minimal dua akibat beserta kaitannya dengan zat gizi yang kurang. Skala skor 0-4 sesuai rubrik holistik.'),
  (43, 'uraian', 'Perhatikan urutan organ pencernaan (Mulut - Kerongkongan - Lambung - Usus Halus - Usus Besar - Anus). a) Jika seseorang makan terlalu cepat tanpa mengunyah dengan baik, organ mana yang harus bekerja lebih berat untuk mencerna makanan tersebut? b) Jelaskan alasanmu.', NULL::jsonb, NULL::jsonb, NULL::jsonb, NULL::jsonb, 4, true, 'Poin penting: lambung harus bekerja lebih berat karena makanan yang belum halus lebih sulit dicerna secara mekanik, sehingga proses pencernaan menjadi lebih lama dan berat. Skala skor 0-4 sesuai rubrik holistik.'),
  (44, 'uraian', 'Sebuah iklan minuman berkata, Minuman ini menyegarkan dan baik untuk tubuh! Padahal minuman tersebut mengandung gula yang sangat tinggi. a) Menurutmu, apakah iklan tersebut sepenuhnya benar? Jelaskan alasanmu. b) Apa saran yang bisa kamu berikan kepada teman yang sering minum minuman tersebut?', NULL::jsonb, NULL::jsonb, NULL::jsonb, NULL::jsonb, 4, true, 'Poin penting: iklan tidak sepenuhnya benar karena hanya menonjolkan kesan menyegarkan tanpa menyebutkan kandungan gula tinggi yang berisiko (kegemukan/gangguan gula darah). Saran tepat: mengurangi konsumsi, memilih air putih sebagai alternatif. Skala skor 0-4 sesuai rubrik holistik.'),
  (45, 'uraian', 'Bandingkan tugas jantung dan tugas usus halus dalam tubuh manusia. a) Apa perbedaan utama fungsi keduanya? b) Menurutmu, apa yang akan terjadi pada tubuh jika salah satu dari kedua organ tersebut tidak bekerja dengan baik?', NULL::jsonb, NULL::jsonb, NULL::jsonb, NULL::jsonb, 4, true, 'Poin penting: jantung memompa darah ke seluruh tubuh, usus halus menyerap sari makanan. Jika jantung terganggu, aliran darah terhambat; jika usus halus terganggu, tubuh kekurangan zat gizi. Skala skor 0-4 sesuai rubrik holistik.'),
  (46, 'uraian', 'Sekolahmu ingin membuat aturan sederhana agar siswa lebih sehat, mulai dari pola makan sampai kebiasaan sehari-hari. a) Usulkan tiga kebiasaan sehat yang berkaitan dengan gizi, pencernaan, atau peredaran darah yang bisa diterapkan siswa di sekolah. b) Untuk setiap usulan, jelaskan secara singkat alasannya.', NULL::jsonb, NULL::jsonb, NULL::jsonb, NULL::jsonb, 4, true, 'Poin penting: usulan konkret misalnya membiasakan sarapan sehat, membawa bekal sayur-buah, minum air putih cukup, bergerak aktif saat istirahat - tiap usulan disertai alasan singkat terkait gizi/pencernaan/peredaran darah. Skala skor 0-4 sesuai rubrik holistik.')
) AS v(urutan, tipe_soal, pertanyaan, opsi, kiri, kanan, kunci_jawaban, bobot, is_hots, rubrik);

-- =========================================================================
-- Cek hasil insert:
-- SELECT id, judul, status FROM sesi_ulangan ORDER BY created_at DESC LIMIT 1;
-- SELECT count(*), sum(bobot) FROM bank_soal_ulangan WHERE sesi_id = '<id-sesi-di-atas>';
--   -> harus muncul 46 baris soal.

-- Begitu soal sudah dicek dan siap dipakai, aktifkan sesinya:
-- UPDATE sesi_ulangan SET status = 'aktif' WHERE id = '<id-sesi-di-atas>';
-- Setelah aktif, nilai otomatis akan tersinkron ke assessment_items begitu
-- siswa submit (tabel assessments "Nasi Piringku, Giziku, Sehatku" akan
-- terisi nilainya, terlihat juga di halaman Penilaian portal-ortu).

-- Link ulangan untuk siswa:
-- ulangan.html?sesi=<id-sesi-di-atas>
-- =========================================================================
