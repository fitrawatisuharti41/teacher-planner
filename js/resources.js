// js/resources.js
// Terintegrasi Supabase: `resources` (kategori administrasi + arsip umum).
// Kelengkapan dihitung per KELOMPOK MAPEL+TINGKAT (lihat admin-groups.js),
// bukan per section kelas — sesuai cara kerja guru yang sebenarnya.

import { supabase } from './config/supabase.js';
import { requireAuth, getCurrentTeacher, logout } from './auth.js';
import { initThemeToggle, initSidebarToggle, qs, qsa } from './utils.js';
import { getAdminGroups, findGroupForClassId } from './admin-groups.js';

initThemeToggle('themeToggle');
initSidebarToggle();
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

const KATEGORI_META = {
  modul_ajar: { gradient: 'var(--grad-modul-ajar)', icon: 'icon-book',           color: '#3b6fed' },
  kktp:       { gradient: 'var(--grad-kktp)',       icon: 'icon-badge-check',    color: '#1faa59' },
  cp:         { gradient: 'var(--grad-cp)',         icon: 'icon-graduation-cap', color: '#ea580c' },
  atp:        { gradient: 'var(--grad-atp)',        icon: 'icon-hierarchy',      color: '#8b5cf6' },
  prota:      { gradient: 'var(--grad-prota)',      icon: 'icon-grid',           color: '#d3234f' },
  promes:     { gradient: 'var(--grad-promes)',     icon: 'icon-calendar',       color: '#3b82f6' },
  kaldik:     { gradient: 'var(--grad-kaldik)',     icon: 'icon-calendar',       color: '#f0961a' },
};

const TIPE_META = {
  pdf:   { label: 'PDF',   color: '#d33d3d' },
  word:  { label: 'Word',  color: '#2b579a' },
  ppt:   { label: 'PPT',   color: '#d24726' },
  video: { label: 'Video', color: '#8b5cf6' },
  link:  { label: 'Link',  color: '#0ea5e9' },
};

let teacher = null;
let groups = []; // [{ key, mapel, tingkat, label, classIds }]

const session = await requireAuth('login.html');
if (session) {
  teacher = await getCurrentTeacher();
  if (teacher) {
    groups = await getAdminGroups(supabase, teacher.id);
    fillGroupDropdown();
    await loadCategorySummary();
    await loadAdminDocs();
    await loadGeneralResources();
  }
}

function fillGroupDropdown() {
  qs('#duKelas').innerHTML = groups
    .map((g) => `<option value="${g.key}">${g.label}</option>`)
    .join('') || '<option value="">Belum ada penugasan mengajar</option>';
}

async function loadCategorySummary() {
  const { data, error } = await supabase
    .from('resources')
    .select('kategori, class_id')
    .eq('owner_id', teacher.id)
    .not('kategori', 'is', null);

  if (error) console.error('Gagal ambil dokumen administrasi:', error.message);

  // Hitung berapa KELOMPOK (bukan kelas) yang sudah punya dokumen per kategori
  const filledGroupsByKategori = {};
  (data || []).forEach((r) => {
    const group = findGroupForClassId(groups, r.class_id);
    if (!group) return;
    if (!filledGroupsByKategori[r.kategori]) filledGroupsByKategori[r.kategori] = new Set();
    filledGroupsByKategori[r.kategori].add(group.key);
  });

  const totalGroups = groups.length || 1;
  const grid = document.getElementById('adminCategoryGrid');
  grid.className = 'grid-cards grid-cards-admin';

  grid.innerHTML = Object.entries(KATEGORI_LABEL)
    .map(([key, label]) => {
      const terisi = filledGroupsByKategori[key]?.size || 0;
      const meta = KATEGORI_META[key];
      return `
      <div class="admin-cat-card" data-kategori="${key}" role="button" tabindex="0">
        <div class="admin-cat-banner" style="background:${meta.gradient};">
          <span class="admin-cat-badge">${terisi}/${totalGroups} LENGKAP</span>
          <svg class="icon"><use href="assets/icons/icons.svg#${meta.icon}"/></svg>
        </div>
        <div class="admin-cat-body">
          <span class="admin-cat-eyebrow">Kategori Dokumen</span>
          <strong class="admin-cat-title">${label}</strong>
          <p class="admin-cat-desc">Klik untuk upload dokumen per mapel &amp; tingkat.</p>
          <div class="admin-cat-footer">
            <svg class="icon"><use href="assets/icons/icons.svg#icon-folder"/></svg>
            <span>${totalGroups} Kelompok Mapel</span>
          </div>
        </div>
      </div>`;
    })
    .join('');

  qsa('.admin-cat-card', grid).forEach((card) => {
    card.addEventListener('click', () => openAdminUploadFor(card.dataset.kategori));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openAdminUploadFor(card.dataset.kategori);
      }
    });
  });
}

function openAdminUploadFor(kategori) {
  const form = document.getElementById('adminUploadForm');
  form.style.display = 'flex';
  document.getElementById('duKategori').value = kategori;
  form.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

async function loadAdminDocs() {
  const { data, error } = await supabase
    .from('resources')
    .select('id, judul, kategori, url, class_id')
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
    .map((r) => {
      const meta = KATEGORI_META[r.kategori];
      const groupLabel = findGroupForClassId(groups, r.class_id)?.label || '-';
      return `
    <div class="doc-row" style="--doc-color:${meta?.color || 'var(--color-info)'}">
      <div class="row gap-2">
        <span class="badge">${KATEGORI_LABEL[r.kategori] || r.kategori}</span>
        <span>${r.judul}</span>
        <span class="text-sm text-muted">${groupLabel}</span>
      </div>
      <div class="row gap-2">
        ${r.url ? `<a class="btn btn-ghost" href="${r.url}" target="_blank" rel="noopener">Buka</a>` : ''}
        <button class="btn btn-ghost btn-delete-doc" data-id="${r.id}">Hapus</button>
      </div>
    </div>`;
    })
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
    .map((r) => {
      const meta = TIPE_META[r.tipe];
      return `
    <div class="doc-row" style="--doc-color:${meta?.color || 'var(--color-info)'}">
      <div class="row gap-2">
        <span class="badge">${meta?.label || r.tipe}</span>
        <span>${r.judul}</span>
      </div>
      <div class="row gap-2">
        ${r.url ? `<a class="btn btn-ghost" href="${r.url}" target="_blank" rel="noopener">Buka</a>` : ''}
        <button class="btn btn-ghost btn-delete-general" data-id="${r.id}">Hapus</button>
      </div>
    </div>`;
    })
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
  const group = groups.find((g) => g.key === qs('#duKelas').value);
  if (!group) {
    alert('Pilih kelompok mapel+tingkat dulu (atau tambah penugasan mengajar di halaman Kelas).');
    return;
  }
  const { error } = await supabase.from('resources').insert({
    owner_id: teacher.id,
    class_id: group.classIds[0], // representatif dari kelompok, bukan section spesifik
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
