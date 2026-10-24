/**
 * js/components/auth-forms.js
 * Layar MASUK dan DAFTAR (desain baru). Hanya membuat HTML.
 * Dua mode memakai kerangka yang sama (pita atas, logo, lonceng) dan hanya
 * beda isi form.
 */

import { CHANGELOG } from '../data/changelog-data.js';

/** Nomor versi terbaru dari catatan perubahan (untuk footer). */
const VERSI = (CHANGELOG.slice().sort((a, b) => b.id - a.id)[0] || {}).v || '';

/* Ikon-ikon inline (ikut warna teks lewat currentColor). */
const svg = (body, size = 20) =>
  '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + body + '</svg>';
const ICON = {
  user: svg('<circle cx="12" cy="8" r="4"/><path d="M4.5 20.5c0-4 3.4-6.5 7.5-6.5s7.5 2.5 7.5 6.5"/>'),
  mail: svg('<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M4 7.5l8 5.5 8-5.5"/>'),
  lock: svg('<rect x="5" y="11" width="14" height="10" rx="3"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/><circle cx="12" cy="16" r=".8" fill="currentColor"/>'),
  eyeOff: svg('<path d="M3 3l18 18"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/><path d="M10.6 6.1A9.6 9.6 0 0 1 12 6c5 0 8.5 4 9.5 6-.4.8-1.2 2-2.5 3.2M6.6 7.6C4.6 9 3.3 10.9 2.5 12c1 2 4.5 6 9.5 6 1.3 0 2.5-.3 3.6-.7"/>'),
  eye: svg('<path d="M2.5 12C3.5 10 7 6 12 6s8.5 4 9.5 6c-1 2-4.5 6-9.5 6s-8.5-4-9.5-6z"/><circle cx="12" cy="12" r="3"/>'),
  bell: svg('<path d="M6 9a6 6 0 0 1 12 0c0 6 2.5 7.5 2.5 7.5h-17S6 15 6 9"/><path d="M10 20a2 2 0 0 0 4 0"/>', 24),
};

/**
 * Satu kolom isian dengan ikon di kiri.
 * @param {string} icon kunci ikon @param {string} attrs atribut <input>
 * @param {boolean} [eye] true = tambahkan tombol mata (untuk password)
 */
const field = (icon, attrs, eye) =>
  '<div class="auth-field"><span class="ico">' + ICON[icon] + '</span><input ' + attrs + '>' +
  (eye
    ? '<button type="button" class="auth-eye" data-act="pw" aria-pressed="false" aria-label="Tampilkan password"><span class="off">' + ICON.eyeOff + '</span><span class="on">' + ICON.eye + '</span></button>'
    : '') + '</div>';

/** Isi form MASUK: email, password, lupa password, tombol Masuk, tautan ke Daftar. */
const loginBody = () =>
  '<form class="auth-form" data-form="login" novalidate>' +
  field('mail', 'id="em" type="email" autocomplete="email" inputmode="email" placeholder="Email address"') +
  field('lock', 'id="pw" type="password" autocomplete="current-password" enterkeyhint="go" placeholder="Password"', true) +
  '<div class="auth-links auth-forgot"><button type="button" data-act="forgot">Forgot password?</button></div>' +
  '<button class="auth-btn" type="submit">Masuk</button>' +
  '<div class="auth-links">I don’t have an account<button type="button" data-act="to-signup">Daftar</button></div></form>';

/** Isi form DAFTAR: nama, email, password baru, tombol Daftar, tautan ke Masuk. */
const signupBody = () =>
  '<form class="auth-form" data-form="signup" novalidate>' +
  field('user', 'id="nm" autocomplete="name" autocapitalize="words" maxlength="60" placeholder="Your name"') +
  field('mail', 'id="em" type="email" autocomplete="email" inputmode="email" placeholder="Email address"') +
  field('lock', 'id="pw" type="password" autocomplete="new-password" minlength="6" placeholder="New password"', true) +
  '<button class="auth-btn" type="submit">Daftar</button>' +
  '<div class="auth-links end">I have an account<button type="button" data-act="to-login">Masuk</button></div></form>';

/** Isi form LUPA PASSWORD: email -> kirim link reset. */
const forgotBody = () =>
  '<form class="auth-form" data-form="reset" novalidate>' +
  '<p class="auth-hint">Masukkan email akunmu. Kami kirim link ke email itu untuk membuat password baru.</p>' +
  field('mail', 'id="em" type="email" autocomplete="email" inputmode="email" placeholder="Email address"') +
  '<button class="auth-btn" type="submit">Kirim link</button>' +
  '<div class="auth-links">Ingat password?<button type="button" data-act="to-login">Masuk</button></div></form>';

/** Isi form PASSWORD BARU (setelah link di email diketuk): password + konfirmasi. */
const newPasswordBody = () =>
  '<form class="auth-form" data-form="newpass" novalidate>' +
  '<p class="auth-hint">Buat password baru untuk akunmu.</p>' +
  field('lock', 'id="pw" type="password" autocomplete="new-password" minlength="6" placeholder="New password"', true) +
  field('lock', 'id="pw2" type="password" autocomplete="new-password" minlength="6" placeholder="Confirm password"', true) +
  '<button class="auth-btn" type="submit">Simpan password</button></form>';

/** Pilih isi form sesuai mode. @param {string} mode */
const bodyFor = (mode) =>
  ({ signup: signupBody, forgot: forgotBody, newpass: newPasswordBody }[mode] || loginBody)();

/** Langkah singkat cara pakai: [judul, penjelasan]. */
const STEPS = [
  ['Buat sesi', 'Jastip masuk, lalu membuat sesi titipan baru.'],
  ['Bagikan link', 'Kirim link sesi ke teman lewat WhatsApp.'],
  ['Teman mengisi', 'Nama, menu, dan level pedas. Tanpa perlu akun.'],
  ['Rekap otomatis', 'Harga, pajak, dan fee terhitung. Teman bayar dan kirim bukti.'],
];

/** Kartu "Cara kerjanya". Di HP tampil di bawah form; di laptop jadi bagian panel kiri. */
const infoHTML = () =>
  '<section class="auth-info" aria-labelledby="auth-info-t"><h2 id="auth-info-t">Cara kerjanya</h2><ol class="auth-steps">' +
  STEPS.map((s, i) =>
    '<li><span class="auth-n" aria-hidden="true">' + (i + 1) + '</span><span class="auth-st"><b>' + s[0] + '</b>' + s[1] + '</span></li>').join('') +
  '</ol><p class="auth-note">Halaman masuk ini khusus jastip. Kalau kamu penitip, cukup buka link dari jastip, tidak perlu daftar.</p></section>';

/** Teks sambutan besar. Hanya tampil di layar lebar (laptop). */
const heroHTML = () =>
  '<div class="auth-hero"><h1>Titip pesanan, rekap otomatis.</h1>' +
  '<p>Kumpulkan titipan teman lewat satu link, hitung total beserta pajaknya, lalu terima bukti transfer di satu tempat.</p></div>';

/** Footer: hak cipta, versi, tautan "Yang baru", dan catatan bahwa ini bukan aplikasi resmi. */
const footerHTML = () =>
  '<footer class="auth-foot"><div class="auth-foot-in">' +
  '<span class="auth-copy">&copy; ' + new Date().getFullYear() + ' Titip Gacoan' + (VERSI ? ' &middot; v' + VERSI : '') +
  '<button type="button" class="auth-foot-link" data-act="cl">Yang baru</button></span>' +
  '<span class="auth-disc">Bukan aplikasi resmi Mie Gacoan. Logo dan merek milik pemiliknya masing-masing.</span>' +
  '</div></footer>';

/**
 * Layar lengkap. Susunan: panel samping (pita + sambutan + info) | form | footer.
 * Di HP semuanya berurutan ke bawah; di laptop jadi dua kolom (lihat auth.css).
 * @param {'login'|'signup'|'forgot'|'newpass'} mode
 */
export const authScreenHTML = (mode) =>
  '<section class="auth">' +
  '<aside class="auth-side">' +
  '<div class="auth-head"><div class="auth-in"><div class="auth-sakan"><img src="img/sakan.png" alt="Sakan Al-Kalim at-Tayyib"></div></div></div>' +
  heroHTML() + infoHTML() +
  '</aside>' +
  '<div class="auth-main"><div class="auth-in">' +
  '<div class="auth-brand"><img src="img/me-gacoan.png" alt="Me Gacoan">' +
  '<button type="button" class="auth-bell" data-act="cl" aria-label="Lihat yang baru">' + ICON.bell + '<span class="auth-dot" id="auth-dot" hidden></span></button></div>' +
  bodyFor(mode) +
  '</div></div>' +
  footerHTML() +
  '</section>';
