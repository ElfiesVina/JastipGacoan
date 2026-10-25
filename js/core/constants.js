/**
 * js/core/constants.js
 * Nilai tetap yang dipakai di banyak file. Ubah di sini, berlaku di mana-mana.
 */

/** Selang pengecekan data baru (milidetik) selama sesi masih dibuka. */
export const POLL_MS = 12000;

/** Sisi terpanjang foto bukti setelah dikecilkan (piksel). */
export const MAX_IMG_SIDE = 1600;

/** Nama bucket Supabase Storage untuk foto bukti transfer. */
export const BUCKET = 'bukti';

/** Level pedas yang tersedia. */
export const LEVELS = [1, 2, 3, 4, 5, 6, 7, 8];

/** Lama tombol "Hapus?" menunggu ketukan kedua (milidetik). */
export const ARM_MS = 3000;

/** Lama toast tampil (milidetik). */
export const TOAST_MS = 3800;

/** Kunci localStorage. */
export const LS_NAME = 'nm';        // nama terakhir yang diisi penitip
export const LS_LAST = 'last';       // sesi terakhir yang dibuka penitip: {k, j}
export const LS_SEEN_PREFIX = 'cl_'; // + peran => id changelog terakhir dibaca

/** Teks status sesi untuk daftar di dashboard admin. */
export const STATUS_LABEL = { open: 'Dibuka', closed: 'Ditutup', settled: 'Rekap terbit' };

/** Teks status sesi untuk baris di bawah logo. */
export const STATUS_HEADER = {
  open: 'Daftar dibuka',
  closed: 'Daftar ditutup, menunggu belanja',
  settled: 'Rekap terbit',
};
