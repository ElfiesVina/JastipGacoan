/*
  Catatan perubahan (changelog) Titip Gacoan.
  Cara menambah: taruh entri baru di PALING ATAS dengan id = id terbesar + 1.
    id     : angka, selalu naik. Dipakai untuk menandai mana yang sudah dibaca.
    tgl    : 'YYYY-MM-DD'
    v      : nomor versi (opsional, hanya tampilan)
    jenis  : 'Fitur' | 'Perbaikan' | 'Tampilan'
    untuk  : 'semua' | 'admin' | 'penitip'
    judul  : satu kalimat singkat
    poin   : daftar kalimat pendek, bahasa orang awam
*/
window.CHANGELOG=[
{id:4,tgl:'2026-10-15',v:'1.1',jenis:'Perbaikan',untuk:'admin',
 judul:'Lebih aman saat menerbitkan rekap',
 poin:[
  'Rekap tidak bisa terbit kalau masih ada menu yang belum diisi harganya.',
  'Hapus pesanan perlu dua ketukan, supaya tidak terhapus tidak sengaja.',
  'Daftar titipan ikut terbarui sendiri selama sesi masih dibuka.',
  'Nomor WA yang diawali 0 otomatis diubah jadi 62.',
  'Gambar rekap tidak lagi terpotong di bagian bawah.']},
{id:3,tgl:'2026-10-15',v:'1.1',jenis:'Perbaikan',untuk:'penitip',
 judul:'Bayar dan kirim bukti lebih rapi',
 poin:[
  'Pilih namamu lewat kartu, bukan daftar bawaan HP.',
  'Foto bukti dikecilkan otomatis sebelum diunggah, jadi lebih cepat.',
  'Setelah tercatat lunas, muncul tombol Kabari jastip lewat WA.',
  'Gambar rekap tidak lagi terpotong di bagian bawah.']},
{id:2,tgl:'2026-10-15',v:'1.1',jenis:'Tampilan',untuk:'penitip',
 judul:'Pilih menu dan level lebih mudah',
 poin:[
  'Menu tampil sebagai kartu yang bisa langsung diketuk.',
  'Level pedas 1 sampai 8 muncul saat kamu memilih Mie, dengan warna makin pekat makin pedas.',
  'Mengisi nama tidak lagi berkedip atau melompat saat keyboard muncul.']},
{id:1,tgl:'2026-10-15',v:'1.1',jenis:'Fitur',untuk:'semua',
 judul:'Ada catatan perubahan',
 poin:[
  'Ikon lonceng di pojok kanan atas menampilkan apa saja yang baru.',
  'Penanda merah hilang setelah kamu membukanya.']}
];
