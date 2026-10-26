/**
 * js/core/theme.js
 * Tema terang / gelap. Pilihan disimpan di perangkat; atribut data-theme di <html>
 * sudah dipasang lebih awal oleh skrip kecil di index.html (agar tidak berkedip).
 */
/** Beri animasi warna sebentar saja (kelas dilepas lagi supaya animasi lain tidak terganggu). */
function fadeColors() {
  const root = document.documentElement;
  root.classList.add('theme-fade');
  setTimeout(() => root.classList.remove('theme-fade'), 320);
}

export function toggleTheme() {
  const gelap = document.documentElement.dataset.theme !== 'dark';
  if (gelap) document.documentElement.dataset.theme = 'dark';
  else delete document.documentElement.dataset.theme;
  try { localStorage.setItem('theme', gelap ? 'dark' : 'light'); } catch (_) {}
  fadeColors();
  document.querySelectorAll('[data-act="theme"]').forEach((b) => b.setAttribute('aria-pressed', String(gelap)));
}
