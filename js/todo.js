// js/todo.js
// Terintegrasi Supabase: CRUD `tasks`.

import { supabase } from './config/supabase.js';
import { requireAuth, getCurrentTeacher, logout } from './auth.js';
import { initThemeToggle, qs, qsa } from './utils.js';

initThemeToggle('themeToggle');
document.getElementById('btnLogout')?.addEventListener('click', () => logout('login.html'));

let teacher = null;

const session = await requireAuth('login.html');
if (session) {
  teacher = await getCurrentTeacher();
  if (teacher) await loadTasks();
}

async function loadTasks() {
  const { data, error } = await supabase
    .from('tasks')
    .select('id, judul, priority, deadline, progress, selesai')
    .eq('owner_id', teacher.id)
    .order('deadline', { ascending: true, nullsFirst: false });

  if (error) {
    console.error('Gagal ambil tugas:', error.message);
    return;
  }
  renderTasks(data || []);
}

function badgeClass(priority) {
  return { tinggi: 'badge-danger', sedang: 'badge-warning', rendah: 'badge-info' }[priority] || 'badge-info';
}

function renderTasks(tasks) {
  const active = tasks.filter((t) => !t.selesai);
  const done = tasks.filter((t) => t.selesai);

  const renderItem = (t) => `
    <div class="row gap-3 todo-item ${t.selesai ? 'is-done' : ''}" style="justify-content:space-between;" data-id="${t.id}">
      <div class="row gap-3" style="flex:1;">
        <div class="checkbox-circle ${t.selesai ? 'is-checked' : ''} btn-toggle-done" data-id="${t.id}">
          <svg viewBox="0 0 24 24" fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
        </div>
        <div>
          <span class="todo-title">${t.judul}</span>
          <div class="text-sm text-muted">
            ${t.deadline ? 'Deadline: ' + t.deadline : 'Tanpa deadline'} · Progress ${t.progress || 0}%
          </div>
        </div>
      </div>
      <div class="row gap-2">
        <span class="badge ${badgeClass(t.priority)}">${t.priority}</span>
        <button class="btn btn-ghost btn-delete-task" data-id="${t.id}">Hapus</button>
      </div>
    </div>`;

  const activeEl = document.getElementById('taskListActive');
  const doneEl = document.getElementById('taskListDone');

  activeEl.innerHTML = active.length
    ? active.map(renderItem).join('')
    : '<p class="text-sm text-muted">Tidak ada tugas tertunda. 🎉</p>';

  doneEl.innerHTML = done.length
    ? done.map(renderItem).join('')
    : '<p class="text-sm text-muted">Belum ada yang selesai.</p>';

  qsa('.btn-toggle-done').forEach((el) =>
    el.addEventListener('click', async () => {
      const isChecked = el.classList.contains('is-checked');
      const { error } = await supabase
        .from('tasks')
        .update({ selesai: !isChecked, progress: !isChecked ? 100 : 0 })
        .eq('id', el.dataset.id);
      if (error) {
        alert('Gagal update: ' + error.message);
        return;
      }
      await loadTasks();
    })
  );

  qsa('.btn-delete-task').forEach((btn) =>
    btn.addEventListener('click', async () => {
      const { error } = await supabase.from('tasks').delete().eq('id', btn.dataset.id);
      if (error) {
        alert('Gagal menghapus: ' + error.message);
        return;
      }
      await loadTasks();
    })
  );
}

const formPanel = document.getElementById('taskFormPanel');
const form = document.getElementById('taskForm');

document.getElementById('btnNewTask').addEventListener('click', () => {
  form.reset();
  formPanel.style.display = 'block';
  formPanel.scrollIntoView({ behavior: 'smooth' });
});
document.getElementById('btnCancelTask').addEventListener('click', () => {
  formPanel.style.display = 'none';
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const { error } = await supabase.from('tasks').insert({
    owner_id: teacher.id,
    judul: qs('#tJudul').value,
    priority: qs('#tPriority').value,
    deadline: qs('#tDeadline').value || null,
    progress: Number(qs('#tProgress').value) || 0,
  });
  if (error) {
    alert('Gagal menyimpan: ' + error.message);
    return;
  }
  formPanel.style.display = 'none';
  await loadTasks();
});
