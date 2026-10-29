# Bagian README yang perlu ditambahkan (v2.4 dan v2.5)

> Tempel bagian ini ke README.md yang sudah ada. README lama tidak ikut terbaca saat pembaruan ini dibuat,
> jadi file ini sengaja dipisah supaya isi README-mu tidak tertimpa.

## Yang baru

### v2.5 — Tarik untuk refresh (Gacoan)
- Header **tetap diam** saat layar ditarik, di HP maupun laptop/PC.
- Di bawah header muncul **ikon muat pink**. Tulisan **TITIP GACOAN di header** hilang berurutan (huruf GACOAN, latar pink, huruf TITIP) lalu terisi kembali dengan urutan sama mengikuti tarikan. Lepas setelah penuh = halaman dimuat ulang; saat memuat, animasi hilang-terisi berulang.
- HP/tablet: tarik dengan jari dari posisi paling atas. Laptop/PC: gulir ke atas (roda mouse/trackpad) saat sudah di paling atas.
- Layar masuk/daftar memakai indikator yang sama (pita atas tetap diam).
- Berkas: `js/services/pull-refresh.js`, `js/components/gacoan-loader.js`, `css/components/ptr.css`.

### v2.4 — Status pendaftaran: Sedang diperiksa
- Halaman status pendaftar punya progress 3 langkah: **Menunggu → Sedang diperiksa → Verified** (atau Ditolak).
- Panel **Persetujuan** (Developer / Co Jastip): ringkasan jumlah per status, tombol **Mulai periksa**, lalu **Setujui** atau **Tolak**. Daftar menyegarkan diri otomatis.
- Layar kode verifikasi 6 kotak (paste 6 digit, pindah otomatis, timer 05:00, kirim ulang). **Nonaktif secara bawaan** sampai Edge Function email terpasang.
- Berkas baru: `js/components/otp-boxes.js`, `js/services/otp-clock.js`.

## Mengaktifkan kode verifikasi email
1. Pasang Edge Function `kode-pendaftaran` (langkahnya ada di panduan terpisah).
2. Di `js/config.js` ubah `OTP_PENDAFTARAN: false` menjadi `true`.
3. Selama masih `false`, layar Verified tetap memakai tombol "Kembali ke masuk" seperti sebelumnya.

## Urutan migrasi database (Supabase SQL Editor)
Jalankan berurutan, yang sudah pernah dijalankan dilewati:
1. `supabase/migrasi-2026-10-27-persetujuan.sql`
2. `supabase/migrasi-2026-10-29-status-diperiksa.sql`
3. `supabase/migrasi-2026-10-29-hitung-persetujuan.sql`

Tanpa langkah 2, tombol "Mulai periksa" akan gagal. Tanpa langkah 3, kartu ringkasan "Disetujui" disembunyikan (yang lain tetap jalan).
