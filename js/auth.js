// js/auth.js
// Modul guard autentikasi + pengambilan profil guru.
// Dipakai (import) di setiap halaman GURU (bukan portal siswa — itu publik).

import { supabase } from './config/supabase.js';

/**
 * Pastikan ada session aktif. Kalau tidak ada, redirect ke login.html.
 * Panggil ini di baris pertama setiap file js halaman guru.
 * @param {string} loginPath - path relatif ke login.html dari halaman saat ini
 */
export async function requireAuth(loginPath = 'login.html') {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session) {
    window.location.href = loginPath;
    return null;
  }
  return session;
}

/**
 * Ambil row `teachers` milik user yang sedang login.
 * `teachers.id` inilah yang dipakai sebagai `owner_id` saat insert data baru.
 */
export async function getCurrentTeacher() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from('teachers')
    .select('*')
    .eq('auth_user_id', user.id)
    .single();

  if (error) {
    console.error('Gagal mengambil profil guru:', error.message);
    return null;
  }
  return data;
}

/** Logout dan kembali ke halaman login */
export async function logout(loginPath = 'login.html') {
  await supabase.auth.signOut();
  window.location.href = loginPath;
}
