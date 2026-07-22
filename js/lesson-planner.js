// js/lesson-planner.js
// Terintegrasi Supabase (tabel `lesson_plans` + `classes`).
// Field detail RPP (tujuan/materi/metode/dst) DIHAPUS dari sini —
// itu sudah diisi sekali di Arsip & Administrasi (Modul Ajar), tinggal
// ditautkan lewat dropdown biar gak nulis dobel.

import { supabase } from './config/supabase.js';
import { requireAuth, getCurrentTeacher, logout } from './auth.js';
import { initThemeToggle, initSidebarToggle, qs, qsa } from './utils.js';
import { getAdminGroups, findGroupForClassId } from './admin-groups.js';

initThemeToggle('themeToggle');
initSidebarToggle();
document.getElementById('btnLogout')?.addEventListener('click', () => logout('login.html'));

const listEl = document.getElementById('lessonPlanList');
const formPanel = document.getElementById('formPanel');
const formTitle = document.getElementById('formTitle');
const form = document.getElementById('lessonPlanForm');

let teacher = null;
let classesCache = []; // [{ id, nama_kelas }]
let modulAjarCache = []; // [{ id, judul, mapel }]

const session = await requireAuth('login.html');
if (session) {
  teacher = await getCurrentTeacher();
  if (teacher) {
    await loadClasses();
    await loadModulAjarOptions();
    await loadPlans();
  }
}

async function loadClasses() {
  const { data, error } = await supabase
    .from('classes')
    .select('id, nama_kelas')
    .eq('owner_id', teacher.id)
    .order('nama_kelas');

  if (error) {
    console.error('Gagal ambil daftar kelas:', error.message);
    return;
  }
  classesCache = data || [];

  const optionsHtml = classesCache
    .map((c) => `<option value="${c.id}">${c.nama_kelas}</option>`)
    .join('');

  qs('#fKelas').innerHTML = optionsHtml;
  qs('#filterKelas').innerHTML = '<option value="">Semua Kelas</option>' + optionsHtml;
}

async function loadModulAjarOptions() {
  const groups = await getAdminGroups(supabase, teacher.id);

  const { data, error } = await supabase
    .from('resources')
    .select('id, judul, class_id')
    .eq('owner_id', teacher.id)
    .eq('kategori', 'modul_ajar');

  if (error) {
    console.error('Gagal ambil daftar Modul Ajar:', error.message);
    return;
  }

  modulAjarCache = (data || []).map((r) => ({
    id: r.id,
    judul: r.judul,
    mapel: findGroupForClassId(groups, r.class_id)?.mapel || '',
  }));

  renderModulAjarDropdown();
}

function renderModulAjarDropdown() {
  const mapelDipilih = qs('#fMapel').value;
  const filtered = modulAjarCache.filter((m) => !mapelDipilih || m.mapel === mapelDipilih);

  qs('#fModulAjar').innerHTML =
    '<option value="">— Belum ada / pilih dari Arsip &amp; Administrasi —</option>' +
    filtered.map((m) => `<option value="${m.id}">${m.judul}</option>`).join('');
}

qs('#fMapel').addEventListener('change', renderModulAjarDropdown);

async function loadPlans() {
  const kelasFilter = qs('#filterKelas').value;
  const mapelFilter = qs('#filterMapel').value;
  const search = qs('#filterSearch').value.trim();

  let query = supabase
    .from('lesson_plans')
    .select('id, topik, mapel, status, tanggal, class_id, catatan, modul_ajar_id, classes(nama_kelas), resources(judul, url)')
    .eq('owner_id', teacher.id)
    .order('updated_at', { ascending: false });

  if (kelasFilter) query = query.eq('class_id', kelasFilter);
  if (mapelFilter) query = query.eq('mapel', mapelFilter);
  if (search) query = query.ilike('topik', `%${search}%`);

  const { data, error } = await query;
  if (error) {
    console.error('Gagal ambil lesson plan:', error.message);
    return;
  }
  renderList(data || []);
}

function renderList(plans) {
  if (plans.length === 0) {
    listEl.innerHTML = '<p class="text-sm text-muted">Belum ada RPP yang cocok.</p>';
    return;
  }

  listEl.innerHTML = plans
    .map(
      (p) => `
    <div class="card row gap-4" style="justify-content:space-between;" data-id="${p.id}">
      <div>
        <strong>${p.topik}</strong>
        <div class="text-sm text-muted">${p.mapel} · Kelas ${p.classes?.nama_kelas || '-'} · ${p.tanggal || ''}</div>
        ${p.resources ? `<a class="text-sm" href="${p.resources.url || '#'}" target="_blank" rel="noopener">📄 ${p.resources.judul}</a>` : ''}
      </div>
      <div class="row gap-3">
        <span class="badge ${p.status === 'final' ? 'badge-success' : 'badge-warning'}">
          ${p.status === 'final' ? 'Final' : 'Draft'}
        </span>
        <button class="btn btn-ghost btn-edit" data-id="${p.id}">Edit</button>
        <button class="btn btn-ghost btn-delete" data-id="${p.id}">Hapus</button>
      </div>
    </div>`
    )
    .join('');

  qsa('.btn-edit', listEl).forEach((btn) =>
    btn.addEventListener('click', () => openForm(btn.dataset.id, plans))
  );
  qsa('.btn-delete', listEl).forEach((btn) =>
    btn.addEventListener('click', () => hapusPlan(btn.dataset.id))
  );
}

async function hapusPlan(id) {
  const { error } = await supabase.from('lesson_plans').delete().eq('id', id);
  if (error) {
    alert('Gagal menghapus: ' + error.message);
    return;
  }
  await loadPlans();
}

function openForm(id, plans) {
  formPanel.style.display = 'block';
  if (id) {
    const p = plans.find((x) => x.id === id);
    formTitle.textContent = 'Edit RPP';
    qs('#fKelas').value = p.class_id;
    qs('#fMapel').value = p.mapel;
    qs('#fTopik').value = p.topik;
    qs('#fStatus').value = p.status;
    qs('#fCatatan').value = p.catatan || '';
    renderModulAjarDropdown();
    qs('#fModulAjar').value = p.modul_ajar_id || '';
    form.dataset.editId = id;
  } else {
    formTitle.textContent = 'RPP Baru';
    form.reset();
    renderModulAjarDropdown();
    delete form.dataset.editId;
  }
  formPanel.scrollIntoView({ behavior: 'smooth' });
}

document.getElementById('btnNewPlan').addEventListener('click', () => openForm(null, []));
document.getElementById('btnCancelForm').addEventListener('click', () => {
  formPanel.style.display = 'none';
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const payload = {
    owner_id: teacher.id,
    class_id: qs('#fKelas').value,
    mapel: qs('#fMapel').value,
    topik: qs('#fTopik').value,
    modul_ajar_id: qs('#fModulAjar').value || null,
    catatan: qs('#fCatatan').value,
    status: qs('#fStatus').value,
  };

  let error;
  if (form.dataset.editId) {
    ({ error } = await supabase.from('lesson_plans').update(payload).eq('id', form.dataset.editId));
  } else {
    payload.tanggal = new Date().toISOString().slice(0, 10);
    ({ error } = await supabase.from('lesson_plans').insert(payload));
  }

  if (error) {
    alert('Gagal menyimpan: ' + error.message);
    return;
  }

  formPanel.style.display = 'none';
  await loadPlans();
});

['filterKelas', 'filterMapel'].forEach((id) =>
  document.getElementById(id).addEventListener('change', loadPlans)
);
document.getElementById('filterSearch').addEventListener('input', () => {
  clearTimeout(window._searchDebounce);
  window._searchDebounce = setTimeout(loadPlans, 300);
});
