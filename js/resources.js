// js/resources.js
// Terintegrasi Supabase: `resources` (kategori administrasi + arsip umum) + view `administrasi_summary`.

import { supabase } from './config/supabase.js';
import { requireAuth, getCurrentTeacher, logout } from './auth.js';
import { initThemeToggle, renderProgressRing, qs, qsa } from './utils.js';

initThemeToggle('themeToggle');
document.getElementById('btnLogout')?.addEventListener('click', () => logout('login.html'));

const KATEGORI_LABEL = {
  modul_ajar: 'Modul Ajar',
  kktp: 'KKTP',
  cp: 'CP',
  atp: 'ATP',
  prota: 'Prota',
  promes: 'Promes',
  kaldik: 'KalDik',
};

let teacher = null;
let totalKelas = 0;

const session = await requireAuth('login.html');
if (session) {
  teacher = await getCurrentTeacher();
  if (teacher) {
    await loadClassDropdown();
    await loadCategorySummary();
    await loadAdminDocs();
    await loadGeneralResources();
  }
}

async function loadClassDropdown() {
  const { data } = await supabase.from('classes').select('id, nama_kelas').eq('owner_id', teacher.id).order('nama_kelas');
  totalKelas = (data || []).length;
  qs('#duKelas').innerHTML = (data || []).map((c) => `<option value="${c.id}">${c.nama_kelas}</option>`).join('');
}

async function loadCategorySummary() {
  const { data, error } = await supabase
    .from('administrasi_summary')
    .select('kategori, kelas_terisi, total_kelas')
    .eq('owner_id', teacher.id);

  if (error) console.error('Gagal ambil ringkasan administrasi:', error.message);

  const summaryMap = Object.fromEntries((data || []).map((s) => [s.kategori, s]));

  const grid = document.getElementById('adminCategoryGrid');
  grid.innerHTML = Object.entries(KATEGORI_LABEL)
    .map(([key, label]) => {
      const s = summaryMap[key];
      const terisi = s?.kelas_terisi || 0;
      const total = s?.total_kelas || totalKelas || 0;
      const percent = total > 0 ? Math.round((terisi / total) * 100) : 0;
      return `
      <div class="card stack" style="align-items:center; text-align:center;">
        <div class="ring-${key}" style="margin-bottom:var(--space-2);"></div>
        <strong class="text-sm">${label}</strong>
        <span class="text-xs text-muted">${terisi}/${total} kelas</span>
      </div>`;
    })
    .join('');

  Object.entries(KATEGORI_LABEL).forEach(([key]) => {
    const s = summaryMap[key];
    const terisi = s?.kelas_terisi || 0;
    const total = s?.total_kelas || totalKelas || 0;
    const percent = total > 0 ? Math.round((terisi / total) * 100) : 0;
    const el = grid.querySelector(`.ring-${key}`);
    if (el) renderProgressRing(el, percent, 72);
  });
}

async function loadAdminDocs() {
  const { data, error } = await supabase
    .from('resources')
    .select('id, judul, kategori, url, classes(nama_kelas)')
    .eq('owner_id', teacher.id)
    .not('kategori', 'is', null)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Gagal ambil dokumen administrasi:', error.message);
    return;
  }

  const el = document.getElementById('adminDocList');
  if (!data || data.length === 0) {
    el.innerHTML = '<p class="text-sm text-muted">Belum ada dokumen administrasi diupload.</p>';
    return;
  }
  el.innerHTML = data
    .map(
      (r) => `
    <div class="row gap-3" style="justify-content:space-between;">
      <div class="row gap-2">
        <span class="badge badge-info">${KATEGORI_LABEL[r.kategori] || r.kategori}</span>
        <span>${r.judul}</span>
        <span class="text-sm text-muted">Kelas ${r.classes?.nama_kelas || '-'}</span>
      </div>
      <div class="row gap-2">
        ${r.url ? `<a class="btn btn-ghost" href="${r.url}" target="_blank" rel="noopener">Buka</a>` : ''}
        <button class="btn btn-ghost btn-delete-doc" data-id="${r.id}">Hapus</button>
      </div>
    </div>`
    )
    .join('');

  qsa('.btn-delete-doc', el).forEach((btn) =>
    btn.addEventListener('click', async () => {
      const { error } = await supabase.from('resources').delete().eq('id', btn.dataset.id);
      if (error) return alert('Gagal menghapus: ' + error.message);
      await loadAdminDocs();
      await loadCategorySummary();
    })
  );
}

async function loadGeneralResources() {
  const { data, error } = await supabase
    .from('resources')
    .select('id, judul, tipe, url')
    .eq('owner_id', teacher.id)
    .is('kategori', null)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Gagal ambil arsip umum:', error.message);
    return;
  }

  const el = document.getElementById('generalResourceList');
  if (!data || data.length === 0) {
    el.innerHTML = '<p class="text-sm text-muted">Belum ada arsip materi umum.</p>';
    return;
  }
  el.innerHTML = data
    .map(
      (r) => `
    <div class="row gap-3" style="justify-content:space-between;">
      <div class="row gap-2">
        <span class="badge badge-info">${r.tipe}</span>
        <span>${r.judul}</span>
      </div>
      <div class="row gap-2">
        ${r.url ? `<a class="btn btn-ghost" href="${r.url}" target="_blank" rel="noopener">Buka</a>` : ''}
        <button class="btn btn-ghost btn-delete-general" data-id="${r.id}">Hapus</button>
      </div>
    </div>`
    )
    .join('');

  qsa('.btn-delete-general', el).forEach((btn) =>
    btn.addEventListener('click', async () => {
      const { error } = await supabase.from('resources').delete().eq('id', btn.dataset.id);
      if (error) return alert('Gagal menghapus: ' + error.message);
      await loadGeneralResources();
    })
  );
}

// ------- Form toggles -------

document.getElementById('btnToggleAdminUpload').addEventListener('click', () => {
  const f = document.getElementById('adminUploadForm');
  f.style.display = f.style.display === 'none' ? 'flex' : 'none';
});
document.getElementById('btnToggleGeneralUpload').addEventListener('click', () => {
  const f = document.getElementById('generalUploadForm');
  f.style.display = f.style.display === 'none' ? 'flex' : 'none';
});

document.getElementById('adminUploadForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const { error } = await supabase.from('resources').insert({
    owner_id: teacher.id,
    class_id: qs('#duKelas').value,
    kategori: qs('#duKategori').value,
    judul: qs('#duJudul').value,
    tipe: 'link',
    url: qs('#duUrl').value || null,
  });
  if (error) return alert('Gagal menyimpan: ' + error.message);
  e.target.reset();
  document.getElementById('adminUploadForm').style.display = 'none';
  await loadAdminDocs();
  await loadCategorySummary();
});

document.getElementById('generalUploadForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const { error } = await supabase.from('resources').insert({
    owner_id: teacher.id,
    judul: qs('#guJudul').value,
    tipe: qs('#guTipe').value,
    url: qs('#guUrl').value || null,
    kategori: null,
  });
  if (error) return alert('Gagal menyimpan: ' + error.message);
  e.target.reset();
  document.getElementById('generalUploadForm').style.display = 'none';
  await loadGeneralResources();
});
