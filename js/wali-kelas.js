// js/wali-kelas.js
// Terintegrasi Supabase: class_development_summary, class_agenda,
// homeroom_journals, student_achievements, parent_communications, homeroom_documents.
// Semua fitur di sini terikat ke SATU kelas: kelas yang `wali_kelas_id`-nya = guru ini.

import { supabase } from './config/supabase.js';
import { requireAuth, getCurrentTeacher, logout } from './auth.js';
import { initThemeToggle, initSidebarToggle, renderProgressRing, ringColorByPercent, qs, qsa } from './utils.js';

initThemeToggle('themeToggle');
initSidebarToggle();
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
  qs('#cpSiswa').innerHTML = studentOptions;

  await Promise.all([
    loadDashboard(),
    loadAgenda(),
    loadGaleri(),
    loadPengumuman(),
    loadJurnal(),
    loadPrestasi(),
    loadKomunikasi(),
    loadCatatanPribadi(),
    loadAdminDocs(),
  ]);
}

// ------- TAB: Catatan Pribadi Siswa -------
async function loadCatatanPribadi() {
  const { data, error } = await supabase
    .from('student_private_notes')
    .select('id, tanggal, catatan, students(nama)')
    .in('student_id', studentsCache.map((s) => s.id).length ? studentsCache.map((s) => s.id) : ['00000000-0000-0000-0000-000000000000'])
    .order('tanggal', { ascending: false });

  if (error) return console.error(error.message);

  qs('#catatanPribadiList').innerHTML = (data || []).length
    ? data
        .map(
          (n) => `
      <div class="card row gap-3" style="justify-content:space-between;">
        <div>
          <strong>${n.students?.nama || '-'}</strong>
          <div class="text-sm text-muted">${n.tanggal}</div>
          <p class="text-sm" style="margin:var(--space-1) 0 0;">${n.catatan}</p>
        </div>
        <button class="btn btn-ghost btn-del" data-table="student_private_notes" data-id="${n.id}">Hapus</button>
      </div>`
        )
        .join('')
    : '<p class="text-sm text-muted">Belum ada catatan pribadi.</p>';

  bindDeleteButtons('#catatanPribadiList', loadCatatanPribadi);
}

document.getElementById('btnNewCatatanPribadi').addEventListener('click', () => toggleForm('#catatanPribadiForm'));
document.getElementById('catatanPribadiForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const { error } = await supabase.from('student_private_notes').insert({
    owner_id: teacher.id,
    student_id: qs('#cpSiswa').value,
    tanggal: qs('#cpTanggal').value,
    catatan: qs('#cpCatatan').value,
  });
  if (error) return alert('Gagal menyimpan: ' + error.message);
  e.target.reset();
  qs('#catatanPribadiForm').style.display = 'none';
  await loadCatatanPribadi();
});

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

  const persentaseKehadiran = Math.round(data?.persentase_kehadiran || 0);
  renderProgressRing(document.getElementById('ringKehadiran'), persentaseKehadiran, 96, ringColorByPercent(persentaseKehadiran));
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

// ------- TAB: Galeri & Info -------
async function loadGaleri() {
  const { data, error } = await supabase
    .from('class_gallery')
    .select('id, tanggal, judul, catatan, foto_url')
    .eq('class_id', waliClass.id)
    .order('tanggal', { ascending: false });

  if (error) return console.error(error.message);

  qs('#galeriList').innerHTML = (data || []).length
    ? data
        .map(
          (g) => `
      <div class="card gallery-item" data-id="${g.id}">
        ${
          g.foto_url
            ? `<img class="gallery-photo" src="${g.foto_url}" alt="${g.judul || 'Foto kegiatan'}" loading="lazy">`
            : `<div class="gallery-photo-placeholder"><svg class="icon icon-lg"><use href="assets/icons/icons.svg#icon-folder"/></svg></div>`
        }
        <div class="gallery-body">
          <span class="gallery-date">${g.tanggal}</span>
          ${g.judul ? `<strong>${g.judul}</strong>` : ''}
          ${g.catatan ? `<p class="text-sm text-muted" style="margin:0;">${g.catatan}</p>` : ''}
          <button class="btn btn-ghost btn-del-galeri" data-id="${g.id}" data-foto="${g.foto_url || ''}" style="align-self:flex-start; margin-top:var(--space-1);">Hapus</button>
        </div>
      </div>`
        )
        .join('')
    : '<p class="text-sm text-muted">Belum ada foto/info kegiatan.</p>';

  qsa('.btn-del-galeri', qs('#galeriList')).forEach((btn) =>
    btn.addEventListener('click', async () => {
      if (!confirm('Hapus foto/info ini?')) return;
      if (btn.dataset.foto) {
        const marker = '/galeri-kelas/';
        const idx = btn.dataset.foto.indexOf(marker);
        if (idx !== -1) {
          const path = btn.dataset.foto.slice(idx + marker.length);
          await supabase.storage.from('galeri-kelas').remove([path]);
        }
      }
      const { error } = await supabase.from('class_gallery').delete().eq('id', btn.dataset.id);
      if (error) return alert('Gagal menghapus: ' + error.message);
      await loadGaleri();
    })
  );
}

document.getElementById('btnNewGaleri').addEventListener('click', () => toggleForm('#galeriForm'));
document.getElementById('galeriForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const submitBtn = qs('#gSubmitBtn');
  const statusEl = qs('#gUploadStatus');
  const file = qs('#gFotoFile').files[0];

  if (file && file.size > 5 * 1024 * 1024) {
    return alert('Ukuran foto maksimal 5MB. Pilih foto lain atau kompres dulu.');
  }

  submitBtn.disabled = true;
  let fotoUrl = null;

  if (file) {
    statusEl.textContent = 'Mengupload foto...';
    const ext = file.name.split('.').pop();
    const path = `${waliClass.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error: uploadError } = await supabase.storage.from('galeri-kelas').upload(path, file);
    if (uploadError) {
      statusEl.textContent = '';
      submitBtn.disabled = false;
      return alert('Gagal upload foto: ' + uploadError.message);
    }
    fotoUrl = supabase.storage.from('galeri-kelas').getPublicUrl(path).data.publicUrl;
  }

  statusEl.textContent = 'Menyimpan...';
  const { error } = await supabase.from('class_gallery').insert({
    owner_id: teacher.id,
    class_id: waliClass.id,
    tanggal: qs('#gTanggal').value,
    judul: qs('#gJudul').value || null,
    catatan: qs('#gCatatan').value || null,
    foto_url: fotoUrl,
  });

  submitBtn.disabled = false;
  statusEl.textContent = '';
  if (error) return alert('Gagal menyimpan: ' + error.message);
  e.target.reset();
  qs('#galeriForm').style.display = 'none';
  await loadGaleri();
});

// ------- TAB: Pengumuman -------
async function loadPengumuman() {
  const { data, error } = await supabase
    .from('class_announcements')
    .select('id, tanggal, judul, isi')
    .eq('class_id', waliClass.id)
    .order('tanggal', { ascending: false });

  if (error) return console.error(error.message);

  qs('#pengumumanList').innerHTML = (data || []).length
    ? data
        .map(
          (p) => `
      <div class="card stack gap-1" data-id="${p.id}">
        <div class="row gap-3" style="justify-content:space-between;">
          <strong>${p.judul}</strong>
          <span class="text-sm text-muted">${p.tanggal}</span>
        </div>
        ${p.isi ? `<p class="text-sm text-muted" style="margin:0;">${p.isi}</p>` : ''}
        <button class="btn btn-ghost btn-del" data-table="class_announcements" data-id="${p.id}" style="align-self:flex-start;">Hapus</button>
      </div>`
        )
        .join('')
    : '<p class="text-sm text-muted">Belum ada pengumuman.</p>';

  bindDeleteButtons('#pengumumanList', loadPengumuman);
}

document.getElementById('btnNewPengumuman').addEventListener('click', () => toggleForm('#pengumumanForm'));
document.getElementById('pengumumanForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const { error } = await supabase.from('class_announcements').insert({
    owner_id: teacher.id,
    class_id: waliClass.id,
    tanggal: qs('#pTanggal').value,
    judul: qs('#pJudul').value,
    isi: qs('#pIsi').value || null,
  });
  if (error) return alert('Gagal menyimpan: ' + error.message);
  e.target.reset();
  qs('#pengumumanForm').style.display = 'none';
  await loadPengumuman();
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
