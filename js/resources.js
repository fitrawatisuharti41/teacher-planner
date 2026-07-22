// js/resources.js
// Terintegrasi Supabase: `resources` (kategori administrasi + arsip umum),
// dikelompokkan per (mapel + tingkat) dari `teaching_assignments`.

import { supabase } from './config/supabase.js';
import { requireAuth, getCurrentTeacher, logout } from './auth.js';
import { initThemeToggle, initSidebarToggle, qs, qsa } from './utils.js';

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
let kelompokList = [];       // [{ key, mapel, tingkat, classIds, label }]
let classIdToKelompok = {};  // classId -> kelompok entry

const session = await requireAuth('login.html');
if (session) {
  teacher = await getCurrentTeacher();
  if (teacher) {
    await loadKelompokDropdown();
    await loadCategorySummary();
    await loadAdminDocs();
    await loadGeneralResources();
  }
}

// Dokumen administrasi dikelompokkan per (mapel + tingkat) yang benar-benar
// diajar guru ini — misal "IPA — Kelas 7" mewakili semua section (7A/7B/7C),
// bukan 1 folder per section kelas.
async function loadKelompokDropdown() {
  const { data, error } = await supabase
    .from('teaching_assignments')
    .select('mapel, kelas_id, classes(nama_kelas, tingkat)')
    .eq('teacher_id', teacher.id);

  if (error) console.error('Gagal ambil penugasan mengajar:', error.message);

  const groups = {};
  (data || []).forEach((a) => {
    const tingkat = a.classes?.tingkat;
    if (!tingkat) return;
    const key = `${a.mapel}|${tingkat}`;
    if (!groups[key]) {
      groups[key] = { key, mapel: a.mapel, tingkat, classIds: [], label: `${a.mapel} — Kelas ${tingkat}` };
    }
    groups[key].classIds.push(a.kelas_id);
  });

  kelompokList = Object.values(groups).sort(
    (a, b) => a.tingkat.localeCompare(b.tingkat, 'id', { numeric: true }) || a.mapel.localeCompare(b.mapel)
  );
  classIdToKelompok = {};
  kelompokList.forEach((g) => g.classIds.forEach((id) => (classIdToKelompok[id] = g)));

  qs('#duKelas').innerHTML = kelompokList
    .map((g) => `<option value="${g.key}">${g.label}</option>`)
    .join('');
}

async function loadCategorySummary() {
  const { data, error } = await supabase
    .from('resources')
    .select('kategori, class_id')
    .eq('owner_id', teacher.id)
    .not('kategori', 'is', null);

  if (error) console.error('Gagal ambil ringkasan administrasi:', error.message);

  // Untuk tiap kategori, hitung berapa kelompok (mapel+tingkat) yang sudah
  // punya minimal 1 dokumen — bukan berapa class_id mentah yang terisi.
  const filledMap = {}; // kategori -> Set(kelompokKey)
  (data || []).forEach((r) => {
    const kelompok = classIdToKelompok[r.class_id];
    if (!kelompok) return;
    if (!filledMap[r.kategori]) filledMap[r.kategori] = new Set();
    filledMap[r.kategori].add(kelompok.key);
  });

  const total = kelompokList.length;

  const grid = document.getElementById('adminCategoryGrid');
  grid.style.gridTemplateColumns = '';
  grid.className = 'grid-cards grid-cards-admin';
  grid.innerHTML = Object.entries(KATEGORI_LABEL)
    .map(([key, label]) => {
      const terisi = filledMap[key]?.size || 0;
      const meta = KATEGORI_META[key];
      const daftarKelompok = kelompokList.map((g) => g.label).join(', ') || 'belum ada penugasan mengajar';
      return `
      <div class="admin-cat-card" data-kategori="${key}" role="button" tabindex="0">
        <div class="admin-cat-banner" style="background:${meta.gradient};">
          <span class="admin-cat-badge">${terisi}/${total} LENGKAP</span>
          <svg class="icon"><use href="assets/icons/icons.svg#${meta.icon}"/></svg>
        </div>
        <div class="admin-cat-body">
          <span class="admin-cat-eyebrow">Kategori Dokumen</span>
          <strong class="admin-cat-title">${label}</strong>
          <p class="admin-cat-desc">Klik untuk membuka folder ${daftarKelompok}.</p>
          <div class="admin-cat-footer">
            <svg class="icon"><use href="assets/icons/icons.svg#icon-folder"/></svg>
            <span>${total} Folder Kelas</span>
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
    .select('id, judul, kategori, url, class_id, classes(nama_kelas)')
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
      const kelompok = classIdToKelompok[r.class_id];
      const kelasText = kelompok ? `${kelompok.mapel} — Kelas ${kelompok.tingkat}` : r.classes?.nama_kelas || '-';
      return `
    <div class="doc-row" style="--doc-color:${meta?.color || 'var(--color-info)'}">
      <div class="row gap-2">
        <span class="badge">${KATEGORI_LABEL[r.kategori] || r.kategori}</span>
        <span>${r.judul}</span>
        <span class="text-sm text-muted">${kelasText}</span>
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
    .select('id, judul, tipe, url, mapel_umum')
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

  const renderRow = (r) => {
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
  };

  const ipa = data.filter((r) => r.mapel_umum === 'IPA');
  const prakarya = data.filter((r) => r.mapel_umum === 'Prakarya');
  const lainnya = data.filter((r) => r.mapel_umum !== 'IPA' && r.mapel_umum !== 'Prakarya');

  el.innerHTML = `
    <div class="stack gap-2">
      <strong class="text-sm">📗 IPA</strong>
      ${ipa.length ? ipa.map(renderRow).join('') : '<p class="text-sm text-muted">Belum ada.</p>'}
    </div>
    <div class="stack gap-2" style="margin-top:var(--space-4);">
      <strong class="text-sm">🧵 Prakarya</strong>
      ${prakarya.length ? prakarya.map(renderRow).join('') : '<p class="text-sm text-muted">Belum ada.</p>'}
    </div>
    ${lainnya.length ? `<div class="stack gap-2" style="margin-top:var(--space-4);"><strong class="text-sm">Lainnya</strong>${lainnya.map(renderRow).join('')}</div>` : ''}
  `;

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
  const kelompok = kelompokList.find((g) => g.key === qs('#duKelas').value);
  if (!kelompok) return alert('Pilih kelompok mengajar (mapel + kelas) dulu.');
  const { error } = await supabase.from('resources').insert({
    owner_id: teacher.id,
    class_id: kelompok.classIds[0],
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
    mapel_umum: qs('#guMapel').value,
    kategori: null,
  });
  if (error) return alert('Gagal menyimpan: ' + error.message);
  e.target.reset();
  document.getElementById('generalUploadForm').style.display = 'none';
  await loadGeneralResources();
});
