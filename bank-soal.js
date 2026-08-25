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
let classesCache = [];

const session = await requireAuth('login.html');
if (session) {
  teacher = await getCurrentTeacher();
  if (teacher) {
    await loadClassDropdown();
    await loadSets();
  }
}

async function loadClassDropdown() {
  const { data } = await supabase.from('classes').select('id, nama_kelas, tingkat').eq('owner_id', teacher.id).order('nama_kelas');
  classesCache = data || [];
  qs('#sKelas').innerHTML = classesCache.map((c) => `<option value="${c.id}">${c.nama_kelas}</option>`).join('');
}

async function loadSets() {
  const { data, error } = await supabase
    .from('practice_sets')
    .select('id, judul, mapel, gambar_url, link_gamifikasi, classes(nama_kelas, tingkat)')
    .eq('owner_id', teacher.id)
    .order('created_at', { ascending: false });

  if (error) return console.error(error.message);

  const el = document.getElementById('setList');
  if (!data || data.length === 0) {
    el.innerHTML = '<p class="text-sm text-muted">Belum ada set soal.</p>';
    return;
  }

  // Kelompokkan per Mapel + Tingkat, biar terorganisir
  const groups = {};
  data.forEach((s) => {
    const key = `${s.mapel} — Kelas ${s.classes?.tingkat || '-'}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(s);
  });

  el.innerHTML = Object.entries(groups)
    .map(
      ([groupLabel, sets]) => `
    <div style="margin-bottom:var(--space-4);">
      <strong class="text-sm">${groupLabel}</strong>
      <div class="stack gap-3" style="margin-top:var(--space-2);">
        ${sets
          .map(
            (s) => `
        <div class="row gap-3" style="justify-content:space-between;">
          <div class="row gap-2">
            ${s.gambar_url ? `<img src="${s.gambar_url}" alt="LKM" style="width:36px; height:36px; object-fit:cover; border-radius:var(--radius-sm);">` : ''}
            <span>${s.judul} · Kelas ${s.classes?.nama_kelas || '-'}</span>
            ${s.link_gamifikasi ? '<span class="badge badge-info">🎮 Gamifikasi</span>' : ''}
          </div>
          <div class="row gap-2">
            <button class="btn btn-secondary btn-open-set" data-id="${s.id}" data-judul="${s.judul}">Kelola Soal</button>
            <button class="btn btn-ghost btn-delete-set" data-id="${s.id}">Hapus</button>
          </div>
        </div>`
          )
          .join('')}
      </div>
    </div>`
    )
    .join('');

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
  const submitBtn = qs('#sSubmitBtn');
  const statusEl = qs('#sUploadStatus');
  const file = qs('#sGambar').files[0];

  if (file && file.size > 5 * 1024 * 1024) {
    return alert('Ukuran foto maksimal 5MB. Pilih foto lain atau kompres dulu.');
  }

  submitBtn.disabled = true;
  let gambarUrl = null;

  if (file) {
    statusEl.textContent = 'Mengupload foto...';
    const ext = file.name.split('.').pop();
    const path = `${teacher.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error: uploadError } = await supabase.storage.from('bank-soal').upload(path, file);
    if (uploadError) {
      statusEl.textContent = '';
      submitBtn.disabled = false;
      return alert('Gagal upload foto: ' + uploadError.message);
    }
    gambarUrl = supabase.storage.from('bank-soal').getPublicUrl(path).data.publicUrl;
  }

  statusEl.textContent = 'Menyimpan...';
  const { error } = await supabase.from('practice_sets').insert({
    owner_id: teacher.id,
    class_id: qs('#sKelas').value,
    mapel: qs('#sMapel').value,
    judul: qs('#sJudul').value,
    gambar_url: gambarUrl,
    link_gamifikasi: qs('#sGamifikasi').value || null,
  });

  submitBtn.disabled = false;
  statusEl.textContent = '';

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

qsa('input[name="qTipe"]').forEach((radio) =>
  radio.addEventListener('change', (e) => {
    const isEsai = e.target.value === 'esai';
    qs('#qOpsiWrap').style.display = isEsai ? 'none' : '';
    qsa('#qOpsiWrap input[type="text"]').forEach((inp) => (inp.required = !isEsai && inp.id !== 'qOpsi2' && inp.id !== 'qOpsi3'));
  })
);

async function loadQuestions() {
  const { data, error } = await supabase
    .from('practice_questions')
    .select('id, nomor, soal, gambar_url, tipe_soal, opsi, kunci_jawaban')
    .eq('practice_set_id', currentSetId)
    .order('nomor');

  if (error) return console.error(error.message);

  const el = document.getElementById('questionList');
  el.innerHTML = (data || []).length
    ? data
        .map((q) => {
          let bodyHtml;
          if (q.tipe_soal === 'esai') {
            bodyHtml = `<span class="text-xs text-muted">📝 Esai — dijawab bebas, tidak dinilai otomatis</span>`;
          } else if (Array.isArray(q.opsi) && q.opsi.length) {
            bodyHtml = `<div class="row gap-3" style="flex-wrap:wrap; margin-top:var(--space-1);">${q.opsi
              .map(
                (o, i) =>
                  `<span class="text-xs text-muted" style="${i === q.kunci_jawaban ? 'font-weight:700; color:var(--color-accent-blue);' : ''}">${i === q.kunci_jawaban ? '✓ ' : ''}${o}</span>`
              )
              .join('')}</div>`;
          } else {
            bodyHtml = `<span class="text-xs text-muted">(belum ada opsi jawaban — soal lama sebelum fitur kunci jawaban ditambahkan)</span>`;
          }

          const gambarHtml = q.gambar_url
            ? `<img src="${q.gambar_url}" alt="Gambar soal" style="width:56px; height:56px; object-fit:cover; border-radius:var(--radius-sm); flex-shrink:0;">`
            : '';

          return `
      <div class="row gap-3" style="padding-block:var(--space-2); border-bottom:1px solid var(--color-border, #eee); align-items:flex-start;">
        ${gambarHtml}
        <div class="stack gap-1" style="flex:1;">
          <div class="row gap-3" style="justify-content:space-between;">
            <span class="text-sm">${q.nomor}. ${q.soal}</span>
            <button class="btn btn-ghost btn-delete-question" data-id="${q.id}">Hapus</button>
          </div>
          ${bodyHtml}
        </div>
      </div>`;
        })
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
  const errEl = qs('#qFormError');
  const statusEl = qs('#qUploadStatus');
  errEl.style.display = 'none';

  const tipeSoal = document.querySelector('input[name="qTipe"]:checked').value;
  let opsi = null;
  let kunciJawaban = null;

  if (tipeSoal === 'pg') {
    const opsiRaw = [qs('#qOpsi0').value, qs('#qOpsi1').value, qs('#qOpsi2').value, qs('#qOpsi3').value];

    const kunciRadio = document.querySelector('input[name="qKunci"]:checked');
    if (!kunciRadio) {
      errEl.textContent = 'Pilih dulu opsi mana yang jawaban benar (klik radio di sebelahnya).';
      errEl.style.display = 'inline';
      return;
    }
    const kunciIndexAsli = parseInt(kunciRadio.value, 10);
    const kunciTeks = opsiRaw[kunciIndexAsli]?.trim();
    if (!kunciTeks) {
      errEl.textContent = 'Opsi yang ditandai sebagai jawaban benar tidak boleh kosong.';
      errEl.style.display = 'inline';
      return;
    }

    // Buang opsi kosong (opsi C/D opsional), lalu cari ulang index kunci
    // setelah opsi kosong dibuang, supaya index-nya tetap cocok dengan array
    // final yang disimpan.
    opsi = opsiRaw.map((v) => v.trim()).filter((v) => v.length > 0);
    kunciJawaban = opsi.indexOf(kunciTeks);

    if (opsi.length < 2) {
      errEl.textContent = 'Isi minimal 2 opsi jawaban.';
      errEl.style.display = 'inline';
      return;
    }
  }
  // tipeSoal === 'esai' -> opsi & kunciJawaban tetap null, tidak perlu divalidasi

  const file = qs('#qGambar').files[0];
  if (file && file.size > 5 * 1024 * 1024) {
    errEl.textContent = 'Ukuran gambar maksimal 5MB. Pilih gambar lain atau kompres dulu.';
    errEl.style.display = 'inline';
    return;
  }

  let gambarUrl = null;
  if (file) {
    statusEl.textContent = 'Mengupload gambar...';
    const ext = file.name.split('.').pop();
    const path = `${teacher.id}/soal/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error: uploadError } = await supabase.storage.from('bank-soal').upload(path, file);
    if (uploadError) {
      statusEl.textContent = '';
      errEl.textContent = 'Gagal upload gambar: ' + uploadError.message;
      errEl.style.display = 'inline';
      return;
    }
    gambarUrl = supabase.storage.from('bank-soal').getPublicUrl(path).data.publicUrl;
  }

  const { data: existing } = await supabase
    .from('practice_questions')
    .select('nomor')
    .eq('practice_set_id', currentSetId)
    .order('nomor', { ascending: false })
    .limit(1);

  const nextNomor = (existing?.[0]?.nomor || 0) + 1;

  statusEl.textContent = 'Menyimpan...';
  const { error } = await supabase.from('practice_questions').insert({
    practice_set_id: currentSetId,
    nomor: nextNomor,
    soal: qs('#qSoal').value,
    gambar_url: gambarUrl,
    tipe_soal: tipeSoal,
    opsi,
    kunci_jawaban: kunciJawaban,
  });
  statusEl.textContent = '';
  if (error) return alert('Gagal menyimpan: ' + error.message);
  e.target.reset();
  qs('#qOpsiWrap').style.display = '';
  await loadQuestions();
});
