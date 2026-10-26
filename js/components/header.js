/**
 * js/components/header.js
 * Teks status di bawah logo (judul sesi + keadaan + nama jastip).
 */
import { $, esc } from '../core/dom.js';
import { state } from '../core/state.js';
import { ready } from '../core/ui.js';
import { STATUS_HEADER } from '../core/constants.js';

/** Perbarui baris status di header sesuai `state.sesi`. */
export function renderHeader() {
  ready(); // header sudah diisi: buang layar tunggu
  const s = state.sesi;
  $('#st').innerHTML = s
    ? (s.judul ? '<b class="st-t">' + esc(s.judul) + '</b>' : '') +
      '<span class="st-m"><span class="st-p st-' + esc(s.status) + '">' + esc(STATUS_HEADER[s.status] || '') + '</span>' +
      (s.nama ? '<span class="st-j">Jastip: ' + esc(s.nama) + '</span>' : '') + '</span>'
    : '<span class="header-label">Titip Pesanan</span><span class="header-label">Rekap Otomatis</span>'; // teks statis, bukan tombol
}
