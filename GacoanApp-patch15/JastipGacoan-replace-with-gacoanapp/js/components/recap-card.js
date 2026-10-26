/**
 * js/components/recap-card.js
 * Kartu "Rekap pembayaran" (subtotal, PB1, fee, pembulatan, total).
 */
import { state } from '../core/state.js';
import { esc } from '../core/dom.js';
import { rp } from '../core/format.js';
import { hitungRekap, pajak } from '../services/calc.js';

/** Satu baris "label ........ nilai". */
const line = (a, b) => '<div class="row"><span class="mu">' + a + '</span><span class="num r">' + b + '</span></div>';

/** HTML kartu rekap. */
export function recapCardHTML() {
  const c = hitungRekap();
  return (
    '<div class="card"><h2>Rekap pembayaran</h2>' +
    line('Subtotal sebelum pajak', rp(c.sub)) +
    line('PB1 · ' + pajak() + '%', rp(c.pb1)) +
    (c.fee ? line('Fee jastip', rp(c.fee)) : '') +
    line('Pembulatan', rp(c.rnd)) +
    '<div class="mu" style="margin-top:14px">Total dibayar</div><div class="tot">' + rp(c.tot) + '</div>' +
    '<div class="mu">Transfer: <b>' + esc(state.sesi.rek || '-') + '</b></div>' +
    '<button type="button" class="gh b" data-act="img">Simpan rekap sebagai gambar</button></div>'
  );
}
