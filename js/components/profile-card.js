/**
 * js/components/profile-card.js
 * HTML kartu profil jastip (tampilan baca). Hanya membuat HTML, tanpa logika data.
 * Info yang tampil publik: nama aplikasi/akun saja, tidak pernah nomor WA, rekening, atau e-wallet.
 */
import { esc } from '../core/dom.js';
import { t } from '../core/i18n.js';
import { roleLabels, publicContactRows, isProfileComplete } from '../services/profile-rules.js';
import { PROFILE_ICON, contactIcon, DEFAULT_AVATAR_SVG } from './profile-icons.js';

/** Foto profil atau siluet bawaan. */
const avatarHTML = (photo) =>
  '<div class="profile-avatar">' +
  (photo ? '<img src="' + esc(photo) + '" alt="' + t('p.photoAlt') + '">' : DEFAULT_AVATAR_SVG) + '</div>';

/**
 * Pil Online/Offline. Hanya penanda (bukan tombol) — statusnya otomatis mengikuti
 * sesi login (lihat services/presence.js), jadi tidak bisa diketuk untuk diubah manual.
 */
function statusHTML(isOnline) {
  const state = isOnline ? 'is-online' : 'is-offline';
  const label = isOnline ? t('p.online') : t('p.offline');
  return '<span class="profile-status ' + state + '">' + label + '</span>';
}

/** Tiga baris: universitas, jurusan, semester. */
function schoolHTML(profile) {
  const rows = [
    [PROFILE_ICON.school, profile.kampus],
    [PROFILE_ICON.book, profile.jurusan],
    [PROFILE_ICON.semester, profile.semester ? t('p.semester', { n: profile.semester }) : ''],
  ].filter((row) => row[1]);
  return rows.length
    ? '<ul class="profile-school">' + rows.map((r) => '<li>' + r[0] + '<span>' + esc(r[1]) + '</span></li>').join('') + '</ul>'
    : '';
}

/** Daftar kontak publik: WhatsApp, sosmed, e-wallet, bank (hanya nama). */
function contactsHTML(profile) {
  const rows = publicContactRows(profile);
  return rows.length
    ? '<ul class="profile-contacts">' + rows.map((r) =>
      '<li><span class="contact-name">' + contactIcon(r.icon) + esc(r.name) + '</span><span class="contact-value">' + esc(r.value) + '</span></li>').join('') + '</ul>'
    : '';
}

/** Tiga angka ringkasan: label di atas, angka di bawahnya. */
const statsHTML = (stats) =>
  '<dl class="profile-stats">' +
  [[t('p.stat.total'), stats.total], [t('p.stat.open'), stats.dibuka], [t('p.stat.recap'), stats.rekap]].map((s) =>
    '<div class="stat-item"><dt>' + s[0] + '</dt><dd>' + s[1] + '</dd></div>').join('') + '</dl>';

/** Detail profil: tombol Edit dan Keluar (Keluar hanya ada di sini). */
const detailHTML = (canEdit) =>
  '<details class="profile-detail"><summary><span>' + t('p.detail') + '</span>' + PROFILE_ICON.chevronDown + '</summary>' +
  '<div class="profile-actions">' +
  (canEdit ? '<button type="button" class="profile-button-primary" data-act="profile-edit">' + PROFILE_ICON.pencil + t('p.edit') + '</button>' : '') +
  '<button type="button" class="profile-button-danger" data-act="out">' + PROFILE_ICON.logout + t('p.logout') + '</button>' +
  '</div></details>';

/**
 * Kartu profil.
 * @param {{profile:object|null, displayName:string, stats:{total:number,dibuka:number,rekap:number}, email?:string}} model
 */
export function profileCardHTML({ profile, displayName, stats, email }) {
  const data = profile || {};
  const complete = isProfileComplete(profile);
  const header =
    '<div class="profile-main">' + avatarHTML(data.foto) +
    '<div class="profile-identity"><div class="profile-name-row"><h2 class="profile-name">' + esc(data.nama || displayName) + '</h2>' +
    statusHTML(Boolean(data.online) && complete) + '</div>' +
    '<p class="profile-role">' + esc(roleLabels(data, email).join(' · ')) + '</p>' + (complete ? schoolHTML(data) : '') + '</div></div>';

  if (!complete) {
    return (
      '<section class="profile-card profile-card-new" id="profile-card">' + header +
      '<div class="profile-cta">' + PROFILE_ICON.profileDoc + '<p class="profile-cta-text">' + t('p.incomplete') + '</p>' +
      '<button type="button" class="profile-button-primary" data-act="profile-edit">' + t('p.complete') + '</button></div>' +
      detailHTML(false) + '</section>'
    );
  }
  return (
    '<section class="profile-card" id="profile-card">' + header +
    (data.kutipan ? '<blockquote class="profile-quote">' + esc(data.kutipan) + '</blockquote>' : '') +
    contactsHTML(data) + statsHTML(stats) + detailHTML(true) + '</section>'
  );
}
