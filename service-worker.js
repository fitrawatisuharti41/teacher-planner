// service-worker.js
// Strategi: network-first untuk app-shell (HTML/CSS/JS) DAN data —
// selalu coba ambil versi terbaru dulu; cache cuma dipakai kalau
// benar-benar offline. Ini supaya update (CSS/JS) langsung kepakai
// tanpa perlu hard-refresh berkali-kali.

const CACHE_NAME = 'teacher-planner-shell-v5';

// File statis yang di-cache saat install (app shell) — hanya dipakai
// sebagai fallback offline, BUKAN sumber utama saat online.
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

  // Jangan sentuh request ke Supabase sama sekali (data harus selalu fresh)
  if (url.hostname.endsWith('.supabase.co')) {
    return;
  }

  // Network-first: coba ambil versi terbaru dari server dulu. Kalau berhasil,
  // simpan salinannya ke cache (buat fallback offline nanti). Kalau gagal
  // (offline/no signal), baru pakai versi cache terakhir yang ada.
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() =>
        caches.match(event.request).then((cached) => {
          if (cached) return cached;
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
        })
      )
  );
});
