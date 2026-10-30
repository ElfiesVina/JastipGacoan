/**
 * js/data/changelog-data.js
 * Daftar catatan perubahan ("Yang baru").
 *
 * Cara menambah: taruh entri baru di PALING ATAS dengan id = id terbesar + 1.
 *   id    : angka, selalu naik. Dipakai untuk menandai mana yang sudah dibaca.
 *   tgl   : 'YYYY-MM-DD'
 *   v     : nomor versi (opsional, hanya tampilan)
 *   jenis : 'Fitur' | 'Perbaikan' | 'Tampilan'
 *   untuk : 'semua' | 'admin' | 'penitip'
 *   judul : satu kalimat singkat
 *   poin  : daftar kalimat pendek, bahasa orang awam
 */
export const CHANGELOG = [
  { id: 22, tgl: '2026-10-29', v: '2.7', jenis: 'Perbaikan', untuk: 'semua',
    judul: 'Aplikasi Android kini seperti aplikasi sungguhan',
    poin: [
      'Aplikasi berjalan sendiri, tanpa bilah alamat Chrome. Isi otomatis sandi dari Google tetap bisa dipakai.',
      'Pilih foto bukti transfer kini berfungsi di aplikasi.',
      'Tombol Back menutup jendela yang terbuka, mundur satu halaman, lalu keluar dari aplikasi.',
      'Link WhatsApp terbuka langsung di aplikasi WhatsApp.',
      '"Simpan rekap sebagai gambar" menyimpan gambar ke galeri HP.',
      'Ada layar pembuka dengan logo baru dan layar "Tidak ada koneksi" dengan tombol Coba lagi.',
      'Tampilan terbaru kini lebih cepat terpasang karena penyimpanan offline aplikasi diperbarui.',
      'Membuka link sesi dari WhatsApp bisa langsung masuk ke aplikasi (aktifkan "Buka link yang didukung" di info aplikasi).'] },
  { id: 21, tgl: '2026-10-29', v: '2.6', jenis: 'Tampilan', untuk: 'semua',
    judul: 'Icon aplikasi Android yang baru',
    poin: [
      'Icon APK diganti: logo mangkuk dan sumpit dengan tulisan Jastip GacoanApp berwarna biru.',
      'Latar icon kini putih dan logonya pas di dalam bentuk bulat maupun kotak bulat bawaan HP.',
      'Ukuran icon disesuaikan untuk semua kerapatan layar, jadi lebih tajam dan file lebih kecil.'] },
  { id: 20, tgl: '2026-10-29', v: '2.5', jenis: 'Tampilan', untuk: 'semua',
    judul: 'Tarik untuk refresh yang baru',
    poin: [
      'Header kini tetap diam saat layar ditarik, di HP maupun laptop.',
      'Di bawah header muncul ikon muat berwarna pink.',
      'Tulisan TITIP GACOAN di header hilang berurutan (GACOAN, latar pink, TITIP) lalu terisi kembali satu huruf demi satu huruf.',
      'Lepas setelah logo terisi penuh untuk memuat ulang halaman.'] },
  { id: 19, tgl: '2026-10-29', v: '2.4', jenis: 'Fitur', untuk: 'semua',
    judul: 'Status pendaftaran lebih jelas: Sedang diperiksa',
    poin: [
      'Halaman status pendaftar kini punya progress 3 langkah: Menunggu, Sedang diperiksa, lalu Verified.',
      'Developer dan Co Jastip bisa menekan Mulai periksa sebelum menyetujui atau menolak.',
      'Panel Persetujuan menampilkan jumlah pendaftar per status dan menyegarkan dirinya sendiri.',
      'Siap untuk kode verifikasi 6 digit lewat email (aktif setelah layanan emailnya dipasang).'] },
  { id: 18, tgl: '2026-10-27', v: '2.3', jenis: 'Fitur', untuk: 'semua',
    judul: 'Daftar jastip kini lewat persetujuan',
    poin: [
      'Form daftar punya kolom alasan mendaftar.',
      'Setelah daftar, kamu masuk ke halaman Pending. Status berubah jadi Verified saat developer atau Co Jastip menyetujui.',
      'Pembaruan hanya ditandai badge di lonceng, tanpa banner.'] },
  { id: 17, tgl: '2026-10-27', v: '2.2', jenis: 'Fitur', untuk: 'admin',
    judul: 'Persetujuan admin, setelan, dan pilihan bahasa',
    poin: [
      'Beranda kini hanya berisi profil dan pintasan; Buat Sesi, Sesi Aktif, dan Sesi Saya membuka halamannya sendiri.',
      'Tab Persetujuan aktif: pengajuan admin jastip disetujui atau ditolak developer.',
      'Tab Setelan aktif: pilih bahasa (Indonesia, English, العربية) dan ganti tema.',
      'Logo Me Gacoan berlatar transparan, jadi rapi di tema gelap.'] },
  { id: 16, tgl: '2026-10-27', v: '2.1', jenis: 'Tampilan', untuk: 'admin',
    judul: 'Navigasi bawah, foto profil potret, dan form edit profil dirapikan',
    poin: [
      'Ada menu di bawah layar: Beranda, Admin, Persetujuan, dan Setelan.',
      'Foto profil kini berbentuk potret dan tingginya mengikuti teks di sebelahnya.',
      'Form edit profil dibagi per kotak (foto, data diri, kontak, media sosial) dengan tombol Simpan yang menempel di bawah.',
      'Tombol Sesi Aktif ditambahkan di pintasan beranda.',
      'Kelola Co Jastip pindah dari profil ke menu Admin.'] },
  { id: 15, tgl: '2026-10-26', v: '2.0', jenis: 'Tampilan', untuk: 'admin',
    judul: 'Halaman jastip lebih rapi, termasuk di layar landscape',
    poin: [
      'Header halaman jastip dibuat lebih ringkas: logo, tombol tema, dan lonceng sebaris.',
      'Detail sesi tampil dua kolom di layar lebar dan HP landscape: kontrol di kiri, daftar titipan dan rekap di kanan.',
      'Beranda jastip juga dua kolom di tablet dan HP landscape, kartunya dirapatkan.',
      'Tombol Semua sesi dan deretan tombol aksi dirapikan.'] },
  { id: 14, tgl: '2026-10-26', v: '1.9', jenis: 'Fitur', untuk: 'admin',
    judul: 'Profil jastip lengkap dan beranda baru',
    poin: [
      'Kartu profil berisi foto, nama dengan status Online/Offline, title, kampus, kutipan, dan kontak. Nomor WA tidak ditampilkan, hanya tulisan WhatsApp.',
      'Jastip baru diminta melengkapi profil dulu. Setelah tersimpan, muncul pintasan Buat Sesi dan Sesi Saya, kartu sesi aktif, form buat sesi, dan daftar sesi.',
      'Tombol Keluar dipindah ke dalam Detail profil.',
      'Angka ringkasan (Sesi, Dibuka, Rekap) kini tampil di bawah labelnya.',
      'Tombol tema terang/gelap juga ada di header beranda, dan ganti tema tidak lagi menggeser tampilan.'] },
  { id: 13, tgl: '2026-10-25', v: '1.8', jenis: 'Tampilan', untuk: 'semua',
    judul: 'Header berlabel, mode gelap, dan link sesi di halaman Jastiper',
    poin: [
      'Pilihan Jastip dan Jastiper di header kini berlabel teks, ditambah tombol bulan untuk mode gelap yang diingat di perangkat.',
      'Link sesi terbaru muncul di atas kolom isian dengan ikon salin. Link hanya bisa disalin lewat ikon itu.',
      'Lonceng dinaikkan, dan kalimat petunjuk disesuaikan.'] },
  { id: 12, tgl: '2026-10-25', v: '1.7', jenis: 'Perbaikan', untuk: 'semua',
    judul: 'Layar tidak menciut saat keyboard muncul',
    poin: [
      'Tampilan tetap sama ukurannya saat mengetik, tidak lagi mengecil atau terdorong ke bawah.',
      'Saat halaman dimuat ulang, layar tunggu tampil dulu sehingga beranda bawaan tidak sempat berkedip. Halaman Jastip atau Jastiper yang dibuka tetap diingat.',
      'Pindah Jastip dan Jastiper kini langsung tanpa animasi.',
      'Tampilan tablet dan jendela laptop yang sempit dirapikan.',
      'Beranda Jastip didesain ulang, dan ikon aplikasi serta favicon dibuat bulat.'] },
  { id: 10, tgl: '2026-10-25', v: '1.6', jenis: 'Tampilan', untuk: 'semua',
    judul: 'Pindah Jastip / Jastiper lewat ikon di header',
    poin: [
      'Dua ikon di pojok kanan atas untuk pindah halaman, dengan efek scale. Menggeser layar ke kiri atau kanan juga bisa.',
      'Bagian bawah layar dikosongkan, hanya ada panah turun. Panah naik kini ikut bergerak.',
      'Di laptop dan layar landscape, pindah halaman lewat tautan "Masuk sebagai Jastip" atau "Masuk sebagai Jastiper".'] },
  { id: 9, tgl: '2026-10-25', v: '1.5', jenis: 'Tampilan', untuk: 'penitip',
    judul: 'Halaman titip lebih rapi di HP, tablet, dan laptop',
    poin: [
      'Ada pita tahap: Daftar dibuka, Belanja, lalu Rekap dan bayar.',
      'Di layar lebar, form ada di kiri dan daftar serta rekap di kanan.',
      'Tombol Titip dan Bayar menempel di bawah layar HP supaya mudah dijangkau.',
      'Halaman awal punya kolom tempel link atau kode sesi.'] },
  { id: 8, tgl: '2026-10-25', v: '1.5', jenis: 'Fitur', untuk: 'semua',
    judul: 'Halaman awal: Jastip | Jastiper',
    poin: [
      'Dua halaman yang bisa digeser: Jastiper (penitip) tampil lebih dulu, Jastip (pengelola) ada di sebelahnya.',
      'Pindah dengan mengetuk tab atau menggeser layar.',
      'Panah turun kini tanpa lingkaran dan bayangan, animasinya tetap ada.'] },
  { id: 7, tgl: '2026-10-24', v: '1.4', jenis: 'Fitur', untuk: 'admin',
    judul: 'Lupa password lewat kode email',
    poin: [
      'Isi email, kirim kode, masukkan kode dari email, lalu buat password baru.',
      'Di halaman masuk, tarik layar ke bawah untuk memuat ulang.',
      'Warna biru di atas layar kini menyatu dengan bilah browser.'] },
  { id: 6, tgl: '2026-10-24', v: '1.3', jenis: 'Tampilan', untuk: 'admin',
    judul: 'Halaman masuk jadi dua halaman di HP',
    poin: [
      'Cara kerja dan info lain pindah ke halaman kedua. Ketuk panah di bawah layar untuk melihatnya.',
      'Lonceng di halaman masuk kini menampilkan angka saat ada pembaruan.'] },
  { id: 5, tgl: '2026-10-24', v: '1.2', jenis: 'Tampilan', untuk: 'admin',
    judul: 'Halaman masuk lebih lengkap dan rapi',
    poin: [
      'Di laptop, halaman masuk tampil dua kolom: info di kiri, form di kanan.',
      'Ada penjelasan singkat cara kerja dan footer di bagian bawah.',
      'Tombol masuk menampilkan tanda proses, dan pesan galat kini berbahasa Indonesia.',
      'Email yang sudah diketik tidak hilang saat pindah antara Masuk dan Daftar.'] },
  { id: 4, tgl: '2026-10-15', v: '1.1', jenis: 'Perbaikan', untuk: 'admin',
    judul: 'Lebih aman saat menerbitkan rekap',
    poin: [
      'Rekap tidak bisa terbit kalau masih ada menu yang belum diisi harganya.',
      'Hapus pesanan perlu dua ketukan, supaya tidak terhapus tidak sengaja.',
      'Daftar titipan ikut terbarui sendiri selama sesi masih dibuka.',
      'Nomor WA yang diawali 0 otomatis diubah jadi 62.',
      'Gambar rekap tidak lagi terpotong di bagian bawah.'] },
  { id: 3, tgl: '2026-10-15', v: '1.1', jenis: 'Perbaikan', untuk: 'penitip',
    judul: 'Bayar dan kirim bukti lebih rapi',
    poin: [
      'Pilih namamu lewat kartu, bukan daftar bawaan HP.',
      'Foto bukti dikecilkan otomatis sebelum diunggah, jadi lebih cepat.',
      'Setelah tercatat lunas, muncul tombol Kabari jastip lewat WA.',
      'Gambar rekap tidak lagi terpotong di bagian bawah.'] },
  { id: 2, tgl: '2026-10-15', v: '1.1', jenis: 'Tampilan', untuk: 'penitip',
    judul: 'Pilih menu dan level lebih mudah',
    poin: [
      'Menu tampil sebagai kartu yang bisa langsung diketuk.',
      'Level pedas 1 sampai 8 muncul saat kamu memilih Mie, dengan warna makin pekat makin pedas.',
      'Mengisi nama tidak lagi berkedip atau melompat saat keyboard muncul.'] },
  { id: 1, tgl: '2026-10-15', v: '1.1', jenis: 'Fitur', untuk: 'semua',
    judul: 'Ada catatan perubahan',
    poin: [
      'Ikon lonceng di pojok kanan atas menampilkan apa saja yang baru.',
      'Penanda merah hilang setelah kamu membukanya.'] },
];
