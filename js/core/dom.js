/**
 * js/core/dom.js
 * Pembantu DOM kecil: pencari elemen, escape HTML, dan validasi URL.
 */

/** Ambil SATU elemen dengan selector CSS (atau null). */
export const $ = (selector) => document.querySelector(selector);

/** Ambil SEMUA elemen dengan selector CSS sebagai array. */
export const $$ = (selector) => [...document.querySelectorAll(selector)];

/** Wadah utama halaman dan dialog changelog (modul dimuat setelah HTML siap). */
export const app = $('#app');
export const dlg = $('#dlg');

/**
 * Escape teks sebelum disisipkan ke innerHTML, mencegah XSS.
 * WAJIB dipakai untuk semua data dari pengguna/database.
 * @param {*} s nilai apa pun
 * @returns {string} teks aman
 */
export const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/**
 * Hanya terima URL https. Selain itu (javascript:, data:, dst) dibuang.
 * @param {string} u URL mentah
 * @returns {string} URL aman atau string kosong
 */
export const safeUrl = (u) => {
  try {
    const x = new URL(u);
    return x.protocol === 'https:' ? x.href : '';
  } catch {
    return '';
  }
};
