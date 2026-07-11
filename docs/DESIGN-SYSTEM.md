# Design System — Teacher Planner

## Prinsip
Minimalis, modern, nyaman dipakai tiap hari di laptop & iPad. Satu elemen signature: **progress ring**, dipakai konsisten untuk semua indikator "kelengkapan/progress" (dokumen administrasi, kehadiran, tugas).

## Token
Semua token ada di `css/variables.css`. Jangan hardcode warna/spacing di file lain — selalu pakai `var(--nama-token)`.

| Kategori | Token utama |
|---|---|
| Warna | `--color-canvas`, `--color-surface`, `--color-ink`, `--color-accent-blue`, `--color-accent-green`, `--color-line` |
| Status | `--color-success/warning/danger/info` (+ versi `-soft` untuk background badge) |
| Radius | `--radius-sm` (8px), `--radius-md` (12px), `--radius-lg` (16px) |
| Shadow | `--shadow-soft`, `--shadow-soft-hover` |
| Motion | `--duration-fast` (120ms), `--duration-base` (200ms) |

## Dark mode
Aktifkan dengan `document.documentElement.setAttribute('data-theme', 'dark' | 'light')`. Kalau user belum pernah pilih, otomatis ikut `prefers-color-scheme` OS.

## Komponen dasar (`css/components.css`)
- `.btn` (`.btn-primary`, `.btn-secondary`, `.btn-ghost`)
- `.card`, `.card-stat`, `.card-interactive` (hover naik + shadow lebih tebal)
- `.badge` (`.badge-success/warning/danger/info`) — dipakai untuk status kehadiran & nilai
- `.progress-ring` — signature component, lihat fungsi `renderProgressRing()` di `docs/styleguide.html`
- `.topnav` — satu-satunya tempat efek glass dipakai

## Ikon
Sprite di `assets/icons/icons.svg`, dipakai via:
```html
<svg class="icon"><use href="assets/icons/icons.svg#icon-calendar"/></svg>
```
Semua ikon stroke-based (bukan filled), `stroke-width: 1.75`, currentColor — otomatis ikut warna teks & dark mode.

## Referensi hidup
Buka `docs/styleguide.html` di browser untuk lihat semua token & komponen dalam bentuk nyata, termasuk toggle dark/light yang beneran berfungsi.
