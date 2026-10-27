/**
 * js/components/dashboard.js
 * HTML beranda jastip (hanya kartu profil + kartu pintasan) dan potongan HTML untuk halaman sesi:
 * #/buat (buat sesi), #/aktif (sesi aktif), #/sesi (sesi saya). Hanya membuat HTML.
 */
import { esc } from '../core/dom.js';
import { STATUS_LABEL } from '../core/constants.js';
import { t } from '../core/i18n.js';
import { PROFILE_ICON } from './profile-icons.js';

export const SECTION_CREATE_ID = 'section-create';

/** Teks status sesi menurut bahasa aktif (jatuh ke teks bawaan bila belum ada). @param {string} status */
const statusText = (status) => {
  const key = 'status.' + status;
  const text = t(key);
  return text === key ? (STATUS_LABEL[status] || status) : text;
};

/** Satu tautan pintasan. */
const shortcut = (href, icon, label, { accent = false, badge = 0 } = {}) =>
  '<a class="nav-button' + (accent ? ' nav-button-accent' : '') + '" href="' + href + '">' +
  '<span class="nav-icon">' + icon + '</span><span class="nav-label">' + label + '</span>' +
  (badge ? '<span class="nav-count">' + badge + '</span>' : '') + PROFILE_ICON.chevron + '</a>';

/** Kartu pintasan: tiga tautan ke halaman sendiri. @param {number} activeCount jumlah sesi aktif */
const navigationHTML = (activeCount) =>
  '<nav class="nav-card" aria-label="' + t('dash.shortcuts') + '">' +
  shortcut('#/buat', PROFILE_ICON.calendarPlus, t('dash.create'), { accent: true }) +
  shortcut('#/aktif', PROFILE_ICON.activity, t('dash.active'), { badge: activeCount }) +
  shortcut('#/sesi', PROFILE_ICON.user, t('dash.mine')) + '</nav>';

/** Satu kartu sesi aktif dengan jumlah order asli. @param {object} session @param {{total:number,unpaid:number}} [orders] */
export const activeSessionHTML = (session, orders) => {
  const summary = orders || { total: 0, unpaid: 0 };
  return (
    '<a class="active-card" href="#/a/' + esc(session.kode) + '">' +
    '<div class="active-top"><span class="active-kicker">' + t('active.kicker') + '</span><span class="s-' + esc(session.status) + '">' + esc(statusText(session.status)) + '</span></div>' +
    '<h2 class="active-title">' + esc(session.judul || session.kode) + '</h2>' +
    '<p class="active-meta">' + PROFILE_ICON.clock + '<span>' + esc(session.tgl || '') + '</span></p>' +
    '<div class="active-counts"><span><b>' + summary.total + '</b> ' + t('active.orders') + '</span><span><b>' + summary.unpaid + '</b> ' + t('active.unpaid') + '</span></div></a>'
  );
};

/** Halaman daftar sesi aktif (atau pesan kosong). @param {Array} sessions @param {object} orderSummary */
export const activeListHTML = (sessions, orderSummary) =>
  '<h2 class="page-title">' + t('dash.active') + '</h2>' +
  (sessions.length
    ? '<div class="active-list">' + sessions.map((s) => activeSessionHTML(s, orderSummary[s.id])).join('') + '</div>'
    : '<div class="dempty"><b>' + t('active.empty') + '</b><span>' + t('active.emptyNote') + '</span></div>');

/** Kartu "Buat sesi baru". */
export const createSessionHTML = () =>
  '<form class="card create-card" id="' + SECTION_CREATE_ID + '" data-form="news"><h2>' + t('create.title') + '</h2>' +
  '<p class="mu create-note">' + t('create.note') + '</p>' +
  '<label class="lb" for="jd">' + t('create.label') + '</label><input id="jd" placeholder="' + esc(t('create.ph')) + '">' +
  '<button class="pk b" type="submit">' + t('create.btn') + '</button></form>';

/** Kartu "Sesi saya". @param {Array|null} sessions @param {*} error */
export function mySessionsHTML(sessions, error) {
  const rows = (sessions || []).map((s) =>
    '<a class="srow" href="#/a/' + esc(s.kode) + '"><span class="srt"><b>' + esc(s.judul || s.kode) + '</b><span class="mu">' +
    esc(s.tgl || '') + ' · ' + esc(s.kode) + '</span></span><span class="s-' + esc(s.status) + '">' + esc(statusText(s.status)) + '</span></a>').join('');
  const empty = '<div class="dempty"><b>' + t('mine.empty') + '</b><span>' + t('mine.emptyNote') + '</span></div>';
  return '<div class="card mine-card"><h2>' + t('dash.mine') + '</h2>' +
    (error ? '<p class="mu">' + t('mine.error') + '</p>' : rows || empty) + '</div>';
}

/**
 * Kerangka beranda: kartu profil (atau form), lalu kartu pintasan bila profil sudah lengkap.
 * @param {{profileHTML:string, complete:boolean, activeCount:number}} model
 */
export function dashboardHTML({ profileHTML, complete, activeCount }) {
  const slot = (cls, html) => '<div class="dash-slot ' + cls + '">' + html + '</div>';
  return '<div class="dash dash-single"><div class="dash-column column-profile">' +
    slot('slot-profile', profileHTML) + (complete ? slot('slot-nav', navigationHTML(activeCount)) : '') + '</div></div>';
}
