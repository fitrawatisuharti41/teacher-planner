// js/utils.js
// Fungsi bantu bersama yang dipakai di banyak halaman.
// Jangan taruh logic Supabase di sini — itu tempatnya di masing-masing
// file halaman (dashboard.js, lesson-planner.js, dst) mulai Phase 6.

export function qs(selector, scope = document) {
  return scope.querySelector(selector);
}

export function qsa(selector, scope = document) {
  return Array.from(scope.querySelectorAll(selector));
}

/**
 * Render progress ring SVG ke dalam elemen `el`.
 * Dipakai untuk: kelengkapan administrasi, rekap kehadiran, progress tugas.
 */
export function renderProgressRing(el, percent, size = 96, color = null) {
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, percent));
  const offset = c - (clamped / 100) * c;

  el.classList.add('progress-ring');
  el.innerHTML = `
    <svg width="${size}" height="${size}">
      <circle class="ring-track" cx="${size / 2}" cy="${size / 2}" r="${r}" stroke-width="${stroke}"/>
      <circle class="ring-value ${clamped >= 100 ? 'is-complete' : ''}"
        cx="${size / 2}" cy="${size / 2}" r="${r}"
        stroke-width="${stroke}"
        stroke-dasharray="${c}"
        stroke-dashoffset="${offset}"
        ${color ? `style="stroke:${color}"` : ''}/>
    </svg>
    <span class="ring-label">${clamped}%</span>`;
}

/**
 * Pasang toggle dark/light mode ke tombol dengan id tertentu.
 * Preferensi disimpan supaya konsisten antar halaman (via Supabase settings
 * di Phase 6-7; untuk prototype sekarang belum persist).
 */
export function initThemeToggle(buttonId = 'themeToggle') {
  const btn = document.getElementById(buttonId);
  if (!btn) return;

  btn.addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
  });
}

/** Format Date -> "Rabu, 8 Juli 2026" */
export function formatTanggalIndo(date = new Date()) {
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

/**
 * Pasang toggle collapse/expand ke sidebar. Preferensi disimpan di
 * localStorage (per-device, wajar karena ini soal tampilan bukan data).
 */
export function initSidebarToggle() {
  const sidebar = document.querySelector('.sidebar');
  const btn = document.getElementById('sidebarToggle');
  if (!sidebar || !btn) return;

  if (localStorage.getItem('sidebarCollapsed') === 'true') {
    sidebar.classList.add('is-collapsed');
  }

  btn.addEventListener('click', () => {
    sidebar.classList.toggle('is-collapsed');
    localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('is-collapsed'));
  });
}

/** Greeting sesuai jam saat ini */
export function getGreeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 11) return 'Selamat pagi';
  if (hour < 15) return 'Selamat siang';
  if (hour < 18) return 'Selamat sore';
  return 'Selamat malam';
}
