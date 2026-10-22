/**
 * js/components/order-list.js
 * Kartu "Daftar titipan" (dipakai penitip dan admin).
 */
import { state } from '../core/state.js';
import { esc, safeUrl } from '../core/dom.js';
import { key, label, rp } from '../core/format.js';
import { hitungRekap } from '../services/calc.js';

/**
 * HTML satu chip item. Admin dapat menghapus selama sesi masih dibuka.
 * @param {object} o pesanan @param {boolean} admin @param {string} status status sesi
 */
function itemChip(o, admin, status) {
  const hapus = admin && status === 'open'
    ? '<button type="button" class="x" data-act="del" data-id="' + esc(o.id) + '" aria-label="Hapus ' + esc(label(o)) + '">✕</button>'
    : '';
  return '<span class="it">' + esc(label(o)) + hapus + '</span>';
}

/** Pil Lunas/Belum. Admin: tombol yang bisa diketuk; penitip: label biasa. */
function paidPill(g, admin, k) {
  const teks = g.paid ? '✓ Lunas' : 'Belum';
  const cls = 'pill ' + (g.paid ? 'ok' : 'no');
  return admin
    ? '<button type="button" class="' + cls + '" data-act="tog" data-k="' + k + '">' + teks + '</button>'
    : '<span class="' + cls + '">' + teks + '</span>';
}

/** HTML satu baris orang. */
function personRow(g, admin, status) {
  const k = esc(key(g.nama));
  const bukti = g.os.find((o) => safeUrl(o.bukti));
  const kanan = status === 'settled'
    ? '<div class="r"><div class="num">' + rp(g.sum) + '</div>' + paidPill(g, admin, k) +
      (bukti ? '<a class="bk" target="_blank" rel="noopener noreferrer" href="' + esc(safeUrl(bukti.bukti)) + '">Lihat bukti</a>' : '') + '</div>'
    : '';
  return (
    '<div class="row"><span class="av" aria-hidden="true">' + esc(([...g.nama][0] || '?').toUpperCase()) + '</span>' +
    '<div class="rb"><b>' + esc(g.nama) + '</b><div class="its">' + g.os.map((o) => itemChip(o, admin, status)).join('') + '</div></div>' + kanan + '</div>'
  );
}

/**
 * Kartu daftar titipan lengkap.
 * @param {boolean} admin true = tampilan admin (ada tombol hapus & centang lunas)
 */
export function orderListHTML(admin) {
  const c = hitungRekap();
  const status = state.sesi.status;
  const kosong = '<p class="mu empty">Belum ada titipan.' +
    (admin ? ' Bagikan link ke WA supaya teman bisa mengisi.' : ' Jadi yang pertama titip.') + '</p>';
  return (
    '<div class="card"><div class="ch"><h2>Daftar titipan</h2><span class="cnt">' + c.grup.length + ' orang</span></div>' +
    (c.grup.map((g) => personRow(g, admin, status)).join('') || kosong) + '</div>'
  );
}
