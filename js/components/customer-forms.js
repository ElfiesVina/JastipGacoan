/**
 * js/components/customer-forms.js
 * Form milik penitip: "Titip sekarang" dan "Sudah bayar?".
 * Hanya membuat HTML (dan menyinkronkan pilihan); tidak bicara ke database.
 */
import { CFG } from '../config.js';
import { $, $$, esc } from '../core/dom.js';
import { state, draft } from '../core/state.js';
import { key, isMie, rp } from '../core/format.js';
import { LEVELS } from '../core/constants.js';
import { hitungRekap } from '../services/calc.js';

/** Satu kartu pilihan (radio). */
function optionCard(name, value, title, sub) {
  return (
    '<label class="opt"><input class="vh" type="radio" name="' + name + '" value="' + esc(value) + '">' +
    '<span class="box"><span class="tx"><span class="ot">' + esc(title) + '</span>' + (sub || '') + '</span><span class="ck"></span></span></label>'
  );
}

/** HTML form "Titip sekarang": nama, pilih menu, level pedas (hanya Mie), tombol. */
export function orderFormHTML() {
  const menu = CFG.MENU.map((m) => optionCard('item', m, m, isMie(m) ? '<span class="sub">Bisa pilih level pedas</span>' : '')).join('');
  const level = LEVELS.map((n) =>
    '<label class="lv"><input class="vh" type="radio" name="level" value="' + n + '"><span style="--h:' + n + '">' + n + '</span></label>').join('');
  return (
    '<form class="card" data-form="kirim" novalidate><h2>Titip sekarang</h2>' +
    '<label class="lb" for="n">Nama</label>' +
    '<input id="n" autocomplete="name" autocapitalize="words" enterkeyhint="done" maxlength="60" placeholder="Nama kamu" value="' + esc(draft.n) + '">' +
    '<div class="lb" id="lm">Pesanan</div><div class="opts" role="radiogroup" aria-labelledby="lm">' + menu + '</div>' +
    '<div class="lvw" id="lw"><div class="lvi"><div class="lb" id="ll">Level pedas</div>' +
    '<div class="lvs" role="radiogroup" aria-labelledby="ll">' + level + '</div>' +
    '<div class="mu hint">1 paling ringan, 8 paling pedas. Ketuk lagi untuk batal.</div></div></div>' +
    '<button class="b" id="go" type="submit">Titip</button></form>'
  );
}

/**
 * Samakan tampilan radio dengan `draft`, tampilkan/sembunyikan level pedas.
 * Dipanggil setiap pilihan berubah atau form selesai digambar.
 */
export function syncChoice() {
  $$('input[name=item]').forEach((r) => (r.checked = r.value === draft.i));
  const mie = isMie(draft.i);
  if (!mie) draft.l = ''; // level hanya berlaku untuk Mie
  $$('input[name=level]').forEach((r) => (r.checked = r.value === draft.l));
  const w = $('#lw');
  if (w) w.classList.toggle('on', mie);
}

/** HTML form "Sudah bayar?": pilih nama + foto bukti. */
export function payFormHTML() {
  const pilihan = hitungRekap().grup.map((g) => optionCard('who', key(g.nama), g.nama, '<span class="sub">' + rp(g.sum) + '</span>')).join('');
  return (
    '<form class="card" data-form="bayar" novalidate><h2>Sudah bayar?</h2>' +
    '<div class="lb" id="lwho">Pilih namamu</div><div class="opts cmp" role="radiogroup" aria-labelledby="lwho">' + pilihan + '</div>' +
    '<div class="lb">Bukti transfer (foto)</div>' +
    '<label class="file" id="fl"><input class="vh" type="file" id="bk" accept="image/*"><span id="fn">Pilih foto bukti</span></label>' +
    '<button class="b pk" id="pay" type="submit">Centang lunas & kirim</button></form>'
  );
}

/** Pulihkan pilihan nama di form bayar dari `draft` (setelah form digambar). */
export function syncWho() {
  $$('input[name=who]').forEach((r) => (r.checked = r.value === draft.who));
}
