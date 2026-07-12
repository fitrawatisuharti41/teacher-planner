// js/classes.js
// Terintegrasi Supabase: CRUD `classes` + `teaching_assignments`.

import { supabase } from './config/supabase.js';
import { requireAuth, getCurrentTeacher, logout } from './auth.js';
import { initThemeToggle, initSidebarToggle, qs, qsa } from './utils.js';

initThemeToggle('themeToggle');
initSidebarToggle();
document.getElementById('btnLogout')?.addEventListener('click', () => logout('login.html'));

let teacher = null;
let classesCache = [];

const session = await requireAuth('login.html');
if (session) {
  teacher = await getCurrentTeacher();
  if (teacher) {
    await loadClasses();
    await loadAssignments();
  }
}

// ------- Kelas -------

async function loadClasses() {
  const { data, error } = await supabase
    .from('classes')
    .select('id, nama_kelas, tingkat, wali_kelas_id')
    .eq('owner_id', teacher.id)
    .order('nama_kelas');

  if (error) {
    console.error('Gagal ambil kelas:', error.message);
    return;
  }
  classesCache = data || [];
  renderClasses();
  fillClassDropdown();
}

function renderClasses() {
  const el = document.getElementById('classList');
  if (classesCache.length === 0) {
    el.innerHTML = '<p class="text-sm text-muted">Belum ada kelas.</p>';
    return;
  }
  el.innerHTML = classesCache
    .map(
      (c) => `
    <div class="row gap-3" style="justify-content:space-between;">
      <div class="row gap-2">
        <strong>Kelas ${c.nama_kelas}</strong>
        <span class="text-sm text-muted">Tingkat ${c.tingkat}</span>
        ${c.wali_kelas_id ? '<span class="badge badge-success">Wali Kelas</span>' : ''}
      </div>
      <button class="btn btn-ghost btn-delete-class" data-id="${c.id}">Hapus</button>
    </div>`
    )
    .join('');

  qsa('.btn-delete-class', el).forEach((btn) =>
    btn.addEventListener('click', async () => {
      if (!confirm('Hapus kelas ini? Data siswa & RPP terkait juga ikut terhapus.')) return;
      const { error } = await supabase.from('classes').delete().eq('id', btn.dataset.id);
      if (error) {
        alert('Gagal menghapus: ' + error.message);
        return;
      }
      await loadClasses();
    })
  );
}

function fillClassDropdown() {
  qs('#aKelas').innerHTML = classesCache
    .map((c) => `<option value="${c.id}">${c.nama_kelas}</option>`)
    .join('');
}

document.getElementById('btnNewClass').addEventListener('click', () => {
  document.getElementById('classFormPanel').style.display = 'block';
});
document.getElementById('btnCancelClass').addEventListener('click', () => {
  document.getElementById('classFormPanel').style.display = 'none';
});

document.getElementById('classForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const { error } = await supabase.from('classes').insert({
    owner_id: teacher.id,
    nama_kelas: qs('#fNamaKelas').value,
    tingkat: qs('#fTingkat').value,
  });
  if (error) {
    alert('Gagal menyimpan kelas: ' + error.message);
    return;
  }
  document.getElementById('classForm').reset();
  document.getElementById('classFormPanel').style.display = 'none';
  await loadClasses();
});

// ------- Penugasan Mengajar -------

async function loadAssignments() {
  const { data, error } = await supabase
    .from('teaching_assignments')
    .select('id, mapel, classes(nama_kelas)')
    .eq('teacher_id', teacher.id);

  if (error) {
    console.error('Gagal ambil penugasan:', error.message);
    return;
  }
  renderAssignments(data || []);
}

function renderAssignments(assignments) {
  const el = document.getElementById('assignmentList');
  if (assignments.length === 0) {
    el.innerHTML = '<p class="text-sm text-muted">Belum ada penugasan mengajar.</p>';
    return;
  }
  el.innerHTML = assignments
    .map(
      (a) => `
    <div class="row gap-3" style="justify-content:space-between;">
      <span>${a.mapel} — Kelas ${a.classes?.nama_kelas || '-'}</span>
      <button class="btn btn-ghost btn-delete-assignment" data-id="${a.id}">Hapus</button>
    </div>`
    )
    .join('');

  qsa('.btn-delete-assignment', el).forEach((btn) =>
    btn.addEventListener('click', async () => {
      const { error } = await supabase.from('teaching_assignments').delete().eq('id', btn.dataset.id);
      if (error) {
        alert('Gagal menghapus: ' + error.message);
        return;
      }
      await loadAssignments();
    })
  );
}

document.getElementById('btnNewAssignment').addEventListener('click', () => {
  const form = document.getElementById('assignmentForm');
  form.style.display = form.style.display === 'none' ? 'flex' : 'none';
});

document.getElementById('assignmentForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const { error } = await supabase.from('teaching_assignments').insert({
    teacher_id: teacher.id,
    kelas_id: qs('#aKelas').value,
    mapel: qs('#aMapel').value,
  });
  if (error) {
    alert('Gagal menyimpan penugasan: ' + error.message);
    return;
  }
  document.getElementById('assignmentForm').reset();
  await loadAssignments();
});
