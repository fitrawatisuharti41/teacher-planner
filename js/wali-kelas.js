// js/wali-kelas.js
// Terintegrasi Supabase: class_development_summary, class_agenda,
// homeroom_journals, student_achievements, parent_communications, homeroom_documents.
// Semua fitur di sini terikat ke SATU kelas: kelas yang `wali_kelas_id`-nya = guru ini.

import { supabase } from './config/supabase.js';
import { requireAuth, getCurrentTeacher, logout } from './auth.js';
import { initThemeToggle, renderProgressRing, qs, qsa } from './utils.js';

initThemeToggle('themeToggle');
document.getElementById('btnLogout')?.addEventListener('click', () => logout('login.html'));

let teacher = null;
let waliClass = null; // { id, nama_kelas }
let studentsCache = [];

// ------- Tab switching -------
qsa('.tab-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    qsa('.tab-btn').forEach((b) => b.classList.remove('is-active'));
    qsa('.tab-panel').forEach((p) => p.classList.remove('is-active'));
    btn.classList.add('is-active');
    document.getElementById(`panel-${btn.dataset.tab}`).classList.add('is-active');
  });
});

const session = await requireAuth('login.html');
if (session) {
  teacher = await getCurrentTeacher();
  if (teacher) await init();
}

async function init() {
  const { data, error } = await supabase
    .from('classes')
    .select('id, nama_kelas')
    .eq('wali_kelas_id', teacher.id)
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    document.getElementById('namaKelasWali').textContent = '(belum ada kelas yang ditandai sebagai wali kelas)';
    return;
  }

  waliClass = data;
  document.getElementById('namaKelasWali').textContent = `— Kelas ${data.nama_kelas}`;

  const { data: students } = await supabase
    .from('students')
    .select('id, nama')
    .eq('class_id', waliClass.id)
    .order('nama');
  studentsCache = students || [];

  const studentOptions = studentsCache.map((s) => `<option value="${s.id}">${s.nama}</option>`).join('');
  qs('#pSiswa').innerHTML = studentOptions;
  qs('#kSiswa').innerHTML = studentOptions;

  await Promise.all([
    loadDashboard(),
    loadAgenda(),
    loadJurnal(),
    loadPrestasi(),
    loadKomunikasi(),
    loadAdminDocs(),
  ]);
}

// ------- TAB: Dashboard Kelas -------
async function loadDashboard() {
  const { data, error } = await supabase
    .from('class_development_summary')
    .select('persentase_kehadiran, rata_rata_nilai, jumlah_prestasi, jumlah_pelanggaran')
    .eq('class_id', waliClass.id)
    .maybeSingle();

  if (error) {
    console.error('Gagal ambil dashboard kelas:', error.message);
    return;
  }

  renderProgressRing(document.getElementById('ringKehadiran'), Math.round(data?.persentase_kehadiran || 0));
  qs('#statRataNilai').textContent = data?.rata_rata_nilai ?? '–';
  qs('#statPrestasi').textContent = data?.jumlah_prestasi ?? 0;
  qs('#statPelanggaran').textContent = data?.jumlah_pelanggaran ?? 0;
}

// ------- TAB: Agenda Kelas -------
async function loadAgenda() {
  const { data, error } = await supabase
    .from('class_agenda')
    .select('id, tanggal, judul, deskripsi')
    .eq('class_id', waliClass.id)
    .order('tanggal', { ascending: false });

  if (error) return console.error(error.message);

  qs('#agendaList').innerHTML = (data || []).length
    ? data
        .map(
          (a) => `
      <div class="card row gap-3" style="justify-content:space-between;">
        <div><strong>${a.judul}</strong><div class="text-sm text-muted">${a.tanggal}${a.deskripsi ? ' · ' + a.deskripsi : ''}</div></div>
        <button class="btn btn-ghost btn-del" data-table="class_agenda" data-id="${a.id}">Hapus</button>
      </div>`
        )
        .join('')
    : '<p class="text-sm text-muted">Belum ada agenda.</p>';

  bindDeleteButtons('#agendaList', loadAgenda);
}

document.getElementById('btnNewAgenda').addEventListener('click', () => toggleForm('#agendaForm'));
document.getElementById('agendaForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const { error } = await supabase.from('class_agenda').insert({
    owner_id: teacher.id,
    class_id: waliClass.id,
    tanggal: qs('#agTanggal').value,
    judul: qs('#agJudul').value,
    deskripsi: qs('#agDeskripsi').value || null,
  });
  if (error) return alert('Gagal menyimpan: ' + error.message);
  e.target.reset();
  qs('#agendaForm').style.display = 'none';
  await loadAgenda();
});

// ------- TAB: Jurnal -------
async function loadJurnal() {
  const { data, error } = await supabase
    .from('homeroom_journals')
    .select('id, tanggal, catatan')
    .eq('class_id', waliClass.id)
    .order('tanggal', { ascending: false });

  if (error) return console.error(error.message);

  qs('#jurnalList').innerHTML = (data || []).length
    ? data
        .map(
          (j) => `
      <div class="card" data-id="${j.id}">
        <div class="row gap-3" style="justify-content:space-between;">
          <span class="text-sm text-muted">${j.tanggal}</span>
          <button class="btn btn-ghost btn-del" data-table="homeroom_journals" data-id="${j.id}">Hapus</button>
        </div>
        <p class="text-sm" style="margin:var(--space-2) 0 0;">${j.catatan}</p>
      </div>`
        )
        .join('')
    : '<p class="text-sm text-muted">Belum ada catatan jurnal.</p>';

  bindDeleteButtons('#jurnalList', loadJurnal);
}

document.getElementById('btnNewJurnal').addEventListener('click', () => toggleForm('#jurnalForm'));
document.getElementById('jurnalForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const { error } = await supabase.from('homeroom_journals').insert({
    owner_id: teacher.id,
    class_id: waliClass.id,
    tanggal: qs('#jTanggal').value,
    catatan: qs('#jCatatan').value,
  });
  if (error) return alert('Gagal menyimpan: ' + error.message);
  e.target.reset();
  qs('#jurnalForm').style.display = 'none';
  await loadJurnal();
});

// ------- TAB: Prestasi & Pelanggaran -------
async function loadPrestasi() {
  const { data, error } = await supabase
    .from('student_achievements')
    .select('id, tipe, judul, deskripsi, tanggal, students(nama)')
    .in('student_id', studentsCache.map((s) => s.id).length ? studentsCache.map((s) => s.id) : ['00000000-0000-0000-0000-000000000000'])
    .order('tanggal', { ascending: false });

  if (error) return console.error(error.message);

  qs('#prestasiList').innerHTML = (data || []).length
    ? data
        .map(
          (p) => `
      <div class="card row gap-3" style="justify-content:space-between;">
        <div>
          <span class="badge ${p.tipe === 'prestasi' ? 'badge-success' : 'badge-danger'}">${p.tipe}</span>
          <strong style="margin-left:var(--space-2);">${p.judul}</strong>
          <div class="text-sm text-muted">${p.students?.nama || '-'} · ${p.tanggal}${p.deskripsi ? ' · ' + p.deskripsi : ''}</div>
        </div>
        <button class="btn btn-ghost btn-del" data-table="student_achievements" data-id="${p.id}">Hapus</button>
      </div>`
        )
        .join('')
    : '<p class="text-sm text-muted">Belum ada catatan.</p>';

  bindDeleteButtons('#prestasiList', loadPrestasi);
}

document.getElementById('btnNewPrestasi').addEventListener('click', () => toggleForm('#prestasiForm'));
document.getElementById('prestasiForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const { error } = await supabase.from('student_achievements').insert({
    owner_id: teacher.id,
    student_id: qs('#pSiswa').value,
    tipe: qs('#pTipe').value,
    judul: qs('#pJudul').value,
    tanggal: qs('#pTanggal').value,
    deskripsi: qs('#pDeskripsi').value || null,
  });
  if (error) return alert('Gagal menyimpan: ' + error.message);
  e.target.reset();
  qs('#prestasiForm').style.display = 'none';
  await loadPrestasi();
  await loadDashboard();
});

// ------- TAB: Komunikasi Ortu -------
async function loadKomunikasi() {
  const { data, error } = await supabase
    .from('parent_communications')
    .select('id, metode, ringkasan, tanggal, students(nama)')
    .in('student_id', studentsCache.map((s) => s.id).length ? studentsCache.map((s) => s.id) : ['00000000-0000-0000-0000-000000000000'])
    .order('tanggal', { ascending: false });

  if (error) return console.error(error.message);

  qs('#komunikasiList').innerHTML = (data || []).length
    ? data
        .map(
          (k) => `
      <div class="card row gap-3" style="justify-content:space-between;">
        <div>
          <strong>${k.students?.nama || '-'}</strong>
          <span class="badge badge-info" style="margin-left:var(--space-2);">${k.metode || '-'}</span>
          <div class="text-sm text-muted">${k.tanggal} · ${k.ringkasan}</div>
        </div>
        <button class="btn btn-ghost btn-del" data-table="parent_communications" data-id="${k.id}">Hapus</button>
      </div>`
        )
        .join('')
    : '<p class="text-sm text-muted">Belum ada catatan komunikasi.</p>';

  bindDeleteButtons('#komunikasiList', loadKomunikasi);
}

document.getElementById('btnNewKomunikasi').addEventListener('click', () => toggleForm('#komunikasiForm'));
document.getElementById('komunikasiForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const { error } = await supabase.from('parent_communications').insert({
    owner_id: teacher.id,
    student_id: qs('#kSiswa').value,
    metode: qs('#kMetode').value,
    tanggal: qs('#kTanggal').value,
    ringkasan: qs('#kRingkasan').value,
  });
  if (error) return alert('Gagal menyimpan: ' + error.message);
  e.target.reset();
  qs('#komunikasiForm').style.display = 'none';
  await loadKomunikasi();
});

// ------- TAB: Administrasi Wali Kelas -------
async function loadAdminDocs() {
  const { data, error } = await supabase
    .from('homeroom_documents')
    .select('id, judul, kategori, url')
    .eq('class_id', waliClass.id)
    .order('created_at', { ascending: false });

  if (error) return console.error(error.message);

  qs('#adminDocList').innerHTML = (data || []).length
    ? data
        .map(
          (d) => `
      <div class="row gap-3" style="justify-content:space-between;">
        <div class="row gap-2">
          ${d.kategori ? `<span class="badge badge-info">${d.kategori}</span>` : ''}
          <span>${d.judul}</span>
        </div>
        <div class="row gap-2">
          ${d.url ? `<a class="btn btn-ghost" href="${d.url}" target="_blank" rel="noopener">Buka</a>` : ''}
          <button class="btn btn-ghost btn-del" data-table="homeroom_documents" data-id="${d.id}">Hapus</button>
        </div>
      </div>`
        )
        .join('')
    : '<p class="text-sm text-muted">Belum ada dokumen.</p>';

  bindDeleteButtons('#adminDocList', loadAdminDocs);
}

document.getElementById('btnNewAdminDoc').addEventListener('click', () => toggleForm('#adminDocForm'));
document.getElementById('adminDocForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const { error } = await supabase.from('homeroom_documents').insert({
    owner_id: teacher.id,
    class_id: waliClass.id,
    judul: qs('#hdJudul').value,
    kategori: qs('#hdKategori').value || null,
    url: qs('#hdUrl').value || null,
  });
  if (error) return alert('Gagal menyimpan: ' + error.message);
  e.target.reset();
  qs('#adminDocForm').style.display = 'none';
  await loadAdminDocs();
});

// ------- Helpers -------
function toggleForm(selector) {
  const el = qs(selector);
  el.style.display = el.style.display === 'none' ? 'flex' : 'none';
}

function bindDeleteButtons(containerSelector, reload) {
  qsa('.btn-del', qs(containerSelector)).forEach((btn) =>
    btn.addEventListener('click', async () => {
      if (!confirm('Hapus data ini?')) return;
      const { error } = await supabase.from(btn.dataset.table).delete().eq('id', btn.dataset.id);
      if (error) return alert('Gagal menghapus: ' + error.message);
      await reload();
    })
  );
}
