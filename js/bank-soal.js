// js/bank-soal.js
// Terintegrasi Supabase: `practice_sets` + `practice_questions`.

import { supabase } from './config/supabase.js';
import { requireAuth, getCurrentTeacher, logout } from './auth.js';
import { initThemeToggle, initSidebarToggle, qs, qsa } from './utils.js';

initThemeToggle('themeToggle');
initSidebarToggle();
document.getElementById('btnLogout')?.addEventListener('click', () => logout('login.html'));

let teacher = null;
let currentSetId = null;

const session = await requireAuth('login.html');
if (session) {
  teacher = await getCurrentTeacher();
  if (teacher) {
    await loadClassDropdown();
    await loadSets();
  }
}

async function loadClassDropdown() {
  const { data } = await supabase.from('classes').select('id, nama_kelas').eq('owner_id', teacher.id).order('nama_kelas');
  qs('#sKelas').innerHTML = (data || []).map((c) => `<option value="${c.id}">${c.nama_kelas}</option>`).join('');
}

async function loadSets() {
  const { data, error } = await supabase
    .from('practice_sets')
    .select('id, judul, mapel, classes(nama_kelas)')
    .eq('owner_id', teacher.id)
    .order('created_at', { ascending: false });

  if (error) return console.error(error.message);

  const el = document.getElementById('setList');
  el.innerHTML = (data || []).length
    ? data
        .map(
          (s) => `
      <div class="row gap-3" style="justify-content:space-between;">
        <span>${s.judul} — ${s.mapel} · Kelas ${s.classes?.nama_kelas || '-'}</span>
        <div class="row gap-2">
          <button class="btn btn-secondary btn-open-set" data-id="${s.id}" data-judul="${s.judul}">Kelola Soal</button>
          <button class="btn btn-ghost btn-delete-set" data-id="${s.id}">Hapus</button>
        </div>
      </div>`
        )
        .join('')
    : '<p class="text-sm text-muted">Belum ada set soal.</p>';

  qsa('.btn-open-set', el).forEach((btn) =>
    btn.addEventListener('click', () => openQuestionPanel(btn.dataset.id, btn.dataset.judul))
  );
  qsa('.btn-delete-set', el).forEach((btn) =>
    btn.addEventListener('click', async () => {
      if (!confirm('Hapus set soal ini beserta semua soalnya?')) return;
      const { error } = await supabase.from('practice_sets').delete().eq('id', btn.dataset.id);
      if (error) return alert('Gagal menghapus: ' + error.message);
      await loadSets();
    })
  );
}

document.getElementById('btnNewSet').addEventListener('click', () => {
  document.getElementById('setFormPanel').style.display = 'block';
});
document.getElementById('btnCancelSet').addEventListener('click', () => {
  document.getElementById('setFormPanel').style.display = 'none';
});

document.getElementById('setForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const { error } = await supabase.from('practice_sets').insert({
    owner_id: teacher.id,
    class_id: qs('#sKelas').value,
    mapel: qs('#sMapel').value,
    judul: qs('#sJudul').value,
  });
  if (error) return alert('Gagal menyimpan: ' + error.message);
  e.target.reset();
  document.getElementById('setFormPanel').style.display = 'none';
  await loadSets();
});

// ------- Kelola soal dalam 1 set -------

async function openQuestionPanel(setId, judul) {
  currentSetId = setId;
  document.getElementById('questionPanelTitle').textContent = `Soal — ${judul}`;
  document.getElementById('questionPanel').style.display = 'block';
  document.getElementById('questionPanel').scrollIntoView({ behavior: 'smooth' });
  await loadQuestions();
}

document.getElementById('btnCloseQuestionPanel').addEventListener('click', () => {
  document.getElementById('questionPanel').style.display = 'none';
  currentSetId = null;
});

async function loadQuestions() {
  const { data, error } = await supabase
    .from('practice_questions')
    .select('id, nomor, soal')
    .eq('practice_set_id', currentSetId)
    .order('nomor');

  if (error) return console.error(error.message);

  const el = document.getElementById('questionList');
  el.innerHTML = (data || []).length
    ? data
        .map(
          (q) => `
      <div class="row gap-3" style="justify-content:space-between;">
        <span class="text-sm">${q.nomor}. ${q.soal}</span>
        <button class="btn btn-ghost btn-delete-question" data-id="${q.id}">Hapus</button>
      </div>`
        )
        .join('')
    : '<p class="text-sm text-muted">Belum ada soal di set ini.</p>';

  qsa('.btn-delete-question', el).forEach((btn) =>
    btn.addEventListener('click', async () => {
      const { error } = await supabase.from('practice_questions').delete().eq('id', btn.dataset.id);
      if (error) return alert('Gagal menghapus: ' + error.message);
      await loadQuestions();
    })
  );
}

document.getElementById('questionForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const { data: existing } = await supabase
    .from('practice_questions')
    .select('nomor')
    .eq('practice_set_id', currentSetId)
    .order('nomor', { ascending: false })
    .limit(1);

  const nextNomor = (existing?.[0]?.nomor || 0) + 1;

  const { error } = await supabase.from('practice_questions').insert({
    practice_set_id: currentSetId,
    nomor: nextNomor,
    soal: qs('#qSoal').value,
  });
  if (error) return alert('Gagal menyimpan: ' + error.message);
  e.target.reset();
  await loadQuestions();
});
