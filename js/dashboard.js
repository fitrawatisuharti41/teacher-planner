// js/dashboard.js
// Phase 6: terintegrasi penuh ke Supabase. Semua data dummy sudah diganti.

import { supabase } from './config/supabase.js';
import { requireAuth, getCurrentTeacher, logout } from './auth.js';
import { renderProgressRing, initThemeToggle, formatTanggalIndo, getGreeting, initSidebarToggle} from './utils.js';

initThemeToggle('themeToggle');
initSidebarToggle();

const session = await requireAuth('login.html');
if (session) {
  const teacher = await getCurrentTeacher();
  if (teacher) {
    await initDashboard(teacher);
  }
}

document.getElementById('btnLogout')?.addEventListener('click', () => logout('login.html'));

async function initDashboard(teacher) {
  document.getElementById('greeting').textContent =
    `${getGreeting()}, ${teacher.nama_panggilan || teacher.nama_lengkap} 👋`;
  document.getElementById('todayDate').textContent = formatTanggalIndo();

  const today = new Date().toISOString().slice(0, 10);

  // --- Jadwal hari ini (calendar_events) ---
  const { data: events, error: eventsError } = await supabase
    .from('calendar_events')
    .select('judul, tanggal_mulai, warna_label')
    .eq('owner_id', teacher.id)
    .gte('tanggal_mulai', `${today}T00:00:00`)
    .lte('tanggal_mulai', `${today}T23:59:59`)
    .order('tanggal_mulai', { ascending: true });

  if (eventsError) console.error('Gagal ambil jadwal:', eventsError.message);
  renderSchedule(events || []);

  // --- Tugas mendekati deadline (tasks) ---
  const { data: tasks, error: tasksError } = await supabase
    .from('tasks')
    .select('judul, priority, deadline')
    .eq('owner_id', teacher.id)
    .eq('selesai', false)
    .order('deadline', { ascending: true })
    .limit(5);

  if (tasksError) console.error('Gagal ambil tugas:', tasksError.message);
  renderTasks(tasks || []);

  // --- Lesson plan terbaru ---
  const { data: plans, error: plansError } = await supabase
    .from('lesson_plans')
    .select('topik, mapel, class_id, status, classes(nama_kelas)')
    .eq('owner_id', teacher.id)
    .order('updated_at', { ascending: false })
    .limit(5);

  if (plansError) console.error('Gagal ambil lesson plan:', plansError.message);
  renderRecentPlans(plans || []);

  // --- Stat ringkas: jumlah jadwal hari ini, tugas pending, plan draft ---
  document.querySelector('#statJadwal .stat-value').textContent = (events || []).length;
  document.querySelector('#statTugas .stat-value').textContent = (tasks || []).length;
  const draftCount = (plans || []).filter((p) => p.status === 'draft').length;
  document.querySelector('#statDraft .stat-value').textContent = draftCount;

  // --- Kelengkapan administrasi (view administrasi_summary) ---
  const { data: summary, error: summaryError } = await supabase
    .from('administrasi_summary')
    .select('kelas_terisi, total_kelas')
    .eq('owner_id', teacher.id);

  if (summaryError) console.error('Gagal ambil ringkasan administrasi:', summaryError.message);

  let percent = 0;
  if (summary && summary.length > 0) {
    const totalTerisi = summary.reduce((sum, s) => sum + s.kelas_terisi, 0);
    const totalMaks = summary.reduce((sum, s) => sum + s.total_kelas, 0) * 7; // 7 kategori dokumen
    percent = totalMaks > 0 ? Math.round((totalTerisi / totalMaks) * 100) : 0;
  }
  renderProgressRing(document.getElementById('ringKelengkapan'), percent);
}

function renderSchedule(events) {
  const el = document.getElementById('scheduleList');
  if (events.length === 0) {
    el.innerHTML = '<p class="text-sm text-muted">Tidak ada jadwal hari ini.</p>';
    return;
  }
  el.innerHTML = events
    .map((e) => {
      const jam = new Date(e.tanggal_mulai).toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
      });
      return `
      <div class="row gap-3" style="justify-content:space-between;">
        <div class="row gap-3">
          <svg class="icon" style="color:var(--color-accent-blue)"><use href="assets/icons/icons.svg#icon-clock"/></svg>
          <strong>${e.judul}</strong>
        </div>
        <span class="badge badge-info">${jam}</span>
      </div>`;
    })
    .join('');
}

function renderTasks(tasks) {
  const el = document.getElementById('taskList');
  if (tasks.length === 0) {
    el.innerHTML = '<p class="text-sm text-muted">Tidak ada tugas tertunda. 🎉</p>';
    return;
  }
  const badgeClass = { tinggi: 'badge-danger', sedang: 'badge-warning', rendah: 'badge-info' };
  el.innerHTML = tasks
    .map(
      (t) => `
    <div class="row gap-2" style="justify-content:space-between;">
      <span class="text-sm">${t.judul}</span>
      <span class="badge ${badgeClass[t.priority] || 'badge-info'}">${t.priority}</span>
    </div>`
    )
    .join('');
}

function renderRecentPlans(plans) {
  const el = document.getElementById('recentLessonPlans');
  if (plans.length === 0) {
    el.innerHTML = '<p class="text-sm text-muted">Belum ada RPP. <a href="lesson-planner.html">Buat sekarang</a>.</p>';
    return;
  }
  el.innerHTML = plans
    .map(
      (p) => `
    <div class="row gap-3" style="justify-content:space-between;">
      <span>${p.topik} — ${p.mapel} Kelas ${p.classes?.nama_kelas || '-'}</span>
      <span class="badge ${p.status === 'final' ? 'badge-success' : 'badge-warning'}">
        ${p.status === 'final' ? 'Final' : 'Draft'}
      </span>
    </div>`
    )
    .join('');
}
