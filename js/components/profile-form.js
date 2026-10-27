/**
 * js/components/profile-form.js
 * Form ubah profil jastip. Hanya membuat HTML; penyimpanan ada di views/admin-profile.js.
 */
import { esc } from '../core/dom.js';
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
    option('', '— Pilih —', row.app) + SOCIAL_APPS.map((a) => option(a.value, a.label, row.app)).join('') + '</select>' +
    '<select class="form-input" name="social_show_' + index + '" aria-label="Yang ditampilkan">' +
    SOCIAL_DISPLAY.map((d) => option(d.value, d.label, row.tampil || 'aplikasi')).join('') + '</select>' +
    '<input class="form-input" name="social_user_' + index + '" placeholder="nama akun" maxlength="40" value="' + esc(row.akun || '') + '" aria-label="Nama akun">' +
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
  const semesters = Array.from({ length: MAX_SEMESTER }, (_, i) => option(i + 1, 'Semester ' + (i + 1), p.semester)).join('');
  const sosmed = Array.isArray(p.sosmed) ? p.sosmed : [];

  const photo = block('Foto profil',
    '<div class="photo-picker"><div class="profile-avatar" id="photo-preview">' +
    (p.foto ? '<img src="' + esc(p.foto) + '" alt="Foto profil">' : DEFAULT_AVATAR_SVG) + '</div>' +
    '<div class="photo-side"><label class="photo-button" for="pfoto">' + PROFILE_ICON.camera + 'Ganti foto</label>' +
    '<p class="form-note">Foto tampil potret (3:4). Bagian tengah foto yang dipakai.</p></div>' +
    '<input class="vh visually-hidden" id="pfoto" type="file" accept="image/*"></div>');

  const identity = block('Data diri',
    field('nama', 'Nama jastip', 'autocomplete="name" maxlength="60" placeholder="Nama"', p.nama || fallbackName) +
    field('kampus', 'Universitas', 'maxlength="80" placeholder="mis. Universitas Indonesia"', p.kampus) +
    field('jurusan', 'Jurusan', 'maxlength="80" placeholder="mis. Informatika"', p.jurusan) +
    select('semester', 'Semester', option('', 'Pilih semester', p.semester) + semesters) +
    '<label class="form-label" for="kutipan">Kutipan</label>' +
    '<textarea class="form-input" id="kutipan" name="kutipan" rows="3" maxlength="' + MAX_QUOTE_LENGTH + '" placeholder="Satu kalimat tentang kamu">' + esc(p.kutipan || '') + '</textarea>');

  const payment = block('Kontak &amp; pembayaran',
    field('wa', 'Nomor WhatsApp', 'inputmode="tel" placeholder="0812…"', p.wa) +
    '<p class="form-note">Nomor tersimpan di database dan tidak tampil di profil. Profil hanya menampilkan tulisan “WhatsApp”.</p>' +
    field('rek', 'Info transfer untuk penitip', 'maxlength="120" placeholder="DANA 0812… a.n. Nama"', p.rek) +
    '<p class="form-note">Dipakai di halaman bayar penitip seperti sebelumnya. Tidak tampil di kartu profil.</p>');

  const social = block('Media sosial',
    '<div class="social-head" aria-hidden="true"><span>Aplikasi</span><span>Tampil</span><span class="social-head-user">Akun</span></div>' +
    Array.from({ length: SOCIAL_SLOTS }, (_, i) => socialRowHTML(sosmed[i], i)).join(''));

  const shown = block('Tampil di profil',
    select('ewallet', 'E-Wallet (nama saja)', option('', '— Tidak ditampilkan —', p.ewallet) + EWALLET_OPTIONS.map((n) => option(n, n, p.ewallet)).join('')) +
    select('bank', 'Bank (nama saja)', option('', '— Tidak ditampilkan —', p.bank) + BANK_OPTIONS.map((n) => option(n, n, p.bank)).join('')) +
    '<p class="form-note">Status Online/Offline otomatis mengikuti kamu masuk/keluar akun, tidak perlu diatur manual.</p>');

  return (
    '<form class="profile-card profile-form" id="profile-form" data-form="prof" novalidate>' +
    '<h2 class="form-title">Edit profil</h2>' + photo + identity + payment + social + shown +
    '<div class="profile-actions form-actions"><button type="submit" class="profile-button-primary">Simpan</button>' +
    '<button type="button" class="profile-button-ghost" data-act="profile-cancel">Batal</button></div>' +
    '</form>'
  );
}
