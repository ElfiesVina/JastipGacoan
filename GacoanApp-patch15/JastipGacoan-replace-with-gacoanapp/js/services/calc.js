/**
 * js/services/calc.js
 * Semua perhitungan uang dan pembuatan teks/link rekap.
 * Membaca `state.sesi` (harga, pajak, fee) dan `state.pesanan`.
 */
import { state } from '../core/state.js';
import { key, label, rp } from '../core/format.js';

/** Persentase pajak gerai (PB1) sesi ini; 0 jika tidak valid. */
export const pajak = () => +state.sesi.pajak || 0;

/**
 * Harga dasar (sebelum pajak) sebuah menu.
 * Memakai hasOwnProperty agar nama menu seperti "constructor" tidak merusak hitungan.
 */
export const hargaDasar = (item) =>
  Object.prototype.hasOwnProperty.call(state.sesi.prices || {}, item) ? +state.sesi.prices[item] || 0 : 0;

/** Harga satu pesanan setelah pajak, dibulatkan ke Rp100 terdekat. */
export const hargaItem = (o) => Math.round((hargaDasar(o.item) * (1 + pajak() / 100)) / 100) * 100;

/**
 * Hitung rekap lengkap.
 * Pesanan dikelompokkan per orang (nama dibandingkan tanpa peduli besar-kecil huruf).
 * @returns {{grup:Array, sub:number, pb1:number, fee:number, tot:number, rnd:number}}
 *   grup: [{nama, os:[pesanan], sum, paid}]; rnd = selisih pembulatan.
 */
export function hitungRekap() {
  const peta = {};
  state.pesanan.forEach((o) => {
    const k = key(o.nama);
    (peta[k] = peta[k] || { nama: o.nama.trim(), os: [] }).os.push(o);
  });
  const grup = Object.values(peta);
  let sub = 0, tot = 0;
  grup.forEach((g) => {
    g.sum = g.os.reduce((s, o) => s + hargaItem(o), 0) + state.sesi.fee; // total per orang
    g.paid = g.os.every((o) => o.paid);                                   // lunas jika semua pesanannya lunas
    sub += g.os.reduce((s, o) => s + hargaDasar(o.item), 0);
    tot += g.sum;
  });
  const pb1 = Math.round((sub * pajak()) / 100);
  const fee = state.sesi.fee * grup.length;
  return { grup, sub, pb1, fee, tot, rnd: tot - sub - pb1 - fee };
}

/** Link sesi yang dibagikan ke penitip. */
export const linkSesi = () => location.origin + location.pathname + '#/s/' + state.sesi.kode;

/** Teks rekap siap kirim ke WhatsApp. */
export function teksRekap() {
  const c = hitungRekap();
  return (
    '*Daftar Titipan Gacoan*\n' +
    c.grup.map((g, i) => i + 1 + '. ' + g.nama + ' – ' + g.os.map(label).join(' + ') + ' = ' + rp(g.sum)).join('\n') +
    '\n\nTotal: ' + rp(c.tot) +
    '\nTransfer: ' + (state.sesi.rek || '-') +
    '\nCentang bayar & kirim bukti: ' + linkSesi()
  );
}
