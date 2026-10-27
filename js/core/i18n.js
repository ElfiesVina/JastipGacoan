/**
 * js/core/i18n.js
 * Pilihan bahasa: Indonesia (bawaan), English, العربية (kanan-ke-kiri).
 * Pilihan disimpan di perangkat (localStorage 'lang'). Teks ada di data/i18n-data.js.
 * Jangan panggil t() saat modul dimuat (di luar fungsi): bahasa baru diketahui setelah initLang().
 */
import { TEXT } from '../data/i18n-data.js';

/** Bahasa yang tersedia; `name` selalu ditulis dalam bahasanya sendiri. */
export const LANGS = [
  { code: 'id', name: 'Bahasa Indonesia' },
  { code: 'en', name: 'English' },
  { code: 'ar', name: 'العربية' },
];

const INDEX = { id: 0, en: 1, ar: 2 };
let lang = 'id';

/** Pasang atribut lang dan arah tulisan (rtl untuk Arab) di <html>. */
function apply() {
  const root = document.documentElement;
  root.lang = lang;
  root.dir = lang === 'ar' ? 'rtl' : 'ltr';
}

/** Baca pilihan tersimpan lalu terapkan. Dipanggil sekali di main.js sebelum halaman digambar. */
export function initLang() {
  try {
    const saved = localStorage.getItem('lang');
    if (saved in INDEX) lang = saved;
  } catch (_) { /* penyimpanan tidak tersedia: tetap Indonesia */ }
  apply();
}

/** Kode bahasa yang sedang dipakai. */
export const getLang = () => lang;

/** Ganti bahasa dan simpan. @param {'id'|'en'|'ar'} code @returns {boolean} true bila berubah */
export function setLang(code) {
  if (!(code in INDEX) || code === lang) return false;
  lang = code;
  try { localStorage.setItem('lang', code); } catch (_) { /* abaikan */ }
  apply();
  return true;
}

/**
 * Teks menurut bahasa aktif; kalau belum diterjemahkan jatuh ke Indonesia, lalu ke kuncinya.
 * @param {string} key @param {Record<string,string|number>} [vars] isi untuk {nama} di dalam teks
 */
export function t(key, vars) {
  const row = TEXT[key];
  let s = row ? (row[INDEX[lang]] || row[0]) : key;
  if (vars) s = s.replace(/\{(\w+)\}/g, (m, k) => (vars[k] ?? m));
  return s;
}
