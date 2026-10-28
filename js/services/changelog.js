/**
 * js/services/changelog.js
 * Logika "Yang baru": menghitung entri yang belum dibaca, mengisi
 * lonceng + teaser, dan membuka sheet. Status "sudah dibaca" disimpan
 * di localStorage tiap browser.
 */
import { CHANGELOG } from '../data/changelog-data.js';
import { $, $$, dlg, esc } from '../core/dom.js';
import { state } from '../core/state.js';
import { store } from '../core/storage.js';
import { LS_SEEN_PREFIX } from '../core/constants.js';

/** Semua entri, terbaru (id terbesar) di atas. */
const ALL = CHANGELOG.slice().sort((a, b) => b.id - a.id);

/** Entri yang relevan untuk peran saat ini (semua / admin / penitip). */
const forRole = () => ALL.filter((c) => !c.untuk || c.untuk === 'semua' || c.untuk === state.role);

/** Kunci localStorage untuk peran saat ini. */
const seenKey = () => LS_SEEN_PREFIX + state.role;

/**
 * id entri terakhir yang sudah dibaca.
 * Pengguna baru: entri yang lebih tua dari 14 hari dianggap sudah dibaca
 * supaya mereka tidak dibanjiri riwayat lama.
 */
function seenId() {
  const v = store.get(seenKey());
  if (v !== null) return +v || 0;
  const batas = Date.now() - 14 * 864e5;
  return Math.max(0, ...forRole().filter((c) => new Date(c.tgl + 'T00:00') < batas).map((c) => c.id));
}

/** Entri yang belum dibaca. */
const unread = () => {
  const s = seenId();
  return forRole().filter((c) => c.id > s);
};

/** Perbarui angka di lonceng dan teaser di atas halaman. */
export function renderChangelogBadge() {
  const u = unread();
  const b = $('#bdg');
  b.hidden = !u.length;
  b.textContent = u.length > 9 ? '9+' : u.length;
  $$('.auth-dot').forEach((dot) => { // badge angka di lonceng layar masuk (ada di dua halaman geser)
    dot.hidden = !u.length;
    dot.textContent = u.length > 9 ? '9+' : u.length;
  });
  $('#cl').innerHTML = ''; // pembaruan hanya ditandai badge di lonceng, tanpa banner/popup
}

/** HTML satu entri. @param {object} c entri @param {boolean} baru tandai "Baru" */
function entryHTML(c, baru) {
  const tgl = new Date(c.tgl + 'T00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  return (
    '<article class="en' + (baru ? ' nw' : '') + '"><div class="eh">' +
    (baru ? '<span class="nb">Baru</span>' : '') +
    '<span class="tg">' + esc(c.jenis || 'Info') + '</span>' +
    '<time datetime="' + esc(c.tgl) + '">' + esc(tgl) + '</time>' +
    (c.v ? '<span>v' + esc(c.v) + '</span>' : '') +
    '</div><h4>' + esc(c.judul) + '</h4><ul>' +
    (c.poin || []).map((p) => '<li>' + esc(p) + '</li>').join('') +
    '</ul></article>'
  );
}

/** Buka sheet changelog, tandai semua sudah dibaca, lalu segarkan lonceng. */
export function openChangelog() {
  const list = forRole();
  const sn = seenId();
  $('#dlt').textContent = 'Yang baru'; // sheet ini juga dipakai form pengajuan
  $('#dl').innerHTML = list.length
    ? list.map((c) => entryHTML(c, c.id > sn)).join('')
    : '<p class="mu" style="padding-top:16px">Belum ada catatan perubahan.</p>';
  $('#dl').scrollTop = 0;
  if (list.length) store.set(seenKey(), list[0].id);
  dlg.showModal ? dlg.showModal() : dlg.setAttribute('open', '');
  renderChangelogBadge();
}
