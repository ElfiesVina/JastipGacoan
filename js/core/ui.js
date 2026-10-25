/**
 * js/core/ui.js
 * Pembantu antarmuka umum: toast, status tombol sibuk, kunci aksi, skeleton.
 */
import { $ } from './dom.js';
import { state } from './state.js';
import { TOAST_MS } from './constants.js';

let toastTimer;

/**
 * Tampilkan pesan singkat di atas layar.
 * @param {string} text isi pesan
 * @param {boolean} [bad] true = gaya galat (pink)
 */
export function toast(text, bad) {
  const el = $('#toast');
  el.textContent = text;
  el.className = 'show' + (bad ? ' bad' : '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (el.className = ''), TOAST_MS);
}

/**
 * Ubah tombol jadi "sibuk" (teks sementara + nonaktif) atau kembalikan.
 * @param {string} selector selector tombol
 * @param {string} [text] teks sementara; kosongkan untuk mengembalikan tombol
 */
export function setBusy(selector, text) {
  const b = $(selector);
  if (!b) return;
  if (text) {
    b.dataset.t = b.textContent;
    b.textContent = text;
    b.disabled = true;
  } else {
    b.textContent = b.dataset.t || b.textContent;
    b.disabled = false;
  }
}

/**
 * Jalankan aksi async hanya jika tidak ada aksi lain yang berjalan.
 * Mencegah ketukan ganda (mis. pesanan ganda).
 * @param {Function} fn fungsi async yang dijalankan
 */
export async function lock(fn) {
  if (state.busy) return;
  state.busy = true;
  try {
    return await fn();
  } finally {
    state.busy = false;
  }
}

/** HTML placeholder loading. */
export const skeleton = '<div class="card sk"><i></i><i></i><i></i></div>';

/** Tandai aplikasi siap: buang layar tunggu (body.boot) setelah halaman pertama tergambar. */
export function ready() { document.body.classList.remove('boot'); }
