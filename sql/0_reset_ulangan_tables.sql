-- =========================================================================
-- RESET: hapus tabel ulangan versi lama (struktur lama: sesi_ulangan punya
-- kolom judul/kelas/mapel sendiri, belum terhubung ke assessments).
-- Aman dijalankan karena belum ada siswa yang submit jawaban sungguhan —
-- yang ada baru bank soal hasil insert kemarin, yang akan di-insert ulang
-- setelah ini lewat insert_soal_bab1_ipa8.sql.
-- =========================================================================

drop table if exists log_pelanggaran cascade;
drop table if exists jawaban_siswa cascade;
drop table if exists bank_soal_ulangan cascade;
drop table if exists sesi_ulangan cascade;
drop view if exists soal_untuk_siswa cascade;
drop view if exists info_sesi_ulangan cascade;
