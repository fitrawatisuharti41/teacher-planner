// js/reflection.js
// Terintegrasi Supabase: CRUD `reflections`.

import { supabase } from './config/supabase.js';
import { requireAuth, getCurrentTeacher, logout } from './auth.js';
import { initThemeToggle, initSidebarToggle, qs, qsa } from './utils.js';

initThemeToggle('themeToggle');
initSidebarToggle();
document.getElementById('btnLogout')?.addEventListener('click', () => logout('login.html'));

let teacher = null;

const session = await requireAuth('login.html');
if (session) {
  teacher = await getCurrentTeacher();
  if (teacher) await loadReflections();
}

async function loadReflections() {
  const tipeFilter = qs('#filterTipe').value;

  let query = supabase
    .from('reflections')
    .select('id, tipe, konten, rating, tanggal')
    .eq('owner_id', teacher.id)
    .order('tanggal', { ascending: false });

  if (tipeFilter) query = query.eq('tipe', tipeFilter);

  const { data, error } = await query;
  if (error) {
    console.error('Gagal ambil refleksi:', error.message);
    return;
  }
  renderList(data || []);
}

const tipeLabel = { harian: 'Harian', mingguan: 'Mingguan', semester: 'Semester' };
const tipeBadge = { harian: 'badge-info', mingguan: 'badge-warning', semester: 'badge-success' };

function renderList(items) {
  const el = document.getElementById('reflectionList');
  if (items.length === 0) {
    el.innerHTML = '<p class="text-sm text-muted">Belum ada refleksi.</p>';
    return;
  }
  el.innerHTML = items
    .map(
      (r) => `
    <div class="card" data-id="${r.id}">
      <div class="row gap-3" style="justify-content:space-between;">
        <div class="row gap-2">
          <span class="badge ${tipeBadge[r.tipe] || 'badge-info'}">${tipeLabel[r.tipe] || r.tipe}</span>
          <span class="text-sm text-muted">${r.tanggal}</span>
          ${r.rating ? `<span class="text-sm">${'⭐'.repeat(r.rating)}</span>` : ''}
        </div>
        <div class="row gap-2">
          <button class="btn btn-ghost btn-edit-reflection" data-id="${r.id}">Edit</button>
          <button class="btn btn-ghost btn-delete-reflection" data-id="${r.id}">Hapus</button>
        </div>
      </div>
      <p class="text-sm" style="margin-top:var(--space-2); margin-bottom:0;">${r.konten}</p>
    </div>`
    )
    .join('');

  qsa('.btn-edit-reflection', el).forEach((btn) =>
    btn.addEventListener('click', () => openForm(btn.dataset.id, items))
  );
  qsa('.btn-delete-reflection', el).forEach((btn) =>
    btn.addEventListener('click', async () => {
      if (!confirm('Hapus refleksi ini?')) return;
      const { error } = await supabase.from('reflections').delete().eq('id', btn.dataset.id);
      if (error) return alert('Gagal menghapus: ' + error.message);
      await loadReflections();
    })
  );
}

const formPanel = document.getElementById('reflectionFormPanel');
const form = document.getElementById('reflectionForm');

function openForm(id, items) {
  formPanel.style.display = 'block';
  if (id) {
    const r = items.find((x) => x.id === id);
    document.getElementById('reflectionFormTitle').textContent = 'Edit Refleksi';
    qs('#rTipe').value = r.tipe;
    qs('#rTanggal').value = r.tanggal;
    qs('#rRating').value = r.rating || 5;
    qs('#rKonten').value = r.konten;
    form.dataset.editId = id;
  } else {
    document.getElementById('reflectionFormTitle').textContent = 'Refleksi Baru';
    form.reset();
    qs('#rTanggal').value = new Date().toISOString().slice(0, 10);
    delete form.dataset.editId;
  }
  formPanel.scrollIntoView({ behavior: 'smooth' });
}

document.getElementById('btnNewReflection').addEventListener('click', () => openForm(null, []));
document.getElementById('btnCancelReflection').addEventListener('click', () => {
  formPanel.style.display = 'none';
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = {
    owner_id: teacher.id,
    tipe: qs('#rTipe').value,
    tanggal: qs('#rTanggal').value,
    rating: Number(qs('#rRating').value),
    konten: qs('#rKonten').value,
  };

  let error;
  if (form.dataset.editId) {
    ({ error } = await supabase.from('reflections').update(payload).eq('id', form.dataset.editId));
  } else {
    ({ error } = await supabase.from('reflections').insert(payload));
  }

  if (error) return alert('Gagal menyimpan: ' + error.message);
  formPanel.style.display = 'none';
  await loadReflections();
});

document.getElementById('filterTipe').addEventListener('change', loadReflections);
