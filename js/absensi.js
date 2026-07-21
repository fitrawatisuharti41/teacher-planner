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

// ------- Rekap Absensi (pivot: baris = siswa, kolom = tiap tanggal) + Export Excel -------

const STATUS_SINGKATAN = { hadir: 'H', izin: 'I', sakit: 'S', terlambat: 'T', alpa: 'A' };

async function loadClassDropdownRekap() {
  const { data } = await supabase.from('classes').select('id, nama_kelas').eq('owner_id', teacher.id).order('nama_kelas');
  qs('#rekapAbsKelas').innerHTML = (data || []).map((c) => `<option value="${c.id}">${c.nama_kelas}</option>`).join('');
}
loadClassDropdownRekap();

// Default rentang: awal bulan ini sampai hari ini
const today = new Date();
qs('#rekapAbsDari').value = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
qs('#rekapAbsSampai').value = today.toISOString().slice(0, 10);

let rekapAbsensiCache = null; // { headers, rows }

async function buildRekapAbsensi() {
  const classId = qs('#rekapAbsKelas').value;
  const dari = qs('#rekapAbsDari').value;
  const sampai = qs('#rekapAbsSampai').value;
  if (!classId || !dari || !sampai) return;

  const { data: students } = await supabase
    .from('students')
    .select('id, nama')
    .eq('class_id', classId)
    .order('nama');

  const studentIds = (students || []).map((s) => s.id);

  const { data: records } = await supabase
    .from('attendance')
    .select('student_id, tanggal, status')
    .in('student_id', studentIds.length ? studentIds : ['00000000-0000-0000-0000-000000000000'])
    .gte('tanggal', dari)
    .lte('tanggal', sampai)
    .order('tanggal');

  const uniqueDates = [...new Set((records || []).map((r) => r.tanggal))].sort();
  const statusMap = {}; // `${student_id}|${tanggal}` -> status
  (records || []).forEach((r) => {
    statusMap[`${r.student_id}|${r.tanggal}`] = r.status;
  });

  const headers = ['Nama Siswa', ...uniqueDates, 'Hadir', 'Izin', 'Sakit', 'Terlambat', 'Alpa'];
  const rows = (students || []).map((s) => {
    const perTanggal = uniqueDates.map((d) => STATUS_SINGKATAN[statusMap[`${s.id}|${d}`]] || '');
    const counts = { hadir: 0, izin: 0, sakit: 0, terlambat: 0, alpa: 0 };
    uniqueDates.forEach((d) => {
      const st = statusMap[`${s.id}|${d}`];
      if (st) counts[st]++;
    });
    return [s.nama, ...perTanggal, counts.hadir, counts.izin, counts.sakit, counts.terlambat, counts.alpa];
  });

  rekapAbsensiCache = { headers, rows };
  renderRekapAbsensiTable(headers, rows);
}

function renderRekapAbsensiTable(headers, rows) {
  const table = document.getElementById('rekapAbsensiTable');
  if (rows.length === 0) {
    table.innerHTML = '<tr><td class="text-sm text-muted">Belum ada data untuk kelas/rentang tanggal ini.</td></tr>';
    return;
  }
  const thead = `<tr>${headers.map((h) => `<th style="text-align:left; padding:var(--space-2); border-bottom:2px solid var(--color-line); white-space:nowrap;">${h}</th>`).join('')}</tr>`;
  const tbody = rows
    .map(
      (row) =>
        `<tr>${row.map((cell) => `<td style="padding:var(--space-2); border-bottom:1px solid var(--color-line);">${cell}</td>`).join('')}</tr>`
    )
    .join('');
  table.innerHTML = thead + tbody;
}

document.getElementById('btnMuatRekapAbsensi').addEventListener('click', buildRekapAbsensi);

document.getElementById('btnExportAbsensiExcel').addEventListener('click', async () => {
  if (!rekapAbsensiCache) await buildRekapAbsensi();
  if (!rekapAbsensiCache || rekapAbsensiCache.rows.length === 0) {
    alert('Belum ada data buat di-download. Pilih kelas & rentang tanggal, klik "Tampilkan" dulu.');
    return;
  }
  const kelasNama = qs('#rekapAbsKelas option:checked').textContent;
  const dari = qs('#rekapAbsDari').value;
  const sampai = qs('#rekapAbsSampai').value;
  const ws = XLSX.utils.aoa_to_sheet([rekapAbsensiCache.headers, ...rekapAbsensiCache.rows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Rekap Absensi');
  XLSX.writeFile(wb, `Rekap-Absensi-${kelasNama}-${dari}_${sampai}.xlsx`);
});
