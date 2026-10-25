/**
 * js/components/auth-forms.js
 * Layar MASUK dan DAFTAR (desain baru). Hanya membuat HTML.
 * Dua mode memakai kerangka yang sama (pita atas, logo, lonceng) dan hanya
 * beda isi form.
 */

import { esc } from '../core/dom.js';
import { CHANGELOG } from '../data/changelog-data.js';

/** Nomor versi terbaru dari catatan perubahan (untuk footer). */
const VERSI = (CHANGELOG.slice().sort((a, b) => b.id - a.id)[0] || {}).v || '';

/* Ikon-ikon inline (ikut warna teks lewat currentColor). */
const svg = (body, size = 20, sw = 1.8) =>
  '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + sw + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + body + '</svg>';
const ICON = {
  user: svg('<circle cx="12" cy="8" r="4"/><path d="M4.5 20.5c0-4 3.4-6.5 7.5-6.5s7.5 2.5 7.5 6.5"/>'),
  mail: svg('<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M4 7.5l8 5.5 8-5.5"/>'),
  key: svg('<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M16 7l3 3M14 9l3 3"/>'),
  lock: svg('<rect x="5" y="11" width="14" height="10" rx="3"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/><circle cx="12" cy="16" r=".8" fill="currentColor"/>'),
  eyeOff: svg('<path d="M3 3l18 18"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/><path d="M10.6 6.1A9.6 9.6 0 0 1 12 6c5 0 8.5 4 9.5 6-.4.8-1.2 2-2.5 3.2M6.6 7.6C4.6 9 3.3 10.9 2.5 12c1 2 4.5 6 9.5 6 1.3 0 2.5-.3 3.6-.7"/>'),
  eye: svg('<path d="M2.5 12C3.5 10 7 6 12 6s8.5 4 9.5 6c-1 2-4.5 6-9.5 6s-8.5-4-9.5-6z"/><circle cx="12" cy="12" r="3"/>'),
  down: svg('<path d="M5 9l7 7 7-7"/>', 34, 2.6),
  up: svg('<path d="M5 15l7-7 7 7"/>', 34, 2.6),
  shop: svg('<path d="M4 9l1.6-5h12.8L20 9"/><path d="M4 9a2.67 2.67 0 0 0 5.33 0 2.67 2.67 0 0 0 5.34 0A2.67 2.67 0 0 0 20 9"/><path d="M5.5 12v8h13v-8"/><path d="M10 20v-4h4v4"/>', 22, 2),
  who: svg('<circle cx="12" cy="8" r="4"/><path d="M4.5 20.5c0-4 3.4-6.5 7.5-6.5s7.5 2.5 7.5 6.5"/>', 22, 2),
  link: svg('<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>'),
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
  '<p class="auth-hint">Masukkan email akunmu. Kami kirim kode verifikasi ke email itu untuk membuat password baru.</p>' +
  field('mail', 'id="em" type="email" autocomplete="email" inputmode="email" placeholder="Email address"') +
  '<button class="auth-btn" type="submit">Kirim kode</button>' +
  '<div class="auth-links">Ingat password?<button type="button" data-act="to-login">Masuk</button></div></form>';

/** Isi form KODE (OTP): angka dari email -> verifikasi. @param {{email?:string}} ctx */
const otpBody = (ctx) =>
  '<form class="auth-form" data-form="otp" novalidate>' +
  '<p class="auth-hint">Kode verifikasi dikirim ke <b>' + esc(ctx.email || 'emailmu') + '</b>. Masukkan kodenya di bawah. Cek folder Spam kalau belum masuk.</p>' +
  field('key', 'id="otp" class="auth-otp" inputmode="numeric" pattern="[0-9]*" autocomplete="one-time-code" enterkeyhint="go" maxlength="10" placeholder="Kode"') +
  '<button class="auth-btn" type="submit">Verifikasi</button>' +
  '<div class="auth-links">Belum menerima kode?<button type="button" data-act="resend">Kirim ulang</button></div>' +
  '<div class="auth-links">Salah email?<button type="button" data-act="forgot">Ganti</button></div></form>';

/** Isi form PASSWORD BARU (setelah link di email diketuk): password + konfirmasi. */
const newPasswordBody = () =>
  '<form class="auth-form" data-form="newpass" novalidate>' +
  '<p class="auth-hint">Buat password baru untuk akunmu.</p>' +
  field('lock', 'id="pw" type="password" autocomplete="new-password" minlength="6" placeholder="New password"', true) +
  field('lock', 'id="pw2" type="password" autocomplete="new-password" minlength="6" placeholder="Confirm password"', true) +
  '<button class="auth-btn" type="submit">Simpan password</button></form>';

/**
 * Isi halaman JASTIPER (penitip): tempel link / kode sesi dari jastip lalu buka.
 * @param {{last?:{k:string,j?:string}}} ctx last = sesi yang terakhir dibuka di perangkat ini
 */
const joinBody = (ctx) =>
  '<form class="auth-form" data-form="join" novalidate>' +
  '<h2 class="auth-title">Mau titip pesanan?</h2>' +
  '<p class="auth-hint">Tempel link atau kode sesi dari jastip. Tidak perlu daftar atau masuk.</p>' +
  field('link', 'id="kd" autocomplete="off" autocapitalize="none" autocorrect="off" spellcheck="false" enterkeyhint="go" placeholder="Link atau kode sesi"') +
  '<button class="auth-btn" type="submit">Buka daftar titipan</button>' +
  (ctx.last
    ? '<button type="button" class="auth-last" data-act="last" data-k="' + esc(ctx.last.k) + '"><span>Buka lagi sesi terakhir</span><b>' + esc(ctx.last.j || ctx.last.k) + '</b></button>'
    : '') +
  '</form>';

/** Pilih isi form sesuai mode. @param {string} mode */
const bodyFor = (mode, ctx) =>
  ({ signup: signupBody, forgot: forgotBody, otp: otpBody, newpass: newPasswordBody }[mode] || loginBody)(ctx);

/** Langkah singkat untuk JASTIP (admin): [judul, penjelasan]. */
const STEPS_JASTIP = [
  ['Buat sesi', 'Jastip masuk, lalu membuat sesi titipan baru.'],
  ['Bagikan link', 'Kirim link sesi ke teman lewat WhatsApp.'],
  ['Teman mengisi', 'Nama, menu, dan level pedas. Tanpa perlu akun.'],
  ['Rekap otomatis', 'Harga, pajak, dan fee terhitung. Teman bayar dan kirim bukti.'],
];

/** Langkah singkat untuk JASTIPER (penitip). */
const STEPS_JASTIPER = [
  ['Buka link', 'Minta link sesi ke jastip, lalu tempel di atas atau ketuk linknya.'],
  ['Isi titipan', 'Nama, menu, dan level pedas. Tanpa akun.'],
  ['Tunggu rekap', 'Setelah daftar ditutup dan belanja selesai, total muncul.'],
  ['Transfer', 'Bayar sesuai total, lalu unggah foto bukti.'],
];

/** Tautan kecil untuk pindah halaman geser. */
const goto = (p, teks) => '<button type="button" class="auth-goto" data-act="pane" data-p="' + p + '">' + teks + '</button>';

/**
 * Kartu "Cara kerjanya". Di HP tampil di bawah form; di laptop jadi bagian panel kiri.
 * @param {'jastip'|'jastiper'} untuk @param {string} [kelas] kelas tambahan
 */
const infoHTML = (untuk, kelas = '') => {
  const jastip = untuk === 'jastip';
  return (
    '<section class="auth-info info-' + untuk + ' ' + kelas + '" aria-label="' + (jastip ? 'Cara kerja untuk jastip' : 'Cara menitip') + '">' +
    '<h2>' + (jastip ? 'Cara kerjanya' : 'Cara menitip') + '</h2><ol class="auth-steps">' +
    (jastip ? STEPS_JASTIP : STEPS_JASTIPER).map((s, i) =>
      '<li><span class="auth-n" aria-hidden="true">' + (i + 1) + '</span><span class="auth-st"><b>' + s[0] + '</b>' + s[1] + '</span></li>').join('') +
    '</ol><p class="auth-note">' +
    (jastip
      ? 'Halaman ini untuk jastip. Kalau kamu penitip, buka link dari jastip atau ' + goto('jastiper', 'Masuk sebagai Jastiper') + '.'
      : 'Kamu yang membuka jastip dan mengelola sesi? ' + goto('jastip', 'Masuk sebagai Jastip') + '.') +
    '</p></section>'
  );
};

/** Sambutan: judul (HP: di halaman kedua) + logo dan paragraf (hanya laptop). */
const heroHTML = () =>
  '<div class="auth-hero"><div class="auth-hero-logo"><img src="img/sakan.png" alt="Sakan Al-Kalim at-Tayyib"></div>' +
  '<h1>Titip pesanan, rekap otomatis.</h1>' +
  '<p>Kumpulkan titipan teman lewat satu link, hitung total beserta pajaknya, lalu terima bukti transfer di satu tempat.</p></div>';

/** Footer: hak cipta, versi, dan catatan bahwa ini bukan aplikasi resmi. @param {string} [kelas] */
const footerHTML = (kelas = '') =>
  '<footer class="auth-foot ' + kelas + '"><div class="auth-foot-in">' +
  '<span class="auth-copy">&copy; ' + new Date().getFullYear() + ' Titip Gacoan' + (VERSI ? ' &middot; v' + VERSI : '') + '</span>' +
  '<span class="auth-disc">Bukan aplikasi resmi Mie Gacoan. Logo dan merek milik pemiliknya masing-masing.</span>' +
  '</div></footer>';

/**
 * Pita cyan + logo Sakan + switch ikon (tanpa teks) untuk pindah Jastip / Jastiper.
 * Switch ini hanya tampil di HP/tablet; di laptop dipakai tautan teks di panel kiri.
 * @param {'jastip'|'jastiper'} aktif halaman yang sedang tampil
 */
const headHTML = (aktif) =>
  '<div class="auth-head"><div class="auth-in"><div class="auth-sakan"><img src="img/sakan.png" alt="Sakan Al-Kalim at-Tayyib"></div>' +
  '<div class="auth-switch" role="tablist" aria-label="Pilih halaman">' +
  '<button type="button" role="tab" class="sw sw-jastip" data-act="pane" data-p="jastip" aria-label="Jastip, untuk pengelola" title="Jastip" aria-selected="' + (aktif === 'jastip') + '">' + ICON.shop + '</button>' +
  '<button type="button" role="tab" class="sw sw-jastiper" data-act="pane" data-p="jastiper" aria-label="Jastiper, untuk penitip" title="Jastiper" aria-selected="' + (aktif === 'jastiper') + '">' + ICON.who + '</button>' +
  '</div></div></div>';

/** Logo Me Gacoan + lonceng pembaruan. */
const brandHTML = () =>
  '<div class="auth-brand"><img src="img/me-gacoan.png" alt="Me Gacoan">' +
  '<button type="button" class="auth-bell" data-act="cl" aria-label="Lihat yang baru">' + ICON.bell + '<span class="auth-dot" hidden></span></button></div>';

/**
 * Layar lengkap = DUA halaman yang bertukar dengan efek scale: Jastip | Jastiper.
 * Masing-masing halaman punya dua "layar" yang digulir tegak (snap):
 *   p1 = pita + logo + form (Jastip: masuk/daftar, Jastiper: tempel link sesi) — bagian bawahnya kosong, hanya panah V
 *   p2 = sambutan + cara kerja/cara menitip + footer
 * Laptop (>=900px): panel kiri berisi sambutan + cara kerja, kanan berisi halaman aktif.
 * Pindah halaman: ikon di pita atas (HP/tablet) atau tautan teks "Masuk sebagai ..." (semua ukuran).
 * @param {'login'|'signup'|'forgot'|'otp'|'newpass'} mode  mode form Jastip
 * @param {{email?:string, pane?:'jastip'|'jastiper', last?:{k:string,j?:string}}} [ctx]
 */
export const authScreenHTML = (mode, ctx = {}) => {
  const aktif = ctx.pane === 'jastip' ? 'jastip' : 'jastiper';
  /** Satu halaman: layar 1 (isi utama) + layar 2 (sambutan, info, footer). */
  const pane = (nama, isi, info, ke) =>
    '<div class="auth-pane pane-' + nama + '" role="tabpanel"><div class="auth-scroll">' +
    '<div class="auth-pg auth-p1">' + headHTML(aktif) + '<div class="auth-main"><div class="auth-in">' + brandHTML() + isi + '<div class="auth-swap">' + goto(ke, ke === 'jastip' ? 'Masuk sebagai Jastip' : 'Masuk sebagai Jastiper') + '</div></div></div></div>' +
    '<div class="auth-pg auth-p2"><div class="auth-side">' + heroHTML() + info + '</div>' + footerHTML('foot-m') + '</div>' +
    '</div></div>';
  return (
    '<section class="auth" data-pane="' + aktif + '" data-page="1">' +
    '<div class="auth-ptr" aria-hidden="true"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 4v5h-5"/></svg></div>' +
    '<div class="auth-right"><div class="auth-deck">' +
    pane('jastip', bodyFor(mode, ctx), infoHTML('jastip'), 'jastiper') +
    pane('jastiper', joinBody(ctx), infoHTML('jastiper'), 'jastip') +
    '</div></div>' +
    /* --- hanya laptop: panel kiri + footer --- */
    '<aside class="auth-aside">' + heroHTML() + infoHTML('jastip') + infoHTML('jastiper') + '</aside>' +
    footerHTML('foot-d') +
    '<button type="button" class="auth-nav auth-next" data-act="down" aria-label="Lihat cara kerja">' + ICON.down + '</button>' +
    '<button type="button" class="auth-nav auth-prev" data-act="up" aria-label="Kembali ke atas">' + ICON.up + '</button>' +
    '</section>'
  );
};
