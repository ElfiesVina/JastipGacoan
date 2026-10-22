/**
 * js/components/header.js
 * Teks status di bawah logo (judul sesi + keadaan + nama jastip).
 */
import { $ } from '../core/dom.js';
import { state } from '../core/state.js';
import { STATUS_HEADER } from '../core/constants.js';

/** Perbarui baris status di header sesuai `state.sesi`. */
export function renderHeader() {
  const s = state.sesi;
  $('#st').textContent = s
    ? (s.judul || '') + ' · ' + (STATUS_HEADER[s.status] || '') + (s.nama ? ' · Jastip: ' + s.nama : '')
    : 'Titip pesanan, rekap otomatis';
}
