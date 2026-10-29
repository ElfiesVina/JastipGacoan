/**
 * js/components/gacoan-loader.js
 * Indikator "tarik untuk refresh" bergaya Gacoan: ikon putar pink + tulisan GACOAN yang terisi
 * satu huruf demi satu huruf (dari bawah ke atas) mengikuti jarak tarik.
 *
 * Perilaku ditentukan CSS lewat variabel --ptr (0..1) pada elemen induk;
 * saat induk berkelas .refreshing, huruf mengisi bergantian terus-menerus dan ikon berputar.
 * Dipakai di halaman biasa (services/pull-refresh.js) dan layar masuk (auth-forms.js).
 */

/** Tulisan yang diisi per huruf. */
const TEKS = 'GACOAN';

/** HTML indikator. Aman dipasang di mana saja; warnanya pink Gacoan (var(--pk)). */
export const gacoanLoaderHTML = () =>
  '<div class="gl" aria-hidden="true">' +
  '<svg class="gl-ico" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 4v5h-5"/></svg>' +
  '<span class="gl-t">' +
  TEKS.split('').map((c, i) => '<span class="gl-c" style="--i:' + i + '"><span class="gl-b">' + c + '</span><span class="gl-f">' + c + '</span></span>').join('') +
  '</span></div>';
