/**
 * js/core/state.js
 * Satu-satunya tempat menyimpan keadaan aplikasi yang berubah-ubah.
 * File lain mengimpor `state` dan `draft` lalu mengubah isinya.
 */
import { store } from './storage.js';
import { LS_NAME } from './constants.js';

export const state = {
  /** Data sesi aktif (objek dari database) atau null. */
  sesi: null,
  /** Daftar pesanan sesi aktif. */
  pesanan: [],
  /** Pengguna admin yang sedang login (Supabase user) atau null. */
  user: null,
  /** Token sesi akun yang login (dipakai presence.js untuk menandai offline saat tab ditutup). */
  accessToken: null,
  /** Profil admin (nama, info transfer, WA). */
  profil: null,
  /** id setInterval untuk polling. */
  timer: 0,
  /** Nomor navigasi. Naik tiap pindah halaman; respons lama yang telat diabaikan. */
  rid: 0,
  /** Status sesi yang terakhir digambar (agar form tidak dibangun ulang). */
  built: '',
  /** "Sidik jari" data terakhir yang digambar (agar tidak menggambar ulang percuma). */
  sig: '',
  /** true selama sebuah aksi berjalan (mencegah ketukan ganda). */
  busy: false,
  /** true selama polling berjalan. */
  polling: false,
  /** Peran tampilan: 'penitip' atau 'admin'. */
  role: 'penitip',
};

/**
 * Isian form penitip yang sedang diketik. Disimpan di sini supaya tidak hilang
 * ketika tampilan digambar ulang saat polling.
 */
export const draft = {
  n: store.get(LS_NAME) || '', // nama
  i: '',                       // item/menu terpilih
  l: '',                       // level pedas terpilih
  who: '',                     // nama yang dipilih di form bayar
  f: null,                     // file foto bukti
};
