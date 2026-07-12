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
