// js/settings.js
// Terintegrasi Supabase: update `teachers` (profil) + `settings` (preferensi).

import { supabase } from './config/supabase.js';
import { requireAuth, getCurrentTeacher, logout } from './auth.js';
import { initThemeToggle, qs } from './utils.js';

initThemeToggle('themeToggle');
document.getElementById('btnLogout')?.addEventListener('click', () => logout('login.html'));

let teacher = null;

const session = await requireAuth('login.html');
if (session) {
  teacher = await getCurrentTeacher();
  if (teacher) {
    fillProfileForm(teacher);
    await loadPreferences();
  }
}

function fillProfileForm(t) {
  qs('#pfNama').value = t.nama_lengkap || '';
  qs('#pfPanggilan').value = t.nama_panggilan || '';
  qs('#pfSekolah').value = t.sekolah_nama || '';
  qs('#pfJabatan').value = t.jabatan || '';
  qs('#pfWhatsapp').value = t.kontak_whatsapp || '';
  qs('#pfWilayah').value = t.wilayah || '';
}

document.getElementById('profileForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const { error } = await supabase
    .from('teachers')
    .update({
      nama_lengkap: qs('#pfNama').value,
      nama_panggilan: qs('#pfPanggilan').value,
      sekolah_nama: qs('#pfSekolah').value,
      jabatan: qs('#pfJabatan').value,
      kontak_whatsapp: qs('#pfWhatsapp').value,
      wilayah: qs('#pfWilayah').value,
    })
    .eq('id', teacher.id);

  if (error) return alert('Gagal menyimpan profil: ' + error.message);
  alert('Profil tersimpan.');
});

async function loadPreferences() {
  const { data, error } = await supabase
    .from('settings')
    .select('dark_mode, notification')
    .eq('owner_id', teacher.id)
    .maybeSingle();

  if (error) {
    console.error('Gagal ambil preferensi:', error.message);
    return;
  }

  if (data) {
    qs('#prefDarkMode').checked = !!data.dark_mode;
    qs('#prefNotification').checked = !!data.notification;
    if (data.dark_mode) document.documentElement.setAttribute('data-theme', 'dark');
  }
}

document.getElementById('btnSavePref').addEventListener('click', async () => {
  const darkMode = qs('#prefDarkMode').checked;
  const notification = qs('#prefNotification').checked;

  document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');

  // upsert: kalau row settings buat guru ini belum ada, insert; kalau ada, update
  const { data: existing } = await supabase
    .from('settings')
    .select('id')
    .eq('owner_id', teacher.id)
    .maybeSingle();

  let error;
  if (existing) {
    ({ error } = await supabase
      .from('settings')
      .update({ dark_mode: darkMode, notification })
      .eq('id', existing.id));
  } else {
    ({ error } = await supabase.from('settings').insert({
      owner_id: teacher.id,
      dark_mode: darkMode,
      notification,
    }));
  }

  if (error) return alert('Gagal menyimpan preferensi: ' + error.message);
  alert('Preferensi tersimpan.');
});
