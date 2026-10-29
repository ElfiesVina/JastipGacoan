/**
 * js/components/gacoan-loader.js
 * Indikator "tarik untuk refresh": HANYA ikon muat pink (berputar mengikuti tarikan, lalu berputar terus saat memuat).
 * Animasi huruf ada di logo header (lihat services/pull-refresh.js dan css/components/ptr.css).
 * Dipakai di halaman biasa dan di layar masuk (auth-forms.js).
 */

/** HTML ikon muat. Warna pink Gacoan (var(--pk)); sudut putar ditentukan CSS lewat --ptr (0..1). */
export const gacoanLoaderHTML = () =>
  '<div class="gl" aria-hidden="true">' +
  '<svg class="gl-ico" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 4v5h-5"/></svg>' +
  '</div>';
