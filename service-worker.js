// service-worker.js
// Strategi: cache app-shell (HTML/CSS/JS statis) saat install,
// network-first untuk data (biar selalu ambil data terbaru dari Supabase).

// PENTING: setiap kali css/js di APP_SHELL diubah, naikkan angka versi ini
// (v2, v3, dst). Kalau nama file tetap sama tapi versi tidak dinaikkan,
// browser akan terus pakai file lama dari cache walau sudah deploy ulang.
const CACHE_NAME = 'teacher-planner-shell-v4';

// File statis yang di-cache saat install (app shell)
const APP_SHELL = [
  '/index.html',
  '/login.html',
  '/dashboard.html',
  '/calendar.html',
  '/lesson-planner.html',
  '/todo.html',
  '/classes.html',
  '/students.html',
  '/assessment.html',
  '/resources.html',
  '/reflection.html',
  '/settings.html',
  '/portal-siswa/index.html',
  '/portal-siswa/kehadiran.html',
  '/portal-siswa/nilai.html',
  '/portal-siswa/remedial.html',
  '/css/variables.css',
  '/css/base.css',
  '/css/components.css',
  '/css/responsive.css',
  '/js/utils.js',
  '/manifest.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Jangan cache request ke Supabase (data harus selalu fresh)
  if (url.hostname.endsWith('.supabase.co')) {
    return; // biarkan lewat langsung ke network
  }

  // App shell: cache-first
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return (
        cached ||
        fetch(event.request).catch(() => {
          // fallback offline sederhana untuk halaman HTML
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
        })
      );
    })
  );
});
