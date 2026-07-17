// js/portal-siswa.js
// Phase 6: terintegrasi ke Supabase pakai anon key (TANPA login).
// Query hanya ke tabel/view yang policy publiknya "select" saja:
// `classes` dan view `students_public`.

import { supabase } from './config/supabase.js';
import { qs, qsa } from './utils.js';

const step1 = document.getElementById('step1');
const step2 = document.getElementById('step2');
const step3 = document.getElementById('step3');

function showStep(step) {
  [step1, step2, step3].forEach((s) => s.classList.remove('is-active'));
  step.classList.add('is-active');
}

async function loadClasses() {
  const { data, error } = await supabase
    .from('classes')
    .select('id, nama_kelas')
    .order('nama_kelas');

  if (error) {
    console.error('Gagal ambil daftar kelas:', error.message);
    return;
  }

  const select = document.getElementById('selectKelas');
  select.innerHTML =
    '<option value="">-- Pilih Kelas --</option>' +
    data.map((c) => `<option value="${c.id}">${c.nama_kelas}</option>`).join('');
}

async function loadNames(classId) {
  const { data, error } = await supabase
    .from('students_public')
    .select('id, nama')
    .eq('class_id', classId)
    .order('nama');

  const grid = document.getElementById('nameGrid');

  if (error) {
    console.error('Gagal ambil daftar siswa:', error.message);
    grid.innerHTML = '<p class="text-sm text-muted">Gagal memuat daftar siswa.</p>';
    return;
  }
  if (!data || data.length === 0) {
    grid.innerHTML = '<p class="text-sm text-muted">Belum ada siswa terdaftar di kelas ini.</p>';
    return;
  }

  grid.innerHTML = data
    .map(
      (s) => `<button type="button" class="btn btn-secondary name-btn" data-id="${s.id}" data-nama="${s.nama}">${s.nama}</button>`
    )
    .join('');

  qsa('.name-btn', grid).forEach((btn) =>
    btn.addEventListener('click', () => pilihSiswa(btn.dataset.id, btn.dataset.nama))
  );
}

function pilihSiswa(studentId, nama) {
  const kelasSelect = document.getElementById('selectKelas');
  const classId = kelasSelect.value;
  const kelasNama = kelasSelect.options[kelasSelect.selectedIndex].textContent;

  sessionStorage.setItem('portalStudentId', studentId);
  sessionStorage.setItem('portalNama', nama);
  sessionStorage.setItem('portalKelasId', classId);
  sessionStorage.setItem('portalKelasNama', kelasNama);

  document.getElementById('namaTerpilih').textContent = nama;
  document.getElementById('kelasTerpilih2').textContent = kelasNama;
  loadPenilaianDesc(classId);
  showStep(step3);
}

// Label "Penilaian" di kartu menu ikut mapel yang benar-benar diajarkan
// di kelas ini (guru cuma pegang 1 mapel per kelas: IPA atau Prakarya),
// bukan "semua mata pelajaran" (portal ini bukan e-rapor sekolah).
async function loadPenilaianDesc(classId) {
  const el = document.getElementById('penilaianDesc');
  if (!classId) return;
  const { data, error } = await supabase
    .from('teaching_assignments')
    .select('mapel')
    .eq('kelas_id', classId)
    .limit(1)
    .maybeSingle();
  el.textContent = !error && data?.mapel ? `Ringkasan nilai ${data.mapel}` : 'Ringkasan nilai';
}

document.getElementById('btnLanjutKelas').addEventListener('click', async () => {
  const select = document.getElementById('selectKelas');
  const classId = select.value;
  if (!classId) return;

  document.getElementById('kelasTerpilih').textContent =
    select.options[select.selectedIndex].textContent;

  await loadNames(classId);
  showStep(step2);
});

document.getElementById('btnGantiKelas').addEventListener('click', () => showStep(step1));
document.getElementById('btnGantiSiswa').addEventListener('click', () => showStep(step2));

// Kalau sebelumnya sudah pernah pilih dalam sesi browser yang sama, langsung ke step 3
const savedNama = sessionStorage.getItem('portalNama');
const savedKelasId = sessionStorage.getItem('portalKelasId');
const savedKelasNama = sessionStorage.getItem('portalKelasNama');
if (savedNama && savedKelasNama) {
  document.getElementById('namaTerpilih').textContent = savedNama;
  document.getElementById('kelasTerpilih2').textContent = savedKelasNama;
  loadPenilaianDesc(savedKelasId);
  showStep(step3);
} else {
  loadClasses();
}
