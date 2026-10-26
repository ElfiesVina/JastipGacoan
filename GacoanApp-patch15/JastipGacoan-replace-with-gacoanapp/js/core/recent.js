/**
 * js/core/recent.js
 * Daftar sesi terbaru di perangkat ini (maks 3): sesi yang baru dibuat jastip
 * atau yang baru dibuka penitip. Ditampilkan di halaman Jastiper sebagai pintasan.
 */
import { store } from './storage.js';
import { LS_LAST } from './constants.js';
import { toast } from './ui.js';

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

/** Link lengkap sebuah sesi untuk ditempel/dibagikan. */
export const linkOf = (k) => location.origin + location.pathname + '#/s/' + k;

/** Salin link sesi ke clipboard (hanya lewat ikon salin; teksnya sendiri tidak bisa disalin). */
export async function copyRecent(b) {
  const k = b.dataset.k;
  if (!/^\w+$/.test(k || '')) return;
  const teks = linkOf(k);
  try {
    await navigator.clipboard.writeText(teks);
  } catch {
    const t = document.createElement('textarea');
    t.value = teks; t.setAttribute('readonly', ''); t.style.cssText = 'position:fixed;opacity:0';
    document.body.appendChild(t); t.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (_) {}
    t.remove();
    if (!ok) { toast('Gagal menyalin. Coba lagi.', 1); return; }
  }
  b.classList.add('ok');
  setTimeout(() => b.classList.remove('ok'), 1600);
  toast('Link disalin ✓');
}
