// js/calendar.js
// Terintegrasi Supabase: CRUD `calendar_events`, tampilan grid bulan (vanilla JS, tanpa library).

import { supabase } from './config/supabase.js';
import { requireAuth, getCurrentTeacher, logout } from './auth.js';
import { initThemeToggle, initSidebarToggle, qs } from './utils.js';

initThemeToggle('themeToggle');
initSidebarToggle();
document.getElementById('btnLogout')?.addEventListener('click', () => logout('login.html'));

const colorVar = {
  blue: 'var(--color-accent-blue)',
  green: 'var(--color-accent-green)',
  warning: 'var(--color-warning)',
  danger: 'var(--color-danger)',
};

let teacher = null;
let currentMonth = new Date();
currentMonth.setDate(1);
let eventsThisMonth = [];

const session = await requireAuth('login.html');
if (session) {
  teacher = await getCurrentTeacher();
  if (teacher) {
    renderDayNames();
    await loadAndRenderMonth();
  }
}

function renderDayNames() {
  const names = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  qs('#dayNames').innerHTML = names.map((n) => `<div class="day-name">${n}</div>`).join('');
}

async function loadAndRenderMonth() {
  qs('#monthLabel').textContent = currentMonth.toLocaleDateString('id-ID', {
    month: 'long',
    year: 'numeric',
  });

  const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0, 23, 59, 59);

  const { data, error } = await supabase
    .from('calendar_events')
    .select('id, judul, tanggal_mulai, warna_label, reminder')
    .eq('owner_id', teacher.id)
    .gte('tanggal_mulai', monthStart.toISOString())
    .lte('tanggal_mulai', monthEnd.toISOString());

  if (error) {
    console.error('Gagal ambil event:', error.message);
    eventsThisMonth = [];
  } else {
    eventsThisMonth = data || [];
  }

  renderGrid(monthStart);
}

function renderGrid(monthStart) {
  const grid = qs('#monthGrid');
  const firstDayOfWeek = monthStart.getDay(); // 0 = Minggu
  const daysInMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate();
  const today = new Date();

  let cellsHtml = '';

  // Padding hari dari bulan sebelumnya
  for (let i = 0; i < firstDayOfWeek; i++) {
    cellsHtml += `<div class="day-cell is-outside"></div>`;
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateObj = new Date(monthStart.getFullYear(), monthStart.getMonth(), day);
    const dateStr = dateObj.toISOString().slice(0, 10);
    const isToday =
      dateObj.getFullYear() === today.getFullYear() &&
      dateObj.getMonth() === today.getMonth() &&
      dateObj.getDate() === today.getDate();

    const dayEvents = eventsThisMonth.filter((e) => e.tanggal_mulai.slice(0, 10) === dateStr);
    const dots = dayEvents
      .slice(0, 4)
      .map((e) => `<span class="event-dot" style="background:${colorVar[e.warna_label] || colorVar.blue}"></span>`)
      .join('');

    const titles = dayEvents
      .slice(0, 2)
      .map((e) => `<div class="text-xs" style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${e.judul}</div>`)
      .join('');

    cellsHtml += `
      <div class="day-cell ${isToday ? 'is-today' : ''}" data-date="${dateStr}">
        <div class="day-number">${day}</div>
        <div>${dots}</div>
        ${titles}
      </div>`;
  }

  grid.innerHTML = cellsHtml;

  grid.querySelectorAll('.day-cell[data-date]').forEach((cell) => {
    cell.addEventListener('click', () => openFormForDate(cell.dataset.date));
  });
}

document.getElementById('btnPrevMonth').addEventListener('click', async () => {
  currentMonth.setMonth(currentMonth.getMonth() - 1);
  await loadAndRenderMonth();
});
document.getElementById('btnNextMonth').addEventListener('click', async () => {
  currentMonth.setMonth(currentMonth.getMonth() + 1);
  await loadAndRenderMonth();
});

const formPanel = document.getElementById('eventFormPanel');
const form = document.getElementById('eventForm');
const btnDelete = document.getElementById('btnDeleteEvent');

function openFormForDate(dateStr) {
  form.reset();
  delete form.dataset.editId;
  btnDelete.style.display = 'none';
  document.getElementById('eventFormTitle').textContent = 'Event Baru';
  qs('#eTanggal').value = dateStr;
  formPanel.style.display = 'block';
  formPanel.scrollIntoView({ behavior: 'smooth' });
}

document.getElementById('btnNewEvent').addEventListener('click', () => {
  openFormForDate(new Date().toISOString().slice(0, 10));
});
document.getElementById('btnCancelEvent').addEventListener('click', () => {
  formPanel.style.display = 'none';
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const tanggalMulai = `${qs('#eTanggal').value}T${qs('#eJam').value || '00:00'}:00`;

  const payload = {
    owner_id: teacher.id,
    judul: qs('#eJudul').value,
    tanggal_mulai: tanggalMulai,
    warna_label: qs('#eWarna').value,
    reminder: qs('#eReminder').checked,
  };

  let error;
  if (form.dataset.editId) {
    ({ error } = await supabase.from('calendar_events').update(payload).eq('id', form.dataset.editId));
  } else {
    ({ error } = await supabase.from('calendar_events').insert(payload));
  }

  if (error) {
    alert('Gagal menyimpan: ' + error.message);
    return;
  }
  formPanel.style.display = 'none';
  await loadAndRenderMonth();
});

btnDelete.addEventListener('click', async () => {
  if (!form.dataset.editId) return;
  if (!confirm('Hapus event ini?')) return;
  const { error } = await supabase.from('calendar_events').delete().eq('id', form.dataset.editId);
  if (error) {
    alert('Gagal menghapus: ' + error.message);
    return;
  }
  formPanel.style.display = 'none';
  await loadAndRenderMonth();
});

// ------- Jadwal Mengajar Tetap (bisa diedit sendiri kapan aja berubah) -------

const HARI_LABEL = { senin: 'Senin', selasa: 'Selasa', rabu: 'Rabu', kamis: 'Kamis', jumat: 'Jumat' };
const jadwalFormPanel = qs('#jadwalForm');
const jadwalForm = document.getElementById('jadwalForm');

if (teacher) {
  await loadKelasDropdownJadwal();
  await loadJadwalMingguan();
}

async function loadKelasDropdownJadwal() {
  const { data } = await supabase.from('classes').select('id, nama_kelas').eq('owner_id', teacher.id).order('nama_kelas');
  qs('#jwKelas').innerHTML = (data || []).map((c) => `<option value="${c.id}">${c.nama_kelas}</option>`).join('');
}

async function loadJadwalMingguan() {
  const { data, error } = await supabase
    .from('weekly_schedule')
    .select('id, class_id, hari, jam_mulai, jam_selesai, mapel, classes(nama_kelas)')
    .eq('owner_id', teacher.id)
    .order('jam_mulai');

  if (error) {
    console.error('Gagal ambil jadwal mengajar:', error.message);
    return;
  }

  const el = document.getElementById('jadwalMingguanList');
  if (!data || data.length === 0) {
    el.innerHTML = '<p class="text-sm text-muted">Belum ada jadwal mengajar tetap.</p>';
    return;
  }

  const urutanHari = ['senin', 'selasa', 'rabu', 'kamis', 'jumat'];
  el.innerHTML = urutanHari
    .map((hari) => {
      const items = data.filter((d) => d.hari === hari);
      if (items.length === 0) return '';
      return `
      <div>
        <strong class="text-sm">${HARI_LABEL[hari]}</strong>
        <div class="stack gap-2" style="margin-top:var(--space-2);">
          ${items
            .map(
              (j) => `
            <div class="row gap-3" style="justify-content:space-between;">
              <span class="text-sm">${j.jam_mulai.slice(0, 5)}–${j.jam_selesai.slice(0, 5)} · ${j.mapel} — Kelas ${j.classes?.nama_kelas || '-'}</span>
              <div class="row gap-2">
                <button class="btn btn-ghost btn-edit-jadwal" data-id="${j.id}">Edit</button>
                <button class="btn btn-ghost btn-delete-jadwal" data-id="${j.id}">Hapus</button>
              </div>
            </div>`
            )
            .join('')}
        </div>
      </div>`;
    })
    .join('');

  qsa('.btn-edit-jadwal', el).forEach((btn) =>
    btn.addEventListener('click', () => openJadwalForm(btn.dataset.id, data))
  );
  qsa('.btn-delete-jadwal', el).forEach((btn) =>
    btn.addEventListener('click', async () => {
      if (!confirm('Hapus jadwal ini?')) return;
      const { error } = await supabase.from('weekly_schedule').delete().eq('id', btn.dataset.id);
      if (error) return alert('Gagal menghapus: ' + error.message);
      await loadJadwalMingguan();
    })
  );
}

function openJadwalForm(id, items) {
  jadwalFormPanel.style.display = 'flex';
  if (id) {
    const j = items.find((x) => x.id === id);
    qs('#jwHari').value = j.hari;
    qs('#jwJamMulai').value = j.jam_mulai.slice(0, 5);
    qs('#jwJamSelesai').value = j.jam_selesai.slice(0, 5);
    qs('#jwMapel').value = j.mapel;
    qs('#jwKelas').value = j.class_id;
    jadwalForm.dataset.editId = id;
  } else {
    jadwalForm.reset();
    delete jadwalForm.dataset.editId;
  }
  jadwalFormPanel.scrollIntoView({ behavior: 'smooth' });
}

document.getElementById('btnNewJadwal').addEventListener('click', () => openJadwalForm(null, []));
document.getElementById('btnCancelJadwal').addEventListener('click', () => {
  jadwalFormPanel.style.display = 'none';
});

jadwalForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = {
    owner_id: teacher.id,
    class_id: qs('#jwKelas').value,
    hari: qs('#jwHari').value,
    jam_mulai: qs('#jwJamMulai').value,
    jam_selesai: qs('#jwJamSelesai').value,
    mapel: qs('#jwMapel').value,
  };

  let error;
  if (jadwalForm.dataset.editId) {
    ({ error } = await supabase.from('weekly_schedule').update(payload).eq('id', jadwalForm.dataset.editId));
  } else {
    ({ error } = await supabase.from('weekly_schedule').insert(payload));
  }

  if (error) return alert('Gagal menyimpan: ' + error.message);
  jadwalFormPanel.style.display = 'none';
  await loadJadwalMingguan();
});
