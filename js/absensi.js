// js/absensi.js
// Absensi untuk SEMUA kelas yang diajar guru (bukan cuma kelas wali).
// Polanya sama dengan tab Absensi di wali-kelas.js, tapi kelasnya bisa dipilih bebas.

import { supabase } from './config/supabase.js';
import { requireAuth, getCurrentTeacher, logout } from './auth.js';
import { initThemeToggle, initSidebarToggle, qs, qsa } from './utils.js';

const STATUS_ABSENSI = {
  hadir: 'Hadir',
  izin: 'Izin',
  sakit: 'Sakit',
  terlambat: 'Terlambat',
  alpa: 'Alpa',
};

initThemeToggle('themeToggle');
initSidebarToggle();
document.getElementById('btnLogout')?.addEventListener('click', () => logout('login.html'));

let teacher = null;
let studentsCache = [];

qs('#absTanggal').value = new Date().toISOString().slice(0, 10);

const session = await requireAuth('login.html');
if (session) {
  teacher = await getCurrentTeacher();
  if (teacher) {
    await loadClassDropdown();
    await loadStudentsForClass();
  }
}

async function loadClassDropdown() {
  const { data, error } = await supabase
    .from('classes')
    .select('id, nama_kelas')
    .eq('owner_id', teacher.id)
    .order('nama_kelas');

  if (error) {
    console.error('Gagal ambil kelas:', error.message);
    return;
  }
  qs('#absKelas').innerHTML = (data || [])
    .map((c) => `<option value="${c.id}">${c.nama_kelas}</option>`)
    .join('');
}

async function loadStudentsForClass() {
  const classId = qs('#absKelas').value;
  if (!classId) {
    studentsCache = [];
    await loadAbsensi();
    return;
  }
  const { data, error } = await supabase
    .from('students')
    .select('id, nama')
    .eq('class_id', classId)
    .order('nama');

  if (error) {
    console.error('Gagal ambil siswa:', error.message);
    return;
  }
  studentsCache = data || [];
  await loadAbsensi();
}

async function loadAbsensi() {
  const tanggal = qs('#absTanggal').value;
  const listEl = document.getElementById('absensiList');

  if (studentsCache.length === 0) {
    listEl.innerHTML = '<p class="text-sm text-muted">Pilih kelas dulu, atau kelas ini belum ada siswanya.</p>';
    return;
  }

  const studentIds = studentsCache.map((s) => s.id);
  const { data: existing, error } = await supabase
    .from('attendance')
    .select('student_id, status')
    .in('student_id', studentIds)
    .eq('tanggal', tanggal);

  if (error) console.error('Gagal ambil absensi:', error.message);

  const statusMap = Object.fromEntries((existing || []).map((a) => [a.student_id, a.status]));

  listEl.innerHTML = studentsCache
    .map(
      (s) => `
    <div class="row gap-3" style="justify-content:space-between;" data-student-id="${s.id}">
      <span>${s.nama}</span>
      <select class="input status-select" data-student-id="${s.id}" style="max-width:160px;">
        ${Object.entries(STATUS_ABSENSI)
          .map(([val, label]) => `<option value="${val}" ${statusMap[s.id] === val ? 'selected' : ''}>${label}</option>`)
          .join('')}
      </select>
    </div>`
    )
    .join('');
}

document.getElementById('absKelas').addEventListener('change', loadStudentsForClass);
document.getElementById('absTanggal').addEventListener('change', loadAbsensi);

document.getElementById('btnTandaiHadirSemua').addEventListener('click', () => {
  qsa('.status-select').forEach((sel) => (sel.value = 'hadir'));
});

document.getElementById('btnSimpanAbsensi').addEventListener('click', async () => {
  const tanggal = qs('#absTanggal').value;
  const rows = qsa('.status-select').map((sel) => ({
    owner_id: teacher.id,
    student_id: sel.dataset.studentId,
    tanggal,
    status: sel.value,
  }));

  if (rows.length === 0) return;

  const { error } = await supabase
    .from('attendance')
    .upsert(rows, { onConflict: 'student_id,tanggal' });

  if (error) {
    alert('Gagal menyimpan: ' + error.message);
    return;
  }
  alert('Absensi tersimpan.');
});
