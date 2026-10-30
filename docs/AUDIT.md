> **Catatan (29 Okt 2026):** dokumen ini bersifat historis (audit 15 Okt). Semua "migrasi" yang disebut di bawah sudah digabung ke `supabase/schema.sql`, jadi tidak ada file migrasi terpisah. Pembatasan siapa yang boleh jadi jastip kini lewat tabel `allowed_jastip` dan alur persetujuan (lihat README bagian Peran).

# Audit kode, 15 Okt 2026

Cakupan: `index.html`, `schema.sql`, `config.js`. Status: **Diperbaiki** = sudah ada di versi ini,
**Aksi** = perlu kamu jalankan, **Catatan** = keputusan desain yang sebaiknya kamu tahu.

## Penyebab glitch dan kedip saat mengisi nama
| Penyebab | Status |
|---|---|
| `interactive-widget=resizes-content` + `padding-bottom:30vh`. Saat keyboard muncul, tinggi viewport berubah, 30vh ikut berubah, tinggi halaman berubah, lalu browser menggeser scroll. Di browser mobile ini bisa terulang tiap bar alamat naik turun. | Diperbaiki: meta dihapus, padding jadi 96px tetap |
| Pesan toast berada di alur halaman (`#msg`). Muncul dan hilang menggeser seluruh form. | Diperbaiki: toast `position:fixed` di atas layar |
| Form dibangun ulang saat status sesi berubah, nama yang sedang diketik hilang. | Diperbaiki: isian disimpan di `draft`, form tidak dibangun ulang saat polling |
| Dropdown bawaan Android tidak bisa distyle dari CSS dan membuka dialog sistem yang menutup keyboard, menyebabkan viewport berganti-ganti. | Diperbaiki: diganti kartu pilihan dan chip level di dalam halaman |
| Jika Google Fonts gagal termuat, logo memakai font cadangan yang lebih lebar dan memperlebar seluruh halaman. | Diperbaiki: font cadangan sempit + `overflow:hidden` pada header |

## Keamanan
| # | Temuan | Tingkat | Status |
|---|---|---|---|
| 1 | `tandai_bayar` menerima teks bebas untuk `bukti`, lalu dirender sebagai `href`. Penitip bisa mengisi `javascript:...`; saat admin mengetuk "bukti", skrip jalan di origin aplikasi dan bisa mengambil sesi admin. | Tinggi | Diperbaiki di klien (hanya `https:` + `noopener`) dan di SQL (hanya URL Storage bucket `bukti`). **Aksi:** jalankan migrasi |
| 2 | Bucket `bukti` boleh diunggah siapa saja tanpa batas ukuran dan tipe file. | Tinggi | **Aksi:** migrasi membatasi 5 MB dan hanya gambar. Klien juga mengecilkan foto sebelum unggah |
| 3 | Nama item dipakai sebagai kunci objek harga. Item bernama `constructor` membuat total jadi NaN untuk semua orang. | Sedang | Diperbaiki: pembacaan harga memakai `hasOwnProperty` |
| 4 | `tambah_pesanan` tanpa batas jumlah, level tidak divalidasi. Siapa pun yang tahu kode bisa memenuhi sesi dengan ribuan baris. | Sedang | **Aksi:** migrasi membatasi 300 baris per sesi dan level 1 sampai 8 |
| 5 | Kode sesi dibuat dari `Math.random()` (6 karakter, bisa ditebak). | Sedang | Diperbaiki: 8 karakter dari `crypto.getRandomValues`, otomatis coba ulang kalau bentrok |
| 6 | `status`, `pajak`, `fee` tidak punya batasan di database. | Rendah | **Aksi:** migrasi menambah CHECK |
| 7 | Tidak ada index untuk `pesanan.sesi_id` dan `sesi.owner`, padahal dipakai RLS di setiap query. | Rendah | **Aksi:** migrasi menambah index |
| 8 | `tandai_bayar` tidak butuh login: siapa pun yang tahu kode dan nama bisa menandai orang lain lunas. | Catatan | Bawaan desain tanpa login. Admin tetap bisa membatalkan dan mengecek bukti. Kalau mau lebih ketat, tambahkan PIN per orang |
| 9 | Anon key di `config.js` terlihat publik. | Catatan | Normal untuk Supabase. Yang melindungi data adalah RLS, jadi jangan pernah menaruh `service_role` key di sini |
| 10 | Skrip Supabase dari CDN tanpa SRI. | Catatan | Versi sudah dikunci (2.45.4). Untuk lebih aman, simpan salinannya di repo |

## Bug fungsional
| Temuan | Status |
|---|---|
| Gambar rekap terpotong 40 px di bawah (tinggi kanvas dihitung kurang). | Diperbaiki: tinggi dihitung dari isi |
| Teks panjang pada gambar rekap meluber keluar kanvas. | Diperbaiki: `maxWidth` dan font dimuat sebelum menggambar |
| `window.open` WA setelah `await` sering diblokir browser (terutama Safari). | Diperbaiki: tombol "Kabari jastip lewat WA" setelah tercatat lunas |
| Titip ke sesi yang baru ditutup gagal tanpa pesan (fungsi SQL diam-diam tidak menyisipkan baris). | Diperbaiki: klien cek status setelah kirim dan memberi tahu |
| Tombol bisa diketuk dua kali dan membuat pesanan ganda. | Diperbaiki: semua aksi dikunci saat berjalan |
| Hasil `error` dari Supabase diabaikan di hampir semua aksi admin (tutup sesi, hapus, centang lunas, simpan harga). | Diperbaiki: error ditampilkan |
| Rekap bisa terbit dengan harga 0 atau pajak minus. | Diperbaiki: divalidasi sebelum terbit |
| Hapus pesanan langsung terhapus tanpa konfirmasi. | Diperbaiki: ketuk dua kali |
| Gagal jaringan ditampilkan sebagai "Link tidak ditemukan". | Diperbaiki: dibedakan, ada tombol Coba lagi |
| Nomor WA diawali 0 menghasilkan link `wa.me` rusak. | Diperbaiki: otomatis jadi 62 |
| Daftar ulang saat konfirmasi email aktif tidak memberi umpan balik. | Diperbaiki |
| Respons async yang telat bisa menimpa halaman lain setelah pindah rute. | Diperbaiki: token `rid` per navigasi |
| `localStorage` melempar error di mode privat. | Diperbaiki: dibungkus try/catch |
| Judul rekap WA selalu "Mie Gacoan" walau ada menu lain. | Diperbaiki: "Titip Gacoan" |

## Aksesibilitas
Label form kini terhubung ke input, pilihan memakai radio asli (bisa dioperasikan keyboard dan pembaca layar), ada fokus terlihat,
target ketuk minimal 32 sampai 50 px, toast memakai `aria-live`, animasi dimatikan untuk pengguna `prefers-reduced-motion`,
dan teal diperdalam dari `#0a8fb0` ke `#07758f` agar teks putih terbaca (kontras 3,8 menjadi 5,3).

## Belum dikerjakan (saran)
- Realtime Supabase menggantikan polling 12 detik jika pengguna per sesi sudah puluhan.
- Pindahkan CSS dan JS ke berkas terpisah bila proyek membesar, lalu pasang Content-Security-Policy ketat.
- Pilihan menu masih di `config.js`/kode, belum per sesi. Jika jastip ingin ganti menu tiap sesi, perlu kolom `menu jsonb` di `sesi`.

## Koreksi setelah audit (15 Okt 2026, putaran 2)
- `tandai_bayar`: link bukti hanya diterima dari `*.supabase.co/storage/v1/object/public/bukti/` (versi awal menerima host mana pun).
- `tambah_pesanan`: kini mengembalikan true/false. Klien menampilkan pesan jika ditolak (daftar penuh, ditutup, atau isian tidak valid), bukan "Masuk ke daftar" palsu.
- Kebijakan upload `b1` dimasukkan ke migrasi: upload bukti hanya ke folder sesi yang rekapnya sudah terbit.
- Pendaftaran jastip yang ditolak menampilkan pesan yang jelas. Untuk membatasi siapa yang boleh daftar, lihat README bagian "Membatasi siapa yang boleh jadi jastip".
