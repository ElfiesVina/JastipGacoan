# Titip Gacoan

Aplikasi titip pesanan Gacoan. Statis (HTML + CSS + JS modul, tanpa build), data di Supabase, deploy di Vercel.

## Struktur

```
index.html            kerangka halaman + daftar <link> CSS
css/
  base/               variables (warna, lebar), reset, typography
  layout/             header, main
  components/         card, form, button, choice, upload, list, toast, skeleton, changelog, dialog
  utilities.css       reduced-motion
  responsive.css      semua penyesuaian ukuran layar (mobile first)
js/
  main.js             titik masuk
  config.js           URL Supabase, anon key, daftar menu
  core/               state, constants, dom, format, storage, ui, router, events
  api/                SATU-SATUNYA tempat bicara ke backend (Supabase)
  services/           hitung rekap, gambar rekap, pengecil foto, changelog
  components/         pembuat HTML (header, daftar, rekap, form)
  views/              halaman penitip & admin
  data/               changelog-data.js
supabase/             schema.sql, migrasi-2026-10-15.sql, batasi-jastip.sql
docs/                 ARSITEKTUR.md, AUDIT.md
```

## Menjalankan
Modul ES butuh server HTTP (tidak jalan lewat `file://`). Di Vercel langsung jalan. Lokal: `npx serve .` atau ekstensi Live Server.

## Pasang database
1. Supabase > SQL Editor, jalankan `supabase/schema.sql`
2. Lalu `supabase/migrasi-2026-10-15.sql`

## Aplikasi Android (APK)
Folder `android/` hanyalah cangkang WebView untuk web ini (`MainActivity.kt`), jadi tampilan dan fitur SELALU sama dengan web.
Mengubah web (di Vercel) tidak perlu membangun ulang APK. APK hanya perlu dibangun ulang bila mengubah kode di `android/`
atau icon. Alamat web diatur di `BASE_URL` pada `MainActivity.kt`. Build: GitHub Actions (`.github/workflows/build-apk.yml`).
Icon: gambar sumber di `icons/app-icon-source.jpg`; ukuran Android ada di `android/app/src/main/res/mipmap-*`.

## Menambah catatan perubahan
Buka `js/data/changelog-data.js`, taruh entri baru di paling atas dengan `id` satu angka di atas yang terakhir.

## Membatasi siapa yang boleh jadi jastip
Jalankan `supabase/batasi-jastip.sql` sekali (ganti emailnya), lalu tambah jastip baru dengan `insert into allowed_jastip values('email@teman.com');`.
