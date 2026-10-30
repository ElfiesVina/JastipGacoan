# Titip Gacoan

Aplikasi titip pesanan Gacoan. Statis (HTML + CSS + JS modul, tanpa build), data di Supabase, deploy di Vercel. APK hanya cangkang WebView.

## Struktur

```
index.html            kerangka halaman + daftar <link> CSS
css/                  base, layout, components, responsive
js/
  main.js             titik masuk
  config.js           URL Supabase, anon key, daftar menu
  core/               state, router, ui, format, storage, i18n
  api/                satu-satunya tempat bicara ke Supabase
  services/           hitung rekap, gambar, presence, changelog
  components/         pembuat HTML
  views/              halaman penitip & admin
  data/               changelog, i18n, opsi profil
supabase/
  schema.sql          SATU file skema final (jalankan sekali di SQL Editor)
android/              cangkang WebView (MainActivity.kt saja)
docs/                 arsitektur, audit, alur pendaftaran
.github/workflows/    build APK otomatis
```

## Database (Supabase)

1. Buka Supabase → SQL Editor → New query.
2. Tempel **seluruh** isi `supabase/schema.sql`.
3. Run sekali.

File ini sudah menggabungkan semua migrasi sampai 29 Okt 2026. Tidak perlu file migrasi lain.

**Perhatian:** bagian 0 (RESET) sudah **dinonaktifkan** (dibungkus komentar), jadi aman dijalankan di database kosong. Hanya buka komentarnya jika ingin mengulang dari nol: itu menghapus data `sesi`, `pesanan`, `profiles`, dan pendaftaran (akun di `auth.users` tidak dihapus).

Email developer di-hardcode di `is_developer()` dan seed `allowed_jastip`. Ganti keduanya jika email berubah.

## Menjalankan web

Modul ES butuh server HTTP (tidak jalan lewat `file://`).

- Lokal: `npx serve .` atau Live Server
- Produksi: deploy ke Vercel

## Aplikasi Android (APK)

Folder `android/` hanyalah cangkang WebView. Tampilan dan fitur SELALU sama dengan web.

- Ubah web di Vercel → langsung terlihat di APK (tanpa rebuild)
- Rebuild APK hanya bila mengubah kode di `android/`, icon, atau deep link
- Alamat web: `BASE_URL` di `MainActivity.kt`
- Build: GitHub Actions (`.github/workflows/build-apk.yml`)
- Icon sumber: `icons/app-icon-source.jpg`

## Peran

| Peran | Cara dapat | Hak |
|-------|------------|-----|
| Developer | Email = yang di `is_developer()` | Semua + angkat Co Jastip + setujui pendaftar |
| Co Jastip | Diangkat Developer (on/off) | Setujui / tolak pendaftar |
| Jastip | Disetujui Dev/Co, atau email di `allowed_jastip` | Buat & kelola sesi |
| Belum disetujui | Baru daftar | Login saja, tidak bisa buat sesi |

## Dokumen lama

`docs/AUDIT.md` dan `docs/DESAIN-ALUR-PENDAFTARAN.md` adalah catatan historis. Kondisi terkini database ada di `supabase/schema.sql`.

## Menambah catatan perubahan

Buka `js/data/changelog-data.js`, taruh entri baru di paling atas dengan `id` satu angka di atas yang terakhir.
