// js/assessment.js
// Terintegrasi Supabase: `assessments` (data ujian) + `assessment_items` (nilai per siswa).

import { supabase } from './config/supabase.js';
import { requireAuth, getCurrentTeacher, logout } from './auth.js';
import { initThemeToggle, initSidebarToggle, qs, qsa } from './utils.js';

initThemeToggle('themeToggle');
initSidebarToggle();
document.getElementById('btnLogout')?.addEventListener('click', () => logout('login.html'));

let teacher = null;
let currentAssessment = null; // { id, kkm, class_id }

const session = await requireAuth('login.html');
if (session) {
  teacher = await getCurrentTeacher();
  if (teacher) {
    await loadClassDropdown();
    await loadAssessments();
  }
}

async function loadClassDropdown() {
  const { data } = await supabase.from('classes').select('id, nama_kelas').eq('owner_id', teacher.id).order('nama_kelas');
  qs('#asKelas').innerHTML = (data || []).map((c) => `<option value="${c.id}">${c.nama_kelas}</option>`).join('');
}

async function loadAssessments() {
  const { data, error } = await supabase
    .from('assessments')
    .select('id, judul, mapel, kkm, tanggal, class_id, classes(nama_kelas)')
    .eq('owner_id', teacher.id)
    .order('tanggal', { ascending: false });

  if (error) {
    console.error('Gagal ambil asesmen:', error.message);
    return;
  }
  renderAssessments(data || []);
}

function renderAssessments(list) {
  const el = document.getElementById('assessmentList');
  if (list.length === 0) {
    el.innerHTML = '<p class="text-sm text-muted">Belum ada asesmen.</p>';
    return;
  }
  el.innerHTML = list
    .map(
      (a) => `
    <div class="card row gap-3" style="justify-content:space-between;">
      <div>
        <strong>${a.judul}</strong>
        <div class="text-sm text-muted">${a.mapel} · Kelas ${a.classes?.nama_kelas || '-'} · KKM ${a.kkm} · ${a.tanggal || ''}</div>
      </div>
      <div class="row gap-2">
        <button class="btn btn-secondary btn-isi-nilai" data-id="${a.id}" data-kkm="${a.kkm}" data-class="${a.class_id}" data-judul="${a.judul}">Isi Nilai</button>
        <button class="btn btn-ghost btn-delete-assessment" data-id="${a.id}">Hapus</button>
      </div>
    </div>`
    )
    .join('');

  qsa('.btn-isi-nilai', el).forEach((btn) =>
    btn.addEventListener('click', () =>
      openNilaiPanel(btn.dataset.id, btn.dataset.class, Number(btn.dataset.kkm), btn.dataset.judul)
    )
  );
  qsa('.btn-delete-assessment', el).forEach((btn) =>
    btn.addEventListener('click', async () => {
      if (!confirm('Hapus asesmen ini beserta semua nilainya?')) return;
      const { error } = await supabase.from('assessments').delete().eq('id', btn.dataset.id);
      if (error) {
        alert('Gagal menghapus: ' + error.message);
        return;
      }
      await loadAssessments();
    })
  );
}

document.getElementById('btnNewAssessment').addEventListener('click', () => {
  document.getElementById('assessmentFormPanel').style.display = 'block';
});
document.getElementById('btnCancelAssessment').addEventListener('click', () => {
  document.getElementById('assessmentFormPanel').style.display = 'none';
});

document.getElementById('assessmentForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const { error } = await supabase.from('assessments').insert({
    owner_id: teacher.id,
    class_id: qs('#asKelas').value,
    mapel: qs('#asMapel').value,
    judul: qs('#asJudul').value,
    kkm: Number(qs('#asKkm').value) || 75,
    tanggal: qs('#asTanggal').value || null,
  });
  if (error) {
    alert('Gagal menyimpan: ' + error.message);
    return;
  }
  document.getElementById('assessmentForm').reset();
  document.getElementById('assessmentFormPanel').style.display = 'none';
  await loadAssessments();
});

// ------- Panel isi nilai -------

async function openNilaiPanel(assessmentId, classId, kkm, judul) {
  currentAssessment = { id: assessmentId, classId, kkm };
  document.getElementById('nilaiPanelTitle').textContent = `Isi Nilai — ${judul}`;
  document.getElementById('nilaiPanel').style.display = 'block';
  document.getElementById('nilaiPanel').scrollIntoView({ behavior: 'smooth' });

  const { data: students, error: studentsError } = await supabase
    .from('students')
    .select('id, nama')
    .eq('class_id', classId)
    .order('nama');

  if (studentsError) {
    console.error('Gagal ambil siswa:', studentsError.message);
    return;
  }

  const { data: existingItems } = await supabase
    .from('assessment_items')
    .select('student_id, nilai')
    .eq('assessment_id', assessmentId);

  const nilaiMap = Object.fromEntries((existingItems || []).map((i) => [i.student_id, i.nilai]));

  const listEl = document.getElementById('nilaiInputList');
  listEl.innerHTML = (students || [])
    .map((s) => {
      const nilai = nilaiMap[s.id] ?? '';
      const belowKkm = nilai !== '' && Number(nilai) < kkm;
      return `
      <div class="row gap-3 nilai-row ${belowKkm ? 'below-kkm' : ''}" style="justify-content:space-between; padding: var(--space-2);" data-student-id="${s.id}">
        <span>${s.nama}</span>
        <input class="input nilai-input" type="number" min="0" max="100" step="0.5" value="${nilai}" data-student-id="${s.id}">
      </div>`;
    })
    .join('');

  updateStats(students || [], nilaiMap, kkm);

  qsa('.nilai-input', listEl).forEach((input) =>
    input.addEventListener('input', () => {
      const row = input.closest('.nilai-row');
      const val = input.value === '' ? null : Number(input.value);
      row.classList.toggle('below-kkm', val !== null && val < kkm);
    })
  );
}

function updateStats(students, nilaiMap, kkm) {
  const nilaiValues = students.map((s) => nilaiMap[s.id]).filter((v) => v !== undefined);
  const total = students.length;
  const rata = nilaiValues.length ? (nilaiValues.reduce((a, b) => a + b, 0) / nilaiValues.length).toFixed(1) : '–';
  const diAtas = nilaiValues.filter((v) => v >= kkm).length;
  const remedial = nilaiValues.filter((v) => v < kkm).length;

  document.getElementById('statTotalSiswa').textContent = total;
  document.getElementById('statRataRata').textContent = rata;
  document.getElementById('statDiAtasKkm').textContent = diAtas;
  document.getElementById('statRemedial').textContent = remedial;
}

document.getElementById('btnCloseNilai').addEventListener('click', () => {
  document.getElementById('nilaiPanel').style.display = 'none';
  currentAssessment = null;
});

document.getElementById('btnSaveNilai').addEventListener('click', async () => {
  if (!currentAssessment) return;

  const rows = qsa('.nilai-input').map((input) => ({
    assessment_id: currentAssessment.id,
    student_id: input.dataset.studentId,
    nilai: input.value === '' ? null : Number(input.value),
  })).filter((r) => r.nilai !== null);

  if (rows.length === 0) return;

  // upsert: kalau kombinasi assessment_id+student_id sudah ada, update; kalau belum, insert
  const { error } = await supabase
    .from('assessment_items')
    .upsert(rows, { onConflict: 'assessment_id,student_id' });

  if (error) {
    alert('Gagal menyimpan nilai: ' + error.message);
    return;
  }
  alert('Nilai berhasil disimpan.');
});

// ------- Rekap Nilai (pivot: baris = siswa, kolom = tiap asesmen) + Export Excel -------

async function loadClassDropdownRekap() {
  const { data } = await supabase.from('classes').select('id, nama_kelas').eq('owner_id', teacher.id).order('nama_kelas');
  qs('#rekapKelas').innerHTML = (data || []).map((c) => `<option value="${c.id}">${c.nama_kelas}</option>`).join('');
}
loadClassDropdownRekap();

let rekapDataCache = null; // { headers: [...], rows: [[...]] }

async function buildRekap() {
  const classId = qs('#rekapKelas').value;
  if (!classId) return;

  const { data: students } = await supabase
    .from('students')
    .select('id, nama')
    .eq('class_id', classId)
    .order('nama');

  const { data: assessments } = await supabase
    .from('assessments')
    .select('id, judul, mapel, kkm, tanggal')
    .eq('class_id', classId)
    .order('tanggal');

  const { data: items } = await supabase
    .from('assessment_items')
    .select('assessment_id, student_id, nilai')
    .in('assessment_id', (assessments || []).map((a) => a.id).length ? (assessments || []).map((a) => a.id) : ['00000000-0000-0000-0000-000000000000']);

  const nilaiMap = {}; // `${assessment_id}|${student_id}` -> nilai
  (items || []).forEach((i) => {
    nilaiMap[`${i.assessment_id}|${i.student_id}`] = i.nilai;
  });

  const headers = ['Nama Siswa', ...(assessments || []).map((a) => `${a.judul} (${a.mapel})`), 'Rata-rata'];
  const rows = (students || []).map((s) => {
    const nilaiList = (assessments || []).map((a) => nilaiMap[`${a.id}|${s.id}`]);
    const validNilai = nilaiList.filter((n) => n !== undefined && n !== null);
    const rata = validNilai.length ? (validNilai.reduce((a, b) => a + b, 0) / validNilai.length).toFixed(1) : '';
    return [s.nama, ...nilaiList.map((n) => (n === undefined || n === null ? '' : n)), rata];
  });

  rekapDataCache = { headers, rows };
  renderRekapTable(headers, rows);
}

function renderRekapTable(headers, rows) {
  const table = document.getElementById('rekapTable');
  if (rows.length === 0) {
    table.innerHTML = '<tr><td class="text-sm text-muted">Belum ada data untuk kelas ini.</td></tr>';
    return;
  }
  const thead = `<tr>${headers.map((h) => `<th style="text-align:left; padding:var(--space-2); border-bottom:2px solid var(--color-line);">${h}</th>`).join('')}</tr>`;
  const tbody = rows
    .map(
      (row) =>
        `<tr>${row.map((cell) => `<td style="padding:var(--space-2); border-bottom:1px solid var(--color-line);">${cell}</td>`).join('')}</tr>`
    )
    .join('');
  table.innerHTML = thead + tbody;
}

document.getElementById('btnMuatRekap').addEventListener('click', buildRekap);

document.getElementById('btnExportExcel').addEventListener('click', async () => {
  if (!rekapDataCache) await buildRekap();
  if (!rekapDataCache || rekapDataCache.rows.length === 0) {
    alert('Belum ada data buat di-download. Pilih kelas dan klik "Tampilkan" dulu.');
    return;
  }
  const kelasNama = qs('#rekapKelas option:checked').textContent;
  const ws = XLSX.utils.aoa_to_sheet([rekapDataCache.headers, ...rekapDataCache.rows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Rekap Nilai');
  XLSX.writeFile(wb, `Rekap-Nilai-${kelasNama}-${new Date().toISOString().slice(0, 10)}.xlsx`);
});
