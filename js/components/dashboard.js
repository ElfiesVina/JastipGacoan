/**
 * js/components/dashboard.js
 * HTML beranda jastip: kartu navigasi, sesi aktif, buat sesi, sesi saya, dan kerangka halaman.
 * Hanya membuat HTML. Urutan di layar: profil, navigasi, sesi aktif, buat sesi, sesi saya.
 * (Panel Kelola Co Jastip sudah pindah ke tab Admin di bottom nav.)
 */
import { esc } from '../core/dom.js';
import { STATUS_LABEL } from '../core/constants.js';
import { PROFILE_ICON } from './profile-icons.js';

export const SECTION_CREATE_ID = 'section-create';
export const SECTION_ACTIVE_ID = 'section-active';
export const SECTION_MINE_ID = 'section-mine';

/** Kartu CTA yang menggulir halus ke bagiannya. Tombol "Sesi Aktif" hanya ada bila ada sesi berjalan. @param {number} activeCount */
const navigationHTML = (activeCount) =>
  '<nav class="nav-card" aria-label="Pintasan beranda">' +
  '<button type="button" class="nav-button nav-button-accent" data-act="scroll-to" data-target="' + SECTION_CREATE_ID + '">' +
  '<span class="nav-icon">' + PROFILE_ICON.calendarPlus + '</span><span class="nav-label">Buat Sesi</span>' + PROFILE_ICON.chevron + '</button>' +
  (activeCount
    ? '<button type="button" class="nav-button" data-act="scroll-to" data-target="' + SECTION_ACTIVE_ID + '">' +
      '<span class="nav-icon">' + PROFILE_ICON.activity + '</span><span class="nav-label">Sesi Aktif</span>' +
      '<span class="nav-count">' + activeCount + '</span>' + PROFILE_ICON.chevron + '</button>'
    : '') +
  '<button type="button" class="nav-button" data-act="scroll-to" data-target="' + SECTION_MINE_ID + '">' +
  '<span class="nav-icon">' + PROFILE_ICON.user + '</span><span class="nav-label">Sesi Saya</span>' + PROFILE_ICON.chevron + '</button></nav>';

/** Satu kartu sesi aktif dengan jumlah order asli. @param {object} session @param {{total:number,unpaid:number}} [orders] */
const activeSessionHTML = (session, orders) => {
  const summary = orders || { total: 0, unpaid: 0 };
  return (
    '<a class="active-card" href="#/a/' + esc(session.kode) + '">' +
    '<div class="active-top"><span class="active-kicker">Sesi aktif</span><span class="s-' + esc(session.status) + '">' + esc(STATUS_LABEL[session.status] || session.status) + '</span></div>' +
    '<h2 class="active-title">' + esc(session.judul || session.kode) + '</h2>' +
    '<p class="active-meta">' + PROFILE_ICON.clock + '<span>' + esc(session.tgl || '') + '</span></p>' +
    '<div class="active-counts"><span><b>' + summary.total + '</b> order</span><span><b>' + summary.unpaid + '</b> belum bayar</span></div></a>'
  );
};

/** Kartu "Buat sesi baru". */
const createSessionHTML = () =>
  '<form class="card create-card" id="' + SECTION_CREATE_ID + '" data-form="news"><h2>Buat sesi baru</h2>' +
  '<p class="mu create-note">Linknya langsung muncul di halaman Jastiper di perangkat ini, lalu bagikan ke penitip.</p>' +
  '<label class="lb" for="jd">Judul</label><input id="jd" placeholder="mis. Gacoan Jumat malam">' +
  '<button class="pk b" type="submit">Buat sesi</button></form>';

/** Kartu "Sesi saya". @param {Array|null} sessions @param {*} error */
function mySessionsHTML(sessions, error) {
  const rows = (sessions || []).map((s) =>
    '<a class="srow" href="#/a/' + esc(s.kode) + '"><span class="srt"><b>' + esc(s.judul || s.kode) + '</b><span class="mu">' +
    esc(s.tgl || '') + ' · ' + esc(s.kode) + '</span></span><span class="s-' + esc(s.status) + '">' + esc(STATUS_LABEL[s.status] || s.status) + '</span></a>').join('');
  const empty = '<div class="dempty"><b>Belum ada sesi</b><span>Buat sesi pertamamu lewat kartu “Buat sesi baru”.</span></div>';
  return '<div class="card mine-card" id="' + SECTION_MINE_ID + '"><h2>Sesi saya</h2>' +
    (error ? '<p class="mu">Gagal memuat sesi.</p>' : rows || empty) + '</div>';
}

/**
 * Kerangka beranda. `profileHTML` sudah jadi (kartu atau form). Bagian sesi hanya ada bila profil lengkap.
 * @param {{profileHTML:string, complete:boolean, sessions:Array|null, error:*, activeSessions:Array, orderSummary:object}} model
 */
export function dashboardHTML({ profileHTML, complete, sessions, error, activeSessions, orderSummary }) {
  const slot = (cls, html, id) => '<div class="dash-slot ' + cls + '"' + (id ? ' id="' + id + '"' : '') + '>' + html + '</div>';
  const column = (cls, html) => '<div class="dash-column ' + cls + '">' + html + '</div>';
  const navigation = complete ? slot('slot-nav', navigationHTML(activeSessions.length)) : '';
  const sessionSlots = complete
    ? (activeSessions.length ? slot('slot-active', activeSessions.map((s) => activeSessionHTML(s, orderSummary[s.id])).join(''), SECTION_ACTIVE_ID) : '') +
      slot('slot-create', createSessionHTML()) + slot('slot-mine', mySessionsHTML(sessions, error))
    : '';
  return '<div class="dash">' + column('column-profile', slot('slot-profile', profileHTML) + navigation) + column('column-sessions', sessionSlots) + '</div>';
}
