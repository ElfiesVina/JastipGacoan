/**
 * js/core/storage.js
 * Pembungkus localStorage yang aman: di mode privat / diblokir,
 * localStorage melempar error, jadi semua akses dibungkus try/catch.
 */
export const store = {
  /** Baca nilai; null jika tidak ada atau tidak bisa diakses. */
  get(k) {
    try { return localStorage.getItem(k); } catch { return null; }
  },
  /** Simpan nilai; gagal diam-diam jika tidak bisa. */
  set(k, v) {
    try { localStorage.setItem(k, v); } catch { /* abaikan */ }
  },
};
