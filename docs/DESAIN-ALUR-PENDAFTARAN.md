> **Status implementasi (v2.4):** layar Menunggu / Sedang diperiksa / Verified / Ditolak, progress 3 langkah, panel Persetujuan (Mulai periksa, ringkasan, polling), dan layar OTP 6 kotak sudah dibuat di tampilan.
> OTP dikendalikan `CFG.OTP_PENDAFTARAN` di `js/config.js` (bawaan `false`). **Belum ada:** Edge Function `kode-pendaftaran` (aksi `kirim` dan `verifikasi`) dan pengaturan Confirm email Supabase.

# Desain baru — alur pendaftaran Jastip

## Ringkasan hasil audit
- Aplikasi sudah memiliki halaman Pending, RPC daftar persetujuan, dan tab `#/approval` untuk Developer/Co Jastip.
- (Kondisi saat desain ditulis) status hanya `menunggu`, `disetujui`, `ditolak`. Status `diperiksa` dan RPC `mulai_periksa_permintaan_jastip` kini sudah ada di `supabase/schema.sql`.
- OTP yang ada di `admin-auth.js` adalah OTP **reset password**, bukan verifikasi pendaftaran.
- `signUp()` saat ini memanggil Supabase Auth langsung. Pengiriman email dan penerbitan OTP setelah persetujuan perlu diatur di backend, bukan hanya di tampilan.

## Desain layar pendaftar

### 1. Menunggu
Kartu status dengan ikon jam, badge **MENUNGGU**, progress 1/3, email pendaftar, dan teks:
“Pendaftaranmu sudah diterima. Developer atau Co Jastip akan memeriksa data terlebih dahulu.”
Tidak ada email OTP yang dikirim pada tahap ini. Status diperbarui otomatis lewat polling.

### 2. Sedang diperiksa
Badge **SEDANG DIPERIKSA** (warna amber), progress 2/3, dan teks:
“Pendaftaranmu sedang diperiksa oleh tim. Kamu tidak perlu mendaftar ulang.”
Tidak menampilkan tombol Masuk dan tidak mengirim OTP.

### 3. Disetujui — verifikasi email
Badge **VERIFIED**, progress 3/3, teks “Pendaftaran disetujui. Masukkan kode 6 digit yang dikirim ke email …”.
Enam kotak OTP terpisah, auto-focus ke kotak berikutnya, mendukung paste enam digit, tombol **Masuk**, timer kedaluwarsa **05:00**, dan tautan kirim ulang yang aktif setelah timer/limit mengizinkan.
Kode kedaluwarsa atau salah menampilkan pesan inline; jangan pernah menyimpan OTP di tabel publik.

### 4. Ditolak
Badge **DITOLAK**, keterangan singkat, dan tombol kembali ke halaman masuk.

## Panel Developer / Co Jastip
Tambahkan/pertahankan tab **Pendaftaran** di navigasi admin. Di bagian atas ada ringkasan jumlah `Menunggu`, `Diperiksa`, dan `Disetujui`. Daftar pendaftaran menampilkan nama, email, alasan, tanggal, badge status, dan aksi:
- **Mulai periksa**: `menunggu` → `diperiksa`
- **Setujui & kirim kode**: `diperiksa` → `disetujui`, lalu backend mengirim OTP email
- **Tolak**: `menunggu` atau `diperiksa` → `ditolak`
Daftar perlu refresh/polling agar perubahan status terlihat tanpa reload.

## Catatan penting backend (wajib sebelum rilis)
1. Konfigurasikan Supabase Auth agar `signUp` tidak mengirim email konfirmasi otomatis sebelum persetujuan. Perilaku tepatnya bergantung pada pengaturan **Confirm email** proyek Supabase.
2. Setelah persetujuan, gunakan Supabase Edge Function/server tepercaya dengan `SUPABASE_SERVICE_ROLE_KEY` sebagai secret untuk menerbitkan/mengirim OTP. Jangan pernah menaruh service-role key di browser.
3. Verifikasi OTP harus dilakukan server-side atau lewat alur Supabase Auth yang sesuai dengan akun yang sudah dibuat. OTP harus sekali pakai, berumur pendek (mis. 5 menit), dibatasi percobaannya, dan rate-limited.
4. Jangan menandai user sebagai benar-benar `verified` hanya berdasarkan perubahan UI. Status database dan hasil verifikasi OTP harus menjadi sumber kebenaran.
5. Migrasi SQL perlu dijalankan di Supabase SQL Editor sebelum UI baru digunakan. Uji juga akun lama, email duplikat, user yang ditolak, dan Co Jastip yang bukan developer.

## Urutan implementasi yang disarankan
1. Migrasi database: tambah status `diperiksa`, RPC `mulai_periksa`, dan perbarui RPC list/decision dengan pemeriksaan role.
2. Panel pendaftaran: tambahkan tombol “Mulai periksa” dan tampilkan semua status yang relevan.
3. Backend email OTP: Edge Function + provider email/Supabase Auth flow.
4. Halaman OTP enam kotak + timer + resend + validasi.
5. Uji end-to-end dengan Supabase staging; jangan aktifkan flow baru sebelum email OTP benar-benar terhubung.
