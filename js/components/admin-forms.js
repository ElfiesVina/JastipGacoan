/**
 * js/components/admin-forms.js
 * HTML untuk halaman admin/jastip: login, profil, sesi baru, daftar sesi,
 * kartu kontrol, dan form harga. Hanya membuat HTML.
 */
import { state } from '../core/state.js';
import { esc } from '../core/dom.js';
import { STATUS_LABEL } from '../core/constants.js';
import { waLink } from '../core/format.js';
import { hargaDasar, linkSesi, pajak, teksRekap } from '../services/calc.js';
import { orderListHTML } from './order-list.js';
import { recapCardHTML } from './recap-card.js';



/** Kartu profil jastip. */
const profileCard = () =>
  '<form class="card" data-form="prof"><h2>Profil jastip</h2>' +
  '<label class="lb" for="pn">Nama</label><input id="pn" autocomplete="name" placeholder="Nama" value="' + esc(state.profil?.nama || '') + '">' +
  '<label class="lb" for="pr">Info transfer</label><input id="pr" placeholder="DANA 0812… a.n. Nama" value="' + esc(state.profil?.rek || '') + '">' +
  '<label class="lb" for="pwa">Nomor WA</label><input id="pwa" inputmode="tel" placeholder="62812…" value="' + esc(state.profil?.wa || '') + '">' +
  '<div class="acts"><button type="submit">Simpan profil</button><button type="button" class="gh" data-act="out">Keluar</button></div></form>';

/** Kartu "Sesi baru". */
const newSessionCard = () =>
  '<form class="card" data-form="news"><h2>Sesi baru</h2>' +
  '<label class="lb" for="jd">Judul</label><input id="jd" placeholder="mis. Gacoan Jumat malam">' +
  '<button class="pk b" type="submit">Buat sesi</button></form>';

/** Kartu "Sesi saya". @param {Array|null} data daftar sesi @param {*} error galat jika gagal */
function mySessionsCard(data, error) {
  const baris = (data || []).map((s) =>
    '<a class="srow" href="#/a/' + esc(s.kode) + '"><span><b>' + esc(s.judul || s.kode) + '</b><span class="mu" style="display:block">' +
    esc(s.tgl || '') + '</span></span><span class="s-' + esc(s.status) + '">' + esc(STATUS_LABEL[s.status] || s.status) + '</span></a>').join('');
  return (
    '<div class="card"><h2>Sesi saya</h2>' +
    (error ? '<p class="mu">Gagal memuat sesi.</p>' : baris || '<p class="mu" style="margin:0">Belum ada sesi. Buat satu di atas.</p>') + '</div>'
  );
}

/** Halaman dashboard lengkap (profil + sesi baru + daftar sesi). */
export const dashboardHTML = (data, error) => profileCard() + newSessionCard() + mySessionsCard(data, error);

/** Tombol ganti status sesi. @param {string} t teks @param {string} v status tujuan @param {string} c kelas */
const statusBtn = (t, v, c) => '<button type="button" class="' + c + '" data-act="sets" data-s="' + v + '">' + t + '</button>';

/** Tombol "Segarkan". */
const reloadBtn = '<button type="button" class="gh" data-act="reload">Segarkan</button>';

/** Pembuka kartu kontrol (link sesi + tombol salin). Kartu ditutup oleh pemanggil. */
const controlHead = () =>
  '<div class="card"><h2>Kontrol</h2><a href="#/">← Semua sesi</a><div class="lb">Link untuk penitip</div>' +
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
  return atas + '<div id="l">' + orderListHTML(true) + '</div>' + (s === 'settled' ? recapCardHTML() : '');
}
