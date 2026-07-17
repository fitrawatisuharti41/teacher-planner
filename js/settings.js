// js/settings.js
// Terintegrasi Supabase: update `teachers` (profil) + `settings` (preferensi).

import { supabase } from './config/supabase.js';
import { requireAuth, getCurrentTeacher, logout } from './auth.js';
import { initThemeToggle, initSidebarToggle, qs } from './utils.js';

initThemeToggle('themeToggle');
initSidebarToggle();
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
  qs('#pfPendidikan').value = (t.pendidikan || []).join('\n');
  if (t.foto_url) qs('#pfAvatar').innerHTML = `<img src="${t.foto_url}" alt="${t.nama_lengkap || 'Foto profil'}" style="width:100%;height:100%;object-fit:cover;">`;
}

document.getElementById('profileForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const submitBtn = e.target.querySelector('button[type="submit"]');
  const fotoFile = qs('#pfFoto').files[0];
  const statusEl = qs('#pfFotoStatus');

  submitBtn.disabled = true;
  let fotoUrl = undefined; // undefined = jangan ubah kolom foto_url kalau tidak upload baru

  if (fotoFile) {
    if (fotoFile.size > 5 * 1024 * 1024) {
      submitBtn.disabled = false;
      return alert('Ukuran foto maksimal 5MB.');
    }
    statusEl.textContent = 'Mengupload foto...';
    const ext = fotoFile.name.split('.').pop();
    const path = `${teacher.id}/foto.${ext}`;
    const { error: uploadError } = await supabase.storage.from('profil-guru').upload(path, fotoFile, { upsert: true });
    if (uploadError) {
      statusEl.textContent = '';
      submitBtn.disabled = false;
      return alert('Gagal upload foto: ' + uploadError.message);
    }
    fotoUrl = supabase.storage.from('profil-guru').getPublicUrl(path).data.publicUrl + `?t=${Date.now()}`;
    statusEl.textContent = '';
  }

  const payload = {
    nama_lengkap: qs('#pfNama').value,
    nama_panggilan: qs('#pfPanggilan').value,
    sekolah_nama: qs('#pfSekolah').value,
    jabatan: qs('#pfJabatan').value,
    kontak_whatsapp: qs('#pfWhatsapp').value,
    wilayah: qs('#pfWilayah').value,
    pendidikan: qs('#pfPendidikan').value.split('\n').map((s) => s.trim()).filter(Boolean),
  };
  if (fotoUrl !== undefined) payload.foto_url = fotoUrl;

  const { error } = await supabase.from('teachers').update(payload).eq('id', teacher.id);

  submitBtn.disabled = false;
  if (error) return alert('Gagal menyimpan profil: ' + error.message);
  if (fotoUrl) qs('#pfAvatar').innerHTML = `<img src="${fotoUrl}" alt="Foto profil" style="width:100%;height:100%;object-fit:cover;">`;
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
