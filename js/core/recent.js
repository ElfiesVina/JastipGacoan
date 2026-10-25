/**
 * js/core/recent.js
 * Daftar sesi terbaru di perangkat ini (maks 3): sesi yang baru dibuat jastip
 * atau yang baru dibuka penitip. Ditampilkan di halaman Jastiper sebagai pintasan.
 */
import { store } from './storage.js';
import { LS_LAST } from './constants.js';

/** @returns {{k:string,j:string}[]} */
export function getRecent() {
  try {
    const v = JSON.parse(store.get(LS_LAST) || '[]');
    return (Array.isArray(v) ? v : [v])
      .filter((x) => x && /^\w+$/.test(x.k || ''))
      .map((x) => ({ k: x.k, j: String(x.j || '').slice(0, 60) }))
      .slice(0, 3);
  } catch {
    return [];
  }
}

/** Catat sesi di urutan teratas (yang sama dipindah ke atas). */
export function addRecent(k, j) {
  const rest = getRecent().filter((x) => x.k !== k);
  store.set(LS_LAST, JSON.stringify([{ k, j: String(j || '') }, ...rest].slice(0, 3)));
}
