/**
 * js/components/admin-forms.js
 * HTML untuk detail sesi admin: kartu kontrol dan form harga. Hanya membuat HTML.
 * (Beranda & profil ada di components/dashboard.js dan profile-card.js.)
 */
import { state } from '../core/state.js';
import { esc } from '../core/dom.js';
import { waLink } from '../core/format.js';
import { hargaDasar, linkSesi, pajak, teksRekap } from '../services/calc.js';
import { orderListHTML } from './order-list.js';
import { recapCardHTML } from './recap-card.js';



/** Tombol ganti status sesi. @param {string} t teks @param {string} v status tujuan @param {string} c kelas */
const statusBtn = (t, v, c) => '<button type="button" class="' + c + '" data-act="sets" data-s="' + v + '">' + t + '</button>';

/** Tombol "Segarkan". */
const reloadBtn = '<button type="button" class="gh" data-act="reload">Segarkan</button>';

/** Pembuka kartu kontrol (link sesi + tombol salin). Kartu ditutup oleh pemanggil. */
const controlHead = () =>
  '<div class="card"><h2>Kontrol</h2><a class="back-link" href="#/">← Semua sesi</a><div class="lb">Link untuk penitip</div>' +
  '<div class="lk">' + esc(linkSesi()) + '</div><div class="acts"><button type="button" class="gh" data-act="copy">Salin link</button>';

/** Form harga per menu + pajak + fee (saat sesi ditutup). */
function priceFormHTML() {
  const menus = [...new Set(state.pesanan.map((o) => o.item))];
  const inputs = menus.map((i) =>
    '<label class="lb">' + esc(i) + '<input type="number" inputmode="numeric" min="0" data-p="' + esc(i) + '" value="' + (hargaDasar(i) || '') + '"></label>').join('');
  return (
    '<form class="card" data-form="settle"><h2>Harga & biaya</h2><div class="mu">Harga per porsi <b>sebelum pajak</b> (lihat struk)</div>' + inputs +
    '<label class="lb" for="pj">Pajak gerai (PB1 %)</label><input id="pj" type="number" inputmode="decimal" min="0" max="100" value="' + pajak() + '">' +
    '<label class="lb" for="fe">Fee jastip per orang (Rp)</label><input id="fe" type="number" inputmode="numeric" min="0" value="' + state.sesi.fee + '">' +
    '<div class="acts"><button type="submit" class="pk">Hitung & terbitkan rekap</button>' + statusBtn('Buka lagi', 'open', 'gh') + '</div></form>'
  );
}

/**
 * Halaman detail sesi untuk admin, sesuai status:
 *  open    -> kontrol + bagikan WA + tutup daftar
 *  closed  -> kontrol + form harga
 *  settled -> kontrol + kirim rekap + ubah harga
 */
export function sessionDetailHTML() {
  const s = state.sesi.status;
  let atas;
  if (s === 'open') {
    atas = controlHead() +
      '<a class="btn" target="_blank" rel="noopener" href="' + esc(waLink('', 'Titip Gacoan yuk! Isi nama, pesanan & level di sini: ' + linkSesi())) + '">Bagikan ke WA</a></div>' +
      '<div class="acts">' + statusBtn('Simpan & tutup daftar', 'closed', 'pk') + reloadBtn + '</div></div>';
  } else if (s === 'closed') {
    atas = controlHead() + '</div></div>' + priceFormHTML();
  } else {
    atas = controlHead() +
      '<a class="btn" target="_blank" rel="noopener" href="' + esc(waLink('', teksRekap())) + '">Kirim rekap ke WA</a></div>' +
      '<div class="acts">' + statusBtn('Ubah harga', 'closed', 'gh') + reloadBtn + '</div></div>';
  }
  // dua kolom di layar lebar/landscape: kiri = kontrol & harga, kanan = daftar titipan & rekap
  return '<div class="session-layout"><div class="session-main">' + atas + '</div><div class="session-side">' +
    '<div id="l">' + orderListHTML(true) + '</div>' + (s === 'settled' ? recapCardHTML() : '') + '</div></div>';
}
