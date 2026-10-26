/**
 * js/core/format.js
 * Fungsi murni untuk memformat teks/angka. Tidak menyentuh DOM atau database.
 */

/** Format rupiah: 12500 -> "Rp12.500"; negatif memakai tanda "–". */
export const rp = (n) => (n < 0 ? '–' : '') + 'Rp' + Math.abs(Math.round(n)).toLocaleString('id-ID');

/** Kunci pengelompokan nama: abaikan spasi tepi & huruf besar-kecil. */
export const key = (s) => s.trim().toLowerCase();

/** Teks pesanan, mis. "Mie Gacoan · Level 3". */
export const label = (o) => o.item + (o.level ? ' · Level ' + o.level : '');

/** Apakah menu ini mie (berhak memilih level pedas)? */
export const isMie = (v) => /mie/i.test(v || '');

/**
 * Buat link WhatsApp.
 * @param {string} nomor nomor tujuan format 62xxx (boleh kosong = pilih kontak sendiri)
 * @param {string} teks isi pesan
 */
export const waLink = (nomor, teks) => 'https://wa.me/' + (nomor || '') + '?text=' + encodeURIComponent(teks);

/** Ambil angka saja dari nomor telepon, awalan 0 diganti 62. */
export const normalizePhone = (v) => String(v).replace(/\D/g, '').replace(/^0/, '62');

/**
 * Buat kode sesi acak 8 karakter memakai crypto (sulit ditebak).
 * Huruf yang mirip (i, l, o) dan angka 0, 1 sengaja dibuang.
 */
export const newCode = () => {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  const a = new Uint8Array(8);
  crypto.getRandomValues(a);
  return [...a].map((x) => chars[x % chars.length]).join('');
};
