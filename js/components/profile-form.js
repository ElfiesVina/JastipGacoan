/**
 * js/components/profile-form.js
 * Form ubah profil jastip. Hanya membuat HTML; penyimpanan ada di views/admin-profile.js.
 */
import { esc } from '../core/dom.js';
import { t } from '../core/i18n.js';
import {
  SOCIAL_APPS, SOCIAL_DISPLAY, SOCIAL_SLOTS, EWALLET_OPTIONS, BANK_OPTIONS, MAX_QUOTE_LENGTH, MAX_SEMESTER,
} from '../data/profile-options.js';
import { PROFILE_ICON, DEFAULT_AVATAR_SVG } from './profile-icons.js';

/** Satu <option>. @param {string} value @param {string} label @param {*} selected nilai terpilih */
const option = (value, label, selected) =>
  '<option value="' + esc(value) + '"' + (String(selected ?? '') === String(value) ? ' selected' : '') + '>' + esc(label) + '</option>';

/** Kolom teks berlabel. */
const field = (id, label, attrs, value) =>
  '<label class="form-label" for="' + id + '">' + label + '</label>' +
  '<input class="form-input" id="' + id + '" name="' + id + '" value="' + esc(value) + '" ' + attrs + '>';

/** Pilihan berlabel. */
const select = (id, label, optionsHTML) =>
  '<label class="form-label" for="' + id + '">' + label + '</label><select class="form-input" id="' + id + '" name="' + id + '">' + optionsHTML + '</select>';

/** Baris media sosial ke-i (aplikasi, cara tampil, akun). */
function socialRowHTML(item, index) {
  const row = item || {};
  return (
    '<div class="social-row">' +
    '<select class="form-input" name="social_app_' + index + '" aria-label="Aplikasi media sosial ' + (index + 1) + '">' +
    option('', t('f.pick'), row.app) + SOCIAL_APPS.map((a) => option(a.value, a.label, row.app)).join('') + '</select>' +
    '<select class="form-input" name="social_show_' + index + '" aria-label="Yang ditampilkan">' +
    SOCIAL_DISPLAY.map((d) => option(d.value, d.label, row.tampil || 'aplikasi')).join('') + '</select>' +
    '<input class="form-input" name="social_user_' + index + '" placeholder="' + esc(t('f.accountPh')) + '" maxlength="40" value="' + esc(row.akun || '') + '" aria-label="Nama akun">' +
    '</div>'
  );
}

/** Satu bagian form berkotak (judul + isi). */
const block = (title, inner) => '<section class="form-block"><h3 class="form-section">' + title + '</h3>' + inner + '</section>';

/**
 * Form profil terisi data yang tersimpan. Dibagi lima kotak: foto, data diri, kontak & pembayaran,
 * media sosial, tampilan e-wallet/bank. Nama kolom (name=...) tidak berubah dari versi sebelumnya.
 * @param {object|null} profile profil dari database @param {string} fallbackName nama bawaan
 */
export function profileFormHTML(profile, fallbackName) {
  const p = profile || {};
  const semesters = Array.from({ length: MAX_SEMESTER }, (_, i) => option(i + 1, t('p.semester', { n: i + 1 }), p.semester)).join('');
  const sosmed = Array.isArray(p.sosmed) ? p.sosmed : [];
  const ph = (key) => 'placeholder="' + esc(t(key)) + '"';

  const photo = block(t('f.photo'),
    '<div class="photo-picker"><div class="profile-avatar" id="photo-preview">' +
    (p.foto ? '<img src="' + esc(p.foto) + '" alt="' + esc(t('p.photoAlt')) + '">' : DEFAULT_AVATAR_SVG) + '</div>' +
    '<div class="photo-side"><label class="photo-button" for="pfoto">' + PROFILE_ICON.camera + t('f.change') + '</label>' +
    '<p class="form-note">' + t('f.photoNote') + '</p></div>' +
    '<input class="vh visually-hidden" id="pfoto" type="file" accept="image/*"></div>');

  const identity = block(t('f.identity'),
    field('nama', t('f.name'), 'autocomplete="name" maxlength="60" ' + ph('f.namePh'), p.nama || fallbackName) +
    field('kampus', t('f.campus'), 'maxlength="80" ' + ph('f.campusPh'), p.kampus) +
    field('jurusan', t('f.major'), 'maxlength="80" ' + ph('f.majorPh'), p.jurusan) +
    select('semester', t('f.sem'), option('', t('f.semPick'), p.semester) + semesters) +
    '<label class="form-label" for="kutipan">' + t('f.quote') + '</label>' +
    '<textarea class="form-input" id="kutipan" name="kutipan" rows="3" maxlength="' + MAX_QUOTE_LENGTH + '" ' + ph('f.quotePh') + '>' + esc(p.kutipan || '') + '</textarea>');

  const payment = block(t('f.contact'),
    field('wa', t('f.wa'), 'inputmode="tel" placeholder="0812…"', p.wa) +
    '<p class="form-note">' + t('f.waNote') + '</p>' +
    field('rek', t('f.rek'), 'maxlength="120" placeholder="DANA 0812… a.n. Nama"', p.rek) +
    '<p class="form-note">' + t('f.rekNote') + '</p>');

  const social = block(t('f.social'),
    '<div class="social-head" aria-hidden="true"><span>' + t('f.colApp') + '</span><span>' + t('f.colShow') + '</span><span class="social-head-user">' + t('f.colUser') + '</span></div>' +
    Array.from({ length: SOCIAL_SLOTS }, (_, i) => socialRowHTML(sosmed[i], i)).join(''));

  const shown = block(t('f.shown'),
    select('ewallet', t('f.ewallet'), option('', t('f.none'), p.ewallet) + EWALLET_OPTIONS.map((n) => option(n, n, p.ewallet)).join('')) +
    select('bank', t('f.bank'), option('', t('f.none'), p.bank) + BANK_OPTIONS.map((n) => option(n, n, p.bank)).join('')) +
    '<p class="form-note">' + t('f.statusNote') + '</p>');

  return (
    '<form class="profile-card profile-form" id="profile-form" data-form="prof" novalidate>' +
    '<h2 class="form-title">' + t('f.title') + '</h2>' + photo + identity + payment + social + shown +
    '<div class="profile-actions form-actions"><button type="submit" class="profile-button-primary">' + t('f.save') + '</button>' +
    '<button type="button" class="profile-button-ghost" data-act="profile-cancel">' + t('f.cancel') + '</button></div>' +
    '</form>'
  );
}
