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
  pdf:    { label: 'PDF',    color: '#d33d3d' },
  word:   { label: 'Word',   color: '#2b579a' },
  ppt:    { label: 'PPT',    color: '#d24726' },
  gambar: { label: 'Gambar', color: '#1faa59' },
  video:  { label: 'Video',  color: '#8b5cf6' },
  link:   { label: 'Link',   color: '#0ea5e9' },
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
    .select('id, judul, tipe, url, mapel_umum, tingkat_umum, bab')
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

  // Materi lama yang belum punya kelas/bab (belum bisa muncul di Portal Ortu)
  const belumLengkap = data.filter((r) => !r.tingkat_umum || !r.bab);
  const lengkap = data.filter((r) => r.tingkat_umum && r.bab);

  const renderEditRow = (r) => {
    const meta = TIPE_META[r.tipe];
    return `
    <div class="doc-row" style="--doc-color:${meta?.color || 'var(--color-info)'}; flex-wrap:wrap;" data-edit-id="${r.id}">
      <div class="row gap-2" style="flex:1; min-width:160px;">
        <span class="badge">${meta?.label || r.tipe}</span>
        <span>${r.judul}</span>
      </div>
      <select class="input edit-mapel" style="width:auto;">
        <option value="IPA" ${r.mapel_umum === 'IPA' ? 'selected' : ''}>IPA</option>
        <option value="Prakarya" ${r.mapel_umum === 'Prakarya' ? 'selected' : ''}>Prakarya</option>
      </select>
      <select class="input edit-tingkat" style="width:auto;">
        <option value="7" ${r.tingkat_umum === '7' ? 'selected' : ''}>Kelas 7</option>
        <option value="8" ${r.tingkat_umum === '8' ? 'selected' : ''}>Kelas 8</option>
      </select>
      <input class="input edit-bab" type="text" placeholder="Bab / Topik" value="${r.bab || ''}" style="min-width:160px; flex:1;">
      <button class="btn btn-primary btn-save-edit" data-id="${r.id}">Simpan</button>
    </div>`;
  };

  const belumLengkapHtml = belumLengkap.length
    ? `
    <div class="stack gap-2" style="margin-bottom:var(--space-4); padding:var(--space-4); border:1px dashed var(--color-warning); border-radius:var(--radius-md);">
      <strong class="text-sm" style="color:var(--color-warning);">⚠️ Perlu Dilengkapi (${belumLengkap.length}) — belum muncul di Portal Ortu sampai Kelas &amp; Bab diisi</strong>
      <div class="stack gap-2">${belumLengkap.map(renderEditRow).join('')}</div>
    </div>`
    : '';

  // Kelompok 1: mapel + tingkat (IPA Kelas 7, IPA Kelas 8, Prakarya Kelas 7...)
  const kelasGroups = {};
  lengkap.forEach((r) => {
    const key = `${r.mapel_umum}|${r.tingkat_umum}`;
    if (!kelasGroups[key]) {
      kelasGroups[key] = {
        label: `${r.mapel_umum === 'IPA' ? '📗' : '🧵'} ${r.mapel_umum} — Kelas ${r.tingkat_umum}`,
        items: [],
      };
    }
    kelasGroups[key].items.push(r);
  });

  const kelasGroupHtml = Object.values(kelasGroups)
    .map((grp) => {
      // Kelompok 2: per Bab di dalam tiap mapel+tingkat
      const babGroups = {};
      grp.items.forEach((r) => {
        if (!babGroups[r.bab]) babGroups[r.bab] = [];
        babGroups[r.bab].push(r);
      });

      const babHtml = Object.entries(babGroups)
        .map(
          ([bab, items]) => `
        <div class="stack gap-2" style="margin-top:var(--space-3);">
          <strong class="text-sm">${bab}</strong>
          <div class="stack gap-2">${items.map(renderRow).join('')}</div>
        </div>`
        )
        .join('');

      return `
      <div class="stack gap-2" style="margin-top:var(--space-4);">
        <h4 style="margin:0;">${grp.label}</h4>
        ${babHtml}
      </div>`;
    })
    .join('');

  el.innerHTML = belumLengkapHtml + kelasGroupHtml;

  qsa('.btn-save-edit', el).forEach((btn) =>
    btn.addEventListener('click', async () => {
      const row = btn.closest('[data-edit-id]');
      const { error } = await supabase
        .from('resources')
        .update({
          mapel_umum: row.querySelector('.edit-mapel').value,
          tingkat_umum: row.querySelector('.edit-tingkat').value,
          bab: row.querySelector('.edit-bab').value,
        })
        .eq('id', btn.dataset.id);
      if (error) return alert('Gagal menyimpan: ' + error.message);
      await loadGeneralResources();
    })
  );

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
  const submitBtn = qs('#guSubmitBtn');
  const statusEl = qs('#guUploadStatus');
  const files = Array.from(qs('#guFile').files || []);

  const tooBig = files.find((f) => f.size > 5 * 1024 * 1024);
  if (tooBig) {
    return alert(`Ukuran gambar "${tooBig.name}" lebih dari 5MB. Pilih gambar lain atau kompres dulu.`);
  }

  submitBtn.disabled = true;

  const judulDasar = qs('#guJudul').value;
  const tipe = qs('#guTipe').value;
  const mapel_umum = qs('#guMapel').value;
  const tingkat_umum = qs('#guTingkat').value;
  const bab = qs('#guBab').value;

  // Baris yang bakal di-insert ke `resources`. Kalau ada file gambar,
  // tiap file jadi 1 baris tersendiri (biar tetap 1 gambar per baris di list).
  // Kalau nggak ada file, fallback ke link biasa (perilaku lama).
  const rows = [];

  if (files.length > 0) {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      statusEl.textContent = `Mengupload gambar ${i + 1}/${files.length}...`;
      const ext = file.name.split('.').pop();
      const path = `${teacher.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('arsip-materi').upload(path, file);
      if (uploadError) {
        statusEl.textContent = '';
        submitBtn.disabled = false;
        return alert(`Gagal upload gambar "${file.name}": ` + uploadError.message);
      }
      const urlFinal = supabase.storage.from('arsip-materi').getPublicUrl(path).data.publicUrl;
      rows.push({
        owner_id: teacher.id,
        judul: files.length > 1 ? `${judulDasar} (${i + 1})` : judulDasar,
        tipe,
        url: urlFinal,
        mapel_umum,
        tingkat_umum,
        bab,
        kategori: null,
      });
    }
  } else {
    rows.push({
      owner_id: teacher.id,
      judul: judulDasar,
      tipe,
      url: qs('#guUrl').value || null,
      mapel_umum,
      tingkat_umum,
      bab,
      kategori: null,
    });
  }

  statusEl.textContent = 'Menyimpan...';
  const { error } = await supabase.from('resources').insert(rows);

  submitBtn.disabled = false;
  statusEl.textContent = '';

  if (error) return alert('Gagal menyimpan: ' + error.message);
  e.target.reset();
  document.getElementById('generalUploadForm').style.display = 'none';
  await loadGeneralResources();
});
