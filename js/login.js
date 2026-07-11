// js/login.js
// Logic halaman login: sign-in untuk pemakaian sehari-hari,
// sign-up hanya dipakai SEKALI di awal (setup akun guru pertama kali).

import { supabase } from './config/supabase.js';

const emailEl = document.getElementById('email');
const passwordEl = document.getElementById('password');
const errorEl = document.getElementById('errorMsg');

function showError(message) {
  errorEl.textContent = message;
  errorEl.style.display = 'block';
}

document.getElementById('btnLogin').addEventListener('click', async () => {
  errorEl.style.display = 'none';

  const { data, error } = await supabase.auth.signInWithPassword({
    email: emailEl.value,
    password: passwordEl.value,
  });

  if (error) {
    showError('Login gagal: ' + error.message);
    return;
  }

  // Jaga-jaga: kalau row `teachers` belum ada (misal proses Daftar
  // sebelumnya terputus karena harus konfirmasi email dulu), buat sekarang.
  const { data: existing } = await supabase
    .from('teachers')
    .select('id')
    .eq('auth_user_id', data.user.id)
    .maybeSingle();

  if (!existing) {
    await supabase.from('teachers').insert({
      auth_user_id: data.user.id,
      nama_lengkap: 'Fitrawati Suharti, S.Tr.T',
      nama_panggilan: 'Fita',
      sekolah_nama: 'SMPN 8 Kota Tangerang',
      jabatan: 'Guru IPA & Prakarya',
    });
  }

  window.location.href = 'dashboard.html';
});

document.getElementById('btnSignup').addEventListener('click', async () => {
  errorEl.style.display = 'none';

  if (!emailEl.value || !passwordEl.value) {
    showError('Isi email & password dulu untuk daftar.');
    return;
  }

  const { data, error } = await supabase.auth.signUp({
    email: emailEl.value,
    password: passwordEl.value,
  });

  if (error) {
    showError('Daftar gagal: ' + error.message);
    return;
  }

  // Kalau project Supabase mewajibkan konfirmasi email, `data.session` akan null
  // di titik ini — user harus klik link konfirmasi dulu sebelum bisa insert ke `teachers`.
  if (!data.session) {
    showError('Akun dibuat. Cek email untuk konfirmasi, lalu login lagi ya.');
    return;
  }

  // Buat row profil guru otomatis (sekali saja, saat pertama daftar)
  const { error: teacherError } = await supabase.from('teachers').insert({
    auth_user_id: data.user.id,
    nama_lengkap: 'Fitrawati Suharti, S.Tr.T',
    nama_panggilan: 'Fita',
    sekolah_nama: 'SMPN 8 Kota Tangerang',
    jabatan: 'Guru IPA & Prakarya',
  });

  if (teacherError) {
    showError('Akun dibuat tapi profil guru gagal disimpan: ' + teacherError.message);
    return;
  }

  window.location.href = 'dashboard.html';
});
