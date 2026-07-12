// js/students.js
// Terintegrasi Supabase: CRUD `students`, filter per kelas.

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
  if (teacher) {
    await loadClassesForDropdowns();
    await loadStudents();
  }
}

async function loadClassesForDropdowns() {
  const { data, error } = await supabase
    .from('classes')
    .select('id, nama_kelas')
    .eq('owner_id', teacher.id)
    .order('nama_kelas');

  if (error) {
    console.error('Gagal ambil kelas:', error.message);
    return;
  }

  const options = (data || []).map((c) => `<option value="${c.id}">${c.nama_kelas}</option>`).join('');
  qs('#sKelas').innerHTML = options;
  qs('#filterKelas').innerHTML = '<option value="">Semua Kelas</option>' + options;
}

async function loadStudents() {
  const kelasFilter = qs('#filterKelas').value;
  const search = qs('#filterSearch').value.trim();

  let query = supabase
    .from('students')
    .select('id, nama, nis, jenis_kelamin, nama_orang_tua, kontak_orang_tua, catatan_perkembangan, class_id, classes(nama_kelas)')
    .eq('owner_id', teacher.id)
    .order('nama');

  if (kelasFilter) query = query.eq('class_id', kelasFilter);
  if (search) query = query.ilike('nama', `%${search}%`);

  const { data, error } = await query;
  if (error) {
    console.error('Gagal ambil siswa:', error.message);
    return;
  }
  renderStudents(data || []);
}

function renderStudents(students) {
  const el = document.getElementById('studentList');
  if (students.length === 0) {
    el.innerHTML = '<p class="text-sm text-muted">Belum ada siswa yang cocok.</p>';
    return;
  }
  el.innerHTML = students
    .map(
      (s) => `
    <div class="card row gap-4" style="justify-content:space-between;" data-id="${s.id}">
      <div>
        <strong>${s.nama}</strong>
        <div class="text-sm text-muted">
          Kelas ${s.classes?.nama_kelas || '-'} · NIS ${s.nis || '-'} · ${s.jenis_kelamin === 'P' ? 'Perempuan' : 'Laki-laki'}
        </div>
      </div>
      <div class="row gap-2">
        <button class="btn btn-ghost btn-edit-student" data-id="${s.id}">Edit</button>
        <button class="btn btn-ghost btn-delete-student" data-id="${s.id}">Hapus</button>
      </div>
    </div>`
    )
    .join('');

  qsa('.btn-edit-student', el).forEach((btn) =>
    btn.addEventListener('click', () => openForm(btn.dataset.id, students))
  );
  qsa('.btn-delete-student', el).forEach((btn) =>
    btn.addEventListener('click', async () => {
      if (!confirm('Hapus siswa ini? Data kehadiran & nilai terkait juga ikut terhapus.')) return;
      const { error } = await supabase.from('students').delete().eq('id', btn.dataset.id);
      if (error) {
        alert('Gagal menghapus: ' + error.message);
        return;
      }
      await loadStudents();
    })
  );
}

const form = document.getElementById('studentForm');
const formPanel = document.getElementById('studentFormPanel');

function openForm(id, students) {
  formPanel.style.display = 'block';
  if (id) {
    const s = students.find((x) => x.id === id);
    document.getElementById('studentFormTitle').textContent = 'Edit Siswa';
    qs('#sKelas').value = s.class_id;
    qs('#sNama').value = s.nama;
    qs('#sNis').value = s.nis || '';
    qs('#sJk').value = s.jenis_kelamin || 'L';
    qs('#sOrtu').value = s.nama_orang_tua || '';
    qs('#sKontak').value = s.kontak_orang_tua || '';
    qs('#sCatatan').value = s.catatan_perkembangan || '';
    form.dataset.editId = id;
  } else {
    document.getElementById('studentFormTitle').textContent = 'Tambah Siswa';
    form.reset();
    delete form.dataset.editId;
  }
  formPanel.scrollIntoView({ behavior: 'smooth' });
}

document.getElementById('btnNewStudent').addEventListener('click', () => openForm(null, []));
document.getElementById('btnCancelStudent').addEventListener('click', () => {
  formPanel.style.display = 'none';
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = {
    owner_id: teacher.id,
    class_id: qs('#sKelas').value,
    nama: qs('#sNama').value,
    nis: qs('#sNis').value,
    jenis_kelamin: qs('#sJk').value,
    nama_orang_tua: qs('#sOrtu').value,
    kontak_orang_tua: qs('#sKontak').value,
    catatan_perkembangan: qs('#sCatatan').value,
  };

  let error;
  if (form.dataset.editId) {
    ({ error } = await supabase.from('students').update(payload).eq('id', form.dataset.editId));
  } else {
    ({ error } = await supabase.from('students').insert(payload));
  }

  if (error) {
    alert('Gagal menyimpan: ' + error.message);
    return;
  }
  formPanel.style.display = 'none';
  await loadStudents();
});

document.getElementById('filterKelas').addEventListener('change', loadStudents);
document.getElementById('filterSearch').addEventListener('input', () => {
  clearTimeout(window._studentSearchDebounce);
  window._studentSearchDebounce = setTimeout(loadStudents, 300);
});
